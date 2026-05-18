import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { FiArrowLeft, FiMail, FiPhone, FiUserPlus, FiUserCheck, FiUserX, FiUsers, FiX, FiSearch, FiBell, FiSettings, FiLogOut, FiHome, FiEdit2, FiShare2, FiMessageCircle, FiMoreVertical, FiGrid, FiPlusCircle, FiTool, FiBarChart2, FiMap, FiShoppingCart, FiBox, FiInbox, FiCloud, FiUser } from 'react-icons/fi';
import { usePageLoading } from '../../hooks/usePageLoading';
import { useAuth } from '../../contexts/ContextAuthentification';
import { dataApi } from '../../lib/api';
import Navigation from './Navigation';
import ImageUploader from './ImageUploader';
import FormulaireProduit from '../Produits/FormulaireProduit';
import NotificationCenter from '../../components/NotificationCenter/NotificationCenter';
import useRealTimeNotifications from '../../hooks/useRealTimeNotifications';
import { TABS } from './Dashboard/config/dashboardConfig';

import {
  FeedPage,
  PublicationPage,
  ProductsPage,
  ProductManagementPage,
  MessagesPage,
  MeteoPage,
  AgriculturePage,
  RoutesPage,
  NetworkPage,
  SearchPage,
  MarketplacePage,
  OrdersPage,
  ReceivedOrdersPage,
  SettingsPage,
  UserProfilePage
} from './Dashboard/pages';
import ProfilePage from '../Utilisateurs/ProfilePage';

import styles from '../../styles/Composants/TableauDeBord.module.css';

