import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import Card from './Card';
import Badge from './Badge';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  currency?: string;
  image: string;
  seller: {
    name: string;
    avatar?: string;
    verified?: boolean;
  };
  location: string;
  rating?: number;
  reviews?: number;
  available: boolean;
  badge?: 'new' | 'promotion' | 'hot';
  onPress?: () => void;
  onBuyPress?: () => void;
  onContactPress?: () => void;
}

export const ProductCard = ({
  id,
  name,
  price,
  currency = 'Ar',
  image,
  seller,
  location,
  rating = 4.5,
  reviews = 0,
  available = true,
  badge,
  onPress,
  onBuyPress,
  onContactPress,
}: ProductCardProps) => {
  const { colors } = useTheme();
  const spacing = SPACING;

  const badgeVariants = {
    new: { label: 'Nouveau', icon: 'star', variant: 'primary' as const },
    promotion: { label: 'Promo', icon: 'tag', variant: 'warning' as const },
    hot: { label: 'Tendance', icon: 'fire', variant: 'error' as const },
  };

  const badgeConfig = badge ? badgeVariants[badge] : null;

  const styles = StyleSheet.create({
    cardContainer: {
      marginBottom: spacing.MARGIN_LARGE,
    },
    imageContainer: {
      position: 'relative',
      width: '100%',
      height: 200,
      marginBottom: spacing.MARGIN_DEFAULT,
    },
    productImage: {
      width: '100%',
      height: '100%',
      borderRadius: BORDER_RADIUS.IMAGE,
      backgroundColor: colors.secondaryBackground,
    },
    badgeContainer: {
      position: 'absolute',
      top: spacing.MD,
      right: spacing.MD,
    },
    unavailableOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: BORDER_RADIUS.IMAGE,
      justifyContent: 'center',
      alignItems: 'center',
    },
    unavailableText: {
      color: colors.WHITE,
      fontSize: TYPOGRAPHY.subheading.fontSize,
      fontWeight: '600' as const,
    },
    contentContainer: {
      gap: spacing.MARGIN_SMALL,
    },
    productName: {
      fontSize: TYPOGRAPHY.body.fontSize,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: spacing.MARGIN_SMALL,
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: spacing.MARGIN_SMALL,
    },
    price: {
      fontSize: 10,
      fontWeight: '700' as const,
      color: colors.primary,
    },
    currency: {
      fontSize: TYPOGRAPHY.body.fontSize,
      color: colors.textSecondary,
      marginLeft: spacing.SM,
    },
    sellerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.MARGIN_SMALL,
    },
    sellerAvatar: {
      width: 28,
      height: 28,
      borderRadius: BORDER_RADIUS.FULL,
      marginRight: spacing.MD,
      backgroundColor: colors.primaryPale,
    },
    sellerName: {
      fontSize: 10,
      color: colors.text,
      fontWeight: '500' as const,
    },
    verifiedBadge: {
      marginLeft: spacing.SM,
    },
    locationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.MARGIN_SMALL,
    },
    locationText: {
      fontSize: TYPOGRAPHY.caption.fontSize,
      color: colors.textTertiary,
      marginLeft: spacing.SM,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.MARGIN_DEFAULT,
    },
    ratingText: {
      fontSize: TYPOGRAPHY.caption.fontSize,
      color: colors.textSecondary,
      marginLeft: spacing.SM,
    },
    actionsContainer: {
      flexDirection: 'row',
      gap: spacing.MARGIN_SMALL,
    },
    actionButton: {
      flex: 1,
      paddingVertical: spacing.PADDING_DEFAULT,
      borderRadius: BORDER_RADIUS.BUTTON,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
    },
    buyButton: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    contactButton: {
      backgroundColor: colors.WHITE,
      borderColor: colors.border,
    },
    buttonText: {
      fontSize: TYPOGRAPHY.label.fontSize,
      fontWeight: '600' as const,
    },
  });

  return (
    <Card variant="default" style={styles.cardContainer}>
      {/* Image Container */}
      <TouchableOpacity style={styles.imageContainer} onPress={onPress}>
        <Image source={{ uri: image }} style={styles.productImage} />
        {badgeConfig && (
          <View style={styles.badgeContainer}>
            <Badge label={badgeConfig.label} variant={badgeConfig.variant} size="small" />
          </View>
        )}
        {!available && (
          <View style={styles.unavailableOverlay}>
            <Text style={styles.unavailableText}>Indisponible</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.contentContainer}>
        {/* Product Name */}
        <Text style={styles.productName} numberOfLines={2}>
          {name}
        </Text>

        {/* Price */}
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{price.toLocaleString()}</Text>
          <Text style={styles.currency}>{currency}</Text>
        </View>

        {/* Seller */}
        <View style={styles.sellerContainer}>
          <Image source={{ uri: seller.avatar || 'https://via.placeholder.com/28' }} style={styles.sellerAvatar} />
          <Text style={styles.sellerName}>{seller.name}</Text>
          {seller.verified && (
            <MaterialCommunityIcons
              name="check-circle"
              size={14}
              color={colors.success}
              style={styles.verifiedBadge}
            />
          )}
        </View>

        {/* Location */}
        <View style={styles.locationContainer}>
          <MaterialCommunityIcons name="map-marker" size={14} color={colors.textTertiary} />
          <Text style={styles.locationText}>{location}</Text>
        </View>

        {/* Rating */}
        {reviews > 0 && (
          <View style={styles.ratingContainer}>
            <MaterialCommunityIcons name="star" size={14} color={colors.warning} />
            <Text style={styles.ratingText}>{rating} ({reviews} avis)</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.buyButton]}
            onPress={onBuyPress}
            disabled={!available}
          >
            <Text style={[styles.buttonText, { color: colors.WHITE }]}>Acheter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.contactButton]}
            onPress={onContactPress}
            disabled={!available}
          >
            <MaterialCommunityIcons name="message-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
};

export default ProductCard;
