import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { FiShoppingCart, FiSearch, FiChevronDown, FiBox, FiImage, FiUser, FiAlertCircle } from 'react-icons/fi';
import { usePageLoading } from '../../hooks/usePageLoading';
import { SkeletonCard, SkeletonLine, SkeletonTitle } from '../../components/Skeleton';
import { dataApi } from '../../lib/api';
import { useSlideInUp } from '../../lib/animations';
import Cart from './Cart';
import ModalDetailsProduct from './ModalDetailsProduct';
import styles from '../../styles/Marketplace/Marketplace.module.css';

export default function Marketplace({ onUserProfileClick }) {
  const { isLoading, startLoading, stopLoading, hasShownSkeletons, markSkeletonsShown } = usePageLoading();
  
  useEffect(() => {
    if (isLoading && !hasShownSkeletons) {
      markSkeletonsShown();
    }
  }, [isLoading, hasShownSkeletons, markSkeletonsShown]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterCulture, setFilterCulture] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  
  const [regions, setRegions] = useState([]);
  const [cultures, setCultures] = useState([]);
  
  const containerRef = useSlideInUp(0.8, 0.2);

  useEffect(() => {
    fetchProducts();
    fetchMetadata();
    loadCartFromStorage();
  }, []);

  const fetchProducts = async () => {
    try {
      startLoading();
      const data = await dataApi.fetchProducts();
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
      setRegions(regionsData || []);
      setCultures(culturesData || []);
    } catch (err) {
      console.error('Erreur fetch metadata:', err);
    }
  };

  const loadCartFromStorage = () => {
    try {
      const stored = localStorage.getItem('madaagri_cart');
      if (stored) {
        setCartItems(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Erreur chargement panier:', err);
    }
  };

  const saveCartToStorage = (items) => {
    try {
      localStorage.setItem('madaagri_cart', JSON.stringify(items));
    } catch (err) {
      console.error('Erreur sauvegarde panier:', err);
    }
  };

  // Filtrer et trier les produits
  let filteredProducts = products.filter((product) => {
    if (!product.is_available || product.quantity <= 0) return false;
    if (searchQuery && !product.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterRegion && product.region_id !== parseInt(filterRegion)) return false;
    if (filterCulture && product.culture_id !== parseInt(filterCulture)) return false;
    return true;
  });

  // Tri
  filteredProducts = filteredProducts.sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'recent':
      default:
        return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setShowDetails(true);
  };

  const handleAddToCart = (product, quantity) => {
    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => item.id === product.id);
      let updated;
      
      if (existing) {
        updated = prevItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        updated = [
          ...prevItems,
          {
            id: product.id,
            title: product.title,
            price: product.price,
            image_url: product.image_url,
            farmer_id: product.farmer_id,
            farmer_name: product.farmer_name,
            quantity: quantity
          }
        ];
      }
      
      saveCartToStorage(updated);
      setShowDetails(false);
      return updated;
    });
  };

  const handleRemoveFromCart = (productId) => {
    setCartItems((prevItems) => {
      const updated = prevItems.filter((item) => item.id !== productId);
      saveCartToStorage(updated);
      return updated;
    });
  };

  const handleUpdateCartQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    
    setCartItems((prevItems) => {
      const updated = prevItems.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      );
      saveCartToStorage(updated);
      return updated;
    });
  };

  const handleClearCart = () => {
    setCartItems([]);
    saveCartToStorage([]);
  };

  return (
    <div className={clsx(styles['marketplace'])} ref={containerRef}>
      <div className={clsx(styles['marketplace-header'])}>
        <h1 className={clsx(styles['marketplace-title'])}>
          <FiShoppingCart size={32} />
          Marketplace
        </h1>
        <p className={clsx(styles['marketplace-subtitle'])}>Découvrez les produits frais des agriculteurs locaux</p>
      </div>

      {error && (
        <div className={clsx(styles['error-banner'])}>
          <FiAlertCircle />
          {error}
        </div>
      )}

      {/* Barre de recherche et filtres */}
      <div className={clsx(styles['marketplace-controls'])}>
        <div className={clsx(styles['search-bar'])}>
          <FiSearch size={20} />
          <input
            type="text"
            placeholder="Rechercher des produits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={clsx(styles['search-input'])}
          />
        </div>

        <div className={clsx(styles['filters-group'])}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={clsx(styles['filter-select'])}
          >
            <option value="recent">Plus récents</option>
            <option value="price-asc">Prix croissant</option>
            <option value="price-desc">Prix décroissant</option>
          </select>

          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className={clsx(styles['filter-select'])}
          >
            <option value="">Toutes les régions</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>

          <select
            value={filterCulture}
            onChange={(e) => setFilterCulture(e.target.value)}
            className={clsx(styles['filter-select'])}
          >
            <option value="">Toutes les cultures</option>
            {cultures.map((culture) => (
              <option key={culture.id} value={culture.id}>
                {culture.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grille de produits */}
      {isLoading ? (
        <div className={clsx(styles['products-grid'])}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={clsx(styles['product-card-marketplace'])}>
              <SkeletonCard />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className={clsx(styles['empty-state-wrapper'])}>
          <div className={clsx(styles['empty-state'])}>
            <FiBox style={{ fontSize: '3rem', marginBottom: '1rem' }} />
            <p>Aucun produit trouvé</p>
          </div>
        </div>
      ) : (
        <div className={clsx(styles['products-grid'])}>
          {filteredProducts.map((product) => {
            const region = regions.find((r) => r.id === product.region_id);
            return (
              <div key={product.id} className={clsx(styles['product-card-marketplace'])}>
                <div className={clsx(styles['product-image-container'])}>
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.title} className={clsx(styles['product-image'])} />
                  ) : (
                    <div className={clsx(styles['product-image-placeholder'])}>
                      <FiImage />
                    </div>
                  )}
                </div>

                <div className={clsx(styles['product-card-content'])}>
                  <div 
                    className={clsx(styles['product-farmer-info'])}
                    onClick={() => onUserProfileClick && onUserProfileClick(product.farmer_id)}
                    style={{ cursor: onUserProfileClick ? 'pointer' : 'default' }}
                  >
                    {product.farmer_image ? (
                      <img src={product.farmer_image} alt={product.farmer_name} className={clsx(styles['farmer-avatar'])} />
                    ) : (
                      <div className={clsx(styles['farmer-avatar-placeholder'])}>
                        <FiUser />
                      </div>
                    )}
                    <div className={clsx(styles['farmer-details'])}>
                      <p className={clsx(styles['farmer-name'])}>{product.farmer_name}</p>
                      {region && <p className={clsx(styles['farmer-region'])}>{region.name}</p>}
                    </div>
                  </div>

                  <h3 className={clsx(styles['product-title'])}>{product.title}</h3>

                  <div className={clsx(styles['product-price-section'])}>
                    <span className={clsx(styles['product-price'])}>{Number(product.price).toLocaleString('fr-FR')} Ar</span>
                    <span className={clsx(styles['product-stock'])}>{product.quantity} {product.unit} disponibles</span>
                  </div>

                  <button
                    className={clsx(styles['btn-details'])}
                    onClick={() => handleViewDetails(product)}
                  >
                    Voir détails
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bouton Panier flottant */}
      {cartItems.length > 0 && (
        <button
          className={clsx(styles['cart-floating-btn'])}
          onClick={() => setShowCart(!showCart)}
        >
          <img src="./src/images/panier.gif" alt="Panier" />
          <span className={clsx(styles['cart-badge'])}>{cartItems.length}</span>
        </button>
      )}

      {/* Modal Détails Produit */}
      {showDetails && selectedProduct && (
        <ModalDetailsProduct
          product={selectedProduct}
          regions={regions}
          cultures={cultures}
          onClose={() => setShowDetails(false)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Panier */}
      {showCart && (
        <Cart
          items={cartItems}
          onRemove={handleRemoveFromCart}
          onUpdateQuantity={handleUpdateCartQuantity}
          onClose={() => setShowCart(false)}
          onClear={handleClearCart}
        />
      )}
    </div>
  );
}
