export function getToken() {
  return localStorage.getItem('madaagri_token');
}

export function setToken(token) {
  localStorage.setItem('madaagri_token', token);
}

export function clearToken() {
  localStorage.removeItem('madaagri_token');
}

export function getApiBaseUrl() {
  // Retourner la base du serveur (sans /api)
  const fullBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
  // Enlever /api à la fin si présent
  return fullBase.endsWith('/api') ? fullBase.slice(0, -4) : fullBase;
}

// Custom error class for deleted user account
export class UserDeletedError extends Error {
  constructor(message = 'Votre compte a été supprimé') {
    super(message);
    this.name = 'UserDeletedError';
    this.statusCode = 404;
  }
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

// Cache simple pour les requêtes utilisateurs
const apiCache = {
  users: { data: null, timestamp: 0 },
  regions: { data: null, timestamp: 0 },
  authMe: { data: null, timestamp: 0 }
};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const AUTH_CACHE_DURATION = 60 * 1000; // 1 minute pour l'auth

let authMePromise = null;
let authMePromiseResolver = null;

async function apiFetch(path, options = {}, retries = 0) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers
    });
  } catch (err) {
    console.error('[apiFetch] network error', err);
    throw new Error('Impossible de contacter le serveur. Vérifiez votre connexion.');
  }

  const body = await response.json().catch(() => null);
  
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After') || (1000 * Math.pow(2, retries));
    if (retries < 3) {
      console.warn(`[apiFetch] Rate limit 429, retry ${retries + 1}/3 après ${retryAfter}ms`);
      await new Promise(resolve => setTimeout(resolve, retryAfter));
      return apiFetch(path, options, retries + 1);
    }
  }
  
  if (!response.ok) {
    const message = body && body.error ? body.error : `Erreur API ${response.status}`;
    const error = new Error(message);
    error.statusCode = response.status;
    error.path = path;
    throw error;
  }

  return body;
}

export const authApi = {
  async signUp(email, password, displayName, role) {
    const data = await apiFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName, role })
    });
    setToken(data.token);
    // Invalider le cache et la promesse après sign up
    authMePromise = null;
    apiCache.authMe = { data: data.user, timestamp: Date.now() };
    return data.user;
  },

  async signIn(email, password, role = 'client') {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role })
    });
    setToken(data.token);
    // Invalider le cache et la promesse après sign in
    authMePromise = null;
    apiCache.authMe = { data: data.user, timestamp: Date.now() };
    return data.user;
  },

  async me() {
    const token = getToken();
    if (!token) {
      authMePromise = null;
      apiCache.authMe = { data: null, timestamp: 0 };
      return null;
    }

    // Vérifier le cache d'abord (1 minute pour l'auth)
    const now = Date.now();
    if (apiCache.authMe.data && (now - apiCache.authMe.timestamp) < AUTH_CACHE_DURATION) {
      return apiCache.authMe.data;
    }

    if (authMePromise) {
      return authMePromise;
    }

    authMePromise = (async () => {
      try {
        const data = await apiFetch('/auth/me');
        // Mettre en cache
        apiCache.authMe = {
          data: data.user,
          timestamp: Date.now()
        };
        return data.user;
      } catch (error) {
        // Détecter si l'utilisateur a été supprimé (404 Not Found)
        if (error.statusCode === 404 || error.message.includes('User not found')) {
          console.error('[authApi.me] 🗑️ Utilisateur supprimé de la base de données');
          const userDeletedError = new UserDeletedError();
          throw userDeletedError;
        }
        console.error('[authApi.me] ❌ Erreur lors du fetch:', error.message);
        throw error;
      } finally {
        // Nettoyer la promesse après completion
        authMePromise = null;
      }
    })();

    return authMePromise;
  },

  signOut() {
    authMePromise = null;
    apiCache.authMe = { data: null, timestamp: 0 };
    clearToken();
  }
};

