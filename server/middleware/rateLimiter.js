const rateLimit = require('express-rate-limit');
const config = require('../config');

const handler = (req, res, next, options) =>
  res.status(options.statusCode).json({
    success: false,
    error: { code: 'RATE_LIMITED', message: options.message }
  });

const skip = () => config.env === 'test';

const scanLimiter = rateLimit({
  windowMs: config.scanRateLimitWindowMin * 60 * 1000,
  limit: config.scanRateLimitMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: 'Too many scans. Please wait a few minutes and try again.',
  handler,
  skip
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: 'Too many requests. Please slow down.',
  handler,
  skip
});

module.exports = { scanLimiter, apiLimiter };
