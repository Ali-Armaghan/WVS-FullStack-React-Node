const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

module.exports = function validateObjectId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError('INVALID_ID', 'Invalid report id.', 400));
  }
  next();
};
