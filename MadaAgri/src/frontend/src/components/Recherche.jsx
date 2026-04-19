import { useState, useEffect } from 'react';
import { dataApi } from '../lib/api';
import { FiSearch, FiUser, FiFileText, FiPackage, FiFilter, FiX } from 'react-icons/fi';

export default function Recherche({ initialQuery = '', onUserProfileClick }) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');

  // Filtres
  const [filterType, setFilterType] = useState('all'); // all, users, posts, products

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      runSearch(initialQuery);
    }
  }, [initialQuery]);

  async function runSearch(query) {
    if (!query || !query.trim()) {
      setUsers([]);
      setProducts([]);
      setPosts([]);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [u, p, feed] = await Promise.all([
        dataApi.searchUsers(query),
        dataApi.searchProducts(query),
        dataApi.fetchPosts({ q: query, sort: 'recent' }),
      ]);
      setUsers(u || []);
      setProducts(p || []);
      setPosts(feed || []);
    } catch (err) {
      console.error('Erreur recherche:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la recherche');
      setUsers([]);
      setProducts([]);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  // Filtrer les résultats
  const filteredUsers = filterType === 'all' || filterType === 'users' ? users : [];
  const filteredProducts = filterType === 'all' || filterType === 'products' ? products : [];
  const filteredPosts = filterType === 'all' || filterType === 'posts' ? posts : [];

  const totalResults = filteredUsers.length + filteredProducts.length + filteredPosts.length;

  return (
    <div className="search-page">
      <style>{`
        .search-page {
          max-width: 1000px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }

        .search-header {
          margin-bottom: 2rem;
        }

        .filter-tabs {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid var(--mg-border);
        }

        .filter-btn {
          padding: 0.6rem 1rem;
          border: 2px solid var(--mg-border);
          background: var(--mg-bg);
          color: var(--mg-text);
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
        }

        .filter-btn:hover {
          border-color: var(--mg-primary);
          background: rgba(var(--mg-primary-rgb), 0.1);
        }

        .filter-btn.active {
          background: var(--mg-primary);
          color: white;
          border-color: var(--mg-primary);
        }

        .results-info {
          font-size: 0.9rem;
          color: var(--mg-text-muted);
          margin-bottom: 1.5rem;
        }

        .results-section {
          margin-bottom: 3rem;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid var(--mg-border);
        }

        .section-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--mg-text);
          margin: 0;
        }

        .result-count {
          font-size: 0.9rem;
          color: var(--mg-text-muted);
          margin-left: auto;
        }

        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }

        .result-card {
          background: var(--mg-card-bg);
          border: 1px solid var(--mg-border);
          border-radius: 8px;
          padding: 1rem;
          transition: all 0.3s ease;
        }

        .result-card:hover {
          border-color: var(--mg-primary);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .user-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .user-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: var(--mg-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .user-name {
          font-weight: 600;
          color: var(--mg-text);
          margin: 0.5rem 0;
          word-break: break-word;
        }

        .user-email {
          font-size: 0.85rem;
          color: var(--mg-text-muted);
          margin-bottom: 0.5rem;
          word-break: break-all;
        }

        .user-role {
          font-size: 0.8rem;
          background: rgba(var(--mg-primary-rgb), 0.1);
          color: var(--mg-primary);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          display: inline-block;
          margin-bottom: 0.75rem;
        }

        .product-card {
          display: flex;
          flex-direction: column;
        }

        .product-image {
          width: 100%;
          height: 160px;
          background: var(--mg-bg);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.75rem;
          font-size: 3rem;
          color: var(--mg-text-muted);
        }

        .product-title {
          font-weight: 600;
          color: var(--mg-text);
          margin: 0 0 0.5rem;
        }

        .product-price {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--mg-primary);
        }

        .product-meta {
          font-size: 0.85rem;
          color: var(--mg-text-muted);
          margin-top: 0.5rem;
        }

        .post-card {
          display: flex;
          flex-direction: column;
        }

        .post-author {
          font-weight: 600;
          color: var(--mg-text);
          margin-bottom: 0.5rem;
        }

        .post-content {
          font-size: 0.95rem;
          color: var(--mg-text);
          line-height: 1.5;
          margin-bottom: 0.5rem;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
        }

        .post-date {
          font-size: 0.8rem;
          color: var(--mg-text-muted);
        }

        .empty-state {
          text-align: center;
          padding: 2rem;
          color: var(--mg-text-muted);
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .error-alert {
          background: #fee2e2;
          border: 1px solid #fecaca;
          color: #991b1b;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .no-results {
          background: var(--mg-card-bg);
          border: 2px dashed var(--mg-border);
          border-radius: 8px;
          padding: 2rem;
          text-align: center;
          color: var(--mg-text-muted);
        }
      `}</style>

      <div className="search-header">
        <div className="filter-tabs">
          <button
            className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            <FiFilter size={18} />
            Tout
          </button>
          <button
            className={`filter-btn ${filterType === 'users' ? 'active' : ''}`}
            onClick={() => setFilterType('users')}
          >
            <FiUser size={18} />
            Personnes ({users.length})
          </button>
          <button
            className={`filter-btn ${filterType === 'posts' ? 'active' : ''}`}
            onClick={() => setFilterType('posts')}
          >
            <FiFileText size={18} />
            Publications ({posts.length})
          </button>
          <button
            className={`filter-btn ${filterType === 'products' ? 'active' : ''}`}
            onClick={() => setFilterType('products')}
          >
            <FiPackage size={18} />
            Produits ({products.length})
          </button>
        </div>
      </div>

      {error && (
        <div className="error-alert">
          <span>{error}</span>
          <button
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
            onClick={() => setError('')}
          >
            <FiX />
          </button>
        </div>
      )}

      {initialQuery && initialQuery.trim() ? (
        loading ? (
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <p>Recherche en cours...</p>
          </div>
        ) : totalResults === 0 ? (
          <div className="no-results">
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔍</div>
            <h3 style={{ margin: '0 0 0.5rem' }}>Aucun résultat trouvé</h3>
            <p>Essayez de rechercher avec d'autres mots-clés</p>
          </div>
        ) : (
          <>
            <div className="results-info">
              {totalResults} résultat{totalResults > 1 ? 's' : ''} trouvé{totalResults > 1 ? 's' : ''}
            </div>

            {filteredUsers.length > 0 && (
              <div className="results-section">
                <div className="section-header">
                  <FiUser size={24} />
                  <h2 className="section-title">Personnes</h2>
                  <span className="result-count">{filteredUsers.length} résultat{filteredUsers.length > 1 ? 's' : ''}</span>
                </div>
                <div className="results-grid">
                  {filteredUsers.map(user => (
                    <div 
                      key={user.id} 
                      className="result-card user-card"
                      onClick={() => onUserProfileClick && onUserProfileClick(user.id)}
                      style={{ cursor: onUserProfileClick ? 'pointer' : 'default' }}
                    >
                      <div className="user-avatar">
                        {user.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                      </div>
                      <h3 className="user-name">{user.display_name || user.email}</h3>
                      <p className="user-email">{user.email}</p>
                      <span className="user-role">
                        {user.role === 'farmer' ? '🚜 Agriculteur' : '👤 Client'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredProducts.length > 0 && (
              <div className="results-section">
                <div className="section-header">
                  <FiPackage size={24} />
                  <h2 className="section-title">Produits</h2>
                  <span className="result-count">{filteredProducts.length} résultat{filteredProducts.length > 1 ? 's' : ''}</span>
                </div>
                <div className="results-grid">
                  {filteredProducts.map(product => (
                    <div key={product.id} className="result-card product-card">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.title}
                          style={{
                            width: '100%',
                            height: '160px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            marginBottom: '0.75rem'
                          }}
                        />
                      ) : (
                        <div className="product-image">📦</div>
                      )}
                      <h3 className="product-title">{product.title}</h3>
                      <p className="product-price">{Number(product.price).toLocaleString('fr-FR')} Ar</p>
                      <p className="product-meta">
                        Quantité: {product.quantity} {product.unit}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredPosts.length > 0 && (
              <div className="results-section">
                <div className="section-header">
                  <FiFileText size={24} />
                  <h2 className="section-title">Publications</h2>
                  <span className="result-count">{filteredPosts.length} résultat{filteredPosts.length > 1 ? 's' : ''}</span>
                </div>
                <div className="results-grid">
                  {filteredPosts.map(post => (
                    <div key={post.id} className="result-card post-card">
                      <div className="post-author">{post.display_name || post.email}</div>
                      <p className="post-content">{post.content}</p>
                      <div className="post-date">
                        {new Date(post.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <FiSearch size={48} />
          </div>
          <h3>Recherche active</h3>
          <p>Utilisez la barre de recherche en haut pour chercher des personnes, publications ou produits</p>
        </div>
      )}
    </div>
  );
}

