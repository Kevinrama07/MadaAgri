# Guide de test - Algorithme de Classement des Publications

## [✓] Statut d'intégration

✓ Fonction `calculatePostScore` créée
✓ Intégrée au backend (server.js)
✓ Score ajouté à chaque post
✓ Tri par pertinence automatique

---

## 🧪 Plan de test

### 1. Vérifier l'intégration

#### 1.1 Démarrer le serveur
```bash
cd src/backend
npm install  # Si nécessaire
node server.js
```

#### 1.2 Vérifier que l'endpoint répond
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:4000/api/posts"
```

✓ Vérifier que chaque post contient un champ `score`

---

### 2. Tests de logique

#### 2.1 Test Engagement
**Scénario** : Post A avec 10 likes et 5 commentaires remonte avant un post B neuf avec 0 engagement

**Valeurs calculées** :
```
Post A engagement = (10 × 2) + (5 × 3) = 35
Post B engagement = (0 × 2) + (0 × 3) = 0
```

**Vérification** : Créer 2 posts, liker beaucoup le premier, vérifier qu'il remonte

#### 2.2 Test Affinité (Abonnements)
**Scénario** : Post d'un auteur suivi remonte before post d'inconnu

**Bonus** : +5 points si l'utilisateur suit l'auteur

**Vérification** :
1. Créer un compte U1
2. Créer un compte U2
3. U1 suit U2
4. U2 crée un post public
5. U1 récupère les posts → le post de U2 doit être favorisé

#### 2.3 Test Récence
**Scénario** : Post créé il y a 1 heure > post créé il y a 24 heures

**Formule** : `recency = 1 / (heures_depuis_publication + 1)`
```
Post récent (1h ago)   : 1 / (1 + 1) = 0.5
Post ancien (24h ago)  : 1 / (24 + 1) = 0.04
```

**Vérification** : Posts triés par pertinence favorisent les posts récents (mais pas excessivement)

#### 2.4 Test Affinité Régionale
**Scénario** : Post d'un auteur dans la même région que l'utilisateur remonte

**Bonus** : +3 points si même région

**Vérification** :
1. U1 région = "Vakinankaratra"
2. U2 région = "Vakinankaratra"
3. U2 crée un post
4. U1 récupère les posts → score du post de U2 > baseline

#### 2.5 Test Interactions Passées
**Scénario** : Post aimé précédemment remonte légèrement

**Bonus** : +2 points si l'utilisateur a aimé/commenté

**Vérification** :
1. U1 aime post X et post Y
2. U1 récupère le feed
3. Posts X et Y doivent avoir des scores plus élevés

---

### 3. Tests d'utilisation

#### 3.1 Tri par pertinence (défaut)
```bash
GET /api/posts
# ou explicitement
GET /api/posts?sort=relevance
```
→ Posts triés par score décroissant

#### 3.2 Tri par popularité
```bash
GET /api/posts?sort=popular
```
→ Posts triés par engagement uniquement

#### 3.3 Tri par chronologie
```bash
GET /api/posts?sort=recent
```
→ Posts triés par date décroissante

#### 3.4 Filtrage par texte + tri
```bash
GET /api/posts?q=riz&sort=relevance
```
→ Posts contenant "riz" triés par pertinence

---

## 📊 Formule complète de score

```
SCORE = (Engagement × 0.4) + (Affinité × 0.3) + (Récence × 0.2) + (Pertinence × 0.1)

Où :
├─ Engagement = log(likes×2 + commentaires×3 + 1) × 0.4
├─ Affinité = (suivre:5 + région:3 + interaction:2) × 0.3
├─ Récence = [1/(heures+1)] × 0.2
└─ Pertinence = (même_culture:5 + même_activité:3) × 0.1
```

---

## ⚙️ Comportement en cas de données manquantes

| Données manquantes | Comportement |
|---|---|
| `likes_count` | Défaut = 0 |
| `comments_count` | Défaut = 0 |
| `created_at` | Pas d'impact (recency = 0) |
| `region_id` (auteur) | Pas de bonus d'affinité régionale |
| `region_id` (utilisateur) | Pas de bonus d'affinité régionale |
| `culture_id` | Pas de bonus culturel |
| `activity_type` | Pas de bonus d'activité |

⚠️ **Aucune erreur runtime** - valeurs par défaut appliquées

---

## 🔍 Vérification détaillée

### Via logs côté serveur
Optionnel : Ajouter un log dans `postScoringService.js`
```javascript
console.log(`Post ${post.id}: score=${totalScore.toFixed(2)}`);
```

### Via API response
Chaque post retourné contient maintenant :
```json
{
  "id": "...",
  "author_id": "...",
  "content": "...",
  "likes_count": 10,
  "comments_count": 2,
  "score": 2.847,  // ← NOUVEAU
  "display_name": "...",
  "email": "...",
  "author_region_id": "...",
  "created_at": "2025-04-17T10:30:00Z",
  "updated_at": "2025-04-17T10:30:00Z"
}
```

---

## 🎯 Cas d'usage réels

### Cas 1 : Feed contextualisé
```
User : Agriculteur à Vakinankaratra
Posts visibles :
1. Post de producteur local suivi (région + suivre) ✅ HAUT
2. Post avec 50 likes il y a 2h ✅ MOYEN
3. Post très ancien (100 likes) ❌ BAS
4. Post d'inconnu autre région ❌ BAS
```

### Cas 2 : Découverte progressive
```
Utilisateur T0 (nouveau) :
→ Tri défaut = pertinence
→ Posts récents + engagement = découverte rapide

Utilisateur T+30j (engagé) :
→ Abonnements + interactions = feed personnalisé
→ Même région + mêmes cultures = plus pertinent
```

---

## 📝 Points importants

✓ **Pas de modification BDD** - Structure intacte
✓ **Pas de breaking changes** - Endpoints compatibles
✓ **Enrichissement côté API** - `score` ajouté en temps réel
✓ **Pas de cache** - Calcul frais à chaque requête (peut être optimisé plus tard)
✓ **Robuste** - Valeurs null/undefined gérées proprement
✓ **Extensible** - Facile d'ajouter d'autres facteurs de scoring

---

## 🚀 Optimisations futures (optionnelles)

1. **Mémoïsation** - Cacher les scores pendant X secondes
2. **Index DB** - Indexer les colonnes frequently JOINed
3. **Pagination** - Ajouter `limit/offset` si dataset grand
4. **Weighting dynamique** - Ajuster les poids (0.4, 0.3, etc.) selon contexte
5. **Machine Learning** - Apprendre les poids à partir du comportement réel

---

## ✅ Checklist de validation

- [ ] Backend démarre sans erreur
- [ ] GET /api/posts retourne posts avec `score`
- [ ] Scores différents selon utilisateur/contexte
- [ ] sort=relevance applique tri score
- [ ] sort=popular applique tri engagement
- [ ] sort=recent applique tri date
- [ ] Posts d'auteurs suivis remontent
- [ ] Posts avec interactions passées remontent
- [ ] Posts récents favorisés (mais pas excessivement)
- [ ] Aucun crash avec données manquantes
