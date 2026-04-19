
import { useRef, useState } from 'react';
import '../styles/MessagerieStyles.css';

export default function ChatInput({ onSendMessage, disabled = false }) {
  const inputRef = useRef(null);
  const [message, setMessage] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
  };

  return (
    <form onSubmit={handleSend} className="chat-input-wrapper">
      <div className="chat-input-actions">
        <button
          type="button"
          className="chat-attach-btn"
          title="Joindre un fichier"
          disabled={disabled}
        >
          <i className="fas fa-paperclip"></i>
        </button>
      </div>

      <textarea
        ref={inputRef}
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Écrivez un message..."
        className="chat-input-field"
        disabled={disabled}
        rows="1"
      />

      <button
        type="submit"
        className="chat-send-btn"
        title="Envoyer"
        disabled={disabled || !message.trim()}
      >
        <i className="fas fa-paper-plane"></i>
      </button>
    </form>
  );
}
