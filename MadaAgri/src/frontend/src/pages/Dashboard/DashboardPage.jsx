import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card/Card';
import { dataApi } from '../../lib/api';
import { useAuth } from '../../contexts/ContextAuthentification';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [receivedOrders, setReceivedOrders] = useState([]);
  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState('weekly');

  useEffect(() => {
    async function fetchData() {
      if (!user?.id) return;
      setLoading(true);
      try {
        const [
          productsData,
          ordersData,
          receivedData,
          postsData,
          followersData,
          followingData,
        ] = await Promise.all([
          dataApi.getMyProducts('all').catch(() => []),
          dataApi.getMyOrders().catch(() => []),
          dataApi.getReceivedOrders().catch(() => []),
          dataApi.fetchUserPosts(user.id).catch(() => []),
          dataApi.fetchFollowers().catch(() => []),
          dataApi.fetchFollowing().catch(() => []),
        ]);

        setProducts(productsData);
        setOrders(ordersData);
        setReceivedOrders(receivedData);
        setPosts(postsData);
        setFollowers(followersData);
        setFollowing(followingData);
      } catch (err) {
        console.error('[Dashboard] Failed to load:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user?.id]);

  const isFarmer = user?.role === 'farmer';

  const totalRevenue = receivedOrders
    .filter((o) => o.status === 'completed' || o.status === 'confirmed')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const totalOrders = orders.length;
  const totalReceived = receivedOrders.length;
  const totalProducts = products.length;
  const availableProducts = products.filter((p) => p.is_available).length;

  const totalLikes = posts.reduce((sum, p) => sum + (p.likes_count || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.comments_count || 0), 0);
  const totalFollowers = followers.length;
  const totalFollowing = following.length;

  const recentOrders = [...receivedOrders]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const chartData = useMemo(() => getChartData(receivedOrders, chartPeriod), [receivedOrders, chartPeriod]);

  const maxChart = Math.max(...chartData.map((d) => d.value), 1);

  function getChartData(ordersList, period) {
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const days = [];

    if (period === 'daily') {
      for (let i = 23; i >= 0; i--) {
        const date = new Date();
        date.setHours(date.getHours() - i);
        const hourStr = `${date.getHours()}h`;
        const dateStr = date.toISOString().split('T')[0];
        const hour = date.getHours();
        const count = ordersList.filter((o) => {
          const orderDate = new Date(o.created_at);
          return orderDate.toISOString().split('T')[0] === dateStr && orderDate.getHours() === hour;
        }).length;
        days.push({ label: i % 3 === 0 ? hourStr : '', value: count });
      }
    } else if (period === 'weekly') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const count = ordersList.filter((o) => {
          const orderDate = new Date(o.created_at).toISOString().split('T')[0];
          return orderDate === dateStr;
        }).length;
        days.push({ label: dayNames[date.getDay()], value: count, date: dateStr });
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.getMonth();
        const year = date.getFullYear();
        const count = ordersList.filter((o) => {
          const orderDate = new Date(o.created_at);
          return orderDate.getMonth() === month && orderDate.getFullYear() === year;
        }).length;
        days.push({ label: monthNames[month], value: count });
      }
    }
    return days;
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Tableau de bord</h1>
            <p className={styles.subtitle}>
              Bienvenue, {user?.display_name || 'Utilisateur'}
            </p>
          </div>
          {isFarmer && (
            <Link to="/dashboard/create" className={styles.addBtn}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Nouveau produit
            </Link>
          )}
        </div>

        {/* Stats principales */}
        <div className={styles.statsGrid}>
          {isFarmer ? (
            <>
              <Card className={styles.statCard}>
                <div className={styles.statHeader}>
                  <div className={`${styles.statIcon} ${styles.revenueIcon}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                </div>
                <span className={styles.statValue}>
                  {totalRevenue.toLocaleString('fr-FR')} Ar
                </span>
                <span className={styles.statLabel}>Revenus totaux</span>
              </Card>

              <Card className={styles.statCard}>
                <div className={styles.statHeader}>
                  <div className={`${styles.statIcon} ${styles.ordersIcon}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />
                    </svg>
                  </div>
                </div>
                <span className={styles.statValue}>{totalReceived}</span>
                <span className={styles.statLabel}>Commandes reçues</span>
              </Card>

              <Card className={styles.statCard}>
                <div className={styles.statHeader}>
                  <div className={`${styles.statIcon} ${styles.productsIcon}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    </svg>
                  </div>
                </div>
                <span className={styles.statValue}>{availableProducts}/{totalProducts}</span>
                <span className={styles.statLabel}>Produits actifs</span>
              </Card>

              <Card className={styles.statCard}>
                <div className={styles.statHeader}>
                  <div className={`${styles.statIcon} ${styles.buyersIcon}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                </div>
                <span className={styles.statValue}>{totalOrders}</span>
                <span className={styles.statLabel}>Mes commandes</span>
              </Card>
            </>
          ) : (
            <>
              <Card className={styles.statCard}>
                <div className={styles.statHeader}>
                  <div className={`${styles.statIcon} ${styles.ordersIcon}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />
                    </svg>
                  </div>
                </div>
                <span className={styles.statValue}>{totalOrders}</span>
                <span className={styles.statLabel}>Mes commandes</span>
              </Card>

              <Card className={styles.statCard}>
                <div className={styles.statHeader}>
                  <div className={`${styles.statIcon} ${styles.productsIcon}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    </svg>
                  </div>
                </div>
                <span className={styles.statValue}>{totalProducts}</span>
                <span className={styles.statLabel}>Produits publiés</span>
              </Card>

              <Card className={styles.statCard}>
                <div className={styles.statHeader}>
                  <div className={`${styles.statIcon} ${styles.followersIcon}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                  </div>
                </div>
                <span className={styles.statValue}>{totalFollowers}</span>
                <span className={styles.statLabel}>Abonnés</span>
              </Card>

              <Card className={styles.statCard}>
                <div className={styles.statHeader}>
                  <div className={`${styles.statIcon} ${styles.followingIcon}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="8.5" cy="7" r="4" />
                      <line x1="20" y1="8" x2="20" y2="14" />
                      <line x1="23" y1="11" x2="17" y2="11" />
                    </svg>
                  </div>
                </div>
                <span className={styles.statValue}>{totalFollowing}</span>
                <span className={styles.statLabel}>Abonnements</span>
              </Card>
            </>
          )}
        </div>

        {/* Interactions du profil */}
        <div className={styles.sectionTitle}>
          <h2>Interactions du profil</h2>
        </div>
        <div className={styles.interactionsGrid}>
          <Card className={styles.interactionCard}>
            <div className={styles.interactionIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <span className={styles.interactionValue}>{totalLikes}</span>
            <span className={styles.interactionLabel}>Likes</span>
          </Card>

          <Card className={styles.interactionCard}>
            <div className={styles.interactionIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <span className={styles.interactionValue}>{totalComments}</span>
            <span className={styles.interactionLabel}>Commentaires</span>
          </Card>

          <Card className={styles.interactionCard}>
            <div className={styles.interactionIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <span className={styles.interactionValue}>{posts.reduce((sum, p) => sum + (p.views_count || 0), 0)}</span>
            <span className={styles.interactionLabel}>Vues du profil</span>
          </Card>

          <Card className={styles.interactionCard}>
            <div className={styles.interactionIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <span className={styles.interactionValue}>{posts.length}</span>
            <span className={styles.interactionLabel}>Publications</span>
          </Card>
        </div>

        {/* Graphique des ventes */}
        {isFarmer && (
          <>
            <div className={styles.chartHeader}>
              <h2>Aperçu des ventes</h2>
              <div className={styles.periodFilter}>
                <button
                  className={`${styles.periodBtn} ${chartPeriod === 'daily' ? styles.periodBtnActive : ''}`}
                  onClick={() => setChartPeriod('daily')}
                >
                  Jour
                </button>
                <button
                  className={`${styles.periodBtn} ${chartPeriod === 'weekly' ? styles.periodBtnActive : ''}`}
                  onClick={() => setChartPeriod('weekly')}
                >
                  Semaine
                </button>
                <button
                  className={`${styles.periodBtn} ${chartPeriod === 'monthly' ? styles.periodBtnActive : ''}`}
                  onClick={() => setChartPeriod('monthly')}
                >
                  Mois
                </button>
              </div>
            </div>
            <Card className={styles.chartCard}>
              <div className={styles.chart}>
                <div className={styles.yAxis}>
                  <span>{maxChart}</span>
                  <span>{Math.round(maxChart / 2)}</span>
                  <span>0</span>
                </div>
                <div className={styles.chartArea}>
                  <div className={styles.gridLines}>
                    <div className={styles.gridLine} />
                    <div className={styles.gridLine} />
                    <div className={styles.gridLine} />
                  </div>
                  <div className={styles.barsContainer}>
                    {chartData.map((d, i) => (
                      <div key={i} className={styles.chartBarWrapper}>
                        <div className={styles.barTooltip}>{d.value}</div>
                        <div
                          className={styles.bar}
                          style={{ height: `${Math.max((d.value / maxChart) * 100, 4)}%` }}
                          data-value={d.value}
                        />
                        <span className={styles.barLabel}>{d.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className={styles.chartSummary}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryValue}>
                    {chartData.reduce((sum, d) => sum + d.value, 0)}
                  </span>
                  <span className={styles.summaryLabel}>Total commandes</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryValue}>
                    {Math.round(chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length * 10) / 10}
                  </span>
                  <span className={styles.summaryLabel}>Moy. / période</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryValue}>
                    {Math.max(...chartData.map((d) => d.value))}
                  </span>
                  <span className={styles.summaryLabel}>Pic</span>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Commandes récentes et activité */}
        <div className={styles.contentGrid}>
          {isFarmer && receivedOrders.length > 0 && (
            <Card className={styles.ordersCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Commandes récentes</h2>
                <Link to="/dashboard/received-orders" className={styles.cardLink}>Voir tout</Link>
              </div>
              <div className={styles.ordersList}>
                {recentOrders.map((order) => (
                  <div key={order.id} className={styles.orderRow}>
                    <div className={styles.orderInfo}>
                      <span className={styles.orderId}>CMD-{order.id?.slice(-6) || 'N/A'}</span>
                      <span className={styles.orderProduct}>
                        {order.items?.map((item) => item.product_name || 'Produit').join(', ')}
                      </span>
                    </div>
                    <div className={styles.orderMiddle}>
                      <span className={styles.orderBuyer}>
                        {new Date(order.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className={styles.orderRight}>
                      <span className={styles.orderAmount}>
                        {(order.total_amount || 0).toLocaleString('fr-FR')} Ar
                      </span>
                      <span className={`${styles.statusBadge} ${styles[`status${order.status}`] || ''}`}>
                        {order.status === 'completed' ? 'Terminée' :
                         order.status === 'confirmed' ? 'Confirmée' :
                         order.status === 'pending' ? 'En attente' : order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className={styles.activityCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Activité récente</h2>
            </div>
            <div className={styles.activityList}>
              {posts.slice(0, 5).map((post, i) => (
                <div key={post.id || i} className={styles.activityItem}>
                  <div className={`${styles.activityDot} ${styles.post}`} />
                  <div className={styles.activityContent}>
                    <span className={styles.activityText}>
                      Publication : {post.content?.slice(0, 50)}{post.content?.length > 50 ? '...' : ''}
                    </span>
                    <span className={styles.activityTime}>
                      {new Date(post.created_at).toLocaleDateString('fr-FR')} · {post.likes_count || 0} likes · {post.comments_count || 0} commentaires
                    </span>
                  </div>
                </div>
              ))}
              {posts.length === 0 && (
                <div className={styles.emptyActivity}>
                  <p>Aucune activité récente</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
