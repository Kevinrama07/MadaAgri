import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

function getApiUrl() {
  // 1️⃣ Vérifier la variable d'environnement
  if (process.env.EXPO_PUBLIC_API_URL) {
    console.log('[API] URL from EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
    return process.env.EXPO_PUBLIC_API_URL;
  }

  let apiUrl = 'http://localhost:4000/api';

  if (Platform.OS === 'android') {
    // 2️⃣ Android - détecter si on est en Expo Go
    try {
      const manifest = Constants.manifest || Constants.expoConfig;
      if (manifest?.debuggerHost) {
        const host = String(manifest.debuggerHost).split(':')[0];
        if (host && host !== 'localhost' && host !== '127.0.0.1') {
          // On est en mode dev avec Expo Go
          apiUrl = `http://${host}:4000/api`;
          console.log('[API] Detected host from Expo:', host);
          return apiUrl;
        }
      }
    } catch (e) {
      console.warn('[API] Could not detect Expo host:', e.message);
    }

    // 3️⃣ Fallback: Try local device IP first, then Android Emulator
    // Import config to get the device IP
    try {
      const { API_CONFIG } = require('../../config');
      apiUrl = API_CONFIG.ANDROID_DEVICE_IP + '/api';
      console.log('[API] Using Android Device IP:', API_CONFIG.ANDROID_DEVICE_IP);
    } catch (e) {
      apiUrl = 'http://10.0.2.2:4000/api';
      console.log('[API] Using Android Emulator address (10.0.2.2)');
    }
  } else if (Platform.OS === 'ios') {
    apiUrl = 'http://localhost:4000/api';
    console.log('[API] Using iOS address');
  } else if (Platform.OS === 'web') {
    apiUrl = 'http://localhost:4000/api';
    console.log('[API] Using Web address');
  }

  return apiUrl;
}

const API_URL = getApiUrl();

console.log(`
╔══════════════════════════════════════════════╗
║           API CLIENT INITIALIZED             ║
╠══════════════════════════════════════════════╣
║ Platform: ${Platform.OS.padEnd(33)}  ║
║ API URL: ${API_URL.padEnd(36)}║
╚══════════════════════════════════════════════╝
`);

// ============================================
// 🔌 CONFIGURATION AXIOS
// ============================================

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30s timeout
  headers: {
    'Content-Type': 'application/json',
    'X-Platform': Platform.OS,
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // 🔍 AGGRESSIVE LOGGING
      const fullUrl = `${config.baseURL || apiClient.defaults.baseURL}${config.url}`;
      console.log(`
╔═══════════════════════════════════════════╗
║ 🌐 REQUEST STARTING                       ║
╠═══════════════════════════════════════════╣
║ Method: ${config.method?.toUpperCase().padEnd(30)}║
║ URL: ${fullUrl.padEnd(34)}║
║ Timeout: ${(config.timeout || 30000).toString().padEnd(28)}ms║
║ Full Path: ${(config.url || 'none').padEnd(27)}║
║ BaseURL: ${(config.baseURL || 'none').padEnd(27)}║
╚═══════════════════════════════════════════╝
      `);
      
      // Log headers
      const headerKeys = Object.keys(config.headers).join(', ');
      console.log('[REQUEST] Headers:', headerKeys);
      
      // Mark request start time
      config.metadata = { startTime: Date.now() };
    } catch (error) {
      console.error('[API] Error in request interceptor:', error);
    }
    return config;
  },
  (error) => {
    console.error('[API] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ============================================
// 📥 INTERCEPTEUR RÉPONSE
// ============================================

apiClient.interceptors.response.use(
  (response) => {
    const duration = response.config.metadata ? Date.now() - response.config.metadata.startTime : '?';
    console.log(`
╔═══════════════════════════════════════════╗
║ ✅ RESPONSE RECEIVED                      ║
╠═══════════════════════════════════════════╣
║ Status: ${response.status.toString().padEnd(35)}║
║ Duration: ${duration.toString().padEnd(32)}ms║
║ Method: ${response.config.method?.toUpperCase().padEnd(31)}║
║ URL: ${response.config.url?.padEnd(34)}║
║ Content-Type: ${(response.headers['content-type'] || 'none').padEnd(25)}║
╚═══════════════════════════════════════════╝
    `);
    return response;
  },
  async (error) => {
    const duration = error.config?.metadata ? Date.now() - error.config.metadata.startTime : '?';
    
    console.error(`
╔═══════════════════════════════════════════╗
║ ❌ ERROR OCCURRED                         ║
╠═══════════════════════════════════════════╣
║ Error Type: ${(error.code || 'Unknown').padEnd(28)}║
║ Duration: ${duration.toString().padEnd(32)}ms║
║ HTTP Status: ${(error.response?.status || 'None').toString().padEnd(26)}║
║ Method: ${(error.config?.method?.toUpperCase() || 'Unknown').padEnd(31)}║
║ URL: ${(error.config?.url || 'Unknown').padEnd(34)}║
╚═══════════════════════════════════════════╝
    `);

    // Détection du type d'erreur exact
    if (error.code === 'ECONNABORTED') {
      console.error('⏱️  TIMEOUT ERROR - Request took longer than configured timeout');
      error.message = `Timeout après ${error.config?.timeout || 30000}ms. Vérifiez que le backend est démarré sur ${API_URL}`;
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔴 CONNECTION REFUSED - Backend is not listening or port is wrong');
      error.message = `Connexion refusée. Le backend n'écoute peut-être pas sur ${API_URL}`;
    } else if (error.code === 'ENOTFOUND') {
      console.error('🔴 DNS ERROR - Cannot resolve hostname');
      error.message = `Impossible de résoudre le host. Vérifiez l'URL: ${API_URL}`;
    } else if (error.code === 'ERR_NETWORK') {
      console.error('🔴 NETWORK ERROR - Network issue detected');
      error.message = `Erreur réseau. Vérifiez votre WiFi et que le backend est sur ${API_URL}`;
    } else if (!error.response) {
      console.error('🔴 NETWORK ERROR - No response from server');
      console.error(`   Tentative de connexion à: ${API_URL}`);
      console.error(`   Plateforme: ${Platform.OS}`);
      console.error(`   Code d'erreur: ${error.code}`);
      console.error(`   Message: ${error.message}`);
      error.message = `Erreur réseau: Impossible de joindre le backend sur ${API_URL}`;
    }

    // Erreur d'authentification
    if (error.response?.status === 401) {
      console.error('[🔐 AUTH ERROR] Token expired or invalid');
      await AsyncStorage.removeItem('authToken');
    }

    // Log final consolidé
    const responsePreview = error.response?.data 
      ? JSON.stringify(error.response.data).substring(0, 100) 
      : 'No response data';
    
    console.error(`
[ERROR SUMMARY]
  Code: ${error.code || 'Unknown'}
  Message: ${error.message}
  Response: ${responsePreview}
  isAxiosError: ${error.isAxiosError}
  BaseURL: ${apiClient.defaults.baseURL}
    `);

    return Promise.reject(error);
  }
);

// ============================================
// 🔧 UTILITAIRES
// ============================================

/**
 * Obtenir l'URL actuelle de l'API (pour debug)
 */
export function getApiBaseUrl() {
  return API_URL;
}

/**
 * Obtenir les infos de debug
 */
export function getApiDebugInfo() {
  return {
    apiUrl: API_URL,
    platform: Platform.OS,
    timeout: apiClient.defaults.timeout,
  };
}

/**
 * Tester la connexion avec le backend
 */
export async function testConnection() {
  try {
    const response = await apiClient.get('/health');
    console.log('[✅ Connection OK]', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[❌ Connection Failed]', error.message);
    return { success: false, error: error.message };
  }
}

export default apiClient;
