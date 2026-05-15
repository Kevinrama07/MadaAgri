import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.userId = null;
    this.listeners = new Map(); // Pour gérer les écouteurs
  }

  async connect(serverUrl, userId) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return Promise.resolve();
    }

    const url = serverUrl || import.meta.env.VITE_WS_URL || 'http://localhost:4000';

    this.userId = userId;

    return new Promise((resolve, reject) => {
      try {
        console.log('Socket connecting to:', url);
        
        this.socket = io(url, {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
          transports: ['websocket', 'polling'],
          auth: {
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

  /**
   * Configurer le ping keep-alive
   */
  setupKeepAlive() {
    setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, 30000); // Ping toutes les 30 secondes
  }

  /**
   * Rejoindre une conversation
   */
  joinConversation(conversationId) {
    if (this.socket?.connected) {
      this.socket.emit('conversation:join', conversationId);
      console.log(`Joined conversation: ${conversationId}`);
    }
  }

  /**
   * Quitter une conversation
   */
  leaveConversation(conversationId) {
    if (this.socket?.connected) {
      this.socket.emit('conversation:leave', conversationId);
      console.log(`Left conversation: ${conversationId}`);
    }
  }

  /**
   * Envoyer un message
   */
  async sendMessage(recipientId, content) {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('message:send', {
        recipient_id: recipientId,
        content,
      });
      
      console.log(`Message sent to ${recipientId}`);
      resolve();
    });
  }

  /**
   * Notifier le début de la saisie
   */
  sendTypingNotification(recipientId) {
    if (this.socket?.connected) {
      this.socket.emit('user:typing', { recipient_id: recipientId });
    }
  }

  /**
   * Envoyer une invitation de collaboration
   */
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

  /**
   * Répondre à une invitation de collaboration
   */
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

  /**
   * Envoyer une demande de suivi
   */
  sendFollowRequest(recipientId) {
    if (this.socket?.connected) {
      this.socket.emit('follow:request', {
        recipientId,
        senderId: this.userId,
      });
      console.log(`Follow request sent to ${recipientId}`);
    }
  }

  /**
   * Répondre à une demande de suivi
   */
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

  /**
   * S'abonner à un événement
   */
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

  /**
   * Raccourcis pour les événements courants
   */
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

  /**
   * Se désabonner d'un événement
   */
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

  /**
   * Émettre un événement custom
   */
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

  /**
   * Écouter une notification en temps réel
   */
  onNotification(callback) {
    this.on('notification:new', callback);
  }

  /**
   * Marquer une notification comme lue
   */
  markNotificationRead(notificationId) {
    if (this.socket?.connected) {
      this.socket.emit('notification:read', notificationId);
    }
  }

  /**
   * Supprimer une notification
   */
  deleteNotification(notificationId) {
    if (this.socket?.connected) {
      this.socket.emit('notification:delete', notificationId);
    }
  }

  /**
   * Obtenir l'état de la connexion
   */
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id,
      userId: this.userId,
    };
  }

  /**
   * Déconnecter
   */
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
