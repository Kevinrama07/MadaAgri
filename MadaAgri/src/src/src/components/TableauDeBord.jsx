import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/ContextAuthentification';
import { dataApi } from '../lib/api';
import Navigation from './Navigation';
import ImageUploader from './ImageUploader';
import ListeProduits from './ListeProduits';
import FormulaireProduit from './FormulaireProduit';
import Messagerie from './Messagerie';
import Carte from './Carte';
import AnalyseCulture from './AnalyseCulture';
import OptimisationItineraire from './OptimisationItineraire';
import FilActualites from './FilActualites';
import FormulairePublication from './FormulairePublication';
import Reseau from './Reseau';
import Recherche from './Recherche';

const TABS = {
  FEED: 'feed',
  POST: 'post',
  PRODUCTS: 'products',
  CREATE: 'create',
  MESSAGES: 'messages',
  MAP: 'map',
  ANALYSIS: 'analysis',
  ROUTES: 'routes',
  NETWORK: 'network',
  SEARCH: 'search',
  PROFILE: 'profile',
  SETTINGS: 'settings'
};

export default function TableauDeBord() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState(TABS.FEED);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const productList = await dataApi.fetchProducts();
      setProducts(productList);
    } catch (err) {
      console.error('Erreur fetch products', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  function handleProductCreated() {
    setActiveTab(TABS.PRODUCTS);
    fetchProducts();
  }

  const isFarmer = user && user.role === 'farmer';
  const [searchValue, setSearchValue] = useState('');

  return (
    <div className="mg-shell">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="mg-content">
        <div className="mg-topbar mg-top-navbar">
          <div className="mg-topbar-left">
            <button
              type="button"
              className="mg-profile-button"
              onClick={() => setActiveTab(TABS.PROFILE)}
              title="Voir mon profil"
            >
              <img src={user?.profile_image_url || '/src/assets/avatar.gif'} alt="Profil" className="mg-profile-avatar" />
              <span>{user?.display_name || user?.email}</span>
              <i className="fas fa-ellipsis-v ml-8"></i>
            </button>
            <input
              type="search"
              className="mg-input mg-search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Rechercher amis, posts, produits..."
            />
          </div>

          <div className="mg-topbar-center">
            <button
              type="button"
              className={`mg-icon-btn ${activeTab === TABS.FEED ? 'active' : ''}`}
              onClick={() => setActiveTab(TABS.FEED)}
              title="Accueil"
            >
              <i className="fas fa-home"></i>
            </button>
            <button
              type="button"
              className={`mg-icon-btn ${activeTab === TABS.POST ? 'active' : ''}`}
              onClick={() => setActiveTab(TABS.POST)}
              title="Créer publication"
            >
              <i className="fas fa-pencil-alt"></i>
            </button>
            <button
              type="button"
              className={`mg-icon-btn ${activeTab === TABS.NETWORK ? 'active' : ''}`}
              onClick={() => setActiveTab(TABS.NETWORK)}
              title="Invitations collaborateur"
            >
              <i className="fas fa-user-friends"></i>
            </button>
            <button
              type="button"
              className={`mg-icon-btn ${activeTab === TABS.MESSAGES ? 'active' : ''}`}
              onClick={() => setActiveTab(TABS.MESSAGES)}
              title="Messages"
            >
              <i className="fas fa-comments"></i>
            </button>
          </div>

          <div className="mg-topbar-right">
            <button
              type="button"
              className="mg-icon-btn"
              title="Notifications"
              onClick={() => alert('Aucune notification pour le moment.')}
            >
              <i className="fas fa-bell"></i>
            </button>
            <button
              type="button"
              className={`mg-icon-btn ${activeTab === TABS.SETTINGS ? 'active' : ''}`}
              onClick={() => setActiveTab(TABS.SETTINGS)}
              title="Paramètres"
            >
              <i className="fas fa-cog"></i>
            </button>
            <button
              type="button"
              className="mg-simple-btn ml-10"
              onClick={signOut}
              title="Déconnexion"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>

        <section className="mg-panel">
          {activeTab === TABS.FEED && <FilActualites />}
          {activeTab === TABS.POST && <FormulairePublication onCreated={() => setActiveTab(TABS.FEED)} />}
          {activeTab === TABS.PRODUCTS && <ListeProduits products={products} loading={loading} />}
          {activeTab === TABS.MESSAGES && <Messagerie />}
          {activeTab === TABS.MAP && <Carte />}
          {activeTab === TABS.ANALYSIS && <AnalyseCulture />}
          {activeTab === TABS.NETWORK && <Reseau />}
          {activeTab === TABS.SEARCH && <Recherche />}
          {activeTab === TABS.ROUTES && isFarmer && <OptimisationItineraire />}
          {activeTab === TABS.PROFILE && <ProfilePage user={user} products={products} onOpenCreate={() => setActiveTab(TABS.POST)} onOpenProduct={() => setActiveTab(TABS.CREATE)} />}
          {activeTab === TABS.SETTINGS && <SettingsPanel user={user} />}
        </section>

        {activeTab === TABS.CREATE && isFarmer && (
          <div className="mg-modal-overlay">
            <div className="mg-modal-content mg-card" style={{ width: '80%', maxWidth: '700px' }}>
              <button
                type="button"
                className="mg-modal-close"
                onClick={() => setActiveTab(TABS.FEED)}
              >
                ✕
              </button>
              <FormulaireProduit onSuccess={handleProductCreated} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ProfilePage({ user, products = [], onOpenCreate, onOpenProduct }) {
  const [posts, setPosts] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profile_image_url || '/src/assets/avatar.gif');

  const userProducts = products.filter((p) => p.farmer_id === user?.id);
  const [profileStatus, setProfileStatus] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [regionId, setRegionId] = useState(user?.region_id || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const fileInputRef = useRef(null);

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

  useEffect(() => {
    setDisplayName(user?.display_name || '');
    setBio(user?.bio || '');
    setRegionId(user?.region_id || '');
    setPhone(user?.phone || '');
    setProfileImageUrl(user?.profile_image_url || '/src/assets/avatar.gif');
  }, [user]);

  useEffect(() => {
    async function loadProfileData() {
      setLoading(true);
      try {
        const allPosts = await dataApi.fetchPosts();
        setPosts(allPosts.filter((post) => post.email === user?.email));
        const suggestions = await dataApi.fetchNetworkSuggestions();
        setCollaborators(suggestions);
      } catch (err) {
        console.error('Erreur chargement profil utilisateur', err);
        setPosts([]);
        setCollaborators([]);
      } finally {
        setLoading(false);
      }
    }
    loadProfileData();
  }, [user]);

  return (
    <div className="profile-page">
      <div className="profile-card-main">
        <div className="mg-card">
          <div className="profile-basic-info" style={{ alignItems: 'flex-start', gap: '1rem',display: 'flex' }}>
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
                src={profileImageUrl || '/src/assets/avatar.gif'}
                alt="Profil"
                className="profile-avatar-large"
                onClick={handleAvatarClick}
                style={{ cursor: 'pointer' }}
                title="Cliquer pour changer la photo de profil"
              />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 className="profile-name" style={{ margin: 0 }}>
                    {displayName || user?.display_name || user?.email}
                  </h2>
                  <p className="profile-role" style={{ margin: '0.2rem 0 0' }}>
                    {user?.role === 'farmer' ? 'Agriculteur' : 'Client'}
                  </p>
                </div>
                <button
                  type="button"
                  className="mg-icon-btn"
                  onClick={() => setShowEditModal(true)}
                  title="Modifier le profil"
                  style={{ width: 38, height: 38, borderRadius: '50%', padding: 0 }}
                >
                  <i className="fas fa-ellipsis-v"></i>
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
              </div>

              <div className="profile-action-bar" style={{ marginTop: '0.8rem', display: 'flex', gap: '0.6rem' }}>
                <button type="button" className="mg-simple-btn" onClick={onOpenCreate}>
                  Ajouter une publication
                </button>
                <button type="button" className="mg-simple-btn" onClick={onOpenProduct}>
                  Ajouter un produit
                </button>
              </div>

              {showEditModal && (
                <div className="mg-modal-overlay">
                  <div className="mg-modal-content mg-card">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="mg-modal-close"
                    >
                      ✕
                    </button>
                    <h3 className="text-mg font-700" style={{ marginBottom: '0.8rem' }}>Modifier votre profil</h3>
                    <label className="mg-input-label">
                      Nom :
                      <input className="mg-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                    </label>
                    <label className="mg-input-label">
                      Bio :
                      <textarea className="mg-input" value={bio} rows={4} onChange={(e) => setBio(e.target.value)} />
                    </label>
                    <label className="mg-input-label">
                      Localisation (region_id) :
                      <input className="mg-input" value={regionId} onChange={(e) => setRegionId(e.target.value)} />
                    </label>
                    <label className="mg-input-label">
                      Téléphone :
                      <input className="mg-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </label>
                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button type="button" className="mg-simple-btn" onClick={() => setShowEditModal(false)}>
                        Annuler
                      </button>
                      <button type="button" className="mg-tab-btn" onClick={handleSaveProfile} disabled={uploading}>
                        Enregistrer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="profile-stats">
            <div className="profile-stat-item">
              <strong>{posts.length}</strong>
              Publications
            </div>
            <div className="profile-stat-item">
              <strong>{collaborators.length}</strong>
              Collaborateurs
            </div>
            <div className="profile-stat-item">
              <strong>{products.length}</strong>
              Produits
            </div>
          </div>

          <div className="profile-products-container">
            <h3 style={{ margin: '1rem 0 0.5rem' }}>Mes produits</h3>
            {userProducts.length === 0 ? (
              <p className="text-mg-muted">Aucun produit affiché pour le moment.</p>
            ) : (
              <div className="profile-products-scroll">
                {userProducts.map((product) => (
                  <div key={product.id} className="profile-product-card">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.title} className="profile-product-img" />
                    ) : (
                      <div className="profile-product-noimg">Pas d'image</div>
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

      <div className="profile-posts">
      {loading ? (
        <p className="text-mg-muted">Chargement...</p>
      ) : posts.length === 0 ? (
        <p className="text-mg-muted">Aucune publication pour le moment.</p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="mg-card">
              <div className="flex items-center gap-2">
                <img src="/src/assets/avatar.gif" alt="Profil" className="profile-avatar-large" />
                <div>
                  <div className="font-700 text-mg">{post.display_name || post.email}</div>
                  <div className="text-mg-muted text-xs">{new Date(post.created_at).toLocaleString('fr-FR')}</div>
                </div>
              </div>
              <p className="text-mg mt-8">{post.content}</p>
              {post.image_url && <img src={post.image_url} alt="Post" className="full-width rounded-10 mt-8" />}
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

function TabButton({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mg-tab-btn min-w-130 ${active ? 'active' : ''}`}
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
    <div className="space-y-3">
      <h2 className="text-mg font-700">Paramètres</h2>
      <div className="mg-card">
        <div className="mb-10">
          <strong>Profil :</strong> {user?.display_name || user?.email}
        </div>
        <button type="button" className="mg-tab-btn" onClick={() => alert('Accéder au mur du profil')}>
          Aller au mur du profil
        </button>
      </div>

      <div className="mg-card">
        <h3 className="text-mg font-600">Thème</h3>
        <p className="text-mg-muted">Actuel : {theme}</p>
        <button type="button" className="mg-tab-btn" onClick={toggleTheme}>
          Basculer en mode {theme === 'dark' ? 'clair' : 'sombre'}
        </button>
      </div>

      <div className="mg-card">
        <h3 className="text-mg font-600">Langue</h3>
        <select className="mg-input" value={lang} onChange={(e) => setLang(e.target.value)}>
          <option value="fr">Français</option>
          <option value="en">Anglais</option>
        </select>
      </div>
    </div>
  );
}