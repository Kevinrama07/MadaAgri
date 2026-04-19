import '../styles/MessagerieStyles.css';

export default function ChatHeader({ contact, onBack = null }) {
  if (!contact) {
    return (
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-header-details">
            <div className="chat-header-name">Sélectionnez une conversation</div>
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
    <div className="chat-header">
      <div className="chat-header-info">
        {onBack && (
          <button className="chat-header-back-btn" onClick={onBack}>
            <i className="fas fa-arrow-left"></i>
          </button>
        )}
        <div className="chat-header-avatar">
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
        <div className="chat-header-details">
          <div className="chat-header-name">{contact.display_name}</div>
          <div className="chat-header-status">
            <span className="status-online"></span>
            En ligne
          </div>
        </div>
      </div>

      <div className="chat-header-actions">
        <button className="chat-action-btn" title="Appel audio">
          <i className="fas fa-phone"></i>
        </button>
        <button className="chat-action-btn" title="Appel vidéo">
          <i className="fas fa-video"></i>
        </button>
        <button className="chat-action-btn" title="Plus d'options">
          <i className="fas fa-ellipsis-v"></i>
        </button>
      </div>
    </div>
  );
}
