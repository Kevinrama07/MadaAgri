import { useEffect, useRef, useCallback } from 'react';
import clsx from 'clsx';
import { FiMessageCircle } from 'react-icons/fi';
import ModernMessageBubble from './ModernMessageBubble';
import styles from '../../styles/Messages/ModernMessagerieStyles.module.css';

export default function ModernMessageList({ messages, loading, currentUserId, isTyping, typingUser, onEditMessage, onDeleteMessage }) {
  const endRef = useRef(null);
  const containerRef = useRef(null);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, isTyping, scrollToBottom]);

  // Scroll instantané au premier chargement
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom('auto');
    }
  }, []);

  if (!messages || messages.length === 0) {
    return (
      <div className={clsx(styles['messages-container'])} ref={containerRef}>
        <div className={clsx(styles['messages-empty'])}>
          <FiMessageCircle className={clsx(styles['empty-chat-icon'])} />
          <p className={clsx(styles['empty-chat-text'])}>
            Aucun message
          </p>
          <span className={clsx(styles['empty-hint'])}>
            Envoyez un message pour démarrer la conversation
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(styles['messages-container'])} ref={containerRef}>
      <div className={clsx(styles['messages-list'])}>
        {messages.map((msg, index) => (
          <ModernMessageBubble
            key={msg.id || index}
            message={msg}
            currentUserId={currentUserId}
            onEdit={onEditMessage}
            onDelete={onDeleteMessage}
          />
        ))}
        
        {/* Indicateur de saisie */}
        {isTyping && (
          <div className={clsx(styles['typing-indicator-wrapper'])}>
            <div className={clsx(styles['typing-indicator'])}>
              <div className={clsx(styles['typing-avatar'])}>
                {typingUser?.charAt(0).toUpperCase()}
              </div>
              <div className={clsx(styles['typing-bubble'])}>
                <div className={clsx(styles['typing-dots'])}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={endRef} />
      </div>
    </div>
  );
}
