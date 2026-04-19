import '../styles/MessagerieStyles.css';

export default function MessageBubble({ message, currentUserId, timestamp }) {
  const isSent = message.sender_id === currentUserId;

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`message-group ${isSent ? 'sent' : 'received'}`}>
      <div className={`message-bubble ${isSent ? 'sent' : 'received'}`}>
        <div className="message-content">{message.content}</div>
        <div className="message-time">
          {formatTime(message.created_at)}
          {isSent && <span className="message-status-icon">✔✔</span>}
        </div>
      </div>
    </div>
  );
}
