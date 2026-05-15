import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';

type FilterType = 'all' | 'unread' | 'message' | 'collaboration' | 'follow' | 'like' | 'comment';

interface NotificationFiltersProps {
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  counts?: Record<FilterType, number>;
}

export const NotificationFilters: React.FC<NotificationFiltersProps> = ({
  filter,
  onFilterChange,
  counts = {},
}) => {
  const { colors } = useTheme();

  const filters: Array<{ key: FilterType; label: string; icon: string }> = [
    { key: 'all', label: 'Tous', icon: 'bell' },
    { key: 'unread', label: 'Non lus', icon: 'bell-badge' },
    { key: 'message', label: 'Messages', icon: 'message' },
    { key: 'collaboration', label: 'Collaborations', icon: 'handshake' },
    { key: 'follow', label: 'Abonnés', icon: 'account-plus' },
    { key: 'like', label: 'Likes', icon: 'heart' },
    { key: 'comment', label: 'Commentaires', icon: 'comment' },
  ];

  const styles = StyleSheet.create({
    container: {
      paddingVertical: SPACING.MD,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    scrollContent: {
      paddingHorizontal: SPACING.SCREEN_PADDING,
      gap: SPACING.SM,
    },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.MD,
      paddingVertical: SPACING.SM,
      borderRadius: BORDER_RADIUS.CARD,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.secondaryBackground,
      gap: SPACING.XS,
    },
    filterChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterLabel: {
      fontSize: TYPOGRAPHY.body.fontSize,
      color: colors.text,
      fontWeight: '500',
    },
    filterLabelActive: {
      color: '#fff',
      fontWeight: '600',
    },
    filterCount: {
      fontSize: TYPOGRAPHY.caption.fontSize,
      color: colors.textSecondary,
      marginLeft: SPACING.XS,
    },
    filterCountActive: {
      color: '#fff',
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((item) => {
          const isActive = filter === item.key;
          const count = counts[item.key] || 0;

          return (
            <Pressable
              key={item.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => onFilterChange(item.key)}
            >
              <MaterialCommunityIcons
                name={item.icon as any}
                size={18}
                color={isActive ? '#fff' : colors.text}
              />
              <Text style={[styles.filterLabel, isActive && styles.filterLabelActive]}>
                {item.label}
              </Text>
              {count > 0 && (
                <Text style={[styles.filterCount, isActive && styles.filterCountActive]}>
                  ({count})
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default NotificationFilters;
