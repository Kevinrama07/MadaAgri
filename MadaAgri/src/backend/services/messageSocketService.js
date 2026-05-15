
const logger = require('../utils/logger');
const { randomUUID } = require('crypto');
const pool = require('../db');

class MessageSocketService {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // userId -> socket.id
    this.activeConversations = new Map(); // conversationId -> Set of socket.ids
    this.userStatus = new Map(); // userId -> { status: 'online'|'offline', lastSeen: Date }
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
        socket.userId = userId; // Stocker l'ID utilisateur dans le socket
        socket.join(`user:${userId}`); // Rejoindre une room utilisateur pour les notifications
        
        // Mettre à jour le statut
        this.userStatus.set(userId, { status: 'online', lastSeen: new Date() });
        
        // Notifier tous les utilisateurs du changement de statut
        this.io.emit('user:status', { userId, status: 'online' });
        
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
      socket.on('message:send', async (data) => {
        try {
          // Supporter deux formats: 
          // 1. { conversationId, message } (web)
          // 2. { recipient_id, content } (mobile)
          
          let conversationId = data.conversationId;
          let messageContent = data.content || (data.message?.content);
          let messageData = data.message || {};
          let recipientId = data.recipient_id;
          
          // Format mobile: générer conversationId à partir des deux user IDs (match format POST API: id1_id2)
          if (!conversationId && recipientId && socket.userId) {
            const ids = [socket.userId, recipientId].sort();
            conversationId = `${ids[0]}_${ids[1]}`;
          }
          
          if (!conversationId || !messageContent) {
            logger.error('[MessageSocket] Format de message invalide:', data);
            socket.emit('message:error', { 
              error: 'Format de message invalide' 
            });
            return;
          }
          
          logger.info(`Message sent from ${socket.userId} to ${conversationId}: ${messageContent}`);

          // Créer l'objet message
          const messageId = randomUUID();
          const messagePayload = {
            id: messageId,
            sender_id: socket.userId,
            recipient_id: recipientId,
            conversationId: conversationId,
            conversation_id: conversationId, // Support des deux formats
            content: messageContent,
            created_at: new Date().toISOString(),
            read: false,
            ...messageData,
          };

          // 💾 Persister le message dans la BD
          try {
            const query = `
              INSERT INTO messages 
              (id, sender_id, recipient_id, conversation_id, content, is_read, created_at) 
              VALUES (?, ?, ?, ?, ?, false, NOW())
            `;
            
            // Extraire le recipient_id du conversationId si on ne l'a pas
            if (!recipientId && conversationId) {
              const ids = conversationId.split('_');
              recipientId = ids[0] === socket.userId ? ids[1] : ids[0];
            }
            
            await pool.query(query, [messageId, socket.userId, recipientId, conversationId, messageContent]);
            logger.info(`[MessageSocket] Message persisted to DB: ${messageId}`);
          } catch (dbError) {
            logger.error('[MessageSocket] Erreur persistance BD:', dbError);
            // Continuer même si la persistance échoue, mais log l'erreur
          }

          // Envoyer le message à tous les sockets de la conversation (y compris l'expéditeur)
          this.io.to(conversationId).emit('message:received', messagePayload);
          logger.info(`Message émis à la conversation ${conversationId}`);
        } catch (error) {
          logger.error('[MessageSocket] Erreur lors de l\'envoi du message:', error);
          socket.emit('message:error', { 
            error: 'Erreur lors de l\'envoi du message' 
          });
        }
      });

      // Afficher que l'utilisateur est en train de taper
      socket.on('user:typing', (data) => {
        const { recipient_id } = data;
        if (!recipient_id || !socket.userId) return;
        
        // Générer conversationId
        const ids = [socket.userId, recipient_id].sort();
        const conversationId = `${ids[0]}_${ids[1]}`;
        
        // Émettre à la conversation (sauf à l'expéditeur)
        socket.to(conversationId).emit('user:typing', {
          sender_id: socket.userId,
          conversationId,
        });
        
        logger.info(`User ${socket.userId} is typing to ${recipient_id}`);
      });

      // Support ancien format pour compatibilité
      socket.on('typing:start', (conversationId) => {
        this.io.to(conversationId).emit('typing:started', {
          socketId: socket.id,
          conversationId,
        });
      });

      socket.on('typing:stop', (conversationId) => {
        this.io.to(conversationId).emit('typing:stopped', {
          socketId: socket.id,
          conversationId,
        });
      });

