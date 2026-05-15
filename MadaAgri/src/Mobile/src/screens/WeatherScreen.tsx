import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { ModernCard } from '../components/ModernCard';
import { ScreenHeader } from '../components/ScreenHeader';
import { CultureCardSkeleton } from '../components/SkeletonLoader';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../theme';

const WEATHER_ICONS: Record<string, string> = {
  sunny: 'weather-sunny',
  clear: 'weather-sunny',
  cloudy: 'weather-cloudy',
  'partly cloudy': 'weather-partly-cloudy',
  rainy: 'weather-rainy',
  rain: 'weather-rainy',
  'heavy rain': 'weather-pouring',
  stormy: 'weather-lightning-rainy',
  thunderstorm: 'weather-lightning',
  windy: 'weather-windy',
  foggy: 'weather-fog',
  snowy: 'weather-snowy',
  snow: 'weather-snowy',
  default: 'weather-partly-cloudy',
};

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

interface WeatherDay {
  day: string;
  date: string;
  tempMax: number;
  tempMin: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  visibility: number;
  pressure: number;
  chanceOfRain: number;
  icon: string;
}

export default function WeatherScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [forecast, setForecast] = useState<WeatherDay[]>([]);
  const [location, setLocation] = useState('Madagascar');
  const [lastUpdate, setLastUpdate] = useState('');

  const generateWeatherData = useCallback(() => {
    const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy', 'Heavy Rain', 'Thunderstorm'];
    const today = new Date();
    const newForecast: WeatherDay[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const tempMin = Math.floor(Math.random() * 8) + 18;
      const tempMax = tempMin + Math.floor(Math.random() * 12) + 5;
      const condition = conditions[Math.floor(Math.random() * conditions.length)];

      newForecast.push({
        day: i === 0 ? "Aujourd'hui" : DAYS_FR[d.getDay()],
        date: d.toLocaleDateString('fr-FR'),
        tempMax,
        tempMin,
        condition,
        humidity: Math.floor(Math.random() * 30) + 60,
        windSpeed: Math.floor(Math.random() * 20) + 5,
        uvIndex: Math.floor(Math.random() * 11) + 3,
        visibility: Math.floor(Math.random() * 10) + 5,
        pressure: Math.floor(Math.random() * 20) + 1010,
        chanceOfRain: Math.floor(Math.random() * 100),
        icon: condition.toLowerCase(),
      });
    }

    setForecast(newForecast);
    setLastUpdate(new Date().toLocaleTimeString('fr-FR'));
  }, []);

  const loadWeather = useCallback(async () => {
    try {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 600));
      generateWeatherData();
    } catch (err) {
      console.error('[WeatherScreen] Erreur:', err);
    } finally {
      setLoading(false);
    }
  }, [generateWeatherData]);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWeather();
    setRefreshing(false);
  }, [loadWeather]);

  const getWeatherIcon = (condition: string) => {
    return WEATHER_ICONS[condition.toLowerCase()] || WEATHER_ICONS.default;
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.primaryBackground },
    scroll: { padding: SPACING.LG },
    pageHeader: {
      marginBottom: SPACING.LG,
    },
    pageTitle: {
      fontSize: 24,
      fontWeight: '900',
      color: colors.text,
      marginBottom: 4,
    },
    pageSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    locationHeader: {
      marginBottom: SPACING.MD,
    },
    locationText: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    lastUpdate: {
      fontSize: 12,
      color: colors.textTertiary,
      marginTop: 4,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: SPACING.MD,
      marginTop: SPACING.LG,
    },
    weatherCard: {
      marginBottom: SPACING.MD,
      padding: SPACING.LG,
    },
    todayCard: {
      borderWidth: 2,
      borderColor: colors.primary,
    },
    cardHeader: {
      marginBottom: SPACING.MD,
      paddingBottom: SPACING.SM,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dayName: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    dayDate: {
      fontSize: 12,
      color: colors.textTertiary,
      marginTop: 2,
    },
    conditionSection: {
      alignItems: 'center',
      marginBottom: SPACING.MD,
    },
    conditionText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: SPACING.SM,
    },
    tempsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: SPACING.MD,
      paddingVertical: SPACING.SM,
      backgroundColor: `${colors.primary}10`,
      borderRadius: BORDER_RADIUS.DEFAULT,
    },
    tempItem: {
      alignItems: 'center',
    },
    tempLabel: {
      fontSize: 11,
      color: colors.textTertiary,
      marginBottom: 4,
    },
    tempValue: {
      fontSize: 24,
      fontWeight: '700',
    },
    tempMax: {
      color: colors.error,
    },
    tempMin: {
      color: colors.primary,
    },
    detailsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.SM,
      marginBottom: SPACING.MD,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.XS,
      width: '48%',
      padding: SPACING.SM,
      backgroundColor: colors.primaryBackground,
      borderRadius: BORDER_RADIUS.SMALL,
    },
    detailText: {
      flex: 1,
    },
    detailLabel: {
      fontSize: 10,
      color: colors.textTertiary,
    },
    detailValue: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    rainSection: {
      marginTop: SPACING.SM,
    },
    rainLabel: {
      fontSize: 11,
      color: colors.textTertiary,
      marginBottom: 4,
    },
    rainBar: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      overflow: 'hidden',
    },
    rainFill: {
      height: '100%',
      backgroundColor: colors.primary,
    },
    adviceSection: {
      marginTop: SPACING.LG,
    },
    adviceCard: {
      marginBottom: SPACING.MD,
    },
    adviceRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: SPACING.MD,
    },
    adviceIcon: {
      width: 40,
      height: 40,
      borderRadius: BORDER_RADIUS.DEFAULT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    adviceText: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    // Styles pour les cartes compactes (autres jours)
    compactWeatherCard: {
      marginBottom: SPACING.SM,
      padding: SPACING.MD,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    compactDaySection: {
      flex: 0.25,
      justifyContent: 'center',
    },
    compactDayName: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    compactDayDate: {
      fontSize: 10,
      color: colors.textTertiary,
      marginTop: 2,
    },
    compactIconSection: {
      flex: 0.25,
      alignItems: 'center',
    },
    compactTempsSection: {
      flex: 0.5,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: SPACING.MD,
      alignItems: 'center',
    },
    compactTempItem: {
      alignItems: 'center',
    },
    compactTempLabel: {
      fontSize: 10,
      color: colors.textTertiary,
    },
    compactTempValue: {
      fontSize: 16,
      fontWeight: '700',
      marginTop: 2,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Météo" showBack onBackPress={() => navigation.goBack()} showMenu={false} />
        <ScrollView contentContainerStyle={styles.scroll}>
          {[...Array(3)].map((_, index) => (
            <CultureCardSkeleton key={index} />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Météo" showBack onBackPress={() => navigation.goBack()} showMenu={false} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* En-tête */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Prévisions Météorologiques</Text>
          <Text style={styles.pageSubtitle}>Consultez la météo pour les 7 prochains jours</Text>
        </View>

        {/* Informations générales */}
        <View style={styles.locationHeader}>
          <Text style={styles.locationText}>{location}</Text>
          <Text style={styles.lastUpdate}>Mise à jour: {lastUpdate}</Text>
        </View>

        {/* Grille des jours */}
        {forecast.map((day, index) => {
          if (index === 0) {
            // Carte complète pour aujourd'hui
            return (
              <ModernCard key={index} shadow="medium" style={[styles.weatherCard, styles.todayCard]}>
                {/* En-tête du jour */}
                <View style={styles.cardHeader}>
                  <Text style={styles.dayName}>{day.day}</Text>
                  <Text style={styles.dayDate}>{day.date}</Text>
                </View>

                {/* Icône et condition */}
                <View style={styles.conditionSection}>
                  <MaterialCommunityIcons
                    name={getWeatherIcon(day.icon) as any}
                    size={48}
                    color={colors.primary}
                  />
                  <Text style={styles.conditionText}>{day.condition}</Text>
                </View>

                {/* Températures */}
                <View style={styles.tempsRow}>
                  <View style={styles.tempItem}>
                    <Text style={styles.tempLabel}>Max</Text>
                    <Text style={[styles.tempValue, styles.tempMax]}>{day.tempMax}°</Text>
                  </View>
                  <View style={styles.tempItem}>
                    <Text style={styles.tempLabel}>Min</Text>
                    <Text style={[styles.tempValue, styles.tempMin]}>{day.tempMin}°</Text>
                  </View>
                </View>

                {/* Détails météo */}
                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="water-percent" size={16} color={colors.primary} />
                    <View style={styles.detailText}>
                      <Text style={styles.detailLabel}>Humidité</Text>
                      <Text style={styles.detailValue}>{day.humidity}%</Text>
                    </View>
                  </View>

                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="weather-windy" size={16} color={colors.primary} />
                    <View style={styles.detailText}>
                      <Text style={styles.detailLabel}>Vent</Text>
                      <Text style={styles.detailValue}>{day.windSpeed} km/h</Text>
                    </View>
                  </View>

                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="eye" size={16} color={colors.primary} />
                    <View style={styles.detailText}>
                      <Text style={styles.detailLabel}>Visibilité</Text>
                      <Text style={styles.detailValue}>{day.visibility} km</Text>
                    </View>
                  </View>

                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="gauge" size={16} color={colors.primary} />
                    <View style={styles.detailText}>
                      <Text style={styles.detailLabel}>Pression</Text>
                      <Text style={styles.detailValue}>{day.pressure} hPa</Text>
                    </View>
                  </View>

                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="weather-rainy" size={16} color={colors.primary} />
                    <View style={styles.detailText}>
                      <Text style={styles.detailLabel}>Pluie</Text>
                      <Text style={styles.detailValue}>{day.chanceOfRain}%</Text>
                    </View>
                  </View>

                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="white-balance-sunny" size={16} color={colors.primary} />
                    <View style={styles.detailText}>
                      <Text style={styles.detailLabel}>UV</Text>
                      <Text style={styles.detailValue}>{day.uvIndex}/12</Text>
                    </View>
                  </View>
                </View>

                {/* Barre de pluie */}
                <View style={styles.rainSection}>
                  <Text style={styles.rainLabel}>Probabilité de pluie</Text>
                  <View style={styles.rainBar}>
                    <View style={[styles.rainFill, { width: `${day.chanceOfRain}%` }]} />
                  </View>
                </View>
              </ModernCard>
            );
          } else {
            // Carte compacte pour les autres jours
            return (
              <ModernCard key={index} shadow="subtle" style={styles.compactWeatherCard}>
                {/* Jour */}
                <View style={styles.compactDaySection}>
                  <Text style={styles.compactDayName}>{day.day}</Text>
                  <Text style={styles.compactDayDate}>{day.date}</Text>
                </View>

                {/* Icône */}
                <View style={styles.compactIconSection}>
                  <MaterialCommunityIcons
                    name={getWeatherIcon(day.icon) as any}
                    size={32}
                    color={colors.primary}
                  />
                </View>

                {/* Min/Max */}
                <View style={styles.compactTempsSection}>
                  <View style={styles.compactTempItem}>
                    <Text style={styles.compactTempLabel}>Max</Text>
                    <Text style={[styles.compactTempValue, styles.tempMax]}>{day.tempMax}°</Text>
                  </View>
                  <View style={styles.compactTempItem}>
                    <Text style={styles.compactTempLabel}>Min</Text>
                    <Text style={[styles.compactTempValue, styles.tempMin]}>{day.tempMin}°</Text>
                  </View>
                </View>
              </ModernCard>
            );
          }
        })}

        {/* Conseils agricoles */}
        <Text style={styles.sectionTitle}>💡 Conseils Agricoles</Text>
        {[
          {
            icon: 'sprout',
            text: 'Privilégiez l\'arrosage en début de matinée ou en fin de journée pour minimiser l\'évaporation.',
            color: colors.primary,
          },
          {
            icon: 'white-balance-sunny',
            text: 'Avec un indice UV élevé, protégez vos cultures sensibles avec des ombrières.',
            color: '#FFA500',
          },
          {
            icon: 'water',
            text: 'En cas de pluies importantes, assurez-vous que vos champs ont un bon système de drainage.',
            color: '#4A90E2',
          },
        ].map((advice, i) => (
          <View key={i} style={styles.adviceCard}>
            <ModernCard shadow="subtle">
              <View style={styles.adviceRow}>
                <View style={[styles.adviceIcon, { backgroundColor: `${advice.color}18` }]}>
                  <MaterialCommunityIcons name={advice.icon as any} size={20} color={advice.color} />
                </View>
                <Text style={styles.adviceText}>{advice.text}</Text>
              </View>
            </ModernCard>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
