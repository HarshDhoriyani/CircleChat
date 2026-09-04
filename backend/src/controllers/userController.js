import { User } from '../models/User.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const searchUsers = asyncHandler(async (req, res) => {
  const query = req.query.q || '';
  const currentUserId = req.user._id;

  let filter = {
    _id: { $ne: currentUserId },
  };

  if (query.trim()) {
    const escapedQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQuery, 'i');
    filter = {
      _id: { $ne: currentUserId },
      $or: [{ name: regex }, { username: regex }, { email: regex }],
    };
  }

  const users = await User.find(filter)
    .select('name username email avatar status customStatus lastSeen')
    .sort({ name: 1 })
    .limit(50);

  return ApiResponse.success(res, { users }, 'Users search results retrieved');
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;

  const users = await User.find({
    _id: { $ne: currentUserId },
  })
    .select('name username email avatar status customStatus lastSeen')
    .sort({ name: 1 })
    .limit(100);

  return ApiResponse.success(res, { users }, 'User directory retrieved');
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(
    'name username email avatar status customStatus lastSeen createdAt'
  );

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return ApiResponse.success(res, { user }, 'User profile retrieved');
});
