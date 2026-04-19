# 🚀 Quick Start - Commandes Essentielles

## ⚡ Démarrage (2 minutes)

```bash
# 1. Aller au dossier
cd src/backend

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
# Éditer .env ou laisser les defaults

# 4. Initialiser la BD (si première fois)
mysql -u root -p < init.sql

# 5. Lancer le serveur
npm run dev

# ✅ Résultat: API running on http://localhost:4000
```

---

## 🧪 Tester l'API

### Health Check
```bash
curl http://localhost:4000/api/health
```

### Créer un utilisateur
```bash
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123",
    "displayName": "Test User"
  }'
```

### Se connecter
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123"
  }'
# Copier le token retourné
```

### Accéder à l'API (avec token)
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:4000/api/users/profile
```

---

## 📚 Documentation

| Besoin | Lire |
|--------|------|
| Comprendre la structure | `BACKEND_STRUCTURE.md` |
| Créer une route | `IMPLEMENTATION_GUIDE.md` |
| Déployer | `DEPLOYMENT_CHECKLIST.md` |
| Bug/Erreur | `TROUBLESHOOTING.md` |
| Roadmap future | `ROADMAP_BACKEND.md` |
| Accueil | `DOCUMENTATION_INDEX.md` |

---

## 💻 Commandes NPM

```bash
npm run dev              # Démarrage développement (auto-reload)
npm start                # Démarrage normal
npm test                 # Exécuter les tests
npm run lint             # Vérifier le code
npm run lint:fix         # Corriger automatiquement
npm list                 # Voir les dépendances
npm audit                # Vérifier les vulnérabilités
npm audit fix            # Corriger les vulnérabilités
```

---

## 📝 Structure des Réponses

### ✅ Succès
```json
{
  "success": true,
  "message": "Success",
  "data": { /* données */ },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### ❌ Erreur
```json
{
  "success": false,
  "error": "Error message",
  "errorType": "ValidationError",
  "validationErrors": { /* si applicable */ },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 🔐 Configuration (.env)

Minimum pour démarrer:
```env
NODE_ENV=development
PORT=4000
HOST=localhost

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=madaagri

JWT_SECRET=changeme-secret
CORS_ORIGIN=*
```

---

## 🔗 Routes Disponibles

```
GET    /api/health                 # Health check
POST   /api/auth/signup            # Créer utilisateur
POST   /api/auth/login             # Auth utilisateur
GET    /api/users/profile          # Profil (auth required)
GET    /api/posts                  # Lister publications
POST   /api/posts                  # Créer publication
GET    /api/products               # Lister produits
POST   /api/products               # Créer produit
GET    /api/messages               # Messages
POST   /api/messages               # Envoyer message
GET    /api/network/suggestions    # Suggestions réseau
```

👉 Pour la liste complète: `BACKEND_STRUCTURE.md`

---

## 🐛 Erreurs Courantes

| Erreur | Solution |
|--------|----------|
| `Cannot find module 'express'` | `npm install` |
| `Port 4000 already in use` | Changer PORT ou `kill -9 <PID>` |
| `connect ECONNREFUSED` (BD) | Démarrer MySQL |
| `Unknown database 'madaagri'` | `mysql -u root -p < init.sql` |
| `Invalid token` | Vérifier le Bearer token |
| `CORS blocked` | Vérifier CORS_ORIGIN |

👉 Plus d'aide: `TROUBLESHOOTING.md`

---

## 📊 Architecture

```
HTTP Requête
    ↓
Helmet (security headers)
    ↓
CORS (validation origin)
    ↓
Body Parser (parse JSON)
    ↓
Request Logger (logging)
    ↓
Rate Limiter (throttle)
    ↓
Route Handler
├─ Validation
├─ Auth (si needed)
└─ Business Logic
    ↓
Response / Error Handler
    ↓
HTTP Réponse
```

---

## 🎯 Prochaines Étapes

### Si vous développez:
1. Créer une nouvelle route (voir `IMPLEMENTATION_GUIDE.md`)
2. Ajouter la validation
3. Tester avec curl
4. Pousser sur git

### Si vous déployez:
1. Lire `DEPLOYMENT_CHECKLIST.md`
2. Configurer le .env production
3. Initialiser la BD
4. Démarre avec PM2
5. Setup monitoring

### Si vous débuggez:
1. Consulter `TROUBLESHOOTING.md`
2. Vérifier les logs: `tail -f src/backend/logs/combined.log`
3. Tester avec curl
4. Vérifier la configuration

---

## 📊 État du Projet

| Aspect | Statut |
|--------|--------|
| Architecture | ✅ Production-Ready |
| Sécurité | ✅ Headers + Rate Limiting |
| Logging | ✅ Winston structuré |
| Validation | ✅ Express-validator |
| Tests | ⏳ Phase 4 |
| Documentation | ✅ Complète |
| Monitoring | ⏳ Phase 7 |

---

## 🆘 Problèmes?

```bash
# 1. Regarder les logs
tail -f src/backend/logs/error.log

# 2. Redémarrer
npm run dev

# 3. Nettoyer
rm -rf node_modules package-lock.json
npm install

# 4. Tester
curl http://localhost:4000/api/health

# 5. Consulter
# TROUBLESHOOTING.md
```

---

## 📚 En Savoir Plus

- **Comprendre:** `BACKEND_STRUCTURE.md`
- **Pratiquer:** `IMPLEMENTATION_GUIDE.md`
- **Déployer:** `DEPLOYMENT_CHECKLIST.md`
- **Dépanner:** `TROUBLESHOOTING.md`
- **Planifier:** `ROADMAP_BACKEND.md`
- **Index complet:** `DOCUMENTATION_INDEX.md`

---

## ✨ Bonus

### VS Code Extensions Recommandées
- REST Client (tester les APIs)
- Thunder Client (alternative Postman)
- MySQL (explorer la BD)
- ESLint (code quality)

### Outils Utiles
- Postman (tester les endpoints)
- TablePlus (gérer la BD)
- Insomnia (alternative Postman)
- ngrok (localhost → internet)

---

## 🎓 Ressources Externes

- [Express.js Docs](https://expressjs.com/)
- [Node.js Docs](https://nodejs.org/)
- [REST API Tutorial](https://restfulapi.net/)
- [Security Best Practices](https://owasp.org/)

---

**Version:** 2.0.0  
**Dernière mise à jour:** 2024  
**Production-Ready:** ✅

Bonne chance! 🚀
