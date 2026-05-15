import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Text,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenHeader, Button, Avatar, Badge } from '../components';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';
import { getProduct } from '../lib/api';
import reservationService from '../services/reservationService';

export default function ProductDetailScreen({ route, navigation }: any) {
  const { productId } = route.params;
  const { colors, spacing } = useTheme().theme;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const data = await getProduct(productId);
      setProduct(data.product);
    } catch (error: any) {
      Alert.alert('Erreur', error?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      // Ajouter le produit au panier via l'API
      await reservationService.addToCart(product.id, quantity);
      
      Alert.alert(
        'Succès',
        `${quantity} ${product.name}${quantity > 1 ? 's' : ''} ajouté${quantity > 1 ? 's' : ''} au panier`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Erreur', error?.message || 'Erreur lors de l\'ajout au panier');
    }
  };

  const handleContactSeller = () => {
    if (product?.seller?.id) {
      navigation.navigate('ChatDetail', {
        userId: product.seller.id,
        participant: {
          id: product.seller.id,
          name: product.seller.name || 'Vendeur',
          avatar: product.seller.image ? { uri: product.seller.image } : undefined,
        },
      });
    }
  };

  if (loading || !product) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.primaryBackground }}>
        <ScreenHeader title="Chargement..." showBack onBackPress={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    imageContainer: {
      width: '100%',
      height: 300,
      backgroundColor: colors.secondaryBackground,
    },
    productImage: {
      width: '100%',
      height: '100%',
    },
    contentContainer: {
      padding: spacing.SCREEN_PADDING,
    },
    priceSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.MARGIN_LARGE,
    },
    price: {
      fontSize: 20, // TYPOGRAPHY.h2.fontSize
      fontWeight: '700' as const,
      color: colors.primary,
    },
    badge: {
      marginLeft: spacing.MARGIN_DEFAULT,
    },
    title: {
      fontSize: 18, // TYPOGRAPHY.h3.fontSize
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: spacing.MARGIN_DEFAULT,
    },
    description: {
      fontSize: 14, // TYPOGRAPHY.body.fontSize
      color: colors.textSecondary,
      lineHeight: 22,
      marginBottom: spacing.MARGIN_LARGE,
    },
    sellerSection: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.PADDING_LARGE,
      backgroundColor: colors.card,
      borderRadius: BORDER_RADIUS.DEFAULT,
      marginBottom: spacing.MARGIN_LARGE,
    },
    sellerInfo: {
      flex: 1,
      marginLeft: spacing.MARGIN_DEFAULT,
    },
    sellerName: {
      fontSize: 14, // TYPOGRAPHY.body.fontSize
      fontWeight: '600' as const,
      color: colors.text,
    },
    sellerLocation: {
      fontSize: 13, // TYPOGRAPHY.bodySmall.fontSize
      color: colors.textSecondary,
      marginTop: spacing.SM,
    },
    quantitySection: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.MARGIN_LARGE,
    },
    quantityLabel: {
      fontSize: 14, // TYPOGRAPHY.body.fontSize
      color: colors.text,
      fontWeight: '600' as const,
    },
    quantityControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.MARGIN_DEFAULT,
    },
    quantityButton: {
      width: 36,
      height: 36,
      borderRadius: BORDER_RADIUS.FULL,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    quantityText: {
      fontSize: 14, // TYPOGRAPHY.body.fontSize
      fontWeight: '600' as const,
      color: colors.text,
      minWidth: 30,
      textAlign: 'center',
    },
    actionsContainer: {
      flexDirection: 'row',
      gap: spacing.MARGIN_DEFAULT,
      marginTop: spacing.MARGIN_LARGE,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Détails du produit"
        showBack
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView>
        {/* Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: product?.image || '' }} style={styles.productImage} />
        </View>

        <View style={styles.contentContainer}>
          {/* Prix et Badge */}
          <View style={styles.priceSection}>
            <Text style={styles.price}>{product?.price?.toLocaleString()} Ar</Text>
            {product?.badge && (
              <Badge
                label={product.badge === 'new' ? 'Nouveau' : product.badge === 'promotion' ? 'Promo' : 'Populaire'}
                variant={product.badge === 'new' ? 'success' : product.badge === 'promotion' ? 'warning' : 'error'}
                size="small"
              />
            )}
          </View>

          {/* Titre */}
          <Text style={styles.title}>{product?.name}</Text>

          {/* Description */}
          <Text style={styles.description}>{product?.description}</Text>

          {/* Vendeur */}
          <TouchableOpacity
            style={styles.sellerSection}
            onPress={() => navigation.navigate('UserProfile', { userId: product?.seller?.id })}
          >
            <Avatar
              size="medium"
              source={product?.seller?.avatar ? { uri: product.seller.avatar } : undefined}
              initials={product?.seller?.name?.substring(0, 2) || 'N/A'}
            />
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{product?.seller?.name}</Text>
              <Text style={styles.sellerLocation}>
                <MaterialCommunityIcons name="map-marker" size={14} color={colors.textSecondary} />
                {' '}{product?.location}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Quantité */}
          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>Quantité</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <MaterialCommunityIcons name="minus" size={20} color={colors.WHITE} />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(quantity + 1)}
              >
                <MaterialCommunityIcons name="plus" size={20} color={colors.WHITE} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <Button
              title="Ajouter au panier"
              variant="primary"
              onPress={handleAddToCart}
              icon="cart-plus"
              style={{ flex: 1 }}
            />
            <Button
              title="Contacter"
              variant="secondary"
              onPress={handleContactSeller}
              icon="message"
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
