# 🛠️ GUIDE DE CORRECTION - MadaAgri

Corrections détaillées étape par étape pour résoudre tous les problèmes identifiés.

---

## PRIORITÉ 0️⃣ - ERREURS CRITIQUES (Bloquer le serveur)

### Erreur 1: Fixer authenticateToken dans follows.js

**Fichier:** `src/backend/routes/follows.js`

**CODE ACTUEL (ligne 1-10):**
```javascript
const express = require('express');
const router = express.Router();
const followController = require('../controllers/followController');
const { authenticateToken } = require('../middlewares/authMiddleware');  // ❌ N'EXISTE PAS!

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);  // ❌ ERREUR!
```

**CODE CORRIGÉ:**
```javascript
const express = require('express');
const router = express.Router();
const followController = require('../controllers/followController');
const { authMiddleware } = require('../middlewares/authMiddleware');  // ✅ CORRECT!

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);  // ✅ CORRECT!
```

---

### Erreur 2: Fixer authenticateToken dans collaborations.js

**Fichier:** `src/backend/routes/collaborations.js`

**CODE ACTUEL (ligne 1-10):**
```javascript
const express = require('express');
const router = express.Router();
const collaborationController = require('../controllers/collaborationController');
const { authenticateToken } = require('../middlewares/authMiddleware');  // ❌ N'EXISTE PAS!

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);  // ❌ ERREUR!
```

**CODE CORRIGÉ:**
```javascript
const express = require('express');
const router = express.Router();
const collaborationController = require('../controllers/collaborationController');
const { authMiddleware } = require('../middlewares/authMiddleware');  // ✅ CORRECT!

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);  // ✅ CORRECT!
```

---

### Erreur 3: Enregistrer les routes follows et collaborations

**Fichier:** `src/backend/routes/index.js`

**CODE ACTUEL (ligne 1-15):**
```javascript
const { router: authRouter } = require('./auth');
const postsRouter = require('./posts');
const usersRouter = require('./users');
const productsRouter = require('./products');
const reservationsRouter = require('./reservations');
const messagesRouter = require('./messages');
const conversationsRouter = require('./conversations');
const networkRouter = require('./network');
const notificationsRouter = require('./notifications');
const analysisRouter = require('./analysis');
const uploadRouter = require('./upload');
const healthRouter = require('./health');
const optimizationRouter = require('./optimization');
const parcelsRouter = require('./parcels');
// ❌ MANQUE: follows et collaborations!
```

**CODE CORRIGÉ:**
```javascript
const { router: authRouter } = require('./auth');
const postsRouter = require('./posts');
const usersRouter = require('./users');
const productsRouter = require('./products');
const reservationsRouter = require('./reservations');
const messagesRouter = require('./messages');
const conversationsRouter = require('./conversations');
const networkRouter = require('./network');
const notificationsRouter = require('./notifications');
const analysisRouter = require('./analysis');
const uploadRouter = require('./upload');
const healthRouter = require('./health');
const optimizationRouter = require('./optimization');
const parcelsRouter = require('./parcels');
const followsRouter = require('./follows');           // ✅ AJOUT
const collaborationsRouter = require('./collaborations');  // ✅ AJOUT
```

**Et dans registerRoutes() - CODE ACTUEL (ligne 55-60):**
```javascript
  // Routes sociales et feed
  app.use('/api/posts', postsRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/network', networkRouter);
  app.use('/api/follows', networkRouter);  // ❌ MAUVAIS! Pointe vers networkRouter
  
  // Routes produits
  app.use('/api/products', productsRouter);
```

**CODE CORRIGÉ:**
```javascript
  // Routes sociales et feed
  app.use('/api/posts', postsRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/network', networkRouter);
  app.use('/api/follows', followsRouter);              // ✅ CORRECT
  app.use('/api/collaborations', collaborationsRouter); // ✅ AJOUT
  
  // Routes produits
  app.use('/api/products', productsRouter);
```

---

## PRIORITÉ 1️⃣ - ROUTES DUPLIQUÉES (Architecture)

