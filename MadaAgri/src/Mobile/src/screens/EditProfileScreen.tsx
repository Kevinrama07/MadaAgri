import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { ModernAvatar } from '../components/ModernAvatar';
import { ModernInput } from '../components/ModernInput';
import { ModernButton } from '../components/ModernButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';
import { updateProfile } from '../lib/api';
import { cloudinaryService } from '../services/cloudinaryService';

interface EditProfileScreenProps {
  onProfileUpdated?: () => void;
  onCancel?: () => void;
}

export const EditProfileScreen = ({
  onProfileUpdated,
  onCancel,
}: EditProfileScreenProps) => {
  const { colors } = useTheme();
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setLocation(user.location || '');
      setBio(user.bio || '');
      setProfilePicture(user.profile_picture || null);
    }
  }, [user]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    scrollContent: {
      padding: SPACING.SCREEN_PADDING,
    },
    avatarSection: {
      alignItems: 'center',
      marginBottom: SPACING.XL,
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: SPACING.MD,
    },
    editAvatarButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 36,
      height: 36,
      borderRadius: BORDER_RADIUS.AVATAR,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: colors.card,
    },
    changePhotoText: {
      fontSize: TYPOGRAPHY.body.fontSize,
      color: colors.primary,
      fontWeight: TYPOGRAPHY.subheading.fontWeight,
    },
    inputContainer: {
      marginBottom: SPACING.LG,
    },
    label: {
      fontSize: TYPOGRAPHY.body.fontSize,
      fontWeight: TYPOGRAPHY.subheading.fontWeight,
      color: colors.text,
      marginBottom: SPACING.SM,
    },
    bioInput: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: SPACING.MD,
      marginTop: SPACING.XL,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  const handleChangePhoto = async () => {
    Alert.alert(
      'Changer la photo',
      'Choisissez une option',
      [
        {
          text: 'Galerie',
          onPress: handlePickImage,
        },
        {
          text: 'Prendre une photo',
          onPress: handleTakePhoto,
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ]
    );
  };

  const handlePickImage = async () => {
    try {
      setUploading(true);
      const imageUrl = await cloudinaryService.pickAndUploadImage('profilePicture');
      if (imageUrl) {
        setProfilePicture(imageUrl);
      }
    } catch (error) {
      console.error('Erreur upload image:', error);
      Alert.alert('Erreur', 'Impossible d\'uploader l\'image');
    } finally {
      setUploading(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      setUploading(true);
      const imageUrl = await cloudinaryService.takeAndUploadPhoto('profilePicture');
      if (imageUrl) {
        setProfilePicture(imageUrl);
      }
    } catch (error) {
      console.error('Erreur photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom est requis');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Erreur', 'L\'email est requis');
      return;
    }

    try {
      setSaving(true);
      await updateProfile({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        location: location.trim() || undefined,
        bio: bio.trim() || undefined,
        profile_picture: profilePicture || undefined,
      });

      await refreshUser();
      Alert.alert('Succès', 'Profil mis à jour avec succès');
      onProfileUpdated?.();
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Modifier le profil"
        showBack={true}
        onBackPress={onCancel}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <ModernAvatar
              size="xlarge"
              source={profilePicture ? { uri: profilePicture } : undefined}
              initials={name.charAt(0) || 'U'}
            />
            <Pressable
              style={styles.editAvatarButton}
              onPress={handleChangePhoto}
              disabled={uploading}
            >
              <MaterialCommunityIcons name="camera" size={20} color="#FFF" />
            </Pressable>
          </View>
          <Pressable onPress={handleChangePhoto} disabled={uploading}>
            <Text style={styles.changePhotoText}>
              {uploading ? 'Upload...' : 'Changer la photo'}
            </Text>
          </Pressable>
        </View>

        {/* Form Fields */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nom complet *</Text>
          <ModernInput
            value={name}
            onChangeText={setName}
            placeholder="Votre nom"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email *</Text>
          <ModernInput
            value={email}
            onChangeText={setEmail}
            placeholder="votre@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Téléphone</Text>
          <ModernInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+261 XX XX XXX XX"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Localisation</Text>
          <ModernInput
            value={location}
            onChangeText={setLocation}
            placeholder="Ville, Région"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Bio</Text>
          <ModernInput
            value={bio}
            onChangeText={setBio}
            placeholder="Parlez-nous de vous..."
            multiline
            style={styles.bioInput}
          />
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <ModernButton
            title="Annuler"
            variant="outline"
            onPress={onCancel || (() => {})}
            style={{ flex: 1 }}
            disabled={saving}
          />
          <ModernButton
            title={saving ? 'Enregistrement...' : 'Enregistrer'}
            onPress={handleSave}
            style={{ flex: 1 }}
            disabled={saving || uploading}
          />
        </View>
      </ScrollView>

      {/* Loading Overlay */}
      {(uploading || saving) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: '#FFF', marginTop: SPACING.MD }}>
            {uploading ? 'Upload en cours...' : 'Enregistrement...'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default EditProfileScreen;
