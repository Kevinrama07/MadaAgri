import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext.jsx';

export const Header = ({ title, onBack, onRight, rightIcon }) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    buttonContainer: {
      padding: 8,
    },
  });

  return (
    <View style={styles.header}>
      {onBack ? (
        <TouchableOpacity style={styles.buttonContainer} onPress={onBack}>
          <Text style={{ color: colors.primary, fontSize: 24 }}>←</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.buttonContainer} />
      )}
      <Text style={styles.title}>{title}</Text>
      {onRight ? (
        <TouchableOpacity style={styles.buttonContainer} onPress={onRight}>
          <Text style={{ color: colors.primary }}>{rightIcon || '⋯'}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.buttonContainer} />
      )}
    </View>
  );
};

export default Header;
