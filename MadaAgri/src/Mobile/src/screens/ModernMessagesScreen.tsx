import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  RefreshControl,
  Pressable,
  Text,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { ModernCard } from '../components/ModernCard';
import { ModernAvatar } from '../components/ModernAvatar';
import { ScreenHeader } from '../components/ScreenHeader';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';
import { getConversations } from '../lib/api';
import socketService from '../services/socketService';
import { fr } from '../locales/fr';

interface Conversation {
  id: string;
  participant: {
    id: string;
    name: string;
    avatar?: { uri: string };
    online?: boolean;
  };
  lastMessage: string;
  timestamp: string;
  unread: number;
  isGroup?: boolean;
}

interface ModernMessagesScreenProps {
  navigation?: any;
  onConversationPress?: (conversationId: string, participant: any) => void;
  onNewMessagePress?: () => void;
  onMoreMenuPress?: () => void;
}

export const ModernMessagesScreen = ({
  navigation,
  onConversationPress,
  onNewMessagePress,
  onMoreMenuPress,
}: ModernMessagesScreenProps) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Écouter les changements de connexion
  useEffect(() => {
    // Vérifier l'état initial
    setIsConnected(socketService.isConnected());

    const unsubConnect = socketService.onConnect(() => setIsConnected(true));
    const unsubDisconnect = socketService.onDisconnect(() => setIsConnected(false));

    return () => {
      unsubConnect();
      unsubDisconnect();
    };
  }, []);

  // Écouter les nouveaux messages temps réel
  useEffect(() => {
    const unsubMessage = socketService.onMessage((message: any) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === message.conversationId
            ? {
                ...conv,
                lastMessage: message.content,
                timestamp: new Date(message.created_at).toLocaleTimeString('fr-FR'),
                unread: conv.participant.id !== user?.id ? conv.unread + 1 : conv.unread,
              }
            : conv
        )
      );
    });

    return () => unsubMessage();
  }, [user?.id]);

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
        backgroundColor: isConnected ? colors.success + '20' : colors.error + '20',
        gap: SPACING.PADDING_SMALL,
      },
      statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: isConnected ? colors.success : colors.error,
      },
      statusText: {
        fontSize: TYPOGRAPHY.caption.fontSize,
        color: colors.textSecondary,
      },
      headerActions: {
        flexDirection: 'row',
        gap: SPACING.MD,
        paddingHorizontal: SPACING.SCREEN_PADDING,
        paddingVertical: SPACING.PADDING_DEFAULT,
      },
      searchContainer: {
        paddingHorizontal: SPACING.SCREEN_PADDING,
        paddingVertical: SPACING.PADDING_DEFAULT,
      },
      searchInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primaryBackground,
        borderRadius: BORDER_RADIUS.BUTTON,
        paddingHorizontal: SPACING.PADDING_DEFAULT,
        borderWidth: 1,
        borderColor: colors.border,
      },
      searchInputText: {
        flex: 1,
        paddingVertical: SPACING.BUTTON_PADDING_VERTICAL,
        paddingHorizontal: SPACING.MD,
        fontSize: TYPOGRAPHY.body.fontSize,
        color: colors.text,
      },
      conversationsList: {
        paddingHorizontal: SPACING.SCREEN_PADDING,
      },
      conversationCard: {
        marginBottom: SPACING.CARD_MARGIN,
      },
      conversationContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.MD,
      },
      avatarContainer: {
        position: 'relative',
      },
      conversationInfo: {
        flex: 1,
      },
      conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.XS,
      },
      participantName: {
        fontSize: TYPOGRAPHY.subheading.fontSize,
        fontWeight: TYPOGRAPHY.subheading.fontWeight,
        color: colors.text,
      },
      timestamp: {
        fontSize: TYPOGRAPHY.caption.fontSize,
        color: colors.textTertiary,
        fontWeight: TYPOGRAPHY.caption.fontWeight,
      },
      lastMessage: {
        fontSize: TYPOGRAPHY.body.fontSize,
        color: colors.textTertiary,
        fontWeight: TYPOGRAPHY.body.fontWeight,
      },
      lastMessageUnread: {
        color: colors.text,
        fontWeight: TYPOGRAPHY.subheading.fontWeight,
      },
      unreadBadge: {
        backgroundColor: colors.primary,
        borderRadius: BORDER_RADIUS.AVATAR,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
      },
      unreadBadgeText: {
        color: '#fff',
        fontSize: TYPOGRAPHY.caption.fontSize,
        fontWeight: '600',
      },
      onlineIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: BORDER_RADIUS.AVATAR,
        backgroundColor: colors.success,
        borderWidth: 2,
        borderColor: colors.card,
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
      fab: {
        position: 'absolute',
        bottom: SPACING.LG + 30,
        right: SPACING.LG,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      },
    });
  }, [colors, isConnected]);

  // Charger les conversations
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await getConversations();
      
      // Transformer les données
      const transformedConversations = data.map((c: any) => ({
        id: c.id,
        participant: {
          id: c.other_user_id,
          name: c.other_user_name || 'Utilisateur',
          avatar: c.other_user_image ? { uri: c.other_user_image } : undefined,
          online: c.other_user_online || false,
        },
        lastMessage: c.last_message || '',
        timestamp: formatTimestamp(c.last_message_at),
        unread: c.unread_count || 0,
        isGroup: false,
      }));
      
      setConversations(transformedConversations);
    } catch (error) {
      console.error('Erreur chargement conversations:', error);
      // En cas d'erreur, afficher des conversations vides
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (dateString: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins}m`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString('fr-FR');
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  }, []);

  // Filtrer les conversations par recherche
  const filteredConversations = useMemo(() => {
    if (!searchText) return conversations;
    
    return conversations.filter(c => 
      c.participant.name.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [conversations, searchText]);

  const renderConversation = ({ item }: { item: Conversation }) => (
    <Pressable
      style={styles.conversationCard}
      onPress={() => onConversationPress?.(item.id, item.participant)}
    >
      <ModernCard shadow="subtle">
        <View style={styles.conversationContent}>
          <View style={styles.avatarContainer}>
            <ModernAvatar
              source={item.participant.avatar}
              initials={item.participant.name.charAt(0)}
              size="medium"
            />
            {item.participant.online && (
              <View style={styles.onlineIndicator} />
            )}
          </View>

          <View style={styles.conversationInfo}>
            <View style={styles.conversationHeader}>
              <Text style={styles.participantName}>
                {item.participant.name}
              </Text>
              <Text style={styles.timestamp}>{item.timestamp}</Text>
            </View>
            <Text
              style={[
                styles.lastMessage,
                item.unread > 0 && styles.lastMessageUnread,
              ]}
              numberOfLines={1}
            >
              {item.lastMessage}
            </Text>
          </View>

          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {item.unread > 9 ? '9+' : item.unread}
              </Text>
            </View>
          )}
        </View>
      </ModernCard>
    </Pressable>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons name="message-outline" size={40} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>Aucun message</Text>
      <Text style={styles.emptySubtitle}>
        Vous n'avez pas encore de conversations.{"\n"}
        Commencez à discuter avec d'autres utilisateurs !
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title={fr.messages.title}
        showBack
        onBackPress={() => navigation?.goBack()}
        showSearch={false}
        showMenu={true}
        showMoreMenu={true}
        onMoreMenuPress={onMoreMenuPress}
      />

      {/* Connection Status */}
      <View style={styles.connectionStatus}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>
          {isConnected ? fr.common.connected : fr.common.disconnected}
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={colors.textTertiary}
          />
          <TextInput
            style={styles.searchInputText}
            placeholder={fr.common.search}
            placeholderTextColor={colors.placeholder}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {/* Conversations List */}
      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        contentContainerStyle={styles.conversationsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        scrollEventThrottle={16}
      />

      {/* FAB - New Message */}
      <Pressable
        style={styles.fab}
        onPress={onNewMessagePress}
      >
        <MaterialCommunityIcons
          name="plus"
          size={28}
          color="#fff"
        />
      </Pressable>
    </SafeAreaView>
  );
};

export default ModernMessagesScreen;
