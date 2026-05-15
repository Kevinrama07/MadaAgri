import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function SkeletonLoader({ 
  width = '100%', 
  height = 20, 
  borderRadius = BORDER_RADIUS.SMALL,
  style 
}: SkeletonLoaderProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function CultureCardSkeleton() {
  return (
    <View style={styles.cardSkeleton}>
      <View style={styles.headerSkeleton}>
        <View style={styles.titleSkeleton}>
          <SkeletonLoader width={40} height={40} borderRadius={20} />
          <View style={styles.textSkeleton}>
            <SkeletonLoader width="60%" height={18} />
            <SkeletonLoader width="40%" height={14} style={{ marginTop: 4 }} />
          </View>
        </View>
        <SkeletonLoader width={50} height={30} borderRadius={BORDER_RADIUS.MEDIUM} />
      </View>
      
      <SkeletonLoader width="100%" height={14} style={{ marginTop: SPACING.SM }} />
      <SkeletonLoader width="80%" height={14} style={{ marginTop: 4 }} />
      
      <SkeletonLoader width="100%" height={6} style={{ marginTop: SPACING.SM }} />
      
      <View style={styles.detailsSkeleton}>
        <SkeletonLoader width="48%" height={40} />
        <SkeletonLoader width="48%" height={40} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  cardSkeleton: {
    backgroundColor: COLORS.CARD_BG,
    borderRadius: BORDER_RADIUS.LARGE,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.1)',
  },
  headerSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.SM,
  },
  titleSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.SM,
  },
  textSkeleton: {
    flex: 1,
    marginLeft: SPACING.SM,
  },
  detailsSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.SM,
    paddingTop: SPACING.SM,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
});
