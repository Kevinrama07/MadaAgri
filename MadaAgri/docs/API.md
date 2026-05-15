# API Documentation - MadaAgri

## Base URL
- **Development**: `http://localhost:4000/api`
- **Production**: `https://api.madaagri.mg/api`

## Authentication
Toutes les routes protégées nécessitent un token JWT dans le header:
```
Authorization: Bearer <token>
```

---

## 🔐 Authentication Routes

### POST /auth/register
Créer un nouveau compte utilisateur.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "displayName": "John Doe",
  "role": "farmer" // farmer | client | trader
}
```

**Response (201):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "John Doe",
    "role": "farmer"
  }
}
```

### POST /auth/login
Se connecter avec email et mot de passe.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "John Doe",
    "role": "farmer"
  }
}
```

### GET /auth/me
Obtenir les informations de l'utilisateur connecté.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "John Doe",
    "role": "farmer",
    "profileImageUrl": "https://...",
    "bio": "Agriculteur passionné",
    "location": "Antananarivo, Madagascar",
    "phone": "+261 34 12 345 67"
  }
}
```

---

## 👤 Users Routes

### GET /users
Obtenir la liste des utilisateurs (avec pagination).

**Query params:**
- `page` (default: 1)
- `limit` (default: 20)
- `role` (optional: farmer | client | trader)

**Response (200):**
```json
{
  "success": true,
  "users": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### GET /users/:id
Obtenir un utilisateur par ID.

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "displayName": "John Doe",
    "role": "farmer",
    "profileImageUrl": "https://...",
    "bio": "...",
    "followersCount": 45,
    "followingCount": 32
  }
}
```

