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
  variant?: 'default' | 'glass';
}

export const Skeleton = ({
  width = '100%',
  height = 16,
  borderRadius: br = BORDER_RADIUS.DEFAULT,
  style,
  type = 'rectangle',
  animated = true,
  variant = 'default',
}: SkeletonProps) => {
  const { colors } = useTheme();
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;
  const shimmerAnim2 = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      })
    ).start();
    Animated.loop(
      Animated.timing(shimmerAnim2, {
        toValue: 1,
        duration: 1800,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: false,
      })
    ).start();
  }, [shimmerAnim, shimmerAnim2, animated]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 0.3, 0.6, 1],
    outputRange: [0.3, 0.7, 0.9, 0.3],
  });

  const secondaryOpacity = shimmerAnim2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.2, 0.5, 0.2],
  });

  const backgroundColor = variant === 'glass'
    ? colors.glass
    : colors.secondaryBackground;

  return (
    <Animated.View
      style={[
        {
          width: (type === 'circle' ? height : width) as any,
          height,
          borderRadius: type === 'circle' ? height / 2 : br,
          backgroundColor,
          overflow: 'hidden',
        },
        animated && { opacity },
        style,
      ]}
    >
      {variant === 'glass' && animated && (
        <Animated.View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: colors.glassBorder,
            opacity: secondaryOpacity,
          }}
        />
      )}
    </Animated.View>
  );
};

/**
 * Post Skeleton - Glass-style feed item placeholder
 */
export const PostSkeleton = () => {
  const { colors } = useTheme();
  const spacing = SPACING;

  return (
    <View style={{
      backgroundColor: colors.glass,
      padding: spacing.PADDING_CARD,
      marginBottom: spacing.MARGIN_LARGE,
      borderRadius: BORDER_RADIUS.CARD,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.glassBorder,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.MARGIN_LARGE }}>
        <Skeleton type="circle" width={40} height={40} variant="glass" style={{ marginRight: spacing.MARGIN_DEFAULT }} />
        <View style={{ flex: 1 }}>
          <Skeleton width="60%" height={12} variant="glass" style={{ marginBottom: spacing.MARGIN_SMALL }} />
          <Skeleton width="40%" height={10} variant="glass" />
        </View>
      </View>
      <Skeleton width="100%" height={12} variant="glass" style={{ marginBottom: spacing.MARGIN_SMALL }} />
      <Skeleton width="100%" height={12} variant="glass" style={{ marginBottom: spacing.MARGIN_LARGE }} />
      <Skeleton width="100%" height={200} variant="glass" style={{ marginBottom: spacing.MARGIN_LARGE, borderRadius: BORDER_RADIUS.DEFAULT }} />
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
      <Skeleton width="100%" height={200} style={{ marginBottom: spacing.MARGIN_DEFAULT, borderRadius: BORDER_RADIUS.DEFAULT }} />
      <Skeleton width="80%" height={14} style={{ marginBottom: spacing.MARGIN_SMALL }} />
      <Skeleton width="50%" height={12} />
    </View>
  );
};

export default Skeleton;
