import { useEffect, useState } from 'react';
import { dataApi } from '../lib/api';

export default function ListeProduits({ products, loading }) {
  const [regions, setRegions] = useState({});
  const [cultures, setCultures] = useState({});

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
    return <div className="text-center py-8">Chargement des produits...</div>;
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Aucun produit disponible pour le moment</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => {
        const region = product.region_id ? regions[product.region_id] : null;
        const culture = product.culture_id ? cultures[product.culture_id] : null;
        return (
          <div
            key={product.id}
            className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white"
          >
            {product.image_url && (
              <img
                src={product.image_url}
                alt={product.title}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
              <h3 className="font-bold text-lg text-gray-900 mb-2">{product.title}</h3>

              {product.description && (
                <p className="text-gray-600 text-sm mb-3">{product.description}</p>
              )}

              <div className="space-y-2 mb-4 text-sm text-gray-700">
                {culture && (
                  <div>
                    <span className="font-medium">Culture : </span>
                    {culture.name}
                  </div>
                )}
                {region && (
                  <div>
                    <span className="font-medium">Région : </span>
                    {region.name}
                  </div>
                )}
                <div>
                  <span className="font-medium">Quantité : </span>
                  {product.quantity} {product.unit}
                </div>
                <div>
                  <span className="font-medium">Ajouté le : </span>
                  {new Date(product.created_at).toLocaleDateString('fr-FR')}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <span className="text-2xl font-bold text-green-600">
                  {Number(product.price).toLocaleString('fr-FR')} Ar
                </span>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    product.is_available
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {product.is_available ? 'Disponible' : 'Indisponible'}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

