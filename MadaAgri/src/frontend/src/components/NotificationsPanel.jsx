import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { dataApi } from '../lib/api';
import styles from './NotificationsPanel.module.css';

const TYPE_CONFIG = {
  like: { label: 'Like', icon: 'heart', color: 'var(--error)' },
  comment: { label: 'Commentaire', icon: 'comment', color: 'var(--info)' },
  follow: { label: 'Nouvel abonné', icon: 'user-plus', color: 'var(--primary)' },
  collaboration: { label: 'Collaboration', icon: 'handshake', color: 'var(--success)' },
  order: { label: 'Commande', icon: 'cart', color: 'var(--warning)' },
  order_confirmed: { label: 'Commande confirmée', icon: 'check', color: 'var(--success)' },
  order_cancelled: { label: 'Commande annulée', icon: 'x', color: 'var(--error)' },
  profile_view: { label: 'Vue de profil', icon: 'eye', color: 'var(--text-muted)' },
  system: { label: 'Système', icon: 'bell', color: 'var(--text-secondary)' },
};

function getIcon(type) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.system;
  switch (cfg.icon) {
    case 'heart':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" width="18" height="18">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      );
    case 'comment':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case 'user-plus':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <line x1="20" y1="8" x2="20" y2="14" />
          <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
      );
    case 'handshake':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
          <path d="M20.42 4.58a5.4 5.4 0 0 0-7.64 0l-.78.78-.78-.78a5.4 5.4 0 0 0-7.64 0C1.42 6.74 1.42 10.42 3.58 12.58l8.42 8.42 8.42-8.42c2.16-2.16 2.16-5.84 0-8z" />
        </svg>
      );
    case 'cart':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
          <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      );
    case 'check':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case 'x':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );
    case 'eye':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      );
  }
}

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return "À l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days}j`;
  return date.toLocaleDateString('fr-FR');
}

export default function NotificationsPanel({ onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const panelRef = useRef(null);

  useEffect(() => {
    async function fetchNotifications() {
      setLoading(true);
      try {
        const [notifData, count] = await Promise.all([
          dataApi.fetchNotifications({ limit: 50, unreadOnly: filter === 'unread' }),
          dataApi.fetchUnreadNotificationCount(),
        ]);
        setNotifications(notifData.notifications || []);
        setUnreadCount(count);
      } catch (err) {
        console.error('[Notifications] Failed to load:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, [filter]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleMarkRead = async (id) => {
    try {
      await dataApi.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[Notifications] Mark read failed:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await dataApi.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('[Notifications] Mark all read failed:', err);
    }
  };

  const handleArchive = async (id) => {
    try {
      await dataApi.archiveNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('[Notifications] Archive failed:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await dataApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('[Notifications] Delete failed:', err);
    }
  };

  const getLink = (notif) => {
    if (notif.related_type === 'post') return `/dashboard/post/${notif.related_id}`;
    if (notif.related_type === 'order' || notif.related_type === 'reservation') return '/dashboard/orders';
    if (notif.related_type === 'collaboration') return '/dashboard/network';
    if (notif.actor_id) return `/profile/${notif.actor_id}`;
    return null;
  };

  return (
    <div className={styles.panel} ref={panelRef}>
      <div className={styles.header}>
        <h2>Notifications</h2>
        {unreadCount > 0 && (
          <button className={styles.markAllBtn} onClick={handleMarkAllRead}>
            Tout marquer comme lu
          </button>
        )}
      </div>

      <div className={styles.filters}>
        <button
          className={`${styles.filterBtn} ${filter === 'all' ? styles.filterBtnActive : ''}`}
          onClick={() => setFilter('all')}
        >
          Toutes
        </button>
        <button
          className={`${styles.filterBtn} ${filter === 'unread' ? styles.filterBtnActive : ''}`}
          onClick={() => setFilter('unread')}
        >
          Non lues {unreadCount > 0 && `(${unreadCount})`}
        </button>
      </div>

      <div className={styles.list}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>Chargement...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className={styles.emptyState}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <p>Aucune notification</p>
          </div>
        ) : (
          notifications.map((notif) => {
            const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
            const link = getLink(notif);
            const content = (
              <>
                <div className={styles.notifIcon} style={{ color: cfg.color }}>
                  {getIcon(notif.type)}
                </div>
                <div className={styles.notifContent}>
                  <div className={styles.notifHeader}>
                    <span className={styles.notifActor}>{notif.actor_name || 'Utilisateur'}</span>
                    <span className={styles.notifType}>{cfg.label}</span>
                  </div>
                  <p className={styles.notifText}>{notif.content}</p>
                  <span className={styles.notifTime}>{timeAgo(notif.created_at)}</span>
                </div>
                {!notif.is_read && <div className={styles.notifDot} />}
                <div className={styles.notifActions}>
                  <button
                    className={styles.actionBtn}
                    onClick={(e) => { e.stopPropagation(); handleArchive(notif.id); }}
                    title="Archiver"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <polyline points="21 8 21 21 3 21 3 8" />
                      <rect x="1" y="3" width="22" height="5" />
                      <line x1="10" y1="12" x2="14" y2="12" />
                    </svg>
                  </button>
                  <button
                    className={styles.actionBtn}
                    onClick={(e) => { e.stopPropagation(); handleDelete(notif.id); }}
                    title="Supprimer"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </>
            );

            return (
              <div
                key={notif.id}
                className={`${styles.notifItem} ${!notif.is_read ? styles.notifUnread : ''}`}
                onClick={() => {
                  if (!notif.is_read) handleMarkRead(notif.id);
                }}
              >
                {link ? (
                  <Link to={link} className={styles.notifLink}>
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
