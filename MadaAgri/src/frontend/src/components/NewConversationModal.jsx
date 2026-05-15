import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { FiX, FiSearch, FiMessageCircle } from 'react-icons/fi';
import { dataApi } from '../lib/api';
import styles from '../styles/ui/NewConversationModal.module.css';

export default function NewConversationModal({ onClose, onSelectUser }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await dataApi.fetchUsers();
      setUsers(allUsers || []);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      loadUsers();
      return;
    }

    try {
      setSearching(true);
      const results = await dataApi.searchUsers(query);
      setUsers(results || []);
    } catch (error) {
      console.error('Erreur recherche:', error);
    } finally {
      setSearching(false);
    }
  };

  const getAvatarInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleUserClick = (user) => {
    onSelectUser?.(user);
    onClose?.();
  };

  return (
    <div className={clsx(styles.overlay)} onClick={onClose}>
      <div className={clsx(styles.modal)} onClick={(e) => e.stopPropagation()}>
        <div className={clsx(styles.header)}>
          <h2 className={clsx(styles.title)}>
            <FiMessageCircle />
            Nouvelle conversation
          </h2>
          <button onClick={onClose} className={clsx(styles.closeBtn)}>
            <FiX />
          </button>
        </div>

        <div className={clsx(styles.searchWrapper)}>
          <FiSearch className={clsx(styles.searchIcon)} />
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className={clsx(styles.searchInput)}
            autoFocus
          />
        </div>

        <div className={clsx(styles.userList)}>
          {loading || searching ? (
            <div className={clsx(styles.loading)}>
              <div className={clsx(styles.spinner)} />
              <p>Chargement...</p>
            </div>
          ) : users.length === 0 ? (
            <div className={clsx(styles.empty)}>
              <FiMessageCircle size={48} />
              <p>Aucun utilisateur trouvé</p>
            </div>
          ) : (
            users.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserClick(user)}
                className={clsx(styles.userItem)}
              >
                <div className={clsx(styles.avatar)}>
                  {user.profile_image_url ? (
                    <img src={user.profile_image_url} alt={user.display_name} />
                  ) : (
                    getAvatarInitials(user.display_name || 'U')
                  )}
                </div>
                <div className={clsx(styles.userInfo)}>
                  <div className={clsx(styles.userName)}>{user.display_name}</div>
                  <div className={clsx(styles.userRole)}>{user.role}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
