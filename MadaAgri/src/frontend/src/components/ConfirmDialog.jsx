import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { FiAlertTriangle, FiX } from 'react-icons/fi';
import styles from '../styles/ui/ConfirmDialog.module.css';

export default function ConfirmDialog({ 
  title = 'Confirmation',
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  danger = false,
  onConfirm,
  onCancel
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onCancel?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  return (
    <div className={clsx(styles.overlay)} onClick={onCancel}>
      <div 
        ref={dialogRef}
        className={clsx(styles.dialog)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={clsx(styles.header)}>
          {danger && (
            <div className={clsx(styles.iconWrapper, styles.danger)}>
              <FiAlertTriangle size={24} />
            </div>
          )}
          <h3 className={clsx(styles.title)}>{title}</h3>
          <button onClick={onCancel} className={clsx(styles.closeBtn)}>
            <FiX />
          </button>
        </div>

        <div className={clsx(styles.content)}>
          <p>{message}</p>
        </div>

        <div className={clsx(styles.actions)}>
          <button
            onClick={onCancel}
            className={clsx(styles.btn, styles.btnCancel)}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={clsx(styles.btn, styles.btnConfirm, {
              [styles.btnDanger]: danger
            })}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
