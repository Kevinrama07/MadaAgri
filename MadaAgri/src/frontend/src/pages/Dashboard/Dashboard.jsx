import { Navbar } from '../../components/Navbar/Navbar';
import { Card } from '../../components/ui/Card/Card';
import { Badge } from '../../components/ui/Badge/Badge';
import { FiTrendingUp, FiTrendingDown, FiShoppingBag, FiDollarSign, FiUsers, FiPackage, FiClock, FiCheck, FiArrowRight } from 'react-icons/fi';
import styles from './Dashboard.module.css';

const stats = [
  {
    label: 'Total revenue',
    value: '4,280,000',
    currency: 'Ar',
    change: '+12.5%',
    trend: 'up',
    icon: <FiDollarSign size={20} />,
  },
  {
    label: 'Active orders',
    value: '24',
    change: '+3',
    trend: 'up',
    icon: <FiShoppingBag size={20} />,
  },
  {
    label: 'Products listed',
    value: '18',
    change: '+2',
    trend: 'up',
    icon: <FiPackage size={20} />,
  },
  {
    label: 'Customers',
    value: '156',
    change: '+8.2%',
    trend: 'up',
    icon: <FiUsers size={20} />,
  },
];

const recentOrders = [
  { id: 'ORD-001', product: 'Premium Rice (50kg)', buyer: 'Restaurant Le Palais', amount: '122,500 Ar', status: 'completed', date: 'Today' },
  { id: 'ORD-002', product: 'Vanilla Beans (2kg)', buyer: 'Export Madagascar', amount: '360,000 Ar', status: 'processing', date: 'Today' },
  { id: 'ORD-003', product: 'Organic Lychees (100kg)', buyer: 'Marche Analakely', amount: '450,000 Ar', status: 'pending', date: 'Yesterday' },
  { id: 'ORD-004', product: 'Cloves (10kg)', buyer: 'Spice House Tana', amount: '152,000 Ar', status: 'completed', date: 'Yesterday' },
  { id: 'ORD-005', product: 'Fresh Tomatoes (30kg)', buyer: 'Hotel Ravintsara', amount: '54,000 Ar', status: 'processing', date: '2 days ago' },
];

const activity = [
  { text: 'New order received for Premium Rice', time: '5 min ago', type: 'order' },
  { text: 'Payment confirmed for Vanilla Beans', time: '1 hour ago', type: 'payment' },
  { text: 'Product "Organic Lychees" was reviewed', time: '3 hours ago', type: 'review' },
  { text: 'New follower: Coop Fianar', time: '5 hours ago', type: 'social' },
];

const topProducts = [
  { name: 'Premium Rice', sales: 142, revenue: '3,479,000 Ar', growth: '+15%' },
  { name: 'Vanilla Beans', sales: 28, revenue: '5,040,000 Ar', growth: '+8%' },
  { name: 'Organic Lychees', sales: 89, revenue: '400,500 Ar', growth: '+22%' },
];

export default function Dashboard() {
  return (
    <div className={styles.page}>
      <Navbar />

      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Dashboard</h1>
            <p className={styles.subtitle}>Welcome back, here's your overview</p>
          </div>
          <Badge variant="primary" size="md">Seller account</Badge>
        </div>

        <div className={styles.statsGrid}>
          {stats.map((stat) => (
            <Card key={stat.label} hover className={styles.statCard}>
              <div className={styles.statHeader}>
                <div className={styles.statIcon}>{stat.icon}</div>
                <div className={`${styles.statChange} ${stat.trend === 'up' ? styles.up : styles.down}`}>
                  {stat.trend === 'up' ? <FiTrendingUp size={14} /> : <FiTrendingDown size={14} />}
                  {stat.change}
                </div>
              </div>
              <div className={styles.statValue}>
                {stat.value}
                {stat.currency && <span className={styles.currency}> {stat.currency}</span>}
              </div>
              <div className={styles.statLabel}>{stat.label}</div>
            </Card>
          ))}
        </div>

        <div className={styles.grid}>
          <div className={styles.mainCol}>
            <Card className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Recent orders</h2>
                <button className={styles.viewAll}>
                  View all
                  <FiArrowRight size={14} />
                </button>
              </div>
              <div className={styles.ordersList}>
                {recentOrders.map((order) => (
                  <div key={order.id} className={styles.orderRow}>
                    <div className={styles.orderInfo}>
                      <div className={styles.orderId}>{order.id}</div>
                      <div className={styles.orderProduct}>{order.product}</div>
                      <div className={styles.orderBuyer}>{order.buyer}</div>
                    </div>
                    <div className={styles.orderMeta}>
                      <div className={styles.orderAmount}>{order.amount}</div>
                      <Badge
                        variant={
                          order.status === 'completed' ? 'success' :
                          order.status === 'processing' ? 'info' : 'warning'
                        }
                        size="xs"
                      >
                        {order.status}
                      </Badge>
                      <div className={styles.orderDate}>{order.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Top products</h2>
              </div>
              <div className={styles.productsList}>
                {topProducts.map((product, index) => (
                  <div key={product.name} className={styles.productRow}>
                    <div className={styles.productRank}>#{index + 1}</div>
                    <div className={styles.productInfo}>
                      <div className={styles.productName}>{product.name}</div>
                      <div className={styles.productSales}>{product.sales} sales</div>
                    </div>
                    <div className={styles.productRevenue}>{product.revenue}</div>
                    <div className={styles.productGrowth}>{product.growth}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className={styles.sideCol}>
            <Card className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Activity</h2>
              </div>
              <div className={styles.activityList}>
                {activity.map((item, index) => (
                  <div key={index} className={styles.activityItem}>
                    <div className={styles.activityDot} />
                    <div className={styles.activityContent}>
                      <div className={styles.activityText}>{item.text}</div>
                      <div className={styles.activityTime}>{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className={`${styles.section} ${styles.quickActions}`}>
              <h2 className={styles.sectionTitle}>Quick actions</h2>
              <div className={styles.actionsGrid}>
                <button className={styles.actionBtn}>
                  <FiPackage size={18} />
                  <span>Add product</span>
                </button>
                <button className={styles.actionBtn}>
                  <FiShoppingBag size={18} />
                  <span>New order</span>
                </button>
                <button className={styles.actionBtn}>
                  <FiClock size={18} />
                  <span>View history</span>
                </button>
                <button className={styles.actionBtn}>
                  <FiCheck size={18} />
                  <span>Settings</span>
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
