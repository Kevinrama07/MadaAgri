import { useState } from 'react';
import clsx from 'clsx';
import { FiCheck, FiCheckCircle, FiMoreVertical, FiEdit2, FiCopy, FiTrash2, FiX, FiSave, FiClock, FiAlertCircle, FiSmile } from 'react-icons/fi';
import styles from '../../styles/Messages/MessagerieStyles.module.css';

export default function MessageBubble({ message, currentUserId, onDelete, onEdit, onCopy, onReaction }) {
  const isSent = message.sender_id === currentUserId;
  const hasAttachment = message.attachment_url && message.attachment_type;
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = async () => {
    setShowMenu(false);
    if (window.confirm('Supprimer ce message ?')) {
      try {
        await onDelete(message.id);
      } catch (error) {
        console.error('Erreur suppression:', error);
        alert('Erreur lors de la suppression du message');
      }
    }
  };

  const handleEdit = () => {
    setShowMenu(false);
    setIsEditing(true);
    setEditedContent(message.content || '');
  };

  const handleSaveEdit = async () => {
    if (!editedContent.trim() || editedContent === message.content) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onEdit(message.id, editedContent.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Erreur édition:', error);
      alert('Erreur lors de l\'édition du message');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(message.content || '');
  };

  const handleCopy = () => {
    setShowMenu(false);
    if (message.content) {
      navigator.clipboard.writeText(message.content)
        .then(() => {
          console.log('Message copié');
        })
        .catch(err => {
          console.error('Erreur copie:', err);
        });
    }
  };

  const handleReaction = async (emoji) => {
    setShowReactionPicker(false);
    if (onReaction) {
      try {
        await onReaction(message.id, emoji);
      } catch (error) {
        console.error('Erreur réaction:', error);
      }
    }
  };

  const handleRemoveReaction = async (emoji) => {
    if (onReaction) {
      try {
        await onReaction(message.id, emoji, true);
      } catch (error) {
        console.error('Erreur suppression réaction:', error);
      }
    }
  };

  return (
    <div className={clsx(styles['message-row'], { [styles['message-own']]: isSent })}>
      <div className={clsx(styles['message-bubble'], { [styles['bubble-own']]: isSent })}>
        {hasAttachment && message.attachment_type === 'image' && (
          <div className={clsx(styles['message-attachment'])}>
            <img 
              src={message.attachment_url} 
              alt="Pièce jointe" 
              className={clsx(styles['attachment-image'])}
              onClick={() => window.open(message.attachment_url, '_blank')}
            />
          </div>
        )}
        {isEditing ? (
          <div className={clsx(styles['message-edit-container'])}>
            <textarea
              className={clsx(styles['message-edit-input'])}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              disabled={isSaving}
              autoFocus
              rows={3}
            />
            <div className={clsx(styles['message-edit-actions'])}>
              <button
                className={clsx(styles['message-edit-btn'], styles['save'])}
                onClick={handleSaveEdit}
                disabled={isSaving || !editedContent.trim()}
                title="Enregistrer"
              >
                <FiSave size={14} />
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              <button
                className={clsx(styles['message-edit-btn'], styles['cancel'])}
                onClick={handleCancelEdit}
                disabled={isSaving}
                title="Annuler"
              >
                <FiX size={14} />
                Annuler
              </button>
            </div>
          </div>
        ) : (
          message.content && (
            <div className={clsx(styles['message-content'])}>
              {message.content}
              {message.edited_at && (
                <span className={clsx(styles['message-edited'])}> (édité)</span>
              )}
            </div>
          )
        )}
        <div className={clsx(styles['message-meta'])}>
          <span className={clsx(styles['message-time'])}>
            {formatTime(message.created_at)}
          </span>
          {isSent && (
            <span className={clsx(styles['message-status'])}>
              {message.status === 'queued' ? (
                <FiClock size={14} title="En attente d'envoi" />
              ) : message.status === 'failed' ? (
                <FiAlertCircle size={14} title="Échec d'envoi" className={clsx(styles['status-failed'])} />
              ) : message.status === 'sending' ? (
                <FiClock size={14} title="Envoi en cours..." className={clsx(styles['status-sending'])} />
              ) : message.is_read || message.read ? (
                <span className={clsx(styles['read-receipt'])} title="Lu">✓✓</span>
              ) : (
                <FiCheck size={14} title="Envoyé" />
              )}
            </span>
          )}
        </div>
        
        {/* Réactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className={clsx(styles['message-reactions'])}>
            {message.reactions.map((reaction, idx) => (
              <button
                key={idx}
                className={clsx(styles['reaction-badge'])}
                onClick={() => handleRemoveReaction(reaction.emoji)}
                title={reaction.users}
              >
                <span className={clsx(styles['reaction-emoji'])}>{reaction.emoji}</span>
                <span className={clsx(styles['reaction-count'])}>{reaction.count}</span>
              </button>
            ))}
            <button
              className={clsx(styles['reaction-add-btn'])}
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              title="Ajouter une réaction"
            >
              <FiSmile size={14} />
            </button>
          </div>
        )}
        
        {/* Reaction Picker */}
        {showReactionPicker && (
          <>
            <div 
              className={clsx(styles['reaction-picker-backdrop'])} 
              onClick={() => setShowReactionPicker(false)}
            />
            <div className={clsx(styles['reaction-picker'])}>
              {quickReactions.map((emoji, idx) => (
                <button
                  key={idx}
                  className={clsx(styles['reaction-picker-emoji'])}
                  onClick={() => handleReaction(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}
        
        {/* Menu 3 points */}
        {!isEditing && (
          <div className={clsx(styles['message-menu-wrapper'])}>
            <p
              className={clsx(styles['message-menu-btn'])}
              onClick={() => setShowMenu(!showMenu)}
              title="Options"
            >
              ⋮ 
            </p>
            
            {showMenu && (
              <>
                <div 
                  className={clsx(styles['message-menu-backdrop'])} 
                  onClick={() => setShowMenu(false)}
                />
                <div className={clsx(styles['message-menu-dropdown'])}>
                  {isSent && message.content && (
                    <button
                      className={clsx(styles['message-menu-item'])}
                      onClick={handleEdit}
                    >
                      <FiEdit2 size={14} />
                      <span>Modifier</span>
                    </button>
                  )}
                  {message.content && (
                    <button
                      className={clsx(styles['message-menu-item'])}
                      onClick={handleCopy}
                    >
                      <FiCopy size={14} />
                      <span>Copier</span>
                    </button>
                  )}
                  {isSent && (
                    <button
                      className={clsx(styles['message-menu-item'], styles['danger'])}
                      onClick={handleDelete}
                    >
                      <FiTrash2 size={14} />
                      <span>Supprimer</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
