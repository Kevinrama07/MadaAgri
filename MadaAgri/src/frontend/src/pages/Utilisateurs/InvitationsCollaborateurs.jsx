import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { dataApi } from '../../lib/api';
import { FiCheck, FiX, FiUser, FiUserPlus, FiMail, FiInbox, FiSearch, FiUserCheck, FiUserX, FiSend, FiUsers } from 'react-icons/fi';
import { usePageLoading } from '../../hooks/usePageLoading';
import { SkeletonCard } from '../../components/Skeleton';
import styles from './InvitationsCollaborateurs.module.css';

export default function InvitationsCollaborateurs({ onUserProfileClick }) {
  const { hasShownSkeletons, markSkeletonsShown } = usePageLoading();
  
  // Onglets
  const [activeTab, setActiveTab] = useState('received'); // received, sent, suggestions, followers, following
  
  // Données
  const [receivedInvitations, setReceivedInvitations] = useState([]);
  const [sentInvitations, setSentInvitations] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  
  // États de chargement
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Recherche et filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // all, farmer, client
  
  // Actions en cours
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    if (loading && !hasShownSkeletons) {
      markSkeletonsShown();
    }
  }, [loading, hasShownSkeletons, markSkeletonsShown]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      switch (activeTab) {
        case 'received':
          await fetchReceivedInvitations();
          break;
        case 'sent':
          await fetchSentInvitations();
          break;
        case 'suggestions':
          await fetchSuggestions();
          break;
        case 'followers':
          await fetchFollowers();
          break;
        case 'following':
          await fetchFollowing();
          break;
        case 'collaborators':
          await fetchCollaborators();
          break;
        default:
          break;
      }
    } catch (e) {
      console.error('Erreur chargement données', e);
      setError(e instanceof Error ? e.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  async function fetchReceivedInvitations() {
    const invitations = await dataApi.fetchReceivedInvitations();
    setReceivedInvitations(invitations || []);
  }

  async function fetchSentInvitations() {
    const invitations = await dataApi.fetchSentInvitations();
    setSentInvitations(invitations || []);
  }

  async function fetchSuggestions() {
    const s = await dataApi.fetchNetworkSuggestions(searchQuery);
    setSuggestions(s || []);
  }

  async function fetchFollowers() {
    const f = await dataApi.fetchFollowers();
    setFollowers(f || []);
  }

  async function fetchFollowing() {
    const f = await dataApi.fetchFollowing();
    setFollowing(f || []);
  }

  async function fetchCollaborators() {
    const c = await dataApi.fetchCollaborators();
    setCollaborators(c || []);
  }

  async function handleAccept(invitationId) {
    setActionLoading(prev => ({ ...prev, [invitationId]: true }));
    try {
      await dataApi.acceptInvitation(invitationId);
      setReceivedInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'acceptation');
    } finally {
      setActionLoading(prev => ({ ...prev, [invitationId]: false }));
    }
  }

  async function handleDecline(invitationId) {
    setActionLoading(prev => ({ ...prev, [invitationId]: true }));
    try {
      await dataApi.declineInvitation(invitationId);
      setReceivedInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du refus');
    } finally {
      setActionLoading(prev => ({ ...prev, [invitationId]: false }));
    }
  }

  async function handleCancelInvitation(invitationId) {
    setActionLoading(prev => ({ ...prev, [invitationId]: true }));
    try {
      await dataApi.cancelInvitation(invitationId);
      setSentInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'annulation');
    } finally {
      setActionLoading(prev => ({ ...prev, [invitationId]: false }));
    }
  }

  async function handleSendInvitation(userId) {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      await dataApi.sendCollaborationInvitation(userId, '');
      await fetchSuggestions();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'envoi');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  }

  async function handleFollow(userId) {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      await dataApi.followUser(userId);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du suivi');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  }

  async function handleUnfollow(userId) {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      await dataApi.unfollowUser(userId);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du désabonnement');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    if (activeTab === 'suggestions') {
      fetchSuggestions();
    }
  }

  function filterByRole(items) {
    if (roleFilter === 'all') return items;
    return items.filter(item => item.role === roleFilter);
  }

  function renderUserCard(user, actions) {
    const userId = user.id || user.sender_id || user.recipient_id || user.follower_id || user.followee_id;
    const displayName = user.display_name || user.email;
    const email = user.email;
    const role = user.role;
    const profileImage = user.profile_image_url;
    const message = user.message;

    return (
      <div 
        key={userId} 
        className={clsx(styles['invitation-card'])}
        onClick={() => onUserProfileClick && onUserProfileClick(userId)}
        style={{ cursor: onUserProfileClick ? 'pointer' : 'default' }}
      >
        <div className={clsx(styles['invitation-header'])}>
          {profileImage ? (
            <img
              src={profileImage}
              alt={displayName}
              className={clsx(styles['user-avatar-img'])}
            />
          ) : (
            <div className={clsx(styles['user-avatar'])}>
              {displayName?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div className={clsx(styles['user-info'])}>
            <p className={clsx(styles['user-name'])}>{displayName}</p>
            <div className={clsx(styles['user-email'])}>
              <FiMail size={14} />
              {email}
            </div>
            <span className={clsx(styles['user-role'], { [styles['farmer']]: role === 'farmer' })}>
              {role === 'farmer' ? 'Agriculteur' : 'Client'}
            </span>
          </div>
        </div>

        {message && (
          <p className={clsx(styles['invitation-message'])}>
            « {message} »
          </p>
        )}

        <div className={clsx(styles['invitation-actions'])} onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      </div>
    );
  }

  function renderContent() {
    if (loading && !hasShownSkeletons) {
      return (
        <div className={clsx(styles['invitations-grid'])}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );
    }

    let items = [];
    let emptyMessage = '';
    let renderActions = () => null;

    switch (activeTab) {
      case 'received':
        items = filterByRole(receivedInvitations);
        emptyMessage = 'Aucune invitation reçue';
        renderActions = (inv) => (
          <>
            <button
              className={clsx(styles['btn-icon'], styles['btn-accept'])}
              onClick={() => handleAccept(inv.id)}
              disabled={actionLoading[inv.id]}
            >
              <FiCheck size={18} />
              Accepter
            </button>
            <button
              className={clsx(styles['btn-icon'], styles['btn-decline'])}
              onClick={() => handleDecline(inv.id)}
              disabled={actionLoading[inv.id]}
            >
              <FiX size={18} />
              Refuser
            </button>
          </>
        );
        break;

      case 'sent':
        items = filterByRole(sentInvitations);
        emptyMessage = 'Aucune invitation envoyée';
        renderActions = (inv) => (
          <button
            className={clsx(styles['btn-icon'], styles['btn-decline'])}
            onClick={() => handleCancelInvitation(inv.id)}
            disabled={actionLoading[inv.id]}
          >
            <FiX size={18} />
            Annuler
          </button>
        );
        break;

      case 'suggestions':
        items = filterByRole(suggestions);
        emptyMessage = 'Aucune suggestion disponible';
        renderActions = (user) => {
          if (user.isCollaborator) {
            return (
              <button className={clsx(styles['btn-icon'], styles['btn-collaborator'])} disabled>
                <FiUserCheck size={18} />
                Collaborateur
              </button>
            );
          }
          if (user.invitationSent) {
            return (
              <button className={clsx(styles['btn-icon'], styles['btn-invited'])} disabled>
                <FiSend size={18} />
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
          return (
            <>
              <button
                className={clsx(styles['btn-icon'], styles['btn-invite'])}
                onClick={() => handleSendInvitation(user.id)}
                disabled={actionLoading[user.id]}
              >
                <FiUserPlus size={18} />
                Inviter
              </button>
              {!user.isFollowing && (
                <button
                  className={clsx(styles['btn-icon'], styles['btn-follow'])}
                  onClick={() => handleFollow(user.id)}
                  disabled={actionLoading[user.id]}
                >
                  <FiUserPlus size={18} />
                  Suivre
                </button>
              )}
            </>
          );
        };
        break;

      case 'followers':
        items = filterByRole(followers);
        emptyMessage = 'Aucun abonné';
        renderActions = (user) => {
          const userId = user.id || user.follower_id;
          return (
            <button
              className={clsx(styles['btn-icon'], styles['btn-follow'])}
              onClick={() => handleFollow(userId)}
              disabled={actionLoading[userId]}
            >
              <FiUserPlus size={18} />
              Suivre en retour
            </button>
          );
        };
        break;

      case 'following':
        items = filterByRole(following);
        emptyMessage = 'Vous ne suivez personne';
        renderActions = (user) => {
          const userId = user.id || user.followee_id;
          return (
            <button
              className={clsx(styles['btn-icon'], styles['btn-decline'])}
              onClick={() => handleUnfollow(userId)}
              disabled={actionLoading[userId]}
            >
              <FiUserX size={18} />
              Ne plus suivre
            </button>
          );
        };
        break;

      case 'collaborators':
        items = filterByRole(collaborators);
        emptyMessage = 'Aucun collaborateur';
        renderActions = () => (
          <button className={clsx(styles['btn-icon'], styles['btn-collaborator'])} disabled>
            <FiUserCheck size={18} />
            Collaborateur
          </button>
        );
        break;

      default:
        break;
    }

    if (items.length === 0) {
      return (
        <div className={clsx(styles['empty-state'])}>
          <div className={clsx(styles['empty-icon'])}>
            <FiInbox size={48} />
          </div>
          <p>{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className={clsx(styles['invitations-grid'])}>
        {items.map(item => renderUserCard(item, renderActions(item)))}
      </div>
    );
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

      {/* Onglets */}
      <div className={clsx(styles['tabs'])}>
        <button
          className={clsx(styles['tab'], { [styles['active']]: activeTab === 'received' })}
          onClick={() => setActiveTab('received')}
        >
          <FiMail size={18} />
          Invitations reçues
        </button>
        <button
          className={clsx(styles['tab'], { [styles['active']]: activeTab === 'sent' })}
          onClick={() => setActiveTab('sent')}
        >
          <FiSend size={18} />
          Invitations envoyées
        </button>
        <button
          className={clsx(styles['tab'], { [styles['active']]: activeTab === 'collaborators' })}
          onClick={() => setActiveTab('collaborators')}
        >
          <FiUserCheck size={18} />
          Collaborateurs
        </button>
        <button
          className={clsx(styles['tab'], { [styles['active']]: activeTab === 'suggestions' })}
          onClick={() => setActiveTab('suggestions')}
        >
          <FiUserPlus size={18} />
          Suggestions
        </button>
        <button
          className={clsx(styles['tab'], { [styles['active']]: activeTab === 'followers' })}
          onClick={() => setActiveTab('followers')}
        >
          <FiUsers size={18} />
          Abonnés
        </button>
        <button
          className={clsx(styles['tab'], { [styles['active']]: activeTab === 'following' })}
          onClick={() => setActiveTab('following')}
        >
          <FiUser size={18} />
          Abonnements
        </button>
      </div>

      {/* Barre de recherche et filtres */}
      <div className={clsx(styles['filters'])}>
        {activeTab === 'suggestions' && (
          <form onSubmit={handleSearch} className={clsx(styles['search-form'])}>
            <FiSearch size={18} />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={clsx(styles['search-input'])}
            />
            <button type="submit" className={clsx(styles['search-btn'])}>
              Rechercher
            </button>
          </form>
        )}
        
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className={clsx(styles['role-filter'])}
        >
          <option value="all">Tous les rôles</option>
          <option value="farmer">Agriculteurs</option>
          <option value="client">Clients</option>
        </select>
      </div>

      {/* Contenu */}
      {renderContent()}
    </div>
  );
}
