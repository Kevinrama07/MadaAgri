import { SAFE_TYPOGRAPHY, FONT_SIZES } from '../utils/typographyFix';

export const TYPOGRAPHY_SAFE_VALUES = {
  // Tailles principales
  display: 32,
  h1: 24,
  h2: 20,
  h3: 18,
  subheading: 16,
  body: 14,
  bodySmall: 13,
  bodyLarge: 15,
  label: 12,
  caption: 11,
  
  // Poids de police
  fontWeights: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  // Hauteurs de ligne
  lineHeights: {
    tight: 1.2,
    default: 1.4,
    relaxed: 1.6,
    spacious: 1.8,
  },
};

/**
 * Fonction utilitaire pour créer des styles de texte sécurisés
 */
export const createSafeTextStyle = (size, weight = 'regular', lineHeight = 'default') => ({
  fontSize: TYPOGRAPHY_SAFE_VALUES[size] || TYPOGRAPHY_SAFE_VALUES.body,
  fontWeight: TYPOGRAPHY_SAFE_VALUES.fontWeights[weight] || '400',
  lineHeight: TYPOGRAPHY_SAFE_VALUES.lineHeights[lineHeight] || 1.4,
});

/**
 * Styles de texte prêts à l'emploi
 */
export const TEXT_STYLES = {
  display: createSafeTextStyle('display', 'bold', 'tight'),
  h1: createSafeTextStyle('h1', 'bold', 'tight'),
  h2: createSafeTextStyle('h2', 'bold', 'tight'),
  h3: createSafeTextStyle('h3', 'semibold', 'tight'),
  subheading: createSafeTextStyle('subheading', 'semibold', 'default'),
  body: createSafeTextStyle('body', 'regular', 'relaxed'),
  bodySmall: createSafeTextStyle('bodySmall', 'regular', 'relaxed'),
  bodyLarge: createSafeTextStyle('bodyLarge', 'regular', 'relaxed'),
  label: createSafeTextStyle('label', 'semibold', 'default'),
  caption: createSafeTextStyle('caption', 'regular', 'default'),
  captionBold: createSafeTextStyle('caption', 'semibold', 'default'),
};

/**
 * Corrections spécifiques par écran
 */

// FeedHomeScreen corrections
export const FEED_SCREEN_STYLES = {
  storiesTitle: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.subheading, // 16
    fontWeight: '600',
  },
  storyName: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.caption, // 11
    fontWeight: '600',
  },
  emptyText: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.body, // 14
  },
};

// MarketplaceScreen corrections
export const MARKETPLACE_SCREEN_STYLES = {
  categoriesTitle: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.subheading, // 16
    fontWeight: '600',
  },
  categoryText: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.bodySmall, // 13
    fontWeight: '500',
  },
  emptyText: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.body, // 14
  },
};

// MessagesScreen corrections
export const MESSAGES_SCREEN_STYLES = {
  userName: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.body, // 14
    fontWeight: '600',
  },
  lastMessage: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.caption, // 11
  },
  timestamp: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.caption, // 11
  },
  badgeText: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.bodySmall, // 13
    fontWeight: '600',
  },
  emptyText: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.body, // 14
  },
};

// NotificationsScreen corrections
export const NOTIFICATIONS_SCREEN_STYLES = {
  sectionTitle: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.bodySmall, // 13
    fontWeight: '600',
  },
  notificationText: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.body, // 14
  },
  notificationMeta: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.bodySmall, // 13
  },
  timestamp: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.caption, // 11
  },
  emptyText: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.body, // 14
  },
};

// ProductDetailScreen corrections
export const PRODUCT_DETAIL_SCREEN_STYLES = {
  productName: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.h2, // 20
    fontWeight: '700',
  },
  productPrice: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.h3, // 18
    fontWeight: '600',
  },
  productDescription: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.body, // 14
  },
  sellerName: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.body, // 14
    fontWeight: '600',
  },
  sellerRole: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.bodySmall, // 13
  },
  quantityLabel: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.body, // 14
  },
  buttonText: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.body, // 14
    fontWeight: '600',
  },
};

// ProfileScreen corrections
export const PROFILE_SCREEN_STYLES = {
  userName: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.h2, // 20
    fontWeight: '700',
  },
  userBio: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.body, // 14
  },
  statNumber: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.h3, // 18
    fontWeight: '700',
  },
  statLabel: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.caption, // 11
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.subheading, // 16
    fontWeight: '600',
  },
  postContent: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.body, // 14
  },
  postMeta: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.bodySmall, // 13
  },
  tabText: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.body, // 14
    fontWeight: '500',
  },
  emptyText: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.caption, // 11
  },
};

// SearchScreen corrections
export const SEARCH_SCREEN_STYLES = {
  resultName: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.body, // 14
    fontWeight: '600',
  },
  resultMeta: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.bodySmall, // 13
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.body, // 14
    fontWeight: '600',
  },
};

// UserProfileScreen corrections
export const USER_PROFILE_SCREEN_STYLES = {
  userName: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.h2, // 20
    fontWeight: '700',
  },
  userBio: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.body, // 14
  },
  statNumber: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.h3, // 18
    fontWeight: '700',
  },
  statLabel: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.caption, // 11
  },
  buttonText: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.body, // 14
    fontWeight: '600',
  },
  postContent: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.body, // 14
  },
};

// SettingsScreen corrections
export const SETTINGS_SCREEN_STYLES = {
  sectionTitle: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.subheading, // 16
    fontWeight: '600',
  },
  settingText: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.body, // 14
  },
  logoutText: {
    fontSize: TYPOGRAPHY_SAFE_VALUES.body, // 14
    fontWeight: '600',
  },
};

/**
 * Export global de tous les styles sécurisés
 */
export const ALL_SAFE_STYLES = {
  TYPOGRAPHY_SAFE_VALUES,
  TEXT_STYLES,
  FEED_SCREEN_STYLES,
  MARKETPLACE_SCREEN_STYLES,
  MESSAGES_SCREEN_STYLES,
  NOTIFICATIONS_SCREEN_STYLES,
  PRODUCT_DETAIL_SCREEN_STYLES,
  PROFILE_SCREEN_STYLES,
  SEARCH_SCREEN_STYLES,
  USER_PROFILE_SCREEN_STYLES,
  SETTINGS_SCREEN_STYLES,
};

export default ALL_SAFE_STYLES;