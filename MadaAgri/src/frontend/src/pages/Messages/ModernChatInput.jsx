import { useRef, useState, useEffect } from 'react';
import clsx from 'clsx';
import { FiPaperclip, FiSend, FiSmile, FiX } from 'react-icons/fi';
import EmojiPicker from '../../components/EmojiPicker';
import { dataApi } from '../../lib/api';
import styles from '../../styles/Messages/ModernMessagerieStyles.module.css';

export default function ModernChatInput({ onSendMessage, onTyping, disabled = false }) {
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleSend = async (e) => {
    e?.preventDefault();
    if ((message.trim() || selectedFile) && !disabled && !uploading) {
      let attachmentUrl = null;
      let attachmentType = null;

      // Upload du fichier si présent
      if (selectedFile) {
        try {
          setUploading(true);
          attachmentUrl = await dataApi.uploadImage(selectedFile);
          attachmentType = selectedFile.type.startsWith('image/') ? 'image' : 'document';
        } catch (error) {
          console.error('Erreur upload:', error);
          alert('Erreur lors de l\'envoi du fichier');
          setUploading(false);
          return;
        } finally {
          setUploading(false);
        }
      }

      onSendMessage(message, attachmentUrl, attachmentType);
      setMessage('');
      setSelectedFile(null);
      inputRef.current?.focus();
      
      // Réinitialiser la hauteur du textarea
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
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
    
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    
    // Émettre l'événement de saisie
    if (onTyping && e.target.value.trim()) {
      // Debounce: émettre seulement toutes les 2 secondes
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      onTyping();
      
      typingTimeoutRef.current = setTimeout(() => {
        // Arrêter l'indicateur après 2 secondes d'inactivité
      }, 2000);
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Le fichier est trop volumineux (max 10MB)');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEmojiSelect = (emoji) => {
    const newMessage = message + emoji;
    setMessage(newMessage);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const canSend = (message.trim() || selectedFile) && !disabled && !uploading;

  return (
    <form onSubmit={handleSend} className={clsx(styles['chat-input-wrapper'])}>
      {selectedFile && (
        <div className={clsx(styles['file-preview'])}>
          <div className={clsx(styles['file-info'])}>
            <FiPaperclip />
            <span>{selectedFile.name}</span>
            <button
              type="button"
              onClick={handleRemoveFile}
              className={clsx(styles['file-remove-btn'])}
            >
              <FiX />
            </button>
          </div>
        </div>
      )}

      <div className={clsx(styles['chat-input-container'], { [styles['focused']]: isFocused })}>
        <button
          type="button"
          className={clsx(styles['chat-action-icon-btn'])}
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
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          accept="image/*,application/pdf,.doc,.docx"
          aria-hidden="true"
        />
        
        <div className={clsx(styles['chat-input-field-wrapper'])}>
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Écrivez un message..."
            className={clsx(styles['chat-input-field'])}
            disabled={disabled || uploading}
            rows="1"
            aria-label="Champ de message"
          />
        </div>
        
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className={clsx(styles['chat-action-icon-btn'])}
            title="Emoji"
            disabled={disabled || uploading}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            aria-label="Ajouter un emoji"
          >
            <FiSmile />
          </button>
          
          {showEmojiPicker && (
            <EmojiPicker
              onSelect={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
            />
          )}
        </div>
        
        <button
          type="submit"
          className={clsx(styles['chat-send-btn'], { 
            [styles['active']]: canSend,
            [styles['disabled']]: !canSend 
          })}
          title="Envoyer (Entrée)"
          disabled={!canSend}
          aria-label="Envoyer le message"
        >
          <FiSend />
        </button>
      </div>
      
      {(disabled || uploading) && (
        <div className={clsx(styles['input-status'])}>
          {uploading ? '⏳ Envoi du fichier...' : '⚠️ Connexion en cours...'}
        </div>
      )}
    </form>
  );
}
