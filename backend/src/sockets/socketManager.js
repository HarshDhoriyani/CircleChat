import { Server } from 'socket.io';
import { socketAuthMiddleware } from './socketAuthMiddleware.js';
import { handlePresence } from './presenceHandlers.js';
import { handleChatEvents } from './chatHandlers.js';
import { logger } from '../utils/logger.js';
import { getAllowedOrigins } from '../config/env.js';

let ioInstance = null;

export const initSocket = (httpServer) => {
  const allowedOrigins = getAllowedOrigins();

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) {
          return callback(null, true);
        }
        
        if (!allowedOrigins.has(origin)) {
          return callback(new Error(`Origin ${origin} is not allowed`));
        }

        return callback(null, true);
      },
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 15000,
  });

  // Attach handshake authentication middleware
  io.use(socketAuthMiddleware);

  // Bind connection event
  io.on('connection', (socket) => {
    handlePresence(io, socket);
    handleChatEvents(io, socket);
  });

  ioInstance = io;
  logger.info('⚡ Socket.io Real-Time Engine Initialized');

  return io;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.io has not been initialized yet.');
  }
  return ioInstance;
};

export default initSocket;
