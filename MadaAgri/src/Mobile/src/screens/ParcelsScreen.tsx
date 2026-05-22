import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { ScreenHeader } from '../components/ScreenHeader';
import { ModernCard } from '../components/ModernCard';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';
import parcelService from '../services/parcelService';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ASPECT_RATIO = 3 / 4;
const LATITUDE_DELTA = 0.05;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const DEFAULT_REGION = {
  latitude: -18.8792,
  longitude: 47.5079,
  latitudeDelta: LATITUDE_DELTA,
  longitudeDelta: LONGITUDE_DELTA,
};

export default function ParcelsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation(['common', 'dashboard']);
  const mapRef = useRef(null);

  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [analyzing, setAnalyzing] = useState(null);

  const [formData, setFormData] = useState({
    name: '', description: '', latitude: '', longitude: '', size_ha: '',
  });

  const fetchParcels = useCallback(async () => {
    try {
      const data = await parcelService.getParcels();
      setParcels(data);
    } catch (err) {
      console.error('[Parcels] fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchParcels(); }, [fetchParcels]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchParcels();
  }, [fetchParcels]);

  const openCreateForm = useCallback(() => {
    setFormMode('create');
    setFormData({ name: '', description: '', latitude: '', longitude: '', size_ha: '' });
    setShowForm(true);
  }, []);

  const openEditForm = useCallback((parcel) => {
    setFormMode('edit');
    setFormData({
      name: parcel.name || '',
      description: parcel.description || '',
      latitude: String(parcel.latitude || ''),
      longitude: String(parcel.longitude || ''),
      size_ha: String(parcel.size_ha || ''),
    });
    setSelectedParcel(parcel);
    setShowForm(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!formData.name.trim() || !formData.latitude || !formData.longitude) {
      Alert.alert('Erreur', 'Nom, latitude et longitude requis');
      return;
    }
    try {
      if (formMode === 'create') {
        const newParcel = await parcelService.createParcel({
          name: formData.name.trim(),
          description: formData.description.trim(),
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          size_ha: formData.size_ha ? parseFloat(formData.size_ha) : null,
        });
        setParcels((prev) => [newParcel, ...prev]);
        mapRef.current?.animateToRegion({
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }, 1000);
      } else if (formMode === 'edit' && selectedParcel) {
        await parcelService.updateParcel(selectedParcel.id, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          size_ha: formData.size_ha ? parseFloat(formData.size_ha) : null,
        });
        setParcels((prev) => prev.map((p) =>
          p.id === selectedParcel.id ? { ...p, ...formData, latitude: parseFloat(formData.latitude), longitude: parseFloat(formData.longitude) } : p
        ));
      }
      setShowForm(false);
      setSelectedParcel(null);
    } catch (err) {
      Alert.alert('Erreur', err.message);
    }
  }, [formData, formMode, selectedParcel]);

  const handleDelete = useCallback((parcel) => {
    Alert.alert(
      t('delete') || 'Supprimer',
      `Supprimer la parcelle "${parcel.name}" ?`,
      [
        { text: t('cancel') || 'Annuler', style: 'cancel' },
        {
          text: t('delete') || 'Supprimer', style: 'destructive',
          onPress: async () => {
            try {
              await parcelService.deleteParcel(parcel.id);
              setParcels((prev) => prev.filter((p) => p.id !== parcel.id));
              if (selectedParcel?.id === parcel.id) setSelectedParcel(null);
            } catch (err) {
              Alert.alert('Erreur', err.message);
            }
          },
        },
      ]
    );
  }, [selectedParcel, t]);

  const handleAnalyzeCrop = useCallback(async (parcel) => {
    setAnalyzing(parcel.id);
    try {
      const analysis = await parcelService.analyzeCrop(parcel.id);
      Alert.alert(
        'Analyse IA',
        `Culture: ${analysis.detected_crop || analysis.recommended_crops?.[0] || 'Non déterminée'}\nScore: ${analysis.suitability_score || analysis.confidence_score || 'N/A'}`,
        [{ text: 'OK' }]
      );
    } catch (err) {
      Alert.alert('Erreur', err.message);
    } finally {
      setAnalyzing(null);
    }
  }, []);

  const markers = useMemo(() =>
    parcels.filter((p) => p.latitude && p.longitude).map((p) => ({
      id: p.id,
      latitude: parseFloat(p.latitude),
      longitude: parseFloat(p.longitude),
      title: p.name,
      description: `${p.size_ha || '?'} ha`,
    })),
    [parcels]
  );

  const renderParcelItem = useCallback(({ item }) => {
    const isAnalyzing = analyzing === item.id;
    return (
      <Pressable
        onPress={() => {
          setSelectedParcel(item);
          if (item.latitude && item.longitude) {
            mapRef.current?.animateToRegion({
              latitude: parseFloat(item.latitude),
              longitude: parseFloat(item.longitude),
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA,
            }, 800);
          }
        }}
      >
        <ModernCard style={[styles.parcelCard, selectedParcel?.id === item.id && { borderColor: colors.primary, borderWidth: 1.5 }]} shadow="subtle">
          <View style={styles.parcelHeader}>
            <View style={[styles.parcelIcon, { backgroundColor: colors.primaryPale }]}>
              <MaterialCommunityIcons name="terrain" size={22} color={colors.primary} />
            </View>
            <View style={styles.parcelInfo}>
              <Text style={[styles.parcelName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
              <Text style={[styles.parcelDetail, { color: colors.textSecondary }]}>
                {item.size_ha ? `${item.size_ha} ha` : ''} {item.region ? `· ${item.region}` : ''}
              </Text>
            </View>
            <View style={styles.parcelActions}>
              <Pressable onPress={() => handleAnalyzeCrop(item)} disabled={isAnalyzing} style={styles.actionBtn}>
                {isAnalyzing ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <MaterialCommunityIcons name="brain" size={20} color={colors.primary} />
                )}
              </Pressable>
              <Pressable onPress={() => openEditForm(item)} style={styles.actionBtn}>
                <MaterialCommunityIcons name="pencil" size={18} color={colors.textSecondary} />
              </Pressable>
              <Pressable onPress={() => handleDelete(item)} style={styles.actionBtn}>
                <MaterialCommunityIcons name="delete-outline" size={18} color={colors.error} />
              </Pressable>
            </View>
          </View>
          {item.soil_type && (
            <View style={styles.parcelMeta}>
              <Text style={[styles.metaBadge, { backgroundColor: colors.primaryPale, color: colors.primary }]}>
                {item.soil_type}
              </Text>
              {item.suitability_score && (
                <Text style={[styles.metaBadge, { backgroundColor: '#FEF3C7', color: '#D97706' }]}>
                  Score: {item.suitability_score}/100
                </Text>
              )}
            </View>
          )}
        </ModernCard>
      </Pressable>
    );
  }, [colors, selectedParcel, analyzing, handleAnalyzeCrop, openEditForm, handleDelete]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.primaryBackground }]}>
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={DEFAULT_REGION}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          showsUserLocation
          showsMyLocationButton
        >
          {markers.map((m) => (
            <Marker
              key={m.id}
              coordinate={{ latitude: m.latitude, longitude: m.longitude }}
              title={m.title}
              description={m.description}
              pinColor={selectedParcel?.id === m.id ? colors.primary : '#E74C3C'}
              onPress={() => {
                const parcel = parcels.find((p) => p.id === m.id);
                if (parcel) setSelectedParcel(parcel);
              }}
            />
          ))}
        </MapView>

        <Pressable
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={openCreateForm}
        >
          <MaterialCommunityIcons name="plus" size={28} color="#fff" />
        </Pressable>
      </View>

      <View style={[styles.listContainer, { backgroundColor: colors.card }]}>
        <View style={[styles.listHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.listTitle, { color: colors.text }]}>
            {t('parcels') || 'Parcelles'} ({parcels.length})
          </Text>
          <Pressable onPress={onRefresh}>
            <MaterialCommunityIcons name="refresh" size={22} color={colors.primary} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : parcels.length === 0 ? (
          <View style={styles.emptyRow}>
            <MaterialCommunityIcons name="terrain" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t('noParcels') || 'Aucune parcelle. Ajoutez-en une avec le bouton +'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={parcels}
            keyExtractor={(item) => item.id}
            renderItem={renderParcelItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <Modal visible={showForm} animationType="slide" transparent onRequestClose={() => setShowForm(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowForm(false)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {formMode === 'create' ? (t('addParcel') || 'Ajouter une parcelle') : (t('editParcel') || 'Modifier la parcelle')}
            </Text>

            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.primaryBackground }]}
              placeholder="Nom de la parcelle *" placeholderTextColor={colors.textTertiary}
              value={formData.name} onChangeText={(v) => setFormData((d) => ({ ...d, name: v }))} />

            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.primaryBackground }]}
              placeholder="Description" placeholderTextColor={colors.textTertiary}
              value={formData.description} onChangeText={(v) => setFormData((d) => ({ ...d, description: v }))}
              multiline numberOfLines={2} />

            <View style={styles.row}>
              <TextInput style={[styles.inputHalf, { color: colors.text, borderColor: colors.border, backgroundColor: colors.primaryBackground }]}
                placeholder="Latitude *" placeholderTextColor={colors.textTertiary}
                value={formData.latitude} onChangeText={(v) => setFormData((d) => ({ ...d, latitude: v }))}
                keyboardType="decimal-pad" />
              <TextInput style={[styles.inputHalf, { color: colors.text, borderColor: colors.border, backgroundColor: colors.primaryBackground }]}
                placeholder="Longitude *" placeholderTextColor={colors.textTertiary}
                value={formData.longitude} onChangeText={(v) => setFormData((d) => ({ ...d, longitude: v }))}
                keyboardType="decimal-pad" />
            </View>

            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.primaryBackground }]}
              placeholder="Superficie (ha)" placeholderTextColor={colors.textTertiary}
              value={formData.size_ha} onChangeText={(v) => setFormData((d) => ({ ...d, size_ha: v }))}
              keyboardType="decimal-pad" />

            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, { backgroundColor: colors.border }]} onPress={() => setShowForm(false)}>
                <Text style={[styles.modalBtnText, { color: colors.text }]}>{t('cancel') || 'Annuler'}</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={handleSave}>
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>{formMode === 'create' ? (t('add') || 'Ajouter') : (t('save') || 'Enregistrer')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapContainer: { height: 280, position: 'relative' },
  map: { flex: 1 },
  fab: {
    position: 'absolute', bottom: 12, right: 12,
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
    zIndex: 10,
  },
  listContainer: { flex: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: -20, zIndex: 5 },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.LG, paddingVertical: SPACING.MD, borderBottomWidth: StyleSheet.hairlineWidth },
  listTitle: { fontSize: 18, fontWeight: '700' },
  listContent: { padding: SPACING.LG },
  loadingRow: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyRow: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },

  parcelCard: { marginBottom: SPACING.MD, padding: SPACING.MD, borderRadius: BORDER_RADIUS.DEFAULT },
  parcelHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  parcelIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  parcelInfo: { flex: 1 },
  parcelName: { fontSize: 16, fontWeight: '600' },
  parcelDetail: { fontSize: 12, marginTop: 2 },
  parcelActions: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  actionBtn: { padding: 6 },
  parcelMeta: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  metaBadge: { fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, overflow: 'hidden' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingHorizontal: SPACING.LG, paddingBottom: 40 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: SPACING.LG },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 12 },
  inputHalf: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalBtnText: { fontSize: 16, fontWeight: '600' },
});
