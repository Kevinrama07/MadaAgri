import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card/Card';
import { Badge } from '../../components/ui/Badge/Badge';
import { Button } from '../../components/ui/Button/Button';
import { dataApi } from '../../lib/api';
import { useAuth } from '../../contexts/ContextAuthentification';
import styles from './ProductDetailPage.module.css';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const allProducts = await dataApi.fetchProducts();
        const found = allProducts.find((p) => p.id === id);
        if (!found) {
          if (!cancelled) {
            setError('Produit non trouvé');
          }
          return;
        }
        if (!cancelled) setProduct(found);
      } catch (err) {
        console.error('[ProductDetail] Failed to load product:', err);
        if (!cancelled) setError(err.message || 'Erreur lors du chargement');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <p>Chargement du produit...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.errorState}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <h3>{error || 'Produit non trouvé'}</h3>
              <Link to="/marketplace" className={styles.backLink}>
                Retour au marketplace
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const images = product.image_url ? [product.image_url] : [];
  const stockStatus = product.quantity === 0 ? 'Rupture de stock' : product.quantity <= 10 ? 'Stock faible' : 'En stock';

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.container}>
          <nav className={styles.breadcrumb}>
            <Link to="/marketplace">Marketplace</Link>
            <span>/</span>
            {product.culture_name && (
              <>
                <span>{product.culture_name}</span>
                <span>/</span>
              </>
            )}
            <span className={styles.current}>{product.title}</span>
          </nav>

          <div className={styles.content}>
            <div className={styles.gallery}>
              {images.length > 0 ? (
                <>
                  <div className={styles.mainImage}>
                    <img src={images[activeImage]} alt={product.title} />
                  </div>
                  {images.length > 1 && (
                    <div className={styles.thumbnails}>
                      {images.map((img, i) => (
                        <button key={i} className={`${styles.thumb} ${activeImage === i ? styles.active : ''}`} onClick={() => setActiveImage(i)}>
                          <img src={img} alt={`Vue ${i + 1}`} />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.mainImagePlaceholder}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="80" height="80">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <p>Aucune image disponible</p>
                </div>
              )}
            </div>

            <div className={styles.info}>
              {product.culture_name && (
                <Badge variant="primary" className={styles.categoryBadge}>{product.culture_name}</Badge>
              )}
              <h1 className={styles.productName}>{product.title}</h1>

              <div className={styles.stockStatus}>
                <Badge
                  variant={product.quantity === 0 ? 'error' : product.quantity <= 10 ? 'warning' : 'success'}
                  size="sm"
                  dot
                >
                  {stockStatus}
                </Badge>
                {product.quantity > 0 && (
                  <span className={styles.stockQty}>({product.quantity} {product.unit || 'kg'} disponible{product.quantity > 1 ? 's' : ''})</span>
                )}
              </div>

              <div className={styles.priceBlock}>
                <span className={styles.price}>{product.price.toLocaleString()} Ar</span>
                <span className={styles.priceUnit}>/{product.unit || 'kg'}</span>
              </div>

              {product.description && (
                <p className={styles.description}>{product.description}</p>
              )}

              <div className={styles.specs}>
                {product.region_name && (
                  <div className={styles.spec}>
                    <span className={styles.specLabel}>Région</span>
                    <span className={styles.specValue}>{product.region_name}</span>
                  </div>
                )}
                <div className={styles.spec}>
                  <span className={styles.specLabel}>Unité</span>
                  <span className={styles.specValue}>{product.unit || 'kg'}</span>
                </div>
                <div className={styles.spec}>
                  <span className={styles.specLabel}>Stock</span>
                  <span className={styles.specValue}>{product.quantity} {product.unit || 'kg'}</span>
                </div>
                <div className={styles.spec}>
                  <span className={styles.specLabel}>Ajouté le</span>
                  <span className={styles.specValue}>{new Date(product.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>

              {product.quantity > 0 && (
                <div className={styles.quantity}>
                  <label className={styles.quantityLabel}>Quantité ({product.unit || 'kg'})</label>
                  <div className={styles.quantityControl}>
                    <button className={styles.qtyBtn} onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                    <span className={styles.qtyValue}>{quantity}</span>
                    <button className={styles.qtyBtn} onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}>+</button>
                  </div>
                  <span className={styles.totalPrice}>Total: {(product.price * quantity).toLocaleString()} Ar</span>
                </div>
              )}

              <div className={styles.actions}>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={product.quantity === 0}
                  onClick={() => {
                    if (product.farmer_id === currentUser?.id) {
                      navigate('/profile');
                    } else {
                      navigate(`/profile/${product.farmer_id}`);
                    }
                  }}
                >
                  Contacter le vendeur
                </Button>
                {product.quantity > 0 && (
                  <Button
                    variant="outline"
                    size="lg"
                    fullWidth
                    onClick={async () => {
                      try {
                        await dataApi.addToCart(product.id, quantity);
                        alert('Produit ajouté au panier');
                      } catch (err) {
                        alert(err.message || 'Erreur lors de l\'ajout au panier');
                      }
                    }}
                  >
                    Ajouter au panier
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Card className={styles.sellerCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Informations du vendeur</h2>
            </div>
            <div className={styles.sellerContent}>
              <div className={styles.sellerInfo}>
                <div className={styles.sellerAvatar}>
                  {product.farmer_image ? (
                    <img src={product.farmer_image} alt={product.farmer_name} />
                  ) : (
                    (product.farmer_name || '?').charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className={styles.sellerNameRow}>
                    <h3 className={styles.sellerName}>{product.farmer_name || 'Vendeur'}</h3>
                  </div>
                  {product.region_name && (
                    <p className={styles.sellerLocation}>{product.region_name}, Madagascar</p>
                  )}
                  {product.farmer_bio && (
                    <p className={styles.sellerBio}>{product.farmer_bio}</p>
                  )}
                </div>
              </div>
              <div className={styles.sellerStats}>
                <Link to={`/profile/${product.farmer_id}`} className={styles.sellerProfileLink}>
                  Voir le profil
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
