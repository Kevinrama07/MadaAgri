import styles from '../../styles/Messages/MessagerieStyles.module.css';
import clsx from 'clsx';
import { FiArrowLeft, FiPhone, FiVideo, FiMoreVertical } from 'react-icons/fi';
export default function ChatHeader({ contact, onBack = null }) {
  if (!contact) {
    return (
      <div className={clsx(styles['chat-header'])}>
        <div className={clsx(styles['chat-header-info'])}>
          <div className={clsx(styles['chat-header-details'])}>
            <div className={clsx(styles['chat-header-name'])}>Sélectionnez une conversation</div>
          </div>
        </div>
      </div>
    );
  }

  const getAvatarInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={clsx(styles['chat-header'])}>
      <div className={clsx(styles['chat-header-info'])}>
        {onBack && (
          <p className={clsx(styles['chat-header-back-btn'])} onClick={onBack}>
            <FiArrowLeft />
          </p>
        )}
        <div className={clsx(styles['chat-header-avatar'])}>
          {contact.profile_image_url ? (
            <img
              src={contact.profile_image_url}
              alt={contact.display_name}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover'
              }}
            />
          ) : (
            getAvatarInitials(contact.display_name || 'U')
          )}
        </div>
        <div className={clsx(styles['chat-header-details'])}>
          <div className={clsx(styles['chat-header-name'])}>{contact.display_name}</div>
          <div className={clsx(styles['chat-header-status'])}>
            <span className={clsx(styles['status-online'])}></span>
            En ligne
          </div>
        </div>
      </div>

      <div className={clsx(styles['chat-header-actions'])}>
        <p className={clsx(styles['chat-action-btn'])} title="Appel audio">
          <FiPhone />
        </p>
        <p className={clsx(styles['chat-action-btn'])} title="Appel vidéo">
          <FiVideo />
        </p>
        <p className={clsx(styles['chat-action-btn'])} title="Plus d'options">
          <FiMoreVertical />
        </p>
      </div>
    </div>
  );
}
