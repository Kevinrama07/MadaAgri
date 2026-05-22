import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  Text,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { CultureCardSkeleton } from '../components/SkeletonLoader';
import { SPACING } from '../theme';
import { reservationService } from '../services/reservationService';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface Order {
  id: string;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  client_name: string;
  client_avatar?: string;
  title: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  image_url?: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  pending: { label: 'En attente', icon: 'clock-outline', color: '#D97706', bg: '#FEF3C7' },
  confirmed: { label: 'Confirmée', icon: 'check-circle', color: '#059669', bg: '#D1FAE5' },
  delivered: { label: 'Livrée', icon: 'check-all', color: '#2563EB', bg: '#DBEAFE' },
  cancelled: { label: 'Refusée', icon: 'close-circle', color: '#DC2626', bg: '#FEE2E2' },
};

export default function ReceivedOrdersScreen({ navigation }: any) {
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = mode === 'dark';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'delivered' | 'cancelled'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await reservationService.getReceivedOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }, [loadOrders]);

  const handleConfirm = useCallback(async (orderId: string) => {
    try {
      setActionLoading(orderId);
      await reservationService.confirmReservation(orderId);
      setOrders((prev) => prev.map(o => o.id === orderId ? { ...o, status: 'confirmed' } : o));
    } catch {} finally { setActionLoading(null); }
  }, []);

  const handleCancel = useCallback(async (orderId: string) => {
    try {
      setActionLoading(orderId);
      await reservationService.cancelReservation(orderId);
      setOrders((prev) => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
    } catch {} finally { setActionLoading(null); }
  }, []);

  const counts = useMemo(() => ({
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  }), [orders]);

  const filteredOrders = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter(o => o.status === filter);
  }, [orders, filter]);

  const renderOrder = useCallback(({ item }: { item: Order }) => {
    const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    return (
      <View style={[styles.orderCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
        {/* Header: order ID + status */}
        <View style={styles.orderHeader}>
          <View style={styles.orderIdRow}>
            <MaterialCommunityIcons name="receipt" size={16} color={colors.primary} />
            <Text style={[styles.orderId, { color: colors.text }]}>#{item.id.slice(0, 8).toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <MaterialCommunityIcons name={sc.icon as any} size={14} color={sc.color} />
            <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
          </View>
        </View>

        {/* Content row: product image + details */}
        <View style={styles.orderContent}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.orderThumb} />
          ) : (
            <View style={[styles.orderThumbPlaceholder, { backgroundColor: colors.glassDarker }]}>
              <MaterialCommunityIcons name="image-outline" size={24} color={colors.textTertiary} />
            </View>
          )}
          <View style={styles.orderDetails}>
            <Text style={[styles.productTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
            <Text style={[styles.productQty, { color: colors.textSecondary }]}>{item.quantity} unités</Text>
            <Text style={[styles.productPrice, { color: colors.primary }]}>{item.unit_price.toLocaleString('fr-FR')} Ar / unité</Text>
          </View>
        </View>

        {/* Client info */}
        <View style={[styles.clientRow, { backgroundColor: colors.primaryBackground }]}>
          {item.client_avatar ? (
            <Image source={{ uri: item.client_avatar }} style={styles.clientAvatar} />
          ) : (
            <View style={[styles.clientAvatarPlaceholder, { backgroundColor: colors.glassTint }]}>
              <MaterialCommunityIcons name="account" size={18} color={colors.primary} />
            </View>
          )}
          <View style={styles.clientInfo}>
            <Text style={[styles.clientLabel, { color: colors.textTertiary }]}>Client</Text>
            <Text style={[styles.clientName, { color: colors.text }]}>{item.client_name || 'Inconnu'}</Text>
          </View>
          <Text style={[styles.orderDate, { color: colors.textTertiary }]}>
            {new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </Text>
        </View>

        {/* Footer: total + actions */}
        <View style={[styles.orderFooter, { borderTopColor: colors.glassBorder }]}>
          <View>
            <Text style={[styles.totalLabel, { color: colors.textTertiary }]}>Total</Text>
            <Text style={[styles.totalAmount, { color: colors.primary }]}>
              {item.total_price?.toLocaleString('fr-FR')} Ar
            </Text>
          </View>
          {item.status === 'pending' && (
            <View style={styles.actionRow}>
              <Pressable
                style={[styles.actionBtn, styles.acceptBtn]}
                onPress={() => handleConfirm(item.id)}
                disabled={actionLoading === item.id}
              >
                {actionLoading === item.id ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check" size={18} color="#FFF" />
                    <Text style={styles.actionBtnText}>Accepter</Text>
                  </>
                )}
              </Pressable>
              <Pressable
                style={[styles.actionBtn, styles.refuseBtn]}
                onPress={() => handleCancel(item.id)}
                disabled={actionLoading === item.id}
              >
                <MaterialCommunityIcons name="close" size={18} color="#DC2626" />
                <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>Refuser</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    );
  }, [colors, actionLoading, handleConfirm, handleCancel]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: isDark ? 'rgba(8,12,20,0.85)' : 'rgba(246,248,250,0.85)', borderBottomColor: colors.glassBorder }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <View style={[styles.headerIcon, { backgroundColor: colors.glassTint }]}>
              <MaterialCommunityIcons name="clipboard-list" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Commandes reçues</Text>
              <Text style={[styles.headerSub, { color: colors.textTertiary }]}>Gestion des commandes</Text>
            </View>
          </View>
        </View>
        <View style={styles.loadingContent}>
          {[1, 2, 3].map(i => <CultureCardSkeleton key={i} />)}
        </View>
      </View>
    );
  }

  const FILTERS: { key: typeof filter; label: string; icon: string; count: number }[] = [
    { key: 'all', label: 'Toutes', icon: 'clipboard-list', count: counts.all },
    { key: 'pending', label: 'En attente', icon: 'clock-outline', count: counts.pending },
    { key: 'confirmed', label: 'Confirmées', icon: 'check-circle', count: counts.confirmed },
    { key: 'cancelled', label: 'Refusées', icon: 'close-circle', count: counts.cancelled },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: isDark ? 'rgba(8,12,20,0.85)' : 'rgba(246,248,250,0.85)', borderBottomColor: colors.glassBorder }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={[styles.headerIcon, { backgroundColor: colors.glassTint }]}>
            <MaterialCommunityIcons name="clipboard-list" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Commandes reçues</Text>
            <Text style={[styles.headerSub, { color: colors.textTertiary }]}>Gestion des commandes</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        ListHeaderComponent={
          <>
            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
                <Text style={[styles.statValue, { color: colors.text }]}>{counts.all}</Text>
                <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Total</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' }]}>
                <Text style={[styles.statValue, { color: '#92400E' }]}>{counts.pending}</Text>
                <Text style={[styles.statLabel, { color: '#92400E' }]}>En attente</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#D1FAE5', borderColor: '#6EE7B7' }]}>
                <Text style={[styles.statValue, { color: '#065F46' }]}>{counts.confirmed}</Text>
                <Text style={[styles.statLabel, { color: '#065F46' }]}>Confirmées</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
                <Text style={[styles.statValue, { color: '#991B1B' }]}>{counts.cancelled}</Text>
                <Text style={[styles.statLabel, { color: '#991B1B' }]}>Refusées</Text>
              </View>
            </View>

            {/* Filters */}
            <View style={styles.filterRow}>
              {FILTERS.map((f) => (
                <Pressable
                  key={f.key}
                  style={[styles.filterChip, { backgroundColor: filter === f.key ? colors.primary : colors.glass, borderColor: filter === f.key ? colors.primary : colors.glassBorder }]}
                  onPress={() => setFilter(f.key)}
                >
                  <MaterialCommunityIcons name={f.icon as any} size={14} color={filter === f.key ? '#FFF' : colors.text} />
                  <Text style={[styles.filterChipText, { color: filter === f.key ? '#FFF' : colors.text }]}>
                    {f.label} ({f.count})
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons name="clipboard-list-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {filter === 'all' ? 'Aucune commande reçue' : `Aucune commande ${STATUS_CONFIG[filter]?.label.toLowerCase() || ''}`}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { padding: 8 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 4 },
  headerIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  headerSub: { fontSize: 11, marginTop: 1 },

  listContent: { padding: SPACING.LG, paddingBottom: 40 },
  loadingContent: { padding: SPACING.LG, gap: 12 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  statCard: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    gap: 2,
  },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 9, fontWeight: '500' },

  // Filters
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  filterChipText: { fontSize: 11, fontWeight: '600' },

  // Order card
  orderCard: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, marginBottom: 10, overflow: 'hidden' },
  orderHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, paddingBottom: 8 },
  orderIdRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orderId: { fontSize: 14, fontWeight: '700' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },

  orderContent: { flexDirection: 'row', gap: 12, paddingHorizontal: 12, paddingBottom: 10 },
  orderThumb: { width: 60, height: 60, borderRadius: 10 },
  orderThumbPlaceholder: { width: 60, height: 60, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  orderDetails: { flex: 1, gap: 2 },
  productTitle: { fontSize: 15, fontWeight: '600' },
  productQty: { fontSize: 12 },
  productPrice: { fontSize: 13, fontWeight: '600' },

  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8, marginHorizontal: 12, marginBottom: 8, borderRadius: 10 },
  clientAvatar: { width: 32, height: 32, borderRadius: 16 },
  clientAvatarPlaceholder: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  clientInfo: { flex: 1 },
  clientLabel: { fontSize: 10, fontWeight: '500' },
  clientName: { fontSize: 13, fontWeight: '600' },
  orderDate: { fontSize: 11 },

  orderFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
  totalLabel: { fontSize: 11, fontWeight: '500' },
  totalAmount: { fontSize: 18, fontWeight: '800' },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 9, paddingHorizontal: 16, borderRadius: 10 },
  acceptBtn: { backgroundColor: '#059669' },
  refuseBtn: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA' },
  actionBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  // Empty
  emptyBox: { alignItems: 'center', gap: 12, paddingVertical: 60 },
  emptyText: { fontSize: 15, fontWeight: '500', textAlign: 'center' },
});
