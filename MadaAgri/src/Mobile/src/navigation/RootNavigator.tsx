import React, { useState, useCallback, Suspense } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useAuth } from '../contexts/AuthContext';
import { SPACING } from '../theme';
import TopTabBar from './TopTabBar';
import SecondaryMenuDrawer from './SecondaryMenuDrawer';

// ── Lazy-loaded screens ─────────────────────────────────────────
const LandingScreen = React.lazy(() => import('../screens/LandingScreen'));
const LoginScreen = React.lazy(() => import('../screens/LoginScreen'));
const SignupScreen = React.lazy(() => import('../screens/SignupScreen'));

const ModernFeedScreen = React.lazy(() => import('../screens/ModernFeedScreen'));
const InvitationsScreen = React.lazy(() => import('../screens/InvitationsScreen'));
const ModernMessagesScreen = React.lazy(() => import('../screens/ModernMessagesScreen'));
const ModernNotificationsScreen = React.lazy(() => import('../screens/ModernNotificationsScreen'));
const ModernProfileScreen = React.lazy(() => import('../screens/ModernProfileScreen'));

const WeatherScreen = React.lazy(() => import('../screens/WeatherScreen'));
const ModernMarketplaceScreen = React.lazy(() => import('../screens/ModernMarketplaceScreen'));
const MyOrdersScreen = React.lazy(() => import('../screens/MyOrdersScreen'));
const ReceivedOrdersScreen = React.lazy(() => import('../screens/ReceivedOrdersScreen'));
const FarmerMenuScreen = React.lazy(() => import('../screens/FarmerMenuScreen'));

const CreatePostScreen = React.lazy(() => import('../screens/CreatePostScreen'));
const ProductDetailScreen = React.lazy(() => import('../screens/ProductDetailScreen'));
const PostDetailScreen = React.lazy(() => import('../screens/PostDetailScreen'));
const UserProfileScreen = React.lazy(() => import('../screens/UserProfileScreen'));
const EditProfileScreen = React.lazy(() => import('../screens/EditProfileScreen'));
const SettingsScreen = React.lazy(() => import('../screens/SettingsScreen'));
const SearchScreen = React.lazy(() => import('../screens/SearchScreen'));
const CartDetailScreen = React.lazy(() => import('../screens/CartDetailScreen'));
const AddProductScreen = React.lazy(() => import('../screens/AddProductScreen'));
const EditProductScreen = React.lazy(() => import('../screens/EditProductScreen'));
const ChatDetailScreen = React.lazy(() => import('../screens/ChatDetailScreen'));

const CultureAnalysisScreen = React.lazy(() => import('../screens/CultureAnalysisScreen'));
const RouteOptimizationScreen = React.lazy(() => import('../screens/RouteOptimizationScreen'));
const MyProductsScreen = React.lazy(() => import('../screens/MyProductsScreen'));
const AIChatScreen = React.lazy(() => import('../screens/AIChatScreen'));
const DashboardAnalyticsScreen = React.lazy(() => import('../screens/DashboardAnalyticsScreen'));
const ParcelsScreen = React.lazy(() => import('../screens/ParcelsScreen'));
const AnalyzeImageScreen = React.lazy(() => import('../screens/AnalyzeImageScreen'));

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function ScreenFallback() {
  const { colors } = useTheme();
  return (
    <View style={styles.fallback}>
      <ActivityIndicator size="large" color={colors?.primary || '#4CAF50'} />
    </View>
  );
}

