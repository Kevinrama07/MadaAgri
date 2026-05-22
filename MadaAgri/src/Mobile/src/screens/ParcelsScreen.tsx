import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import MapView, { Marker, Callout, Polygon, LongPressEvent, Region } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';
import { dataApi } from '../lib/api';
import parcelService from '../services/parcelService';
import { madagascarRegions } from '../data/madagascarRegions';
import * as ImagePicker from 'expo-image-picker';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const MAP_HEIGHT = SCREEN_HEIGHT * 0.55;

const DEFAULT_REGION = {
  latitude: -18.8792,
  longitude: 47.5079,
  latitudeDelta: 15,
  longitudeDelta: 15,
};

const regionNames = Object.keys(madagascarRegions);

function findClosestRegion(lat: number, lng: number): string | null {
  let closest = null;
  let minDist = Infinity;
  for (const name of regionNames) {
    const cap = madagascarRegions[name as keyof typeof madagascarRegions];
    if (!cap.capital) continue;
    const dist = Math.abs(lat - (-18.9)) + Math.abs(lng - 47.5);
    if (dist < minDist) { minDist = dist; closest = name; }
  }
  return closest;
}

function formatScore(score: number | null | undefined): string {
  if (score == null) return 'N/A';
  return Math.round(score) + '/100';
}

function ScoreBar({ score, color }: { score: number | null | undefined; color?: string }) {
  const { colors } = useTheme();
  const val = score != null ? Math.min(100, Math.max(0, Math.round(score))) : 0;
  const barColor = color || (val >= 70 ? '#10B981' : val >= 50 ? '#F59E0B' : '#EF4444');
  return (
    <View style={styles.scoreBarTrack}>
      <View style={[styles.scoreBarFill, { width: `${val}%`, backgroundColor: barColor }]} />
    </View>
  );
}

const TAB_ITEMS = [
  { key: 'cultures', icon: 'sprout' as const, label: 'Cultures' },
  { key: 'carte', icon: 'map' as const, label: 'Carte' },
  { key: 'ia', icon: 'robot' as const, label: 'Analyse IA' },
];

