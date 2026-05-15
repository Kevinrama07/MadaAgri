import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';

interface NotificationSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  placeholder?: string;
}

export const NotificationSearch: React.FC<NotificationSearchProps> = ({
  query,
  onQueryChange,
  placeholder = 'Rechercher des notifications...',
}) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: SPACING.SCREEN_PADDING,
      paddingVertical: SPACING.MD,
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.secondaryBackground,
      borderRadius: BORDER_RADIUS.CARD,
      borderWidth: 1,
      borderColor: isFocused ? colors.primary : colors.border,
      paddingHorizontal: SPACING.MD,
      gap: SPACING.SM,
    },
    searchIcon: {
      opacity: 0.6,
    },
    input: {
      flex: 1,
      paddingVertical: SPACING.MD,
      fontSize: TYPOGRAPHY.body.fontSize,
      color: colors.text,
    },
    clearButton: {
      padding: SPACING.XS,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color={colors.text}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={onQueryChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable style={styles.clearButton} onPress={() => onQueryChange('')}>
            <MaterialCommunityIcons name="close-circle" size={20} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>
    </View>
  );
};

export default NotificationSearch;
