import { useEffect, useMemo, useState } from 'react';
import { dataApi } from '../lib/api';
import { useAuth } from '../contexts/ContextAuthentification';

export default function FilActualites() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('recent');
  const [q, setQ] = useState('');
  const [error, setError] = useState('');

  const params = useMemo(() => ({ sort, q }), [sort, q]);

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  async function fetchPosts() {
    setLoading(true);
    setError('');
    try {
      const list = await dataApi.fetchPosts({ sort, q });
      setPosts(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur chargement feed');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleLike(postId) {
    try {
      await dataApi.likePost(postId);
      await fetchPosts();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleUnlike(postId) {
    try {
      await dataApi.unlikePost(postId);
      await fetchPosts();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--mg-text)' }}>
            Publications
          </h2>
        </div>

        <div className="flex gap-2 flex-wrap">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher dans les publications…"
            className="mg-input"
            style={{ minWidth: 260 }}
          />
          <select className="mg-input" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="recent">Récentes</option>
            <option value="popular">Populaires</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mg-alert" style={{ borderColor: 'rgba(255,100,100,0.4)' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--mg-text-muted)' }}>Chargement…</div>
      ) : posts.length === 0 ? (
        <div style={{ color: 'var(--mg-text-muted)' }}>Aucune publication.</div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <div key={p.id} className="mg-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--mg-text)' }}>
                    {p.display_name || p.email}
                  </div>
                  <div style={{ color: 'var(--mg-text-muted)', fontSize: 12 }}>
                    {new Date(p.created_at).toLocaleString('fr-FR')}
                    {' · '}
                    Visibilité: {p.visibility}
                    {' · '}
                    ❤️ {Number(p.likes_count || 0)} · 💬 {Number(p.comments_count || 0)}
                  </div>
                </div>
              </div>

              <p style={{ marginTop: 10, color: 'var(--mg-text)', whiteSpace: 'pre-wrap' }}>
                {p.content}
              </p>

              {p.image_url && (
                <img
                  src={p.image_url}
                  alt="illustration"
                  style={{ marginTop: 10, borderRadius: 12, maxHeight: 260, width: '100%', objectFit: 'cover' }}
                />
              )}

              <div className="flex gap-2 flex-wrap" style={{ marginTop: 12 }}>
                <button type="button" className="mg-tab-btn" onClick={() => handleLike(p.id)}>
                  J’aime
                </button>
                <button type="button" className="mg-tab-btn" onClick={() => handleUnlike(p.id)}>
                  Retirer like
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

