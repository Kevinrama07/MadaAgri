import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { dataApi } from '../lib/api';
import apiClient from '../services/apiClient';
import { ScreenHeader } from '../components/ScreenHeader';
import { ModernCard } from '../components/ModernCard';
import BarChart from '../components/BarChart';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

function StatCard({ icon, label, value, color, accent }) {
  const { colors } = useTheme();
  return (
    <ModernCard style={[styles.statCard, { borderLeftColor: accent || color || colors.primary }]} shadow="subtle">
      <View style={[styles.statIcon, { backgroundColor: (accent || color || colors.primary) + '18' }]}>
        <MaterialCommunityIcons name={icon} size={22} color={accent || color || colors.primary} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value ?? '—'}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </ModernCard>
  );
}

export default function DashboardAnalyticsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation(['dashboard', 'common']);
  const isFarmer = user?.role === 'farmer';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    revenue: 0,
    receivedOrders: 0,
    myOrders: 0,
    products: 0,
    availableProducts: 0,
    followers: 0,
    following: 0,
    collaborations: 0,
    posts: 0,
    likes: 0,
    comments: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [revenueData, setRevenueData] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const userId = user?.id;
      if (!userId) return;

      const [receivedOrdersRes, myOrdersRes, productsRes, userPosts, notifStats] = await Promise.allSettled([
        isFarmer ? dataApi.getReceivedOrders() : Promise.resolve([]),
        dataApi.getMyOrders(),
        isFarmer ? dataApi.getMyProducts('all') : Promise.resolve([]),
        dataApi.fetchUserPosts(userId),
        apiClient.get('/notifications/stats').catch(() => ({ data: { stats: {} } })),
      ]);

      const receivedOrders = receivedOrdersRes.status === 'fulfilled' ? receivedOrdersRes.value : [];
      const myOrders = myOrdersRes.status === 'fulfilled' ? myOrdersRes.value : [];
      const products = productsRes.status === 'fulfilled' ? productsRes.value : [];
      const posts = userPosts.status === 'fulfilled' ? userPosts.value : [];
      const notifStatsData = notifStats.status === 'fulfilled' ? notifStats.value?.data?.stats || {} : {};

      const totalRevenue = Array.isArray(receivedOrders)
        ? receivedOrders.reduce((sum, o) => sum + (parseFloat(o.total_price) || 0), 0)
        : 0;

      setStats({
        revenue: totalRevenue,
        receivedOrders: Array.isArray(receivedOrders) ? receivedOrders.length : 0,
        myOrders: Array.isArray(myOrders) ? myOrders.length : 0,
        products: Array.isArray(products) ? products.length : 0,
        availableProducts: Array.isArray(products) ? products.filter((p) => p.is_available !== false).length : 0,
        followers: user?.followers_count || 0,
        following: user?.following_count || 0,
        collaborations: user?.collaborations_count || 0,
        posts: Array.isArray(posts) ? posts.length : 0,
        likes: notifStatsData.likes || 0,
        comments: notifStatsData.comments || 0,
      });

      if (isFarmer && Array.isArray(receivedOrders)) {
        const dailyMap = {};
        receivedOrders.forEach((o) => {
          const date = o.created_at ? o.created_at.split('T')[0] : 'unknown';
          dailyMap[date] = (dailyMap[date] || 0) + (parseFloat(o.total_price) || 0);
        });
        const sorted = Object.entries(dailyMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-7)
          .map(([date, value]) => ({
            label: date?.slice(5) || '',
            value,
            color: colors.primary,
          }));
        setRevenueData(sorted);
        setRecentOrders(receivedOrders.slice(-5).reverse());
      } else {
        setRecentOrders(Array.isArray(myOrders) ? myOrders.slice(-5).reverse() : []);
      }
    } catch (err) {
      console.error('[DashboardAnalytics] fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, isFarmer, colors.primary]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const formatPrice = (val) => {
    const num = parseFloat(val) || 0;
    return num.toLocaleString() + ' Ar';
  };

  const today = new Date().toLocaleDateString();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.primaryBackground }]}>
      <ScreenHeader
        title={t('title') || 'Tableau de bord'}
        showBack={true}
        onBackPress={() => navigation.goBack()}
        showMenu={false}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.greeting, { color: colors.text }]}>
            {t('greeting', { name: user?.name?.split(' ')[0] || '' }) || `Bonjour, ${user?.name?.split(' ')[0] || ''}`}
          </Text>
          <Text style={[styles.date, { color: colors.textSecondary }]}>{today}</Text>

          <View style={styles.statsGrid}>
            {isFarmer ? (
              <>
                <StatCard icon="cash" label={t('totalRevenue') || 'Revenus'} value={formatPrice(stats.revenue)} color={colors.success} />
                <StatCard icon="clipboard-list" label={t('totalOrders') || 'Commandes reçues'} value={stats.receivedOrders} color={colors.primary} />
                <StatCard icon="package-variant" label={t('availableProducts') || 'Produits dispo'} value={stats.availableProducts + '/' + stats.products} color={colors.warning} />
                <StatCard icon="account-group" label={t('totalFollowers') || 'Abonnés'} value={stats.followers} color="#8B5CF6" />
              </>
            ) : (
              <>
                <StatCard icon="clipboard-list" label={t('totalOrders') || 'Mes commandes'} value={stats.myOrders} color={colors.primary} />
                <StatCard icon="shopping" label={t('totalProducts') || 'Produits'} value={stats.products} color={colors.warning} />
                <StatCard icon="account-group" label={t('totalFollowers') || 'Abonnés'} value={stats.followers} color="#8B5CF6" />
                <StatCard icon="account-check" label={t('totalFollowing') || 'Abonnements'} value={stats.following} color="#F59E0B" />
              </>
            )}
          </View>

          <View style={styles.secondaryGrid}>
            <StatCard icon="post" label={t('totalPosts') || 'Publications'} value={stats.posts} color="#3B82F6" accent="#3B82F6" />
            <StatCard icon="heart" label={t('totalLikes') || 'J\'aime'} value={stats.likes} color="#EF4444" accent="#EF4444" />
            <StatCard icon="comment-text" label={t('totalComments') || 'Commentaires'} value={stats.comments} color="#10B981" accent="#10B981" />
            <StatCard icon="handshake" label={t('totalCollaborators') || 'Collaborateurs'} value={stats.collaborations} color="#F59E0B" accent="#F59E0B" />
          </View>

          {isFarmer && revenueData.length > 0 && (
            <ModernCard style={styles.chartCard} shadow="subtle">
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('revenueChart') || 'Revenus (7 jours)'}
              </Text>
              <BarChart data={revenueData} color={colors.primary} />
            </ModernCard>
          )}

          {recentOrders.length > 0 && (
            <ModernCard style={styles.chartCard} shadow="subtle">
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('recentOrders') || 'Dernières commandes'}
              </Text>
              {recentOrders.map((order, i) => (
                <View key={order.id || i} style={[styles.orderItem, i < recentOrders.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                  <View style={styles.orderLeft}>
                    <Text style={[styles.orderTitle, { color: colors.text }]} numberOfLines={1}>
                      {order.items?.[0]?.product_title || `#${order.id?.slice(0, 8) || i}`}
                    </Text>
                    <Text style={[styles.orderStatus, { color: colors.textSecondary }]}>
                      {order.status || 'pending'}
                    </Text>
                  </View>
                  <Text style={[styles.orderPrice, { color: colors.primary }]}>
                    {formatPrice(order.total_price)}
                  </Text>
                </View>
              ))}
            </ModernCard>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: SPACING.SCREEN_PADDING },
  greeting: { fontSize: TYPOGRAPHY.h2.fontSize, fontWeight: '700', marginBottom: 2 },
  date: { fontSize: TYPOGRAPHY.caption.fontSize, marginBottom: SPACING.LG },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  secondaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: SPACING.LG,
  },
  statCard: {
    width: (SCREEN_WIDTH - SPACING.SCREEN_PADDING * 2 - 10) / 2 - 5,
    padding: SPACING.LG,
    borderLeftWidth: 3,
    borderRadius: BORDER_RADIUS.DEFAULT,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: { fontSize: TYPOGRAPHY.h2.fontSize, fontWeight: '700', marginBottom: 2 },
  statLabel: { fontSize: TYPOGRAPHY.caption.fontSize, fontWeight: '500' },

  chartCard: {
    padding: SPACING.LG,
    borderRadius: BORDER_RADIUS.DEFAULT,
    marginBottom: SPACING.LG,
  },
  sectionTitle: { fontSize: TYPOGRAPHY.h3.fontSize, fontWeight: '600', marginBottom: SPACING.MD },

  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.SM + 2,
  },
  orderLeft: { flex: 1, marginRight: 12 },
  orderTitle: { fontSize: TYPOGRAPHY.body.fontSize, fontWeight: '500' },
  orderStatus: { fontSize: TYPOGRAPHY.caption.fontSize, marginTop: 2, textTransform: 'capitalize' },
  orderPrice: { fontSize: TYPOGRAPHY.h3.fontSize, fontWeight: '700' },
});
