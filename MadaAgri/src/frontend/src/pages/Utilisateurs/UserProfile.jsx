import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['common', 'dashboard', 'auth']);
  const navigate = useNavigate();
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
    if (!userId) { setError(t('common:notAvailable')); stopLoading(); return; }
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

      const [followersData, followingData, collaboratorsData] = await Promise.all([
        dataApi.fetchFollowers(userId),
        dataApi.fetchFollowing(userId),
        dataApi.fetchCollaborators(userId)
      ]);
      setFollowers(followersData || []);
      setFollowing(followingData || []);
      setCollaborators(collaboratorsData?.collaborators || []);

      // Check follow status
      try {
        const followStatus = await dataApi.fetchFollowStatus(userId);
        setIsFollowing(followStatus.isFollowing || false);
        setIsFollowedBy(followStatus.isFollowedBy || false);
        setIsCollaborator(followStatus.isCollaborator || false);
      } catch (err) {
        console.error('[UserProfile] Error fetching follow status:', err);
        setIsFollowing(false);
        setIsFollowedBy(false);
        setIsCollaborator(false);
      }

      // Check invitation status
      try {
        const invitationStatus = await dataApi.fetchInvitationStatus(userId);
        if (invitationStatus?.status === 'accepted') {
          // Déjà collaborateurs
          setIsCollaborator(true);
          setInvitationSent(false);
          setReceivedInvitation(null);
        } else if (invitationStatus?.status === 'pending') {
          if (invitationStatus.sender_id === currentUser?.id) {
            setInvitationSent(true);
          } else {
            setReceivedInvitation(invitationStatus);
          }
        } else {
          setInvitationSent(false);
          setReceivedInvitation(null);
        }
      } catch (err) {
        console.error('[UserProfile] Error fetching invitation status:', err);
        setInvitationSent(false);
        setReceivedInvitation(null);
      }
    } catch (err) {
      setError(err.message || t('common:error'));
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

  const handleRemoveCollaborator = async () => {
    setFollowLoading(true);
    try {
      await dataApi.removeCollaboration(userId);
      setIsCollaborator(false);
      await fetchUserProfile();
    } catch (err) {
      console.error('[UserProfile] Error removing collaboration:', err);
    } finally {
      setFollowLoading(false);
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
    navigate(`/dashboard/messages/${userId}`);
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

  const roleDisplay = { farmer: t('auth:farmer'), client: t('auth:client'), trader: 'Commercant' };

  if (isLoading && !hasShownSkeletons) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={onBack}><FiArrowLeft /></button>
          <h2>{t('common:loading')}</h2>
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
          <h2>{t('dashboard:myProfile')}</h2>
        </div>
        <div className={styles.errorState}>{error || t('common:notFound')}</div>
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
                <span className={styles.statLabel}>{t('dashboard:followers')}</span>
              </button>
              <div className={styles.statDivider} />
              <button className={styles.statBtn} onClick={() => setShowFollowingModal(true)}>
                <span className={styles.statNumber}>{followingCount}</span>
                <span className={styles.statLabel}>{t('dashboard:following')}</span>
              </button>
              <div className={styles.statDivider} />
              <button className={styles.statBtn} onClick={() => setShowCollaboratorsModal(true)}>
                <span className={styles.statNumber}>{collaboratorsCount}</span>
                <span className={styles.statLabel}>{t('dashboard:collaborators')}</span>
              </button>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{publicationsCount}</span>
                <span className={styles.statLabel}>{t('dashboard:publications')}</span>
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
                <span>{userProfile.email || t('common:notAvailable')}</span>
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
                <FiMessageSquare /> {t('common:sendMessage')}
              </button>

              {isCollaborator ? (
                <button className={clsx(styles.actionBtn, styles.removeCollabBtn)} onClick={handleRemoveCollaborator} disabled={followLoading}>
                  <FiUserX /> {t('common:removeCollaborator')}
                </button>
              ) : receivedInvitation ? (
                <div className={styles.invitationGroup}>
                  <button className={clsx(styles.actionBtn, styles.acceptBtn)} onClick={handleAcceptInvitation} disabled={invitationLoading}>
                    <FiUserCheck /> {t('common:accept')}
                  </button>
                  <button className={clsx(styles.actionBtn, styles.declineBtn)} onClick={handleDeclineInvitation} disabled={invitationLoading}>
                    <FiUserX /> {t('common:decline')}
                  </button>
                </div>
              ) : invitationSent ? (
                <button className={clsx(styles.actionBtn, styles.pendingBtn)} onClick={handleCancelInvitation} disabled={invitationLoading}>
                  <FiUserX /> {t('common:cancelRequest')}
                </button>
              ) : (
                <button className={clsx(styles.actionBtn, styles.addBtn)} onClick={handleSendInvitation} disabled={invitationLoading}>
                  <FiUserPlus /> {t('common:add')}
                </button>
              )}

              {!isCollaborator && (
                isFollowing ? (
                  isFollowedBy ? (
                    <button className={clsx(styles.actionBtn, styles.followBackBtn)} onClick={handleFollow} disabled={followLoading}>
                      <FiUserCheck /> {t('common:followingBack')}
                    </button>
                  ) : (
                    <button className={clsx(styles.actionBtn, styles.unfollowBtn)} onClick={handleFollow} disabled={followLoading}>
                      <FiUserX /> {t('common:unfollow')}
                    </button>
                  )
                ) : isFollowedBy ? (
                  <button className={clsx(styles.actionBtn, styles.followBackBtn)} onClick={handleFollow} disabled={followLoading}>
                    <FiAtSign /> {t('common:followBack')}
                  </button>
                ) : (
                  <button className={clsx(styles.actionBtn, styles.followBtn)} onClick={handleFollow} disabled={followLoading}>
                    <FiUserPlus /> {t('common:follow')}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Publications */}
      <div className={styles.postsSection}>
        <h3 className={styles.sectionTitle}>{t('dashboard:publications')} ({publicationsCount})</h3>
        {userPosts.length === 0 ? (
          <div className={styles.emptyPosts}>
            <FiFileText className={styles.emptyIcon} />
            <p>{t('dashboard:noPosts')}</p>
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
        <UserListModal title={`${t('dashboard:followers')} (${followersCount})`} users={followers} idKey="follower_id" onClose={() => setShowFollowersModal(false)} onUserClick={onUserProfileClick} />
      )}
      {showFollowingModal && (
        <UserListModal title={`${t('dashboard:following')} (${followingCount})`} users={following} idKey="followee_id" onClose={() => setShowFollowingModal(false)} onUserClick={onUserProfileClick} />
      )}
      {showCollaboratorsModal && (
        <UserListModal title={`${t('dashboard:collaborators')} (${collaboratorsCount})`} users={collaborators} idKey="id" onClose={() => setShowCollaboratorsModal(false)} onUserClick={onUserProfileClick} />
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
            <p className={styles.emptyMessage}>{t('common:noResults')}</p>
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
