import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { FiArrowLeft, FiMail, FiPhone, FiUserPlus, FiUserCheck, FiUserX, FiUsers, FiX, FiSearch, FiBell, FiSettings, FiLogOut, FiHome, FiEdit2, FiShare2, FiMessageCircle, FiMoreVertical, FiGrid, FiPlusCircle, FiTool, FiBarChart2, FiMap, FiShoppingCart, FiBox, FiInbox, FiCloud, FiUser } from 'react-icons/fi';
import { usePageLoading } from '../../hooks/usePageLoading';
import { useAuth } from '../../contexts/ContextAuthentification';
import { dataApi } from '../../lib/api';
import Navigation from './Navigation';
import ImageUploader from './ImageUploader';
import ListeProduits from '../Produits/ListeProduits';
import FormulaireProduit from '../Produits/FormulaireProduit';
import GestionProduits from '../Produits/GestionProduits';
import Marketplace from '../Marketplace/Marketplace';
import Orders from '../Marketplace/Orders';
import ReceivedOrders from '../Marketplace/ReceivedOrders';
import Messagerie from '../Messages/Messagerie';
import Meteo from '../Meteo/Meteo';
import AnalyseCulture from '../Cultures/AnalyseCulture';
import OptimisationItineraire from '../Carte/OptimisationItineraire';
import MeteoWeather from '../Meteo/MeteoWeather';
import FormulairePublication from '../Publications/FormulairePublication';
import InvitationsCollaborateurs from '../Utilisateurs/InvitationsCollaborateurs';
import Recherche from './Recherche';
import SocialFeed from '../Publications/SocialFeed';
import UserProfile from '../Utilisateurs/UserProfile';
import PostCard from '../Publications/PostCard';
import styles from '../../styles/Composants/TableauDeBord.module.css';


const TABS = {
  FEED: 'feed',
  POST: 'post',
  PRODUCTS: 'products',
  CREATE: 'create',
  MESSAGES: 'messages',
  METEO: 'meteo',
  ANALYSIS: 'analysis',
  ROUTES: 'routes',
  NETWORK: 'network',
  SEARCH: 'search',
  PROFILE: 'profile',
  USER_PROFILE: 'user_profile',
  SETTINGS: 'settings',
  METEO_PAGE: 'meteo_page',
  PRODUCT_MANAGEMENT: 'product_management',
  MARKETPLACE: 'marketplace',
  ORDERS: 'orders',
  RECEIVED_ORDERS: 'received_orders'
};

