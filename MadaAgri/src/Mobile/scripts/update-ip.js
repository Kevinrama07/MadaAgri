#!/usr/bin/env node
/**
 * Script pour mettre à jour l'IP API facilement
 * Usage:
 *   npm run set-ip -- 192.168.88.23              (change l'IP directement)
 *   npm run set-ip                                (mode interactif)
 *   node scripts/update-ip.js 192.168.88.23      (appel direct)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Récupérer l'IP depuis les arguments
const args = process.argv.slice(2);
const ipArg = args[0];

function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  Object.values(interfaces).forEach((iface) => {
    iface.forEach((addr) => {
      if (addr.family === 'IPv4' && !addr.internal) {
        ips.push(addr.address);
      }
    });
  });
  return ips;
}

function updateFiles(ip) {
  const port = 4000;
  const baseUrl = `http://${ip}:${port}`;

  // Mettre à jour .env
  const envPath = path.join(__dirname, '..', '.env');
  const envContent = `# Configuration API - Mise à jour: ${new Date().toLocaleString()}
# Format: http://IP:PORT (sans /api)
EXPO_PUBLIC_API_URL=${baseUrl}
EXPO_PUBLIC_SOCKET_URL=${baseUrl}
EXPO_PUBLIC_ANDROID_EMULATOR_IP=10.0.2.2:${port}
EXPO_PUBLIC_DEBUG_ENABLED=true
`;

  fs.writeFileSync(envPath, envContent);
  console.log(`✅ .env mis à jour`);

  // Mettre à jour app.json
  const appJsonPath = path.join(__dirname, '..', 'app.json');
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  appJson.expo.extra.API_URL = baseUrl;
  appJson.expo.extra.SOCKET_URL = baseUrl;
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
  console.log(`✅ app.json mis à jour`);

  console.log(`\n🌐 Nouvelle configuration:`);
  console.log(`   IP: ${ip}`);
  console.log(`   API URL: ${baseUrl}`);
  console.log(`   Socket URL: ${baseUrl}`);
  console.log(`\n💡 Relancez Expo: npm start\n`);
}

if (ipArg) {
  // Mode argument direct
  updateFiles(ipArg);
} else {
  // Mode interactif
  console.log('\n📱 Configuration Expo - Changer l\'IP\n');
  
  const localIPs = getLocalIPs();
  console.log('🔍 IPs locales détectées:');
  localIPs.forEach((ip, i) => {
    console.log(`   ${i + 1}. ${ip}`);
  });

  if (localIPs.length === 1) {
    // Si une seule IP, l'utiliser directement
    console.log(`\n✨ Une seule IP détectée, utilisation de ${localIPs[0]}\n`);
    updateFiles(localIPs[0]);
  } else {
    console.log(`\n💡 Utilisation rapide: npm run set-ip -- 192.168.X.X\n`);
  }
}
