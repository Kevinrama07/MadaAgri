import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { dataApi } from '../lib/api';
import { SPACING } from '../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface WeatherDay {
  day: string;
  date: string;
  condition: string;
  conditionKey: string;
  tempMax: number;
  tempMin: number;
  humidity: number;
  wind: number;
  visibility: number;
  pressure: number;
  uvIndex: number;
  rainChance: number;
  sunrise?: string;
  sunset?: string;
}

interface WeatherTip {
  icon: string;
  title: string;
  text: string;
}

const UV_LABELS: Record<string, { label: string; color: string }> = {
  '0': { label: 'Faible', color: '#10B981' },
  '3': { label: 'Modéré', color: '#F59E0B' },
  '6': { label: 'Élevé', color: '#F97316' },
  '8': { label: 'Très élevé', color: '#EF4444' },
  '11': { label: 'Extrême', color: '#7C3AED' },
};

function getUVLabel(uv: number) {
  if (uv >= 11) return UV_LABELS['11'];
  if (uv >= 8) return UV_LABELS['8'];
  if (uv >= 6) return UV_LABELS['6'];
  if (uv >= 3) return UV_LABELS['3'];
  return UV_LABELS['0'];
}

function getConditionIcon(key: string): string {
  const map: Record<string, string> = {
    sunny: 'weather-sunny',
    'partly-cloudy': 'weather-partly-cloudy',
    cloudy: 'weather-cloudy',
    rainy: 'weather-rainy',
    'heavy-rain': 'weather-pouring',
    thunderstorm: 'weather-lightning',
    windy: 'weather-windy',
    foggy: 'weather-fog',
    snowy: 'weather-snowy',
  };
  return map[key] || 'weather-partly-cloudy';
}

function LoadingSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={styles.skeletonContainer}>
      <View style={[styles.skelHero, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
        <View style={[styles.skelBlock, { backgroundColor: colors.glassDarker, width: 100, height: 20 }]} />
        <View style={[styles.skelBlock, { backgroundColor: colors.glassDarker, width: 140, height: 14, marginTop: 8 }]} />
        <View style={[styles.skelIcon, { backgroundColor: colors.glassDarker }]} />
        <View style={[styles.skelBlock, { backgroundColor: colors.glassDarker, width: 120, height: 16 }]} />
        <View style={styles.skelRow}>
          <View style={[styles.skelBlock, { backgroundColor: colors.glassDarker, width: 80, height: 32 }]} />
          <View style={[styles.skelBlock, { backgroundColor: colors.glassDarker, width: 80, height: 32 }]} />
        </View>
        <View style={styles.skelGrid2}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.skelBlock, { backgroundColor: colors.glassDarker, width: (SCREEN_WIDTH - 72) / 2, height: 44 }]} />
          ))}
        </View>
      </View>
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.skelCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
          <View style={[styles.skelBlock, { backgroundColor: colors.glassDarker, width: 80, height: 14 }]} />
          <View style={[styles.skelBlock, { backgroundColor: colors.glassDarker, width: '60%', height: 14, marginTop: 8 }]} />
        </View>
      ))}
    </View>
  );
}

