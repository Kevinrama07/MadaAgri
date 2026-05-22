import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LANGUAGE, NAMESPACES } from './constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

import frCommon from './locales/fr/common.json';
import frAuth from './locales/fr/auth.json';
import frNavigation from './locales/fr/navigation.json';
import frDashboard from './locales/fr/dashboard.json';
import frMarketplace from './locales/fr/marketplace.json';
import frSettings from './locales/fr/settings.json';
import frAssistant from './locales/fr/assistant.json';

import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enNavigation from './locales/en/navigation.json';
import enDashboard from './locales/en/dashboard.json';
import enMarketplace from './locales/en/marketplace.json';
import enSettings from './locales/en/settings.json';
import enAssistant from './locales/en/assistant.json';

import mgCommon from './locales/mg/common.json';
import mgAuth from './locales/mg/auth.json';
import mgNavigation from './locales/mg/navigation.json';
import mgDashboard from './locales/mg/dashboard.json';
import mgMarketplace from './locales/mg/marketplace.json';
import mgSettings from './locales/mg/settings.json';
import mgAssistant from './locales/mg/assistant.json';

const resources = {
  fr: { common: frCommon, auth: frAuth, navigation: frNavigation, dashboard: frDashboard, marketplace: frMarketplace, settings: frSettings, assistant: frAssistant },
  en: { common: enCommon, auth: enAuth, navigation: enNavigation, dashboard: enDashboard, marketplace: enMarketplace, settings: enSettings, assistant: enAssistant },
  mg: { common: mgCommon, auth: mgAuth, navigation: mgNavigation, dashboard: mgDashboard, marketplace: mgMarketplace, settings: mgSettings, assistant: mgAssistant },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    debug: false,
    ns: NAMESPACES,
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    load: 'languageOnly',
    returnObjects: true,
    react: { useSuspense: false },
  });

export const changeLanguage = async (langCode) => {
  if (!langCode) return;
  await AsyncStorage.setItem('madaagri_language', langCode);
  await i18n.changeLanguage(langCode);
};

export const loadSavedLanguage = async () => {
  try {
    const saved = await AsyncStorage.getItem('madaagri_language');
    if (saved) {
      await i18n.changeLanguage(saved);
      return saved;
    }
  } catch (_) {}
  return DEFAULT_LANGUAGE;
};

export default i18n;
