import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../contexts/ThemeContext.jsx';

export const Loader = ({ isLoading, message = 'Chargement...' }) => {
  const { colors } = useTheme();

  if (!isLoading) return null;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    message: {
      marginTop: 16,
      fontSize: 16,
      color: colors.text,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

export default Loader;
