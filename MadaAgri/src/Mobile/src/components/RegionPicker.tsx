import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { Region } from '../types/culture.types';

interface RegionPickerProps {
  regions: Region[];
  selectedRegion: Region | null;
  onSelect: (region: Region) => void;
}

export default function RegionPicker({ regions, selectedRegion, onSelect }: RegionPickerProps) {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRegions = regions.filter(region =>
    region.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (region: Region) => {
    onSelect(region);
    setModalVisible(false);
    setSearchTerm('');
  };

  const regionCount = regions.length;
  const hasRegions = regionCount > 0;

  return (
    <>
      <TouchableOpacity 
        style={[styles.selector, { backgroundColor: colors.card, shadowColor: colors.primary }]} 
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
        disabled={!hasRegions}
        accessible={true}
        accessibilityLabel={selectedRegion ? `Région sélectionnée: ${selectedRegion.name}` : 'Sélectionner une région'}
        accessibilityRole="button"
        accessibilityHint="Ouvre la liste des régions disponibles"
      >
        <View style={styles.selectorContent}>
          <Ionicons name="location" size={24} color={hasRegions ? colors.primary : colors.textSecondary} />
          <View style={styles.selectorTextContainer}>
            <Text 
              style={[styles.selectorText, { color: hasRegions ? colors.text : colors.textSecondary }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {selectedRegion ? selectedRegion.name : hasRegions ? 'Sélectionner une région' : 'Aucune région disponible'}
            </Text>
          </View>
          {hasRegions && (
            <View style={[styles.regionCountBadge, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
              <Text style={styles.regionCountText}>{regionCount}</Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-down" size={24} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.primaryBackground }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Sélectionner une région</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Rechercher une région..."
                placeholderTextColor={colors.textSecondary}
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
              {searchTerm.length > 0 && (
                <TouchableOpacity onPress={() => setSearchTerm('')}>
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* List */}
            <FlatList
              data={filteredRegions}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.regionItem,
                    { backgroundColor: colors.card },
                    selectedRegion?.id === item.id && [styles.regionItemSelected, { backgroundColor: colors.primaryPale, borderColor: colors.primary, shadowColor: colors.primary }]
                  ]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.regionItemContent}>
                    <Text style={[styles.regionName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
                    {item.soil_type && (
                      <Text style={[styles.regionDetail, { color: colors.textSecondary }]} numberOfLines={1}>
                        🌍 Sol: {item.soil_type}
                      </Text>
                    )}
                    {item.climate && (
                      <Text style={[styles.regionDetail, { color: colors.textSecondary }]} numberOfLines={1}>
                        ☁️ Climat: {item.climate}
                      </Text>
                    )}
                  </View>
                  {selectedRegion?.id === item.id && (
                    <Ionicons name="checkmark-circle" size={28} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="search" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Aucune région trouvée</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.LG,
    paddingHorizontal: SPACING.LG,
    borderRadius: BORDER_RADIUS.MD,
    borderWidth: 0,
    minHeight: 56,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.MD,
    flex: 1,
    marginRight: SPACING.SM,
  },
  selectorTextContainer: {
    flex: 1,
  },
  selectorText: {
    fontSize: 16,
    fontWeight: '600',
  },
  regionCountBadge: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
    marginLeft: SPACING.SM,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  regionCountText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BORDER_RADIUS.LG,
    borderTopRightRadius: BORDER_RADIUS.LG,
    maxHeight: '80%',
    paddingBottom: SPACING.LG,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
  },
  closeButton: {
    padding: SPACING.XS,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: SPACING.LG,
    paddingHorizontal: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.SM,
    ...TYPOGRAPHY.body,
  },
  regionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.LG,
    paddingHorizontal: SPACING.LG,
    marginHorizontal: SPACING.LG,
    marginBottom: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    borderWidth: 0,
    minHeight: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  regionItemSelected: {
    borderWidth: 2,
    shadowOpacity: 0.25,
    elevation: 6,
  },
  regionItemContent: {
    flex: 1,
    marginRight: SPACING.MD,
  },
  regionName: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: SPACING.SM,
  },
  regionDetail: {
    fontSize: 14,
    marginTop: SPACING.XS,
    lineHeight: 20,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.XL,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    marginTop: SPACING.SM,
  },
});
