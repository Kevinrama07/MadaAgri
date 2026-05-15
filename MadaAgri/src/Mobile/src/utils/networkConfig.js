import { Platform } from 'react-native';
import { ENV } from '../config/environment';

/**
 * Détecte et retourne l'URL API appropriée selon le contexte
 * Priorité: 1. Variables env 2. Émulateur Android 3. Appareil physique
 */
export const getAPIUrl = () => {
  // Si défini explicitement via variable d'environnement
  if (ENV.API_URL && !ENV.API_URL.includes('192.168.88.3')) {
    return ENV.API_URL;
  }

  // Pour les émulateurs Android
  if (Platform.OS === 'android' && ENV.ANDROID_EMULATOR_IP) {
    return `http://${ENV.ANDROID_EMULATOR_IP}/api`;
  }

  // Fallback: utiliser la variable d'environnement
  return ENV.API_URL;
};

export const getSocketUrl = () => {
  // Si défini explicitement via variable d'environnement
  if (ENV.SOCKET_URL && !ENV.SOCKET_URL.includes('192.168.88.3')) {
    return ENV.SOCKET_URL;
  }

  // Fallback
  return ENV.SOCKET_URL;
};

/**
 * Utilitaire pour afficher les infos de connexion en debug
 */
export const logNetworkConfig = () => {
  if (ENV.DEBUG) {
    console.log('🌐 Network Configuration:', {
      API_URL: getAPIUrl(),
      SOCKET_URL: getSocketUrl(),
      Platform: Platform.OS,
    });
  }
};
