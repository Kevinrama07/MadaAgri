import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  Text,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { ModernCard } from '../components/ModernCard';
import { ModernButton } from '../components/ModernButton';
import { ModernPostCard } from '../components/ModernPostCard';
import { ScreenHeader } from '../components/ScreenHeader';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';
import { cloudinaryService } from '../services/cloudinaryService';
import { updateProfile, dataApi } from '../lib/api';
import { postService } from '../services/postService';

type ToastType = 'success' | 'error' | 'loading';

interface ToastState {
  visible: boolean;
  type: ToastType;
  message: string;
}

const TOAST_CONFIG: Record<ToastType, { icon: string; bg: string; color: string }> = {
  success: { icon: 'check-circle',    bg: '#1B5E20', color: '#fff' },
  error:   { icon: 'alert-circle',    bg: '#B71C1C', color: '#fff' },
  loading: { icon: 'cloud-upload',    bg: '#1565C0', color: '#fff' },
};

function Toast({ toast }: { toast: ToastState }) {
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (toast.visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0,   useNativeDriver: true, friction: 8, tension: 120 }),
        Animated.timing(opacity,    { toValue: 1,   useNativeDriver: true, duration: 200 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -80, useNativeDriver: true, duration: 250 }),
        Animated.timing(opacity,    { toValue: 0,   useNativeDriver: true, duration: 200 }),
      ]).start();
    }
  }, [toast.visible]);

  const cfg = TOAST_CONFIG[toast.type];

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        toastStyles.container,
        { backgroundColor: cfg.bg, transform: [{ translateY }], opacity },
      ]}
    >
      <MaterialCommunityIcons name={cfg.icon as any} size={20} color={cfg.color} />
      {toast.type === 'loading' && (
        <ActivityIndicator size="small" color={cfg.color} style={{ marginLeft: 8 }} />
      )}
      <Text style={[toastStyles.text, { color: cfg.color }]}>{toast.message}</Text>
    </Animated.View>
  );
}

const toastStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    zIndex: 999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
});

function useToast() {
  const [toast, setToast] = useState<ToastState>({ visible: false, type: 'success', message: '' });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((type: ToastType, message: string, duration = 3000) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ visible: true, type, message });
    if (type !== 'loading') {
      timerRef.current = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, duration);
    }
  }, []);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return { toast, show, hide };
}

interface ModernProfileScreenProps {
  isOwnProfile?: boolean;
  onEditPress?: () => void;
  onFollowPress?: () => void;
  onMessagePress?: () => void;
  onSettingsPress?: () => void;
  onMoreMenuPress?: () => void;
  onPostPress?: (postId: string) => void;
  onAuthorPress?: (authorId: string) => void;
}

