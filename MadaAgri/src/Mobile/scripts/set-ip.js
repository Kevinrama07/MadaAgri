#!/usr/bin/env node
/**
 * Script interactif pour configurer l'IP Expo
 * Usage: npm run start:ip
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const os = require('os');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Obtenir les IPs locales
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

const localIPs = getLocalIPs();

console.log('\n📱 Configuration Expo - Définir l\'adresse IP\n');
console.log('🔍 Adresses IP locales détectées:');
localIPs.forEach((ip, index) => {
  console.log(`   ${index + 1}. ${ip}`);
});
console.log('   0. Entrer une IP personnalisée\n');

rl.question('Sélectionnez une option (0-' + localIPs.length + '): ', (answer) => {
  let ip;
  const port = 4000;

  if (answer === '0') {
    rl.question('Entrez l\'adresse IP: ', (customIp) => {
      ip = customIp.trim();
      updateEnv(ip, port);
      rl.close();
    });
  } else {
    const index = parseInt(answer) - 1;
    if (index >= 0 && index < localIPs.length) {
      ip = localIPs[index];
      updateEnv(ip, port);
      rl.close();
    } else {
      console.error('❌ Option invalide');
      rl.close();
      process.exit(1);
    }
  }
});

function updateEnv(ip, port) {
  const envPath = path.join(__dirname, '..', '.env');
  const envContent = `# Configuration Expo - Mis à jour automatiquement
# IP: ${ip}
# Port: ${port}
# Mis à jour: ${new Date().toLocaleString()}

EXPO_PUBLIC_API_URL=http://${ip}:${port}/api
EXPO_PUBLIC_SOCKET_URL=http://${ip}:${port}
EXPO_PUBLIC_ANDROID_EMULATOR_IP=10.0.2.2:${port}
EXPO_PUBLIC_DEBUG_ENABLED=true
`;

  fs.writeFileSync(envPath, envContent);
  
  console.log('\n✅ Configuration mise à jour!');
  console.log(`📍 API URL: http://${ip}:${port}/api`);
  console.log(`📍 Socket URL: http://${ip}:${port}`);
  console.log(`📁 Fichier: .env\n`);
  console.log('🎬 Lancement du serveur Expo...\n');
}
