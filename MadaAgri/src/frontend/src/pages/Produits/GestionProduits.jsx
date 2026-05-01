import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { FiEdit2, FiTrash2, FiEye, FiEyeOff, FiPlus, FiCheck, FiX, FiLock, FiBox, FiInbox, FiAlertCircle, FiImage, FiGrid, FiSettings } from 'react-icons/fi';
import { usePageLoading } from '../../hooks/usePageLoading';
import { SkeletonTableRow } from '../../components/Skeleton';
import { dataApi } from '../../lib/api';
import { useAuth } from '../../contexts/ContextAuthentification';
import { useSlideInUp } from '../../lib/animations';
import ModalModificationProduit from './ModalModificationProduit';
import styles from '../../styles/Produits/GestionProduits.module.css';

export default function GestionProduits() {
  const { user } = useAuth();
  const { isLoading, startLoading, stopLoading } = usePageLoading();
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [regions, setRegions] = useState({});
  const [cultures, setCultures] = useState({});
  const [success, setSuccess] = useState('');
  const containerRef = useSlideInUp(0.8, 0.2);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Charger les produits de l'agriculteur
  useEffect(() => {
    fetchProducts();
    fetchMetadata();
  }, []);

  const fetchProducts = async () => {
    try {
      startLoading();
      const data = await dataApi.getMyProducts(filterStatus);
      setProducts(data);
      setError('');
    } catch (err) {
      console.error('Erreur fetch produits:', err);
      setError(err.message || 'Erreur lors du chargement des produits');
    } finally {
      stopLoading();
    }
  };

  const fetchMetadata = async () => {
    try {
      const regionsData = await dataApi.fetchRegions();
      const culturesData = await dataApi.fetchCultures();
      setRegions(Object.fromEntries(regionsData.map((r) => [r.id, r])));
      setCultures(Object.fromEntries(culturesData.map((c) => [c.id, c])));
    } catch (err) {
      console.error('Erreur fetch metadata:', err);
    }
  };

  const handleFilterChange = async (status) => {
    setFilterStatus(status);
    try {
      startLoading();
      const data = await dataApi.getMyProducts(status);
      setProducts(data);
    } catch (err) {
      console.error('Erreur lors du filtrage:', err);
      setError(err.message);
    } finally {
      stopLoading();
    }
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleDeleteClick = async (productId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        await dataApi.deleteProduct(productId);
        setProducts(products.filter((p) => p.id !== productId));
        alert('Produit supprimé avec succès');
      } catch (err) {
        console.error('Erreur suppression:', err);
        alert(`Erreur: ${err.message}`);
      }
    }
  };

  const handleToggleAvailability = async (product) => {
    try {
      await dataApi.toggleProductAvailability(product.id);
      setProducts(
        products.map((p) =>
          p.id === product.id ? { ...p, is_available: !p.is_available } : p
        )
      );
    } catch (err) {
      console.error('Erreur toggle:', err);
      alert(`Erreur: ${err.message}`);
    }
  };

  const handleSaveProduct = async (updatedData) => {
    try {
      await dataApi.updateProduct(editingProduct.id, updatedData);
      setProducts(
        products.map((p) =>
          p.id === editingProduct.id ? { ...p, ...updatedData } : p
        )
      );
      setShowModal(false);
      setEditingProduct(null);
      setSuccess('Produit mis à jour avec succès');
    } catch (err) {
      console.error('Erreur mise à jour:', err);
      alert(`Erreur: ${err.message}`);
    }
  };

  if (!user || user.role !== 'farmer') {
    return (
      <div className={clsx(styles['empty-state-wrapper'])}>
        <div className={clsx(styles['empty-state'])}>
          <FiLock style={{ fontSize: '3rem', color: 'var(--mg-primary)', marginBottom: '1rem' }} />
          <p style={{ color: 'var(--mg-text-muted)', fontSize: '1.1rem' }}>Accès réservé aux agriculteurs</p>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(styles['gestion-produits'])} ref={containerRef}>
      {/* Success Overlay */}
      {success && (
        <div className={clsx(styles['cart-success-overlay'])} onClick={() => setSuccess('')}>
          <div className={clsx(styles['cart-success-container'])}>
            <div className={clsx(styles['success-icon'])}>
              <FiCheck />
            </div>
            <h3 className={clsx(styles['success-title'])}>Succès!</h3>
            <p className={clsx(styles['success-message'])}>{success}</p>
            <div className={clsx(styles['success-progress'])}></div>
          </div>
        </div>
      )}
      
      <div className={clsx(styles['page-header'])}>
        <h1 className={clsx(styles['page-title'])}>
          <FiBox style={{ marginRight: '12px' }} />
          Gestion des Produits
        </h1>
        <p className={clsx(styles['page-subtitle'])}>{products.length} produit{products.length !== 1 ? 's' : ''}</p>
      </div>

      {error && (
        <div className={clsx(styles['error-banner'])}>
          <FiAlertCircle />
          {error}
        </div>
      )}

      {/* Filtres et Boutons */}
      <div className={clsx(styles['gestion-controls'])}>
        <div className={clsx(styles['filter-group'])}>
          <button
            className={clsx(styles['filter-btn'], { [styles['active']]: filterStatus === 'all' })}
            onClick={() => handleFilterChange('all')}
          >
            Tous ({products.length})
          </button>
          <button
            className={clsx(styles['filter-btn'], { [styles['active']]: filterStatus === 'available' })}
            onClick={() => handleFilterChange('available')}
          >
            <FiCheck size={16} /> Disponibles
          </button>
          <button
            className={clsx(styles['filter-btn'], { [styles['active']]: filterStatus === 'unavailable' })}
            onClick={() => handleFilterChange('unavailable')}
          >
            <FiX size={16} /> Indisponibles
          </button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className={clsx(styles['empty-state-wrapper'])}>
          <div className={clsx(styles['empty-state'])}>
            <FiInbox style={{ fontSize: '3rem', color: 'var(--mg-primary)', marginBottom: '1rem' }} />
            <p style={{ color: 'var(--mg-text-muted)', fontSize: '1.1rem' }}>
              {filterStatus === 'all'
                ? 'Vous n\'avez pas encore de produits'
                : `Aucun produit ${filterStatus === 'available' ? 'disponible' : 'indisponible'}`}
            </p>
          </div>
        </div>
      ) : (
        <div className={clsx(styles['products-table-wrapper'])}>
          <table className={clsx(styles['products-table'])}>
            <thead>
              <tr>
                <th>Image</th>
                <th>Produit</th>
                <th>Quantité</th>
                <th>Prix</th>
                <th>Culture</th>
                <th>Région</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className={clsx(styles['product-row'], { [styles['unavailable']]: !product.is_available })}>
                  <td className={clsx(styles['col-image'])}>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.title} className={clsx(styles['product-thumb'])} />
                    ) : (
                      <div className={clsx(styles['product-thumb-placeholder'])}>
                        <FiImage />
                      </div>
                    )}
                  </td>
                  <td className={clsx(styles['col-title'])}>
                    <div className={clsx(styles['product-info-col'])}>
                      <p className={clsx(styles['product-name'])}>{product.title}</p>
                      {product.description && <p className={clsx(styles['product-desc'])}>{product.description.substring(0, 50)}...</p>}
                    </div>
                  </td>
                  <td className={clsx(styles['col-quantity'])}>
                    <span className={clsx(styles['quantity-badge'], { [styles['low']]: product.quantity <= 5 })}>
                      {product.quantity} {product.unit}
                    </span>
                  </td>
                  <td className={clsx(styles['col-price'])}>
                    <span className={clsx(styles['price-value'])}>{Number(product.price).toLocaleString('fr-FR')} Ar</span>
                  </td>
                  <td className={clsx(styles['col-culture'])}>
                    {cultures[product.culture_id]?.name || '-'}
                  </td>
                  <td className={clsx(styles['col-region'])}>
                    {regions[product.region_id]?.name || '-'}
                  </td>
                  <td className={clsx(styles['col-status'])}>
                    <span className={clsx(styles['status-badge'], { [styles['available']]: product.is_available, [styles['unavailable']]: !product.is_available })}>
                      {product.is_available ? (
                        <>
                          <FiCheck size={14} />
                          Disponible
                        </>
                      ) : (
                        <>
                          <FiX size={14} />
                          Indisponible
                        </>
                      )}
                    </span>
                  </td>
                  <td className={clsx(styles['col-actions'])}>
                    <div className={clsx(styles['action-buttons'])}>
                      <button
                        className={clsx(styles['action-btn'], styles['toggle-btn'])}
                        onClick={() => handleToggleAvailability(product)}
                        title={product.is_available ? 'Désactiver' : 'Activer'}
                      >
                        {product.is_available ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                      <button
                        className={clsx(styles['action-btn'], styles['edit-btn'])}
                        onClick={() => handleEditClick(product)}
                        title="Modifier"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        className={clsx(styles['action-btn'], styles['delete-btn'])}
                        onClick={() => handleDeleteClick(product.id)}
                        title="Supprimer"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && editingProduct && (
        <ModalModificationProduit
          product={editingProduct}
          regions={regions}
          cultures={cultures}
          onSave={handleSaveProduct}
          onClose={() => {
            setShowModal(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}
