import { get, post, put, del } from './api';

export const postsApi = {
  // Récupérer le feed
  async getFeed(params = {}) {
    const { sort = 'recent', q = '', page = 1, limit = 20 } = params;
    return get(`/api/posts?sort=${sort}&q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`);
  },

  // Récupérer un post spécifique
  async getPost(postId) {
    return get(`/api/posts/${postId}`);
  },

  // Créer une publication
  async createPost(data) {
    return post('/api/posts', data);
  },

  // Modifier une publication
  async updatePost(postId, data) {
    return put(`/api/posts/${postId}`, data);
  },

  // Supprimer une publication
  async deletePost(postId) {
    return del(`/api/posts/${postId}`);
  },

  // Liker une publication
  async likePost(postId) {
    return post(`/api/posts/${postId}/like`);
  },

  // Unliker une publication
  async unlikePost(postId) {
    return del(`/api/posts/${postId}/like`);
  },

  // Récupérer les commentaires
  async getComments(postId) {
    return get(`/api/posts/${postId}/comments`);
  },

  // Ajouter un commentaire
  async addComment(postId, content) {
    return post(`/api/posts/${postId}/comments`, { content });
  },

  // Répondre à un commentaire
  async replyToComment(commentId, content) {
    return post(`/api/posts/comments/${commentId}/replies`, { content });
  },

  // Récupérer les posts d'un utilisateur
  async getUserPosts(userId) {
    return get(`/api/posts/user/${userId}`);
  },
};

// ============================================
// 👥 UTILISATEURS & PROFILS
// ============================================

export const usersApi = {
  // Récupérer tous les utilisateurs
  async getUsers() {
    return get('/api/users');
  },

  // Rechercher des utilisateurs
  async searchUsers(query) {
    return get(`/api/users/search?q=${encodeURIComponent(query)}`);
  },

  // Récupérer un profil utilisateur
  async getUserProfile(userId) {
    return get(`/api/users/${userId}`);
  },

  // Mettre à jour son profil
  async updateProfile(data) {
    return put('/api/users/profile', data);
  },

  // Mettre à jour la photo de profil
  async updateProfilePicture(imageUrl) {
    return put('/api/users/profile-picture', { imageUrl });
  },

  // Mettre à jour la photo de couverture
  async updateCoverPicture(imageUrl) {
    return put('/api/users/cover-picture', { imageUrl });
  },
};

// ============================================
// 🤝 RÉSEAU SOCIAL (FOLLOWS, INVITATIONS)
// ============================================

export const networkApi = {
  // Suivre un utilisateur
  async followUser(userId) {
    return post(`/api/network/follows/${userId}`);
  },

  // Ne plus suivre
  async unfollowUser(userId) {
    return del(`/api/network/follows/${userId}`);
  },

  // Récupérer les abonnés
  async getFollowers(userId) {
    return get(`/api/network/followers/${userId}`);
  },

  // Récupérer les abonnements
  async getFollowing(userId) {
    return get(`/api/network/following/${userId}`);
  },

  // Statut de suivi
  async getFollowStatus(userId) {
    return get(`/api/network/follow/status/${userId}`);
  },

  // Suggestions de réseau
  async getSuggestions() {
    return get('/api/network/suggestions');
  },

  // Envoyer une invitation de collaboration
  async sendInvitation(recipientId, message) {
    return post('/api/network/invitations/send', { recipientId, message });
  },

  // Récupérer les invitations reçues
  async getReceivedInvitations() {
    return get('/api/network/invitations/received');
  },

  // Récupérer les invitations envoyées
  async getSentInvitations() {
    return get('/api/network/invitations/sent');
  },

  // Accepter une invitation
  async acceptInvitation(invitationId) {
    return put(`/api/network/invitations/${invitationId}/accept`);
  },

  // Refuser une invitation
  async declineInvitation(invitationId) {
    return put(`/api/network/invitations/${invitationId}/decline`);
  },
};

// ============================================
// 🛒 MARKETPLACE & PRODUITS
// ============================================

export const productsApi = {
  // Récupérer tous les produits
  async getProducts(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return get(`/api/products${params ? `?${params}` : ''}`);
  },

  // Rechercher des produits
  async searchProducts(query) {
    return get(`/api/products?q=${encodeURIComponent(query)}`);
  },

  // Récupérer un produit
  async getProduct(productId) {
    return get(`/api/products/${productId}`);
  },

  // Créer un produit
  async createProduct(data) {
    return post('/api/products', data);
  },

  // Modifier un produit
  async updateProduct(productId, data) {
    return put(`/api/products/${productId}`, data);
  },

  // Supprimer un produit
  async deleteProduct(productId) {
    return del(`/api/products/${productId}`);
  },

  // Récupérer mes produits
  async getMyProducts(status = 'all') {
    return get(`/api/products/my?status=${status}`);
  },

  // Basculer la disponibilité
  async toggleAvailability(productId) {
    return put(`/api/products/${productId}/toggle`);
  },
};