export default function ParcelsScreen({ navigation }: any) {
  const { colors, mode } = useTheme();
  const { t } = useTranslation(['common', 'dashboard']);
  const insets = useSafeAreaInsets();
  const isDark = mode === 'dark';

  const [activeTab, setActiveTab] = useState('carte');
  const mapRef = useRef<MapView>(null);

  const [parcels, setParcels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<any>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<any>(null);
  const [showRegionPanel, setShowRegionPanel] = useState(false);

  const [creating, setCreating] = useState(false);
  const [createPoint, setCreatePoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', size_ha: '' });
  const [creatingLoading, setCreatingLoading] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', size_ha: '' });
  const [showEditForm, setShowEditForm] = useState(false);

  const [analyzing, setAnalyzing] = useState<string | null>(null);

  const [regions, setRegions] = useState<any[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
  const [cultures, setCultures] = useState<any[]>([]);
  const [culturesLoading, setCulturesLoading] = useState(false);

  const [analysisParcelId, setAnalysisParcelId] = useState<string | null>(null);
  const [analysisImage, setAnalysisImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);
  const [showAnalysisHistory, setShowAnalysisHistory] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisStep, setAnalysisStep] = useState<'idle' | 'uploading' | 'analyzing' | 'recommending' | 'done'>('idle');

  const fetchParcels = useCallback(async () => {
    try {
      const data = await parcelService.getParcels();
      setParcels(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[Parcels] fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchParcels(); }, [fetchParcels]);

  useEffect(() => {
    dataApi.fetchRegions().then(setRegions).catch(() => {});
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchParcels();
  }, [fetchParcels]);

  const parcelMarkers = useMemo(() =>
    parcels.filter((p) => p.latitude && p.longitude).map((p) => ({
      id: p.id,
      latitude: parseFloat(p.latitude),
      longitude: parseFloat(p.longitude),
      title: p.name,
      description: p.size_ha ? `${p.size_ha} ha` : '',
    })),
    [parcels]
  );

  const parcelPolygons = useMemo(() =>
    parcels.filter((p) => p.polygon_coordinates).map((p) => {
      const coords = typeof p.polygon_coordinates === 'string'
        ? JSON.parse(p.polygon_coordinates) : p.polygon_coordinates;
      const ring = coords?.geometry?.coordinates?.[0] || coords?.coordinates?.[0] || [];
      return {
        id: p.id,
        coordinates: ring.map((c: number[]) => ({ latitude: c[1], longitude: c[0] })),
        isSelected: selectedParcel?.id === p.id,
      };
    }),
    [parcels, selectedParcel]
  );

  const handleMapLongPress = useCallback((e: LongPressEvent) => {
    const { coordinate } = e.nativeEvent;
    setActiveTab('carte');
    setSelectedParcel(null);
    setShowDetailPanel(false);
    setCreatePoint({ latitude: coordinate.latitude, longitude: coordinate.longitude });
    setCreateForm({ name: '', description: '', size_ha: '' });
    setShowCreateForm(true);
  }, []);

  const handleMapPress = useCallback((e: any) => {
    if (creating) {
      const { coordinate } = e.nativeEvent;
      setCreatePoint({ latitude: coordinate.latitude, longitude: coordinate.longitude });
      setCreateForm({ name: '', description: '', size_ha: '' });
      setShowCreateForm(true);
      setCreating(false);
      return;
    }
    // Check if tapped near a region (for region info)
    const lat = e.nativeEvent.coordinate?.latitude;
    const lng = e.nativeEvent.coordinate?.longitude;
    if (lat && lng && !selectedParcel) {
      const name = findClosestRegion(lat, lng);
      if (name && madagascarRegions[name as keyof typeof madagascarRegions]) {
        setSelectedRegion({ name, ...madagascarRegions[name as keyof typeof madagascarRegions] });
        setShowRegionPanel(true);
      }
    }
  }, [creating, selectedParcel]);

  const handleSelectParcel = useCallback((parcel: any) => {
    setSelectedParcel(parcel);
    setShowDetailPanel(true);
    setShowRegionPanel(false);
    if (parcel.latitude && parcel.longitude) {
      mapRef.current?.animateToRegion({
        latitude: parseFloat(parcel.latitude),
        longitude: parseFloat(parcel.longitude),
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 600);
    }
  }, []);

  const handleSaveCreate = useCallback(async () => {
    if (!createForm.name.trim() || !createPoint) {
      Alert.alert('Erreur', 'Nom requis et placez un point sur la carte');
      return;
    }
    setCreatingLoading(true);
    try {
      const newParcel = await parcelService.createParcel({
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        latitude: createPoint.latitude,
        longitude: createPoint.longitude,
        size_ha: createForm.size_ha ? parseFloat(createForm.size_ha) : null,
      });
      setParcels((prev) => [newParcel, ...prev]);
      setShowCreateForm(false);
      setCreatePoint(null);
      setCreating(false);
      handleSelectParcel(newParcel);
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Erreur lors de la création');
    } finally {
      setCreatingLoading(false);
    }
  }, [createForm, createPoint, handleSelectParcel]);

  const handleOpenEdit = useCallback(() => {
    if (!selectedParcel) return;
    setEditForm({
      name: selectedParcel.name || '',
      description: selectedParcel.description || '',
      size_ha: String(selectedParcel.size_ha || ''),
    });
    setEditMode(true);
    setShowEditForm(true);
  }, [selectedParcel]);

  const handleSaveEdit = useCallback(async () => {
    if (!selectedParcel || !editForm.name.trim()) {
      Alert.alert('Erreur', 'Nom requis');
      return;
    }
    try {
      await parcelService.updateParcel(selectedParcel.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        size_ha: editForm.size_ha ? parseFloat(editForm.size_ha) : null,
      });
      setParcels((prev) => prev.map((p) =>
        p.id === selectedParcel.id ? {
          ...p,
          name: editForm.name.trim(),
          description: editForm.description.trim(),
          size_ha: editForm.size_ha ? parseFloat(editForm.size_ha) : null,
        } : p
      ));
      setSelectedParcel((prev: any) => prev ? {
        ...prev,
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        size_ha: editForm.size_ha ? parseFloat(editForm.size_ha) : null,
      } : null);
      setShowEditForm(false);
      setEditMode(false);
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Erreur lors de la modification');
    }
  }, [selectedParcel, editForm]);

  const handleDeleteParcel = useCallback((parcel: any) => {
    Alert.alert(
      'Supprimer',
      `Supprimer la parcelle "${parcel.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' as const },
        {
          text: 'Supprimer', style: 'destructive' as const,
          onPress: async () => {
            try {
              await parcelService.deleteParcel(parcel.id);
              setParcels((prev) => prev.filter((p) => p.id !== parcel.id));
              if (selectedParcel?.id === parcel.id) {
                setSelectedParcel(null);
                setShowDetailPanel(false);
              }
            } catch (err: any) {
              Alert.alert('Erreur', err?.message);
            }
          },
        },
      ]
    );
  }, [selectedParcel]);

  const handleAnalyzeCrop = useCallback(async (parcelId: string) => {
    setAnalyzing(parcelId);
    try {
      const result = await parcelService.analyzeCrop(parcelId);
      Alert.alert(
        'Analyse IA',
        `Culture: ${result.detected_crop || result.recommended_crops?.[0]?.name || 'Non déterminée'}\nScore: ${result.suitability_score != null ? Math.round(result.suitability_score) + '/100' : 'N/A'}`,
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Erreur analyse');
    } finally {
      setAnalyzing(null);
    }
  }, []);

  const handleSelectRegion = useCallback(async (regionId: number) => {
    setSelectedRegionId(regionId);
    setCulturesLoading(true);
    try {
      const knnData = await dataApi.fetchKnnCultures(regionId, 5);
      if (knnData.length > 0) {
        setCultures(knnData);
      } else {
        const fallback = await dataApi.fetchRegionCultures(regionId);
        setCultures(Array.isArray(fallback) ? fallback : []);
      }
    } catch {
      setCultures([]);
    } finally {
      setCulturesLoading(false);
    }
  }, []);

  const handleCameraPick = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'L\'accès à la caméra est nécessaire pour prendre une photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        cameraType: ImagePicker.CameraType.back,
      });
      if (!result.canceled && result.assets?.[0]) {
        setAnalysisImage(result.assets[0].uri);
        setAnalysisResult(null);
        setAnalysisError(null);
        setAnalysisStep('idle');
      }
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Erreur lors de la prise de photo');
    }
  }, []);

  const handleGalleryPick = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'L\'accès à la galerie est nécessaire pour importer une image.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        setAnalysisImage(result.assets[0].uri);
        setAnalysisResult(null);
        setAnalysisError(null);
        setAnalysisStep('idle');
      }
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Erreur lors de l\'import');
    }
  }, []);

  const handleNewAnalysis = useCallback(() => {
    setAnalysisImage(null);
    setAnalysisResult(null);
    setAnalysisError(null);
    setAnalysisStep('idle');
  }, []);

  const handleRunAnalysis = useCallback(async () => {
    if (!analysisImage) return;
    setAnalysisLoading(true);
    setAnalysisResult(null);
    setAnalysisError(null);
    setAnalysisStep('uploading');
    try {
      await new Promise((r) => setTimeout(r, 600));
      setAnalysisStep('analyzing');
      await new Promise((r) => setTimeout(r, 400));
      const analysis = await (parcelService as any).analyzeImage(analysisImage, analysisParcelId);
      setAnalysisStep('recommending');
      await new Promise((r) => setTimeout(r, 300));
      setAnalysisResult(analysis);
      setAnalysisStep('done');
      if (analysisParcelId) {
        const history = await (parcelService as any).getAnalysisHistory(analysisParcelId);
        setAnalysisHistory(Array.isArray(history) ? history : []);
      }
    } catch (err: any) {
      setAnalysisStep('idle');
      setAnalysisError(err?.message || 'Erreur analyse');
    } finally {
      setAnalysisLoading(false);
    }
  }, [analysisImage, analysisParcelId]);

  const renderCulturesTab = () => (
    <View style={styles.tabContent}>
      <ScrollView contentContainerStyle={styles.culturesScroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recommandations par région</Text>
        <Text style={[styles.sectionSub, { color: colors.textTertiary }]}>
          Sélectionnez une région pour voir les cultures adaptées
        </Text>

        <View style={styles.regionChips}>
          {regions.slice(0, 22).map((r: any) => (
            <Pressable
              key={r.id}
              style={[
                styles.regionChip,
                {
                  backgroundColor: selectedRegionId === r.id ? colors.primary : colors.glass,
                  borderColor: selectedRegionId === r.id ? colors.primary : colors.glassBorder,
                },
              ]}
              onPress={() => handleSelectRegion(r.id)}
            >
              <Text style={[
                styles.regionChipText,
                { color: selectedRegionId === r.id ? '#FFF' : colors.text },
              ]} numberOfLines={1}>
                {r.name}
              </Text>
            </Pressable>
          ))}
        </View>

        {selectedRegionId && (
          <View style={[styles.regionInfoCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
            <Text style={[styles.regionInfoTitle, { color: colors.text }]}>
              {regions.find((r: any) => r.id === selectedRegionId)?.name || ''}
            </Text>
            <View style={styles.regionInfoGrid}>
              {[
                { icon: 'terrain', label: 'Sol', value: regions.find((r: any) => r.id === selectedRegionId)?.soil_type || '—' },
                { icon: 'thermometer', label: 'Climat', value: regions.find((r: any) => r.id === selectedRegionId)?.climate || '—' },
                { icon: 'water', label: 'Pluie', value: regions.find((r: any) => r.id === selectedRegionId)?.rainfall || '—' },
                { icon: 'sun-thermometer', label: 'Température', value: regions.find((r: any) => r.id === selectedRegionId)?.temperature || '—' },
              ].map((item, i) => (
                <View key={i} style={[styles.regionInfoItem, { backgroundColor: colors.primaryBackground }]}>
                  <MaterialCommunityIcons name={item.icon as any} size={16} color={colors.primary} />
                  <Text style={[styles.regionInfoLabel, { color: colors.textTertiary }]}>{item.label}</Text>
                  <Text style={[styles.regionInfoValue, { color: colors.text }]}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {culturesLoading ? (
          <View style={styles.centerPad}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : cultures.length > 0 ? (
          <View style={styles.culturesList}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 8 }]}>
              Cultures recommandées ({cultures.length})
            </Text>
            {cultures.map((c: any, i: number) => (
              <View key={c.id || i} style={[styles.cultureCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
                <View style={styles.cultureHeader}>
                  <View style={[styles.cultureIcon, { backgroundColor: colors.glassTint }]}>
                    <MaterialCommunityIcons name="sprout" size={22} color={colors.primary} />
                  </View>
                  <View style={styles.cultureInfo}>
                    <Text style={[styles.cultureName, { color: colors.text }]}>{c.name}</Text>
                    <Text style={[styles.cultureSciName, { color: colors.textTertiary }]}>{c.scientific_name || ''}</Text>
                  </View>
                  {c.suitability_score != null && (
                    <View style={[
                      styles.scoreBadge,
                      { backgroundColor: c.suitability_score >= 70 ? '#D1FAE5' : c.suitability_score >= 50 ? '#FEF3C7' : '#FEE2E2' },
                    ]}>
                      <Text style={[
                        styles.scoreBadgeText,
                        { color: c.suitability_score >= 70 ? '#065F46' : c.suitability_score >= 50 ? '#92400E' : '#991B1B' },
                      ]}>
                        {Math.round(c.suitability_score)}%
                      </Text>
                    </View>
                  )}
                </View>
                {c.description && (
                  <Text style={[styles.cultureDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                    {c.description}
                  </Text>
                )}
                {c.suitability_score != null && <ScoreBar score={c.suitability_score} />}
                <View style={styles.cultureMeta}>
                  {c.ideal_soil && <Text style={[styles.cultureTag, { color: colors.textTertiary }]}>🌱 {c.ideal_soil}</Text>}
                  {c.growing_period && <Text style={[styles.cultureTag, { color: colors.textTertiary }]}>📅 {c.growing_period}</Text>}
                </View>
              </View>
            ))}
          </View>
        ) : selectedRegionId ? (
          <View style={styles.centerPad}>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Aucune culture trouvée</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );

  const renderMapTab = () => (
    <View style={styles.mapTabContainer}>
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={DEFAULT_REGION}
          showsUserLocation
          showsMyLocationButton
          onLongPress={handleMapLongPress}
          onPress={handleMapPress}
          mapPadding={{ top: 0, right: 0, bottom: 80, left: 0 }}
        >
          {parcelMarkers.map((m) => (
            <Marker
              key={m.id}
              coordinate={{ latitude: m.latitude, longitude: m.longitude }}
              pinColor={selectedParcel?.id === m.id ? colors.primary : '#8B5CF6'}
              onPress={() => {
                const parcel = parcels.find((p) => p.id === m.id);
                if (parcel) handleSelectParcel(parcel);
              }}
            >
              <Callout>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{m.title}</Text>
                  {m.description ? <Text style={styles.calloutDesc}>{m.description}</Text> : null}
                </View>
              </Callout>
            </Marker>
          ))}

          {parcelPolygons.map((poly) => (
            <Polygon
              key={poly.id}
              coordinates={poly.coordinates}
              fillColor={poly.isSelected ? 'rgba(59, 130, 246, 0.25)' : 'rgba(139, 92, 246, 0.10)'}
              strokeColor={poly.isSelected ? '#3B82F6' : '#8B5CF6'}
              strokeWidth={poly.isSelected ? 3 : 2}
              tappable
              onPress={() => {
                const parcel = parcels.find((p) => p.id === poly.id);
                if (parcel) handleSelectParcel(parcel);
              }}
            />
          ))}

          {createPoint && (
            <Marker coordinate={createPoint} pinColor="#10B981" />
          )}
        </MapView>

        {/* Map overlay buttons */}
        <View style={styles.mapOverlayTop}>
          <Pressable
            style={[styles.mapBtn, { backgroundColor: isDark ? 'rgba(8,12,20,0.85)' : 'rgba(255,255,255,0.90)' }]}
            onPress={() => {
              mapRef.current?.animateToRegion(DEFAULT_REGION, 600);
            }}
          >
            <MaterialCommunityIcons name="crosshairs-gps" size={20} color={colors.primary} />
          </Pressable>
        </View>

        {/* Empty state overlay */}
        {!loading && parcels.length === 0 && !createPoint && (
          <View style={[styles.emptyOverlay, { backgroundColor: isDark ? 'rgba(8,12,20,0.70)' : 'rgba(255,255,255,0.75)' }]}>
            <MaterialCommunityIcons name="map-marker-off" size={40} color={colors.textTertiary} />
            <Text style={[styles.emptyOverlayTitle, { color: colors.text }]}>Aucune parcelle</Text>
            <Text style={[styles.emptyOverlaySub, { color: colors.textTertiary }]}>
              Appuyez longuement sur la carte pour ajouter une parcelle
            </Text>
          </View>
        )}

        {/* Map hint */}
        <View style={styles.mapHint}>
          <MaterialCommunityIcons name="gesture-tap-hold" size={14} color="#FFF" />
          <Text style={styles.mapHintText}>Appui long pour ajouter une parcelle</Text>
        </View>
      </View>

      {/* Detail panel for selected parcel */}
      {showDetailPanel && selectedParcel && (
        <View style={[styles.detailPanel, {
          backgroundColor: isDark ? 'rgba(8,12,20,0.95)' : 'rgba(255,255,255,0.96)',
          borderTopColor: colors.glassBorder,
        }]}>
          <View style={styles.detailPanelHandle}>
            <View style={[styles.handleBar, { backgroundColor: colors.textTertiary }]} />
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.detailScroll}>
            <View style={styles.detailHeader}>
              <View style={[styles.detailIcon, { backgroundColor: colors.glassTint }]}>
                <MaterialCommunityIcons name="terrain" size={24} color={colors.primary} />
              </View>
              <View style={styles.detailTitleWrap}>
                <Text style={[styles.detailName, { color: colors.text }]}>{selectedParcel.name}</Text>
                {selectedParcel.size_ha && (
                  <View style={[styles.sizeBadge, { backgroundColor: colors.primaryPale }]}>
                    <Text style={[styles.sizeBadgeText, { color: colors.primary }]}>{selectedParcel.size_ha} ha</Text>
                  </View>
                )}
              </View>
              <View style={styles.detailActions}>
                <Pressable onPress={handleOpenEdit} style={styles.detailActionBtn}>
                  <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.textSecondary} />
                </Pressable>
                <Pressable onPress={() => handleDeleteParcel(selectedParcel)} style={styles.detailActionBtn}>
                  <MaterialCommunityIcons name="delete-outline" size={18} color={colors.error} />
                </Pressable>
              </View>
            </View>

            {/* Location info */}
            {(selectedParcel.commune || selectedParcel.district || selectedParcel.region) && (
              <View style={[styles.locationRow, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
                <MaterialCommunityIcons name="map-marker" size={14} color={colors.textTertiary} />
                <Text style={[styles.locationText, { color: colors.textTertiary }]}>
                  {[selectedParcel.commune, selectedParcel.district, selectedParcel.region].filter(Boolean).join(', ')}
                </Text>
              </View>
            )}

            {/* 2x2 Metrics grid */}
            <View style={styles.metricsGrid}>
              {[
                { icon: 'water', label: 'Humidité', value: selectedParcel.annual_rainfall_mm ? `${selectedParcel.annual_rainfall_mm} mm` : '—' },
                { icon: 'thermometer', label: 'Température', value: selectedParcel.avg_temperature ? `${selectedParcel.avg_temperature}°C` : '—' },
                { icon: 'weather-cloudy', label: 'Climat', value: selectedParcel.climate_type || '—' },
                { icon: 'terrain', label: 'Sol', value: selectedParcel.soil_type || '—' },
              ].map((item, i) => (
                <View key={i} style={[styles.metricCard, { backgroundColor: colors.primaryBackground }]}>
                  <MaterialCommunityIcons name={item.icon as any} size={18} color={colors.primary} />
                  <Text style={[styles.metricValue, { color: colors.text }]}>{item.value}</Text>
                  <Text style={[styles.metricLabel, { color: colors.textTertiary }]}>{item.label}</Text>
                </View>
              ))}
            </View>

            {/* Fertility score */}
            {selectedParcel.suitability_score != null && (
              <View style={[styles.scoreCard, { backgroundColor: colors.primaryBackground }]}>
                <View style={styles.scoreRow}>
                  <Text style={[styles.scoreLabel, { color: colors.text }]}>Score de fertilité</Text>
                  <Text style={[styles.scoreValue, { color: selectedParcel.suitability_score >= 70 ? '#10B981' : selectedParcel.suitability_score >= 50 ? '#F59E0B' : '#EF4444' }]}>
                    {formatScore(selectedParcel.suitability_score)}
                  </Text>
                </View>
                <ScoreBar score={selectedParcel.suitability_score} />
              </View>
            )}

            {/* Recommended crops */}
            {selectedParcel.recommended_crops?.length > 0 && (
              <View style={styles.recommendedSection}>
                <Text style={[styles.sectionLabel, { color: colors.text }]}>Cultures recommandées</Text>
                <View style={styles.recommendedRow}>
                  {(typeof selectedParcel.recommended_crops === 'string'
                    ? JSON.parse(selectedParcel.recommended_crops)
                    : selectedParcel.recommended_crops
                  ).slice(0, 4).map((c: any, i: number) => (
                    <View key={i} style={[
                      styles.cropBadge,
                      { backgroundColor: c.suitability_score >= 70 ? '#D1FAE5' : c.suitability_score >= 50 ? '#FEF3C7' : colors.glass },
                    ]}>
                      <Text style={[
                        styles.cropBadgeText,
                        { color: c.suitability_score >= 70 ? '#065F46' : c.suitability_score >= 50 ? '#92400E' : colors.text },
                      ]}>
                        {c.name || c.crop}
                        {c.suitability_score != null ? ` (${Math.round(c.suitability_score)}%)` : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.detailBottomRow}>
              <Pressable
                style={[styles.analyzeBtn, { backgroundColor: colors.primary }]}
                onPress={() => handleAnalyzeCrop(selectedParcel.id)}
                disabled={analyzing === selectedParcel.id}
              >
                {analyzing === selectedParcel.id ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="brain" size={18} color="#FFF" />
                    <Text style={styles.analyzeBtnText}>Analyse IA</Text>
                  </>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Parcels list button bar */}
      {!showDetailPanel && (
        <View style={[styles.listBar, {
          backgroundColor: isDark ? 'rgba(8,12,20,0.95)' : 'rgba(255,255,255,0.96)',
          borderTopColor: colors.glassBorder,
        }]}>
          <Text style={[styles.listBarTitle, { color: colors.text }]}>
            Parcelles ({parcels.length})
          </Text>
          <Pressable onPress={fetchParcels} style={styles.listBarRefresh}>
            <MaterialCommunityIcons name="refresh" size={20} color={colors.primary} />
          </Pressable>
        </View>
      )}
    </View>
  );

  const renderAnalysisTab = () => (
    <View style={styles.tabContent}>
      <ScrollView contentContainerStyle={styles.analysisScroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Analyse IA des cultures</Text>
        <Text style={[styles.sectionSub, { color: colors.textTertiary }]}>
          Analysez vos cultures à partir d'une photo
        </Text>

        {/* Parcel selector */}
        <Text style={[styles.fieldLabel, { color: colors.text }]}>Parcelle (optionnel)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.parcelSelector}>
          <Pressable
            style={[
              styles.parcelSelectorChip,
              { backgroundColor: !analysisParcelId ? colors.primary : colors.glass, borderColor: !analysisParcelId ? colors.primary : colors.glassBorder },
            ]}
            onPress={() => setAnalysisParcelId(null)}
          >
            <Text style={[styles.parcelSelectorText, { color: !analysisParcelId ? '#FFF' : colors.text }]}>Sans parcelle</Text>
          </Pressable>
          {parcels.map((p) => (
            <Pressable
              key={p.id}
              style={[
                styles.parcelSelectorChip,
                { backgroundColor: analysisParcelId === p.id ? colors.primary : colors.glass, borderColor: analysisParcelId === p.id ? colors.primary : colors.glassBorder },
              ]}
              onPress={() => setAnalysisParcelId(p.id)}
            >
              <Text style={[styles.parcelSelectorText, { color: analysisParcelId === p.id ? '#FFF' : colors.text }]} numberOfLines={1}>{p.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Image picker buttons or preview */}
        {!analysisImage ? (
          <View style={styles.pickerRow}>
            <Pressable
              style={[styles.pickerBtn, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}
              onPress={handleCameraPick}
            >
              <View style={[styles.pickerIconWrap, { backgroundColor: colors.primaryPale }]}>
                <MaterialCommunityIcons name="camera" size={28} color={colors.primary} />
              </View>
              <Text style={[styles.pickerBtnLabel, { color: colors.text }]}>Prendre une photo</Text>
              <Text style={[styles.pickerBtnHint, { color: colors.textTertiary }]}>Caméra arrière</Text>
            </Pressable>
            <Pressable
              style={[styles.pickerBtn, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}
              onPress={handleGalleryPick}
            >
              <View style={[styles.pickerIconWrap, { backgroundColor: colors.primaryPale }]}>
                <MaterialCommunityIcons name="image-multiple" size={28} color={colors.primary} />
              </View>
              <Text style={[styles.pickerBtnLabel, { color: colors.text }]}>Importer une image</Text>
              <Text style={[styles.pickerBtnHint, { color: colors.textTertiary }]}>Depuis la galerie</Text>
            </Pressable>
          </View>
        ) : (
          <View style={[styles.previewCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
            <Image source={{ uri: analysisImage }} style={styles.previewImageFull} />
            <Pressable style={styles.removeImageBtn} onPress={handleNewAnalysis}>
              <MaterialCommunityIcons name="close-circle" size={28} color={colors.error} />
            </Pressable>
            <LinearGradient
              colors={['transparent', isDark ? 'rgba(8,12,20,0.9)' : 'rgba(255,255,255,0.9)']}
              style={styles.previewOverlay}
            >
              <Pressable
                style={[styles.runAnalysisBtn, { backgroundColor: colors.primary, opacity: analysisLoading ? 0.6 : 1 }]}
                disabled={analysisLoading}
                onPress={handleRunAnalysis}
              >
                {analysisLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="robot" size={20} color="#FFF" />
                    <Text style={styles.runAnalysisText}>Lancer l'analyse IA</Text>
                  </>
                )}
              </Pressable>
            </LinearGradient>
          </View>
        )}

        {/* Animated analysis steps */}
        {analysisStep !== 'idle' && analysisStep !== 'done' && (
          <View style={[styles.stepsCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
            <View style={styles.stepsHeader}>
              <MaterialCommunityIcons name="robot" size={22} color={colors.primary} />
              <Text style={[styles.stepsTitle, { color: colors.text }]}>Analyse en cours</Text>
            </View>
            <View style={styles.stepsList}>
              {[
                { key: 'uploading', icon: 'cloud-upload', label: 'Téléversement' },
                { key: 'analyzing', icon: 'brain', label: 'Analyse IA' },
                { key: 'recommending', icon: 'lightbulb-outline', label: 'Recommandations' },
              ].map((step, i) => {
                const isActive = analysisStep === step.key;
                const isDone = ['uploading', 'analyzing', 'recommending'].indexOf(step.key) <
                  ['uploading', 'analyzing', 'recommending'].indexOf(analysisStep);
                return (
                  <View key={step.key} style={styles.stepRow}>
                    <View style={styles.stepIndicator}>
                      <View style={[
                        styles.stepDot,
                        { backgroundColor: isDone ? '#10B981' : isActive ? colors.primary : colors.glassDarker },
                      ]}>
                        {isDone ? (
                          <MaterialCommunityIcons name="check" size={12} color="#FFF" />
                        ) : isActive ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <MaterialCommunityIcons name={step.icon as any} size={14} color={colors.textTertiary} />
                        )}
                      </View>
                      {i < 2 && <View style={[styles.stepLine, { backgroundColor: isDone ? '#10B981' : colors.glassDarker }]} />}
                    </View>
                    <Text style={[
                      styles.stepLabel,
                      { color: isDone ? '#10B981' : isActive ? colors.text : colors.textTertiary },
                      (isDone || isActive) && { fontWeight: '600' },
                    ]}>
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Error banner */}
        {analysisError && (
          <View style={[styles.banner, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <MaterialCommunityIcons name="alert-circle" size={20} color="#DC2626" />
            <View style={styles.bannerContent}>
              <Text style={[styles.bannerTitle, { color: '#991B1B' }]}>Erreur d'analyse</Text>
              <Text style={[styles.bannerText, { color: '#B91C1C' }]}>{analysisError}</Text>
            </View>
            <Pressable onPress={handleNewAnalysis} style={[styles.bannerBtn, { backgroundColor: '#FEE2E2' }]}>
              <Text style={{ color: '#991B1B', fontSize: 12, fontWeight: '600' }}>Réessayer</Text>
            </Pressable>
          </View>
        )}

        {/* Analysis result */}
        {analysisResult && (
          <View style={styles.resultContainer}>
            {/* Fallback / Warnings / Anomalies banners */}
            {analysisResult.fallback && (
              <View style={[styles.banner, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A', marginBottom: 10 }]}>
                <MaterialCommunityIcons name="alert-outline" size={20} color="#D97706" />
                <View style={styles.bannerContent}>
                  <Text style={[styles.bannerTitle, { color: '#92400E' }]}>Mode dégradé actif</Text>
                  <Text style={[styles.bannerText, { color: '#B45309' }]}>
                    L'analyse a utilisé une méthode heuristique. Les résultats peuvent être moins précis.
                  </Text>
                </View>
              </View>
            )}
            {analysisResult.warnings?.length > 0 && (
              <View style={[styles.banner, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A', marginBottom: 10 }]}>
                <MaterialCommunityIcons name="information" size={20} color="#D97706" />
                <View style={styles.bannerContent}>
                  <Text style={[styles.bannerTitle, { color: '#92400E' }]}>Notes d'analyse</Text>
                  {analysisResult.warnings.map((w: string, i: number) => (
                    <Text key={i} style={[styles.bannerText, { color: '#B45309' }]}>{w}</Text>
                  ))}
                </View>
              </View>
            )}
            {analysisResult.anomalies?.length > 0 && (
              <View style={[styles.banner, { backgroundColor: '#FEF2F2', borderColor: '#FECACA', marginBottom: 10 }]}>
                <MaterialCommunityIcons name="alert-circle" size={20} color="#DC2626" />
                <View style={styles.bannerContent}>
                  <Text style={[styles.bannerTitle, { color: '#991B1B' }]}>Anomalies détectées</Text>
                  {analysisResult.anomalies.map((a: string, i: number) => (
                    <Text key={i} style={[styles.bannerText, { color: '#B91C1C' }]}>{a}</Text>
                  ))}
                </View>
              </View>
            )}

            {/* Hero section: detected crop + health ring */}
            <View style={[styles.heroCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
              <View style={styles.heroLeft}>
                <View style={[styles.heroIcon, { backgroundColor: colors.primaryPale }]}>
                  <MaterialCommunityIcons name="sprout" size={32} color={colors.primary} />
                </View>
                <Text style={[styles.heroCropName, { color: colors.text }]}>
                  {analysisResult.detected_crop || 'Culture non identifiée'}
                </Text>
                <View style={styles.heroBadges}>
                  {analysisResult.confidence_score != null && (
                    <View style={[
                      styles.heroBadge,
                      { backgroundColor: analysisResult.confidence_score >= 70 ? '#D1FAE5' : analysisResult.confidence_score >= 40 ? '#FEF3C7' : '#FEE2E2' },
                    ]}>
                      <MaterialCommunityIcons name="shield-check" size={12} color={
                        analysisResult.confidence_score >= 70 ? '#065F46' : analysisResult.confidence_score >= 40 ? '#92400E' : '#991B1B'
                      } />
                      <Text style={[
                        styles.heroBadgeText,
                        { color: analysisResult.confidence_score >= 70 ? '#065F46' : analysisResult.confidence_score >= 40 ? '#92400E' : '#991B1B' },
                      ]}>
                        Confiance: {Math.round(analysisResult.confidence_score)}%
                      </Text>
                    </View>
                  )}
                  {analysisResult.growth_stage_label && (
                    <View style={[styles.heroBadge, { backgroundColor: colors.primaryPale }]}>
                      <MaterialCommunityIcons name="leaf" size={12} color={colors.primary} />
                      <Text style={[styles.heroBadgeText, { color: colors.primary }]}>
                        {analysisResult.growth_stage_label}
                      </Text>
                    </View>
                  )}
                  {analysisResult.analysis_precision && (
                    <View style={[
                      styles.heroBadge,
                      { backgroundColor: analysisResult.analysis_precision === 'high' ? '#D1FAE5' : '#FEF3C7' },
                    ]}>
                      <MaterialCommunityIcons name="robot" size={12} color={
                        analysisResult.analysis_precision === 'high' ? '#065F46' : '#92400E'
                      } />
                      <Text style={[
                        styles.heroBadgeText,
                        { color: analysisResult.analysis_precision === 'high' ? '#065F46' : '#92400E' },
                      ]}>
                        {analysisResult.analysis_precision === 'high' ? 'Haute précision' : 'Précision limitée'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              {analysisResult.health_score != null && (
                <HealthRing score={analysisResult.health_score} healthLabel={analysisResult.health_label} />
              )}
            </View>

            {/* Metrics grid 2x2 */}
            <View style={styles.metricsGridAnalysis}>
              {/* Diseases card */}
              <View style={[styles.metricCardAnalysis, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
                <View style={styles.metricCardHeader}>
                  <MaterialCommunityIcons name="bug" size={16} color="#DC2626" />
                  <Text style={[styles.metricCardTitle, { color: colors.textTertiary }]}>MALADIES</Text>
                </View>
                {analysisResult.disease_detected ? (
                  <View>
                    <Text style={[styles.metricCardValue, { color: colors.text }]}>{analysisResult.disease_detected}</Text>
                    {analysisResult.disease_risk != null && (
                      <View style={styles.metricRiskRow}>
                        <View style={[
                          styles.riskDot,
                          { backgroundColor: analysisResult.disease_risk >= 70 ? '#DC2626' : analysisResult.disease_risk >= 40 ? '#D97706' : '#10B981' },
                        ]} />
                        <Text style={[styles.metricRiskText, { color: colors.textSecondary }]}>
                          Risque: {Math.round(analysisResult.disease_risk)}%
                        </Text>
                      </View>
                    )}
                    {analysisResult.disease_risk_level?.action && (
                      <Text style={[styles.metricHint, { color: colors.textTertiary }]}>
                        {analysisResult.disease_risk_level.action}
                      </Text>
                    )}
                  </View>
                ) : (
                  <View style={styles.metricEmpty}>
                    <MaterialCommunityIcons name="check-circle" size={18} color="#10B981" />
                    <Text style={[styles.metricEmptyText, { color: '#10B981' }]}>Aucune maladie détectée</Text>
                  </View>
                )}
              </View>

              {/* Nutrients card */}
              <View style={[styles.metricCardAnalysis, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
                <View style={styles.metricCardHeader}>
                  <MaterialCommunityIcons name="flask" size={16} color="#7C3AED" />
                  <Text style={[styles.metricCardTitle, { color: colors.textTertiary }]}>NUTRIMENTS</Text>
                </View>
                {analysisResult.nutrient_deficiencies?.length > 0 ? (
                  analysisResult.nutrient_deficiencies.map((n: string, i: number) => (
                    <View key={i} style={styles.nutrientRow}>
                      <MaterialCommunityIcons name="alert-circle" size={14} color="#D97706" />
                      <Text style={[styles.nutrientText, { color: colors.text }]}>{n}</Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.metricEmpty}>
                    <MaterialCommunityIcons name="check-circle" size={18} color="#10B981" />
                    <Text style={[styles.metricEmptyText, { color: '#10B981' }]}>Aucune carence</Text>
                  </View>
                )}
              </View>

              {/* Image quality card */}
              <View style={[styles.metricCardAnalysis, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
                <View style={styles.metricCardHeader}>
                  <MaterialCommunityIcons name="image" size={16} color="#2563EB" />
                  <Text style={[styles.metricCardTitle, { color: colors.textTertiary }]}>QUALITÉ IMAGE</Text>
                </View>
                <View style={styles.metricQualityRow}>
                  <MaterialCommunityIcons
                    name={
                      analysisResult.image_quality === 'Good' ? 'star' :
                      analysisResult.image_quality === 'Acceptable' ? 'star-half-full' : 'star-outline'
                    }
                    size={22}
                    color={
                      analysisResult.image_quality === 'Good' ? '#10B981' :
                      analysisResult.image_quality === 'Acceptable' ? '#D97706' : '#DC2626'
                    }
                  />
                  <Text style={[styles.metricCardValue, { color: colors.text }]}>
                    {analysisResult.image_quality === 'Good' ? 'Bonne' :
                     analysisResult.image_quality === 'Acceptable' ? 'Acceptable' : 'Faible'}
                  </Text>
                </View>
                {analysisResult.is_plant === false && (
                  <Text style={[styles.metricHint, { color: '#DC2626', marginTop: 4 }]}>
                    Aucune plante détectée dans l'image
                  </Text>
                )}
              </View>

              {/* Economic estimate card */}
              <View style={[styles.metricCardAnalysis, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
                <View style={styles.metricCardHeader}>
                  <MaterialCommunityIcons name="cash" size={16} color="#059669" />
                  <Text style={[styles.metricCardTitle, { color: colors.textTertiary }]}>ESTIMATION ÉCO.</Text>
                </View>
                {analysisResult.economic_estimate ? (
                  <View style={styles.economicGrid}>
                    <View style={styles.economicRow}>
                      <Text style={[styles.economicLabel, { color: colors.textTertiary }]}>Revenu</Text>
                      <Text style={[styles.economicValue, { color: colors.text }]}>
                        {analysisResult.economic_estimate.estimated_revenue?.toLocaleString('fr-FR')} {analysisResult.economic_estimate.currency || 'Ar'}
                      </Text>
                    </View>
                    <View style={styles.economicRow}>
                      <Text style={[styles.economicLabel, { color: colors.textTertiary }]}>Coût</Text>
                      <Text style={[styles.economicValue, { color: colors.text }]}>
                        {analysisResult.economic_estimate.estimated_cost?.toLocaleString('fr-FR')} {analysisResult.economic_estimate.currency || 'Ar'}
                      </Text>
                    </View>
                    <View style={[styles.economicDivider, { backgroundColor: colors.glassBorder }]} />
                    <View style={styles.economicRow}>
                      <Text style={[styles.economicLabel, { color: colors.textTertiary }]}>Profit</Text>
                      <Text style={[styles.economicValue, { color: '#059669', fontWeight: '700' }]}>
                        {analysisResult.economic_estimate.estimated_profit?.toLocaleString('fr-FR')} {analysisResult.economic_estimate.currency || 'Ar'}
                      </Text>
                    </View>
                    {analysisResult.economic_estimate.margin_percent != null && (
                      <View style={[styles.marginBadge, { backgroundColor: analysisResult.economic_estimate.margin_percent >= 20 ? '#D1FAE5' : '#FEF3C7' }]}>
                        <Text style={[styles.marginText, { color: analysisResult.economic_estimate.margin_percent >= 20 ? '#065F46' : '#92400E' }]}>
                          Marge: {Math.round(analysisResult.economic_estimate.margin_percent)}%
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.metricEmpty}>
                    <MaterialCommunityIcons name="help-circle" size={18} color={colors.textTertiary} />
                    <Text style={[styles.metricEmptyText, { color: colors.textTertiary }]}>Non disponible</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Recommendations */}
            {(analysisResult.recommendations?.length > 0) && (
              <View style={styles.recSection}>
                <View style={styles.recSectionHeader}>
                  <MaterialCommunityIcons name="lightbulb-outline" size={20} color={colors.primary} />
                  <Text style={[styles.recSectionTitle, { color: colors.text }]}>Recommandations</Text>
                </View>
                {(typeof analysisResult.recommendations === 'string'
                  ? JSON.parse(analysisResult.recommendations)
                  : analysisResult.recommendations
                ).map((r: any, i: number) => (
                  <View key={i} style={[
                    styles.recCard,
                    {
                      backgroundColor: colors.glass,
                      borderColor: colors.glassBorder,
                      borderLeftColor: r.priority === 'critical' ? '#DC2626' : r.priority === 'high' ? '#D97706' : r.priority === 'medium' ? '#2563EB' : '#6B7280',
                      borderLeftWidth: 4,
                    },
                  ]}>
                    <View style={styles.recCardContent}>
                      <View style={styles.recCardHeader}>
                        {r.category && (
                          <View style={[
                            styles.recCategoryBadge,
                            { backgroundColor: r.priority === 'critical' ? '#FEE2E2' : r.priority === 'high' ? '#FEF3C7' : r.priority === 'medium' ? '#DBEAFE' : '#F3F4F6' },
                          ]}>
                            <Text style={[
                              styles.recCategoryText,
                              { color: r.priority === 'critical' ? '#991B1B' : r.priority === 'high' ? '#92400E' : r.priority === 'medium' ? '#1E40AF' : '#4B5563' },
                            ]}>
                              {r.category}
                            </Text>
                          </View>
                        )}
                        {r.priority && (
                          <View style={[
                            styles.recPriorityBadge,
                            { backgroundColor: r.priority === 'critical' ? '#FEE2E2' : r.priority === 'high' ? '#FEF3C7' : r.priority === 'medium' ? '#DBEAFE' : '#F3F4F6' },
                          ]}>
                            <Text style={[
                              styles.recPriorityText,
                              { color: r.priority === 'critical' ? '#991B1B' : r.priority === 'high' ? '#92400E' : r.priority === 'medium' ? '#1E40AF' : '#4B5563' },
                            ]}>
                              {r.priority === 'critical' ? 'Critique' : r.priority === 'high' ? 'Haute' : r.priority === 'medium' ? 'Moyenne' : 'Basse'}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.recText, { color: colors.text }]}>{r.text || r}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Nouvelle analyse button + Historique toggle */}
            <View style={styles.resultActions}>
              <Pressable style={[styles.newAnalysisBtn, { backgroundColor: colors.primary }]} onPress={handleNewAnalysis}>
                <MaterialCommunityIcons name="camera-plus" size={20} color="#FFF" />
                <Text style={styles.newAnalysisText}>Nouvelle analyse</Text>
              </Pressable>
            </View>
            {analysisHistory.length > 0 && (
              <Pressable onPress={() => setShowAnalysisHistory(!showAnalysisHistory)} style={[styles.historyToggle, { borderColor: colors.glassBorder }]}>
                <MaterialCommunityIcons name="history" size={18} color={colors.primary} />
                <Text style={[styles.historyToggleText, { color: colors.primary }]}>
                  {showAnalysisHistory ? 'Masquer' : 'Voir'} l'historique ({analysisHistory.length})
                </Text>
                <MaterialCommunityIcons name={showAnalysisHistory ? 'chevron-up' : 'chevron-down'} size={18} color={colors.primary} />
              </Pressable>
            )}
            {showAnalysisHistory && analysisHistory.map((h: any, i: number) => (
              <View key={h.id || i} style={[styles.historyCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
                <View style={styles.historyCardLeft}>
                  <View style={[styles.historyCardIcon, { backgroundColor: colors.primaryPale }]}>
                    <MaterialCommunityIcons name="sprout" size={18} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.historyCardCrop, { color: colors.text }]}>{h.detected_crop || 'Analyse'}</Text>
                    <Text style={[styles.historyCardDate, { color: colors.textTertiary }]}>
                      {h.created_at ? new Date(h.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                    </Text>
                  </View>
                </View>
                <View style={styles.historyCardBadges}>
                  {h.confidence_score != null && (
                    <View style={[
                      styles.historyBadge,
                      { backgroundColor: h.confidence_score >= 70 ? '#D1FAE5' : '#FEF3C7' },
                    ]}>
                      <Text style={[
                        styles.historyBadgeText,
                        { color: h.confidence_score >= 70 ? '#065F46' : '#92400E' },
                      ]}>{Math.round(h.confidence_score)}%</Text>
                    </View>
                  )}
                  {h.health_score != null && (
                    <View style={[
                      styles.historyBadge,
                      { backgroundColor: h.health_score >= 70 ? '#D1FAE5' : '#FEF3C7' },
                    ]}>
                      <Text style={[
                        styles.historyBadgeText,
                        { color: h.health_score >= 70 ? '#065F46' : '#92400E' },
                      ]}>S: {Math.round(h.health_score)}</Text>
                    </View>
                  )}
                  {h.disease_detected && (
                    <View style={[styles.historyBadge, { backgroundColor: '#FEE2E2' }]}>
                      <Text style={[styles.historyBadgeText, { color: '#991B1B' }]}>⚠</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[
        styles.header,
        { paddingTop: insets.top + 8, backgroundColor: isDark ? 'rgba(8,12,20,0.85)' : 'rgba(246,248,250,0.85)', borderBottomColor: colors.glassBorder },
      ]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={[styles.headerIcon, { backgroundColor: colors.glassTint }]}>
            <MaterialCommunityIcons name="terrain" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Parcelles & Cultures</Text>
            <Text style={[styles.headerSub, { color: colors.textTertiary }]}>Gestion et analyse des parcelles</Text>
          </View>
        </View>
        <Pressable onPress={onRefresh} style={styles.headerBtn}>
          <MaterialCommunityIcons name="refresh" size={22} color={colors.primary} />
        </Pressable>
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBar, { backgroundColor: isDark ? 'rgba(8,12,20,0.80)' : 'rgba(246,248,250,0.80)', borderBottomColor: colors.glassBorder }]}>
        {TAB_ITEMS.map((tab) => (
          <Pressable
            key={tab.key}
            style={[
              styles.tabItem,
              activeTab === tab.key && [styles.tabItemActive, { backgroundColor: colors.glassTint, borderColor: colors.primary }],
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <MaterialCommunityIcons
              name={tab.icon}
              size={18}
              color={activeTab === tab.key ? colors.primary : colors.textTertiary}
            />
            <Text style={[
              styles.tabLabel,
              { color: activeTab === tab.key ? colors.primary : colors.textTertiary },
              activeTab === tab.key && { fontWeight: '600' },
            ]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Tab content */}
      {activeTab === 'cultures' && renderCulturesTab()}
      {activeTab === 'carte' && renderMapTab()}
      {activeTab === 'ia' && renderAnalysisTab()}

      {/* Create parcel form modal */}
      <Modal visible={showCreateForm} animationType="slide" transparent onRequestClose={() => setShowCreateForm(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => { setShowCreateForm(false); setCreatePoint(null); }} />
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Ajouter une parcelle</Text>

            {createPoint && (
              <View style={[styles.coordsBadge, { backgroundColor: colors.primaryPale }]}>
                <MaterialCommunityIcons name="map-marker" size={14} color={colors.primary} />
                <Text style={[styles.coordsText, { color: colors.primary }]}>
                  {createPoint.latitude.toFixed(5)}, {createPoint.longitude.toFixed(5)}
                </Text>
              </View>
            )}

            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.primaryBackground }]}
              placeholder="Nom de la parcelle *" placeholderTextColor={colors.textTertiary}
              value={createForm.name} onChangeText={(v) => setCreateForm((d) => ({ ...d, name: v }))} />

            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.primaryBackground }]}
              placeholder="Description (optionnelle)" placeholderTextColor={colors.textTertiary}
              value={createForm.description} onChangeText={(v) => setCreateForm((d) => ({ ...d, description: v }))}
              multiline numberOfLines={2} />

            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.primaryBackground }]}
              placeholder="Superficie (ha)" placeholderTextColor={colors.textTertiary}
              value={createForm.size_ha} onChangeText={(v) => setCreateForm((d) => ({ ...d, size_ha: v }))}
              keyboardType="decimal-pad" />

            {creatingLoading && (
              <View style={[styles.analyzingBadge, { backgroundColor: colors.primaryPale }]}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.analyzingText, { color: colors.primary }]}>Analyse en cours...</Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, { backgroundColor: colors.glass }]} onPress={() => { setShowCreateForm(false); setCreatePoint(null); setCreating(false); }}>
                <Text style={[styles.modalBtnText, { color: colors.text }]}>Annuler</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={handleSaveCreate} disabled={creatingLoading}>
                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>Ajouter</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit parcel modal */}
      <Modal visible={showEditForm} animationType="slide" transparent onRequestClose={() => setShowEditForm(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowEditForm(false)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Modifier la parcelle</Text>
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.primaryBackground }]}
              placeholder="Nom" placeholderTextColor={colors.textTertiary}
              value={editForm.name} onChangeText={(v) => setEditForm((d) => ({ ...d, name: v }))} />
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.primaryBackground }]}
              placeholder="Description" placeholderTextColor={colors.textTertiary}
              value={editForm.description} onChangeText={(v) => setEditForm((d) => ({ ...d, description: v }))}
              multiline numberOfLines={2} />
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.primaryBackground }]}
              placeholder="Superficie (ha)" placeholderTextColor={colors.textTertiary}
              value={editForm.size_ha} onChangeText={(v) => setEditForm((d) => ({ ...d, size_ha: v }))}
              keyboardType="decimal-pad" />
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, { backgroundColor: colors.glass }]} onPress={() => setShowEditForm(false)}>
                <Text style={[styles.modalBtnText, { color: colors.text }]}>Annuler</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={handleSaveEdit}>
                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>Enregistrer</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Region info panel */}
      <Modal visible={showRegionPanel} animationType="slide" transparent onRequestClose={() => setShowRegionPanel(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowRegionPanel(false)} />
          <View style={[styles.regionPanelSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            {selectedRegion && (
              <>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedRegion.name}</Text>
                <Text style={[styles.regionDesc, { color: colors.textSecondary }]}>{selectedRegion.description}</Text>
                <View style={styles.regionDetailGrid}>
                  <View style={[styles.regionDetailItem, { backgroundColor: colors.primaryBackground }]}>
                    <Text style={[styles.regionDetailLabel, { color: colors.textTertiary }]}>Capitale</Text>
                    <Text style={[styles.regionDetailValue, { color: colors.text }]}>{selectedRegion.capital}</Text>
                  </View>
                  <View style={[styles.regionDetailItem, { backgroundColor: colors.primaryBackground }]}>
                    <Text style={[styles.regionDetailLabel, { color: colors.textTertiary }]}>Sol</Text>
                    <Text style={[styles.regionDetailValue, { color: colors.text }]}>{selectedRegion.soil}</Text>
                  </View>
                  <View style={[styles.regionDetailItem, { backgroundColor: colors.primaryBackground }]}>
                    <Text style={[styles.regionDetailLabel, { color: colors.textTertiary }]}>Climat</Text>
                    <Text style={[styles.regionDetailValue, { color: colors.text }]}>{selectedRegion.climate}</Text>
                  </View>
                  <View style={[styles.regionDetailItem, { backgroundColor: colors.primaryBackground }]}>
                    <Text style={[styles.regionDetailLabel, { color: colors.textTertiary }]}>Température</Text>
                    <Text style={[styles.regionDetailValue, { color: colors.text }]}>{selectedRegion.temperature}</Text>
                  </View>
                  <View style={[styles.regionDetailItem, { backgroundColor: colors.primaryBackground }]}>
                    <Text style={[styles.regionDetailLabel, { color: colors.textTertiary }]}>Pluie</Text>
                    <Text style={[styles.regionDetailValue, { color: colors.text }]}>{selectedRegion.rainfall}</Text>
                  </View>
                  <View style={[styles.regionDetailItem, { backgroundColor: colors.primaryBackground }]}>
                    <Text style={[styles.regionDetailLabel, { color: colors.textTertiary }]}>Altitude</Text>
                    <Text style={[styles.regionDetailValue, { color: colors.text }]}>{selectedRegion.altitude}</Text>
                  </View>
                </View>
                <Text style={[styles.regionCropsTitle, { color: colors.text }]}>Cultures principales</Text>
                <View style={styles.regionCropsRow}>
                  {selectedRegion.mainCrops?.split(',').map((c: string, i: number) => (
                    <View key={i} style={[styles.regionCropBadge, { backgroundColor: colors.primaryPale }]}>
                      <Text style={[styles.regionCropBadgeText, { color: colors.primary }]}>{c.trim()}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function HealthRing({ score, healthLabel }: { score: number; healthLabel?: { label?: string; color?: string } }) {
  const { colors } = useTheme();
  const clamped = Math.min(100, Math.max(0, score));
  const color = clamped >= 80 ? '#10B981' : clamped >= 60 ? '#F59E0B' : clamped >= 40 ? '#F97316' : '#EF4444';
  const label = healthLabel?.label || (clamped >= 80 ? 'Excellent' : clamped >= 60 ? 'Bon' : clamped >= 40 ? 'Moyen' : 'Faible');
  return (
    <View style={styles.healthRingWrap}>
      <View style={[styles.healthRingOuter, { borderColor: color }]}>
        <View style={[styles.healthRingInner, { backgroundColor: colors.glass }]}>
          <Text style={[styles.healthRingScore, { color }]}>{Math.round(clamped)}</Text>
          <Text style={[styles.healthRingUnit, { color: colors.textTertiary }]}>/100</Text>
        </View>
      </View>
      <Text style={[styles.healthRingLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ─── Header ──────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { padding: 8 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 4 },
  headerIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  headerSub: { fontSize: 11, marginTop: 1 },

  // ─── Tab bar ─────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabItemActive: {
    borderWidth: 1,
  },
  tabLabel: { fontSize: 13, fontWeight: '500' },

  // ─── Map tab ─────────────────────────────────────────────
  mapTabContainer: { flex: 1 },
  mapContainer: { height: MAP_HEIGHT, position: 'relative' },
  map: { flex: 1 },
  mapOverlayTop: {
    position: 'absolute',
    top: 10,
    right: 10,
    gap: 8,
  },
  mapBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  emptyOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 40,
  },
  emptyOverlayTitle: { fontSize: 17, fontWeight: '600' },
  emptyOverlaySub: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  mapHint: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  mapHintText: { color: '#FFF', fontSize: 12, fontWeight: '500' },

  // ─── Detail panel ────────────────────────────────────────
  detailPanel: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingTop: 4,
    zIndex: 10,
  },
  detailPanelHandle: { alignItems: 'center', paddingVertical: 6 },
  handleBar: { width: 36, height: 4, borderRadius: 2 },
  detailScroll: { flex: 1, paddingHorizontal: SPACING.LG - 4 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  detailIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  detailTitleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailName: { fontSize: 18, fontWeight: '700' },
  sizeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  sizeBadgeText: { fontSize: 11, fontWeight: '600' },
  detailActions: { flexDirection: 'row', gap: 4 },
  detailActionBtn: { padding: 6 },
  detailBottomRow: { marginTop: 12, marginBottom: 20 },
  analyzeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12 },
  analyzeBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, marginBottom: 12 },
  locationText: { fontSize: 12, flex: 1 },

  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metricCard: {
    width: (SCREEN_WIDTH - 36) / 2,
    padding: 14,
    borderRadius: 12,
    gap: 4,
  },
  metricValue: { fontSize: 14, fontWeight: '600' },
  metricLabel: { fontSize: 11, fontWeight: '500' },

  scoreCard: { padding: 14, borderRadius: 12, marginBottom: 12 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  scoreLabel: { fontSize: 14, fontWeight: '600' },
  scoreValue: { fontSize: 14, fontWeight: '700' },
  scoreBarTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(150,150,150,0.15)', overflow: 'hidden' },
  scoreBarFill: { height: '100%', borderRadius: 3 },

  recommendedSection: { marginBottom: 12 },
  sectionLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  recommendedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cropBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  cropBadgeText: { fontSize: 12, fontWeight: '500' },

  // ─── List bar ────────────────────────────────────────────
  listBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  listBarTitle: { fontSize: 16, fontWeight: '700' },
  listBarRefresh: { padding: 4 },

  // ─── Callout ─────────────────────────────────────────────
  callout: { padding: 4, minWidth: 100 },
  calloutTitle: { fontSize: 14, fontWeight: '600', color: '#333' },
  calloutDesc: { fontSize: 12, color: '#666', marginTop: 2 },

  // ─── Cultures tab ────────────────────────────────────────
  tabContent: { flex: 1 },
  culturesScroll: { padding: SPACING.LG, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  sectionSub: { fontSize: 13, marginBottom: SPACING.LG, lineHeight: 18 },

  regionChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: SPACING.LG },
  regionChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  regionChipText: { fontSize: 12, fontWeight: '500' },

  regionInfoCard: { padding: SPACING.MD, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, marginBottom: SPACING.LG },
  regionInfoTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  regionInfoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  regionInfoItem: { width: (SCREEN_WIDTH - 68) / 2, padding: 12, borderRadius: 10, gap: 4 },
  regionInfoLabel: { fontSize: 11, fontWeight: '500' },
  regionInfoValue: { fontSize: 13, fontWeight: '600' },

  culturesList: {},
  cultureCard: { padding: SPACING.MD, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, marginBottom: 10 },
  cultureHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  cultureIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cultureInfo: { flex: 1 },
  cultureName: { fontSize: 16, fontWeight: '600' },
  cultureSciName: { fontSize: 12, marginTop: 1 },
  scoreBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  scoreBadgeText: { fontSize: 12, fontWeight: '700' },
  cultureDesc: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  cultureMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  cultureTag: { fontSize: 12 },

  // ─── Analysis tab ────────────────────────────────────────
  analysisScroll: { padding: SPACING.LG, paddingBottom: 40 },
  fieldLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  parcelSelector: { flexDirection: 'row', marginBottom: SPACING.LG },
  parcelSelectorChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: 8,
  },
  parcelSelectorText: { fontSize: 13, fontWeight: '500' },

  pickerRow: { flexDirection: 'row', gap: 10, marginBottom: SPACING.MD },
  pickerBtn: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    gap: 10,
  },
  pickerIconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  pickerBtnLabel: { fontSize: 14, fontWeight: '600' },
  pickerBtnHint: { fontSize: 12 },

  previewCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: SPACING.MD,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImageFull: { width: '100%', height: 260, resizeMode: 'cover' as const },
  removeImageBtn: { position: 'absolute', top: 10, right: 10, zIndex: 10 },
  previewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingTop: 40,
  },
  runAnalysisBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  runAnalysisText: { color: '#FFF', fontSize: 16, fontWeight: '600' },

  stepsCard: { padding: SPACING.MD, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, marginBottom: SPACING.MD },
  stepsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  stepsTitle: { fontSize: 16, fontWeight: '600' },
  stepsList: { gap: 0 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepIndicator: { alignItems: 'center', width: 28 },
  stepDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepLine: { width: 2, flex: 1, marginVertical: 2, minHeight: 20 },
  stepLabel: { fontSize: 14, paddingTop: 4 },

  banner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  bannerContent: { flex: 1 },
  bannerTitle: { fontSize: 13, fontWeight: '700' },
  bannerText: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  bannerBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },

  resultContainer: { gap: 10, marginBottom: SPACING.LG },

  heroCard: {
    flexDirection: 'row',
    padding: SPACING.MD,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    gap: 12,
  },
  heroLeft: { flex: 1, gap: 8 },
  heroIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  heroCropName: { fontSize: 22, fontWeight: '800' },
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  heroBadgeText: { fontSize: 11, fontWeight: '600' },

  metricsGridAnalysis: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCardAnalysis: {
    width: (SCREEN_WIDTH - 52) / 2,
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  metricCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metricCardTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  metricCardValue: { fontSize: 15, fontWeight: '600' },
  metricRiskRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  riskDot: { width: 8, height: 8, borderRadius: 4 },
  metricRiskText: { fontSize: 12 },
  metricHint: { fontSize: 11, lineHeight: 15, marginTop: 2 },
  metricEmpty: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metricEmptyText: { fontSize: 13, fontWeight: '500' },
  nutrientRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  nutrientText: { fontSize: 13, flex: 1 },
  metricQualityRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  economicGrid: { gap: 6 },
  economicRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  economicLabel: { fontSize: 12 },
  economicValue: { fontSize: 13, fontWeight: '600' },
  economicDivider: { height: StyleSheet.hairlineWidth, marginVertical: 2 },
  marginBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4 },
  marginText: { fontSize: 11, fontWeight: '600' },

  recSection: { marginTop: 4 },
  recSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  recSectionTitle: { fontSize: 16, fontWeight: '600' },
  recCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  recCardContent: { gap: 8 },
  recCardHeader: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  recCategoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  recCategoryText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  recPriorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  recPriorityText: { fontSize: 10, fontWeight: '600' },
  recText: { fontSize: 13, lineHeight: 18 },

  resultActions: { marginTop: 4 },
  newAnalysisBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  newAnalysisText: { color: '#FFF', fontSize: 16, fontWeight: '600' },

  historyToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 4 },
  historyToggleText: { fontSize: 13, fontWeight: '500' },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 6,
  },
  historyCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  historyCardIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  historyCardCrop: { fontSize: 14, fontWeight: '600' },
  historyCardDate: { fontSize: 11, marginTop: 1 },
  historyCardBadges: { flexDirection: 'row', gap: 4 },
  historyBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  historyBadgeText: { fontSize: 11, fontWeight: '700' },

  healthRingWrap: { alignItems: 'center', gap: 6 },
  healthRingOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthRingInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthRingScore: { fontSize: 26, fontWeight: '800' },
  healthRingUnit: { fontSize: 11, marginTop: -2 },
  healthRingLabel: { fontSize: 12, fontWeight: '600' },

  // ─── Modals ──────────────────────────────────────────────
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: SPACING.LG,
    paddingBottom: 40,
  },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: SPACING.LG },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalBtnText: { fontSize: 16, fontWeight: '600' },
  coordsBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginBottom: 12, alignSelf: 'flex-start' },
  coordsText: { fontSize: 12, fontWeight: '500' },
  analyzingBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, marginBottom: 8 },
  analyzingText: { fontSize: 13, fontWeight: '500' },

  // ─── Region panel ────────────────────────────────────────
  regionPanelSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: SPACING.LG,
    paddingBottom: 40,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  regionDesc: { fontSize: 13, lineHeight: 19, marginBottom: SPACING.MD },
  regionDetailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.MD },
  regionDetailItem: { width: (SCREEN_WIDTH - 44) / 2, padding: 12, borderRadius: 10, gap: 4 },
  regionDetailLabel: { fontSize: 11, fontWeight: '500' },
  regionDetailValue: { fontSize: 13, fontWeight: '600' },
  regionCropsTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  regionCropsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  regionCropBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  regionCropBadgeText: { fontSize: 12, fontWeight: '500' },

  // ─── Common ──────────────────────────────────────────────
  centerPad: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
