import { useEffect, useState } from 'react';
import { FiArrowLeft, FiMail, FiPhone, FiMapPin, FiMessageSquare, FiUserPlus, FiUserCheck, FiUserX, FiUsers, FiAtSign, FiFileText } from 'react-icons/fi';
import clsx from 'clsx';
import { usePageLoading } from '../../hooks/usePageLoading';
import { SkeletonBox, SkeletonCard, SkeletonAvatar } from '../../components/Skeleton';
import { useAuth } from '../../contexts/ContextAuthentification';
import { dataApi } from '../../lib/api';
import PostCard from '../Publications/PostCard';
import styles from './UserProfile.module.css';

export default function UserProfile({ userId, onBack, onUserProfileClick }) {
  const { user: currentUser } = useAuth();
  const { isLoading, startLoading, stopLoading, hasShownSkeletons, markSkeletonsShown } = usePageLoading();
  
  useEffect(() => {
    if (isLoading && !hasShownSkeletons) markSkeletonsShown();
  }, [isLoading, hasShownSkeletons, markSkeletonsShown]);

  const [userProfile, setUserProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [error, setError] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false);
  const [collaborators, setCollaborators] = useState([]);

  // Follow & collaboration state
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowedBy, setIsFollowedBy] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [invitationSent, setInvitationSent] = useState(false);
  const [receivedInvitation, setReceivedInvitation] = useState(null);
  const [invitationLoading, setInvitationLoading] = useState(false);
  const [isCollaborator, setIsCollaborator] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);

  useEffect(() => {
    if (!userId) { setError('ID utilisateur manquant'); stopLoading(); return; }
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

      const [followersData, followingData] = await Promise.all([
        dataApi.fetchFollowers(userId),
        dataApi.fetchFollowing(userId)
      ]);
      setFollowers(followersData || []);
      setFollowing(followingData || []);
      
      const followerIds = new Set(followersData.map(f => f.follower_id));
      const collaboratorsList = followingData.filter(f => followerIds.has(f.followee_id));
      setCollaborators(collaboratorsList);

      // Check follow status
      try {
        const followStatus = await dataApi.fetchFollowStatus(userId);
        setIsFollowing(followStatus.isFollowing || false);
        setIsFollowedBy(followStatus.isFollowedBy || false);
        setIsCollaborator(followStatus.isFollowing && followStatus.isFollowedBy);
      } catch {
        setIsFollowing(false);
        setIsFollowedBy(false);
        setIsCollaborator(false);
      }

      // Check invitation status
      try {
        const invitationStatus = await dataApi.fetchInvitationStatus(userId);
        if (invitationStatus?.status === 'pending') {
          if (invitationStatus.sender_id === currentUser?.id) {
            setInvitationSent(true);
          } else {
            setReceivedInvitation(invitationStatus);
          }
        } else {
          setInvitationSent(false);
          setReceivedInvitation(null);
        }
      } catch {
        setInvitationSent(false);
        setReceivedInvitation(null);
      }
    } catch (err) {
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
        if (isCollaborator) setIsCollaborator(false);
      } else {
        await dataApi.followUser(userId);
        setIsFollowing(true);
        if (isFollowedBy) setIsCollaborator(true);
      }
      await fetchUserProfile();
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

  const handleCancelInvitation = async () => {
    setInvitationLoading(true);
    try {
      const invStatus = await dataApi.fetchInvitationStatus(userId);
      if (invStatus?.id) await dataApi.cancelInvitation(invStatus.id);
      setInvitationSent(false);
    } catch (err) {
      console.error('Erreur annulation:', err);
    } finally {
      setInvitationLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!receivedInvitation) return;
    setInvitationLoading(true);
    try {
      await dataApi.acceptInvitation(receivedInvitation.id);
      setReceivedInvitation(null);
      setIsCollaborator(true);
      await fetchUserProfile();
    } catch (err) {
      console.error('Erreur acceptation:', err);
    } finally {
      setInvitationLoading(false);
    }
  };

  const handleDeclineInvitation = async () => {
    if (!receivedInvitation) return;
    setInvitationLoading(true);
    try {
      await dataApi.declineInvitation(receivedInvitation.id);
      setReceivedInvitation(null);
    } catch (err) {
      console.error('Erreur refus:', err);
    } finally {
      setInvitationLoading(false);
    }
  };

  const handleMessage = async () => {
    setMessageLoading(true);
    try {
      const result = await dataApi.sendMessage(userId, '');
      if (onUserProfileClick) {
        onUserProfileClick(userId);
      }
    } catch (err) {
      console.error('Erreur message:', err);
    } finally {
      setMessageLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await dataApi.likePost(postId);
      setUserPosts(userPosts.map(p => p.id === postId ? { ...p, user_likes: 1, likes_count: (p.likes_count || 0) + 1 } : p));
    } catch (err) { console.error('Erreur like:', err); }
  };

  const handleUnlike = async (postId) => {
    try {
      await dataApi.unlikePost(postId);
      setUserPosts(userPosts.map(p => p.id === postId ? { ...p, user_likes: 0, likes_count: Math.max(0, (p.likes_count || 0) - 1) } : p));
    } catch (err) { console.error('Erreur unlike:', err); }
  };

  const roleDisplay = { farmer: 'Agriculteur', client: 'Client', trader: 'Commercant' };

  if (isLoading && !hasShownSkeletons) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={onBack}><FiArrowLeft /></button>
          <h2>Chargement...</h2>
        </div>
        <div className={styles.skeletonContent}>
          <SkeletonAvatar width="120px" height="120px" />
          <SkeletonBox width="80%" height="40px" />
          <SkeletonBox width="60%" height="30px" />
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={onBack}><FiArrowLeft /></button>
          <h2>Profil utilisateur</h2>
        </div>
        <div className={styles.errorState}>{error || 'Utilisateur non trouv\u00e9'}</div>
      </div>
    );
  }

  const publicationsCount = userPosts.length;
  const followersCount = followers.length;
  const followingCount = following.length;
  const collaboratorsCount = collaborators.length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}><FiArrowLeft /></button>
        <h2 className={styles.headerTitle}>{userProfile.display_name}</h2>
      </div>

      {/* Cover + Profile Card */}
      <div className={styles.profileCard}>
        <div className={styles.coverArea} />
        <div className={styles.profileContent}>
          <img
            src={userProfile.profile_image_url || '/src/images/avatar.gif'}
            alt={userProfile.display_name}
            className={styles.profilePicture}
          />

          <div className={styles.profileInfo}>
            <h1 className={styles.profileName}>{userProfile.display_name}</h1>
            {userProfile.role && (
              <span className={styles.roleBadge}>{roleDisplay[userProfile.role] || userProfile.role}</span>
            )}

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
            {userProfile.bio && (
              <div className={styles.bioSection}>
                <FiFileText className={styles.bioIcon} />
                <p className={styles.bioText}>{userProfile.bio}</p>
              </div>
            )}

            {/* Info */}
            <div className={styles.infoGrid}>
              {userProfile.location && (
                <div className={styles.infoItem}>
                  <FiMapPin className={styles.infoIcon} />
                  <span>{userProfile.location}</span>
                </div>
              )}
              <div className={styles.infoItem}>
                <FiMail className={styles.infoIcon} />
                <span>{userProfile.email || 'Non disponible'}</span>
              </div>
              {userProfile.phone && (
                <div className={styles.infoItem}>
                  <FiPhone className={styles.infoIcon} />
                  <span>{userProfile.phone}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className={styles.actionButtons}>
              <button className={clsx(styles.actionBtn, styles.messageBtn)} onClick={handleMessage} disabled={messageLoading}>
                <FiMessageSquare /> Message
              </button>

              {isCollaborator ? (
                <button className={clsx(styles.actionBtn, styles.collabBtn)} disabled>
                  <FiUserCheck /> Collaborateur
                </button>
              ) : receivedInvitation ? (
                <div className={styles.invitationGroup}>
                  <button className={clsx(styles.actionBtn, styles.acceptBtn)} onClick={handleAcceptInvitation} disabled={invitationLoading}>
                    <FiUserCheck /> Accepter
                  </button>
                  <button className={clsx(styles.actionBtn, styles.declineBtn)} onClick={handleDeclineInvitation} disabled={invitationLoading}>
                    <FiUserX /> Refuser
                  </button>
                </div>
              ) : invitationSent ? (
                <button className={clsx(styles.actionBtn, styles.pendingBtn)} onClick={handleCancelInvitation} disabled={invitationLoading}>
                  <FiUserX /> Annuler la demande
                </button>
              ) : (
                <button className={clsx(styles.actionBtn, styles.addBtn)} onClick={handleSendInvitation} disabled={invitationLoading}>
                  <FiUserPlus /> Ajouter
                </button>
              )}

              {isFollowing ? (
                isFollowedBy ? (
                  <button className={clsx(styles.actionBtn, styles.followBackBtn)} onClick={handleFollow} disabled={followLoading}>
                    <FiUserCheck /> Suivi en retour
                  </button>
                ) : (
                  <button className={clsx(styles.actionBtn, styles.unfollowBtn)} onClick={handleFollow} disabled={followLoading}>
                    <FiUserX /> Ne plus suivre
                  </button>
                )
              ) : isFollowedBy ? (
                <button className={clsx(styles.actionBtn, styles.followBackBtn)} onClick={handleFollow} disabled={followLoading}>
                  <FiAtSign /> Suivre en retour
                </button>
              ) : (
                <button className={clsx(styles.actionBtn, styles.followBtn)} onClick={handleFollow} disabled={followLoading}>
                  <FiUserPlus /> Suivre
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Publications */}
      <div className={styles.postsSection}>
        <h3 className={styles.sectionTitle}>Publications ({publicationsCount})</h3>
        {userPosts.length === 0 ? (
          <div className={styles.emptyPosts}>
            <FiFileText className={styles.emptyIcon} />
            <p>Aucune publication pour le moment</p>
          </div>
        ) : (
          <div className={styles.postsList}>
            {userPosts.map((post) => (
              <PostCard key={post.id} post={post} onLike={handleLike} onUnlike={handleUnlike} onRefresh={fetchUserProfile} onUserProfileClick={onUserProfileClick} />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
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
