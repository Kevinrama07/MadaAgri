import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { ScreenHeader } from '../components/ScreenHeader';
import { ModernCard } from '../components/ModernCard';
import { ModernAvatar } from '../components/ModernAvatar';
import { ModernButton } from '../components/ModernButton';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';
import { postService, Comment } from '../services/postService';

interface PostDetailScreenProps {
  route?: any;
  navigation?: any;
  postId?: string;
  onBack?: () => void;
  onAuthorPress?: (authorId: string) => void;
}

export const PostDetailScreen = ({
  route,
  navigation,
  postId: postIdProp,
  onBack,
  onAuthorPress,
}: PostDetailScreenProps) => {
  const { colors } = useTheme();
  const auth = useAuth();
  const currentUser = auth?.user;

  const postId = route?.params?.postId || postIdProp;
  const handleBack = onBack || (() => navigation?.goBack());

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyingToName, setReplyingToName] = useState<string>('');

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    scrollContent: {
      padding: SPACING.SCREEN_PADDING,
      paddingBottom: 100,
    },
    commentCard: {
      marginBottom: SPACING.MD,
    },
    commentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.SM,
    },
    commentAuthor: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    commentAuthorName: {
      fontSize: TYPOGRAPHY.subheading.fontSize,
      fontWeight: TYPOGRAPHY.subheading.fontWeight,
      color: colors.text,
      marginLeft: SPACING.SM,
    },
    commentTime: {
      fontSize: TYPOGRAPHY.caption.fontSize,
      color: colors.textTertiary,
      marginLeft: SPACING.SM,
    },
    commentContent: {
      fontSize: TYPOGRAPHY.body.fontSize,
      color: colors.text,
      lineHeight: 22,
      marginLeft: SPACING.LG + SPACING.SM,
    },
    commentActions: {
      flexDirection: 'row',
      marginLeft: SPACING.LG + SPACING.SM,
      marginTop: SPACING.XS,
      gap: SPACING.MD,
    },
    replyButton: {
      paddingVertical: SPACING.XS,
    },
    replyButtonText: {
      fontSize: TYPOGRAPHY.caption.fontSize,
      color: colors.primary,
      fontWeight: '600',
    },
    replyContainer: {
      marginLeft: SPACING.LG,
      marginTop: SPACING.SM,
      paddingLeft: SPACING.MD,
      borderLeftWidth: 2,
      borderLeftColor: colors.border,
    },
    inputContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      padding: SPACING.MD,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    input: {
      flex: 1,
      minHeight: 44,
      maxHeight: 100,
      paddingHorizontal: SPACING.MD,
      paddingVertical: SPACING.SM,
      backgroundColor: colors.primaryBackground,
      borderRadius: BORDER_RADIUS.BUTTON,
      fontSize: TYPOGRAPHY.body.fontSize,
      color: colors.text,
      marginRight: SPACING.SM,
    },
    replyingToContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.MD,
      paddingVertical: SPACING.SM,
      backgroundColor: colors.primaryPale,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    replyingToText: {
      flex: 1,
      fontSize: TYPOGRAPHY.caption.fontSize,
      color: colors.textSecondary,
    },
    cancelReplyButton: {
      padding: SPACING.XS,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: colors.textTertiary,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: SPACING.XL * 2,
    },
    emptyText: {
      fontSize: TYPOGRAPHY.body.fontSize,
      color: colors.textTertiary,
      marginTop: SPACING.MD,
    },
  }), [colors]);

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await postService.fetchPostComments(postId);
      setComments(data);
    } catch (error) {
      console.error('Erreur chargement commentaires:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || submitting) return;

    try {
      setSubmitting(true);
      
      if (replyingTo) {
        const reply = await postService.createCommentReply(replyingTo, newComment.trim());
        console.log('[PostDetailScreen] Reply created:', reply);
        setComments(prev => prev.map(comment => {
          if (comment.id === replyingTo) {
            return {
              ...comment,
              replies: [...(comment.replies || []), { ...reply, id: reply.id || `temp-${Date.now()}` }],
            };
          }
          return comment;
        }));
        setReplyingTo(null);
        setReplyingToName('');
      } else {
        const comment = await postService.createPostComment(postId, newComment.trim());
        setComments(prev => [...prev, { ...comment, id: comment.id || `temp-${Date.now()}` }]);
      }
      
      setNewComment('');
    } catch (error) {
      console.error('Erreur envoi commentaire:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (commentId: string, authorName: string) => {
    setReplyingTo(commentId);
    setReplyingToName(authorName);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyingToName('');
  };

  const renderComment = (comment: Comment) => (
    <ModernCard key={comment.id} style={styles.commentCard} shadow="subtle">
      <Pressable 
        style={styles.commentHeader}
        onPress={() => onAuthorPress?.(comment.user_id)}
      >
        <ModernAvatar
          source={comment.author_image ? { uri: comment.author_image } : undefined}
          initials={comment.author_name?.charAt(0) || '?'}
          size="small"
        />
        <View style={styles.commentAuthor}>
          <Text style={styles.commentAuthorName}>{comment.author_name}</Text>
          <Text style={styles.commentTime}>{postService.formatDate(comment.created_at)} </Text>
        </View>
      </Pressable>
      <Text style={styles.commentContent}>{comment.content}</Text>

      <View style={styles.commentActions}>
        <Pressable 
          style={styles.replyButton}
          onPress={() => handleReply(comment.id, comment.author_name)}
        >
          <Text style={styles.replyButtonText}>Répondre</Text>
        </Pressable>
      </View>

      {/* Réponses */}
      {comment.replies?.map((reply) => (
        <View key={reply.id} style={styles.replyContainer}>
          <Pressable
            style={styles.commentHeader}
            onPress={() => onAuthorPress?.(reply.user_id)}
          >
            <ModernAvatar
              source={reply.author_image ? { uri: reply.author_image } : undefined}
              initials={reply.author_name?.charAt(0) || '?'}
              size="small"
            />
            <Text style={styles.commentAuthorName}>{reply.author_name} </Text>
            <Text style={styles.commentTime}>{postService.formatDate(reply.created_at)} </Text>
          </Pressable>
          <Text style={styles.commentContent}>{reply.content}  </Text>
          
          <View style={styles.commentActions}>
            <Pressable 
              style={styles.replyButton}
              onPress={() => handleReply(comment.id, reply.author_name)}
            >
              <Text style={styles.replyButtonText}>Répondre</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ModernCard>
  );

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.container}>
      <ScreenHeader
        title="Commentaires"
        onBackPress={handleBack}
      />

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {comments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="comment-outline" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyText}>Aucun commentaire pour le moment </Text>
              <Text style={[styles.emptyText, { fontSize: TYPOGRAPHY.caption.fontSize }]}>Soyez le premier à commenter ! </Text>
            </View>
          ) : (
            comments.map(renderComment)
          )}
        </ScrollView>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {replyingTo && (
          <View style={styles.replyingToContainer}>
            <Text style={styles.replyingToText}>
              Répondre à {replyingToName}
            </Text>
            <Pressable style={styles.cancelReplyButton} onPress={handleCancelReply}>
              <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
        )}
        
        <View style={styles.inputContainer}>
          <ModernAvatar
            source={currentUser?.profile_picture ? { uri: currentUser.profile_picture } : undefined}
            initials={currentUser?.name?.charAt(0) || 'U'}
            size="small"
          />
          <TextInput
            style={styles.input}
            placeholder={replyingTo ? `Répondre à ${replyingToName}...` : "Écrire un commentaire..."}
            placeholderTextColor={colors.textTertiary}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
          />
          <Pressable
            style={[styles.sendButton, (!newComment.trim() || submitting) && styles.sendButtonDisabled]}
            onPress={handleSubmitComment}
            disabled={!newComment.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.WHITE} />
            ) : (
              <MaterialCommunityIcons name="send" size={20} color={colors.WHITE} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PostDetailScreen;
