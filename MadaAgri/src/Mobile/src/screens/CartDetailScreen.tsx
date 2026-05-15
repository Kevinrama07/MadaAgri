import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useCart } from '../hooks/useCart';
import { reservationService } from '../services/reservationService';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../theme';

export default function CartDetailScreen({ navigation }: any) {
  const { colors } = useTheme();
  const {
    items,
    total,
    itemCount,
    groupedByFarmer,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCart();

  const [loading, setLoading] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
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
    headerSubtitle: {
      fontSize: TYPOGRAPHY.caption.fontSize,
      color: colors.textTertiary,
      marginTop: SPACING.XS,
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
    farmerSection: {
      marginTop: SPACING.PADDING_DEFAULT,
      backgroundColor: colors.card,
      borderRadius: BORDER_RADIUS.CARD,
      padding: SPACING.CARD_PADDING,
      marginHorizontal: SPACING.SCREEN_PADDING,
      ...SHADOWS.DEFAULT,
    },
    farmerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.PADDING_DEFAULT,
      paddingBottom: SPACING.PADDING_DEFAULT,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    farmerName: {
      fontSize: TYPOGRAPHY.subheading.fontSize,
      fontWeight: TYPOGRAPHY.subheading.fontWeight,
      color: colors.text,
    },
    cartItem: {
      flexDirection: 'row',
      paddingVertical: SPACING.PADDING_DEFAULT,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    itemImage: {
      width: 80,
      height: 80,
      borderRadius: BORDER_RADIUS.DEFAULT,
      backgroundColor: colors.primaryBackground,
    },
    itemImagePlaceholder: {
      width: 80,
      height: 80,
      borderRadius: BORDER_RADIUS.DEFAULT,
      backgroundColor: colors.primaryBackground,
      justifyContent: 'center',
      alignItems: 'center',
    },
    itemInfo: {
      flex: 1,
      marginLeft: SPACING.PADDING_DEFAULT,
      justifyContent: 'space-between',
    },
    itemTitle: {
      fontSize: TYPOGRAPHY.body.fontSize,
      fontWeight: TYPOGRAPHY.subheading.fontWeight,
      color: colors.text,
    },
    itemPrice: {
      fontSize: TYPOGRAPHY.subheading.fontSize,
      fontWeight: TYPOGRAPHY.h3.fontWeight,
      color: colors.primary,
      marginTop: SPACING.SM,
    },
    quantityContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: SPACING.SM,
    },
    quantityButton: {
      width: 32,
      height: 32,
      borderRadius: BORDER_RADIUS.AVATAR,
      backgroundColor: colors.primaryBackground,
      justifyContent: 'center',
      alignItems: 'center',
    },
    quantityText: {
      fontSize: TYPOGRAPHY.body.fontSize,
      fontWeight: TYPOGRAPHY.subheading.fontWeight,
      color: colors.text,
      marginHorizontal: SPACING.PADDING_DEFAULT,
      minWidth: 30,
      textAlign: 'center',
    },
    deleteButton: {
      padding: SPACING.SM,
    },
    footer: {
      backgroundColor: colors.card,
      padding: SPACING.SCREEN_PADDING,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      ...SHADOWS.MEDIUM,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.PADDING_DEFAULT,
    },
    totalLabel: {
      fontSize: TYPOGRAPHY.subheading.fontSize,
      fontWeight: TYPOGRAPHY.subheading.fontWeight,
      color: colors.text,
    },
    totalAmount: {
      fontSize: TYPOGRAPHY.h2.fontSize,
      fontWeight: TYPOGRAPHY.h2.fontWeight,
      color: colors.primary,
    },
    checkoutButton: {
      backgroundColor: colors.primary,
      borderRadius: BORDER_RADIUS.BUTTON,
      padding: SPACING.BUTTON_PADDING_VERTICAL,
      alignItems: 'center',
      ...SHADOWS.DEFAULT,
    },
    checkoutButtonDisabled: {
      opacity: 0.5,
    },
    checkoutButtonText: {
      fontSize: TYPOGRAPHY.subheading.fontSize,
      fontWeight: TYPOGRAPHY.subheading.fontWeight,
      color: colors.WHITE,
    },
    clearButton: {
      marginTop: SPACING.PADDING_DEFAULT,
      alignItems: 'center',
    },
    clearButtonText: {
      fontSize: TYPOGRAPHY.body.fontSize,
      color: colors.error,
    },
  });

  const handleCheckout = async () => {
    try {
      setLoading(true);

      // Préparer les items pour la réservation
      const reservationItems = reservationService.prepareReservationItems(items);

      // Créer la réservation
      await reservationService.createReservation(reservationItems);

      // Vider le panier
      await clearCart();

      Alert.alert(
        'Commande créée',
        'Votre commande a été créée avec succès',
        [
          {
            text: 'Voir mes commandes',
            onPress: () => navigation.goBack(),
          },
          { text: 'OK' },
        ]
      );
    } catch (error) {
      console.error('Erreur lors de la commande:', error);
      Alert.alert('Erreur', 'Impossible de créer la commande');
    } finally {
      setLoading(false);
    }
  };

  const handleClearCart = () => {
    Alert.alert(
      'Vider le panier',
      'Êtes-vous sûr de vouloir vider le panier ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Vider',
          style: 'destructive',
          onPress: clearCart,
        },
      ]
    );
  };

  const handleRemoveItem = (itemId: string, itemTitle: string) => {
    Alert.alert(
      'Supprimer l\'article',
      `Supprimer "${itemTitle}" du panier ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => removeItem(itemId),
        },
      ]
    );
  };

  const renderCartItem = ({ item }: any) => (
    <View style={styles.cartItem}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.itemImage} />
      ) : (
        <View style={styles.itemImagePlaceholder}>
          <MaterialCommunityIcons name="image" size={32} color={colors.textTertiary} />
        </View>
      )}

      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.itemPrice}>
          {(item.price * item.quantity).toLocaleString('fr-FR')} Ar
        </Text>

        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.id, item.quantity - 1)}
          >
            <MaterialCommunityIcons name="minus" size={20} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.quantityText}>{item.quantity}</Text>

          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.id, item.quantity + 1)}
          >
            <MaterialCommunityIcons name="plus" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleRemoveItem(item.id, item.title)}
      >
        <MaterialCommunityIcons name="delete" size={24} color={colors.error} />
      </TouchableOpacity>
    </View>
  );

  const renderFarmerSection = ({ item: group }: any) => (
    <View style={styles.farmerSection}>
      <View style={styles.farmerHeader}>
        <MaterialCommunityIcons name="account" size={24} color={colors.primary} />
        <Text style={[styles.farmerName, { marginLeft: SPACING.SM }]}>
          {group.farmer_name}
        </Text>
      </View>

      <FlatList
        data={group.items}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
      />
    </View>
  );

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Panier</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="cart-outline" size={80} color={colors.textTertiary} />
          <Text style={styles.emptyText}>Votre panier est vide</Text>
          <TouchableOpacity
            style={[styles.checkoutButton, { marginTop: SPACING.PADDING_XL }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.checkoutButtonText}>Découvrir les produits</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Panier</Text>
          <Text style={styles.headerSubtitle}>{itemCount} article(s)</Text>
        </View>
        <TouchableOpacity onPress={handleClearCart}>
          <MaterialCommunityIcons name="delete-outline" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={groupedByFarmer}
        renderItem={renderFarmerSection}
        keyExtractor={(item) => item.farmer_id}
        contentContainerStyle={{ paddingBottom: SPACING.SCREEN_PADDING }}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>{total.toLocaleString('fr-FR')} Ar</Text>
        </View>

        <TouchableOpacity
          style={[styles.checkoutButton, loading && styles.checkoutButtonDisabled]}
          onPress={handleCheckout}
          disabled={loading}
        >
          <Text style={styles.checkoutButtonText}>
            {loading ? 'Commande en cours...' : 'Commander'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
