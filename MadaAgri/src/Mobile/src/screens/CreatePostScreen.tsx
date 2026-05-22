import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { ModernAvatar } from '../components/ModernAvatar';
import { ModernButton } from '../components/ModernButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { VideoUploader } from '../components/VideoUploader';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';
import { postService } from '../services/postService';
import { cloudinaryService } from '../services/cloudinaryService';
import { videoService, VideoPickResult, VideoUploadResult } from '../services/videoService';

interface CreatePostScreenProps {
  navigation?: any;
  route?: any;
  onPostCreated?: () => void;
  onCancel?: () => void;
}

export const CreatePostScreen = ({
  navigation,
  route,
  onPostCreated,
  onCancel,
}: CreatePostScreenProps) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoPickResult | null>(null);
  const [uploadedVideo, setUploadedVideo] = useState<VideoUploadResult | null>(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoUploading, setVideoUploading] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    scrollContent: {
      padding: SPACING.SCREEN_PADDING,
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.MD,
      marginBottom: SPACING.LG,
    },
    userName: {
      fontSize: TYPOGRAPHY.subheading.fontSize,
      fontWeight: TYPOGRAPHY.subheading.fontWeight,
      color: colors.text,
    },
    textInput: {
      fontSize: TYPOGRAPHY.body.fontSize,
      color: colors.text,
      minHeight: 150,
      textAlignVertical: 'top',
      marginBottom: SPACING.LG,
    },
    imagePreview: {
      width: '100%',
      height: 250,
      borderRadius: BORDER_RADIUS.DEFAULT,
      marginBottom: SPACING.LG,
      backgroundColor: colors.primaryBackground,
    },
    removeImageButton: {
      position: 'absolute',
      top: SPACING.MD,
      right: SPACING.MD,
      width: 32,
      height: 32,
      borderRadius: BORDER_RADIUS.AVATAR,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionsContainer: {
      flexDirection: 'row',
      gap: SPACING.MD,
      marginBottom: SPACING.LG,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: SPACING.PADDING_DEFAULT,
      borderRadius: BORDER_RADIUS.BUTTON,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      gap: SPACING.SM,
    },
    actionButtonText: {
      fontSize: TYPOGRAPHY.body.fontSize,
      fontWeight: TYPOGRAPHY.subheading.fontWeight,
      color: colors.text,
    },
    publishButton: {
      marginTop: SPACING.LG,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  const handlePickImage = async () => {
    try {
      const imageUrl = await cloudinaryService.pickAndUploadImage('postImage');
      if (imageUrl) {
        setImageUri(imageUrl);
      }
    } catch (error) {
      console.error('Erreur sélection image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const imageUrl = await cloudinaryService.takeAndUploadPhoto('postImage');
      if (imageUrl) {
        setImageUri(imageUrl);
      }
    } catch (error) {
      console.error('Erreur photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    }
  };

  const handleRemoveImage = () => {
    setImageUri(null);
  };

  const handleVideoSelected = (video: VideoPickResult) => {
    setSelectedVideo(video);
    setImageUri(null);
  };

  const handleVideoRemoved = () => {
    setSelectedVideo(null);
    setUploadedVideo(null);
    setVideoUploadProgress(0);
  };

  const handleUploadVideo = async () => {
    if (!selectedVideo) return;

    try {
      setVideoUploading(true);
      setVideoUploadProgress(0);
      const result = await videoService.uploadVideo(
        selectedVideo.uri,
        (progress) => setVideoUploadProgress(progress)
      );
      setUploadedVideo(result);
      Alert.alert('Succès', 'Vidéo uploadée avec succès');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Erreur lors de l\'upload de la vidéo');
      setVideoUploading(false);
    }
  };

  const handlePublish = async () => {
    if (!content.trim() && !imageUri && !selectedVideo) {
      Alert.alert('Erreur', 'Veuillez ajouter du contenu, une image ou une vidéo');
      return;
    }

    try {
      setPosting(true);

      let uploadedImageUrl = imageUri;
      let videoUrl = uploadedVideo?.videoUrl;
      let videoThumbnail = uploadedVideo?.thumbnailUrl;
      let videoDuration = uploadedVideo?.duration || selectedVideo?.duration;

      // Upload image si locale
      if (imageUri && imageUri.startsWith('file://')) {
        setUploading(true);
        try {
          const result = await cloudinaryService.uploadImage(imageUri, 'postImage');
          uploadedImageUrl = result.secure_url;
        } catch (uploadError: any) {
          Alert.alert('Erreur', 'Impossible d\'uploader l\'image: ' + uploadError.message);
          return;
        } finally {
          setUploading(false);
        }
      }

      // Upload video si sélectionnée mais pas encore uploadée
      if (selectedVideo && !uploadedVideo) {
        setVideoUploading(true);
        try {
          const result = await videoService.uploadVideo(
            selectedVideo.uri,
            (progress) => setVideoUploadProgress(progress)
          );
          videoUrl = result.videoUrl;
          videoThumbnail = result.thumbnailUrl;
          videoDuration = result.duration;
        } catch (uploadError: any) {
          Alert.alert('Erreur', 'Impossible d\'uploader la vidéo: ' + uploadError.message);
          return;
        } finally {
          setVideoUploading(false);
        }
      }

      await postService.createPost({
        content: content.trim(),
        image_url: uploadedImageUrl || undefined,
        video_url: videoUrl || undefined,
        video_thumbnail: videoThumbnail || undefined,
        video_duration: videoDuration || undefined,
      });

      Alert.alert('Succès', 'Publication créée avec succès', [
        {
          text: 'OK',
          onPress: () => {
            onPostCreated?.();
            // Rediriger vers l'accueil (Feed)
            if (navigation) {
              navigation.navigate('MainTabs', { screen: 'Feed' });
            }
          },
        },
      ]);
    } catch (error: any) {
      console.error('[CreatePost] Erreur création post:', error);
      Alert.alert('Erreur', 'Impossible de créer la publication: ' + error.message);
    } finally {
      setPosting(false);
    }
  };

  const canPublish = (content.trim() || imageUri || selectedVideo) && !posting && !uploading && !videoUploading;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScreenHeader
        title="Créer une publication"
        showBack={true}
        onBackPress={() => {
          if (onCancel) {
            onCancel();
          } else if (navigation) {
            navigation.goBack();
          }
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Info */}
        <View style={styles.userInfo}>
          <ModernAvatar
            size="medium"
            source={user?.profile_picture ? { uri: user.profile_picture } : undefined}
            initials={user?.name?.charAt(0) || 'U'}
          />
          <Text style={styles.userName}>{user?.name || 'Utilisateur'}</Text>
        </View>

        {/* Text Input */}
        <TextInput
          style={styles.textInput}
          placeholder="À quoi pensez-vous ?"
          placeholderTextColor={colors.placeholder}
          value={content}
          onChangeText={setContent}
          multiline
          autoFocus
        />

        {/* Image Preview */}
        {imageUri && (
          <View>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            <Pressable
              style={styles.removeImageButton}
              onPress={handleRemoveImage}
            >
              <MaterialCommunityIcons name="close" size={20} color="#FFF" />
            </Pressable>
          </View>
        )}

        {/* Video Uploader */}
        <VideoUploader
          onVideoSelected={handleVideoSelected}
          onVideoUploaded={(result) => setUploadedVideo(result)}
          onRemove={handleVideoRemoved}
          selectedVideo={selectedVideo}
          uploadedVideo={uploadedVideo}
          uploadProgress={videoUploadProgress}
          isUploading={videoUploading}
        />

        {/* Upload Video Button */}
        {selectedVideo && !uploadedVideo && !videoUploading && (
          <ModernButton
            title="Uploader la vidéo"
            onPress={handleUploadVideo}
            style={{ marginBottom: SPACING.LG }}
          />
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Pressable
            style={styles.actionButton}
            onPress={handlePickImage}
          >
            <MaterialCommunityIcons
              name="image"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.actionButtonText}>Galerie</Text>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={handleTakePhoto}
          >
            <MaterialCommunityIcons
              name="camera"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.actionButtonText}>Photo</Text>
          </Pressable>
        </View>

        {/* Publish Button */}
        <ModernButton
          title={posting ? 'Publication...' : 'Publier'}
          onPress={handlePublish}
          disabled={!canPublish}
          style={styles.publishButton}
        />
      </ScrollView>

      {/* Loading Overlay */}
      {(uploading || videoUploading || posting) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: '#FFF', marginTop: SPACING.MD }}>
            {videoUploading ? `Upload vidéo ${videoUploadProgress}%...` : uploading ? 'Upload en cours...' : 'Publication...'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default CreatePostScreen;
