import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { FiCheck, FiX, FiGrid, FiList, FiBox } from 'react-icons/fi';
import { usePageLoading } from '../../hooks/usePageLoading';
import { SkeletonCard } from '../../components/Skeleton';
import { dataApi } from '../../lib/api';
import { useSlideInUp } from '../../lib/animations';
import styles from './ListeProduits.module.css';

export default function ListeProduits({ products, loading: propLoading, onToggleAvailability, onDelete, onEdit, actionLoading }) {
  const { isLoading, hasShownSkeletons, markSkeletonsShown } = usePageLoading();
  const [regions, setRegions] = useState({});
  const [cultures, setCultures] = useState({});
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'price-asc', 'price-desc'
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterCulture, setFilterCulture] = useState('all');
  const [filterAvailability, setFilterAvailability] = useState('all'); // 'all', 'available', 'unavailable'
  const containerRef = useSlideInUp(0.8, 0.2);
  const loading = propLoading || (isLoading && !hasShownSkeletons);
  
  useEffect(() => {
    if (isLoading && !hasShownSkeletons) {
      markSkeletonsShown();
    }
  }, [isLoading, hasShownSkeletons, markSkeletonsShown]);

  useEffect(() => {
    async function fetchMetadata() {
      try {
        const regionsData = await dataApi.fetchRegions();
        const culturesData = await dataApi.fetchCultures();
        setRegions(Object.fromEntries(regionsData.map((r) => [r.id, r])));
        setCultures(Object.fromEntries(culturesData.map((c) => [c.id, c])));
      } catch (err) {
        console.error('Erreur fetch metadata', err);
      }
    }
    fetchMetadata();
  }, []);

  const filteredProducts = products
    ?.filter((product) => {
      if (filterRegion !== 'all' && product.region_id !== filterRegion) return false;
      if (filterCulture !== 'all' && product.culture_id !== filterCulture) return false;
      if (filterAvailability === 'available' && !product.is_available) return false;
      if (filterAvailability === 'unavailable' && product.is_available) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'recent':
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    }) || [];

  if (loading) {
    return (
      <div className={clsx(styles['loading-wrapper'])}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!products?.length) {
    return (
      <div className={clsx(styles['empty-state-wrapper'])}>
        <div className={clsx('mg-card', styles['empty-state'])}>
          <FiBox style={{ fontSize: '3rem', color: 'var(--mg-primary)', marginBottom: '1rem' }} />
          <p style={{ color: 'var(--mg-text-muted)', fontSize: '1.1rem' }}>Aucun produit disponible pour le moment</p>
        </div>
      </div>
    );
  }

  const uniqueRegions = [...new Set(products.map(p => p.region_id))].filter(Boolean);
  const uniqueCultures = [...new Set(products.map((p) => p.culture_id))].filter(Boolean);

  return (
    <div className={clsx(styles['products-page'])} ref={containerRef}>
      <div className={clsx(styles['page-header'])}>
        <h1 className={clsx(styles['page-title'])}>
          <FiBox style={{ marginRight: '12px' }} />
          Catalogue des Produits
        </h1>
        <p className={clsx(styles['page-subtitle'])}>{filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} disponible{filteredProducts.length > 1 ? 's' : ''}</p>
      </div>

      {/* Contrôles de filtrage et tri */}
      <div className={clsx(styles['products-controls'])}>
        <div className={clsx(styles['controls-left'])}>
          {/* Tri */}
          <div className={clsx(styles['control-group'])}>
            <label htmlFor="sort-select" className={clsx(styles['control-label'])}>Trier par</label>
            <select 
              id="sort-select"
              className={clsx(styles['control-select'])} 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="recent">Récents</option>
              <option value="price-asc">Prix : croissant</option>
              <option value="price-desc">Prix : décroissant</option>
            </select>
          </div>

          {/* Filtre Région */}
          <div className={clsx(styles['control-group'])}>
            <label htmlFor="region-filter" className={clsx(styles['control-label'])}>Région</label>
            <select 
              id="region-filter"
              className={clsx(styles['control-select'])} 
              value={filterRegion} 
              onChange={(e) => setFilterRegion(e.target.value)}
            >
              <option value="all">Toutes les régions</option>
              {uniqueRegions.map((id) => (
                <option key={id} value={id}>
                  {regions[id]?.name || `Région ${id}`}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Culture */}
          <div className={clsx(styles['control-group'])}>
            <label htmlFor="culture-filter" className={clsx(styles['control-label'])}>Culture</label>
            <select 
              id="culture-filter"
              className={clsx(styles['control-select'])} 
              value={filterCulture} 
              onChange={(e) => setFilterCulture(e.target.value)}
            >
              <option value="all">Toutes les cultures</option>
              {uniqueCultures.map((id) => (
                <option key={id} value={id}>
                  {cultures[id]?.name || `Culture ${id}`}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Disponibilité */}
          <div className={clsx(styles['control-group'])}>
            <label htmlFor="availability-filter" className={clsx(styles['control-label'])}>Disponibilité</label>
            <select 
              id="availability-filter"
              className={clsx(styles['control-select'])} 
              value={filterAvailability} 
              onChange={(e) => setFilterAvailability(e.target.value)}
            >
              <option value="all">Tous</option>
              <option value="available">Disponibles</option>
              <option value="unavailable">Indisponibles</option>
            </select>
          </div>
        </div>

        {/* Toggle Affichage */}
        <div className={clsx(styles['controls-right'])}>
          <button 
            className={clsx('view-toggle', { 'active': viewMode === 'grid' })}
            onClick={() => setViewMode('grid')}
            title="Vue grille"
          >
            <FiGrid size={18} />
          </button>
          <button 
            className={clsx('view-toggle', { 'active': viewMode === 'list' })}
            onClick={() => setViewMode('list')}
            title="Vue liste"
          >
            <FiList size={18} />
          </button>
        </div>
      </div>

      {/* Produits */}
      <div className={clsx(styles['products'], styles[`products-${viewMode}`])}>
        {filteredProducts.length === 0 ? (
          <div className={clsx(styles['no-results'])}>
            <p>Aucun produit ne correspond à vos critères de filtre</p>
          </div>
        ) : (
          filteredProducts.map((product, index) => {
            const region = product.region_id ? regions[product.region_id] : null;
            const culture = product.culture_id ? cultures[product.culture_id] : null;
            return (
              <div
                key={product.id}
                className={clsx(styles['product-card'], styles[viewMode])}
                style={{ '--index': index, animationDelay: `${index * 0.1}s` }}
              >
                <div className={clsx(styles['product-image-wrapper'])}>
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className={clsx(styles['product-image'])}
                    />
                  )}
                  <div className={clsx(styles['product-overlay'])}>
                    <span
                      className={clsx(styles['product-badge'])}
                      style={{
                        backgroundColor: product.is_available ? 'var(--mg-primary)' : '#ff6b6b'
                      }}
                    >
                      {product.is_available ? (
                        <>
                          <FiCheck style={{display: 'inline', marginRight: '4px'}} size={16} />
                          Disponible
                        </>
                      ) : (
                        <>
                          <FiX style={{display: 'inline', marginRight: '4px'}} size={16} />
                          Indisponible
                        </>
                      )}
                    </span>
                    <div className={clsx(styles['product-actions-overlay'])}>
                      <button
                        className={clsx(styles['action-btn'], styles['edit-btn'])}
                        onClick={(e) => { e.stopPropagation(); onEdit?.(product); }}
                        disabled={actionLoading === product.id}
                        title="Modifier"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        className={clsx(styles['action-btn'], styles['toggle-btn'])}
                        onClick={(e) => { e.stopPropagation(); onToggleAvailability?.(product); }}
                        disabled={actionLoading === product.id}
                        title={product.is_available ? 'Masquer du marketplace' : 'Afficher dans le marketplace'}
                      >
                        {product.is_available ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                      <button
                        className={clsx(styles['action-btn'], styles['delete-btn'])}
                        onClick={(e) => { e.stopPropagation(); onDelete?.(product); }}
                        disabled={actionLoading === product.id}
                        title="Supprimer"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div className={clsx(styles['product-content'])}>
                  <div className={clsx(styles['product-header'])}>
                    <h3 className={clsx(styles['product-title'])}>{product.title}</h3>
                    <div className={clsx(styles['product-price-badge'])}>
                      {Number(product.price).toLocaleString('fr-FR')} Ar
                    </div>
                  </div>

                  <div className={clsx(styles['product-info'])}>
                    {product.description && (
                    <p className={clsx(styles['product-description'])}>{product.description}</p>
                  )}
                    {culture && (
                      <div className={clsx(styles['info-item'])}>
                        <i className={clsx('fas', 'fa-leaf', styles['info-icon'])}></i>
                        <span className={clsx(styles['info-value'])}>{culture.name}</span>
                      </div>
                    )}
                    {region && (
                      <div className={clsx(styles['info-item'])}>
                        <i className={clsx('fas', 'fa-map-marker-alt', styles['info-icon'])}></i>
                        <span className={clsx(styles['info-value'])}>{region.name}</span>
                      </div>
                    )}
                    <div className={clsx(styles['info-item'])}>
                      <i className={clsx('fas', 'fa-weight', styles['info-icon'])}></i>
                      <span className={clsx(styles['info-value'])}>{product.quantity}{product.unit}</span>
                    </div>
                    <div className={clsx(styles['info-item'])}>
                      <i className={clsx('fas', 'fa-calendar', styles['info-icon'])}></i>
                      <span className={clsx(styles['info-value'])}>{new Date(product.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

