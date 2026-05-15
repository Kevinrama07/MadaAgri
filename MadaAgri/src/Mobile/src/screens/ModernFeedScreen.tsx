import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  RefreshControl,
  Pressable,
  Text,
  Image,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { ModernCard } from '../components/ModernCard';
import { ModernPostCard } from '../components/ModernPostCard';
import { ModernAvatar } from '../components/ModernAvatar';
import { ScreenHeader } from '../components/ScreenHeader';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';
import { postService, Post } from '../services/postService';
import { useAuth } from '../contexts/AuthContext';



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
      },
      emptyContainer: {
        flex: 1,
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
      storiesContainer: {
        marginBottom: SPACING.CARD_MARGIN,
      },
      storiesScroll: {
        paddingHorizontal: SPACING.SCREEN_PADDING,
      },
      storyCard: {
        width: 100,
        height: 150,
        borderRadius: BORDER_RADIUS.DEFAULT,
        marginRight: SPACING.MD,
        overflow: 'hidden',
        backgroundColor: colors.primaryBackground,
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
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'space-between',
        padding: SPACING.MD,
      },
      storyName: {
        color: colors.WHITE,
        fontSize: TYPOGRAPHY.caption.fontSize,
        fontWeight: TYPOGRAPHY.captionBold.fontWeight,
      },
    });
  }, [colors]);

  // Charger les posts au montage
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
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  }, []);

  const handleLike = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.liked_by_me) {
        await postService.unlikePost(postId);
      } else {
        await postService.likePost(postId);
      }

      // Mettre à jour localement
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { 
              ...p, 
              liked_by_me: !p.liked_by_me,
              likes_count: p.liked_by_me ? p.likes_count - 1 : p.likes_count + 1
            }
          : p
      ));
    } catch (error) {
      console.error('Erreur like post:', error);
    }
  };

  const renderCreatePost = () => (
    <ModernCard style={styles.createPostCard} shadow="subtle">
      <View style={styles.createPostContent}>
        <ModernAvatar 
          size="medium" 
          source={user?.profile_picture ? { uri: user.profile_picture } : undefined}
          initials={user?.name ? user.name.charAt(0) : 'U'} 
        />
        <Pressable
          style={styles.createPostInput}
          onPress={onCreatePost}
          disabled={!onCreatePost}
        >
          <Text style={{ color: colors.textTertiary }}>
            À quoi pensez-vous, {user?.name ? user.name.split(' ')[0] : 'vous'} ?
          </Text>
        </Pressable>
      </View>
    </ModernCard>
  );

  const renderPost = ({ item }: { item: Post }) => {
    console.log('[ModernFeedScreen] Rendering post:', item.id);
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
        timestamp={postService.formatDate(item.created_at)}
        likes={item.likes_count}
        comments={item.comments_count}
        shares={item.shares_count}
        liked={item.liked_by_me}
        onLike={() => handleLike(item.id)}
        onAuthorPress={() => onAuthorPress?.(item.user_id)}
        onComment={() => {
          console.log('[ModernFeedScreen] Comment clicked for post:', item.id);
          console.log('[ModernFeedScreen] onPostPress exists?', !!onPostPress);
          if (onPostPress) {
            console.log('[ModernFeedScreen] Calling onPostPress with:', item.id);
            onPostPress(item.id);
          } else {
            console.log('[ModernFeedScreen] ERROR: onPostPress is undefined!');
          }
        }}
        onShare={() => onPostPress?.(item.id)}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons name="post-outline" size={40} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>Aucune publication </Text>
      <Text style={styles.emptySubtitle}>
        Soyez le premier à partager quelque chose !{"\n"}
        Cliquez sur le champ ci-dessus pour créer une publication.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="MadaAgri"
        showSearch={true}
        showMenu={true}
        showMoreMenu={true}
        onMoreMenuPress={onMoreMenuPress}
      />

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderCreatePost}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        contentContainerStyle={styles.postsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        scrollEventThrottle={16}
      />
    </SafeAreaView>
  );
};

export default ModernFeedScreen;
