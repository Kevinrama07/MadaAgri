import io from 'socket.io-client';
import { getToken } from './api';

const SOCKET_SERVER_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:4000';

class MessageSocketClient {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.isConnected = false;
  }

  /**
   * Connecter au serveur WebSocket
   */
  connect(userId) {
    if (this.socket?.connected) {
      console.log('[Socket] Already connected');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.socket = io(SOCKET_SERVER_URL, {
          auth: {
            token: getToken(),
          },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
          extraHeaders: {
            Authorization: `Bearer ${getToken()}`,
          },
        });

        this.socket.on('connect', () => {
          console.log('[Socket] Connected:', this.socket.id);
          this.isConnected = true;
          
          // Envoyer l'ID utilisateur au serveur
          this.socket.emit('user:connect', userId);
          
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('[Socket] Connection error:', error);
          reject(error);
        });

        this.socket.on('disconnect', () => {
          console.log('[Socket] Disconnected');
          this.isConnected = false;
        });

        this.socket.on('message:received', (message) => {
          this._notifyListeners('message:received', message);
        });

        this.socket.on('typing:started', (data) => {
          this._notifyListeners('typing:started', data);
        });

        this.socket.on('typing:stopped', (data) => {
          this._notifyListeners('typing:stopped', data);
        });

        this.socket.on('user:typing', (data) => {
          this._notifyListeners('user:typing', data);
        });

        this.socket.on('pong', () => {
          this._notifyListeners('pong', {});
        });

      } catch (err) {
        console.error('[Socket] Connection failed:', err);
        reject(err);
      }
    });
  }

  /**
   * Rejoindre une conversation
   */
  joinConversation(conversationId) {
    if (this.socket?.connected) {
      this.socket.emit('conversation:join', conversationId);
      console.log(`[Socket] Joined conversation: ${conversationId}`);
    }
  }

  /**
   * Quitter une conversation
   */
  leaveConversation(conversationId) {
    if (this.socket?.connected) {
      this.socket.emit('conversation:leave', conversationId);
      console.log(`[Socket] Left conversation: ${conversationId}`);
    }
  }

  /**
   * Envoyer un message
   */
  sendMessage(conversationId, message) {
    if (this.socket?.connected) {
      this.socket.emit('message:send', {
        conversationId,
        message,
      });
      console.log(`[Socket] Message sent to ${conversationId}`);
    } else {
      console.warn('[Socket] Socket not connected');
    }
  }

  /**
   * Notifier que l'utilisateur commence à taper
   */
  notifyTypingStart(conversationId) {
    if (this.socket?.connected) {
      this.socket.emit('typing:start', conversationId);
    }
  }

  /**
   * Notifier que l'utilisateur arrête de taper
   */
  notifyTypingStop(conversationId) {
    if (this.socket?.connected) {
      this.socket.emit('typing:stop', conversationId);
    }
  }

  /**
   * S'abonner à un événement
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    console.log(`[Socket] Listener registered for ${event}`);
  }

  /**
   * Se désabonner d'un événement
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const listeners = this.listeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Notifier tous les listeners
   */
  _notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          console.error(`[Socket] Error in listener for ${event}:`, err);
        }
      });
    }
  }

  /**
   * Déconnecter
   */
  disconnect() {
    if (this.socket?.connected) {
      this.socket.disconnect();
      this.isConnected = false;
      console.log('[Socket] Disconnected');
    }
  }

  /**
   * Garder la connexion active
   */
  keepAlive() {
    if (this.socket?.connected) {
      this.socket.emit('ping');
    }
  }
}

export const socketClient = new MessageSocketClient();
