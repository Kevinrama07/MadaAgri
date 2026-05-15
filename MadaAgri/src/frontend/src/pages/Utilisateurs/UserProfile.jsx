import { useEffect, useState } from 'react';
import { FiArrowLeft, FiMail, FiPhone, FiUserPlus, FiUserCheck, FiUserX, FiUsers, FiMapPin, FiEdit } from 'react-icons/fi';
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
  const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false);
  const [invitationLoading, setInvitationLoading] = useState(false);
  const [invitationSent, setInvitationSent] = useState(false);
  const [sentInvitationId, setSentInvitationId] = useState(null);
  const [isCollaborator, setIsCollaborator] = useState(false);
  const [collaboratorsCount, setCollaboratorsCount] = useState(0);
  const [collaborators, setCollaborators] = useState([]);

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

      // Load followers and following first
      const [followersData, followingData] = await Promise.all([
        dataApi.fetchFollowers(userId),
        dataApi.fetchFollowing(userId)
      ]);
      setFollowers(followersData || []);
      setFollowing(followingData || []);
      
      // Calculate collaborators (mutual follows)
      const followerIds = new Set(followersData.map(f => f.follower_id));
      const collaboratorsList = followingData.filter(f => followerIds.has(f.followee_id));
      setCollaborators(collaboratorsList);
      setCollaboratorsCount(collaboratorsList.length);

      // Check follow status
      try {
        const followStatus = await dataApi.fetchFollowStatus(userId);
        setIsFollowing(followStatus.isFollowing || false);
        // Vérifier si on est collaborateurs (suivi mutuel)
        const areCollaborators = followStatus.isFollowing && followStatus.isFollowedBy;
        setIsCollaborator(areCollaborators);
        console.log('[UserProfile] User ID:', userId);
        console.log('[UserProfile] Follow status:', followStatus);
        console.log('[UserProfile] isFollowing:', followStatus.isFollowing, 'isFollowedBy:', followStatus.isFollowedBy);
        console.log('[UserProfile] Are collaborators:', areCollaborators);
      } catch (followErr) {
        console.warn('Erreur chargement suivi:', followErr);
        setIsFollowing(false);
        setIsCollaborator(false);
      }

      // Check invitation status only if not already collaborators
      try {
        const invitationStatus = await dataApi.fetchInvitationStatus(userId);
        console.log('[UserProfile] Invitation status:', invitationStatus);
        
        if (invitationStatus?.status === 'pending') {
          setInvitationSent(true);
          setSentInvitationId(invitationStatus.id || null);
        } else {
          setInvitationSent(false);
          setSentInvitationId(null);
        }
      } catch (invErr) {
        console.warn('Erreur chargement invitation status:', invErr);
        setInvitationSent(false);
        setSentInvitationId(null);
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
        // Check if the other person also follows us to determine collaboration
        const followStatus = await dataApi.fetchFollowStatus(userId);
        const areCollaborators = followStatus.isFollowing && followStatus.isFollowedBy;
        setIsCollaborator(areCollaborators);
        console.log('[handleFollow] New follow status:', followStatus, 'Are collaborators:', areCollaborators);
      }
      // Refresh the profile to update stats
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
      console.log('[handleSendInvitation] Envoi invitation à:', userId);
      const result = await dataApi.sendCollaborationInvitation(userId, '');
      console.log('[handleSendInvitation] Résultat:', result);
      setInvitationSent(true);
      setSentInvitationId(result.id || null);
    } catch (err) {
      console.error('Erreur invitation:', err);
    } finally {
      setInvitationLoading(false);
    }
  };

  const handleCancelInvitation = async () => {
    if (!sentInvitationId) return;
    setInvitationLoading(true);
    try {
      console.log('[handleCancelInvitation] Annulation invitation:', sentInvitationId);
      await dataApi.cancelInvitation(sentInvitationId);
      console.log('[handleCancelInvitation] Annulation réussie');
      setInvitationSent(false);
      setSentInvitationId(null);
    } catch (err) {
      console.error('Erreur annulation invitation:', err);
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
                <strong>{following.length}</strong> suivi{following.length > 1 ? 's' : ''}
              </span>
              <span className={clsx(styles['stat-separator'])}>·</span>
              <span 
                className={clsx(styles['stat-item'])} 
                onClick={() => setShowCollaboratorsModal(true)}
                title="Voir les collaborateurs"
              >
                <strong>{isOwnProfile ? collaboratorsCount : (isCollaborator ? '1' : '0')}</strong> collaborateur{(isOwnProfile ? collaboratorsCount : (isCollaborator ? 1 : 0)) > 1 ? 's' : ''}
              </span>
            </div>

            <div className={clsx(styles['profile-role'])}>
              {roleDisplay[userProfile.role] || userProfile.role}
            </div>

            {/* Bio */}
            {userProfile.bio && (
              <div className={clsx(styles['profile-section'])}>
                <p className={clsx(styles['profile-bio'])}>{userProfile.bio}</p>
              </div>
            )}

            {/* Localisation */}
            {userProfile.location && (
              <div className={clsx(styles['profile-section'])}>
                <div className={clsx(styles['info-item'])}>
                  <FiMapPin size={16} />
                  <span>{userProfile.location}</span>
                </div>
              </div>
            )}

            {/* Contact */}
            <div className={clsx(styles['profile-section'])}>
              <div className={clsx(styles['info-item'])}>
                <FiMail size={16} />
                <span>{userProfile.email || 'Non disponible'}</span>
              </div>
              {userProfile.phone && (
                <div className={clsx(styles['info-item'])}>
                  <FiPhone size={16} />
                  <span>{userProfile.phone}</span>
                </div>
              )}
            </div>

            {/* Boutons d'action */}
            <div className={clsx(styles['profile-actions'])}>
              {isOwnProfile ? (
                // Boutons pour son propre profil
                <button 
                  className={clsx(styles['action-btn'], styles['edit-btn'])}
                  onClick={() => window.location.href = '/profile/edit'}
                  title="Modifier le profil"
                >
                  <FiEdit size={18} />
                  <span>Modifier le profil</span>
                </button>
              ) : (
                // Boutons pour le profil d'un autre utilisateur
                <>
                  {isCollaborator ? (
                    <button 
                      className={clsx(styles['action-btn'], styles['add-btn'])} 
                      disabled
                      title="Vous êtes collaborateurs (suivi mutuel)"
                    >
                      <FiUserCheck size={18} />
                      <span>Collaborateur ✔️</span>
                    </button>
                  ) : invitationSent ? (
                    <button 
                      className={clsx(styles['action-btn'], styles['cancel-btn'])} 
                      onClick={handleCancelInvitation}
                      disabled={invitationLoading}
                      title="Annuler la demande d'invitation"
                    >
                      <FiUserX size={18} />
                      <span>Annuler la demande</span>
                    </button>
                  ) : (
                    <button 
                      className={clsx(styles['action-btn'], styles['add-btn'])} 
                      onClick={handleSendInvitation}
                      disabled={invitationLoading}
                      title="Envoyer une invitation de collaboration"
                    >
                      <FiUserPlus size={18} />
                      <span>Ajouter</span>
                    </button>
                  )}
                  <button
                    className={clsx(styles['action-btn'], isFollowing ? styles['following-btn'] : styles['follow-btn'])}
                    onClick={handleFollow}
                    disabled={followLoading}
                    title={isFollowing ? 'Ne plus suivre' : 'Suivre'}
                  >
                    {isFollowing ? (
                      <>
                        <FiUserCheck size={18} />
                        <span>Ne plus suivre</span>
                      </>
                    ) : (
                      <>
                        <FiUserPlus size={18} />
                        <span>Suivre</span>
                      </>
                    )}
                  </button>
                </>
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

      {/* Modal Collaborateurs */}
      {showCollaboratorsModal && (
        <div className={clsx(styles['modal-overlay'])} onClick={() => setShowCollaboratorsModal(false)}>
          <div className={clsx(styles['modal-content'])} onClick={(e) => e.stopPropagation()}>
            <div className={clsx(styles['modal-header'])}>
              <h3>Collaborateurs ({isOwnProfile ? collaborators.length : (isCollaborator ? 1 : 0)})</h3>
              <button className={clsx(styles['modal-close'])} onClick={() => setShowCollaboratorsModal(false)}>×</button>
            </div>
            <div className={clsx(styles['modal-body'])}>
              {isOwnProfile ? (
                collaborators.length === 0 ? (
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
                          <span className={clsx(styles['user-list-role'])}>{collaborator.role}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              ) : (
                isCollaborator ? (
                  <p className={clsx(styles['empty-message'])}>Vous êtes collaborateurs</p>
                ) : (
                  <p className={clsx(styles['empty-message'])}>Aucun collaborateur</p>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}
