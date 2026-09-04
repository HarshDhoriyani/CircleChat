import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { USER_STATUS, DEFAULT_AVATARS } from '../config/constants.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a full name'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    username: {
      type: String,
      required: [true, 'Please provide a username'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email address'],
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Please provide a password'],
      select: false,
    },
    avatar: {
      type: String,
      default: () => DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)],
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.OFFLINE,
    },
    presencePreference: {
      type: String,
      enum: ['online', 'away', 'busy'],
      default: 'online',
    },
    customStatus: {
      type: String,
      maxlength: [100, 'Custom status cannot exceed 100 characters'],
      default: '',
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    // Single active session & device enforcement fields
    tokenVersion: {
      type: Number,
      default: 0,
    },
    currentSessionId: {
      type: String,
      default: null,
    },
    lastLoginIp: {
      type: String,
      default: '',
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Method to verify password against bcrypt hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = mongoose.model('User', userSchema);
export default User;
