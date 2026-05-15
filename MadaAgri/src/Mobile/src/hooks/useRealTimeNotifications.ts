import { useEffect, useCallback, useState, useMemo } from 'react';
import socketService from '../services/socketService';
import notificationApiService from '../services/notificationApiService';
import notificationSoundService from '../services/notificationSoundService';
import type { Notification, NotificationPreferences } from '../services/notificationApiService';

/**
 * Hook personnalisé pour gérer les notifications en temps réel (Version Mobile)
 * @param {string} userId - ID de l'utilisateur
 * @returns {Object} - État et méthodes pour gérer les notifications
 */
export function useRealTimeNotificationsMobile(userId: string) {
  const [apiNotifications, setApiNotifications] = useState<Notification[]>([]);
  const [realtimeNotifications, setRealtimeNotifications] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  // Charger les notifications initiales depuis l'API
  useEffect(() => {
    if (!userId) return;

    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        
        // Charger les notifications
        const data = await notificationApiService.getNotifications({ limit: 50 });
        setApiNotifications(data.notifications || []);
        
        // Charger le compteur non lus
        const count = await notificationApiService.getUnreadCount();
        setUnreadCount(count);
        
        // Charger les préférences
        const prefs = await notificationApiService.getPreferences();
        setPreferences(prefs);
        
        // Configurer le service de sons
        notificationSoundService.setEnabled(prefs.sound_enabled);
        notificationSoundService.setVibrationEnabled(prefs.vibration_enabled);
        await notificationSoundService.initialize();
      } catch (error) {
        console.error('[RealTime] Failed to load initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [userId]);

  // Initialiser la connexion Socket
  useEffect(() => {
    if (!userId) {
      console.warn('[RealTime] Pas de userId');
      return;
    }

    // Recuperar la URL del servidor desde las variables de entorno
    let serverUrl = process.env.EXPO_PUBLIC_API_URL;
    
    if (!serverUrl) {
      // Fallback si EXPO_PUBLIC_API_URL n'est pas défini
      serverUrl = 'http://192.168.88.3:4000';
      console.warn('[RealTime] EXPO_PUBLIC_API_URL non défini, utilisant:', serverUrl);
    }

    console.log('[RealTime] Tentative de connexion à:', serverUrl, 'avec userId:', userId);
    
    socketService.connect(serverUrl, userId).catch((error) => {
      console.error('[RealTime] Connection error:', error);
      console.error('[RealTime] Serveur URL:', serverUrl);
    });

    // Vérifier l'état initial
    setIsConnected(socketService.isConnected());

    // Escuchar la conexión
    const unsubscribeConnect = socketService.onConnect(() => {
      setIsConnected(true);
      console.log('[RealTime] Real-time notifications connected (Mobile)');
    });

    const unsubscribeDisconnect = socketService.onDisconnect(() => {
      setIsConnected(false);
      console.warn('[RealTime] Real-time notifications disconnected (Mobile)');
    });

    const unsubscribeError = socketService.onError((error: any) => {
      console.error('[RealTime] Real-time notifications error:', error);
    });

    return () => {
      unsubscribeConnect();
      unsubscribeDisconnect();
      unsubscribeError();
    };
  }, [userId]);

  // Écouter les messages reçus
  useEffect(() => {
    const handleMessage = async (message: any) => {
      const newNotif = {
        id: `msg-${Date.now()}`,
        type: 'message',
        content: message.content,
        senderId: message.sender_id,
        senderName: message.senderName,
        senderAvatar: message.senderAvatar,
        conversationId: message.conversationId,
        timestamp: new Date(),
        read: false,
      };
      
      setRealtimeNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      
      // Jouer son et vibration
      if (preferences?.sound_enabled || preferences?.vibration_enabled) {
        await notificationSoundService.notify('message');
      }
    };

    const unsubscribe = socketService.onMessage(handleMessage);
    return () => unsubscribe();
  }, [preferences]);

  // Écouter toutes les notifications (collaboration, follow, etc.)
  useEffect(() => {
    const handleNotification = async (notification: any) => {
      const newNotif = {
        id: notification.id || `notif-${Date.now()}`,
        type: notification.type || 'notification',
        content: notification.content,
        senderId: notification.actor_id || notification.senderId,
        senderName: notification.actor_name || notification.senderName,
        senderAvatar: notification.actor_image || notification.senderAvatar,
        projectId: notification.projectId,
        projectName: notification.projectName,
        message: notification.message,
        timestamp: new Date(notification.created_at || notification.timestamp || Date.now()),
        read: notification.read || false,
      };
      
      setRealtimeNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      
      // Jouer son et vibration selon le type
      if (preferences?.sound_enabled || preferences?.vibration_enabled) {
        await notificationSoundService.notify(notification.type);
      }
    };

    const unsubscribe = socketService.onNotification(handleNotification);
    return () => unsubscribe();
  }, [preferences]);

  // Fusionner les notifications API et temps réel
  const allNotifications = useMemo(() => {
    const combined = [...apiNotifications];
    
    // Ajouter les notifications temps réel qui n'existent pas déjà
    realtimeNotifications.forEach((rtNotif) => {
      const exists = combined.find((n) => n.id === rtNotif.id);
      if (!exists) {
        combined.unshift(rtNotif as any);
      }
    });
    
    return combined;
  }, [apiNotifications, realtimeNotifications]);

  // Marquer une notification comme lue
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationApiService.markAsRead(notificationId);
      setApiNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      setRealtimeNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('[RealTime] Failed to mark as read:', error);
    }
  }, []);

  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationApiService.markAllAsRead();
      setApiNotifications((prev) =>
        prev.map((notif) => ({ ...notif, is_read: true }))
      );
      setRealtimeNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('[RealTime] Failed to mark all as read:', error);
    }
  }, []);

  // Supprimer une notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationApiService.deleteNotification(notificationId);
      setApiNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
      setRealtimeNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
    } catch (error) {
      console.error('[RealTime] Failed to delete notification:', error);
    }
  }, []);

  // Archiver une notification
  const archiveNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationApiService.archiveNotification(notificationId);
      setApiNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
      setRealtimeNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
    } catch (error) {
      console.error('[RealTime] Failed to archive notification:', error);
    }
  }, []);

  // Obtenir les notifications non lues
  const getUnreadNotifications = useCallback(() => {
    return allNotifications.filter((notif: any) => !notif.is_read && !notif.read);
  }, [allNotifications]);

  // Répondre à une invitation
  const respondToInvite = useCallback(async (notificationId: string, accepted: boolean) => {
    const notification = allNotifications.find((n: any) => n.id === notificationId);
    if (!notification) return;

    if (notification.type === 'collaboration') {
      socketService.respondCollaborationInvite(notificationId, accepted);
    } else if (notification.type === 'follow') {
      socketService.respondFollowRequest(notificationId, accepted);
    }
    
    await deleteNotification(notificationId);
  }, [allNotifications, deleteNotification]);

  // Mettre à jour les préférences
  const updatePreferences = useCallback(async (newPreferences: NotificationPreferences) => {
    try {
      await notificationApiService.updatePreferences(newPreferences);
      setPreferences(newPreferences);
      
      // Mettre à jour le service de sons
      notificationSoundService.setEnabled(newPreferences.sound_enabled);
      notificationSoundService.setVibrationEnabled(newPreferences.vibration_enabled);
    } catch (error) {
      console.error('[RealTime] Failed to update preferences:', error);
      throw error;
    }
  }, []);

  // Rechercher des notifications
  const searchNotifications = useCallback(async (query: string) => {
    try {
      return await notificationApiService.searchNotifications(query);
    } catch (error) {
      console.error('[RealTime] Failed to search notifications:', error);
      return [];
    }
  }, []);

  return {
    notifications: allNotifications,
    isConnected,
    isLoading,
    unreadCount,
    preferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    archiveNotification,
    getUnreadNotifications,
    respondToInvite,
    updatePreferences,
    searchNotifications,
  };
}

export default useRealTimeNotificationsMobile;
