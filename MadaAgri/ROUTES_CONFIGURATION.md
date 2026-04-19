# Configuration Modulaire des Routes - Backend MadaAgri

## 📊 Statut

✅ Routes restructurées en modules séparés
✅ Server.js optimisé (de 1000+ lignes à <60 lignes)
✅ Code plus maintenable et évolutif

---

## 🏗️ Architecture

### Structure des dossiers

```
src/backend/
├── server.js                    ← Configuration principale (SIMPLIFIÉ)
├── routes/
│   ├── index.js                 ← Point d'entrée des routes (orchestration)
│   ├── auth.js                  ← Authentification (signup, login, me)
│   ├── users.js                 ← Profils utilisateurs
│   ├── posts.js                 ← Publications (feed, likes, commentaires)
│   ├── products.js              ← Produits
│   ├── messages.js              ← Messagerie
│   ├── network.js               ← Réseau social (follows, suggestions)
│   ├── analysis.js              ← Analyses (régions, cultures, routes)
│   ├── upload.js                ← Téléchargement d'images
│   └── health.js                ← Santé du serveur
├── controllers/
│   ├── uploadController.js
│   └── userController.js
├── middlewares/
│   └── uploadMiddleware.js
├── services/
│   └── postScoringService.js
├── algos/
├── db.js
└── package.json
```

---

## 🔄 Flux de démarrage

```
server.js
    ↓
registerRoutes(app, uploadServices)
    ↓
routes/index.js (orchestration)
    ↓
├─ /api/auth           → routes/auth.js
├─ /api/users          → routes/users.js
├─ /api/posts          → routes/posts.js
├─ /api/products       → routes/products.js
├─ /api/messages       → routes/messages.js
├─ /api/follows        → routes/network.js
├─ /api/network        → routes/network.js
├─ /api/regions        → routes/analysis.js
├─ /api/cultures       → routes/analysis.js
├─ /api/region_cultures → routes/analysis.js
├─ /api/analysis       → routes/analysis.js
├─ /api/routes         → routes/analysis.js
├─ /api/deliveries     → routes/analysis.js
├─ /api/upload         → routes/upload.js
└─ /api/health         → routes/health.js
```

---

## 📋 Modules de routes

### 1. **routes/auth.js** - Authentification
Gère l'authentification des utilisateurs.

**Endpoints** :
- `POST /api/auth/signup` - Créer un compte
- `POST /api/auth/login` - Se connecter
- `GET /api/auth/me` - Profil de l'utilisateur connecté

**Exports** :
- `router` (Express Router)
- `authMiddleware` - Middleware de vérification du token
- `JWT_SECRET` - Code secret pour les tokens

---

### 2. **routes/users.js** - Profils utilisateurs
Gère les profils et paramètres d'utilisateurs.

**Endpoints** :
- `GET /api/users` - Lister les utilisateurs
- `PUT /api/users` - Mettre à jour le profil
- `PUT /api/users/profile-picture` - Changer la photo de profil

---

### 3. **routes/posts.js** - Publications
Gère le feed avec scoring de pertinence.

**Endpoints** :
- `GET /api/posts?sort=relevance|popular|recent&q=search` - Récupérer les publications
- `POST /api/posts` - Créer une publication
- `POST /api/posts/:postId/like` - Liker une publication
- `DELETE /api/posts/:postId/like` - Retirer un like
- `GET /api/posts/:postId/comments` - Récupérer les commentaires
- `POST /api/posts/:postId/comments` - Ajouter un commentaire

**Features** :
- ✅ Scoring intelligent (engagement, affinité, récence, pertinence)
- ✅ Tri par pertinence (défaut), popularité, ou chronologie
- ✅ Filtrage par texte (KMP)

---

### 4. **routes/products.js** - Produits
Gère les produits agricoles.

**Endpoints** :
- `GET /api/products?q=search` - Lister les produits publics
- `POST /api/products` - Créer un produit

---

### 5. **routes/messages.js** - Messagerie
Gère la messagerie entre utilisateurs.

**Endpoints** :
- `GET /api/messages?conversationId=...` - Récupérer les messages
- `POST /api/messages` - Envoyer un message

---

### 6. **routes/network.js** - Réseau social
Gère les follows et suggestions du réseau.

**Endpoints** :
- `POST /api/follows/:userId` - Suivre un utilisateur
- `DELETE /api/follows/:userId` - Arrêter de suivre
- `GET /api/network/suggestions` - Suggestions d'utilisateurs (BFS)

---

### 7. **routes/analysis.js** - Analyses et données
Gère les données géographiques et agricoles.

**Endpoints** :
- `GET /api/regions` - Lister les régions
- `GET /api/cultures` - Lister les cultures
- `GET /api/region_cultures?regionId=...` - Cultures adaptées à une région
- `GET /api/analysis/cultures_knn?regionId=...&k=5` - Recommandations k-NN
- `GET /api/routes/dijkstra?startRegionId=...&endRegionId=...` - Plus court chemin
- `GET /api/deliveries?farmerId=...` - Livraisons d'un agriculteur

