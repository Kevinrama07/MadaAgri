import { authAPI } from './api';
import storageService from './storageService';

export const authService = {
  register: async (userData) => {
    try {
      // Convert to backend format
      const backendData = {
        email: userData.email,
        password: userData.password,
        displayName: userData.name,
        role: userData.userType === 'farmer' ? 'farmer' : 'client'
      };
      const response = await authAPI.register(backendData);
      const { token, user } = response.data;
      await storageService.saveAuthToken(token);
      await storageService.saveUserData(user);
      console.log('[authService] Registration successful:', { email: userData.email, userType: user.userType });
      return { success: true, user, token };
    } catch (error) {
      console.error('[authService] Registration failed:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.error || 'Registration failed' };
    }
  },

  login: async (email, password) => {
    try {
      console.log('[authService.login] Attempting login for:', email);
      const response = await authAPI.login(email, password);
      console.log('[authService.login] Response status:', response.status);
      console.log('[authService.login] Response data keys:', Object.keys(response.data));
      
      const { token, user } = response.data;
      
      if (!token || !user) {
        throw new Error('Invalid response format: missing token or user');
      }
      
      await storageService.saveAuthToken(token);
      await storageService.saveUserData(user);
      console.log('[authService] Login successful:', { email, userType: user.userType, userId: user.id });
      return { success: true, user, token };
    } catch (error) {
      // Gestion robuste des erreurs
      let errorMsg = 'Login failed';
      
      // Tenter d'extraire le message d'erreur de différentes sources
      if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      // S'assurer que errorMsg est une string
      if (typeof errorMsg !== 'string') {
        errorMsg = JSON.stringify(errorMsg);
      }
      
      console.error('[authService] Login failed:', {
        statusCode: error.response?.status,
        errorMsg,
        fullError: error
      });
      
      return { success: false, error: errorMsg };
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await storageService.removeAuthToken();
      await storageService.removeUserData();
    }
  },

  getCurrentUser: async () => {
    try {
      const token = await storageService.getAuthToken();
      if (!token) return null;
      
      const response = await authAPI.getCurrentUser();
      return response.data;
    } catch (error) {
      await storageService.removeAuthToken();
      return null;
    }
  },

  isAuthenticated: async () => {
    const token = await storageService.getAuthToken();
    return !!token;
  },
};

export default authService;
