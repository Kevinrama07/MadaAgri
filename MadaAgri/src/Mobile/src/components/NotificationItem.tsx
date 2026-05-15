import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useTheme } from '../contexts/ThemeContext';
import { ModernCard } from './ModernCard';
import { ModernAvatar } from './ModernAvatar';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';

interface NotificationItemProps {
  notification: {
    id: string;
    type: string;
    actor_name?: string;
    senderName?: string;
    actor_image?: string;
    senderAvatar?: string;
    content: string;
    message?: string;
    created_at?: string;
    timestamp?: Date | string;
    is_read?: boolean;
    read?: boolean;
  };
  onPress: () => void;
  onMarkAsRead?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
  onMarkAsRead,
  onArchive,
  onDelete,
  onAccept,
  onDecline,
}) => {
  const { colors } = useTheme();

  const isUnread = notification.is_read === false || notification.read === false;
  const actorName = notification.actor_name || notification.senderName || 'Utilisateur';
  const actorImage = notification.actor_image || notification.senderAvatar;
  const content = notification.content || notification.message || '';
  const timestamp = notification.created_at || notification.timestamp;

  const getNotificationIcon = () => {
    const iconMap: Record<string, { icon: string; color: string }> = {
      message: { icon: 'message', color: colors.accent },
      collaboration: { icon: 'handshake', color: colors.primary },
      follow: { icon: 'account-plus', color: colors.primary },
      like: { icon: 'heart', color: colors.error },
      comment: { icon: 'comment', color: colors.accent },
    };
    return iconMap[notification.type] || { icon: 'bell', color: colors.primary };
  };

  const formatTimestamp = (date: Date | string): string => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins}m`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return d.toLocaleDateString('fr-FR');
  };

  const renderRightActions = () => (
    <View style={styles.swipeActions}>
      {onArchive && (
        <Pressable
          style={[styles.swipeButton, { backgroundColor: colors.warning }]}
          onPress={onArchive}
        >
          <MaterialCommunityIcons name="archive" size={24} color="#fff" />
          <Text style={styles.swipeButtonText}>Archiver</Text>
        </Pressable>
      )}
      {onDelete && (
        <Pressable
          style={[styles.swipeButton, { backgroundColor: colors.error }]}
          onPress={onDelete}
        >
          <MaterialCommunityIcons name="delete" size={24} color="#fff" />
          <Text style={styles.swipeButtonText}>Supprimer</Text>
        </Pressable>
      )}
    </View>
  );

  const renderLeftActions = () => {
    if (!isUnread || !onMarkAsRead) return null;
    
    return (
      <View style={styles.swipeActions}>
        <Pressable
          style={[styles.swipeButton, { backgroundColor: colors.success }]}
          onPress={onMarkAsRead}
        >
          <MaterialCommunityIcons name="check" size={24} color="#fff" />
          <Text style={styles.swipeButtonText}>Lu</Text>
        </Pressable>
      </View>
    );
  };

  const iconData = getNotificationIcon();

  const styles = StyleSheet.create({
    container: {
      marginBottom: SPACING.CARD_MARGIN,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.MD,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: BORDER_RADIUS.AVATAR,
      backgroundColor: colors.primaryPale,
      justifyContent: 'center',
      alignItems: 'center',
    },
    textContainer: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.XS,
    },
    actorName: {
      fontSize: TYPOGRAPHY.body.fontSize,
      fontWeight: TYPOGRAPHY.subheading.fontWeight,
      color: colors.text,
    },
    timestamp: {
      fontSize: TYPOGRAPHY.caption.fontSize,
      color: colors.textTertiary,
    },
    message: {
      fontSize: TYPOGRAPHY.body.fontSize,
      color: colors.textSecondary,
      marginBottom: SPACING.SM,
    },
    unreadIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: SPACING.SM,
      marginTop: SPACING.SM,
    },
    actionButton: {
      paddingHorizontal: SPACING.MD,
      paddingVertical: SPACING.SM,
      borderRadius: BORDER_RADIUS.CARD,
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.XS,
    },
    acceptButton: {
      backgroundColor: colors.success,
    },
    declineButton: {
      backgroundColor: colors.error,
    },
    actionButtonText: {
      color: '#fff',
      fontSize: TYPOGRAPHY.caption.fontSize,
      fontWeight: '600',
    },
    swipeActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    swipeButton: {
      justifyContent: 'center',
      alignItems: 'center',
      width: 80,
      height: '100%',
      paddingHorizontal: SPACING.SM,
    },
    swipeButtonText: {
      color: '#fff',
      fontSize: TYPOGRAPHY.caption.fontSize,
      fontWeight: '600',
      marginTop: SPACING.XS,
    },
  });

  const showActionButtons =
    (notification.type === 'collaboration' || notification.type === 'follow') &&
    isUnread &&
    onAccept &&
    onDecline;

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      overshootRight={false}
      overshootLeft={false}
    >
      <Pressable style={styles.container} onPress={onPress}>
        <ModernCard
          shadow="subtle"
          style={isUnread ? { backgroundColor: colors.primaryPale } : undefined}
        >
          <View style={styles.content}>
            {actorImage ? (
              <ModernAvatar source={{ uri: actorImage }} size={40} />
            ) : (
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name={iconData.icon as any}
                  size={20}
                  color={iconData.color}
                />
              </View>
            )}

            <View style={styles.textContainer}>
              <View style={styles.header}>
                <Text style={styles.actorName}>{actorName}</Text>
                {timestamp && (
                  <Text style={styles.timestamp}>{formatTimestamp(timestamp)}</Text>
                )}
              </View>
              <Text style={styles.message} numberOfLines={2}>
                {content}
              </Text>

              {showActionButtons && (
                <View style={styles.actionButtons}>
                  <Pressable
                    style={[styles.actionButton, styles.acceptButton]}
                    onPress={onAccept}
                  >
                    <MaterialCommunityIcons name="check" size={16} color="#fff" />
                    <Text style={styles.actionButtonText}>Accepter</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionButton, styles.declineButton]}
                    onPress={onDecline}
                  >
                    <MaterialCommunityIcons name="close" size={16} color="#fff" />
                    <Text style={styles.actionButtonText}>Refuser</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {isUnread && <View style={styles.unreadIndicator} />}
          </View>
        </ModernCard>
      </Pressable>
    </Swipeable>
  );
};

export default NotificationItem;
