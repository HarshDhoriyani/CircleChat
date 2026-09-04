import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // If not instance of ApiError, normalize it
  if (!(error instanceof ApiError)) {
    let statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
    let message = error.message || 'Internal Server Error';

    // Mongoose Bad ObjectId (CastError)
    if (error.name === 'CastError') {
      statusCode = 400;
      message = `Invalid format for field '${error.path}': ${error.value}`;
    }

    // Mongoose Duplicate Key (E11000)
    if (error.code === 11000) {
      statusCode = 409;
      const field = Object.keys(error.keyValue)[0];
      message = `An account or record with that ${field} already exists`;
    }

    // JWT Errors
    if (error.name === 'JsonWebTokenError') {
      statusCode = 401;
      message = 'Invalid authentication token. Please log in again.';
    }

    if (error.name === 'TokenExpiredError') {
      statusCode = 401;
      message = 'Authentication token has expired. Please log in again.';
    }

    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  // Log error for diagnostics
  if (error.statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} - ${error.message}`);
    if (error.stack) logger.error(error.stack);
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} - ${error.statusCode} ${error.message}`);
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    ...(error.errors?.length > 0 ? { errors: error.errors } : {}),
    ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {}),
  };

  return res.status(error.statusCode).json(response);
};

export const notFoundHandler = (req, res, next) => {
  const error = new ApiError(404, `Route not found: [${req.method}] ${req.originalUrl}`);
  next(error);
};
