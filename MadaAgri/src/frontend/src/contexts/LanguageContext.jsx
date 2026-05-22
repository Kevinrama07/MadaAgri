import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { dataApi } from '../lib/api';
import { useAuth } from './ContextAuthentification';
import { LANGUAGE_STORAGE_KEY, DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '../i18n/constants';

const LanguageContext = createContext(undefined);

export function LanguageProvider({ children }) {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [isLanguageLoaded, setIsLanguageLoaded] = useState(false);

  const syncLanguageToBackend = useCallback(async (langCode) => {
    if (!user?.id) return;
    try {
      await dataApi.updateUserProfile({ preferredLanguage: langCode });
    } catch (err) {
      console.error('Failed to sync language to backend:', err);
    }
  }, [user]);

  const changeLanguage = useCallback(async (langCode) => {
    if (!langCode) return;
    localStorage.setItem(LANGUAGE_STORAGE_KEY, langCode);
    document.documentElement.lang = langCode;
    await i18n.changeLanguage(langCode);
    syncLanguageToBackend(langCode);
  }, [i18n, syncLanguageToBackend]);

  const resolveLanguage = useCallback(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.find(l => l.code === stored)) {
      return stored;
    }

    if (user?.language && SUPPORTED_LANGUAGES.find(l => l.code === user.language)) {
      return user.language;
    }

    const browserLang = navigator.language?.split('-')[0];
    if (browserLang && SUPPORTED_LANGUAGES.find(l => l.code === browserLang)) {
      return browserLang;
    }

    return DEFAULT_LANGUAGE;
  }, [user]);

  useEffect(() => {
    const lang = resolveLanguage();
    if (lang && lang !== i18n.language) {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      document.documentElement.lang = lang;
      i18n.changeLanguage(lang);
    }
    if (!isLanguageLoaded) {
      setIsLanguageLoaded(true);
    }
  }, [user, i18n, resolveLanguage, isLanguageLoaded]);

  const value = {
    currentLanguage: i18n.language,
    changeLanguage,
    isLanguageLoaded,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
