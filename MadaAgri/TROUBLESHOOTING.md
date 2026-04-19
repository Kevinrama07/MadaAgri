# Guide de Troubleshooting - Backend MadaAgri

## Table des Matières
1. [Installation et Setup](#installation-et-setup)
2. [Problèmes de Serveur](#problèmes-de-serveur)
3. [Problèmes de Base de Données](#problèmes-de-base-de-données)
4. [Problèmes d'Authentification](#problèmes-dauthentification)
5. [Problèmes de Validation](#problèmes-de-validation)
6. [Problèmes de Logging](#problèmes-de-logging)
7. [Problèmes de Sécurité](#problèmes-de-sécurité)
8. [Problèmes de Performance](#problèmes-de-performance)

---

## Installation et Setup

### ❌ Erreur: "npm ERR! ERESOLVE unable to resolve dependency tree"

**Symptôme:**
```
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solutions:**
```bash
# Solution 1: Forcer la résolution
npm install --legacy-peer-deps

# Solution 2: Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install

# Solution 3: Vérifier Node/NPM versions
node --version  # Doit être >= 16.0.0
npm --version   # Doit être >= 8.0.0

# Si vieux, mettre à jour
npm install -g npm@latest
```

---

### ❌ Erreur: "Cannot find module 'express'"

**Symptôme:**
```
Error: Cannot find module 'express'
```

**Solutions:**
```bash
# 1. Vérifier que dependencies sont installées
npm install

# 2. Vérifier node_modules existe
ls node_modules/express

# 3. Vérifier package.json (ne pas l'avoir supprimé)
cat package.json | grep express

# 4. Si tout échoue, clean install
rm -rf node_modules package-lock.json
npm install
```

---

### ❌ Erreur: "Port 4000 is already in use"

**Symptôme:**
```
Error: listen EADDRINUSE: address already in use :::4000
```

**Solutions:**
```bash
# Solution 1: Changer le port dans .env
PORT=4001

# Solution 2: Tuer le processus qui utilise le port
# Linux/Mac:
lsof -i :4000
kill -9 <PID>

# Windows (PowerShell):
Get-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess | Stop-Process -Force

# Solution 3: Vérifier d'autres instances
ps aux | grep node
```

---

## Problèmes de Serveur

### ❌ Serveur démarre mais routes ne répondent pas

**Symptôme:**
- `npm run dev` réussit
- `curl http://localhost:4000/api/health` timeout ou erreur 404

**Cause probable:** Le serveur n'écoute pas correctement

**Solutions:**
```bash
# 1. Vérifier le port et host dans config
cat src/backend/config/index.js

# 2. Vérifier que le serveur démarre vraiment
npm run dev 2>&1 | grep "listening\|listening on"

# 3. Vérifier la configuration firewall
# Vous avez un firewall restrictif?
# Ajouter 4000 aux ports autorisés

# 4. Vérifier que server.js est correct
node src/backend/server.js

# 5. Tester localement uniquement
curl http://localhost:4000/api/health
```

---

### ❌ Erreur "CORS blocked" en Frontend

**Symptôme:**
```
Access to XMLHttpRequest at 'http://localhost:4000/api/posts' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solutions:**
```bash
# 1. Vérifier CORS est configuré dans .env
cat src/backend/.env | grep CORS_ORIGIN

# 2. Ajouter le frontend origin
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# 3. Vérifier server.js inclut CORS
grep -n "cors\|CORS" src/backend/server.js

# 4. Dev: Utiliser '*' temporairement (JAMAIS en prod)
CORS_ORIGIN=*

# 5. Redémarrer le serveur après changement
npm run dev
```

---

### ❌ Serveur crash sans message d'erreur

**Symptôme:**
```
Process exits suddenly, no error message
```

**Solutions:**
```bash
# 1. Lancer en debug mode
NODE_ENV=development npm run dev

# 2. Vérifier les logs
tail -f src/backend/logs/error.log
tail -f src/backend/logs/combined.log

# 3. Vérifier les erreurs uncaught
# Voir server.js pour uncaughtException handler

# 4. Utiliser PM2 pour logging automatique
npm install -g pm2
pm2 start src/backend/server.js
pm2 logs

# 5. Vérifier la mémoire disponible
free -h  # Linux/Mac
Get-ComputerInfo | Select-Object CsPhyicallyInstalledMemory  # Windows
```

---

## Problèmes de Base de Données

### ❌ Erreur: "connect ECONNREFUSED 127.0.0.1:3306"

**Symptôme:**
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Cause:** MySQL/MariaDB n'est pas en fonctionnement

**Solutions:**
```bash
# 1. Vérifier que le service DB est actif
# Linux:
sudo systemctl status mysql
sudo systemctl start mysql

# Mac:
brew services list
brew services start mysql

# Windows (Administrateur):
mysql -u root -p

# 2. Vérifier le host/port
cat src/backend/.env | grep DB_

# 3. Tester la connexion manuellement
mysql -h localhost -u root -p

# 4. Si le service ne démarre pas:
# a) Vérifier les permissions
# b) Vérifier l'espace disque
# c) Vérifier les logs BD
#    Linux: /var/log/mysql/
#    Mac: /usr/local/var/mysql/
```

---

### ❌ Erreur: "Unknown database 'madaagri'"

**Symptôme:**
```
Error: Unknown database 'madaagri'
```

**Solutions:**
```bash
# 1. Créer la base de données
mysql -u root -p < src/backend/init.sql

# 2. Ou manuellement:
mysql -u root -p
CREATE DATABASE madaagri CHARACTER SET utf8mb4;
USE madaagri;
# Puis sourcer le init.sql

# 3. Vérifier qu'elle existe
mysql -u root -p -e "SHOW DATABASES;" | grep madaagri

# 4. Vérifier le .env pointe au bon nom
grep DB_NAME src/backend/.env
```

---

### ❌ Erreur: "Access denied for user 'root'@'localhost'"

**Symptôme:**
```
Error: Access denied for user 'root'@'localhost' (using password: YES)
```

**Solutions:**
```bash
# 1. Vérifier les credentials dans .env
cat src/backend/.env | grep DB_USER
cat src/backend/.env | grep DB_PASSWORD

# 2. Tester la connexion manuelle
mysql -u root -p  # Entrer le mot de passe de .env

# 3. Créer un utilisateur spécifique (recommandé)
mysql -u root -p
CREATE USER 'madaagri_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON madaagri.* TO 'madaagri_user'@'localhost';
FLUSH PRIVILEGES;

# 4. Mettre à jour .env
DB_USER=madaagri_user
DB_PASSWORD=strong_password

# 5. Redémarrer le serveur
npm run dev
```

---

### ❌ Slow Queries - Serveur lent

**Symptôme:**
- Réponses très lentes (> 1000ms)
- Parfois timeout

**Solutions:**
```bash
# 1. Activer slow query log
mysqld --slow-query-log --long-query-time=1

# 2. Vérifier dans logs
tail -f /var/log/mysql/slow.log

# 3. Ajouter des index manquants
mysql -u root -p madaagri
SHOW INDEXES FROM posts;
SHOW INDEXES FROM users;

# 4. Créer index sur colonnes fréquemment recherchées
ALTER TABLE posts ADD INDEX (user_id);
ALTER TABLE users ADD INDEX (email);

# 5. Optimiser les queries en code
# Vérifier les N+1 queries
# Utiliser les JOIN correctement
```

---

## Problèmes d'Authentification

### ❌ Erreur: "Invalid token"

**Symptôme:**
```json
{
  "success": false,
  "error": "Invalid token"
}
```

**Solutions:**
```bash
# 1. Vérifier que le token est envoyé correctement
# Format: Authorization: Bearer <token>

# Correct:
curl -H "Authorization: Bearer eyJhbGc..." http://localhost:4000/api/users

# Incorrect (un des exemples):
curl -H "Authorization: eyJhbGc..." http://localhost:4000/api/users  # Manque "Bearer"
curl http://localhost:4000/api/users  # Pas de header

# 2. Vérifier que JWT_SECRET match
cat src/backend/.env | grep JWT_SECRET

# 3. Vérifier la signature du token
# Utiliser jwt.io pour dépanner

# 4. Créer la variable JWT_SECRET si manquante
# Générer une clé forte:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 5. Ajouter à .env
JWT_SECRET=votre_clé_générée

# 6. Redémarrer et rauthentifier
npm run dev
```

---

### ❌ "Token expired"

**Symptôme:**
```json
{
  "success": false,
  "error": "Token expired"
}
```

**Solutions:**
```bash
# 1. C'est normal après 7 jours (par défaut)
# Implémenter les refresh tokens (Phase 5)

# 2. Temporairement augmenter la durée (DEV SEULEMENT):
JWT_EXPIRES_IN=30d

# 3. Se réauthentifier:
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# 4. En production, implémenter refresh tokens
# Pour l'instant, c'est attendu
```

---

### ❌ Login échoue

**Symptôme:**
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

**Solutions:**
```bash
# 1. Vérifier que l'utilisateur existe
mysql -u root -p madaagri
SELECT * FROM users WHERE email='user@example.com';

# 2. Vérifier que le mot de passe est correct
# Les passwords sont hashés, ne pas les comparer directement

# 3. Tester avec curl
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }'

# 4. Vérifier les logs
tail -f src/backend/logs/combined.log

# 5. S'il y a une creée:
mysql -u root -p madaagri
INSERT INTO users (email, password, displayName) VALUES ('test@example.com', 'hashed...', 'Test');
# Non, utiliser l'endpoint signup à la place
```

---

## Problèmes de Validation

### ❌ "Validation failed"

**Symptôme:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": "Email invalide"
  }
}
```

**Solutions:**
```bash
# 1. Vérifier le format des données
# POST /api/auth/signup
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "displayName": "Test User"
  }'

# 2. Vérifier les validateurs
cat src/backend/middlewares/validators.js | grep -A 10 "signup:"

# 3. Tester chaque champ:
# - email: Format valide? Pas vide?
# - password: >= 8 chars? Majuscules? Minuscules? Chiffres?
# - displayName: 2-100 chars?

# 4. Voir les règles dans constants
cat src/backend/constants/index.js | grep -A 10 "VALIDATION"

# 5. Erreurs personnalisées?
# Vérifier le message exact en réponse
```

---

### ❌ "Required field missing"

**Symptôme:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "password": "Required"
  }
}
```

**Solutions:**
```bash
# 1. Vérifier que tous les champs obligatoires sont envoyés
# Pour signup: email, password, displayName sont requis

# 2. Exemple correct:
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123",
    "displayName": "John Doe"
  }'

# 3. Vérifier les types:
# - email: string, isEmail()
# - password: string, min 8
# - displayName: string, 2-100

# 4. Vérifier la casing:
# POST data est case-sensitive!
```

---

## Problèmes de Logging

### ❌ "Fichiers de log não são criados"

**Symptôme:**
- Pas de fichiers dans `src/backend/logs/`
- Logs visibles en console mais non persistés

**Solutions:**
```bash
# 1. Vérifier que le répertoire logs existe
ls -la src/backend/logs/

# 2. Le créer si nécessaire
mkdir -p src/backend/logs/

# 3. Vérifier les permissions
chmod 755 src/backend/logs/

# 4. Vérifier que Winston est installé
npm list winston

# 5. Vérifier la configuration dans logger.js
cat src/backend/utils/logger.js | grep "transports:"

# 6. Redémarrer le serveur
npm run dev

# 7. Générer un log (faire une requête)
curl http://localhost:4000/api/health

# 8. Vérifier les fichiers
ls -la src/backend/logs/
cat src/backend/logs/combined.log
```

---

### ❌ "Logs trop verbose"

**Symptôme:**
- Fichiers de log très grands (plusieurs GB)
- Performance serveur dégradée

**Solutions:**
```bash
# 1. Diminuer le LOG_LEVEL
LOG_LEVEL=warn  # Au lieu de info

# 2. Vérifier que les logs ne doublent pas
grep "duplicate" src/backend/logs/combined.log

# 3. Vérifier les nouvelles lignes ajouter chaque requête
# Des millions de logs pour quelques requêtes?

# 4. Nettoyer les anciens logs
rm src/backend/logs/*.log*

# 5. Implémenter la rotation (déjà fait par défaut)
# Vérifier la config:
cat src/backend/utils/logger.js | grep "maxsize\|maxFiles"
```

---

## Problèmes de Sécurité

### ❌ 403 Forbidden

**Symptôme:**
```json
{
  "success": false,
  "error": "Access denied"
}
```

**Solutions:**
```bash
# 1. Vérifier que vous êtes authentifié
curl -H "Authorization: Bearer <token>" \
  http://localhost:4000/api/users/profile

# 2. Vérifier le token n'a pas expiré
# JWT_EXPIRES_IN=7d par défaut

# 3. Vérifier votre rôle utilisateur si applicable
# Admins peuvent avoir plus d'accès

# 4. Vérifier les permissions dans le code
grep -r "AuthorizationError" src/backend/routes/

# 5. Logs pour debug:
tail -f src/backend/logs/combined.log | grep "Authorization"
```

---

### ❌ Rate Limiting - "Too many requests"

**Symptôme:**
```json
{
  "statusCode": 429,
  "message": "Trop de requêtes, veuillez réessayer plus tard"
}
```

**Cause:** Vous avez dépassé la limite (100 req / 15 min)

**Solutions:**
```bash
# 1. C'est normal! Attendre 15 minutes

# 2. En développement, augmenter les limites
# Éditer src/backend/middlewares/security.js
// const RATE_LIMIT = {
//   WINDOW_MS: 60 * 1000, // 1 min au lieu de 15
//   MAX_REQUESTS: 1000,   // limit élevée
// }

# 3. Ou désactiver temporairement en DEV:
# Dans server.js, commenter: app.use(generalLimiter);

# 4. En production, garder les limites strictes
# Pour la sécurité
```

---

### ❌ CORS ou CSRF

**Symptôme:**
```
CORS error ou origine non autorisée
```

**Solutions:** Voir section "CORS blocked" plus haut

---

## Problèmes de Performance

### ❌ API très lent (> 1000ms)

**Symptôme:**
- Chaque requête prend plusieurs secondes
- CPU/Memory très élevée

**Solutions:**
```bash
# 1. Vérifier les logs de requête
tail -f src/backend/logs/combined.log | grep "duration"

# 2. Identifier la requête lente
# Exemple: POST /api/posts pendant 5000ms

# 3. Vérifier la base de données
mysql -u root -p
SHOW PROCESSLIST;  # Vérifier les queries en cours
SHOW STATUS;       # Statistiques générales

# 4. Activer le slow query log
# SET GLOBAL slow_query_log = 1;
# SET GLOBAL long_query_time = 0.5;

# 5. Vérifier les indexes manquants
EXPLAIN SELECT * FROM posts WHERE user_id = 1;

# 6. En code, vérifier les N+1 queries
# Une requête pour chaque post au lieu d'une requête?

# 7. Vérifier les logs de mémoire
# Fuite mémoire? Leak?
node --inspect src/backend/server.js
# Puis Chrome DevTools

# 8. Limiter la réponse avec pagination
# GET /api/posts?limit=20 au lieu de tous les posts
```

---

### ❌ Memory leak - Mémoire augmente constamment

**Symptôme:**
- Node process utilise 100MB, puis 200MB, puis 500MB...
- Serveur crash après quelques heures

**Solutions:**
```bash
# 1. Installer clinic.js
npm install -g clinic

# 2. Analyser la mémoire
clinic doctor -- node src/backend/server.js

# 3. Vérifier les listeners non supprimés
grep "on\|once\|addListener" src/backend/**/*.js

# 4. Vérifier les closures retiennent variables
# Utiliser des weak references si possible

# 5. Utiliser heapdump pour snapshot
npm install heapdump
# Dans le code: require('heapdump').writeSnapshot();

# 6. Vérifier les fichiers ouverts non fermés
lsof -p <PID> | wc -l

# 7. Vérifier le timeout des connections BD
# Config: connectionLimit, queueLimit

# 8. Si persistent, optimiser le code:
# - Fermer les connections explicitement
# - Vider les caches régulièrement
# - Ne pas stocker de gros objets globaux
```

---

## Checklist de Debugging

Utiliser cette checklist quand quelque chose ne fonctionne pas:

- [ ] Vérifier les logs: `tail -f src/backend/logs/error.log`
- [ ] Vérifier le statut du serveur: `curl http://localhost:4000/api/health`
- [ ] Vérifier la base de données: `mysql -u root -p`
- [ ] Vérifier les variables d'environnement: `cat src/backend/.env`
- [ ] Vérifier que les dépendances sont installées: `npm list`
- [ ] Redémarrer le serveur: `npm run dev`
- [ ] Nettoyer le cache: `rm -rf node_modules package-lock.json && npm install`
- [ ] Vérifier les ports libres: `lsof -i :4000`
- [ ] Vérifier la mémoire/CPU: `top` ou Task Manager
- [ ] Consulter ce guide: Vous êtes ici! 📖

---

## Commandes Utiles

```bash
# Vérifier la santé du serveur
curl http://localhost:4000/api/health

# Voir les logs en temps réel
tail -f src/backend/logs/combined.log

# Linter le code
npm run lint

# Run tests
npm test

# Vérifier vulnerabilités
npm audit

# Voir les processus Node
ps aux | grep node

# Tuer un processus Node
kill -9 <PID>

# Redémarrer MySQL
sudo systemctl restart mysql

# Vérifier l'espace disque
df -h

# Vérifier mémoire
free -h
```

---

## Contacter le Support

Si vous ne trouvez pas la solution:

1. Vérifier la documentation:
   - BACKEND_STRUCTURE.md
   - IMPLEMENTATION_GUIDE.md
   - DEPLOYMENT_CHECKLIST.md

2. Vérifier les logs:
   - src/backend/logs/error.log
   - src/backend/logs/combined.log

3. Vérifier les sources:
   - Lire le code de la route problématique
   - Vérifier les middlewares appliqués
   - Vérifier les erreurs lancées

4. Consulter ce troubleshooting guide

5. Chercher le problème sur:
   - GitHub issues
   - stackoverflow.com
   - Slack team

---

**Dernière mise à jour:** 2024  
**Version:** 1.0.0

*Si vous trouvez une nouvelle erreur, ajouter la solution ici pour les autres!*
