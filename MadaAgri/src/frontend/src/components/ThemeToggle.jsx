import { useState, useEffect } from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import clsx from 'clsx';
import styles from '../styles/ui/ThemeToggle.module.css';

export default function ThemeToggle({ size = 'md', showLabel = false, className = '' }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme-mode');
    const docTheme = document.documentElement.getAttribute('data-theme');
    return (saved === 'dark') || (docTheme === 'dark') || true;
  });

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme-mode', newTheme);
    setIsDark(!isDark);
  };

  return (
    <button 
      className={clsx(
        styles['theme-toggle-btn'],
        styles[`theme-toggle-${size}`],
        className
      )} 
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Mode ${isDark ? 'clair' : 'sombre'}`}
    >
      <div className={styles['theme-toggle-icon']}>
        {isDark ? (
          <FiMoon size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />
        ) : (
          <FiSun size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />
        )}
      </div>
      {showLabel && (
        <span className={styles['theme-toggle-label']}>
          {isDark ? 'Sombre' : 'Clair'}
        </span>
      )}
    </button>
  );
}