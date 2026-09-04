import { Router } from 'express';
import * as conversationController from '../controllers/conversationController.js';
import * as messageController from '../controllers/messageController.js';
import * as aiController from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';
import { aiLimiter } from '../middleware/rateLimitMiddleware.js';

const router = Router();

router.use(protect); // Protect all conversation endpoints

// Conversations Root
router.get('/', conversationController.getConversations);
router.post('/direct', conversationController.createDirectConversation);
router.post('/group', conversationController.createGroupConversation);

// Group Management
router.patch('/group/:id', conversationController.updateGroup);
router.post('/group/:id/members', conversationController.addGroupMembers);
router.delete('/group/:id/members/:memberId', conversationController.removeGroupMember);
router.post('/group/:id/leave', conversationController.leaveGroup);

// Single Conversation Details
router.get('/:id', conversationController.getConversationById);

// Nested Messages & AI endpoints for a conversation
router.get('/:id/messages', messageController.getMessages);
router.post('/:id/messages', messageController.sendMessage);
router.patch('/:id/messages/:messageId', messageController.editMessage);
router.delete('/:id/messages/:messageId', messageController.deleteMessage);
router.get('/:id/messages/:messageId/info', messageController.getMessageInfo);
router.post('/:id/read', messageController.markAsRead);
router.post('/:id/summary', aiLimiter, aiController.catchMeUp);

export default router;
