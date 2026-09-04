import mongoose from 'mongoose';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { CONVERSATION_TYPES, MESSAGE_TYPES } from '../config/constants.js';

export const chatService = {
  /**
   * Asserts that a user is a participant of a conversation
   */
  async verifyMembership(conversationId, userId) {
    const conv = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conv) {
      throw ApiError.forbidden('You are not a participant in this conversation');
    }

    return conv;
  },

  /**
   * Resolves the effective lastMessage for a specific user,
   * skipping any messages that have been deleted for that user ('delete for me').
   */
  async resolveConversationLastMessage(convObj, userId) {
    let lastMsg = convObj.lastMessage;
    if (!lastMsg) return null;

    const isDeletedForUser =
      Array.isArray(lastMsg.deletedFor) &&
      lastMsg.deletedFor.some(
        (id) => (id?._id || id)?.toString() === userId.toString()
      );

    if (isDeletedForUser) {
      const fallbackMsg = await Message.findOne({
        conversationId: convObj._id,
        deletedFor: { $ne: userId },
      })
        .populate('sender', 'name username email avatar')
        .sort({ createdAt: -1 });

      lastMsg = fallbackMsg ? fallbackMsg.toJSON() : null;
    }

    return lastMsg;
  },

  /**
   * Retrieves all conversations for a user, sorted by most recent activity
   */
  async getUserConversations(userId) {
    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate('participants', 'name username email avatar status customStatus lastSeen')
      .populate('creator', 'name username email avatar')
      .populate('admins', 'name username email avatar')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'name username email avatar',
        },
      })
      .sort({ updatedAt: -1 });

    // Format unreadCount and user-specific lastMessage for current user
    return await Promise.all(
      conversations.map(async (conv) => {
        const convObj = conv.toJSON();
        const unread = conv.unreadCounts?.get(userId.toString()) || 0;
        const lastMsg = await this.resolveConversationLastMessage(convObj, userId);

        return {
          ...convObj,
          lastMessage: lastMsg,
          unreadCount: unread,
        };
      })
    );
  },

  /**
   * Retrieves a single conversation by ID
   */
  async getConversationById(conversationId, userId) {
    const conv = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    })
      .populate('participants', 'name username email avatar status customStatus lastSeen')
      .populate('creator', 'name username email avatar')
      .populate('admins', 'name username email avatar')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'name username email avatar',
        },
      });

    if (!conv) {
      throw ApiError.notFound('Conversation not found');
    }

    const convObj = conv.toJSON();
    const unread = conv.unreadCounts?.get(userId.toString()) || 0;
    const lastMsg = await this.resolveConversationLastMessage(convObj, userId);

    return {
      ...convObj,
      lastMessage: lastMsg,
      unreadCount: unread,
    };
  },

  /**
   * Retrieves or creates a 1-to-1 direct conversation
   */
  async getOrCreateDirectConversation(userId, recipientId) {
    if (userId.toString() === recipientId.toString()) {
      throw ApiError.badRequest('Cannot start a direct conversation with yourself');
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      throw ApiError.notFound('Recipient user not found');
    }

    // Check if direct conversation already exists between these 2 users
    let conv = await Conversation.findOne({
      type: CONVERSATION_TYPES.DIRECT,
      participants: { $all: [userId, recipientId], $size: 2 },
    })
      .populate('participants', 'name username email avatar status customStatus lastSeen')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name username email avatar' },
      });

    if (!conv) {
      conv = await Conversation.create({
        type: CONVERSATION_TYPES.DIRECT,
        participants: [userId, recipientId],
        unreadCounts: new Map([[userId.toString(), 0], [recipientId.toString(), 0]]),
      });

      conv = await Conversation.findById(conv._id)
        .populate('participants', 'name username email avatar status customStatus lastSeen');
    }

    const convObj = conv.toJSON();
    const lastMsg = await this.resolveConversationLastMessage(convObj, userId);

    return {
      ...convObj,
      lastMessage: lastMsg,
      unreadCount: conv.unreadCounts?.get(userId.toString()) || 0,
    };
  },

  /**
   * Creates a new group conversation
   */
  async createGroupConversation({ creatorId, name, description, avatar, memberIds = [] }) {
    if (!name || !name.trim()) {
      throw ApiError.badRequest('Group name is required');
    }

    // Deduplicate and ensure creator is included in participants & admins
    const participantSet = new Set([creatorId.toString(), ...memberIds.map((id) => id.toString())]);
    const participantIds = Array.from(participantSet);

    if (participantIds.length < 2) {
      throw ApiError.badRequest('A group must have at least one other member besides the creator');
    }

    const unreadCountsMap = new Map();
    participantIds.forEach((id) => unreadCountsMap.set(id, 0));

    let group = await Conversation.create({
      type: CONVERSATION_TYPES.GROUP,
      name: name.trim(),
      description: description?.trim() || '',
      avatar: avatar || undefined,
      creator: creatorId,
      admins: [creatorId],
      participants: participantIds,
      unreadCounts: unreadCountsMap,
    });

    // Create system message
    const creatorUser = await User.findById(creatorId);
    const systemMsg = await Message.create({
      conversationId: group._id,
      sender: creatorId,
      text: `${creatorUser.name} created group "${name}"`,
      isSystem: true,
      readBy: [creatorId],
    });

    group.lastMessage = systemMsg._id;
    await group.save();

    return await this.getConversationById(group._id, creatorId);
  },

  /**
   * Updates group metadata
   */
  async updateGroupDetails(conversationId, userId, { name, description, avatar }) {
    const conv = await this.verifyMembership(conversationId, userId);

    if (conv.type !== CONVERSATION_TYPES.GROUP) {
      throw ApiError.badRequest('Cannot update metadata of a direct conversation');
    }

    // Verify admin privileges
    const isAdmin = conv.admins.some((a) => a.toString() === userId.toString()) || conv.creator?.toString() === userId.toString();
    if (!isAdmin) {
      throw ApiError.forbidden('Only group administrators can modify group details');
    }

    if (name) conv.name = name.trim();
    if (description !== undefined) conv.description = description.trim();
    if (avatar) conv.avatar = avatar;

    await conv.save();
    return await this.getConversationById(conversationId, userId);
  },

  /**
   * Adds new members to an existing group
   */
  async addGroupMembers(conversationId, userId, newMemberIds = []) {
    const conv = await this.verifyMembership(conversationId, userId);

    if (conv.type !== CONVERSATION_TYPES.GROUP) {
      throw ApiError.badRequest('Cannot add members to a direct conversation');
    }

    const existingSet = new Set(conv.participants.map((p) => p.toString()));
    const toAdd = newMemberIds.filter((id) => !existingSet.has(id.toString()));

    if (toAdd.length === 0) {
      return await this.getConversationById(conversationId, userId);
    }

    toAdd.forEach((id) => {
      conv.participants.push(id);
      if (!conv.unreadCounts) conv.unreadCounts = new Map();
      conv.unreadCounts.set(id.toString(), 0);
    });

    // System message
    const actingUser = await User.findById(userId);
    const addedUsers = await User.find({ _id: { $in: toAdd } });
    const addedNames = addedUsers.map((u) => u.name).join(', ');

    const systemMsg = await Message.create({
      conversationId: conv._id,
      sender: userId,
      text: `${actingUser.name} added ${addedNames} to the group`,
      isSystem: true,
      readBy: [userId],
    });

    conv.lastMessage = systemMsg._id;
    await conv.save();

    return await this.getConversationById(conversationId, userId);
  },

  /**
   * Removes a member from group (admin only or self-removal)
   */
  async removeGroupMember(conversationId, userId, memberIdToRemove) {
    const conv = await this.verifyMembership(conversationId, userId);

    if (conv.type !== CONVERSATION_TYPES.GROUP) {
      throw ApiError.badRequest('Cannot remove members from a direct conversation');
    }

    const isSelf = userId.toString() === memberIdToRemove.toString();
    const isAdmin = conv.admins.some((a) => a.toString() === userId.toString()) || conv.creator?.toString() === userId.toString();

    if (!isSelf && !isAdmin) {
      throw ApiError.forbidden('Only group administrators can remove other members');
    }

    conv.participants = conv.participants.filter((p) => p.toString() !== memberIdToRemove.toString());
    conv.admins = conv.admins.filter((a) => a.toString() !== memberIdToRemove.toString());
    if (conv.unreadCounts) conv.unreadCounts.delete(memberIdToRemove.toString());

    // If creator leaves/is removed, assign next admin or participant as creator
    if (conv.creator?.toString() === memberIdToRemove.toString()) {
      if (conv.admins.length > 0) {
        conv.creator = conv.admins[0];
      } else if (conv.participants.length > 0) {
        conv.creator = conv.participants[0];
        conv.admins.push(conv.participants[0]);
      }
    }

    const removedUser = await User.findById(memberIdToRemove);
    const actingUser = await User.findById(userId);

    const systemMsg = await Message.create({
      conversationId: conv._id,
      sender: userId,
      text: isSelf
        ? `${removedUser?.name || 'A member'} left the group`
        : `${actingUser?.name} removed ${removedUser?.name || 'a member'} from the group`,
      isSystem: true,
      readBy: [userId],
    });

    conv.lastMessage = systemMsg._id;
    await conv.save();

    const updatedConv = await Conversation.findById(conversationId)
      .populate('participants', 'name username email avatar status customStatus lastSeen')
      .populate('creator', 'name username email avatar')
      .populate('admins', 'name username email avatar')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name username email avatar' },
      });

    if (isSelf) {
      return { success: true, conversationId, conversation: updatedConv };
    }

    const convObj = updatedConv ? updatedConv.toJSON() : null;
    const unread = updatedConv?.unreadCounts?.get(userId.toString()) || 0;
    const lastMsg = convObj ? await this.resolveConversationLastMessage(convObj, userId) : null;

    return {
      ...(convObj || {}),
      lastMessage: lastMsg,
      unreadCount: unread,
    };
  },

  /**
   * Leaves a group conversation
   */
  async leaveGroup(conversationId, userId) {
    return await this.removeGroupMember(conversationId, userId, userId);
  },

  /**
   * Retrieves paginated messages for a conversation
   */
  async getConversationMessages(conversationId, userId, { page = 1, limit = 50 }) {
    await this.verifyMembership(conversationId, userId);

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const filter = {
      conversationId,
      deletedFor: { $ne: userId },
    };

    const [messagesDesc, totalCount] = await Promise.all([
      Message.find(filter)
        .populate('sender', 'name username email avatar status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit),
      Message.countDocuments(filter),
    ]);

    const messages = messagesDesc.reverse();

    return {
      messages,
      totalCount,
      page: parseInt(page, 10),
      totalPages: Math.ceil(totalCount / parsedLimit),
    };
  },

  /**
   * Persists a new message and updates conversation stats
   */
  async sendMessage({ conversationId, senderId, text, attachments = [] }) {
    const conv = await this.verifyMembership(conversationId, senderId);

    // Normalize attachment items to prevent any ObjectId cast errors
    const cleanAttachments = (Array.isArray(attachments) ? attachments : []).map((att) => ({
      _id: String(att._id || ('att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6))),
      url: String(att.url),
      name: String(att.name || 'file'),
      type: String(att.type || 'application/octet-stream'),
      size: Number(att.size) || 0,
    }));

    let messageType = MESSAGE_TYPES.TEXT;
    if (cleanAttachments.length > 0) {
      const isImg = cleanAttachments.some((att) => att.type?.startsWith('image/'));
      messageType = isImg ? MESSAGE_TYPES.IMAGE : MESSAGE_TYPES.FILE;
    }

    const now = new Date();
    const message = await Message.create({
      conversationId,
      sender: senderId,
      text: text?.trim() || '',
      attachments: cleanAttachments,
      messageType,
      readBy: [senderId],
      readReceipts: [{ user: senderId, timestamp: now }],
      deliveredReceipts: [{ user: senderId, timestamp: now }],
    });

    // Populate sender details for immediate broadcast/response
    await message.populate('sender', 'name username email avatar status');

    // Update conversation lastMessage & increment unreadCounts for all other participants
    conv.lastMessage = message._id;
    if (!conv.unreadCounts) conv.unreadCounts = new Map();

    conv.participants.forEach((pId) => {
      const idStr = pId.toString();
      if (idStr !== senderId.toString()) {
        const current = conv.unreadCounts.get(idStr) || 0;
        conv.unreadCounts.set(idStr, current + 1);
      }
    });

    await conv.save();

    return message;
  },

  /**
   * Marks all messages in a conversation as read by a user
   */
  async markConversationAsRead(conversationId, userId) {
    const conv = await this.verifyMembership(conversationId, userId);

    // Reset unread count
    if (conv.unreadCounts) {
      conv.unreadCounts.set(userId.toString(), 0);
      await conv.save();
    }

    const now = new Date();
    // Add user to readBy array and readReceipts on all unread messages
    await Message.updateMany(
      {
        conversationId,
        readBy: { $ne: userId },
      },
      {
        $addToSet: {
          readBy: userId,
          readReceipts: { user: userId, timestamp: now },
        },
      }
    );

    return { success: true };
  },

  /**
   * Edits a message sent by the user
   */
  async editMessage(conversationId, messageId, userId, newText) {
    await this.verifyMembership(conversationId, userId);

    if (!newText?.trim()) {
      throw ApiError.badRequest('Message text cannot be empty');
    }

    const message = await Message.findOne({ _id: messageId, conversationId });
    if (!message) {
      throw ApiError.notFound('Message not found');
    }

    if (message.sender.toString() !== userId.toString()) {
      throw ApiError.forbidden('You can only edit your own messages');
    }

    if (message.deletedForEveryone) {
      throw ApiError.badRequest('Cannot edit a deleted message');
    }

    message.text = newText.trim();
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    await message.populate('sender', 'name username email avatar status');
    return message;
  },

  /**
   * Deletes a message (either for user only or for everyone)
   */
  async deleteMessage(conversationId, messageId, userId, deleteType = 'me') {
    const conv = await this.verifyMembership(conversationId, userId);

    const message = await Message.findOne({ _id: messageId, conversationId });
    if (!message) {
      throw ApiError.notFound('Message not found');
    }

    if (deleteType === 'everyone') {
      const isSender = message.sender.toString() === userId.toString();
      const isAdmin =
        conv.creator?.toString() === userId.toString() ||
        conv.admins?.some((a) => (typeof a === 'object' ? a._id : a)?.toString() === userId.toString());

      if (!isSender && !isAdmin) {
        throw ApiError.forbidden('Only the message sender or group admin can delete for everyone');
      }

      message.deletedForEveryone = true;
      message.text = 'This message was deleted';
      message.attachments = [];
      await message.save();
      await message.populate('sender', 'name username email avatar status');

      return {
        messageId,
        deleteType: 'everyone',
        message,
      };
    } else {
      // Delete for Me
      if (!message.deletedFor.includes(userId)) {
        message.deletedFor.push(userId);
        await message.save();
      }

      return {
        messageId,
        deleteType: 'me',
      };
    }
  },

  /**
   * Retrieves WhatsApp-style delivery and read receipts info
   */
  async getMessageInfo(conversationId, messageId, userId) {
    const conv = await this.verifyMembership(conversationId, userId);

    const message = await Message.findOne({ _id: messageId, conversationId })
      .populate('sender', 'name username email avatar')
      .populate('readReceipts.user', 'name username email avatar')
      .populate('deliveredReceipts.user', 'name username email avatar');

    if (!message) {
      throw ApiError.notFound('Message not found');
    }

    // Get all conversation participants
    const populatedConv = await Conversation.findById(conversationId)
      .populate('participants', 'name username email avatar status customStatus lastSeen');

    const participants = populatedConv.participants || [];

    // Filter out sender from delivery/read lists for recipients breakdown
    const senderIdStr = message.sender._id?.toString() || message.sender.toString();
    const otherParticipants = participants.filter((p) => p._id.toString() !== senderIdStr);

    // Map read receipts
    const readReceiptsMap = new Map();
    (message.readReceipts || []).forEach((r) => {
      const uId = (r.user?._id || r.user)?.toString();
      if (uId) {
        readReceiptsMap.set(uId, r.timestamp);
      }
    });

    // Also include any user from readBy array
    (message.readBy || []).forEach((r) => {
      const id = (r?._id || r)?.toString();
      if (id && id !== senderIdStr && !readReceiptsMap.has(id)) {
        readReceiptsMap.set(id, message.updatedAt || message.createdAt);
      }
    });

    // Map delivered receipts
    const deliveredReceiptsMap = new Map();
    (message.deliveredReceipts || []).forEach((d) => {
      const uId = (d.user?._id || d.user)?.toString();
      if (uId) {
        deliveredReceiptsMap.set(uId, d.timestamp);
      }
    });

    const readBy = [];
    const notReadYet = [];
    const deliveredTo = [];

    otherParticipants.forEach((participant) => {
      const pId = (participant._id || participant).toString();
      const readTime = readReceiptsMap.get(pId);
      const deliveredTime = deliveredReceiptsMap.get(pId) || message.createdAt;

      if (readTime) {
        readBy.push({
          user: participant,
          readAt: readTime,
          deliveredAt: deliveredTime,
        });
      } else {
        notReadYet.push({
          user: participant,
          deliveredAt: deliveredTime,
        });
      }

      deliveredTo.push({
        user: participant,
        deliveredAt: deliveredTime,
        readAt: readTime || null,
        isRead: Boolean(readTime),
      });
    });

    return {
      message: {
        _id: message._id,
        text: message.text,
        attachments: message.attachments,
        createdAt: message.createdAt,
        isEdited: message.isEdited,
        editedAt: message.editedAt,
        sender: message.sender,
        deletedForEveryone: message.deletedForEveryone,
      },
      readBy,
      notReadYet,
      deliveredTo,
      directRecipient: otherParticipants.length > 0 ? otherParticipants[0] : null,
      totalParticipantsCount: otherParticipants.length,
      readCount: readBy.length,
      notReadCount: notReadYet.length,
      isAllRead: otherParticipants.length > 0 && readBy.length === otherParticipants.length,
      isGroup: conv.type === CONVERSATION_TYPES.GROUP,
      isDirect: conv.type === CONVERSATION_TYPES.DIRECT,
    };
  },
};

export default chatService;
