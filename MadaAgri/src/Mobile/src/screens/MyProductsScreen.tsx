import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { ScreenHeader } from '../components/ScreenHeader';
import { ModernCard } from '../components/ModernCard';
import { ModernButton } from '../components/ModernButton';
import { CultureCardSkeleton } from '../components/SkeletonLoader';
import { SPACING, BORDER_RADIUS } from '../theme';
import { dataApi } from '../lib/api';

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
}

interface MyProductsScreenProps {
  navigation: any;
}

export default function MyProductsScreen({ navigation }: MyProductsScreenProps) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const [regions, setRegions] = useState<Record<number, any>>({});
  const [cultures, setCultures] = useState<Record<number, any>>({});

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    content: {
      padding: SPACING.LG,
    },
    pageHeader: {
      marginBottom: SPACING.LG,
    },
    pageTitle: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.text,
      marginBottom: 4,
    },
    pageSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    filterContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.SM,
      marginBottom: SPACING.LG,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.XS,
      paddingHorizontal: SPACING.MD,
      paddingVertical: SPACING.SM,
      borderRadius: BORDER_RADIUS.DEFAULT,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    filterButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterButtonText: {
      fontSize: 13,
      color: colors.text,
      fontWeight: '600',
    },
    filterButtonTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    productCard: {
      backgroundColor: colors.card,
      borderRadius: BORDER_RADIUS.DEFAULT,
      padding: SPACING.MD,
      marginBottom: SPACING.MD,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    productHeader: {
      flexDirection: 'row',
      gap: SPACING.MD,
      marginBottom: SPACING.MD,
    },
    productImage: {
      width: 80,
      height: 80,
      borderRadius: BORDER_RADIUS.DEFAULT,
      backgroundColor: colors.border,
    },
    productImagePlaceholder: {
      width: 80,
      height: 80,
      borderRadius: BORDER_RADIUS.DEFAULT,
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    productInfo: {
      flex: 1,
    },
    productTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    productDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: SPACING.SM,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: SPACING.SM,
      paddingVertical: 4,
      borderRadius: BORDER_RADIUS.SMALL,
      alignSelf: 'flex-start',
    },
    statusText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    productDetails: {
      gap: SPACING.SM,
      marginBottom: SPACING.MD,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: SPACING.SM,
      paddingHorizontal: SPACING.SM,
      backgroundColor: colors.primaryBackground,
      borderRadius: BORDER_RADIUS.SMALL,
    },
    detailLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.SM,
    },
    detailLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    detailValue: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '700',
    },
    quantityBadge: {
      paddingHorizontal: SPACING.SM,
      paddingVertical: 4,
      borderRadius: BORDER_RADIUS.SMALL,
      backgroundColor: colors.primary + '20',
    },
    quantityBadgeLow: {
      backgroundColor: colors.error + '20',
    },
    quantityText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primary,
    },
    quantityTextLow: {
      color: colors.error,
    },
    priceValue: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.primary,
    },
    productActions: {
      flexDirection: 'row',
      gap: SPACING.SM,
      paddingTop: SPACING.MD,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.XS,
      paddingVertical: SPACING.SM,
      paddingHorizontal: SPACING.XS,
      borderRadius: BORDER_RADIUS.SMALL,
      borderWidth: 1,
    },
    toggleButton: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    editButton: {
      borderColor: colors.accent,
      backgroundColor: colors.accent + '10',
    },
    deleteButton: {
      borderColor: colors.error,
      backgroundColor: colors.error + '10',
    },
    actionButtonText: {
      fontSize: 12,
      fontWeight: '700',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: SPACING.XL * 2,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: SPACING.LG,
      textAlign: 'center',
    },
    loadingContainer: {
      padding: SPACING.LG,
    },
    addButton: {
      position: 'absolute',
      right: SPACING.LG,
      bottom: SPACING.LG,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
  });

  useEffect(() => {
    loadProducts();
    loadMetadata();
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await dataApi.getMyProducts(filter === 'all' ? undefined : filter);
      // S'assurer que data est un tableau
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
      Alert.alert('Erreur', 'Impossible de charger les produits');
      setProducts([]); // Définir un tableau vide en cas d'erreur
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
    } catch (error) {
      console.error('Erreur chargement metadata:', error);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  }, [loadProducts]);

  const handleToggleAvailability = useCallback(async (product: Product) => {
    try {
      await dataApi.toggleProductAvailability(product.id);
      // S'assurer que products est un tableau avant de mapper
      if (Array.isArray(products)) {
        setProducts(products.map(p =>
          p.id === product.id ? { ...p, is_available: !p.is_available } : p
        ));
      }
    } catch (error) {
      console.error('Erreur toggle:', error);
      Alert.alert('Erreur', 'Impossible de modifier la disponibilité');
    }
  }, [products]);

  const handleDelete = useCallback(async (productId: string) => {
    Alert.alert(
      'Supprimer le produit',
      'Êtes-vous sûr de vouloir supprimer ce produit ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await dataApi.deleteProduct(productId);
              // S'assurer que products est un tableau avant de filtrer
              if (Array.isArray(products)) {
                setProducts(products.filter(p => p.id !== productId));
              }
            } catch (error) {
              console.error('Erreur suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le produit');
            }
          },
        },
      ]
    );
  }, [products]);

  const filteredProducts = Array.isArray(products) && filter === 'all'
    ? products
    : Array.isArray(products) ? products.filter(p => filter === 'available' ? p.is_available : !p.is_available) : [];

  const getFilterCount = (status: string) => {
    if (!Array.isArray(products)) return 0;
    if (status === 'all') return products.length;
    return products.filter(p => status === 'available' ? p.is_available : !p.is_available).length;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader
          title="Mes Produits"
          showBack
          onBackPress={() => navigation.goBack()}
          showMenu={false}
        />
        <View style={styles.loadingContainer}>
          {[...Array(3)].map((_, index) => (
            <CultureCardSkeleton key={index} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Mes Produits"
        showBack
        onBackPress={() => navigation.goBack()}
        showMenu={false}
      />

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.productCard}>
            {/* En-tête avec image */}
            <View style={styles.productHeader}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.productImage} />
              ) : (
                <View style={styles.productImagePlaceholder}>
                  <MaterialCommunityIcons name="image-outline" size={32} color={colors.textTertiary} />
                </View>
              )}

              <View style={styles.productInfo}>
                <Text style={styles.productTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.description && (
                  <Text style={styles.productDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: item.is_available ? colors.success : colors.error }
                ]}>
                  <MaterialCommunityIcons
                    name={item.is_available ? 'check' : 'close'}
                    size={12}
                    color="#FFFFFF"
                  />
                  <Text style={styles.statusText}>
                    {item.is_available ? 'Disponible' : 'Indisponible'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Détails */}
            <View style={styles.productDetails}>
              <View style={styles.detailRow}>
                <View style={styles.detailLeft}>
                  <MaterialCommunityIcons name="package-variant" size={18} color={colors.primary} />
                  <Text style={styles.detailLabel}>Quantité</Text>
                </View>
                <View style={[
                  styles.quantityBadge,
                  item.quantity <= 5 && styles.quantityBadgeLow
                ]}>
                  <Text style={[
                    styles.quantityText,
                    item.quantity <= 5 && styles.quantityTextLow
                  ]}>
                    {item.quantity} {item.unit}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailLeft}>
                  <MaterialCommunityIcons name="cash" size={18} color={colors.primary} />
                  <Text style={styles.detailLabel}>Prix</Text>
                </View>
                <Text style={styles.priceValue}>
                  {item.price.toLocaleString('fr-FR')} Ar
                </Text>
              </View>

              {item.culture_id && cultures[item.culture_id] && (
                <View style={styles.detailRow}>
                  <View style={styles.detailLeft}>
                    <MaterialCommunityIcons name="sprout" size={18} color={colors.primary} />
                    <Text style={styles.detailLabel}>Culture</Text>
                  </View>
                  <Text style={styles.detailValue}>
                    {cultures[item.culture_id].name}
                  </Text>
                </View>
              )}

              {item.region_id && regions[item.region_id] && (
                <View style={styles.detailRow}>
                  <View style={styles.detailLeft}>
                    <MaterialCommunityIcons name="map-marker" size={18} color={colors.primary} />
                    <Text style={styles.detailLabel}>Région</Text>
                  </View>
                  <Text style={styles.detailValue}>
                    {regions[item.region_id].name}
                  </Text>
                </View>
              )}
            </View>

            {/* Actions */}
            <View style={styles.productActions}>
              <Pressable
                style={[styles.actionButton, styles.toggleButton]}
                onPress={() => handleToggleAvailability(item)}
              >
                <MaterialCommunityIcons
                  name={item.is_available ? 'eye-off' : 'eye'}
                  size={18}
                  color={colors.primary}
                />
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                  {item.is_available ? 'Désactiver' : 'Activer'}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.actionButton, styles.editButton]}
                onPress={() => navigation.navigate('EditProduct', { productId: item.id })}
              >
                <MaterialCommunityIcons name="pencil" size={18} color={colors.accent} />
                <Text style={[styles.actionButtonText, { color: colors.accent }]}>
                  Modifier
                </Text>
              </Pressable>

              <Pressable
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDelete(item.id)}
              >
                <MaterialCommunityIcons name="delete" size={18} color={colors.error} />
                <Text style={[styles.actionButtonText, { color: colors.error }]}>
                  Supprimer
                </Text>
              </Pressable>
            </View>
          </View>
        )}
        ListHeaderComponent={
          <>
            {/* En-tête de page */}
            <View style={styles.pageHeader}>
              <Text style={styles.pageTitle}>Gestion des Produits</Text>
              <Text style={styles.pageSubtitle}>
                {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''}
              </Text>
            </View>

            {/* Filtres */}
            <View style={styles.filterContainer}>
              <Pressable
                style={[
                  styles.filterButton,
                  filter === 'all' && styles.filterButtonActive,
                ]}
                onPress={() => setFilter('all')}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filter === 'all' && styles.filterButtonTextActive,
                  ]}
                >
                  Tous ({getFilterCount('all')})
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.filterButton,
                  filter === 'available' && styles.filterButtonActive,
                ]}
                onPress={() => setFilter('available')}
              >
                <MaterialCommunityIcons
                  name="check"
                  size={16}
                  color={filter === 'available' ? '#FFFFFF' : colors.text}
                />
                <Text
                  style={[
                    styles.filterButtonText,
                    filter === 'available' && styles.filterButtonTextActive,
                  ]}
                >
                  Disponibles ({getFilterCount('available')})
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.filterButton,
                  filter === 'unavailable' && styles.filterButtonActive,
                ]}
                onPress={() => setFilter('unavailable')}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={16}
                  color={filter === 'unavailable' ? '#FFFFFF' : colors.text}
                />
                <Text
                  style={[
                    styles.filterButtonText,
                    filter === 'unavailable' && styles.filterButtonTextActive,
                  ]}
                >
                  Indisponibles ({getFilterCount('unavailable')})
                </Text>
              </Pressable>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="package-variant"
              size={80}
              color={colors.textTertiary}
            />
            <Text style={styles.emptyText}>
              {filter === 'all'
                ? 'Vous n\'avez pas encore de produits'
                : `Aucun produit ${filter === 'available' ? 'disponible' : 'indisponible'}`}
            </Text>
          </View>
        }
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      />

      {/* Bouton flottant pour ajouter un produit */}
      <Pressable
        style={styles.addButton}
        onPress={() => navigation.navigate('AddProduct')}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
      </Pressable>
    </SafeAreaView>
  );
}
