import React, { useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../theme';
import * as Haptics from 'expo-haptics';

interface SecondaryMenuItem {
  id: string;
  label: string;
  icon: string;
  screen: string;
  color: string;
  roles: ('farmer' | 'client' | 'all')[];
}

const SECONDARY_ITEMS: SecondaryMenuItem[] = [
  { id: 'dashboard',    label: 'Dashboard',     icon: 'view-dashboard',      screen: 'DashboardAnalytics', color: '#006600', roles: ['all'] },
  { id: 'ai-assistant', label: 'Assistant IA', icon: 'robot',              screen: 'AIChat',              color: '#006600', roles: ['all'] },
  { id: 'parcels',      label: 'Analyse',    icon: 'chart-line',            screen: 'Parcels',             color: '#006600', roles: ['farmer', 'client'] },
  { id: 'weather',      label: 'Météo',         icon: 'weather-partly-cloudy',  screen: 'Weather',          color: '#006600', roles: ['all'] },
  { id: 'market',     label: 'Marketplace',     icon: 'shopping',              screen: 'Marketplace',      color: '#006600', roles: ['client'] },
  { id: 'orders',     label: 'Mes commandes',   icon: 'package-variant',       screen: 'MyOrders',         color: '#006600', roles: ['client'] },
  { id: 'routes',     label: 'Itinéraires',     icon: 'map-marker-path',       screen: 'Optimization',     color: '#006600', roles: ['farmer'] },
  { id: 'products',   label: 'Mes produits',    icon: 'cog',                   screen: 'ManageProducts',   color: '#006600', roles: ['farmer'] },
  { id: 'rec-orders', label: 'Commande',     icon: 'clipboard-list',        screen: 'ReceivedOrders',   color: '#006600', roles: ['farmer'] },
];

interface SecondaryMenuDrawerProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
}

export default function SecondaryMenuDrawer({
  visible,
  onClose,
  onNavigate,
}: SecondaryMenuDrawerProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  const isFarmer = user?.role === 'farmer';
  const userRole: 'farmer' | 'client' = isFarmer ? 'farmer' : 'client';

  const filteredItems = useMemo(
    () => SECONDARY_ITEMS.filter((item) => item.roles.includes('all') || item.roles.includes(userRole)),
    [userRole]
  );

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, friction: 9, tension: 120, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 9, tension: 120, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 100, duration: 200, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleItemPress = useCallback(
    (screen: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      onNavigate(screen);
      onClose();
    },
    [onNavigate, onClose]
  );

  const bottomOffset = Math.max(insets.bottom, 4) + 60;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.overlay, { opacity: opacityAnim }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.drawer,
            {
              backgroundColor: colors.glass,
              borderColor: colors.glassBorder,
              marginBottom: bottomOffset,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
        <View style={StyleSheet.absoluteFill}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 60 : 80}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
        </View>

        <View style={[styles.handle, { backgroundColor: colors.glassBorder }]} />

        <View style={styles.roleHeader}>
          <View style={[styles.roleBadge, { backgroundColor: isFarmer ? colors.primaryPale : '#FFF3E0' }]}>
            <MaterialCommunityIcons
              name={isFarmer ? 'leaf' : 'account'}
              size={14}
              color={isFarmer ? colors.primary : '#E67E22'}
            />
            <Text style={[styles.roleText, { color: isFarmer ? colors.primary : '#E67E22' }]}>
              {isFarmer ? 'Agriculteur' : 'Client'}
            </Text>
          </View>
          <Text style={[styles.drawerTitle, { color: colors.textSecondary }]}>
            Fonctionnalités
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.itemsContainer}
          bounces={false}
        >
          {filteredItems.map((item, index) => (
            <MenuChip
              key={item.id}
              item={item}
              onPress={() => handleItemPress(item.screen)}
              colors={colors}
              delay={index * 30}
            />
          ))}
        </ScrollView>
      </Animated.View>
      </View>
    </Modal>
  );
}

interface MenuChipProps {
  item: SecondaryMenuItem;
  onPress: () => void;
  colors: any;
  delay: number;
}

const MenuChip = React.memo(({ item, onPress, colors, delay }: MenuChipProps) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 150, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 60, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    onPress();
  }, [onPress, scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim }}>
      <Pressable style={styles.chip} onPress={handlePress}>
        <View style={[styles.chipIcon, { backgroundColor: `${item.color}18` }]}>
          <MaterialCommunityIcons name={item.icon as any} size={22} color={item.color} />
        </View>
        <Text style={[styles.chipLabel, { color: colors.text }]} numberOfLines={1}>
          {item.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  drawer: {
    marginHorizontal: 8,
    borderRadius: BORDER_RADIUS.LG,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    paddingBottom: 12,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: BORDER_RADIUS.FULL,
    alignSelf: 'center',
    marginBottom: 10,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.SCREEN_PADDING,
    marginBottom: 10,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.FULL,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  drawerTitle: {
    fontSize: TYPOGRAPHY.caption.fontSize,
    fontWeight: '500',
  },
  itemsContainer: {
    paddingHorizontal: SPACING.SCREEN_PADDING,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    alignItems: 'center',
    width: 72,
    paddingVertical: 6,
  },
  chipIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  chipLabel: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 13,
  },
});
