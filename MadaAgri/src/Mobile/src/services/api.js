import apiClient from './apiClient';

// Auth endpoints
export const authAPI = {
  register: (data) => apiClient.post('/auth/signup', data),
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  logout: () => apiClient.post('/auth/logout'),
  refreshToken: () => apiClient.post('/auth/refresh'),
  getCurrentUser: () => apiClient.get('/auth/me'),
};

// User endpoints
export const userAPI = {
  getProfile: (userId) => apiClient.get(`/users/${userId}`),
  updateProfile: (userId, data) => apiClient.put(`/users/${userId}`, data),
  uploadProfilePhoto: (userId, formData) => 
    apiClient.post(`/users/${userId}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  followUser: (userId) => apiClient.post(`/users/${userId}/follow`),
  unfollowUser: (userId) => apiClient.post(`/users/${userId}/unfollow`),
  getFollowers: (userId) => apiClient.get(`/users/${userId}/followers`),
  getFollowing: (userId) => apiClient.get(`/users/${userId}/following`),
};

// Products endpoints
export const productAPI = {
  getProducts: (params) => apiClient.get('/products', { params }),
  getProduct: (productId) => apiClient.get(`/products/${productId}`),
  createProduct: (data) => apiClient.post('/products', data),
  updateProduct: (productId, data) => apiClient.put(`/products/${productId}`, data),
  deleteProduct: (productId) => apiClient.delete(`/products/${productId}`),
  searchProducts: (query, filters) => apiClient.get('/products/search', { params: { q: query, ...filters } }),
  getProductsByRegion: (region) => apiClient.get(`/products/region/${region}`),
  getProductsByCulture: (culture) => apiClient.get(`/products/culture/${culture}`),
};

// Posts/Publications endpoints
export const postAPI = {
  getPosts: (params) => apiClient.get('/posts', { params }),
  getPost: (postId) => apiClient.get(`/posts/${postId}`),
  createPost: (data) => apiClient.post('/posts', data),
  updatePost: (postId, data) => apiClient.put(`/posts/${postId}`, data),
  deletePost: (postId) => apiClient.delete(`/posts/${postId}`),
  likePost: (postId) => apiClient.post(`/posts/${postId}/like`),
  unlikePost: (postId) => apiClient.post(`/posts/${postId}/unlike`),
  commentPost: (postId, comment) => apiClient.post(`/posts/${postId}/comments`, { content: comment }),
  getComments: (postId) => apiClient.get(`/posts/${postId}/comments`),
};

// Cart endpoints
export const cartAPI = {
  getCart: () => apiClient.get('/cart'),
  addToCart: (productId, quantity) => apiClient.post('/cart/items', { productId, quantity }),
  updateCartItem: (itemId, quantity) => apiClient.put(`/cart/items/${itemId}`, { quantity }),
  removeCartItem: (itemId) => apiClient.delete(`/cart/items/${itemId}`),
  clearCart: () => apiClient.delete('/cart'),
  optimizeCart: (budget) => apiClient.post('/cart/optimize', { budget }),
};

// Orders/Reservations endpoints
export const orderAPI = {
  getOrders: (params) => apiClient.get('/orders', { params }),
  getOrder: (orderId) => apiClient.get(`/orders/${orderId}`),
  createOrder: (data) => apiClient.post('/orders', data),
  updateOrder: (orderId, data) => apiClient.put(`/orders/${orderId}`, data),
  cancelOrder: (orderId) => apiClient.post(`/orders/${orderId}/cancel`),
  getOrderHistory: () => apiClient.get('/orders/history'),
};

// Messages endpoints
export const messageAPI = {
  getConversations: () => apiClient.get('/messages/conversations'),
  getMessages: (conversationId) => apiClient.get(`/messages/conversations/${conversationId}`),
  sendMessage: (conversationId, message) => apiClient.post(`/messages/conversations/${conversationId}`, { content: message }),
  createConversation: (userId) => apiClient.post('/messages/conversations', { userId }),
  deleteConversation: (conversationId) => apiClient.delete(`/messages/conversations/${conversationId}`),
};

// Route Optimization endpoints
export const routeAPI = {
  optimizeRoute: (waypoints) => apiClient.post('/optimization/route', { waypoints }),
  optimizeDelivery: (orders, vehicle) => apiClient.post('/optimization/delivery', { orders, vehicle }),
};

// Analysis endpoints
export const analysisAPI = {
  getSoilAnalysis: (farmId) => apiClient.get(`/analysis/soil/${farmId}`),
  getCultureAnalysis: (cultureId) => apiClient.get(`/analysis/culture/${cultureId}`),
  createSoilAnalysis: (data) => apiClient.post('/analysis/soil', data),
};

// Notifications endpoints
export const notificationAPI = {
  getNotifications: () => apiClient.get('/notifications'),
  markAsRead: (notificationId) => apiClient.put(`/notifications/${notificationId}/read`),
  deleteNotification: (notificationId) => apiClient.delete(`/notifications/${notificationId}`),
};

export default apiClient;
