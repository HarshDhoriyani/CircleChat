import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import conversationRoutes from './conversationRoutes.js';
import uploadRoutes from './uploadRoutes.js';
import aiRoutes from './aiRoutes.js';

import { getDbStatus } from '../config/db.js';
import { User } from '../models/User.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { MAX_FILE_SIZE_BYTES } from '../config/constants.js';

const router = Router();

// Health check with DB status
router.get('/health', (req, res) => {
  const isDbOk = getDbStatus();
  res.status(isDbOk ? 200 : 503).json({
    success: isDbOk,
    status: isDbOk ? 'healthy' : 'degraded',
    database: isDbOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    platform: 'CircleChat REST & Real-Time Engine',
  });
});

// Live Platform Public Stats (Real database counts & server limits)
router.get('/stats', async (req, res) => {
  try {
    const isDbOk = getDbStatus();
    if (!isDbOk) {
      return res.status(200).json({
        success: true,
        data: {
          usersCount: 0,
          conversationsCount: 0,
          messagesCount: 0,
          maxUploadMB: Math.round(MAX_FILE_SIZE_BYTES / (1024 * 1024)),
          status: 'connecting',
        },
      });
    }

    const [usersCount, conversationsCount, messagesCount] = await Promise.all([
      User.countDocuments(),
      Conversation.countDocuments(),
      Message.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        usersCount,
        conversationsCount,
        messagesCount,
        maxUploadMB: Math.round(MAX_FILE_SIZE_BYTES / (1024 * 1024)),
        status: 'healthy',
        uptime: Math.floor(process.uptime()),
      },
    });
  } catch (err) {
    res.status(200).json({
      success: true,
      data: {
        usersCount: 0,
        conversationsCount: 0,
        messagesCount: 0,
        maxUploadMB: Math.round(MAX_FILE_SIZE_BYTES / (1024 * 1024)),
        status: 'error',
      },
    });
  }
});

// Mount resource routers
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/conversations', conversationRoutes);
router.use('/upload', uploadRoutes);
router.use('/ai', aiRoutes);

export default router;
