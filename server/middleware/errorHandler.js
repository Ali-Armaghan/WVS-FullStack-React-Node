const config = require('../config');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

function notFound(req, res, next) {
  next(new AppError('NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found.`, 404));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Something went wrong. Please try again.';

  if (err instanceof AppError) {
    ({ status, code, message } = err);
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    code = 'INVALID_JSON';
    message = 'The request body is not valid JSON.';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'The request body is too large.';
  } else if (err.name === 'CastError') {
    status = 400;
    code = 'INVALID_ID';
    message = 'Invalid id.';
  } else if (err.name === 'MongooseServerSelectionError' || err.name === 'MongoNetworkError') {
    status = 503;
    code = 'DB_UNAVAILABLE';
    message = 'Service temporarily unavailable.';
  }

  if (status >= 500) logger.error(err);

  const body = { success: false, error: { code, message } };
  if (config.isDev && status >= 500) body.error.stack = err.stack;
  res.status(status).json(body);
}

module.exports = { notFound, errorHandler };
