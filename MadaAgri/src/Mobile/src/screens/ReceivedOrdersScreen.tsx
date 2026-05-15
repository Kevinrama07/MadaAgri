import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  Pressable,
  Text,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { ScreenHeader } from '../components/ScreenHeader';
import { ModernCard } from '../components/ModernCard';
import { ModernButton } from '../components/ModernButton';
import { CultureCardSkeleton } from '../components/SkeletonLoader';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';
import { reservationService } from '../services/reservationService';

interface ReceivedOrdersScreenProps {
  navigation: any;
}

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
  items?: any[];
}

export default function ReceivedOrdersScreen({ navigation }: ReceivedOrdersScreenProps) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'delivered' | 'cancelled'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
    orderCard: {
      marginBottom: SPACING.LG,
    },
    orderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.MD,
      paddingBottom: SPACING.SM,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    orderHeaderLeft: {
      flex: 1,
    },
    orderId: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    orderDate: {
      fontSize: 12,
      color: colors.textTertiary,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: SPACING.SM,
      paddingVertical: SPACING.XS,
      borderRadius: BORDER_RADIUS.SMALL,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    orderContent: {
      marginBottom: SPACING.MD,
    },
    detailsGrid: {
      gap: SPACING.SM,
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
      flex: 1,
    },
    detailLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    detailValue: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '700',
    },
    clientRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.SM,
    },
    clientAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary,
    },
    productImage: {
      width: '100%',
      height: 150,
      borderRadius: BORDER_RADIUS.DEFAULT,
      marginTop: SPACING.MD,
      backgroundColor: colors.border,
    },
    orderFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: SPACING.MD,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    totalContainer: {
      flex: 1,
    },
    totalLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    totalAmount: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.primary,
    },
    orderActions: {
      flexDirection: 'row',
      gap: SPACING.SM,
      flex: 1,
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
  });

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await reservationService.getReceivedOrders();
      // S'assurer que data est un tableau
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
      setOrders([]); // Définir un tableau vide en cas d'erreur
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
      // S'assurer que orders est un tableau avant de mapper
      if (Array.isArray(orders)) {
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, status: 'confirmed' } : order
        ));
      }
    } catch (error) {
      console.error('Erreur confirmation:', error);
    } finally {
      setActionLoading(null);
    }
  }, [orders]);

  const handleCancel = useCallback(async (orderId: string) => {
    try {
      setActionLoading(orderId);
      await reservationService.cancelReservation(orderId);
      // S'assurer que orders est un tableau avant de mapper
      if (Array.isArray(orders)) {
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, status: 'cancelled' } : order
        ));
      }
    } catch (error) {
      console.error('Erreur annulation:', error);
    } finally {
      setActionLoading(null);
    }
  }, [orders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'confirmed': return colors.success;
      case 'delivered': return colors.accent;
      case 'cancelled': return colors.error;
      default: return colors.textTertiary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'confirmed': return 'Confirmée';
      case 'delivered': return 'Livrée';
      case 'cancelled': return 'Refusée';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'clock-outline';
      case 'confirmed': return 'check-circle';
      case 'delivered': return 'check-all';
      case 'cancelled': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const filteredOrders = Array.isArray(orders) && filter === 'all' 
    ? orders 
    : Array.isArray(orders) ? orders.filter(o => o.status === filter) : [];

  const getFilterCount = (status: string) => {
    if (!Array.isArray(orders)) return 0;
    if (status === 'all') return orders.length;
    return orders.filter(o => o.status === status).length;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader 
          title="Commandes Reçues" 
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
        title="Commandes Reçues" 
        showBack 
        onBackPress={() => navigation.goBack()} 
        showMenu={false} 
      />

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ModernCard shadow="medium" style={styles.orderCard}>
            {/* En-tête */}
            <View style={styles.orderHeader}>
              <View style={styles.orderHeaderLeft}>
                <Text style={styles.orderId}>Commande #{item.id.slice(0, 8).toUpperCase()}</Text>
                <Text style={styles.orderDate}>
                  {new Date(item.created_at).toLocaleDateString('fr-FR')}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <MaterialCommunityIcons 
                  name={getStatusIcon(item.status) as any} 
                  size={14} 
                  color="#FFFFFF" 
                />
                <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
              </View>
            </View>

            {/* Contenu */}
            <View style={styles.orderContent}>
              <View style={styles.detailsGrid}>
                {/* Client */}
                <View style={styles.detailRow}>
                  <View style={styles.detailLeft}>
                    <View style={styles.clientRow}>
                      {item.client_avatar ? (
                        <Image 
                          source={{ uri: item.client_avatar }} 
                          style={styles.clientAvatar}
                        />
                      ) : (
                        <View style={styles.clientAvatar}>
                          <MaterialCommunityIcons name="account" size={20} color="#FFFFFF" />
                        </View>
                      )}
                      <View>
                        <Text style={styles.detailLabel}>Client</Text>
                        <Text style={styles.detailValue}>{item.client_name || 'Inconnu'}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Produit */}
                <View style={styles.detailRow}>
                  <View style={styles.detailLeft}>
                    <MaterialCommunityIcons name="package-variant" size={18} color={colors.primary} />
                    <View>
                      <Text style={styles.detailLabel}>Produit</Text>
                      <Text style={styles.detailValue}>{item.title}</Text>
                    </View>
                  </View>
                </View>

                {/* Quantité */}
                <View style={styles.detailRow}>
                  <View style={styles.detailLeft}>
                    <MaterialCommunityIcons name="counter" size={18} color={colors.primary} />
                    <View>
                      <Text style={styles.detailLabel}>Quantité</Text>
                      <Text style={styles.detailValue}>{item.quantity} unités</Text>
                    </View>
                  </View>
                </View>

                {/* Prix unitaire */}
                <View style={styles.detailRow}>
                  <View style={styles.detailLeft}>
                    <MaterialCommunityIcons name="cash" size={18} color={colors.primary} />
                    <View>
                      <Text style={styles.detailLabel}>Prix unitaire</Text>
                      <Text style={styles.detailValue}>
                        {item.unit_price?.toLocaleString('fr-FR')} Ar
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Image du produit */}
              {item.image_url && (
                <Image 
                  source={{ uri: item.image_url }} 
                  style={styles.productImage}
                  resizeMode="cover"
                />
              )}
            </View>

            {/* Footer */}
            <View style={styles.orderFooter}>
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>
                  {item.total_price?.toLocaleString('fr-FR')} Ar
                </Text>
              </View>

              {item.status === 'pending' && (
                <View style={styles.orderActions}>
                  <ModernButton
                    title={actionLoading === item.id ? 'En cours...' : 'Accepter'}
                    variant="primary"
                    size="small"
                    onPress={() => handleConfirm(item.id)}
                    disabled={actionLoading === item.id}
                    style={{ flex: 1 }}
                  />
                  <ModernButton
                    title={actionLoading === item.id ? 'En cours...' : 'Refuser'}
                    variant="outline"
                    size="small"
                    onPress={() => handleCancel(item.id)}
                    disabled={actionLoading === item.id}
                    style={{ flex: 1 }}
                  />
                </View>
              )}
            </View>
          </ModernCard>
        )}
        ListHeaderComponent={
          <>
            {/* En-tête de page */}
            <View style={styles.pageHeader}>
              <Text style={styles.pageTitle}>Commandes Reçues</Text>
              <Text style={styles.pageSubtitle}>
                {filteredOrders.length} commande{filteredOrders.length !== 1 ? 's' : ''}
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
                  Toutes ({getFilterCount('all')})
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.filterButton,
                  filter === 'pending' && styles.filterButtonActive,
                ]}
                onPress={() => setFilter('pending')}
              >
                <MaterialCommunityIcons 
                  name="clock-outline" 
                  size={16} 
                  color={filter === 'pending' ? '#FFFFFF' : colors.text} 
                />
                <Text
                  style={[
                    styles.filterButtonText,
                    filter === 'pending' && styles.filterButtonTextActive,
                  ]}
                >
                  En attente ({getFilterCount('pending')})
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.filterButton,
                  filter === 'confirmed' && styles.filterButtonActive,
                ]}
                onPress={() => setFilter('confirmed')}
              >
                <MaterialCommunityIcons 
                  name="check-circle" 
                  size={16} 
                  color={filter === 'confirmed' ? '#FFFFFF' : colors.text} 
                />
                <Text
                  style={[
                    styles.filterButtonText,
                    filter === 'confirmed' && styles.filterButtonTextActive,
                  ]}
                >
                  Confirmées ({getFilterCount('confirmed')})
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.filterButton,
                  filter === 'cancelled' && styles.filterButtonActive,
                ]}
                onPress={() => setFilter('cancelled')}
              >
                <MaterialCommunityIcons 
                  name="close-circle" 
                  size={16} 
                  color={filter === 'cancelled' ? '#FFFFFF' : colors.text} 
                />
                <Text
                  style={[
                    styles.filterButtonText,
                    filter === 'cancelled' && styles.filterButtonTextActive,
                  ]}
                >
                  Refusées ({getFilterCount('cancelled')})
                </Text>
              </Pressable>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="clipboard-list-outline"
              size={80}
              color={colors.textTertiary}
            />
            <Text style={styles.emptyText}>
              {filter === 'all'
                ? 'Vous n\'avez pas encore de commandes'
                : `Aucune commande ${getStatusLabel(filter).toLowerCase()}`}
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
    </SafeAreaView>
  );
}
