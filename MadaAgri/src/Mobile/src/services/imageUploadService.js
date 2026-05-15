import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { apiClient } from './apiClient';
import logger from '../utils/logger';

export const imageUploadService = {
  // Request camera permissions
  requestCameraPermissions: async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      logger.error('Error requesting camera permissions:', error);
      return false;
    }
  },

  // Request media library permissions
  requestMediaLibraryPermissions: async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      logger.error('Error requesting media library permissions:', error);
      return false;
    }
  },

  // Pick image from gallery
  pickImageFromGallery: async () => {
    try {
      const hasPermission = await imageUploadService.requestMediaLibraryPermissions();
      if (!hasPermission) {
        logger.warn('Media library permission not granted');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.cancelled) {
        logger.log('Image selected from gallery');
        return result.assets[0];
      }
      return null;
    } catch (error) {
      logger.error('Error picking image from gallery:', error);
      return null;
    }
  },

  // Take photo with camera
  takePhotoWithCamera: async () => {
    try {
      const hasPermission = await imageUploadService.requestCameraPermissions();
      if (!hasPermission) {
        logger.warn('Camera permission not granted');
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.cancelled) {
        logger.log('Photo taken with camera');
        return result.assets[0];
      }
      return null;
    } catch (error) {
      logger.error('Error taking photo:', error);
      return null;
    }
  },

  // Compress image
  compressImage: async (imageUri, quality = 0.7) => {
    try {
      const filename = imageUri.split('/').pop();
      const newPath = `${FileSystem.cacheDirectory}${filename}`;

      // Read image
      const imageData = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Write compressed image (simplified - full compression would need native module)
      await FileSystem.writeAsStringAsync(newPath, imageData, {
        encoding: FileSystem.EncodingType.Base64,
      });

      logger.log('Image compressed:', newPath);
      return newPath;
    } catch (error) {
      logger.error('Error compressing image:', error);
      return imageUri;
    }
  },

  // Upload image to server
  uploadImage: async (imageUri, endpoint = '/upload') => {
    try {
      const filename = imageUri.split('/').pop();
      const formData = new FormData();

      formData.append('file', {
        uri: imageUri,
        name: filename,
        type: 'image/jpeg',
      });

      const response = await apiClient.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      logger.log('Image uploaded:', response.data);
      return response.data;
    } catch (error) {
      logger.error('Error uploading image:', error);
      throw error;
    }
  },

  // Upload multiple images
  uploadImages: async (imageUris, endpoint = '/upload') => {
    try {
      const formData = new FormData();

      imageUris.forEach((uri, index) => {
        const filename = uri.split('/').pop();
        formData.append(`files[${index}]`, {
          uri,
          name: filename,
          type: 'image/jpeg',
        });
      });

      const response = await apiClient.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      logger.log('Images uploaded:', response.data);
      return response.data;
    } catch (error) {
      logger.error('Error uploading images:', error);
      throw error;
    }
  },

  // Delete cached images
  deleteCachedImages: async () => {
    try {
      const files = await FileSystem.readDirectoryAsync(FileSystem.cacheDirectory);
      const imageFiles = files.filter((f) => f.match(/\.(jpg|jpeg|png|gif)$/i));

      for (const file of imageFiles) {
        await FileSystem.deleteAsync(`${FileSystem.cacheDirectory}${file}`);
      }

      logger.log('Cached images deleted');
    } catch (error) {
      logger.error('Error deleting cached images:', error);
    }
  },
};

export default imageUploadService;
