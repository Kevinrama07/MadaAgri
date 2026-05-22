import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { API_CONFIG, APP_CONFIG } from '../../config';

// Nettoyer les URLs en double (ex: http://http://...)
function normalizeUrl(url) {
  if (!url) return url;
  // Enlever les doublons protocol
  return url.replace(/^([a-z]+:\/\/)\1+/i, '$1').replace(/\/+api\/+api/g, '/api');
}

function resolveApiBase() {
  // 1️⃣ Vérifier les variables d'environnement Expo (prioritaire)
  if (Constants.expoConfig?.extra?.API_URL) {
    const url = normalizeUrl(Constants.expoConfig.extra.API_URL);
    return url;
  }

  // 2️⃣ Vérifier la variable d'environnement NODE
  if (process.env.API_BASE) {
    const url = normalizeUrl(process.env.API_BASE);
    return url;
  }

  // 3️⃣ Vérifier process.env.EXPO_PUBLIC_API_URL (depuis .env)
  if (process.env.EXPO_PUBLIC_API_URL) {
    const url = normalizeUrl(process.env.EXPO_PUBLIC_API_URL);
    return url;
  }

  // 4️⃣ Android - pour Expo Go sur téléphone physique
  if (Platform.OS === 'android') {
    try {
      const manifest = Constants.manifest || Constants.expoConfig;
      
      // En Expo Go, on peut détecter l'IP du dev host
      if (manifest?.debuggerHost) {
        const host = String(manifest.debuggerHost).split(':')[0];
        if (host && host !== 'localhost' && host !== '127.0.0.1') {
          const url = `http://${host}:4000`;
          return url;
        }
      }
      
      // Fallback: Android Device (téléphone physique)
      return API_CONFIG.ANDROID_DEVICE_IP;
    } catch (e) {
      return API_CONFIG.ANDROID_DEVICE_IP;
    }
  }

  const url = API_CONFIG.DEFAULT_API_BASE;
  return url;
}

const API_BASE = resolveApiBase();
const TOKEN_KEY = '@madaagri_token';
let token = null;
let tokenLoadPromise = null; // Pour éviter les chargements multiples

function logDebug(...args) {
  if (APP_CONFIG.NETWORK_DEBUG) {
  }
}

function logError(...args) {
  console.error('[API ERROR]', ...args);
}

export function setToken(t) {
  token = t || null;
  if (token) {
    logDebug('🔑 Token set in memory');
  } else {
    logDebug('🚫 Token cleared from memory');
  }
}

export function getToken() {
  return token;
}

function authHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'X-Platform': Platform.OS,
    'X-App-Version': '1.0.0',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    logDebug('🔑 Token attached to request');
  } else {
    logDebug('⚠️ No token available for request');
  }
  return headers;
}

