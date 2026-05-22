import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { SUPPORTED_LANGUAGES } from '../i18n/constants';

interface LanguageSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LanguageSwitcher({ isOpen, onClose }: LanguageSwitcherProps) {
  const { colors } = useTheme();
  const { currentLanguage, changeLanguage } = useLanguage();

  const handleSelect = useCallback(async (code) => {
    await changeLanguage(code);
    onClose();
  }, [changeLanguage, onClose]);

  return (
    <Modal transparent visible={isOpen} animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text style={[styles.title, { color: colors.text }]}>Langue</Text>
          <FlatList
            data={SUPPORTED_LANGUAGES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.option, currentLanguage === item.code && { backgroundColor: colors.primaryPale }]}
                onPress={() => handleSelect(item.code)}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <View style={styles.optionContent}>
                  <Text style={[styles.nativeName, { color: colors.text }]}>{item.nativeName}</Text>
                  <Text style={[styles.code, { color: colors.textSecondary }]}>{item.code.toUpperCase()}</Text>
                </View>
                {currentLanguage === item.code && (
                  <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                )}
              </Pressable>
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  flag: { fontSize: 24, marginRight: 12 },
  optionContent: { flex: 1 },
  nativeName: { fontSize: 16, fontWeight: '500' },
  code: { fontSize: 12, marginTop: 2 },
});
