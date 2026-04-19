# 🔍 Analyse Complète - Logique Like Persistante

**Date:** 18 Avril 2026  
**Status:** 🔴 **PROBLÈME IDENTIFIÉ**

---

## 📊 Flux Complet du Like - Avant/Après Actualisation

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUX INITIAL (Premier Like)                   │
├─────────────────────────────────────────────────────────────────┤

1. Frontend: User clique sur le coeur
   ❤️ gris → handleClick → toggleLike()

2. Frontend: API call
   POST /api/posts/{postId}/like
   
3. Backend: Enregistrement en BD
   INSERT INTO post_likes (post_id, user_id)
   ✅ Sauvegardé en DB

4. Frontend: State update
   setIsLiked(true)
   ❤️ gris → ❤️ ROUGE
   ✅ Affiche le like visiblement

└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│              PROBLÈME - Après actualisation F5                   │
├─────────────────────────────────────────────────────────────────┤

1. Page actualise → React reset state
   setIsLiked(post.user_likes === 1)  ← LIGNE 11 PostCard.jsx

2. GET /api/posts est appelé pour récupérer les posts

3. Backend retourne les posts MAIS...
   ❌ MANQUE LE CHAMP user_likes!
   
   Réponse actuelle:
   {
     id: "123",
     content: "...",
     likes_count: 42,      ← OK
     comments_count: 5,    ← OK
     user_likes: ???       ← ❌ ABSENT!
   }

4. Frontend: État par défaut
   post.user_likes === 1  → undefined === 1 → FALSE
   ❤️ redevient GRIS
   
5. Résultat:
   ❌ Perte du like visuellement
   ✅ Like toujours en BD (on peut le re-like → 2 likes!)

└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Source du Problème

### PostCard.jsx - Ligne 11
```javascript
const [isLiked, setIsLiked] = useState(post.user_likes === 1);
```

**Attend:** `post.user_likes: 0 ou 1`  
**Reçoit:** `post.user_likes: undefined`  
**Résultat:** `undefined === 1` → `false` → Like disparaît!

---

### Backend: posts.js - GET /api/posts - Ligne 31-40

**Code Actuel:**
```javascript
const [postRows] = await pool.query(
  `SELECT p.*, u.display_name, u.email, u.region_id AS author_region_id,
    (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) AS likes_count,
    (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id) AS comments_count
   FROM posts p
   JOIN users u ON u.id = p.author_id
   ORDER BY p.created_at DESC`
);
```

**Récupère:**
- ✅ `likes_count` - Nombre total de likes
- ✅ `comments_count` - Nombre total de commentaires
- ❌ **MANQUE:** `user_likes` - Si l'utilisateur connecté a aimé

---

## 🔧 Solution Requise

### Modification Backend: posts.js

**Ajouter une vérification** dans le SELECT pour savoir si l'utilisateur a aimé le post:

```javascript
// AVANT (Ligne 34)
(SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) AS likes_count,

// APRÈS (Ajouter cette ligne)
(SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) AS likes_count,
(SELECT IF(COUNT(*) > 0, 1, 0) FROM post_likes WHERE post_id = p.id AND user_id = ?) AS user_likes,
```

**Paramètre:** Ajouter `userId` aux paramètres de la query.

---

## 📋 Logique de Persistance Correcte

```
┌──────────────────────────────────────────────────────┐
│        FLUX CORRECT AVEC PERSISTANCE                 │
├──────────────────────────────────────────────────────┤

PREMIER CHARGEMENT:
├─ GET /api/posts?sort=recent
├─ Backend SELECT avec user_likes
├─ Retour: { user_likes: 0, likes_count: 5 }
└─ Frontend: ❤️ gris

USER LIKE:
├─ POST /api/posts/{id}/like
├─ Backend: INSERT post_likes
├─ Frontend: setIsLiked(true)
└─ Affichage: ❤️ ROUGE #e91e63

ACTUALISATION F5:
├─ GET /api/posts?sort=recent
├─ Backend SELECT avec user_likes
├─ Retour: { user_likes: 1, likes_count: 6 }
├─ Frontend: post.user_likes === 1 → TRUE
└─ Affichage: ❤️ ROUGE (PERSISTANT!)

RETRAIT DU LIKE:
├─ DELETE /api/posts/{id}/like
├─ Backend: DELETE post_likes
├─ Frontend: setIsLiked(false)
└─ Affichage: ❤️ gris

NOUVELLE ACTUALISATION:
├─ GET /api/posts?sort=recent
├─ Backend SELECT avec user_likes
├─ Retour: { user_likes: 0, likes_count: 5 }
├─ Frontend: post.user_likes === 1 → FALSE
└─ Affichage: ❤️ gris (PERSISTANT!)

└──────────────────────────────────────────────────────┘
```

