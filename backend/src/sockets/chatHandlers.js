import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { SOCKET_EVENTS } from '../config/constants.js';
import { logger } from '../utils/logger.js';

export const handleChatEvents = (io, socket) => {
  const userId = socket.userId;
  const user = socket.user;

  const emitUnauthorized = (conversationId) => {
    socket.emit(SOCKET_EVENTS.ERROR, {
      conversationId,
      message: 'Unauthorized: You are not a participant in this conversation',
    });
  };

  const requireMembership = async (conversationId) => {
    if (!conversationId) return null;

    try {
      return await Conversation.findOne({
        _id: conversationId,
        participants: userId,
      }).select('_id participants creator admins');
    } catch (err) {
      logger.warn(`Invalid conversationId received from socket ${socket.id}: ${err.message}`);
      return null;
    }
  };

  const isJoinedToConversation = (conversationId) =>
    socket.rooms.has(`conv:${conversationId}`);

  /**
   * Client joins a conversation room: 'conv:<conversationId>'
   */
  socket.on(SOCKET_EVENTS.JOIN_CONVERSATION, async ({ conversationId }) => {
    if (!conversationId) return;

    try {
      const conv = await requireMembership(conversationId);

      if (!conv) {
        return emitUnauthorized(conversationId);
      }

      const roomName = `conv:${conversationId}`;
      socket.join(roomName);
      logger.debug(`Socket ${socket.id} (${user.name}) joined room: ${roomName}`);
    } catch (err) {
      logger.error(`Error joining room: ${err.message}`);
    }
  });

  /**
   * Client leaves a conversation room
   */
  socket.on(SOCKET_EVENTS.LEAVE_CONVERSATION, ({ conversationId }) => {
    if (!conversationId) return;
    const roomName = `conv:${conversationId}`;
    socket.leave(roomName);
    logger.debug(`Socket ${socket.id} left room: ${roomName}`);
  });

  /**
   * Client broadcasts a sent message
   */
  socket.on(SOCKET_EVENTS.SEND_MESSAGE, async ({ conversationId, message }) => {
    const messageId = message?._id || message?.id;
    if (!conversationId || !messageId) return;

    const conv = await requireMembership(conversationId);
    if (!conv) return emitUnauthorized(conversationId);
    if (!isJoinedToConversation(conversationId)) return;

    try {
      const persistedMessage = await Message.findOne({
          _id: messageId,
          conversationId,
          sender: userId,
      }).populate('sender', 'name username email avatar status');

      if (!persistedMessage) return;

      socket.to(`conv:${conversationId}`).emit(SOCKET_EVENTS.RECEIVE_MESSAGE, {
        conversationId,
        message: persistedMessage,
      });
    } catch (err) {
      logger.warn(`Rejected socket send event: ${err.message}`);
    }
  });

  /**
   * Typing Indicators: start & stop
   */
  socket.on(SOCKET_EVENTS.TYPING_START, async ({ conversationId }) => {
    if (!conversationId) return;
    const conv = await requireMembership(conversationId);
    if (!conv) return emitUnauthorized(conversationId);
    if (!isJoinedToConversation(conversationId)) return;

    const roomName = `conv:${conversationId}`;

    socket.to(roomName).emit(SOCKET_EVENTS.USER_TYPING, {
      conversationId,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
      },
    });
  });

  socket.on(SOCKET_EVENTS.TYPING_STOP, async ({ conversationId }) => {
    if (!conversationId) return;
    const conv = await requireMembership(conversationId);
    if (!conv) return emitUnauthorized(conversationId);
    if (!isJoinedToConversation(conversationId)) return;

    const roomName = `conv:${conversationId}`;

    socket.to(roomName).emit(SOCKET_EVENTS.USER_STOP_TYPING, {
      conversationId,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
      },
    });
  });

  /**
   * Read Receipts
   */
  socket.on(SOCKET_EVENTS.MARK_AS_READ, async ({ conversationId, messageId }) => {
    if (!conversationId) return;
    const conv = await requireMembership(conversationId);
    if (!conv) return emitUnauthorized(conversationId);
    if (!isJoinedToConversation(conversationId)) return;

    if (messageId) {
      const messageExists = await Message.exists({
        _id: messageId,
        conversationId,
      });
      if (!messageExists) return;
    }

    const roomName = `conv:${conversationId}`;

    socket.to(roomName).emit(SOCKET_EVENTS.MESSAGE_READ, {
      conversationId,
      messageId,
      userId,
    });
  });

  /**
   * Message Edited & Deleted broadcasts
   */
  socket.on(SOCKET_EVENTS.MESSAGE_EDITED, async ({ conversationId, message }) => {
    const messageId = message?._id || message?.id;
    if (!conversationId || !messageId) return;

    const conv = await requireMembership(conversationId);
    if (!conv) return emitUnauthorized(conversationId);
    if (!isJoinedToConversation(conversationId)) return;

    try {
      const persistedMessage = await Message.findOne({
      _id: messageId,
      conversationId,
      sender: userId,
      }).populate('sender', 'name username email avatar status');

      if (!persistedMessage) return;

      socket.to(`conv:${conversationId}`).emit(SOCKET_EVENTS.MESSAGE_EDITED, {
        conversationId,
        message: persistedMessage,
      });
    } catch (err) {
      logger.warn(`Rejected socket edit event: ${err.message}`);
    }
  });

  socket.on(SOCKET_EVENTS.MESSAGE_DELETED, async ({ conversationId, messageId, deleteType }) => {
    if (!conversationId || !messageId) return;

    const conv = await requireMembership(conversationId);
    if (!conv) return emitUnauthorized(conversationId);
    if (!isJoinedToConversation(conversationId)) return;

    try {
      const persistedMessage = await Message.findOne({
        _id: messageId,
        conversationId,
      }).populate('sender', 'name username email avatar status');

      if (!persistedMessage) return;

      if (deleteType === 'everyone') {
        const isSender = persistedMessage.sender._id.toString() === userId.toString();
        const isAdmin =
          conv.creator?.toString() === userId.toString() ||
          conv.admins?.some((adminId) => adminId.toString() === userId.toString());

        if (!isSender && !isAdmin) return emitUnauthorized(conversationId);

        socket.to(`conv:${conversationId}`).emit(SOCKET_EVENTS.MESSAGE_DELETED, {
          conversationId,
          messageId,
          deleteType: 'everyone',
          message: persistedMessage,
        });
        return;
      }

      socket.to(`user:${userId}`).emit(SOCKET_EVENTS.MESSAGE_DELETED, {
        conversationId,
        messageId,
        deleteType: 'me',
      });
    } catch (err) {
      logger.warn(`Rejected socket delete event: ${err.message}`);
    }
  });
};

export default handleChatEvents;
