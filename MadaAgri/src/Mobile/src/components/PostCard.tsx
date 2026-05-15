import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import Card from './Card';
import Avatar from './Avatar';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';

const SAFE_TYPOGRAPHY = {
  display: 32,
  h1: 24,
  h2: 20,
  h3: 18,
  subheading: 16,
  body: 14,
  bodySmall: 13,
  bodyLarge: 15,
  label: 12,
  caption: 11,
};

const SAFE_SPACING = {
  SM: 8,
  MARGIN_DEFAULT: 12,
  MARGIN_LARGE: 16,
  PADDING_DEFAULT: 12,
};

const SAFE_BORDER_RADIUS = {
  IMAGE: 12,
};

interface PostCardProps {
  author?: {
    id?: string;
    name?: string;
    avatar?: string;
    role?: string;
  };
  content?: string;
  image?: string;
  timestamp?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  liked?: boolean;
  onPress?: () => void;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onMenuPress?: () => void;
}

export const PostCard = ({
  author = {},
  content = '',
  image,
  timestamp = '',
  likes = 0,
  comments = 0,
  shares = 0,
  liked = false,
  onPress,
  onLike,
  onComment,
  onShare,
  onMenuPress,
}: PostCardProps) => {
  // Debug logs pour identifier les problèmes
  // (supprimés en production)

  const { colors } = useTheme();
  const spacing = SPACING;
  const borderRadius = BORDER_RADIUS;

  // Validation des props avec valeurs par défaut
  const safeAuthor = {
    id: author?.id || 'unknown',
    name: author?.name || 'Utilisateur',
    avatar: author?.avatar,
    role: author?.role,
  };

  const [isLiked, setIsLiked] = useState(liked);
  const [likeCount, setLikeCount] = useState(likes || 0);

const handleLike = () => {
    try {
      setIsLiked(!isLiked);
      setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
      onLike?.();
    } catch (error) {
      console.error('[PostCard] Error in handleLike:', error);
    }
  };

  // Couleurs avec fallbacks sécurisés
  const safeColors = {
    text: colors?.text || '#1C1E21',
    textSecondary: colors?.textSecondary || '#65676B',
    textTertiary: colors?.textTertiary || '#8A8D91',
    secondaryBackground: colors?.secondaryBackground || '#F5F5F5',
    border: colors?.border || '#E4E6EB',
    error: colors?.error || '#C62828',
    primary: colors?.primary || '#2E7D32',
  };

  // Styles avec protection complète
  const styles = StyleSheet.create({
    postContainer: {
      marginBottom: spacing?.MARGIN_LARGE ?? SAFE_SPACING.MARGIN_LARGE,
    },
    postHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing?.MARGIN_DEFAULT ?? SAFE_SPACING.MARGIN_DEFAULT,
    },
    authorInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    authorDetails: {
      marginLeft: spacing?.MARGIN_DEFAULT ?? SAFE_SPACING.MARGIN_DEFAULT,
      flex: 1,
    },
    authorName: {
      fontSize: TYPOGRAPHY.subheading.fontSize,
      fontWeight: '600' as const,
      color: safeColors.text,
    },
    authorRole: {
      fontSize: TYPOGRAPHY.caption.fontSize,
      color: safeColors.textTertiary,
      marginTop: spacing?.SM ?? SAFE_SPACING.SM,
    },
    timestamp: {
      fontSize: TYPOGRAPHY.caption.fontSize,
      color: safeColors.textTertiary,
      marginTop: spacing?.SM ?? SAFE_SPACING.SM,
    },
    menuButton: {
      padding: spacing?.SM ?? SAFE_SPACING.SM,
    },
    contentText: {
      fontSize: TYPOGRAPHY.body.fontSize,
      color: safeColors.text,
      lineHeight: TYPOGRAPHY.body.fontSize * 1.4,
      marginBottom: spacing?.MARGIN_DEFAULT ?? SAFE_SPACING.MARGIN_DEFAULT,
    },
    postImage: {
      width: '100%',
      height: 280,
      borderRadius: borderRadius?.IMAGE ?? SAFE_BORDER_RADIUS.IMAGE,
      marginBottom: spacing?.MARGIN_DEFAULT ?? SAFE_SPACING.MARGIN_DEFAULT,
      backgroundColor: safeColors.secondaryBackground,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing?.PADDING_DEFAULT ?? SAFE_SPACING.PADDING_DEFAULT,
      borderTopColor: safeColors.border,
      borderTopWidth: 1,
      borderBottomColor: safeColors.border,
      borderBottomWidth: 1,
      marginBottom: spacing?.MARGIN_DEFAULT ?? SAFE_SPACING.MARGIN_DEFAULT,
    },
    stat: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statText: {
      fontSize: TYPOGRAPHY.caption.fontSize,
      color: safeColors.textTertiary,
      marginLeft: spacing?.SM ?? SAFE_SPACING.SM,
    },
    actionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing?.PADDING_DEFAULT ?? SAFE_SPACING.PADDING_DEFAULT,
      flex: 1,
      justifyContent: 'center',
    },
    actionText: {
      fontSize: TYPOGRAPHY.bodySmall.fontSize,
      color: safeColors.textSecondary,
      marginLeft: spacing?.SM ?? SAFE_SPACING.SM,
      fontWeight: '500' as const,
    },
    likeButton: {
      color: safeColors.error,
    },
    errorContainer: {
      padding: 16,
      backgroundColor: '#FFE6E6',
      borderRadius: 8,
      margin: 16,
    },
    errorText: {
      color: '#C62828',
      fontSize: 14,
      textAlign: 'center',
    },
  });

  // Fallback UI en cas d'erreur critique
  if (!safeAuthor.name && !content) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Erreur: Données de publication manquantes
        </Text>
      </View>
    );
  }

  // Rendu sécurisé avec toutes les protections
  try {
    return (
      <Card variant="default" style={styles.postContainer}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <View style={styles.authorInfo}>
            <Avatar
              size="medium"
              source={safeAuthor.avatar ? { uri: safeAuthor.avatar } : undefined}
              initials={safeAuthor.name?.substring(0, 2) || 'U'}
            />
            <View style={styles.authorDetails}>
              <Text style={styles.authorName}>{safeAuthor.name}</Text>
              {safeAuthor.role && (
                <Text style={styles.authorRole}>{safeAuthor.role}</Text>
              )}
              <Text style={styles.timestamp}>{timestamp || 'Maintenant'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
            <MaterialCommunityIcons 
              name="dots-vertical" 
              size={20} 
              color={safeColors.textTertiary} 
            />
          </TouchableOpacity>
        </View>

        {/* Post Content */}
        {content && (
          <Text style={styles.contentText} numberOfLines={4}>
            {content}
          </Text>
        )}

        {/* Post Image */}
        {image && (
          <Image 
            source={{ uri: image }} 
            style={styles.postImage}
            onError={(error) => {
              console.warn('[PostCard] Image load error:', error);
            }}
          />
        )}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <MaterialCommunityIcons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={16}
              color={isLiked ? safeColors.error : safeColors.textTertiary}
            />
            <Text style={styles.statText}>{likeCount} j'aime</Text>
          </View>
          <View style={styles.stat}>
            <MaterialCommunityIcons 
              name="comment-outline" 
              size={16} 
              color={safeColors.textTertiary} 
            />
            <Text style={styles.statText}>{comments} commentaires</Text>
          </View>
          <View style={styles.stat}>
            <MaterialCommunityIcons 
              name="share-outline" 
              size={16} 
              color={safeColors.textTertiary} 
            />
            <Text style={styles.statText}>{shares}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <MaterialCommunityIcons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={isLiked ? safeColors.error : safeColors.textSecondary}
            />
            <Text style={[styles.actionText, isLiked && styles.likeButton]}>
              J'aime
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onComment}>
            <MaterialCommunityIcons 
              name="comment-outline" 
              size={20} 
              color={safeColors.textSecondary} 
            />
            <Text style={styles.actionText}>Commenter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onShare}>
            <MaterialCommunityIcons 
              name="share-outline" 
              size={20} 
              color={safeColors.textSecondary} 
            />
            <Text style={styles.actionText}>Partager</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  } catch (error) {
    console.error('[PostCard] Render error:', error);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Erreur d'affichage de la publication
        </Text>
      </View>
    );
  }
};

export default PostCard;