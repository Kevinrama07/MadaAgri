import { useEffect, useCallback, useState } from 'react';
import socketService from '../services/socketService';
import notificationService from '../services/notificationService';
import notificationSoundService from '../services/notificationSoundService';
import { logger } from '../utils/logger';

/**
 * Hook personnalisé pour gérer les notifications en temps réel
 * @param {string} userId - ID de l'utilisateur
 * @returns {Object} - État et méthodes pour gérer les notifications
 */
export function useRealTimeNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les notifications initiales depuis l'API
  useEffect(() => {
    if (!userId) return;

    const loadNotifications = async () => {
      try {
        setIsLoading(true);
        const data = await notificationService.getNotifications({ limit: 50 });
        setNotifications(data.notifications || []);
        const count = await notificationService.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        logger.error('Failed to load notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
  }, [userId]);

  // Initialiser la connexion Socket
  useEffect(() => {
    if (!userId) return;

    socketService.connect(userId);

    // Écouter la connexion
    const handleConnect = () => {
      setIsConnected(true);
      logger.info('Real-time notifications connected');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      logger.warn('Real-time notifications disconnected');
    };

    const handleError = (error) => {
      logger.error('Real-time notifications error:', error);
    };

    socketService.on('onConnect', handleConnect);
    socketService.on('onDisconnect', handleDisconnect);
    socketService.on('onError', handleError);

    return () => {
      socketService.off('onConnect', handleConnect);
      socketService.off('onDisconnect', handleDisconnect);
      socketService.off('onError', handleError);
    };
  }, [userId]);

  // Écouter les messages reçus
  useEffect(() => {
    const handleMessage = (message) => {
      setNotifications((prev) => [
        {
          id: `msg-${Date.now()}`,
          type: 'message',
          content: message.content,
          senderId: message.senderId,
          senderName: message.senderName,
          conversationId: message.conversationId,
          timestamp: new Date(),
          read: false,
        },
        ...prev,
      ]);
      setUnreadCount((prev) => prev + 1);
      notificationSoundService.notify('message');
    };

    socketService.on('message:received', handleMessage);

    return () => {
      socketService.off('message:received', handleMessage);
    };
  }, []);

  // Écouter les invitations de collaboration
  useEffect(() => {
    const handleCollaborationInvite = (invite) => {
      setNotifications((prev) => [
        {
          id: `collab-${invite.id}`,
          type: 'collaboration',
          senderId: invite.senderId,
          senderName: invite.senderName,
          projectId: invite.projectId,
          projectName: invite.projectName,
          message: invite.message,
          timestamp: new Date(),
          read: false,
        },
        ...prev,
      ]);
      setUnreadCount((prev) => prev + 1);
      notificationSoundService.notify('collaboration');
    };

    socketService.on('collaboration:invited', handleCollaborationInvite);

    return () => {
      socketService.off('collaboration:invited', handleCollaborationInvite);
    };
  }, []);

  // Écouter les demandes de suivi
  useEffect(() => {
    const handleFollowRequest = (request) => {
      setNotifications((prev) => [
        {
          id: `follow-${request.id}`,
          type: 'follow',
          senderId: request.senderId,
          senderName: request.senderName,
          senderAvatar: request.senderAvatar,
          timestamp: new Date(),
          read: false,
        },
        ...prev,
      ]);
      setUnreadCount((prev) => prev + 1);
      notificationSoundService.notify('follow');
    };

    socketService.on('follow:requested', handleFollowRequest);

    return () => {
      socketService.off('follow:requested', handleFollowRequest);
    };
  }, []);

  // Écouter les notifications génériques
  useEffect(() => {
    const handleNotification = (notification) => {
      setNotifications((prev) => [
        {
          ...notification,
          id: notification.id || `notif-${Date.now()}`,
          timestamp: new Date(notification.timestamp || Date.now()),
          read: false,
        },
        ...prev,
      ]);
      setUnreadCount((prev) => prev + 1);
      notificationSoundService.notify(notification.type);
    };

    socketService.on('notification:new', handleNotification);

    return () => {
      socketService.off('notification:new', handleNotification);
    };
  }, []);

  // Marquer une notification comme lue
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
    }
  }, []);

  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      logger.error('Failed to mark all as read:', error);
    }
  }, []);

  // Supprimer une notification
  const removeNotification = useCallback(async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
    } catch (error) {
      logger.error('Failed to remove notification:', error);
    }
  }, []);

  // Archiver une notification
  const archiveNotification = useCallback(async (notificationId) => {
    try {
      await notificationService.archiveNotification(notificationId);
      setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
    } catch (error) {
      logger.error('Failed to archive notification:', error);
    }
  }, []);

  // Obtenir les notifications non lues
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter((notif) => !notif.read);
  }, [notifications]);

  // Répondre à une invitation
  const respondToInvite = useCallback(async (notificationId, accepted) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) return;

    if (notification.type === 'collaboration') {
      socketService.respondCollaborationInvite(notificationId, accepted);
    } else if (notification.type === 'follow') {
      socketService.respondFollowRequest(notificationId, accepted);
    }
    
    await removeNotification(notificationId);
  }, [notifications, removeNotification]);

  return {
    notifications,
    isConnected,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    archiveNotification,
    getUnreadNotifications,
    respondToInvite,
  };
}

export default useRealTimeNotifications;
