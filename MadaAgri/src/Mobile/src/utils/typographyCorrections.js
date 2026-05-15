import { SAFE_TYPOGRAPHY, FONT_SIZES, getSafeFontSize } from '../utils/typographyFix';

export const TYPOGRAPHY_REPLACEMENTS = {
  // Remplacements directs pour les styles
  'TYPOGRAPHY.display.fontSize': FONT_SIZES.DISPLAY,      // 32
  'TYPOGRAPHY.h1.fontSize': FONT_SIZES.H1,                // 24
  'TYPOGRAPHY.h2.fontSize': FONT_SIZES.H2,                // 20
  'TYPOGRAPHY.h3.fontSize': FONT_SIZES.H3,                // 18
  'TYPOGRAPHY.subheading.fontSize': FONT_SIZES.SUBHEADING, // 16
  'TYPOGRAPHY.body.fontSize': FONT_SIZES.BODY,            // 14
  'TYPOGRAPHY.bodySmall.fontSize': FONT_SIZES.BODY_SMALL, // 13
  'TYPOGRAPHY.bodyLarge.fontSize': FONT_SIZES.BODY_LARGE, // 15
  'TYPOGRAPHY.label.fontSize': FONT_SIZES.LABEL,          // 12
  'TYPOGRAPHY.caption.fontSize': FONT_SIZES.CAPTION,      // 11
};

export const FEED_HOME_FIXES = {
  storiesTitle: {
    fontSize: FONT_SIZES.SUBHEADING, // 16 au lieu de TYPOGRAPHY.subheading.fontSize
  },
  storyName: {
    fontSize: FONT_SIZES.CAPTION, // 11 au lieu de TYPOGRAPHY.caption.fontSize
  },
  emptyText: {
    fontSize: FONT_SIZES.BODY, // 14 au lieu de TYPOGRAPHY.body.fontSize
  },
};

export const MARKETPLACE_FIXES = {
  categoryTitle: {
    fontSize: FONT_SIZES.SUBHEADING, // 16
  },
  productPrice: {
    fontSize: FONT_SIZES.BODY_SMALL, // 13
  },
  productName: {
    fontSize: FONT_SIZES.BODY, // 14
  },
};

export const MESSAGES_FIXES = {
  userName: {
    fontSize: FONT_SIZES.BODY, // 14
  },
  lastMessage: {
    fontSize: FONT_SIZES.CAPTION, // 11
  },
  timestamp: {
    fontSize: FONT_SIZES.CAPTION, // 11
  },
  unreadCount: {
    fontSize: FONT_SIZES.BODY_SMALL, // 13
  },
  emptyText: {
    fontSize: FONT_SIZES.BODY, // 14
  },
};

/**
 * NotificationsScreen.tsx - CORRECTIONS:
 */
export const NOTIFICATIONS_FIXES = {
  sectionTitle: {
    fontSize: FONT_SIZES.BODY_SMALL, // 13
  },
  notificationText: {
    fontSize: FONT_SIZES.BODY, // 14
  },
  notificationMeta: {
    fontSize: FONT_SIZES.BODY_SMALL, // 13
  },
  timestamp: {
    fontSize: FONT_SIZES.CAPTION, // 11
  },
  emptyText: {
    fontSize: FONT_SIZES.BODY, // 14
  },
};

/**
 * ProductDetailScreen.tsx - CORRECTIONS:
 */
export const PRODUCT_DETAIL_FIXES = {
  productName: {
    fontSize: FONT_SIZES.H2, // 20
  },
  productPrice: {
    fontSize: FONT_SIZES.H3, // 18
  },
  productDescription: {
    fontSize: FONT_SIZES.BODY, // 14
  },
  sellerName: {
    fontSize: FONT_SIZES.BODY, // 14
  },
  sellerRole: {
    fontSize: FONT_SIZES.BODY_SMALL, // 13
  },
  quantityLabel: {
    fontSize: FONT_SIZES.BODY, // 14
  },
  buttonText: {
    fontSize: FONT_SIZES.BODY, // 14
  },
};

/**
 * ProfileScreen.tsx - CORRECTIONS:
 */
export const PROFILE_FIXES = {
  userName: {
    fontSize: FONT_SIZES.H2, // 20
  },
  userBio: {
    fontSize: FONT_SIZES.BODY, // 14
  },
  statNumber: {
    fontSize: FONT_SIZES.H3, // 18
  },
  statLabel: {
    fontSize: FONT_SIZES.CAPTION, // 11
  },
  sectionTitle: {
    fontSize: FONT_SIZES.SUBHEADING, // 16
  },
  postContent: {
    fontSize: FONT_SIZES.BODY, // 14
  },
  postMeta: {
    fontSize: FONT_SIZES.BODY_SMALL, // 13
  },
  tabText: {
    fontSize: FONT_SIZES.BODY, // 14
  },
  emptyText: {
    fontSize: FONT_SIZES.CAPTION, // 11
  },
};

/**
 * SearchScreen.tsx - CORRECTIONS:
 */
export const SEARCH_FIXES = {
  resultName: {
    fontSize: FONT_SIZES.BODY, // 14
  },
  resultMeta: {
    fontSize: FONT_SIZES.BODY_SMALL, // 13
  },
  sectionTitle: {
    fontSize: FONT_SIZES.BODY, // 14
  },
};

/**
 * UserProfileScreen.tsx - CORRECTIONS:
 */
export const USER_PROFILE_FIXES = {
  userName: {
    fontSize: FONT_SIZES.H2, // 20
  },
  userBio: {
    fontSize: FONT_SIZES.BODY, // 14
  },
  statNumber: {
    fontSize: FONT_SIZES.H3, // 18
  },
  statLabel: {
    fontSize: FONT_SIZES.CAPTION, // 11
  },
  buttonText: {
    fontSize: FONT_SIZES.BODY, // 14
  },
  postContent: {
    fontSize: FONT_SIZES.BODY, // 14
  },
};

// ===== EXPORT GLOBAL =====

export const ALL_TYPOGRAPHY_FIXES = {
  FEED_HOME_FIXES,
  MARKETPLACE_FIXES,
  MESSAGES_FIXES,
  NOTIFICATIONS_FIXES,
  PRODUCT_DETAIL_FIXES,
  PROFILE_FIXES,
  SEARCH_FIXES,
  USER_PROFILE_FIXES,
};

export default {
  TYPOGRAPHY_REPLACEMENTS,
  ALL_TYPOGRAPHY_FIXES,
  SAFE_TYPOGRAPHY,
  FONT_SIZES,
};