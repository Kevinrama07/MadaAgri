# Algorithme de Classement des Publications - Documentation Technique

## 📋 Résumé d'implémentation

**Objectif** : Afficher les publications les plus pertinentes pour l'utilisateur au lieu d'un simple ordre chronologique.

**Statut** : ✓ Implémenté et intégré

---

## 🏗️ Architecture

### Fichiers modifiés/créés

```
src/backend/
├── server.js (MODIFIÉ)
│   └─ Import du service + modification endpoint GET /api/posts
├── services/ (CRÉÉ)
│   └─ postScoringService.js (NOUVEAU)
```

### Structure du service

Le fichier `postScoringService.js` exporte 5 fonctions :

```javascript
{
  calculatePostScore,                      // Fonction principale
  calculateEngagementScore,                // Sous-fonction
  calculateRecencyScore,                   // Sous-fonction
  calculateUserAffinityScore,              // Sous-fonction
  calculateAgriculturalRelevanceScore      // Sous-fonction
}
```

---

## 🧮 Formule de scoring

### Composants

```
SCORE = (Engagement × 0.4) + (Affinité × 0.3) + (Récence × 0.2) + (Pertinence × 0.1)
```

#### 1️⃣ ENGAGEMENT (40%)
**Formule** : `log(likes×2 + commentaires×3 + 1) × 0.4`

- Likes comptent 2× 
- Commentaires comptent 3× (plus de poids)
- Log pour normaliser les grands nombres

**Rationale** : Favoriser les publications populaires sans les dominer

#### 2️⃣ AFFINITÉ UTILISATEUR (30%)
**Bonus points** :
- `+5` si l'utilisateur suit l'auteur
- `+3` si même région que l'auteur
- `+2` si interaction passée (like/commentaire)

**Poids** : `× 0.3`

**Rationale** : Favoriser les publications des personnes proches/pertinentes

#### 3️⃣ RÉCENCE (20%)
**Formule** : `1 / (heures_depuis_publication + 1) × 0.2`

