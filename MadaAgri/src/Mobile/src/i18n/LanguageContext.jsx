import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { changeLanguage, loadSavedLanguage } from './index';
import { LANGUAGE_STORAGE_KEY, DEFAULT_LANGUAGE } from './constants';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const { i18n: i18nInstance } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(DEFAULT_LANGUAGE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const lang = await loadSavedLanguage();
      setCurrentLanguage(lang);
      setIsLoading(false);
    })();
  }, []);

  const handleChangeLanguage = useCallback(async (langCode) => {
    if (!langCode || langCode === currentLanguage) return;
    await changeLanguage(langCode);
    setCurrentLanguage(langCode);
  }, [currentLanguage]);

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage: handleChangeLanguage, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
