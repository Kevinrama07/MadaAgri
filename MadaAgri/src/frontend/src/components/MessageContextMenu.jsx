import { useRef, useEffect } from 'react';
import clsx from 'clsx';
import { FiEdit2, FiTrash2, FiSmile, FiCopy } from 'react-icons/fi';
import styles from '../styles/ui/MessageContextMenu.module.css';

export default function MessageContextMenu({ 
  message, 
  isOwn, 
  position, 
  onEdit, 
  onDelete, 
  onReact, 
  onClose 
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose?.();
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    onClose?.();
  };

  const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  return (
    <div 
      ref={menuRef}
      className={clsx(styles.menu)}
      style={{
        top: position.y,
        left: position.x,
      }}
    >
      {/* Quick reactions */}
      <div className={clsx(styles.quickReactions)}>
        {quickReactions.map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              onReact?.(emoji);
              onClose?.();
            }}
            className={clsx(styles.reactionBtn)}
            title={`Réagir avec ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      <div className={clsx(styles.divider)} />

      {/* Actions */}
      <div className={clsx(styles.actions)}>
        <button
          onClick={() => {
            onReact?.();
            onClose?.();
          }}
          className={clsx(styles.actionBtn)}
        >
          <FiSmile />
          <span>Réagir</span>
        </button>

        <button
          onClick={handleCopy}
          className={clsx(styles.actionBtn)}
        >
          <FiCopy />
          <span>Copier</span>
        </button>

        {isOwn && (
          <>
            <button
              onClick={() => {
                onEdit?.(message);
                onClose?.();
              }}
              className={clsx(styles.actionBtn)}
            >
              <FiEdit2 />
              <span>Modifier</span>
            </button>

            <button
              onClick={() => {
                onDelete?.(message);
                onClose?.();
              }}
              className={clsx(styles.actionBtn, styles.danger)}
            >
              <FiTrash2 />
              <span>Supprimer</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
