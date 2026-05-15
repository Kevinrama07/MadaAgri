import { FiAlertCircle, FiX } from 'react-icons/fi';
import styles from '../styles/ui/ErrorBanner.module.css';

export default function ErrorBanner({ message, onClose, type = 'error' }) {
  if (!message) return null;

  return (
    <div className={`${styles.banner} ${styles[type]}`} role="alert">
      <div className={styles.content}>
        <FiAlertCircle className={styles.icon} />
        <p className={styles.message}>{message}</p>
      </div>
      {onClose && (
        <button 
          className={styles.closeBtn} 
          onClick={onClose}
          aria-label="Fermer le message"
        >
          <FiX />
        </button>
      )}
    </div>
  );
}
