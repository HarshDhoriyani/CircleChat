import { authService } from '../services/authService.js';
import { User } from '../models/User.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getIO } from '../sockets/socketManager.js';
import { SOCKET_EVENTS } from '../config/constants.js';

export const register = asyncHandler(async (req, res) => {
  const { name, username, email, password, avatar } = req.body;

  if (!name || !email || !password) {
    throw ApiError.badRequest('Please provide all required fields: name, email, and password');
  }

  if (password.length < 6) {
    throw ApiError.badRequest('Password must be at least 6 characters long');
  }

  const derivedUsername = username || email.split('@')[0];
  const clientIp =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1';

  const { user, token } = await authService.register(
    {
      name,
      username: derivedUsername,
      email,
      password,
      avatar,
    },
    clientIp
  );

  authService.setTokenCookie(res, token);

  // Broadcast to all connected clients that a new user has joined the directory
  try {
    const io = getIO();
    io.emit(SOCKET_EVENTS.NEW_USER_REGISTERED, {
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        status: user.status,
        customStatus: user.customStatus,
        lastSeen: user.lastSeen,
        createdAt: user.createdAt,
      },
    });
  } catch {
    // Non-fatal if socket engine is not active
  }

  return ApiResponse.created(
    res,
    { user, token },
    'User registered successfully'
  );
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw ApiError.badRequest('Please provide both email/username and password');
  }

  const clientIp =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1';

  const { user, token } = await authService.login({ email, password }, clientIp);

  // Broadcast force logout to any prior active sessions of this user on other devices/IPs
  try {
    const io = getIO();
    io.to(`user:${user._id}`).emit(SOCKET_EVENTS.SESSION_TERMINATED, {
      message: 'You were logged out because this account was logged in from another device/IP.',
      newIp: clientIp,
      timestamp: new Date().toISOString(),
    });
  } catch {}

  authService.setTokenCookie(res, token);

  return ApiResponse.success(
    res,
    { user, token },
    'Logged in successfully'
  );
});

export const logout = asyncHandler(async (req, res) => {
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, {
      status: 'offline',
      lastSeen: new Date(),
    });

    try {
      const io = getIO();
      io.emit(SOCKET_EVENTS.USER_STATUS_CHANGE, {
        userId: req.user._id,
        status: 'offline',
        lastSeen: new Date(),
      });
    } catch {}
  }

  authService.clearTokenCookie(res);

  return ApiResponse.success(res, null, 'Logged out successfully');
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  return ApiResponse.success(res, { user }, 'Current user profile retrieved');
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, customStatus, avatar, status } = req.body;
  const updates = {};

  if (name) updates.name = name.trim();
  if (customStatus !== undefined) updates.customStatus = customStatus.trim();
  if (avatar) updates.avatar = avatar;
  if (status) {
    updates.status = status;
    if (['online', 'away', 'busy'].includes(status)) {
      updates.presencePreference = status;
    }
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  // Broadcast updated status/profile to all clients
  try {
    const io = getIO();
    io.emit(SOCKET_EVENTS.USER_STATUS_CHANGE, {
      userId: user._id,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        status: user.status,
        presencePreference: user.presencePreference,
        customStatus: user.customStatus,
        lastSeen: user.lastSeen,
      },
      status: user.status,
      presencePreference: user.presencePreference,
      customStatus: user.customStatus,
      lastSeen: user.lastSeen,
    });
  } catch {}

  return ApiResponse.success(res, { user }, 'Profile updated successfully');
});
