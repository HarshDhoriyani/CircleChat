import { uploadService } from '../services/uploadService.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const uploadMedia = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('No file uploaded. Please provide a valid file under field name "file".');
  }

  const fileData = await uploadService.processUploadedFile(req.file, req);

  return ApiResponse.created(
    res,
    { file: fileData },
    'File uploaded successfully'
  );
});
