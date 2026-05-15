import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  icon?: string;
  onPress?: () => void;
}

const variantColorMap = {
  primary: { bg: '#E8F5E9', text: '#2E7D32' },
  success: { bg: '#E8F5E9', text: '#2E7D32' },
  warning: { bg: '#FFF3E0', text: '#F57C00' },
  error: { bg: '#FFEBEE', text: '#C62828' },
  info: { bg: '#E3F2FD', text: '#1976D2' },
  secondary: { bg: '#F5F5F5', text: '#65676B' },
};

export const Badge = ({
  label,
  variant = 'primary',
  size = 'medium',
  icon,
  onPress,
}: BadgeProps) => {
  const { colors } = useTheme();
  const { bg, text } = variantColorMap[variant];

  const sizeStyles = {
    small: {
      paddingVertical: SPACING.SM,
      paddingHorizontal: SPACING.MD,
      fontSize: TYPOGRAPHY.caption.fontSize,
    },
    medium: {
      paddingVertical: SPACING.MD,
      paddingHorizontal: SPACING.LG,
      fontSize: TYPOGRAPHY.label.fontSize,
    },
    large: {
      paddingVertical: SPACING.LG,
      paddingHorizontal: SPACING.XL,
      fontSize: TYPOGRAPHY.subheading.fontSize,
    },
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: bg,
      borderRadius: BORDER_RADIUS.DEFAULT,
      ...sizeStyles[size],
      alignSelf: 'flex-start',
    },
    text: {
      color: text,
      fontWeight: '600' as const,
      marginLeft: icon ? SPACING.SM : 0,
    },
  });

  return (
    <View style={styles.container}>
      {icon && <MaterialCommunityIcons name={icon as any} size={16} color={text} />}
      <Text style={styles.text}>{label}</Text>
    </View>
  );
};

export default Badge;
