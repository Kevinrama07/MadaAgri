import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { ModernCard } from '../components/ModernCard';
import { ModernProductCard } from '../components/ModernProductCard';
import { ModernInput } from '../components/ModernInput';
import { ScreenHeader } from '../components/ScreenHeader';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';
import { getProducts } from '../lib/api';

interface Product {
  id: string;
  title: string;
  price: number;
  image: { uri: string };
  seller: {
    id: string;
    name: string;
    verified?: boolean;
  };
  location: string;
  category: string;
  isNew?: boolean;
  isPromotion?: boolean;
  discount?: number;
  available?: boolean;
}

interface ModernMarketplaceScreenProps {
  navigation?: any;
  onProductPress?: (productId: string) => void;
  onContactPress?: (productId: string) => void;
  onCategoryPress?: (category: string) => void;
  onSearchPress?: () => void;
  onMoreMenuPress?: () => void;
}

const CATEGORIES = [
  { id: 'all', name: 'Tout', icon: 'view-grid' },
  { id: 'legumes', name: 'Légumes', icon: 'leaf' },
  { id: 'fruits', name: 'Fruits', icon: 'apple' },
  { id: 'cereales', name: 'Céréales', icon: 'grain' },
  { id: 'outils', name: 'Outils', icon: 'hammer' },
  { id: 'semences', name: 'Semences', icon: 'sprout' },
];

