const rateLimit = require("express-rate-limit");

const defaultHandler = (message) => (_req, res) => {
  res.status(429).json({
    success: false,
    message
  });
};

const shouldSkipRateLimit = () => process.env.NODE_ENV === "test";

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
  handler: defaultHandler("Too many requests. Please try again shortly.")
});

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: shouldSkipRateLimit,
  handler: defaultHandler("Too many authentication attempts. Please try again later.")
});

module.exports = {
  apiLimiter,
  authLimiter
};
