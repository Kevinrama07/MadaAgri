import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import logger from '../utils/logger';

try {
  if (Notifications.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
} catch (error) {
  logger.warn('Notifications not fully available in Expo Go');
}

export const notificationService = {
  // Register for push notifications
  registerForPushNotifications: async () => {
    try {
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          logger.warn('Notification permissions not granted');
          return null;
        }

        const token = (await Notifications.getExpoPushTokenAsync()).data;
        logger.log('Expo push token:', token);
        return token;
      } else {
        logger.log('Must use physical device for push notifications');
        return null;
      }
    } catch (error) {
      logger.error('Error registering for push notifications:', error);
      return null;
    }
  },

  // Schedule a notification
  scheduleNotification: async (title, body, seconds = 5) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { data: 'goes here' },
        },
        trigger: { seconds },
      });
      logger.log('Notification scheduled:', title);
    } catch (error) {
      logger.error('Error scheduling notification:', error);
    }
  },

  // Send local notification
  sendLocalNotification: async (title, body) => {
    try {
      await Notifications.presentNotificationAsync({
        title,
        body,
      });
      logger.log('Local notification sent:', title);
    } catch (error) {
      logger.error('Error sending local notification:', error);
    }
  },

  // Listen to notifications
  addNotificationListener: (callback) => {
    try {
      const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        logger.log('Notification received:', response);
        callback(response);
      });

      return subscription;
    } catch (error) {
      logger.error('Error adding notification listener:', error);
      return null;
    }
  },

  // Remove notification listener
  removeNotificationListener: (subscription) => {
    try {
      if (subscription) {
        subscription.remove();
      }
    } catch (error) {
      logger.error('Error removing notification listener:', error);
    }
  },

  // Cancel notification
  cancelNotification: async (identifier) => {
    try {
      await Notifications.dismissNotificationAsync(identifier);
      logger.log('Notification dismissed:', identifier);
    } catch (error) {
      logger.error('Error dismissing notification:', error);
    }
  },

  // Get all scheduled notifications
  getAllScheduledNotifications: async () => {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      return notifications;
    } catch (error) {
      logger.error('Error getting scheduled notifications:', error);
      return [];
    }
  },
};

export default notificationService;
