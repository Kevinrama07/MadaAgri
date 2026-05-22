import React, { useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { VideoPlayer } from './VideoPlayer';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';

interface VideoPostCardProps {
  videoUrl: string;
  thumbnailUrl?: string;
  videoDuration?: number;
  videoViews?: number;
  onPlay?: () => void;
  onViewCount?: () => void;
  style?: any;
}

export const VideoPostCard = ({
  videoUrl,
  thumbnailUrl,
  videoDuration,
  videoViews = 0,
  onPlay,
  onViewCount,
  style,
}: VideoPostCardProps) => {
  const { colors } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      width: '100%',
      marginBottom: SPACING.PADDING_DEFAULT,
      borderRadius: BORDER_RADIUS.IMAGE,
      overflow: 'hidden',
      backgroundColor: colors.primaryBackground,
    },
    videoWrapper: {
      width: '100%',
      position: 'relative',
    },
    viewsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 6,
      paddingHorizontal: 4,
    },
    viewsIcon: {
      fontSize: 12,
    },
    viewsText: {
      fontSize: TYPOGRAPHY.caption.fontSize,
      color: colors.textTertiary,
      fontWeight: TYPOGRAPHY.caption.fontWeight,
    },
    durationBadge: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    durationText: {
      color: '#FFF',
      fontSize: 12,
      fontWeight: '600',
    },
    thumbnail: {
      width: '100%',
      aspectRatio: 16 / 9,
      borderRadius: BORDER_RADIUS.IMAGE,
    },
    playOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      borderRadius: BORDER_RADIUS.IMAGE,
    },
    playIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
  }), [colors]);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatViews = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.videoWrapper}>
        <VideoPlayer
          source={{ uri: videoUrl }}
          thumbnail={thumbnailUrl}
          videoDuration={videoDuration}
          useNativeControls={false}
          resizeMode="contain"
          onViewCount={onViewCount}
        />
      </View>

      {(videoViews > 0) && (
        <View style={styles.viewsRow}>
          <MaterialCommunityIcons
            name="eye-outline"
            size={14}
            color={colors.textTertiary}
            style={styles.viewsIcon}
          />
          <Text style={styles.viewsText}>
            {formatViews(videoViews)} vues
          </Text>
        </View>
      )}
    </View>
  );
};

export default VideoPostCard;
