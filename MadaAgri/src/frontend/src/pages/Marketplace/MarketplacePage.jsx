import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card/Card';
import { Badge } from '../../components/ui/Badge/Badge';
import { dataApi } from '../../lib/api';
import styles from './MarketplacePage.module.css';

export default function MarketplacePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('grid');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [productsData, culturesData] = await Promise.all([
          dataApi.fetchProducts().catch((err) => {
            console.error('[Marketplace] Failed to fetch products:', err);
            return [];
          }),
          dataApi.fetchCultures().catch((err) => {
            console.error('[Marketplace] Failed to fetch cultures:', err);
            return [];
          }),
        ]);

        if (!cancelled) {
          setProducts(productsData);
          const cats = culturesData.map((c) => ({
            id: String(c.id),
            label: c.name,
            count: productsData.filter((p) => p.culture_id === c.id).length,
          }));
          setCategories([{ id: 'all', label: 'Tous les produits', count: productsData.length }, ...cats]);
        }
      } catch (err) {
        console.error('[Marketplace] Failed to load:', err);
        if (!cancelled) setError(err.message || 'Erreur lors du chargement');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = products
    .filter((p) => activeCategory === 'all' || String(p.culture_id) === activeCategory)
    .filter((p) => {
      const q = searchQuery.toLowerCase();
      return (p.title || '').toLowerCase().includes(q) || (p.farmer_name || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'name') return (a.title || '').localeCompare(b.title || '');
      return new Date(b.created_at) - new Date(a.created_at);
    });

  if (loading) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <p>Chargement des produits...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
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
              <h3>Erreur de chargement</h3>
              <p>{error}</p>
              <button className={styles.retryBtn} onClick={() => window.location.reload()}>Réessayer</button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Marketplace</h1>
              <p className={styles.subtitle}>Découvrez les meilleurs produits agricoles de Madagascar</p>
            </div>
          </div>

          <div className={styles.toolbar}>
            <div className={styles.searchBar}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher des produits, vendeurs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.toolbarRight}>
              <select
                className={styles.sortSelect}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="recent">Plus récents</option>
                <option value="name">Nom A-Z</option>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
              </select>

              <div className={styles.viewToggle}>
                <button
                  className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`}
                  onClick={() => setViewMode('grid')}
                  aria-label="Vue grille"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                  </svg>
                </button>
                <button
                  className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`}
                  onClick={() => setViewMode('list')}
                  aria-label="Vue liste"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className={styles.content}>
            <aside className={styles.sidebar}>
              <h3 className={styles.sidebarTitle}>Catégories</h3>
              <div className={styles.categoryList}>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    className={`${styles.catBtn} ${activeCategory === cat.id ? styles.catBtnActive : ''}`}
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    <span className={styles.catLabel}>{cat.label}</span>
                    <span className={styles.catCount}>{cat.count}</span>
                  </button>
                ))}
              </div>
            </aside>

            <div className={styles.results}>
              <span className={styles.resultsCount}>{filtered.length} produit{filtered.length !== 1 ? 's' : ''}</span>

              {filtered.length === 0 ? (
                <div className={styles.emptyState}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                  <h3>Aucun produit trouvé</h3>
                  <p>Essayez de modifier votre recherche ou vos filtres.</p>
                  <button className={styles.emptyBtn} onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}>
                    Réinitialiser les filtres
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className={styles.grid}>
                  {filtered.map((product) => (
                    <Link to={`/marketplace/${product.id}`} key={product.id} className={styles.cardLink}>
                      <Card hover className={styles.productCard}>
                        <div className={styles.imageWrapper}>
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.title} className={styles.image} loading="lazy" />
                          ) : (
                            <div className={styles.imagePlaceholder}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                              </svg>
                            </div>
                          )}
                          {!product.is_available && (
                            <Badge variant="warning" className={styles.stockBadge}>Rupture</Badge>
                          )}
                          {product.quantity > 0 && product.quantity <= 10 && (
                            <Badge variant="warning" className={styles.stockBadge}>Stock faible</Badge>
                          )}
                        </div>
                        <div className={styles.cardBody}>
                          <div className={styles.cardTop}>
                            <h3 className={styles.productName}>{product.title}</h3>
                          </div>
                          {product.culture_name && (
                            <Badge variant="secondary" className={styles.cultureBadge}>{product.culture_name}</Badge>
                          )}
                          <div className={styles.price}>
                            <span className={styles.priceValue}>{product.price.toLocaleString()} Ar</span>
                            <span className={styles.priceUnit}>/{product.unit || 'kg'}</span>
                          </div>
                          <div className={styles.seller}>
                            <div className={styles.sellerAvatar}>
                              {product.farmer_image ? (
                                <img src={product.farmer_image} alt={product.farmer_name} />
                              ) : (
                                (product.farmer_name || '?').charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <span className={styles.sellerName}>{product.farmer_name || 'Vendeur'}</span>
                              <span className={styles.sellerLocation}>{product.region_name || 'Madagascar'}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className={styles.list}>
                  {filtered.map((product) => (
                    <Link to={`/marketplace/${product.id}`} key={product.id} className={styles.cardLink}>
                      <Card hover className={styles.listCard}>
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.title} className={styles.listImage} loading="lazy" />
                        ) : (
                          <div className={styles.listImagePlaceholder}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <polyline points="21 15 16 10 5 21" />
                            </svg>
                          </div>
                        )}
                        <div className={styles.listBody}>
                          <div className={styles.listTop}>
                            <div>
                              <h3 className={styles.productName}>{product.title}</h3>
                              <div className={styles.seller}>
                                <div className={styles.sellerAvatar}>
                                  {product.farmer_image ? (
                                    <img src={product.farmer_image} alt={product.farmer_name} />
                                  ) : (
                                    (product.farmer_name || '?').charAt(0).toUpperCase()
                                  )}
                                </div>
                                <span className={styles.sellerName}>{product.farmer_name || 'Vendeur'} · {product.region_name || 'Madagascar'}</span>
                              </div>
                            </div>
                            <div className={styles.listRight}>
                              <div className={styles.price}>
                                <span className={styles.priceValue}>{product.price.toLocaleString()} Ar</span>
                                <span className={styles.priceUnit}>/{product.unit || 'kg'}</span>
                              </div>
                              {product.culture_name && (
                                <Badge variant="secondary" size="sm">{product.culture_name}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
