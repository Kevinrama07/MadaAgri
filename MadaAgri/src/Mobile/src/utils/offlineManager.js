import { storageService } from '../../services';
import apiClient from '../services/apiClient';

export const offlineManager = {
  // Check if online
  isOnline: async () => {
    try {
      // Attempt a simple API call
      await apiClient.get('/health', { timeout: 3000 });
      return true;
    } catch (error) {
      return false;
    }
  },

  // Queue action for offline
  queueAction: async (action) => {
    try {
      const queue = await storageService.getOfflineQueue();
      queue.push({
        ...action,
        timestamp: Date.now(),
        id: Math.random().toString(36).substr(2, 9),
      });
      await storageService.saveOfflineQueue(queue);
      return true;
    } catch (error) {
      console.error('Error queuing action:', error);
      return false;
    }
  },

  // Sync offline actions
  syncOfflineActions: async () => {
    try {
      const queue = await storageService.getOfflineQueue();
      if (queue.length === 0) return { success: true, synced: 0 };

      let synced = 0;
      const failed = [];

      for (const action of queue) {
        try {
          switch (action.type) {
            case 'POST_CREATE':
              await apiClient.post('/posts', action.data);
              synced++;
              break;
            case 'PRODUCT_REVIEW':
              await apiClient.post(`/products/${action.productId}/review`, action.data);
              synced++;
              break;
            case 'MESSAGE_SEND':
              await apiClient.post(`/messages/conversations/${action.conversationId}`, {
                content: action.message,
              });
              synced++;
              break;
            case 'ORDER_CREATE':
              await apiClient.post('/orders', action.data);
              synced++;
              break;
            default:
              failed.push(action);
          }
        } catch (error) {
          failed.push(action);
          console.error(`Error syncing action ${action.type}:`, error);
        }
      }

      // Clear synced actions, keep failed ones
      const newQueue = failed;
      if (newQueue.length > 0) {
        // Save only failed actions back
        const failedQueue = newQueue.map((action) => {
          action.retries = (action.retries || 0) + 1;
          return action;
        });
        // Store failed actions (can implement retry logic)
      }

      await storageService.clearOfflineQueue();
      await storageService.saveLastSync(Date.now());

      return {
        success: true,
        synced,
        failed: failed.length,
      };
    } catch (error) {
      console.error('Error syncing offline actions:', error);
      return { success: false, error };
    }
  },

  // Cache data for offline
  cacheData: async (key, data) => {
    try {
      await storageService.saveUserData({ ...data, _cached: true, _cachedAt: Date.now() });
      return true;
    } catch (error) {
      console.error('Error caching data:', error);
      return false;
    }
  },

  // Get cached data
  getCachedData: async (key) => {
    try {
      const data = await storageService.getUserData();
      if (data && data._cached) {
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  },

  // Clear old cache
  clearOldCache: async (maxAge = 24 * 60 * 60 * 1000) => {
    try {
      const data = await storageService.getUserData();
      if (data && data._cachedAt && Date.now() - data._cachedAt > maxAge) {
        // Implement logic to clear
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  },
};

export default offlineManager;
