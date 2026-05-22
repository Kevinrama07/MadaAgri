import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Animated,
  Text,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../contexts/ThemeContext.jsx';
import { useAuth } from '../contexts/AuthContext';

// ── Navigation components ──────────────────────────────────────────────────
import BottomTabBar from './BottomTabBar';
import SecondaryMenuDrawer from './SecondaryMenuDrawer';

// ── Auth screens ───────────────────────────────────────────────────────────
import LandingScreen from '../screens/LandingScreen.tsx';
import LoginScreen from '../screens/LoginScreen.tsx';
import SignupScreen from '../screens/SignupScreen.tsx';

// ── Bottom tab screens ─────────────────────────────────────────────────────
import ModernFeedScreen from '../screens/ModernFeedScreen.tsx';
import InvitationsScreen from '../screens/InvitationsScreen.tsx';
import ModernMessagesScreen from '../screens/ModernMessagesScreen.tsx';
import ModernNotificationsScreen from '../screens/ModernNotificationsScreen.tsx';
import ModernProfileScreen from '../screens/ModernProfileScreen.tsx';

// ── Secondary menu screens ─────────────────────────────────────────────────
import WeatherScreen from '../screens/WeatherScreen.tsx';
import ModernMarketplaceScreen from '../screens/ModernMarketplaceScreen.tsx';
import MyOrdersScreen from '../screens/MyOrdersScreen.tsx';
import ReceivedOrdersScreen from '../screens/ReceivedOrdersScreen.tsx';
import FarmerMenuScreen from '../screens/FarmerMenuScreen.tsx';

// ── Detail / modal screens ─────────────────────────────────────────────────
import CreatePostScreen from '../screens/CreatePostScreen.tsx';
import ProductDetailScreen from '../screens/ProductDetailScreen.tsx';
import PostDetailScreen from '../screens/PostDetailScreen.tsx';
import UserProfileScreen from '../screens/UserProfileScreen.tsx';
import EditProfileScreen from '../screens/EditProfileScreen.tsx';
import SettingsScreen from '../screens/SettingsScreen.tsx';
import SearchScreen from '../screens/SearchScreen.tsx';
import CartDetailScreen from '../screens/CartDetailScreen.tsx';
import AddProductScreen from '../screens/AddProductScreen.tsx';
import EditProductScreen from '../screens/EditProductScreen.tsx';
import ChatDetailScreen from '../screens/ChatDetailScreen.tsx';

// ── Farmer-specific screens ────────────────────────────────────────────────
import CultureAnalysisScreen from '../screens/CultureAnalysisScreen.tsx';
import RouteOptimizationScreen from '../screens/RouteOptimizationScreen.tsx';
import MyProductsScreen from '../screens/MyProductsScreen.tsx';
import AIChatScreen from '../screens/AIChatScreen.tsx';
import DashboardAnalyticsScreen from '../screens/DashboardAnalyticsScreen.tsx';
import ParcelsScreen from '../screens/ParcelsScreen.tsx';
import AnalyzeImageScreen from '../screens/AnalyzeImageScreen.tsx';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

interface ChevronButtonProps {
  onPress: () => void;
  isOpen: boolean;
  colors: any;
  bottomOffset: number;
}

