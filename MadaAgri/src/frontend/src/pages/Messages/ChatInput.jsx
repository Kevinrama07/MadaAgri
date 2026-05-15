import { useRef, useState } from 'react';
import clsx from 'clsx';
import { FiPaperclip, FiSend, FiSmile } from 'react-icons/fi';
import styles from '../../styles/Messages/MessagerieStyles.module.css';

export default function ChatInput({ onSendMessage, disabled = false, onAttachFile = null, onTyping = null }) {
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);

  const handleSend = (e) => {
    e?.preventDefault();
    if ((message.trim() || attachedFile) && !disabled && !uploading) {
      onSendMessage(message, attachedFile);
      setMessage('');
      setAttachedFile(null);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
    
    // Envoyer notification de typing
    if (onTyping) {
      onTyping();
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (files?.length > 0) {
      const file = files[0];
      
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Fichier trop volumineux. Taille max: 5MB');
        return;
      }
      
      // Vérifier le type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Format non supporté. Formats acceptés: JPG, PNG, GIF, WEBP');
        return;
      }
      
      setUploading(true);
      try {
        // Upload via API
        const { dataApi } = await import('../../lib/api');
        const imageUrl = await dataApi.uploadImage(file);
        
        setAttachedFile({
          url: imageUrl,
          type: 'image',
          name: file.name,
          size: file.size
        });
        
        console.log('[ChatInput] Fichier uploadé:', imageUrl);
      } catch (error) {
        console.error('[ChatInput] Erreur upload:', error);
        alert('Erreur lors de l\'upload du fichier');
      } finally {
        setUploading(false);
      }
    }
  };

  const canSend = (message.trim() || attachedFile) && !disabled && !uploading;

  return (
    <form onSubmit={handleSend} className={clsx(styles['chat-input-wrapper'])}>
      <div className={clsx(styles['chat-input-actions'])}>
        <button
          type="button"
          className={clsx(styles['chat-action-icon-btn'], styles['chat-attach-btn'])}
          title="Joindre un fichier"
          disabled={disabled || uploading}
          onClick={handleAttachClick}
          aria-label="Joindre un fichier"
        >
          <FiPaperclip />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          aria-hidden="true"
        />
        <div className={clsx(styles['chat-input-field-wrapper'], { [styles['focused']]: isFocused })}>
          {attachedFile && (
            <div className={clsx(styles['attached-file-preview'])}>
              <img src={attachedFile.url} alt="Aperçu" className={clsx(styles['preview-image'])} />
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                className={clsx(styles['remove-attachment'])}
                title="Supprimer"
              >
                ×
              </button>
            </div>
          )}
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={uploading ? "Upload en cours..." : "Écrivez un message..."}
            className={clsx(styles['chat-input-field'])}
            disabled={disabled || uploading}
            rows="1"
            aria-label="Champ de message"
          />
        </div>
        <button
          type="submit"
          className={clsx(styles['chat-action-icon-btn'], styles['chat-send-btn'], { [styles['active']]: canSend, [styles['inactive']]: !canSend })}
          title="Envoyer (Entrée)"
          disabled={!canSend}
          aria-label="Envoyer le message"
        >
          <FiSend />
        </button>
      </div>
    </form>
  );
}
