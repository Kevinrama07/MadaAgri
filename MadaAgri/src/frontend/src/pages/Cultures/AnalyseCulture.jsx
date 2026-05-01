import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { FiCloud, FiSun, FiCalendar, FiBarChart2, FiInfo, FiGlobe, FiBox } from 'react-icons/fi';
import { GiSeedling } from 'react-icons/gi';
import { usePageLoading } from '../../hooks/usePageLoading';
import { SkeletonCard, SkeletonTitle, SkeletonBox } from '../../components/Skeleton';
import { dataApi } from '../../lib/api';
import { useSlideInUp } from '../../lib/animations';
import RegionSelect from '../../components/RegionSelect';
import styles from '../../styles/Cultures/AnalyseCulture.module.css';

export default function AnalyseCulture() {
  const { isLoading, startLoading, stopLoading, hasShownSkeletons, markSkeletonsShown } = usePageLoading();
  
  useEffect(() => {
    if (isLoading && !hasShownSkeletons) {
      markSkeletonsShown();
    }
  }, [isLoading, hasShownSkeletons, markSkeletonsShown]);
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [suitableCultures, setSuitableCultures] = useState([]);
  const containerRef = useSlideInUp(0.8, 0.2);

  useEffect(() => {
    async function fetchRegions() {
      startLoading();
      try {
        const regionsData = await dataApi.fetchRegions();
        setRegions(regionsData);
        if (regionsData.length > 0) {
          setSelectedRegion(regionsData[0]);
        }
      } catch (err) {
        console.error('Erreur fetch regions', err);
      } finally {
        stopLoading();
      }
    }
    fetchRegions();
  }, []);

  useEffect(() => {
    if (selectedRegion) {
      console.log('[AnalyseCulture] selectedRegion changed:', selectedRegion);
      fetchSuitableCultures(selectedRegion.id);
    }
  }, [selectedRegion]);

  async function fetchSuitableCultures(regionId) {
    try {
      startLoading();
      const culturesData = await dataApi.fetchKnnCultures(regionId, 5);
      console.log('[AnalyseCulture] fetchKnnCultures result:', culturesData);
      setSuitableCultures(culturesData);
    } catch (err) {
      console.error('Erreur fetch suitable cultures (k-NN)', err);
      try {
        const fallback = await dataApi.fetchRegionCultures(regionId);
        console.log('[AnalyseCulture] fetchRegionCultures fallback result:', fallback);
        setSuitableCultures(fallback);
      } catch (e2) {
        console.error('Fallback region_cultures failed', e2);
      }
    } finally {
      stopLoading();
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

  if (isLoading && !hasShownSkeletons && regions.length === 0) {
    return (
      <div className={clsx(styles['skeleton-loader'])}>
        <SkeletonBox width="100%" height="400px" />
      </div>
    );
  }

  return (
    <div className={clsx(styles['analysis-page'])} ref={containerRef}>
      <div className={clsx(styles['page-header'])}>
        <h1 className={clsx(styles['page-title'])}>
          <FiBox style={{ marginRight: '12px' }} />
          Analyse des Cultures
        </h1>
        <p className={clsx(styles['page-subtitle'])}>Découvrez les cultures les plus adaptées à votre région</p>
      </div>

      <div className={clsx(styles['regions-selector'])}>
        <h3 style={{ color: 'var(--mg-text)', marginBottom: '16px', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Sélectionner une région
        </h3>
        <RegionSelect 
          regions={regions}
          selectedRegion={selectedRegion}
          onChange={setSelectedRegion}
        />
      </div>

      {selectedRegion && (
        <div className={clsx(styles['analysis-content'])}>
          <div className={clsx(styles['region-details-card'])}>
            <div className={clsx(styles['region-header'])}>
              <h3 className={clsx(styles['region-name'])}>{selectedRegion.name}</h3>
              <span className={clsx(styles['region-badge'])}>Analysé</span>
            </div>

            <div className={clsx(styles['region-properties'])}>
              <div className={clsx(styles['property-item'])}>
                  <span className={clsx(styles['property-label'])}>
                  <FiBox /> TYPE DE SOL
                </span>
                <span className={clsx(styles['property-value'])}>
                  {selectedRegion.soil_type || 'Non spécifié'}
                </span>
              </div>
              <div className={clsx(styles['property-item'])}>
                <span className={clsx(styles['property-label'])}>
                  <FiCloud /> CLIMAT
                </span>
                <span className={clsx(styles['property-value'])}>
                  {selectedRegion.climate || 'Non spécifié'}
                </span>
              </div>
            </div>
          </div>

          <div className={clsx(styles['cultures-section'])}>
            <div className={clsx(styles['section-header'])}>
              <h4 className={clsx(styles['section-title'])}>
                <GiSeedling /> Cultures les Plus Adaptées
              </h4>
              <span className={clsx(styles['cultures-count'])}>{suitableCultures.length} cultures</span>
            </div>

            {suitableCultures.length === 0 ? (
              <div className={clsx(styles['empty-state'])}>
                <FiInfo />
                <p>Aucune culture trouvée pour cette région</p>
              </div>
            ) : (
              <div className={clsx(styles['cultures-list'])}>
                {suitableCultures.map((item, index) => (
                  <div
                    key={item.culture.id}
                    className={clsx(styles['culture-card'])}
                    style={{ '--index': index, animationDelay: `${index * 0.08}s` }}
                  >
                    <div className={clsx(styles['culture-header'])}>
                      <div>
                        <h5 className={clsx(styles['culture-name'])}>{item.culture.name}</h5>
                        <p className={clsx(styles['culture-description'])}>{item.culture.description}</p>
                      </div>
                      <div className={clsx(styles['suitability-badge'])} style={{ backgroundColor: getSuitabilityColor(item.suitability_score) }}>
                        {item.suitability_score}%
                      </div>
                    </div>

                    <div className={clsx(styles['progress-bar'])}>
                      <div
                        className={clsx(styles['progress-fill'])}
                        style={{
                          width: `${item.suitability_score}%`,
                          backgroundColor: getSuitabilityColor(item.suitability_score)
                        }}
                      ></div>
                    </div>
                    <p className={clsx(styles['suitability-label'])}>{getSuitabilityLabel(item.suitability_score)}</p>

                    <div className={clsx(styles['culture-details'])}>
                      {item.culture.ideal_soil && (
                        <div className={clsx(styles['detail-item'])}>
                          <span className={clsx(styles['detail-label'])}>
                            <FiGlobe /> Sol Idéal
                          </span>
                          <span className={clsx(styles['detail-value'])}>{item.culture.ideal_soil}</span>
                        </div>
                      )}
                      {item.culture.ideal_climate && (
                        <div className={clsx(styles['detail-item'])}>
                          <span className={clsx(styles['detail-label'])}>
                            <FiSun /> Climat Idéal
                          </span>
                          <span className={clsx(styles['detail-value'])}>{item.culture.ideal_climate}</span>
                        </div>
                      )}
                      {item.culture.growing_period_days && (
                        <div className={clsx(styles['detail-item'])}>
                          <span className={clsx(styles['detail-label'])}>
                            <FiCalendar /> Croissance
                          </span>
                          <span className={clsx(styles['detail-value'])}>{item.culture.growing_period_days} jours</span>
                        </div>
                      )}
                      {item.culture.yield_potential && (
                        <div className={clsx(styles['detail-item'])}>
                          <span className={clsx(styles['detail-label'])}>
                            <FiBarChart2 /> Rendement
                          </span>
                          <span className={clsx(styles['detail-value'])}>{item.culture.yield_potential}</span>
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

