import rateLimit from 'express-rate-limit';

const isProduction = process.env.NODE_ENV === 'production';

// Standard rate limiter for general API routes
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 300 : 3000, // 300 requests in prod, 3000 in dev/test
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

// Stricter rate limiter for authentication attempts
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 30 : 500, // 30 attempts in prod, 500 in dev/test
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
  },
});

// Stricter rate limiter for AI requests to prevent quota exhaustion
export const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: isProduction ? 10 : 60, // 10 AI requests/min in prod, 60 in dev
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'AI processing rate limit reached. Please wait a minute before requesting another summary.',
  },
});