export const ModernMarketplaceScreen = ({
  navigation,
  onProductPress,
  onContactPress,
  onCategoryPress,
  onSearchPress,
  onMoreMenuPress,
}: ModernMarketplaceScreenProps) => {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const styles = useMemo(() => {
    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: colors.primaryBackground,
      },
      searchContainer: {
        paddingHorizontal: SPACING.SCREEN_PADDING,
        paddingVertical: SPACING.PADDING_DEFAULT,
      },
      categoriesContainer: {
        paddingVertical: SPACING.PADDING_DEFAULT,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      categoriesScroll: {
        paddingHorizontal: SPACING.SCREEN_PADDING,
      },
      categoryButton: {
        alignItems: 'center',
        marginRight: SPACING.LG,
        paddingVertical: SPACING.PADDING_DEFAULT,
      },
      categoryButtonActive: {
        borderBottomWidth: 2,
        borderBottomColor: colors.primary,
      },
      categoryIcon: {
        marginBottom: SPACING.SM,
      },
      categoryLabel: {
        fontSize: TYPOGRAPHY.caption.fontSize,
        fontWeight: TYPOGRAPHY.caption.fontWeight,
        color: colors.textTertiary,
      },
      categoryLabelActive: {
        color: colors.primary,
        fontWeight: TYPOGRAPHY.captionBold.fontWeight,
      },
      productsList: {
        paddingHorizontal: SPACING.SCREEN_PADDING,
        paddingTop: SPACING.PADDING_DEFAULT,
      },
      filterBar: {
        flexDirection: 'row',
        gap: SPACING.MD,
        paddingHorizontal: SPACING.SCREEN_PADDING,
        paddingVertical: SPACING.PADDING_DEFAULT,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.PADDING_DEFAULT,
        paddingVertical: SPACING.PADDING_SMALL,
        borderRadius: BORDER_RADIUS.BUTTON,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
      },
      filterButtonText: {
        fontSize: TYPOGRAPHY.body.fontSize,
        fontWeight: TYPOGRAPHY.body.fontWeight,
        color: colors.text,
        marginLeft: SPACING.SM,
      },
      emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: SPACING.XL * 3,
        paddingHorizontal: SPACING.SCREEN_PADDING,
      },
      emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.primaryPale,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.LG,
      },
      emptyTitle: {
        fontSize: TYPOGRAPHY.h3.fontSize,
        fontWeight: TYPOGRAPHY.h3.fontWeight,
        color: colors.text,
        marginBottom: SPACING.SM,
        textAlign: 'center',
      },
      emptySubtitle: {
        fontSize: TYPOGRAPHY.body.fontSize,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
      },
    });
  }, [colors]);

  // Charger les produits
  useEffect(() => {
    loadProducts();
  }, [selectedCategory, searchQuery]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      
      if (selectedCategory && selectedCategory !== 'all') {
        filters.category = selectedCategory;
      }
      
      if (searchQuery) {
        filters.q = searchQuery;
      }

      const data = await getProducts(filters);
      
      // Transformer les données pour correspondre à l'interface Product
      const transformedProducts = data.map((p: any) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        image: p.image_url ? { uri: p.image_url } : undefined,
        seller: {
          id: p.farmer_id,
          name: p.farmer_name || 'Vendeur',
          verified: false,
        },
        location: p.region_name || 'Madagascar',
        category: p.category || 'Autre',
        available: p.stock > 0,
      }));
      
      setProducts(transformedProducts);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
      // En cas d'erreur, afficher des produits vides
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  }, [selectedCategory, searchQuery]);

  const renderCategory = ({ item }: { item: (typeof CATEGORIES)[0] }) => {
    const isActive = selectedCategory === item.id;

    return (
      <Pressable
        style={[styles.categoryButton, isActive && styles.categoryButtonActive]}
        onPress={() => {
          setSelectedCategory(item.id);
          onCategoryPress?.(item.name);
        }}
      >
        <MaterialCommunityIcons
          name={item.icon as any}
          size={24}
          color={isActive ? colors.primary : colors.textTertiary}
          style={styles.categoryIcon}
        />
        <Text
          style={[
            styles.categoryLabel,
            isActive && styles.categoryLabelActive,
          ]}
        >
          {item.name}
        </Text>
      </Pressable>
    );
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <ModernProductCard
      {...item}
      onPress={() => onProductPress?.(item.id)}
      onContactPress={() => onContactPress?.(item.id)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons name="shopping-outline" size={40} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>Aucun produit disponible</Text>
      <Text style={styles.emptySubtitle}>
        Il n'y a pas encore de produits dans cette catégorie.{"\n"}
        Revenez plus tard ou essayez une autre catégorie.
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView edges={["left", "right", "bottom"]} style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.container}>
      <ScreenHeader
        title="Marketplace"
        showBack
        onBackPress={() => navigation?.goBack()}
        showSearch={true}
        searchPlaceholder="Chercher un produit..."
        onSearchChange={(text) => setSearchQuery(text)}
        showMenu={true}
        showMoreMenu={true}
        onMoreMenuPress={onMoreMenuPress}
      />

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            {/* Categories */}
            <View style={styles.categoriesContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesScroll}
              >
                {CATEGORIES.map((category) => (
                  <Pressable
                    key={category.id}
                    style={[
                      styles.categoryButton,
                      selectedCategory === category.id &&
                        styles.categoryButtonActive,
                    ]}
                    onPress={() => {
                      setSelectedCategory(
                        selectedCategory === category.id ? '' : category.id
                      );
                      onCategoryPress?.(category.name);
                    }}
                  >
                    <MaterialCommunityIcons
                      name={category.icon as any}
                      size={24}
                      color={
                        selectedCategory === category.id
                          ? colors.primary
                          : colors.textTertiary
                      }
                      style={styles.categoryIcon}
                    />
                    <Text
                      style={[
                        styles.categoryLabel,
                        selectedCategory === category.id &&
                          styles.categoryLabelActive,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Filter Bar */}
            <View style={styles.filterBar}>
              <Pressable style={styles.filterButton}>
                <MaterialCommunityIcons
                  name="filter"
                  size={18}
                  color={colors.text}
                />
                <Text style={styles.filterButtonText}>Filtres</Text>
              </Pressable>

              <Pressable style={styles.filterButton}>
                <MaterialCommunityIcons
                  name="sort"
                  size={18}
                  color={colors.text}
                />
                <Text style={styles.filterButtonText}>Trier</Text>
              </Pressable>
            </View>
          </>
        }
        ListEmptyComponent={!loading ? renderEmptyState : null}
        contentContainerStyle={styles.productsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        scrollEventThrottle={16}
      />
    </SafeAreaView>
  );
};

export default ModernMarketplaceScreen;
