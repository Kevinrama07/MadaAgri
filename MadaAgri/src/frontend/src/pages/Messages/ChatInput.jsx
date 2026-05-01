import { useRef, useState } from 'react';
import clsx from 'clsx';
import { FiPaperclip, FiSend, FiSmile } from 'react-icons/fi';
import styles from '../../styles/Messages/MessagerieStyles.module.css';

export default function ChatInput({ onSendMessage, disabled = false, onAttachFile = null }) {
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSend = (e) => {
    e?.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
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
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files?.length > 0 && onAttachFile) {
      onAttachFile(files[0]);
    }
  };

  const canSend = message.trim() && !disabled;

  return (
    <form onSubmit={handleSend} className={clsx(styles['chat-input-wrapper'])}>
      <div className={clsx(styles['chat-input-actions'])}>
        <button
          type="button"
          className={clsx(styles['chat-action-icon-btn'], styles['chat-attach-btn'])}
          title="Joindre un fichier"
          disabled={disabled}
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
          aria-hidden="true"
        />
        <div className={clsx(styles['chat-input-field-wrapper'], { [styles['focused']]: isFocused })}>
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Écrivez un message..."
            className={clsx(styles['chat-input-field'])}
            disabled={disabled}
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
