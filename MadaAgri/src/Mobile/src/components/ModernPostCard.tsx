import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { ModernAvatar } from './ModernAvatar';
import { ModernCard } from './ModernCard';
import { VideoPostCard } from './VideoPostCard';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../theme';

interface PostCardProps {
  id: string;
  author: {
    id: string;
    name: string;
    avatar?: { uri: string };
    verified?: boolean;
  };
  content: string;
  image?: { uri: string };
  video?: {
    url: string;
    thumbnail?: string;
    duration?: number;
    views?: number;
  };
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  liked?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onAuthorPress?: () => void;
  onMenuPress?: () => void;
  onVideoView?: () => void;
}

export const ModernPostCard = ({
  id,
  author,
  content,
  image,
  video,
  timestamp,
  likes,
  comments,
  shares,
  liked = false,
  onLike,
  onComment,
  onShare,
  onAuthorPress,
  onMenuPress,
  onVideoView,
}: PostCardProps) => {
  const { colors } = useTheme();
  const [isLiked, setIsLiked] = useState(liked);
  const [likeCount, setLikeCount] = useState(likes);

  // Synchroniser avec les props du parent
  useEffect(() => {
    setIsLiked(liked);
  }, [liked]);

  useEffect(() => {
    setLikeCount(likes);
  }, [likes]);

  const styles = useMemo(() => {
    return StyleSheet.create({
      card: {
        marginBottom: SPACING.CARD_MARGIN,
      },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.PADDING_DEFAULT,
      },
      authorInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: SPACING.MD,
      },
      authorDetails: {
        flex: 1,
      },
      authorName: {
        fontSize: TYPOGRAPHY.subheading.fontSize,
        fontWeight: TYPOGRAPHY.subheading.fontWeight,
        color: colors.text,
      },
      authorMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.XS,
      },
      timestamp: {
        fontSize: TYPOGRAPHY.caption.fontSize,
        color: colors.textTertiary,
        fontWeight: TYPOGRAPHY.caption.fontWeight,
      },
      verifiedBadge: {
        marginLeft: SPACING.XS,
      },
      menuButton: {
        padding: SPACING.SM,
      },
      content: {
        fontSize: TYPOGRAPHY.body.fontSize,
        color: colors.text,
        lineHeight: TYPOGRAPHY.body.lineHeight * TYPOGRAPHY.body.fontSize,
        marginBottom: image ? SPACING.PADDING_DEFAULT : 0,
      },
      image: {
        width: '100%',
        height: 300,
        borderRadius: BORDER_RADIUS.IMAGE,
        marginBottom: SPACING.PADDING_DEFAULT,
        backgroundColor: colors.primaryBackground,
      },
      statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: SPACING.PADDING_DEFAULT,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: colors.border,
        marginBottom: SPACING.PADDING_DEFAULT,
      },
      stat: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      statText: {
        fontSize: TYPOGRAPHY.caption.fontSize,
        color: colors.textTertiary,
        marginLeft: SPACING.XS,
        fontWeight: TYPOGRAPHY.caption.fontWeight,
      },
      actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
      },
      actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.PADDING_DEFAULT,
        borderRadius: BORDER_RADIUS.BUTTON,
      },
      actionText: {
        fontSize: TYPOGRAPHY.body.fontSize,
        fontWeight: TYPOGRAPHY.subheading.fontWeight,
        marginLeft: SPACING.SM,
      },
    });
  }, [colors]);

  const handleLike = () => {
    // Optimistic update - update UI immediately
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    // Call parent handler to persist to API
    onLike?.();
  };

  return (
    <ModernCard style={styles.card} shadow="subtle">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.authorInfo}
          onPress={onAuthorPress}
          disabled={!onAuthorPress}
        >
          <ModernAvatar
            source={author.avatar}
            initials={author.name ? author.name.charAt(0) : '?'}
            size="medium"
          />
          <View style={styles.authorDetails}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.authorName}>{author.name}</Text>
              {author.verified && (
                <MaterialCommunityIcons
                  name="check-circle"
                  size={14}
                  color={colors.accent}
                  style={styles.verifiedBadge}
                />
              )}
            </View>
            <View style={styles.authorMeta}>
              <Text style={styles.timestamp}>{timestamp}</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={onMenuPress}
          disabled={!onMenuPress}
        >
          <MaterialCommunityIcons
            name="dots-horizontal"
            size={20}
            color={colors.textTertiary}
          />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {content && <Text style={styles.content}>{content}</Text>}

      {/* Image */}
      {image && !video && <Image source={image} style={styles.image} />}

      {/* Video */}
      {video && (
        <VideoPostCard
          videoUrl={video.url}
          thumbnailUrl={video.thumbnail}
          videoDuration={video.duration}
          videoViews={video.views}
          onViewCount={onVideoView}
        />
      )}

      {/* Stats */}
      {(likeCount > 0 || comments > 0 || shares > 0) && (
        <View style={styles.statsContainer}>
          {likeCount > 0 && (
            <View style={styles.stat}>
              <MaterialCommunityIcons
                name="heart"
                size={14}
                color={colors.error}
              />
              <Text style={styles.statText}>{likeCount}</Text>
            </View>
          )}
          {comments > 0 && (
            <View style={styles.stat}>
              <MaterialCommunityIcons
                name="comment"
                size={14}
                color={colors.textTertiary}
              />
              <Text style={styles.statText}>{comments}</Text>
            </View>
          )}
          {shares > 0 && (
            <View style={styles.stat}>
              <MaterialCommunityIcons
                name="share"
                size={14}
                color={colors.textTertiary}
              />
              <Text style={styles.statText}>{shares}</Text>
            </View>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <Pressable
          style={[
            styles.actionButton,
            isLiked && { backgroundColor: colors.primaryPale },
          ]}
          onPress={handleLike}
        >
          <MaterialCommunityIcons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={isLiked ? colors.error : colors.textTertiary}
          />
          <Text
            style={[
              styles.actionText,
              { color: isLiked ? colors.error : colors.textTertiary },
            ]}
          >
            J'aime
          </Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => {
            console.log('[ModernPostCard] Comment button pressed for post:', id);
            console.log('[ModernPostCard] onComment exists?', !!onComment);
            if (onComment) {
              onComment();
            }
          }}
          disabled={!onComment}
        >
          <MaterialCommunityIcons
            name="comment-outline"
            size={20}
            color={colors.textTertiary}
          />
          <Text style={[styles.actionText, { color: colors.textTertiary }]}>
            Commenter
          </Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={onShare}
          disabled={!onShare}
        >
          <MaterialCommunityIcons
            name="share-outline"
            size={20}
            color={colors.textTertiary}
          />
          <Text style={[styles.actionText, { color: colors.textTertiary }]}>
            Partager
          </Text>
        </Pressable>
      </View>
    </ModernCard>
  );
};

export default ModernPostCard;
