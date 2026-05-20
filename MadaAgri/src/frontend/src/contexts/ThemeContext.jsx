import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const THEMES = {
  'nature-green': {
    name: 'Nature Green',
    icon: 'leaf',
    light: {
      primary: '#22c55e',
      primaryHover: '#16a34a',
      primaryLight: '#dcfce7',
      secondary: '#84cc16',
      secondaryHover: '#65a30d',
      accent: '#06b6d4',
      background: '#ffffff',
      backgroundSecondary: '#f8faf9',
      backgroundTertiary: '#f1f5f0',
      surface: '#ffffff',
      surfaceHover: '#f8faf9',
      text: '#0f172a',
      textSecondary: '#475569',
      textMuted: '#94a3b8',
      textInverse: '#ffffff',
      border: '#e2e8f0',
      borderLight: '#f1f5f9',
      shadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
      shadowMd: '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.04)',
      shadowLg: '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04)',
      gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      gradientSoft: 'linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)',
      success: '#16a34a',
      successLight: '#dcfce7',
      warning: '#f59e0b',
      warningLight: '#fef3c7',
      error: '#ef4444',
      errorHover: '#dc2626',
      errorLight: '#fee2e2',
      info: '#3b82f6',
      infoLight: '#dbeafe',
    },
    dark: {
      primary: '#4ade80',
      primaryHover: '#22c55e',
      primaryLight: 'rgba(74, 222, 128, 0.15)',
      secondary: '#a3e635',
      secondaryHover: '#84cc16',
      accent: '#22d3ee',
      background: '#0a0f0d',
      backgroundSecondary: '#111816',
      backgroundTertiary: '#1a2320',
      surface: '#151f1a',
      surfaceHover: '#1a2822',
      text: '#f0fdf4',
      textSecondary: '#a7c4b5',
      textMuted: '#6b8a7a',
      textInverse: '#ffffff',
      border: '#1e2d25',
      borderLight: '#152018',
      shadow: '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
      shadowMd: '0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -1px rgba(0,0,0,0.3)',
      shadowLg: '0 10px 15px -3px rgba(0,0,0,0.4), 0 4px 6px -2px rgba(0,0,0,0.3)',
      gradient: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
      gradientSoft: 'linear-gradient(135deg, rgba(74,222,128,0.1) 0%, rgba(34,197,94,0.05) 100%)',
      success: '#4ade80',
      successLight: 'rgba(74, 222, 128, 0.15)',
      warning: '#fbbf24',
      warningLight: 'rgba(251, 191, 36, 0.15)',
      error: '#f87171',
      errorHover: '#ef4444',
      errorLight: 'rgba(248, 113, 113, 0.15)',
      info: '#60a5fa',
      infoLight: 'rgba(96, 165, 250, 0.15)',
    },
  },
  'ocean-blue': {
    name: 'Ocean Blue',
    icon: 'wave',
    light: {
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      primaryLight: '#dbeafe',
      secondary: '#06b6d4',
      secondaryHover: '#0891b2',
      accent: '#8b5cf6',
      background: '#ffffff',
      backgroundSecondary: '#f0f7ff',
      backgroundTertiary: '#e8f2fc',
      surface: '#ffffff',
      surfaceHover: '#f0f7ff',
      text: '#0f172a',
      textSecondary: '#475569',
      textMuted: '#94a3b8',
      textInverse: '#ffffff',
      border: '#dbeafe',
      borderLight: '#eff6ff',
      shadow: '0 1px 3px rgba(59,130,246,0.08), 0 1px 2px rgba(59,130,246,0.06)',
      shadowMd: '0 4px 6px -1px rgba(59,130,246,0.1), 0 2px 4px -1px rgba(59,130,246,0.06)',
      shadowLg: '0 10px 15px -3px rgba(59,130,246,0.1), 0 4px 6px -2px rgba(59,130,246,0.06)',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      gradientSoft: 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)',
      success: '#16a34a',
      successLight: '#dcfce7',
      warning: '#f59e0b',
      warningLight: '#fef3c7',
      error: '#ef4444',
      errorHover: '#dc2626',
      errorLight: '#fee2e2',
      info: '#3b82f6',
      infoLight: '#dbeafe',
    },
    dark: {
      primary: '#60a5fa',
      primaryHover: '#3b82f6',
      primaryLight: 'rgba(96, 165, 250, 0.15)',
      secondary: '#22d3ee',
      secondaryHover: '#06b6d4',
      accent: '#a78bfa',
      background: '#0a0e1a',
      backgroundSecondary: '#0f1629',
      backgroundTertiary: '#162033',
      surface: '#111827',
      surfaceHover: '#1a2332',
      text: '#f0f5ff',
      textSecondary: '#93b4d4',
      textMuted: '#5a7a9a',
      textInverse: '#ffffff',
      border: '#1e2d4a',
      borderLight: '#152035',
      shadow: '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
      shadowMd: '0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -1px rgba(0,0,0,0.3)',
      shadowLg: '0 10px 15px -3px rgba(0,0,0,0.4), 0 4px 6px -2px rgba(0,0,0,0.3)',
      gradient: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
      gradientSoft: 'linear-gradient(135deg, rgba(96,165,250,0.1) 0%, rgba(59,130,246,0.05) 100%)',
      success: '#4ade80',
      successLight: 'rgba(74, 222, 128, 0.15)',
      warning: '#fbbf24',
      warningLight: 'rgba(251, 191, 36, 0.15)',
      error: '#f87171',
      errorHover: '#ef4444',
      errorLight: 'rgba(248, 113, 113, 0.15)',
      info: '#60a5fa',
      infoLight: 'rgba(96, 165, 250, 0.15)',
    },
  },
  'sunset-orange': {
    name: 'Sunset Orange',
    icon: 'sun',
    light: {
      primary: '#f97316',
      primaryHover: '#ea580c',
      primaryLight: '#fff7ed',
      secondary: '#f59e0b',
      secondaryHover: '#d97706',
      accent: '#ef4444',
      background: '#ffffff',
      backgroundSecondary: '#fefaf6',
      backgroundTertiary: '#fdf3e8',
      surface: '#ffffff',
      surfaceHover: '#fefaf6',
      text: '#1c1917',
      textSecondary: '#57534e',
      textMuted: '#a8a29e',
      textInverse: '#ffffff',
      border: '#fed7aa',
      borderLight: '#fff7ed',
      shadow: '0 1px 3px rgba(249,115,22,0.08), 0 1px 2px rgba(249,115,22,0.06)',
      shadowMd: '0 4px 6px -1px rgba(249,115,22,0.1), 0 2px 4px -1px rgba(249,115,22,0.06)',
      shadowLg: '0 10px 15px -3px rgba(249,115,22,0.1), 0 4px 6px -2px rgba(249,115,22,0.06)',
      gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      gradientSoft: 'linear-gradient(135deg, #fff7ed 0%, #fffbeb 100%)',
      success: '#16a34a',
      successLight: '#dcfce7',
      warning: '#f59e0b',
      warningLight: '#fef3c7',
      error: '#ef4444',
      errorHover: '#dc2626',
      errorLight: '#fee2e2',
      info: '#3b82f6',
      infoLight: '#dbeafe',
    },
    dark: {
      primary: '#fb923c',
      primaryHover: '#f97316',
      primaryLight: 'rgba(251, 146, 60, 0.15)',
      secondary: '#fbbf24',
      secondaryHover: '#f59e0b',
      accent: '#f87171',
      background: '#1a0f0a',
      backgroundSecondary: '#201410',
      backgroundTertiary: '#2a1a14',
      surface: '#2a1a14',
      surfaceHover: '#352018',
      text: '#fef3e8',
      textSecondary: '#c4a882',
      textMuted: '#8a7060',
      textInverse: '#ffffff',
      border: '#3d2518',
      borderLight: '#2a1a14',
      shadow: '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
      shadowMd: '0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -1px rgba(0,0,0,0.3)',
      shadowLg: '0 10px 15px -3px rgba(0,0,0,0.4), 0 4px 6px -2px rgba(0,0,0,0.3)',
      gradient: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
      gradientSoft: 'linear-gradient(135deg, rgba(251,146,60,0.1) 0%, rgba(249,115,22,0.05) 100%)',
      success: '#4ade80',
      successLight: 'rgba(74, 222, 128, 0.15)',
      warning: '#fbbf24',
      warningLight: 'rgba(251, 191, 36, 0.15)',
      error: '#f87171',
      errorHover: '#ef4444',
      errorLight: 'rgba(248, 113, 113, 0.15)',
      info: '#60a5fa',
      infoLight: 'rgba(96, 165, 250, 0.15)',
    },
  },
};

