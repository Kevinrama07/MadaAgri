import { useEffect, useState } from 'react';
import { FiArrowLeft, FiMail, FiPhone, FiUserPlus, FiUserCheck, FiUserX, FiUsers } from 'react-icons/fi';
import clsx from 'clsx';
import { usePageLoading } from '../../hooks/usePageLoading';
import { SkeletonBox, SkeletonCard, SkeletonAvatar } from '../../components/Skeleton';
import { useAuth } from '../../contexts/ContextAuthentification';
import { dataApi } from '../../lib/api';
import PostCard from '../Publications/PostCard';
import styles from '../../styles/Utilisateurs/UserProfile.module.css';

export default function UserProfile({ userId, onBack, onUserProfileClick }) {
  const { user: currentUser } = useAuth();
  const { isLoading, startLoading, stopLoading, hasShownSkeletons, markSkeletonsShown } = usePageLoading();
  
  useEffect(() => {
    if (isLoading && !hasShownSkeletons) {
      markSkeletonsShown();
    }
  }, [isLoading, hasShownSkeletons, markSkeletonsShown]);
  const [userProfile, setUserProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [invitationLoading, setInvitationLoading] = useState(false);
  const [invitationSent, setInvitationSent] = useState(false);
  const [isCollaborator, setIsCollaborator] = useState(false);

  useEffect(() => {
    if (!userId) {
      setError('ID utilisateur manquant');
      stopLoading();
      return;
    }
    fetchUserProfile();
  }, [userId]);

  async function fetchUserProfile() {
    startLoading();
    setError(null);
    try {
      const profileData = await dataApi.fetchUserProfile(userId);
      setUserProfile(profileData.user);
      const posts = await dataApi.fetchUserPosts(userId);
      setUserPosts(posts || []);
      try {
        const followStatus = await dataApi.fetchFollowStatus(userId);
        setIsFollowing(followStatus.isFollowing || false);
        setIsCollaborator((followStatus.isFollowing && followStatus.isFollowedBy) || false);
      } catch (followErr) {
        console.warn('Erreur chargement suivi:', followErr);
        setIsFollowing(false);
        setIsCollaborator(false);
      }

      // Check if an invitation was already sent to this user
      try {
        const suggestions = await dataApi.fetchNetworkSuggestions();
        const userSuggestion = suggestions.find(u => u.id === userId);
        setInvitationSent(userSuggestion?.invitationSent || false);
      } catch (invErr) {
        console.warn('Erreur chargement invitation:', invErr);
        setInvitationSent(false);
      }

      // Load followers and following
      try {
        const [followersData, followingData] = await Promise.all([
          dataApi.fetchFollowers(userId),
          dataApi.fetchFollowing(userId)
        ]);
        setFollowers(followersData || []);
        setFollowing(followingData || []);
      } catch (followErr) {
        console.warn('Erreur chargement followers/following:', followErr);
      }
    } catch (err) {
      console.error('Erreur chargement profil:', err);
      setError(err.message || 'Erreur lors du chargement du profil');
    } finally {
      stopLoading();
    }
  }

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await dataApi.unfollowUser(userId);
        setIsFollowing(false);
        setIsCollaborator(false);
      } else {
        await dataApi.followUser(userId);
        setIsFollowing(true);
        // Check if the other person also follows us
        const followStatus = await dataApi.fetchFollowStatus(userId);
        setIsCollaborator((followStatus.isFollowing && followStatus.isFollowedBy) || false);
      }
    } catch (err) {
      console.error('Erreur suivi:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSendInvitation = async () => {
    setInvitationLoading(true);
    try {
      await dataApi.sendCollaborationInvitation(userId, '');
      setInvitationSent(true);
    } catch (err) {
      console.error('Erreur invitation:', err);
    } finally {
      setInvitationLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await dataApi.likePost(postId);
      setUserPosts(userPosts.map(p => 
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
      setUserPosts(userPosts.map(p => 
        p.id === postId 
          ? { ...p, user_likes: 0, likes_count: Math.max(0, (p.likes_count || 0) - 1) }
          : p
      ));
    } catch (err) {
      console.error('Erreur unlike:', err);
    }
  };

  const roleDisplay = {
    farmer: 'Agriculteur',
    client: 'Client',
    trader: 'Commerçant'
  };

  if (isLoading && !hasShownSkeletons) {
    return (
      <div className={clsx(styles['user-profile-container'])}>
        <div className={clsx(styles['user-profile-header'])}>
          <button className={clsx(styles['user-profile-back-btn'])} onClick={onBack} title="Retour">
            <FiArrowLeft />
          </button>
          <h2>Chargement...</h2>
        </div>
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <SkeletonAvatar width="120px" height="120px" />
          <SkeletonBox width="80%" height="40px" />
          <SkeletonBox width="60%" height="30px" />
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className={clsx(styles['user-profile-container'])}>
        <div className={clsx(styles['user-profile-header'])}>
          <button className={clsx(styles['user-profile-back-btn'])} onClick={onBack} title="Retour">
            <FiArrowLeft />
          </button>
          <h2>Profil utilisateur</h2>
        </div>
        <div className={clsx(styles['error-message'])}>
          {error || 'Utilisateur non trouvé'}
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser.id === userId;
  return (
    <div className={clsx(styles['user-profile-container'])}>
      <div className={clsx(styles['user-profile-header'])}>
        <button className={clsx(styles['user-profile-back-btn'])} onClick={onBack} title="Retour">
          <FiArrowLeft />
        </button>
        <h2>{userProfile.display_name}</h2>
      </div>

      <div className={clsx(styles['user-profile-card'])}>
        <div className={clsx(styles['profile-top-section'])}>
          <img
            src={userProfile.profile_image_url || '/src/images/avatar.gif'}
            alt={userProfile.display_name}
            className={clsx(styles['profile-picture'])}
          />

          <div className={clsx(styles['profile-info'])}>
            <h1 className={clsx(styles['profile-name'])}>{userProfile.display_name}</h1>
            <div className={clsx(styles['profile-role'])}>
              {roleDisplay[userProfile.role] || userProfile.role}
            </div>

            {userProfile.bio && (
              <p className={clsx(styles['profile-bio'])}>{userProfile.bio}</p>
            )}

            {/* Contacts Section */}
            <div className={clsx(styles['profile-contacts'])}>
              <div className={clsx(styles['contact-item'])}>
                <FiMail size={18} />
                <span>{userProfile.email || 'Non disponible'}</span>
              </div>
              {userProfile.phone && (
                <div className={clsx(styles['contact-item'])}>
                  <FiPhone size={18} />
                  <span>{userProfile.phone}</span>
                </div>
              )}
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
              {isCollaborator && (
                <div className={clsx(styles['collaborator-badge'])} title="Collaboration mutuel (vous vous followez)">
                  <FiUserCheck size={16} />
                  Collaborateurs
                </div>
              )}
            </div>

            {!isOwnProfile && (
              <div className={clsx(styles['profile-actions'])}>
                <button 
                  className={clsx(styles['action-btn'], styles['add-btn'])} 
                  onClick={handleSendInvitation}
                  disabled={invitationLoading || invitationSent || isCollaborator}
                  title={invitationSent ? 'Invitation déjà envoyée' : isCollaborator ? 'Vous êtes collaborateurs' : 'Envoyer une invitation'}
                >
                  <FiUserPlus size={18} />
                  <span>{invitationSent ? 'Invitation envoyée' : isCollaborator ? '✔️ Collaborateurs' : 'Ajouter'}</span>
                </button>
                <button
                  className={clsx('action-btn', { 'following-btn': isFollowing, 'follow-btn': !isFollowing })}
                  onClick={handleFollow}
                  disabled={followLoading}
                  title={isFollowing ? 'Arrêter de suivre' : 'Suivre'}
                >
                  {isFollowing ? (
                    <>
                      <FiUserCheck size={18} />
                      <span>{isCollaborator ? 'Ne plus suivre' : 'Suivi'}</span>
                    </>
                  ) : (
                    <>
                      <FiUserX size={18} />
                      <span>Suivre</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Publications Section */}
        <div className={clsx(styles['profile-publications-section'])}>
          <h3 className={clsx(styles['publications-title'])}>
            Publications ({userPosts.length})
          </h3>

          {userPosts.length === 0 ? (
            <div className={clsx(styles['no-posts-message'])}>
              <p>Aucune publication pour le moment</p>
            </div>
          ) : (
            <div className={clsx(styles['posts-grid'])}>
              {userPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={handleLike}
                  onUnlike={handleUnlike}
                  onRefresh={fetchUserProfile}
                  onUserProfileClick={onUserProfileClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>

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
        <div className={clsx(styles['modal-overlay'])} onClick={() => setShowFollowingModal(true)}>
          <div className={clsx(styles['modal-content'])} onClick={(e) => e.stopPropagation()}>
            <div className={clsx(styles['modal-header'])}>
              <h3>Abonnements ({following.length})</h3>
              <button className={clsx(styles['modal-close'])} onClick={() => setShowFollowingModal(true)}>×</button>
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
                        setShowFollowingModal(true);
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
