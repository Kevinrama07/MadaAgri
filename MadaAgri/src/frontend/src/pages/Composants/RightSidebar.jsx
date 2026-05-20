import { useState, useEffect } from 'react';
import { FiSearch, FiCheck, FiX, FiUserPlus, FiUsers, FiTrendingUp, FiCalendar, FiAward, FiExternalLink } from 'react-icons/fi';
import clsx from 'clsx';
import { useAuth } from '../../contexts/ContextAuthentification';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { dataApi } from '../../lib/api';
import styles from '../../styles/Composants/RightSidebar.module.css';

export default function RightSidebar({ onUserProfileClick }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  async function fetchData() {
    setLoading(true);
    try {
      const [receivedInvitations, followersData, followingData] = await Promise.all([
        dataApi.fetchReceivedInvitations().catch(() => []),
        dataApi.fetchFollowers(user.id).catch(() => []),
        dataApi.fetchFollowing(user.id).catch(() => []),
      ]);
      
      setInvitations(receivedInvitations || []);

      const followerIds = new Set(followersData.map(f => f.follower_id));
      const mutualFollows = followingData.filter(f => followerIds.has(f.followee_id));
      setCollaborators(mutualFollows);

      const followingIds = new Set(followingData.map(f => f.followee_id));
      const nonFollowers = followersData.filter(f => !followingIds.has(f.follower_id));
      setSuggestedUsers(nonFollowers.slice(0, 5));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleAcceptInvitation = async (invitationId) => {
    try {
      await dataApi.acceptInvitation(invitationId);
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      await fetchData();
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  const handleRejectInvitation = async (invitationId) => {
    try {
      await dataApi.declineInvitation(invitationId);
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (error) {
      console.error('Error rejecting invitation:', error);
    }
  };

  const handleFollow = async (userId) => {
    try {
      await dataApi.followUser(userId);
      setSuggestedUsers(prev => prev.filter(u => (u.follower_id || u.id) !== userId));
      await fetchData();
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await dataApi.searchUsers(query).catch(() => []);
      setSearchResults(results || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const filteredCollaborators = collaborators.filter(collab =>
    collab.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    collab.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserClick = (userId) => {
    if (onUserProfileClick) {
      onUserProfileClick(userId);
    } else {
      navigate(`/profile/${userId}`);
    }
  };

  const todayTips = [
    { icon: <FiTrendingUp />, text: 'Consultez les tendances du marche agricole' },
    { icon: <FiCalendar />, text: 'Planifiez vos semences pour la saison prochaine' },
    { icon: <FiAward />, text: 'Completez votre profil pour plus de visibilite' },
  ];
  const todayTip = todayTips[new Date().getDay() % todayTips.length];

  return (
    <aside className={clsx(styles['right-sidebar'])}>

      <div className={clsx(styles['sidebar-section'])}>
        <div className={clsx(styles['section-header'])}>
          <h3 className={clsx(styles['sidebar-title'])}>
            <FiSearch className={clsx(styles['title-icon'])} />
            Rechercher
          </h3>
        </div>

        <div className={clsx(styles['search-wrapper'])}>
          <FiSearch className={clsx(styles['search-icon'])} />
          <input
            type="text"
            placeholder="Nom, email..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className={clsx(styles['search-input'])}
          />
        </div>

        {isSearching && <div className={clsx(styles['loading'])}>Recherche...</div>}

        {searchResults.length > 0 && (
          <div className={clsx(styles['search-results'])}>
            {searchResults.slice(0, 5).map((result) => (
              <div
                key={result.id}
                className={clsx(styles['search-result-item'])}
                onClick={() => handleUserClick(result.id)}
              >
                <img
                  src={result.profile_image_url || '/src/images/avatar.gif'}
                  alt={result.display_name}
                  className={clsx(styles['search-result-avatar'])}
                />
                <div className={clsx(styles['search-result-info'])}>
                  <p className={clsx(styles['search-result-name'])}>{result.display_name}</p>
                  <p className={clsx(styles['search-result-email'])}>{result.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
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
                  onClick={() => handleUserClick(invitation.sender_id || invitation.sender?.id)}
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
                      <p className={clsx(styles['invitation-message'])}>{invitation.message}</p>
                    )}
                  </div>
                </div>
                <div className={clsx(styles['invitation-actions'])}>
                  <button className={clsx(styles['btn-accept'])} onClick={() => handleAcceptInvitation(invitation.id)}>
                    <FiCheck /> Accepter
                  </button>
                  <button className={clsx(styles['btn-reject'])} onClick={() => handleRejectInvitation(invitation.id)}>
                    <FiX /> Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={clsx(styles['sidebar-section'])}>
        <div className={clsx(styles['section-header'])}>
          <h3 className={clsx(styles['sidebar-title'])}>
            <FiUsers className={clsx(styles['title-icon'])} />
            Collaborateurs
          </h3>
          <span className={clsx(styles['count-badge'])}>{collaborators.length}</span>
        </div>

        <div className={clsx(styles['collaborators-list'])}>
          {loading ? (
            <div className={clsx(styles['loading'])}>Chargement...</div>
          ) : filteredCollaborators.length === 0 ? (
            <div className={clsx(styles['empty-state'])}>
              <p>{searchQuery ? 'Aucun resultat' : 'Aucun collaborateur'}</p>
            </div>
          ) : (
            filteredCollaborators.slice(0, 8).map((collaborator) => (
              <div
                key={collaborator.id || collaborator.followee_id}
                className={clsx(styles['collaborator-item'])}
                onClick={() => handleUserClick(collaborator.followee_id || collaborator.id)}
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

        {collaborators.length > 8 && (
          <button className={clsx(styles['see-more-btn'])} onClick={() => navigate('/network')}>
            Voir tous ({collaborators.length})
          </button>
        )}
      </div>

      {suggestedUsers.length > 0 && (
        <div className={clsx(styles['sidebar-section'])}>
          <div className={clsx(styles['section-header'])}>
            <h3 className={clsx(styles['sidebar-title'])}>
              <FiUserPlus className={clsx(styles['title-icon'])} />
              Suggestions
            </h3>
          </div>

          <div className={clsx(styles['suggestions-list'])}>
            {suggestedUsers.slice(0, 4).map((suggestion) => {
              const userId = suggestion.follower_id || suggestion.id;
              return (
                <div key={userId} className={clsx(styles['suggestion-item'])}>
                  <div className={clsx(styles['suggestion-header'])} onClick={() => handleUserClick(userId)}>
                    <img
                      src={suggestion.profile_image_url || '/src/images/avatar.gif'}
                      alt={suggestion.display_name}
                      className={clsx(styles['suggestion-avatar'])}
                    />
                    <div className={clsx(styles['suggestion-info'])}>
                      <p className={clsx(styles['suggestion-name'])}>{suggestion.display_name || suggestion.email}</p>
                      <p className={clsx(styles['suggestion-role'])}>Vous suit</p>
                    </div>
                  </div>
                  <button className={clsx(styles['btn-follow'])} onClick={() => handleFollow(userId)}>
                    Suivre
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className={clsx(styles['sidebar-section'], styles['tip-section'])}>
        <div className={clsx(styles['tip-icon'])}>{todayTip.icon}</div>
        <div className={clsx(styles['tip-content'])}>
          <p className={clsx(styles['tip-title'])}>Conseil du jour</p>
          <p className={clsx(styles['tip-text'])}>{todayTip.text}</p>
        </div>
      </div>
    </aside>
  );
}
