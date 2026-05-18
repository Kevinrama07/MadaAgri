import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { dataApi } from '../../lib/api';
import ListeProduits from '../../pages/Produits/ListeProduits';
import EditProductModal from './EditProductModal';

export default function ProductsPageWrapper() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dataApi.getMyProducts('all').catch((err) => {
        console.error('[ProductsPage] Failed to fetch my products:', err);
        return [];
      });
      setProducts(data);
    } catch (err) {
      console.error('[ProductsPage] Failed to load:', err);
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleToggleAvailability = async (product) => {
    setActionLoading(product.id);
    try {
      await dataApi.toggleProductAvailability(product.id);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_available: !p.is_available } : p
        )
      );
    } catch (err) {
      console.error('[ProductsPage] Toggle failed:', err);
      setError(err.message || 'Erreur lors du changement de disponibilité');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Supprimer "${product.title}" ? Cette action est irréversible.`)) return;
    setActionLoading(product.id);
    try {
      await dataApi.deleteProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err) {
      console.error('[ProductsPage] Delete failed:', err);
      setError(err.message || 'Erreur lors de la suppression');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
  };

  const handleEditSave = async (updatedData) => {
    setActionLoading(editingProduct.id);
    try {
      await dataApi.updateProduct(editingProduct.id, updatedData);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id ? { ...p, ...updatedData } : p
        )
      );
      setEditingProduct(null);
    } catch (err) {
      console.error('[ProductsPage] Update failed:', err);
      throw err;
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditCancel = () => {
    setEditingProduct(null);
  };

  if (error && products.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--error)' }}>Erreur: {error}</p>
        <button
          onClick={loadProducts}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            background: 'var(--primary)',
            color: 'var(--text-inverse)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
          }}
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <>
      <ListeProduits
        products={products}
        loading={loading}
        onToggleAvailability={handleToggleAvailability}
        onDelete={handleDelete}
        onEdit={handleEdit}
        actionLoading={actionLoading}
      />
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onSave={handleEditSave}
          onCancel={handleEditCancel}
        />
      )}
    </>
  );
}
