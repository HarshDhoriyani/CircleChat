import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';

export const authService = {
  /**
   * Generates a signed JWT token embedded with tokenVersion & sessionId
   */
  generateToken(user, sessionId) {
    const activeSessionId = sessionId || user.currentSessionId || ('sess_' + Date.now());
    const version = user.tokenVersion !== undefined ? user.tokenVersion : 0;

    return jwt.sign(
      {
        id: user._id,
        _id: user._id,
        email: user.email,
        username: user.username,
        tokenVersion: version,
        sessionId: activeSessionId,
      },
      process.env.JWT_SECRET || 'aetherchat_jwt_secret_secure_key_development_2026',
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      }
    );
  },

  /**
   * Hashes a plain password using bcrypt
   */
  async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  },

  /**
   * Sets the HTTP-only authentication cookie on the response
   */
  setTokenCookie(res, token) {
    const days = parseInt(process.env.COOKIE_EXPIRES_DAYS || '7', 10);
    const isProd = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      expires: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
    };

    res.cookie('token', token, cookieOptions);
  },

  /**
   * Clears the authentication cookie
   */
  clearTokenCookie(res) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', '', {
      expires: new Date(0),
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
    });
  },

  /**
   * Registers a new user
   */
  async register({ name, username, email, password, avatar }, clientIp = '') {
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        throw ApiError.conflict('An account with this email address already exists');
      }
      throw ApiError.conflict('This username is already taken');
    }

    const passwordHash = await this.hashPassword(password);
    const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);

    const user = await User.create({
      name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      passwordHash,
      avatar: avatar || undefined,
      tokenVersion: 1,
      currentSessionId: sessionId,
      lastLoginIp: clientIp,
      lastLoginAt: new Date(),
    });

    const token = this.generateToken(user, sessionId);
    return { user, token };
  },

  /**
   * Authenticates an existing user and invalidates any previous session
   */
  async login({ email, password }, clientIp = '') {
    // Look up by email or username
    const user = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: email.toLowerCase() },
      ],
    }).select('+passwordHash');

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Invalidate previous sessions by incrementing tokenVersion & rotating sessionId
    const newSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.currentSessionId = newSessionId;
    user.lastLoginIp = clientIp;
    user.lastLoginAt = new Date();
    user.status = user.presencePreference || 'online';
    user.lastSeen = new Date();
    await user.save();

    const token = this.generateToken(user, newSessionId);
    return { user, token, sessionId: newSessionId };
  },
};

export default authService;
