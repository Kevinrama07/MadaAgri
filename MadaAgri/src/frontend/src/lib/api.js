export function getToken() {
  return localStorage.getItem('madaagri_token');
}

export function setToken(token) {
  localStorage.setItem('madaagri_token', token);
}

export function clearToken() {
  localStorage.removeItem('madaagri_token');
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
    console.log(`[apiFetch] call`, `${API_BASE}${path}`, options);
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
    throw new Error(message);
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
      console.log('[authApi.me] ℹ️ Pas de token, utilisateur non connecté');
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
      console.log('[authApi.me] ⏳ Réutilisation de la promesse existante (appel concurrent)');
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
    console.log('[authApi] ✅ Déconnecté et cache nettoyé');
  }
};

export const dataApi = {
  async fetchUsers() {
    // Vérifier le cache
    const now = Date.now();
    if (apiCache.users.data && (now - apiCache.users.timestamp) < CACHE_DURATION) {
      console.log('[dataApi] Utilisateurs depuis cache');
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
    const data = await apiFetch('/regions');
    return data.regions;
  },

  async fetchCultures() {
    const data = await apiFetch('/regions/cultures');
    return data.cultures;
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

  async fetchMessages(conversationId) {
    console.log('[api] fetchMessages debut:', conversationId);
    const data = await apiFetch(`/messages?conversationId=${encodeURIComponent(conversationId)}`);
    console.log('[api] fetchMessages result:', data);
    return data.messages;
  },

  async sendMessage(recipient_id, content) {
    console.log('[api] sendMessage debut:', { recipient_id, content });
    const data = await apiFetch('/messages', {
      method: 'POST',
      body: JSON.stringify({ recipient_id, content })
    });
    console.log('[api] sendMessage result:', data);
    return data.message;
  },

  async fetchRegionCultures(regionId) {
    const data = await apiFetch(`/analysis/region-cultures?regionId=${encodeURIComponent(regionId)}`);
    return data.region_cultures;
  },

  async fetchDeliveries(farmerId) {
    const data = await apiFetch(`/analysis/deliveries?farmerId=${encodeURIComponent(farmerId)}`);
    return data.deliveries;
  },

  async fetchPosts({ q = '', sort = 'recent' } = {}) {
    const data = await apiFetch(`/posts?sort=${encodeURIComponent(sort)}&q=${encodeURIComponent(q)}`);
    return data.posts;
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

  async createPost(post) {
    const data = await apiFetch('/posts', {
      method: 'POST',
      body: JSON.stringify(post),
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

  async fetchNetworkSuggestions() {
    const data = await apiFetch('/network/suggestions');
    return data.suggestions;
  },

  async fetchFollowers(userId) {
    const data = await apiFetch(`/network/followers/${encodeURIComponent(userId)}`);
    return data.followers;
  },

  async fetchFollowing(userId) {
    const data = await apiFetch(`/network/following/${encodeURIComponent(userId)}`);
    return data.following;
  },

  async fetchFollowStatus(userId) {
    const data = await apiFetch(`/network/follow/status/${encodeURIComponent(userId)}`);
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

  async searchUsers(q) {
    const data = await apiFetch(`/users/search?q=${encodeURIComponent(q || '')}`);
    return data.users;
  },

  async fetchKnnCultures(regionId, k = 5) {
    const data = await apiFetch(`/analysis/knn-cultures?regionId=${encodeURIComponent(regionId)}&k=${encodeURIComponent(k)}`);
    return data.recommendations;
  },

  async fetchDijkstraRoute(startRegionId, endRegionId) {
    const data = await apiFetch(`/routes/dijkstra?startRegionId=${encodeURIComponent(startRegionId)}&endRegionId=${encodeURIComponent(endRegionId)}`);
    return data.route;
  },

  async fetchUserProfile(userId) {
    const data = await apiFetch(`/users/${encodeURIComponent(userId)}`);
    return data;
  },

  async fetchUserPosts(userId) {
    const data = await apiFetch(`/posts/user/${encodeURIComponent(userId)}`);
    return data.posts;
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