      // ============================================
      // 📤 INVITATIONS DE COLLABORATION EN TEMPS RÉEL
      // ============================================
      socket.on('collaboration:invite', (data) => {
        const { recipientId, projectId, message, senderId } = data;
        logger.info(`Collaboration invite from ${senderId} to ${recipientId}`);

        // Envoyer l'invitation à l'utilisateur destinataire
        this.io.to(`user:${recipientId}`).emit('collaboration:invited', {
          id: `collab-${Date.now()}`,
          senderId,
          projectId,
          message,
          timestamp: new Date(),
        });
      });

      // Répondre à une invitation de collaboration
      socket.on('collaboration:respond', (data) => {
        const { inviteId, accepted, userId } = data;
        logger.info(`Collaboration response: ${accepted ? 'accepted' : 'rejected'} by ${userId}`);

        // Notifier l'expéditeur de la réponse
        this.io.emit('collaboration:response', {
          inviteId,
          accepted,
          userId,
          timestamp: new Date(),
        });
      });

      // ============================================
      // 👥 DEMANDES DE SUIVI EN TEMPS RÉEL
      // ============================================
      socket.on('follow:request', (data) => {
        const { recipientId, senderId } = data;
        logger.info(`Follow request from ${senderId} to ${recipientId}`);

        // Envoyer la demande au destinataire
        this.io.to(`user:${recipientId}`).emit('follow:requested', {
          id: `follow-${Date.now()}`,
          senderId,
          timestamp: new Date(),
        });
      });

      // Répondre à une demande de suivi
      socket.on('follow:respond', (data) => {
        const { requestId, accepted, userId } = data;
        logger.info(`Follow response: ${accepted ? 'accepted' : 'rejected'} by ${userId}`);

        // Notifier l'expéditeur de la réponse
        this.io.emit('follow:response', {
          requestId,
          accepted,
          userId,
          timestamp: new Date(),
        });
      });

      // ============================================
      // 🔔 NOTIFICATIONS GÉNÉRIQUES EN TEMPS RÉEL
      // ============================================
      socket.on('notification:send', (data) => {
        const { recipientId, type, content, actionUrl } = data;
        logger.info(`Notification sent to ${recipientId}: ${type}`);

        // Envoyer la notification au destinataire
        this.io.to(`user:${recipientId}`).emit('notification:new', {
          id: `notif-${Date.now()}`,
          type,
          content,
          actionUrl,
          timestamp: new Date(),
        });
      });

      // Marquer une notification comme lue
      socket.on('notification:read', (notificationId) => {
        logger.info(`Notification marked as read: ${notificationId}`);
        this.io.emit('notification:read', notificationId);
      });

      // Supprimer une notification
      socket.on('notification:delete', (notificationId) => {
        logger.info(`Notification deleted: ${notificationId}`);
        this.io.emit('notification:delete', notificationId);
      });

      // Déconnexion
      socket.on('disconnect', () => {
        // Nettoyer
        let userId = null;
        for (const [uid, sid] of this.userSockets.entries()) {
          if (sid === socket.id) {
            userId = uid;
            this.userSockets.delete(uid);
            
            // Mettre à jour le statut
            this.userStatus.set(uid, { status: 'offline', lastSeen: new Date() });
            
            // Notifier tous les utilisateurs du changement de statut
            this.io.emit('user:status', { userId: uid, status: 'offline', lastSeen: new Date() });
            
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

  emitMessageEdited(conversationId, message) {
    if (this.io) {
      this.io.to(conversationId).emit('message:edited', message);
      logger.info(`Message edited notification sent to conversation ${conversationId}`);
    }
  }

  emitMessageDeleted(conversationId, messageId) {
    if (this.io) {
      this.io.to(conversationId).emit('message:deleted', { messageId, conversationId });
      logger.info(`Message deleted notification sent to conversation ${conversationId}`);
    }
  }

  emitMessageRead(conversationId, messageId, userId) {
    if (this.io) {
      this.io.to(conversationId).emit('message:read', { messageId, userId, conversationId, readAt: new Date() });
      logger.info(`Message read notification sent to conversation ${conversationId}`);
    }
  }

  emitReactionAdded(conversationId, messageId, userId, emoji, reactions) {
    if (this.io) {
      this.io.to(conversationId).emit('message:reaction:added', { messageId, userId, emoji, reactions, conversationId });
      logger.info(`Reaction added notification sent to conversation ${conversationId}`);
    }
  }

  emitReactionRemoved(conversationId, messageId, userId, emoji, reactions) {
    if (this.io) {
      this.io.to(conversationId).emit('message:reaction:removed', { messageId, userId, emoji, reactions, conversationId });
      logger.info(`Reaction removed notification sent to conversation ${conversationId}`);
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