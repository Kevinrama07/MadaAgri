import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../theme';

interface CardProps extends ViewProps {
  padding?: number;
  margin?: number;
  variant?: 'default' | 'elevated' | 'outlined';
  onPress?: () => void;
  activeOpacity?: number;
}

export const Card = ({
  padding = SPACING.CARD_PADDING,
  margin = SPACING.CARD_MARGIN,
  variant = 'default',
  children,
  style,
  ...props
}: CardProps) => {
  const { colors } = useTheme();

  const variantStyles = {
    default: {
      backgroundColor: colors.card,
      borderColor: 'transparent',
    },
    elevated: {
      backgroundColor: colors.card,
      borderColor: 'transparent',
    },
    outlined: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderWidth: 1,
    },
  };

  const styles = StyleSheet.create({
    card: {
      padding,
      marginBottom: margin,
      borderRadius: BORDER_RADIUS.CARD,
      ...variantStyles[variant],
    },
  });

  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
};

export default Card;