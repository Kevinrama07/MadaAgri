import { useEffect, useState } from 'react';
import { dataApi } from '../lib/api';
import { useAuth } from '../contexts/ContextAuthentification';

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
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Optimisation des routes de livraison</h2>

      <div className="mg-card" style={{ marginBottom: 12 }}>
        <h3 style={{ fontWeight: 800, color: 'var(--mg-text)' }}>Plus court chemin (Dijkstra)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2" style={{ marginTop: 10 }}>
          <select className="mg-input" value={startRegionId} onChange={(e) => setStartRegionId(e.target.value)}>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <select className="mg-input" value={endRegionId} onChange={(e) => setEndRegionId(e.target.value)}>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <button type="button" className="mg-tab-btn active" onClick={runDijkstra}>
            Calculer
          </button>
        </div>

        {dijkstraResult && (
          <div style={{ marginTop: 10, color: 'var(--mg-text)' }}>
            <div style={{ color: 'var(--mg-text-muted)', fontSize: 12 }}>
              Distance: {dijkstraResult.distance_km ? `${Number(dijkstraResult.distance_km).toFixed(1)} km` : 'N/A'}
            </div>
            <div style={{ marginTop: 6 }}>
              Chemin: {Array.isArray(dijkstraResult.path) ? dijkstraResult.path.join(' → ') : ''}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-gray-900">Sélectionnez les destinations</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-white">
            {regions.map((region) => (
              <label
                key={region.id}
                className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded"
              >
                <input
                  type="checkbox"
                  checked={selectedRegions.includes(region.id)}
                  onChange={() => toggleRegion(region.id)}
                  className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                />
                <span className="text-gray-900 font-medium">{region.name}</span>
              </label>
            ))}
          </div>

          <button
            onClick={optimizeRoute}
            disabled={selectedRegions.length < 2}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Optimiser la route
          </button>
        </div>

        <div className="lg:col-span-2">
          {optimizedRoute ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-bold text-lg text-gray-900">Route optimisée</h3>
                </div>

                <div className="bg-white rounded-lg p-4 mb-4">
                  <div className="text-center mb-4">
                    <p className="text-sm text-gray-600 font-medium">DISTANCE TOTALE</p>
                    <p className="text-3xl font-bold text-green-600">
                      {totalDistance.toFixed(1)} km
                    </p>
                  </div>

                  <div className="space-y-2">
                    {optimizedRoute.map((point, index) => (
                      <div key={point.name} className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{point.name}</p>
                          <p className="text-xs text-gray-500">
                            {point.latitude.toFixed(4)}°, {point.longitude.toFixed(4)}°
                          </p>
                        </div>
                        {index < optimizedRoute.length - 1 && (
                          <div className="text-sm text-gray-600 font-medium">
                            {calculateDistance(
                              optimizedRoute[index].latitude,
                              optimizedRoute[index].longitude,
                              optimizedRoute[index + 1].latitude,
                              optimizedRoute[index + 1].longitude
                            ).toFixed(1)}{' '}
                            km
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <p className="text-blue-600 font-medium">Régions sélectionnées</p>
                    <p className="text-lg font-bold text-blue-900">{selectedRegions.length}</p>
                  </div>
                  <div className="bg-amber-50 p-3 rounded border border-amber-200">
                    <p className="text-amber-600 font-medium">Durée estimée</p>
                    <p className="text-lg font-bold text-amber-900">
                      {(totalDistance / 60).toFixed(1)}h
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-12 flex flex-col items-center justify-center text-center h-96 bg-white">
              <p className="text-gray-600 font-medium">
                Sélectionnez au moins 2 régions pour optimiser la route
              </p>
            </div>
          )}
        </div>
      </div>

      {user && user.role === 'farmer' && deliveries.length > 0 && (
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="font-bold text-lg text-gray-900 mb-4">Historique des livraisons</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deliveries.map((delivery) => (
              <div key={delivery.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900">Livraison</h4>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      delivery.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : delivery.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {delivery.status === 'completed'
                      ? 'Complétée'
                      : delivery.status === 'in_progress'
                      ? 'En cours'
                      : 'Planifiée'}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Distance: {delivery.distance_km?.toFixed(1)} km</p>
                  <p>Durée: {delivery.estimated_duration_hours?.toFixed(1)}h</p>
                  <p className="text-xs text-gray-500">
                    {new Date(delivery.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

