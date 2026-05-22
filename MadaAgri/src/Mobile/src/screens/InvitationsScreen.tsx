import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { ModernCard } from '../components/ModernCard';
import { ModernAvatar } from '../components/ModernAvatar';
import { ScreenHeader } from '../components/ScreenHeader';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../theme';
import { dataApi } from '../lib/api';
import { fr } from '../locales/fr';

type TabType = 'received' | 'sent' | 'collaborators' | 'suggestions' | 'followers' | 'following';

export default function InvitationsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('received');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'farmer' | 'client'>('all');
  
  // Données
  const [receivedInvitations, setReceivedInvitations] = useState<any[]>([]);
  const [sentInvitations, setSentInvitations] = useState<any[]>([]);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  
  // Actions en cours
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      switch (activeTab) {
        case 'received':
          const received = await dataApi.fetchReceivedInvitations();
          setReceivedInvitations(received || []);
          break;
        case 'sent':
          const sent = await dataApi.fetchSentInvitations();
          setSentInvitations(sent || []);
          break;
        case 'collaborators':
          const collab = await dataApi.fetchCollaborators();
          setCollaborators(collab || []);
          break;
        case 'suggestions':
          const sugg = await dataApi.fetchNetworkSuggestions(searchQuery);
          setSuggestions(sugg || []);
          break;
        case 'followers':
          const foll = await dataApi.fetchFollowers();
          setFollowers(foll || []);
          break;
        case 'following':
          const fing = await dataApi.fetchFollowing();
          setFollowing(fing || []);
          break;
      }
    } catch (err) {
      console.error('[InvitationsScreen] Erreur chargement:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleAcceptInvitation = async (invitationId: string) => {
    setActionLoading(prev => ({ ...prev, [invitationId]: true }));
    try {
      await dataApi.acceptInvitation(invitationId);
      setReceivedInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      Alert.alert('Succes', 'Invitation acceptee');
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Erreur lors de l\'acceptation');
    } finally {
      setActionLoading(prev => ({ ...prev, [invitationId]: false }));
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    setActionLoading(prev => ({ ...prev, [invitationId]: true }));
    try {
      await dataApi.declineInvitation(invitationId);
      setReceivedInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      Alert.alert('Succes', 'Invitation refusee');
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Erreur lors du refus');
    } finally {
      setActionLoading(prev => ({ ...prev, [invitationId]: false }));
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    setActionLoading(prev => ({ ...prev, [invitationId]: true }));
    try {
      await dataApi.cancelInvitation(invitationId);
      setSentInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      Alert.alert('Succes', 'Invitation annulee');
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Erreur lors de l\'annulation');
    } finally {
      setActionLoading(prev => ({ ...prev, [invitationId]: false }));
    }
  };

  const handleSendInvitation = async (userId: string) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      await dataApi.sendCollaborationInvitation(userId, '');
      await loadData();
      Alert.alert('Succes', 'Invitation envoyee');
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Erreur lors de l\'envoi');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleFollow = async (userId: string) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      await dataApi.followUser(userId);
      await loadData();
      Alert.alert('Succes', 'Vous suivez maintenant cet utilisateur');
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Erreur lors du suivi');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleUnfollow = async (userId: string) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      await dataApi.unfollowUser(userId);
      await loadData();
      Alert.alert('Succes', 'Vous ne suivez plus cet utilisateur');
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Erreur lors du desabonnement');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleSearch = () => {
    if (activeTab === 'suggestions') {
      loadData();
    }
  };

  const filterByRole = (items: any[]) => {
    if (roleFilter === 'all') return items;
    return items.filter(item => item.role === roleFilter);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.primaryBackground },
    
    // Tabs Navigation
    tabsContainer: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
    tabsContent: { paddingHorizontal: SPACING.SCREEN_PADDING, paddingVertical: SPACING.SM },
    tabButton: {
      paddingHorizontal: SPACING.MD,
      marginRight: SPACING.MD,
      borderRadius: BORDER_RADIUS.DEFAULT,
      backgroundColor: 'rgba(0, 0, 0, 0.03)',
      position: 'relative',
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tabButtonActive: {
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    tabLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    tabLabelActive: { color: '#FFFFFF', fontWeight: '700' },
    tabBadge: {
      position: 'absolute',
      top: -8,
      right: -8,
      backgroundColor: colors.error,
      borderRadius: BORDER_RADIUS.FULL,
      minWidth: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.card,
    },
    tabBadgeActive: { backgroundColor: '#FFFFFF', borderColor: colors.primary },
    tabBadgeText: { color: colors.primary, fontSize: 11, fontWeight: '800' },

    // Filters
    filtersSection: {
      backgroundColor: colors.card,
      padding: SPACING.SCREEN_PADDING,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      height: 126,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryBackground,
      borderRadius: BORDER_RADIUS.DEFAULT,
      paddingHorizontal: SPACING.MD,
      minHeight: 48,
      gap: SPACING.SM,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      elevation: 2,
    },
    searchInputField: {
      flex: 1,
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    searchButton: {
      width: 36,
      height: 36,
      borderRadius: BORDER_RADIUS.DEFAULT,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    roleFilters: {
      flexDirection: 'row',
      gap: SPACING.SM,
      height: 38,
    },
    roleFilterButton: {
      flex: 1,
      paddingHorizontal: SPACING.MD,
      borderRadius: BORDER_RADIUS.DEFAULT,
      backgroundColor: 'rgba(0, 0, 0, 0.03)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.1)',
      height: 38,
    },
    roleFilterButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    roleFilterLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
    roleFilterLabelActive: { color: '#FFFFFF', fontWeight: '700' },

    // List
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    listContent: { padding: SPACING.SCREEN_PADDING },

    // Empty State
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.XL },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: BORDER_RADIUS.LG,
      backgroundColor: 'rgba(46, 125, 50, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.LG,
    },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: SPACING.SM },
    emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },

    // Item Card
    itemCard: {
      marginBottom: SPACING.MD,
      padding: SPACING.LG,
      backgroundColor: colors.card,
      borderRadius: BORDER_RADIUS.LG,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      elevation: 3,
    },
    itemRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.MD, marginBottom: SPACING.MD },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 15, fontWeight: '700', color: colors.text },
    itemRole: { fontSize: 12, color: colors.textSecondary, marginTop: SPACING.XS, fontWeight: '500' },
    itemEmail: { fontSize: 12, color: colors.textTertiary, marginTop: SPACING.XS },
    itemMessage: {
      marginTop: SPACING.MD,
      padding: SPACING.MD,
      backgroundColor: 'rgba(46, 125, 50, 0.08)',
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
      borderRadius: BORDER_RADIUS.SM,
    },
    itemMessageText: { fontSize: 13, color: colors.textSecondary, fontStyle: 'italic', lineHeight: 18 },
    itemActions: {
      flexDirection: 'row',
      gap: SPACING.SM,
      marginTop: SPACING.MD,
      flexWrap: 'wrap',
    },

    // Buttons
    actionButton: {
      flex: 1,
      minHeight: 40,
      borderRadius: BORDER_RADIUS.DEFAULT,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: SPACING.XS,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      elevation: 3,
    },
    actionButtonPrimary: {
      backgroundColor: colors.primary,
    },
    actionButtonSuccess: {
      backgroundColor: '#10B981',
    },
    actionButtonDanger: {
      backgroundColor: colors.error,
    },
    actionButtonOutline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    actionButtonDisabled: {
      opacity: 0.5,
    },
    actionButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    actionButtonOutlineText: {
      color: colors.primary,
    },
    
    // Legacy compatibility (for renderItem)
    tabs: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      paddingHorizontal: SPACING.PADDING_SMALL,
    },
    tabScroll: { flexGrow: 0 },
    tab: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: { borderBottomColor: colors.primary },
    tabText: { fontSize: 12, fontWeight: '500', color: colors.textTertiary },
    tabTextActive: { color: colors.primary, fontWeight: '700' },
    tabBadgeText2: { color: '#fff', fontSize: 9, fontWeight: '700' },
    filters: {
      padding: SPACING.SCREEN_PADDING,
      backgroundColor: colors.card,
      gap: SPACING.SM,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryBackground,
      borderRadius: BORDER_RADIUS.INPUT,
      paddingHorizontal: SPACING.MD,
      gap: SPACING.SM,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.text,
    },
    searchBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: BORDER_RADIUS.BUTTON,
    },
    searchBtnText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    roleFilterContainer: {
      flexDirection: 'row',
      gap: SPACING.SM,
    },
    roleFilterBtn: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: BORDER_RADIUS.BUTTON,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    roleFilterBtnActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    roleFilterText: {
      fontSize: 12,
      color: colors.text,
      fontWeight: '500',
    },
    roleFilterTextActive: {
      color: '#fff',
    },
    list: { padding: SPACING.SCREEN_PADDING },
    card: { marginBottom: SPACING.CARD_MARGIN },
    row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.MD },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: '600', color: colors.text },
    email: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
    role: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    message: {
      marginTop: SPACING.SM,
      padding: SPACING.SM,
      backgroundColor: 'rgba(46, 125, 50, 0.08)',
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
      borderRadius: BORDER_RADIUS.SM,
    },
    messageText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    actions: { flexDirection: 'row', gap: SPACING.SM, marginTop: SPACING.MD },
    btnPrimary: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: BORDER_RADIUS.BUTTON,
      paddingVertical: 10,
      alignItems: 'center',
    },
    btnSecondary: {
      flex: 1,
      backgroundColor: '#10B981',
      borderRadius: BORDER_RADIUS.BUTTON,
      paddingVertical: 10,
      alignItems: 'center',
    },
    btnOutline: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BORDER_RADIUS.BUTTON,
      paddingVertical: 10,
      alignItems: 'center',
    },
    btnDanger: {
      flex: 1,
      backgroundColor: colors.error,
      borderRadius: BORDER_RADIUS.BUTTON,
      paddingVertical: 10,
      alignItems: 'center',
    },
    btnDisabled: {
      opacity: 0.5,
    },
    btnTextPrimary: { color: '#fff', fontSize: 13, fontWeight: '600' },
    btnTextOutline: { color: colors.text, fontSize: 13, fontWeight: '500' },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyIcon2: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: 'rgba(46, 125, 50, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.LG,
    },
    emptyTitle2: { fontSize: 18, fontWeight: '600', color: colors.text, textAlign: 'center' },
    emptySubtitle2: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 6 },
  });

  const getCurrentData = () => {
    let data: any[] = [];
    switch (activeTab) {
      case 'received': data = receivedInvitations; break;
      case 'sent': data = sentInvitations; break;
      case 'collaborators': data = collaborators; break;
      case 'suggestions': data = suggestions; break;
      case 'followers': data = followers; break;
      case 'following': data = following; break;
    }
    
    // Filtrer par rôle
    const filtered = filterByRole(data);
    
    // Supprimer les doublons basés sur l'ID
    const uniqueData = filtered.filter((item, index, self) => {
      const itemId = item.id || item.sender_id || item.recipient_id || item.follower_id || item.followee_id;
      return index === self.findIndex(t => {
        const tId = t.id || t.sender_id || t.recipient_id || t.follower_id || t.followee_id;
        return tId === itemId;
      });
    });
    
    return uniqueData;
  };

  const renderItem = ({ item }: { item: any }) => {
    const userId = item.id || item.sender_id || item.recipient_id || item.follower_id || item.followee_id;
    const displayName = item.display_name || item.email;
    const email = item.email;
    const role = item.role;
    const profileImage = item.profile_image_url;
    const message = item.message;
    const itemId = item.id || userId;
    const isLoading = actionLoading[itemId];

    return (
      <View style={styles.itemCard}>
        <View style={styles.itemRow}>
          <Pressable onPress={() => navigation.navigate('UserProfile', { userId })}>
            <ModernAvatar
              source={profileImage ? { uri: profileImage } : undefined}
              initials={(displayName || 'U').charAt(0).toUpperCase()}
              size="medium"
            />
          </Pressable>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.itemEmail} numberOfLines={1}>{email}</Text>
            <Text style={styles.itemRole}>
              {role === 'farmer' ? 'Agriculteur' : 'Client'}
            </Text>
          </View>
        </View>

        {message && message.trim() && (
          <View style={styles.itemMessage}>
            <Text style={styles.itemMessageText}>{message}</Text>
          </View>
        )}

        <View style={styles.itemActions}>
          {activeTab === 'received' && (
            <>
              <Pressable 
                style={[styles.actionButton, styles.actionButtonSuccess, isLoading && styles.actionButtonDisabled]} 
                onPress={() => handleAcceptInvitation(itemId)}
                disabled={isLoading}
              >
                <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Accepter</Text>
              </Pressable>
              <Pressable 
                style={[styles.actionButton, styles.actionButtonDanger, isLoading && styles.actionButtonDisabled]} 
                onPress={() => handleDeclineInvitation(itemId)}
                disabled={isLoading}
              >
                <MaterialCommunityIcons name="close" size={16} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Refuser</Text>
              </Pressable>
            </>
          )}

          {activeTab === 'sent' && (
            <Pressable 
              style={[styles.actionButton, styles.actionButtonDanger, isLoading && styles.actionButtonDisabled]} 
              onPress={() => handleCancelInvitation(itemId)}
              disabled={isLoading}
            >
              <MaterialCommunityIcons name="close" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Annuler</Text>
            </Pressable>
          )}

          {activeTab === 'collaborators' && (
            <Pressable style={[styles.actionButton, styles.actionButtonOutline, { flex: 0.5 }]} disabled>
              <Text style={[styles.actionButtonText, styles.actionButtonOutlineText]}>Collaborateur</Text>
            </Pressable>
          )}

          {activeTab === 'suggestions' && (
            <>
              {item.isCollaborator ? (
                <Pressable style={[styles.actionButton, styles.actionButtonOutline, { flex: 0.5 }]} disabled>
                  <Text style={[styles.actionButtonText, styles.actionButtonOutlineText]}>Collaborateur</Text>
                </Pressable>
              ) : item.invitationSent ? (
                <Pressable style={[styles.actionButton, styles.actionButtonOutline, { flex: 0.6 }]} disabled>
                  <Text style={[styles.actionButtonText, styles.actionButtonOutlineText]}>Invitation envoyée</Text>
                </Pressable>
              ) : item.invitationReceived ? (
                <Pressable style={[styles.actionButton, styles.actionButtonOutline, { flex: 0.6 }]} disabled>
                  <Text style={[styles.actionButtonText, styles.actionButtonOutlineText]}>Invitation reçue</Text>
                </Pressable>
              ) : (
                <>
                  <Pressable 
                    style={[styles.actionButton, styles.actionButtonPrimary, isLoading && styles.actionButtonDisabled]} 
                    onPress={() => handleSendInvitation(userId)}
                    disabled={isLoading}
                  >
                    <MaterialCommunityIcons name="email-plus" size={16} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Inviter</Text>
                  </Pressable>
                  {!item.isFollowing && (
                    <Pressable 
                      style={[styles.actionButton, styles.actionButtonOutline, isLoading && styles.actionButtonDisabled]} 
                      onPress={() => handleFollow(userId)}
                      disabled={isLoading}
                    >
                      <MaterialCommunityIcons name="plus" size={16} color={colors.primary} />
                      <Text style={[styles.actionButtonText, styles.actionButtonOutlineText]}>Suivre</Text>
                    </Pressable>
                  )}
                </>
              )}
            </>
          )}

          {activeTab === 'followers' && (
            <Pressable 
              style={[styles.actionButton, styles.actionButtonPrimary, isLoading && styles.actionButtonDisabled]} 
              onPress={() => handleFollow(userId)}
              disabled={isLoading}
            >
              <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Suivre en retour</Text>
            </Pressable>
          )}

          {activeTab === 'following' && (
            <Pressable 
              style={[styles.actionButton, styles.actionButtonDanger, isLoading && styles.actionButtonDisabled]} 
              onPress={() => handleUnfollow(userId)}
              disabled={isLoading}
            >
              <MaterialCommunityIcons name="minus" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Ne plus suivre</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    const emptyMessages: Record<TabType, { icon: string; title: string; subtitle: string }> = {
      received: { icon: 'email-receive-outline', title: 'Aucune invitation reçue', subtitle: 'Les invitations de collaboration apparaîtront ici' },
      sent: { icon: 'email-send-outline', title: 'Aucune invitation envoyée', subtitle: 'Invitez des utilisateurs à collaborer' },
      collaborators: { icon: 'account-group', title: 'Aucun collaborateur', subtitle: 'Acceptez des invitations pour collaborer' },
      suggestions: { icon: 'account-search', title: 'Aucune suggestion', subtitle: 'Utilisez la recherche pour trouver des utilisateurs' },
      followers: { icon: 'account-multiple', title: 'Aucun abonné', subtitle: 'Les personnes qui vous suivent apparaîtront ici' },
      following: { icon: 'account-heart', title: 'Aucun abonnement', subtitle: 'Suivez des utilisateurs pour voir leurs publications' },
    };

    const empty = emptyMessages[activeTab];

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <MaterialCommunityIcons name={empty.icon as any} size={32} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>{empty.title}</Text>
        <Text style={styles.emptySubtitle}>{empty.subtitle}</Text>
      </View>
    );
  };

  const currentData = getCurrentData();

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.container}>
      <ScreenHeader title="Réseau" showMenu={false} disableTopSafeArea />

      {/* Tabs Navigation */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
        data={[
          { key: 'received', label: 'Reçues', count: receivedInvitations.length },
          { key: 'sent', label: 'Envoyées', count: sentInvitations.length },
          { key: 'collaborators', label: 'Collaborateurs', count: collaborators.length },
          { key: 'suggestions', label: 'Suggestions', count: suggestions.length },
          { key: 'followers', label: 'Abonnés', count: followers.length },
          { key: 'following', label: 'Abonnements', count: following.length },
        ]}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.tabButton, activeTab === item.key && styles.tabButtonActive]}
            onPress={() => setActiveTab(item.key as TabType)}
          >
            <Text style={[styles.tabLabel, activeTab === item.key && styles.tabLabelActive]}>
              {item.label}
            </Text>
            {item.count > 0 && (
              <View style={[styles.tabBadge, activeTab === item.key && styles.tabBadgeActive]}>
                <Text style={styles.tabBadgeText}>{item.count}</Text>
              </View>
            )}
          </Pressable>
        )}
        keyExtractor={(item) => item.key}
      />

      {/* Filters Section */}
      <View style={styles.filtersSection}>
        <View style={{ height: 48, marginBottom: SPACING.MD }}>
          {activeTab === 'suggestions' && (
            <View style={styles.searchInputContainer}>
              <MaterialCommunityIcons name="magnify" size={20} color={colors.primary} />
              <TextInput
                style={styles.searchInputField}
                placeholder="Chercher un utilisateur..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
              />
              <Pressable style={styles.searchButton} onPress={handleSearch}>
                <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          )}
        </View>
        
        <View style={styles.roleFilters}>
          {(['all', 'farmer', 'client'] as const).map((role) => (
            <Pressable
              key={role}
              style={[styles.roleFilterButton, roleFilter === role && styles.roleFilterButtonActive]}
              onPress={() => setRoleFilter(role)}
            >
              <Text style={[styles.roleFilterLabel, roleFilter === role && styles.roleFilterLabelActive]}>
                {role === 'all' ? 'Tous' : role === 'farmer' ? 'Agri.' : 'Clients'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={currentData}
          renderItem={renderItem}
          keyExtractor={(item, index) => {
            const baseId = item.id || item.sender_id || item.recipient_id || item.follower_id || item.followee_id;
            return `${activeTab}-${baseId || index}`;
          }}
          contentContainerStyle={[styles.listContent, currentData.length === 0 && { flex: 1 }]}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        />
      )}
    </SafeAreaView>
  );
}