- Varie de 1.0 (posté à l'instant) à ~0
- `+1` pour éviter division par zéro

**Rationale** : Favoriser les contenus frais sans ignorer les anciens

#### 4️⃣ PERTINENCE AGRICOLE (10%)
**Bonus points** :
- `+5` si même culture
- `+3` si même type d'activité

**Poids** : `× 0.1`

**Rationale** : Favoriser les contenus spécialisés (poids faible car données optionnelles)

---

## 📊 Exemple de calcul

```javascript
// Post: 20 likes, 3 commentaires, créé il y a 2 heures, auteur suivi
const post = {
  id: 'post-123',
  author_id: 'user-456',
  content: 'Bonne récolte de riz !',
  likes_count: 20,
  comments_count: 3,
  created_at: '2025-04-17T11:00:00Z',
  author_region_id: 'region-a'
};

const currentUser = {
  id: 'user-001',
  region_id: 'region-a'
};

const following = new Set(['user-456']); // Suit l'auteur
const userInteracted = new Set([]); // Pas interagi

// Calcul
// Engagement = log(20*2 + 3*3 + 1) = log(50) ≈ 3.912 × 0.4 ≈ 1.565
// Affinité = (5 + 3) × 0.3 = 8 × 0.3 = 2.4
// Récence = 1/(2+1) × 0.2 = 0.333 × 0.2 ≈ 0.067
// Pertinence = 0 × 0.1 = 0

// TOTAL SCORE ≈ 1.565 + 2.4 + 0.067 + 0 ≈ 4.032
```

---

## 🔄 Flux d'intégration

### Avant (logique)
```
1. GET /api/posts → Query tous posts
2. Filtrer par visibilité
3. Chercher si q (texte)
4. Trier par popularité OU chronologie
5. Retourner posts
```

### Après (nouvelle logique)
```
1. GET /api/posts → Query tous posts
2. Récupérer abonnements utilisateur
3. Récupérer interactions passées de l'utilisateur
4. Filtrer par visibilité
5. Chercher si q (texte)
6. ✨ CALCULER SCORE pour chaque post
7. ✨ TRIER par score (ou par paramètre sort)
8. Retourner posts avec scores
```

---

## 📡 Contrats d'API

### Requête
```http
GET /api/posts?sort=relevance&q=riz HTTP/1.1
Authorization: Bearer <token>
```

**Query Parameters** :
| Param | Valeurs | Défaut | Description |
|---|---|---|---|
| `sort` | `relevance` \| `popular` \| `recent` | `relevance` | Algorithm de tri |
| `q` | string | (aucun) | Filtrer par texte |

### Réponse
```json
{
  "posts": [
    {
      "id": "post-uuid",
      "author_id": "user-uuid",
      "content": "...",
      "image_url": "...",
      "visibility": "public",
      "created_at": "2025-04-17T10:00:00Z",
      "updated_at": "2025-04-17T10:00:00Z",
      "display_name": "Jean Dupont",
      "email": "jean@example.com",
      "author_region_id": "region-uuid",
      "likes_count": 12,
      "comments_count": 4,
      "score": 3.847  // ← NOUVEAU
    }
  ]
}
```

---

## ⚠️ Gestion d'erreurs & cas limites

### Robustesse

| Situation | Comportement |
|---|---|
| `likes_count` null | Défaut = 0 |
| `comments_count` null | Défaut = 0 |
| `created_at` invalide | recency = 0 |
| Post sans région auteur | Pas de bonus région |
| Utilisateur sans région | Pas de comparaison région |
| culture_id manquant | Pas de bonus culture |
| activity_type manquant | Pas de bonus activité |
| Score < 0 | Ramené à 0 |

### Pas de breaking changes

✓ Endpoints existants toujours fonctionnels
✓ Format JSON préservé (ajout de `score`)
✓ Base de données non modifiée
✓ Logique de filtrage visibilité préservée

---

## 🎯 Comportements validés

### 1. Posts avec engagement remontent
```
Post A: 20 likes, 5 commentaires
Post B: 2 likes, 1 commentaire
→ Post A score > Post B score
```

### 2. Posts d'auteurs suivis prioritaires
```
User suit Author A mais pas Author B
Post A (Author A) et Post B (Author B) même engagement
→ Post A score > Post B score (bonus +5)
```

### 3. Posts récents favorisés (modérément)
```
Post A: créé il y a 1h, 0 engagement
Post B: créé il y a 30 jours, 50 likes
Avec sort=relevance:
→ Post B remonte (recency < engagement)
```

### 4. Même région boost pertinence
```
User à Vakinankaratra, Author à Vakinankaratra
Même engagement, même engagement temporel
→ Posts du même auteur remontent (+3 points)
```

---

## 🚀 Performance

### Complexité

**Par requête** :
- Récupère tous les posts : O(n) DB query
- Récupère abonnements : O(1) DB query
- Récupère interactions : O(1) DB query (index sur user_id)
- Mappe + score : O(n) JS
- Tri : O(n log n)

**Total** : O(n log n) par utilisateur (acceptable)

### Potentiel optimisation

Si dataset devient grand (>10K posts/jour) :
1. **Pagination** - Ajouter `limit/offset`
2. **Caching** - Mémoïser scores 60-300 secondes
3. **Weighting dynamique** - Ajuster poids selon période/contexte
4. **Index DB** - Optimiser les JOINs

---

## 🧪 How to test

Voir `GUIDE_SCORING_POSTS.md` pour plan de test complet.

Quick start :
```bash
cd src/backend
node server.js

# Terminal 2
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:4000/api/posts?sort=relevance"
```

---

## 📚 Utilitaires

### Fonction principale

```javascript
calculatePostScore(post, currentUser, following = new Set(), userInteracted = new Set())
```

**Paramètres** :
- `post` (Object) : Publication avec id, author_id, content, created_at, likes_count, comments_count, culture_id, activity_type, author_region_id
- `currentUser` (Object) : {id, region_id, preferred_culture_id, activity_type}
- `following` (Set) : IDs des utilisateurs suivis
- `userInteracted` (Set) : IDs des posts aimés/commentés par l'utilisateur

**Retour** : `number` (0 à ~10, peut dépasser selon engagement)

---

## 🔮 Future enhancements

1. **Machine Learning** - Apprendre poids optimaux depuis engagement réel
2. **Trending** - Boost posts populaires du jour vs années anciennes
3. **Serendipity** - Injecter 10% randomness pour découverte
4. **Language** - Favoriser contenu dans langue de l'utilisateur
5. **Hashtags** - Bonus pour hashtags pertinents
6. **Mentions** - Bonus si post mentionne follower
7. **Image** - Bonus pour posts avec images
8. **Time zone** - Adapter heure créé à timezone utilisateur
