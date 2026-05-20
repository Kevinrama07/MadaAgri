import { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { FiMail, FiPhone, FiMapPin, FiEdit, FiCamera, FiFileText } from 'react-icons/fi';
import { dataApi } from '../../lib/api';
import PostCard from '../Publications/PostCard';
import styles from './ProfilePage.module.css';

export default function ProfilePage({ user, onUserProfileClick }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profile_image_url || '/src/images/avatar.gif');
  const [profileStatus, setProfileStatus] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const fileInputRef = useRef(null);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [collaboratorsCount, setCollaboratorsCount] = useState(0);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false);

  const roleDisplay = { farmer: 'Agriculteur', client: 'Client', trader: 'Commercant' };

  const handleProfileUpdated = async (url) => {
    setProfileStatus('Enregistrement...');
    try {
      await dataApi.updateProfilePicture(url);
      setProfileImageUrl(url);
      setProfileStatus('Photo de profil mise a jour');
      setTimeout(() => setProfileStatus(''), 3000);
    } catch (err) {
      setProfileStatus(err.message || 'Impossible de mettre a jour.');
      setTimeout(() => setProfileStatus(''), 3000);
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleAvatarFileChange = async (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(selectedFile.type)) {
      setProfileStatus('Format invalide');
      setTimeout(() => setProfileStatus(''), 3000);
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setProfileStatus('Taille max 5MB.');
      setTimeout(() => setProfileStatus(''), 3000);
      return;
    }
    setUploading(true);
    setProfileStatus('Upload en cours...');
    try {
      const imageUrl = await dataApi.uploadImage(selectedFile);
      await handleProfileUpdated(imageUrl);
    } catch (err) {
      setProfileStatus(err.message || 'Erreur lors de upload.');
      setTimeout(() => setProfileStatus(''), 3000);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleSaveProfile = async () => {
    setProfileStatus('Enregistrement du profil...');
    try {
      const updatedUser = await dataApi.updateUserProfile({ displayName, bio, location, phone, profileImageUrl });
      if (updatedUser) {
        setProfileStatus('Profil mis a jour');
        setTimeout(() => { setProfileStatus(''); setShowEditModal(false); }, 2000);
      }
    } catch (err) {
      setProfileStatus(err.message || 'Erreur lors de la sauvegarde.');
      setTimeout(() => setProfileStatus(''), 3000);
    }
  };

  const handleLike = async (postId) => {
    try {
      await dataApi.likePost(postId);
      setPosts(posts.map(p => p.id === postId ? { ...p, user_likes: 1, likes_count: (p.likes_count || 0) + 1 } : p));
    } catch (err) { console.error('Erreur like:', err); }
  };

  const handleUnlike = async (postId) => {
    try {
      await dataApi.unlikePost(postId);
      setPosts(posts.map(p => p.id === postId ? { ...p, user_likes: 0, likes_count: Math.max(0, (p.likes_count || 0) - 1) } : p));
    } catch (err) { console.error('Erreur unlike:', err); }
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
        const collaboratorsList = followingData?.filter(f => followerIds.has(f.followee_id)) || [];
        setCollaborators(collaboratorsList);
        setCollaboratorsCount(collaboratorsList.length);
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
    setLocation(user?.location || '');
    setPhone(user?.phone || '');
    setProfileImageUrl(user?.profile_image_url || '/src/images/avatar.gif');
  }, [user]);

  useEffect(() => { loadProfileData(); }, [user]);

  const followersCount = followers.length;
  const followingCount = following.length;
  const publicationsCount = posts.length;

  return (
    <div className={styles.container}>
      {/* Cover + Profile Card */}
      <div className={styles.profileCard}>
        <div className={styles.coverArea} />
        <div className={styles.profileContent}>
          <div className={styles.avatarWrapper}>
            <img
              src={profileImageUrl || '/src/images/avatar.gif'}
              alt="Profil"
              className={styles.profilePicture}
              onClick={handleAvatarClick}
              title="Cliquer pour changer"
            />
            <div className={styles.cameraOverlay} onClick={handleAvatarClick}>
              <FiCamera />
            </div>
            {uploading && <div className={styles.uploadSpinner} />}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            style={{ display: 'none' }}
            onChange={handleAvatarFileChange}
            disabled={uploading}
          />

          <div className={styles.profileInfo}>
            <h1 className={styles.profileName}>{displayName || user?.display_name || user?.email}</h1>
            {user?.role && <span className={styles.roleBadge}>{roleDisplay[user?.role] || user?.role}</span>}

            {/* Stats */}
            <div className={styles.statsRow}>
              <button className={styles.statBtn} onClick={() => setShowFollowersModal(true)}>
                <span className={styles.statNumber}>{followersCount}</span>
                <span className={styles.statLabel}>abonn{followersCount > 1 ? '\u00e9s' : '\u00e9'}</span>
              </button>
              <div className={styles.statDivider} />
              <button className={styles.statBtn} onClick={() => setShowFollowingModal(true)}>
                <span className={styles.statNumber}>{followingCount}</span>
                <span className={styles.statLabel}>abonnement{followingCount > 1 ? 's' : ''}</span>
              </button>
              <div className={styles.statDivider} />
              <button className={styles.statBtn} onClick={() => setShowCollaboratorsModal(true)}>
                <span className={styles.statNumber}>{collaboratorsCount}</span>
                <span className={styles.statLabel}>collaborateur{collaboratorsCount > 1 ? 's' : ''}</span>
              </button>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{publicationsCount}</span>
                <span className={styles.statLabel}>publication{publicationsCount > 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Bio */}
            {bio && (
              <div className={styles.bioSection}>
                <FiFileText className={styles.bioIcon} />
                <p className={styles.bioText}>{bio}</p>
              </div>
            )}

            {/* Info */}
            <div className={styles.infoGrid}>
              {location && (
                <div className={styles.infoItem}>
                  <FiMapPin className={styles.infoIcon} />
                  <span>{location}</span>
                </div>
              )}
              <div className={styles.infoItem}>
                <FiMail className={styles.infoIcon} />
                <span>{user?.email || 'Non disponible'}</span>
              </div>
              {phone && (
                <div className={styles.infoItem}>
                  <FiPhone className={styles.infoIcon} />
                  <span>{phone}</span>
                </div>
              )}
            </div>

            {/* Edit Button */}
            <div className={styles.actionButtons}>
              <button className={clsx(styles.actionBtn, styles.editBtn)} onClick={() => setShowEditModal(true)}>
                <FiEdit /> Modifier le profil
              </button>
            </div>

            {profileStatus && <div className={styles.profileStatus}>{profileStatus}</div>}
          </div>
        </div>
      </div>

      {/* Publications */}
      <div className={styles.postsSection}>
        <h3 className={styles.sectionTitle}>Publications ({publicationsCount})</h3>
        {posts.length === 0 ? (
          <div className={styles.emptyPosts}>
            <FiFileText className={styles.emptyIcon} />
            <p>Aucune publication pour le moment</p>
          </div>
        ) : (
          <div className={styles.postsList}>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onLike={handleLike} onUnlike={handleUnlike} onRefresh={loadProfileData} onUserProfileClick={onUserProfileClick} />
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Modifier le profil</h3>
              <button className={styles.modalClose} onClick={() => setShowEditModal(false)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <label className={styles.inputLabel}>
                Nom d'affichage
                <input className={styles.inputField} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Votre nom" />
              </label>
              <label className={styles.inputLabel}>
                Bio
                <textarea className={clsx(styles.inputField, styles.textarea)} value={bio} rows={4} onChange={(e) => setBio(e.target.value)} placeholder="Parlez de vous..." />
              </label>
              <label className={styles.inputLabel}>
                Localisation
                <input className={styles.inputField} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ville, Pays" />
              </label>
              <label className={styles.inputLabel}>
                Telephone
                <input className={styles.inputField} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+261 XX XX XXX XX" />
              </label>
              <div className={styles.modalActions}>
                <button className={clsx(styles.modalBtn, styles.cancelBtn)} onClick={() => setShowEditModal(false)}>Annuler</button>
                <button className={clsx(styles.modalBtn, styles.saveBtn)} onClick={handleSaveProfile}>Enregistrer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Followers Modal */}
      {showFollowersModal && (
        <UserListModal title={`Abonn\u00e9s (${followersCount})`} users={followers} idKey="follower_id" onClose={() => setShowFollowersModal(false)} onUserClick={onUserProfileClick} />
      )}
      {showFollowingModal && (
        <UserListModal title={`Abonnements (${followingCount})`} users={following} idKey="followee_id" onClose={() => setShowFollowingModal(false)} onUserClick={onUserProfileClick} />
      )}
      {showCollaboratorsModal && (
        <UserListModal title={`Collaborateurs (${collaboratorsCount})`} users={collaborators} idKey="followee_id" onClose={() => setShowCollaboratorsModal(false)} onUserClick={onUserProfileClick} />
      )}
    </div>
  );
}

function UserListModal({ title, users, idKey, onClose, onUserClick }) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{title}</h3>
          <button className={styles.modalClose} onClick={onClose}>&times;</button>
        </div>
        <div className={styles.modalBody}>
          {users.length === 0 ? (
            <p className={styles.emptyMessage}>Aucun r\u00e9sultat</p>
          ) : (
            <ul className={styles.userList}>
              {users.map((u) => (
                <li key={u[idKey]} className={styles.userListItem} onClick={() => { onClose(); if (onUserClick) onUserClick(u[idKey]); }}>
                  <img src={u.profile_image_url || '/src/images/avatar.gif'} alt={u.display_name} className={styles.userListAvatar} />
                  <div className={styles.userListInfo}>
                    <span className={styles.userListName}>{u.display_name}</span>
                    <span className={styles.userListRole}>{u.role}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
