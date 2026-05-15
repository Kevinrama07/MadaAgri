import * as ImagePicker from 'expo-image-picker';
import { API_BASE } from '../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CloudinaryUploadResult {
  url: string;
  public_id: string;
  secure_url: string;
}

class CloudinaryService {
  /**
   * Demander les permissions pour la caméra
   */
  async requestCameraPermissions(): Promise<boolean> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Demander les permissions pour la galerie
   */
  async requestMediaLibraryPermissions(): Promise<boolean> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Sélectionner une image depuis la galerie
   */
  async pickImageFromGallery(): Promise<ImagePicker.ImagePickerAsset | null> {
    const hasPermission = await this.requestMediaLibraryPermissions();
    if (!hasPermission) {
      throw new Error('Permission refusée pour accéder à la galerie');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }
    return null;
  }

  /**
   * Prendre une photo avec la caméra
   */
  async takePhotoWithCamera(): Promise<ImagePicker.ImagePickerAsset | null> {
    const hasPermission = await this.requestCameraPermissions();
    if (!hasPermission) {
      throw new Error('Permission refusée pour accéder à la caméra');
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }
    return null;
  }

  /**
   * Upload une image vers Cloudinary via le backend
   */
  async uploadImage(
    imageUri: string,
    fieldName: 'profilePicture' | 'postImage' | 'productImage' = 'postImage'
  ): Promise<CloudinaryUploadResult> {
    console.log('[CloudinaryService] uploadImage called with:', { imageUri, fieldName });
    
    try {
      const formData = new FormData();
      
      // Extraire le nom du fichier et l'extension
      const filename = imageUri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      console.log('[CloudinaryService] File info:', { filename, type });

      // Le backend attend toujours le champ "image"
      // @ts-ignore - FormData accepte ce format sur React Native
      formData.append('image', {
        uri: imageUri,
        name: filename,
        type,
      });

      console.log('[CloudinaryService] FormData created');

      // Récupérer le token d'authentification
      const token = await AsyncStorage.getItem('@madaagri_token');
      console.log('[CloudinaryService] Token retrieved:', token ? 'Yes' : 'No');
      
      const headers: any = {
        'Content-Type': 'multipart/form-data',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('[CloudinaryService] Sending request to:', `${API_BASE}/api/upload`);

      const response = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData,
        headers,
      });

      console.log('[CloudinaryService] Response status:', response.status);

      const responseText = await response.text();
      console.log('[CloudinaryService] Response text:', responseText);

      if (!response.ok) {
        let error;
        try {
          error = JSON.parse(responseText);
        } catch (e) {
          error = { message: responseText };
        }
        console.error('[CloudinaryService] Upload failed:', error);
        throw new Error(error.message || error.error || 'Erreur lors de l\'upload');
      }

      const data = JSON.parse(responseText);
      console.log('[CloudinaryService] Upload success:', data);
      
      // Le backend retourne { success: true, imageUrl: "..." }
      return {
        url: data.imageUrl,
        secure_url: data.imageUrl,
        public_id: data.file?.filename || '',
      };
    } catch (error: any) {
      console.error('[CloudinaryService] Erreur uploadImage:', error);
      console.error('[CloudinaryService] Error message:', error.message);
      console.error('[CloudinaryService] Error stack:', error.stack);
      throw error;
    }
  }

  /**
   * Upload une photo de profil
   */
  async uploadProfilePicture(imageUri: string): Promise<string> {
    const result = await this.uploadImage(imageUri, 'profilePicture');
    return result.secure_url;
  }

  /**
   * Upload une image de post
   */
  async uploadPostImage(imageUri: string): Promise<string> {
    const result = await this.uploadImage(imageUri, 'postImage');
    return result.secure_url;
  }

  /**
   * Upload une image de produit
   */
  async uploadProductImage(imageUri: string): Promise<string> {
    const result = await this.uploadImage(imageUri, 'productImage');
    return result.secure_url;
  }

  /**
   * Sélectionner et uploader une image depuis la galerie
   */
  async pickAndUploadImage(
    fieldName: 'profilePicture' | 'postImage' | 'productImage' = 'postImage'
  ): Promise<string | null> {
    try {
      const image = await this.pickImageFromGallery();
      if (!image) return null;

      // Retourner l'URI locale au lieu d'uploader immédiatement
      // L'upload se fera lors de la création du post
      return image.uri;
    } catch (error) {
      console.error('[CloudinaryService] Erreur pickAndUploadImage:', error);
      throw error;
    }
  }

  /**
   * Prendre et uploader une photo
   */
  async takeAndUploadPhoto(
    fieldName: 'profilePicture' | 'postImage' | 'productImage' = 'postImage'
  ): Promise<string | null> {
    try {
      const image = await this.takePhotoWithCamera();
      if (!image) return null;

      // Retourner l'URI locale au lieu d'uploader immédiatement
      // L'upload se fera lors de la création du post
      return image.uri;
    } catch (error) {
      console.error('[CloudinaryService] Erreur takeAndUploadPhoto:', error);
      throw error;
    }
  }
}

export const cloudinaryService = new CloudinaryService();
export default cloudinaryService;
