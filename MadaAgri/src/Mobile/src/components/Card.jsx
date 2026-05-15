import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext.jsx';

export const Card = ({ children, style }) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
  });

  return <View style={[styles.card, style]}>{children}</View>;
};

export default Card;
