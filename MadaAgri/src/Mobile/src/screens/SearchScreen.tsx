import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Text,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Avatar, ProductCard, PostCard, Card } from '../components';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';
import { get } from '../lib/api';

export default function SearchScreen({ navigation }: any) {
  const { colors, spacing } = useTheme().theme;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [results, setResults] = useState({ users: [], products: [], posts: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.length > 2) {
      performSearch();
    } else {
      setResults({ users: [], products: [], posts: [] });
    }
  }, [searchQuery]);

  const performSearch = async () => {
    try {
      setLoading(true);
      const [users, products, posts] = await Promise.all([
        get(`/api/users/search?q=${encodeURIComponent(searchQuery)}`),
        get(`/api/products?q=${encodeURIComponent(searchQuery)}`),
        get(`/api/posts?q=${encodeURIComponent(searchQuery)}`),
      ]);
      setResults({
        users: users.users || [],
        products: products.data || [],
        posts: posts.posts || [],
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.SCREEN_PADDING,
      paddingVertical: spacing.PADDING_DEFAULT,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      marginRight: spacing.MARGIN_DEFAULT,
    },
    searchInputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryBackground,
      borderRadius: BORDER_RADIUS.FULL,
      paddingHorizontal: spacing.PADDING_LARGE,
      paddingVertical: spacing.PADDING_SMALL,
    },
    searchInput: {
      flex: 1,
      fontSize: 14, // TYPOGRAPHY.body.fontSize
      color: colors.text,
      marginLeft: spacing.MARGIN_SMALL,
    },
    tabsContainer: {
      flexDirection: 'row',
      paddingHorizontal: spacing.SCREEN_PADDING,
      paddingVertical: spacing.PADDING_DEFAULT,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tabButton: {
      paddingHorizontal: spacing.PADDING_LARGE,
      paddingVertical: spacing.PADDING_SMALL,
      marginRight: spacing.MARGIN_SMALL,
      borderRadius: BORDER_RADIUS.FULL,
    },
    activeTab: {
      backgroundColor: colors.primary,
    },
    inactiveTab: {
      backgroundColor: colors.primaryBackground,
    },
    tabText: {
      fontSize: 13, // TYPOGRAPHY.bodySmall.fontSize
      fontWeight: '500' as const,
    },
    activeTabText: {
      color: colors.WHITE,
    },
    inactiveTabText: {
      color: colors.text,
    },
    userItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.PADDING_LARGE,
      backgroundColor: colors.card,
      marginBottom: spacing.MARGIN_SMALL,
    },
    userInfo: {
      flex: 1,
      marginLeft: spacing.MARGIN_DEFAULT,
    },
    userName: {
      fontSize: 14, // TYPOGRAPHY.body.fontSize
      fontWeight: '600' as const,
      color: colors.text,
    },
    userRole: {
      fontSize: 13, // TYPOGRAPHY.bodySmall.fontSize
      color: colors.textSecondary,
      marginTop: spacing.SM,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing.PADDING_XL,
    },
    emptyText: {
      fontSize: 14, // TYPOGRAPHY.body.fontSize
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.MARGIN_DEFAULT,
    },
  });

  const renderUser = ({ item }: any) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
    >
      <Avatar
        size="medium"
        source={item.profile_image_url ? { uri: item.profile_image_url } : undefined}
        initials={item.display_name.substring(0, 2)}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.display_name}</Text>
        <Text style={styles.userRole}>
          {item.role === 'farmer' ? '🌾 Agriculteur' : '🛒 Client'}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderProduct = ({ item }: any) => (
    <ProductCard
      id={item.id}
      name={item.title}
      price={item.price}
      image={item.image_url}
      seller={{ name: item.farmer_name }}
      location={item.region_name}
      available={item.available !== false}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
    />
  );

  const renderPost = ({ item }: any) => (
    <PostCard
      author={item.author}
      content={item.content}
      image={item.image_url}
      timestamp={item.created_at}
      likes={item.likes_count}
      comments={item.comments_count}
      shares={item.shares_count}
      liked={item.user_likes}
      onLike={() => {}}
      onComment={() => {}}
      onShare={() => {}}
    />
  );

  const getFilteredResults = () => {
    if (activeTab === 'all') {
      return [
        ...(results.users as any[]).map((u: any) => ({ ...u, type: 'user' })),
        ...(results.products as any[]).map((p: any) => ({ ...p, type: 'product' })),
        ...(results.posts as any[]).map((p: any) => ({ ...p, type: 'post' })),
      ];
    }
    if (activeTab === 'users') return results.users;
    if (activeTab === 'products') return results.products;
    if (activeTab === 'posts') return results.posts;
    return [];
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.searchInputContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {['all', 'users', 'products', 'posts'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab ? styles.activeTab : styles.inactiveTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[styles.tabText, activeTab === tab ? styles.activeTabText : styles.inactiveTabText]}
            >
              {tab === 'all' ? 'Tout' : tab === 'users' ? 'Utilisateurs' : tab === 'products' ? 'Produits' : 'Publications'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results */}
      <FlatList
        data={getFilteredResults()}
        keyExtractor={(item, index) => `${item.type || activeTab}-${item.id}-${index}`}
        renderItem={({ item }) => {
          if (activeTab === 'users' || item.type === 'user') return renderUser({ item });
          if (activeTab === 'products' || item.type === 'product') return renderProduct({ item });
          if (activeTab === 'posts' || item.type === 'post') return renderPost({ item });
          return null;
        }}
        contentContainerStyle={{ paddingHorizontal: spacing.SCREEN_PADDING }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="magnify" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyText}>
              {searchQuery.length > 2 ? 'Aucun résultat trouvé' : 'Tapez pour rechercher'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
