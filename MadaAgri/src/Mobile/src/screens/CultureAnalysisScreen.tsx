import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { useCultureAnalysis } from '../hooks/useCultureAnalysis';
import { useRegions } from '../hooks/useRegions';
import RegionPicker from '../components/RegionPicker';
import { ScreenHeader } from '../components/ScreenHeader';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { CultureCardSkeleton } from '../components/SkeletonLoader';
import CultureCard from '../components/CultureCard';
import CultureFilters from '../components/CultureFilters';
import { filterCulturesByName, sortCultures, getCultureCategory, getSuitabilityColor, getSuitabilityLabel } from '../utils/cultureUtils';
import { CultureAnalysisResult, SortField, SortOrder, CultureCategory } from '../types/culture.types';

interface CultureAnalysisScreenProps {
  navigation: any;
}

export default function CultureAnalysisScreen({ navigation }: CultureAnalysisScreenProps) {
  const { colors } = useTheme();
  const {
    regions,
    selectedRegion,
    loading: loadingRegions,
    error: regionsError,
    setSelectedRegion,
    refresh: refreshRegions,
  } = useRegions();

  const { cultures, loading, error, refreshing, refresh } = useCultureAnalysis(
    selectedRegion?.id || null
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CultureCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortField>('score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const filteredAndSortedCultures = useMemo(() => {
    let filtered = [...cultures];

    if (searchTerm) {
      filtered = filterCulturesByName(filtered, searchTerm);
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => {
        const cultureName = item.culture?.name || item.culture_name || '';
        if (!cultureName) return false;
        return getCultureCategory(cultureName) === selectedCategory;
      });
    }

    filtered = sortCultures(filtered, sortBy, sortOrder);

    return filtered;
  }, [cultures, searchTerm, selectedCategory, sortBy, sortOrder]);

  const handleSortChange = useCallback((field: SortField, order: SortOrder) => {
    setSortBy(field);
    setSortOrder(order);
  }, []);

  const handleCulturePress = useCallback((culture: CultureAnalysisResult) => {
    // TODO: Naviguer vers l'écran de détails
    console.log('Culture pressed:', culture);
  }, []);

  const handleRetry = useCallback(async () => {
    await refreshRegions();
  }, [refreshRegions]);

  if (loadingRegions) {
    return (
      <View style={[styles.container, { backgroundColor: colors.primaryBackground }]}>
        <ScreenHeader title="Analyse des Cultures" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            {[...Array(3)].map((_, index) => (
              <CultureCardSkeleton key={index} />
            ))}
          </View>
        </View>
      </View>
    );
  }

  if (regionsError) {
    return (
      <View style={[styles.container, { backgroundColor: colors.primaryBackground }]}>
        <ScreenHeader title="Analyse des Cultures" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{regionsError}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={handleRetry}>
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (regions.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.primaryBackground }]}>
        <ScreenHeader title="Analyse des Cultures" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.emptyState}>
          <Ionicons name="location-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucune région disponible</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Veuillez ajouter des régions pour commencer l'analyse.
          </Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={handleRetry}>
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Actualiser</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <View style={[styles.container, { backgroundColor: colors.primaryBackground }]}>
        <ScreenHeader title="Analyse des Cultures" showBack onBackPress={() => navigation.goBack()} />
        
        <FlatList
          data={filteredAndSortedCultures}
          keyExtractor={(item, index) => `${item.culture?.id || index}`}
          renderItem={({ item }) => (
            <CultureCard culture={item} onPress={() => handleCulturePress(item)} />
          )}
          ListHeaderComponent={
          <>
            {/* Description */}
            <View style={styles.header}>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Découvrez les cultures les plus adaptées à votre région
              </Text>
            </View>

            {/* Region Picker */}
            <View style={styles.pickerContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>SÉLECTIONNER UNE RÉGION</Text>
              <RegionPicker
                regions={regions}
                selectedRegion={selectedRegion}
                onSelect={setSelectedRegion}
              />
            </View>

            {/* Region Details */}
            {selectedRegion && (
              <View style={[styles.regionCard, { backgroundColor: colors.card, shadowColor: colors.primary }]}>
                <View style={styles.regionHeader}>
                  <Text 
                    style={[styles.regionName, { color: colors.text }]}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {selectedRegion.name}
                  </Text>
                  <View style={[styles.regionBadge, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
                    <Text style={styles.regionBadgeText}>Analysé</Text>
                  </View>
                </View>
                
                <View style={styles.regionProperties}>
                  {selectedRegion.soil_type && (
                    <View style={[styles.propertyItem, { backgroundColor: colors.primaryPale, borderColor: colors.primary + '26' }]}>
                      <View style={styles.propertyLabel}>
                        <Ionicons name="earth" size={22} color={colors.primary} />
                        <Text style={[styles.propertyLabelText, { color: colors.text }]}>TYPE DE SOL</Text>
                      </View>
                      <Text style={[styles.propertyValue, { color: colors.text }]}>
                        {selectedRegion.soil_type}
                      </Text>
                    </View>
                  )}
                  
                  {selectedRegion.climate && (
                    <View style={[styles.propertyItem, { backgroundColor: colors.primaryPale, borderColor: colors.primary + '26' }]}>
                      <View style={styles.propertyLabel}>
                        <Ionicons name="cloud" size={22} color={colors.primary} />
                        <Text style={[styles.propertyLabelText, { color: colors.text }]}>CLIMAT</Text>
                      </View>
                      <Text style={[styles.propertyValue, { color: colors.text }]}>
                        {selectedRegion.climate}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Filtres */}
            <CultureFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
              culturesCount={filteredAndSortedCultures.length}
            />

            {/* Section Title */}
            <View style={[styles.culturesHeader, { backgroundColor: colors.primaryPale, borderColor: colors.primary + '1A' }]}>
              <View style={styles.culturesTitle}>
                <Ionicons name="leaf" size={26} color={colors.primary} />
                <Text 
                  style={[styles.culturesTitleText, { color: colors.text }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  Cultures Recommandées
                </Text>
              </View>
            </View>

            {/* Error Banner */}
            {error && (
              <View style={[styles.errorBanner, { backgroundColor: colors.error + '1A', borderColor: colors.error + '4D' }]}>
                <Ionicons name="alert-circle" size={20} color={colors.error} />
                <Text style={[styles.errorBannerText, { color: colors.error }]}>{error}</Text>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.emptyState}>
              <Ionicons name="information-circle" size={80} color={colors.primary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucune culture trouvée</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {searchTerm || selectedCategory !== 'all'
                  ? 'Essayez de modifier vos filtres ou votre recherche.'
                  : 'Essayez de sélectionner une autre région pour voir les cultures adaptées.'}
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListFooterComponent={
          loading && !refreshing ? (
            <View style={styles.loadingFooter}>
              {[...Array(3)].map((_, index) => (
                <CultureCardSkeleton key={index} />
              ))}
            </View>
          ) : null
        }
      />
    </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.LG,
  },
  loadingContent: {
    width: '100%',
    maxWidth: 600,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.XL,
  },
  errorText: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    marginTop: SPACING.MD,
    marginBottom: SPACING.LG,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  listContent: {
    padding: SPACING.XL,
  },
  header: {
    marginBottom: SPACING.XL,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    lineHeight: 26,
    marginBottom: SPACING.MD,
  },
  pickerContainer: {
    marginBottom: SPACING.XL,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: SPACING.MD,
  },
  regionCard: {
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.XL,
    marginBottom: SPACING.XL,
    borderWidth: 0,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  regionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.LG,
    paddingBottom: SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  regionName: {
    fontSize: 20,
    flex: 1,
    fontWeight: '700',
    lineHeight: 28,
  },
  regionBadge: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.SM,
    borderWidth: 0,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  regionBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  regionProperties: {
    gap: SPACING.MD,
  },
  propertyItem: {
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  propertyLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
    marginBottom: SPACING.SM,
  },
  propertyLabelText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  propertyValue: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  culturesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.LG,
    marginTop: SPACING.XL,
    paddingVertical: SPACING.LG,
    paddingHorizontal: SPACING.LG,
    borderRadius: BORDER_RADIUS.MD,
    borderWidth: 1,
  },
  culturesTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.MD,
  },
  culturesTitleText: {
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.LG,
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: SPACING.LG,
    borderWidth: 1,
    gap: SPACING.MD,
  },
  errorBannerText: {
    ...TYPOGRAPHY.body,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.XL,
    marginTop: SPACING.XL,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: SPACING.LG,
    marginBottom: SPACING.LG,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: '90%',
  },
  loadingFooter: {
    padding: SPACING.XL,
    alignItems: 'center',
  },
});
