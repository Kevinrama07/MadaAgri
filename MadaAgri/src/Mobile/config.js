export const API_CONFIG = {
  // Émulateur Android
  ANDROID_API_BASE: process.env.EXPO_PUBLIC_ANDROID_EMULATOR_IP || 'http://10.0.2.2:4000',
  
  // Appareils physiques - UPDATE avec votre IP réseau
  ANDROID_DEVICE_IP: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.88.3:4000',
  
  // Fallbacks locaux
  DEFAULT_API_BASE: 'http://localhost:4000',
  SOCKET_BASE: process.env.EXPO_PUBLIC_ANDROID_EMULATOR_IP || 'http://10.0.2.2:4000',
  SOCKET_DEFAULT: 'http://localhost:4000',
};

export const APP_CONFIG = {
  TIMEOUT: 30000, // 30 secondes pour les connexions réseau lentes
  RETRY_ATTEMPTS: 3,
  DEBUG: __DEV__,
  NETWORK_DEBUG: __DEV__,
};
