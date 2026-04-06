import { useState } from 'react';
import { dataApi } from '../lib/api';

export default function Recherche() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');

  async function runSearch(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const [p, feed] = await Promise.all([
        dataApi.searchProducts(q),
        dataApi.fetchPosts({ q, sort: 'recent' }),
      ]);
      setProducts(p);
      setPosts(feed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur recherche');
      setProducts([]);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold" style={{ color: 'var(--mg-text)' }}>Recherche (KMP)</h2>
      <form onSubmit={runSearch} className="flex gap-2 flex-wrap">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ex: riz, tomate, maïs…"
          className="mg-input"
          style={{ minWidth: 280 }}
        />
        <button type="submit" className="mg-tab-btn active" disabled={loading}>
          {loading ? 'Recherche…' : 'Rechercher'}
        </button>
      </form>

      {error && <div className="mg-alert">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="mg-card">
          <h3 style={{ fontWeight: 800, color: 'var(--mg-text)' }}>Produits</h3>
          <div style={{ marginTop: 8, color: 'var(--mg-text-muted)', fontSize: 12 }}>
            Résultats filtrés via KMP côté backend.
          </div>
          {products.length === 0 ? (
            <div style={{ marginTop: 10, color: 'var(--mg-text-muted)' }}>Aucun résultat.</div>
          ) : (
            <ul style={{ marginTop: 10, display: 'grid', gap: 8 }}>
              {products.slice(0, 10).map((p) => (
                <li key={p.id} style={{ color: 'var(--mg-text)' }}>
                  <b>{p.title}</b> — {Number(p.price).toLocaleString('fr-FR')} Ar
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mg-card">
          <h3 style={{ fontWeight: 800, color: 'var(--mg-text)' }}>Publications</h3>
          <div style={{ marginTop: 8, color: 'var(--mg-text-muted)', fontSize: 12 }}>
            Filtrage KMP sur le contenu.
          </div>
          {posts.length === 0 ? (
            <div style={{ marginTop: 10, color: 'var(--mg-text-muted)' }}>Aucun résultat.</div>
          ) : (
            <ul style={{ marginTop: 10, display: 'grid', gap: 8 }}>
              {posts.slice(0, 6).map((p) => (
                <li key={p.id} style={{ color: 'var(--mg-text)' }}>
                  <b>{p.display_name || p.email}</b> — {String(p.content).slice(0, 90)}
                  {String(p.content).length > 90 ? '…' : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

