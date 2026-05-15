import { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { FiMoreVertical, FiUsers } from 'react-icons/fi';
import { dataApi } from '../../../../lib/api';
import PostCard from '../../../Publications/PostCard';
import styles from '../../../../styles/Composants/TableauDeBord.module.css';

export default function ProfilePage({ user, products = [], onOpenCreate, onOpenProduct, onUserProfileClick }) {
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
      setProfileStatus('Photo de profil mise à jour');
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
      setProfileStatus('Format invalide');
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
      setProfileStatus(err.message || 'Erreur lors de upload.');
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
        setProfileStatus('Profil mis à jour');
        setShowEditModal(false);
      }
    } catch (err) {
      setProfileStatus(err.message || 'Erreur lors de la sauvegarde.');
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
      
      if (user?.id) {
        const [followersData, followingData] = await Promise.all([
          dataApi.fetchFollowers(user.id),
          dataApi.fetchFollowing(user.id)
        ]);
        setFollowers(followersData || []);
        setFollowing(followingData || []);
        
        const followerIds = new Set(followersData?.map(f => f.follower_id) || []);
        const collaborators = followingData?.filter(f => followerIds.has(f.followee_id)).length || 0;
        setCollaboratorsCount(collaborators);
      }
    } catch (err) {
      console.error('Erreur chargement profil utilisateur', err);
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
          <div className={clsx(styles['profile-basic-info'])} style={{ alignItems: 'flex-start', gap: '1rem', display: 'flex' }}>
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
                title="Cliquer pour changer"
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
                  style={{ width: 38, height: 38, borderRadius: '50%', padding: 0 }}
                >
                  <FiMoreVertical />
                </button>
              </div>

              <div style={{ marginTop: '0.8rem' }}>
                <p style={{ margin: '0', fontSize: '0.95rem', lineHeight: 1.4 }}>
                  {bio || 'Ajouter une bio'}
                </p>
              </div>
            </div>
          </div>

          <div className={clsx(styles['profile-stats'])}>
            <div 
              className={clsx(styles['profile-stat-item'])}
              onClick={() => setShowFollowersModal(true)}
              style={{ cursor: 'pointer' }}
              title="Voir les abonnés"
            >
              <strong>{followers.length}</strong>
              Abonné{followers.length > 1 ? 's' : ''}
            </div>
            <div 
              className={clsx(styles['profile-stat-item'])}
              onClick={() => setShowFollowingModal(true)}
              style={{ cursor: 'pointer' }}
              title="Voir les abonnements"
            >
              <strong>{following.length}</strong>
              Abonnement{following.length > 1 ? 's' : ''}
            </div>
            <div className={clsx(styles['profile-stat-item'])} title="Nombre de collaborateurs">
              <strong>{collaboratorsCount}</strong>
              Collaborateur{collaboratorsCount > 1 ? 's' : ''}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className={clsx(styles['mg-simple-btn'])} onClick={onOpenCreate}>
              Publication
            </button>
            <button type="button" className={clsx(styles['mg-simple-btn'])} onClick={onOpenProduct}>
              Produit
            </button>
          </div>

          {showEditModal && (
            <div className={clsx(styles['mg-modal-overlay'])}>
              <div className={clsx(styles['mg-modal-content'], styles['mg-card'])}>
                <h3 style={{ marginBottom: '0.8rem' }}>Modifier le profil</h3>
                <label className={clsx(styles['mg-input-label'])}>
                  Nom :
                  <input className={clsx(styles['mg-input'])} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </label>
                <label className={clsx(styles['mg-input-label'])}>
                  Bio :
                  <textarea className={clsx(styles['mg-input'])} value={bio} rows={4} onChange={(e) => setBio(e.target.value)} />
                </label>
                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button type="button" className={clsx(styles['mg-simple-btn'])} onClick={() => setShowEditModal(false)}>
                    Annuler
                  </button>
                  <button type="button" className={clsx(styles['mg-tab-btn'])} onClick={handleSaveProfile}>
                    Enregistrer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={clsx(styles['profile-publications-section'])}>
        <h3>Publications ({posts.length})</h3>
        {posts.length === 0 ? (
          <p>Aucune publication</p>
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
          <div className={clsx(styles['mg-modal-content'], styles['mg-card'])} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1rem' }}>Abonnés ({followers.length})</h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {followers.length === 0 ? (
                <p>Aucun abonné pour le moment</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {followers.map((follower) => (
                    <div 
                      key={follower.follower_id}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.8rem',
                        padding: '0.5rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onClick={() => {
                        setShowFollowersModal(false);
                        if (onUserProfileClick) onUserProfileClick(follower.follower_id);
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <img 
                        src={follower.profile_image_url || '/src/images/avatar.gif'} 
                        alt={follower.display_name}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontWeight: '500' }}>{follower.display_name}</div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>{follower.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className={clsx(styles['mg-simple-btn'])} 
                onClick={() => setShowFollowersModal(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Abonnements */}
      {showFollowingModal && (
        <div className={clsx(styles['mg-modal-overlay'])} onClick={() => setShowFollowingModal(false)}>
          <div className={clsx(styles['mg-modal-content'], styles['mg-card'])} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1rem' }}>Abonnements ({following.length})</h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {following.length === 0 ? (
                <p>Aucun abonnement pour le moment</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {following.map((followed) => (
                    <div 
                      key={followed.followee_id}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.8rem',
                        padding: '0.5rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onClick={() => {
                        setShowFollowingModal(false);
                        if (onUserProfileClick) onUserProfileClick(followed.followee_id);
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <img 
                        src={followed.profile_image_url || '/src/images/avatar.gif'} 
                        alt={followed.display_name}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontWeight: '500' }}>{followed.display_name}</div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>{followed.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className={clsx(styles['mg-simple-btn'])} 
                onClick={() => setShowFollowingModal(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