export const dataApi = {
  async fetchUsers() {
    // Vérifier le cache
    const now = Date.now();
    if (apiCache.users.data && (now - apiCache.users.timestamp) < CACHE_DURATION) {
      return apiCache.users.data;
    }

    const data = await apiFetch('/users');
    // Mettre en cache
    apiCache.users = {
      data: data.users,
      timestamp: now
    };
    return data.users;
  },

  async fetchRegions() {
    const data = await apiFetch('/analysis/regions');
    return data.regions || [];
  },

  async fetchCultures() {
    const data = await apiFetch('/analysis/cultures');
    return data.cultures || [];
  },

  async fetchProducts() {
    const data = await apiFetch('/products');
    return data.data || [];
  },

  async searchProducts(q) {
    const data = await apiFetch(`/products?q=${encodeURIComponent(q || '')}`);
    return data.data || [];
  },

  async createProduct(product) {
    const data = await apiFetch('/products', {
      method: 'POST',
      body: JSON.stringify(product)
    });
    return data.product;
  },

  async getMyProducts(status = 'all') {
    const data = await apiFetch(`/products/my?status=${encodeURIComponent(status)}`);
    return data.data || [];
  },

  async updateProduct(productId, product) {
    const data = await apiFetch(`/products/${encodeURIComponent(productId)}`, {
      method: 'PUT',
      body: JSON.stringify(product)
    });
    return data;
  },

  async deleteProduct(productId) {
    const data = await apiFetch(`/products/${encodeURIComponent(productId)}`, {
      method: 'DELETE'
    });
    return data;
  },

  async toggleProductAvailability(productId) {
    const data = await apiFetch(`/products/${encodeURIComponent(productId)}/toggle`, {
      method: 'PATCH'
    });
    return data;
  },

  async addToCart(product_id, quantity) {
    const data = await apiFetch('/reservations/cart', {
      method: 'POST',
      body: JSON.stringify({ product_id, quantity })
    });
    return data;
  },

  async createReservation(items) {
    // items est un array d'objets: {product_id, quantity, farmer_id, price}
    const data = await apiFetch('/reservations', {
      method: 'POST',
      body: JSON.stringify({ items })
    });
    return data;
  },

  async getMyOrders() {
    const data = await apiFetch('/reservations');
    return data.data || [];
  },

  async getReceivedOrders() {
    const data = await apiFetch('/reservations/received');
    return data.data || [];
  },

  async confirmReservation(reservationId) {
    const data = await apiFetch(`/reservations/${encodeURIComponent(reservationId)}/confirm`, {
      method: 'PATCH'
    });
    return data;
  },

  async cancelReservation(reservationId) {
    const data = await apiFetch(`/reservations/${encodeURIComponent(reservationId)}/cancel`, {
      method: 'PATCH'
    });
    return data;
  },

  async fetchConversations() {
    const data = await apiFetch('/conversations');
    console.log('[API] fetchConversations response:', data);
    console.log('[API] Is array?:', Array.isArray(data));
    return Array.isArray(data) ? data : [];
  },

  async fetchMessages(conversationId, offset = 0, limit = 50) {
    const data = await apiFetch(`/messages?conversationId=${encodeURIComponent(conversationId)}&limit=${limit}&offset=${offset}`);
    console.log('[API] fetchMessages response:', data);
    console.log('[API] fetchMessages data?.messages:', data?.messages);
    return data;
  },

  async sendMessage(recipient_id, content, attachment_url = null, attachment_type = null, extraFields = {}) {
    const data = await apiFetch('/messages', {
      method: 'POST',
      body: JSON.stringify({ recipient_id, content, attachment_url, attachment_type, ...extraFields })
    });
    return data.message;
  },

  async markMessageAsRead(messageId) {
    const data = await apiFetch(`/messages/${encodeURIComponent(messageId)}/read`, {
      method: 'PUT'
    });
    return data;
  },

  async markConversationAsRead(conversationId, currentUserId) {
    // Marquer tous les messages non lus de la conversation
    const result = await this.fetchMessages(conversationId);
    const messagesList = result?.messages || [];
    
    // Ne marquer comme lus QUE les messages reçus (recipient)
    const unreadMessages = messagesList.filter(m => 
      !m.is_read && m.recipient_id === currentUserId
    );
    
    await Promise.all(
      unreadMessages.map(msg => this.markMessageAsRead(msg.id).catch(err => {
        // Ignorer les erreurs 403 (message déjà lu ou non autorisé)
        if (err.statusCode !== 403) throw err;
      }))
    );
    
    return { success: true, markedCount: unreadMessages.length };
  },

  async deleteMessage(messageId) {
    const data = await apiFetch(`/messages/${encodeURIComponent(messageId)}`, {
      method: 'DELETE'
    });
    return data;
  },

  async editMessage(messageId, content) {
    const data = await apiFetch(`/messages/${encodeURIComponent(messageId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ content })
    });
    return data;
  },

  async addReaction(messageId, emoji) {
    const data = await apiFetch(`/messages/${encodeURIComponent(messageId)}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji })
    });
    return data;
  },

  async removeReaction(messageId, emoji) {
    const data = await apiFetch(`/messages/${encodeURIComponent(messageId)}/reactions/${encodeURIComponent(emoji)}`, {
      method: 'DELETE'
    });
    return data;
  },

  async getReactions(messageId) {
    const data = await apiFetch(`/messages/${encodeURIComponent(messageId)}/reactions`);
    return data;
  },

  async fetchRegionCultures(regionId) {
    const data = await apiFetch(`/analysis/region-cultures?regionId=${encodeURIComponent(regionId)}`);
    return data.region_cultures || [];
  },

  async fetchDeliveries(farmerId) {
    const data = await apiFetch(`/analysis/deliveries?farmerId=${encodeURIComponent(farmerId)}`);
    return data.deliveries;
  },

  async fetchPosts({ q = '', sort = 'recent' } = {}) {
    const data = await apiFetch(`/posts?sort=${encodeURIComponent(sort)}&q=${encodeURIComponent(q)}`);
    return data.posts;
  },

  async fetchPostById(postId) {
    const data = await apiFetch(`/posts/${encodeURIComponent(postId)}`);
    return data.post;
  },

  async uploadImage(file) {
    const token = getToken();
    const form = new FormData();
    form.append('image', file);

    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form
    });
    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.error || 'Upload failed');
    }
    return body.imageUrl;
  },

  async updateProfilePicture(imageUrl) {
    const data = await apiFetch('/users/profile-picture', {
      method: 'PUT',
      body: JSON.stringify({ imageUrl })
    });
    return data;
  },

  async updateUserProfile(profile) {
    const data = await apiFetch('/users', {
      method: 'PUT',
      body: JSON.stringify(profile)
    });
    return data.user;
  },

  async changePassword(currentPassword, newPassword) {
    const data = await apiFetch('/users/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });
    return data;
  },

  async enable2FA() {
    const data = await apiFetch('/users/2fa/enable', {
      method: 'POST'
    });
    return data;
  },

  async verify2FA(token) {
    const data = await apiFetch('/users/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
    return data;
  },

  async disable2FA() {
    const data = await apiFetch('/users/2fa/disable', {
      method: 'POST'
    });
    return data;
  },

  async revokeAllSessions() {
    const data = await apiFetch('/users/sessions/revoke', {
      method: 'POST'
    });
    return data;
  },

  async exportUserData() {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/users/export`, {
      headers
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || 'Erreur lors de l\'export');
    }

    return await response.blob();
  },

  async deleteAccount() {
    const data = await apiFetch('/users', {
      method: 'DELETE'
    });
    return data;
  },

  async updateNotificationPreferences(preferences) {
    const data = await apiFetch('/users', {
      method: 'PUT',
      body: JSON.stringify({ notification_settings: preferences })
    });
    return data;
  },

  async createPost(post) {
    const payload = {};
    if (post.content) payload.content = post.content;
    if (post.image_url) payload.image_url = post.image_url;
    if (post.video_url) payload.video_url = post.video_url;
    if (post.video_thumbnail) payload.video_thumbnail = post.video_thumbnail;
    if (post.video_duration) payload.video_duration = post.video_duration;

    if (post.image && !post.image_url) {
      const imageUrl = await this.uploadImage(post.image);
      payload.image_url = imageUrl;
    }

    const data = await apiFetch('/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data.post;
  },

  async likePost(postId) {
    const data = await apiFetch(`/posts/${encodeURIComponent(postId)}/like`, { method: 'POST' });
    return data;
  },

  async unlikePost(postId) {
    const data = await apiFetch(`/posts/${encodeURIComponent(postId)}/like`, { method: 'DELETE' });
    return data;
  },

  async fetchPostComments(postId) {
    const data = await apiFetch(`/posts/${encodeURIComponent(postId)}/comments`);
    return data.comments;
  },

  async createPostComment(postId, content) {
    const data = await apiFetch(`/posts/${encodeURIComponent(postId)}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    return data.comment;
  },

  async createPostCommentComment(commentId, content) {
    // Créer une réponse à un commentaire existant
    const data = await apiFetch(`/posts/comments/${encodeURIComponent(commentId)}/replies`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    return data.comment;
  },

  async fetchCommentReplies(commentId) {
    // Récupérer les réponses d'un commentaire
    const data = await apiFetch(`/posts/comments/${encodeURIComponent(commentId)}/replies`);
    return data.replies;
  },

  async followUser(userId) {
    const data = await apiFetch(`/network/follows/${encodeURIComponent(userId)}`, { method: 'POST' });
    return data;
  },

  async unfollowUser(userId) {
    const data = await apiFetch(`/network/follows/${encodeURIComponent(userId)}`, { method: 'DELETE' });
    return data;
  },

  async fetchNetworkSuggestions(search = '') {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const data = await apiFetch(`/network/suggestions${query}`);
    return data.suggestions;
  },

  async fetchFollowers(userId, limit = 50, offset = 0) {
    if (!userId) return [];
    const path = `/follows/followers/${encodeURIComponent(userId)}?limit=${limit}&offset=${offset}`;
    const data = await apiFetch(path);
    return data.followers;
  },

  async fetchFollowing(userId, limit = 50, offset = 0) {
    if (!userId) return [];
    const path = `/follows/following/${encodeURIComponent(userId)}?limit=${limit}&offset=${offset}`;
    const data = await apiFetch(path);
    return data.following;
  },

  async fetchCollaborators(userId, limit = 50, offset = 0) {
    if (!userId) return { collaborators: [], pagination: { total: 0, limit, offset } };
    const path = `/collaborations/collaborators/${encodeURIComponent(userId)}?limit=${limit}&offset=${offset}`;
    const data = await apiFetch(path);
    return {
      collaborators: data.collaborators || [],
      pagination: {
        total: data.pagination?.total ?? data.total ?? 0,
        limit: data.pagination?.limit ?? data.limit ?? limit,
        offset: data.pagination?.offset ?? data.offset ?? offset,
      }
    };
  },

  async removeCollaboration(userId) {
    const data = await apiFetch(`/collaborations/${encodeURIComponent(userId)}`, {
      method: 'DELETE'
    });
    return data;
  },

  async fetchInvitationStatus(targetUserId) {
    if (!targetUserId) throw new Error('targetUserId is required');
    const data = await apiFetch(`/network/invitations/status/${encodeURIComponent(targetUserId)}`);
    return data;
  },

  async fetchFollowStatus(userId) {
    if (!userId) throw new Error('userId is required');
    const data = await apiFetch(`/network/follows/status/${encodeURIComponent(userId)}`);
    return data;
  },

  async sendCollaborationInvitation(recipientId, message) {

    const data = await apiFetch('/network/invitations/send', {
      method: 'POST',
      body: JSON.stringify({ recipientId, message })
    });
    return data;
  },

  async fetchReceivedInvitations() {
    const data = await apiFetch('/network/invitations/received');
    return data.invitations;
  },

  async fetchSentInvitations() {
    const data = await apiFetch('/network/invitations/sent');
    return data.invitations;
  },

  async acceptInvitation(invitationId) {
    const data = await apiFetch(`/network/invitations/${encodeURIComponent(invitationId)}/accept`, {
      method: 'PUT'
    });
    return data;
  },

  async declineInvitation(invitationId) {
    const data = await apiFetch(`/network/invitations/${encodeURIComponent(invitationId)}/decline`, {
      method: 'PUT'
    });
    return data;
  },

  async cancelInvitation(invitationId) {
    const data = await apiFetch(`/network/invitations/${encodeURIComponent(invitationId)}/cancel`, {
      method: 'DELETE'
    });
    return data;
  },

  async searchUsers(q) {
    const data = await apiFetch(`/users/search?q=${encodeURIComponent(q || '')}`);
    return data.users;
  },

  async fetchKnnCultures(regionId, k = 5) {
    const data = await apiFetch(`/analysis/knn-cultures?regionId=${encodeURIComponent(regionId)}&k=${encodeURIComponent(k)}`);
    return data.recommendations || [];
  },

  async fetchDijkstraRoute(startRegionId, endRegionId) {
    const data = await apiFetch(`/routes/dijkstra?startRegionId=${encodeURIComponent(startRegionId)}&endRegionId=${encodeURIComponent(endRegionId)}`);
    return data.route;
  },

  async fetchUserProfile(userId) {
    if (!userId) throw new Error('userId is required');
    const data = await apiFetch(`/users/${encodeURIComponent(userId)}`);
    return data;
  },

  async fetchUserPosts(userId) {
    if (!userId) throw new Error('userId is required');
    const data = await apiFetch(`/posts/user/${encodeURIComponent(userId)}`);
    return data.posts;
  },

  async fetchNotifications({ limit = 50, offset = 0, type, unreadOnly, archived } = {}) {
    const params = new URLSearchParams();
    params.set('limit', limit);
    params.set('offset', offset);
    if (type) params.set('type', type);
    if (unreadOnly) params.set('unreadOnly', 'true');
    if (archived) params.set('archived', 'true');
    const data = await apiFetch(`/notifications?${params.toString()}`);
    return data;
  },

  async fetchUnreadNotificationCount() {
    const data = await apiFetch('/notifications/unread-count');
    return data.count;
  },

  async markNotificationRead(notificationId) {
    await apiFetch(`/notifications/${encodeURIComponent(notificationId)}/read`, { method: 'PUT' });
  },

  async markAllNotificationsRead(type) {
    const params = type ? `?type=${encodeURIComponent(type)}` : '';
    await apiFetch(`/notifications/read-all${params}`, { method: 'PUT' });
  },

  async archiveNotification(notificationId) {
    await apiFetch(`/notifications/${encodeURIComponent(notificationId)}/archive`, { method: 'PUT' });
  },

  async deleteNotification(notificationId) {
    await apiFetch(`/notifications/${encodeURIComponent(notificationId)}`, { method: 'DELETE' });
  },

  async clearReadNotifications() {
    await apiFetch('/notifications/clear-all', { method: 'DELETE' });
  },

  async fetchParcels() {
    const data = await apiFetch('/parcels');
    return data.parcels;
  },

  async fetchParcel(parcelId) {
    const data = await apiFetch(`/parcels/${encodeURIComponent(parcelId)}`);
    return data.parcel;
  },

  async createParcel(parcel) {
    const data = await apiFetch('/parcels', {
      method: 'POST',
      body: JSON.stringify(parcel),
    });
    return data;
  },

  async updateParcel(parcelId, updates) {
    const data = await apiFetch(`/parcels/${encodeURIComponent(parcelId)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data.parcel;
  },

  async deleteParcel(parcelId) {
    await apiFetch(`/parcels/${encodeURIComponent(parcelId)}`, { method: 'DELETE' });
  },

  async analyzeCrop(parcelId, analysisData) {
    const data = await apiFetch(`/parcels/${encodeURIComponent(parcelId)}/analyze-crop`, {
      method: 'POST',
      body: JSON.stringify(analysisData),
    });
    return data.analysis;
  },

  async analyzeImage(imageUrl, parcelId = null) {
    const body = { image_url: imageUrl };
    if (parcelId) {
      body.parcel_id = parcelId;
    }
    const endpoint = parcelId
      ? `/parcels/${encodeURIComponent(parcelId)}/analyze-crop`
      : '/parcels/analyze-image';
    const data = await apiFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return data.analysis;
  },

  async fetchAnalysisHistory(parcelId) {
    const data = await apiFetch(`/parcels/${encodeURIComponent(parcelId)}/analysis-history`);
    return data.analyses;
  },

  async fetchAllAnalysisHistory(limit = 20, offset = 0) {
    const data = await apiFetch(`/parcels/analysis-history?limit=${limit}&offset=${offset}`);
    return data;
  }
};

export const assistantApi = {
  async sendMessage(message, history = [], conversationId = null) {
    const data = await apiFetch('/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history, conversationId })
    });
    return data;
  },

  async healthCheck() {
    const data = await apiFetch('/assistant/health');
    return data;
  }
};

export const optimizationApi = {
  async optimizeRoutes(deliveries, options = {}) {
    const data = await apiFetch('/optimization/optimize', {
      method: 'POST',
      body: JSON.stringify({ deliveries, options })
    });
    return data;
  },

  async calculateDistance(lat1, lon1, lat2, lon2) {
    const data = await apiFetch(
      `/optimization/distance?lat1=${lat1}&lon1=${lon1}&lat2=${lat2}&lon2=${lon2}`
    );
    return data.distance;
  },

  async reoptimizeAfterRemoval(currentRoute, deliveryId) {
    const data = await apiFetch('/optimization/reoptimize', {
      method: 'POST',
      body: JSON.stringify({ currentRoute, deliveryId })
    });
    return data.route;
  },

  async compareAlgorithms(deliveries, depot = null) {
    const data = await apiFetch('/optimization/compare', {
      method: 'POST',
      body: JSON.stringify({ deliveries, depot })
    });
    return data.comparison;
  }
};

