import React from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ThemeSelector({ isOpen, onClose }: ThemeSelectorProps) {
  const { colors, isDark, mode, toggleTheme } = useTheme();

  return (
    <Modal transparent visible={isOpen} animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          
          <Text style={[styles.title, { color: colors.text }]}>Apparence</Text>

          <View style={[styles.modeContainer, { backgroundColor: colors.primaryBackground }]}>
            <Pressable
              style={[
                styles.modeBtn,
                !isDark && [styles.modeActive, { backgroundColor: colors.card, borderColor: colors.primary }],
              ]}
              onPress={() => isDark && toggleTheme()}
            >
              <MaterialCommunityIcons
                name="weather-sunny"
                size={28}
                color={!isDark ? colors.primary : colors.textTertiary}
              />
              <Text
                style={[
                  styles.modeLabel,
                  { color: !isDark ? colors.primary : colors.textSecondary },
                  !isDark && { fontWeight: '700' },
                ]}
              >
                Clair
              </Text>
              {!isDark && (
                <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
                  <MaterialCommunityIcons name="check" size={12} color="#fff" />
                </View>
              )}
            </Pressable>

            <Pressable
              style={[
                styles.modeBtn,
                isDark && [styles.modeActive, { backgroundColor: colors.card, borderColor: colors.primary }],
              ]}
              onPress={() => !isDark && toggleTheme()}
            >
              <MaterialCommunityIcons
                name="weather-night"
                size={28}
                color={isDark ? colors.primary : colors.textTertiary}
              />
              <Text
                style={[
                  styles.modeLabel,
                  { color: isDark ? colors.primary : colors.textSecondary },
                  isDark && { fontWeight: '700' },
                ]}
              >
                Sombre
              </Text>
              {isDark && (
                <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
                  <MaterialCommunityIcons name="check" size={12} color="#fff" />
                </View>
              )}
            </Pressable>
          </View>

          <View style={[styles.previewCard, { backgroundColor: colors.primaryBackground }]}>
            <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>Aperçu</Text>
            <View style={styles.previewRow}>
              <View style={[styles.previewBtn, { backgroundColor: colors.primary }]}>
                <Text style={styles.previewBtnText}>Bouton</Text>
              </View>
              <View style={[styles.previewBadge, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.previewBadgeText, { color: '#fff' }]}>Badge</Text>
              </View>
            </View>
            <Text style={[styles.previewText, { color: colors.text }]}>Texte en couleur principale</Text>
          </View>

          <View style={[styles.infoRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Actuel</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {isDark ? 'Sombre' : 'Clair'}
            </Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingBottom: 40, paddingHorizontal: 20 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 20 },

  modeContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 6,
    gap: 6,
    marginBottom: 20,
  },
  modeBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  modeActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modeLabel: { fontSize: 14, fontWeight: '600' },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  previewCard: { borderRadius: 14, padding: 16, marginBottom: 20, gap: 12 },
  previewLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  previewRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  previewBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  previewBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  previewBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  previewBadgeText: { fontSize: 12, fontWeight: '600' },
  previewText: { fontSize: 13, fontWeight: '500' },

  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14 },
  infoLabel: { fontSize: 13, fontWeight: '500' },
  infoValue: { fontSize: 14, fontWeight: '700' },
});
