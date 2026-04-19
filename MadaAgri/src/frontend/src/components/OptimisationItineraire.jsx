import { useEffect, useState } from 'react';
import { FiCheck, FiRotateCcw, FiCircle } from 'react-icons/fi';
import { dataApi } from '../lib/api';
import { useAuth } from '../contexts/ContextAuthentification';
import { useSlideInUp } from '../lib/animations';
import '../styles/PageStyles.css';

export default function OptimisationItineraire() {
  const { user } = useAuth();
  const [regions, setRegions] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const [startRegionId, setStartRegionId] = useState('');
  const [endRegionId, setEndRegionId] = useState('');
  const [dijkstraResult, setDijkstraResult] = useState(null);
  const containerRef = useSlideInUp(0.8, 0.2);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const regionsData = await dataApi.fetchRegions();
        setRegions(regionsData);
        if (regionsData.length >= 2) {
          setStartRegionId(regionsData[0].id);
          setEndRegionId(regionsData[1].id);
        }

        if (user && user.role === 'farmer') {
          const deliveriesData = await dataApi.fetchDeliveries(user.id);
          setDeliveries(deliveriesData);
        }
      } catch (err) {
        console.error('Erreur fetch data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function nearestNeighbor(points) {
    if (points.length === 0) return [];

    const visited = new Set();
    const route = [points[0]];
    visited.add(points[0].name);

    while (visited.size < points.length) {
      const current = route[route.length - 1];
      let nearest = null;
      let minDistance = Infinity;

      for (const point of points) {
        if (!visited.has(point.name)) {
          const dist = calculateDistance(
            current.latitude,
            current.longitude,
            point.latitude,
            point.longitude
          );
          if (dist < minDistance) {
            minDistance = dist;
            nearest = point;
          }
        }
      }

      if (nearest) {
        route.push(nearest);
        visited.add(nearest.name);
      }
    }

    return route;
  }

  function optimizeRoute() {
    const selectedPoints = regions
      .filter((r) => selectedRegions.includes(r.id))
      .map((r) => ({
        name: r.name,
        latitude: Number(r.latitude),
        longitude: Number(r.longitude)
      }));

    if (selectedPoints.length === 0) return;

    const optimized = nearestNeighbor(selectedPoints);
    setOptimizedRoute(optimized);

    let distance = 0;
    for (let i = 0; i < optimized.length - 1; i += 1) {
      distance += calculateDistance(
        optimized[i].latitude,
        optimized[i].longitude,
        optimized[i + 1].latitude,
        optimized[i + 1].longitude
      );
    }
    setTotalDistance(distance);
  }

  function toggleRegion(regionId) {
    setSelectedRegions((prev) =>
      prev.includes(regionId) ? prev.filter((id) => id !== regionId) : [...prev, regionId]
    );
    setOptimizedRoute(null);
  }

  async function runDijkstra() {
    if (!startRegionId || !endRegionId) return;
    try {
      const route = await dataApi.fetchDijkstraRoute(startRegionId, endRegionId);
      setDijkstraResult(route);
    } catch (e) {
      console.error(e);
      setDijkstraResult(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="routes-page" ref={containerRef}>
      <div className="page-header">
        <h1 className="page-title">
          <i className="fas fa-road" style={{ marginRight: '12px' }}></i>
          Optimisation des Routes
        </h1>
        <p className="page-subtitle">Planifiez les meilleures routes de livraison</p>
      </div>

      {/* Dijkstra Section */}
      <div className="dijkstra-section">
        <div className="section-header">
          <h3 className="section-title">
            <i className="fas fa-arrows-alt"></i> Plus Court Chemin (Dijkstra)
          </h3>
        </div>

        <div className="dijkstra-controls">
          <div className="control-group">
            <label className="control-label">Région de départ</label>
            <select 
              className="mg-input" 
              value={startRegionId} 
              onChange={(e) => setStartRegionId(e.target.value)}
            >
              <option value="">Choisir...</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label className="control-label">Région de destination</label>
            <select 
              className="mg-input" 
              value={endRegionId} 
              onChange={(e) => setEndRegionId(e.target.value)}
            >
              <option value="">Choisir...</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <button 
            type="button" 
            className="dijkstra-btn"
            onClick={runDijkstra}
          >
            <i className="fas fa-play"></i> Calculer l'itinéraire
          </button>
        </div>

        {dijkstraResult && (
          <div className="dijkstra-result">
            <div className="result-stat">
              <span className="result-label">Distance</span>
              <span className="result-value">
                {dijkstraResult.distance_km ? `${Number(dijkstraResult.distance_km).toFixed(1)} km` : 'N/A'}
              </span>
            </div>
            <div className="result-path">
              <span className="result-label">Chemin</span>
              <span className="result-value">
                {Array.isArray(dijkstraResult.path) ? dijkstraResult.path.join(' → ') : ''}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Route Optimization Section */}
      <div className="optimization-section">
        <div className="section-header">
          <h3 className="section-title">
            <i className="fas fa-route"></i> Optimisation Multi-Régions
          </h3>
        </div>

        <div className="optimization-container">
          <div className="regions-selector-panel">
            <h4 className="panel-title">Destinations</h4>
            <p className="panel-subtitle">Sélectionnez au moins 2 régions</p>
            
            <div className="regions-list">
              {regions.map((region) => (
                <label
                  key={region.id}
                  className={`region-checkbox ${selectedRegions.includes(region.id) ? 'checked' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedRegions.includes(region.id)}
                    onChange={() => toggleRegion(region.id)}
                  />
                  <span className="checkbox-custom"></span>
                  <span className="region-name">{region.name}</span>
                </label>
              ))}
            </div>

            <button
              onClick={optimizeRoute}
              disabled={selectedRegions.length < 2}
              className="optimize-btn"
            >
              <i className="fas fa-magic"></i> Optimiser la route
            </button>
            {selectedRegions.length < 2 && (
              <p className="help-text">Sélectionnez au moins 2 régions</p>
            )}
          </div>

          {optimizedRoute ? (
            <div className="route-result-panel">
              <div className="result-header">
                <h4 className="result-title">Route Optimisée</h4>
                <span className="stops-badge">{optimizedRoute.length} arrêts</span>
              </div>

              <div className="distance-card">
                <div className="distance-value">{totalDistance.toFixed(1)}</div>
                <div className="distance-unit">km</div>
                <div className="distance-label">Distance totale</div>
              </div>

              <div className="stops-list">
                {optimizedRoute.map((point, index) => (
                  <div key={point.name} className="stop-item" style={{ '--index': index }}>
                    <div className="stop-number">{index + 1}</div>
                    <div className="stop-info">
                      <div className="stop-name">{point.name}</div>
                      <div className="stop-coords">
                        {point.latitude.toFixed(4)}°, {point.longitude.toFixed(4)}°
                      </div>
                    </div>
                    {index < optimizedRoute.length - 1 && (
                      <div className="segment-distance">
                        {calculateDistance(
                          optimizedRoute[index].latitude,
                          optimizedRoute[index].longitude,
                          optimizedRoute[index + 1].latitude,
                          optimizedRoute[index + 1].longitude
                        ).toFixed(1)} km
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <i className="fas fa-map-pin"></i>
                  <div className="stat-value">{selectedRegions.length}</div>
                  <div className="stat-label">Régions</div>
                </div>
                <div className="stat-card">
                  <i className="fas fa-clock"></i>
                  <div className="stat-value">{(totalDistance / 60).toFixed(1)}h</div>
                  <div className="stat-label">Durée est.</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-result">
              <i className="fas fa-route"></i>
              <p>Sélectionnez des régions et optimisez pour voir l'itinéraire</p>
            </div>
          )}
        </div>
      </div>

      {/* Deliveries History Section */}
      {user && user.role === 'farmer' && deliveries.length > 0 && (
        <div className="deliveries-section">
          <div className="section-header">
            <h3 className="section-title">
              <i className="fas fa-history"></i> Historique des Livraisons
            </h3>
            <span className="deliveries-count">{deliveries.length} livraisons</span>
          </div>

          <div className="deliveries-grid">
            {deliveries.map((delivery, index) => {
              const statusConfig = {
                'completed': { icon: <FiCheck size={18} />, color: 'var(--mg-primary)', label: 'Complétée' },
                'in_progress': { icon: <FiRotateCcw size={18} />, color: '#ffd43b', label: 'En cours' },
                'pending': { icon: <FiCircle size={18} />, color: '#888', label: 'Planifiée' }
              };
              const status = statusConfig[delivery.status] || statusConfig['pending'];

              return (
                <div 
                  key={delivery.id} 
                  className="delivery-card"
                  style={{ '--index': index, animationDelay: `${index * 0.08}s` }}
                >
                  <div className="delivery-status" style={{ borderColor: status.color }}>
                    <div className="status-icon" style={{ color: status.color }}>
                      {status.icon}
                    </div>
                    <span className="status-label">{status.label}</span>
                  </div>

                  <div className="delivery-info">
                    <div className="info-row">
                      <span className="info-label">
                        <i className="fas fa-route"></i> Distance
                      </span>
                      <span className="info-value">{delivery.distance_km?.toFixed(1)} km</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">
                        <i className="fas fa-hourglass-half"></i> Durée
                      </span>
                      <span className="info-value">{delivery.estimated_duration_hours?.toFixed(1)}h</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">
                        <i className="fas fa-calendar"></i> Date
                      </span>
                      <span className="info-value">
                        {new Date(delivery.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

