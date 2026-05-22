import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { videoService, VideoPickResult, VideoUploadResult } from '../services/videoService';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '../theme';

interface VideoUploaderProps {
  onVideoSelected: (result: VideoPickResult) => void;
  onVideoUploaded: (result: VideoUploadResult) => void;
  onRemove: () => void;
  selectedVideo?: VideoPickResult | null;
  uploadedVideo?: VideoUploadResult | null;
  uploadProgress?: number;
  isUploading?: boolean;
}

export const VideoUploader = ({
  onVideoSelected,
  onVideoUploaded,
  onRemove,
  selectedVideo,
  uploadedVideo,
  uploadProgress = 0,
  isUploading = false,
}: VideoUploaderProps) => {
  const { colors } = useTheme();
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const styles = StyleSheet.create({
    container: {
      marginBottom: SPACING.LG,
    },
    pickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: SPACING.PADDING_LARGE,
      borderRadius: BORDER_RADIUS.DEFAULT,
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: 'dashed',
      backgroundColor: colors.card,
      gap: SPACING.MD,
    },
    pickerButtonActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryPale,
    },
    pickerText: {
      fontSize: TYPOGRAPHY.body.fontSize,
      color: colors.textSecondary,
      fontWeight: TYPOGRAPHY.subheading.fontWeight,
    },
    previewContainer: {
      borderRadius: BORDER_RADIUS.DEFAULT,
      overflow: 'hidden',
      backgroundColor: colors.primaryBackground,
      position: 'relative',
    },
    previewPlaceholder: {
      width: '100%',
      height: 200,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.card,
    },
    removeButton: {
      position: 'absolute',
      top: SPACING.MD,
      right: SPACING.MD,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    uploadProgress: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 4,
      backgroundColor: colors.border,
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.SM,
      marginTop: SPACING.SM,
    },
    infoText: {
      fontSize: TYPOGRAPHY.caption.fontSize,
      color: colors.textSecondary,
    },
    errorText: {
      fontSize: TYPOGRAPHY.caption.fontSize,
      color: colors.error,
      marginTop: SPACING.SM,
    },
    successBadge: {
      position: 'absolute',
      bottom: SPACING.MD,
      left: SPACING.MD,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      backgroundColor: 'rgba(49, 162, 60, 0.9)',
    },
    successText: {
      color: '#FFF',
      fontSize: 11,
      fontWeight: '600',
    },
    uploadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 5,
    },
  });

  const handlePickVideo = async () => {
    try {
      setPicking(true);
      setError(null);
      const video = await videoService.pickVideoFromGallery();
      if (video) {
        onVideoSelected(video);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sélection');
    } finally {
      setPicking(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {!selectedVideo && !isUploading && (
        <Pressable
          style={({ pressed }) => [
            styles.pickerButton,
            pressed && styles.pickerButtonActive,
          ]}
          onPress={handlePickVideo}
          disabled={picking}
        >
          {picking ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <MaterialCommunityIcons name="video-plus" size={24} color={colors.primary} />
              <Text style={styles.pickerText}>Ajouter une vidéo</Text>
            </>
          )}
        </Pressable>
      )}

      {(selectedVideo || isUploading) && (
        <View style={styles.previewContainer}>
          <View style={styles.previewPlaceholder}>
            {isUploading ? (
              <View style={{ alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.infoText, { marginTop: 8 }]}>
                  Upload... {uploadProgress}%
                </Text>
              </View>
            ) : uploadedVideo ? (
              <>
                <MaterialCommunityIcons name="check-circle" size={48} color={colors.success} />
                <Text style={[styles.infoText, { marginTop: 8 }]}>
                  Vidéo prête
                </Text>
                <View style={styles.successBadge}>
                  <MaterialCommunityIcons name="check" size={12} color="#FFF" />
                  <Text style={styles.successText}>Prête</Text>
                </View>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="video" size={48} color={colors.primary} />
                <Text style={[styles.infoText, { marginTop: 8 }]}>
                  Vidéo sélectionnée
                </Text>
              </>
            )}
          </View>
          <Pressable style={styles.removeButton} onPress={onRemove}>
            <MaterialCommunityIcons name="close" size={20} color="#FFF" />
          </Pressable>
          {isUploading && (
            <View style={styles.uploadProgress}>
              <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
            </View>
          )}
        </View>
      )}

      {selectedVideo && !isUploading && !uploadedVideo && (
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.infoText}>
            Durée: {formatDuration(selectedVideo.duration)}
          </Text>
          {selectedVideo.fileSize > 0 && (
            <>
              <MaterialCommunityIcons name="harddisk" size={14} color={colors.textSecondary} />
              <Text style={styles.infoText}>
                {videoService.formatFileSize(selectedVideo.fileSize)}
              </Text>
            </>
          )}
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default VideoUploader;
