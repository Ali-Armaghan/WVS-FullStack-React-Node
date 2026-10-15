const AppError = require('../utils/AppError');

module.exports = function validateScanRequest(req, res, next) {
  const url = req.body?.url;
  if (typeof url !== 'string' || !url.trim()) {
    return next(new AppError('INVALID_URL', 'Please enter a website URL.', 400));
  }
  if (url.length > 2048) {
    return next(new AppError('INVALID_URL', 'The URL is too long.', 400));
  }
  req.body.url = url.trim();
  next();
};
