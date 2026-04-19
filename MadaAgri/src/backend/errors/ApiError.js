/**
 * Classe d'erreur personnalisée pour l'API
 */
class ApiError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.timestamp = new Date();
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Erreur de validation
 */
class ValidationError extends ApiError {
  constructor(message, errors = {}) {
    super(message, 400);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Erreur d'authentification
 */
class AuthenticationError extends ApiError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Erreur d'autorisation
 */
class AuthorizationError extends ApiError {
  constructor(message = 'Access denied') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

/**
 * Erreur ressource non trouvée
 */
class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Erreur de conflit
 */
class ConflictError extends ApiError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

module.exports = {
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError
};
