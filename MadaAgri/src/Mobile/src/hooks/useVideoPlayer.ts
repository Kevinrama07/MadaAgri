import { useState, useCallback, useEffect } from 'react';
import { useVideoPlayer as useExpoVideoPlayer } from 'expo-video';

interface UseVideoPlayerOptions {
  source: { uri: string };
  autoPlay?: boolean;
  muted?: boolean;
}

interface UseVideoPlayerReturn {
  player: ReturnType<typeof useExpoVideoPlayer>;
  isPlaying: boolean;
  isMuted: boolean;
  duration: number;
  position: number;
  isLoading: boolean;
  hasError: boolean;
  play: () => void;
  pause: () => void;
  togglePlayback: () => void;
  toggleMute: () => void;
  seek: (positionMs: number) => void;
}

export function useVideoPlayer({
  source,
  autoPlay = false,
  muted = false,
}: UseVideoPlayerOptions): UseVideoPlayerReturn {
  const player = useExpoVideoPlayer(source, (p) => {
    p.muted = muted;
    p.loop = false;
    p.timeUpdateEventInterval = 0.25;
  });

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const onStatusChange = (payload: any) => {
      switch (payload.status) {
        case 'loading':
          setIsLoading(true);
          break;
        case 'readyToPlay':
          setIsLoading(false);
          setHasError(false);
          setDuration(player.duration * 1000);
          if (autoPlay) player.play();
          break;
        case 'error':
          setHasError(true);
          setIsLoading(false);
          break;
      }
    };

    const onPlayingChange = (payload: any) => {
      setIsPlaying(payload.isPlaying);
    };

    const onTimeUpdate = (payload: any) => {
      setPosition(payload.currentTime * 1000);
    };

    const onSourceLoad = (payload: any) => {
      setDuration(payload.duration * 1000);
    };

    player.addListener('statusChange', onStatusChange);
    player.addListener('playingChange', onPlayingChange);
    player.addListener('timeUpdate', onTimeUpdate);
    player.addListener('sourceLoad', onSourceLoad);

    return () => {
      player.removeListener('statusChange', onStatusChange);
      player.removeListener('playingChange', onPlayingChange);
      player.removeListener('timeUpdate', onTimeUpdate);
      player.removeListener('sourceLoad', onSourceLoad);
    };
  }, [player, autoPlay]);

  const play = useCallback(() => player.play(), [player]);
  const pause = useCallback(() => player.pause(), [player]);

  const togglePlayback = useCallback(() => {
    if (player.playing) player.pause();
    else player.play();
  }, [player]);

  const toggleMute = useCallback(() => {
    player.muted = !player.muted;
    setIsMuted(!player.muted);
  }, [player]);

  const seek = useCallback(
    (positionMs: number) => {
      player.currentTime = positionMs / 1000;
      setPosition(positionMs);
    },
    [player]
  );

  return {
    player,
    isPlaying,
    isMuted,
    duration,
    position,
    isLoading,
    hasError,
    play,
    pause,
    togglePlayback,
    toggleMute,
    seek,
  };
}

export default useVideoPlayer;
