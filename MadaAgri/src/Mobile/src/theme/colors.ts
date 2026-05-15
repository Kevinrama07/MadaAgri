export const COLORS = {
  // Primary Colors (Agricultural Green)
  PRIMARY: '#2E7D32',        // Dark agricultural green
  PRIMARY_LIGHT: '#4CAF50',  // Light natural green
  PRIMARY_LIGHTER: '#81C784', // Lighter green for backgrounds
  PRIMARY_PALE: '#E8F5E9',   // Very light green for backgrounds

  // Neutrals - Light Mode
  WHITE: '#FFFFFF',
  LIGHT_GRAY: '#F5F5F5',     // Very light gray (main background)
  GRAY_200: '#E4E6EB',       // Facebook-like gray
  GRAY_300: '#D0D2D6',       // Secondary gray
  GRAY_400: '#BCC0C4',       // Medium gray
  GRAY_500: '#8A8D91',       // Dark gray
  GRAY_600: '#65676B',       // Text secondary
  BLACK_SOFT: '#1C1E21',     // Soft black (main text)

  // Neutrals - Dark Mode
  DARK_BG: '#0A0E27',        // Very dark background
  DARK_SECONDARY: '#121D3A',  // Dark secondary background
  DARK_CARD: '#1F2937',      // Card background in dark mode
  DARK_TEXT: '#F5F5F5',      // Main text in dark mode
  DARK_TEXT_SECONDARY: '#B0B0B0', // Secondary text in dark mode

  // Accent Colors
  FACEBOOK_BLUE: '#1877F2',
  SUCCESS: '#31A24C',
  WARNING: '#F57C00',
  ERROR: '#C62828',
  INFO: '#1976D2',

  // Secondary Colors
  ORANGE_SOFT: '#FFB74D',    // Soft orange for promotions
  RED_LIGHT: '#EF5350',      // Light red for alerts
  BLUE_LIGHT: '#64B5F6',     // Light blue

  // Transparent variants
  BLACK_10: 'rgba(0, 0, 0, 0.1)',
  BLACK_20: 'rgba(0, 0, 0, 0.2)',
  BLACK_30: 'rgba(0, 0, 0, 0.3)',
  WHITE_30: 'rgba(255, 255, 255, 0.3)',
  WHITE_50: 'rgba(255, 255, 255, 0.5)',
};

export const LIGHT_THEME = {
  background: COLORS.WHITE,
  primaryBackground: COLORS.LIGHT_GRAY,
  secondaryBackground: COLORS.GRAY_200,
  card: COLORS.WHITE,
  cardAlt: COLORS.LIGHT_GRAY,
  text: COLORS.BLACK_SOFT,
  textSecondary: COLORS.GRAY_600,
  textTertiary: COLORS.GRAY_500,
  border: COLORS.GRAY_200,
  borderLight: COLORS.GRAY_300,
  primary: COLORS.PRIMARY,
  primaryLight: COLORS.PRIMARY_LIGHT,
  primaryPale: COLORS.PRIMARY_PALE,
  accent: COLORS.FACEBOOK_BLUE,
  success: COLORS.SUCCESS,
  warning: COLORS.WARNING,
  error: COLORS.ERROR,
  info: COLORS.INFO,
  placeholder: COLORS.GRAY_500,
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: COLORS.BLACK_10,
  WHITE: COLORS.WHITE,
  BLACK_10: COLORS.BLACK_10,
};

export const DARK_THEME = {
  background: COLORS.DARK_BG,
  primaryBackground: COLORS.DARK_SECONDARY,
  secondaryBackground: COLORS.DARK_CARD,
  card: COLORS.DARK_CARD,
  cardAlt: COLORS.DARK_SECONDARY,
  text: COLORS.DARK_TEXT,
  textSecondary: COLORS.DARK_TEXT_SECONDARY,
  textTertiary: COLORS.GRAY_500,
  border: COLORS.DARK_SECONDARY,
  borderLight: COLORS.DARK_CARD,
  primary: COLORS.PRIMARY_LIGHT,
  primaryLight: COLORS.PRIMARY_LIGHT,
  primaryPale: 'rgba(76, 175, 80, 0.15)',
  accent: '#66B3FF',
  success: COLORS.SUCCESS,
  warning: COLORS.WARNING,
  error: '#FF6B6B',
  info: '#64B5F6',
  placeholder: COLORS.DARK_TEXT_SECONDARY,
  overlay: 'rgba(0, 0, 0, 0.7)',
  shadow: 'rgba(0, 0, 0, 0.3)',
  WHITE: COLORS.WHITE,
  BLACK_10: COLORS.BLACK_10,
};

export type ThemeColors = typeof LIGHT_THEME;