const ThemeContext = createContext(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

function adjustColor(hex, amount) {
  if (!hex || !hex.startsWith('#')) return hex;
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

function lighten(hex, amount = 40) {
  if (!hex || !hex.startsWith('#')) return hex;
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0x00ff) + amount);
  const b = Math.min(255, (num & 0x0000ff) + amount);
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

function applyThemeToCSS(theme) {
  const root = document.documentElement;
  Object.entries(theme).forEach(([key, value]) => {
    const cssKey = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssKey, value);
  });

  // Legacy-compatible variables for old pages
  root.style.setProperty('--mg-primary', theme.primary);
  root.style.setProperty('--mg-primary-light', theme.primaryLight);
  root.style.setProperty('--mg-text', theme.text);
  root.style.setProperty('--mg-text-muted', theme.textMuted);
  root.style.setProperty('--mg-text-secondary', theme.textSecondary);
  root.style.setProperty('--mg-bg-body', theme.background);
  root.style.setProperty('--mg-bg-paper', theme.surface);
  root.style.setProperty('--mg-glass-bg', theme.surface);
  root.style.setProperty('--mg-glass-border', `1px solid ${theme.border}`);
  root.style.setProperty('--mg-shadow', theme.shadowMd);
  root.style.setProperty('--mg-transition', 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)');

  root.style.setProperty('--accent-primary', theme.primary);
  root.style.setProperty('--accent-secondary', theme.secondary);
  root.style.setProperty('--accent-earth', theme.secondary);
  root.style.setProperty('--accent-sky', theme.accent);

  root.style.setProperty('--bg-primary', theme.background);
  root.style.setProperty('--bg-secondary', theme.backgroundSecondary);
  root.style.setProperty('--bg-card', theme.surface);
  root.style.setProperty('--bg-hover', theme.primaryLight);

  root.style.setProperty('--glass-bg', theme.surface);
  root.style.setProperty('--glass-border', `1px solid ${theme.border}`);
  root.style.setProperty('--glass-shadow', theme.shadowLg);
  root.style.setProperty('--backdrop-blur', '12px');

  root.style.setProperty('--text-primary', theme.text);
  root.style.setProperty('--text-secondary', theme.textSecondary);
  root.style.setProperty('--text-muted', theme.textMuted);
  root.style.setProperty('--text-inverse', theme.textInverse);

  root.style.setProperty('--success', theme.success);
  root.style.setProperty('--warning', theme.warning);
  root.style.setProperty('--error', theme.error);
  root.style.setProperty('--info', theme.info);

  root.style.setProperty('--shadow-sm', theme.shadow);
  root.style.setProperty('--shadow-md', theme.shadowMd);
  root.style.setProperty('--shadow-lg', theme.shadowLg);

  root.style.setProperty('--border-light', theme.borderLight);
  root.style.setProperty('--border-medium', theme.border);
  root.style.setProperty('--border-strong', theme.border);

  // Additional design system variables
  root.style.setProperty('--radius-sm', '6px');
  root.style.setProperty('--radius-md', '10px');
  root.style.setProperty('--radius-lg', '16px');
  root.style.setProperty('--radius-xl', '24px');
  root.style.setProperty('--transition-smooth', 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)');
  root.style.setProperty('--background-secondary', theme.backgroundSecondary);

  root.setAttribute('data-theme', theme.isDark ? 'dark' : 'light');
}

