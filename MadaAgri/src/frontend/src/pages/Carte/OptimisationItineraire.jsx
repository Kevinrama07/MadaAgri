import { useEffect, useState, useRef, useCallback } from 'react';
import clsx from 'clsx';
import { FiMapPin, FiNavigation, FiRepeat, FiClock } from 'react-icons/fi';
import { MdClear, MdSearch, MdRoute } from 'react-icons/md';
import { usePageLoading } from '../../hooks/usePageLoading';
import { SkeletonBox } from '../../components/Skeleton';
import { dataApi } from '../../lib/api';
import { useAuth } from '../../contexts/ContextAuthentification';
import { useSlideInUp } from '../../lib/animations';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from '../../styles/Carte/OptimisationItineraire.module.css';

// Nominatim API pour la géocodage
const NOMINATIM_API = 'https://nominatim.openstreetmap.org';

export default function OptimisationItineraire() {
  const { user } = useAuth();
  const { isLoading, startLoading, stopLoading, isFirstLoad } = usePageLoading();
  const containerRef = useSlideInUp(0.8, 0.2);
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);

  // États pour la recherche
  const [startLocation, setStartLocation] = useState(null);
  const [endLocation, setEndLocation] = useState(null);
  const [startSearchQuery, setStartSearchQuery] = useState('');
  const [endSearchQuery, setEndSearchQuery] = useState('');
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showEndSuggestions, setShowEndSuggestions] = useState(false);
  
  // États pour les résultats
  const [routeResult, setRouteResult] = useState(null);
  const [error, setError] = useState(null);
  
  // Références pour les inputs
  const startSearchRef = useRef(null);
  const endSearchRef = useRef(null);

  // Fonction de géocodage avec Nominatim
  const searchLocations = useCallback(async (query, isStart = true) => {
    if (!query || query.length < 2) {
      if (isStart) {
        setStartSuggestions([]);
      } else {
        setEndSuggestions([]);
      }
      return;
    }

    try {
      const response = await fetch(
        `${NOMINATIM_API}/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=mg`
      );
      const results = await response.json();
      
      const suggestions = results.map((item) => ({
        name: item.name || item.display_name.split(',')[0],
        displayName: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon)
      }));

      if (isStart) {
        setStartSuggestions(suggestions);
      } else {
        setEndSuggestions(suggestions);
      }
    } catch (err) {
      console.error('Erreur recherche Nominatim:', err);
    }
  }, []);

  // Debounce pour la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      if (startSearchQuery) {
        searchLocations(startSearchQuery, true);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [startSearchQuery, searchLocations]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (endSearchQuery) {
        searchLocations(endSearchQuery, false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [endSearchQuery, searchLocations]);

  // Sélectionner une suggestion
  const selectStartLocation = (location) => {
    setStartLocation(location);
    setStartSearchQuery(location.name);
    setStartSuggestions([]);
    setShowStartSuggestions(false);
  };

  const selectEndLocation = (location) => {
    setEndLocation(location);
    setEndSearchQuery(location.name);
    setEndSuggestions([]);
    setShowEndSuggestions(false);
  };

  // Géolocalisation
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    startLoading();
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocoding pour obtenir le nom du lieu
          const response = await fetch(
            `${NOMINATIM_API}/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          const locationName = data.address?.city || data.address?.town || data.name || 'Ma position actuelle';
          
          setStartLocation({ 
            latitude, 
            longitude, 
            name: locationName,
            displayName: data.display_name || locationName
          });
          setStartSearchQuery(locationName);
          stopLoading();
        } catch (err) {
          console.error('Erreur reverse geocoding:', err);
          setStartLocation({ latitude, longitude, name: 'Ma position actuelle' });
          setStartSearchQuery('Ma position actuelle');
          stopLoading();
        }
      },
      (error) => {
        console.error('Erreur géolocalisation:', error);
        setError('Impossible d\'accéder à votre position. Vérifiez vos permissions.');
        stopLoading();
      }
    );
  };

  // Échanger départ et destination
  const swapLocations = () => {
    const tempLocation = startLocation;
    const tempQuery = startSearchQuery;
    
    setStartLocation(endLocation);
    setStartSearchQuery(endSearchQuery);
    
    setEndLocation(tempLocation);
    setEndSearchQuery(tempQuery);
  };

  // Récupérer les coordonnées du trajet via OSRM
  const getRouteCoordinates = async (start, end) => {
    try {
      const coordsString = `${start.longitude},${start.latitude};${end.longitude},${end.latitude}`;
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${coordsString}?geometries=geojson&overview=full&steps=true`
      );
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        return {
          coordinates: route.geometry.coordinates.map((c) => [c[1], c[0]]),
          distance: (route.distance / 1000).toFixed(2), // en km
          duration: (route.duration / 3600).toFixed(1), // en heures
          steps: route.legs[0]?.steps || []
        };
      }
      return null;
    } catch (err) {
      console.error('Erreur OSRM:', err);
      setError('Erreur lors du calcul de l\'itinéraire');
      return null;
    }
  };

  // Calculer l'itinéraire
  const calculateRoute = async () => {
    if (!startLocation || !endLocation) {
      setError('Veuillez sélectionner un point de départ et une destination');
      return;
    }

    startLoading();
    setError(null);
    
    const route = await getRouteCoordinates(startLocation, endLocation);
    
    if (route) {
      setRouteResult({
        ...route,
        startLocation,
        endLocation
      });
    } else {
      setRouteResult(null);
    }
    
    stopLoading();
  };

  // Afficher la carte avec le trajet
  useEffect(() => {
    if (!routeResult || !routeResult.coordinates) return;

    setTimeout(() => {
      if (!mapRef.current) return;

      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
      }

      // Créer la carte centrée sur le point de départ
      const map = L.map(mapRef.current).setView(
        [routeResult.startLocation.latitude, routeResult.startLocation.longitude],
        13
      );
      leafletMapRef.current = map;
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      // Marquer le point de départ (vert - couleur primaire du projet)
      L.circleMarker([routeResult.startLocation.latitude, routeResult.startLocation.longitude], {
        radius: 12,
        fillColor: '#1d976c',
        color: '#fff',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.95
      })
        .bindPopup(`<b>Départ</b><br/>${routeResult.startLocation.name}`)
        .addTo(map);

      // Marquer le point de destination (rose - couleur accent du projet)
      L.circleMarker([routeResult.endLocation.latitude, routeResult.endLocation.longitude], {
        radius: 12,
        fillColor: '#d63384',
        color: '#fff',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.95
      })
        .bindPopup(`<b>Destination</b><br/>${routeResult.endLocation.name}`)
        .addTo(map);

      // Afficher le trajet (couleur primaire du projet)
      if (routeResult.coordinates && routeResult.coordinates.length > 0) {
        const polyline = L.polyline(routeResult.coordinates, {
          color: '#1d976c',
          weight: 5,
          opacity: 0.8,
          dashArray: null
        }).addTo(map);

        // Ajuster la vue pour voir tout le trajet
        const bounds = L.latLngBounds(
          [routeResult.startLocation.latitude, routeResult.startLocation.longitude],
          [routeResult.endLocation.latitude, routeResult.endLocation.longitude]
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }, 100);

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [routeResult]);

  // Fermer les suggestions en cliquant en dehors
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (startSearchRef.current && !startSearchRef.current.contains(e.target)) {
        setShowStartSuggestions(false);
      }
      if (endSearchRef.current && !endSearchRef.current.contains(e.target)) {
        setShowEndSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={clsx(styles['optimization-page'])} ref={containerRef}>
      <div className={clsx(styles['optimization-page-header'])}>
          <h1 className={clsx(styles['page-title'])}>
            <FiMapPin style={{ marginRight: '8px' }} />
            Optimisation d'Itinéraire
          </h1>
          <p className={clsx(styles['page-subtitle'])}>Calculez le meilleur itinéraire entre deux points avec distance et durée estimées</p>
        </div>

      <div className={clsx(styles['optimization-search-bar'])}>
        <div className={clsx(styles['search-bar-wrapper'])}>
          <div className={clsx(styles['search-input-group'])} ref={startSearchRef}>
            <div className={clsx(styles['search-input-wrapper'], { [styles['has-value']]: startLocation })}>
              <FiMapPin className={clsx(styles['search-icon'])} />
              <input
                type="text"
                placeholder="Lieu de départ"
                value={startSearchQuery}
                onChange={(e) => {
                  setStartSearchQuery(e.target.value);
                  setShowStartSuggestions(true);
                }}
                onFocus={() => setShowStartSuggestions(true)}
              />
              {startLocation && (
                <button
                  className={clsx(styles['clear-btn'])}
                  onClick={() => {
                    setStartLocation(null);
                    setStartSearchQuery('');
                  }}
                  type="button"
                  aria-label="Effacer le départ"
                >
                  <MdClear />
                </button>
              )}
            </div>

            {showStartSuggestions && startSuggestions.length > 0 && (
              <div className={clsx(styles['suggestions-dropdown'])}>
                {startSuggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className={clsx(styles['suggestion-item'])}
                    onClick={() => selectStartLocation(suggestion)}
                    role="button"
                    tabIndex={0}
                  >
                    <FiMapPin className={clsx(styles['icon'])} />
                    <div className={clsx(styles['suggestion-text'])}>
                      <div className={clsx(styles['suggestion-name'])}>{suggestion.name}</div>
                      <div className={clsx(styles['suggestion-address'])}>{suggestion.displayName.split(',').slice(1).join(',').trim()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={clsx(styles['search-control-buttons'])}>
            <button
              className={clsx(styles['btn-geoloc'])}
              onClick={getCurrentLocation}
              title="Utiliser ma position actuelle"
              aria-label="Utiliser ma position"
              type="button"
            >
              <FiNavigation />
            </button>

            <button
              className={clsx(styles['btn-swap'])}
              onClick={swapLocations}
              title="Inverser départ et destination"
              aria-label="Inverser"
              type="button"
            >
              <FiRepeat />
            </button>
          </div>

          <div className={clsx(styles['search-input-group'])} ref={endSearchRef}>
            <div className={clsx(styles['search-input-wrapper'], { [styles['has-value']]: endLocation })}>
              <FiMapPin className={clsx(styles['search-icon'])} />
              <input
                type="text"
                placeholder="Lieu de destination"
                value={endSearchQuery}
                onChange={(e) => {
                  setEndSearchQuery(e.target.value);
                  setShowEndSuggestions(true);
                }}
                onFocus={() => setShowEndSuggestions(true)}
              />
              {endLocation && (
                <button
                  className={clsx(styles['clear-btn'])}
                  onClick={() => {
                    setEndLocation(null);
                    setEndSearchQuery('');
                  }}
                  type="button"
                  aria-label="Effacer la destination"
                >
                  <MdClear />
                </button>
              )}
            </div>

            {showEndSuggestions && endSuggestions.length > 0 && (
              <div className={clsx(styles['suggestions-dropdown'])}>
                {endSuggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className={clsx(styles['suggestion-item'])}
                    onClick={() => selectEndLocation(suggestion)}
                    role="button"
                    tabIndex={0}
                  >
                    <FiMapPin className={clsx(styles['icon'])} />
                    <div className={clsx(styles['suggestion-text'])}>
                      <div className={clsx(styles['suggestion-name'])}>{suggestion.name}</div>
                      <div className={clsx(styles['suggestion-address'])}>{suggestion.displayName.split(',').slice(1).join(',').trim()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            className={clsx(styles['btn-calculate'])}
            onClick={calculateRoute}
            disabled={!startLocation || !endLocation || isLoading}
            type="button"
          >
            {isLoading ? (
              <>
                <span className={clsx(styles['spinner'])} />
                Calcul...
              </>
            ) : (
              <>
                <MdRoute /> Calculer
              </>
            )}
          </button>
        </div>

        {error && <div className={clsx(styles['search-bar-error'])}>{error}</div>}
      </div>

      <div className={clsx(styles['map-content-container'])}>
        <div className={clsx(styles['map-wrapper'])}>
          <div className={clsx(styles['leaflet-map'])} ref={mapRef} />
        </div>

        {routeResult && (
          <div className={clsx(styles['results-panel'])}>
            <div className={clsx(styles['results-header'])}>
              <MdRoute style={{ fontSize: '18px' }} />
              <h3>Détails de l'itinéraire</h3>
            </div>

            <div className={clsx(styles['results-stats'])}>
              <div className={clsx(styles['stat-card'])}>
                <MdRoute className={clsx(styles['stat-icon'])} />
                <div className={clsx(styles['stat-content'])}>
                  <div className={clsx(styles['stat-label'])}>Distance</div>
                  <div className={clsx(styles['stat-value'])}>{routeResult.distance} km</div>
                </div>
              </div>

              <div className={clsx(styles['stat-card'])}>
                <FiClock className={clsx(styles['stat-icon'])} />
                <div className={clsx(styles['stat-content'])}>
                  <div className={clsx(styles['stat-label'])}>Durée</div>
                  <div className={clsx(styles['stat-value'])}>{routeResult.duration}h</div>
                </div>
              </div>
            </div>

            <div className={clsx(styles['results-locations'])}>
              <div className={clsx(styles['location-item'], styles['start'])}>
                <div className={clsx(styles['location-pin'])}>A</div>
                <div className={clsx(styles['location-details'])}>
                  <div className={clsx(styles['location-label'])}>Départ</div>
                  <div className={clsx(styles['location-name'])}>{routeResult.startLocation.name}</div>
                </div>
              </div>

              <div className={clsx(styles['location-item'], styles['end'])}>
                <div className={clsx(styles['location-pin'])}>B</div>
                <div className={clsx(styles['location-details'])}>
                  <div className={clsx(styles['location-label'])}>Destination</div>
                  <div className={clsx(styles['location-name'])}>{routeResult.endLocation.name}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
