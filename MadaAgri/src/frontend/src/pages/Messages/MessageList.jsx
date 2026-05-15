import { useEffect, useRef, useCallback, useState } from 'react';
import clsx from 'clsx';
import { FiMessageCircle } from 'react-icons/fi';
import MessageBubble from './MessageBubble';
import styles from '../../styles/Messages/MessagerieStyles.module.css';

export default function MessageList({ messages, loading, currentUserId, isTyping = false, typingUser = null, onDeleteMessage, onEditMessage, onCopyMessage, onReaction, onLoadMore, hasMore = false, loadingMore = false }) {
  const endRef = useRef(null);
  const containerRef = useRef(null);
  const [userScrolled, setUserScrolled] = useState(false);
  const previousScrollHeight = useRef(0);

  const scrollToBottom = useCallback(() => {
    if (!userScrolled) {
      setTimeout(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 0);
    }
  }, [userScrolled]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Gérer le scroll pour détecter quand charger plus de messages
  const handleScroll = useCallback((e) => {
    const container = e.target;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    // Détecter si l'utilisateur a scrollé manuellement
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setUserScrolled(!isAtBottom);

    // Charger plus de messages si on est en haut (scroll vers le haut)
    if (scrollTop < 100 && hasMore && !loadingMore && onLoadMore) {
      // Sauvegarder la hauteur actuelle pour restaurer la position après chargement
      previousScrollHeight.current = scrollHeight;
      onLoadMore();
    }
  }, [hasMore, loadingMore, onLoadMore]);

  // Restaurer la position de scroll après chargement de nouveaux messages
  useEffect(() => {
    if (containerRef.current && previousScrollHeight.current > 0) {
      const newScrollHeight = containerRef.current.scrollHeight;
      const scrollDiff = newScrollHeight - previousScrollHeight.current;
      if (scrollDiff > 0) {
        containerRef.current.scrollTop = scrollDiff;
        previousScrollHeight.current = 0;
      }
    }
  }, [messages.length]);

  if (!messages || messages.length === 0) {
    return (
      <div className={clsx(styles['messages-container'])}>
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

  console.log('[MessageList] Rendering messages:', messages.length, 'currentUserId:', currentUserId);
  return (
    <div 
      ref={containerRef}
      className={clsx(styles['messages-container'])}
      onScroll={handleScroll}
    >
      <div className={clsx(styles['messages-list'])}>
        {loadingMore && (
          <div className={clsx(styles['loading-more'])}>
            <div className={clsx(styles['loader'])} />
            <span>Chargement des messages...</span>
          </div>
        )}
        {!hasMore && messages.length > 0 && (
          <div className={clsx(styles['no-more-messages'])}>
            <span>— Début de la conversation —</span>
          </div>
        )}
        {messages.map((msg, index) => (
          <MessageBubble
            key={msg.id || index}
            message={msg}
            currentUserId={currentUserId}
            onDelete={onDeleteMessage}
            onEdit={onEditMessage}
            onCopy={onCopyMessage}
            onReaction={onReaction}
          />
        ))}
        {isTyping && (
          <div className={clsx(styles['message-row'])}>
            <div className={clsx(styles['message-bubble'], styles['typing-bubble'])}>
              <div className={clsx(styles['typing-text'])}>
                {typingUser ? `${typingUser} est en train d'écrire` : 'En train d\'écrire'}
              </div>
              <div className={clsx(styles['typing-indicator'])}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
