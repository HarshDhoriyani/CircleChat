import dotenv from 'dotenv';
dotenv.config({ override: true });
import http from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { initSocket } from './sockets/socketManager.js';
import { logger } from './utils/logger.js';

const PORT = process.env.PORT || 5000;

// Initialize HTTP & WebSocket Server
const server = http.createServer(app);
const io = initSocket(server);

// Start Server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Reset any stale 'online' statuses from prior crashes/sessions
    try {
      await User.updateMany({ status: { $ne: 'offline' } }, { status: 'offline' });
      logger.info('🧹 Stale user presence statuses reset to offline on startup');
    } catch (e) {
      logger.warn(`Failed to reset user statuses: ${e.message}`);
    }

    server.listen(PORT, () => {
      logger.info(`🚀 CircleChat Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      logger.info(`📡 Socket.io ready on http://localhost:${PORT}`);
      logger.info(`🌐 Health check available at http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

// Graceful Shutdown
const handleGracefulShutdown = (signal) => {
  logger.warn(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP & Socket.io server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

export { server, io };
