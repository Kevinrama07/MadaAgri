import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Text,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../theme';

interface ScreenHeaderProps {
  title?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearchChange?: (text: string) => void;
  showBack?: boolean;
  onBackPress?: () => void;
  showMenu?: boolean;
  onMenuPress?: () => void;
  showMoreMenu?: boolean;
  onMoreMenuPress?: () => void;
  logo?: any;
  onLogoPress?: () => void;
}

export const ScreenHeader = ({
  title,
  showSearch = false,
  searchPlaceholder = 'Rechercher...',
  onSearchChange,
  showBack = false,
  onBackPress,
  showMenu = true,
  onMenuPress,
  showMoreMenu = false,
  onMoreMenuPress,
  logo,
  onLogoPress,
}: ScreenHeaderProps) => {
  const { colors } = useTheme();
  const [searchText, setSearchText] = React.useState('');

  const styles = StyleSheet.create({
    header: {
      backgroundColor: colors.card,
      paddingHorizontal: SPACING.SCREEN_PADDING,
      paddingTop: 40,
      paddingBottom: SPACING.PADDING_DEFAULT,
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    logoContainer: {
      flex: 0,
    },
    titleText: {
      fontSize: TYPOGRAPHY.h2.fontSize,
      fontWeight: TYPOGRAPHY.h2.fontWeight,
      color: colors.text,
    },
    searchContainer: {
      flex: 1,
      marginHorizontal: SPACING.MD,
      backgroundColor: colors.primaryBackground,
      borderRadius: BORDER_RADIUS.DEFAULT,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.MD,
    },
    searchInput: {
      flex: 1,
      paddingVertical: SPACING.PADDING_SMALL,
      color: colors.text,
      fontSize: TYPOGRAPHY.body.fontSize,
    },
    iconContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.MD,
    },
    notificationBadge: {
      position: 'absolute',
      top: -8,
      right: -8,
      backgroundColor: colors.error,
      borderRadius: BORDER_RADIUS.FULL,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    badgeText: {
      color: colors.WHITE,
      fontSize: TYPOGRAPHY.caption.fontSize,
      fontWeight: '700' as const,
    },
    iconButton: {
      position: 'relative',
      padding: SPACING.SM,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backButton: {
      marginRight: SPACING.SM,
    },
  });

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    onSearchChange?.(text);
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        {/* Back Button or Logo/Title */}
        {showBack ? (
          <TouchableOpacity
            style={[styles.iconButton, styles.backButton]}
            onPress={onBackPress}
            disabled={!onBackPress}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.logoContainer}
            onPress={onLogoPress}
            disabled={!onLogoPress}
          >
            {logo ? (
              <Image source={logo} style={{ width: 40, height: 40 }} />
            ) : (
              <Text style={styles.titleText}>{title || 'MadaAgri'}</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Search Bar */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color={colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder={searchPlaceholder}
              placeholderTextColor={colors.placeholder}
              value={searchText}
              onChangeText={handleSearchChange}
            />
          </View>
        )}

        <View style={styles.iconContainer}>
          {showMoreMenu && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onMoreMenuPress}
              disabled={!onMoreMenuPress}
            >
              <MaterialCommunityIcons name="menu" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export default ScreenHeader;
