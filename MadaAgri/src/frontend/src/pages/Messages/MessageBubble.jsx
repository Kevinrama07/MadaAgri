import clsx from 'clsx';
import styles from '../../styles/Messages/MessagerieStyles.module.css';

export default function MessageBubble({ message, currentUserId, timestamp }) {
  const isSent = message.sender_id === currentUserId;

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={clsx(styles['message-group'], { [styles['sent']]: isSent, [styles['received']]: !isSent })}>
      <div className={clsx(styles['message-bubble'], { [styles['sent']]: isSent, [styles['received']]: !isSent })}>
        <div className={clsx(styles['message-content'])}>{message.content}</div>
        <div className={clsx(styles['message-time'])}>
          {formatTime(message.created_at)}
          {isSent && <span className={clsx(styles['message-status-icon'])}>✔✔</span>}
        </div>
      </div>
    </div>
  );
}
