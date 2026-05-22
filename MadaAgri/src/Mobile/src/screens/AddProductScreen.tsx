import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Text,
  Alert,
  ActivityIndicator,
  Image,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { ScreenHeader } from '../components/ScreenHeader';
import { ModernButton } from '../components/ModernButton';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';
import { createProduct } from '../lib/api';
import { cloudinaryService } from '../services/cloudinaryService';

interface AddProductScreenProps {
  onProductAdded: () => void;
  onCancel: () => void;
}

export const AddProductScreen = ({
  onProductAdded,
  onCancel,
}: AddProductScreenProps) => {
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    scrollContent: {
      padding: SPACING.SCREEN_PADDING,
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
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BORDER_RADIUS.DEFAULT,
      padding: SPACING.PADDING_DEFAULT,
      fontSize: TYPOGRAPHY.body.fontSize,
      color: colors.text,
      backgroundColor: colors.card,
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    imageContainer: {
      marginBottom: SPACING.LG,
    },
    imagePreview: {
      width: '100%',
      height: 200,
      borderRadius: BORDER_RADIUS.DEFAULT,
      backgroundColor: colors.primaryBackground,
      marginBottom: SPACING.MD,
    },
    uploadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.SM,
      padding: SPACING.PADDING_DEFAULT,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BORDER_RADIUS.DEFAULT,
      borderStyle: 'dashed',
    },
    uploadButtonText: {
      fontSize: TYPOGRAPHY.body.fontSize,
      color: colors.textSecondary,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: SPACING.MD,
      marginTop: SPACING.XL,
    },
  });

  const handlePickImage = async () => {
    try {
      setUploading(true);
      const imageUrl = await cloudinaryService.pickAndUploadImage('productImage');
      if (imageUrl) {
        setImageUri(imageUrl);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'uploader l\'image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !price || !stock) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs requis');
      return;
    }

    try {
      setSaving(true);
      await createProduct({
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        quantity: parseInt(stock),
        category: category.trim() || undefined,
        image_url: imageUri || undefined,
      });

      Alert.alert('Succès', 'Produit ajouté avec succès');
      onProductAdded();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter le produit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.container}>
      <ScreenHeader
        title="Ajouter un Produit"
        showBack={true}
        onBackPress={onCancel}
        showMenu={false}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Titre *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Ex: Riz blanc premium"
            placeholderTextColor={colors.placeholder}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Décrivez votre produit..."
            placeholderTextColor={colors.placeholder}
            multiline
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Prix (Ar) *</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="Ex: 50000"
            placeholderTextColor={colors.placeholder}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Stock *</Text>
          <TextInput
            style={styles.input}
            value={stock}
            onChangeText={setStock}
            placeholder="Ex: 100"
            placeholderTextColor={colors.placeholder}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Catégorie</Text>
          <TextInput
            style={styles.input}
            value={category}
            onChangeText={setCategory}
            placeholder="Ex: Céréales"
            placeholderTextColor={colors.placeholder}
          />
        </View>

        <View style={styles.imageContainer}>
          <Text style={styles.label}>Image</Text>
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          )}
          <Pressable style={styles.uploadButton} onPress={handlePickImage} disabled={uploading}>
            <MaterialCommunityIcons
              name="image-plus"
              size={24}
              color={colors.textSecondary}
            />
            <Text style={styles.uploadButtonText}>
              {uploading ? 'Upload...' : imageUri ? 'Changer l\'image' : 'Ajouter une image'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.buttonContainer}>
          <ModernButton
            title="Annuler"
            variant="outline"
            onPress={onCancel}
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
    </SafeAreaView>
  );
};

export default AddProductScreen;
