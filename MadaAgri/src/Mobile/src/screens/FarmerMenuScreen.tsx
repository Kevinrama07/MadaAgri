import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Text,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { ScreenHeader } from '../components/ScreenHeader';
import { ModernCard } from '../components/ModernCard';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';

interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  screen: string;
}

interface FarmerMenuScreenProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export const FarmerMenuScreen = ({
  onBack,
  onNavigate,
}: FarmerMenuScreenProps) => {
  const { colors } = useTheme();

  const menuItems: MenuItem[] = [
    {
      id: '1',
      title: 'Commandes reçues',
      description: 'Gérer les commandes de vos clients',
      icon: 'clipboard-list',
      color: colors.primary,
      screen: 'received-orders',
    },
    {
      id: '2',
      title: 'Ajouter un produit',
      description: 'Publier un nouveau produit',
      icon: 'plus-circle',
      color: colors.success,
      screen: 'add-product',
    },
    {
      id: '3',
      title: 'Gestion des produits',
      description: 'Modifier ou supprimer vos produits',
      icon: 'cog',
      color: colors.warning,
      screen: 'manage-products',
    },
    {
      id: '4',
      title: 'Analyse',
      description: 'Statistiques et recommandations',
      icon: 'chart-line',
      color: colors.accent,
      screen: 'analysis',
    },
    {
      id: '5',
      title: 'Optimisation du trajet',
      description: 'Calculer le meilleur itinéraire',
      icon: 'map-marker-path',
      color: colors.error,
      screen: 'optimization',
    },
    {
      id: '6',
      title: 'Météo',
      description: 'Prévisions météorologiques',
      icon: 'weather-partly-cloudy',
      color: '#4A90E2',
      screen: 'weather',
    },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    scrollContent: {
      padding: SPACING.SCREEN_PADDING,
    },
    title: {
      fontSize: TYPOGRAPHY.h2.fontSize,
      fontWeight: TYPOGRAPHY.h2.fontWeight,
      color: colors.text,
      marginBottom: SPACING.MD,
    },
    subtitle: {
      fontSize: TYPOGRAPHY.body.fontSize,
      color: colors.textSecondary,
      marginBottom: SPACING.XL,
    },
    menuItem: {
      marginBottom: SPACING.LG,
    },
    menuItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.LG,
    },
    iconContainer: {
      width: 56,
      height: 56,
      borderRadius: BORDER_RADIUS.DEFAULT,
      justifyContent: 'center',
      alignItems: 'center',
    },
    menuItemInfo: {
      flex: 1,
    },
    menuItemTitle: {
      fontSize: TYPOGRAPHY.subheading.fontSize,
      fontWeight: TYPOGRAPHY.subheading.fontWeight,
      color: colors.text,
      marginBottom: SPACING.XS,
    },
    menuItemDescription: {
      fontSize: TYPOGRAPHY.body.fontSize,
      color: colors.textSecondary,
    },
    chevron: {
      marginLeft: 'auto',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Menu Agriculteur"
        showBack={true}
        onBackPress={onBack}
        showMenu={false}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Fonctionnalités Agriculteur</Text>
        <Text style={styles.subtitle}>
          Accédez à tous les outils pour gérer votre activité agricole
        </Text>

        {menuItems.map((item) => (
          <Pressable
            key={item.id}
            style={styles.menuItem}
            onPress={() => onNavigate(item.screen)}
          >
            <ModernCard shadow="subtle">
              <View style={styles.menuItemContent}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: `${item.color}20` },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={28}
                    color={item.color}
                  />
                </View>

                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemDescription}>
                    {item.description}
                  </Text>
                </View>

                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={colors.textTertiary}
                  style={styles.chevron}
                />
              </View>
            </ModernCard>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default FarmerMenuScreen;
