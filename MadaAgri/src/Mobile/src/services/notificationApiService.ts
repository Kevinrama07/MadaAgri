import axios from 'axios';
import { getToken } from '../lib/api';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.88.3:4000/api';

export interface NotificationPreferences {
  email_enabled: boolean;
  push_enabled: boolean;
  sound_enabled: boolean;
  vibration_enabled: boolean;
  types_enabled: {
    message: boolean;
    collaboration: boolean;
    follow: boolean;
    like: boolean;
    comment: boolean;
  };
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

export interface NotificationStats {
  total: number;
  unread: number;
  archived: number;
  messages: number;
  collaborations: number;
  follows: number;
  likes: number;
  comments: number;
}

export interface Notification {
  id: string;
  type: string;
  actor_id: string;
  actor_name: string;
  actor_image?: string;
  content: string;
  related_type?: string;
  related_id?: string;
  is_read: boolean;
  is_archived: boolean;
  priority: string;
  created_at: string;
  read_at?: string;
}

class NotificationApiService {
  private apiAvailable: boolean = true;
  private hasLoggedWarning: boolean = false;

  private async getHeaders() {
    const token = await getToken();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  private handleError(error: any, context: string) {
    const status = error?.response?.status;
    if (status === 404) {
      this.apiAvailable = false;
      if (!this.hasLoggedWarning) {
        console.warn('⚠️ [NotificationAPI] Backend not available. Using fallback mode (Socket.io only).');
        console.warn('💡 To enable full features, start the backend: cd src/backend && npm start');
        this.hasLoggedWarning = true;
      }
    } else if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') {
      this.apiAvailable = false;
      if (!this.hasLoggedWarning) {
        console.warn('⚠️ [NotificationAPI] Cannot connect to backend. Check EXPO_PUBLIC_API_URL in .env');
        this.hasLoggedWarning = true;
      }
    }
  }

  isApiAvailable(): boolean {
    return this.apiAvailable;
  }

  async getNotifications(params?: {
    limit?: number;
    offset?: number;
    type?: string;
    unreadOnly?: boolean;
    archived?: boolean;
  }): Promise<{ notifications: Notification[]; total: number; limit: number; offset: number }> {
    try {
      const headers = await this.getHeaders();
      const { data } = await axios.get(`${API_URL}/notifications`, {
        headers,
        params,
      });
      return data;
    } catch (error: any) {
      this.handleError(error, 'getNotifications');
      return {
        notifications: [],
        total: 0,
        limit: params?.limit || 50,
        offset: params?.offset || 0,
      };
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const headers = await this.getHeaders();
      const { data } = await axios.get(`${API_URL}/notifications/unread-count`, { headers });
      return data.count;
    } catch (error: any) {
      this.handleError(error, 'getUnreadCount');
      return 0;
    }
  }

  async searchNotifications(query: string, limit = 20): Promise<Notification[]> {
    try {
      const headers = await this.getHeaders();
      const { data } = await axios.get(`${API_URL}/notifications/search`, {
        headers,
        params: { q: query, limit },
      });
      return data.notifications;
    } catch (error: any) {
      this.handleError(error, 'searchNotifications');
      return [];
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      const headers = await this.getHeaders();
      await axios.put(`${API_URL}/notifications/${notificationId}/read`, {}, { headers });
    } catch (error: any) {
      this.handleError(error, 'markAsRead');
    }
  }

  async markAsUnread(notificationId: string): Promise<void> {
    try {
      const headers = await this.getHeaders();
      await axios.put(`${API_URL}/notifications/${notificationId}/unread`, {}, { headers });
    } catch (error: any) {
      this.handleError(error, 'markAsUnread');
    }
  }

  async markAllAsRead(type?: string): Promise<void> {
    try {
      const headers = await this.getHeaders();
      await axios.put(
        `${API_URL}/notifications/read-all`,
        {},
        {
          headers,
          params: type ? { type } : {},
        }
      );
    } catch (error: any) {
      this.handleError(error, 'markAllAsRead');
    }
  }

  async archiveNotification(notificationId: string): Promise<void> {
    try {
      const headers = await this.getHeaders();
      await axios.put(`${API_URL}/notifications/${notificationId}/archive`, {}, { headers });
    } catch (error: any) {
      this.handleError(error, 'archiveNotification');
    }
  }

  async unarchiveNotification(notificationId: string): Promise<void> {
    try {
      const headers = await this.getHeaders();
      await axios.put(`${API_URL}/notifications/${notificationId}/unarchive`, {}, { headers });
    } catch (error: any) {
      this.handleError(error, 'unarchiveNotification');
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const headers = await this.getHeaders();
      await axios.delete(`${API_URL}/notifications/${notificationId}`, { headers });
    } catch (error: any) {
      this.handleError(error, 'deleteNotification');
    }
  }

  async clearAllRead(): Promise<number> {
    try {
      const headers = await this.getHeaders();
      const { data } = await axios.delete(`${API_URL}/notifications/clear-all`, { headers });
      return data.count;
    } catch (error: any) {
      this.handleError(error, 'clearAllRead');
      return 0;
    }
  }

  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const headers = await this.getHeaders();
      const { data } = await axios.get(`${API_URL}/notifications/preferences`, { headers });
      
      if (data.preferences.types_enabled && typeof data.preferences.types_enabled === 'string') {
        data.preferences.types_enabled = JSON.parse(data.preferences.types_enabled);
      }
      
      return data.preferences;
    } catch (error: any) {
      this.handleError(error, 'getPreferences');
      return {
        email_enabled: true,
        push_enabled: true,
        sound_enabled: true,
        vibration_enabled: true,
        types_enabled: {
          message: true,
          collaboration: true,
          follow: true,
          like: true,
          comment: true,
        },
        quiet_hours_start: null,
        quiet_hours_end: null,
      };
    }
  }

  async updatePreferences(preferences: NotificationPreferences): Promise<void> {
    try {
      const headers = await this.getHeaders();
      await axios.put(`${API_URL}/notifications/preferences`, preferences, { headers });
    } catch (error: any) {
      this.handleError(error, 'updatePreferences');
    }
  }

  async getStats(): Promise<NotificationStats> {
    try {
      const headers = await this.getHeaders();
      const { data } = await axios.get(`${API_URL}/notifications/stats`, { headers });
      return data.stats;
    } catch (error: any) {
      this.handleError(error, 'getStats');
      return {
        total: 0,
        unread: 0,
        archived: 0,
        messages: 0,
        collaborations: 0,
        follows: 0,
        likes: 0,
        comments: 0,
      };
    }
  }
}

export const notificationApiService = new NotificationApiService();
export default notificationApiService;
