import { useState, useEffect } from 'react';
import { FiSearch, FiCheck, FiX, FiUserPlus } from 'react-icons/fi';
import clsx from 'clsx';
import { useAuth } from '../../contexts/ContextAuthentification';
import { dataApi } from '../../lib/api';
import styles from '../../styles/Composants/RightSidebar.module.css';

export default function RightSidebar({ onUserProfileClick }) {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  async function fetchData() {
    setLoading(true);
    try {
      const receivedInvitations = await dataApi.fetchReceivedInvitations();
      setInvitations(receivedInvitations || []);

      // Charger followers et following pour calculer les collaborateurs (suivi mutuel)
      const [followersData, followingData] = await Promise.all([
        dataApi.fetchFollowers(user.id),
        dataApi.fetchFollowing(user.id)
      ]);
      
      // Collaborateurs = ceux qui me suivent ET que je suis (suivi mutuel)
      const followerIds = new Set(followersData.map(f => f.follower_id));
      const mutualFollows = followingData.filter(f => followerIds.has(f.followee_id));
      
      console.log('[RightSidebar] Followers:', followersData.length, 'Following:', followingData.length, 'Collaborators (mutual):', mutualFollows.length);
      setCollaborators(mutualFollows);
    } catch (error) {
      console.error('Error fetching data:', error);
      setInvitations([]);
      setCollaborators([]);
    } finally {
      setLoading(false);
    }
  }

  const handleAcceptInvitation = async (invitationId) => {
    try {
      await dataApi.acceptInvitation(invitationId);
      setInvitations(invitations.filter(inv => inv.id !== invitationId));
      // Recharger les collaborateurs après acceptation
      await fetchData();
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  const handleRejectInvitation = async (invitationId) => {
    try {
      await dataApi.declineInvitation(invitationId);
      setInvitations(invitations.filter(inv => inv.id !== invitationId));
    } catch (error) {
      console.error('Error rejecting invitation:', error);
    }
  };

  const filteredCollaborators = collaborators.filter(collab =>
    collab.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    collab.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className={clsx(styles['right-sidebar'])}>
      {invitations.length > 0 && (
        <div className={clsx(styles['sidebar-section'])}>
          <div className={clsx(styles['section-header'])}>  
            <h3 className={clsx(styles['sidebar-title'])}>
              <FiUserPlus className={clsx(styles['title-icon'])} />
              Invitations
            </h3>
            <span className={clsx(styles['count-badge'])}>{invitations.length}</span>
          </div>

          <div className={clsx(styles['invitations-list'])}>
            {invitations.slice(0, 3).map((invitation) => (
              <div key={invitation.id} className={clsx(styles['invitation-card'])}>
                <div 
                  className={clsx(styles['invitation-header'])}
                  onClick={() => onUserProfileClick && onUserProfileClick(invitation.sender_id || invitation.sender?.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <img
                    src={invitation.sender?.profile_image_url || invitation.profile_image_url || '/src/images/avatar.gif'}
                    alt={invitation.sender?.display_name || invitation.display_name}
                    className={clsx(styles['invitation-avatar'])}
                  />
                  <div className={clsx(styles['invitation-info'])}>
                    <p className={clsx(styles['invitation-name'])}>
                      {invitation.sender?.display_name || invitation.display_name || invitation.email || 'Utilisateur'}
                    </p>
                    {invitation.message && (
                      <p className={clsx(styles['invitation-message'])}>
                        {invitation.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className={clsx(styles['invitation-actions'])}>
                  <button
                    className={clsx(styles['btn-accept'])}
                    onClick={() => handleAcceptInvitation(invitation.id)}
                    title="Accepter"
                  >
                    <FiCheck />
                    <span>Accepter</span>
                  </button>
                  <button
                    className={clsx(styles['btn-reject'])}
                    onClick={() => handleRejectInvitation(invitation.id)}
                    title="Refuser"
                  >
                    <FiX />
                    <span>Refuser</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {invitations.length > 3 && (
            <button className={clsx(styles['see-more-btn'])}>
              Voir toutes les invitations ({invitations.length})
            </button>
          )}
        </div>
      )}

      <div className={clsx(styles['sidebar-section'])}>
        <h3 className={clsx(styles['sidebar-title'])}>Collaborateurs ({collaborators.length})</h3>

        <div className={clsx(styles['search-wrapper'])}>
          <FiSearch className={clsx(styles['search-icon'])} />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={clsx(styles['search-input'])}
          />
        </div>

        <div className={clsx(styles['collaborators-list'])}>
          {loading ? (
            <div className={clsx(styles['loading'])}>Chargement...</div>
          ) : filteredCollaborators.length === 0 ? (
            <div className={clsx(styles['empty-state'])}>
              <p>{searchQuery ? 'Aucun résultat' : 'Aucun collaborateur'}</p>
            </div>
          ) : (
            filteredCollaborators.map((collaborator) => (
              <div
                key={collaborator.id || collaborator.followee_id}
                className={clsx(styles['collaborator-item'])}
                onClick={() => {
                  const userId = collaborator.followee_id || collaborator.id;
                  console.log('[RightSidebar] Collaborator clicked:', userId, collaborator);
                  onUserProfileClick && onUserProfileClick(userId);
                }}
              >
                <img
                  src={collaborator.profile_image_url || '/src/images/avatar.gif'}
                  alt={collaborator.display_name}
                  className={clsx(styles['collaborator-avatar'])}
                />
                <p className={clsx(styles['collaborator-name'])}>
                  {collaborator.display_name || collaborator.email}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
