import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '../contexts/ThemeContext';
import { ScreenHeader } from '../components/ScreenHeader';
import { ModernCard } from '../components/ModernCard';
import { SPACING, BORDER_RADIUS } from '../theme';

interface LocationData {
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
}

interface RouteResult {
  coordinates: [number, number][];
  distance: string;
  duration: string;
  startLocation: LocationData;
  endLocation: LocationData;
}

const NOMINATIM_API = 'https://nominatim.openstreetmap.org';
const OSRM_API = 'https://router.project-osrm.org';

export default function RouteOptimizationScreen({ navigation }: any) {
  const { colors } = useTheme();
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

  const searchCacheRef = useRef<Record<string, LocationData[]>>({});

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    content: {
      flex: 1,
    },
    searchSection: {
      padding: SPACING.LG,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pageTitle: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.text,
      marginBottom: 4,
    },
    pageSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: SPACING.LG,
    },
    searchInputContainer: {
      marginBottom: SPACING.MD,
    },
    searchInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryBackground,
      borderRadius: BORDER_RADIUS.DEFAULT,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: SPACING.MD,
    },
    searchInputWrapperFocused: {
      borderColor: colors.primary,
    },
    searchInput: {
      flex: 1,
      paddingVertical: SPACING.SM,
      fontSize: 14,
      color: colors.text,
    },
    clearButton: {
      padding: SPACING.XS,
    },
    suggestionsContainer: {
      marginTop: SPACING.SM,
      backgroundColor: colors.card,
      borderRadius: BORDER_RADIUS.DEFAULT,
      borderWidth: 1,
      borderColor: colors.border,
      maxHeight: 200,
    },
    suggestionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: SPACING.MD,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    suggestionIcon: {
      marginRight: SPACING.SM,
    },
    suggestionText: {
      flex: 1,
    },
    suggestionName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    suggestionAddress: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    controlButtons: {
      flexDirection: 'row',
      gap: SPACING.SM,
      marginBottom: SPACING.MD,
    },
    controlButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.XS,
      paddingVertical: SPACING.SM,
      paddingHorizontal: SPACING.MD,
      borderRadius: BORDER_RADIUS.DEFAULT,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    controlButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primary,
    },
    calculateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.SM,
      paddingVertical: SPACING.MD,
      borderRadius: BORDER_RADIUS.DEFAULT,
      backgroundColor: colors.primary,
    },
    calculateButtonDisabled: {
      backgroundColor: colors.border,
    },
    calculateButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.SM,
      padding: SPACING.MD,
      backgroundColor: colors.error + '20',
      borderRadius: BORDER_RADIUS.DEFAULT,
      marginTop: SPACING.MD,
    },
    errorText: {
      flex: 1,
      fontSize: 13,
      color: colors.error,
    },
    mapContainer: {
      flex: 1,
    },
    map: {
      flex: 1,
    },
    resultsPanel: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.card,
      borderTopLeftRadius: BORDER_RADIUS.LARGE,
      borderTopRightRadius: BORDER_RADIUS.LARGE,
      padding: SPACING.LG,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
    resultsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.SM,
      marginBottom: SPACING.MD,
    },
    resultsTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    statsRow: {
      flexDirection: 'row',
      gap: SPACING.MD,
      marginBottom: SPACING.MD,
    },
    statCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.SM,
      padding: SPACING.MD,
      backgroundColor: colors.primaryBackground,
      borderRadius: BORDER_RADIUS.DEFAULT,
    },
    statContent: {
      flex: 1,
    },
    statLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    statValue: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.primary,
    },
    locationsContainer: {
      gap: SPACING.SM,
    },
    locationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.SM,
      padding: SPACING.SM,
      backgroundColor: colors.primaryBackground,
      borderRadius: BORDER_RADIUS.DEFAULT,
    },
    locationPin: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.primary,
    },
    locationPinText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    locationDetails: {
      flex: 1,
    },
    locationLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    locationName: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
  });

  // Recherche de lieux avec Nominatim
  const searchLocations = useCallback(async (query: string, isStart: boolean) => {
    if (!query || query.length < 2) {
      if (isStart) {
        setStartSuggestions([]);
      } else {
        setEndSuggestions([]);
      }
      return;
    }

    const cacheKey = query.toLowerCase().trim();
    if (searchCacheRef.current[cacheKey]) {
      const cachedResults = searchCacheRef.current[cacheKey];
      if (isStart) {
        setStartSuggestions(cachedResults);
      } else {
        setEndSuggestions(cachedResults);
      }
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(
        `${NOMINATIM_API}/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=mg`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'MadaAgri Mobile App',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erreur de recherche');
      }

      const results = await response.json();

      const suggestions: LocationData[] = results.map((item: any) => ({
        name: item.name || item.display_name.split(',')[0],
        displayName: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
      }));

      searchCacheRef.current[cacheKey] = suggestions;

      if (isStart) {
        setStartSuggestions(suggestions);
      } else {
        setEndSuggestions(suggestions);
      }
    } catch (err) {
      console.error('Erreur recherche Nominatim:', err);
      if (isStart) {
        setStartSuggestions([]);
      } else {
        setEndSuggestions([]);
      }
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce pour la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      if (startSearchQuery) {
        searchLocations(startSearchQuery, true);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [startSearchQuery, searchLocations]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (endSearchQuery) {
        searchLocations(endSearchQuery, false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [endSearchQuery, searchLocations]);

  // Géolocalisation
  const getCurrentLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Veuillez autoriser l\'accès à votre position');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Reverse geocoding
      const response = await fetch(
        `${NOMINATIM_API}/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'MadaAgri Mobile App',
          },
        }
      );
      const data = await response.json();

      const locationName = data.address?.city || data.address?.town || data.name || 'Ma position actuelle';

      setStartLocation({
        latitude,
        longitude,
        name: locationName,
        displayName: data.display_name || locationName,
      });
      setStartSearchQuery(locationName);
    } catch (error) {
      console.error('Erreur géolocalisation:', error);
      Alert.alert('Erreur', 'Impossible d\'accéder à votre position');
    }
  }, []);

  // Échanger départ et destination
  const swapLocations = useCallback(() => {
    const tempLocation = startLocation;
    const tempQuery = startSearchQuery;

    setStartLocation(endLocation);
    setStartSearchQuery(endSearchQuery);

    setEndLocation(tempLocation);
    setEndSearchQuery(tempQuery);
  }, [startLocation, endLocation, startSearchQuery, endSearchQuery]);

  // Calculer l'itinéraire
  const calculateRoute = useCallback(async () => {
    if (!startLocation || !endLocation) {
      setError('Veuillez sélectionner un point de départ et une destination');
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      const coordsString = `${startLocation.longitude},${startLocation.latitude};${endLocation.longitude},${endLocation.latitude}`;
      const response = await fetch(
        `${OSRM_API}/route/v1/driving/${coordsString}?geometries=geojson&overview=full&steps=true`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);

        setRouteResult({
          coordinates,
          distance: (route.distance / 1000).toFixed(2),
          duration: (route.duration / 3600).toFixed(1),
          startLocation,
          endLocation,
        });

        // Centrer la carte sur le trajet
        if (mapRef.current) {
          mapRef.current.fitToCoordinates(
            [
              { latitude: startLocation.latitude, longitude: startLocation.longitude },
              { latitude: endLocation.latitude, longitude: endLocation.longitude },
            ],
            {
              edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
              animated: true,
            }
          );
        }
      } else {
        setError('Impossible de calculer l\'itinéraire');
      }
    } catch (err) {
      console.error('Erreur OSRM:', err);
      setError('Erreur lors du calcul de l\'itinéraire');
    } finally {
      setIsCalculating(false);
    }
  }, [startLocation, endLocation]);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Itinéraire"
        showBack
        onBackPress={() => navigation.goBack()}
        showMenu={false}
      />

      <View style={styles.content}>
        {/* Section de recherche */}
        <View style={styles.searchSection}>
          <Text style={styles.pageTitle}>Optimisation d'Itinéraire</Text>
          <Text style={styles.pageSubtitle}>
            Calculez le meilleur itinéraire entre deux points
          </Text>

          {/* Départ */}
          <View style={styles.searchInputContainer}>
            <View style={[styles.searchInputWrapper, showStartSuggestions && styles.searchInputWrapperFocused]}>
              <MaterialCommunityIcons name="map-marker" size={20} color={colors.primary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Lieu de départ"
                placeholderTextColor={colors.textSecondary}
                value={startSearchQuery}
                onChangeText={(text) => {
                  setStartSearchQuery(text);
                  setShowStartSuggestions(true);
                }}
                onFocus={() => setShowStartSuggestions(true)}
              />
              {startLocation && (
                <Pressable
                  style={styles.clearButton}
                  onPress={() => {
                    setStartLocation(null);
                    setStartSearchQuery('');
                    setStartSuggestions([]);
                  }}
                >
                  <MaterialCommunityIcons name="close-circle" size={20} color={colors.textSecondary} />
                </Pressable>
              )}
            </View>

            {showStartSuggestions && startSuggestions.length > 0 && (
              <ScrollView style={styles.suggestionsContainer} nestedScrollEnabled>
                {startSuggestions.map((suggestion, index) => (
                  <Pressable
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setStartLocation(suggestion);
                      setStartSearchQuery(suggestion.name);
                      setShowStartSuggestions(false);
                    }}
                  >
                    <MaterialCommunityIcons
                      name="map-marker"
                      size={18}
                      color={colors.primary}
                      style={styles.suggestionIcon}
                    />
                    <View style={styles.suggestionText}>
                      <Text style={styles.suggestionName}>{suggestion.name}</Text>
                      <Text style={styles.suggestionAddress} numberOfLines={1}>
                        {suggestion.displayName.split(',').slice(1).join(',').trim()}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Boutons de contrôle */}
          <View style={styles.controlButtons}>
            <Pressable style={[styles.controlButton, { flex: 1 }]} onPress={getCurrentLocation}>
              <MaterialCommunityIcons name="crosshairs-gps" size={18} color={colors.primary} />
              <Text style={styles.controlButtonText}>Ma position</Text>
            </Pressable>

            <Pressable style={styles.controlButton} onPress={swapLocations}>
              <MaterialCommunityIcons name="swap-vertical" size={18} color={colors.primary} />
            </Pressable>
          </View>

          {/* Destination */}
          <View style={styles.searchInputContainer}>
            <View style={[styles.searchInputWrapper, showEndSuggestions && styles.searchInputWrapperFocused]}>
              <MaterialCommunityIcons name="map-marker" size={20} color={colors.error} />
              <TextInput
                style={styles.searchInput}
                placeholder="Lieu de destination"
                placeholderTextColor={colors.textSecondary}
                value={endSearchQuery}
                onChangeText={(text) => {
                  setEndSearchQuery(text);
                  setShowEndSuggestions(true);
                }}
                onFocus={() => setShowEndSuggestions(true)}
              />
              {endLocation && (
                <Pressable
                  style={styles.clearButton}
                  onPress={() => {
                    setEndLocation(null);
                    setEndSearchQuery('');
                    setEndSuggestions([]);
                  }}
                >
                  <MaterialCommunityIcons name="close-circle" size={20} color={colors.textSecondary} />
                </Pressable>
              )}
            </View>

            {showEndSuggestions && endSuggestions.length > 0 && (
              <ScrollView style={styles.suggestionsContainer} nestedScrollEnabled>
                {endSuggestions.map((suggestion, index) => (
                  <Pressable
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setEndLocation(suggestion);
                      setEndSearchQuery(suggestion.name);
                      setShowEndSuggestions(false);
                    }}
                  >
                    <MaterialCommunityIcons
                      name="map-marker"
                      size={18}
                      color={colors.error}
                      style={styles.suggestionIcon}
                    />
                    <View style={styles.suggestionText}>
                      <Text style={styles.suggestionName}>{suggestion.name}</Text>
                      <Text style={styles.suggestionAddress} numberOfLines={1}>
                        {suggestion.displayName.split(',').slice(1).join(',').trim()}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Bouton calculer */}
          <Pressable
            style={[
              styles.calculateButton,
              (!startLocation || !endLocation || isCalculating) && styles.calculateButtonDisabled,
            ]}
            onPress={calculateRoute}
            disabled={!startLocation || !endLocation || isCalculating}
          >
            {isCalculating ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.calculateButtonText}>Calcul...</Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="routes" size={20} color="#FFFFFF" />
                <Text style={styles.calculateButtonText}>Calculer l'itinéraire</Text>
              </>
            )}
          </Pressable>

          {/* Erreur */}
          {error && (
            <View style={styles.errorBanner}>
              <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        {/* Carte */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={{
              latitude: -18.8792,
              longitude: 47.5079,
              latitudeDelta: 5,
              longitudeDelta: 5,
            }}
          >
            {startLocation && (
              <Marker
                coordinate={{
                  latitude: startLocation.latitude,
                  longitude: startLocation.longitude,
                }}
                title="Départ"
                description={startLocation.name}
                pinColor={colors.primary}
              />
            )}

            {endLocation && (
              <Marker
                coordinate={{
                  latitude: endLocation.latitude,
                  longitude: endLocation.longitude,
                }}
                title="Destination"
                description={endLocation.name}
                pinColor={colors.error}
              />
            )}

            {routeResult && routeResult.coordinates.length > 0 && (
              <Polyline
                coordinates={routeResult.coordinates.map(coord => ({
                  latitude: coord[0],
                  longitude: coord[1],
                }))}
                strokeColor={colors.primary}
                strokeWidth={4}
              />
            )}
          </MapView>

          {/* Panneau de résultats */}
          {routeResult && (
            <View style={styles.resultsPanel}>
              <View style={styles.resultsHeader}>
                <MaterialCommunityIcons name="routes" size={20} color={colors.primary} />
                <Text style={styles.resultsTitle}>Détails de l'itinéraire</Text>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <MaterialCommunityIcons name="map-marker-distance" size={24} color={colors.primary} />
                  <View style={styles.statContent}>
                    <Text style={styles.statLabel}>Distance</Text>
                    <Text style={styles.statValue}>{routeResult.distance} km</Text>
                  </View>
                </View>

                <View style={styles.statCard}>
                  <MaterialCommunityIcons name="clock-outline" size={24} color={colors.primary} />
                  <View style={styles.statContent}>
                    <Text style={styles.statLabel}>Durée</Text>
                    <Text style={styles.statValue}>{routeResult.duration}h</Text>
                  </View>
                </View>
              </View>

              <View style={styles.locationsContainer}>
                <View style={styles.locationItem}>
                  <View style={[styles.locationPin, { backgroundColor: colors.primary }]}>
                    <Text style={styles.locationPinText}>A</Text>
                  </View>
                  <View style={styles.locationDetails}>
                    <Text style={styles.locationLabel}>Départ</Text>
                    <Text style={styles.locationName} numberOfLines={1}>
                      {routeResult.startLocation.name}
                    </Text>
                  </View>
                </View>

                <View style={styles.locationItem}>
                  <View style={[styles.locationPin, { backgroundColor: colors.error }]}>
                    <Text style={styles.locationPinText}>B</Text>
                  </View>
                  <View style={styles.locationDetails}>
                    <Text style={styles.locationLabel}>Destination</Text>
                    <Text style={styles.locationName} numberOfLines={1}>
                      {routeResult.endLocation.name}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