### PUT /users/profile
Mettre à jour son profil.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "displayName": "New Name",
  "bio": "Updated bio",
  "location": "Antananarivo",
  "phone": "+261 34 12 345 67",
  "profileImageUrl": "https://..."
}
```

---

## 📝 Posts Routes

### GET /posts
Obtenir le fil d'actualité.

**Query params:**
- `page` (default: 1)
- `limit` (default: 20)

**Response (200):**
```json
{
  "success": true,
  "posts": [
    {
      "id": "uuid",
      "content": "Belle récolte aujourd'hui!",
      "imageUrl": "https://...",
      "authorId": "uuid",
      "authorName": "John Doe",
      "authorAvatar": "https://...",
      "likesCount": 15,
      "commentsCount": 3,
      "userLikes": 1,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### POST /posts
Créer une nouvelle publication.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "content": "Texte de la publication",
  "imageUrl": "https://...",
  "visibility": "public" // public | followers | private
}
```

### POST /posts/:id/like
Aimer une publication.

### DELETE /posts/:id/like
Retirer son like.

### GET /posts/:id/comments
Obtenir les commentaires d'une publication.

### POST /posts/:id/comments
Ajouter un commentaire.

---

## 🛒 Products Routes

### GET /products
Obtenir la liste des produits.

**Query params:**
- `page`, `limit`
- `category` (optional)
- `region` (optional)
- `minPrice`, `maxPrice` (optional)

**Response (200):**
```json
{
  "success": true,
  "products": [
    {
      "id": "uuid",
      "title": "Riz Makalioka",
      "description": "Riz de qualité supérieure",
      "price": 2500,
      "quantity": 100,
      "unit": "kg",
      "imageUrl": "https://...",
      "farmerId": "uuid",
      "farmerName": "John Doe",
      "regionId": "uuid",
      "regionName": "Vakinankaratra",
      "isAvailable": true
    }
  ]
}
```

### POST /products
Créer un nouveau produit (farmers only).

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "title": "Riz Makalioka",
  "description": "Description du produit",
  "price": 2500,
  "quantity": 100,
  "unit": "kg",
  "imageUrl": "https://...",
  "cultureId": "uuid",
  "regionId": "uuid"
}
```

### PUT /products/:id
Mettre à jour un produit.

### DELETE /products/:id
Supprimer un produit.

---

## 🛍️ Reservations Routes

### POST /reservations
Créer une réservation (commande).

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "productId": "uuid",
  "quantity": 10
}
```

**Response (201):**
```json
{
  "success": true,
  "reservation": {
    "id": "uuid",
    "productId": "uuid",
    "clientId": "uuid",
    "farmerId": "uuid",
    "quantity": 10,
    "unitPrice": 2500,
    "totalPrice": 25000,
    "status": "pending"
  }
}
```

### GET /reservations/my-orders
Obtenir mes commandes (client).

### GET /reservations/received
Obtenir les commandes reçues (farmer).

### PATCH /reservations/:id/status
Changer le statut d'une commande.

**Body:**
```json
{
  "status": "confirmed" // pending | confirmed | cancelled | completed
}
```

---

## 💬 Messages Routes

### GET /conversations
Obtenir la liste des conversations.

**Response (200):**
```json
{
  "success": true,
  "conversations": [
    {
      "conversationId": "user1_user2",
      "otherUser": {
        "id": "uuid",
        "displayName": "Jane Doe",
        "profileImageUrl": "https://..."
      },
      "lastMessage": {
        "content": "Dernier message",
        "createdAt": "2024-01-15T10:30:00Z"
      },
      "unreadCount": 2
    }
  ]
}
```

### GET /messages/:conversationId
Obtenir les messages d'une conversation.

### POST /messages
Envoyer un message.

**Body:**
```json
{
  "recipientId": "uuid",
  "content": "Bonjour!"
}
```

---

## 🔔 Notifications Routes

### GET /notifications
Obtenir mes notifications.

**Response (200):**
```json
{
  "success": true,
  "notifications": [
    {
      "id": "uuid",
      "type": "FOLLOW",
      "payload": {
        "actorId": "uuid",
        "actorName": "John Doe",
        "actorAvatar": "https://..."
      },
      "isRead": false,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### PATCH /notifications/:id/read
Marquer une notification comme lue.

### PATCH /notifications/read-all
Marquer toutes les notifications comme lues.

---

## 🌾 Analysis Routes

### GET /analysis/cultures
Obtenir la liste des cultures.

### GET /analysis/regions
Obtenir la liste des régions.

### POST /analysis/recommend
Obtenir des recommandations de cultures pour une région.

**Body:**
```json
{
  "regionId": "uuid"
}
```

---

## 🚚 Optimization Routes

### POST /optimization/route
Calculer l'itinéraire optimal.

**Body:**
```json
{
  "startLat": -18.8792,
  "startLng": 47.5079,
  "endLat": -19.8792,
  "endLng": 47.6079,
  "waypoints": [
    { "lat": -19.0, "lng": 47.5 }
  ]
}
```

---

## 🔗 Network Routes

### POST /network/follow/:userId
Suivre un utilisateur.

### DELETE /network/follow/:userId
Ne plus suivre un utilisateur.

### GET /network/followers/:userId
Obtenir les abonnés d'un utilisateur.

### GET /network/following/:userId
Obtenir les abonnements d'un utilisateur.

### POST /network/collaborations/invite
Envoyer une invitation de collaboration.

**Body:**
```json
{
  "recipientId": "uuid",
  "message": "Collaborons ensemble!"
}
```

### PATCH /network/collaborations/:id/accept
Accepter une invitation.

### PATCH /network/collaborations/:id/decline
Refuser une invitation.

---

## 📤 Upload Routes

### POST /upload/image
Uploader une image.

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Body (form-data):**
- `image`: File

**Response (200):**
```json
{
  "success": true,
  "url": "https://cloudinary.com/..."
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation error",
  "details": [...]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Token invalide ou expiré"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Accès refusé"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Ressource non trouvée"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Erreur serveur"
}
```

---

## Rate Limiting

- **Auth routes**: 5 requêtes / 15 minutes
- **Read routes**: 100 requêtes / 15 minutes
- **Write routes**: 50 requêtes / 15 minutes

---

## WebSocket Events

### Connection
```javascript
socket.on('connect', () => {
  socket.emit('authenticate', { token: 'jwt_token' });
});
```

### Messages
```javascript
// Recevoir un message
socket.on('new_message', (message) => {
  console.log(message);
});

// Envoyer un message
socket.emit('send_message', {
  recipientId: 'uuid',
  content: 'Hello!'
});
```

### Notifications
```javascript
socket.on('new_notification', (notification) => {
  console.log(notification);
});
```
