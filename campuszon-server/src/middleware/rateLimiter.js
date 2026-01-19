import rateLimit from 'express-rate-limit';

// Strict rate limiter for authentication endpoints (login, signup, password reset)
// 5 attempts per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip successful requests (only count failed auth attempts)
  skipSuccessfulRequests: false,
});

// OTP rate limiter - prevents OTP spam/abuse
// 3 OTP requests per 15 minutes
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 OTP requests per window
  message: {
    success: false,
    message: 'Too many OTP requests. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter
// 100 requests per 15 minutes for general endpoints
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Payment operations rate limiter
// 10 payment operations per 15 minutes
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 payment operations per window
  message: {
    success: false,
    message: 'Too many payment attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Item creation rate limiter
// 20 items per hour to prevent spam
export const itemCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 items per hour
  message: {
    success: false,
    message: 'Too many items created. Please try again after an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Report spam limiter
// 10 reports per hour
export const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 reports per hour
  message: {
    success: false,
    message: 'Too many reports submitted. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default {
  authLimiter,
  otpLimiter,
  apiLimiter,
  paymentLimiter,
  itemCreationLimiter,
  reportLimiter,
};