export default function TableauDeBord() {
  const { user, signOut } = useAuth();
  const { isLoading, startLoading, stopLoading } = usePageLoading();
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

  // Synchroniser --nav-width sur le shell quand la nav s'ouvre/se ferme
  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    if (navExpanded) {
      shell.style.setProperty('--nav-width', '280px');
    } else {
      // Remettre la valeur par défaut selon la taille d'écran
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

  return (
    <div ref={shellRef} className={clsx(styles['mg-shell'])}>
      {/* Navigation desktop - cachée en mobile */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isMobileMode={isMobileMode}
        onNavExpanded={setNavExpanded}
      />
      
      <main className={clsx(styles['mg-content'], { [styles['mobile-mode']]: isMobileMode })}>
        {/* ============================================ */}
        {/* TOPBAR RESPONSIVE - Facebook Lite Style */}
        {/* ============================================ */}
        <div className={clsx(styles['mg-topbar'], styles['mg-top-navbar'], { [styles['mobile-topbar']]: isMobileMode })}>
          
          {/* LIGNE 1: Brand + Search + Menu (toujours visible) */}
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
              
              {/* Search - caché en mobile sur petite écran */}
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
              {/* Search icon en mobile */}
              {isMobileMode && (
                <button type="button" className={clsx(styles['mg-icon-btn'], styles['mobile-search-btn'])} title="Rechercher">
                  <FiSearch />
                </button>
              )}
              
              <button
                type="button"
                className={clsx(styles['mg-icon-btn'])}
                title="Notifications"
                onClick={() => alert('Aucune notification pour le moment.')}
              >
                <FiBell />
              </button>
              
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
              
              {/* Paramètres + Déconnexion en mobile */}
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

          {/* LIGNE 2: MAIN_BUTTONS (icons only) - Desktop: sidebar / Mobile: topbar row 2 */}
          {isMobileMode ? (
            /* Petit écran: Ligne 2 avec les icons de navigation */
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
          ) : (
            /* Desktop: les boutons sont dans la sidebar, pas dans la topbar */
            <></>
          )}
        </div>

        {/* ============================================ */}
        {/* MOBILE DRAWER (caché par défaut) */}
        {/* ============================================ */}
        {isMobileMode && (
          <>
            {/* Overlay */}
            <div 
              className={clsx(styles['mobile-drawer-overlay'], { [styles['open']]: isDrawerOpen })}
              onClick={() => setIsDrawerOpen(false)}
            />
            
            {/* Drawer */}
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

        {/* Spacer pour le contenu en mode mobile (topbar fixe) */}
        {isMobileMode && <div className={clsx(styles['mobile-topbar-spacer'])} />}

        <section className={clsx(styles['mg-panel'])}>
          {activeTab === TABS.FEED && <SocialFeed onUserProfileClick={handleUserProfileClick} />}
          {activeTab === TABS.POST && <FormulairePublication onCreated={() => setActiveTab(TABS.FEED)} />}
          {activeTab === TABS.PRODUCTS && <ListeProduits products={products} loading={isLoading} />}
          {activeTab === TABS.PRODUCT_MANAGEMENT && isFarmer && <GestionProduits />}
          {activeTab === TABS.MESSAGES && <Messagerie />}
          {activeTab === TABS.METEO && <Meteo />}
          {activeTab === TABS.ANALYSIS && <AnalyseCulture />}
          {activeTab === TABS.NETWORK && <InvitationsCollaborateurs onUserProfileClick={handleUserProfileClick} />}
          {activeTab === TABS.SEARCH && <Recherche onUserProfileClick={handleUserProfileClick} />}
          {activeTab === TABS.ROUTES && isFarmer && <OptimisationItineraire />}
          {activeTab === TABS.METEO_PAGE && <MeteoWeather />}
          {activeTab === TABS.PROFILE && <ProfilePage user={user} products={products} onOpenCreate={() => setActiveTab(TABS.POST)} onOpenProduct={() => setActiveTab(TABS.CREATE)} onUserProfileClick={handleUserProfileClick} />}
          {activeTab === TABS.USER_PROFILE && selectedUserProfileId && <UserProfile userId={selectedUserProfileId} onBack={() => setActiveTab(TABS.FEED)} onUserProfileClick={handleUserProfileClick} />}
          {activeTab === TABS.SETTINGS && <SettingsPanel user={user} />}
          {activeTab === TABS.MARKETPLACE && <Marketplace onUserProfileClick={handleUserProfileClick} />}
          {activeTab === TABS.ORDERS && <Orders />}
          {activeTab === TABS.RECEIVED_ORDERS && isFarmer && <ReceivedOrders />}
        </section>

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
              <FormulaireProduit onSuccess={handleProductCreated} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ProfilePage({ user, products = [], onOpenCreate, onOpenProduct, onUserProfileClick }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profile_image_url || '/src/images/avatar.gif');

  const userProducts = products.filter((p) => p.farmer_id === user?.id);
  const [profileStatus, setProfileStatus] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [regionId, setRegionId] = useState(user?.region_id || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [regions, setRegions] = useState([]);
  const [regionsLoading, setRegionsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [collaboratorsCount, setCollaboratorsCount] = useState(0);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  const handleProfileUpdated = async (url) => {
    setProfileStatus('Enregistrement...');
    try {
      await dataApi.updateProfilePicture(url);
      setProfileImageUrl(url);
      setProfileStatus('Photo de profil mise à jour 🟢');
    } catch (err) {
      setProfileStatus(err.message || 'Impossible de mettre à jour.');
    }
  };

  const loadRegions = async () => {
    setRegionsLoading(true);
    try {
      const regionsData = await dataApi.fetchRegions();
      setRegions(regionsData || []);
    } catch (err) {
      console.error('Erreur chargement régions:', err);
      setRegions([]);
    } finally {
      setRegionsLoading(false);
    }
  };

  useEffect(() => {
    if (showEditModal) {
      loadRegions();
    }
  }, [showEditModal]);

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarFileChange = async (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(selectedFile.type)) {
      setProfileStatus('Format invalide, seulement jpg/jpeg/png.');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setProfileStatus('Taille max 5MB.');
      return;
    }

    setUploading(true);
    setProfileStatus('Upload en cours...');

    try {
      const imageUrl = await dataApi.uploadImage(selectedFile);
      await handleProfileUpdated(imageUrl);
    } catch (err) {
      setProfileStatus(err.message || 'Erreur lors de l’upload.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleSaveProfile = async () => {
    setProfileStatus('Enregistrement du profil...');
    try {
      const updatedUser = await dataApi.updateUserProfile({
        displayName,
        bio,
        regionId,
        phone,
        profileImageUrl
      });
      if (updatedUser) {
        setProfileStatus('Profil mis à jour avec succès 🟢');
        setDisplayName(updatedUser.display_name || displayName);
        setBio(updatedUser.bio || bio);
        setRegionId(updatedUser.region_id || regionId);
        setPhone(updatedUser.phone || phone);
        setProfileImageUrl(updatedUser.profile_image_url || profileImageUrl);
        setShowEditModal(false);
      }
    } catch (err) {
      setProfileStatus(err.message || 'Impossible de sauvegarder le profil.');
    }
  };

  const handleLike = async (postId) => {
      try {
        await dataApi.likePost(postId);
        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, user_likes: 1, likes_count: (p.likes_count || 0) + 1 }
            : p
        ));
      } catch (err) {
        console.error('Erreur like:', err);
      }
    };

  const handleUnlike = async (postId) => {
      try {
        await dataApi.unlikePost(postId);
        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, user_likes: 0, likes_count: Math.max(0, (p.likes_count || 0) - 1) }
            : p
        ));
      } catch (err) {
        console.error('Erreur unlike:', err);
      }
    };

  const loadProfileData = async () => {
    setLoading(true);
    try {
      const allPosts = await dataApi.fetchPosts();
      setPosts(allPosts.filter((post) => post.email === user?.email));
      
      // Charger les followers et following
      if (user?.id) {
        const [followersData, followingData] = await Promise.all([
          dataApi.fetchFollowers(user.id),
          dataApi.fetchFollowing(user.id)
        ]);
        setFollowers(followersData || []);
        setFollowing(followingData || []);
        
        // Calculer les collaborateurs (mutual follow = vous vous followez mutuellement)
        const followerIds = new Set(followersData?.map(f => f.follower_id) || []);
        const collaborators = followingData?.filter(f => followerIds.has(f.followee_id)).length || 0;
        setCollaboratorsCount(collaborators);
      }
    } catch (err) {
      console.error('Erreur chargement profil utilisateur', err);
      setPosts([]);
      setFollowers([]);
      setFollowing([]);
      setCollaboratorsCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setDisplayName(user?.display_name || '');
    setBio(user?.bio || '');
    setRegionId(user?.region_id || '');
    setPhone(user?.phone || '');
    setProfileImageUrl(user?.profile_image_url || '/src/images/avatar.gif');
  }, [user]);

  useEffect(() => {
    loadProfileData();
  }, [user]);

  return (
    <div className={clsx(styles['profile-page'])}>
      <div className={clsx(styles['profile-card-main'])}>
        <div className={clsx(styles['mg-card'])}>
          <div className={clsx(styles['profile-basic-info'])} style={{ alignItems: 'flex-start', gap: '1rem',display: 'flex' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              style={{ display: 'none' }}
              onChange={handleAvatarFileChange}
              disabled={uploading}
            />
            <div style={{ minWidth: '180px', width: 'auto', textAlign: 'center' }}>
              <img
                src={profileImageUrl || '/src/images/avatar.gif'}
                alt="Profil"
                className={clsx(styles['profile-avatar-large'])}
                onClick={handleAvatarClick}
                style={{ cursor: 'pointer' }}
                title="Cliquer pour changer la photo de profil"
              />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 className={clsx(styles['profile-name'])} style={{ margin: 0 }}>
                    {displayName || user?.display_name || user?.email}
                  </h2>
                  <p className={clsx(styles['profile-role'])} style={{ margin: '0.2rem 0 0' }}>
                    {user?.role === 'farmer' ? 'Agriculteur' : 'Client'}
                  </p>
                </div>
                <button
                  type="button"
                  className={clsx(styles['mg-icon-btn'])}
                  onClick={() => setShowEditModal(true)}
                  title="Modifier le profil"
                  style={{ width: 38, height: 38, borderRadius: '50%', padding: 0 }}
                >
                  <FiMoreVertical />
                </button>
              </div>

              <div style={{ marginTop: '0.8rem' }}>
                <div style={{ maxHeight: '130px', overflowY: 'auto', paddingRight: '0.5rem', border: '1px solid #ddd', borderRadius: 6, padding: '0.5rem' }}>
                  <p style={{ margin: '0', fontSize: '0.95rem', lineHeight: 1.4 }}>
                    {bio || 'Ajoutez une biographie ici...'}
                  </p>
                </div>
                <div style={{ marginTop: '0.6rem' }}>
                  <p style={{ margin: '0.2rem 0', fontSize: '0.95rem' }}>
                    <strong>Localisation :</strong> {regionId || user?.region_id || 'Non définie'}
                  </p>
                  <p style={{ margin: '0.2rem 0', fontSize: '0.95rem' }}>
                    <strong>Contact :</strong> {phone || user?.phone || 'Non défini'}
                  </p>
                </div>
                {/* Abonnés Section */}
                <div className={clsx(styles['profile-followers-section'])}>
                  <div 
                    className={clsx(styles['followers-count'])} 
                    onClick={() => setShowFollowersModal(true)}
                    title="Voir les abonnés"
                  >
                    <FiUsers size={18} />
                    <span>{followers.length} abonnés</span>
                  </div>
                  <div 
                    className={clsx(styles['following-count'])}
                    onClick={() => setShowFollowingModal(true)}
                    title="Voir les abonnements"
                  >
                    <FiUsers size={18} />
                    <span>{following.length} abonnements</span>
                  </div>
                </div>
              </div>

              <div className={clsx(styles['profile-action-bar'])} style={{ marginTop: '0.8rem', display: 'flex', gap: '0.6rem' }}>
                <button type="button" className={clsx(styles['mg-simple-btn'])} onClick={onOpenCreate}>
                  Ajouter une publication
                </button>
                <button type="button" className={clsx(styles['mg-simple-btn'])} onClick={onOpenProduct}>
                  Ajouter un produit
                </button>
              </div>

              {showEditModal && (
                <div className={clsx(styles['mg-modal-overlay'])}>
                  <div className={clsx(styles['mg-modal-content'], styles['mg-card'])}>
                    <p
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className={clsx(styles['mg-modal-close'])}
                    >
                      <img src="/src/images/quitter.gif" alt="Quitter" />
                    </p>
                    <h3 className={clsx(styles['text-mg'], styles['font-700'])} style={{ marginBottom: '0.8rem' }}>Modifier votre profil</h3>
                    <label className={clsx(styles['mg-input-label'])}>
                      Nom :
                      <input className={clsx(styles['mg-input'])} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                    </label>
                    <label className={clsx(styles['mg-input-label'])}>
                      Bio :
                      <textarea className={clsx(styles['mg-input'])} value={bio} rows={4} onChange={(e) => setBio(e.target.value)} />
                    </label>
                    <label className={clsx(styles['mg-input-label'])}>
                      Localisation :
                      <select className={clsx(styles['mg-input'])} value={regionId} onChange={(e) => setRegionId(e.target.value)} disabled={regionsLoading}>
                        <option value="">Sélectionner une région</option>
                        {regions.map((region) => (
                          <option key={region.id} value={region.name}>
                            {region.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={clsx(styles['mg-input-label'])}>
                      Téléphone :
                      <input className={clsx(styles['mg-input'])} value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </label>
                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button type="button" className={clsx(styles['mg-simple-btn'])} onClick={() => setShowEditModal(false)}>
                        Annuler
                      </button>
                      <button type="button" className={clsx(styles['mg-tab-btn'])} onClick={handleSaveProfile} disabled={uploading}>
                        Enregistrer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={clsx(styles['profile-stats'])}>
            <div className={clsx(styles['profile-stat-item'])}>
              <strong>{posts.length}</strong>
              Publications
            </div>
            <div className={clsx(styles['profile-stat-item'])}>
              <strong>{collaboratorsCount}</strong>
              Collaborateurs
            </div>
            <div className={clsx(styles['profile-stat-item'])}>
              <strong>{products.length}</strong>
              Produits
            </div>
          </div>

          <div className={clsx(styles['profile-products-container'])}>
            <h3 style={{ margin: '1rem 0 0.5rem' }}>Mes produits</h3>
            {userProducts.length === 0 ? (
              <p className={clsx(styles['text-mg-muted'])}>Aucun produit affiché pour le moment.</p>
            ) : (
              <div className={clsx(styles['profile-products-scroll'])}>
                {userProducts.map((product) => (
                  <div key={product.id} className={clsx(styles['profile-product-card'])}>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.title} className={clsx(styles['profile-product-img'])} />
                    ) : (
                      <div className={clsx(styles['profile-product-noimg'])}>Pas d'image</div>
                    )}
                    <div style={{ padding: '0.6rem' }}>
                      <strong>{product.title}</strong>
                      <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>{Number(product.price).toLocaleString('fr-FR')} Ar</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Publications Section */}
      <div className={clsx(styles['profile-publications-section'])}>
        <h3 className="publications-title">
          Publications ({posts.length})
        </h3>
      
        {posts.length === 0 ? (
          <div className={clsx(styles['no-posts-message'])}>
            <p>Aucune publication pour le moment</p>
          </div>
        ) : (
          <div className="posts-grid">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onUnlike={handleUnlike}
                onRefresh={loadProfileData}
                onUserProfileClick={onUserProfileClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal Abonnés */}
          {showFollowersModal && (
            <div className={clsx(styles['mg-modal-overlay'])} onClick={() => setShowFollowersModal(false)}>
              <div className={clsx(styles['mg-modal-content'])} onClick={(e) => e.stopPropagation()}>
                <div className={clsx(styles['modal-header'])}>
                  <h3>Abonnés ({followers.length})</h3>
                  <button className={clsx(styles['modal-close'])} onClick={() => setShowFollowersModal(false)}>×</button>
                </div>
                <div className={clsx(styles['modal-body'])}>
                  {followers.length === 0 ? (
                    <p className={clsx(styles['empty-message'])}>Aucun abonné pour le moment</p>
                  ) : (
                    <ul className={clsx(styles['user-list'])}>
                      {followers.map((follower) => (
                        <li 
                          key={follower.follower_id} 
                          className={clsx(styles['user-list-item'])}
                          onClick={() => {
                            setShowFollowersModal(false);
                            if (onUserProfileClick) onUserProfileClick(follower.follower_id);
                          }}
                        >
                          <img 
                            src={follower.profile_image_url || '/src/images/avatar.gif'} 
                            alt={follower.display_name}
                            className={clsx(styles['user-list-avatar'])}
                          />
                          <div className={clsx(styles['user-list-info'])}>
                            <span className={clsx(styles['user-list-name'])}>{follower.display_name}</span>
                            <span className={clsx(styles['user-list-role'])}>{follower.role}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Modal Abonnements */}
          {showFollowingModal && (
            <div className={clsx(styles['mg-modal-overlay'])} onClick={() => setShowFollowingModal(false)}>
              <div className={clsx(styles['mg-modal-content'])} onClick={(e) => e.stopPropagation()}>
                <div className={clsx(styles['modal-header'])}>
                  <h3>Abonnements ({following.length})</h3>
                  <button className={clsx(styles['modal-close'])} onClick={() => setShowFollowingModal(false)}>×</button>
                </div>
                <div className={clsx(styles['modal-body'])}>
                  {following.length === 0 ? (
                    <p className={clsx(styles['empty-message'])}>Aucun abonnement pour le moment</p>
                  ) : (
                    <ul className={clsx(styles['user-list'])}>
                      {following.map((followed) => (
                        <li 
                          key={followed.followee_id} 
                          className={clsx(styles['user-list-item'])}
                          onClick={() => {
                            setShowFollowingModal(false);
                            if (onUserProfileClick) onUserProfileClick(followed.followee_id);
                          }}
                        >
                          <img 
                            src={followed.profile_image_url || '/src/images/avatar.gif'} 
                            alt={followed.display_name}
                            className={clsx(styles['user-list-avatar'])}
                          />
                          <div className={clsx(styles['user-list-info'])}>
                            <span className={clsx(styles['user-list-name'])}>{followed.display_name}</span>
                            <span className={clsx(styles['user-list-role'])}>{followed.role}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
    </div>
  );
}

function TabButton({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(styles['mg-tab-btn'], styles['min-w-130'], { [styles['active']]: active })}
    >
      {label}
    </button>
  );
}

function SettingsPanel({ user }) {
  const [theme, setTheme] = useState('dark');
  const [lang, setLang] = useState('fr');

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.body.classList.toggle('light-theme', nextTheme === 'light');
  }

  return (
    <div className={clsx(styles['space-y-3'])}>
      <h2 className={clsx(styles['text-mg'], styles['font-700'])}>Paramètres</h2>
      <div className={clsx(styles['mg-card'])}>
        <div className={clsx(styles['mb-10'])}>
          <strong>Profil :</strong> {user?.display_name || user?.email}
        </div>
        <button type="button" className={clsx(styles['mg-tab-btn'])} onClick={() => alert('Accéder au mur du profil')}>
          Aller au mur du profil
        </button>
      </div>

      <div className={clsx(styles['mg-card'])}>
        <h3 className={clsx(styles['text-mg'], styles['font-600'])}>Thème</h3>
        <p className={clsx(styles['text-mg-muted'])}>Actuel : {theme}</p>
        <button type="button" className={clsx(styles['mg-tab-btn'])} onClick={toggleTheme}>
          Basculer en mode {theme === 'dark' ? 'clair' : 'sombre'}
        </button>
      </div>

      <div className={clsx(styles['mg-card'])}>
        <h3 className={clsx(styles['text-mg'], styles['font-600'])}>Langue</h3>
        <select className={clsx(styles['mg-input'])} value={lang} onChange={(e) => setLang(e.target.value)}>
          <option value="fr">Français</option>
          <option value="en">Anglais</option>
        </select>
      </div>
    </div>
  );
}