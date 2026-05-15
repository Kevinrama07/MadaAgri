import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../theme';

const TAB_CONFIG = [
  { name: 'Feed',          icon: 'home',           iconActive: 'home',           label: 'Accueil' },
  { name: 'Invitations',   icon: 'account-group-outline', iconActive: 'account-group', label: 'Invitations' },
  { name: 'Messages',      icon: 'message-outline', iconActive: 'message',        label: 'Discussions' },
  { name: 'Notifications', icon: 'bell-outline',    iconActive: 'bell',           label: 'Notifs' },
  { name: 'Profile',       icon: 'account-outline', iconActive: 'account',        label: 'Profil' },
];

interface TabItemProps {
  config: typeof TAB_CONFIG[0];
  isFocused: boolean;
  badge?: number;
  onPress: () => void;
  colors: any;
}

const TabItem = React.memo(({ config, isFocused, badge, onPress, colors }: TabItemProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }),
    ]).start();
    onPress();
  }, [onPress, scaleAnim]);

  const iconName = isFocused ? config.iconActive : config.icon;
  const iconColor = isFocused ? colors.primary : colors.textTertiary;

  return (
    <Pressable
      style={styles.tabItem}
      onPress={handlePress}
      accessibilityRole="tab"
      accessibilityLabel={config.label}
      accessibilityState={{ selected: isFocused }}
    >
      <Animated.View style={[styles.tabInner, { transform: [{ scale: scaleAnim }] }]}>
        {/* Indicateur actif */}
        {isFocused && (
          <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
        )}

        {/* Icône + badge */}
        <View style={styles.iconWrapper}>
          <MaterialCommunityIcons name={iconName as any} size={24} color={iconColor} />
          {badge != null && badge > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.error }]}>
              <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
            </View>
          )}
        </View>

        {/* Label */}
        <Text
          style={[
            styles.tabLabel,
            { color: iconColor },
            isFocused && styles.tabLabelActive,
          ]}
          numberOfLines={1}
        >
          {config.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
});

export default function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 4),
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const config = TAB_CONFIG.find((t) => t.name === route.name);
        if (!config) return null;

        const isFocused = state.index === index;
        const { options } = descriptors[route.key];
        const badge = typeof options.tabBarBadge === 'number' ? options.tabBarBadge : undefined;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TabItem
            key={route.key}
            config={config}
            isFocused={isFocused}
            badge={badge}
            onPress={onPress}
            colors={colors}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 2,
    minHeight: 52,
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  activeIndicator: {
    position: 'absolute',
    top: -6,
    width: 28,
    height: 3,
    borderRadius: BORDER_RADIUS.FULL,
  },
  iconWrapper: {
    position: 'relative',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: BORDER_RADIUS.FULL,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 12,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    fontWeight: '600',
  },
});
