import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import clsx from 'clsx';
import { FiCloud, FiSun, FiCalendar, FiBarChart2, FiInfo, FiGlobe, FiBox } from 'react-icons/fi';
import { GiSeedling } from 'react-icons/gi';
import { usePageLoading } from '../../hooks/usePageLoading';
import { SkeletonCard, SkeletonTitle, SkeletonBox } from '../../components/Skeleton';
import { dataApi } from '../../lib/api';
import { useSlideInUp } from '../../lib/animations';
import RegionSelect from '../../components/RegionSelect';
import ErrorBanner from '../../components/ErrorBanner';
import CultureFilters from '../../components/CultureFilters';
import CultureSearchBar from '../../components/CultureSearchBar';
import CultureDetailModal from '../../components/CultureDetailModal';
import { 
  getSuitabilityColor, 
  getSuitabilityLabel, 
  KNN_NEIGHBORS,
  filterCulturesByName,
  sortCultures,
  getCultureCategory
} from '../../utils/cultureUtils';
import styles from '../../styles/Cultures/AnalyseCulture.module.css';

export default function AnalyseCulture() {
  const { isLoading, startLoading, stopLoading, hasShownSkeletons, markSkeletonsShown } = usePageLoading();
  
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [suitableCultures, setSuitableCultures] = useState([]);
  const [error, setError] = useState(null);
  const [loadingCultures, setLoadingCultures] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('score');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedCulture, setSelectedCulture] = useState(null);
  const containerRef = useSlideInUp(0.8, 0.2);
  
  // Utiliser useRef pour éviter les re-créations de fonction
  const abortControllerRef = useRef(null);
  
  useEffect(() => {
    if (isLoading && !hasShownSkeletons) {
      markSkeletonsShown();
    }
  }, [isLoading, hasShownSkeletons, markSkeletonsShown]);

  useEffect(() => {
    async function fetchRegions() {
      startLoading();
      setError(null);
      try {
        const regionsData = await dataApi.fetchRegions();
        setRegions(regionsData);
        if (regionsData.length > 0) {
          setSelectedRegion(regionsData[0]);
        }
      } catch (err) {
        console.error('Erreur fetch regions', err);
        setError('Impossible de charger les régions. Veuillez réessayer.');
      } finally {
        stopLoading();
      }
    }
    fetchRegions();
  }, [startLoading, stopLoading]);

  // Utiliser useEffect avec selectedRegion.id comme dépendance directe
  useEffect(() => {
    if (!selectedRegion?.id) {
      setSuitableCultures([]);
      return;
    }

    // Annuler la requête précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    async function fetchCultures() {
      setLoadingCultures(true);
      setError(null);
      try {
        const culturesData = await dataApi.fetchKnnCultures(selectedRegion.id, KNN_NEIGHBORS);
        console.log('[AnalyseCulture] fetchKnnCultures result:', culturesData);
        if (!abortControllerRef.current?.signal.aborted) {
          setSuitableCultures(culturesData);
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        
        console.error('Erreur fetch suitable cultures (k-NN)', err);
        try {
          const fallback = await dataApi.fetchRegionCultures(selectedRegion.id);
          console.log('[AnalyseCulture] fetchRegionCultures fallback result:', fallback);
          if (!abortControllerRef.current?.signal.aborted) {
            setSuitableCultures(fallback);
          }
        } catch (e2) {
          if (e2.name === 'AbortError') return;
          
          console.error('Fallback region_cultures failed', e2);
          if (!abortControllerRef.current?.signal.aborted) {
            setError('Impossible de charger les cultures pour cette région.');
            setSuitableCultures([]);
          }
        }
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setLoadingCultures(false);
        }
      }
    }

    fetchCultures();

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedRegion?.id]);

  // Filtrer et trier les cultures
  const filteredAndSortedCultures = useMemo(() => {
    console.log('[AnalyseCulture] suitableCultures:', suitableCultures);
    console.log('[AnalyseCulture] suitableCultures length:', suitableCultures.length);
    
    let filtered = [...suitableCultures];
    
    // Filtrer par recherche
    if (searchTerm) {
      filtered = filterCulturesByName(filtered, searchTerm);
    }
    
    // Filtrer par catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => {
        const cultureName = item.culture?.name || item.culture_name || '';
        if (!cultureName) return false; // Exclure les cultures sans nom
        const category = getCultureCategory(cultureName);
        return category === selectedCategory;
      });
    }
    
    // Trier
    filtered = sortCultures(filtered, sortBy, sortOrder);
    
    console.log('[AnalyseCulture] filtered cultures:', filtered);
    console.log('[AnalyseCulture] filtered length:', filtered.length);
    
    return filtered;
  }, [suitableCultures, searchTerm, selectedCategory, sortBy, sortOrder]);

  const handleSortChange = useCallback((field, order) => {
    setSortBy(field);
    setSortOrder(order);
  }, []);

  const handleCultureClick = useCallback((culture) => {
    setSelectedCulture(culture);
  }, []);

  const handleRetryRegions = useCallback(() => {
    window.location.reload();
  }, []);

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

      {error && (
        <ErrorBanner 
          message={error} 
          onClose={() => setError(null)}
          type="error"
        />
      )}

      {regions.length === 0 && !isLoading && (
        <div className={clsx(styles['empty-state'])}>
          <FiInfo />
          <p>Aucune région disponible</p>
          <p className={clsx(styles['empty-hint'])}>Veuillez ajouter des régions pour commencer l'analyse.</p>
          <button className={clsx(styles['retry-button'])} onClick={handleRetryRegions}>
            Réessayer
          </button>
        </div>
      )}

      <div className={clsx(styles['regions-selector'])}>
        <h3 className={clsx(styles['selector-title'])}>
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
            <CultureSearchBar 
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Rechercher une culture..."
            />

            <CultureFilters
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              sortBy={sortBy}
              onSortChange={handleSortChange}
              culturesCount={suitableCultures.length}
            />

            <div className={clsx(styles['section-header'])}>
              <h4 className={clsx(styles['section-title'])}>
                <GiSeedling /> Cultures les Plus Adaptées
              </h4>
              <span className={clsx(styles['cultures-count'])}>{filteredAndSortedCultures.length} cultures</span>
            </div>

            {loadingCultures ? (
              <div className={clsx(styles['loading-cultures'])}>
                <SkeletonBox width="100%" height="200px" />
              </div>
            ) : filteredAndSortedCultures.length === 0 ? (
              <div className={clsx(styles['empty-state'])}>
                <FiInfo />
                {searchTerm || selectedCategory !== 'all' ? (
                  <>
                    <p>Aucune culture ne correspond à vos critères</p>
                    <p className={clsx(styles['empty-hint'])}>Essayez de modifier vos filtres ou votre recherche.</p>
                    <p style={{ fontSize: '0.8rem', marginTop: '10px', color: '#666' }}>Debug: {suitableCultures.length} cultures chargées, {filteredAndSortedCultures.length} après filtrage</p>
                  </>
                ) : (
                  <>
                    <p>Aucune culture trouvée pour cette région</p>
                    <p className={clsx(styles['empty-hint'])}>Essayez de sélectionner une autre région pour voir les cultures adaptées.</p>
                    <p style={{ fontSize: '0.8rem', marginTop: '10px', color: '#666' }}>Debug: {suitableCultures.length} cultures chargées</p>
                  </>
                )}
              </div>
            ) : (
              <div className={clsx(styles['cultures-list'])}>
                {console.log('[Render] Rendering', filteredAndSortedCultures.length, 'cultures')}
                {filteredAndSortedCultures.map((item, index) => {
                  console.log('[Render] Culture item:', item);
                  console.log('[Render] Culture ID:', item.culture?.id);
                  console.log('[Render] Culture name:', item.culture?.name);
                  
                  // Générer une clé unique
                  const uniqueKey = item.culture?.id || `culture-${index}-${item.culture?.name || 'unknown'}`;
                  
                  return (
                  <div
                    key={uniqueKey}
                    className={clsx(styles['culture-card'])}
                    style={{ '--index': index, animationDelay: `${index * 0.08}s` }}
                    onClick={() => handleCultureClick(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCultureClick(item);
                      }
                    }}
                  >
                    <div className={clsx(styles['culture-header'])}>
                      <div>
                        <h5 className={clsx(styles['culture-name'])}>{item.culture?.name || 'Nom inconnu'}</h5>
                        <p className={clsx(styles['culture-description'])}>{item.culture?.description || 'Pas de description'}</p>
                      </div>
                      <div className={clsx(styles['suitability-badge'])} style={{ backgroundColor: getSuitabilityColor(item.suitability_score || 0) }}>
                        {item.suitability_score || 0}%
                      </div>
                    </div>

                    <div className={clsx(styles['progress-bar'])}>
                      <div
                        className={clsx(styles['progress-fill'])}
                        style={{
                          width: `${item.suitability_score || 0}%`,
                          backgroundColor: getSuitabilityColor(item.suitability_score || 0)
                        }}
                      ></div>
                    </div>
                    <p className={clsx(styles['suitability-label'])}>{getSuitabilityLabel(item.suitability_score || 0)}</p>

                    <div className={clsx(styles['culture-details'])}>
                      {item.culture?.ideal_soil && (
                        <div className={clsx(styles['detail-item'])}>
                          <span className={clsx(styles['detail-label'])}>
                            <FiGlobe /> Sol Idéal
                          </span>
                          <span className={clsx(styles['detail-value'])}>{item.culture.ideal_soil}</span>
                        </div>
                      )}
                      {item.culture?.ideal_climate && (
                        <div className={clsx(styles['detail-item'])}>
                          <span className={clsx(styles['detail-label'])}>
                            <FiSun /> Climat Idéal
                          </span>
                          <span className={clsx(styles['detail-value'])}>{item.culture.ideal_climate}</span>
                        </div>
                      )}
                      {item.culture?.growing_period_days && (
                        <div className={clsx(styles['detail-item'])}>
                          <span className={clsx(styles['detail-label'])}>
                            <FiCalendar /> Croissance
                          </span>
                          <span className={clsx(styles['detail-value'])}>{item.culture.growing_period_days} jours</span>
                        </div>
                      )}
                      {item.culture?.yield_potential && (
                        <div className={clsx(styles['detail-item'])}>
                          <span className={clsx(styles['detail-label'])}>
                            <FiBarChart2 /> Rendement
                          </span>
                          <span className={clsx(styles['detail-value'])}>{item.culture.yield_potential}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de détails */}
      {selectedCulture && (
        <CultureDetailModal
          culture={selectedCulture}
          onClose={() => setSelectedCulture(null)}
        />
      )}
    </div>
  );
}
