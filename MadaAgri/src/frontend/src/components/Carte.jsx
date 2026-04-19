import { useEffect, useState } from 'react';
import { dataApi } from '../lib/api';

export default function Carte() {
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRegions() {
      setLoading(true);
      try {
        const regionsData = await dataApi.fetchRegions();
        setRegions(regionsData);
      } catch (err) {
        console.error('Erreur fetch regions', err);
      } finally {
        setLoading(false);
      }
    }
    fetchRegions();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Carte agricole de Madagascar</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 border border-gray-200 rounded-lg overflow-hidden bg-white">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-bold text-gray-900">Régions agricoles</h3>
          </div>
          <div className="overflow-y-auto max-h-96">
            {regions.map((region) => (
              <button
                key={region.id}
                onClick={() => setSelectedRegion(region)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-green-50 transition-colors ${
                  selectedRegion?.id === region.id ? 'bg-green-100 border-l-4 border-green-600' : ''
                }`}
              >
                <div className="font-medium text-gray-900">{region.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {Number(region.latitude).toFixed(4)}°, {Number(region.longitude).toFixed(4)}°
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedRegion ? (
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 text-white">
                <h3 className="text-2xl font-bold mb-2">{selectedRegion.name}</h3>
                <p className="opacity-90">{selectedRegion.description}</p>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 font-medium mb-1">LATITUDE</p>
                    <p className="text-lg font-bold text-gray-900">
                      {Number(selectedRegion.latitude).toFixed(4)}°
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 font-medium mb-1">LONGITUDE</p>
                    <p className="text-lg font-bold text-gray-900">
                      {Number(selectedRegion.longitude).toFixed(4)}°
                    </p>
                  </div>
                </div>

                {selectedRegion.soil_type && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-xs text-amber-600 font-medium mb-1">TYPE DE SOL</p>
                    <p className="text-gray-900">{selectedRegion.soil_type}</p>
                  </div>
                )}

                {selectedRegion.climate && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-xs text-blue-600 font-medium mb-1">CLIMAT</p>
                    <p className="text-gray-900">{selectedRegion.climate}</p>
                  </div>
                )}

                <div className="mt-4 bg-gray-100 rounded-lg overflow-hidden h-64 flex items-center justify-center border border-gray-300">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Carte illustrative - {selectedRegion.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Position: {Number(selectedRegion.latitude).toFixed(4)}°,{' '}
                      {Number(selectedRegion.longitude).toFixed(4)}°
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center h-96 text-center bg-white">
              <p className="text-gray-600">Sélectionnez une région pour voir les détails</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

