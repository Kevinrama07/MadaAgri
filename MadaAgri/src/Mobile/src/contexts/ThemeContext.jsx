import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIGHT_THEME, DARK_THEME, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS, ANIMATION_TIMINGS } from '../theme';

const THEME_KEY = '@madaagri_theme';
const ThemeContext = createContext();

const loadThemeFromStorage = async () => {
  try {
    const saved = await AsyncStorage.getItem(THEME_KEY);
    return saved || 'light';
  } catch {
    return 'light';
  }
};

export const ThemeProvider = ({ children }) => {
  const [mode, setModeState] = useState('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    loadThemeFromStorage().then((savedMode) => {
      if (mounted) {
        setModeState(savedMode);
        setIsLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  const toggleTheme = async () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setModeState(newMode);
    try {
      await AsyncStorage.setItem(THEME_KEY, newMode);
    } catch {}
  };

  const currentColors = mode === 'light' ? LIGHT_THEME : DARK_THEME;

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
