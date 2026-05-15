import React, { useMemo, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextInputProps,
  Text,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../theme';

interface ModernInputProps extends TextInputProps {
  label?: string;
  placeholder?: string;
  icon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  error?: string;
  containerStyle?: ViewStyle;
  multiline?: boolean;
  variant?: 'default' | 'outlined' | 'filled';
}

export const ModernInput = ({
  label,
  placeholder,
  icon,
  rightIcon,
  onRightIconPress,
  error,
  containerStyle,
  multiline = false,
  variant = 'default',
  ...props
}: ModernInputProps) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const styles = useMemo(() => {
    const variantStyles = {
      default: {
        backgroundColor: colors.primaryBackground,
        borderWidth: 0,
      },
      outlined: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: isFocused ? colors.primary : colors.border,
      },
      filled: {
        backgroundColor: colors.secondaryBackground,
        borderWidth: 0,
      },
    };

    return StyleSheet.create({
      container: {
        marginBottom: SPACING.MARGIN_DEFAULT,
      },
      inputContainer: {
        flexDirection: 'row',
        alignItems: multiline ? 'flex-start' : 'center',
        borderRadius: BORDER_RADIUS.INPUT,
        paddingHorizontal: SPACING.INPUT_PADDING,
        paddingVertical: multiline ? SPACING.INPUT_PADDING : 0,
        ...variantStyles[variant],
        ...SHADOWS.SUBTLE,
      },
      input: {
        flex: 1,
        paddingVertical: multiline ? SPACING.INPUT_PADDING : SPACING.BUTTON_PADDING_VERTICAL,
        paddingHorizontal: SPACING.SM,
        fontSize: TYPOGRAPHY.body.fontSize,
        color: colors.text,
        fontWeight: TYPOGRAPHY.body.fontWeight,
      },
      icon: {
        marginRight: SPACING.SM,
      },
      rightIcon: {
        marginLeft: SPACING.SM,
      },
      errorText: {
        color: colors.error,
        fontSize: TYPOGRAPHY.caption.fontSize,
        marginTop: SPACING.SM,
        fontWeight: TYPOGRAPHY.caption.fontWeight,
      },
    });
  }, [colors, isFocused, variant, multiline]);

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.inputContainer}>
        {icon && (
          <MaterialCommunityIcons
            name={icon as any}
            size={20}
            color={colors.textTertiary}
            style={styles.icon}
          />
        )}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline={multiline}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIcon}
            disabled={!onRightIconPress}
          >
            <MaterialCommunityIcons
              name={rightIcon as any}
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

export default ModernInput;
