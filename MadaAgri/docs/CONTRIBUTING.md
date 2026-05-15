# Guide de Contribution - MadaAgri

Merci de votre intérêt pour contribuer à MadaAgri ! Ce document vous guidera à travers le processus.

## 📋 Table des Matières

- [Code de Conduite](#code-de-conduite)
- [Comment Contribuer](#comment-contribuer)
- [Standards de Code](#standards-de-code)
- [Processus de Pull Request](#processus-de-pull-request)
- [Signaler des Bugs](#signaler-des-bugs)
- [Proposer des Fonctionnalités](#proposer-des-fonctionnalités)

## 🤝 Code de Conduite

### Notre Engagement

Nous nous engageons à faire de la participation à ce projet une expérience sans harcèlement pour tous, indépendamment de l'âge, de la taille corporelle, du handicap, de l'ethnicité, de l'identité et de l'expression de genre, du niveau d'expérience, de la nationalité, de l'apparence personnelle, de la race, de la religion ou de l'identité et de l'orientation sexuelles.

### Comportements Attendus

- Utiliser un langage accueillant et inclusif
- Respecter les points de vue et expériences différents
- Accepter gracieusement les critiques constructives
- Se concentrer sur ce qui est le mieux pour la communauté
- Faire preuve d'empathie envers les autres membres

### Comportements Inacceptables

- Utilisation de langage ou d'images sexualisés
- Trolling, commentaires insultants/désobligeants
- Harcèlement public ou privé
- Publication d'informations privées sans permission
- Autre conduite inappropriée dans un cadre professionnel

## 🚀 Comment Contribuer

### 1. Fork et Clone

```bash
# Fork le repo sur GitHub, puis :
git clone https://github.com/votre-username/madaagri.git
cd madaagri
git remote add upstream https://github.com/madaagri/madaagri.git
```

### 2. Créer une Branche

```bash
# Toujours créer une nouvelle branche pour vos changements
git checkout -b feature/ma-nouvelle-fonctionnalite

# Ou pour un bugfix
git checkout -b fix/correction-bug-xyz
```

### 3. Faire vos Changements

- Écrire du code propre et lisible
- Suivre les standards de code (voir ci-dessous)
- Ajouter des tests si nécessaire
- Mettre à jour la documentation

### 4. Commit

```bash
# Ajouter vos fichiers
git add .

# Commit avec un message descriptif
git commit -m "feat: ajouter système de notation produits"
```

#### Convention de Commit

Nous utilisons [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation uniquement
- `style:` Formatage, point-virgules manquants, etc.
- `refactor:` Refactoring de code
- `test:` Ajout de tests
- `chore:` Maintenance, dépendances, etc.

Exemples:
```
feat: ajouter système de paiement mobile money
fix: corriger erreur 500 lors de l'upload d'images
docs: mettre à jour le README avec instructions Docker
style: formater le code selon ESLint
refactor: simplifier la logique de calcul de prix
test: ajouter tests pour le contrôleur de produits
chore: mettre à jour les dépendances npm
```

### 5. Push et Pull Request

```bash
# Push vers votre fork
git push origin feature/ma-nouvelle-fonctionnalite

# Créer une Pull Request sur GitHub
```

## 📝 Standards de Code

### JavaScript/TypeScript

#### ESLint

Nous utilisons ESLint pour maintenir la qualité du code:

```bash
# Backend
cd src/backend
npm run lint
npm run lint:fix

# Frontend
cd src/frontend
npm run lint
```

#### Style Guide

- **Indentation**: 2 espaces
- **Quotes**: Simple quotes `'` pour strings
- **Semicolons**: Oui
- **Trailing commas**: Oui pour multi-lignes
- **Arrow functions**: Préférer pour callbacks
- **Const/Let**: Pas de `var`

Exemple:
```javascript
// ✅ Bon
const getUserById = async (userId) => {
  try {
    const user = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    return user;
  } catch (error) {
    logger.error('Error fetching user:', error);
    throw error;
  }
};

// ❌ Mauvais
var getUserById = function(userId) {
  var user = db.query("SELECT * FROM users WHERE id = " + userId)
  return user
}
```

### React/JSX

- **Components**: PascalCase
- **Props**: camelCase
- **Hooks**: Utiliser hooks modernes
- **State**: useState, useEffect, etc.

Exemple:
```jsx
// ✅ Bon
const ProductCard = ({ product, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    onAddToCart(product.id, quantity);
  };

  return (
    <div className="product-card">
      <h3>{product.title}</h3>
      <button onClick={handleAddToCart}>Ajouter au panier</button>
    </div>
  );
};

// ❌ Mauvais
function product_card(props) {
  var qty = 1;
  return <div><h3>{props.product.title}</h3></div>
}
```

### CSS

- **Modules CSS**: Utiliser CSS Modules
- **Naming**: kebab-case pour classes
- **BEM**: Optionnel mais recommandé

```css
/* ✅ Bon */
.product-card {
  padding: 1rem;
  border-radius: 8px;
}

.product-card__title {
  font-size: 1.5rem;
  font-weight: bold;
}

.product-card--featured {
  border: 2px solid var(--primary-color);
}
```

### Base de Données

- **Noms de tables**: snake_case, pluriel
- **Colonnes**: snake_case
- **Indexes**: Ajouter pour foreign keys et colonnes fréquemment recherchées
- **Migrations**: Toujours créer des migrations pour les changements de schéma

```sql
-- ✅ Bon
CREATE TABLE user_profiles (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  display_name VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_id (user_id)
);

-- ❌ Mauvais
CREATE TABLE UserProfile (
  ID int,
  UserID int,
  DisplayName varchar(255)
);
```

## 🔍 Processus de Pull Request

### Checklist avant PR

- [ ] Code suit les standards du projet
- [ ] Tests ajoutés/mis à jour et passent
- [ ] Documentation mise à jour
- [ ] Pas de conflits avec `main`
- [ ] Commit messages suivent la convention
- [ ] Code review par vous-même effectué

### Template de PR

```markdown
## Description
Brève description des changements

## Type de changement
- [ ] Bug fix
- [ ] Nouvelle fonctionnalité
- [ ] Breaking change
- [ ] Documentation

## Comment tester
1. Étape 1
2. Étape 2
3. Résultat attendu

## Screenshots (si applicable)
[Ajouter screenshots]

## Checklist
- [ ] Tests ajoutés
- [ ] Documentation mise à jour
- [ ] Code review effectué
```

### Processus de Review

1. **Automated checks**: CI/CD doit passer
2. **Code review**: Au moins 1 approbation requise
3. **Testing**: Tester manuellement si nécessaire
4. **Merge**: Squash and merge préféré

## 🐛 Signaler des Bugs

### Avant de Signaler

- Vérifier que le bug n'a pas déjà été signalé
- Vérifier que vous utilisez la dernière version
- Collecter des informations de debug

### Template de Bug Report

```markdown
**Description du bug**
Description claire et concise du bug

**Pour Reproduire**
1. Aller à '...'
2. Cliquer sur '...'
3. Scroller jusqu'à '...'
4. Voir l'erreur

**Comportement attendu**
Ce qui devrait se passer

**Screenshots**
Si applicable

**Environnement**
- OS: [e.g. Windows 11]
- Browser: [e.g. Chrome 120]
- Version: [e.g. 1.2.3]

**Logs**
```
Coller les logs pertinents
```

**Contexte additionnel**
Toute autre information utile
```

## 💡 Proposer des Fonctionnalités

### Template de Feature Request

```markdown
**Problème à résoudre**
Description claire du problème

**Solution proposée**
Comment vous imaginez la solution

**Alternatives considérées**
Autres approches possibles

**Contexte additionnel**
Screenshots, mockups, etc.
```

## 🧪 Tests

### Backend

```bash
cd src/backend

# Tous les tests
npm test

# Tests avec coverage
npm run test:coverage

# Tests en mode watch
npm run test:watch
```

### Frontend

```bash
cd src/frontend

# Tests unitaires
npm test

# Tests E2E
npm run test:e2e
```

### Écrire des Tests

```javascript
// Backend - Jest
describe('ProductController', () => {
  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      const productData = {
        title: 'Test Product',
        price: 1000,
        quantity: 10
      };

      const result = await productController.create(productData);

      expect(result.success).toBe(true);
      expect(result.product.title).toBe('Test Product');
    });

    it('should return error for invalid data', async () => {
      const invalidData = { title: '' };

      await expect(
        productController.create(invalidData)
      ).rejects.toThrow('Validation error');
    });
  });
});
```

## 📚 Documentation

### Code Comments

```javascript
/**
 * Calcule le prix total d'une commande avec réductions
 * @param {Object} order - L'objet commande
 * @param {number} order.subtotal - Sous-total avant réductions
 * @param {string} order.couponCode - Code promo optionnel
 * @returns {Promise<number>} Prix total après réductions
 * @throws {Error} Si le code promo est invalide
 */
async function calculateTotal(order) {
  // Implementation
}
```

### README Updates

Mettre à jour le README si vous:
- Ajoutez une nouvelle fonctionnalité majeure
- Changez les instructions d'installation
- Modifiez les variables d'environnement
- Ajoutez de nouvelles dépendances

## 🎯 Priorités de Contribution

### High Priority
- Corrections de bugs critiques
- Problèmes de sécurité
- Problèmes de performance
- Tests manquants

### Medium Priority
- Nouvelles fonctionnalités
- Améliorations UX
- Documentation
- Refactoring

### Low Priority
- Optimisations mineures
- Nettoyage de code
- Typos

## 💬 Communication

### Channels

- **GitHub Issues**: Bugs et features
- **GitHub Discussions**: Questions générales
- **Pull Requests**: Code reviews
- **Email**: contact@madaagri.mg

### Réponse

- Issues: Réponse sous 48h
- PRs: Review sous 72h
- Questions: Réponse sous 24h

## 🏆 Reconnaissance

Les contributeurs sont listés dans:
- [CONTRIBUTORS.md](CONTRIBUTORS.md)
- Release notes
- README (contributeurs majeurs)

## 📖 Ressources

- [Documentation API](docs/API.md)
- [Guide de Déploiement](docs/DEPLOYMENT.md)
- [Architecture](docs/ARCHITECTURE.md)

## ❓ Questions

Si vous avez des questions, n'hésitez pas à:
1. Consulter la documentation
2. Chercher dans les issues existantes
3. Créer une nouvelle issue
4. Nous contacter par email

---

**Merci de contribuer à MadaAgri ! 🌾**