---

## 💾 Vérification Base de Données

### Table: post_likes
```sql
CREATE TABLE post_likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_like (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**État Existant:** ✅ Table correctement configurée
- Contrainte UNIQUE: évite les doublons
- Cascade: suppression auto si post/user supprimé

---

## 📝 Flux Données Complet

### Frontend - HomeFeed.jsx

```javascript
// 1. Récupération initiale
async function fetchPosts() {
  const list = await dataApi.fetchPosts({ sort, q });
  setPosts(list);
  // Posts contient user_likes pour chaque post ✅
}

// 2. User like
async function handleLike(postId) {
  await dataApi.likePost(postId);  // API call
  setPosts((prevPosts) =>
    prevPosts.map((post) =>
      post.id === postId
        ? {
            ...post,
            user_likes: 1,            // ✅ Update local state
            likes_count: post.likes_count + 1
          }
        : post
    )
  );
}
```

### Frontend - PostCard.jsx

```javascript
// État initial basé sur post.user_likes
const [isLiked, setIsLiked] = useState(post.user_likes === 1);
// Avec user_likes:
//  - 1 → isLiked = true  → ❤️ ROUGE
//  - 0 → isLiked = false → ❤️ gris
//  - undefined → isLiked = false → ❤️ gris ❌ PROBLÈME!
```

### Backend - posts.js

```javascript
// GET /api/posts retourne
{
  id: "uuid",
  content: "...",
  author_id: "userId",
  likes_count: 42,
  comments_count: 5,
  user_likes: 1,  // ✅ CRUCIAL - Si l'utilisateur a aimé
  ...
}
```

---

## ✅ Checklist de Fix

- [ ] Modifier le SELECT backend pour inclure `user_likes`
- [ ] Vérifier que `user_likes` est 0 ou 1 (pas null)
- [ ] Tester: Like → Actualiser → Like persiste
- [ ] Tester: Unlike → Actualiser → Unlike persiste
- [ ] Vérifier DB: post_likes table a les enregistrements

---

## 🎯 Résumé du Problème

| Point | Status | Détail |
|-------|--------|--------|
| **Like API** | ✅ OK | POST /api/posts/{id}/like fonctionne |
| **Unlike API** | ✅ OK | DELETE /api/posts/{id}/like fonctionne |
| **Sauvegarde BD** | ✅ OK | Les likes s'enregistrent |
| **Récupération** | ❌ MANQUE | GET /posts ne retourne PAS user_likes |
| **Persistance** | ❌ CASSÉE | Sans user_likes, state reset après F5 |

**Solution:** Ajouter `user_likes` au SELECT du GET /api/posts

---

## 🔧 Code à Modifier

### Fichier: src/backend/routes/posts.js
**Ligne environ:** 31-40

**Avant:**
```javascript
const [postRows] = await pool.query(
  `SELECT p.*, u.display_name, u.email, u.region_id AS author_region_id,
    (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) AS likes_count,
    (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id) AS comments_count
   FROM posts p
   JOIN users u ON u.id = p.author_id
   ORDER BY p.created_at DESC`
);
```

**Après:**
```javascript
const [postRows] = await pool.query(
  `SELECT p.*, u.display_name, u.email, u.region_id AS author_region_id,
    (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) AS likes_count,
    (SELECT IF(COUNT(*) > 0, 1, 0) FROM post_likes WHERE post_id = p.id AND user_id = ?) AS user_likes,
    (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id) AS comments_count
   FROM posts p
   JOIN users u ON u.id = p.author_id
   ORDER BY p.created_at DESC`,
  [userId]  // Ajouter userId comme paramètre
);
```

---

**Impact:** Après cette modification, les likes seront persistants! 🚀
