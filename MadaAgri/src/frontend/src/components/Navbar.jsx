import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/ContextAuthentification';
import { ThemeSelector } from './ThemeSelector';
import NotificationsPanel from './NotificationsPanel';
import { dataApi } from '../lib/api';
import styles from './Navbar.module.css';

const MAIN_BUTTONS = [
  { key: 'feed', path: '/dashboard', label: 'Accueil' },
  { key: 'post', path: '/dashboard/post', label: 'Publication' },
  { key: 'network', path: '/dashboard/network', label: 'Réseau' },
  { key: 'messages', path: '/dashboard/messages', label: 'Messages' },
  { key: 'assistant', path: '/dashboard/assistant', label: 'Assistant' },
  { key: 'dashboard', path: '/dashboard/stats', label: 'Tableau de bord' }
];

const PRODUCTIVITE_ITEMS = [
  { key: 'create', path: '/dashboard/create', label: 'Ajouter un produit', icon: 'plus', farmerOnly: true },
  { key: 'products', path: '/dashboard/products', label: 'Liste des produits', icon: 'grid', farmerOnly: true },
  { key: 'marketplace', path: '/marketplace', label: 'Marketplace', icon: 'cart' },
  { key: 'received_orders', path: '/dashboard/received-orders', label: 'Commandes reçues', icon: 'inbox', farmerOnly: true },
  { key: 'analysis', path: '/dashboard/analysis', label: 'Analyse', icon: 'chart', farmerOnly: true },
  { key: 'routes', path: '/dashboard/routes', label: 'Optimisation des trajets', icon: 'map', farmerOnly: true },
  { key: 'orders', path: '/dashboard/orders', label: 'Mes commandes', icon: 'box', clientOnly: true },
  { key: 'meteo_page', path: '/dashboard/meteo', label: 'Météo', icon: 'cloud' }
];

const navIcons = {
  grid: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
  cart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
  box: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  inbox: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  tool: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  map: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  ),
  cloud: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  ),
};

export function Navbar() {
  const location = useLocation();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [prodOpen, setProdOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const prodRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (prodRef.current && !prodRef.current.contains(e.target)) {
        setProdOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    async function fetchUnread() {
      try {
        const count = await dataApi.fetchUnreadNotificationCount();
        setUnreadCount(count);
      } catch {
        // ignore
      }
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!user) return null;

  const isFarmer = user.role === 'farmer';

  const filteredProdItems = PRODUCTIVITE_ITEMS.filter((item) => {
    if (item.farmerOnly) return isFarmer;
    if (item.clientOnly) return !isFarmer;
    return true;
  });

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const activeProdItem = filteredProdItems.find((item) => isActive(item.path));

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.left}>
          <Link to="/dashboard" className={styles.logo}>
            <div className={styles.logoIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22c4-4 8-7.5 8-12a8 8 0 1 0-16 0c0 4.5 4 8 8 12z" />
                <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                <path d="M12 12v6" />
                <path d="M9 16h6" />
              </svg>
            </div>
            <span className={styles.logoText}>MadaAgri</span>
          </Link>

          <div className={styles.navLinks}>
            {MAIN_BUTTONS.map((link) => (
              <Link
                key={link.key}
                to={link.path}
                className={`${styles.navLink} ${isActive(link.path) ? styles.active : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className={styles.right}>
          <div className={styles.prodDropdown} ref={prodRef}>
            <button
              className={`${styles.prodBtn} ${prodOpen || activeProdItem ? styles.prodBtnActive : ''}`}
              onClick={() => setProdOpen(!prodOpen)}
            >
              Productivité
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="14"
                height="14"
                className={`${styles.chevron} ${prodOpen ? styles.chevronUp : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {prodOpen && (
              <div className={styles.prodMenu}>
                {filteredProdItems.map((item) => (
                  <Link
                    key={item.key}
                    to={item.path}
                    className={`${styles.prodMenuItem} ${isActive(item.path) ? styles.prodMenuItemActive : ''}`}
                    onClick={() => setProdOpen(false)}
                  >
                    <span className={styles.prodMenuIcon}>{navIcons[item.icon]}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className={styles.themeWrapper}>
            <button
              className={styles.themeBtn}
              onClick={() => setThemeOpen(!themeOpen)}
              aria-label="Change theme"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            </button>
            {themeOpen && <ThemeSelector onClose={() => setThemeOpen(false)} />}
          </div>

          <div className={styles.notifWrapper} ref={notifRef}>
            <button
              className={styles.notifBtn}
              onClick={() => setNotifOpen(!notifOpen)}
              aria-label="Notifications"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && <span className={styles.notifBadge}>{unreadCount > 99 ? '99+' : unreadCount}</span>}
            </button>
            {notifOpen && <NotificationsPanel onClose={() => setNotifOpen(false)} />}
          </div>

          <Link to="/settings" className={styles.settingsBtn} aria-label="Settings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>

          <Link to="/profile" className={styles.profileBtn}>
            {user.profile_image_url ? (
              <img
                src={user.profile_image_url}
                alt={user.display_name || 'Profil'}
                className={styles.profileAvatar}
              />
            ) : (
              <div className={styles.profileInitials}>
                {user.display_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </Link>

          <button
            className={styles.mobileToggle}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span className={mobileOpen ? styles.open : ''} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className={styles.mobileMenu}>
          {MAIN_BUTTONS.map((link) => (
            <Link
              key={link.key}
              to={link.path}
              className={`${styles.mobileLink} ${isActive(link.path) ? styles.active : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <div className={styles.mobileSection}>
            <span className={styles.mobileSectionTitle}>Productivité</span>
            {filteredProdItems.map((item) => (
              <Link
                key={item.key}
                to={item.path}
                className={`${styles.mobileLink} ${isActive(item.path) ? styles.active : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <span className={styles.mobileLinkIcon}>{navIcons[item.icon]}</span>
                {item.label}
              </Link>
            ))}
          </div>

          <Link to="/profile" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Profil</Link>
          <Link to="/settings" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Paramètres</Link>
        </div>
      )}
    </nav>
  );
}
