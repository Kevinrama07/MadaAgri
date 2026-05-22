import { useRef, useState, useCallback, useEffect } from 'react';
import clsx from 'clsx';
import { FiPaperclip, FiSend, FiMic, FiX } from 'react-icons/fi';
import VoiceRecorder from './VoiceRecorder';
import styles from './MessagerieStyles.module.css';

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function ChatInput({ onSendMessage, disabled = false, onAttachFile = null, onTyping = null }) {
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [pendingVoice, setPendingVoice] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimerRef = useRef(null);

  const handleRecordingStart = useCallback(() => {
    setIsRecordingVoice(true);
    setRecordingDuration(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 100);
    }, 100);
  }, []);

  const handleRecordingStop = useCallback((blob, durationMs, mimeType) => {
    setIsRecordingVoice(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (blob && durationMs > 500) {
      setPendingVoice({ blob, durationMs, mimeType });
    }
    setRecordingDuration(0);
  }, []);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (disabled || uploading) return;

    if (pendingVoice) {
      const voice = pendingVoice;
      setPendingVoice(null);

      // Upload voice to Cloudinary then send
      try {
        const { getToken, getApiBaseUrl } = await import('../../lib/api');
        const token = getToken();
        const baseUrl = getApiBaseUrl();

        const formData = new FormData();
        const extension = voice.mimeType?.includes('webm') ? 'webm' : 'mp4';
        formData.append('audio', voice.blob, `voice-${Date.now()}.${extension}`);

        const response = await fetch(`${baseUrl}/api/upload/voice`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });

        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Upload failed');

        onSendMessage('', null, {
          type: 'voice',
          audio_url: body.audioUrl,
          audio_duration: body.duration || Math.round(voice.durationMs / 1000),
          public_id: body.public_id,
        });
      } catch (error) {
        console.error('[ChatInput] Erreur envoi vocal:', error);
        alert('Erreur lors de l\'envoi du message vocal');
      }
      return;
    }

    if (message.trim() || attachedFile) {
      onSendMessage(message, attachedFile);
      setMessage('');
      setAttachedFile(null);
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
    if (onTyping) onTyping();
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (files?.length > 0) {
      const file = files[0];
      if (file.size > 5 * 1024 * 1024) { alert('Fichier trop volumineux. Taille max: 5MB'); return; }
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) { alert('Format non supporté. Formats acceptés: JPG, PNG, GIF, WEBP'); return; }
      setUploading(true);
      try {
        const { dataApi } = await import('../../lib/api');
        const imageUrl = await dataApi.uploadImage(file);
        setAttachedFile({ url: imageUrl, type: 'image', name: file.name, size: file.size });
      } catch (error) {
        console.error('[ChatInput] Erreur upload:', error);
        alert('Erreur lors de l\'upload du fichier');
      } finally { setUploading(false); }
    }
  };

  const canSend = (message.trim() || attachedFile || pendingVoice) && !disabled && !uploading;

  return (
    <form onSubmit={handleSend} className={clsx(styles['chat-input-wrapper'])}>
      <div className={clsx(styles['chat-input-actions'])}>
        <button
          type="button"
          className={clsx(styles['chat-action-icon-btn'], styles['chat-attach-btn'])}
          title="Joindre un fichier"
          disabled={disabled || uploading || isRecordingVoice}
          onClick={handleAttachClick}
          aria-label="Joindre un fichier"
        >
          <FiPaperclip />
        </button>
        <VoiceRecorder
          isRecording={isRecordingVoice}
          onRecordingStart={handleRecordingStart}
          onRecordingStop={handleRecordingStop}
          disabled={disabled || uploading}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          aria-hidden="true"
        />
        <div className={clsx(styles['chat-input-field-wrapper'], { [styles['focused']]: isFocused })}>
          {attachedFile && (
            <div className={clsx(styles['attached-file-preview'])}>
              <img src={attachedFile.url} alt="Aperçu" className={clsx(styles['preview-image'])} />
              <button type="button" onClick={() => setAttachedFile(null)} className={clsx(styles['remove-attachment'])} title="Supprimer">×</button>
            </div>
          )}
          {isRecordingVoice && (
            <div className={clsx(styles['voice-recording-input'])}>
              <span className={clsx(styles['voice-recording-dot'])} />
              <span className={clsx(styles['voice-recording-timer'])}>{formatTime(recordingDuration)}</span>
              <div className={clsx(styles['voice-recording-bar-container'])}>
                <div className={clsx(styles['voice-recording-animated-bar'])} />
              </div>
            </div>
          )}
          {pendingVoice && !isRecordingVoice && (
            <div className={clsx(styles['voice-pending-input'])}>
              <FiMic size={16} />
              <span className={clsx(styles['voice-pending-label'])}>
                Message vocal · {Math.round(pendingVoice.durationMs / 1000)}s
              </span>
              <button
                type="button"
                onClick={() => setPendingVoice(null)}
                className={clsx(styles['voice-pending-cancel'])}
                title="Supprimer"
              >
                <FiX size={16} />
              </button>
            </div>
          )}
          {!isRecordingVoice && !pendingVoice && (
            <textarea
              ref={inputRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={uploading ? "Upload en cours..." : "Écrivez un message..."}
              className={clsx(styles['chat-input-field'])}
              disabled={disabled || uploading}
              rows="1"
              aria-label="Champ de message"
            />
          )}
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
