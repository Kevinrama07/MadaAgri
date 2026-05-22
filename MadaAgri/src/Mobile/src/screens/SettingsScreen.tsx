import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Text,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { ScreenHeader } from '../components/ScreenHeader';
import { ModernCard } from '../components/ModernCard';
import { ModernAvatar } from '../components/ModernAvatar';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ThemeSelector from '../components/ThemeSelector';
import { SUPPORTED_LANGUAGES } from '../i18n/constants';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';

export const SettingsScreen = ({ navigation, route }: any) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { t } = useTranslation(['settings', 'common']);
  const { currentLanguage } = useLanguage();
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [langOpen, setLangOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  const handleBack = () => {
    navigation.navigate('MainTabs', { screen: 'Feed' });
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.primaryBackground },
    scrollContent: { padding: SPACING.SCREEN_PADDING },
    section: { marginBottom: SPACING.XL },
    sectionTitle: { fontSize: TYPOGRAPHY.subheading.fontSize, fontWeight: TYPOGRAPHY.subheading.fontWeight, color: colors.text, marginBottom: SPACING.MD, marginLeft: SPACING.SM },
    profileCard: { marginBottom: SPACING.XL },
    profileContent: { flexDirection: 'row', alignItems: 'center', gap: SPACING.LG },
    profileInfo: { flex: 1 },
    profileName: { fontSize: TYPOGRAPHY.h3.fontSize, fontWeight: TYPOGRAPHY.h3.fontWeight, color: colors.text, marginBottom: SPACING.XS },
    profileEmail: { fontSize: TYPOGRAPHY.body.fontSize, color: colors.textSecondary },
    profileRole: { fontSize: TYPOGRAPHY.caption.fontSize, color: colors.primary, fontWeight: TYPOGRAPHY.captionBold.fontWeight, marginTop: SPACING.XS },
    menuItem: { marginBottom: SPACING.MD },
    menuItemContent: { flexDirection: 'row', alignItems: 'center', gap: SPACING.LG },
    iconContainer: { width: 40, height: 40, borderRadius: BORDER_RADIUS.DEFAULT, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primaryPale },
    menuItemInfo: { flex: 1 },
    menuItemTitle: { fontSize: TYPOGRAPHY.body.fontSize, fontWeight: TYPOGRAPHY.subheading.fontWeight, color: colors.text },
    menuItemSubtitle: { fontSize: TYPOGRAPHY.caption.fontSize, color: colors.textSecondary, marginTop: SPACING.XS },
    logoutButton: { marginTop: SPACING.XL },
    logoutContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.MD },
    logoutText: { fontSize: TYPOGRAPHY.body.fontSize, fontWeight: TYPOGRAPHY.subheading.fontWeight, color: colors.error },
    version: { textAlign: 'center', fontSize: TYPOGRAPHY.caption.fontSize, color: colors.textTertiary, marginTop: SPACING.XL, marginBottom: SPACING.LG },
  });

  const handleLogout = () => {
    Alert.alert(
      t('logout', { ns: 'common' }),
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: t('cancel', { ns: 'common' }), style: 'cancel' },
        { text: t('logout', { ns: 'common' }), style: 'destructive', onPress: async () => { await signOut(); } },
      ]
    );
  };

  const currentLangInfo = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScreenHeader title={t('title')} showBack={true} onBackPress={handleBack} showMenu={false} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ModernCard style={styles.profileCard} shadow="subtle">
          <View style={styles.profileContent}>
            <ModernAvatar
              size="large"
              source={user?.profile_picture ? { uri: user.profile_picture } : undefined}
              initials={user?.name?.charAt(0) || 'U'}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || t('profile')}</Text>
              <Text style={styles.profileEmail}>{user?.email || ''}</Text>
              <Text style={styles.profileRole}>
                {user?.role === 'farmer' ? '🌾 ' + t('farmer') : '👤 ' + t('client')}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textTertiary} />
          </View>
        </ModernCard>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('account')}</Text>
          <Pressable style={styles.menuItem}>
            <ModernCard shadow="subtle">
              <View style={styles.menuItemContent}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons name="account-edit" size={20} color={colors.primary} />
                </View>
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemTitle}>{t('updateProfile')}</Text>
                  <Text style={styles.menuItemSubtitle}>{t('bio')}, {t('phone')}, {t('location')}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textTertiary} />
              </View>
            </ModernCard>
          </Pressable>
          <Pressable style={styles.menuItem}>
            <ModernCard shadow="subtle">
              <View style={styles.menuItemContent}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons name="lock" size={20} color={colors.primary} />
                </View>
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemTitle}>{t('changePassword')}</Text>
                  <Text style={styles.menuItemSubtitle}>{t('twoFactorDesc')}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textTertiary} />
              </View>
            </ModernCard>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('appearance')}</Text>
          <Pressable style={styles.menuItem} onPress={() => setThemeOpen(true)}>
            <ModernCard shadow="subtle">
              <View style={styles.menuItemContent}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons name={isDark ? 'weather-night' : 'weather-sunny'} size={20} color={colors.primary} />
                </View>
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemTitle}>{t('appearance')}</Text>
                  <Text style={styles.menuItemSubtitle}>{isDark ? t('darkTheme') : t('lightTheme')}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textTertiary} />
              </View>
            </ModernCard>
          </Pressable>
          <Pressable style={styles.menuItem} onPress={() => setLangOpen(true)}>
            <ModernCard shadow="subtle">
              <View style={styles.menuItemContent}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons name="translate" size={20} color={colors.primary} />
                </View>
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemTitle}>{t('language')}</Text>
                  <Text style={styles.menuItemSubtitle}>
                    {currentLangInfo?.flag} {currentLangInfo?.nativeName}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textTertiary} />
              </View>
            </ModernCard>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notifications')}</Text>
          <Pressable style={styles.menuItem}>
            <ModernCard shadow="subtle">
              <View style={styles.menuItemContent}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons name="bell" size={20} color={colors.primary} />
                </View>
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemTitle}>{t('pushNotifications')}</Text>
                  <Text style={styles.menuItemSubtitle}>{t('notificationSettings')}</Text>
                </View>
                <Switch value={notifications} onValueChange={setNotifications} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.WHITE} />
              </View>
            </ModernCard>
          </Pressable>
          <Pressable style={styles.menuItem}>
            <ModernCard shadow="subtle">
              <View style={styles.menuItemContent}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons name="email" size={20} color={colors.primary} />
                </View>
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemTitle}>{t('emailNotifications')}</Text>
                  <Text style={styles.menuItemSubtitle}>{t('notificationSettings')}</Text>
                </View>
                <Switch value={emailNotifications} onValueChange={setEmailNotifications} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.WHITE} />
              </View>
            </ModernCard>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('about')}</Text>
          <Pressable style={styles.menuItem}>
            <ModernCard shadow="subtle">
              <View style={styles.menuItemContent}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons name="help-circle" size={20} color={colors.primary} />
                </View>
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemTitle}>{t('aboutTitle')}</Text>
                  <Text style={styles.menuItemSubtitle}>{t('aboutDesc')}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textTertiary} />
              </View>
            </ModernCard>
          </Pressable>
          <Pressable style={styles.menuItem}>
            <ModernCard shadow="subtle">
              <View style={styles.menuItemContent}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons name="shield-check" size={20} color={colors.primary} />
                </View>
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemTitle}>{t('privacyPolicy')}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textTertiary} />
              </View>
            </ModernCard>
          </Pressable>
          <Pressable style={styles.menuItem}>
            <ModernCard shadow="subtle">
              <View style={styles.menuItemContent}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons name="file-document" size={20} color={colors.primary} />
                </View>
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemTitle}>{t('termsOfUse')}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textTertiary} />
              </View>
            </ModernCard>
          </Pressable>
        </View>

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <ModernCard shadow="subtle">
            <View style={styles.logoutContent}>
              <MaterialCommunityIcons name="logout" size={24} color={colors.error} />
              <Text style={styles.logoutText}>{t('logout')}</Text>
            </View>
          </ModernCard>
        </Pressable>

        <Text style={styles.version}>MadaAgri v1.0.0</Text>
      </ScrollView>

      <ThemeSelector isOpen={themeOpen} onClose={() => setThemeOpen(false)} />
      <LanguageSwitcher isOpen={langOpen} onClose={() => setLangOpen(false)} />
    </SafeAreaView>
  );
};

export default SettingsScreen;
