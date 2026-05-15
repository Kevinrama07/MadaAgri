import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../theme';

interface ButtonProps {
  title?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  borderRadius?: number;
  testID?: string;
  style?: any;
}

export const Button = ({
  title = 'Button',
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  borderRadius,
  testID,
  style,
}: ButtonProps) => {
  const { colors } = useTheme();
  const spacing = SPACING;
  const br = BORDER_RADIUS;
  const isDisabled = disabled || loading;

  const variantStyles = {
    primary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    secondary: {
      backgroundColor: colors.primaryPale,
      borderColor: colors.primary,
    },
    tertiary: {
      backgroundColor: 'transparent',
      borderColor: colors.border,
    },
    danger: {
      backgroundColor: colors.error,
      borderColor: colors.error,
    },
  };

  const textColorMap = {
    primary: colors.WHITE,
    secondary: colors.primary,
    tertiary: colors.text,
    danger: colors.WHITE,
  };

  const sizeStyles = {
    small: {
      paddingVertical: spacing.PADDING_SMALL,
      paddingHorizontal: spacing.PADDING_LARGE,
      minHeight: 36,
    },
    medium: {
      paddingVertical: spacing.BUTTON_PADDING_VERTICAL,
      paddingHorizontal: spacing.BUTTON_PADDING_HORIZONTAL,
      minHeight: 44,
    },
    large: {
      paddingVertical: spacing.PADDING_LARGE,
      paddingHorizontal: spacing.PADDING_XL,
      minHeight: 52,
    },
  };

  const fontSizeMap = {
    small: TYPOGRAPHY.label.fontSize,
    medium: TYPOGRAPHY.subheading.fontSize,
    large: TYPOGRAPHY.subheading.fontSize,
  };

  const styles = StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius || br.BUTTON,
      borderWidth: variant === 'tertiary' ? 1 : 0,
      opacity: isDisabled ? 0.6 : 1,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(fullWidth && { width: '100%' }),
    },
    text: {
      color: textColorMap[variant],
      fontSize: fontSizeMap[size],
      fontWeight: '600' as const,
      marginHorizontal: icon ? spacing.MD : 0,
    },
    iconSpacing: {
      marginHorizontal: spacing.SM,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={textColorMap[variant]} size={size === 'large' ? 24 : 20} />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <MaterialCommunityIcons
              name={icon as any}
              size={size === 'large' ? 24 : 20}
              color={textColorMap[variant]}
            />
          )}
          {title && <Text style={styles.text}>{title}</Text>}
          {icon && iconPosition === 'right' && (
            <MaterialCommunityIcons
              name={icon as any}
              size={size === 'large' ? 24 : 20}
              color={textColorMap[variant]}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default Button;
