import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../theme';

interface ModernCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: number;
  borderRadius?: number;
  shadow?: 'none' | 'subtle' | 'default' | 'medium' | 'large';
  variant?: 'default' | 'elevated' | 'outlined';
  disabled?: boolean;
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
}: ModernCardProps) => {
  const { colors } = useTheme();

  const styles = useMemo(() => {
    const variantStyles = {
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

  const Component = onPress ? Pressable : View;

  return (
    <Component
      style={[styles.card, disabled && { opacity: 0.6 }, style]}
      onPress={onPress}
      disabled={disabled}
      android_ripple={onPress ? { color: colors.BLACK_10 } : undefined}
    >
      {children}
    </Component>
  );
};

export default ModernCard;
