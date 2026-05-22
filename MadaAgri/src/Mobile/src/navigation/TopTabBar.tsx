import React, { useRef, useCallback, useState } from 'react';
import {
  View,
  Pressable,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../theme';
import * as Haptics from 'expo-haptics';
import { useNavigation, useNavigationState } from '@react-navigation/native';

const TOP_TAB_CONFIG = [
  { name: 'Feed',          iconOutline: 'home-outline',     iconFilled: 'home' },
  { name: 'Invitations',   iconOutline: 'account-group-outline', iconFilled: 'account-group' },
  { name: 'Messages',      iconOutline: 'message-outline',   iconFilled: 'message' },
  { name: 'Notifications', iconOutline: 'bell-outline',      iconFilled: 'bell' },
  { name: 'Profile',       iconOutline: 'account-outline',   iconFilled: 'account' },
];

interface TopTabItemProps {
  config: typeof TOP_TAB_CONFIG[0];
  isFocused: boolean;
  onPress: () => void;
  colors: any;
}

const TopTabItem = React.memo(({ config, isFocused, onPress, colors }: TopTabItemProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.82, duration: 60, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }),
    ]).start();
    onPress();
  }, [onPress, scaleAnim]);

  const iconName = isFocused ? config.iconFilled : config.iconOutline;

  return (
    <Pressable
      style={styles.tabItem}
      onPress={handlePress}
      accessibilityRole="tab"
      accessibilityLabel={config.name}
      accessibilityState={{ selected: isFocused }}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <View
          style={[
            styles.iconWrapper,
            isFocused && { backgroundColor: colors.primaryPale },
          ]}
        >
          <MaterialCommunityIcons
            name={iconName as any}
            size={22}
            color={isFocused ? colors.primary : colors.textTertiary}
          />
        </View>
        {isFocused && <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />}
      </Animated.View>
    </Pressable>
  );
});

interface MenuToggleProps {
  isOpen: boolean;
  onPress: () => void;
  colors: any;
}

const MenuToggle = React.memo(({ isOpen, onPress, colors }: MenuToggleProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.spring(rotateAnim, {
      toValue: isOpen ? 1 : 0,
      friction: 6,
      tension: 150,
      useNativeDriver: true,
    }).start();
  }, [isOpen, rotateAnim]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.82, duration: 60, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }),
    ]).start();
    onPress();
  }, [onPress, scaleAnim]);

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <Pressable
      style={styles.tabItem}
      onPress={handlePress}
      accessibilityLabel={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <View style={[styles.iconWrapper, isOpen && { backgroundColor: colors.primaryPale }]}>
          <MaterialCommunityIcons
            name="apps"
            size={22}
            color={isOpen ? colors.primary : colors.textTertiary}
          />
        </View>
        <View style={[styles.activeDot, { backgroundColor: colors.primary, opacity: isOpen ? 1 : 0 }]} />
      </Animated.View>
    </Pressable>
  );
});

interface TopTabBarProps {
  onMenuToggle: () => void;
  menuOpen: boolean;
}

export default function TopTabBar({ onMenuToggle, menuOpen }: TopTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [searchText, setSearchText] = useState('');

  const activeTabIndex = useNavigationState((state) => {
    const mainTabsRoute = state.routes.find((r) => r.name === 'MainTabs');
    return mainTabsRoute?.state?.index ?? 0;
  });

  const handleTabPress = useCallback(
    (routeName: string) => {
      navigation.navigate('MainTabs', { screen: routeName });
    },
    [navigation]
  );

  const handleSettingsPress = useCallback(() => {
    navigation.navigate('Settings');
  }, [navigation]);

  return (
    <View
      style={[
        styles.wrapper,
        { paddingTop: insets.top + 4, paddingBottom: 6 },
      ]}
    >
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={StyleSheet.absoluteFill}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 60 : 80}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
        </View>

        <View style={styles.headerRow}>
          <Text style={[styles.brandText, { color: colors.text }]}>MadaAgri</Text>
          <View style={[styles.searchContainer, { backgroundColor: colors.primaryBackground }]}>
            <MaterialCommunityIcons name="magnify" size={18} color={colors.textTertiary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Rechercher..."
              placeholderTextColor={colors.placeholder}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
          <Pressable style={styles.iconButton} onPress={handleSettingsPress} accessibilityLabel="Paramètres">
            <MaterialCommunityIcons name="cog-outline" size={22} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.tabsRow}>
          {TOP_TAB_CONFIG.map((config, index) => (
            <TopTabItem
              key={config.name}
              config={config}
              isFocused={activeTabIndex === index}
              onPress={() => handleTabPress(config.name)}
              colors={colors}
            />
          ))}
          <MenuToggle
            isOpen={menuOpen}
            onPress={onMenuToggle}
            colors={colors}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: 'transparent',
  },
  container: {
    marginHorizontal: 12,
    borderRadius: BORDER_RADIUS.LG,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.3)',
    ...SHADOWS.DEFAULT,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingTop: 6,
    paddingBottom: 4,
    gap: SPACING.SM,
  },
  brandText: {
    fontSize: TYPOGRAPHY.h2.fontSize,
    fontWeight: '700',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.DEFAULT,
    paddingHorizontal: SPACING.MD,
    height: 34,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
    fontSize: TYPOGRAPHY.body.fontSize,
    marginLeft: SPACING.XS,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.FULL,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: BORDER_RADIUS.LG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: BORDER_RADIUS.FULL,
    alignSelf: 'center',
    marginTop: 3,
  },
});
