/**
 * Documentation sur la structure du backend
 */

# Structure Backend MadaAgri - Documentation

## Architecture

```
backend/
├── server.js                 # Point d'entrée principal
├── db.js                    # Connexion base de données
├── package.json            # Dépendances
├── init.sql               # Schéma base de données
│
├── config/
│   └── index.js           # Configuration centralisée
│
├── constants/
│   └── index.js           # Constantes applicatives
│
├── errors/
│   └── ApiError.js        # Classes d'erreur personnalisées
│
├── middlewares/
│   ├── authMiddleware.js  # Authentification JWT
│   ├── errorHandler.js    # Gestion des erreurs
│   ├── validators.js      # Validation des entrées
│   ├── security.js        # Sécurité (Helmet, Rate Limiting)
│   ├── logging.js         # Logging des requêtes
│   └── uploadMiddleware.js
│
├── utils/
│   ├── logger.js          # Winston logger
│   ├── responseHandler.js # Réponses standardisées
│   └── pagination.js      # Utilitaires de pagination
│
├── routes/
│   ├── index.js           # Orchestrateur des routes
│   ├── auth.js            # Authentification
│   ├── posts.js           # Publications
│   ├── users.js           # Profils utilisateurs
│   ├── products.js        # Produits agricoles
│   ├── messages.js        # Messagerie
│   ├── network.js         # Réseau social
│   ├── analysis.js        # Analyses agricoles
│   ├── upload.js          # Uploads fichiers
│   └── health.js          # Santé applicative
│
├── controllers/
│   ├── userController.js  # Logique utilisateurs
│   └── uploadController.js
│
├── services/
│   └── postScoringService.js  # Service de scoring
│
├── algos/
│   ├── dijkstra.js        # Algorithme Dijkstra
│   ├── graph.js           # Structure graphe
│   ├── heap.js            # Structure heap
│   ├── kmp.js             # Algorithme KMP
│   └── knn.js             # Algorithme KNN
│
└── config/
    └── cloudinaryConfig.js
```

## Flux d'une Requête

```
1. Requête HTTP
   ↓
2. Helmet (sécurité headers)
   ↓
3. CORS (accès cross-origin)
   ↓
4. Body Parser (parse JSON/form)
   ↓
5. Request Logger (log requête)
   ↓
6. Rate Limiter (throttle)
   ↓
7. Route Handler
   ├─ Validation (validators middleware)
   ├─ Authentication (authMiddleware si nécessaire)
   ├─ Business Logic
   └─ Response
   ↓
8. Global Error Handler (gère les erreurs)
   ↓
9. Response HTTP
```

## Gestion des Erreurs

Les erreurs sont centralisées dans `errors/ApiError.js`:

- **ApiError** - Erreur de base (500)
- **ValidationError** - Validation échouée (400)
- **AuthenticationError** - Auth échouée (401)
- **AuthorizationError** - Accès refusé (403)
- **NotFoundError** - Resource not found (404)
- **ConflictError** - Conflit (409)

Utilisation:
```javascript
throw new ValidationError('Invalid email', { email: 'Invalid format' });
throw new AuthenticationError('Invalid credentials');
throw new NotFoundError('User not found');
```

## Configuration par Environnement

Variables d'environnement (.env):

```
NODE_ENV=development
PORT=4000
HOST=localhost

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=madaagri

JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

CORS_ORIGIN=*
LOG_LEVEL=info
```

## Validation des Entrées

Utiliser les validateurs dans `middlewares/validators.js`:

```javascript
router.post(
  '/signup',
  authValidators.signup,
  handleValidationErrors,
  (req, res) => {
    // Entrées garanties valides ici
  }
);
```

## Logging

Winston logger en `utils/logger.js`:

```javascript
const logger = require('../utils/logger');

logger.info('Information message');
logger.error('Error message', { context: 'data' });
logger.warn('Warning message');
logger.debug('Debug message');
```

Fichiers de log:
- `logs/error.log` - Erreurs uniquement
- `logs/combined.log` - Tous les logs

## Réponses Standardisées

Utiliser les fonctions de `utils/responseHandler.js`:

```javascript
const { sendSuccess, sendError, sendPaginatedSuccess } = require('../utils/responseHandler');

// Succès
sendSuccess(res, data, 200, 'User created');

// Erreur
sendError(res, error, 400);

// Paginée
sendPaginatedSuccess(res, articles, { page: 1, limit: 20, total: 100 });
```

Format des réponses standardisé pour cohérence API.

## Middleware de Sécurité

- **Helmet** - Headers de sécurité
- **Rate Limiting** - Protection DOS
- **CORS** - Contrôle d'accès
- **bodyParser** - Protection injection

Configuration dans `middlewares/security.js`.

## Async Handling

Toujours utiliser `asyncHandler` pour async/await:

```javascript
const { asyncHandler } = require('../middlewares/errorHandler');

router.get('/users', asyncHandler(async (req, res) => {
  const users = await getUsers();
  sendSuccess(res, users);
}));
```

Cela capture automatiquement les erreurs Promise.

## Checklist pour les Nouvelles Routes

1. ✓ Créer le fichier route dans `routes/`
2. ✓ Ajouter les validateurs si nécessaire
3. ✓ Importer dans `routes/index.js` et enregistrer
4. ✓ Utiliser `asyncHandler` pour async functions
5. ✓ Lancer les erreurs appropriées (ApiError subclasses)
6. ✓ Utiliser `sendSuccess`/`sendError` pour réponses
7. ✓ Logger les opérations importantes
8. ✓ Ajouter l'authentification si nécessaire

## Points Clés

- Configuration centralisée pour faciliter le déploiement
- Logging structuré pour le debugging et monitoring
- Validation stricte des entrées pour la sécurité
- Gestion d'erreurs cohérente à travers l'API
- Middlewares composables et réutilisables
- Rate limiting et Helmet inclus
- Shutdown gracieux du serveur
