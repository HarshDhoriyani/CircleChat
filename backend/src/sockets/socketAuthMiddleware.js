import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { logger } from '../utils/logger.js';

export const socketAuthMiddleware = async (socket, next) => {
  try {
    let token = socket.handshake.auth?.token;

    // Remove 'Bearer ' prefix if present
    if (token && token.startsWith('Bearer ')) {
      token = token.slice(7).trim();
    }

    // Check cookie fallback in handshake headers
    if (!token && socket.handshake.headers.cookie) {
      const match = socket.handshake.headers.cookie.match(/token=([^;]+)/);
      if (match) token = match[1];
    }

    if (!token) {
      logger.warn(`[Socket Auth] Connection rejected: No auth token provided (socket: ${socket.id})`);
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
    );

    const user = await User.findById(decoded.id || decoded._id).select(
      'name username email avatar status presencePreference tokenVersion currentSessionId'
    );

    if (!user) {
      return next(new Error('User not found'));
    }

    // Single active session validation: check if tokenVersion / sessionId is current
    if (
      (decoded.tokenVersion !== undefined &&
        user.tokenVersion !== undefined &&
        decoded.tokenVersion !== user.tokenVersion) ||
      (decoded.sessionId && user.currentSessionId && decoded.sessionId !== user.currentSessionId)
    ) {
      logger.warn(
        `[Socket Auth] Connection rejected: Token version mismatch for user ${user.name} (session terminated by newer login)`
      );
      return next(new Error('Session terminated: Logged in on another device or IP'));
    }

    // Attach authenticated user to socket instance
    socket.user = user;
    socket.userId = user._id.toString();

    next();
  } catch (error) {
    logger.warn(`[Socket Auth] Authentication failed: ${error.message}`);
    next(new Error('Invalid authentication token'));
  }
};

export default socketAuthMiddleware;