### Erreur 4: Supprimer les routes de panier/réservation de products.js

**Fichier:** `src/backend/routes/products.js`

**CODE ACTUEL (ligne 1-20):**
```javascript
const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const ReservationController = require('../controllers/reservationController');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.post('/', authMiddleware, ProductController.createProduct);
router.get('/my', authMiddleware, ProductController.getMyProducts);
router.put('/:id', authMiddleware, ProductController.updateProduct);
router.delete('/:id', authMiddleware, ProductController.deleteProduct);
router.patch('/:id/toggle', authMiddleware, ProductController.toggleProductAvailability);
router.get('/', ProductController.getMarketplaceProducts);
router.get('/marketplace/all', ProductController.getMarketplaceProducts);
router.get('/:id', ProductController.getProductDetails);
router.post('/cart', authMiddleware, ReservationController.addToCart);  // ❌ À SUPPRIMER
router.get('/cart', authMiddleware, ReservationController.getCart);     // ❌ À SUPPRIMER
// ... autres routes de cart et reservations à supprimer aussi
```

**CODE CORRIGÉ:**
```javascript
const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Routes de produits uniquement
router.post('/', authMiddleware, ProductController.createProduct);
router.get('/my', authMiddleware, ProductController.getMyProducts);
router.put('/:id', authMiddleware, ProductController.updateProduct);
router.delete('/:id', authMiddleware, ProductController.deleteProduct);
router.patch('/:id/toggle', authMiddleware, ProductController.toggleProductAvailability);
router.get('/', ProductController.getMarketplaceProducts);
router.get('/marketplace/all', ProductController.getMarketplaceProducts);
router.get('/:id', ProductController.getProductDetails);

// Les routes de panier et réservations doivent UNIQUEMENT être dans reservations.js
module.exports = router;
```

**Vérifier que reservations.js a TOUTES les routes (ligne 5-14):**
```javascript
router.post('/cart', authMiddleware, ReservationController.addToCart);
router.get('/cart', authMiddleware, ReservationController.getCart);
router.patch('/cart/:cartItemId', authMiddleware, ReservationController.updateCartItem);
router.delete('/cart/:cartItemId', authMiddleware, ReservationController.removeFromCart);
router.post('/', authMiddleware, ReservationController.createReservation);
router.get('/', authMiddleware, ReservationController.getMyReservations);
router.get('/received', authMiddleware, ReservationController.getReceivedReservations);
router.patch('/:id/confirm', authMiddleware, ReservationController.confirmReservation);
router.patch('/:id/cancel', authMiddleware, ReservationController.cancelReservation);
```

✅ Cela est bon - reservations.js a déjà toutes les routes.

---

## PRIORITÉ 2️⃣ - CODE ORPHELIN (Nettoyage)

### Erreur 5: Supprimer userController.js (inutilisé)

**Option A - NETTOYER:** Supprimer le fichier s'il n'est vraiment pas utilisé
```bash
rm src/backend/controllers/userController.js
```

**Option B - UTILISER:** Si on veut vraiment l'utiliser
- Mettre à jour users.js pour importer et utiliser les fonctions
- Actuellement users.js écrit tout en inline

**RECOMMANDATION:** Option A - Supprimer car les fonctions ne sont jamais appelées.

---

### Erreur 6: Supprimer uploadController.js (inutilisé)

**Même situation que userController.js**

**Option A - NETTOYER:** Supprimer le fichier
```bash
rm src/backend/controllers/uploadController.js
```

**Option B - UTILISER:** Mettre à jour upload.js pour l'utiliser (complexe avec multer/cloudinary middleware)

**RECOMMANDATION:** Option A - Supprimer car jamais utilisé.

---

## PRIORITÉ 3️⃣ - STANDARDISATION (Code Quality)

### Erreur 7: Standardiser les exports des contrôleurs

**Situation actuelle:**
- Certains utilisent `exports.fonction`
- D'autres utilisent `class + module.exports = Class`
- Incohérence

