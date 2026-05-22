import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Text,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { ScreenHeader } from '../components/ScreenHeader';
import { NotificationItem } from '../components/NotificationItem';
import { NotificationFilters } from '../components/NotificationFilters';
import { NotificationSearch } from '../components/NotificationSearch';
import { SPACING, TYPOGRAPHY } from '../theme';
import useRealTimeNotificationsMobile from '../hooks/useRealTimeNotifications';
import notificationApiService from '../services/notificationApiService';
import { useAuth } from '../contexts/AuthContext';
import { fr } from '../locales/fr';
import { useNavigation } from '@react-navigation/native';

type FilterType = 'all' | 'unread' | 'message' | 'collaboration' | 'follow' | 'like' | 'comment';

export const ModernNotificationsScreen = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Hook temps réel avec API
  const {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    respondToInvite,
  } = useRealTimeNotificationsMobile(user?.id || '');

  const styles = useMemo(() => {
    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: colors.primaryBackground,
      },
      connectionStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.SCREEN_PADDING,
        paddingVertical: SPACING.PADDING_SMALL,
        backgroundColor: colors.secondaryBackground,
        gap: SPACING.PADDING_SMALL,
      },
      statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
      },
      statusText: {
        fontSize: TYPOGRAPHY.caption.fontSize,
        color: colors.textSecondary,
      },
      statusSeparator: {
        fontSize: TYPOGRAPHY.caption.fontSize,
        color: colors.textSecondary,
        marginHorizontal: SPACING.XS,
      },
      headerActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.SCREEN_PADDING,
        paddingVertical: SPACING.PADDING_DEFAULT,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      markAllButton: {
        paddingHorizontal: SPACING.PADDING_DEFAULT,
        paddingVertical: SPACING.PADDING_SMALL,
      },
      markAllText: {
        fontSize: TYPOGRAPHY.body.fontSize,
        fontWeight: TYPOGRAPHY.subheading.fontWeight,
        color: colors.primary,
      },
      notificationsList: {
        paddingHorizontal: SPACING.SCREEN_PADDING,
        paddingTop: SPACING.PADDING_DEFAULT,
      },
      emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: SPACING.XL * 3,
        paddingHorizontal: SPACING.SCREEN_PADDING,
      },
      emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.primaryPale,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.LG,
      },
      emptyTitle: {
        fontSize: TYPOGRAPHY.h3.fontSize,
        fontWeight: TYPOGRAPHY.h3.fontWeight,
        color: colors.text,
        marginBottom: SPACING.SM,
        textAlign: 'center',
      },
      emptySubtitle: {
        fontSize: TYPOGRAPHY.body.fontSize,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
      },
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
    });
  }, [colors]);

  // Filtrer les notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Filtre par type
    if (filter === 'unread') {
      filtered = filtered.filter((n: any) => !n.is_read && !n.read);
    } else if (filter !== 'all') {
      filtered = filtered.filter((n: any) => n.type === filter);
    }

    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((n: any) => {
        const actorName = (n.actor_name || n.senderName || '').toLowerCase();
        const content = (n.content || n.message || '').toLowerCase();
        return actorName.includes(query) || content.includes(query);
      });
    }

    return filtered;
  }, [notifications, filter, searchQuery]);

  // Compter les notifications par type
  const notificationCounts = useMemo(() => {
    const counts: Record<FilterType, number> = {
      all: notifications.length,
      unread: notifications.filter((n: any) => !n.is_read && !n.read).length,
      message: notifications.filter((n: any) => n.type === 'message').length,
      collaboration: notifications.filter((n: any) => n.type === 'collaboration').length,
      follow: notifications.filter((n: any) => n.type === 'follow').length,
      like: notifications.filter((n: any) => n.type === 'like').length,
      comment: notifications.filter((n: any) => n.type === 'comment').length,
    };
    return counts;
  }, [notifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Le hook se charge de recharger les données
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Erreur marquage notifications:', error);
    }
  };

  const handleNotificationPress = (notification: any) => {
    // Marquer comme lu
    if (!notification.is_read && !notification.read) {
      markAsRead(notification.id);
    }

    // Navigation selon le type
    // TODO: Implémenter la navigation
  };

  const renderNotification = ({ item }: { item: any }) => (
    <NotificationItem
      notification={item}
      onPress={() => handleNotificationPress(item)}
      onMarkAsRead={() => markAsRead(item.id)}
      onArchive={() => archiveNotification(item.id)}
      onDelete={() => deleteNotification(item.id)}
      onAccept={() => respondToInvite(item.id, true)}
      onDecline={() => respondToInvite(item.id, false)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons name="bell-outline" size={40} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{fr.notifications.noNotifications}</Text>
      <Text style={styles.emptySubtitle}>
        {fr.notifications.noNotificationsDesc}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <ScreenHeader title={fr.notifications.title} showSearch={false} showMenu />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScreenHeader
        title={fr.notifications.title}
        showSearch={false}
        showMenu={true}
        showMoreMenu={true}
        onMoreMenuPress={() => navigation.navigate('NotificationSettings' as never)}
        disableTopSafeArea
      />

      {/* Connection Status */}
      <View style={styles.connectionStatus}>
        <View style={[styles.statusDot, { backgroundColor: isConnected ? colors.success : colors.error }]} />
        <Text style={styles.statusText}>
          {isConnected ? 'Temps réel actif' : 'Déconnecté'}
        </Text>
        {!notificationApiService.isApiAvailable() && (
          <>
            <Text style={styles.statusSeparator}>•</Text>
            <Text style={[styles.statusText, { color: colors.warning }]}>
              Mode hors ligne
            </Text>
          </>
        )}
      </View>

      {/* Header Actions */}
      {unreadCount > 0 && (
        <View style={styles.headerActions}>
          <Text style={{ fontSize: TYPOGRAPHY.body.fontSize }}>
            {unreadCount} {unreadCount > 1 ? fr.notifications.unreadCountPlural : fr.notifications.unreadCount}
          </Text>
          <Pressable
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
          >
            <Text style={styles.markAllText}>{fr.notifications.markAllAsRead}</Text>
          </Pressable>
        </View>
      )}

      {/* Filtres */}
      <NotificationFilters
        filter={filter}
        onFilterChange={setFilter}
        counts={notificationCounts}
      />

      {/* Recherche */}
      <NotificationSearch query={searchQuery} onQueryChange={setSearchQuery} />

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        contentContainerStyle={styles.notificationsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        scrollEventThrottle={16}
      />
    </SafeAreaView>
  );
};

export default ModernNotificationsScreen;