function MainTabs({ navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const isFarmer = user?.role === 'farmer';

  const handleSecondaryNavigate = useCallback(
    (screen: string) => {
      setMenuOpen(false);
      navigation.navigate(screen);
    },
    [navigation]
  );

  const FeedTab = useCallback(
    () => (
      <Suspense fallback={<ScreenFallback />}>
        <ModernFeedScreen
          onCreatePost={() => navigation.navigate('CreatePost')}
          onPostPress={(postId: string) => navigation.navigate('PostDetail', { postId })}
          onMoreMenuPress={() => navigation.navigate('Settings')}
          onAuthorPress={(id: string) => navigation.navigate('UserProfile', { userId: id })}
        />
      </Suspense>
    ),
    [navigation]
  );

  const InvitationsTab = useCallback(
    () => (
      <Suspense fallback={<ScreenFallback />}>
        <InvitationsScreen navigation={navigation} />
      </Suspense>
    ),
    [navigation]
  );

  const MessagesTab = useCallback(
    () => (
      <Suspense fallback={<ScreenFallback />}>
        <ModernMessagesScreen
          onConversationPress={(conversationId: string, participant: any) =>
            navigation.navigate('ChatDetail', { conversationId, participant })
          }
          onNewMessagePress={() => navigation.navigate('Search')}
          onMoreMenuPress={() => navigation.navigate('Settings')}
        />
      </Suspense>
    ),
    [navigation]
  );

  const NotificationsTab = useCallback(
    () => (
      <Suspense fallback={<ScreenFallback />}>
        <ModernNotificationsScreen
          onMarkAllAsRead={() => {}}
          onMoreMenuPress={() => navigation.navigate('Settings')}
        />
      </Suspense>
    ),
    [navigation]
  );

  const ProfileTab = useCallback(
    () => (
      <Suspense fallback={<ScreenFallback />}>
        <ModernProfileScreen
          onSettingsPress={() => navigation.navigate('Settings')}
          onEditPress={() => navigation.navigate('EditProfile')}
          onMoreMenuPress={() => navigation.navigate('Settings')}
          onPostPress={(postId: string) => navigation.navigate('PostDetail', { postId })}
          onAuthorPress={(id: string) => navigation.navigate('UserProfile', { userId: id })}
        />
      </Suspense>
    ),
    [navigation]
  );

  return (
    <View style={[styles.mainTabs, { backgroundColor: colors?.background }]}>
      <TopTabBar onMenuToggle={() => setMenuOpen((v) => !v)} menuOpen={menuOpen} />
      <View style={styles.tabContent}>
        <Tab.Navigator tabBar={() => null} screenOptions={{ headerShown: false }}>
          <Tab.Screen name="Feed" component={FeedTab} />
          <Tab.Screen name="Invitations" component={InvitationsTab} />
          <Tab.Screen name="Messages" component={MessagesTab} />
          <Tab.Screen name="Notifications" component={NotificationsTab} />
          <Tab.Screen name="Profile" component={ProfileTab} />
        </Tab.Navigator>
      </View>
      <SecondaryMenuDrawer
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={handleSecondaryNavigate}
      />
    </View>
  );
}

function RootNavigator() {
  const { isAuthenticated, user } = useAuth();
  const isFarmer = user?.role === 'farmer';

  return (
    <Suspense fallback={<ScreenFallback />}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Landing" component={LandingScreen} options={{ animationEnabled: false }} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="Signup" component={SignupScreen} options={{ animation: 'slide_from_bottom' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} options={{ animationEnabled: false }} />
            <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="Search" component={SearchScreen} options={{ presentation: 'modal', animation: 'fade' }} />
            <Stack.Screen name="CartDetail" component={CartDetailScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="PostDetail" component={PostDetailScreen} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} />
            <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Weather" component={WeatherScreen} />
            <Stack.Screen name="AIChat" component={AIChatScreen} />
            <Stack.Screen name="DashboardAnalytics" component={DashboardAnalyticsScreen} />
            <Stack.Screen name="Parcels" component={ParcelsScreen} />
            <Stack.Screen name="AnalyzeImage" component={AnalyzeImageScreen} />
            {(!isFarmer || !user) && (
              <>
                <Stack.Screen name="Marketplace" component={ModernMarketplaceScreen} />
                <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
              </>
            )}
            {(isFarmer && user) && (
              <>
                <Stack.Screen name="ReceivedOrders" component={ReceivedOrdersScreen} />
                <Stack.Screen name="AddProduct" component={AddProductScreen} />
                <Stack.Screen name="EditProduct" component={EditProductScreen} />
                <Stack.Screen name="Analysis" component={CultureAnalysisScreen} />
                <Stack.Screen name="Optimization" component={RouteOptimizationScreen} />
                <Stack.Screen name="ManageProducts" component={MyProductsScreen} />
                <Stack.Screen name="FarmerMenu" component={FarmerMenuScreen} />
              </>
            )}
          </>
        )}
      </Stack.Navigator>
    </Suspense>
  );
}

export default RootNavigator;

const styles = StyleSheet.create({
  mainTabs: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
