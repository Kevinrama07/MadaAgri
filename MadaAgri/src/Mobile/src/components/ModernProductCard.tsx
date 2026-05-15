import React, { useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { ModernCard } from './ModernCard';
import { ModernAvatar } from './ModernAvatar';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  image: { uri: string };
  seller: {
    id: string;
    name: string;
    avatar?: { uri: string };
    verified?: boolean;
  };
  location: string;
  category?: string;
  isNew?: boolean;
  isPromotion?: boolean;
  discount?: number;
  available?: boolean;
  onPress?: () => void;
  onContactPress?: () => void;
  onFavoritePress?: () => void;
  isFavorite?: boolean;
}

export const ModernProductCard = ({
  id,
  title,
  price,
  image,
  seller,
  location,
  category,
  isNew = false,
  isPromotion = false,
  discount,
  available = true,
  onPress,
  onContactPress,
  onFavoritePress,
  isFavorite = false,
}: ProductCardProps) => {
  const { colors } = useTheme();

  const styles = useMemo(() => {
    return StyleSheet.create({
      card: {
        overflow: 'hidden',
      },
      imageContainer: {
        position: 'relative',
        width: '100%',
        height: 200,
        backgroundColor: colors.primaryBackground,
      },
      image: {
        width: '100%',
        height: '100%',
      },
      badge: {
        position: 'absolute',
        top: SPACING.MD,
        left: SPACING.MD,
        backgroundColor: colors.primary,
        paddingHorizontal: SPACING.PADDING_DEFAULT,
        paddingVertical: SPACING.PADDING_SMALL,
        borderRadius: BORDER_RADIUS.SM,
      },
      badgeText: {
        color: colors.WHITE,
        fontSize: TYPOGRAPHY.caption.fontSize,
        fontWeight: TYPOGRAPHY.captionBold.fontWeight,
      },
      promotionBadge: {
        backgroundColor: colors.warning,
      },
      favoriteButton: {
        position: 'absolute',
        top: SPACING.MD,
        right: SPACING.MD,
        width: 36,
        height: 36,
        borderRadius: BORDER_RADIUS.AVATAR,
        backgroundColor: colors.WHITE,
        justifyContent: 'center',
        alignItems: 'center',
      },
      unavailableOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
      },
      unavailableText: {
        color: colors.WHITE,
        fontSize: TYPOGRAPHY.subheading.fontSize,
        fontWeight: TYPOGRAPHY.subheading.fontWeight,
      },
      content: {
        padding: SPACING.PADDING_DEFAULT,
      },
      title: {
        fontSize: TYPOGRAPHY.subheading.fontSize,
        fontWeight: TYPOGRAPHY.subheading.fontWeight,
        color: colors.text,
        marginBottom: SPACING.SM,
      },
      priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.PADDING_DEFAULT,
      },
      price: {
        fontSize: TYPOGRAPHY.h3.fontSize,
        fontWeight: TYPOGRAPHY.h3.fontWeight,
        color: colors.primary,
      },
      originalPrice: {
        fontSize: TYPOGRAPHY.body.fontSize,
        color: colors.textTertiary,
        textDecorationLine: 'line-through',
        marginLeft: SPACING.SM,
      },
      discountBadge: {
        backgroundColor: colors.error,
        paddingHorizontal: SPACING.SM,
        paddingVertical: SPACING.XS,
        borderRadius: BORDER_RADIUS.SM,
        marginLeft: SPACING.SM,
      },
      discountText: {
        color: colors.WHITE,
        fontSize: TYPOGRAPHY.caption.fontSize,
        fontWeight: TYPOGRAPHY.captionBold.fontWeight,
      },
      location: {
        fontSize: TYPOGRAPHY.caption.fontSize,
        color: colors.textTertiary,
        marginBottom: SPACING.PADDING_DEFAULT,
        fontWeight: TYPOGRAPHY.caption.fontWeight,
      },
      sellerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: SPACING.PADDING_DEFAULT,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        marginBottom: SPACING.PADDING_DEFAULT,
      },
      sellerInfo: {
        flex: 1,
        marginLeft: SPACING.MD,
      },
      sellerName: {
        fontSize: TYPOGRAPHY.body.fontSize,
        fontWeight: TYPOGRAPHY.subheading.fontWeight,
        color: colors.text,
      },
      sellerMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.XS,
      },
      sellerVerified: {
        marginLeft: SPACING.XS,
      },
      actionsContainer: {
        flexDirection: 'row',
        gap: SPACING.MD,
      },
      actionButton: {
        flex: 1,
        paddingVertical: SPACING.PADDING_DEFAULT,
        borderRadius: BORDER_RADIUS.BUTTON,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
      },
      contactButton: {
        backgroundColor: colors.primary,
      },
      buyButton: {
        backgroundColor: colors.accent,
      },
      actionButtonText: {
        fontSize: TYPOGRAPHY.body.fontSize,
        fontWeight: TYPOGRAPHY.subheading.fontWeight,
        marginLeft: SPACING.SM,
      },
    });
  }, [colors]);

  const originalPrice = discount ? Math.round(price / (1 - discount / 100)) : null;

  return (
    <ModernCard
      style={styles.card}
      shadow="subtle"
      onPress={onPress}
      disabled={!onPress}
    >
      {/* Image Container */}
      <View style={styles.imageContainer}>
        <Image source={image} style={styles.image} />

        {/* Badges */}
        {isNew && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Nouveau</Text>
          </View>
        )}

        {isPromotion && (
          <View style={[styles.badge, styles.promotionBadge]}>
            <Text style={styles.badgeText}>Promotion</Text>
          </View>
        )}

        {/* Favorite Button */}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={onFavoritePress}
          disabled={!onFavoritePress}
        >
          <MaterialCommunityIcons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={20}
            color={isFavorite ? colors.error : colors.textTertiary}
          />
        </TouchableOpacity>

        {/* Unavailable Overlay */}
        {!available && (
          <View style={styles.unavailableOverlay}>
            <Text style={styles.unavailableText}>Indisponible</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        {/* Price */}
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{price.toLocaleString()} Ar</Text>
          {originalPrice && (
            <>
              <Text style={styles.originalPrice}>
                {originalPrice.toLocaleString()} Ar
              </Text>
              {discount && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>-{discount}%</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Location */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons
            name="map-marker"
            size={14}
            color={colors.textTertiary}
          />
          <Text style={[styles.location, { marginLeft: SPACING.XS }]}>
            {location}
          </Text>
        </View>

        {/* Seller Info */}
        <View style={styles.sellerContainer}>
          <ModernAvatar
            source={seller.avatar}
            initials={seller.name.charAt(0)}
            size="small"
          />
          <View style={styles.sellerInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.sellerName}>{seller.name}</Text>
              {seller.verified && (
                <MaterialCommunityIcons
                  name="check-circle"
                  size={12}
                  color={colors.accent}
                  style={styles.sellerVerified}
                />
              )}
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Pressable
            style={[styles.actionButton, styles.contactButton]}
            onPress={onContactPress}
            disabled={!onContactPress}
          >
            <MaterialCommunityIcons
              name="message"
              size={18}
              color={colors.WHITE}
            />
            <Text style={[styles.actionButtonText, { color: colors.WHITE }]}>
              Contacter
            </Text>
          </Pressable>

          <Pressable
            style={[styles.actionButton, styles.buyButton]}
            onPress={onPress}
            disabled={!onPress}
          >
            <MaterialCommunityIcons
              name="shopping-outline"
              size={18}
              color={colors.WHITE}
            />
            <Text style={[styles.actionButtonText, { color: colors.WHITE }]}>
              Voir
            </Text>
          </Pressable>
        </View>
      </View>
    </ModernCard>
  );
};

export default ModernProductCard;
