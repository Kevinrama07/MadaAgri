import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from './api';

const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',
  THEME: 'theme',
  LANGUAGE: 'language',
  OFFLINE_QUEUE: 'offlineQueue',
  LAST_SYNC: 'lastSync',
};

export const storageService = {
  // Auth Storage
  saveAuthToken: async (token) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    } catch (error) {
      console.error('Error saving auth token:', error);
    }
  },

  getAuthToken: async () => {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  },

  removeAuthToken: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error removing auth token:', error);
    }
  },

  // User Data Storage
  saveUserData: async (userData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  },

  getUserData: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  removeUserData: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    } catch (error) {
      console.error('Error removing user data:', error);
    }
  },

  // Theme Storage
  saveTheme: async (theme) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  },

  getTheme: async () => {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.THEME) || 'light';
    } catch (error) {
      console.error('Error getting theme:', error);
      return 'light';
    }
  },

  // Language Storage
  saveLanguage: async (language) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  },

  getLanguage: async () => {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'fr';
    } catch (error) {
      console.error('Error getting language:', error);
      return 'fr';
    }
  },

  // Offline Queue
  saveOfflineAction: async (action) => {
    try {
      const queue = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      const actions = queue ? JSON.parse(queue) : [];
      actions.push({ ...action, timestamp: Date.now() });
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(actions));
    } catch (error) {
      console.error('Error saving offline action:', error);
    }
  },

  getOfflineQueue: async () => {
    try {
      const queue = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Error getting offline queue:', error);
      return [];
    }
  },

  clearOfflineQueue: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
    } catch (error) {
      console.error('Error clearing offline queue:', error);
    }
  },

  // Last Sync
  saveLastSync: async (timestamp) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp.toString());
    } catch (error) {
      console.error('Error saving last sync:', error);
    }
  },

  getLastSync: async () => {
    try {
      const sync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return sync ? parseInt(sync) : 0;
    } catch (error) {
      console.error('Error getting last sync:', error);
      return 0;
    }
  },

  // Clear all
  clearAll: async () => {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};

export default storageService;