function getTheme(preset, mode, customPrimary) {
  const themeDef = THEMES[preset] || THEMES['nature-green'];
  const base = mode === 'dark' ? themeDef.dark : themeDef.light;

  let theme = { ...base, isDark: mode === 'dark' };

  if (customPrimary) {
    const priColor = typeof customPrimary === 'object'
      ? (mode === 'dark' ? customPrimary.dark : customPrimary.light)
      : customPrimary;
    if (priColor) {
      theme = {
        ...theme,
        primary: priColor,
        primaryHover: adjustColor(priColor, -20),
        primaryLight: mode === 'dark' ? `${priColor}26` : lighten(priColor, 35),
        gradient: `linear-gradient(135deg, ${priColor} 0%, ${adjustColor(priColor, -20)} 100%)`,
        gradientSoft: mode === 'dark'
          ? `linear-gradient(135deg, ${priColor}1a 0%, ${priColor}0d 100%)`
          : `linear-gradient(135deg, ${lighten(priColor, 35)} 0%, ${lighten(priColor, 45)} 100%)`,
      };
    }
  }

  return theme;
}

export function ThemeProvider({ children }) {
  const [preset, setPreset] = useState(() => {
    return localStorage.getItem('madaagri-theme-preset') || 'nature-green';
  });

  const [mode, setMode] = useState(() => {
    return localStorage.getItem('madaagri-theme-mode') || 'light';
  });

  const [customPrimary, setCustomPrimary] = useState(() => {
    const saved = localStorage.getItem('madaagri-custom-primary');
    return saved ? JSON.parse(saved) : null;
  });

  const theme = getTheme(preset, mode, customPrimary);

  useEffect(() => {
    applyThemeToCSS(theme);
  }, [theme]);

  const selectTheme = useCallback((presetName) => {
    if (THEMES[presetName]) {
      setPreset(presetName);
      localStorage.setItem('madaagri-theme-preset', presetName);
    }
  }, []);

  const toggleMode = useCallback(() => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('madaagri-theme-mode', newMode);
  }, [mode]);

  const setModeDirect = useCallback((newMode) => {
    setMode(newMode);
    localStorage.setItem('madaagri-theme-mode', newMode);
  }, []);

  const setPrimaryColor = useCallback((color) => {
    if (!color) {
      setCustomPrimary(null);
      localStorage.removeItem('madaagri-custom-primary');
    } else {
      const value = { light: color, dark: adjustColor(color, 20) };
      setCustomPrimary(value);
      localStorage.setItem('madaagri-custom-primary', JSON.stringify(value));
    }
  }, []);

  return (
    <ThemeContext.Provider value={{
      theme,
      preset,
      mode,
      themes: THEMES,
      customPrimary,
      selectTheme,
      toggleMode,
      setMode: setModeDirect,
      setPrimaryColor,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export { THEMES };