async function request(method, path, data = null, options = {}) {
  const url = `${API_BASE}${path}`;
  const timeout = options.timeout || APP_CONFIG.TIMEOUT;
  

  try {
    // Configuration de la requête
    const config = {
      method,
      headers: authHeaders(),
      timeout,
    };

    if (data) {
      config.body = JSON.stringify(data);
      logDebug('📤 Payload:', JSON.stringify(data).substring(0, 200));
    }

    // Créer un AbortController pour le timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseData = await response.json().catch(() => ({}));

      // Ne pas logger les réponses 404 (endpoints non implémentés)
      if (response.status !== 404) {
        logDebug(`📥 Response: ${response.status}`, responseData);
      }

      if (!response.ok) {
        const error = new Error(
          responseData?.message || `HTTP ${response.status}`
        );
        error.status = response.status;
        error.response = responseData;
        error.url = url;
        error.method = method;
        throw error;
      }

      logDebug(`✅ Success: ${method} ${path}`);
      return responseData;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error) {
    // Gestion détaillée des erreurs
    if (error.name === 'AbortError') {
      logError(`⏱️  TIMEOUT après ${APP_CONFIG.TIMEOUT}ms: ${method} ${path}`);
      logError(`🔗 Tentait de se connecter à: ${API_BASE}`);
      logError(`📍 URL complète: ${API_BASE}${path}`);
      logError(`💡 Vérifiez que le serveur est accessible et tourne sur le port 4000`);
      const timeoutError = new Error(
        'Timeout: Le serveur n\'a pas répondu à temps. Vérifiez votre connexion réseau.'
      );
      timeoutError.code = 'TIMEOUT';
      timeoutError.originalError = error;
      throw timeoutError;
    }

    if (error instanceof TypeError) {
      // Erreur réseau
      logError(`🔴 Network Error: ${error.message}`);
      
      // Afficher les URLs correctes sans duplication
      const baseUrl = API_BASE.startsWith('http') ? API_BASE : `http://${API_BASE}`;
      const healthCheckUrl = `${baseUrl}/health`;
      
      const networkError = new Error(
        `Erreur réseau: ${error.message}. Vérifiez:\n` +
        `   ✅ Le serveur est lancé sur ${baseUrl}\n` +
        `   ✅ Votre connexion WiFi\n` +
        `   ✅ Le pare-feu Windows/Mac\n` +
        `   ✅ L'adresse IP (.env EXPO_PUBLIC_API_URL=${API_BASE})\n` +
        `   ✅ Le port 4000 est accessible\n` +
        `   ✅ Health check: ${healthCheckUrl}`
      );
      networkError.code = 'NETWORK_ERROR';
      networkError.originalError = error;
      networkError.url = url;
      networkError.apiBase = API_BASE;
      throw networkError;
    }

    // Erreur de réponse HTTP - Ne pas logger les 404 (endpoints non implémentés)
    if (error.status !== 404) {
      logError(`❌ API Error (${error.status}): ${error.message}`);
      logError('Response:', error.response);
    }
    throw error;
  }
}

// ============================================
// 💾 PERSISTANCE DU TOKEN
// ============================================

export async function saveTokenPersist(t) {
  try {
    if (t) {
      await AsyncStorage.setItem(TOKEN_KEY, t);
      setToken(t);
      logDebug('💾 Token saved to storage');
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
      setToken(null);
      logDebug('🗑️ Token removed from storage');
    }
  } catch (e) {
    logError('Token persist error:', e?.message);
  }
}

export async function loadTokenPersist() {
  // Éviter les chargements multiples simultanés
  if (tokenLoadPromise) {
    logDebug('⏳ Token load already in progress, waiting...');
    return tokenLoadPromise;
  }

  tokenLoadPromise = (async () => {
    try {
      const t = await AsyncStorage.getItem(TOKEN_KEY);
      if (t) {
        setToken(t);
        logDebug('🔓 Token loaded from storage');
        return t;
      } else {
        logDebug('ℹ️ No token found in storage');
        return null;
      }
    } catch (e) {
      logError('Token load error:', e?.message);
      return null;
    } finally {
      tokenLoadPromise = null;
    }
  })();

  return tokenLoadPromise;
}

// ============================================
// 🔐 ENDPOINTS AUTHENTIFICATION
// ============================================

export async function login(email, password) {
  const response = await request('POST', '/api/auth/login', {
    email,
    password,
  });
  if (response?.token) {
    setToken(response.token);
    await saveTokenPersist(response.token);
  }
  
  // Mapper les champs utilisateur
  if (response?.user) {
    response.user = {
      ...response.user,
      name: response.user.name || response.user.display_name,
      profile_picture: response.user.profile_picture || response.user.profile_image_url,
    };
  }
  
  return response;
}

export async function register(data) {
  const response = await request('POST', '/api/auth/signup', data);
  if (response?.token) {
    setToken(response.token);
    await saveTokenPersist(response.token);
  }
  
  // Mapper les champs utilisateur
  if (response?.user) {
    response.user = {
      ...response.user,
      name: response.user.name || response.user.display_name,
      profile_picture: response.user.profile_picture || response.user.profile_image_url,
    };
  }
  
  return response;
}

