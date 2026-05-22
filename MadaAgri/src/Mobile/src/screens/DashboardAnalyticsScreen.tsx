import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { dataApi } from '../lib/api';
import { ScreenHeader } from '../components/ScreenHeader';
import { ModernCard } from '../components/ModernCard';
import BarChart from '../components/BarChart';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = 10;
const CARD_WIDTH = (SCREEN_WIDTH - SPACING.SCREEN_PADDING * 2 - CARD_GAP) / 2 - 1;

const PERIODS = [
  { key: '7d', label: '7 jours' },
  { key: '30d', label: '30 jours' },
  { key: '12m', label: '12 mois' },
];

function formatPrice(val: number) {
  if (val >= 1000000) return (val / 1000000).toFixed(1) + ' M';
  if (val >= 1000) return (val / 1000).toFixed(1) + ' k';
  return val.toLocaleString();
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  const { colors } = useTheme();
  return (
    <ModernCard style={[styles.statCard, { borderLeftColor: color }]} variant="glass" padding={SPACING.LG} shadow="subtle">
      <View style={[styles.statIcon, { backgroundColor: color + '18' }]}>
        <MaterialCommunityIcons name={icon as any} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value ?? '—'}</Text>
      <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{label}</Text>
    </ModernCard>
  );
}

