import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { dataApi } from '../../lib/api';
import { FiCheck, FiX, FiUser, FiUserPlus, FiMail, FiInbox, FiFilter, FiUserCheck, FiUserX } from 'react-icons/fi';
import { usePageLoading } from '../../hooks/usePageLoading';
import { SkeletonCard, SkeletonAvatar } from '../../components/Skeleton';
import styles from '../../styles/Utilisateurs/InvitationsCollaborateurs.module.css';

export default function InvitationsCollaborateurs({ onUserProfileClick }) {
  const { hasShownSkeletons, markSkeletonsShown } = usePageLoading();
  const [receivedInvitations, setReceivedInvitations] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingReceived, setLoadingReceived] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [error, setError] = useState('');
  const [invitationMessage, setInvitationMessage] = useState({});
  const [followStatuses, setFollowStatuses] = useState({});
  const [followLoading, setFollowLoading] = useState({});

  useEffect(() => {
    if ((loadingReceived || loadingSuggestions) && !hasShownSkeletons) {
      markSkeletonsShown();
    }
  }, [loadingReceived, loadingSuggestions, hasShownSkeletons, markSkeletonsShown]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    await fetchReceivedInvitations();
    await fetchSuggestions();
  }

  async function fetchReceivedInvitations() {
    setLoadingReceived(true);
    try {
      const invitations = await dataApi.fetchReceivedInvitations();
      setReceivedInvitations(invitations || []);
      
      // Charger le statut de suivi pour chaque expéditeur
      const statuses = {};
      for (const inv of invitations || []) {
        try {
          const status = await dataApi.fetchFollowStatus(inv.sender_id);
          statuses[inv.sender_id] = status;
        } catch {
          statuses[inv.sender_id] = { isFollowing: false, isFollowedBy: false };
        }
      }
      setFollowStatuses(statuses);
    } catch (e) {
      console.error('Erreur chargement invitations', e);
      setError(e instanceof Error ? e.message : 'Erreur lors du chargement des invitations');
    } finally {
      setLoadingReceived(false);
    }
  }

  async function fetchSuggestions() {
    setLoadingSuggestions(true);
    try {
      const s = await dataApi.fetchNetworkSuggestions();
      setSuggestions(s || []);
    } catch (e) {
      console.error('Erreur chargement suggestions', e);
      setError(e instanceof Error ? e.message : 'Erreur lors du chargement des suggestions');
    } finally {
      setLoadingSuggestions(false);
    }
  }

  async function handleAccept(invitationId) {
    try {
      await dataApi.acceptInvitation(invitationId);
      setReceivedInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      await fetchSuggestions(); // Rafraîchir pour voir les changements
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'acceptation');
    }
  }

  async function handleDecline(invitationId) {
    try {
      await dataApi.declineInvitation(invitationId);
      setReceivedInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du refus');
    }
  }

  async function handleFollowBack(senderId) {
    setFollowLoading(prev => ({ ...prev, [senderId]: true }));
    try {
      await dataApi.followUser(senderId);
      // Refresh to get updated status
      const status = await dataApi.fetchFollowStatus(senderId);
      setFollowStatuses(prev => ({
        ...prev,
        [senderId]: status
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du suivi');
    } finally {
      setFollowLoading(prev => ({ ...prev, [senderId]: false }));
    }
  }

  async function handleUnfollow(senderId) {
    setFollowLoading(prev => ({ ...prev, [senderId]: true }));
    try {
      await dataApi.unfollowUser(senderId);
      // Refresh to get updated status
      const status = await dataApi.fetchFollowStatus(senderId);
      setFollowStatuses(prev => ({
        ...prev,
        [senderId]: status
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du désabonnement');
    } finally {
      setFollowLoading(prev => ({ ...prev, [senderId]: false }));
    }
  }

  async function handleSendInvitation(userId) {
    try {
      const message = invitationMessage[userId] || '';
      await dataApi.sendCollaborationInvitation(userId, message);
      setInvitationMessage(prev => ({ ...prev, [userId]: '' }));
      // Rafraîchir les suggestions pour mettre à jour l'état
      await fetchSuggestions();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'envoi de l\'invitation');
    }
  }

  return (
    <div className={clsx(styles['invitations-container'])}>

      {error && (
        <div className={clsx(styles['error-alert'])}>
          <span>{error}</span>
          <button className={clsx(styles['error-close'])} onClick={() => setError('')}>
            ×
          </button>
        </div>
      )}

      {/* Section Invitations Reçues */}
      <section>
        <h2 className={clsx(styles['section-title'])}>
          <FiMail size={24} />
          Invitations reçues
        </h2>

        {loadingReceived && !hasShownSkeletons ? (
          <div className={clsx(styles['invitations-grid'])}>
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : receivedInvitations.length === 0 ? (
          <div className={clsx(styles['empty-state'])}>
            <div className={clsx(styles['empty-icon'])} style={{ fontSize: '3rem' }}>
              <FiInbox size={48} />
            </div>
            <p>Aucune invitation pour le moment.</p>
          </div>
        ) : (
          <div className={clsx(styles['invitations-grid'])}>
            {receivedInvitations.map(invitation => {
              const followStatus = followStatuses[invitation.sender_id] || { isFollowing: false, isFollowedBy: false };
              return (
                <div 
                  key={invitation.id} 
                  className={clsx(styles['invitation-card'])}
                  onClick={() => onUserProfileClick && onUserProfileClick(invitation.sender_id)}
                  style={{ cursor: onUserProfileClick ? 'pointer' : 'default' }}
                >
                  <div className={clsx(styles['invitation-header'])}>
                    <img
                      src={invitation.profile_image_url || '/src/images/avatar.gif'}
                      alt={invitation.display_name}
                      className={clsx(styles['user-avatar-img'])}
                    />
                    <div className={clsx(styles['user-info'])}>
                      <p className={clsx(styles['user-name'])}>
                        {invitation.display_name || invitation.email}
                      </p>
                      <div className={clsx(styles['user-email'])}>
                        <FiMail size={14} />
                        {invitation.email}
                      </div>
                      <span className={clsx(styles['user-role'], { [styles['farmer']]: invitation.role === 'farmer' })}>
                        {invitation.role === 'farmer' ? 'Agriculteur' : ' Client'}
                      </span>
                    </div>
                  </div>

                  {invitation.message && (
                    <p className={clsx(styles['invitation-message'])}>
                      « {invitation.message} »
                    </p>
                  )}

                  <div className={clsx(styles['invitation-actions'])}>
                    <button
                      className={clsx(styles['btn-icon'], styles['btn-accept'])}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAccept(invitation.id);
                      }}
                      title="Accepter l'invitation"
                    >
                      <FiCheck size={18} />
                      Accepter
                    </button>
                    <button
                      className={clsx(styles['btn-icon'], styles['btn-decline'])}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDecline(invitation.id);
                      }}
                      title="Refuser l'invitation"
                    >
                      <FiX size={18} />
                      Refuser
                    </button>
                  </div>

                  {/* Bouton Suivre en retour */}
                  <div className={clsx(styles['follow-back-section'])}>
                    {followStatus.isFollowing && followStatus.isFollowedBy ? (
                      <button
                        className={clsx(styles['btn-follow-back'], styles['following'])}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnfollow(invitation.sender_id);
                        }}
                        disabled={followLoading[invitation.sender_id]}
                      >
                        <FiUserCheck size={16} />
                        ✔️ Collaborateurs
                      </button>
                    ) : followStatus.isFollowing ? (
                      <button
                        className={clsx(styles['btn-follow-back'], styles['following'])}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnfollow(invitation.sender_id);
                        }}
                        disabled={followLoading[invitation.sender_id]}
                      >
                        <FiUserCheck size={16} />
                        Ne plus suivre
                      </button>
                    ) : (
                      <button
                        className={clsx(styles['btn-follow-back'])}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollowBack(invitation.sender_id);
                        }}
                        disabled={followLoading[invitation.sender_id]}
                      >
                        <FiUserX size={16} />
                        Suivre en retour
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className={clsx(styles['section-divider'])}></div>

      {/* Section Suggestions de Collaboration */}
      <section>
        <h2 className={clsx(styles['section-title'])}>
          <FiUserPlus size={24} />
          Suggestions de collaboration
        </h2>

        {loadingSuggestions && !hasShownSkeletons ? (
          <div className={clsx(styles['invitations-grid'])}>
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : suggestions.length === 0 ? (
          <div className={clsx(styles['empty-state'])}>
            <div className={clsx(styles['empty-icon'])} style={{ fontSize: '3rem' }}>
              <FiFilter size={48} />
            </div>
            <p>Aucune suggestion pour le moment.</p>
          </div>
        ) : (
          <div className={clsx(styles['invitations-grid'])}>
            {suggestions.map(user => {
              const getSuggestionBadge = () => {
                if (user.isCollaborator) {
                  return (
                    <div className={clsx(styles['suggestion-badge'], styles['collaborator'])}>
                      <FiUserCheck size={12} />
                      Collaborateur
                    </div>
                  );
                }
                if (user.isFollowing && user.isFollowedBy) {
                  return (
                    <div className={clsx(styles['suggestion-badge'], styles['mutual'])}>
                      <FiUserCheck size={12} />
                      Suivi mutuel
                    </div>
                  );
                }
                if (user.isFollowing) {
                  return (
                    <div className={clsx(styles['suggestion-badge'], styles['following'])}>
                      <FiUserCheck size={12} />
                      Vous suivez
                    </div>
                  );
                }
                if (user.isFollowedBy) {
                  return (
                    <div className={clsx(styles['suggestion-badge'], styles['follower'])}>
                      <FiUserX size={12} />
                      Vous suit
                    </div>
                  );
                }
                return null;
              };

              const getActionButton = () => {
                if (user.invitationSent) {
                  return (
                    <button
                      className={clsx(styles['btn-icon'], styles['btn-invited'])}
                      disabled
                      title="Invitation déjà envoyée"
                    >
                      <FiUserPlus size={18} />
                      Invitation envoyée
                    </button>
                  );
                }

                if (user.invitationReceived) {
                  return (
                    <div className={clsx(styles['invitation-received-notice'])}>
                      <FiMail size={16} />
                      Invitation reçue
                    </div>
                  );
                }

                if (user.isCollaborator) {
                  return (
                    <button
                      className={clsx(styles['btn-icon'], styles['btn-collaborator'])}
                      disabled
                      title="Déjà collaborateur"
                    >
                      <FiUserCheck size={18} />
                      Collaborateur
                    </button>
                  );
                }

                return (
                  <button
                    className={clsx(styles['btn-icon'], styles['btn-invite'])}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSendInvitation(user.id);
                    }}
                    title="Envoyer une invitation"
                  >
                    <FiUserPlus size={18} />
                    Inviter
                  </button>
                );
              };

              return (
                <div 
                  key={user.id} 
                  className={clsx(styles['invitation-card'])}
                  onClick={() => onUserProfileClick && onUserProfileClick(user.id)}
                  style={{ cursor: onUserProfileClick ? 'pointer' : 'default' }}
                >
                  <div className={clsx(styles['invitation-header'])}>
                    <div className={clsx(styles['user-avatar'])}>
                      {user.display_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className={clsx(styles['user-info'])}>
                      <p className={clsx(styles['user-name'])}>
                        {user.display_name || user.email}
                      </p>
                      <div className={clsx(styles['user-email'])}>
                        <FiMail size={14} />
                        {user.email}
                      </div>
                      <span className={clsx(styles['user-role'])}>
                        {user.role === 'farmer' ? ' Agriculteur' : ' Client'}
                      </span>
                      {getSuggestionBadge()}
                    </div>
                  </div>
                  
                  {getActionButton()}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