export default function TableauDeBord() {
  const { user, signOut } = useAuth();
  const { isLoading, startLoading, stopLoading } = usePageLoading();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    archiveNotification,
  } = useRealTimeNotifications(user?.id);
  const [activeTab, setActiveTab] = useState(TABS.FEED);
  const [products, setProducts] = useState([]);
  const [selectedUserProfileId, setSelectedUserProfileId] = useState(null);
  const shellRef = useRef(null);

  // Nav expand state (desktop hover)
  const [navExpanded, setNavExpanded] = useState(false);

  // Mobile mode
  const [isMobileMode, setIsMobileMode] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  // Synchroniser --nav-width sur le shell
  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    if (navExpanded) {
      shell.style.setProperty('--nav-width', '280px');
    } else {
      const w = window.innerWidth;
      if (w <= 480) shell.style.setProperty('--nav-width', '55px');
      else if (w <= 768) shell.style.setProperty('--nav-width', '60px');
      else if (w <= 1024) shell.style.setProperty('--nav-width', '70px');
      else shell.style.setProperty('--nav-width', '80px');
    }
  }, [navExpanded]);

  // Détecter le mode mobile
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 1024;
      setIsMobileMode(isMobile);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  async function fetchProducts() {
    startLoading();
    try {
      let productList;
      if (user?.role === 'farmer') {
        productList = await dataApi.getMyProducts('all');
      } else {
        productList = await dataApi.fetchProducts();
      }
      setProducts(productList);
    } catch (err) {
      console.error('Erreur fetch products', err);
      setProducts([]);
    } finally {
      stopLoading();
    }
  }

  function handleProductCreated() {
    setActiveTab(TABS.PRODUCTS);
    fetchProducts();
  }

  const isFarmer = user && user.role === 'farmer';
  const [searchValue, setSearchValue] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      setActiveTab(TABS.SEARCH);
    }
  };

  const handleUserProfileClick = (userId) => {
    console.log('[TableauDeBord] User profile clicked:', userId);
    if (userId === user?.id) {
      console.log('[TableauDeBord] Own profile, redirecting to PROFILE');
      setActiveTab(TABS.PROFILE);
    } else {
      console.log('[TableauDeBord] Other profile, redirecting to USER_PROFILE with id:', userId);
      setSelectedUserProfileId(userId);
      setActiveTab(TABS.USER_PROFILE);
    }
  };

  // Rendu des pages selon l'onglet actif
  const renderPage = () => {
    switch (activeTab) {
      case TABS.FEED:
        return <FeedPage onUserProfileClick={handleUserProfileClick} />;
      case TABS.POST:
        return <PublicationPage onCreated={() => setActiveTab(TABS.FEED)} />;
      case TABS.PRODUCTS:
        return <ProductsPage products={products} loading={isLoading} />;
      case TABS.PRODUCT_MANAGEMENT:
        return isFarmer ? <ProductManagementPage /> : null;
      case TABS.MESSAGES:
        return <MessagesPage />;
      case TABS.METEO_PAGE:
        return <MeteoPage />;
      case TABS.ANALYSIS:
        return isFarmer ? <AgriculturePage /> : null;
      case TABS.ROUTES:
        return isFarmer ? <RoutesPage /> : null;
      case TABS.NETWORK:
        return <NetworkPage onUserProfileClick={handleUserProfileClick} />;
      case TABS.SEARCH:
        return <SearchPage searchValue={searchValue} onUserProfileClick={handleUserProfileClick} />;
      case TABS.MARKETPLACE:
        return <MarketplacePage onUserProfileClick={handleUserProfileClick} />;
      case TABS.ORDERS:
        return <OrdersPage />;
      case TABS.RECEIVED_ORDERS:
        return isFarmer ? <ReceivedOrdersPage /> : null;
      case TABS.SETTINGS:
        return <SettingsPage user={user} />;
      case TABS.PROFILE:
        return (
          <ProfilePage
            user={user}
            onUserProfileClick={handleUserProfileClick}
          />
        );
      case TABS.USER_PROFILE:
        return (
          selectedUserProfileId && (
            <UserProfilePage
              userId={selectedUserProfileId}
              onBack={() => setActiveTab(TABS.FEED)}
              onUserProfileClick={handleUserProfileClick}
            />
          )
        );
      default:
        return <FeedPage onUserProfileClick={handleUserProfileClick} />;
    }
  };

  return (
    <div ref={shellRef} className={clsx(styles['mg-shell'])}>
      {/* Navigation desktop */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isMobileMode={isMobileMode}
        onNavExpanded={setNavExpanded}
      />
      
      <main className={clsx(styles['mg-content'], { [styles['mobile-mode']]: isMobileMode })}>
        <div className={clsx(styles['mg-topbar'], styles['mg-top-navbar'], { [styles['mobile-topbar']]: isMobileMode })}>
          
          {/* LIGNE 1: Brand + Search + Menu */}
          <div className={clsx(styles['mg-topbar-line-1'])}>
            <div className={clsx(styles['mg-topbar-left'])}>
              {!isMobileMode && (
                <button
                  type="button"
                  className={clsx(styles['mg-profile-button'])}
                  onClick={() => setActiveTab(TABS.PROFILE)}
                  title="Voir mon profil"
                >
                  <img src={user?.profile_image_url || '/src/images/avatar.gif'} alt="Profil" className={clsx(styles['mg-profile-avatar'])} />
                  <span>{user?.display_name || user?.email}</span>
                  <FiMoreVertical className={clsx(styles['ml-8'])} />
                </button>
              )}
              
              {/* En mobile: Brand + Hamburger */}
              {isMobileMode && (
                <div className={clsx(styles['mobile-brand-section'])}>
                  <img src="/src/images/logo.png" alt="MadaAgri Logo" className={clsx(styles['mobile-brand-logo'])} />
                  <span className={clsx(styles['mobile-brand-name'])}>MadaAgri</span>
                </div>
              )}
              
              {/* Search */}
              {!isMobileMode && (
                <form onSubmit={handleSearchSubmit} style={{ flex: 1 }}>
                  <input
                    type="search"
                    className={clsx(styles['mg-input'], styles['mg-search'])}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Rechercher amis, posts, produits..."
                  />
                </form>
              )}
            </div>

            <div className={clsx(styles['mg-topbar-right'])}>
              {isMobileMode && (
                <button type="button" className={clsx(styles['mg-icon-btn'], styles['mobile-search-btn'])} title="Rechercher">
                  <FiSearch />
                </button>
              )}
              
              <NotificationCenter
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onRemove={removeNotification}
                onArchive={archiveNotification}
              />
              
              {!isMobileMode && (
                <>
                  <button
                    type="button"
                    className={clsx(styles['mg-icon-btn'], { [styles['active']]: activeTab === TABS.SETTINGS })}
                    onClick={() => setActiveTab(TABS.SETTINGS)}
                    title="Paramètres"
                  >
                    <FiSettings />
                  </button>
                  <button
                    type="button"
                    className={clsx(styles['mg-simple-btn'], styles['ml-10'])}
                    onClick={signOut}
                    title="Déconnexion"
                  >
                    <FiLogOut />
                  </button>
                </>
              )}
              
              {isMobileMode && (
                <button
                  type="button"
                  className={clsx(styles['mg-icon-btn'], styles['mobile-menu-btn'])}
                  onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                  title="Plus"
                >
                  <FiMoreVertical />
                </button>
              )}
            </div>
          </div>

          {/* LIGNE 2: Navigation Mobile */}
          {isMobileMode ? (
            <div className={clsx(styles['mg-topbar-line-2'])}>
              <nav className={clsx(styles['mobile-main-nav'])} role="navigation" aria-label="Navigation principale">
                <button
                  className={clsx(styles['mobile-nav-btn'], { [styles['active']]: activeTab === TABS.FEED })}
                  onClick={() => setActiveTab(TABS.FEED)}
                  title="Accueil"
                >
                  <FiHome />
                </button>
                <button
                  className={clsx(styles['mobile-nav-btn'], { [styles['active']]: activeTab === TABS.POST })}
                  onClick={() => setActiveTab(TABS.POST)}
                  title="Ajouter une publication"
                >
                  <FiEdit2 />
                </button>
                <button
                  className={clsx(styles['mobile-nav-btn'], { [styles['active']]: activeTab === TABS.NETWORK })}
                  onClick={() => setActiveTab(TABS.NETWORK)}
                  title="Invitations collaborateurs"
                >
                  <FiUsers />
                </button>
                <button
                  className={clsx(styles['mobile-nav-btn'], { [styles['active']]: activeTab === TABS.MESSAGES })}
                  onClick={() => setActiveTab(TABS.MESSAGES)}
                  title="Messages"
                >
                  <FiMessageCircle />
                </button>
              </nav>
            </div>
          ) : null}
        </div>

        {/* Mobile Drawer */}
        {isMobileMode && (
          <>
            <div 
              className={clsx(styles['mobile-drawer-overlay'], { [styles['open']]: isDrawerOpen })}
              onClick={() => setIsDrawerOpen(false)}
            />
            
            <aside className={clsx(styles['mobile-drawer'], { [styles['open']]: isDrawerOpen })}>
              <div className={clsx(styles['mobile-drawer-header'])}>
                <div className={clsx(styles['mobile-drawer-brand'])}>
                  <img src="/src/images/logo.png" alt="MadaAgri" className={clsx(styles['mobile-drawer-logo'])} />
                  <span>MadaAgri</span>
                </div>
                <button
                  className={clsx(styles['mobile-drawer-close'])}
                  onClick={() => setIsDrawerOpen(false)}
                >
                  <FiX />
                </button>
              </div>
              
              <nav className={clsx(styles['mobile-drawer-nav'])}>
                <ul className={clsx(styles['mobile-nav-list'])}>
                  <li className={clsx(styles['mobile-nav-item'])}>
                    <button
                      className={clsx(styles['mobile-nav-link'], { [styles['active']]: activeTab === TABS.PRODUCTS })}
                      onClick={() => { setActiveTab(TABS.PRODUCTS); setIsDrawerOpen(false); }}
                    >
                      <FiGrid />
                      <span>Liste des produits</span>
                    </button>
                  </li>
                  {isFarmer && (
                    <>
                      <li className={clsx(styles['mobile-nav-item'])}>
                        <button
                          className={clsx(styles['mobile-nav-link'], { [styles['active']]: activeTab === TABS.CREATE })}
                          onClick={() => { setActiveTab(TABS.CREATE); setIsDrawerOpen(false); }}
                        >
                          <FiPlusCircle />
                          <span>Ajouter un produit</span>
                        </button>
                      </li>
                      <li className={clsx(styles['mobile-nav-item'])}>
                        <button
                          className={clsx(styles['mobile-nav-link'], { [styles['active']]: activeTab === TABS.PRODUCT_MANAGEMENT })}
                          onClick={() => { setActiveTab(TABS.PRODUCT_MANAGEMENT); setIsDrawerOpen(false); }}
                        >
                          <FiTool />
                          <span>Gestion des produits</span>
                        </button>
                      </li>
                      <li className={clsx(styles['mobile-nav-item'])}>
                        <button
                          className={clsx(styles['mobile-nav-link'], { [styles['active']]: activeTab === TABS.ANALYSIS })}
                          onClick={() => { setActiveTab(TABS.ANALYSIS); setIsDrawerOpen(false); }}
                        >
                          <FiBarChart2 />
                          <span>Analyse</span>
                        </button>
                      </li>
                      <li className={clsx(styles['mobile-nav-item'])}>
                        <button
                          className={clsx(styles['mobile-nav-link'], { [styles['active']]: activeTab === TABS.ROUTES })}
                          onClick={() => { setActiveTab(TABS.ROUTES); setIsDrawerOpen(false); }}
                        >
                          <FiMap />
                          <span>Optimisation des routes</span>
                        </button>
                      </li>
                    </>
                  )}
                  {!isFarmer && (
                    <>
                      <li className={clsx(styles['mobile-nav-item'])}>
                        <button
                          className={clsx(styles['mobile-nav-link'], { [styles['active']]: activeTab === TABS.MARKETPLACE })}
                          onClick={() => { setActiveTab(TABS.MARKETPLACE); setIsDrawerOpen(false); }}
                        >
                          <FiShoppingCart />
                          <span>Marketplace</span>
                        </button>
                      </li>
                      <li className={clsx(styles['mobile-nav-item'])}>
                        <button
                          className={clsx(styles['mobile-nav-link'], { [styles['active']]: activeTab === TABS.ORDERS })}
                          onClick={() => { setActiveTab(TABS.ORDERS); setIsDrawerOpen(false); }}
                        >
                          <FiBox />
                          <span>Mes commandes</span>
                        </button>
                      </li>
                    </>
                  )}
                  {isFarmer && (
                    <li className={clsx(styles['mobile-nav-item'])}>
                      <button
                        className={clsx(styles['mobile-nav-link'], { [styles['active']]: activeTab === TABS.RECEIVED_ORDERS })}
                        onClick={() => { setActiveTab(TABS.RECEIVED_ORDERS); setIsDrawerOpen(false); }}
                      >
                        <FiInbox />
                        <span>Commandes reçues</span>
                      </button>
                    </li>
                  )}
                  <li className={clsx(styles['mobile-nav-item'])}>
                    <button
                      className={clsx(styles['mobile-nav-link'], { [styles['active']]: activeTab === TABS.METEO_PAGE })}
                      onClick={() => { setActiveTab(TABS.METEO_PAGE); setIsDrawerOpen(false); }}
                    >
                      <FiCloud />
                      <span>Météo</span>
                    </button>
                  </li>
                </ul>
              </nav>
              
              <div className={clsx(styles['mobile-drawer-footer'])}>
                <div className={clsx(styles['mobile-user-info'])}>
                  <div className={clsx(styles['mobile-user-avatar'])}>
                    <FiUser />
                  </div>
                  <div className={clsx(styles['mobile-user-details'])}>
                    <span className={clsx(styles['mobile-user-email'])}>{user?.email}</span>
                    <span className={clsx(styles['mobile-user-role'])}>{isFarmer ? 'Agriculteur' : 'Client'}</span>
                  </div>
                </div>
                <div className={clsx(styles['mobile-drawer-actions'])}>
                  <button 
                    className={clsx(styles['mobile-drawer-action-btn'])} 
                    onClick={() => { setActiveTab(TABS.SETTINGS); setIsDrawerOpen(false); }}
                  >
                    <FiSettings />
                    <span>Paramètres</span>
                  </button>
                  <button className={clsx(styles['mobile-drawer-action-btn'], styles['logout-btn'])} onClick={signOut}>
                    <FiLogOut />
                    <span>Déconnexion</span>
                  </button>
                </div>
              </div>
            </aside>
          </>
        )}

        {/* Spacer mobile */}
        {isMobileMode && <div className={clsx(styles['mobile-topbar-spacer'])} />}

        {/* Rendu des pages */}
        {renderPage()}

        {/* Modal Créer Produit */}
        {activeTab === TABS.CREATE && isFarmer && (
          <div className={clsx(styles['mg-modal-overlay'])}>
            <div className={clsx(styles['mg-modal-content'])} style={{ width: '80%', maxWidth: '700px' }}>
              <p
                type="button"
                className={clsx(styles['mg-modal-close'])}
                onClick={() => setActiveTab(TABS.FEED)}
              >
                <img src="/src/images/quitter.gif" alt="Quitter" />
              </p>
              <p style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Utilisez la page <a href="/dashboard/create" style={{ color: 'var(--primary)' }}>Ajouter un produit</a>
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
