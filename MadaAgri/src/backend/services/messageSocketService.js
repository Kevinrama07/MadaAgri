
const logger = require('../utils/logger');

class MessageSocketService {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // userId -> socket.id
    this.activeConversations = new Map(); // conversationId -> Set of socket.ids
  }

  init(io) {
    this.io = io;
    this.setupSocketHandlers();
    logger.info('MessageSocketService initialized');
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`Socket connected: ${socket.id}`);

      // Utilisateur se connecte
      socket.on('user:connect', (userId) => {
        this.userSockets.set(userId, socket.id);
        logger.info(`User ${userId} connected with socket ${socket.id}`);
      });

      // Rejoindre une conversation
      socket.on('conversation:join', (conversationId) => {
        socket.join(conversationId);
        if (!this.activeConversations.has(conversationId)) {
          this.activeConversations.set(conversationId, new Set());
        }
        this.activeConversations.get(conversationId).add(socket.id);
        logger.info(`Socket ${socket.id} joined conversation ${conversationId}`);
      });

      // Quitter une conversation
      socket.on('conversation:leave', (conversationId) => {
        socket.leave(conversationId);
        const conv = this.activeConversations.get(conversationId);
        if (conv) {
          conv.delete(socket.id);
          if (conv.size === 0) {
            this.activeConversations.delete(conversationId);
          }
        }
        logger.info(`Socket ${socket.id} left conversation ${conversationId}`);
      });

      // Envoyer un message
      socket.on('message:send', (data) => {
        const { conversationId, message } = data;
        logger.info(`Message sent to ${conversationId}: ${message.content}`);

        // Envoyer le message à tous les sockets de la conversation
        this.io.to(conversationId).emit('message:received', {
          ...message,
          timestamp: new Date(),
        });
      });

      // Afficher que l'utilisateur est en train de taper
      socket.on('typing:start', (conversationId) => {
        this.io.to(conversationId).emit('typing:started', {
          socketId: socket.id,
          conversationId,
        });
      });

      // Arrêter d'afficher que l'utilisateur est en train de taper
      socket.on('typing:stop', (conversationId) => {
        this.io.to(conversationId).emit('typing:stopped', {
          socketId: socket.id,
          conversationId,
        });
      });

      // Déconnexion
      socket.on('disconnect', () => {
        // Nettoyer
        let userId = null;
        for (const [uid, sid] of this.userSockets.entries()) {
          if (sid === socket.id) {
            userId = uid;
            this.userSockets.delete(uid);
            break;
          }
        }

        // Nettoyer les conversations
        for (const [convId, sockets] of this.activeConversations.entries()) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            this.activeConversations.delete(convId);
          }
        }

        logger.info(`Socket disconnected: ${socket.id}${userId ? ` (user: ${userId})` : ''}`);
      });

      // Répondre au ping pour maintenir la connexion
      socket.on('ping', () => {
        socket.emit('pong');
      });
    });
  }

  emitMessageToConversation(conversationId, message) {
    if (this.io) {
      this.io.to(conversationId).emit('message:received', message);
      logger.info(`Message emitted to conversation ${conversationId}`);
    }
  }

  notifyTyping(conversationId, userId) {
    if (this.io) {
      this.io.to(conversationId).emit('user:typing', { userId });
    }
  }

  isConversationActive(conversationId) {
    return this.activeConversations.has(conversationId);
  }

  getActiveUserCount(conversationId) {
    const conv = this.activeConversations.get(conversationId);
    return conv ? conv.size : 0;
  }
}

module.exports = new MessageSocketService();