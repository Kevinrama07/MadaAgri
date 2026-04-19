# Guide d'Implémentation - Backend MadaAgri

## 1. Démarrage Rapide

### Installation des dépendances
```bash
cd src/backend
npm install
```

### Configuration
```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer .env avec vos valeurs
```

### Démarrage
```bash
# Développement (avec nodemon)
npm run dev

# Production
npm start

# Linting
npm run lint
npm run lint:fix

# Tests
npm test
npm run test:watch
```

## 2. Créer une Nouvelle Route

### Étapes

#### 1. Créer le fichier route
Fichier: `src/backend/routes/nova.js`

```javascript
const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middlewares/errorHandler');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { NotFoundError } = require('../errors/ApiError');

// GET /api/nova
router.get('/', asyncHandler(async (req, res) => {
  // const data = await getNovaData();
  sendSuccess(res, { message: 'List of nova items' });
}));

// GET /api/nova/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  // const item = await getNova(id);
  // if (!item) throw new NotFoundError('Nova not found');
  sendSuccess(res, { id, message: 'Single nova item' });
}));

// POST /api/nova (nécessite authentification)
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const { name } = req.body;
  // const newNova = await createNova({ name, userId: req.user.id });
  sendSuccess(res, { name }, 201, 'Nova created');
}));

module.exports = router;
```

#### 2. Enregistrer la route dans `routes/index.js`

```javascript
// En haut du fichier
const novaRouter = require('./nova');

// Dans la fonction registerRoutes()
app.use('/api/nova', novaRouter);
```

#### 3. Tester la route
```bash
curl http://localhost:4000/api/nova
```

## 3. Ajouter de la Validation

### Utiliser les validateurs

Fichier: `src/backend/routes/nova.js`

```javascript
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middlewares/validators');

// Créer les validateurs
const novaValidators = {
  create: [
    body('name')
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 chars'),
    body('description')
      .optional()
      .isLength({ max: 500 }).withMessage('Max 500 chars'),
  ],
};

// Appliquer dans la route
router.post(
  '/',
  novaValidators.create,
  handleValidationErrors,
  authMiddleware,
  asyncHandler(async (req, res) => {
    // Entrées validées ici
    const { name, description } = req.body;
    sendSuccess(res, { name, description }, 201);
  })
);
```

## 4. Gestion des Erreurs

### Utiliser les classes d'erreur

```javascript
const { 
  ValidationError, 
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError 
} = require('../errors/ApiError');

// Validation
throw new ValidationError('Invalid input', { field: 'error message' });

// Auth
throw new AuthenticationError('Invalid credentials');

// Autorisations
throw new AuthorizationError('You do not have permission');

// Not found
throw new NotFoundError('Resource not found');

// Conflit
throw new ConflictError('User email already exists');
```

### Gestion des erreurs automatique

Toutes les erreurs lancées sont capturées par le middleware global et retournent une réponse cohérente.

## 5. Logging

### Utiliser Winston logger

```javascript
const logger = require('../utils/logger');

logger.info('User logged in', { userId: user.id });
logger.error('Database connection failed', { error: err.message });
logger.warn('Rate limit approaching', { limit: 100, current: 99 });
logger.debug('Processing payload', { data });
```

Fichiers de log:
- `src/backend/logs/error.log` - Erreurs uniquement
- `src/backend/logs/combined.log` - Tous les logs

## 6. Réponses Standardisées

### Format de réponse

Succès:
```json
{
  "success": true,
  "message": "Success",
  "data": { /* data */ },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

Erreur:
```json
{
  "success": false,
  "error": "Error message",
  "errorType": "ValidationError",
  "validationErrors": { /* field errors */ },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

Paginée:
```json
{
  "success": true,
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 7. Authentification

### Protéger les routes

```javascript
const { authMiddleware } = require('../middlewares/authMiddleware');

// Route protégée
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userEmail = req.user.email;
  // ...
}));
```

### Token JWT

Les tokens sont automatiquement vérifiés par authMiddleware.
- Durée de vie: 7 jours (configurable dans .env)
- Format: Bearer token dans Authorization header

## 8. Upload de Fichiers

### Utiliser Cloudinary

```javascript
const uploadRouter = require('./routes/upload');
// Déjà inclus dans les routes enregistrées
```

Via l'endpoint `/api/upload/image`

## 9. Base de Données

### Configuration

Dans `config/index.js` ou variables d'environnement:

```javascript
const config = require('../config');
// Database config: config.database
// {
//   host, port, user, password, database,
//   waitForConnections, connectionLimit, queueLimit
// }
```

### Améliorer la connexion database

Utiliser un pool de connexions (configuré par défaut):

```javascript
const db = require('../db');
// Utilise mysql2/promise avec pool
```

## 10. Testing (Jest + Supertest)

### Structure des tests

```javascript
// tests/auth.test.js
const request = require('supertest');
const app = require('../server');

describe('Authentication Routes', () => {
  it('should signup a new user', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'test@example.com',
        password: 'Password123',
        displayName: 'Test User'
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });
});
```

Lancer les tests:
```bash
npm test              # Une fois
npm run test:watch   # En continu
```

## 11. Checklisté pour Production

- [ ] Créer le fichier `.env` avec tous les secrets
- [ ] Ne JAMAIS committer `.env`
- [ ] Vérifier JWT_SECRET est fort et différent
- [ ] Configurer la base de données production
- [ ] Vérifier CORS_ORIGIN
- [ ] Ajouter un reverse proxy (Nginx)
- [ ] Configurer HTTPS/SSL
- [ ] Mettre en place la surveillance des logs
- [ ] Configurer les backups BD
- [ ] Tester le shutdown gracieux
- [ ] Vérifier les rate limits
- [ ] Configurer l'authentification Cloudinary

## 12. Architecture Recommandée

Pour les routes complexes, utiliser les contrôleurs:

```
routes/
  └── nova.js (orchestration)
    ├── import novaController
    └── apply middleware then call controller

controllers/
  └── novaController.js (logique métier)
    ├── import models, services
    └── fonctions CRUD

services/
  └── novaService.js (logique complexe)
    ├── calculs, transformations
    └── appels multiples à BD

models/
  ├── Nova.js
  └── relations entre modèles
```

## 13. Constantes et Configuration

### Utiliser les constantes

```javascript
const { 
  HTTP_STATUS, 
  USER_ROLES, 
  PAGINATION,
  VALIDATION 
} = require('../constants');

// Au lieu de hardcoder les valeurs
res.status(HTTP_STATUS.OK).json(data);
if (user.role === USER_ROLES.FARMER) { ... }
const { page = PAGINATION.DEFAULT_PAGE } = req.query;
```

## 14. Gestion des Logs en Rotation

Les logs rotationnent automatiquement:
- Taille max: 5MB par fichier
- Historique: 5 fichiers conservés
- Formats: JSON pour faciliter le parsing

Consulter les logs:
```bash
tail -f src/backend/logs/combined.log
```

## 15. Performance

### Points clés

1. **Pagination** - Toujours paginer les listes
2. **Index BD** - Ajouter les indexes sur columns fréquemment requêtées
3. **Connection Pooling** - Configuré par défaut (10 connexions)
4. **Rate Limiting** - Protège contre DOS
5. **Caching** - À ajouter si plusieurs requêtes identiques
6. **Compression** - Ajouter compression middleware si needed

## Contribuer

1. Créer une branche feature
2. Implémenter la feature/bugfix
3. Tester correctement
4. Soumettre une PR

Suivre la structure établie pour la cohérence.
