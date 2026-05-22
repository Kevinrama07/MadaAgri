import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING } from '../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

interface LocationData {
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
}

interface Maneuver {
  instruction: string;
  distance: string;
  duration: string;
  type: string;
  modifier?: string;
}

interface RouteResult {
  coordinates: [number, number][];
  distance: string;
  duration: string;
  startLocation: LocationData;
  endLocation: LocationData;
  steps: Maneuver[];
}

const NOMINATIM_API = 'https://nominatim.openstreetmap.org';
const OSRM_API = 'https://router.project-osrm.org';

function getManeuverIcon(type: string, modifier?: string): string {
  if (type === 'depart') return 'map-marker';
  if (type === 'arrive') return 'map-marker-check';
  if (type === 'roundabout' || type === 'rotary') return 'rotate-right';
  if (modifier === 'sharp left') return 'arrow-top-left-thick';
  if (modifier === 'sharp right') return 'arrow-top-right-thick';
  if (modifier === 'left') return 'arrow-left-thick';
  if (modifier === 'right') return 'arrow-right-thick';
  if (modifier === 'slight left') return 'arrow-left-bold';
  if (modifier === 'slight right') return 'arrow-right-bold';
  if (modifier === 'straight') return 'arrow-up-thick';
  if (modifier === 'uturn') return 'rotate-180';
  return 'arrow-up-thick';
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m} min`;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

export default function RouteOptimizationScreen({ navigation }: any) {
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = mode === 'dark';
  const mapRef = useRef<MapView>(null);

  const [startLocation, setStartLocation] = useState<LocationData | null>(null);
  const [endLocation, setEndLocation] = useState<LocationData | null>(null);
  const [startSearchQuery, setStartSearchQuery] = useState('');
  const [endSearchQuery, setEndSearchQuery] = useState('');
  const [startSuggestions, setStartSuggestions] = useState<LocationData[]>([]);
  const [endSuggestions, setEndSuggestions] = useState<LocationData[]>([]);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showEndSuggestions, setShowEndSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState(false);

  const searchCacheRef = useRef<Record<string, LocationData[]>>({});
  const startTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (startTimerRef.current) clearTimeout(startTimerRef.current);
      if (endTimerRef.current) clearTimeout(endTimerRef.current);
    };
  }, []);

  const searchLocations = useCallback(async (query: string, isStart: boolean) => {
    if (!query || query.length < 2) {
      if (isStart) setStartSuggestions([]);
      else setEndSuggestions([]);
      return;
    }
    const cacheKey = query.toLowerCase().trim();
    if (searchCacheRef.current[cacheKey]) {
      const cached = searchCacheRef.current[cacheKey];
      if (isStart) setStartSuggestions(cached);
      else setEndSuggestions(cached);
      return;
    }
    setIsSearching(true);
    try {
      const response = await fetch(
        `${NOMINATIM_API}/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=mg`,
        { headers: { 'Accept': 'application/json', 'User-Agent': 'MadaAgri Mobile App' } }
      );
      if (!response.ok) throw new Error('Erreur');
      const results = await response.json();
      const suggestions: LocationData[] = results.map((item: any) => ({
        name: item.name || item.display_name.split(',')[0],
        displayName: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
      }));
      searchCacheRef.current[cacheKey] = suggestions;
      if (isStart) setStartSuggestions(suggestions);
      else setEndSuggestions(suggestions);
    } catch {
      if (isStart) setStartSuggestions([]);
      else setEndSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (startTimerRef.current) clearTimeout(startTimerRef.current);
    if (startSearchQuery) {
      startTimerRef.current = setTimeout(() => searchLocations(startSearchQuery, true), 300);
    } else {
      setStartSuggestions([]);
    }
  }, [startSearchQuery, searchLocations]);

  useEffect(() => {
    if (endTimerRef.current) clearTimeout(endTimerRef.current);
    if (endSearchQuery) {
      endTimerRef.current = setTimeout(() => searchLocations(endSearchQuery, false), 300);
    } else {
      setEndSuggestions([]);
    }
  }, [endSearchQuery, searchLocations]);

  const getCurrentLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Veuillez autoriser l\'accès à votre position');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      const response = await fetch(
        `${NOMINATIM_API}/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        { headers: { 'Accept': 'application/json', 'User-Agent': 'MadaAgri Mobile App' } }
      );
      const data = await response.json();
      const locationName = data.address?.city || data.address?.town || data.address?.village || data.name || 'Ma position';
      setStartLocation({ latitude, longitude, name: locationName, displayName: data.display_name || locationName });
      setStartSearchQuery(locationName);
      setShowStartSuggestions(false);
    } catch {
      Alert.alert('Erreur', 'Impossible d\'accéder à votre position');
    }
  }, []);

  const swapLocations = useCallback(() => {
    const tmpLoc = startLocation;
    const tmpQ = startSearchQuery;
    setStartLocation(endLocation);
    setStartSearchQuery(endSearchQuery);
    setEndLocation(tmpLoc);
    setEndSearchQuery(tmpQ);
    setRouteResult(null);
    setShowSteps(false);
  }, [startLocation, endLocation, startSearchQuery, endSearchQuery]);

  const calculateRoute = useCallback(async () => {
    if (!startLocation || !endLocation) {
      setError('Veuillez sélectionner un point de départ et une destination');
      return;
    }
    setIsCalculating(true);
    setError(null);
    setShowSteps(false);
    try {
      Keyboard.dismiss();
      const coordsString = `${startLocation.longitude},${startLocation.latitude};${endLocation.longitude},${endLocation.latitude}`;
      const response = await fetch(
        `${OSRM_API}/route/v1/driving/${coordsString}?geometries=geojson&overview=full&steps=true`,
        { headers: { 'Accept': 'application/json' } }
      );
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates: [number, number][] = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
        const steps: Maneuver[] = (route.legs?.[0]?.steps || []).map((s: any) => ({
          instruction: s.maneuver?.instruction || s.name || '',
          distance: formatDistance(s.distance || 0),
          duration: formatDuration(s.duration || 0),
          type: s.maneuver?.type || 'unknown',
          modifier: s.maneuver?.modifier,
        }));
        setRouteResult({
          coordinates,
          distance: (route.distance / 1000).toFixed(1),
          duration: (route.duration / 3600).toFixed(1),
          startLocation,
          endLocation,
          steps,
        });
        if (mapRef.current) {
          mapRef.current.fitToCoordinates(
            [
              { latitude: startLocation.latitude, longitude: startLocation.longitude },
              { latitude: endLocation.latitude, longitude: endLocation.longitude },
            ],
            { edgePadding: { top: 80, right: 40, bottom: 320, left: 40 }, animated: true }
          );
        }
      } else {
        setError('Impossible de calculer l\'itinéraire');
      }
    } catch {
      setError('Erreur lors du calcul de l\'itinéraire');
    } finally {
      setIsCalculating(false);
    }
  }, [startLocation, endLocation]);

  const dismissAll = useCallback(() => {
    setShowStartSuggestions(false);
    setShowEndSuggestions(false);
    Keyboard.dismiss();
  }, []);

  const handleClearStart = useCallback(() => {
    setStartLocation(null);
    setStartSearchQuery('');
    setStartSuggestions([]);
    setRouteResult(null);
    setShowSteps(false);
  }, []);

  const handleClearEnd = useCallback(() => {
    setEndLocation(null);
    setEndSearchQuery('');
    setEndSuggestions([]);
    setRouteResult(null);
    setShowSteps(false);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: isDark ? 'rgba(8,12,20,0.85)' : 'rgba(246,248,250,0.85)', borderBottomColor: colors.glassBorder }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={[styles.headerIcon, { backgroundColor: colors.glassTint }]}>
            <MaterialCommunityIcons name="map-marker-path" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Itinéraire</Text>
            <Text style={[styles.headerSub, { color: colors.textTertiary }]}>Optimisation de trajet</Text>
          </View>
        </View>
      </View>

      {/* Search section */}
      <View style={[styles.searchSection, { backgroundColor: isDark ? 'rgba(8,12,20,0.85)' : 'rgba(246,248,250,0.90)', borderBottomColor: colors.glassBorder }]}>
        <ScrollView
          style={styles.searchScroll}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          {/* Départ */}
          <View style={styles.searchRow}>
            <View style={[styles.pinDot, { backgroundColor: colors.primary }]}>
              <View style={[styles.pinInner, { backgroundColor: colors.primary }]} />
            </View>
            <View style={[styles.searchInputWrap, { backgroundColor: colors.glass, borderColor: showStartSuggestions ? colors.primary : colors.glassBorder }]}>
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Lieu de départ"
                placeholderTextColor={colors.textTertiary}
                value={startSearchQuery}
                onChangeText={(t) => { setStartSearchQuery(t); setShowStartSuggestions(true); }}
                onFocus={() => setShowStartSuggestions(true)}
              />
              {startSearchQuery ? (
                <Pressable onPress={handleClearStart} style={styles.clearBtn}>
                  <MaterialCommunityIcons name="close-circle" size={18} color={colors.textTertiary} />
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* Suggestions départ */}
          {showStartSuggestions && startSuggestions.length > 0 && (
            <View style={[styles.suggestionsBox, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
              {startSuggestions.map((s, i) => (
                <Pressable key={i} style={[styles.suggestionItem, { borderBottomColor: colors.glassBorder }]} onPress={() => { setStartLocation(s); setStartSearchQuery(s.name); setShowStartSuggestions(false); }}>
                  <MaterialCommunityIcons name="map-marker" size={16} color={colors.primary} />
                  <View style={styles.suggestionText}>
                    <Text style={[styles.suggestionName, { color: colors.text }]} numberOfLines={1}>{s.name}</Text>
                    <Text style={[styles.suggestionAddr, { color: colors.textTertiary }]} numberOfLines={1}>{s.displayName.split(',').slice(1).join(',').trim()}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {/* Swap + Ma position */}
          <View style={styles.actionRow}>
            <Pressable onPress={swapLocations} style={[styles.actionBtn, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
              <MaterialCommunityIcons name="swap-vertical" size={18} color={colors.primary} />
            </Pressable>
            <View style={[styles.actionDivider, { backgroundColor: colors.glassBorder }]} />
            <Pressable onPress={getCurrentLocation} style={[styles.actionBtn, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
              <MaterialCommunityIcons name="crosshairs-gps" size={18} color={colors.primary} />
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>Ma position</Text>
            </Pressable>
          </View>

          {/* Destination */}
          <View style={styles.searchRow}>
            <View style={[styles.pinDot, { backgroundColor: '#DC2626' }]}>
              <View style={[styles.pinInner, { backgroundColor: '#DC2626' }]} />
            </View>
            <View style={[styles.searchInputWrap, { backgroundColor: colors.glass, borderColor: showEndSuggestions ? '#DC2626' : colors.glassBorder }]}>
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Lieu de destination"
                placeholderTextColor={colors.textTertiary}
                value={endSearchQuery}
                onChangeText={(t) => { setEndSearchQuery(t); setShowEndSuggestions(true); }}
                onFocus={() => setShowEndSuggestions(true)}
              />
              {endSearchQuery ? (
                <Pressable onPress={handleClearEnd} style={styles.clearBtn}>
                  <MaterialCommunityIcons name="close-circle" size={18} color={colors.textTertiary} />
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* Suggestions destination */}
          {showEndSuggestions && endSuggestions.length > 0 && (
            <View style={[styles.suggestionsBox, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
              {endSuggestions.map((s, i) => (
                <Pressable key={i} style={[styles.suggestionItem, { borderBottomColor: colors.glassBorder }]} onPress={() => { setEndLocation(s); setEndSearchQuery(s.name); setShowEndSuggestions(false); }}>
                  <MaterialCommunityIcons name="map-marker" size={16} color="#DC2626" />
                  <View style={styles.suggestionText}>
                    <Text style={[styles.suggestionName, { color: colors.text }]} numberOfLines={1}>{s.name}</Text>
                    <Text style={[styles.suggestionAddr, { color: colors.textTertiary }]} numberOfLines={1}>{s.displayName.split(',').slice(1).join(',').trim()}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {/* Calculer */}
          <Pressable
            style={[styles.calcBtn, { backgroundColor: (!startLocation || !endLocation || isCalculating) ? colors.glassDarker : colors.primary }]}
            disabled={!startLocation || !endLocation || isCalculating}
            onPress={calculateRoute}
          >
            {isCalculating ? (
              <>
                <ActivityIndicator size="small" color="#FFF" />
                <Text style={styles.calcBtnText}>Calcul en cours...</Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="routes" size={20} color="#FFF" />
                <Text style={styles.calcBtnText}>Calculer l'itinéraire</Text>
              </>
            )}
          </Pressable>

          {/* Error */}
          {error && (
            <View style={[styles.errorBox, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
              <MaterialCommunityIcons name="alert-circle" size={18} color="#DC2626" />
              <Text style={[styles.errorText, { color: '#991B1B' }]}>{error}</Text>
              <Pressable onPress={calculateRoute} style={[styles.errorRetry, { backgroundColor: '#FEE2E2' }]}>
                <Text style={{ color: '#991B1B', fontSize: 12, fontWeight: '600' }}>Réessayer</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Map overlay to dismiss suggestions */}
      {(showStartSuggestions || showEndSuggestions) && (
        <Pressable style={StyleSheet.absoluteFill} onPress={dismissAll} pointerEvents="box-only" />
      )}

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{ latitude: -18.8792, longitude: 47.5079, latitudeDelta: 5, longitudeDelta: 5 }}
          onPress={dismissAll}
        >
          {startLocation && (
            <Marker coordinate={{ latitude: startLocation.latitude, longitude: startLocation.longitude }} title="Départ" description={startLocation.name} pinColor={colors.primary} />
          )}
          {endLocation && (
            <Marker coordinate={{ latitude: endLocation.latitude, longitude: endLocation.longitude }} title="Destination" description={endLocation.name} pinColor="#DC2626" />
          )}
          {routeResult && routeResult.coordinates.length > 0 && (
            <Polyline
              coordinates={routeResult.coordinates.map(c => ({ latitude: c[0], longitude: c[1] }))}
              strokeColor={colors.primary}
              strokeWidth={4}
            />
          )}
        </MapView>

        {/* Results panel */}
        {routeResult && (
          <View style={[styles.resultsPanel, { backgroundColor: isDark ? 'rgba(8,12,20,0.95)' : 'rgba(255,255,255,0.96)', borderTopColor: colors.glassBorder }]}>
            <View style={styles.resultsHandleRow}>
              <View style={[styles.resultsHandle, { backgroundColor: colors.glassBorder }]} />
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
                <MaterialCommunityIcons name="map-marker-distance" size={20} color={colors.primary} />
                <View style={styles.statContent}>
                  <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Distance</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>{routeResult.distance} km</Text>
                </View>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
                <MaterialCommunityIcons name="clock-outline" size={20} color={colors.primary} />
                <View style={styles.statContent}>
                  <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Durée</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>{routeResult.duration}h</Text>
                </View>
              </View>
            </View>

            {/* Locations A/B */}
            <View style={styles.locRow}>
              <View style={styles.locItem}>
                <View style={[styles.locPin, { backgroundColor: colors.primary }]}>
                  <Text style={styles.locPinText}>A</Text>
                </View>
                <Text style={[styles.locName, { color: colors.text }]} numberOfLines={1}>{routeResult.startLocation.name}</Text>
              </View>
              <View style={styles.locDivider}>
                <MaterialCommunityIcons name="arrow-down" size={14} color={colors.textTertiary} />
              </View>
              <View style={styles.locItem}>
                <View style={[styles.locPin, { backgroundColor: '#DC2626' }]}>
                  <Text style={styles.locPinText}>B</Text>
                </View>
                <Text style={[styles.locName, { color: colors.text }]} numberOfLines={1}>{routeResult.endLocation.name}</Text>
              </View>
            </View>

            {/* Steps toggle */}
            {routeResult.steps.length > 0 && (
              <>
                <Pressable onPress={() => setShowSteps(!showSteps)} style={styles.stepsToggle}>
                  <MaterialCommunityIcons name="sign-text" size={16} color={colors.primary} />
                  <Text style={[styles.stepsToggleText, { color: colors.primary }]}>
                    {showSteps ? 'Masquer' : 'Voir'} les directions ({routeResult.steps.length})
                  </Text>
                  <MaterialCommunityIcons name={showSteps ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primary} />
                </Pressable>
                {showSteps && (
                  <ScrollView style={styles.stepsList} nestedScrollEnabled>
                    {routeResult.steps.map((step, i) => (
                      <View key={i} style={[styles.stepItem, { borderBottomColor: colors.glassBorder }]}>
                        <View style={[styles.stepIconWrap, { backgroundColor: colors.primaryPale }]}>
                          <MaterialCommunityIcons name={getManeuverIcon(step.type, step.modifier) as any} size={16} color={colors.primary} />
                        </View>
                        <View style={styles.stepContent}>
                          <Text style={[styles.stepInstruction, { color: colors.text }]}>{step.instruction}</Text>
                          <Text style={[styles.stepMeta, { color: colors.textTertiary }]}>{step.distance} · {step.duration}</Text>
                        </View>
                        <Text style={[styles.stepDist, { color: colors.textSecondary }]}>{step.distance}</Text>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </>
            )}

            {/* New route button */}
            <Pressable style={[styles.newRouteBtn, { backgroundColor: colors.primary }]} onPress={() => { setRouteResult(null); setShowSteps(false); }}>
              <MaterialCommunityIcons name="plus" size={18} color="#FFF" />
              <Text style={styles.newRouteText}>Nouvel itinéraire</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
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

  // Search section
  searchSection: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    maxHeight: SCREEN_HEIGHT * 0.55,
  },
  searchScroll: { paddingHorizontal: SPACING.LG, paddingVertical: 12 },

  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  pinDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.15,
  },
  pinInner: { width: 10, height: 10, borderRadius: 5 },

  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 11 },
  clearBtn: { padding: 4 },

  suggestionsBox: {
    marginLeft: 38,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  suggestionText: { flex: 1 },
  suggestionName: { fontSize: 14, fontWeight: '600' },
  suggestionAddr: { fontSize: 11, marginTop: 1 },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    marginLeft: 38,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionBtnText: { fontSize: 13, fontWeight: '600' },
  actionDivider: { width: 1, height: 20 },

  calcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 6,
  },
  calcBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
  },
  errorText: { flex: 1, fontSize: 13, fontWeight: '500' },
  errorRetry: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },

  // Map
  mapContainer: { flex: 1, position: 'relative' },
  map: { flex: 1 },

  // Results panel
  resultsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: SPACING.LG,
    paddingTop: 8,
    maxHeight: SCREEN_HEIGHT * 0.45,
  },
  resultsHandleRow: { alignItems: 'center', marginBottom: 8 },
  resultsHandle: { width: 36, height: 4, borderRadius: 2 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statContent: { flex: 1 },
  statLabel: { fontSize: 11 },
  statValue: { fontSize: 18, fontWeight: '700' },

  locRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  locItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  locPin: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  locPinText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  locName: { fontSize: 13, fontWeight: '500', flex: 1 },
  locDivider: { alignItems: 'center' },

  stepsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'transparent',
  },
  stepsToggleText: { fontSize: 13, fontWeight: '500' },
  stepsList: { maxHeight: 140, marginBottom: 8 },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stepIconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  stepContent: { flex: 1 },
  stepInstruction: { fontSize: 13, fontWeight: '500' },
  stepMeta: { fontSize: 11, marginTop: 1 },
  stepDist: { fontSize: 12, fontWeight: '600' },

  newRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  newRouteText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});
