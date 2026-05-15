export const BREAKPOINTS = {
  SMALL: 320,
  MEDIUM: 375,
  LARGE: 414,
  XLARGE: 480,
  TABLET: 768,
  DESKTOP: 1024,
};

export const ANIMATION_DURATIONS = {
  INSTANT: 0,
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 800,
};

export const Z_INDEX = {
  BASE: 0,
  ELEVATED: 10,
  MODAL: 100,
  OVERLAY: 1000,
  TOAST: 10000,
};

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  INITIAL_PAGE: 1,
  LOAD_MORE_THRESHOLD: 0.8,
};

export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_BIO_LENGTH: 500,
  MAX_POST_LENGTH: 5000,
  MAX_COMMENT_LENGTH: 1000,
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erreur de connexion. Veuillez réessayer.',
  TIMEOUT_ERROR: 'La requête a expiré. Veuillez réessayer.',
  VALIDATION_ERROR: 'Veuillez vérifier vos données.',
  SERVER_ERROR: 'Erreur serveur. Veuillez réessayer plus tard.',
};

export const SUCCESS_MESSAGES = {
  SAVED: 'Enregistré avec succès.',
  DELETED: 'Supprimé avec succès.',
  UPDATED: 'Mis à jour avec succès.',
  PUBLISHED: 'Publié avec succès.',
};

export const PRODUCT_CATEGORIES = [
  { id: '1', name: 'Légumes', icon: 'leaf' },
  { id: '2', name: 'Fruits', icon: 'apple' },
  { id: '3', name: 'Grains', icon: 'grain' },
  { id: '4', name: 'Outils', icon: 'hammer' },
  { id: '5', name: 'Semences', icon: 'sprout' },
];

export const USER_BADGES = {
  FARMER: { id: 'farmer', name: 'Agriculteur', icon: 'leaf' },
  SELLER: { id: 'seller', name: 'Vendeur', icon: 'shopping' },
  VERIFIED: { id: 'verified', name: 'Vérifié', icon: 'check-circle' },
};

export default {
  BREAKPOINTS,
  ANIMATION_DURATIONS,
  Z_INDEX,
  PAGINATION,
  VALIDATION,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  PRODUCT_CATEGORIES,
  USER_BADGES,
};
