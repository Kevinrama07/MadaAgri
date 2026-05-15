import { useState, useEffect, useRef } from 'react';
import { FiPhone, FiPhoneOff, FiMic, FiMicOff, FiVolume2, FiVolumeX } from 'react-icons/fi';
import voiceCallService from '../services/voiceCallService';
import styles from '../styles/ui/VoiceCallModal.module.css';

export default function VoiceCallModal({
  isOpen,
  callData,
  onClose,
  currentUser
}) {
  const [callState, setCallState] = useState('idle'); // idle, calling, ringing, connected, ended
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);

  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Écouter les événements du service
    voiceCallService.on('call:initiated', handleCallInitiated);
    voiceCallService.on('call:accepted', handleCallAccepted);
    voiceCallService.on('call:declined', handleCallDeclined);
    voiceCallService.on('call:connected', handleCallConnected);
    voiceCallService.on('call:ended', handleCallEnded);
    voiceCallService.on('call:error', handleCallError);
    voiceCallService.on('stream:remote', handleRemoteStream);

    return () => {
      voiceCallService.off('call:initiated', handleCallInitiated);
      voiceCallService.off('call:accepted', handleCallAccepted);
      voiceCallService.off('call:declined', handleCallDeclined);
      voiceCallService.off('call:connected', handleCallConnected);
      voiceCallService.off('call:ended', handleCallEnded);
      voiceCallService.off('call:error', handleCallError);
      voiceCallService.off('stream:remote', handleRemoteStream);
    };
  }, [isOpen]);

  useEffect(() => {
    if (callState === 'connected') {
      // Démarrer le timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      // Arrêter le timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callState]);

  const handleCallInitiated = () => {
    setCallState('calling');
  };

  const handleCallAccepted = async () => {
    setCallState('connecting');
    
    // Attacher le flux local
    const localStream = voiceCallService.getLocalStream();
    if (localAudioRef.current && localStream) {
      localAudioRef.current.srcObject = localStream;
    }
  };

  const handleCallDeclined = ({ reason }) => {
    setCallState('ended');
    setError(reason === 'busy' ? 'Ligne occupée' : 'Appel refusé');
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const handleCallConnected = () => {
    setCallState('connected');
    setDuration(0);
  };

  const handleCallEnded = ({ reason }) => {
    setCallState('ended');
    if (reason === 'disconnected') {
      setError('Connexion perdue');
    }
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const handleCallError = ({ message }) => {
    setError(message);
    setCallState('ended');
    setTimeout(() => {
      onClose();
    }, 3000);
  };

  const handleRemoteStream = (remoteStream) => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  };

  const handleAccept = async () => {
    try {
      await voiceCallService.acceptCall(callData.callId);
      const localStream = voiceCallService.getLocalStream();
      if (localAudioRef.current && localStream) {
        localAudioRef.current.srcObject = localStream;
      }
    } catch (error) {
      setError('Erreur lors de l\'acceptation de l\'appel');
    }
  };

  const handleDecline = () => {
    voiceCallService.declineCall(callData.callId);
    onClose();
  };

  const handleEnd = () => {
    voiceCallService.endCall();
    onClose();
  };

  const handleToggleMute = () => {
    const muted = voiceCallService.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleSpeaker = () => {
    setIsSpeaker(!isSpeaker);
    // TODO: Implémenter le changement de sortie audio
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  const isIncoming = callData?.type === 'incoming';
  const isOutgoing = callData?.type === 'outgoing';
  const otherUser = isIncoming ? callData?.caller : callData?.receiver;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Avatar */}
        <div className={styles.avatar}>
          {otherUser?.profile_image_url ? (
            <img src={otherUser.profile_image_url} alt={otherUser.display_name} />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {otherUser?.display_name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </div>

        {/* Nom */}
        <h2 className={styles.name}>{otherUser?.display_name || 'Utilisateur'}</h2>

        {/* État */}
        <div className={styles.status}>
          {callState === 'calling' && 'Appel en cours...'}
          {callState === 'ringing' && 'Sonnerie...'}
          {callState === 'connecting' && 'Connexion...'}
          {callState === 'connected' && formatDuration(duration)}
          {callState === 'ended' && (error || 'Appel terminé')}
        </div>

        {/* Erreur */}
        {error && callState !== 'ended' && (
          <div className={styles.error}>{error}</div>
        )}

        {/* Contrôles */}
        <div className={styles.controls}>
          {/* Appel entrant */}
          {isIncoming && callState === 'ringing' && (
            <>
              <button 
                className={`${styles.button} ${styles.accept}`}
                onClick={handleAccept}
              >
                <FiPhone size={24} />
              </button>
              <button 
                className={`${styles.button} ${styles.decline}`}
                onClick={handleDecline}
              >
                <FiPhoneOff size={24} />
              </button>
            </>
          )}

          {/* Appel en cours */}
          {callState === 'connected' && (
            <>
              <button 
                className={`${styles.button} ${isMuted ? styles.active : ''}`}
                onClick={handleToggleMute}
                title={isMuted ? 'Activer le micro' : 'Couper le micro'}
              >
                {isMuted ? <FiMicOff size={24} /> : <FiMic size={24} />}
              </button>

              <button 
                className={`${styles.button} ${styles.end}`}
                onClick={handleEnd}
                title="Raccrocher"
              >
                <FiPhoneOff size={24} />
              </button>

              <button 
                className={`${styles.button} ${isSpeaker ? styles.active : ''}`}
                onClick={handleToggleSpeaker}
                title={isSpeaker ? 'Désactiver le haut-parleur' : 'Activer le haut-parleur'}
              >
                {isSpeaker ? <FiVolume2 size={24} /> : <FiVolumeX size={24} />}
              </button>
            </>
          )}

          {/* Appel sortant */}
          {isOutgoing && (callState === 'calling' || callState === 'connecting') && (
            <button 
              className={`${styles.button} ${styles.decline}`}
              onClick={handleEnd}
            >
              <FiPhoneOff size={24} />
            </button>
          )}
        </div>

        {/* Audio elements */}
        <audio ref={localAudioRef} autoPlay muted />
        <audio ref={remoteAudioRef} autoPlay />
      </div>
    </div>
  );
}