**Algorithms** :
- k-NN pour recommandations agricoles
- Dijkstra pour optimisation de routes

---

### 8. **routes/upload.js** - Téléchargement
Gère l'upload d'images.

**Endpoints** :
- `POST /api/upload` - Télécharger une image

---

### 9. **routes/health.js** - Santé
Vérifie l'état du serveur.

**Endpoints** :
- `GET /api/health` - Status du serveur

---

## 🔐 Authentification

### Middleware d'authentification

Tous les routes protégées utilisent le middleware `authMiddleware` exporté par `routes/auth.js`.

**Utilisation** :
```javascript
// Dans une route
authMiddleware(req, res, async () => {
  // Code protégé
  const userId = req.user.id;
});
```

### Token JWT

Structure du token :
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "role": "farmer|client|admin"
}
```

Durée : 7 jours

---

## 📡 **routes/index.js** - Orchestration

Fichier central qui enregistre toutes les routes du serveur.

**Responsabilités** :
1. Importe tous les modules de routes
2. Injecte les services (upload, auth, etc.)
3. Enregistre les routes sur l'app Express
4. Ajoute la gestion 404
5. Ajoute le middleware de gestion d'erreurs global

**Code** :
```javascript
function registerRoutes(app, uploadServices) {
  // Injection des services
  app.use((req, res, next) => {
    req.authMiddleware = authMiddleware;
    req.uploadServices = uploadServices;
    next();
  });

  // Enregistrement des routes
  app.use('/api/auth', authRouter);
  app.use('/api/posts', postsRouter);
  // ... autres routes

  // Erreur 404
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // Gestion erreurs global
  app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error',
    });
  });
}
```

---

## 🔌 Ajouter une nouvelle route

### Étapes

1. **Créer un nouveau fichier** : `routes/myfeature.js`
   ```javascript
   const express = require('express');
   const router = express.Router();

   router.get('/', (req, res) => {
     res.json({ message: 'Hello' });
   });

   module.exports = router;
   ```

2. **Importer dans** `routes/index.js`
   ```javascript
   const myRouter = require('./myfeature');
   ```

3. **Enregistrer la route**
   ```javascript
   function registerRoutes(app, uploadServices) {
     // ...
     app.use('/api/myfeature', myRouter);
     // ...
   }
   ```

4. **Accéder** à `http://localhost:4000/api/myfeature`

---

## 🧪 Démarrage & Test

### Démarrer le serveur
```bash
cd src/backend
npm install
node server.js
```

Output attendu :
```
✓ Backend server running on http://localhost:4000
✓ Mode: development
```

### Tester une route
```bash
curl http://localhost:4000/api/health
# {"status": "ok"}
```

### Tester authentification
```bash
# Signup
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "displayName": "Test User",
    "role": "farmer"
  }'

# Copier le token reçu

# Login avec le token
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:4000/api/auth/me
```

---

## 📈 Avantages de cette architecture

✅ **Clarté** - Chaque route dans son fichier
✅ **Maintenabilité** - Facile de modifier/ajouter des routes
✅ **Scalabilité** - Structure prête pour la croissance
✅ **Réutilisabilité** - Middlewares partagés
✅ **Testabilité** - Modules indépendants testables
✅ **Performance** - Pas de surcharge de l'app principale
✅ **Séparation des responsabilités** - Chaque fichier a un rôle clair

---

## 🎯 Prochaines optimisations (optionnelles)

1. **Rate limiting** - Ajouter un middleware de limitation de débit
2. **Validation** - Schémas de validation pour les requêtes
3. **Logging** - Logger structuré pour chaque route
4. **Cache** - Cacher certaines réponses
5. **Tests unitaires** - Tests pour chaque module
6. **Documentation OpenAPI** - Swagger/OpenAPI pour les endpoints

---

## 📊 Comparaison avant/après

| Métrique | Avant | Après |
|---|---|---|
| Lignes server.js | 1000+ | 60 |
| Fichiers de routes | 1 | 9 |
| Maintenabilité | Faible | Excellente |
| Lisibilité | Mauvaise | Excellent |
| Évolutivité | Difficile | Facile |
| Code duplication | Oui | Non |
| Tests | Difficiles | Faciles |

---

## ✅ Checklist de validation

- [x] Server.js nettoyé et simplifié
- [x] Toutes les routes extraites en modules
- [x] Routes/index.js agit comme orchestrateur
- [x] Authentification centralisée
- [x] Injection de dépendances pour upload
- [x] Gestion d'erreurs globale
- [x] Rout 404 configurée
- [x] Mode graceful shutdown
- [x] Logs améliorés au démarrage
- [x] Structure prête pour croissance