const ChevronButton = React.memo(({ onPress, isOpen, colors, bottomOffset }: ChevronButtonProps) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(rotateAnim, {
      toValue: isOpen ? 1 : 0,
      friction: 6,
      tension: 150,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chevronBtn,
        {
          bottom: bottomOffset + 8,
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: '#000',
        },
      ]}
      accessibilityLabel={isOpen ? 'Fermer le menu' : 'Ouvrir le menu secondaire'}
    >
      <Animated.View style={{ transform: [{ rotate }] }}>
        <MaterialCommunityIcons name="chevron-up" size={18} color={colors.primary} />
      </Animated.View>
    </Pressable>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN TABS
// ─────────────────────────────────────────────────────────────────────────────
function MainTabs({ navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);

  const isFarmer = user?.role === 'farmer';
  const tabBarHeight = Math.max(insets.bottom, 4) + 52;

  const handleSecondaryNavigate = useCallback(
    (screen: string) => {
      setMenuOpen(false);
      navigation.navigate(screen);
    },
    [navigation]
  );

  // Wrappers stables pour éviter les re-renders
  const FeedTab = useCallback(
    () => (
      <ModernFeedScreen
        onCreatePost={() => navigation.navigate('CreatePost')}
        onPostPress={(postId: string) => navigation.navigate('PostDetail', { postId })}
        onMoreMenuPress={() => navigation.navigate('Settings')}
        onAuthorPress={(id: string) => navigation.navigate('UserProfile', { userId: id })}
      />
    ),
    [navigation]
  );

  const InvitationsTab = useCallback(
    () => <InvitationsScreen navigation={navigation} />,
    [navigation]
  );

  const MessagesTab = useCallback(
    () => (
      <ModernMessagesScreen
        onConversationPress={(conversationId: string, participant: any) => 
          navigation.navigate('ChatDetail', { conversationId, participant })
        }
        onNewMessagePress={() => navigation.navigate('Search')}
        onMoreMenuPress={() => navigation.navigate('Settings')}
      />
    ),
    [navigation]
  );

  const NotificationsTab = useCallback(
    () => (
      <ModernNotificationsScreen
        onMarkAllAsRead={() => {}}
        onMoreMenuPress={() => navigation.navigate('Settings')}
      />
    ),
    [navigation]
  );

  const ProfileTab = useCallback(
    () => (
      <ModernProfileScreen
        onSettingsPress={() => navigation.navigate('Settings')}
        onEditPress={() => navigation.navigate('EditProfile')}
        onMoreMenuPress={() => navigation.navigate('Settings')}
        onPostPress={(postId: string) => navigation.navigate('PostDetail', { postId })}
        onAuthorPress={(id: string) => navigation.navigate('UserProfile', { userId: id })}
      />
    ),
    [navigation]
  );

  return (
    <>
      <Tab.Navigator
        tabBar={(props) => <BottomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Feed" component={FeedTab} options={{ tabBarLabel: 'Accueil' }} />
        <Tab.Screen
          name="Invitations"
          component={InvitationsTab}
          options={{ tabBarLabel: 'Invitations' }}
        />
        <Tab.Screen
          name="Messages"
          component={MessagesTab}
          options={{ tabBarLabel: 'Discussions' }}
        />
        <Tab.Screen
          name="Notifications"
          component={NotificationsTab}
          options={{ tabBarLabel: 'Notifs' }}
        />
        <Tab.Screen name="Profile" component={ProfileTab} options={{ tabBarLabel: 'Profil' }} />
      </Tab.Navigator>

      {/* Bouton chevron flottant */}
      <ChevronButton
        onPress={() => setMenuOpen((v) => !v)}
        isOpen={menuOpen}
        colors={colors}
        bottomOffset={tabBarHeight}
      />

      {/* Menu secondaire */}
      <SecondaryMenuDrawer
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={handleSecondaryNavigate}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT NAVIGATOR
// ─────────────────────────────────────────────────────────────────────────────
function RootNavigator() {
  const { isAuthenticated, user } = useAuth();
  const isFarmer = user?.role === 'farmer';

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      {!isAuthenticated ? (
        // ── Auth ──────────────────────────────────────────────────────────
        <>
          <Stack.Screen name="Landing" component={LandingScreen} options={{ animationEnabled: false }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="Signup" component={SignupScreen} options={{ animation: 'slide_from_bottom' }} />
        </>
      ) : (
        // ── Authenticated ─────────────────────────────────────────────────
        <>
          {/* Navigation principale */}
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ animationEnabled: false }} />

          {/* ── Modaux ──────────────────────────────────────────────────── */}
          <Stack.Screen
            name="CreatePost"
            component={CreatePostScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="Search"
            component={SearchScreen}
            options={{ presentation: 'modal', animation: 'fade' }}
          />
          <Stack.Screen
            name="CartDetail"
            component={CartDetailScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />

          {/* ── Détails ─────────────────────────────────────────────────── */}
          <Stack.Screen name="PostDetail" component={PostDetailScreen} />
          <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
          <Stack.Screen name="UserProfile" component={UserProfileScreen} />
          <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />

          {/* ── Menu secondaire commun ───────────────────────────────────── */}
          <Stack.Screen name="Weather" component={WeatherScreen} />

          {/* ── Tous les utilisateurs ────────────────────────────────────── */}
          <Stack.Screen name="AIChat" component={AIChatScreen} />
          <Stack.Screen name="DashboardAnalytics" component={DashboardAnalyticsScreen} />
          <Stack.Screen name="Parcels" component={ParcelsScreen} />
          <Stack.Screen name="AnalyzeImage" component={AnalyzeImageScreen} />

          {/* ── Client uniquement ────────────────────────────────────────── */}
          {!isFarmer && (
            <>
              <Stack.Screen name="Marketplace" component={ModernMarketplaceScreen} />
              <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
            </>
          )}

          {/* ── Agriculteur uniquement ───────────────────────────────────── */}
          {isFarmer && (
            <>
              <Stack.Screen name="ReceivedOrders" component={ReceivedOrdersScreen} />
              <Stack.Screen name="AddProduct" component={AddProductScreen} />
              <Stack.Screen name="EditProduct" component={EditProductScreen} />
              <Stack.Screen
                name="Analysis"
                component={CultureAnalysisScreen}
              />
              <Stack.Screen
                name="Optimization"
                component={RouteOptimizationScreen}
              />
              <Stack.Screen
                name="ManageProducts"
                component={MyProductsScreen}
              />
              <Stack.Screen name="FarmerMenu" component={FarmerMenuScreen} />
            </>
          )}
        </>
      )}
    </Stack.Navigator>
  );
}

export default RootNavigator;

const styles = StyleSheet.create({
  chevronBtn: {
    position: 'absolute',
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    zIndex: 100,
  },
});
