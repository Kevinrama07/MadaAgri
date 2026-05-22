import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { SUPPORTED_LANGUAGES, LANGUAGE_STORAGE_KEY } from '../constants';
import styles from './LanguageSwitcher.module.css';

export default function LanguageSwitcher({ variant = 'default', className }) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === i18n.language) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChangeLanguage = async (langCode) => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, langCode);
      document.documentElement.lang = langCode;
      await i18n.changeLanguage(langCode);
      setIsOpen(false);
    } catch (err) {
      console.error('Error changing language:', err);
    }
  };

  return (
    <div className={clsx(styles['language-switcher'], className)} ref={dropdownRef}>
      <button
        className={styles['switcher-button']}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Changer la langue"
        type="button"
      >
        <span className={styles.flag}>{currentLang.flag}</span>
        <span className={styles.label}>{currentLang.nativeName}</span>
        <span className={clsx(styles.chevron, isOpen && styles.open)}>▼</span>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              className={clsx(
                styles['language-option'],
                lang.code === i18n.language && styles.active
              )}
              onClick={() => handleChangeLanguage(lang.code)}
              type="button"
            >
              <span className={styles['option-flag']}>{lang.flag}</span>
              <span className={styles['option-name']}>{lang.nativeName}</span>
              <span className={clsx(
                styles['option-check'],
                lang.code === i18n.language && styles.visible
              )}>✓</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
