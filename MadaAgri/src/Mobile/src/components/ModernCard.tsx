import React, { useMemo, useRef, useCallback } from 'react';
import { View, StyleSheet, ViewStyle, Pressable, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../theme';
import * as Haptics from 'expo-haptics';

interface ModernCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: number;
  borderRadius?: number;
  shadow?: 'none' | 'subtle' | 'default' | 'medium' | 'large';
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  disabled?: boolean;
  haptic?: boolean;
}

export const ModernCard = ({
  children,
  onPress,
  style,
  padding = SPACING.CARD_PADDING,
  borderRadius = BORDER_RADIUS.CARD,
  shadow = 'default',
  variant = 'default',
  disabled = false,
  haptic = false,
}: ModernCardProps) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.98, friction: 8, tension: 200, useNativeDriver: true }).start();
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [scaleAnim, haptic]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 180, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const styles = useMemo(() => {
    const variantStyles: Record<string, any> = {
      default: {
        backgroundColor: colors.card,
        borderWidth: 0,
      },
      elevated: {
        backgroundColor: colors.card,
        borderWidth: 0,
      },
      outlined: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
      },
      glass: {
        backgroundColor: colors.glass,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.glassBorder,
      },
    };

    return StyleSheet.create({
      card: {
        borderRadius,
        padding,
        ...variantStyles[variant],
        ...(SHADOWS as any)[shadow === 'none' ? 'NONE' : shadow.toUpperCase()],
      },
    });
  }, [colors, padding, borderRadius, variant, shadow]);

  const Component = onPress ? Animated.View : View;
  const pressHandlers = onPress ? {
    onPress: (onPress as any),
    onPressIn: handlePressIn,
    onPressOut: handlePressOut,
  } : {};

  return (
    <Component
      // @ts-ignore
      style={[styles.card, disabled && { opacity: 0.6 }, onPress ? { transform: [{ scale: scaleAnim }] } : {}, style]}
      {...pressHandlers}
      // @ts-ignore
      android_ripple={onPress ? { color: colors.BLACK_10, borderless: true } : undefined}
    >
      {children}
    </Component>
  );
};

export default ModernCard;