export async function logout() {
  try {
    await request('POST', '/api/auth/logout');
  } catch (e) {
    logError('Logout error:', e.message);
  }
  // Toujours nettoyer le token même si l'API échoue
  await saveTokenPersist(null);
  logDebug('✅ Logout complete');
}

export async function getProfile() {
  try {
    const response = await request('GET', '/api/auth/me');
    // Le backend retourne { user: {...} }
    const user = response?.user || response;
    
    // Valider que l'utilisateur a les champs minimums requis
    if (!user || !user.id || !user.email) {
      logError('⚠️ Invalid user data from /api/auth/me:', user);
      throw new Error('Invalid user data received from server');
    }
    
    // Mapper les champs du backend vers le format attendu par le frontend
    const mappedUser = {
      ...user,
      name: user.display_name || user.name || 'Utilisateur',
      profile_picture: user.profile_image_url || user.profile_picture || null,
      followers: user.followers_count || user.followers || 0,
      following: user.following_count || user.following || 0,
      posts: user.posts_count || user.posts || 0,
    };
    
    logDebug('✅ Profile fetched successfully:', mappedUser.email);
    return mappedUser;
  } catch (error) {
    logError('❌ getProfile failed:', error.message);
    throw error;
  }
}

export async function updateProfile(data) {
  // Mapper profile_picture -> profileImageUrl (format attendu par le backend)
  const payload = { ...data };
  if (payload.profile_picture !== undefined) {
    payload.profileImageUrl = payload.profile_picture;
    delete payload.profile_picture;
  }
  if (payload.name !== undefined) {
    payload.displayName = payload.name;
    delete payload.name;
  }
  return request('PUT', '/api/users', payload);
}

// ============================================
// 📦 ENDPOINTS PRODUITS
// ============================================

export async function getProducts(filters = {}) {
  try {
    const params = new URLSearchParams(filters).toString();
    const path = `/api/products${params ? `?${params}` : ''}`;
    const response = await request('GET', path);
    return response?.data || response || [];
  } catch (error) {
    // Si l'endpoint n'existe pas (404), retourner un tableau vide silencieusement
    if (error.status === 404) {
      return [];
    }
    // Pour les autres erreurs, afficher un warning
    console.warn('[API] Products endpoint error:', error.message);
    return [];
  }
}

export async function getProduct(id) {
  return request('GET', `/api/products/${id}`);
}

export async function createProduct(data) {
  return request('POST', '/api/products', data);
}

export async function updateProduct(id, data) {
  return request('PUT', `/api/products/${id}`, data);
}

export async function deleteProduct(id) {
  return request('DELETE', `/api/products/${id}`);
}

// ============================================
// 💬 ENDPOINTS MESSAGES
// ============================================

export async function getMessages(conversationId, offset = 0, limit = 50) {
  return request('GET', `/api/messages?conversationId=${conversationId}&limit=${limit}&offset=${offset}`);
}

export async function sendMessage(data) {
  return request('POST', '/api/messages', data);
}

export async function markMessageAsRead(messageId) {
  return request('PUT', `/api/messages/${messageId}/read`);
}

export async function getMessageReadStatus(messageId) {
  return request('GET', `/api/messages/${messageId}/read-status`);
}

export async function markConversationAsRead(conversationId) {
  // Marquer tous les messages non lus de la conversation
  const response = await getMessages(conversationId);
  const messages = response?.messages || [];
  
  // Ne marquer comme lus QUE les messages reçus (pas ceux envoyés)
  const token = getToken();
  if (!token) return { success: false, markedCount: 0 };
  
  // Décoder le token pour obtenir l'userId (simple décodage JWT)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentUserId = payload.userId || payload.id;
    
    const unreadMessages = messages.filter(m => 
      !m.is_read && m.sender_id !== currentUserId
    );
    
    await Promise.all(
      unreadMessages.map(msg => markMessageAsRead(msg.id).catch(err => {
        // Ignorer les erreurs 403 (message déjà lu ou non autorisé)
        if (err.status !== 403) {
          console.error('Erreur marquage message:', msg.id, err);
        }
      }))
    );
    
    return { success: true, markedCount: unreadMessages.length };
  } catch (error) {
    console.error('Erreur décodage token:', error);
    return { success: false, markedCount: 0 };
  }
}

