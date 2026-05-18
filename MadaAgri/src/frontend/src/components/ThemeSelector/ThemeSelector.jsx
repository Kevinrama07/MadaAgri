import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { FiSun, FiMoon, FiCheck, FiSettings, FiX } from 'react-icons/fi';
import styles from './ThemeSelector.module.css';

export function ThemeSelector({ className = '' }) {
  const { theme, preset, presets, isCustom, selectPreset, setCustomTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customPrimary, setCustomPrimary] = useState(theme.primary);
  const [customSecondary, setCustomSecondary] = useState(theme.secondary);

  const isDark = theme.mode === 'dark';

  const handleCustomSave = () => {
    setCustomTheme({
      primary: customPrimary,
      primaryHover: adjustColor(customPrimary, -10),
      primaryLight: adjustColor(customPrimary, 40),
      secondary: customSecondary,
      secondaryHover: adjustColor(customSecondary, -10),
      mode: isDark ? 'dark' : 'light',
    });
    setShowCustom(false);
  };

  const adjustColor = (hex, amount) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
  };

  return (
    <div className={`${styles.wrapper} ${className}`}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Theme settings"
      >
        <FiSettings size={18} />
      </button>

      {isOpen && (
        <>
          <div className={styles.backdrop} onClick={() => { setIsOpen(false); setShowCustom(false); }} />
          <div className={styles.panel}>
            <div className={styles.header}>
              <h3>Theme</h3>
              <button className={styles.closeBtn} onClick={() => { setIsOpen(false); setShowCustom(false); }}>
                <FiX size={18} />
              </button>
            </div>

            {!showCustom ? (
              <>
                <div className={styles.section}>
                  <p className={styles.sectionLabel}>Presets</p>
                  <div className={styles.presetGrid}>
                    {Object.entries(presets).map(([key, p]) => (
                      <button
                        key={key}
                        className={`${styles.presetBtn} ${preset === key && !isCustom ? styles.active : ''}`}
                        onClick={() => selectPreset(key)}
                      >
                        <div className={styles.presetPreview}>
                          <div className={styles.presetPrimary} style={{ background: p.primary }} />
                          <div className={styles.presetSecondary} style={{ background: p.secondary }} />
                          <div className={styles.presetBg} style={{ background: p.background }} />
                        </div>
                        <span className={styles.presetName}>{p.name}</span>
                        {preset === key && !isCustom && (
                          <div className={styles.presetCheck}>
                            <FiCheck size={12} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.section}>
                  <button
                    className={styles.customBtn}
                    onClick={() => setShowCustom(true)}
                  >
                    <FiSettings size={16} />
                    <span>Custom colors</span>
                  </button>
                </div>

                <div className={styles.section}>
                  <button
                    className={styles.modeToggle}
                    onClick={() => {
                      const newMode = isDark ? 'light' : 'dark';
                      setCustomTheme({
                        ...theme,
                        mode: newMode,
                        background: newMode === 'dark' ? '#0a0f0d' : '#ffffff',
                        backgroundSecondary: newMode === 'dark' ? '#111816' : '#f8faf9',
                        surface: newMode === 'dark' ? '#151f1a' : '#ffffff',
                        text: newMode === 'dark' ? '#f0fdf4' : '#0f172a',
                        textSecondary: newMode === 'dark' ? '#a7c4b5' : '#475569',
                        textMuted: newMode === 'dark' ? '#6b8a7a' : '#94a3b8',
                        border: newMode === 'dark' ? '#1e2d25' : '#e2e8f0',
                      });
                    }}
                  >
                    {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
                    <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.customPanel}>
                <button className={styles.backBtn} onClick={() => setShowCustom(false)}>
                  Back
                </button>
                <div className={styles.colorField}>
                  <label>Primary color</label>
                  <div className={styles.colorPicker}>
                    <input
                      type="color"
                      value={customPrimary}
                      onChange={(e) => setCustomPrimary(e.target.value)}
                    />
                    <span>{customPrimary}</span>
                  </div>
                </div>
                <div className={styles.colorField}>
                  <label>Secondary color</label>
                  <div className={styles.colorPicker}>
                    <input
                      type="color"
                      value={customSecondary}
                      onChange={(e) => setCustomSecondary(e.target.value)}
                    />
                    <span>{customSecondary}</span>
                  </div>
                </div>
                <button className={styles.saveBtn} onClick={handleCustomSave}>
                  Apply
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
