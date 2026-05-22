import React, { useMemo, useRef, useCallback } from 'react';
import {
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../theme';
import * as Haptics from 'expo-haptics';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success' | 'outline' | 'glass';
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
  haptic?: boolean;
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
  haptic = true,
}: ModernButtonProps) => {
  const { colors } = useTheme();
  const buttonText = title || label || '';
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.spring(scaleAnim, { toValue: 0.96, friction: 8, tension: 200, useNativeDriver: true }).start();
  }, [scaleAnim, haptic]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 180, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const styles = useMemo(() => {
    const sizeConfig = {
      small: {
        paddingVertical: SPACING.PADDING_SMALL,
        paddingHorizontal: SPACING.PADDING_DEFAULT,
        fontSize: TYPOGRAPHY.label.fontSize,
        iconSize: 16,
      },
      medium: {
        paddingVertical: SPACING.BUTTON_PADDING_VERTICAL,
        paddingHorizontal: SPACING.BUTTON_PADDING_HORIZONTAL,
        fontSize: TYPOGRAPHY.body.fontSize,
        iconSize: 20,
      },
      large: {
        paddingVertical: SPACING.PADDING_LARGE,
        paddingHorizontal: SPACING.PADDING_XL,
        fontSize: TYPOGRAPHY.subheading.fontSize,
        iconSize: 22,
      },
    };

    const variantConfig: Record<string, any> = {
      primary: {
        backgroundColor: colors.primary,
        textColor: colors.WHITE,
        borderWidth: 0,
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
        borderWidth: 1.5,
      },
      tertiary: {
        backgroundColor: 'transparent',
        textColor: colors.primary,
        borderWidth: 0,
      },
      danger: {
        backgroundColor: colors.error,
        textColor: colors.WHITE,
        borderWidth: 0,
      },
      success: {
        backgroundColor: colors.success,
        textColor: colors.WHITE,
        borderWidth: 0,
      },
      glass: {
        backgroundColor: colors.glass,
        textColor: colors.primary,
        borderColor: colors.glassBorder,
        borderWidth: StyleSheet.hairlineWidth,
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
        opacity: disabled ? 0.5 : 1,
        ...(variant !== 'tertiary' && variant !== 'glass' ? SHADOWS.DEFAULT : SHADOWS.NONE),
      },
      text: {
        fontWeight: TYPOGRAPHY.subheading.fontWeight,
        color: variantStyle.textColor,
        fontSize: config.fontSize,
        textAlign: 'center',
      },
      iconSpacing: {
        marginHorizontal: SPACING.SM,
      },
    });
  }, [size, variant, colors, disabled]);

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, fullWidth && { width: '100%' }]}>
      <TouchableOpacity
        style={[styles.button, fullWidth && { width: '100%' }, style]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.9}
      >
        {loading ? (
          <ActivityIndicator color={styles.text.color as string} size="small" />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <MaterialCommunityIcons
                name={icon as any}
                size={size === 'small' ? 16 : size === 'medium' ? 20 : 22}
                color={styles.text.color as string}
                style={styles.iconSpacing}
              />
            )}
            <Text style={[styles.text, textStyle]}>{buttonText}</Text>
            {icon && iconPosition === 'right' && (
              <MaterialCommunityIcons
                name={icon as any}
                size={size === 'small' ? 16 : size === 'medium' ? 20 : 22}
                color={styles.text.color as string}
                style={styles.iconSpacing}
              />
            )}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default ModernButton;
