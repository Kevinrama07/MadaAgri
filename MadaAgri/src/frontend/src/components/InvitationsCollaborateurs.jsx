import { useEffect, useState } from 'react';
import { dataApi } from '../lib/api';
import { FiCheck, FiX, FiUser, FiUserPlus, FiMail, FiInbox, FiFilter } from 'react-icons/fi';

export default function InvitationsCollaborateurs({ onUserProfileClick }) {
  const [receivedInvitations, setReceivedInvitations] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingReceived, setLoadingReceived] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [error, setError] = useState('');
  const [invitationMessage, setInvitationMessage] = useState({});
  const [sentInvitations, setSentInvitations] = useState(new Set());

  useEffect(() => {
    loadData();
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
      
      // Marquer les utilisateurs auxquels on a déjà envoyé une invitation
      const sent = s
        .filter(u => u.invitationSent)
        .map(u => u.id);
      setSentInvitations(new Set(sent));
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

  async function handleSendInvitation(userId) {
    try {
      const message = invitationMessage[userId] || '';
      await dataApi.sendCollaborationInvitation(userId, message);
      setSentInvitations(prev => new Set([...prev, userId]));
      setInvitationMessage(prev => ({ ...prev, [userId]: '' }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'envoi de l\'invitation');
    }
  }

  return (
    <div className="invitations-container">
      <style>{`
        .invitations-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          padding: 1rem;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--mg-text);
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .invitations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
        }

        .invitation-card {
          background: var(--mg-card-bg);
          border: 1px solid var(--mg-border);
          border-radius: 12px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
        }

        .invitation-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          border-color: var(--mg-primary);
        }

        .invitation-header {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .user-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--mg-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          flex-shrink: 0;
        }

        .user-info {
          flex: 1;
          min-width: 0;
        }

        .user-name {
          font-weight: 600;
          color: var(--mg-text);
          margin: 0;
          word-break: break-word;
        }

        .user-email {
          font-size: 0.85rem;
          color: var(--mg-text-muted);
          margin: 0.25rem 0 0;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          word-break: break-all;
        }

        .user-role {
          font-size: 0.8rem;
          color: var(--mg-primary);
          background: rgba(var(--mg-primary-rgb), 0.1);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          display: inline-block;
          margin-top: 0.5rem;
        }

        .invitation-message {
          font-size: 0.9rem;
          color: var(--mg-text-muted);
          font-style: italic;
          padding: 0.75rem;
          background: var(--mg-bg-alt);
          border-left: 3px solid var(--mg-primary);
          border-radius: 4px;
          margin: 0;
        }

        .invitation-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-icon {
          flex: 1;
          padding: 0.6rem;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
          font-size: 0.9rem;
        }

        .btn-accept {
          background: #10b981;
          color: white;
        }

        .btn-accept:hover {
          background: #059669;
          transform: translateY(-2px);
        }

        .btn-decline {
          background: #ef4444;
          color: white;
        }

        .btn-decline:hover {
          background: #dc2626;
          transform: translateY(-2px);
        }

        .btn-invite {
          background: var(--mg-primary);
          color: white;
        }

        .btn-invite:hover:not(:disabled) {
          background: var(--mg-primary-hover);
          transform: translateY(-2px);
        }

        .btn-invite:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-invited {
          background: #9ca3af;
          color: white;
          cursor: not-allowed;
        }

        .suggestion-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .invitation-textarea {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid var(--mg-border);
          border-radius: 6px;
          font-size: 0.85rem;
          resize: vertical;
          min-height: 60px;
          font-family: inherit;
          color: var(--mg-text);
          background: var(--mg-bg);
        }

        .invitation-textarea:focus {
          outline: none;
          border-color: var(--mg-primary);
          box-shadow: 0 0 0 3px rgba(var(--mg-primary-rgb), 0.1);
        }

        .empty-state {
          text-align: center;
          padding: 2rem;
          color: var(--mg-text-muted);
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .error-alert {
          background: #fee2e2;
          border: 1px solid #fecaca;
          color: #991b1b;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .error-close {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          font-size: 1.2rem;
        }

        .section-divider {
          height: 1px;
          background: var(--mg-border);
          margin: 1rem 0;
        }
      `}</style>

      {error && (
        <div className="error-alert">
          <span>{error}</span>
          <button className="error-close" onClick={() => setError('')}>
            ×
          </button>
        </div>
      )}

      {/* Section Invitations Reçues */}
      <section>
        <h2 className="section-title">
          <FiMail size={24} />
          Invitations reçues
        </h2>

        {loadingReceived ? (
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <p>Chargement des invitations...</p>
          </div>
        ) : receivedInvitations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" style={{ fontSize: '3rem' }}>
              <FiInbox size={48} />
            </div>
            <p>Aucune invitation pour le moment.</p>
          </div>
        ) : (
          <div className="invitations-grid">
            {receivedInvitations.map(invitation => (
              <div 
                key={invitation.id} 
                className="invitation-card"
                onClick={() => onUserProfileClick && onUserProfileClick(invitation.sender_id)}
                style={{ cursor: onUserProfileClick ? 'pointer' : 'default' }}
              >
                <div className="invitation-header">
                  <div className="user-avatar">
                    {invitation.display_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="user-info">
                    <p className="user-name">
                      {invitation.display_name || invitation.email}
                    </p>
                    <div className="user-email">
                      <FiMail size={14} />
                      {invitation.email}
                    </div>
                    <span className="user-role">
                      {invitation.role === 'farmer' ? '🚜 Agriculteur' : '👤 Client'}
                    </span>
                  </div>
                </div>

                {invitation.message && (
                  <p className="invitation-message">
                    « {invitation.message} »
                  </p>
                )}

                <div className="invitation-actions">
                  <button
                    className="btn-icon btn-accept"
                    onClick={() => handleAccept(invitation.id)}
                    title="Accepter l'invitation"
                  >
                    <FiCheck size={18} />
                    Accepter
                  </button>
                  <button
                    className="btn-icon btn-decline"
                    onClick={() => handleDecline(invitation.id)}
                    title="Refuser l'invitation"
                  >
                    <FiX size={18} />
                    Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="section-divider"></div>

      {/* Section Suggestions de Collaboration */}
      <section>
        <h2 className="section-title">
          <FiUserPlus size={24} />
          Suggestions de collaboration
        </h2>

        {loadingSuggestions ? (
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <p>Chargement des suggestions...</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" style={{ fontSize: '3rem' }}>
              <FiFilter size={48} />
            </div>
            <p>Aucune suggestion pour le moment.</p>
          </div>
        ) : (
          <div className="invitations-grid">
            {suggestions.map(user => (
              <div 
                key={user.id} 
                className="invitation-card"
                onClick={() => onUserProfileClick && onUserProfileClick(user.id)}
                style={{ cursor: onUserProfileClick ? 'pointer' : 'default' }}
              >
                <div className="invitation-header">
                  <div className="user-avatar">
                    {user.display_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="user-info">
                    <p className="user-name">
                      {user.display_name || user.email}
                    </p>
                    <div className="user-email">
                      <FiMail size={14} />
                      {user.email}
                    </div>
                    <span className="user-role">
                      {user.role === 'farmer' ? '🚜 Agriculteur' : '👤 Client'}
                    </span>
                  </div>
                </div>

                {!sentInvitations.has(user.id) && (
                  <div className="suggestion-form">
                    <textarea
                      className="invitation-textarea"
                      placeholder="Ajouter un message personnalisé (optionnel)..."
                      value={invitationMessage[user.id] || ''}
                      onChange={(e) =>
                        setInvitationMessage(prev => ({
                          ...prev,
                          [user.id]: e.target.value
                        }))
                      }
                    />
                  </div>
                )}

                <button
                  className={`btn-icon ${
                    sentInvitations.has(user.id) ? 'btn-invited' : 'btn-invite'
                  }`}
                  onClick={() => handleSendInvitation(user.id)}
                  disabled={sentInvitations.has(user.id)}
                  title={
                    sentInvitations.has(user.id)
                      ? 'Invitation déjà envoyée'
                      : 'Envoyer une invitation'
                  }
                >
                  <FiUserPlus size={18} />
                  {sentInvitations.has(user.id)
                    ? 'Invitation envoyée'
                    : 'Inviter'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
