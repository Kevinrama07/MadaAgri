import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

class NotificationService {
  async getNotifications(params = {}) {
    const { data } = await axios.get(`${API_URL}/notifications`, { params });
    return data;
  }

  async getUnreadCount() {
    const { data } = await axios.get(`${API_URL}/notifications/unread-count`);
    return data.count;
  }

  async searchNotifications(query, limit = 20) {
    const { data } = await axios.get(`${API_URL}/notifications/search`, {
      params: { q: query, limit }
    });
    return data.notifications;
  }

  async markAsRead(notificationId) {
    await axios.put(`${API_URL}/notifications/${notificationId}/read`);
  }

  async markAsUnread(notificationId) {
    await axios.put(`${API_URL}/notifications/${notificationId}/unread`);
  }

  async markAllAsRead(type = null) {
    await axios.put(`${API_URL}/notifications/read-all`, null, {
      params: type ? { type } : {}
    });
  }

  async archiveNotification(notificationId) {
    await axios.put(`${API_URL}/notifications/${notificationId}/archive`);
  }

  async unarchiveNotification(notificationId) {
    await axios.put(`${API_URL}/notifications/${notificationId}/unarchive`);
  }

  async deleteNotification(notificationId) {
    await axios.delete(`${API_URL}/notifications/${notificationId}`);
  }

  async clearAllRead() {
    const { data } = await axios.delete(`${API_URL}/notifications/clear-all`);
    return data.count;
  }

  async getPreferences() {
    const { data } = await axios.get(`${API_URL}/notifications/preferences`);
    return data.preferences;
  }

  async updatePreferences(preferences) {
    await axios.put(`${API_URL}/notifications/preferences`, preferences);
  }

  async getStats() {
    const { data } = await axios.get(`${API_URL}/notifications/stats`);
    return data.stats;
  }
}

export default new NotificationService();
