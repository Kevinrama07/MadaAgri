import { useState, useEffect, useMemo } from 'react';
import { FiUsers, FiBarChart2, FiBookmark, FiHome, FiShoppingBag, FiMessageSquare, FiBell, FiChevronDown, FiChevronUp, FiMapPin, FiCalendar, FiTrendingUp } from 'react-icons/fi';
import { GiWheat } from 'react-icons/gi';
import { FaRobot } from "react-icons/fa";
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/ContextAuthentification';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { dataApi } from '../../lib/api';
import styles from '../../styles/Composants/LeftSidebar.module.css';

export default function LeftSidebar() {
  const { t } = useTranslation(['navigation', 'dashboard', 'common']);
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
    collaborators: 0,
  });

  const mainMenuItems = useMemo(() => [
    { icon: <FiHome />, label: t('feed'), route: '/dashboard' },
    { icon: <FiUsers />, label: t('collaborators'), route: '/dashboard/network' },
    { icon: <FiMessageSquare />, label: t('messages'), route: '/dashboard/messages' },
    { icon: <FiShoppingBag />, label: t('marketplace'), route: '/marketplace' },
    { icon: <FiBarChart2 />, label: t('dashboard'), route: '/dashboard/stats' },
    { icon: <FiBookmark />, label: t('myOrders'), route: '/dashboard/orders' },
  ], [t]);

  const extraMenuItems = useMemo(() => {
    const items = [
      { icon: <FaRobot />, label: t('aiAssistant'), route: '/dashboard/assistant' },
      { icon: <FiTrendingUp />, label: t('agriculturalWeather'), route: '/dashboard/meteo' },
    ];
    
    if (user?.role === 'farmer') {
      items.push(
        { icon: <GiWheat />, label: t('cropAnalysis'), route: '/dashboard/analysis' },
        { icon: <FiCalendar />, label: t('receivedOrders'), route: '/dashboard/received-orders' }
      );
    }
    
    return items;
  }, [user?.role, t]);

  const allItems = [...mainMenuItems, ...(showMore ? extraMenuItems : [])];

  const handleNavClick = (route) => {
    if (route) navigate(route);
  };

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    const fetchStats = async () => {
      try {
        const [followersData, followingData, collaboratorsData, postsData] = await Promise.all([
          dataApi.fetchFollowers(user.id),
          dataApi.fetchFollowing(user.id),
          dataApi.fetchCollaborators(user.id),
          dataApi.fetchPosts({ q: '', sort: 'recent' }).catch(() => []),
        ]);

        if (!cancelled) {
          const userPosts = postsData.filter((p) => p.user_id === user.id || p.email === user.email);
          setStats({
            posts: userPosts.length,
            followers: followersData?.length || 0,
            following: followingData?.length || 0,
            collaborators: collaboratorsData?.pagination?.total || 0,
          });
        }
      } catch (err) {
        console.error('[LeftSidebar] Failed to fetch stats:', err);
      }
    };

    fetchStats();
    return () => { cancelled = true; };
  }, [user]);

  const displayStats = [
    { label: t('posts', { ns: 'dashboard' }), value: stats.posts },
    { label: t('followers', { ns: 'dashboard' }), value: stats.followers },
    { label: t('following', { ns: 'dashboard' }), value: stats.following },
    { label: t('totalCollaborators', { ns: 'dashboard' }), value: stats.collaborators },
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
            <span className={styles['user-role']}>
              {user.role === 'farmer' ? t('farmer', { ns: 'auth' }) : user.role === 'buyer' ? t('client', { ns: 'auth' }) : user.role}
            </span>
          )}
        </div>
      </div>

      <div className={styles['stats-row']}>
        {displayStats.map((stat, i) => (
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
          <span className={styles['nav-label']}>{showMore ? t('showLess', { ns: 'common' }) : t('showMore', { ns: 'common' })}</span>
        </button>
      </nav>

      <div className={styles['sidebar-footer']}>
        <p className={styles['footer-text']}>MadaAgri &copy; 2026</p>
      </div>
    </aside>
  );
}
