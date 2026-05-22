import React, { useMemo, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';

interface VoiceMessageBubbleProps {
  audioUrl: string;
  duration: number;
  isOwn: boolean;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const VoiceMessageBubble: React.FC<VoiceMessageBubbleProps> = ({ audioUrl, duration, isOwn }) => {
  const { colors } = useTheme();
  const { isPlaying, positionMs, durationMs, isPlayingUrl, play, seek } = useAudioPlayer();
  const barWidthRef = useRef(0);

  const thisIsPlaying = isPlayingUrl(audioUrl);
  const displayDuration = durationMs > 0 ? durationMs : Math.max(duration * 1000, 1000);
  const currentPos = thisIsPlaying ? positionMs : 0;
  const progress = displayDuration > 0 ? currentPos / displayDuration : 0;

  const handlePress = () => {
    play(audioUrl);
  };

  const handleSeek = (locationX: number) => {
    if (barWidthRef.current <= 0) return;
    const fraction = Math.max(0, Math.min(1, locationX / barWidthRef.current));
    seek(fraction * displayDuration);
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      minWidth: 160,
      maxWidth: 240,
    },
    playButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    waveformContainer: {
      flex: 1,
      height: 36,
      justifyContent: 'center',
    },
    waveformBar: {
      height: 4,
      borderRadius: 2,
      backgroundColor: isOwn ? 'rgba(255,255,255,0.3)' : colors.border,
      overflow: 'hidden',
      position: 'relative',
    },
    waveformProgress: {
      height: '100%',
      borderRadius: 2,
      backgroundColor: isOwn ? '#fff' : colors.primary,
    },
    seekOverlay: {
      position: 'absolute',
      top: -8,
      left: 0,
      right: 0,
      bottom: -8,
    },
    timeText: {
      fontSize: 11,
      color: isOwn ? 'rgba(255,255,255,0.7)' : colors.textSecondary,
      marginTop: 4,
    },
    durationText: {
      fontSize: 11,
      color: isOwn ? 'rgba(255,255,255,0.5)' : colors.textTertiary,
      textAlign: 'right',
    },
  }), [colors, isOwn]);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePress}
        style={[styles.playButton, {
          backgroundColor: isOwn ? 'rgba(255,255,255,0.2)' : colors.primary + '20',
        }]}
      >
        <MaterialCommunityIcons
          name={thisIsPlaying ? 'pause' : 'play'}
          size={20}
          color={isOwn ? '#fff' : colors.primary}
        />
      </Pressable>
      <View style={styles.waveformContainer}>
        <View
          style={styles.waveformBar}
          onLayout={(e) => { barWidthRef.current = e.nativeEvent.layout.width; }}
        >
          <View style={[styles.waveformProgress, { width: `${progress * 100}%` }]} />
          <Pressable
            style={styles.seekOverlay}
            onPress={(e) => {
              const { locationX } = e.nativeEvent;
              handleSeek(locationX);
            }}
          >
            <View style={{ flex: 1 }} />
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.timeText}>
            {thisIsPlaying ? formatDuration(currentPos) : formatDuration(displayDuration)}
          </Text>
          <Text style={styles.durationText}>
            {formatDuration(displayDuration)}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default VoiceMessageBubble;
