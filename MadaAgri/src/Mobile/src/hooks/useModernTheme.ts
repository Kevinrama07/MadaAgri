import { useTheme } from '../contexts/ThemeContext';
import { useWindowDimensions } from 'react-native';
import { BREAKPOINTS } from '../config/UIConstants';

export const useModernTheme = () => {
  const { theme, colors, mode, toggleTheme } = useTheme();
  const { width, height } = useWindowDimensions();

  // Determine device size
  const isSmall = width < BREAKPOINTS.MEDIUM;
  const isMedium = width >= BREAKPOINTS.MEDIUM && width < BREAKPOINTS.LARGE;
  const isLarge = width >= BREAKPOINTS.LARGE && width < BREAKPOINTS.TABLET;
  const isTablet = width >= BREAKPOINTS.TABLET;

  // Responsive spacing
  const responsiveSpacing = {
    xs: isSmall ? 2 : 4,
    sm: isSmall ? 6 : 8,
    md: isSmall ? 10 : 12,
    lg: isSmall ? 14 : 16,
    xl: isSmall ? 18 : 20,
  };

  // Responsive font sizes
  const responsiveFontSizes = {
    caption: isSmall ? 10 : 11,
    label: isSmall ? 11 : 12,
    body: isSmall ? 13 : 14,
    subheading: isSmall ? 15 : 16,
    h3: isSmall ? 17 : 18,
    h2: isSmall ? 19 : 20,
    h1: isSmall ? 22 : 24,
  };

  return {
    // Theme
    theme,
    colors,
    mode,
    isDark: mode === 'dark',
    isLight: mode === 'light',
    toggleTheme,

    // Device info
    width,
    height,
    isSmall,
    isMedium,
    isLarge,
    isTablet,

    // Responsive values
    spacing: responsiveSpacing,
    fontSizes: responsiveFontSizes,
  };
};

export default useModernTheme;
