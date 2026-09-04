import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Check Bearer token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2. Check HTTP-only cookie
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    throw ApiError.unauthorized('Not authorized. No authentication token provided.');
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'aetherchat_jwt_secret_secure_key_development_2026'
    );

    const user = await User.findById(decoded.id || decoded._id).select('-passwordHash');

    if (!user) {
      throw ApiError.unauthorized('User associated with this token no longer exists.');
    }

    // Enforce single active session: invalidate older tokens from previous logins/IPs
    if (
      (decoded.tokenVersion !== undefined &&
        user.tokenVersion !== undefined &&
        decoded.tokenVersion !== user.tokenVersion) ||
      (decoded.sessionId && user.currentSessionId && decoded.sessionId !== user.currentSessionId)
    ) {
      throw ApiError.unauthorized(
        'Session expired. This account has been logged in from another device or location.'
      );
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.unauthorized('Authentication token is invalid or expired.');
  }
});

export default protect;
