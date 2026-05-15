import { FiUsers, FiBarChart2, FiBookmark } from 'react-icons/fi';
import clsx from 'clsx';
import { useAuth } from '../../contexts/ContextAuthentification';
import styles from '../../styles/Composants/LeftSidebar.module.css';

export default function LeftSidebar() {
  const { user } = useAuth();

  const menuItems = [
    { icon: <FiUsers />, label: 'Collaborateurs' },
    { icon: <FiBarChart2 />, label: 'Tableau de bord' },
    { icon: <FiBookmark />, label: 'Enregistrements' },
  ];

  return (
    <aside className={clsx(styles['left-sidebar'])}>
      {/* User Profile Card */}
      <div className={clsx(styles['user-card'])}>
        <img
          src={user?.profile_image_url || '/src/images/avatar.gif'}
          alt={user?.display_name}
          className={clsx(styles['user-avatar'])}
        />
        <h3 className={clsx(styles['user-name'])}>{user?.display_name || 'Utilisateur'}</h3>
      </div>

      {/* Navigation Menu */}
      <nav className={clsx(styles['nav-menu'])}>
        {menuItems.map((item, index) => (
          <button
            key={index}
            className={clsx(styles['nav-item'])}
          >
            <span className={clsx(styles['nav-icon'])}>{item.icon}</span>
            <span className={clsx(styles['nav-label'])}>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
