import { useState } from 'react';
import { FiUsers, FiBarChart2, FiBookmark, FiHome, FiShoppingBag, FiMessageSquare, FiBell, FiChevronDown, FiChevronUp, FiMapPin, FiCalendar, FiTrendingUp } from 'react-icons/fi';
import { GiWheat } from 'react-icons/gi';
import { FaRobot } from "react-icons/fa";
import clsx from 'clsx';
import { useAuth } from '../../contexts/ContextAuthentification';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/Composants/LeftSidebar.module.css';

export default function LeftSidebar() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);

  const mainMenuItems = [
    { icon: <FiHome />, label: 'Fil d\'actualite', route: '/dashboard' },
    { icon: <FiUsers />, label: 'Collaborateurs', route: '/dashboard/network' },
    { icon: <FiMessageSquare />, label: 'Messages', route: '/dashboard/messages' },
    { icon: <FiShoppingBag />, label: 'Marketplace', route: '/marketplace' },
    { icon: <FiBarChart2 />, label: 'Tableau de bord', route: '/dashboard/stats' },
    { icon: <FiBookmark />, label: 'Mes commandes', route: '/dashboard/orders' },
  ];

  const extraMenuItems = [
    { icon: <FaRobot />, label: 'Assistant IA', route: '/dashboard/assistant' },
    { icon: <GiWheat />, label: 'Analyse cultures', route: '/dashboard/analysis' },
    { icon: <FiTrendingUp />, label: 'Meteo agricole', route: '/dashboard/meteo' },
    { icon: <FiCalendar />, label: 'Mes commandes reçues', route: '/dashboard/received-orders' },
  ];

  const allItems = [...mainMenuItems, ...(showMore ? extraMenuItems : [])];

  const handleNavClick = (route) => {
    if (route) navigate(route);
  };

  const stats = [
    { label: 'Publications', value: user?.posts_count || 0 },
    { label: 'Abonnes', value: user?.followers_count || 0 },
    { label: 'Abonnements', value: user?.following_count || 0 },
  ];

  return (
    <aside className={clsx(styles['left-sidebar'])}>
      <div className={styles['user-card']} onClick={() => navigate('/profile')}>
        <img
          src={user?.profile_image_url || '/src/images/avatar.gif'}
          alt={user?.display_name}
          className={styles['user-avatar']}
        />
        <div className={styles['user-info']}>
          <h3 className={styles['user-name']}>{user?.display_name || 'Utilisateur'}</h3>
          {user?.role && (
            <span className={styles['user-role']}>{user.role === 'farmer' ? 'Agriculteur' : user.role === 'buyer' ? 'Acheteur' : user.role}</span>
          )}
        </div>
      </div>

      <div className={styles['stats-row']}>
        {stats.map((stat, i) => (
          <div key={i} className={styles['stat-item']}>
            <span className={styles['stat-value']}>{stat.value}</span>
            <span className={styles['stat-label']}>{stat.label}</span>
          </div>
        ))}
      </div>

      <nav className={styles['nav-menu']}>
        {allItems.map((item, index) => (
          <button
            key={index}
            className={clsx(styles['nav-item'])}
            onClick={() => handleNavClick(item.route)}
          >
            <span className={styles['nav-icon']}>{item.icon}</span>
            <span className={styles['nav-label']}>{item.label}</span>
          </button>
        ))}

        <button
          className={clsx(styles['nav-item'], styles['show-more-btn'])}
          onClick={() => setShowMore(!showMore)}
        >
          <span className={styles['nav-icon']}>
            {showMore ? <FiChevronUp /> : <FiChevronDown />}
          </span>
          <span className={styles['nav-label']}>{showMore ? 'Voir moins' : 'Voir plus'}</span>
        </button>
      </nav>

      <div className={styles['sidebar-footer']}>
        <p className={styles['footer-text']}>MadaAgri &copy; 2026</p>
      </div>
    </aside>
  );
}
