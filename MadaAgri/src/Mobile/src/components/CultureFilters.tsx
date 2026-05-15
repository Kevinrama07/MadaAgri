import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../theme';
import { SortField, SortOrder, CultureCategory } from '../types/culture.types';

interface CultureFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCategory: CultureCategory | 'all';
  onCategoryChange: (category: CultureCategory | 'all') => void;
  sortBy: SortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortField, order: SortOrder) => void;
  culturesCount: number;
}

const CATEGORIES = [
  { id: 'all', label: 'Toutes', icon: '🌱' },
  { id: 'Céréales', label: 'Céréales', icon: '🌾' },
  { id: 'Légumes', label: 'Légumes', icon: '🥬' },
  { id: 'Fruits', label: 'Fruits', icon: '🍎' },
  { id: 'Légumineuses', label: 'Légumineuses', icon: '🫘' },
  { id: 'Autre', label: 'Autre', icon: '🌿' },
];

const SORT_OPTIONS = [
  { id: 'score', label: 'Score de compatibilité', order: 'desc' as SortOrder },
  { id: 'name', label: 'Nom (A-Z)', order: 'asc' as SortOrder },
  { id: 'name', label: 'Nom (Z-A)', order: 'desc' as SortOrder },
  { id: 'yield', label: 'Rendement', order: 'desc' as SortOrder },
  { id: 'growth', label: 'Période de croissance', order: 'asc' as SortOrder },
];

export default function CultureFilters({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  sortBy,
  sortOrder,
  onSortChange,
  culturesCount,
}: CultureFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const activeFiltersCount = (selectedCategory !== 'all' ? 1 : 0);

  return (
    <View style={styles.container}>
      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.TEXT_SECONDARY} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une culture..."
          placeholderTextColor={COLORS.TEXT_SECONDARY}
          value={searchTerm}
          onChangeText={onSearchChange}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>
        )}
      </View>

      {/* Bouton filtres */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="filter" size={20} color={COLORS.PRIMARY} />
          <Text style={styles.filterButtonText}>Filtres</Text>
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.countText}>{culturesCount} cultures</Text>
      </View>

      {/* Modal de filtres */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtres et Tri</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color={COLORS.TEXT_PRIMARY} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Catégories */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Catégories</Text>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryChip,
                        selectedCategory === category.id && styles.categoryChipActive,
                      ]}
                      onPress={() => onCategoryChange(category.id as any)}
                    >
                      <Text style={styles.categoryIcon}>{category.icon}</Text>
                      <Text
                        style={[
                          styles.categoryLabel,
                          selectedCategory === category.id && styles.categoryLabelActive,
                        ]}
                      >
                        {category.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Tri */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Trier par</Text>
                {SORT_OPTIONS.map((option, index) => {
                  const isActive =
                    sortBy === option.id && sortOrder === option.order;
                  return (
                    <TouchableOpacity
                      key={`${option.id}-${option.order}-${index}`}
                      style={[
                        styles.sortOption,
                        isActive && styles.sortOptionActive,
                      ]}
                      onPress={() => onSortChange(option.id as SortField, option.order)}
                    >
                      <Text
                        style={[
                          styles.sortOptionText,
                          isActive && styles.sortOptionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                      {isActive && (
                        <Ionicons name="checkmark" size={20} color={COLORS.PRIMARY} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Réinitialiser */}
              {activeFiltersCount > 0 && (
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={() => {
                    onCategoryChange('all');
                    onSortChange('score', 'desc');
                  }}
                >
                  <Ionicons name="refresh" size={20} color={COLORS.ERROR} />
                  <Text style={styles.resetButtonText}>Réinitialiser les filtres</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyButtonText}>Appliquer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.LG,
    marginTop: SPACING.LG,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.CARD_BG,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.MEDIUM,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: SPACING.MD,
    minHeight: 50,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.MEDIUM,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.2)',
    minHeight: 50,
  },
  filterButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  filterBadge: {
    backgroundColor: COLORS.PRIMARY,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.XS,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  countText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.BACKGROUND,
    borderTopLeftRadius: BORDER_RADIUS.LARGE,
    borderTopRightRadius: BORDER_RADIUS.LARGE,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.TEXT_PRIMARY,
  },
  modalBody: {
    padding: SPACING.LG,
  },
  section: {
    marginBottom: SPACING.LG,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
    backgroundColor: COLORS.CARD_BG,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.MEDIUM,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    minHeight: 50,
  },
  categoryChipActive: {
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    borderColor: COLORS.PRIMARY,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  categoryLabelActive: {
    color: COLORS.PRIMARY,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.LG,
    paddingHorizontal: SPACING.LG,
    backgroundColor: COLORS.CARD_BG,
    borderRadius: BORDER_RADIUS.MEDIUM,
    marginBottom: SPACING.MD,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    minHeight: 56,
  },
  sortOptionActive: {
    backgroundColor: 'rgba(46, 125, 50, 0.08)',
    borderColor: COLORS.PRIMARY,
    borderWidth: 2,
  },
  sortOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  sortOptionTextActive: {
    color: COLORS.PRIMARY,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.MD,
    paddingVertical: SPACING.LG,
    paddingHorizontal: SPACING.LG,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: BORDER_RADIUS.MEDIUM,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    marginTop: SPACING.LG,
    minHeight: 50,
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ERROR,
  },
  modalFooter: {
    padding: SPACING.LG,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  applyButton: {
    backgroundColor: COLORS.PRIMARY,
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.MEDIUM,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
