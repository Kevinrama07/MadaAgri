import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../contexts/ThemeContext.jsx';

export const Button = ({
  title,
  onPress,
  isLoading = false,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
}) => {
  const { colors } = useTheme();

  const variants = {
    primary: colors.primary,
    secondary: colors.secondary,
    danger: colors.error,
  };

  const sizes = {
    small: { padding: 8, fontSize: 12 },
    medium: { padding: 12, fontSize: 16 },
    large: { padding: 16, fontSize: 18 },
  };

  const styles = StyleSheet.create({
    button: {
      backgroundColor: disabled ? '#ccc' : variants[variant],
      paddingVertical: sizes[size].padding,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      width: fullWidth ? '100%' : 'auto',
    },
    text: {
      color: '#fff',
      fontSize: sizes[size].fontSize,
      fontWeight: '600',
      marginRight: isLoading ? 10 : 0,
    },
  });

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
    >
      {isLoading && <ActivityIndicator color="#fff" />}
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

export default Button;
