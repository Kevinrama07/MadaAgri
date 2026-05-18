import { useTheme } from '../contexts/ThemeContext';
import styles from './ThemeSelector.module.css';

export function ThemeSelector({ onClose }) {
  const { theme, preset, themes, selectTheme, mode, setMode } = useTheme();

  return (
    <div className={styles.dropdown} onClick={(e) => e.stopPropagation()}>
      <div className={styles.header}>
        <h3 className={styles.title}>Appearance</h3>
        {onClose && (
          <button className={styles.closeBtn} onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className={styles.modeToggle}>
        <button
          className={`${styles.modeBtn} ${mode === 'light' ? styles.active : ''}`}
          onClick={() => setMode('light')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
          Light
        </button>
        <button
          className={`${styles.modeBtn} ${mode === 'dark' ? styles.active : ''}`}
          onClick={() => setMode('dark')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
          Dark
        </button>
      </div>

      <div className={styles.themes}>
        <p className={styles.label}>Themes</p>
        <div className={styles.themeGrid}>
          {themes && Object.entries(themes).map(([key, t]) => (
            <button
              key={key}
              className={`${styles.themeBtn} ${preset === key ? styles.selected : ''}`}
              onClick={() => selectTheme(key)}
            >
              <div className={styles.themePreview}>
                <div className={styles.themeColors}>
                  <span style={{ background: t[mode].primary }} />
                  <span style={{ background: t[mode].secondary }} />
                  <span style={{ background: t[mode].accent }} />
                </div>
                <span className={styles.themeBg} style={{ background: t[mode].background }} />
              </div>
              <span className={styles.themeName}>{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.info}>
        <span className={styles.infoLabel}>Current</span>
        <span className={styles.infoValue}>
          {themes && themes[preset] ? themes[preset].name : 'Default'} · {mode === 'light' ? 'Light' : 'Dark'}
        </span>
      </div>
    </div>
  );
}
