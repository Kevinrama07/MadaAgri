import React from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext.jsx';

export const Input = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  label,
  error,
  keyboardType = 'default',
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      marginVertical: 8,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    input: {
      borderWidth: 1,
      borderColor: error ? colors.error : colors.border,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.card,
    },
    errorText: {
      color: colors.error,
      fontSize: 12,
      marginTop: 4,
    },
  });

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.text + '80'}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default Input;
