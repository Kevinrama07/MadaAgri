import { useEffect, useRef, useCallback } from 'react';
import clsx from 'clsx';
import { FiMessageCircle } from 'react-icons/fi';
import MessageBubble from './MessageBubble';
import styles from '../../styles/Messages/MessagerieStyles.module.css';

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

  if (!messages || messages.length === 0) {
    return (
      <div className={clsx(styles['messages-container'])}>
        <div className={clsx(styles['messages-empty'])}>
          <FiMessageCircle className={clsx(styles['empty-chat-icon'])} />
            <p className={clsx(styles['empty-chat-text'])}>
              Démarrez la conversation
            </p>
        </div>
      </div>
    );
  }

  console.log('[MessageList] Rendering messages:', messages.length, 'currentUserId:', currentUserId);
  return (
    <div className={clsx(styles['messages-container'])}>
      {messages.map((msg, index) => (
        <MessageBubble
          key={msg.id || index}
          message={msg}
          currentUserId={currentUserId}
        />
      ))}
      <div ref={endRef} />
    </div>
  );
}
