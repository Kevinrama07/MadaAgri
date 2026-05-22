import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';

interface AudioPlayerState {
  isPlaying: boolean;
  durationMs: number;
  positionMs: number;
  isLoading: boolean;
  currentUrl: string | null;
}

type PlaybackListener = (state: AudioPlayerState) => void;

class AudioPlayerManager {
  private static instance: AudioPlayerManager;
  private sound: Audio.Sound | null = null;
  private currentUrl: string | null = null;
  private listeners: Set<PlaybackListener> = new Set();
  private state: AudioPlayerState = {
    isPlaying: false,
    durationMs: 0,
    positionMs: 0,
    isLoading: false,
    currentUrl: null,
  };

  private constructor() {}

  static getInstance(): AudioPlayerManager {
    if (!AudioPlayerManager.instance) {
      AudioPlayerManager.instance = new AudioPlayerManager();
    }
    return AudioPlayerManager.instance;
  }

  subscribe(listener: PlaybackListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => { this.listeners.delete(listener); };
  }

  private notify() {
    this.listeners.forEach(l => l({ ...this.state }));
  }

  async play(url: string): Promise<void> {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).catch(() => {});

    if (this.currentUrl === url && this.sound) {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) {
          await this.sound.pauseAsync();
          this.state.isPlaying = false;
          this.notify();
          return;
        }
        if (status.didJustFinish || status.positionMillis >= (status.durationMillis || 0)) {
          await this.sound.setPositionAsync(0);
        }
        await this.sound.playAsync();
        this.state.isPlaying = true;
        this.notify();
        return;
      }
    }

    await this.stop();

    this.state.isLoading = true;
    this.state.currentUrl = url;
    this.notify();

    try {
      const { sound, status } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true, progressUpdateIntervalMillis: 100 },
        this.onPlaybackStatusUpdate
      );

      this.sound = sound;
      this.currentUrl = url;
      this.state.isLoading = false;
      this.state.isPlaying = true;
      this.state.positionMs = 0;
      this.state.durationMs = (status as any)?.durationMillis || 0;
      this.notify();
    } catch (e) {
      this.state.isLoading = false;
      this.state.isPlaying = false;
      this.notify();
    }
  }

  private onPlaybackStatusUpdate = (status: any) => {
    if (!status.isLoaded) {
      if (status.error) {
        this.state.isPlaying = false;
        this.state.isLoading = false;
        this.notify();
      }
      return;
    }

    this.state.durationMs = status.durationMillis || 0;
    this.state.positionMs = status.positionMillis || 0;
    this.state.isPlaying = status.isPlaying || false;
    this.state.isLoading = !status.isLoaded;

    if (status.didJustFinish) {
      this.state.isPlaying = false;
    }

    this.notify();
  };

  async seek(positionMs: number): Promise<void> {
    if (this.sound) {
      await this.sound.setPositionAsync(positionMs);
      this.state.positionMs = positionMs;
      this.notify();
    }
  }

  async togglePlayPause(): Promise<void> {
    if (!this.sound) return;

    const status = await this.sound.getStatusAsync();
    if (!status.isLoaded) return;

    if (status.isPlaying) {
      await this.sound.pauseAsync();
      this.state.isPlaying = false;
    } else {
      if (status.didJustFinish || status.positionMillis >= (status.durationMillis || 0)) {
        await this.sound.setPositionAsync(0);
      }
      await this.sound.playAsync();
      this.state.isPlaying = true;
    }
    this.notify();
  }

  async stop(): Promise<void> {
    if (this.sound) {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
    }
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

  isPlayingUrl(url: string): boolean {
    return this.currentUrl === url && this.state.isPlaying;
  }

  getState(): AudioPlayerState {
    return { ...this.state };
  }
}

const audioManager = AudioPlayerManager.getInstance();

export function useAudioPlayer() {
  const [state, setState] = useState<AudioPlayerState>(audioManager.getState());

  useEffect(() => {
    const unsub = audioManager.subscribe(setState);
    return unsub;
  }, []);

  const play = useCallback((url: string) => audioManager.play(url), []);
  const seek = useCallback((ms: number) => audioManager.seek(ms), []);
  const togglePlayPause = useCallback(() => audioManager.togglePlayPause(), []);
  const stop = useCallback(() => audioManager.stop(), []);
  const isPlayingUrl = useCallback((url: string) => audioManager.isPlayingUrl(url), []);

  return { ...state, play, seek, togglePlayPause, stop, isPlayingUrl };
}

export default useAudioPlayer;
