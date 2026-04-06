import { useEffect, useState } from 'react';
import { dataApi } from '../lib/api';

export default function AnalyseCulture() {
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [suitableCultures, setSuitableCultures] = useState([]);
  const [loading, setLoading] = useState(true);

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
      // Utilise k-NN (cahier de charge). Fallback sur mapping region_cultures si besoin.
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
    if (score >= 90) return 'from-green-600 to-green-500';
    if (score >= 75) return 'from-yellow-500 to-yellow-400';
    return 'from-orange-500 to-orange-400';
  }

  function getSuitabilityLabel(score) {
    if (score >= 90) return 'Très adapté';
    if (score >= 75) return 'Adapté';
    return 'Moyennement adapté';
  }

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Analyse des cultures adaptées</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {regions.map((region) => (
          <button
            key={region.id}
            onClick={() => setSelectedRegion(region)}
            className={`p-4 rounded-lg border-2 transition-all font-medium ${
              selectedRegion?.id === region.id
                ? 'border-green-600 bg-green-50 text-green-900'
                : 'border-gray-200 bg-white text-gray-700 hover:border-green-300'
            }`}
          >
            {region.name}
          </button>
        ))}
      </div>

      {selectedRegion && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg border border-blue-200">
            <h3 className="font-bold text-lg text-gray-900 mb-4">
              {selectedRegion.name}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-600 font-medium mb-1">TYPE DE SOL</p>
                <p className="text-gray-900 font-semibold">
                  {selectedRegion.soil_type || 'Non spécifié'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium mb-1">CLIMAT</p>
                <p className="text-gray-900 font-semibold">
                  {selectedRegion.climate || 'Non spécifié'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-gray-900">
              Cultures les plus adaptées
            </h4>

            {suitableCultures.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Aucune culture trouvée pour cette région</p>
              </div>
            ) : (
              suitableCultures.map((item) => (
                <div
                  key={item.culture.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h5 className="font-bold text-gray-900">{item.culture.name}</h5>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.culture.description}
                        </p>
                      </div>
                      <span
                        className={`bg-gradient-to-r ${getSuitabilityColor(
                          item.suitability_score
                        )} text-white px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ml-4`}
                      >
                        {item.suitability_score}%
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                      <div
                        className={`bg-gradient-to-r ${getSuitabilityColor(
                          item.suitability_score
                        )} h-2 rounded-full`}
                        style={{ width: `${item.suitability_score}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Score de compatibilité : {item.suitability_score}%
                    </p>

                    <p className="text-xs text-gray-600 mt-2 font-medium">
                      {getSuitabilityLabel(item.suitability_score)}
                    </p>

                    {item.culture.ideal_soil && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-600 font-medium mb-1">SOL IDÉAL</p>
                        <p className="text-sm text-gray-700">{item.culture.ideal_soil}</p>
                      </div>
                    )}

                    {item.culture.ideal_climate && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600 font-medium mb-1">CLIMAT IDÉAL</p>
                        <p className="text-sm text-gray-700">{item.culture.ideal_climate}</p>
                      </div>
                    )}

                    {item.culture.growing_period_days && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600 font-medium mb-1">
                          PÉRIODE DE CROISSANCE
                        </p>
                        <p className="text-sm text-gray-700">
                          {item.culture.growing_period_days} jours
                        </p>
                      </div>
                    )}

                    {item.culture.yield_potential && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600 font-medium mb-1">
                          RENDEMENT POTENTIEL
                        </p>
                        <p className="text-sm text-gray-700">
                          {item.culture.yield_potential}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

