import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Text,
  Switch,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { ScreenHeader } from '../components/ScreenHeader';
import { ModernCard } from '../components/ModernCard';
import { ModernAvatar } from '../components/ModernAvatar';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';

interface SettingsScreenProps {
  onBack: () => void;
  onLogout?: () => void;
}

export const SettingsScreen = ({ navigation, route }: any) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const handleBack = () => {
    // Retourner vers l'onglet Feed (Accueil) dans MainTabs
    navigation.navigate('MainTabs', { screen: 'Feed' });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    scrollContent: {
      padding: SPACING.SCREEN_PADDING,
    },
    section: {
      marginBottom: SPACING.XL,
    },
    sectionTitle: {
      fontSize: TYPOGRAPHY.subheading.fontSize,
      fontWeight: TYPOGRAPHY.subheading.fontWeight,
      color: colors.text,
      marginBottom: SPACING.MD,
      marginLeft: SPACING.SM,
    },
    profileCard: {
      marginBottom: SPACING.XL,
    },
    profileContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.LG,
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: TYPOGRAPHY.h3.fontSize,
      fontWeight: TYPOGRAPHY.h3.fontWeight,
      color: colors.text,
      marginBottom: SPACING.XS,
    },
    profileEmail: {
      fontSize: TYPOGRAPHY.body.fontSize,
      color: colors.textSecondary,
    },
    profileRole: {
      fontSize: TYPOGRAPHY.caption.fontSize,
      color: colors.primary,
      fontWeight: TYPOGRAPHY.captionBold.fontWeight,
      marginTop: SPACING.XS,
    },
    menuItem: {
      marginBottom: SPACING.MD,
    },
    menuItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.LG,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: BORDER_RADIUS.DEFAULT,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.primaryPale,
    },
    menuItemInfo: {
      flex: 1,
    },
    menuItemTitle: {
      fontSize: TYPOGRAPHY.body.fontSize,
      fontWeight: TYPOGRAPHY.subheading.fontWeight,
      color: colors.text,
    },
    menuItemSubtitle: {
      fontSize: TYPOGRAPHY.caption.fontSize,
      color: colors.textSecondary,
      marginTop: SPACING.XS,
    },
    logoutButton: {
      marginTop: SPACING.XL,
    },
    logoutContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.MD,
    },
    logoutText: {
      fontSize: TYPOGRAPHY.body.fontSize,
      fontWeight: TYPOGRAPHY.subheading.fontWeight,
      color: colors.error,
    },
    version: {
      textAlign: 'center',
      fontSize: TYPOGRAPHY.caption.fontSize,
      color: colors.textTertiary,
      marginTop: SPACING.XL,
      marginBottom: SPACING.LG,
    },
  });

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            // AuthContext will automatically handle navigation to Landing screen
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Paramètres"
        showBack={true}
        onBackPress={handleBack}
        showMenu={false}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <ModernCard style={styles.profileCard} shadow="subtle">
          <View style={styles.profileContent}>
            <ModernAvatar
              size="large"
              source={user?.profile_picture ? { uri: user.profile_picture } : undefined}
              initials={user?.name?.charAt(0) || 'U'}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || 'Utilisateur'}</Text>
              <Text style={styles.profileEmail}>{user?.email || ''}</Text>
              <Text style={styles.profileRole}>
                {user?.role === 'farmer' ? '🌾 Agriculteur' : '👤 Client'}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.textTertiary}
            />
          </View>
        </ModernCard>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compte</Text>

          <Pressable style={styles.menuItem}>
            <ModernCard shadow="subtle">
              <View style={styles.menuItemContent}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name="account-edit"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemTitle}>Modifier le profil</Text>
                  <Text style={styles.menuItemSubtitle}>
                    Nom, photo, bio, etc.
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={colors.textTertiary}
                />
              </View>
            </ModernCard>
          </Pressable>

          <Pressable style={styles.menuItem}>
            <ModernCard shadow="subtle">
              <View style={styles.menuItemContent}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name="lock"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemTitle}>Sécurité</Text>
                  <Text style={styles.menuItemSubtitle}>
                    Mot de passe, authentification
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={colors.textTertiary}
                />
              </View>
            </ModernCard>
          </Pressable>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Préférences</Text>

          <Pressable style={styles.menuItem}>
            <ModernCard shadow="subtle">
              <View style={styles.menuItemContent}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name={isDark ? 'weather-night' : 'weather-sunny'}
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemTitle}>Mode sombre</Text>
                  <Text style={styles.menuItemSubtitle}>
                    {isDark ? 'Activé' : 'Désactivé'}
                  </Text>
                </View>
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.WHITE}
                />
              </View>
            </ModernCard>
          </Pressable>

          <Pressable style={styles.menuItem}>
            <ModernCard shadow="subtle">
              <View style={styles.menuItemContent}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name="bell"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemTitle}>Notifications push</Text>
                  <Text style={styles.menuItemSubtitle}>
                    Recevoir des notifications
                  </Text>
                </View>
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.WHITE}
                />
              </View>
            </ModernCard>
          </Pressable>

          <Pressable style={styles.menuItem}>
            <ModernCard shadow="subtle">
              <View style={styles.menuItemContent}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name="email"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemTitle}>Notifications email</Text>
                  <Text style={styles.menuItemSubtitle}>
                    Recevoir des emails
                  </Text>
                </View>
                <Switch
                  value={emailNotifications}
                  onValueChange={setEmailNotifications}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.WHITE}
                />
              </View>
            </ModernCard>
          </Pressable>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>À propos</Text>

          <Pressable style={styles.menuItem}>
            <ModernCard shadow="subtle">
              <View style={styles.menuItemContent}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name="help-circle"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemTitle}>Aide & Support</Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={colors.textTertiary}
                />
              </View>
            </ModernCard>
          </Pressable>

          <Pressable style={styles.menuItem}>
            <ModernCard shadow="subtle">
              <View style={styles.menuItemContent}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name="shield-check"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemTitle}>Confidentialité</Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={colors.textTertiary}
                />
              </View>
            </ModernCard>
          </Pressable>

          <Pressable style={styles.menuItem}>
            <ModernCard shadow="subtle">
              <View style={styles.menuItemContent}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name="file-document"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemTitle}>Conditions d'utilisation</Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={colors.textTertiary}
                />
              </View>
            </ModernCard>
          </Pressable>
        </View>

        {/* Logout Button */}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <ModernCard shadow="subtle">
            <View style={styles.logoutContent}>
              <MaterialCommunityIcons
                name="logout"
                size={24}
                color={colors.error}
              />
              <Text style={styles.logoutText}>Déconnexion</Text>
            </View>
          </ModernCard>
        </Pressable>

        {/* Version */}
        <Text style={styles.version}>MadaAgri v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;
