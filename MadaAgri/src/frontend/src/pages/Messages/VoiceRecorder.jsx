import { useEffect, useRef, useCallback } from 'react';
import clsx from 'clsx';
import { FiMic, FiStopCircle } from 'react-icons/fi';
import { useVoiceRecorder } from './hooks/useVoiceRecorder';
import styles from './MessagerieStyles.module.css';

export default function VoiceRecorder({ isRecording, onRecordingStart, onRecordingStop, disabled }) {
  const {
    isRecording: hookIsRecording,
    recordingDurationMs,
    isPermissionGranted,
    startRecording,
    stopRecording,
    permissionError,
  } = useVoiceRecorder();

  const durationRef = useRef(0);

  useEffect(() => {
    if (hookIsRecording) {
      durationRef.current = recordingDurationMs;
    }
  }, [recordingDurationMs, hookIsRecording]);

  const handleToggle = useCallback(async () => {
    if (disabled) return;

    if (!isRecording) {
      await startRecording();
      onRecordingStart();
    } else {
      const result = await stopRecording();
      if (result) {
        onRecordingStop(result.blob, durationRef.current, result.mimeType);
      } else {
        onRecordingStop(null, 0, null);
      }
    }
  }, [disabled, isRecording, startRecording, stopRecording, onRecordingStart, onRecordingStop]);

  if (!isPermissionGranted && !isRecording) {
    return (
      <button
        type="button"
        className={clsx(styles['chat-action-icon-btn'], styles['voice-mic-btn'])}
        title={permissionError || 'Microphone non disponible'}
        disabled
      >
        <FiMic size={18} />
      </button>
    );
  }

  return (
    <button
      type="button"
      className={clsx(styles['chat-action-icon-btn'], styles['voice-mic-btn'], {
        [styles['voice-mic-recording']]: isRecording,
      })}
      onClick={handleToggle}
      disabled={disabled || (!isRecording && !isPermissionGranted)}
      title={isRecording ? 'Arrêter l\'enregistrement' : 'Enregistrer un message vocal'}
    >
      {isRecording ? <FiStopCircle size={20} /> : <FiMic size={18} />}
    </button>
  );
}
