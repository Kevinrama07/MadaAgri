import { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { FiEdit2, FiX } from 'react-icons/fi';
import styles from '../styles/ui/EditMessageDialog.module.css';

export default function EditMessageDialog({ 
  message,
  onSave,
  onCancel
}) {
  const [content, setContent] = useState(message?.content || '');
  const textareaRef = useRef(null);

  useEffect(() => {
    // Focus et sélectionner le texte
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onCancel?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim() && content.trim() !== message.content) {
      onSave?.(content.trim());
    } else {
      onCancel?.();
    }
  };

  return (
    <div className={clsx(styles.overlay)} onClick={onCancel}>
      <div 
        className={clsx(styles.dialog)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={clsx(styles.header)}>
          <div className={clsx(styles.iconWrapper)}>
            <FiEdit2 size={20} />
          </div>
          <h3 className={clsx(styles.title)}>Modifier le message</h3>
          <button onClick={onCancel} className={clsx(styles.closeBtn)}>
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={clsx(styles.content)}>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={clsx(styles.textarea)}
              rows={4}
              placeholder="Entrez votre message..."
            />
          </div>

          <div className={clsx(styles.actions)}>
            <button
              type="button"
              onClick={onCancel}
              className={clsx(styles.btn, styles.btnCancel)}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!content.trim() || content.trim() === message.content}
              className={clsx(styles.btn, styles.btnSave)}
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
