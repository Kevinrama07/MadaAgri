import { useEffect, useState } from 'react';
import { dataApi } from '../lib/api';
import { useSlideInUp } from '../lib/animations';
import '../styles/PageStyles.css';

export default function AnalyseCulture() {
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [suitableCultures, setSuitableCultures] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useSlideInUp(0.8, 0.2);

  useEffect(() => {
    async function fetchRegions() {
      setLoading(true);
      try {
        const regionsData = await dataApi.fetchRegions();
        setRegions(regionsData);
        if (regionsData.length > 0) {
          setSelectedRegion(regionsData[0]);
        }
      } catch (err) {
        console.error('Erreur fetch regions', err);
      } finally {
        setLoading(false);
      }
    }
    fetchRegions();
  }, []);

  useEffect(() => {
    if (selectedRegion) {
      fetchSuitableCultures(selectedRegion.id);
    }
  }, [selectedRegion]);

  async function fetchSuitableCultures(regionId) {
    try {
      const culturesData = await dataApi.fetchKnnCultures(regionId, 5);
      setSuitableCultures(culturesData);
    } catch (err) {
      console.error('Erreur fetch suitable cultures (k-NN)', err);
      try {
        const fallback = await dataApi.fetchRegionCultures(regionId);
        setSuitableCultures(fallback);
      } catch (e2) {
        console.error('Fallback region_cultures failed', e2);
      }
    }
  }

  function getSuitabilityColor(score) {
    if (score >= 90) return 'var(--mg-primary)';
    if (score >= 75) return '#ffd43b';
    return '#ff8c42';
  }

  function getSuitabilityLabel(score) {
    if (score >= 90) return 'Très adapté';
    if (score >= 75) return 'Adapté';
    return 'Moyennement adapté';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="analysis-page" ref={containerRef}>
      <div className="page-header">
        <h1 className="page-title">
          <i className="fas fa-leaf" style={{ marginRight: '12px' }}></i>
          Analyse des Cultures
        </h1>
        <p className="page-subtitle">Découvrez les cultures les plus adaptées à votre région</p>
      </div>

      <div className="regions-selector">
        <h3 style={{ color: 'var(--mg-text)', marginBottom: '12px', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase' }}>
          Sélectionner une région
        </h3>
        <div className="regions-grid">
          {regions.map((region) => (
            <button
              key={region.id}
              onClick={() => setSelectedRegion(region)}
              className={`region-btn ${selectedRegion?.id === region.id ? 'active' : ''}`}
            >
              <i className="fas fa-map-marker-alt"></i>
              {region.name}
            </button>
          ))}
        </div>
      </div>

      {selectedRegion && (
        <div className="analysis-content">
          <div className="region-details-card">
            <div className="region-header">
              <h3 className="region-name">{selectedRegion.name}</h3>
              <span className="region-badge">Analysé</span>
            </div>

            <div className="region-properties">
              <div className="property-item">
                  <span className="property-label">
                  <i className="fas fa-mountain"></i> TYPE DE SOL
                </span>
                <span className="property-value">
                  {selectedRegion.soil_type || 'Non spécifié'}
                </span>
              </div>
              <div className="property-item">
                <span className="property-label">
                  <i className="fas fa-cloud-sun"></i> CLIMAT
                </span>
                <span className="property-value">
                  {selectedRegion.climate || 'Non spécifié'}
                </span>
              </div>
            </div>
          </div>

          <div className="cultures-section">
            <div className="section-header">
              <h4 className="section-title">
                <i className="fas fa-seedling"></i> Cultures les Plus Adaptées
              </h4>
              <span className="cultures-count">{suitableCultures.length} cultures</span>
            </div>

            {suitableCultures.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-info-circle"></i>
                <p>Aucune culture trouvée pour cette région</p>
              </div>
            ) : (
              <div className="cultures-list">
                {suitableCultures.map((item, index) => (
                  <div
                    key={item.culture.id}
                    className="culture-card"
                    style={{ '--index': index, animationDelay: `${index * 0.08}s` }}
                  >
                    <div className="culture-header">
                      <div>
                        <h5 className="culture-name">{item.culture.name}</h5>
                        <p className="culture-description">{item.culture.description}</p>
                      </div>
                      <div className="suitability-badge" style={{ backgroundColor: getSuitabilityColor(item.suitability_score) }}>
                        {item.suitability_score}%
                      </div>
                    </div>

                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${item.suitability_score}%`,
                          backgroundColor: getSuitabilityColor(item.suitability_score)
                        }}
                      ></div>
                    </div>
                    <p className="suitability-label">{getSuitabilityLabel(item.suitability_score)}</p>

                    <div className="culture-details">
                      {item.culture.ideal_soil && (
                        <div className="detail-item">
                          <span className="detail-label">
                            <i className="fas fa-earth-africa"></i> Sol Idéal
                          </span>
                          <span className="detail-value">{item.culture.ideal_soil}</span>
                        </div>
                      )}
                      {item.culture.ideal_climate && (
                        <div className="detail-item">
                          <span className="detail-label">
                            <i className="fas fa-sun"></i> Climat Idéal
                          </span>
                          <span className="detail-value">{item.culture.ideal_climate}</span>
                        </div>
                      )}
                      {item.culture.growing_period_days && (
                        <div className="detail-item">
                          <span className="detail-label">
                            <i className="fas fa-calendar-days"></i> Croissance
                          </span>
                          <span className="detail-value">{item.culture.growing_period_days} jours</span>
                        </div>
                      )}
                      {item.culture.yield_potential && (
                        <div className="detail-item">
                          <span className="detail-label">
                            <i className="fas fa-chart-line"></i> Rendement
                          </span>
                          <span className="detail-value">{item.culture.yield_potential}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

