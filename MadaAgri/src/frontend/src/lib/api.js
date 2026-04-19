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

async function apiFetch(path, options = {}) {
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
    return data.user;
  },

  async signIn(email, password, role = 'client') {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role })
    });
    setToken(data.token);
    return data.user;
  },

  async me() {
    const data = await apiFetch('/auth/me');
    return data.user;
  },

  signOut() {
    clearToken();
  }
};

export const dataApi = {
  async fetchUsers() {
    const data = await apiFetch('/users');
    return data.users;
  },

  async fetchRegions() {
    const data = await apiFetch('/regions');
    return data.regions;
  },

  async fetchCultures() {
    const data = await apiFetch('/cultures');
    return data.cultures;
  },

  async fetchProducts() {
    const data = await apiFetch('/products');
    return data.products;
  },

  async searchProducts(q) {
    const data = await apiFetch(`/products?q=${encodeURIComponent(q || '')}`);
    return data.products;
  },

  async createProduct(product) {
    const data = await apiFetch('/products', {
      method: 'POST',
      body: JSON.stringify(product)
    });
    return data.product;
  },

  async fetchMessages(conversationId) {
    const data = await apiFetch(`/messages?conversationId=${encodeURIComponent(conversationId)}`);
    return data.messages;
  },

  async sendMessage(recipient_id, content) {
    const data = await apiFetch('/messages', {
      method: 'POST',
      body: JSON.stringify({ recipient_id, content })
    });
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

