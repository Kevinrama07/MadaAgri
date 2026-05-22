import { useState, useRef, useEffect, useCallback } from 'react';
import { FiPlay, FiPause, FiVolume2, FiVolumeX, FiMaximize, FiMinimize, FiRotateCcw } from 'react-icons/fi';
import clsx from 'clsx';
import styles from './VideoPlayer.module.css';

export default function VideoPlayer({ src, poster, duration: propDuration, onView, autoPlay = false, muted = false }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(propDuration || 0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const controlsTimeout = useRef(null);
  const viewCounted = useRef(false);

  const isEnded = duration > 0 && currentTime >= duration - 0.5 && !isPlaying && !isLoading;

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused || isEnded) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isEnded]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const seekTo = useCallback((clientX) => {
    if (!progressRef.current || !videoRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const ratio = x / rect.width;
    const seekTime = ratio * duration;
    videoRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
    setProgress(ratio);
  }, [duration]);

  const handleProgressClick = useCallback((e) => {
    seekTo(e.clientX);
  }, [seekTo]);

  const handleProgressMouseDown = useCallback((e) => {
    setIsSeeking(true);
    seekTo(e.clientX);

    const handleMouseMove = (ev) => {
      seekTo(ev.clientX);
    };

    const handleMouseUp = () => {
      setIsSeeking(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [seekTo]);

  const handleTimeUpdate = () => {
    if (!videoRef.current || isSeeking) return;
    const ct = videoRef.current.currentTime;
    const dur = videoRef.current.duration || duration;
    setCurrentTime(ct);
    setProgress(dur > 0 ? ct / dur : 0);

    if (dur > 0 && ct >= dur * 0.5 && !viewCounted.current) {
      viewCounted.current = true;
      onView?.();
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    setIsLoading(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying && !isSeeking) setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    if (autoPlay && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
    return () => {
      clearTimeout(controlsTimeout.current);
    };
  }, [autoPlay]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const showCenterOverlay = !isLoading && !hasError && (!isPlaying || isEnded);

  return (
    <div
      ref={containerRef}
      className={clsx(styles['video-container'], { [styles['fullscreen']]: isFullscreen })}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && !isSeeking && setShowControls(false)}
    >
      {isLoading && (
        <div className={clsx(styles['video-loader'])}>
          <div className={clsx(styles['spinner'])}></div>
        </div>
      )}

      {hasError ? (
        <div className={clsx(styles['video-error'])}>
          <FiVolumeX size={32} />
          <p>Erreur de lecture vidéo</p>
        </div>
      ) : (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className={clsx(styles['video-element'])}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onError={() => { setHasError(true); setIsLoading(false); }}
          onEnded={handleEnded}
          onWaiting={() => setIsLoading(true)}
          onCanPlay={() => setIsLoading(false)}
          playsInline
          preload="metadata"
        />
      )}

      {showCenterOverlay && (
        <div className={clsx(styles['play-overlay'])} onClick={togglePlay}>
          <div className={clsx(styles['play-button'])}>
            {isEnded ? <FiRotateCcw size={24} /> : <FiPlay size={28} />}
          </div>
        </div>
      )}

      {propDuration && !isPlaying && !isLoading && !isEnded && (
        <div className={clsx(styles['duration-badge'])}>
          <span>{formatTime(propDuration)}</span>
        </div>
      )}

      {/* Info time */}
      <div className={clsx(styles['time-info'])}>
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Seekable progress bar */}
      <div
        ref={progressRef}
        className={clsx(styles['progress-container'])}
        onClick={handleProgressClick}
        onMouseDown={handleProgressMouseDown}
      >
        <div className={clsx(styles['progress-track'])}>
          <div className={clsx(styles['progress-fill'])} style={{ width: `${progress * 100}%` }} />
        </div>
        <div className={clsx(styles['progress-thumb'])} style={{ left: `${progress * 100}%` }} />
      </div>

      {showControls && !hasError && (
        <div className={clsx(styles['controls'])}>
          <button className={clsx(styles['control-btn'])} onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <FiPause size={16} /> : <FiPlay size={16} />}
          </button>

          <span className={clsx(styles['time'])}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <button className={clsx(styles['control-btn'])} onClick={toggleMute} title={isMuted ? 'Activer son' : 'Couper son'}>
            {isMuted ? <FiVolumeX size={16} /> : <FiVolume2 size={16} />}
          </button>

          <button className={clsx(styles['control-btn'])} onClick={toggleFullscreen} title={isFullscreen ? 'Quitter plein écran' : 'Plein écran'}>
            {isFullscreen ? <FiMinimize size={16} /> : <FiMaximize size={16} />}
          </button>
        </div>
      )}
    </div>
  );
}
