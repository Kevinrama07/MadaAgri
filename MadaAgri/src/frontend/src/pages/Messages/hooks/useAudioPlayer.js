import { useState, useRef, useCallback, useEffect } from 'react';

class AudioPlayerManager {
  static instance = null;
  audio = null;
  currentUrl = null;
  listeners = new Set();

  state = {
    isPlaying: false,
    durationMs: 0,
    positionMs: 0,
    isLoading: false,
    currentUrl: null,
  };

  static getInstance() {
    if (!AudioPlayerManager.instance) {
      AudioPlayerManager.instance = new AudioPlayerManager();
    }
    return AudioPlayerManager.instance;
  }

  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.addEventListener('loadedmetadata', this.onMetadata);
    this.audio.addEventListener('timeupdate', this.onTimeUpdate);
    this.audio.addEventListener('play', this.onPlay);
    this.audio.addEventListener('pause', this.onPause);
    this.audio.addEventListener('ended', this.onEnded);
    this.audio.addEventListener('error', this.onError);
    this.audio.addEventListener('waiting', this.onWaiting);
    this.audio.addEventListener('canplay', this.onCanPlay);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(l => l({ ...this.state }));
  }

  onMetadata = () => {
    this.state.durationMs = (this.audio.duration || 0) * 1000;
    this.state.isLoading = false;
    this.notify();
  };

  onTimeUpdate = () => {
    this.state.positionMs = (this.audio.currentTime || 0) * 1000;
    this.notify();
  };

  onPlay = () => {
    this.state.isPlaying = true;
    this.notify();
  };

  onPause = () => {
    this.state.isPlaying = false;
    this.notify();
  };

  onEnded = () => {
    this.state.isPlaying = false;
    this.state.positionMs = this.state.durationMs;
    this.notify();
  };

  onError = () => {
    this.state.isLoading = false;
    this.state.isPlaying = false;
    this.notify();
  };

  onWaiting = () => {
    this.state.isLoading = true;
    this.notify();
  };

  onCanPlay = () => {
    this.state.isLoading = false;
    this.notify();
  };

  async play(url) {
    if (this.currentUrl === url && this.audio.src) {
      if (this.audio.paused) {
        if (this.audio.ended) {
          this.audio.currentTime = 0;
        }
        await this.audio.play();
      } else {
        this.audio.pause();
      }
      return;
    }

    this.stop();
    this.state.isLoading = true;
    this.state.currentUrl = url;
    this.notify();

    this.audio.src = url;
    this.currentUrl = url;
    try {
      await this.audio.play();
    } catch (e) {
      this.state.isLoading = false;
      this.notify();
    }
  }

  async seek(positionMs) {
    this.audio.currentTime = positionMs / 1000;
    this.state.positionMs = positionMs;
    this.notify();
  }

  async togglePlayPause() {
    if (this.audio.paused) {
      if (this.audio.ended) {
        this.audio.currentTime = 0;
      }
      await this.audio.play();
    } else {
      this.audio.pause();
    }
  }

  stop() {
    this.audio.pause();
    this.audio.removeAttribute('src');
    this.audio.load();
    this.currentUrl = null;
    this.state = {
      isPlaying: false,
      durationMs: 0,
      positionMs: 0,
      isLoading: false,
      currentUrl: null,
    };
    this.notify();
  }

  isPlayingUrl(url) {
    return this.currentUrl === url && !this.audio.paused;
  }

  getState() {
    return { ...this.state };
  }
}

const audioManager = AudioPlayerManager.getInstance();

export function useAudioPlayer() {
  const [state, setState] = useState(audioManager.getState());

  useEffect(() => {
    const unsub = audioManager.subscribe(setState);
    return unsub;
  }, []);

  const play = useCallback((url) => audioManager.play(url), []);
  const seek = useCallback((ms) => audioManager.seek(ms), []);
  const togglePlayPause = useCallback(() => audioManager.togglePlayPause(), []);
  const stop = useCallback(() => audioManager.stop(), []);
  const isPlayingUrl = useCallback((url) => audioManager.isPlayingUrl(url), []);

  return { ...state, play, seek, togglePlayPause, stop, isPlayingUrl };
}

export default useAudioPlayer;
