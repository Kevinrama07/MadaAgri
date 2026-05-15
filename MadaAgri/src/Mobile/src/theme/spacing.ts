export const SPACING = {
  // Base units
  XS: 4,      // Extra small (micro spacing)
  SM: 8,      // Small
  MD: 12,     // Medium (base)
  LG: 16,     // Large
  XL: 20,     // Extra large
  XXL: 24,    // 2X Large
  XXXL: 32,   // 3X Large
  HUGE: 40,   // Huge
  GIANT: 48,  // Giant

  // Common combinations
  PADDING_TINY: 4,
  PADDING_SMALL: 8,
  PADDING_DEFAULT: 12,
  PADDING_LARGE: 16,
  PADDING_XL: 20,
  PADDING_CARD: 16,

  MARGIN_TINY: 4,
  MARGIN_SMALL: 8,
  MARGIN_DEFAULT: 12,
  MARGIN_LARGE: 16,
  MARGIN_XL: 20,

  // Screen edges
  SCREEN_PADDING: 16,
  SCREEN_PADDING_BOTTOM: 24,

  // Component specific
  BUTTON_PADDING_VERTICAL: 12,
  BUTTON_PADDING_HORIZONTAL: 16,
  INPUT_PADDING: 12,
  CARD_PADDING: 16,
  CARD_MARGIN: 12,

  // List/Grid
  LIST_ITEM_PADDING: 12,
  GRID_GAP: 8,

  // Header/Footer
  HEADER_HEIGHT: 56,
  BOTTOM_TAB_HEIGHT: 60,
  STATUS_BAR_HEIGHT: 44,
};

/**
 * Border Radius System
 * Modern, rounded design inspired by Facebook
 */
export const BORDER_RADIUS = {
  NONE: 0,
  SM: 4,           // Minimal rounding
  DEFAULT: 8,      // Standard card radius
  MD: 12,          // Medium buttons/inputs
  LG: 16,          // Larger cards
  XL: 20,          // Large interactive elements
  FULL: 9999,      // Circles/complete rounding

  // Specific uses
  CARD: 12,
  BUTTON: 8,
  INPUT: 8,
  AVATAR: 9999,
  IMAGE: 12,
  MODAL: 16,
  BOTTOM_SHEET: 24,
};

/**
 * Typography Sizes (px)
 * Mobile-first, accessibility-focused
 */
export const FONT_SIZES = {
  CAPTION: 11,      // Small labels, timestamps
  LABEL: 12,        // Button labels, badges
  BODY_SMALL: 13,   // Secondary text
  BODY: 14,         // Main body text (base)
  BODY_LARGE: 15,   // Larger body text
  SUBHEADING: 16,   // Small headings
  HEADING_3: 18,    // Section headings
  HEADING_2: 20,    // Screen titles
  HEADING_1: 24,    // Major headings
  DISPLAY: 32,      // Hero text
};

/**
 * Font Weights
 * Clean, modern typography hierarchy
 */
export const FONT_WEIGHTS = {
  LIGHT: '300' as const,
  REGULAR: '400' as const,
  MEDIUM: '500' as const,
  SEMIBOLD: '600' as const,
  BOLD: '700' as const,
};

/**
 * Line Heights
 * Optimized for readability
 */
export const LINE_HEIGHTS = {
  TIGHT: 1.2,
  DEFAULT: 1.4,
  RELAXED: 1.6,
  SPACIOUS: 1.8,
};

/**
 * Typography Presets
 * Ready-to-use text styles
 */
export const TYPOGRAPHY = {
  display: {
    fontSize: FONT_SIZES.DISPLAY,
    fontWeight: FONT_WEIGHTS.BOLD,
    lineHeight: LINE_HEIGHTS.TIGHT,
  },
  h1: {
    fontSize: FONT_SIZES.HEADING_1,
    fontWeight: FONT_WEIGHTS.BOLD,
    lineHeight: LINE_HEIGHTS.TIGHT,
  },
  h2: {
    fontSize: FONT_SIZES.HEADING_2,
    fontWeight: FONT_WEIGHTS.BOLD,
    lineHeight: LINE_HEIGHTS.TIGHT,
  },
  h3: {
    fontSize: FONT_SIZES.HEADING_3,
    fontWeight: FONT_WEIGHTS.SEMIBOLD,
    lineHeight: LINE_HEIGHTS.TIGHT,
  },
  subheading: {
    fontSize: FONT_SIZES.SUBHEADING,
    fontWeight: FONT_WEIGHTS.SEMIBOLD,
    lineHeight: LINE_HEIGHTS.DEFAULT,
  },
  body: {
    fontSize: FONT_SIZES.BODY,
    fontWeight: FONT_WEIGHTS.REGULAR,
    lineHeight: LINE_HEIGHTS.RELAXED,
  },
  bodySmall: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontWeight: FONT_WEIGHTS.REGULAR,
    lineHeight: LINE_HEIGHTS.RELAXED,
  },
  bodyLarge: {
    fontSize: FONT_SIZES.BODY_LARGE,
    fontWeight: FONT_WEIGHTS.REGULAR,
    lineHeight: LINE_HEIGHTS.RELAXED,
  },
  label: {
    fontSize: FONT_SIZES.LABEL,
    fontWeight: FONT_WEIGHTS.SEMIBOLD,
    lineHeight: LINE_HEIGHTS.DEFAULT,
  },
  caption: {
    fontSize: FONT_SIZES.CAPTION,
    fontWeight: FONT_WEIGHTS.REGULAR,
    lineHeight: LINE_HEIGHTS.DEFAULT,
  },
  captionBold: {
    fontSize: FONT_SIZES.CAPTION,
    fontWeight: FONT_WEIGHTS.SEMIBOLD,
    lineHeight: LINE_HEIGHTS.DEFAULT,
  },
};
