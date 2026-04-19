# 🚀 Guide de Démarrage - MadaAgri

**Status:** ✅ **OPÉRATIONNEL**  
**Date:** 18 Avril 2026  

---

## 📋 Prérequis

- ✅ Node.js v16+
- ✅ npm v8+
- ✅ MySQL 5.7+
- ✅ Compte Cloudinary (optionnel pour uploads)

Vérifiez avec:
```bash
node --version   # v19.2.0 ou plus
npm --version    # v10.2.0 ou plus
```

---

## ⚡ Démarrage Rapide (5 minutes)

### 1. Backend

```bash
# Accédez au dossier backend
cd src/backend

# Installez les dépendances
npm install --legacy-peer-deps

# Vérifiez .env (déjà complété)
# NODE_ENV=development
# PORT=4000
# DB_HOST=localhost, DB_USER=root, DB_NAME=madaagri
# JWT_SECRET=madaagri-dev-secret-key-2026

# Démarrez le serveur
npm run dev
```

**Output attendu:**
```
✓ MadaAgri Backend Server Started
✓ Environment: development
✓ Host: localhost
✓ Port: 4000
✓ WebSocket: Active (Socket.io)
```

### 2. Frontend

Dans un **autre terminal**:

```bash
# Accédez au dossier frontend
cd src/frontend

# Installez les dépendances
npm install

# Vérifiez .env
# VITE_API_BASE_URL=http://localhost:4000/api

# Démarrez le serveur
npm run dev
```

**Output attendu:**
```
✓ VITE v7.3.2 ready in 824 ms
✓ Local: http://localhost:5173/
```

### 3. Accès à l'Application

Ouvrez votre navigateur et accédez à:
```
http://localhost:5173
```

---

## 🧪 Tester les Fonctionnalités

### 1. Inscriptions & Authentification

```bash
# Créer un compte
POST http://localhost:4000/api/auth/signup
{
  "email": "fermier@example.com",
  "password": "password123",
  "displayName": "Mon Nom",
  "role": "farmer"
}
```

### 2. Analyse des Cultures (Public)

```bash
# Récupérer les régions
GET http://localhost:4000/api/regions

# Récupérer les cultures pour une région
GET http://localhost:4000/api/analysis/region-cultures?regionId=1

# Recommandations k-NN (5 meilleures cultures)
GET http://localhost:4000/api/analysis/knn-cultures?regionId=1&k=5
```

### 3. Optimisation des Routes

```bash
# Calculer le plus court chemin (protégé)
GET http://localhost:4000/api/routes/dijkstra?startRegionId=1&endRegionId=5
```

(Nécessite token JWT dans header `Authorization: Bearer <token>`)

### 4. Messagerie en Temps Réel

Le client WebSocket se connecte automatiquement. Dans la console du navigateur:

```javascript
// Voir les connexions WebSocket
// Ouvrir DevTools > Network > WS
// Vous verrez la connexion socket.io
```

### 5. Produits & Ventes

```bash
# Récupérer les produits (public)
GET http://localhost:4000/api/products

# Créer un produit (protégé)
POST http://localhost:4000/api/products
{
  "title": "Tomates fraîches",
  "description": "Qualité premium",
  "price": 50000,
  "quantity": 100,
  "unit": "kg",
  "region_id": 1,
  "culture_id": 1
}
```

### 6. Publications & Réseau Social

```bash
# Voir le feed (protégé)
GET http://localhost:4000/api/posts?sort=relevance

# Créer une publication (protégé)
POST http://localhost:4000/api/posts
{
  "content": "Ma récolte est excellente cette année!",
  "visibility": "public"
}

# Suivre un utilisateur (protégé)
POST http://localhost:4000/api/follows/user-id

# Voir les suggestions de suivi (protégé)
GET http://localhost:4000/api/network/suggestions
```

---

## 📊 Architecture

```
MadaAgri/
├── Backend (Port 4000)
│   ├── Express.js + Socket.io
│   ├── MySQL Database
│   ├── Algorithmes (KNN, Dijkstra, KMP)
│   └── Cloud Storage (Cloudinary)
│
└── Frontend (Port 5173)
    ├── React 19
    ├── Vite
    ├── WebSocket (Socket.io-client)
    └── Responsive Design
```

---

## 🔐 Authentification

### Créer un Token JWT

1. **Inscription**
```bash
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "displayName": "Test User",
    "role": "farmer"
  }'
```

2. **Connexion**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Réponse:**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "test@example.com",
    "display_name": "Test User",
    "role": "farmer"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

