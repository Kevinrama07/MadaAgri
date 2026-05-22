import React, { useMemo, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import { VideoView } from 'expo-video';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '../theme';

interface VideoPlayerProps {
  source: { uri: string };
  thumbnail?: string;
  videoDuration?: number;
  style?: any;
  paused?: boolean;
  muted?: boolean;
  showControls?: boolean;
  useNativeControls?: boolean;
  resizeMode?: 'contain' | 'cover' | 'fill';
  onViewCount?: () => void;
}

export const VideoPlayer = ({
  source,
  thumbnail,
  videoDuration,
  style,
  paused = false,
  muted = false,
  showControls = true,
  useNativeControls = Platform.OS !== 'web',
  resizeMode = 'contain',
  onViewCount,
}: VideoPlayerProps) => {
  const { colors } = useTheme();
  const {
    player,
    isPlaying,
    isMuted,
    duration,
    position,
    isLoading,
    hasError,
    togglePlayback,
    toggleMute,
    seek,
  } = useVideoPlayer({ source, autoPlay: !paused, muted });

  const progress = duration > 0 ? position / duration : 0;
  const currentTime = position / 1000;
  const totalDuration = duration / 1000;

  const progressBarRef = useRef<View>(null);
  const progressBarWidth = useRef(0);
  const isSeeking = useRef(false);
  const durationRef = useRef(duration);
  const seekRef = useRef(seek);

  useEffect(() => { durationRef.current = duration; }, [duration]);
  useEffect(() => { seekRef.current = seek; }, [seek]);

  const isEnded = duration > 0 && position >= duration - 500 && !isPlaying;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const calculateSeekPosition = useCallback((pageX: number) => {
    if (progressBarWidth.current <= 0) return 0;
    const ratio = Math.max(0, Math.min(1, pageX / progressBarWidth.current));
    return ratio * durationRef.current;
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        isSeeking.current = true;
        const pos = calculateSeekPosition(evt.nativeEvent.locationX);
        seekRef.current(pos);
      },
      onPanResponderMove: (evt) => {
        const pos = calculateSeekPosition(evt.nativeEvent.locationX);
        seekRef.current(pos);
      },
      onPanResponderRelease: () => {
        isSeeking.current = false;
      },
    })
  ).current;

  const handleProgressBarLayout = (e: LayoutChangeEvent) => {
    progressBarWidth.current = e.nativeEvent.layout.width;
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      width: '100%',
      aspectRatio: 16 / 9,
      borderRadius: BORDER_RADIUS.IMAGE,
      overflow: 'hidden',
      backgroundColor: colors.primaryBackground,
      position: 'relative',
    },
    video: {
      width: '100%',
      height: '100%',
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.15)',
    },
    centerButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    durationBadge: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    durationText: {
      color: '#FFF',
      fontSize: 12,
      fontWeight: '600',
    },
    muteButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    progressContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 20,
      justifyContent: 'center',
      paddingHorizontal: 0,
    },
    progressTrack: {
      height: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      borderRadius: 2,
      overflow: 'visible',
      marginHorizontal: 0,
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    progressThumb: {
      position: 'absolute',
      top: -4,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.primary,
    },
    progressInfo: {
      position: 'absolute',
      bottom: 20,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
      paddingBottom: 4,
    },
    timeText: {
      color: '#FFF',
      fontSize: 11,
      fontWeight: '500',
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    errorContainer: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.primaryBackground,
    },
    errorText: {
      color: colors.textSecondary,
      fontSize: 13,
      marginTop: 8,
    },
  }), [colors]);

  if (hasError) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="video-off" size={32} color={colors.textSecondary} />
          <Text style={styles.errorText}>Erreur de lecture vidéo</Text>
        </View>
      </View>
    );
  }

  const showCenterButton = !isLoading && !hasError && (!isPlaying || isEnded);

  return (
    <View style={[styles.container, style]}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit={resizeMode}
        nativeControls={useNativeControls}
        allowsFullscreen={true}
        onFirstFrameRender={() => onViewCount?.()}
      />

      {!useNativeControls && showControls && (
        <>
          {showCenterButton && (
            <Pressable style={styles.overlay} onPress={togglePlayback}>
              <View style={styles.centerButton}>
                <MaterialCommunityIcons
                  name={isEnded ? 'replay' : 'play'}
                  size={28}
                  color="#FFF"
                />
              </View>
            </Pressable>
          )}

          <Pressable style={styles.muteButton} onPress={toggleMute}>
            <MaterialCommunityIcons
              name={isMuted ? 'volume-off' : 'volume-high'}
              size={16}
              color="#FFF"
            />
          </Pressable>

          {videoDuration && !isPlaying && !isLoading && !isEnded && (
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>
                {formatTime(videoDuration)}
              </Text>
            </View>
          )}

          <View style={styles.progressInfo}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Text style={styles.timeText}>{formatTime(totalDuration)}</Text>
          </View>

          <View
            ref={progressBarRef}
            style={styles.progressContainer}
            onLayout={handleProgressBarLayout}
            {...panResponder.panHandlers}
          >
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <View
              style={[
                styles.progressThumb,
                { left: `${progress * 100}%`, marginLeft: -6 },
              ]}
            />
          </View>
        </>
      )}

      {isLoading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#FFF" />
        </View>
      )}
    </View>
  );
};

export default VideoPlayer;
