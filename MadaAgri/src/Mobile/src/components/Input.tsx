import React, { useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';

interface InputProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  icon?: string;
  iconPosition?: 'left' | 'right';
  onIconPress?: () => void;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  testID?: string;
  style?: any;
}

export const Input = ({
  placeholder = 'Entrer du texte...',
  value,
  onChangeText,
  icon,
  iconPosition = 'left',
  onIconPress,
  error,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  secureTextEntry = false,
  keyboardType = 'default',
  testID,
  style,
}: InputProps) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  const styles = StyleSheet.create({
    container: {
      marginBottom: SPACING.LG,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: multiline ? 'flex-start' : 'center',
      paddingHorizontal: SPACING.PADDING_LARGE,
      paddingVertical: multiline ? SPACING.PADDING_DEFAULT : 0,
      backgroundColor: colors.cardAlt,
      borderRadius: BORDER_RADIUS.INPUT,
      borderWidth: 1,
      borderColor: isFocused ? colors.primary : error ? colors.error : colors.border,
      marginBottom: error ? SPACING.SM : 0,
    },
    input: {
      flex: 1,
      height: multiline ? undefined : 48,
      paddingVertical: multiline ? SPACING.PADDING_DEFAULT : 0,
      paddingHorizontal: icon ? SPACING.MD : 0,
      color: colors.text,
      fontSize: TYPOGRAPHY.body.fontSize,
      fontWeight: '400' as const,
      minHeight: multiline ? 100 : 48,
    },
    iconContainer: {
      paddingHorizontal: SPACING.MD,
    },
    errorText: {
      color: colors.error,
      fontSize: TYPOGRAPHY.caption.fontSize,
      marginTop: SPACING.SM,
      marginLeft: SPACING.MD,
    },
  });

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputWrapper}>
        {icon && iconPosition === 'left' && (
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={onIconPress}
            disabled={!onIconPress}
          >
            <MaterialCommunityIcons name={icon as any} size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        )}

        <RNTextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          value={value}
          onChangeText={onChangeText}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          testID={testID}
        />

        {secureTextEntry && (
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={() => setIsSecure(!isSecure)}
          >
            <MaterialCommunityIcons
              name={isSecure ? 'eye-off' : 'eye'}
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        )}

        {icon && iconPosition === 'right' && !secureTextEntry && (
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={onIconPress}
            disabled={!onIconPress}
          >
            <MaterialCommunityIcons name={icon as any} size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default Input;