// ============================================
// 🛍️ RÉSERVATIONS & COMMANDES
// ============================================

export const ordersApi = {
  // Créer une réservation
  async createReservation(items) {
    return post('/api/reservations', { items });
  },

  // Récupérer mes commandes
  async getMyOrders() {
    return get('/api/reservations');
  },

  // Récupérer les commandes reçues (vendeur)
  async getReceivedOrders() {
    return get('/api/reservations/received');
  },

  // Confirmer une commande
  async confirmOrder(reservationId) {
    return put(`/api/reservations/${reservationId}/confirm`);
  },

  // Annuler une commande
  async cancelOrder(reservationId) {
    return put(`/api/reservations/${reservationId}/cancel`);
  },

  // Ajouter au panier
  async addToCart(productId, quantity) {
    return post('/api/reservations/cart', { product_id: productId, quantity });
  },
};

// ============================================
// 💬 MESSAGERIE
// ============================================

export const messagesApi = {
  // Récupérer les conversations
  async getConversations() {
    return get('/api/messages/conversations');
  },

  // Récupérer les messages d'une conversation
  async getMessages(conversationId) {
    return get(`/api/messages?conversationId=${encodeURIComponent(conversationId)}`);
  },

  // Envoyer un message
  async sendMessage(recipientId, content) {
    return post('/api/messages', { recipient_id: recipientId, content });
  },

  // Marquer comme lu
  async markAsRead(messageId) {
    return put(`/api/messages/${messageId}/read`);
  },
};

// ============================================
// 🔔 NOTIFICATIONS
// ============================================

export const notificationsApi = {
  // Récupérer les notifications
  async getNotifications() {
    return get('/api/notifications');
  },

  // Marquer comme lue
  async markAsRead(notificationId) {
    return put(`/api/notifications/${notificationId}/read`);
  },

  // Marquer toutes comme lues
  async markAllAsRead() {
    return put('/api/notifications/read-all');
  },

  // Supprimer une notification
  async deleteNotification(notificationId) {
    return del(`/api/notifications/${notificationId}`);
  },
};

// ============================================
// 📊 ANALYSE & ALGORITHMES
// ============================================

export const analysisApi = {
  // Récupérer les régions
  async getRegions() {
    return get('/api/regions');
  },

  // Récupérer les cultures
  async getCultures() {
    return get('/api/regions/cultures');
  },

  // Cultures par région
  async getRegionCultures(regionId) {
    return get(`/api/analysis/region-cultures?regionId=${regionId}`);
  },

  // Recommandations KNN
  async getKnnRecommendations(regionId, k = 5) {
    return get(`/api/analysis/knn-cultures?regionId=${regionId}&k=${k}`);
  },

  // Livraisons d'un agriculteur
  async getDeliveries(farmerId) {
    return get(`/api/analysis/deliveries?farmerId=${farmerId}`);
  },

  // Route optimale (Dijkstra)
  async getDijkstraRoute(startRegionId, endRegionId) {
    return get(`/api/routes/dijkstra?startRegionId=${startRegionId}&endRegionId=${endRegionId}`);
  },
};

// ============================================
// 🗺️ OPTIMISATION DE ROUTES
// ============================================

export const optimizationApi = {
  // Optimiser les routes
  async optimizeRoutes(deliveries, options = {}) {
    return post('/api/optimization/optimize', { deliveries, options });
  },

  // Calculer la distance
  async calculateDistance(lat1, lon1, lat2, lon2) {
    return get(`/api/optimization/distance?lat1=${lat1}&lon1=${lon1}&lat2=${lat2}&lon2=${lon2}`);
  },

  // Ré-optimiser après suppression
  async reoptimize(currentRoute, deliveryId) {
    return post('/api/optimization/reoptimize', { currentRoute, deliveryId });
  },

  // Comparer les algorithmes
  async compareAlgorithms(deliveries, depot = null) {
    return post('/api/optimization/compare', { deliveries, depot });
  },
};

// ============================================
// 📤 UPLOAD DE FICHIERS
// ============================================

export const uploadApi = {
  // Upload d'image
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.name || 'upload.jpg',
    });

    const response = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }
    return data.imageUrl;
  },
};

// Export global
export default {
  posts: postsApi,
  users: usersApi,
  network: networkApi,
  products: productsApi,
  orders: ordersApi,
  messages: messagesApi,
  notifications: notificationsApi,
  analysis: analysisApi,
  optimization: optimizationApi,
  upload: uploadApi,
};
