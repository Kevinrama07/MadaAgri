import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { ScreenHeader } from '../components/ScreenHeader';
import { ModernCard } from '../components/ModernCard';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';
import parcelService from '../services/parcelService';
import { dataApi } from '../lib/api';

function AnalysisResultCard({ label, value, icon, color }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <MaterialCommunityIcons name={icon} size={22} color={color || colors.primary} />
      <View style={styles.resultContent}>
        <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.resultValue, { color: colors.text }]}>{value || '—'}</Text>
      </View>
    </View>
  );
}

function SeverityBar({ label, level, maxLevel = 5 }) {
  const { colors } = useTheme();
  const colors_map = ['#22C55E', '#84CC16', '#EAB308', '#F97316', '#EF4444'];
  return (
    <View style={styles.severityRow}>
      <Text style={[styles.severityLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.severityDots}>
        {Array.from({ length: maxLevel }, (_, i) => (
          <View key={i} style={[styles.severityDot, { backgroundColor: i < level ? colors_map[i] : colors.border }]} />
        ))}
      </View>
    </View>
  );
}

export default function AnalyzeImageScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation(['common', 'dashboard']);

  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const pickImage = useCallback(async (useCamera) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission refusée', 'Autorisez l\'accès à votre ' + (useCamera ? 'caméra' : 'galerie') + ' dans les paramètres.');
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true });

    if (!result.canceled && result.assets?.[0]) {
      setImage(result.assets[0]);
      setAnalysis(null);
      setError(null);
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!image) return;

    setUploading(true);
    setError(null);

    try {
      const imageUrl = await dataApi.uploadImage(image.uri);

      setUploading(false);
      setAnalyzing(true);

      const result = await parcelService.analyzeImage(imageUrl);
      setAnalysis(result);
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'analyse');
      setUploading(false);
      setAnalyzing(false);
    }
  }, [image]);

  const resetAll = useCallback(() => {
    setImage(null);
    setAnalysis(null);
    setError(null);
    setUploading(false);
    setAnalyzing(false);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.primaryBackground }]}>
      <ScreenHeader title={t('aiAnalysis') || 'Analyse IA'} showBack onBackPress={() => navigation.goBack()} showMenu={false} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!image && !analysis && (
          <View style={styles.pickContainer}>
            <View style={[styles.pickIcon, { backgroundColor: colors.primaryPale }]}>
              <MaterialCommunityIcons name="camera" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.pickTitle, { color: colors.text }]}>
              {t('analyzeCropPhoto') || 'Analyser une culture'}
            </Text>
            <Text style={[styles.pickSubtitle, { color: colors.textSecondary }]}>
              {t('analyzeCropPhotoDesc') || 'Prenez une photo ou choisissez dans votre galerie pour identifier la culture et détecter les maladies'}
            </Text>

            <Pressable style={[styles.pickBtn, { backgroundColor: colors.primary }]} onPress={() => pickImage(true)}>
              <MaterialCommunityIcons name="camera" size={22} color="#fff" />
              <Text style={styles.pickBtnText}>{t('takePhoto') || 'Prendre une photo'}</Text>
            </Pressable>

            <Pressable style={[styles.pickBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]} onPress={() => pickImage(false)}>
              <MaterialCommunityIcons name="image" size={22} color={colors.primary} />
              <Text style={[styles.pickBtnTextAlt, { color: colors.primary }]}>{t('chooseGallery') || 'Choisir dans la galerie'}</Text>
            </Pressable>
          </View>
        )}

        {image && !analysis && (
          <View style={styles.previewContainer}>
            <Image source={{ uri: image.uri }} style={styles.previewImage} />
            <Text style={[styles.previewHint, { color: colors.textSecondary }]}>
              {image.uri?.split('/').pop()?.slice(0, 30) || 'Photo sélectionnée'}
            </Text>

            {uploading || analyzing ? (
              <View style={styles.analyzingState}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.analyzingText, { color: colors.primary }]}>
                  {uploading ? (t('uploading') || 'Téléchargement...') : (t('analyzing') || 'Analyse en cours...')}
                </Text>
              </View>
            ) : (
              <View style={styles.previewActions}>
                <Pressable style={[styles.actionBtnOut, { borderColor: colors.border }]} onPress={resetAll}>
                  <Text style={[styles.actionBtnText, { color: colors.text }]}>{t('retake') || 'Reprendre'}</Text>
                </Pressable>
                <Pressable style={[styles.actionBtnPrim, { backgroundColor: colors.primary }]} onPress={handleAnalyze}>
                  <MaterialCommunityIcons name="brain" size={18} color="#fff" />
                  <Text style={[styles.actionBtnText, { color: '#fff' }]}>{t('analyze') || 'Analyser'}</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {error && (
          <ModernCard style={[styles.errorCard, { borderLeftColor: colors.error }]} shadow="subtle">
            <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <Pressable onPress={resetAll}>
              <Text style={[styles.retryLink, { color: colors.primary }]}>{t('retry') || 'Réessayer'}</Text>
            </Pressable>
          </ModernCard>
        )}

        {analysis && (
          <View style={styles.resultsContainer}>
            <View style={[styles.resultHeader, { backgroundColor: colors.primary }]}>
              <MaterialCommunityIcons name="check-circle" size={24} color="#fff" />
              <Text style={styles.resultHeaderTitle}>{t('analysisComplete') || 'Analyse terminée'}</Text>
            </View>

            {analysis.image_url && (
              <Image source={{ uri: analysis.image_url }} style={styles.resultImage} />
            )}

            <AnalysisResultCard
              label={t('detectedCrop') || 'Culture détectée'}
              value={analysis.detected_crop || 'Non identifiée'}
              icon="sprout"
              color="#22C55E"
            />

            <AnalysisResultCard
              label={t('confidence') || 'Confiance'}
              value={analysis.confidence_score ? `${(analysis.confidence_score * 100).toFixed(0)}%` : '—'}
              icon="chart-donut"
              color="#3B82F6"
            />

            <AnalysisResultCard
              label={t('healthScore') || 'Santé'}
              value={analysis.health_score ? `${analysis.health_score}/100` : '—'}
              icon="heart-pulse"
              color={analysis.health_score > 70 ? '#22C55E' : analysis.health_score > 40 ? '#EAB308' : '#EF4444'}
            />

            <AnalysisResultCard
              label={t('growthStage') || 'Stade de croissance'}
              value={analysis.growth_stage_label || analysis.growth_stage || '—'}
              icon="calendar-clock"
              color="#8B5CF6"
            />

            {analysis.disease_detected && (
              <AnalysisResultCard
                label={t('diseaseDetected') || 'Maladie détectée'}
                value={analysis.disease_detected}
                icon="bug"
                color="#EF4444"
              />
            )}

            {analysis.disease_risk && (
              <SeverityBar
                label={t('diseaseRisk') || 'Risque maladie'}
                level={parseInt(analysis.disease_risk) || 1}
              />
            )}

            {analysis.health_label && (
              <AnalysisResultCard
                label={t('healthLabel') || 'État général'}
                value={analysis.health_label}
                icon="emoticon"
                color="#22C55E"
              />
            )}

            {analysis.ai_source && (
              <Text style={[styles.aiSource, { color: colors.textTertiary }]}>
                {t('aiSource') || 'Source IA'}: {analysis.ai_source} {analysis.cached ? '(caché)' : ''}
              </Text>
            )}

            {analysis.recommendations?.length > 0 && (
              <ModernCard style={styles.recoCard} shadow="subtle">
                <Text style={[styles.recoTitle, { color: colors.text }]}>{t('recommendations') || 'Recommandations'}</Text>
                {analysis.recommendations.map((r, i) => (
                  <View key={i} style={styles.recoItem}>
                    <MaterialCommunityIcons name="lightbulb" size={16} color={colors.warning} />
                    <Text style={[styles.recoText, { color: colors.textSecondary }]}>{r}</Text>
                  </View>
                ))}
              </ModernCard>
            )}

            <Pressable style={[styles.newAnalysisBtn, { borderColor: colors.primary }]} onPress={resetAll}>
              <MaterialCommunityIcons name="camera-plus" size={20} color={colors.primary} />
              <Text style={[styles.newAnalysisText, { color: colors.primary }]}>{t('newAnalysis') || 'Nouvelle analyse'}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.LG, paddingBottom: 40 },

  pickContainer: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  pickIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  pickTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  pickSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 8, paddingHorizontal: 20 },
  pickBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, width: '100%', justifyContent: 'center' },
  pickBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  pickBtnTextAlt: { fontSize: 16, fontWeight: '600' },

  previewContainer: { gap: 12 },
  previewImage: { width: '100%', height: 260, borderRadius: 16 },
  previewHint: { fontSize: 12, textAlign: 'center' },

  previewActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  actionBtnOut: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  actionBtnPrim: { flex: 1, flexDirection: 'row', borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionBtnText: { fontSize: 16, fontWeight: '600' },

  analyzingState: { alignItems: 'center', gap: 12, paddingVertical: 20 },
  analyzingText: { fontSize: 16, fontWeight: '600' },

  errorCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 12, borderLeftWidth: 3, flexWrap: 'wrap' },
  errorText: { flex: 1, fontSize: 14 },
  retryLink: { fontSize: 14, fontWeight: '600' },

  resultsContainer: { gap: 10 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 14 },
  resultHeaderTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  resultImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 4 },

  resultCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
  resultContent: { flex: 1 },
  resultLabel: { fontSize: 12, fontWeight: '500' },
  resultValue: { fontSize: 16, fontWeight: '700', marginTop: 2 },

  severityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingVertical: 8 },
  severityLabel: { fontSize: 13, fontWeight: '500' },
  severityDots: { flexDirection: 'row', gap: 6 },
  severityDot: { width: 10, height: 10, borderRadius: 5 },

  aiSource: { fontSize: 11, textAlign: 'center', marginTop: 4 },

  recoCard: { padding: 16, borderRadius: 12, gap: 8 },
  recoTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  recoItem: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  recoText: { flex: 1, fontSize: 13, lineHeight: 18 },

  newAnalysisBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, marginTop: 8 },
  newAnalysisText: { fontSize: 16, fontWeight: '600' },
});
