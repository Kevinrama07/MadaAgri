
export const ENV = {
  API_URL: process.env.EXPO_PUBLIC_API_URL,
  SOCKET_URL: process.env.EXPO_PUBLIC_SOCKET_URL,
  ANDROID_EMULATOR_IP: process.env.EXPO_PUBLIC_ANDROID_EMULATOR_IP,
  APP_NAME: process.env.EXPO_PUBLIC_APP_NAME,
  VERSION: process.env.EXPO_PUBLIC_VERSION,
  
  // Features
  FEATURES: {
    ANALYTICS: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true',
    NOTIFICATIONS: process.env.EXPO_PUBLIC_ENABLE_NOTIFICATIONS === 'true',
    OFFLINE_MODE: process.env.EXPO_PUBLIC_ENABLE_OFFLINE_MODE === 'true',
  },

  // Debug
  DEBUG: process.env.EXPO_PUBLIC_DEBUG_ENABLED === 'true',
};

// Default timeout
export const API_TIMEOUT = 10000; // 10 seconds

// Cache time limits
export const CACHE_LIMITS = {
  PRODUCTS: 5 * 60 * 1000, // 5 minutes
  POSTS: 3 * 60 * 1000, // 3 minutes
  MESSAGES: 1 * 60 * 1000, // 1 minute
  USER: 10 * 60 * 1000, // 10 minutes
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

// Validation Rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  BIO_MAX_LENGTH: 500,
  POST_MAX_LENGTH: 5000,
};

export default ENV;
