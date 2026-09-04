import { aiService } from '../services/aiService.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const catchMeUp = asyncHandler(async (req, res) => {
  const conversationId = req.params.id || req.body.conversationId;
  const { unreadOnly, messageLimit } = req.body || {};

  if (!conversationId) {
    throw ApiError.badRequest('Please provide a conversationId to summarize');
  }

  const summaryData = await aiService.generateCatchMeUpSummary(
    conversationId,
    req.user._id,
    {
      unreadOnly: Boolean(unreadOnly),
      messageLimit: messageLimit || 40,
    }
  );

  return ApiResponse.success(
    res,
    { summary: summaryData },
    'Catch Me Up summary synthesized successfully'
  );
});
