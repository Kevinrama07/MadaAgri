import { useEffect, useState } from 'react';
import { dataApi } from '../lib/api';

export default function Reseau() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSuggestions();
  }, []);

  async function fetchSuggestions() {
    setLoading(true);
    setError('');
    try {
      const s = await dataApi.fetchNetworkSuggestions();
      setSuggestions(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur suggestions réseau');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }

  async function follow(id) {
    await dataApi.followUser(id);
    await fetchSuggestions();
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold" style={{ color: 'var(--mg-text)' }}>
        Vos collaborateurs
      </h2>
      <p style={{ color: 'var(--mg-text-muted)', fontSize: 13 }}>
        Suggestions basées sur les connexions à 2 niveaux (amis d’amis).
      </p>

      {error && <div className="mg-alert">{error}</div>}

      {loading ? (
        <div style={{ color: 'var(--mg-text-muted)' }}>Chargement…</div>
      ) : suggestions.length === 0 ? (
        <div style={{ color: 'var(--mg-text-muted)' }}>Aucune suggestion pour le moment.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {suggestions.map((u) => (
            <div key={u.id} className="mg-card">
              <div style={{ fontWeight: 800, color: 'var(--mg-text)' }}>
                {u.display_name || u.email}
              </div>
              <div style={{ color: 'var(--mg-text-muted)', fontSize: 12 }}>
                {u.email} · {u.role === 'farmer' ? 'Agriculteur' : 'Client'}
              </div>
              <div style={{ marginTop: 10 }}>
                <button type="button" className="mg-tab-btn active" onClick={() => follow(u.id)}>
                  Suivre
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

