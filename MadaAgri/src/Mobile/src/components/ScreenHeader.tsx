import React, { useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Text,
  Image,
  Animated,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../theme';
import * as Haptics from 'expo-haptics';

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
  variant?: 'default' | 'glass';
  compact?: boolean;
  disableTopSafeArea?: boolean;
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
  variant = 'default',
  compact = false,
  disableTopSafeArea = false,
}: ScreenHeaderProps) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = React.useState('');
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const topPadding = disableTopSafeArea ? (compact ? 6 : 12) : insets.top + (compact ? 6 : 12);

  const handleIconPress = useCallback((callback?: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.85, duration: 60, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }),
    ]).start();
    callback?.();
  }, [scaleAnim]);

  const styles = StyleSheet.create({
    header: {
      paddingHorizontal: SPACING.SCREEN_PADDING,
      paddingTop: topPadding,
      paddingBottom: compact ? SPACING.PADDING_SMALL : SPACING.PADDING_DEFAULT,
    },
    headerGlass: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    logoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    titleText: {
      fontSize: compact ? TYPOGRAPHY.h3.fontSize : TYPOGRAPHY.h2.fontSize,
      fontWeight: TYPOGRAPHY.h2.fontWeight,
      color: colors.text,
    },
    searchContainer: {
      flex: 1,
      marginLeft: SPACING.MD,
      backgroundColor: colors.primaryBackground,
      borderRadius: BORDER_RADIUS.DEFAULT,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.MD,
      height: 36,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 0,
      color: colors.text,
      fontSize: TYPOGRAPHY.body.fontSize,
      marginLeft: SPACING.SM,
    },
    iconContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.XS,
    },
    notificationBadge: {
      position: 'absolute',
      top: -2,
      right: -2,
      backgroundColor: colors.error,
      borderRadius: BORDER_RADIUS.FULL,
      minWidth: 18,
      height: 18,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: variant === 'glass' ? 'transparent' : colors.card,
    },
    badgeText: {
      color: colors.WHITE,
      fontSize: 9,
      fontWeight: '700',
    },
    iconButton: {
      position: 'relative',
      width: 36,
      height: 36,
      borderRadius: BORDER_RADIUS.FULL,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: variant === 'glass' ? colors.BLACK_10 : 'transparent',
    },
    backButton: {
      marginRight: SPACING.SM,
    },
  });

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    onSearchChange?.(text);
  };

  const renderHeaderContent = () => (
    <View style={styles.headerContent}>
      <View style={styles.leftSection}>
        {showBack ? (
          <TouchableOpacity
            style={[styles.iconButton, styles.backButton]}
            onPress={() => handleIconPress(onBackPress)}
            disabled={!onBackPress}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.logoContainer}
            onPress={() => handleIconPress(onLogoPress)}
            disabled={!onLogoPress}
            activeOpacity={0.7}
          >
            {logo ? (
              <Image source={logo} style={{ width: 32, height: 32, borderRadius: BORDER_RADIUS.SM }} />
            ) : (
              <Text style={styles.titleText}>{title || 'MadaAgri'}</Text>
            )}
          </TouchableOpacity>
        )}

        {showSearch && (
          <View style={styles.searchContainer}>
            <MaterialCommunityIcons name="magnify" size={18} color={colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder={searchPlaceholder}
              placeholderTextColor={colors.placeholder}
              value={searchText}
              onChangeText={handleSearchChange}
            />
          </View>
        )}
      </View>

      <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
        {showMoreMenu && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleIconPress(onMoreMenuPress)}
            disabled={!onMoreMenuPress}
          >
            <MaterialCommunityIcons name="dots-horizontal" size={22} color={colors.text} />
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );

  if (variant === 'glass') {
    return (
      <View style={[styles.header, { overflow: 'hidden' }]}>
        <View style={styles.headerGlass}>
          <BlurView intensity={Platform.OS === 'ios' ? 50 : 70} tint="light" style={StyleSheet.absoluteFill} />
        </View>
        {renderHeaderContent()}
      </View>
    );
  }

  return (
    <View style={[styles.header, { backgroundColor: colors.card }]}>
      {renderHeaderContent()}
    </View>
  );
};

export default ScreenHeader;
