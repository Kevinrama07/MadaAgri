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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../theme';

interface SecondaryMenuItem {
  id: string;
  label: string;
  icon: string;
  screen: string;
  color: string;
  roles: ('farmer' | 'client' | 'all')[];
}

const SECONDARY_ITEMS: SecondaryMenuItem[] = [
  // Commun
  { id: 'dashboard',    label: 'Dashboard',     icon: 'view-dashboard',      screen: 'DashboardAnalytics', color: '#10B981', roles: ['all'] },
  { id: 'ai-assistant', label: 'Assistant IA', icon: 'robot',              screen: 'AIChat',              color: '#8B5CF6', roles: ['all'] },
  { id: 'parcels',      label: 'Parcelles',    icon: 'terrain',            screen: 'Parcels',             color: '#22C55E', roles: ['farmer', 'client'] },
  { id: 'analyze-img',  label: 'Analyse Photo', icon: 'image-auto',       screen: 'AnalyzeImage',        color: '#F59E0B', roles: ['all'] },
  { id: 'weather',      label: 'Météo',         icon: 'weather-partly-cloudy',  screen: 'Weather',          color: '#4A90E2', roles: ['all'] },

  // Client uniquement
  { id: 'market',     label: 'Marketplace',     icon: 'shopping',              screen: 'Marketplace',      color: '#E67E22', roles: ['client'] },
  { id: 'orders',     label: 'Mes commandes',   icon: 'package-variant',       screen: 'MyOrders',         color: '#9B59B6', roles: ['client'] },

  // Agriculteur uniquement
  { id: 'analysis',   label: 'Analyse',         icon: 'chart-line',            screen: 'Analysis',         color: '#27AE60', roles: ['farmer'] },
  { id: 'routes',     label: 'Itinéraires',     icon: 'map-marker-path',       screen: 'Optimization',     color: '#E74C3C', roles: ['farmer'] },
  { id: 'products',   label: 'Mes produits',    icon: 'cog',                   screen: 'ManageProducts',   color: '#F39C12', roles: ['farmer'] },
  { id: 'rec-orders', label: 'Cmd. reçues',     icon: 'clipboard-list',        screen: 'ReceivedOrders',   color: '#16A085', roles: ['farmer'] },
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
  const slideAnim = useRef(new Animated.Value(120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const isFarmer = user?.role === 'farmer';
  const userRole: 'farmer' | 'client' = isFarmer ? 'farmer' : 'client';

  const filteredItems = useMemo(
    () => SECONDARY_ITEMS.filter((item) => item.roles.includes('all') || item.roles.includes(userRole)),
    [userRole]
  );

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 100, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 120, duration: 180, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleItemPress = useCallback(
    (screen: string) => {
      onNavigate(screen);
      onClose();
    },
    [onNavigate, onClose]
  );

  const bottomOffset = Math.max(insets.bottom, 4) + 52 + 8; // hauteur tabbar + gap

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: opacityAnim }]} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.drawer,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            bottom: bottomOffset,
            transform: [{ translateY: slideAnim }],
            shadowColor: '#000',
          },
        ]}
      >
        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        {/* Titre rôle */}
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

        {/* Items horizontaux */}
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  drawer: {
    position: 'absolute',
    left: 8,
    right: 8,
    borderRadius: BORDER_RADIUS.LG,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    paddingBottom: 12,
    elevation: 16,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
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
