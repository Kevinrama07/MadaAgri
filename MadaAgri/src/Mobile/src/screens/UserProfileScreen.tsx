import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenHeader, Avatar, Button, Badge, PostCard } from '../components';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';
import { get } from '../lib/api';

export default function UserProfileScreen({ route, navigation }: any) {
  const { userId } = route.params;
  const { colors, spacing } = useTheme().theme;
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const userData = await get(`/api/users/${userId}`);
      const userPosts = await get(`/api/posts/user/${userId}`);
      setUser(userData.user);
      setPosts(userPosts.posts || []);
      setIsFollowing(userData.isFollowing || false);
    } catch (error: any) {
      Alert.alert('Erreur', error?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await get(`/api/network/follows/${userId}`).then(() => setIsFollowing(false));
      } else {
        await get(`/api/network/follows/${userId}`).then(() => setIsFollowing(true));
      }
    } catch (error: any) {
      Alert.alert('Erreur', error?.message || 'Une erreur est survenue');
    }
  };

  const handleMessage = () => {
    if (userId) {
      navigation.navigate('ChatDetail', {
        userId,
        participant: {
          id: userId,
          name: user?.display_name || user?.email || 'Utilisateur',
          avatar: user?.profile_image_url ? { uri: user.profile_image_url } : undefined,
          online: user?.is_online || false,
        },
      });
    }
  };

  if (loading || !user) {
    return (
      <SafeAreaView edges={["left", "right", "bottom"]} style={{ flex: 1, backgroundColor: colors.primaryBackground }}>
        <ScreenHeader title="Chargement..." showBack onBackPress={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    coverImage: {
      width: '100%',
      height: 200,
      backgroundColor: colors.secondaryBackground,
    },
    profileHeader: {
      paddingHorizontal: spacing.SCREEN_PADDING,
      paddingBottom: spacing.PADDING_LARGE,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    avatarContainer: {
      marginTop: -50,
      marginBottom: spacing.MARGIN_DEFAULT,
      alignItems: 'center',
    },
    avatarFrame: {
      padding: 4,
      backgroundColor: colors.card,
      borderRadius: BORDER_RADIUS.FULL,
    },
    userName: {
      fontSize: 20, // TYPOGRAPHY.h2.fontSize
      fontWeight: '700' as const,
      color: colors.text,
      textAlign: 'center',
      marginTop: spacing.MARGIN_DEFAULT,
    },
    userRole: {
      fontSize: 14, // TYPOGRAPHY.body.fontSize
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.MARGIN_SMALL,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: spacing.PADDING_LARGE,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: spacing.MARGIN_LARGE,
    },
    stat: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 18, // TYPOGRAPHY.h3.fontSize
      fontWeight: '700' as const,
      color: colors.primary,
    },
    statLabel: {
      fontSize: 11, // TYPOGRAPHY.caption.fontSize
      color: colors.textTertiary,
      marginTop: spacing.SM,
    },
    actionsContainer: {
      flexDirection: 'row',
      gap: spacing.MARGIN_DEFAULT,
      marginTop: spacing.MARGIN_LARGE,
    },
    bioSection: {
      padding: spacing.SCREEN_PADDING,
    },
    bioText: {
      fontSize: 14, // TYPOGRAPHY.body.fontSize
      color: colors.textSecondary,
      lineHeight: 20,
    },
    tabsContainer: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingHorizontal: spacing.SCREEN_PADDING,
    },
    tabButton: {
      flex: 1,
      paddingVertical: spacing.PADDING_DEFAULT,
      alignItems: 'center',
      borderBottomWidth: 3,
      borderBottomColor: 'transparent',
    },
    activeTab: {
      borderBottomColor: colors.primary,
    },
    tabText: {
      fontSize: 14, // TYPOGRAPHY.body.fontSize
      fontWeight: '500' as const,
      color: colors.textSecondary,
    },
    activeTabText: {
      color: colors.primary,
    },
  });

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.container}>
      <ScreenHeader
        title={user?.display_name || 'Profil'}
        showBack
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView>
        {/* Cover */}
        <Image
          source={{ uri: user?.cover_image || 'https://via.placeholder.com/400x200' }}
          style={styles.coverImage}
        />

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarFrame}>
              <Avatar
                size="xlarge"
                source={user?.profile_image_url ? { uri: user.profile_image_url } : undefined}
                initials={user?.display_name?.substring(0, 2) || 'N/A'}
              />
            </View>
          </View>

          <Text style={styles.userName}>{user?.display_name}</Text>
          <Text style={styles.userRole}>
            {user?.role === 'farmer' ? '🌾 Agriculteur' : '🛒 Client'}
          </Text>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{posts.length}</Text>
              <Text style={styles.statLabel}>Publications</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{user?.followers_count || 0}</Text>
              <Text style={styles.statLabel}>Abonnés</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{user.following_count || 0}</Text>
              <Text style={styles.statLabel}>Abonnements</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <Button
              title={isFollowing ? 'Abonné' : 'Suivre'}
              variant={isFollowing ? 'secondary' : 'primary'}
              onPress={handleFollow}
              icon={isFollowing ? 'check' : 'account-plus'}
              style={{ flex: 1 }}
            />
            <Button
              title="Message"
              variant="secondary"
              onPress={handleMessage}
              icon="message"
              style={{ flex: 1 }}
            />
          </View>

          {/* Bio */}
          {user.bio && (
            <View style={styles.bioSection}>
              <Text style={styles.bioText}>{user.bio}</Text>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'posts' && styles.activeTab]}
            onPress={() => setActiveTab('posts')}
          >
            <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
              Publications
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'about' && styles.activeTab]}
            onPress={() => setActiveTab('about')}
          >
            <Text style={[styles.tabText, activeTab === 'about' && styles.activeTabText]}>
              À propos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Posts */}
        {activeTab === 'posts' && (
          <View style={{ paddingHorizontal: spacing.SCREEN_PADDING }}>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                author={post.author}
                content={post.content}
                image={post.image_url}
                timestamp={post.created_at}
                likes={post.likes_count}
                comments={post.comments_count}
                shares={post.shares_count}
                liked={post.user_likes}
                onLike={() => {}}
                onComment={() => {}}
                onShare={() => {}}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
