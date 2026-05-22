import React, { useState, useEffect } from 'react';
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
import { dataApi } from '../lib/api';
import { cloudinaryService } from '../services/cloudinaryService';

interface EditProductScreenProps {
  route: any;
  navigation: any;
}

export default function EditProductScreen({ route, navigation }: EditProductScreenProps) {
  const { colors } = useTheme();
  const { productId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await dataApi.getProduct(productId);
      const product = response?.data || response;
      
      setTitle(product.title || '');
      setDescription(product.description || '');
      setPrice(product.price?.toString() || '');
      setQuantity(product.quantity?.toString() || '');
      setUnit(product.unit || 'kg');
      setImageUri(product.image_url || null);
    } catch (error) {
      console.error('Erreur chargement produit:', error);
      Alert.alert('Erreur', 'Impossible de charger le produit');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

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
    if (!title.trim() || !price || !quantity) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs requis');
      return;
    }

    try {
      setSaving(true);
      await dataApi.updateProduct(productId, {
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        quantity: parseInt(quantity),
        unit: unit,
        image_url: imageUri || undefined,
      });

      Alert.alert('Succès', 'Produit modifié avec succès');
      navigation.goBack();
    } catch (error) {
      console.error('Erreur modification produit:', error);
      Alert.alert('Erreur', 'Impossible de modifier le produit');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView edges={["left", "right", "bottom"]} style={styles.container}>
        <ScreenHeader
          title="Modifier le Produit"
          showBack={true}
          onBackPress={() => navigation.goBack()}
          showMenu={false}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.container}>
      <ScreenHeader
        title="Modifier le Produit"
        showBack={true}
        onBackPress={() => navigation.goBack()}
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
          <Text style={styles.label}>Quantité *</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            placeholder="Ex: 100"
            placeholderTextColor={colors.placeholder}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Unité</Text>
          <TextInput
            style={styles.input}
            value={unit}
            onChangeText={setUnit}
            placeholder="Ex: kg"
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
            onPress={() => navigation.goBack()}
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
}
