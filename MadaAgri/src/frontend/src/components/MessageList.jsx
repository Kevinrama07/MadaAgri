import { useEffect, useRef, useCallback } from 'react';
import MessageBubble from './MessageBubble';
import '../styles/MessagerieStyles.css';

export default function MessageList({ messages, loading, currentUserId }) {
  const endRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  if (loading) {
    return (
      <div className="messages-container">
        <div className="messages-loading">
          <div className="loader"></div>
          <p>Chargement des messages...</p>
        </div>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="messages-container">
        <div className="messages-empty">
          <i className="fas fa-comments messages-empty-icon"></i>
          <p>Aucun message encore</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--mg-text-muted)' }}>
            Démarrez la conversation !
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-container">
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          currentUserId={currentUserId}
        />
      ))}
      <div ref={endRef} />
    </div>
  );
}
