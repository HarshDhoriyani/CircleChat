import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { SOCKET_EVENTS } from '../config/constants.js';
import { logger } from '../utils/logger.js';

export const handleChatEvents = (io, socket) => {
  const userId = socket.userId;
  const user = socket.user;

  /**
   * Client joins a conversation room: 'conv:<conversationId>'
   */
  socket.on(SOCKET_EVENTS.JOIN_CONVERSATION, async ({ conversationId }) => {
    if (!conversationId) return;

    try {
      // Verify user is a participant of this conversation
      const conv = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
      });

      if (!conv) {
        return socket.emit(SOCKET_EVENTS.ERROR, {
          message: 'Unauthorized: You are not a participant in this conversation',
        });
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
    if (!conversationId || !message) return;

    try {
      const conv = await Conversation.findById(conversationId).select('participants');
      const targetRooms = [`conv:${conversationId}`];

      if (conv?.participants) {
        conv.participants.forEach((pId) => {
          if (pId.toString() !== userId.toString()) {
            targetRooms.push(`user:${pId}`);
          }
        });
      }

      // Broadcast to room union (deduplicated by Socket.io)
      socket.to(targetRooms).emit(SOCKET_EVENTS.RECEIVE_MESSAGE, {
        conversationId,
        message,
      });
    } catch {
      // Fallback direct emit to conversation room
      socket.to(`conv:${conversationId}`).emit(SOCKET_EVENTS.RECEIVE_MESSAGE, {
        conversationId,
        message,
      });
    }
  });

  /**
   * Typing Indicators: start & stop
   */
  socket.on(SOCKET_EVENTS.TYPING_START, ({ conversationId }) => {
    if (!conversationId) return;
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

  socket.on(SOCKET_EVENTS.TYPING_STOP, ({ conversationId }) => {
    if (!conversationId) return;
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
  socket.on(SOCKET_EVENTS.MARK_AS_READ, ({ conversationId, messageId }) => {
    if (!conversationId) return;
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
  socket.on(SOCKET_EVENTS.MESSAGE_EDITED, ({ conversationId, message }) => {
    if (!conversationId || !message) return;
    socket.to(`conv:${conversationId}`).emit(SOCKET_EVENTS.MESSAGE_EDITED, {
      conversationId,
      message,
    });
  });

  socket.on(SOCKET_EVENTS.MESSAGE_DELETED, ({ conversationId, messageId, deleteType, message }) => {
    if (!conversationId || !messageId) return;
    socket.to(`conv:${conversationId}`).emit(SOCKET_EVENTS.MESSAGE_DELETED, {
      conversationId,
      messageId,
      deleteType,
      message,
    });
  });
};

export default handleChatEvents;
