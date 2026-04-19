# 🧪 Test Script - Vérifier la Persistance des Likes

## Test 1: Vérifier que user_likes est retourné

```bash
# Récupérer les posts (avec authentification)
curl -X GET "http://localhost:4000/api/posts" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Vérifier dans la réponse:
{
  "posts": [
    {
      "id": "post-uuid",
      "content": "...",
      "likes_count": 42,
      "user_likes": 1,        # ✅ DOIT ÊTRE PRÉSENT
      "comments_count": 5,
      ...
    }
  ]
}
```

## Test 2: Scenario Complet (Manuel)

### Étape 1: Se connecter
```bash
curl -X POST "http://localhost:4000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password123"}'

# Récupérer le token de la réponse
Response: { "token": "eyJhbGc...", "user": {...} }
```

### Étape 2: Liker un post
```bash
TOKEN="eyJhbGc..."
POST_ID="uuid-du-post"

curl -X POST "http://localhost:4000/api/posts/$POST_ID/like" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Réponse attendue:
{ "ok": true }

# Vérifier en BD:
SELECT * FROM post_likes WHERE post_id = 'uuid-du-post';
# Doit afficher 1 ligne
```

### Étape 3: Récupérer les posts
```bash
curl -X GET "http://localhost:4000/api/posts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Réponse: 
# user_likes: 1  ✅ Le like est visible!
```

### Étape 4: Simuler une actualisation (nouvelle requête)
```bash
curl -X GET "http://localhost:4000/api/posts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Réponse:
# user_likes: 1  ✅ PERSISTANT!
```

### Étape 5: Retirer le like
```bash
curl -X DELETE "http://localhost:4000/api/posts/$POST_ID/like" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Réponse:
{ "ok": true }
```

### Étape 6: Vérifier après suppression
```bash
curl -X GET "http://localhost:4000/api/posts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Réponse:
# user_likes: 0  ✅ Like bien retiré
```

## Test 3: Vérification SQL Directe

```sql
-- Voir les likes d'un post
SELECT * FROM post_likes WHERE post_id = 'uuid-du-post';

-- Voir les likes d'un utilisateur
SELECT * FROM post_likes WHERE user_id = 'uuid-de-l-utilisateur';

-- Compter les likes totaux d'un post
SELECT COUNT(*) FROM post_likes WHERE post_id = 'uuid-du-post';
```

## ✅ Critères de Succès

- [ ] Endpoint GET /api/posts retourne `user_likes` pour chaque post
- [ ] `user_likes` = 1 si l'utilisateur a aimé
- [ ] `user_likes` = 0 si l'utilisateur n'a pas aimé
- [ ] Like persiste après actualisation
- [ ] Unlike persiste après actualisation
- [ ] Compteur `likes_count` s'incrémente/décrémente correctement
- [ ] Pas d'erreurs DB
- [ ] Frontend reçoit `user_likes` et l'affiche correctement

## 🎯 Si Problème

Si user_likes n'apparaît pas:

1. Vérifier que le backend a redémarré (npm start)
2. Vérifier que userId est passé en paramètre dans la query
3. Vérifier la syntaxe SQL: `IF(COUNT(*) > 0, 1, 0)`
4. Vérifier les logs: `console.log([postRows])`
5. Vérifier la BD: `SHOW COLUMNS FROM posts;`
