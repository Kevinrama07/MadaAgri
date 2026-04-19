import { useState, useMemo } from 'react';
import { FiUser, FiTarget } from 'react-icons/fi';
import '../styles/MessagerieStyles.css';

export default function ChatSidebar({
  users,
  selectedUser,
  onSelectUser,
  loading,
  onBack = null,
  className = ''
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.display_name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const getAvatarInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPreviewText = (user) => {
    return user.role === 'farmer' ? (
      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <FiTarget size={14} /> Agriculteur
      </span>
    ) : (
      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <FiUser size={14} /> Client
      </span>
    );
  };

  return (
    <div className={`chat-sidebar ${className}`}>
      <div className="chat-sidebar-header">
        <h2 className="chat-sidebar-title">
          <i className="fas fa-comments"></i>
          Messages
        </h2>

        <div className="chat-search-wrapper">
          <i className="fas fa-search chat-search-icon"></i>
          <input
            type="text"
            className="chat-search"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="chat-conversations-list">
        {filteredUsers.length === 0 && !loading ? (
          <div className="empty-conversations">
            <i className="fas fa-inbox"></i>
            <p>
              {users.length === 0
                ? 'Aucun utilisateur disponible'
                : 'Aucun résultat'}
            </p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <button
              key={user.id}
              onClick={() => onSelectUser(user)}
              className={`conversation-item ${
                selectedUser?.id === user.id ? 'active' : ''
              }`}
            >
              <div className="conversation-avatar">
                {user.profile_image_url ? (
                  <img
                    src={user.profile_image_url}
                    alt={user.display_name}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  getAvatarInitials(user.display_name || 'U')
                )}
              </div>

              <div className="conversation-info">
                <div className="conversation-name">{user.display_name}</div>
                <div className="conversation-preview">
                  {getPreviewText(user)}
                </div>
              </div>

              <div className="conversation-time">
                {new Date().toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