**RECOMMANDATION:** Utiliser le pattern de classe + module.exports partout:

**Exemple - followController.js refactorisé:**

**CODE ACTUEL:**
```javascript
const db = require('../db');

exports.followUser = async (req, res) => { ... };
exports.unfollowUser = async (req, res) => { ... };
exports.getFollowers = async (req, res) => { ... };
exports.getFollowing = async (req, res) => { ... };
exports.getRelationshipStatus = async (req, res) => { ... };

module.exports = exports;  // ❌ Redondant
```

**CODE REFACTORISÉ:**
```javascript
const db = require('../db');

class FollowController {
  static async followUser(req, res) { ... }
  static async unfollowUser(req, res) { ... }
  static async getFollowers(req, res) { ... }
  static async getFollowing(req, res) { ... }
  static async getRelationshipStatus(req, res) { ... }
}

module.exports = FollowController;
```

**Et dans les routes:**
```javascript
const FollowController = require('../controllers/followController');
router.post('/:userId', FollowController.followUser);
// etc.
```

**Appliquer le même pattern à:**
- collaborationController.js
- userController.js (si on le garde)
- uploadController.js (si on le garde)

---

## PRIORITÉ 4️⃣ - DOCUMENTATION (Clarity)

### Erreur 8: Clarifier les routes chevauchantes

**Documenter** dans le README ou dans un fichier de documentation API:

```markdown
## Structure des Routes

### Routes de Produits (`/api/products`)
- `GET /` - Récupérer tous les produits
- `GET /:id` - Détails d'un produit
- `POST /` - Créer un produit (agriculteur)
- `PUT /:id` - Modifier un produit
- `DELETE /:id` - Supprimer un produit

### Routes de Réservations/Panier (`/api/reservations`)
- `GET /cart` - Récupérer le panier de l'utilisateur
- `POST /cart` - Ajouter au panier
- `PATCH /cart/:cartItemId` - Modifier une quantité
- `DELETE /cart/:cartItemId` - Supprimer du panier
- `POST /` - Créer une réservation (transformer le panier)
- `GET /` - Voir ses propres réservations
- `GET /received` - Voir les réservations reçues
- `PATCH /:id/confirm` - Confirmer une réservation
- `PATCH /:id/cancel` - Annuler une réservation
```

---

## 📋 CHECKLIST DE CORRECTION

- [ ] Corriger import `authenticateToken` → `authMiddleware` dans follows.js
- [ ] Corriger import `authenticateToken` → `authMiddleware` dans collaborations.js
- [ ] Ajouter followsRouter et collaborationsRouter dans index.js
- [ ] Enregistrer `/api/follows` et `/api/collaborations` routes
- [ ] Supprimer les routes de cart/réservation de products.js
- [ ] Supprimer userController.js (inutilisé)
- [ ] Supprimer uploadController.js (inutilisé)
- [ ] Refactoriser followController vers pattern de classe
- [ ] Refactoriser collaborationController vers pattern de classe
- [ ] Tester que `/api/follows` fonctionne
- [ ] Tester que `/api/collaborations` fonctionne
- [ ] Vérifier qu'aucune route n'est cassée

---

## 🧪 TESTS DE VALIDATION

Après les corrections:

```bash
# 1. Lancer le serveur
npm run dev

# 2. Vérifier qu'il ne crash pas au démarrage
# Résultat attendu: "Server running on http://localhost:4000"

# 3. Tester les routes follows
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/follows/123

# 4. Tester les routes collaborations
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/collaborations/123

# 5. Vérifier que les routes de panier sont UNIQUEMENT sous /api/reservations
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/reservations/cart

# 6. Vérifier qu'il n'y a pas de doublons
# Aucune requête ne devrait aller à /api/products/cart
```

---

## 📚 RESSOURCES

- [Express Router Documentation](https://expressjs.com/en/api/router.html)
- [Node.js Module System](https://nodejs.org/en/docs/guides/nodejs-module-system/)
- [Controller Pattern in Express](https://www.npmjs.com/package/express-controller)

