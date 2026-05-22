import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { CultureCardSkeleton } from '../components/SkeletonLoader';
import { SPACING } from '../theme';
import { dataApi } from '../lib/api';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  quantity: number;
  unit: string;
  image_url?: string;
  is_available: boolean;
  culture_id?: number;
  region_id?: number;
  culture_name?: string;
  region_name?: string;
  created_at?: string;
}

type SortKey = 'recent' | 'price_asc' | 'price_desc';

export default function MyProductsScreen({ navigation }: any) {
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = mode === 'dark';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const [sort, setSort] = useState<SortKey>('recent');
  const [showSortPicker, setShowSortPicker] = useState(false);
  const [regions, setRegions] = useState<Record<number, any>>({});
  const [cultures, setCultures] = useState<Record<number, any>>({});

  useEffect(() => { loadProducts(); loadMetadata(); }, []);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await dataApi.getMyProducts(filter === 'all' ? undefined : filter);
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const loadMetadata = useCallback(async () => {
    try {
      const [regionsData, culturesData] = await Promise.all([
        dataApi.fetchRegions(),
        dataApi.fetchCultures(),
      ]);
      setRegions(Object.fromEntries(regionsData.map((r: any) => [r.id, r])));
      setCultures(Object.fromEntries(culturesData.map((c: any) => [c.id, c])));
    } catch {}
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  }, [loadProducts]);

  const handleToggle = useCallback(async (product: Product) => {
    try {
      await dataApi.toggleProductAvailability(product.id);
      setProducts((prev) => prev.map(p => p.id === product.id ? { ...p, is_available: !p.is_available } : p));
    } catch {
      Alert.alert('Erreur', 'Impossible de modifier la disponibilité');
    }
  }, []);

  const handleDelete = useCallback((productId: string) => {
    Alert.alert('Supprimer le produit', 'Êtes-vous sûr ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try {
          await dataApi.deleteProduct(productId);
          setProducts((prev) => prev.filter(p => p.id !== productId));
        } catch {
          Alert.alert('Erreur', 'Impossible de supprimer');
        }
      }},
    ]);
  }, []);

  const filteredProducts = useMemo(() => {
    let arr = [...products];
    if (filter === 'available') arr = arr.filter(p => p.is_available);
    else if (filter === 'unavailable') arr = arr.filter(p => !p.is_available);
    if (sort === 'price_asc') arr.sort((a, b) => a.price - b.price);
    else if (sort === 'price_desc') arr.sort((a, b) => b.price - a.price);
    else arr.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    return arr;
  }, [products, filter, sort]);

  const counts = useMemo(() => ({
    all: products.length,
    available: products.filter(p => p.is_available).length,
    unavailable: products.filter(p => !p.is_available).length,
  }), [products]);

  const renderProduct = useCallback(({ item }: { item: Product }) => (
    <View style={[styles.productCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
      <View style={styles.productTop}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.productImg} />
        ) : (
          <View style={[styles.productImgPlaceholder, { backgroundColor: colors.glassDarker }]}>
            <MaterialCommunityIcons name="image-outline" size={28} color={colors.textTertiary} />
          </View>
        )}
        <View style={styles.productInfo}>
          <Text style={[styles.productTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
          {item.description && <Text style={[styles.productDesc, { color: colors.textSecondary }]} numberOfLines={1}>{item.description}</Text>}
          <View style={[styles.statusBadge, { backgroundColor: item.is_available ? '#D1FAE5' : '#FEE2E2' }]}>
            <View style={[styles.statusDot, { backgroundColor: item.is_available ? '#10B981' : '#EF4444' }]} />
            <Text style={[styles.statusText, { color: item.is_available ? '#065F46' : '#991B1B' }]}>
              {item.is_available ? 'Disponible' : 'Indisponible'}
            </Text>
          </View>
        </View>
        <View style={styles.productActionsOverlay}>
          <Pressable onPress={() => handleToggle(item)} style={[styles.actionIconBtn, { backgroundColor: colors.primaryPale }]}>
            <MaterialCommunityIcons name={item.is_available ? 'eye-off' : 'eye'} size={18} color={colors.primary} />
          </Pressable>
          <Pressable onPress={() => navigation.navigate('EditProduct', { productId: item.id })} style={[styles.actionIconBtn, { backgroundColor: '#DBEAFE' }]}>
            <MaterialCommunityIcons name="pencil" size={18} color="#2563EB" />
          </Pressable>
          <Pressable onPress={() => handleDelete(item.id)} style={[styles.actionIconBtn, { backgroundColor: '#FEE2E2' }]}>
            <MaterialCommunityIcons name="delete" size={18} color="#DC2626" />
          </Pressable>
        </View>
      </View>

      <View style={[styles.productMeta, { borderTopColor: colors.glassBorder }]}>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="package-variant" size={14} color={colors.primary} />
          <Text style={[styles.metaText, { color: colors.text }]}>
            {item.quantity} {item.unit}
          </Text>
        </View>
        <Text style={[styles.priceText, { color: colors.primary }]}>
          {item.price.toLocaleString('fr-FR')} Ar
        </Text>
      </View>
      {(item.culture_name || item.region_name || (item.culture_id && cultures[item.culture_id]) || (item.region_id && regions[item.region_id])) && (
        <View style={[styles.productTags, { borderTopColor: colors.glassBorder }]}>
          {(item.culture_name || (item.culture_id && cultures[item.culture_id])) && (
            <View style={[styles.tag, { backgroundColor: colors.primaryPale }]}>
              <MaterialCommunityIcons name="sprout" size={11} color={colors.primary} />
              <Text style={[styles.tagText, { color: colors.primary }]}>{item.culture_name || cultures[item.culture_id]?.name}</Text>
            </View>
          )}
          {(item.region_name || (item.region_id && regions[item.region_id])) && (
            <View style={[styles.tag, { backgroundColor: colors.primaryPale }]}>
              <MaterialCommunityIcons name="map-marker" size={11} color={colors.primary} />
              <Text style={[styles.tagText, { color: colors.primary }]}>{item.region_name || regions[item.region_id]?.name}</Text>
            </View>
          )}
          {item.quantity <= 5 && (
            <View style={[styles.tag, { backgroundColor: '#FEF3C7' }]}>
              <MaterialCommunityIcons name="alert" size={11} color="#D97706" />
              <Text style={[styles.tagText, { color: '#92400E' }]}>Stock faible</Text>
            </View>
          )}
        </View>
      )}
    </View>
  ), [colors, cultures, regions, navigation, handleToggle, handleDelete]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: isDark ? 'rgba(8,12,20,0.85)' : 'rgba(246,248,250,0.85)', borderBottomColor: colors.glassBorder }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <View style={[styles.headerIcon, { backgroundColor: colors.glassTint }]}>
              <MaterialCommunityIcons name="package-variant" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Mes Produits</Text>
              <Text style={[styles.headerSub, { color: colors.textTertiary }]}>Gestion des produits</Text>
            </View>
          </View>
        </View>
        <View style={styles.loadingContent}>
          {[1, 2, 3].map(i => <CultureCardSkeleton key={i} />)}
        </View>
      </View>
    );
  }

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'recent', label: 'Récents' },
    { key: 'price_asc', label: 'Prix croissant' },
    { key: 'price_desc', label: 'Prix décroissant' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: isDark ? 'rgba(8,12,20,0.85)' : 'rgba(246,248,250,0.85)', borderBottomColor: colors.glassBorder }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={[styles.headerIcon, { backgroundColor: colors.glassTint }]}>
            <MaterialCommunityIcons name="package-variant" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Mes Produits</Text>
            <Text style={[styles.headerSub, { color: colors.textTertiary }]}>Gestion des produits</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        ListHeaderComponent={
          <>
            {/* Stats cards */}
            <View style={styles.statsRow}>
              {[
                { label: 'Total', value: counts.all, color: colors.primary, icon: 'package-variant' },
                { label: 'Disponibles', value: counts.available, color: '#10B981', icon: 'check-circle' },
                { label: 'Indisponibles', value: counts.unavailable, color: '#EF4444', icon: 'close-circle' },
              ].map((s, i) => (
                <View key={i} style={[styles.statCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
                  <MaterialCommunityIcons name={s.icon as any} size={20} color={s.color} />
                  <Text style={[styles.statValue, { color: colors.text }]}>{s.value}</Text>
                  <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Filter + Sort bar */}
            <View style={styles.filterBar}>
              <View style={styles.filterChips}>
                {(['all', 'available', 'unavailable'] as const).map((f) => (
                  <Pressable key={f} style={[styles.filterChip, { backgroundColor: filter === f ? colors.primary : colors.glass, borderColor: filter === f ? colors.primary : colors.glassBorder }]} onPress={() => setFilter(f)}>
                    <Text style={[styles.filterChipText, { color: filter === f ? '#FFF' : colors.text }]}>
                      {f === 'all' ? 'Tous' : f === 'available' ? 'Disponibles' : 'Indisponibles'} ({counts[f]})
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Pressable style={[styles.sortBtn, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]} onPress={() => setShowSortPicker(!showSortPicker)}>
                <MaterialCommunityIcons name="sort" size={18} color={colors.primary} />
              </Pressable>
            </View>

            {showSortPicker && (
              <View style={[styles.sortPicker, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
                {SORT_OPTIONS.map((opt) => (
                  <Pressable key={opt.key} style={[styles.sortOption, { borderBottomColor: colors.glassBorder }]} onPress={() => { setSort(opt.key); setShowSortPicker(false); }}>
                    <MaterialCommunityIcons name={sort === opt.key ? 'radiobox-marked' : 'radiobox-blank'} size={18} color={colors.primary} />
                    <Text style={[styles.sortOptionText, { color: sort === opt.key ? colors.primary : colors.text }]}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons name="package-variant" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
              {filter === 'all' ? 'Aucun produit' : `Aucun produit ${filter === 'available' ? 'disponible' : 'indisponible'}`}
            </Text>
            <Pressable style={[styles.emptyBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('AddProduct')}>
              <MaterialCommunityIcons name="plus" size={18} color="#FFF" />
              <Text style={styles.emptyBtnText}>Ajouter un produit</Text>
            </Pressable>
          </View>
        }
      />

      {/* FAB */}
      <Pressable style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('AddProduct')}>
        <MaterialCommunityIcons name="plus" size={28} color="#FFF" />
      </Pressable>
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

  listContent: { padding: SPACING.LG, paddingBottom: 80 },

  // Skeleton
  loadingContent: { padding: SPACING.LG, gap: 12 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    gap: 4,
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '500' },

  // Filter bar
  filterBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  filterChips: { flex: 1, flexDirection: 'row', gap: 6 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  filterChipText: { fontSize: 12, fontWeight: '600' },
  sortBtn: { width: 38, height: 38, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },

  // Sort picker
  sortPicker: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, marginBottom: 14, overflow: 'hidden' },
  sortOption: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  sortOptionText: { fontSize: 14, fontWeight: '500' },

  // Product card
  productCard: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, marginBottom: 10, overflow: 'hidden' },
  productTop: { flexDirection: 'row', padding: 12, gap: 12 },
  productImg: { width: 72, height: 72, borderRadius: 12 },
  productImgPlaceholder: { width: 72, height: 72, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  productInfo: { flex: 1, gap: 4 },
  productTitle: { fontSize: 15, fontWeight: '700' },
  productDesc: { fontSize: 12, lineHeight: 16 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  productActionsOverlay: { gap: 6, justifyContent: 'center' },
  actionIconBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  productMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, fontWeight: '600' },
  priceText: { fontSize: 16, fontWeight: '800' },

  productTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontSize: 11, fontWeight: '600' },

  // Empty
  emptyBox: { alignItems: 'center', gap: 12, paddingVertical: 60 },
  emptyTitle: { fontSize: 15, fontWeight: '500' },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },

  // FAB
  fab: {
    position: 'absolute',
    right: SPACING.LG,
    bottom: SPACING.LG,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
