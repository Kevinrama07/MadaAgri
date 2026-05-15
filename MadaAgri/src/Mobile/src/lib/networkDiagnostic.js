import { Platform } from 'react-native';
import Constants from 'expo-constants';
import axios from 'axios';
import apiClient from '../services/apiClient';
import { API_CONFIG } from '../../config';

export const NetworkDiagnostic = {

  showCurrentApiUrl() {
    console.log(`
╔════════════════════════════════════════════╗
║ 🔍 API URL CONFIGURATION                   ║
╠════════════════════════════════════════════╣
║ Platform: ${Platform.OS.padEnd(34)}║
║ API Base: ${apiClient.defaults.baseURL?.padEnd(33)}║
║────────────────────────────────────────────║
║ Android Emulator: ${API_CONFIG.ANDROID_API_BASE.padEnd(25)}║
║ Android Device:   ${API_CONFIG.ANDROID_DEVICE_IP.padEnd(25)}║
║ Localhost:        ${API_CONFIG.DEFAULT_API_BASE.padEnd(25)}║
╚════════════════════════════════════════════╝
    `);
  },

  /**
   * Tester la connexion basique (sanity check)
   */
  async testBasicConnectivity() {
    console.log('📡 Test 1: Basic Connectivity Check...');
    
    const baseUrl = apiClient.defaults.baseURL;
    const healthUrl = baseUrl.replace('/api', '/health');
    
    try {
      const response = await axios.get(healthUrl, {
        timeout: 5000,
        headers: {
          'User-Agent': 'MadaAgri-Mobile-Diagnostic',
        },
      });
      
      console.log('✅ Backend is reachable!');
      console.log('Response:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Backend is NOT reachable');
      console.error('Error:', error.message);
      
      if (error.code === 'ECONNABORTED') {
        console.error('→ TIMEOUT: Backend didn\'t respond in time');
      } else if (error.code === 'ENOTFOUND') {
        console.error('→ DNS ERROR: Could not resolve hostname');
      } else if (error.code === 'ECONNREFUSED') {
        console.error('→ CONNECTION REFUSED: Backend not listening on this port');
      } else if (error.message?.includes('Network Error')) {
        console.error('→ NETWORK ERROR: Check WiFi, Firewall, or IP address');
      }
      
      return { success: false, error: error.message, code: error.code };
    }
  },

  /**
   * Tester avec différentes URLs (fallback)
   */
  async testMultipleUrls() {
    console.log('📡 Test 2: Testing Multiple URLs...');
    
    const urlsToTest = [
      { name: 'Android Emulator', url: 'http://10.0.2.2:4000/health' },
      { name: 'Localhost', url: 'http://localhost:4000/health' },
      { name: 'Android Device (configurable)', url: `${API_CONFIG.ANDROID_DEVICE_IP}/health` },
    ];

    const results = [];
    
    for (const { name, url } of urlsToTest) {
      try {
        console.log(`  Testing ${name}: ${url}...`);
        const response = await axios.get(url, {
          timeout: 3000,
          validateStatus: () => true, // Accept any status
        });
        
        results.push({
          name,
          url,
          status: response.status,
          success: response.status < 400,
          message: '✅ OK',
        });
        console.log(`    ✅ ${response.status}`);
      } catch (error) {
        results.push({
          name,
          url,
          success: false,
          message: `❌ ${error.code || error.message}`,
        });
        console.log(`    ❌ ${error.code || error.message}`);
      }
    }
    
    return results;
  },

  /**
   * Vérifier la détection Expo Go
   */
  async checkExpoDetection() {
    console.log('📡 Test 3: Expo Go Detection...');
    
    try {
      const manifest = Constants.manifest || Constants.expoConfig;
      
      if (manifest?.debuggerHost) {
        const host = String(manifest.debuggerHost).split(':')[0];
        console.log(`Debugger Host detected: ${host}`);
        console.log(`This would resolve to: http://${host}:4000/api`);
        
        return {
          success: true,
          debuggerHost: host,
          detectedUrl: `http://${host}:4000/api`,
        };
      } else {
        console.log('No Expo debuggerHost found');
        return { success: false, message: 'No debuggerHost' };
      }
    } catch (error) {
      console.error('Error checking Expo detection:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Diagnostic complet
   */
  async runFullDiagnostic() {
    console.log(`
╔════════════════════════════════════════════╗
║ 🔍 FULL NETWORK DIAGNOSTIC                 ║
║ Time: ${new Date().toLocaleTimeString().padEnd(28)}║
╚════════════════════════════════════════════╝
    `);

    // Test 1: Show config
    this.showCurrentApiUrl();
    
    // Test 2: Check Expo detection
    const expoDetection = await this.checkExpoDetection();
    if (expoDetection.success) {
      console.log(`
📍 Expo Go is detected!
   Your PC IP detected as: ${expoDetection.debuggerHost}
   Using URL: ${expoDetection.detectedUrl}
      `);
    }
    
    // Test 3: Basic connectivity
    const basicTest = await this.testBasicConnectivity();
    
    // Test 4: Multiple URLs
    const multiUrls = await this.testMultipleUrls();
    
    // Résumé
    console.log(`
╔════════════════════════════════════════════╗
║ 📊 DIAGNOSTIC SUMMARY                      ║
╠════════════════════════════════════════════╣
║ Platform:         ${Platform.OS.padEnd(28)}║
║ Current API URL:  ${apiClient.defaults.baseURL?.slice(-20).padEnd(28)}║
║ Backend Response: ${basicTest.success ? '✅ YES' : '❌ NO'.padEnd(20)}║
║────────────────────────────────────────────║
    `);

    // Show working URLs
    const workingUrls = multiUrls.filter(r => r.success);
    if (workingUrls.length > 0) {
      console.log('✅ Working URLs:');
      workingUrls.forEach(r => {
        console.log(`   - ${r.name}: ${r.url}`);
      });
    } else {
      console.log('❌ NO working URLs found!');
      console.log('   Please check:');
      console.log('   1. Is the backend running? (npm run dev)');
      console.log('   2. Is Node.js allowed in Windows Firewall?');
      console.log('   3. Are you on the same WiFi network?');
      console.log('   4. Is the IP address in config.js correct?');
    }

    console.log('╚════════════════════════════════════════════╝\n');

    return {
      platform: Platform.OS,
      expoDetection: expoDetection.success,
      basicConnectivity: basicTest.success,
      workingUrls: workingUrls.map(r => r.url),
      allUrls: multiUrls,
    };
  },

  /**
   * Helper: Afficher une liste de commandes à exécuter
   */
  showDebugCommands() {
    console.log(`
╔════════════════════════════════════════════╗
║ 🔧 BACKEND DEBUGGING COMMANDS              ║
╚════════════════════════════════════════════╝

1️⃣ Vérifier que le backend est démarré:
   > cd src/backend
   > npm run dev
   
   Résultat attendu:
   "🌾 MadaAgri Backend Server Started"
   "Network IP: http://192.168.x.x:4000"

2️⃣ Tester la connexion au backend:
   > curl http://localhost:4000/health
   
   Résultat attendu: JSON avec "status": "running"

3️⃣ Vérifier le port 4000:
   > netstat -ano | findstr :4000
   
   Résultat attendu: Une ligne avec "LISTENING"

4️⃣ Vérifier le pare-feu Windows:
   > Get-NetFirewallRule -DisplayName "*4000*"
   
   Résultat attendu: Enabled = True

5️⃣ Si rien ne fonctionne, réinstaller:
   > cd src/backend && npm install && npm run dev
   > cd ../Mobile && npm install && expo start
    `);
  },
};

export default NetworkDiagnostic;
