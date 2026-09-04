import { chatService } from '../services/chatService.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getIO } from '../sockets/socketManager.js';
import { SOCKET_EVENTS } from '../config/constants.js';

export const getConversations = asyncHandler(async (req, res) => {
  const conversations = await chatService.getUserConversations(req.user._id);
  return ApiResponse.success(res, { conversations }, 'User conversations retrieved');
});

export const getConversationById = asyncHandler(async (req, res) => {
  const conversation = await chatService.getConversationById(req.params.id, req.user._id);
  return ApiResponse.success(res, { conversation }, 'Conversation details retrieved');
});

export const createDirectConversation = asyncHandler(async (req, res) => {
  const { recipientId } = req.body;

  if (!recipientId) {
    throw ApiError.badRequest('Please provide a recipientId for direct conversation');
  }

  const conversation = await chatService.getOrCreateDirectConversation(req.user._id, recipientId);
  return ApiResponse.success(res, { conversation }, 'Direct conversation ready');
});

export const createGroupConversation = asyncHandler(async (req, res) => {
  const { name, description, avatar, memberIds } = req.body;

  const conversation = await chatService.createGroupConversation({
    creatorId: req.user._id,
    name,
    description,
    avatar,
    memberIds: Array.isArray(memberIds) ? memberIds : [],
  });

  try {
    const io = getIO();
    const participantIds = conversation.participants || [];
    participantIds.forEach((p) => {
      const pId = (p._id || p).toString();
      if (pId !== req.user._id.toString()) {
        io.to(`user:${pId}`).emit(SOCKET_EVENTS.CONVERSATION_UPDATED, {
          conversationId: conversation._id,
          conversation,
        });
      }
    });
  } catch {}

  return ApiResponse.created(res, { conversation }, 'Group conversation created successfully');
});

export const updateGroup = asyncHandler(async (req, res) => {
  const { name, description, avatar } = req.body;
  const conversation = await chatService.updateGroupDetails(req.params.id, req.user._id, {
    name,
    description,
    avatar,
  });

  try {
    const io = getIO();
    const targetRooms = [`conv:${req.params.id}`];
    (conversation.participants || []).forEach((p) => {
      const pId = (p._id || p).toString();
      targetRooms.push(`user:${pId}`);
    });
    io.to(targetRooms).emit(SOCKET_EVENTS.CONVERSATION_UPDATED, {
      conversationId: req.params.id,
      conversation,
    });
  } catch {}

  return ApiResponse.success(res, { conversation }, 'Group details updated successfully');
});

export const addGroupMembers = asyncHandler(async (req, res) => {
  const { memberIds } = req.body;

  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    throw ApiError.badRequest('Please provide an array of memberIds to add');
  }

  const conversation = await chatService.addGroupMembers(req.params.id, req.user._id, memberIds);

  try {
    const io = getIO();
    io.to(`conv:${req.params.id}`).emit(SOCKET_EVENTS.GROUP_MEMBER_ADDED, {
      conversationId: req.params.id,
      memberIds,
      conversation,
    });
    memberIds.forEach((mId) => {
      io.to(`user:${mId}`).emit(SOCKET_EVENTS.GROUP_MEMBER_ADDED, {
        conversationId: req.params.id,
        conversation,
      });
    });
  } catch {}

  return ApiResponse.success(res, { conversation }, 'Members added to group successfully');
});

export const removeGroupMember = asyncHandler(async (req, res) => {
  const { memberId } = req.params;
  const result = await chatService.removeGroupMember(req.params.id, req.user._id, memberId);

  try {
    const io = getIO();
    io.to(`conv:${req.params.id}`).emit(SOCKET_EVENTS.GROUP_MEMBER_REMOVED, {
      conversationId: req.params.id,
      memberId,
      conversation: result?.conversation || result,
    });
    io.to(`user:${memberId}`).emit(SOCKET_EVENTS.GROUP_MEMBER_REMOVED, {
      conversationId: req.params.id,
      memberId,
    });
  } catch {}

  return ApiResponse.success(res, { conversation: result }, 'Member removed from group successfully');
});

export const leaveGroup = asyncHandler(async (req, res) => {
  const result = await chatService.leaveGroup(req.params.id, req.user._id);

  try {
    const io = getIO();
    io.to(`conv:${req.params.id}`).emit(SOCKET_EVENTS.GROUP_MEMBER_REMOVED, {
      conversationId: req.params.id,
      memberId: req.user._id,
      conversation: result?.conversation,
    });
    io.to(`user:${req.user._id}`).emit(SOCKET_EVENTS.GROUP_MEMBER_REMOVED, {
      conversationId: req.params.id,
      memberId: req.user._id,
    });
  } catch {}

  return ApiResponse.success(res, result, 'You have left the group successfully');
});
