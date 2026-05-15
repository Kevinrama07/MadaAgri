import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiCheck, FiX, FiArchive, FiTrash2, FiFilter, FiSearch, FiSettings } from 'react-icons/fi';
import notificationService from '../../services/notificationService';
import socketService from '../../services/socketService';
import styles from './NotificationsPage.module.css';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadNotifications();
    loadStats();
  }, [filter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const params = { limit: 100 };
      if (filter !== 'all') params.type = filter;
      if (filter === 'unread') params.unreadOnly = true;
      
      const data = await notificationService.getNotifications(params);
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await notificationService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleMarkAsRead = async (id) => {
    await notificationService.markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    loadStats();
  };

  const handleDelete = async (id) => {
    await notificationService.deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    loadStats();
  };

  const handleArchive = async (id) => {
    await notificationService.archiveNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    loadStats();
  };

  const handleClearAll = async () => {
    if (!confirm('Supprimer toutes les notifications lues ?')) return;
    await notificationService.clearAllRead();
    loadNotifications();
    loadStats();
  };

  const handleRespond = async (notification, accepted) => {
    if (notification.type === 'collaboration') {
      socketService.respondCollaborationInvite(notification.id, accepted);
    } else if (notification.type === 'follow') {
      socketService.respondFollowRequest(notification.id, accepted);
    }
    await handleDelete(notification.id);
  };

  const filteredNotifications = notifications.filter(n => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return n.content?.toLowerCase().includes(query) || 
             n.actor_name?.toLowerCase().includes(query);
    }
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <FiBell size={28} />
          <div>
            <h1>Notifications</h1>
            <p>{unreadCount} non lue{unreadCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllAsRead} className={styles.btnPrimary}>
              <FiCheck /> Tout marquer comme lu
            </button>
          )}
          <button onClick={handleClearAll} className={styles.btnSecondary}>
            <FiTrash2 /> Effacer les lues
          </button>
          <button onClick={() => navigate('/settings/notifications')} className={styles.btnIcon}>
            <FiSettings size={20} />
          </button>
        </div>
      </div>

      {stats && (
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.total}</span>
            <span className={styles.statLabel}>Total</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.unread}</span>
            <span className={styles.statLabel}>Non lues</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.messages}</span>
            <span className={styles.statLabel}>Messages</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.collaborations}</span>
            <span className={styles.statLabel}>Collaborations</span>
          </div>
        </div>
      )}

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <FiSearch />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className={styles.filterTabs}>
          {['all', 'unread', 'message', 'collaboration', 'follow'].map(f => (
            <button
              key={f}
              className={filter === f ? styles.active : ''}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Tous' : f === 'unread' ? 'Non lus' : f}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}>Chargement...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className={styles.empty}>
            <FiBell size={48} />
            <p>Aucune notification</p>
          </div>
        ) : (
          <div className={styles.list}>
            {filteredNotifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
                onArchive={handleArchive}
                onRespond={handleRespond}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationItem({ notification, onMarkAsRead, onDelete, onArchive, onRespond }) {
  const getIcon = () => {
    switch (notification.type) {
      case 'message': return '💬';
      case 'collaboration': return '🤝';
      case 'follow': return '👤';
      case 'like': return '❤️';
      case 'comment': return '💭';
      default: return '🔔';
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}j`;
    return d.toLocaleDateString('fr-FR');
  };

  return (
    <div className={`${styles.item} ${!notification.is_read ? styles.unread : ''}`}>
      <div className={styles.itemIcon}>{getIcon()}</div>
      <div className={styles.itemContent}>
        <div className={styles.itemHeader}>
          <strong>{notification.actor_name || 'Notification'}</strong>
          <span className={styles.itemTime}>{formatTime(notification.created_at)}</span>
        </div>
        <p className={styles.itemText}>{notification.content}</p>
        
        {(notification.type === 'collaboration' || notification.type === 'follow') && !notification.is_read && (
          <div className={styles.itemActions}>
            <button onClick={() => onRespond(notification, true)} className={styles.btnAccept}>
              <FiCheck /> Accepter
            </button>
            <button onClick={() => onRespond(notification, false)} className={styles.btnDecline}>
              <FiX /> Refuser
            </button>
          </div>
        )}
      </div>
      <div className={styles.itemButtons}>
        {!notification.is_read && (
          <button onClick={() => onMarkAsRead(notification.id)} title="Marquer comme lu">
            <FiCheck />
          </button>
        )}
        <button onClick={() => onArchive(notification.id)} title="Archiver">
          <FiArchive />
        </button>
        <button onClick={() => onDelete(notification.id)} title="Supprimer">
          <FiTrash2 />
        </button>
      </div>
    </div>
  );
}
