const logger = require('../utils/logger');
const { ApiError } = require('../errors/ApiError');
const { sendError } = require('../utils/responseHandler');

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

  // Logger l'erreur
  logger.error({
    message: err.message,
    statusCode: err.statusCode,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  // Erreurs de validation Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return sendError(
      res,
      { ...err, message: 'Validation error', errors },
      400
    );
  }

  // Erreur de duplication MongoDB
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return sendError(
      res,
      { ...err, message: `${field} already exists` },
      409
    );
  }

  // JWT invalide
  if (err.name === 'JsonWebTokenError') {
    return sendError(
      res,
      { ...err, message: 'Invalid token' },
      401
    );
  }

  // JWT expiré
  if (err.name === 'TokenExpiredError') {
    return sendError(
      res,
      { ...err, message: 'Token expired' },
      401
    );
  }

  // Erreur d'API personnalisée
  if (err instanceof ApiError) {
    return sendError(res, err, err.statusCode);
  }

  // Erreur par défaut (ne pas révéler les détails en production)
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  sendError(res, { message }, err.statusCode);
};

module.exports = {
  asyncHandler,
  globalErrorHandler,
};
