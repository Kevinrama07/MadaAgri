import { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { FiMail, FiPhone, FiMapPin, FiEdit } from 'react-icons/fi';
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
  const [collaboratorsCount, setCollaboratorsCount] = useState(0);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false);
  const [collaborators, setCollaborators] = useState([]);

  const roleDisplay = {
    farmer: 'Agriculteur',
    client: 'Client',
    trader: 'Commerçant'
  };

  const handleProfileUpdated = async (url) => {
    setProfileStatus('Enregistrement...');
    try {
      await dataApi.updateProfilePicture(url);
      setProfileImageUrl(url);
      setProfileStatus('Photo de profil mise à jour');
      setTimeout(() => setProfileStatus(''), 3000);
    } catch (err) {
      setProfileStatus(err.message || 'Impossible de mettre à jour.');
      setTimeout(() => setProfileStatus(''), 3000);
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
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
      const updatedUser = await dataApi.updateUserProfile({
        displayName,
        bio,
        location,
        phone,
        profileImageUrl
      });
      if (updatedUser) {
        setProfileStatus('Profil mis à jour');
        setTimeout(() => {
          setProfileStatus('');
          setShowEditModal(false);
        }, 2000);
      }
    } catch (err) {
      setProfileStatus(err.message || 'Erreur lors de la sauvegarde.');
      setTimeout(() => setProfileStatus(''), 3000);
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
        
        // Collaborateurs = ceux qui me suivent ET que je suis (suivi mutuel)
        const followerIds = new Set(followersData?.map(f => f.follower_id) || []);
        const collaboratorsList = followingData?.filter(f => followerIds.has(f.followee_id)) || [];
        
        console.log('[ProfilePage] User ID:', user.id);
        console.log('[ProfilePage] Followers:', followersData?.length, followersData);
        console.log('[ProfilePage] Following:', followingData?.length, followingData);
        console.log('[ProfilePage] Follower IDs:', Array.from(followerIds));
        console.log('[ProfilePage] Collaborators (mutual):', collaboratorsList.length, collaboratorsList);
        
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

  useEffect(() => {
    loadProfileData();
  }, [user]);

  return (
    <div className={clsx(styles['profile-page-container'])}>
      <div className={clsx(styles['profile-page-card'])}>
        <div className={clsx(styles['profile-top-section'])}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            style={{ display: 'none' }}
            onChange={handleAvatarFileChange}
            disabled={uploading}
          />
          
          <img
            src={profileImageUrl || '/src/images/avatar.gif'}
            alt="Profil"
            className={clsx(styles['profile-picture'])}
            onClick={handleAvatarClick}
            title="Cliquer pour changer"
          />

          <div className={clsx(styles['profile-info'])}>
            <h1 className={clsx(styles['profile-name'])}>
              {displayName || user?.display_name || user?.email}
            </h1>
            
            {/* Stats style Facebook - sous le nom */}
            <div className={clsx(styles['profile-stats-compact'])}>
              <span 
                className={clsx(styles['stat-item'])} 
                onClick={() => setShowFollowersModal(true)}
                title="Voir les abonnés"
              >
                <strong>{followers.length}</strong> abonné{followers.length > 1 ? 's' : ''}
              </span>
              <span className={clsx(styles['stat-separator'])}>·</span>
              <span 
                className={clsx(styles['stat-item'])}
                onClick={() => setShowFollowingModal(true)}
                title="Voir les abonnements"
              >
                <strong>{following.length}</strong> abonnement{following.length > 1 ? 's' : ''}
              </span>
              <span className={clsx(styles['stat-separator'])}>·</span>
              <span 
                className={clsx(styles['stat-item'])} 
                onClick={() => setShowCollaboratorsModal(true)}
                title="Voir les collaborateurs"
              >
                <strong>{collaboratorsCount}</strong> collaborateur{collaboratorsCount > 1 ? 's' : ''}
              </span>
            </div>

            <div className={clsx(styles['profile-role'])}>
              {roleDisplay[user?.role] || user?.role}
            </div>

            {/* Bio */}
            {bio && (
              <div className={clsx(styles['profile-section'])}>
                <p className={clsx(styles['profile-bio'])}>{bio}</p>
              </div>
            )}

            {/* Localisation */}
            {location && (
              <div className={clsx(styles['profile-section'])}>
                <div className={clsx(styles['info-item'])}>
                  <FiMapPin size={16} />
                  <span>{location}</span>
                </div>
              </div>
            )}

            {/* Contact */}
            <div className={clsx(styles['profile-section'])}>
              <div className={clsx(styles['info-item'])}>
                <FiMail size={16} />
                <span>{user?.email || 'Non disponible'}</span>
              </div>
              {phone && (
                <div className={clsx(styles['info-item'])}>
                  <FiPhone size={16} />
                  <span>{phone}</span>
                </div>
              )}
            </div>

            {/* Bouton d'action */}
            <div className={clsx(styles['profile-actions'])}>
              <button 
                className={clsx(styles['action-btn'], styles['edit-btn'])}
                onClick={() => setShowEditModal(true)}
                title="Modifier le profil"
              >
                <FiEdit size={18} />
                <span>Modifier le profil</span>
              </button>
            </div>

            {/* Status message */}
            {profileStatus && (
              <div className={clsx(styles['profile-status'])}>
                {profileStatus}
              </div>
            )}
          </div>
        </div>

        {/* Publications Section */}
        <div className={clsx(styles['profile-publications-section'])}>
          <h3 className={clsx(styles['publications-title'])}>
            Publications ({posts.length})
          </h3>

          {posts.length === 0 ? (
            <div className={clsx(styles['no-posts-message'])}>
              <p>Aucune publication pour le moment</p>
            </div>
          ) : (
            <div className={clsx(styles['posts-grid'])}>
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
      </div>

      {/* Modal Modifier le profil */}
      {showEditModal && (
        <div className={clsx(styles['modal-overlay'])} onClick={() => setShowEditModal(false)}>
          <div className={clsx(styles['modal-content'])} onClick={(e) => e.stopPropagation()}>
            <div className={clsx(styles['modal-header'])}>
              <h3>Modifier le profil</h3>
              <button className={clsx(styles['modal-close'])} onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className={clsx(styles['modal-body'])}>
              <label className={clsx(styles['input-label'])}>
                Nom d'affichage :
                <input 
                  className={clsx(styles['input-field'])} 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)} 
                  placeholder="Votre nom"
                />
              </label>
              <label className={clsx(styles['input-label'])}>
                Bio :
                <textarea 
                  className={clsx(styles['input-field'])} 
                  value={bio} 
                  rows={4} 
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Parlez de vous..."
                />
              </label>
              <label className={clsx(styles['input-label'])}>
                Localisation :
                <input 
                  className={clsx(styles['input-field'])} 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ville, Pays"
                />
              </label>
              <label className={clsx(styles['input-label'])}>
                Téléphone :
                <input 
                  className={clsx(styles['input-field'])} 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+261 XX XX XXX XX"
                />
              </label>
              <div className={clsx(styles['modal-actions'])}>
                <button 
                  type="button" 
                  className={clsx(styles['btn-cancel'])} 
                  onClick={() => setShowEditModal(false)}
                >
                  Annuler
                </button>
                <button 
                  type="button" 
                  className={clsx(styles['btn-save'])} 
                  onClick={handleSaveProfile}
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Abonnés */}
      {showFollowersModal && (
        <div className={clsx(styles['modal-overlay'])} onClick={() => setShowFollowersModal(false)}>
          <div className={clsx(styles['modal-content'])} onClick={(e) => e.stopPropagation()}>
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
                        <span className={clsx(styles['user-list-role'])}>{roleDisplay[follower.role] || follower.role}</span>
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
        <div className={clsx(styles['modal-overlay'])} onClick={() => setShowFollowingModal(false)}>
          <div className={clsx(styles['modal-content'])} onClick={(e) => e.stopPropagation()}>
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
                        <span className={clsx(styles['user-list-role'])}>{roleDisplay[followed.role] || followed.role}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Collaborateurs */}
      {showCollaboratorsModal && (
        <div className={clsx(styles['modal-overlay'])} onClick={() => setShowCollaboratorsModal(false)}>
          <div className={clsx(styles['modal-content'])} onClick={(e) => e.stopPropagation()}>
            <div className={clsx(styles['modal-header'])}>
              <h3>Collaborateurs ({collaborators.length})</h3>
              <button className={clsx(styles['modal-close'])} onClick={() => setShowCollaboratorsModal(false)}>×</button>
            </div>
            <div className={clsx(styles['modal-body'])}>
              {collaborators.length === 0 ? (
                <p className={clsx(styles['empty-message'])}>Aucun collaborateur pour le moment</p>
              ) : (
                <ul className={clsx(styles['user-list'])}>
                  {collaborators.map((collaborator) => (
                    <li 
                      key={collaborator.followee_id} 
                      className={clsx(styles['user-list-item'])}
                      onClick={() => {
                        setShowCollaboratorsModal(false);
                        if (onUserProfileClick) onUserProfileClick(collaborator.followee_id);
                      }}
                    >
                      <img 
                        src={collaborator.profile_image_url || '/src/images/avatar.gif'} 
                        alt={collaborator.display_name}
                        className={clsx(styles['user-list-avatar'])}
                      />
                      <div className={clsx(styles['user-list-info'])}>
                        <span className={clsx(styles['user-list-name'])}>{collaborator.display_name}</span>
                        <span className={clsx(styles['user-list-role'])}>{roleDisplay[collaborator.role] || collaborator.role}</span>
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