export default function WeatherScreen({ navigation }: any) {
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = mode === 'dark';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [forecast, setForecast] = useState<WeatherDay[]>([]);
  const [tips, setTips] = useState<WeatherTip[]>([]);
  const [location, setLocation] = useState('Madagascar');
  const [lastUpdate, setLastUpdate] = useState('');
  const [error, setError] = useState(false);

  const fetchWeather = useCallback(async () => {
    try {
      const result = await dataApi.fetchWeatherForecast(-18.8792, 47.5079);
      if (result?.error) {
        setError(true);
        return;
      }
      setForecast(Array.isArray(result?.forecast) ? result.forecast : []);
      setTips(Array.isArray(result?.tips) ? result.tips : []);
      setLocation(result?.location || 'Madagascar');
      setLastUpdate(result?.lastUpdate ? new Date(result.lastUpdate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '');
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWeather();
  }, [fetchWeather]);

  const today = forecast[0];
  const restDays = forecast.slice(1, 7);

  if (loading) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: isDark ? 'rgba(8,12,20,0.85)' : 'rgba(246,248,250,0.85)', borderBottomColor: colors.glassBorder }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <View style={[styles.headerIcon, { backgroundColor: colors.glassTint }]}>
              <MaterialCommunityIcons name="weather-partly-cloudy" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Météo</Text>
              <Text style={[styles.headerSub, { color: colors.textTertiary }]}>Prévisions agricoles</Text>
            </View>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.scroll}>
          <LoadingSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: isDark ? 'rgba(8,12,20,0.85)' : 'rgba(246,248,250,0.85)', borderBottomColor: colors.glassBorder }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={[styles.headerIcon, { backgroundColor: colors.glassTint }]}>
            <MaterialCommunityIcons name="weather-partly-cloudy" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Météo</Text>
            <Text style={[styles.headerSub, { color: colors.textTertiary }]}>Prévisions agricoles</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        {/* Error state */}
        {error && !loading && (
          <View style={[styles.errorBanner, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <MaterialCommunityIcons name="cloud-off-outline" size={24} color="#DC2626" />
            <Text style={[styles.errorText, { color: '#991B1B' }]}>Impossible de charger les données météo</Text>
            <Pressable onPress={onRefresh} style={[styles.retryBtn, { backgroundColor: '#FEE2E2' }]}>
              <Text style={{ color: '#991B1B', fontWeight: '600', fontSize: 13 }}>Réessayer</Text>
            </Pressable>
          </View>
        )}

        {/* Location + last update */}
        <View style={styles.locationBar}>
          <View style={styles.locationLeft}>
            <MaterialCommunityIcons name="map-marker" size={16} color={colors.primary} />
            <Text style={[styles.locationText, { color: colors.text }]}>{location}</Text>
          </View>
          <Text style={[styles.updateText, { color: colors.textTertiary }]}>
            {lastUpdate ? `Mis à jour ${lastUpdate}` : ''}
          </Text>
        </View>

        {/* Today hero card */}
        {today && (
          <View style={[styles.heroCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
            <View style={styles.heroTop}>
              <View style={styles.heroCondition}>
                <MaterialCommunityIcons
                  name={getConditionIcon(today.conditionKey) as any}
                  size={56}
                  color={colors.primary}
                />
                <Text style={[styles.heroConditionText, { color: colors.text }]}>{today.condition}</Text>
              </View>
              <View style={styles.heroTemps}>
                <Text style={[styles.heroTempMax, { color: colors.text }]}>{today.tempMax}°</Text>
                <Text style={[styles.heroTempMin, { color: colors.textTertiary }]}>{today.tempMin}°</Text>
              </View>
            </View>

            {/* Metrics 2x2 */}
            <View style={styles.heroMetrics}>
              <View style={[styles.heroMetric, { backgroundColor: colors.primaryBackground }]}>
                <MaterialCommunityIcons name="water-percent" size={16} color="#3B82F6" />
                <Text style={[styles.heroMetricValue, { color: colors.text }]}>{today.humidity}%</Text>
                <Text style={[styles.heroMetricLabel, { color: colors.textTertiary }]}>Humidité</Text>
              </View>
              <View style={[styles.heroMetric, { backgroundColor: colors.primaryBackground }]}>
                <MaterialCommunityIcons name="weather-windy" size={16} color="#8B5CF6" />
                <Text style={[styles.heroMetricValue, { color: colors.text }]}>{today.wind} km/h</Text>
                <Text style={[styles.heroMetricLabel, { color: colors.textTertiary }]}>Vent</Text>
              </View>
              <View style={[styles.heroMetric, { backgroundColor: colors.primaryBackground }]}>
                <MaterialCommunityIcons name="eye" size={16} color="#10B981" />
                <Text style={[styles.heroMetricValue, { color: colors.text }]}>{today.visibility} km</Text>
                <Text style={[styles.heroMetricLabel, { color: colors.textTertiary }]}>Visibilité</Text>
              </View>
              <View style={[styles.heroMetric, { backgroundColor: colors.primaryBackground }]}>
                <MaterialCommunityIcons name="gauge" size={16} color="#F59E0B" />
                <Text style={[styles.heroMetricValue, { color: colors.text }]}>{today.pressure} hPa</Text>
                <Text style={[styles.heroMetricLabel, { color: colors.textTertiary }]}>Pression</Text>
              </View>
            </View>

            {/* Rain probability */}
            <View style={styles.rainSection}>
              <View style={styles.rainLabelRow}>
                <MaterialCommunityIcons name="weather-rainy" size={16} color="#3B82F6" />
                <Text style={[styles.rainLabelText, { color: colors.text }]}>Probabilité de pluie</Text>
                <Text style={[styles.rainValue, { color: colors.primary }]}>{today.rainChance}%</Text>
              </View>
              <View style={[styles.rainBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
                <View style={[styles.rainFill, { width: `${today.rainChance}%`, backgroundColor: today.rainChance >= 70 ? '#3B82F6' : today.rainChance >= 40 ? '#8B5CF6' : '#A7F3D0' }]} />
              </View>
            </View>

            {/* Sunrise / Sunset / UV */}
            <View style={styles.sunRow}>
              {today.sunrise && (
                <View style={styles.sunItem}>
                  <MaterialCommunityIcons name="weather-sunset-up" size={16} color={colors.textTertiary} />
                  <Text style={[styles.sunText, { color: colors.textSecondary }]}>{today.sunrise}</Text>
                </View>
              )}
              {today.sunset && (
                <View style={styles.sunItem}>
                  <MaterialCommunityIcons name="weather-sunset-down" size={16} color={colors.textTertiary} />
                  <Text style={[styles.sunText, { color: colors.textSecondary }]}>{today.sunset}</Text>
                </View>
              )}
              <View style={styles.sunItem}>
                <MaterialCommunityIcons name="white-balance-sunny" size={16} color={getUVLabel(today.uvIndex).color} />
                <Text style={[styles.sunText, { color: getUVLabel(today.uvIndex).color }]}>
                  UV: {today.uvIndex} - {getUVLabel(today.uvIndex).label}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* 7-day forecast horizontal scroll */}
        {forecast.length > 0 && (
          <View style={styles.forecastSection}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="calendar-month" size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Prévisions 7 jours</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.forecastScroll}>
              {forecast.map((day, i) => {
                const isToday = i === 0;
                return (
                  <View key={i} style={[
                    styles.forecastCard,
                    { backgroundColor: isToday ? colors.glassTint : colors.glass, borderColor: isToday ? colors.primary : colors.glassBorder },
                    isToday && { borderWidth: 1 },
                  ]}>
                    <Text style={[styles.forecastDay, { color: isToday ? colors.primary : colors.text }]}>{day.day}</Text>
                    <Text style={[styles.forecastDate, { color: colors.textTertiary }]}>{day.date.split(' ')[0]}</Text>
                    <MaterialCommunityIcons
                      name={getConditionIcon(day.conditionKey) as any}
                      size={28}
                      color={isToday ? colors.primary : colors.text}
                      style={{ marginVertical: 6 }}
                    />
                    <Text style={[styles.forecastCond, { color: colors.textSecondary }]} numberOfLines={1}>{day.condition}</Text>
                    <Text style={[styles.forecastTempMax, { color: colors.text }]}>{day.tempMax}°</Text>
                    <Text style={[styles.forecastTempMin, { color: colors.textTertiary }]}>{day.tempMin}°</Text>
                    <View style={styles.forecastMeta}>
                      <MaterialCommunityIcons name="water-percent" size={12} color="#3B82F6" />
                      <Text style={[styles.forecastMetaText, { color: colors.textTertiary }]}>{day.humidity}%</Text>
                    </View>
                    <View style={styles.forecastMeta}>
                      <MaterialCommunityIcons name="weather-windy" size={12} color="#8B5CF6" />
                      <Text style={[styles.forecastMetaText, { color: colors.textTertiary }]}>{day.wind} km/h</Text>
                    </View>
                    {day.rainChance > 0 && (
                      <View style={[styles.rainMiniBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
                        <View style={[styles.rainMiniFill, { width: `${day.rainChance}%`, backgroundColor: '#3B82F6' }]} />
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Supplementary details */}
        {today && (
          <View style={styles.detailsSection}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="information-outline" size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Détails supplémentaires</Text>
            </View>
            <View style={styles.detailsGrid}>
              <View style={[styles.detailCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
                <View style={[styles.detailCardIcon, { backgroundColor: getUVLabel(today.uvIndex).color + '20' }]}>
                  <MaterialCommunityIcons name="white-balance-sunny" size={22} color={getUVLabel(today.uvIndex).color} />
                </View>
                <Text style={[styles.detailCardValue, { color: colors.text }]}>UV {today.uvIndex}</Text>
                <Text style={[styles.detailCardLabel, { color: getUVLabel(today.uvIndex).color }]}>{getUVLabel(today.uvIndex).label}</Text>
              </View>
              <View style={[styles.detailCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
                <View style={[styles.detailCardIcon, { backgroundColor: '#10B98120' }]}>
                  <MaterialCommunityIcons name="eye" size={22} color="#10B981" />
                </View>
                <Text style={[styles.detailCardValue, { color: colors.text }]}>{today.visibility} km</Text>
                <Text style={[styles.detailCardLabel, { color: '#10B981' }]}>
                  {today.visibility >= 8 ? 'Excellente' : today.visibility >= 5 ? 'Bonne' : 'Moyenne'}
                </Text>
              </View>
              <View style={[styles.detailCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
                <View style={[styles.detailCardIcon, { backgroundColor: '#F59E0B20' }]}>
                  <MaterialCommunityIcons name="gauge" size={22} color="#F59E0B" />
                </View>
                <Text style={[styles.detailCardValue, { color: colors.text }]}>{today.pressure} hPa</Text>
                <Text style={[styles.detailCardLabel, { color: '#F59E0B' }]}>
                  {today.pressure >= 1015 ? 'Haute' : today.pressure >= 1008 ? 'Normale' : 'Basse'}
                </Text>
              </View>
              <View style={[styles.detailCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
                <View style={[styles.detailCardIcon, { backgroundColor: '#8B5CF620' }]}>
                  <MaterialCommunityIcons name="weather-windy" size={22} color="#8B5CF6" />
                </View>
                <Text style={[styles.detailCardValue, { color: colors.text }]}>{today.wind} km/h</Text>
                <Text style={[styles.detailCardLabel, { color: '#8B5CF6' }]}>
                  {today.wind >= 25 ? 'Fort' : today.wind >= 15 ? 'Modéré' : 'Faible'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Agricultural tips */}
        {tips.length > 0 && (
          <View style={styles.tipsSection}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="sprout" size={18} color="#10B981" />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Conseils agricoles</Text>
            </View>
            {tips.map((tip, i) => (
              <View key={i} style={[styles.tipCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
                <View style={[styles.tipIcon, { backgroundColor: '#10B98120' }]}>
                  <MaterialCommunityIcons name={(tip.icon || 'sprout') as any} size={22} color="#10B981" />
                </View>
                <View style={styles.tipContent}>
                  <Text style={[styles.tipTitle, { color: colors.text }]}>{tip.title}</Text>
                  <Text style={[styles.tipText, { color: colors.textSecondary }]}>{tip.text}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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

  scroll: { padding: SPACING.LG },

  // Skeleton
  skeletonContainer: { gap: 14 },
  skelHero: { padding: 18, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, gap: 12 },
  skelBlock: { borderRadius: 8 },
  skelIcon: { width: 56, height: 56, borderRadius: 28 },
  skelRow: { flexDirection: 'row', gap: 12 },
  skelGrid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skelCard: { padding: 16, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },

  // Error
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 14 },
  errorText: { flex: 1, fontSize: 13, fontWeight: '500' },
  retryBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },

  // Location bar
  locationBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  locationLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationText: { fontSize: 15, fontWeight: '600' },
  updateText: { fontSize: 11 },

  // Hero card
  heroCard: { padding: SPACING.MD, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, marginBottom: 16 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  heroCondition: { alignItems: 'center', gap: 6 },
  heroConditionText: { fontSize: 15, fontWeight: '600' },
  heroTemps: { alignItems: 'flex-end', gap: 2 },
  heroTempMax: { fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  heroTempMin: { fontSize: 18, fontWeight: '500' },
  heroMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  heroMetric: {
    width: (SCREEN_WIDTH - 60) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  heroMetricValue: { fontSize: 15, fontWeight: '700' },
  heroMetricLabel: { fontSize: 11, marginLeft: 'auto' },

  // Rain
  rainSection: { marginBottom: 12 },
  rainLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  rainLabelText: { fontSize: 13, fontWeight: '500', flex: 1 },
  rainValue: { fontSize: 14, fontWeight: '700' },
  rainBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  rainFill: { height: '100%', borderRadius: 3 },

  // Sun row
  sunRow: { flexDirection: 'row', gap: 16 },
  sunItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sunText: { fontSize: 12, fontWeight: '500' },

  // 7-day forecast
  forecastSection: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  forecastScroll: { gap: 10, paddingRight: SPACING.LG, marginRight: -SPACING.LG },
  forecastCard: {
    width: 110,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    gap: 2,
  },
  forecastDay: { fontSize: 13, fontWeight: '700' },
  forecastDate: { fontSize: 10 },
  forecastCond: { fontSize: 10, textAlign: 'center' },
  forecastTempMax: { fontSize: 18, fontWeight: '700', marginTop: 2 },
  forecastTempMin: { fontSize: 13, fontWeight: '500' },
  forecastMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  forecastMetaText: { fontSize: 10 },
  rainMiniBar: { width: '100%', height: 3, borderRadius: 2, overflow: 'hidden', marginTop: 4 },
  rainMiniFill: { height: '100%', borderRadius: 2 },

  // Details
  detailsSection: { marginBottom: 16 },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  detailCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  detailCardIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  detailCardValue: { fontSize: 16, fontWeight: '700' },
  detailCardLabel: { fontSize: 12, fontWeight: '600' },

  // Tips
  tipsSection: { marginBottom: 16 },
  tipCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
    marginBottom: 8,
  },
  tipIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tipContent: { flex: 1, gap: 4 },
  tipTitle: { fontSize: 14, fontWeight: '600' },
  tipText: { fontSize: 12, lineHeight: 17 },
});
