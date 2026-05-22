import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  Text,
  Image,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../contexts/ThemeContext';
import { ModernCard } from '../components/ModernCard';
import { ModernPostCard } from '../components/ModernPostCard';
import { ModernAvatar } from '../components/ModernAvatar';
import { ScreenHeader } from '../components/ScreenHeader';
import { PostSkeleton } from '../components/Skeleton';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';
import { postService, Post } from '../services/postService';
import { useAuth } from '../contexts/AuthContext';
import * as Haptics from 'expo-haptics';

interface ModernFeedScreenProps {
  onCreatePost?: () => void;
  onNotificationPress?: () => void;
  onMessagePress?: () => void;
  onProfilePress?: () => void;
  onPostPress?: (postId: string) => void;
  onAuthorPress?: (authorId: string) => void;
  onMoreMenuPress?: () => void;
}

export const ModernFeedScreen = ({
  onCreatePost,
  onNotificationPress,
  onMessagePress,
  onProfilePress,
  onPostPress,
  onAuthorPress,
  onMoreMenuPress,
}: ModernFeedScreenProps) => {
  console.log('[ModernFeedScreen] Component mounted/updated with props:', {
    hasOnCreatePost: !!onCreatePost,
    hasOnPostPress: !!onPostPress,
    hasOnAuthorPress: !!onAuthorPress,
    hasOnMoreMenuPress: !!onMoreMenuPress,
  });

  const { colors } = useTheme();
  const auth = useAuth();
  const user = auth?.user || null;
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0.92],
    extrapolate: 'clamp',
  });

  const styles = useMemo(() => {
    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: colors.primaryBackground,
      },
      createPostCard: {
        marginHorizontal: SPACING.SCREEN_PADDING,
        marginTop: SPACING.PADDING_DEFAULT,
        marginBottom: SPACING.CARD_MARGIN,
      },
      createPostContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.MD,
      },
      createPostInput: {
        flex: 1,
        paddingHorizontal: SPACING.PADDING_DEFAULT,
        paddingVertical: SPACING.PADDING_DEFAULT,
        backgroundColor: colors.primaryBackground,
        borderRadius: BORDER_RADIUS.BUTTON,
        color: colors.textTertiary,
        fontSize: TYPOGRAPHY.body.fontSize,
      },
      createPostActions: {
        flexDirection: 'row',
        gap: SPACING.SM,
        paddingHorizontal: SPACING.PADDING_DEFAULT,
        paddingTop: SPACING.PADDING_DEFAULT,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        marginTop: SPACING.PADDING_DEFAULT,
      },
      actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.PADDING_DEFAULT,
        borderRadius: BORDER_RADIUS.BUTTON,
      },
      actionButtonText: {
        fontSize: TYPOGRAPHY.body.fontSize,
        fontWeight: TYPOGRAPHY.subheading.fontWeight,
        marginLeft: SPACING.SM,
      },
      postsList: {
        paddingHorizontal: SPACING.SCREEN_PADDING,
        paddingTop: 4,
      },
      emptyContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: SPACING.XL * 3,
        paddingHorizontal: SPACING.SCREEN_PADDING,
      },
      emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.primaryPale,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.LG,
      },
      emptyTitle: {
        fontSize: TYPOGRAPHY.h3.fontSize,
        fontWeight: TYPOGRAPHY.h3.fontWeight,
        color: colors.text,
        marginBottom: SPACING.SM,
        textAlign: 'center',
      },
      emptySubtitle: {
        fontSize: TYPOGRAPHY.body.fontSize,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
      },
      storyCard: {
        width: 90,
        height: 130,
        borderRadius: BORDER_RADIUS.DEFAULT,
        marginRight: SPACING.MD,
        overflow: 'hidden',
        backgroundColor: colors.card,
      },
      storyImage: {
        width: '100%',
        height: '100%',
      },
      storyOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'space-between',
        padding: SPACING.SM,
      },
      storyAddButton: {
        width: 32,
        height: 32,
        borderRadius: BORDER_RADIUS.FULL,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginTop: 'auto',
        marginBottom: 4,
        borderWidth: 2,
        borderColor: colors.card,
      },
      storyName: {
        color: colors.WHITE,
        fontSize: TYPOGRAPHY.caption.fontSize,
        fontWeight: '600',
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
      },
      loadingContainer: {
        paddingTop: SPACING.PADDING_DEFAULT,
      },
    });
  }, [colors]);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await postService.fetchPosts();
      setPosts(data);
    } catch (error) {
      console.error('Erreur chargement posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  }, []);

  const handleLike = async (postId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.liked_by_me) {
        await postService.unlikePost(postId);
      } else {
        await postService.likePost(postId);
      }

      setPosts(prev => prev.map(p =>
        p.id === postId
          ? {
              ...p,
              liked_by_me: !p.liked_by_me,
              likes_count: p.liked_by_me ? p.likes_count - 1 : p.likes_count + 1,
            }
          : p
      ));
    } catch (error) {
      console.error('Erreur like post:', error);
    }
  };

  const renderCreatePost = () => (
    <ModernCard variant="glass" shadow="subtle" style={styles.createPostCard}>
      <Pressable onPress={onCreatePost} disabled={!onCreatePost}>
        <View style={styles.createPostContent}>
          <ModernAvatar
            size="medium"
            source={user?.profile_picture ? { uri: user.profile_picture } : undefined}
            initials={user?.name ? user.name.charAt(0) : 'U'}
          />
          <View style={styles.createPostInput}>
            <Text style={{ color: colors.textTertiary }}>
              À quoi pensez-vous, {user?.name ? user.name.split(' ')[0] : 'vous'} ?
            </Text>
          </View>
        </View>
      </Pressable>
      <View style={styles.createPostActions}>
        <Pressable style={styles.actionButton} onPress={onCreatePost}>
          <MaterialCommunityIcons name="image-multiple" size={20} color={colors.success} />
          <Text style={[styles.actionButtonText, { color: colors.success }]}>Photo</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={onCreatePost}>
          <MaterialCommunityIcons name="video-plus" size={20} color={colors.accent} />
          <Text style={[styles.actionButtonText, { color: colors.accent }]}>Vidéo</Text>
        </Pressable>
      </View>
    </ModernCard>
  );    

  const handleVideoView = async (postId: string) => {
    try {
      await postService.trackVideoView(postId);
    } catch (e) {
      console.error('[ModernFeedScreen] Error tracking video view:', e);
    }
  };

  const renderPost = ({ item }: { item: Post }) => {
    return (
      <ModernPostCard
        id={item.id}
        author={{
          id: item.user_id,
          name: item.author_name,
          avatar: item.author_image ? { uri: item.author_image } : undefined,
        }}
        content={item.content}
        image={item.image_url ? { uri: item.image_url } : undefined}
        video={item.video_url ? {
          url: item.video_url,
          thumbnail: item.video_thumbnail,
          duration: item.video_duration,
          views: item.video_views,
        } : undefined}
        timestamp={postService.formatDate(item.created_at)}
        likes={item.likes_count}
        comments={item.comments_count}
        shares={item.shares_count}
        liked={item.liked_by_me}
        onLike={() => handleLike(item.id)}
        onAuthorPress={() => onAuthorPress?.(item.user_id)}
        onComment={() => onPostPress?.(item.id)}
        onShare={() => onPostPress?.(item.id)}
        onVideoView={() => handleVideoView(item.id)}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons name="post-outline" size={40} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>Aucune publication</Text>
      <Text style={styles.emptySubtitle}>
        Soyez le premier à partager quelque chose !{'\n'}
        Cliquez sur le champ ci-dessus pour créer une publication.
      </Text>
    </View>
  );

  const renderSkeletons = () => (
    <View style={styles.loadingContainer}>
      <PostSkeleton />
      <PostSkeleton />
      <PostSkeleton />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        windowSize={10}
        maxToRenderPerBatch={10}
        removeClippedSubviews={true}
        ListHeaderComponent={loading ? renderSkeletons : (
          <>
            {renderCreatePost()}
          </>
        )}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        contentContainerStyle={styles.postsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

export default ModernFeedScreen;
