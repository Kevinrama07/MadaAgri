import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Pressable,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { ModernAvatar } from '../components/ModernAvatar';
import { ModernButton } from '../components/ModernButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';
import { postService } from '../services/postService';
import { cloudinaryService } from '../services/cloudinaryService';

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

  const handlePublish = async () => {
    if (!content.trim() && !imageUri) {
      Alert.alert('Erreur', 'Veuillez ajouter du contenu ou une image');
      return;
    }

    try {
      setPosting(true);
      
      let uploadedImageUrl = imageUri;
      
      // Si l'image est locale (commence par file://), l'uploader
      if (imageUri && imageUri.startsWith('file://')) {
        console.log('[CreatePost] Image locale détectée, upload en cours...', imageUri);
        setUploading(true);
        try {
          const result = await cloudinaryService.uploadImage(imageUri, 'postImage');
          uploadedImageUrl = result.secure_url;
          console.log('[CreatePost] Image uploadée:', uploadedImageUrl);
        } catch (uploadError: any) {
          console.error('[CreatePost] Erreur upload:', uploadError);
          console.error('[CreatePost] Erreur message:', uploadError.message);
          console.error('[CreatePost] Erreur stack:', uploadError.stack);
          Alert.alert('Erreur', 'Impossible d\'uploader l\'image: ' + uploadError.message);
          return;
        } finally {
          setUploading(false);
        }
      }

      console.log('[CreatePost] Création du post avec image:', uploadedImageUrl);
      await postService.createPost({
        content: content.trim(),
        image_url: uploadedImageUrl || undefined,
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

  const canPublish = (content.trim() || imageUri) && !posting && !uploading;

  return (
    <SafeAreaView style={styles.container}>
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
      {(uploading || posting) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: '#FFF', marginTop: SPACING.MD }}>
            {uploading ? 'Upload en cours...' : 'Publication...'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default CreatePostScreen;
