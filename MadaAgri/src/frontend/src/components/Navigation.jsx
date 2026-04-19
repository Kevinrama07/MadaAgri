import React from 'react';
import { useAuth } from '../contexts/ContextAuthentification';
import '../styles/ModernGlass.css';

// Boutons principaux (sans background)
const MAIN_BUTTONS = [
  { key: 'feed', icon: 'fas fa-home', label: 'Accueil' },
  { key: 'post', icon: 'fas fa-pencil-alt', label: 'Ajouter une publication' },
  { key: 'network', icon: 'fas fa-user-friends', label: 'Invitations collaborateurs' },
  { key: 'messages', icon: 'fas fa-comments', label: 'Messages' }
];

// Sidebar conservée pour les actions centrées sur l'agriculture / produits
const NAV_ITEMS = [
  { key: 'products', icon: 'fas fa-th-large', label: 'Liste des produits' },
  { key: 'create', icon: 'fas fa-plus-circle', label: 'Ajouter un produit', farmerOnly: true },
  { key: 'analysis', icon: 'fas fa-chart-line', label: 'Analyse', farmerOnly: true },
  { key: 'routes', icon: 'fas fa-road', label: 'Optimisation des routes', farmerOnly: true },
  { key: 'map', icon: 'fas fa-map', label: 'Carte géographique' }
];

export default function Navigation({ activeTab, onTabChange }) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const timeoutRef = React.useRef(null);

  if (!user) return null;

  const isFarmer = user.role === 'farmer';

  const startAutoCloseTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
      timeoutRef.current = null;
    }, 10000); // 10 secondes
  };

  const handleMouseEnter = () => {
    setIsExpanded(true);
    startAutoCloseTimer();
  };

  const handleMouseLeave = () => {
    startAutoCloseTimer();
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <aside
      className={`mg-sidebar ${isExpanded ? 'expanded' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div>
        <div className="mg-brand">
          <img src="/src/assets/logo.png" alt="MadaAgri Logo" className="mg-brand-logo" />
          <span>MadaAgri</span>
        </div>
        
        {/* Boutons principaux (transparents) */}
        <ul className="mg-nav-list mg-main-buttons">
          {MAIN_BUTTONS.map((item) => (
            <li className="mg-nav-item" key={item.key} data-tooltip={item.label}>
              <p
                type="button"
                className={`mg-nav-link mg-transparent-btn ${activeTab === item.key ? 'active' : ''}`}
                onClick={() => onTabChange(item.key)}
              >
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </p>
            </li>
          ))}
        </ul>

        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', margin: '10px 0' }}></div>

        <ul className="mg-nav-list">
          {NAV_ITEMS.filter((item) => !item.farmerOnly || isFarmer).map((item) => (
            <li className="mg-nav-item" key={item.key} data-tooltip={item.label}>
              <p
                type="button"
                className={`mg-nav-link mg-transparent-btn ${activeTab === item.key ? 'active' : ''}`}
                onClick={() => onTabChange(item.key)}
              >
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mg-profile">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fas fa-user-circle" style={{ color: 'var(--mg-primary)', fontSize: '1.4rem' }}></i>
          <span>{user.email}</span>
        </div>
        <span>{isFarmer ? 'Agriculteur' : 'Client'}</span>
      </div>
    </aside>
  );
}