3. **Utiliser le Token**
```bash
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

## 🗂️ Structure Base de Données

Les tables principales:
- `users` - Utilisateurs (fermiers, clients)
- `posts` - Publications du feed
- `products` - Produits à vendre
- `regions` - Régions géographiques
- `cultures` - Types de cultures
- `region_cultures` - Adaptation des cultures par région
- `messages` - Messagerie
- `follows` - Réseau social
- `post_likes` - Likes sur les publications
- `deliveries` - Livraisons

---

## 🛠️ Commandes Utiles

### Backend

```bash
cd src/backend

# Développement
npm run dev            # Avec hot reload (nodemon)

# Production
npm start              # Mode production

# Linting
npm run lint           # Vérifier le code
npm run lint:fix       # Auto-corriger

# Tests
npm test               # Exécuter les tests
npm run test:watch     # Mode watch
```

### Frontend

```bash
cd src/frontend

# Développement
npm run dev            # Serveur de dev (Vite)

# Production
npm run build          # Build optimisé
npm run preview        # Prévisualiser le build

# Linting
npm run lint           # Vérifier le code
```

---

## 🐛 Troubleshooting

### ❌ "Port 4000 is already in use"

```bash
# Tuer le processus Node
# Windows PowerShell:
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force

# Ou changer le port dans .env
PORT=4001
```

### ❌ "Cannot connect to database"

Vérifiez:
```bash
# 1. MySQL est en cours d'exécution
# 2. .env contient les bonnes infos:
#    DB_HOST=localhost
#    DB_USER=root
#    DB_NAME=madaagri

# 3. La base de données existe
mysql -u root -e "SHOW DATABASES LIKE 'madaagri';"
```

### ❌ "Socket.io connection failed"

Vérifiez:
```bash
# 1. Backend fonctionne (port 4000)
curl http://localhost:4000/api/health

# 2. Frontend a le bon VITE_API_BASE_URL
cat src/frontend/.env
# VITE_API_BASE_URL=http://localhost:4000/api

# 3. CORS est configuré
# Voir src/backend/.env
# CORS_ORIGIN=*
```

### ❌ "JWT token expired"

```bash
# Token valide 7 jours par défaut
# Pour tester: changer JWT_EXPIRES_IN dans .env
JWT_EXPIRES_IN=7d     # Change à 24h par exemple
JWT_EXPIRES_IN=24h

# Puis redémarrer le serveur
```

---

## 📱 Fonctionnalités Testables

### ✅ Implémentées & Fonctionnelles

1. **Authentification**
   - ✅ Inscription
   - ✅ Connexion
   - ✅ JWT Token
   - ✅ Profil utilisateur

2. **Analyse des Cultures**
   - ✅ Lister régions
   - ✅ Lister cultures
   - ✅ k-NN recommandations
   - ✅ Adapter cultures par région

3. **Optimisation des Routes**
   - ✅ Calcul Dijkstra
   - ✅ Plus court chemin
   - ✅ Optimisation livraisons

4. **Messagerie Temps Réel**
   - ✅ WebSocket Connection
   - ✅ Envoyer messages
   - ✅ Recevoir messages
   - ✅ Indicateur de frappe

5. **Réseau Social**
   - ✅ Publications (posts)
   - ✅ Likes & Commentaires
   - ✅ Suivi (follows)
   - ✅ Suggestions

6. **Produits & Commerce**
   - ✅ Lister produits
   - ✅ Créer produits
   - ✅ Recherche

### ⏳ À Tester

- [ ] Upload d'images (Cloudinary)
- [ ] Performance avec beaucoup de données
- [ ] Persistance session
- [ ] Notification en temps réel

---

## 📞 Support

### Logs

```bash
# Backend logs
tail -f src/logs/combined.log

# Frontend console (DevTools F12 > Console)
```

### Documentation

- [ROUTES_CONFIGURATION.md](./ROUTES_CONFIGURATION.md) - Configuration routes
- [BACKEND_STRUCTURE.md](./BACKEND_STRUCTURE.md) - Structure backend
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Dépannage
- [FIXES_REPORT_2026_04_18.md](./FIXES_REPORT_2026_04_18.md) - Rapport corrections

---

## 🎉 Succès!

Votre application MadaAgri est maintenant **fonctionnelle et prête pour**:

✅ Messages en temps réel  
✅ Analyse des cultures (k-NN)  
✅ Optimisation des routes (Dijkstra)  
✅ Ajout de produits  
✅ Publications sociales  
✅ Réseau agricole  

**Amusez-vous bien! 🚀**

---

**Version:** 1.0  
**Dernière mise à jour:** 18 Avril 2026
