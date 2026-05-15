import { useState, useMemo } from 'react';
import clsx from 'clsx';
import { FiUser, FiTarget, FiMessageCircle, FiSearch, FiInbox, FiCircle } from 'react-icons/fi';
import styles from '../../styles/Messages/MessagerieStyles.module.css';

export default function ChatSidebar({
  conversations,
  selectedConversation,
  onSelectConversation,
  loading,
  isConnected,
  onBack = null,
  className = ''
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter(
      (conv) =>
        conv.other_user_name?.toLowerCase().includes(query) ||
        conv.last_message?.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  const getAvatarInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTimestamp = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}j`;

    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className={clsx(styles['chat-sidebar'], className)}>
      <div className={clsx(styles['chat-sidebar-header'])}>
        <div className={clsx(styles['sidebar-title-row'])}>
          <h2 className={clsx(styles['chat-sidebar-title'])}>
            <FiMessageCircle />
            Messages
          </h2>
          <div className={clsx(styles['connection-indicator'], { [styles['connected']]: isConnected })}>
            <FiCircle size={8} />
            {isConnected ? 'En ligne' : 'Hors ligne'}
          </div>
        </div>

        <div className={clsx(styles['chat-search-wrapper'])}>
          <FiSearch className={clsx(styles['chat-search-icon'])} />
          <input
            type="text"
            className={clsx(styles['chat-search'])}
            placeholder="Rechercher une conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className={clsx(styles['chat-conversations-list'])}>
        {filteredConversations.length === 0 && !loading ? (
          <div className={clsx(styles['empty-conversations'])}>
            <FiInbox size={48} />
            <p>
              {conversations.length === 0
                ? 'Aucune conversation'
                : 'Aucun résultat'}
            </p>
            <span className={clsx(styles['empty-hint'])}>
              {conversations.length === 0
                ? 'Vos conversations apparaîtront ici'
                : 'Essayez un autre terme de recherche'}
            </span>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv)}
              className={clsx(styles['conversation-item'], { 
                [styles['active']]: selectedConversation?.id === conv.id 
              })}
            >
              <div className={clsx(styles['conversation-avatar-wrapper'])}>
                <div className={clsx(styles['conversation-avatar'])}>
                  {conv.other_user_image ? (
                    <img
                      src={conv.other_user_image}
                      alt={conv.other_user_name}
                      className={clsx(styles['avatar-img'])}
                    />
                  ) : (
                    getAvatarInitials(conv.other_user_name || 'U')
                  )}
                </div>
                {conv.other_user_online && (
                  <div className={clsx(styles['online-badge'])} />
                )}
              </div>

              <div className={clsx(styles['conversation-info'])}>
                <div className={clsx(styles['conversation-header'])}>
                  <div className={clsx(styles['conversation-name'])}>
                    {conv.other_user_name}
                  </div>
                  <div className={clsx(styles['conversation-time'])}>
                    {formatTimestamp(conv.last_message_at)}
                  </div>
                </div>
                <div className={clsx(styles['conversation-footer'])}>
                  <div className={clsx(styles['conversation-preview'], {
                    [styles['unread']]: conv.unread_count > 0
                  })}>
                    {conv.last_message || 'Aucun message'}
                  </div>
                  {conv.unread_count > 0 && (
                    <div className={clsx(styles['unread-badge'])}>
                      {conv.unread_count > 9 ? '9+' : conv.unread_count}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
