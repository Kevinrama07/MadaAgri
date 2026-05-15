import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
  type?: 'rectangle' | 'circle';
  animated?: boolean;
}

export const Skeleton = ({
  width = '100%',
  height = 16,
  borderRadius: br = BORDER_RADIUS.DEFAULT,
  style,
  type = 'rectangle',
  animated = true,
}: SkeletonProps) => {
  const { colors } = useTheme();
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        })
      ).start();
    }
  }, [shimmerAnim, animated]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 1, 0.6],
  });

  const styles = StyleSheet.create({
    skeleton: {
      width: (type === 'circle' ? height : width) as any,
      height,
      borderRadius: type === 'circle' ? height / 2 : br,
      backgroundColor: colors.secondaryBackground,
    },
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        animated && { opacity },
        style,
      ]}
    />
  );
};

/**
 * Post Skeleton - Common feed item placeholder
 */
export const PostSkeleton = () => {
  const { colors } = useTheme();
  const spacing = SPACING;

  return (
    <View style={{ backgroundColor: colors.card, padding: spacing.PADDING_CARD, marginBottom: spacing.MARGIN_LARGE }}>
      {/* Header skeleton */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.MARGIN_LARGE }}>
        <Skeleton type="circle" width={40} height={40} style={{ marginRight: spacing.MARGIN_DEFAULT }} />
        <View style={{ flex: 1 }}>
          <Skeleton width="60%" height={12} style={{ marginBottom: spacing.MARGIN_SMALL }} />
          <Skeleton width="40%" height={10} />
        </View>
      </View>

      {/* Content skeleton */}
      <Skeleton width="100%" height={12} style={{ marginBottom: spacing.MARGIN_SMALL }} />
      <Skeleton width="100%" height={12} style={{ marginBottom: spacing.MARGIN_LARGE }} />

      {/* Image skeleton */}
      <Skeleton width="100%" height={200} style={{ marginBottom: spacing.MARGIN_LARGE, borderRadius: 12 }} />
    </View>
  );
};

/**
 * Product Card Skeleton
 */
export const ProductSkeleton = () => {
  const spacing = SPACING;

  return (
    <View style={{ marginBottom: spacing.MARGIN_LARGE }}>
      <Skeleton width="100%" height={200} style={{ marginBottom: spacing.MARGIN_DEFAULT, borderRadius: 12 }} />
      <Skeleton width="80%" height={14} style={{ marginBottom: spacing.MARGIN_SMALL }} />
      <Skeleton width="50%" height={12} />
    </View>
  );
};

export default Skeleton;
