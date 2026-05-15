import React, { useState } from 'react';
import clsx from 'clsx';
import { FiUsers, FiCheck, FiX, FiLoader } from 'react-icons/fi';
import socketService from '../../services/socketService';
import styles from './CollaborationInvite.module.css';

export default function CollaborationInvite({
  projectId,
  projectName,
  userId,
  userName,
  onInviteSent,
}) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSendInvite = async (e) => {
    e.preventDefault();

    if (!userId || !projectId) {
      setError('Données manquantes');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      // Envoyer l'invitation via WebSocket
      socketService.sendCollaborationInvite(
        userId,
        projectId,
        message || `Voulez-vous collaborer sur "${projectName}" ?`
      );

      setInviteSent(true);
      setMessage('');

      if (onInviteSent) {
        onInviteSent({ userId, projectId });
      }

      // Réinitialiser après 3 secondes
      setTimeout(() => {
        setInviteSent(false);
      }, 3000);
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'envoi de l\'invitation');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={clsx(styles['invite-container'])}>
      <div className={clsx(styles['invite-header'])}>
        <FiUsers className={clsx(styles['icon'])} />
        <h3>Inviter à collaborer</h3>
      </div>

      {inviteSent && (
        <div className={clsx(styles['success-message'])}>
          <FiCheck size={18} />
          <span>Invitation envoyée à {userName} !</span>
        </div>
      )}

      {error && (
        <div className={clsx(styles['error-message'])}>
          <FiX size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSendInvite} className={clsx(styles['invite-form'])}>
        <div className={clsx(styles['form-group'])}>
          <label>Message personnalisé (optionnel)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Inviter ${userName} à collaborer sur "${projectName}"`}
            disabled={isSending}
            className={clsx(styles['textarea'])}
            rows={3}
          />
          <p className={clsx(styles['form-hint'])}>
            Message par défaut: "Voulez-vous collaborer sur {projectName} ?"
          </p>
        </div>

        <button
          type="submit"
          disabled={isSending || inviteSent}
          className={clsx(styles['submit-button'], {
            [styles['loading']]: isSending,
            [styles['sent']]: inviteSent,
          })}
        >
          {isSending ? (
            <>
              <FiLoader size={16} className={clsx(styles['spinner'])} />
              Envoi en cours...
            </>
          ) : inviteSent ? (
            <>
              <FiCheck size={16} />
              Invitation envoyée
            </>
          ) : (
            <>
              <FiUsers size={16} />
              Inviter {userName}
            </>
          )}
        </button>
      </form>

      <div className={clsx(styles['invite-info'])}>
        <p>
          <strong>{userName}</strong> recevra l'invitation en temps réel et pourra
          accepter ou refuser immédiatement.
        </p>
      </div>
    </div>
  );
}
