import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem } from '../services/reservationService';

const CART_STORAGE_KEY = '@madaagri_cart';

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger le panier au montage
  useEffect(() => {
    loadCart();
  }, []);

  // Charger le panier depuis AsyncStorage
  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
      setError(null);
    } catch (err) {
      console.error('[useCart] Erreur chargement panier:', err);
      setError('Erreur lors du chargement du panier');
    } finally {
      setLoading(false);
    }
  }, []);

  // Sauvegarder le panier dans AsyncStorage
  const saveCart = useCallback(async (cartItems: CartItem[]) => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      setError(null);
    } catch (err) {
      console.error('[useCart] Erreur sauvegarde panier:', err);
      setError('Erreur lors de la sauvegarde du panier');
    }
  }, []);

  // Ajouter un article au panier
  const addItem = useCallback(
    (item: CartItem) => {
      setItems((prevItems) => {
        const existing = prevItems.find((i) => i.id === item.id);
        let updated: CartItem[];

        if (existing) {
          updated = prevItems.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
          );
        } else {
          updated = [...prevItems, item];
        }

        saveCart(updated);
        return updated;
      });
    },
    [saveCart]
  );

  // Supprimer un article du panier
  const removeItem = useCallback(
    (itemId: string) => {
      setItems((prevItems) => {
        const updated = prevItems.filter((i) => i.id !== itemId);
        saveCart(updated);
        return updated;
      });
    },
    [saveCart]
  );

  // Mettre à jour la quantité d'un article
  const updateQuantity = useCallback(
    (itemId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(itemId);
        return;
      }

      setItems((prevItems) => {
        const updated = prevItems.map((i) =>
          i.id === itemId ? { ...i, quantity } : i
        );
        saveCart(updated);
        return updated;
      });
    },
    [removeItem, saveCart]
  );

  // Vider le panier
  const clearCart = useCallback(async () => {
    try {
      setItems([]);
      await AsyncStorage.removeItem(CART_STORAGE_KEY);
      setError(null);
    } catch (err) {
      console.error('[useCart] Erreur vidage panier:', err);
      setError('Erreur lors du vidage du panier');
    }
  }, []);

  // Calculer le total
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Calculer le nombre d'articles
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Grouper par vendeur
  const groupedByFarmer = items.reduce(
    (acc, item) => {
      if (!acc[item.farmer_id]) {
        acc[item.farmer_id] = {
          farmer_id: item.farmer_id,
          farmer_name: item.farmer_name,
          items: [],
        };
      }
      acc[item.farmer_id].items.push(item);
      return acc;
    },
    {} as Record<
      string,
      {
        farmer_id: string;
        farmer_name: string;
        items: CartItem[];
      }
    >
  );

  return {
    items,
    loading,
    error,
    total,
    itemCount,
    groupedByFarmer: Object.values(groupedByFarmer),
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    loadCart,
  };
}

/**
 * useProducts - Hook pour la gestion des produits
 * Gère le fetch, filtrage et tri des produits
 */

// import { Product } from '../services/productService'; // File doesn't exist yet
import { dataApi } from '../lib/api';

type Product = any; // Temporary type definition

export interface ProductFilters {
  searchQuery?: string;
  regionId?: number;
  cultureId?: number;
  sortBy?: 'recent' | 'price-asc' | 'price-desc';
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProductFilters>({
    sortBy: 'recent',
  });

  // Fetch produits
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await (dataApi as any).fetchProducts?.() || [];
      setProducts(data);
    } catch (err) {
      console.error('[useProducts] Erreur fetch:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  // Rechercher produits
  const searchProducts = useCallback(async (query: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await (dataApi as any).searchProducts?.(query) || [];
      setProducts(data);
    } catch (err) {
      console.error('[useProducts] Erreur recherche:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  }, []);

  // Appliquer les filtres
  const applyFilters = useCallback((newFilters: ProductFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // Produits filtrés
  let filteredProducts = products.filter((product) => {
    if (!product.is_available || product.quantity <= 0) return false;
    if (
      filters.searchQuery &&
      !product.title.toLowerCase().includes(filters.searchQuery.toLowerCase())
    )
      return false;
    if (filters.regionId && product.region_id !== filters.regionId) return false;
    if (filters.cultureId && product.culture_id !== filters.cultureId) return false;
    return true;
  });

  // Tri
  filteredProducts = filteredProducts.sort((a, b) => {
    switch (filters.sortBy) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'recent':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  return {
    products: filteredProducts,
    allProducts: products,
    loading,
    error,
    filters,
    fetchProducts,
    searchProducts,
    applyFilters,
  };
}

export default {
  useCart,
  useProducts,
};
