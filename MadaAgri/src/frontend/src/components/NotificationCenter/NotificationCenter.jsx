import React, { useState, useEffect, useCallback, useRef } from 'react';
import clsx from 'clsx';
import { FiBell, FiX, FiCheck, FiUser, FiUsers, FiMessageSquare, FiSearch, FiFilter, FiArchive, FiSettings } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import styles from './NotificationCenter.module.css';

export default function NotificationCenter({
  notifications = [],
  unreadCount = 0,
  onMarkAsRead,
  onMarkAllAsRead,
  onRemove,
  onArchive,
  onNavigate,
}) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [animatingId, setAnimatingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const dropdownRef = useRef(null);

  // Fermer au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleRemove = useCallback((notificationId) => {
    setAnimatingId(notificationId);
    setTimeout(() => {
      onRemove(notificationId);
      setAnimatingId(null);
    }, 300);
  }, [onRemove]);

  const handleNotificationClick = useCallback((notification) => {
    // Marquer comme lu
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }

    // Navigation selon le type
    if (onNavigate) {
      onNavigate(notification);
    } else {
      // Navigation par défaut
      switch (notification.type) {
        case 'message':
          navigate(`/messages/${notification.conversationId || notification.senderId}`);
          break;
        case 'collaboration':
          navigate(`/invitations`);
          break;
        case 'follow':
          navigate(`/profile/${notification.senderId}`);
          break;
        case 'like':
        case 'comment':
          navigate(`/posts/${notification.relatedItem}`);
          break;
        default:
          break;
      }
    }

    setIsOpen(false);
  }, [onMarkAsRead, onNavigate, navigate]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return { icon: FiMessageSquare, color: '#3b82f6' };
      case 'collaboration':
        return { icon: FiUsers, color: '#f59e0b' };
      case 'follow':
        return { icon: FiUser, color: '#ef4444' };
      default:
        return { icon: FiBell, color: '#6b7280' };
    }
  };

  const getNotificationTitle = (notification) => {
    switch (notification.type) {
      case 'message':
        return `Message de ${notification.senderName}`;
      case 'collaboration':
        return `Invitation de collaboration: ${notification.projectName}`;
      case 'follow':
        return `${notification.senderName} veut vous suivre`;
      default:
        return notification.content;
    }
  };

  const getNotificationDescription = (notification) => {
    switch (notification.type) {
      case 'message':
        return notification.content;
      case 'collaboration':
        return notification.message || 'Veut collaborer avec vous';
      case 'follow':
        return 'Veut ajouter vous a sa liste de suivi';
      default:
        return '';
    }
  };

  // Filtrer les notifications
  const filteredNotifications = notifications.filter((n) => {
    // Filtre par type
    if (filterType !== 'all' && n.type !== filterType) {
      return false;
    }

    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const title = getNotificationTitle(n).toLowerCase();
      const desc = getNotificationDescription(n).toLowerCase();
      return title.includes(query) || desc.includes(query);
    }

    return true;
  });

  // Grouper par date
  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const date = new Date(notification.timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let group;
    if (date.toDateString() === today.toDateString()) {
      group = 'Aujourd\'hui';
    } else if (date.toDateString() === yesterday.toDateString()) {
      group = 'Hier';
    } else if (date > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
      group = 'Cette semaine';
    } else {
      group = 'Plus ancien';
    }

    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(notification);
    return groups;
  }, {});

  const unreadNotifications = filteredNotifications.filter((n) => !n.read);
  const hasNotifications = filteredNotifications.length > 0;

  return (
    <div className={clsx(styles['notification-container'])} ref={dropdownRef}>
      {/* Bouton de notification */}
      <button
        className={clsx(styles['notification-button'], {
          [styles['active']]: isOpen,
          [styles['has-unread']]: unreadCount > 0,
        })}
        onClick={() => setIsOpen(!isOpen)}
        title={`${unreadCount} notification${unreadCount !== 1 ? 's' : ''}`}
      >
        <FiBell size={20} />
        {unreadCount > 0 && (
          <span className={clsx(styles['badge'])}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {/* Dropdown de notifications */}
      {isOpen && (
        <div className={clsx(styles['dropdown'])}>
          <div className={clsx(styles['header'])}>
            <h3>Notifications</h3>
            <div className={clsx(styles['header-actions'])}>
              {unreadCount > 0 && (
                <button
                  className={clsx(styles['header-btn'])}
                  onClick={onMarkAllAsRead}
                  title="Tout marquer comme lu"
                >
                  <FiCheck size={16} />
                </button>
              )}
              <button
                className={clsx(styles['header-btn'])}
                onClick={() => setShowFilters(!showFilters)}
                title="Filtres"
              >
                <FiFilter size={16} />
              </button>
              <button
                className={clsx(styles['header-btn'])}
                onClick={() => navigate('/settings/notifications')}
                title="Parametres"
              >
                <FiSettings size={16} />
              </button>
            </div>
          </div>

          {/* Barre de recherche et filtres */}
          {showFilters && (
            <div className={clsx(styles['filters'])}>
              <div className={clsx(styles['search-box'])}>
                <FiSearch size={16} />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={clsx(styles['search-input'])}
                />
              </div>
              <div className={clsx(styles['filter-tabs'])}>
                {['all', 'message', 'collaboration', 'follow'].map((type) => (
                  <button
                    key={type}
                    className={clsx(styles['filter-tab'], {
                      [styles['active']]: filterType === type,
                    })}
                    onClick={() => setFilterType(type)}
                  >
                    {type === 'all' ? 'Tous' : type}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={clsx(styles['content'])}>
            {hasNotifications ? (
              Object.entries(groupedNotifications).map(([group, notifs]) => (
                <div key={group}>
                  <div className={clsx(styles['section-title'])}>{group}</div>
                  <div className={clsx(styles['notifications-list'])}>
                    {notifs.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        isAnimating={animatingId === notification.id}
                        onMarkAsRead={() => onMarkAsRead(notification.id)}
                        onRemove={() => handleRemove(notification.id)}
                        onArchive={() => onArchive(notification.id)}
                        onClick={() => handleNotificationClick(notification)}
                        getIcon={() => getNotificationIcon(notification.type)}
                        getTitle={() => getNotificationTitle(notification)}
                        getDescription={() => getNotificationDescription(notification)}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className={clsx(styles['empty-state'])}>
                <FiBell size={32} />
                <p>
                  {searchQuery || filterType !== 'all'
                    ? 'Aucune notification trouvee'
                    : 'Aucune notification'}
                </p>
              </div>
            )}
          </div>

          {hasNotifications && (
            <div className={clsx(styles['footer'])}>
              <button
                className={clsx(styles['footer-btn'])}
                onClick={() => navigate('/notifications')}
              >
                Voir toutes les notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  notification,
  isAnimating,
  onMarkAsRead,
  onRemove,
  onArchive,
  onClick,
  getIcon,
  getTitle,
  getDescription,
}) {
  const IconComponent = getIcon().icon;
  const iconColor = getIcon().color;

  return (
    <div
      className={clsx(styles['notification-item'], {
        [styles['unread']]: !notification.read,
        [styles['removing']]: isAnimating,
      })}
      onClick={onClick}
    >
      <div className={clsx(styles['item-content'])}>
        <div className={clsx(styles['item-icon'])} style={{ color: iconColor }}>
          <IconComponent size={18} />
        </div>
        <div className={clsx(styles['item-text'])}>
          <p className={clsx(styles['item-title'])} title={getTitle()}>
            {getTitle()}
          </p>
          {getDescription() && (
            <p className={clsx(styles['item-desc'])} title={getDescription()}>
              {getDescription()}
            </p>
          )}
          <span className={clsx(styles['item-time'])}>
            {formatTime(new Date(notification.timestamp))}
          </span>
        </div>
      </div>

      <div className={clsx(styles['item-actions'])} onClick={(e) => e.stopPropagation()}>
        {/* Actions pour les invitations */}
        {(notification.type === 'collaboration' || notification.type === 'follow') &&
          !notification.read && (
            <div className={clsx(styles['action-buttons'])}>
              <button
                className={clsx(styles['btn-accept'])}
                onClick={() => onArchive(notification.id)}
                title="Accepter"
              >
                <FiCheck size={16} />
              </button>
              <button
                className={clsx(styles['btn-decline'])}
                onClick={() => onRemove(notification.id)}
                title="Refuser"
              >
                <FiX size={16} />
              </button>
            </div>
          )}

        {/* Boutons d'action */}
        {notification.read && (
          <button
            className={clsx(styles['btn-action'])}
            onClick={onArchive}
            title="Archiver"
          >
            <FiArchive size={14} />
          </button>
        )}
        <button className={clsx(styles['btn-close'])} onClick={onRemove} title="Fermer">
          <FiX size={14} />
        </button>
      </div>
    </div>
  );
}

function formatTime(date) {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'A l\'instant';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days === 1) return 'Hier';
  if (days < 7) return `${days}j`;
  if (days < 30) return `${Math.floor(days / 7)} sem`;
  if (days < 365) return `${Math.floor(days / 30)} mois`;

  return date.toLocaleDateString('fr-FR');
}
