// Configuration des constantes applicatives

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};

const USER_ROLES = {
  FARMER: 'farmer',
  CLIENT: 'client',
  ADMIN: 'admin',
};

const POST_VISIBILITY = {
  PUBLIC: 'public',
  FOLLOWERS: 'followers',
  PRIVATE: 'private',
};

const DELIVERY_STATUS = {
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
};

const FOLLOW_STATUS = {
  FOLLOWING: 'following',
  FRIENDS: 'friends',
};

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

const JWT_CONFIG = {
  EXPIRATION: '7d',
  REFRESH_EXPIRATION: '30d',
};

const BCRYPT = {
  SALT_ROUNDS: 10,
};

const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  DISPLAY_NAME_MIN_LENGTH: 2,
  DISPLAY_NAME_MAX_LENGTH: 100,
};

const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 300, // Augmenté de 100 à 300 (20 req/min)
  AUTH_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  AUTH_MAX_REQUESTS: 10, // Augmenté de 5 à 10 (protection brute-force maintenue)
};

const ALGORITHMS = {
  KNN: 'knn',
  DIJKSTRA: 'dijkstra',
  KMP: 'kmp',
  HEAP_SORT: 'heap_sort',
};

module.exports = {
  HTTP_STATUS,
  USER_ROLES,
  POST_VISIBILITY,
  DELIVERY_STATUS,
  FOLLOW_STATUS,
  PAGINATION,
  JWT_CONFIG,
  BCRYPT,
  VALIDATION,
  RATE_LIMIT,
  ALGORITHMS,
};
