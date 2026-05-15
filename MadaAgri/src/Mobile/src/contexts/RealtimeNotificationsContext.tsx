import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useRealTimeNotificationsMobile } from '../hooks/useRealTimeNotifications';
import NotificationBanner from '../components/NotificationBanner';
import { useAuth } from './AuthContext';

interface NotificationQueueItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning' | 'collaboration' | 'follow';
  title: string;
  message: string;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

interface RealtimeNotificationsContextType {
  showNotification: (notification: Omit<NotificationQueueItem, 'id'>) => void;
  notifications: any[];
  unreadCount: number;
  isConnected: boolean;
  respondToCollaboration: (inviteId: string, accepted: boolean) => void;
  respondToFollowRequest: (requestId: string, accepted: boolean) => void;
}

const RealtimeNotificationsContext = createContext<RealtimeNotificationsContextType | null>(null);

interface RealtimeNotificationsProviderProps {
  children: React.ReactNode;
}

export const RealtimeNotificationsProvider = ({
  children,
}: RealtimeNotificationsProviderProps) => {
  const { user } = useAuth();
  const [queue, setQueue] = useState<NotificationQueueItem[]>([]);
  const [currentNotification, setCurrentNotification] = useState<NotificationQueueItem | null>(
    null
  );

  const {
    notifications,
    unreadCount,
    isConnected,
    respondToCollaboration,
    respondToFollowRequest,
  } = useRealTimeNotificationsMobile(user?.id || '');

  const nextNotificationIdRef = useRef(0);

  const showNotification = useCallback(
    (notification: Omit<NotificationQueueItem, 'id'>) => {
      const notifWithId: NotificationQueueItem = {
        ...notification,
        id: `notif-${Date.now()}-${nextNotificationIdRef.current++}`,
      };

      if (!currentNotification) {
        setCurrentNotification(notifWithId);
      } else {
        setQueue((prev) => [...prev, notifWithId]);
      }
    },
    [currentNotification]
  );

  const handleDismissNotification = useCallback(() => {
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      setCurrentNotification(next);
      setQueue(rest);
    } else {
      setCurrentNotification(null);
    }
  }, [queue]);

  return (
    <RealtimeNotificationsContext.Provider
      value={{
        showNotification,
        notifications,
        unreadCount,
        isConnected,
        respondToCollaboration,
        respondToFollowRequest,
      }}
    >
      {children}
      {currentNotification && (
        <NotificationBanner
          type={currentNotification.type}
          title={currentNotification.title}
          message={currentNotification.message}
          duration={currentNotification.duration}
          onDismiss={handleDismissNotification}
          onActionPress={currentNotification.onAction}
          actionLabel={currentNotification.actionLabel}
        />
      )}
    </RealtimeNotificationsContext.Provider>
  );
};

/**
 * Hook pour accéder au contexte des notifications en temps réel
 */
export const useRealtimeNotifications = () => {
  const context = useContext(RealtimeNotificationsContext);
  if (!context) {
    throw new Error(
      'useRealtimeNotifications doit être utilisé dans RealtimeNotificationsProvider'
    );
  }
  return context;
};

export default RealtimeNotificationsProvider;
