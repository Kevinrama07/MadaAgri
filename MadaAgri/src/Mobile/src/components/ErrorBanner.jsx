import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext.jsx';

export const ErrorBanner = ({ message, onDismiss }) => {
  const { colors } = useTheme();

  if (!message) return null;

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.error,
      padding: 12,
      borderRadius: 8,
      marginVertical: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    text: {
      color: '#fff',
      flex: 1,
      marginRight: 12,
    },
    closeButton: {
      fontWeight: 'bold',
      color: '#fff',
      fontSize: 18,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
      {onDismiss && (
        <Text style={styles.closeButton} onPress={onDismiss}>
          ✕
        </Text>
      )}
    </View>
  );
};

export default ErrorBanner;