export const ModernProfileScreen = ({
  isOwnProfile = true,
  onEditPress,
  onFollowPress,
  onMessagePress,
  onSettingsPress,
  onMoreMenuPress,
  onPostPress,
  onAuthorPress,
}: ModernProfileScreenProps) => {
  const { colors } = useTheme();
  const { user, refreshUser } = useAuth();
  const { toast, show: showToast, hide: hideToast } = useToast();

  const [isFollowing, setIsFollowing] = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [avatarUri,   setAvatarUri]   = useState<string | null>(user?.profile_picture || null);
  const [userPosts,   setUserPosts]   = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  useEffect(() => {
    if (user?.profile_picture) setAvatarUri(user.profile_picture);
  }, [user?.profile_picture]);

  // Charger les publications de l'utilisateur
  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!user?.id) return;
      
      try {
        setLoadingPosts(true);
        const posts = await dataApi.fetchUserPosts(user.id);
        setUserPosts(posts || []);
      } catch (error) {
        console.error('[ProfileScreen] Error fetching user posts:', error);
        setUserPosts([]);
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchUserPosts();
  }, [user?.id]);

  const displayUser = useMemo(() => ({
    id:        user?.id            || '',
    name:      user?.name          || user?.display_name || 'Utilisateur',
    bio:       user?.bio           || '',
    location:  user?.location      || user?.region_name  || 'Madagascar',
    verified:  user?.verified      || false,
    followers: user?.followers_count || user?.followers || 0,
    following: user?.following_count || user?.following || 0,
    posts:     user?.posts_count || user?.posts || 0,
    role:      user?.role          || 'client',
  }), [user]);

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleAvatarPress = useCallback(() => {
    if (!isOwnProfile) return;
    Alert.alert('Photo de profil', 'Choisissez une option', [
      { text: 'Galerie',           onPress: pickFromGallery },
      { text: 'Prendre une photo', onPress: pickFromCamera  },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }, [isOwnProfile]);

  const uploadAndSave = useCallback(async (localUri: string) => {
    const previousUri = avatarUri;
    try {
      setUploading(true);
      showToast('loading', 'Upload en cours…');

      setAvatarUri(localUri);

      const result   = await cloudinaryService.uploadImage(localUri, 'profilePicture');
      const cloudUrl = result.secure_url;
      setAvatarUri(cloudUrl);

      await updateProfile({ profile_picture: cloudUrl });

      await refreshUser();

      hideToast();
      showToast('success', 'Photo de profil mise à jour !');
    } catch (err: any) {
      console.error('[ProfileScreen] Erreur upload avatar:', err);
      setAvatarUri(previousUri);
      hideToast();
      showToast('error', err.message || 'Échec de la mise à jour');
    } finally {
      setUploading(false);
    }
  }, [avatarUri, refreshUser, showToast, hideToast]);

  const pickFromGallery = useCallback(async () => {
    try {
      const image = await cloudinaryService.pickImageFromGallery();
      if (image?.uri) await uploadAndSave(image.uri);
    } catch (err: any) {
      showToast('error', err.message || 'Impossible d\'accéder à la galerie');
    }
  }, [uploadAndSave, showToast]);

  const pickFromCamera = useCallback(async () => {
    try {
      const image = await cloudinaryService.takePhotoWithCamera();
      if (image?.uri) await uploadAndSave(image.uri);
    } catch (err: any) {
      showToast('error', err.message || 'Impossible d\'accéder à la caméra');
    }
  }, [uploadAndSave, showToast]);

  const handleFollow = useCallback(() => {
    setIsFollowing((v) => !v);
    onFollowPress?.();
  }, [onFollowPress]);

  const handleLike = async (postId: string) => {
    try {
      const post = userPosts.find(p => p.id === postId);
      if (!post) return;

      if (post.liked_by_me) {
        await postService.unlikePost(postId);
      } else {
        await postService.likePost(postId);
      }

      setUserPosts(prev => prev.map(p => 
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

  // ── Styles ────────────────────────────────────────────────────────────────
  const styles = useMemo(() => StyleSheet.create({
    container:     { flex: 1, backgroundColor: colors.primaryBackground },
    gradientHeader: { width: '100%', height: 140, paddingTop: 60 },
    profileHeader: { paddingHorizontal: SPACING.SCREEN_PADDING, marginTop: -40, marginBottom: SPACING.MD },
    profileInfo:   { alignItems: 'center', paddingTop: SPACING.SM },

    avatarWrapper: { position: 'relative', marginBottom: SPACING.MD },
    avatarImage: {
      width: 110, height: 110, borderRadius: 55,
      borderWidth: 4, borderColor: colors.card,
      backgroundColor: colors.primaryPale,
    },
    avatarPlaceholder: {
      width: 110, height: 110, borderRadius: 55,
      borderWidth: 4, borderColor: colors.card,
      backgroundColor: colors.primaryPale,
      alignItems: 'center', justifyContent: 'center',
    },
    avatarInitial: { fontSize: 42, fontWeight: '700', color: colors.primary },
    cameraOverlay: {
      position: 'absolute', bottom: 2, right: 2,
      width: 34, height: 34, borderRadius: 17,
      backgroundColor: colors.primary,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 3, borderColor: colors.card,
    },
    uploadingOverlay: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      borderRadius: 55, backgroundColor: 'rgba(0,0,0,0.45)',
      alignItems: 'center', justifyContent: 'center',
    },

    name: {
      fontSize: 24, fontWeight: '700',
      color: colors.text, marginBottom: SPACING.XS,
    },
    roleBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 14, paddingVertical: 6,
      backgroundColor: colors.primaryPale, borderRadius: BORDER_RADIUS.FULL,
      marginBottom: SPACING.SM,
    },
    roleText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
    bio: {
      fontSize: 15, color: colors.textSecondary, lineHeight: 22,
      textAlign: 'center', marginBottom: SPACING.SM, paddingHorizontal: SPACING.LG,
    },
    location:     { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.PADDING_DEFAULT },
    locationText: { fontSize: TYPOGRAPHY.body.fontSize, color: colors.textTertiary, marginLeft: SPACING.XS },
    statsContainer: {
      flexDirection: 'row', justifyContent: 'space-around', width: '100%',
      paddingVertical: SPACING.LG,
      borderTopWidth: 1, borderBottomWidth: 1,
      borderColor: colors.border, marginBottom: SPACING.LG,
    },
    stat:       { alignItems: 'center' },
    statNumber: { fontSize: 22, fontWeight: '700', color: colors.text },
    statLabel:  { fontSize: 13, color: colors.textTertiary, marginTop: 4 },
    actionsRow: { flexDirection: 'row', gap: SPACING.MD, width: '100%' },
    actionBtn:  { flex: 1 },
    settingsBtn: {
      width: 40, height: 40, borderRadius: BORDER_RADIUS.AVATAR,
      backgroundColor: colors.primaryBackground,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: colors.border,
    },
    contentContainer: {
      paddingHorizontal: SPACING.SCREEN_PADDING,
      paddingTop: SPACING.MD,
    },
    sectionTitle: {
      fontSize: TYPOGRAPHY.h3.fontSize, fontWeight: TYPOGRAPHY.h3.fontWeight,
      color: colors.text, marginBottom: SPACING.MD,
    },
    postsList: {
      paddingBottom: SPACING.SCREEN_PADDING_BOTTOM,
    },
    emptyPosts:     { alignItems: 'center', paddingVertical: SPACING.XL },
    emptyPostsText: { fontSize: TYPOGRAPHY.body.fontSize, color: colors.textTertiary, marginTop: SPACING.SM },
  }), [colors]);

  // ── Render ────────────────────────────────────────────────────────────────
  const renderPost = ({ item }: { item: any }) => (
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
      onComment={() => onPostPress?.(item.id)}
      onShare={() => onPostPress?.(item.id)}
    />
  );

  const renderHeader = () => (
    <>
      {/* Gradient Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryPale]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      />

      {/* Card profil */}
      <View style={styles.profileHeader}>
        <ModernCard shadow="subtle">
          <View style={styles.profileInfo}>

            {/* Avatar cliquable */}
            <Pressable
              style={styles.avatarWrapper}
              onPress={handleAvatarPress}
              disabled={!isOwnProfile || uploading}
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {displayUser.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              {uploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator color="#fff" size="small" />
                </View>
              )}

              {isOwnProfile && !uploading && (
                <View style={styles.cameraOverlay}>
                  <MaterialCommunityIcons name="camera" size={16} color="#fff" />
                </View>
              )}
            </Pressable>

            {/* Nom */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.XS }}>
              <Text style={styles.name}>{displayUser.name}</Text>
              {displayUser.verified && (
                <MaterialCommunityIcons
                  name="check-circle" size={18} color={colors.accent}
                  style={{ marginLeft: SPACING.XS }}
                />
              )}
            </View>

            {/* Badge rôle */}
            <View style={styles.roleBadge}>
              <MaterialCommunityIcons
                name={displayUser.role === 'farmer' ? 'leaf' : 'account'}
                size={14} color={colors.primary}
              />
              <Text style={styles.roleText}>
                {displayUser.role === 'farmer' ? 'Agriculteur' : 'Client'}
              </Text>
            </View>

            {!!displayUser.bio && <Text style={styles.bio}>{displayUser.bio}</Text>}

            {!!displayUser.location && (
              <View style={styles.location}>
                <MaterialCommunityIcons name="map-marker" size={14} color={colors.textTertiary} />
                <Text style={styles.locationText}>{displayUser.location}</Text>
              </View>
            )}

            {/* Stats */}
            <View style={styles.statsContainer}>
              {[
                { value: displayUser.posts,    label: 'Publications' },
                { value: displayUser.followers, label: 'Abonnés'      },
                { value: displayUser.following, label: 'Abonnements'  },
              ].map((s) => (
                <View key={s.label} style={styles.stat}>
                  <Text style={styles.statNumber}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Actions */}
            <View style={styles.actionsRow}>
              {isOwnProfile ? (
                <>
                  <View style={styles.actionBtn}>
                    <ModernButton
                      title="Modifier le profil"
                      onPress={onEditPress || (() => {})}
                      variant="primary"
                    />
                  </View>
                  <Pressable style={styles.settingsBtn} onPress={onSettingsPress}>
                    <MaterialCommunityIcons name="cog" size={20} color={colors.text} />
                  </Pressable>
                </>
              ) : (
                <>
                  <View style={styles.actionBtn}>
                    <ModernButton
                      title={isFollowing ? 'Suivi' : 'Suivre'}
                      onPress={handleFollow}
                      variant={isFollowing ? 'outline' : 'primary'}
                    />
                  </View>
                  <View style={styles.actionBtn}>
                    <ModernButton
                      title="Message"
                      onPress={onMessagePress || (() => {})}
                      variant="outline"
                    />
                  </View>
                </>
              )}
            </View>

          </View>
        </ModernCard>
      </View>

      {/* Titre Publications */}
      <View style={styles.contentContainer}>
        <Text style={styles.sectionTitle}>Publications</Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScreenHeader
        title="Profil"
        showSearch={false}
        showMenu={false}
        showMoreMenu={true}
        onMoreMenuPress={onMoreMenuPress}
        disableTopSafeArea
      />

      {/* Toast animé */}
      <Toast toast={toast} />

      <FlatList
        data={userPosts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.postsList}
        ListEmptyComponent={
          !loadingPosts ? (
            <View style={styles.emptyPosts}>
              <MaterialCommunityIcons name="post-outline" size={40} color={colors.textTertiary} />
              <Text style={styles.emptyPostsText}>Aucune publication </Text>
            </View>
          ) : (
            <View style={styles.emptyPosts}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

export default ModernProfileScreen;
