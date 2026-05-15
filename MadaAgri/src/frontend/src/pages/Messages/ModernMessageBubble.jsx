import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { FiCheck, FiCheckCircle, FiMoreVertical } from 'react-icons/fi';
import MessageContextMenu from '../../components/MessageContextMenu';
import EmojiPicker from '../../components/EmojiPicker';
import { dataApi } from '../../lib/api';
import styles from '../../styles/Messages/ModernMessagerieStyles.module.css';

export default function ModernMessageBubble({ message, currentUserId, onEdit, onDelete }) {
  const isOwn = message.sender_id === currentUserId;
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [reactions, setReactions] = useState([]);
  const [loadingReactions, setLoadingReactions] = useState(false);
  
  useEffect(() => {
    loadReactions();
  }, [message.id]);

  const loadReactions = async () => {
    try {
      setLoadingReactions(true);
      const data = await dataApi.getReactions(message.id);
      setReactions(data.reactions || []);
    } catch (error) {
      console.error('Erreur chargement réactions:', error);
    } finally {
      setLoadingReactions(false);
    }
  };
  
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  const handleReact = async (emoji) => {
    try {
      // Vérifier si l'utilisateur a déjà réagi avec cet emoji
      const userReaction = reactions.find(r => 
        r.emoji === emoji && r.user_ids?.split(',').includes(String(currentUserId))
      );

      if (userReaction) {
        await dataApi.removeReaction(message.id, emoji);
      } else {
        await dataApi.addReaction(message.id, emoji);
      }
      
      await loadReactions();
    } catch (error) {
      console.error('Erreur réaction:', error);
    }
  };

  const handleShowEmojiPicker = () => {
    setShowMenu(false);
    setShowEmojiPicker(true);
  };

  return (
    <div className={clsx(styles['message-row'], { [styles['message-own']]: isOwn })}>
      <div 
        className={clsx(styles['message-bubble'], { [styles['bubble-own']]: isOwn })}
        onContextMenu={handleContextMenu}
      >
        <button
          className={clsx(styles['message-menu-btn'])}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setMenuPosition({ x: rect.left, y: rect.bottom + 5 });
            setShowMenu(true);
          }}
          aria-label="Options du message"
        >
          <FiMoreVertical size={16} />
        </button>

        <div className={clsx(styles['message-content'])}>
          {message.content}
        </div>
        
        {message.edited_at && (
          <div className={clsx(styles['message-edited'])}>
            modifié
          </div>
        )}

        {reactions.length > 0 && (
          <div className={clsx(styles['message-reactions'])}>
            {reactions.map((reaction, idx) => (
              <button
                key={idx}
                className={clsx(styles['reaction-item'], {
                  [styles['reaction-active']]: reaction.user_ids?.split(',').includes(String(currentUserId))
                })}
                onClick={() => handleReact(reaction.emoji)}
                title={reaction.users}
              >
                <span>{reaction.emoji}</span>
                <span className={clsx(styles['reaction-count'])}>{reaction.count}</span>
              </button>
            ))}
          </div>
        )}

        <div className={clsx(styles['message-meta'])}>
          <span className={clsx(styles['message-time'])}>
            {formatTime(message.created_at)}
          </span>
          {isOwn && (
            <span className={clsx(styles['message-status'])}>
              {message.read || message.is_read ? (
                <FiCheckCircle size={14} />
              ) : (
                <FiCheck size={14} />
              )}
            </span>
          )}
        </div>
      </div>

      {showMenu && (
        <MessageContextMenu
          message={message}
          isOwn={isOwn}
          position={menuPosition}
          onEdit={onEdit}
          onDelete={onDelete}
          onReact={handleShowEmojiPicker}
          onClose={() => setShowMenu(false)}
        />
      )}

      {showEmojiPicker && (
        <div style={{ position: 'relative' }}>
          <EmojiPicker
            onSelect={handleReact}
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>
      )}
    </div>
  );
}
