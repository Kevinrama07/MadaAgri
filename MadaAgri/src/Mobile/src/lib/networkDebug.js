import * as api from './api';
import apiClient from '../services/apiClient';

export function showNetworkInfo() {
  const debugInfo = api.getApiDebugInfo();
  
  const info = `
╔════════════════════════════════════════════╗
║     🌐 INFORMATIONS RÉSEAU & API           ║
╠════════════════════════════════════════════╣
║ API Base:        ${debugInfo.apiBase.padEnd(33)}║
║ Platform:        ${debugInfo.platform.padEnd(33)}║
║ Timeout:         ${debugInfo.timeout}ms${' '.repeat(28 - debugInfo.timeout.toString().length)}║
║────────────────────────────────────────────║
║ Android Em:      ${debugInfo.config.androidEmulator.padEnd(33)}║
║ Android Dev:     ${debugInfo.config.androidDevice.padEnd(33)}║
║ Localhost:       ${debugInfo.config.localhost.padEnd(33)}║
╚════════════════════════════════════════════╝
  `;
  
  console.log(info);
  return debugInfo;
}

export async function testAllConnections() {
  console.log('🧪 Starting comprehensive network tests...\n');
  
  const results = {
    health: false,
    apiClient: false,
    endpoints: {},
  };

  // Test 1: Health endpoint
  console.log('📡 Test 1: Health endpoint');
  try {
    const response = await api.get('/health');
    results.health = true;
    console.log('✅ Health check passed:', response);
  } catch (e) {
    results.health = false;
    console.error('❌ Health check failed:', e.message);
  }

  // Test 2: API Client health
  console.log('\n📡 Test 2: API Client health');
  try {
    const response = await apiClient.get('/health');
    results.apiClient = true;
    console.log('✅ API Client health passed:', response.data);
  } catch (e) {
    results.apiClient = false;
    console.error('❌ API Client health failed:', e.message);
  }

  // Summary
  console.log('\n═════════════════════════════════════════════');
  console.log('📊 Test Summary:');
  console.log('═════════════════════════════════════════════');
  console.log(`Health Endpoint: ${results.health ? '✅' : '❌'}`);
  console.log(`API Client:      ${results.apiClient ? '✅' : '❌'}`);
  console.log(`Overall:         ${(results.health && results.apiClient) ? '✅ PASS' : '❌ FAIL'}`);
  console.log('═════════════════════════════════════════════\n');

  return results;
}

export async function testApiEndpoint(path, method = 'GET', data = null) {
  console.log(`
╔════════════════════════════════════════════╗
║ 🧪 TESTING ENDPOINT                        ║
╠════════════════════════════════════════════╣
║ Method:  ${method.padEnd(35)}║
║ Path:    ${path.padEnd(35)}║
║ Data:    ${data ? 'Yes' : 'No'.padEnd(34)}║
╚════════════════════════════════════════════╝
  `);

  try {
    let response;
    switch (method.toUpperCase()) {
      case 'GET':
        response = await api.get(path);
        break;
      case 'POST':
        response = await api.post(path, data);
        break;
      case 'PUT':
        response = await api.put(path, data);
        break;
      case 'DELETE':
        response = await api.del(path);
        break;
      default:
        throw new Error(`Unknown method: ${method}`);
    }

    console.log('✅ Success response:', response);
    return { success: true, data: response };
  } catch (error) {
    console.error('❌ Failed response:', error);
    return { success: false, error: error.message, details: error };
  }
}

// ============================================
// 🔐 TESTER AUTHENTIFICATION
// ============================================

export async function testLogin(email = 'test@example.com', password = 'password123') {
  console.log(`
╔════════════════════════════════════════════╗
║ 🔐 TESTING LOGIN                           ║
╠════════════════════════════════════════════╣
║ Email:   ${email.padEnd(35)}║
║ Password: ${password.padEnd(33)}║
╚════════════════════════════════════════════╝
  `);

  try {
    const response = await api.login(email, password);
    console.log('✅ Login successful:', response);
    return { success: true, data: response };
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    console.error('Full error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// 📊 AFFICHER STATISTIQUES
// ============================================

export function getNetworkStats() {
  return {
    timestamp: new Date().toISOString(),
    apiBase: api.getApiBaseUrl(),
    debugInfo: api.getApiDebugInfo(),
  };
}

// ============================================
// 🔧 UTILITAIRES
// ============================================

export function logNetworkConfig() {
  const info = api.getApiDebugInfo();
  console.table(info);
}

export async function checkBackendRunning() {
  try {
    await fetch(api.getApiBaseUrl().replace('/api', '/health'), {
      timeout: 5000,
    });
    return { running: true, url: api.getApiBaseUrl() };
  } catch (e) {
    return { running: false, error: e.message };
  }
}

// ============================================
// 🎯 QUICK TESTS
// ============================================

export const QuickTests = {
  async health() {
    return testApiEndpoint('/health', 'GET');
  },

  async login(email = 'test@example.com', password = 'password123') {
    return testLogin(email, password);
  },

  async getProducts() {
    return testApiEndpoint('/products', 'GET');
  },

  async testAll() {
    await showNetworkInfo();
    await testAllConnections();
  },
};

export default {
  showNetworkInfo,
  testAllConnections,
  testApiEndpoint,
  testLogin,
  getNetworkStats,
  logNetworkConfig,
  checkBackendRunning,
  QuickTests,
};
