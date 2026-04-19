import { useEffect, useState } from 'react';
import { FiCheck, FiX } from 'react-icons/fi';
import { dataApi } from '../lib/api';
import { useSlideInUp } from '../lib/animations';
import '../styles/PageStyles.css';

export default function ListeProduits({ products, loading }) {
  const [regions, setRegions] = useState({});
  const [cultures, setCultures] = useState({});
  const containerRef = useSlideInUp(0.8, 0.2);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="loader"></div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="mg-card empty-state">
          <i className="fas fa-box-open" style={{ fontSize: '3rem', color: 'var(--mg-primary)', marginBottom: '1rem' }}></i>
          <p style={{ color: 'var(--mg-text-muted)', fontSize: '1.1rem' }}>Aucun produit disponible pour le moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="products-page" ref={containerRef}>
      <div className="page-header">
        <h1 className="page-title">
          <i className="fas fa-leaf" style={{ marginRight: '12px' }}></i>
          Catalogue des Produits
        </h1>
        <p className="page-subtitle">{products.length} produit{products.length > 1 ? 's' : ''} disponible{products.length > 1 ? 's' : ''}</p>
      </div>

      <div className="products-grid">
        {products.map((product, index) => {
          const region = product.region_id ? regions[product.region_id] : null;
          const culture = product.culture_id ? cultures[product.culture_id] : null;
          return (
            <div
              key={product.id}
              className="product-card"
              style={{ '--index': index, animationDelay: `${index * 0.1}s` }}
            >
              <div className="product-image-wrapper">
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.title}
                    className="product-image"
                  />
                )}
                <div className="product-overlay">
                  <span
                    className="product-badge"
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
                </div>
              </div>

              <div className="product-content">
                <h3 className="product-title">{product.title}</h3>

                {product.description && (
                  <p className="product-description">{product.description}</p>
                )}

                <div className="product-info">
                  {culture && (
                    <div className="info-item">
                      <span className="info-label">
                        <i className="fas fa-leaf"></i> Culture
                      </span>
                      <span className="info-value">{culture.name}</span>
                    </div>
                  )}
                  {region && (
                    <div className="info-item">
                      <span className="info-label">
                        <i className="fas fa-map-marker-alt"></i> Région
                      </span>
                      <span className="info-value">{region.name}</span>
                    </div>
                  )}
                  <div className="info-item">
                    <span className="info-label">
                      <i className="fas fa-balance-scale"></i> Quantité
                    </span>
                    <span className="info-value">{product.quantity} {product.unit}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">
                      <i className="fas fa-calendar"></i> Ajouté
                    </span>
                    <span className="info-value">{new Date(product.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                <div className="product-footer">
                  <div className="price-section">
                    <span className="price-label">Prix</span>
                    <span className="product-price">
                      {Number(product.price).toLocaleString('fr-FR')} Ar
                    </span>
                  </div>
                  <button className="product-btn">
                    <i className="fas fa-shopping-cart"></i> Commander
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

