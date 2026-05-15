import React, { useMemo } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success' | 'outline';
type ButtonSize = 'small' | 'medium' | 'large';

interface ModernButtonProps {
  title?: string;
  label?: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const ModernButton = ({
  title,
  label,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
}: ModernButtonProps) => {
  const { colors } = useTheme();
  const buttonText = title || label || '';

  const styles = useMemo(() => {
    const sizeConfig = {
      small: {
        paddingVertical: SPACING.PADDING_SMALL,
        paddingHorizontal: SPACING.PADDING_DEFAULT,
        fontSize: TYPOGRAPHY.label.fontSize,
      },
      medium: {
        paddingVertical: SPACING.BUTTON_PADDING_VERTICAL,
        paddingHorizontal: SPACING.BUTTON_PADDING_HORIZONTAL,
        fontSize: TYPOGRAPHY.body.fontSize,
      },
      large: {
        paddingVertical: SPACING.PADDING_LARGE,
        paddingHorizontal: SPACING.PADDING_XL,
        fontSize: TYPOGRAPHY.subheading.fontSize,
      },
    };

    const variantConfig = {
      primary: {
        backgroundColor: colors.primary,
        textColor: colors.WHITE,
      },
      secondary: {
        backgroundColor: colors.primaryBackground,
        textColor: colors.primary,
        borderColor: colors.border,
        borderWidth: 1,
      },
      outline: {
        backgroundColor: 'transparent',
        textColor: colors.primary,
        borderColor: colors.primary,
        borderWidth: 1,
      },
      tertiary: {
        backgroundColor: 'transparent',
        textColor: colors.primary,
      },
      danger: {
        backgroundColor: colors.error,
        textColor: colors.WHITE,
      },
      success: {
        backgroundColor: colors.success,
        textColor: colors.WHITE,
      },
    };

    const config = sizeConfig[size];
    const variantStyle = variantConfig[variant];

    return StyleSheet.create({
      button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BORDER_RADIUS.BUTTON,
        ...config,
        ...variantStyle,
        opacity: disabled ? 0.6 : 1,
        ...SHADOWS.DEFAULT,
      },
      text: {
        fontWeight: TYPOGRAPHY.subheading.fontWeight,
        color: variantStyle.textColor,
        fontSize: config.fontSize,
      },
      iconSpacing: {
        marginHorizontal: SPACING.SM,
      },
    });
  }, [size, variant, colors, disabled]);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        fullWidth && { width: '100%' },
        disabled && { opacity: 0.6 },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={styles.text.color} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <MaterialCommunityIcons
              name={icon as any}
              size={20}
              color={styles.text.color}
              style={styles.iconSpacing}
            />
          )}
          <Text style={[styles.text, textStyle]}>{buttonText}</Text>
          {icon && iconPosition === 'right' && (
            <MaterialCommunityIcons
              name={icon as any}
              size={20}
              color={styles.text.color}
              style={styles.iconSpacing}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

export default ModernButton;