export default function DashboardAnalyticsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const isFarmer = user?.role === 'farmer';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartPeriod, setChartPeriod] = useState('7d');

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
    views: 0,
  });

  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const userId = user?.id;
      if (!userId) return;

      const [receivedRes, myOrdersRes, productsRes, postsRes] = await Promise.allSettled([
        dataApi.getReceivedOrders(),
        dataApi.getMyOrders(),
        dataApi.getMyProducts('all'),
        dataApi.fetchUserPosts(userId),
      ]);

      const receivedOrders = receivedRes.status === 'fulfilled' ? (receivedRes.value || []) : [];
      const myOrders = myOrdersRes.status === 'fulfilled' ? (myOrdersRes.value || []) : [];
      const products = productsRes.status === 'fulfilled' ? (productsRes.value || []) : [];
      const posts = postsRes.status === 'fulfilled' ? (postsRes.value || []) : [];

      const totalRevenue = receivedOrders.reduce(
        (sum: number, o: any) => sum + (parseFloat(o.unit_price || 0) * (o.quantity || 0)), 0
      );

      const totalLikes = posts.reduce((sum: number, p: any) => sum + (p.likes_count || 0), 0);
      const totalComments = posts.reduce((sum: number, p: any) => sum + (p.comments_count || 0), 0);
      const totalViews = posts.reduce((sum: number, p: any) => sum + (p.video_views || 0), 0);

      setStats({
        revenue: totalRevenue,
        receivedOrders: receivedOrders.length,
        myOrders: myOrders.length,
        products: products.length,
        availableProducts: products.filter((p: any) => p.is_available !== false).length,
        followers: user?.followers_count || 0,
        following: user?.following_count || 0,
        collaborations: user?.collaborations_count || 0,
        posts: posts.length,
        likes: totalLikes,
        comments: totalComments,
        views: totalViews,
      });

      setAllOrders(isFarmer ? receivedOrders : myOrders);

      const sortedRecent = [...receivedOrders]
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      setRecentOrders(sortedRecent);

      const sortedPosts = [...posts]
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      setRecentPosts(sortedPosts);
    } catch (err) {
      console.error('[Dashboard] fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, isFarmer]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const chartData = useMemo(() => {
    if (allOrders.length === 0) return [];

    switch (chartPeriod) {
      case '7d': {
        const map: Record<string, number> = {};
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          map[d.toISOString().split('T')[0]] = 0;
        }
        allOrders.forEach((o: any) => {
          const day = o.created_at?.split('T')[0];
          if (day && map[day] !== undefined) {
            map[day] += parseFloat(o.unit_price || 0) * (o.quantity || 0);
          }
        });
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        return Object.entries(map).map(([date, val]) => ({
          label: days[new Date(date).getDay()] || date.slice(5),
          value: val,
          color: colors.primary,
        }));
      }
      case '30d': {
        const map: Record<string, number> = {};
        const now = new Date();
        for (let i = 29; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const key = d.toISOString().split('T')[0];
          map[key] = 0;
        }
        allOrders.forEach((o: any) => {
          const day = o.created_at?.split('T')[0];
          if (day && map[day] !== undefined) {
            map[day] += parseFloat(o.unit_price || 0) * (o.quantity || 0);
          }
        });
        return Object.entries(map)
          .filter((_, i) => i % 5 === 0 || i === 29 || i === 0)
          .map(([date, val]) => ({
            label: date.slice(5),
            value: val,
            color: colors.primary,
          }));
      }
      case '12m': {
        const map: Record<string, number> = {};
        const now = new Date();
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          map[key] = 0;
        }
        allOrders.forEach((o: any) => {
          if (!o.created_at) return;
          const key = o.created_at.slice(0, 7);
          if (map[key] !== undefined) {
            map[key] += parseFloat(o.unit_price || 0) * (o.quantity || 0);
          }
        });
        return Object.entries(map).map(([ym, val]) => {
          const mIdx = parseInt(ym.slice(5), 10) - 1;
          return { label: months[mIdx] || ym.slice(5), value: val, color: colors.primary };
        });
      }
      default:
        return [];
    }
  }, [allOrders, chartPeriod, colors.primary]);

  const chartSummary = useMemo(() => {
    if (chartData.length === 0) return { total: 0, avg: 0, peak: 0 };
    const values = chartData.map((d) => d.value);
    const total = values.reduce((a, b) => a + b, 0);
    return { total, avg: Math.round(total / values.length), peak: Math.max(...values) };
  }, [chartData]);

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  if (loading) {
    return (
      <SafeAreaView edges={["left", "right", "bottom"]} style={[styles.container, { backgroundColor: colors.primaryBackground }]}>
        <ScreenHeader title="Tableau de bord" showBack onBackPress={() => navigation.goBack()} showMenu={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={[styles.container, { backgroundColor: colors.primaryBackground }]}>
      <ScreenHeader title="Tableau de bord" showBack onBackPress={() => navigation.goBack()} showMenu={false} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.greeting, { color: colors.text }]}>
          Bonjour, {user?.name?.split(' ')[0] || ''}
        </Text>
        <Text style={[styles.date, { color: colors.textTertiary }]}>{today}</Text>

        {/* ── Stats principales ── */}
        <View style={styles.statsGrid}>
          {isFarmer ? (
            <>
              <StatCard icon="cash" label="Revenus" value={formatPrice(stats.revenue) + ' Ar'} color="#10B981" />
              <StatCard icon="clipboard-list" label="Commandes reçues" value={stats.receivedOrders} color="#3B82F6" />
              <StatCard icon="package-variant" label="Produits actifs" value={`${stats.availableProducts}/${stats.products}`} color="#F59E0B" />
              <StatCard icon="account-group" label="Abonnés" value={stats.followers} color="#8B5CF6" />
            </>
          ) : (
            <>
              <StatCard icon="clipboard-list" label="Mes commandes" value={stats.myOrders} color="#3B82F6" />
              <StatCard icon="account-group" label="Abonnés" value={stats.followers} color="#8B5CF6" />
              <StatCard icon="account-check" label="Abonnements" value={stats.following} color="#F59E0B" />
              <StatCard icon="handshake" label="Collaborateurs" value={stats.collaborations} color="#10B981" />
            </>
          )}
        </View>

        {/* ── Stats engagement ── */}
        <View style={styles.statsGrid}>
          <StatCard icon="post-outline" label="Publications" value={stats.posts} color="#3B82F6" />
          <StatCard icon="heart-outline" label="J'aime" value={stats.likes} color="#EF4444" />
          <StatCard icon="comment-outline" label="Commentaires" value={stats.comments} color="#10B981" />
          <StatCard icon="eye-outline" label="Vues" value={stats.views} color="#F59E0B" />
        </View>

        {/* ── Graphique revenus (agriculteurs) ── */}
        {isFarmer && chartData.length > 0 && (
          <ModernCard variant="glass" padding={SPACING.LG} shadow="subtle" style={styles.chartCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Revenus</Text>

            <View style={styles.periodRow}>
              {PERIODS.map((p) => (
                <Pressable
                  key={p.key}
                  style={[
                    styles.periodPill,
                    {
                      backgroundColor: chartPeriod === p.key ? colors.primary : colors.glass,
                      borderColor: chartPeriod === p.key ? colors.primary : colors.glassBorder,
                    },
                  ]}
                  onPress={() => setChartPeriod(p.key)}
                >
                  <Text
                    style={[
                      styles.periodLabel,
                      { color: chartPeriod === p.key ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <BarChart data={chartData} color={colors.primary} barWidth={chartPeriod === '12m' ? 16 : 22} />

            <View style={styles.chartSummaryRow}>
              <View style={styles.chartSummaryItem}>
                <Text style={[styles.chartSummaryValue, { color: colors.text }]}>{chartSummary.total.toLocaleString()} Ar</Text>
                <Text style={[styles.chartSummaryLabel, { color: colors.textTertiary }]}>Total</Text>
              </View>
              <View style={styles.chartSummaryItem}>
                <Text style={[styles.chartSummaryValue, { color: colors.text }]}>{chartSummary.avg.toLocaleString()} Ar</Text>
                <Text style={[styles.chartSummaryLabel, { color: colors.textTertiary }]}>Moyenne</Text>
              </View>
              <View style={styles.chartSummaryItem}>
                <Text style={[styles.chartSummaryValue, { color: colors.text }]}>{chartSummary.peak.toLocaleString()} Ar</Text>
                <Text style={[styles.chartSummaryLabel, { color: colors.textTertiary }]}>Pic</Text>
              </View>
            </View>
          </ModernCard>
        )}

        {/* ── Commandes récentes ── */}
        {recentOrders.length > 0 && (
          <ModernCard variant="glass" padding={SPACING.LG} shadow="subtle" style={styles.chartCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {isFarmer ? 'Dernières commandes reçues' : 'Mes dernières commandes'}
            </Text>
            {recentOrders.map((order, i) => (
              <View
                key={order.id || i}
                style={[
                  styles.orderItem,
                  i < recentOrders.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.glassBorder,
                  },
                ]}
              >
                <View style={styles.orderLeft}>
                  <Text style={[styles.orderTitle, { color: colors.text }]} numberOfLines={1}>
                    {order.items?.[0]?.product_title || `Commande #${String(order.id).slice(0, 8) || i + 1}`}
                  </Text>
                  <Text style={[styles.orderStatus, { color: colors.textTertiary }]}>
                    {order.status === 'confirmed' ? 'Confirmée' :
                     order.status === 'completed' ? 'Terminée' :
                     order.status === 'cancelled' ? 'Annulée' :
                     order.status === 'pending' ? 'En attente' : order.status || '—'}
                  </Text>
                </View>
                <Text style={[styles.orderPrice, { color: colors.primary }]}>
                  {formatPrice(parseFloat(order.unit_price || 0) * (order.quantity || 0))} Ar
                </Text>
              </View>
            ))}
          </ModernCard>
        )}

        {/* ── Activité récente (publications) ── */}
        {recentPosts.length > 0 && (
          <ModernCard variant="glass" padding={SPACING.LG} shadow="subtle" style={styles.chartCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Activité récente</Text>
            {recentPosts.map((post, i) => (
              <View
                key={post.id || i}
                style={[
                  styles.activityItem,
                  i < recentPosts.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.glassBorder,
                  },
                ]}
              >
                <View style={styles.activityIcon}>
                  <MaterialCommunityIcons
                    name={post.image_url ? 'image-outline' : post.video_url ? 'video-outline' : 'text'}
                    size={18}
                    color={colors.textTertiary}
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={[styles.activityText, { color: colors.text }]} numberOfLines={2}>
                    {post.content || 'Publication'}
                  </Text>
                  <Text style={[styles.activityMeta, { color: colors.textTertiary }]}>
                    {post.likes_count || 0} j'aime · {post.comments_count || 0} commentaires
                    {post.created_at ? ` · ${new Date(post.created_at).toLocaleDateString('fr-FR')}` : ''}
                  </Text>
                </View>
              </View>
            ))}
          </ModernCard>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: SPACING.SCREEN_PADDING },
  greeting: { fontSize: TYPOGRAPHY.h2.fontSize, fontWeight: '700', marginBottom: 2 },
  date: { fontSize: TYPOGRAPHY.caption.fontSize, marginBottom: SPACING.LG, textTransform: 'capitalize' },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  statCard: {
    width: CARD_WIDTH,
    borderLeftWidth: 3,
    borderRadius: BORDER_RADIUS.DEFAULT,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: TYPOGRAPHY.h3.fontSize, fontWeight: '700', marginBottom: 1 },
  statLabel: { fontSize: TYPOGRAPHY.caption.fontSize, fontWeight: '500' },

  chartCard: {
    borderRadius: BORDER_RADIUS.DEFAULT,
    marginBottom: SPACING.LG,
  },
  sectionTitle: { fontSize: TYPOGRAPHY.h3.fontSize, fontWeight: '600', marginBottom: SPACING.MD },

  periodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.MD,
  },
  periodPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.FULL,
    borderWidth: 1,
  },
  periodLabel: { fontSize: 12, fontWeight: '600' },

  chartSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.MD,
    paddingTop: SPACING.MD,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150,150,150,0.2)',
  },
  chartSummaryItem: { alignItems: 'center' },
  chartSummaryValue: { fontSize: TYPOGRAPHY.h3.fontSize, fontWeight: '700' },
  chartSummaryLabel: { fontSize: TYPOGRAPHY.caption.fontSize, marginTop: 2 },

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

  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.SM + 2,
    gap: 10,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(150,150,150,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  activityContent: { flex: 1 },
  activityText: { fontSize: TYPOGRAPHY.body.fontSize, lineHeight: 20 },
  activityMeta: { fontSize: TYPOGRAPHY.caption.fontSize, marginTop: 4 },
});
