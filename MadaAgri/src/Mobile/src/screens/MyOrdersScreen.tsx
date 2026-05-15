import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { reservationService } from '../services/reservationService';
import { Reservation } from '../lib/types';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../theme';

export default function MyOrdersScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [orders, setOrders] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    header: {
      padding: SPACING.SCREEN_PADDING,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: TYPOGRAPHY.h2.fontSize,
      fontWeight: TYPOGRAPHY.h2.fontWeight,
      color: colors.text,
    },
    filterContainer: {
      flexDirection: 'row',
      marginTop: SPACING.PADDING_DEFAULT,
      gap: SPACING.SM,
    },
    filterButton: {
      paddingHorizontal: SPACING.PADDING_DEFAULT,
      paddingVertical: SPACING.PADDING_SMALL,
      borderRadius: BORDER_RADIUS.BUTTON,
      backgroundColor: colors.primaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterButtonText: {
      fontSize: TYPOGRAPHY.body.fontSize,
      color: colors.text,
    },
    filterButtonTextActive: {
      color: colors.WHITE,
      fontWeight: TYPOGRAPHY.subheading.fontWeight,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.SCREEN_PADDING,
    },
    emptyText: {
      fontSize: TYPOGRAPHY.body.fontSize,
      color: colors.textTertiary,
      marginTop: SPACING.PADDING_DEFAULT,
    },
    orderCard: {
      backgroundColor: colors.card,
      borderRadius: BORDER_RADIUS.CARD,
      padding: SPACING.CARD_PADDING,
      marginHorizontal: SPACING.SCREEN_PADDING,
      marginTop: SPACING.CARD_MARGIN,
      ...SHADOWS.DEFAULT,
    },
    orderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.PADDING_DEFAULT,
      paddingBottom: SPACING.PADDING_DEFAULT,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    orderNumber: {
      fontSize: TYPOGRAPHY.caption.fontSize,
      color: colors.textTertiary,
    },
    orderDate: {
      fontSize: TYPOGRAPHY.caption.fontSize,
      color: colors.textTertiary,
      marginTop: SPACING.XS,
    },
    statusBadge: {
      paddingHorizontal: SPACING.PADDING_DEFAULT,
      paddingVertical: SPACING.PADDING_SMALL,
      borderRadius: BORDER_RADIUS.BUTTON,
    },
    statusText: {
      fontSize: TYPOGRAPHY.caption.fontSize,
      fontWeight: TYPOGRAPHY.captionBold.fontWeight,
      color: colors.WHITE,
    },
    orderItems: {
      marginBottom: SPACING.PADDING_DEFAULT,
    },
    orderItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: SPACING.SM,
    },
    itemName: {
      fontSize: TYPOGRAPHY.body.fontSize,
      color: colors.text,
      flex: 1,
    },
    itemQuantity: {
      fontSize: TYPOGRAPHY.body.fontSize,
      color: colors.textTertiary,
      marginRight: SPACING.PADDING_DEFAULT,
    },
    itemPrice: {
      fontSize: TYPOGRAPHY.body.fontSize,
      fontWeight: TYPOGRAPHY.subheading.fontWeight,
      color: colors.text,
    },
    orderFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: SPACING.PADDING_DEFAULT,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    totalLabel: {
      fontSize: TYPOGRAPHY.subheading.fontSize,
      fontWeight: TYPOGRAPHY.subheading.fontWeight,
      color: colors.text,
    },
    totalAmount: {
      fontSize: TYPOGRAPHY.h3.fontSize,
      fontWeight: TYPOGRAPHY.h3.fontWeight,
      color: colors.primary,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: SPACING.SM,
      marginTop: SPACING.PADDING_DEFAULT,
    },
    actionButton: {
      flex: 1,
      paddingVertical: SPACING.PADDING_DEFAULT,
      borderRadius: BORDER_RADIUS.BUTTON,
      alignItems: 'center',
      borderWidth: 1,
    },
    cancelButton: {
      borderColor: colors.error,
    },
    cancelButtonText: {
      fontSize: TYPOGRAPHY.body.fontSize,
      color: colors.error,
    },
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await reservationService.getMyOrders();
      setOrders(data);
    } catch (error) {
      console.error('Erreur fetch commandes:', error);
      Alert.alert('Erreur', 'Impossible de charger les commandes');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    Alert.alert(
      'Annuler la commande',
      'Êtes-vous sûr de vouloir annuler cette commande ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              await reservationService.cancelReservation(orderId);
              Alert.alert('Succès', 'Commande annulée');
              fetchOrders();
            } catch (error) {
              console.error('Erreur annulation:', error);
              Alert.alert('Erreur', 'Impossible d\'annuler la commande');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'confirmed':
        return colors.success;
      case 'cancelled':
        return colors.error;
      case 'delivered':
        return colors.accent;
      default:
        return colors.textTertiary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'confirmed':
        return 'Confirmée';
      case 'cancelled':
        return 'Annulée';
      case 'delivered':
        return 'Livrée';
      default:
        return status;
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const renderOrder = ({ item }: { item: Reservation }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderNumber}>Commande #{item.id.slice(0, 8)}</Text>
          <Text style={styles.orderDate}>
            {new Date(item.created_at).toLocaleDateString('fr-FR')}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>

      <View style={styles.orderItems}>
        {item.items.map((orderItem, index) => (
          <View key={index} style={styles.orderItem}>
            <Text style={styles.itemName} numberOfLines={1}>
              {orderItem.product_title}
            </Text>
            <Text style={styles.itemQuantity}>x{orderItem.quantity}</Text>
            <Text style={styles.itemPrice}>
              {(orderItem.price * orderItem.quantity).toLocaleString('fr-FR')} Ar
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalAmount}>
          {item.total_price.toLocaleString('fr-FR')} Ar
        </Text>
      </View>

      {item.status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleCancelOrder(item.id)}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes commandes</Text>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === 'all' && styles.filterButtonTextActive,
              ]}
            >
              Toutes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
            onPress={() => setFilter('pending')}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === 'pending' && styles.filterButtonTextActive,
              ]}
            >
              En attente
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === 'confirmed' && styles.filterButtonActive]}
            onPress={() => setFilter('confirmed')}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === 'confirmed' && styles.filterButtonTextActive,
              ]}
            >
              Confirmées
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="loading" size={48} color={colors.primary} />
          <Text style={styles.emptyText}>Chargement...</Text>
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="package-variant" size={80} color={colors.textTertiary} />
          <Text style={styles.emptyText}>Aucune commande</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={{ paddingBottom: SPACING.SCREEN_PADDING }}
        />
      )}
    </SafeAreaView>
  );
}
