import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../lib/api';

export interface VideoPickResult {
  uri: string;
  duration: number;
  fileSize: number;
  width: number;
  height: number;
  type: string;
}

export interface VideoUploadResult {
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  public_id: string;
}

const MAX_VIDEO_DURATION = 60;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

class VideoService {
  async requestMediaLibraryPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return true;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  }

  async pickVideoFromGallery(): Promise<VideoPickResult | null> {
    if (Platform.OS === 'web') {
      return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/mp4,video/quicktime,video/webm,video/3gpp';
        input.onchange = (e: any) => {
          const file = e.target.files?.[0];
          if (!file) return resolve(null);

          if (file.size > MAX_VIDEO_SIZE) {
            reject(new Error('Vidéo trop volumineuse. Taille max 100MB.'));
            return;
          }

          const video = document.createElement('video');
          video.preload = 'metadata';
          video.onloadedmetadata = () => {
            if (video.duration > MAX_VIDEO_DURATION) {
              reject(new Error(`Vidéo trop longue. Durée max ${MAX_VIDEO_DURATION}s.`));
              return;
            }
            resolve({
              uri: URL.createObjectURL(file),
              duration: video.duration,
              fileSize: file.size,
              width: video.videoWidth,
              height: video.videoHeight,
              type: file.type,
            });
          };
          video.src = URL.createObjectURL(file);
        };
        input.click();
      });
    }

    const hasPermission = await this.requestMediaLibraryPermissions();
    if (!hasPermission) {
      throw new Error('Permission refusée pour accéder à la galerie');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.duration && asset.duration > MAX_VIDEO_DURATION) {
        throw new Error(`Vidéo trop longue. Durée max ${MAX_VIDEO_DURATION}s.`);
      }
      if (asset.fileSize && asset.fileSize > MAX_VIDEO_SIZE) {
        throw new Error('Vidéo trop volumineuse. Taille max 100MB.');
      }
      return {
        uri: asset.uri,
        duration: asset.duration || 0,
        fileSize: asset.fileSize || 0,
        width: asset.width || 0,
        height: asset.height || 0,
        type: asset.type || 'video/mp4',
      };
    }
    return null;
  }

  async uploadVideo(
    videoUri: string,
    onProgress?: (progress: number) => void
  ): Promise<VideoUploadResult> {
    const formData = new FormData();
    const filename = videoUri.split('/').pop() || 'video.mp4';

    if (Platform.OS === 'web') {
      const response = await fetch(videoUri);
      const blob = await response.blob();
      formData.append('video', blob, filename);
    } else {
      (formData as any).append('video', {
        uri: videoUri,
        name: filename,
        type: 'video/mp4',
      });
    }

    const token = await AsyncStorage.getItem('@madaagri_token');
    const headers: any = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/api/upload/video`);

      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        try {
          const response = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({
              videoUrl: response.videoUrl,
              thumbnailUrl: response.thumbnailUrl,
              duration: response.duration,
              public_id: response.public_id,
            });
          } else {
            reject(new Error(response.error || 'Erreur lors de l\'upload'));
          }
        } catch (e) {
          reject(new Error('Erreur de parsing de la réponse'));
        }
      };

      xhr.onerror = () => reject(new Error('Erreur réseau lors de l\'upload'));
      xhr.ontimeout = () => reject(new Error('Timeout lors de l\'upload'));
      xhr.send(formData);
    });
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

export const videoService = new VideoService();
export default videoService;
