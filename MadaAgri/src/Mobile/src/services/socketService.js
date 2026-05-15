import io from 'socket.io-client';
import storageService from './storageService';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.userId = null;
    this.listeners = new Map();
  }

  async connect(serverUrl, userId) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return Promise.resolve();
    }

    const url = serverUrl || 'http://localhost:4000';
    this.userId = userId;

    return new Promise(async (resolve, reject) => {
      try {
        const token = await storageService.getAuthToken();

        this.socket = io(url, {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
          transports: ['websocket', 'polling'],
          auth: {
            token,
            userId,
          },
        });

        this.socket.on('connect', () => {
          this.isConnected = true;
          console.log('Socket connected');
          
          // Envoyer l'ID utilisateur au serveur
          if (this.userId) {
            this.socket.emit('user:connect', this.userId);
          }

          // Émettre l'événement custom 'onConnect'
          this.emit('onConnect');
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          this.isConnected = false;
          console.warn(`Socket disconnected: ${reason}`);
          this.emit('onDisconnect', { reason });
        });

        this.socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          this.emit('onError', error);
          reject(error);
        });

        this.socket.on('error', (error) => {
          console.error('Socket error:', error);
          this.emit('onError', error);
        });

        // Keep-alive ping
        this.setupKeepAlive();

        console.log(`Socket connecting to ${url}`);
      } catch (error) {
        console.error('Failed to initialize socket:', error);
        reject(error);
      }
    });
  }

  setupKeepAlive() {
    setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, 30000); // Ping toutes les 30 secondes
  }

  joinConversation(conversationId) {
    if (this.socket?.connected) {
      this.socket.emit('conversation:join', conversationId);
      console.log(`Joined conversation: ${conversationId}`);
    }
  }

  leaveConversation(conversationId) {
    if (this.socket?.connected) {
      this.socket.emit('conversation:leave', conversationId);
      console.log(`Left conversation: ${conversationId}`);
    }
  }

  async sendMessage(recipientId, content, attachmentUrl = null, attachmentType = null) {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('message:send', {
        recipient_id: recipientId,
        content,
        attachment_url: attachmentUrl,
        attachment_type: attachmentType,
      });
      
      console.log(`Message sent to ${recipientId}`);
      resolve();
    });
  }

  sendTypingNotification(recipientId) {
    if (this.socket?.connected) {
      this.socket.emit('user:typing', { recipient_id: recipientId });
    }
  }

  sendCollaborationInvite(recipientId, projectId, message = '') {
    if (this.socket?.connected) {
      this.socket.emit('collaboration:invite', {
        recipientId,
        projectId,
        message,
        senderId: this.userId,
      });
      console.log(`Collaboration invite sent to ${recipientId}`);
    }
  }

  respondCollaborationInvite(inviteId, accepted) {
    if (this.socket?.connected) {
      this.socket.emit('collaboration:respond', {
        inviteId,
        accepted,
        userId: this.userId,
      });
      console.log(`Collaboration invite response: ${accepted ? 'accepted' : 'rejected'}`);
    }
  }

  sendFollowRequest(recipientId) {
    if (this.socket?.connected) {
      this.socket.emit('follow:request', {
        recipientId,
        senderId: this.userId,
      });
      console.log(`Follow request sent to ${recipientId}`);
    }
  }

  respondFollowRequest(requestId, accepted) {
    if (this.socket?.connected) {
      this.socket.emit('follow:respond', {
        requestId,
        accepted,
        userId: this.userId,
      });
      console.log(`Follow request response: ${accepted ? 'accepted' : 'rejected'}`);
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Si c'est un événement Socket.io, l'écouter
    if (this.socket && event !== 'onConnect' && event !== 'onDisconnect' && event !== 'onError') {
      this.socket.on(event, callback);
    }

    // Retourner une fonction de désabonnement
    return () => this.off(event, callback);
  }

  onMessage(callback) {
    return this.on('message:received', callback);
  }

  onConnect(callback) {
    return this.on('onConnect', callback);
  }

  onDisconnect(callback) {
    return this.on('onDisconnect', callback);
  }

  onError(callback) {
    return this.on('onError', callback);
  }

  onActivity(callback) {
    return this.on('user:typing', callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data = null) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in listener for ${event}:`, error);
        }
      });
    }
  }

  onNotification(callback) {
    this.on('notification:new', callback);
  }

  markNotificationRead(notificationId) {
    if (this.socket?.connected) {
      this.socket.emit('notification:read', notificationId);
    }
  }

  deleteNotification(notificationId) {
    if (this.socket?.connected) {
      this.socket.emit('notification:delete', notificationId);
    }
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id,
      userId: this.userId,
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
      this.socket = null;
      console.log('Socket disconnected');
    }
  }
}

// Exporter une instance unique (singleton)
export default new SocketService();
