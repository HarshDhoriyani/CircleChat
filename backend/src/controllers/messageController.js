import { chatService } from '../services/chatService.js';
import { Conversation } from '../models/Conversation.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getIO } from '../sockets/socketManager.js';
import { SOCKET_EVENTS } from '../config/constants.js';

export const getConversationMessages = asyncHandler(async (req, res) => {
  const { id: conversationId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const result = await chatService.getConversationMessages(conversationId, req.user._id, {
    page,
    limit,
  });

  return ApiResponse.success(res, result, 'Messages retrieved successfully');
});

export const getMessages = getConversationMessages;

export const sendMessage = asyncHandler(async (req, res) => {
  const { id: conversationId } = req.params;
  const { text, attachments, tempId } = req.body;

  if (!text?.trim() && (!attachments || attachments.length === 0)) {
    throw ApiError.badRequest('Message cannot be empty. Please provide text or an attachment.');
  }

  const message = await chatService.sendMessage({
    conversationId,
    senderId: req.user._id,
    text,
    attachments: Array.isArray(attachments) ? attachments : [],
  });

  // Real-time broadcast to conversation room & participant rooms (deduplicated by Socket.io)
  try {
    const io = getIO();
    const conv = await Conversation.findById(conversationId)
      .populate('participants', 'name username email avatar status customStatus lastSeen')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name username email avatar' },
      });

    const targetRooms = [`conv:${conversationId}`];
    if (conv?.participants) {
      conv.participants.forEach((p) => {
        const pId = p._id ? p._id.toString() : p.toString();
        targetRooms.push(`user:${pId}`);
      });
    }

    io.to(targetRooms).emit(SOCKET_EVENTS.RECEIVE_MESSAGE, {
      conversationId,
      message,
      conversation: conv,
    });
  } catch (err) {
    // Socket broadcast fallback
  }

  return ApiResponse.created(
    res,
    { message, tempId },
    'Message sent successfully'
  );
});

export const editMessage = asyncHandler(async (req, res) => {
  const { id: conversationId, messageId } = req.params;
  const { text } = req.body;

  const message = await chatService.editMessage(conversationId, messageId, req.user._id, text);

  // Broadcast edited message to conversation room & each participant's room (deduplicated)
  try {
    const io = getIO();
    const conv = await Conversation.findById(conversationId).select('participants');

    const targetRooms = [`conv:${conversationId}`];
    if (conv?.participants) {
      conv.participants.forEach((p) => {
        const pId = p._id ? p._id.toString() : p.toString();
        targetRooms.push(`user:${pId}`);
      });
    }

    io.to(targetRooms).emit(SOCKET_EVENTS.MESSAGE_EDITED, {
      conversationId,
      message,
    });
  } catch {
    // Socket broadcast fallback
  }

  return ApiResponse.success(res, { message }, 'Message edited successfully');
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const { id: conversationId, messageId } = req.params;
  const deleteType = req.query.type || req.body.type || 'me';

  const result = await chatService.deleteMessage(conversationId, messageId, req.user._id, deleteType);

  if (deleteType === 'everyone') {
    // Broadcast delete for everyone to all room participants and user rooms (deduplicated)
    try {
      const io = getIO();
      const conv = await Conversation.findById(conversationId).select('participants');

      const targetRooms = [`conv:${conversationId}`];
      if (conv?.participants) {
        conv.participants.forEach((p) => {
          const pId = p._id ? p._id.toString() : p.toString();
          targetRooms.push(`user:${pId}`);
        });
      }

      io.to(targetRooms).emit(SOCKET_EVENTS.MESSAGE_DELETED, {
        conversationId,
        messageId,
        deleteType: 'everyone',
        message: result.message,
      });
    } catch {
      // Socket broadcast fallback
    }
  } else {
    // Broadcast delete for me to the user's personal room across tabs/devices
    try {
      const io = getIO();
      io.to(`user:${req.user._id.toString()}`).emit(SOCKET_EVENTS.MESSAGE_DELETED, {
        conversationId,
        messageId,
        deleteType: 'me',
      });
    } catch {
      // Socket broadcast fallback
    }
  }

  return ApiResponse.success(res, result, `Message deleted ${deleteType === 'everyone' ? 'for everyone' : 'for you'}`);
});

export const getMessageInfo = asyncHandler(async (req, res) => {
  const { id: conversationId, messageId } = req.params;

  const info = await chatService.getMessageInfo(conversationId, messageId, req.user._id);

  return ApiResponse.success(res, info, 'Message delivery and read receipts retrieved');
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { id: conversationId } = req.params;

  const result = await chatService.markConversationAsRead(conversationId, req.user._id);

  // Broadcast read receipt update to conversation room & participant rooms
  try {
    const io = getIO();
    const conv = await Conversation.findById(conversationId).select('participants');
    const targetRooms = [`conv:${conversationId}`];
    if (conv?.participants) {
      conv.participants.forEach((p) => {
        const pId = p._id ? p._id.toString() : p.toString();
        targetRooms.push(`user:${pId}`);
      });
    }

    io.to(targetRooms).emit(SOCKET_EVENTS.MESSAGE_READ, {
      conversationId,
      userId: req.user._id,
    });
  } catch {}

  return ApiResponse.success(res, result, 'Conversation marked as read');
});
