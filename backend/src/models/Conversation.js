import mongoose from 'mongoose';
import { CONVERSATION_TYPES, DEFAULT_GROUP_AVATAR } from '../config/constants.js';

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: Object.values(CONVERSATION_TYPES),
      default: CONVERSATION_TYPES.DIRECT,
      required: true,
    },
    name: {
      type: String,
      trim: true,
      maxlength: [80, 'Group name cannot exceed 80 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [250, 'Group description cannot exceed 250 characters'],
      default: '',
    },
    avatar: {
      type: String,
      default: function () {
        return this.type === CONVERSATION_TYPES.GROUP ? DEFAULT_GROUP_AVATAR : '';
      },
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    // Map of userId string -> unread count integer
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for fast lookup of a user's conversations sorted by latest activity
conversationSchema.index({ participants: 1, updatedAt: -1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
