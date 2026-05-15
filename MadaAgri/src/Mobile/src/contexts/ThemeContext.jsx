import React, { createContext, useContext, useEffect, useState } from 'react';
import { storageService } from '../services';
import { LIGHT_THEME, DARK_THEME, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS, ANIMATION_TIMINGS } from '../theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [mode, setModeState] = useState('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await storageService.getTheme();
      setModeState(savedTheme || 'light');
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setModeState(newMode);
    await storageService.saveTheme(newMode);
  };

  // Get current theme based on mode
  const currentColors = mode === 'light' ? LIGHT_THEME : DARK_THEME;

  // Complete theme object
  const theme = {
    mode,
    colors: currentColors,
    spacing: SPACING,
    borderRadius: BORDER_RADIUS,
    typography: TYPOGRAPHY,
    shadows: SHADOWS,
    animations: ANIMATION_TIMINGS,
    isDark: mode === 'dark',
    isLight: mode === 'light',
  };

  return (
    <ThemeContext.Provider value={{ theme, mode, toggleTheme, colors: currentColors, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export default ThemeContext;
