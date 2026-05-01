import { useState, useMemo } from 'react';
import clsx from 'clsx';
import { FiUser, FiTarget, FiMessageCircle, FiSearch, FiInbox } from 'react-icons/fi';
import styles from '../../styles/Messages/MessagerieStyles.module.css';

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
    <div className={clsx(styles['chat-sidebar'], className)}>
      <div className={clsx(styles['chat-sidebar-header'])}>
        <h2 className={clsx(styles['chat-sidebar-title'])}>
          <FiMessageCircle />
          Messages
        </h2>

        <div className={clsx(styles['chat-search-wrapper'])}>
          <FiSearch className={clsx(styles['chat-search-icon'])} />
          <input
            type="text"
            className={clsx(styles['chat-search'])}
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className={clsx(styles['chat-conversations-list'])}>
        {filteredUsers.length === 0 && !loading ? (
          <div className={clsx(styles['empty-conversations'])}>
            <FiInbox />
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
              className={clsx(styles['conversation-item'], { [styles['active']]: selectedUser?.id === user.id })}
            >
              <div className={clsx(styles['conversation-avatar'])}>
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

              <div className={clsx(styles['conversation-info'])}>
                <div className={clsx(styles['conversation-name'])}>{user.display_name}</div>
                <div className={clsx(styles['conversation-preview'])}>
                  {getPreviewText(user)}
                </div>
              </div>

              <div className={clsx(styles['conversation-time'])}>
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
