import { useMemo, useRef, useCallback } from 'react';
import clsx from 'clsx';
import { FiPlay, FiPause } from 'react-icons/fi';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import styles from './MessagerieStyles.module.css';

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function VoiceMessageBubble({ audioUrl, duration, isOwn }) {
  const { isPlaying, positionMs, durationMs, isPlayingUrl, play, seek } = useAudioPlayer();
  const barRef = useRef(null);

  const thisIsPlaying = isPlayingUrl(audioUrl);
  const displayDuration = durationMs > 0 ? durationMs : Math.max((duration || 0) * 1000, 1000);
  const currentPos = thisIsPlaying ? positionMs : 0;
  const progress = displayDuration > 0 ? Math.min(currentPos / displayDuration, 1) : 0;

  const handlePlayPause = useCallback(() => {
    play(audioUrl);
  }, [audioUrl, play]);

  const handleBarClick = useCallback((e) => {
    const bar = barRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, x / rect.width));
    seek(fraction * displayDuration);
  }, [displayDuration, seek]);

  return (
    <div className={clsx(styles['voice-bubble-container'])}>
      <button
        className={clsx(styles['voice-play-btn'], {
          [styles['voice-play-btn-own']]: isOwn,
        })}
        onClick={handlePlayPause}
        title={thisIsPlaying ? 'Pause' : 'Lecture'}
      >
        {thisIsPlaying ? <FiPause size={16} /> : <FiPlay size={16} />}
      </button>
      <div className={clsx(styles['voice-waveform'])}>
        <div
          ref={barRef}
          className={clsx(styles['voice-waveform-bar'], {
            [styles['voice-waveform-bar-own']]: isOwn,
          })}
          onClick={handleBarClick}
        >
          <div
            className={clsx(styles['voice-waveform-progress'], {
              [styles['voice-waveform-progress-own']]: isOwn,
            })}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className={clsx(styles['voice-time-row'])}>
          <span className={clsx(styles['voice-time'], { [styles['voice-time-own']]: isOwn })}>
            {thisIsPlaying ? formatDuration(currentPos) : formatDuration(displayDuration)}
          </span>
        </div>
      </div>
    </div>
  );
}