export async function editMessage(messageId, content) {
  return request('PATCH', `/api/messages/${messageId}`, { content });
}

export async function deleteMessage(messageId) {
  return request('DELETE', `/api/messages/${messageId}`);
}

// Réactions
export async function addReaction(messageId, emoji) {
  return request('POST', `/api/messages/${messageId}/reactions`, { emoji });
}

export async function removeReaction(messageId, emoji) {
  return request('DELETE', `/api/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
}

export async function getReactions(messageId) {
  return request('GET', `/api/messages/${messageId}/reactions`);
}

// Utilisateurs
export async function searchUsers(query) {
  return request('GET', `/api/users/search?q=${encodeURIComponent(query || '')}`);
}

export async function fetchUsers() {
  return request('GET', '/api/users');
}

// ============================================
// 🔔 ENDPOINTS NOTIFICATIONS
// ============================================

export async function getNotifications() {
  try {
    return await request('GET', '/api/notifications');
  } catch (error) {
    // Si l'endpoint n'existe pas (404), retourner un tableau vide silencieusement
    if (error.status === 404) {
      return [];
    }
    // Pour les autres erreurs, afficher un warning
    console.warn('[API] Notifications endpoint error:', error.message);
    return [];
  }
}

export async function markNotificationAsRead(notificationId) {
  return request('PUT', `/api/notifications/${notificationId}/read`);
}

export async function markAllNotificationsAsRead() {
  return request('PUT', '/api/notifications/read-all');
}

// ============================================
// 💬 ENDPOINTS CONVERSATIONS
// ============================================

export async function getConversations() {
  try {
    return await request('GET', '/api/conversations');
  } catch (error) {
    // Si l'endpoint n'existe pas (404), retourner un tableau vide silencieusement
    if (error.status === 404) {
      return [];
    }
    // Pour les autres erreurs, afficher un warning
    console.warn('[API] Conversations endpoint error:', error.message);
    return [];
  }
}

export async function getConversation(conversationId) {
  return request('GET', `/api/conversations/${conversationId}`);
}

export async function getConversationMessages(conversationId) {
  return request('GET', `/api/conversations/${conversationId}/messages`);
}

export async function sendConversationMessage(conversationId, content) {
  return request('POST', `/api/conversations/${conversationId}/messages`, { content });
}

// ============================================
// 📝 POSTS/PUBLICATIONS
// ============================================

export async function getPosts(params) {
  const response = await request('GET', '/api/posts', null, { params });
  // Le backend retourne { posts: [...] } ou { data: [...] }
  const posts = response?.posts || response?.data || response || [];
  
  // Mapper les champs du backend vers le format attendu par le frontend
  return posts.map(post => ({
    ...post,
    author_name: post.display_name || post.author_name || 'Utilisateur',
    author_image: post.profile_image_url || post.author_image || null,
    liked_by_me: post.user_likes === 1 || post.liked_by_me || false,
  }));
}

export async function getPost(postId) {
  return request('GET', `/api/posts/${postId}`);
}

export async function createPost(data) {
  return request('POST', '/api/posts', data);
}

export async function likePost(postId) {
  return request('POST', `/api/posts/${postId}/like`);
}

export async function trackVideoView(postId) {
  return request('POST', `/api/posts/${postId}/video/view`);
}

// ============================================
// 🔧 UTILITAIRES GÉNÉRIQUES
// ============================================

export async function get(path) {
  return request('GET', path);
}

export async function post(path, data) {
  return request('POST', path, data);
}

export async function put(path, data) {
  return request('PUT', path, data);
}

export async function del(path) {
  return request('DELETE', path);
}

// ============================================
// 🌐 INFOS PUBLIQUES
// ============================================

export function getApiBaseUrl() {
  return API_BASE;
}

export function getApiDebugInfo() {
  return {
    apiBase: API_BASE,
    platform: Platform.OS,
    timeout: APP_CONFIG.TIMEOUT,
    config: {
      androidEmulator: API_CONFIG.ANDROID_API_BASE,
      androidDevice: API_CONFIG.ANDROID_DEVICE_IP,
      localhost: API_CONFIG.DEFAULT_API_BASE,
    },
  };
}

// Export pour tests
export { API_BASE };

// Export dataApi pour les services
export const dataApi = {
  fetchPosts: getPosts,
  fetchUserPosts: (userId) => request('GET', `/api/posts/user/${userId}`).then(res => {
    const posts = res?.posts || res?.data || res || [];
    return posts.map(post => ({
      ...post,
      author_name: post.display_name || post.author_name || 'Utilisateur',
      author_image: post.profile_image_url || post.author_image || null,
      liked_by_me: post.user_likes === 1 || post.liked_by_me || false,
    }));
  }),
  getPost,
  createPost,
  likePost,
  unlikePost: (postId) => request('DELETE', `/api/posts/${postId}/like`),
  trackVideoView,
  fetchPostComments: async (postId) => {
    const response = await request('GET', `/api/posts/${postId}/comments`);
    const comments = response?.comments || response?.data || response || [];
    // Mapper les champs du backend
    return comments.map(comment => ({
      ...comment,
      author_name: comment.display_name || comment.author_name || 'Utilisateur',
      author_image: comment.profile_image_url || comment.author_image || null,
      replies: comment.replies?.map(reply => ({
        ...reply,
        author_name: reply.display_name || reply.author_name || 'Utilisateur',
        author_image: reply.profile_image_url || reply.author_image || null,
      })) || [],
    }));
  },
  createPostComment: async (postId, content) => {
    const response = await request('POST', `/api/posts/${postId}/comments`, { content });
    const comment = response?.comment || response;
    return {
      ...comment,
      author_name: comment.display_name || comment.author_name || 'Utilisateur',
      author_image: comment.profile_image_url || comment.author_image || null,
    };
  },
  createPostCommentComment: (commentId, content) => request('POST', `/api/posts/comments/${commentId}/replies`, { content }),
  fetchCommentReplies: (commentId) => request('GET', `/api/posts/comments/${commentId}/replies`),

  // ── Réseau social / invitations ──────────────────────────────────────────
  // Suggestions d'utilisateurs
  fetchNetworkSuggestions: (search = '') => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return request('GET', `/api/network/suggestions${query}`)
      .then(res => res?.suggestions || [])
      .catch(() => []);
  },

  // Invitations de collaboration
  fetchReceivedInvitations: () => 
    request('GET', '/api/network/invitations/received')
      .then(res => res?.invitations || [])
      .catch(() => []),
  
  fetchSentInvitations: () => 
    request('GET', '/api/network/invitations/sent')
      .then(res => res?.invitations || [])
      .catch(() => []),
  
  sendCollaborationInvitation: (recipientId, message = '') => 
    request('POST', '/api/network/invitations/send', { recipientId, message }),
  
  acceptInvitation: (invitationId) => 
    request('PUT', `/api/network/invitations/${invitationId}/accept`),
  
  declineInvitation: (invitationId) => 
    request('PUT', `/api/network/invitations/${invitationId}/decline`),
  
  cancelInvitation: (invitationId) => 
    request('DELETE', `/api/network/invitations/${invitationId}/cancel`),

  // Système de suivi
  followUser: (userId) => 
    request('POST', `/api/network/follows/${userId}`),
  
  unfollowUser: (userId) => 
    request('DELETE', `/api/network/follows/${userId}`),
  
  fetchFollowers: (limit = 50, offset = 0) => 
    request('GET', `/api/network/followers?limit=${limit}&offset=${offset}`)
      .then(res => res?.followers || [])
      .catch(() => []),
  
  fetchFollowing: (limit = 50, offset = 0) => 
    request('GET', `/api/network/following?limit=${limit}&offset=${offset}`)
      .then(res => res?.following || [])
      .catch(() => []),
  
  fetchCollaborators: (limit = 50, offset = 0) => 
    request('GET', `/api/network/collaborators?limit=${limit}&offset=${offset}`)
      .then(res => res?.collaborators || [])
      .catch(() => []),

  // Statuts
  fetchInvitationStatus: (targetUserId) => 
    request('GET', `/api/network/invitations/status/${targetUserId}`)
      .catch(() => ({ status: 'none' })),
  
  fetchFollowStatus: (userId) => 
    request('GET', `/api/network/follows/status/${userId}`)
      .catch(() => ({ isFollowing: false, isFollowedBy: false, isMutual: false })),

  // ── Commandes / réservations ──────────────────────────────────────────────
  getMyOrders: () => request('GET', '/api/reservations').then(res => res?.data || res || []).catch((e) => { if (e.status === 404) return []; throw e; }),
  getReceivedOrders: () => request('GET', '/api/reservations/received').then(res => res?.data || res || []).catch((e) => { if (e.status === 404) return []; throw e; }),
  createReservation: (items) => request('POST', '/api/reservations', { items }),
  confirmReservation: (id) => request('PUT', `/api/reservations/${id}/confirm`),
  cancelReservation: (id) => request('PUT', `/api/reservations/${id}/cancel`),
  addToCart: (productId, quantity) => {
    // Validation de la quantité
    if (!productId) throw new Error('product_id est requis');
    if (!Number.isInteger(quantity) || quantity < 1) throw new Error('quantity doit être un entier positif');
    return request('POST', '/api/reservations/cart', { product_id: productId, quantity });
  },
  
  uploadImage: async (file) => {
    const token = getToken();
    const formData = new FormData();
    
    if (typeof file === 'string') {
      const filename = file.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('image', {
        uri: file,
        name: filename,
        type,
      });
    } else {
      formData.append('image', file);
    }

    const response = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData
    });
    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.error || 'Upload failed');
    }
    return body.imageUrl;
  },

  // ── Régions et Cultures ──────────────────────────────────────────────────
  fetchRegions: () => request('GET', '/api/analysis/regions').then(res => res?.regions || res?.data || res || []).catch(() => []),
  fetchCultures: () => request('GET', '/api/analysis/cultures').then(res => res?.cultures || res?.data || res || []).catch(() => []),
  fetchKnnCultures: (regionId, k = 5) => request('GET', `/api/analysis/knn-cultures?regionId=${regionId}&k=${k}`).then(res => res?.recommendations || res?.data || res || []).catch(() => []),
  fetchRegionCultures: (regionId) => request('GET', `/api/analysis/region-cultures?regionId=${regionId}`).then(res => res?.region_cultures || res?.data || res || []).catch(() => []),

  // ── Météo ─────────────────────────────────────────────────────────────────
  fetchWeatherForecast: (lat, lon) =>
    request('GET', `/api/weather/forecast?lat=${lat || -18.8792}&lon=${lon || 47.5079}`)
      .then(res => res?.data || res || { forecast: [], location: 'Madagascar' })
      .catch(() => ({ forecast: [], location: 'Madagascar', error: true })),

  // ── Produits (agriculteur) ──────────────────────────────────────────────
  getMyProducts: (status) => {
    const query = status && status !== 'all' ? `?status=${status}` : '';
    return request('GET', `/api/products/my${query}`).then(res => res?.data || res || []).catch(() => []);
  },
  getProduct: (productId) => request('GET', `/api/products/${productId}`).then(res => res?.data || res).catch((e) => { throw e; }),
  toggleProductAvailability: (productId) => request('PATCH', `/api/products/${productId}/toggle`),
  deleteProduct: (productId) => deleteProduct(productId),
  updateProduct: (productId, data) => updateProduct(productId, data),
};
