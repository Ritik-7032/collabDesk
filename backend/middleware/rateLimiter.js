const rateLimit = require("express-rate-limit");

/**
 * Custom skip handler:
 * In automated test suites (NODE_ENV === "test"), rate limits are bypassed
 * so standard CI test suites never fail due to transient request bursts.
 * When explicitly testing rate limiting, tests pass `x-test-rate-limit: true`.
 */
const shouldSkip = (req) => {
  if (process.env.NODE_ENV === "test" && req.headers["x-test-rate-limit"] !== "true") {
    return true;
  }
  return false;
};

// Global API Limiter (200 requests per minute per IP)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkip,
  message: { message: "Too many requests from this IP, please slow down." },
});

// Strict Auth Limiter (15 requests per 15 minutes per IP for login/signup/password-reset)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkip,
  message: { message: "Too many authentication attempts. Please try again after 15 minutes." },
});

// AI Decomposition Limiter (20 requests per 10 minutes per IP)
const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkip,
  message: { message: "AI rate limit reached. Please wait before generating more task breakdowns." },
});

// Upload Presign Limiter (30 requests per 10 minutes per IP)
const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkip,
  message: { message: "Upload request limit reached. Please wait before requesting more upload URLs." },
});

module.exports = {
  apiLimiter,
  authLimiter,
  aiLimiter,
  uploadLimiter,
};
