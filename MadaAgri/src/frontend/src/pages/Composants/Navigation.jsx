import React, { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { useAuth } from '../../contexts/ContextAuthentification';
import styles from '../../styles/Composants/Navigation.module.css';
import {
  FiHome, FiEdit2, FiUsers, FiMessageCircle,
  FiGrid, FiShoppingCart, FiBox, FiInbox,
  FiPlusCircle, FiSettings, FiBarChart2, FiMap,
  FiCloud, FiUser
} from 'react-icons/fi';

// Boutons principaux (sans background)
const MAIN_BUTTONS = [
  { key: 'feed', Icon: FiHome, label: 'Accueil' },
  { key: 'post', Icon: FiEdit2, label: 'Ajouter une publication' },
  { key: 'network', Icon: FiUsers, label: 'Invitations collaborateurs' },
  { key: 'messages', Icon: FiMessageCircle, label: 'Messages' }
];

// Sidebar conservée pour les actions centrées sur l'agriculture / produits
const NAV_ITEMS = [
  { key: 'products', Icon: FiGrid, label: 'Liste des produits', farmerOnly: true },
  { key: 'marketplace', Icon: FiShoppingCart, label: 'Marketplace', clientOnly: true },
  { key: 'orders', Icon: FiBox, label: 'Mes commandes', clientOnly: true },
  { key: 'received_orders', Icon: FiInbox, label: 'Commandes reçues', farmerOnly: true },
  { key: 'create', Icon: FiPlusCircle, label: 'Ajouter un produit', farmerOnly: true },
  { key: 'product_management', Icon: FiSettings, label: 'Gestion des produits', farmerOnly: true },
  { key: 'analysis', Icon: FiBarChart2, label: 'Analyse', farmerOnly: true },
  { key: 'routes', Icon: FiMap, label: 'Optimisation des routes', farmerOnly: true },
  { key: 'meteo_page', Icon: FiCloud, label: 'Météo' }
];

export default function Navigation({ activeTab, onTabChange, isMobileMode, onMobileMenuToggle, onNavExpanded }) {
  const { user, logout } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const timeoutRef = useRef(null);

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Notifier le parent quand la nav change d'état
  useEffect(() => {
    if (onNavExpanded) {
      onNavExpanded(isExpanded);
    }
  }, [isExpanded, onNavExpanded]);

  if (!user) return null;

  const isFarmer = user.role === 'farmer';

  // Filtrer les items selon le rôle
  const filteredNavItems = NAV_ITEMS.filter((item) => {
    if (item.farmerOnly) return isFarmer;
    if (item.clientOnly) return !isFarmer;
    return true;
  });

  // Gestion du hover pour desktop
  const startAutoCloseTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
      timeoutRef.current = null;
    }, 1000);
  };

  const handleMouseEnter = () => {
    if (!isMobileMode) {
      setIsExpanded(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobileMode) {
      startAutoCloseTimer();
    }
  };

  const handleNavClick = (key) => {
    onTabChange(key);
    if (onMobileMenuToggle) {
      onMobileMenuToggle(false);
    }
  };

  if (isMobileMode) {
    return null;
  }

  return (
    <aside
      className={clsx(styles['mg-sidebar'], { [styles['expanded']]: isExpanded })}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Logo fixe en haut — ne scroll pas */}
      <div className={clsx(styles['mg-brand'])}>
        <img src="/src/images/logo.png" alt="MadaAgri Logo" className={clsx(styles['mg-brand-logo'])} />
        <span>MadaAgri</span>
      </div>

      {/* Zone scrollable : uniquement les boutons de navigation */}
      <div className={clsx(styles['all'])}>
        <ul className={clsx(styles['mg-nav-list'])}>
          {MAIN_BUTTONS.map((item) => (
            <li className={clsx(styles['mg-nav-item'])} key={item.key} data-tooltip={item.label}>
              <p
                className={clsx(styles['mg-nav-link'], styles['mg-transparent-btn'], { [styles['active']]: activeTab === item.key })}
                onClick={() => onTabChange(item.key)}
              >
                <item.Icon />
                <span>{item.label}</span>
              </p>
            </li>
          ))}
        </ul>
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)'}}></div>
        <ul className={clsx(styles['mg-nav-list'])}>
          {filteredNavItems.map((item) => (
            <li className={clsx(styles['mg-nav-item'])} key={item.key} data-tooltip={item.label}>
              <p
                className={clsx(styles['mg-nav-link'], styles['mg-transparent-btn'], { [styles['active']]: activeTab === item.key })}
                onClick={() => onTabChange(item.key)}
              >
                <item.Icon />
                <span>{item.label}</span>
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className={clsx(styles['mg-profile'])}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiUser style={{ color: 'var(--mg-primary)', fontSize: '1.4rem' }} />
          <span>{user.email}</span>
        </div>
        <span>{isFarmer ? 'Agriculteur' : 'Client'}</span>
      </div>
    </aside>
  );
}