#!/usr/bin/env node

/**
 * Script de génération de secrets sécurisés pour MadaAgri
 * Usage: node generate-secrets.js
 */

const crypto = require('crypto');

console.log('\n🔐 Génération de secrets sécurisés pour MadaAgri\n');
console.log('=' .repeat(60));

// Générer JWT Secret (32 bytes = 64 caractères hex)
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log('\n📝 JWT_SECRET:');
console.log(jwtSecret);

// Générer Session Secret
const sessionSecret = crypto.randomBytes(32).toString('hex');
console.log('\n📝 SESSION_SECRET:');
console.log(sessionSecret);

// Générer API Key
const apiKey = crypto.randomBytes(24).toString('hex');
console.log('\n📝 API_KEY:');
console.log(apiKey);

// Générer mot de passe DB fort
const dbPassword = crypto.randomBytes(16).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
console.log('\n📝 DB_PASSWORD (suggestion):');
console.log(dbPassword);

// Générer encryption key
const encryptionKey = crypto.randomBytes(32).toString('hex');
console.log('\n📝 ENCRYPTION_KEY:');
console.log(encryptionKey);

console.log('\n' + '='.repeat(60));
console.log('\n⚠️  IMPORTANT:');
console.log('   - Copiez ces valeurs dans votre fichier .env');
console.log('   - Ne partagez JAMAIS ces secrets');
console.log('   - Utilisez des secrets différents pour chaque environnement');
console.log('   - Changez-les régulièrement en production\n');
