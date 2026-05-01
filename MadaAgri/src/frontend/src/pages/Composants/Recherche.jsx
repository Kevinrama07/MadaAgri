import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { dataApi } from '../../lib/api';
import { FiSearch, FiUser, FiFileText, FiBox, FiFilter, FiX } from 'react-icons/fi';
import { SkeletonCard, SkeletonAvatar } from '../../components/Skeleton';
import styles from '../../styles/Composants/Recherche.module.css'

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
    <div className={clsx(styles['search-page'])}>

      <div className={clsx(styles['search-header'])}>
        <div className={clsx(styles['filter-tabs'])}>
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
        <div className={clsx(styles['error-alert'])}>
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
          <div style={{ padding: '2rem' }}>
            <div className={clsx(styles['section-header'])}>
              <FiUser size={24} />
              <h2 className={clsx(styles['section-title'])}>Chargement des résultats...</h2>
            </div>
            <div className={clsx(styles['results-grid'])} style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        ) : totalResults === 0 ? (
          <div className={clsx(styles['no-results'])}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔍</div>
            <h3 style={{ margin: '0 0 0.5rem' }}>Aucun résultat trouvé</h3>
            <p>Essayez de rechercher avec d'autres mots-clés</p>
          </div>
        ) : (
          <>
            <div className={clsx(styles['results-info'])}>
              {totalResults} résultat{totalResults > 1 ? 's' : ''} trouvé{totalResults > 1 ? 's' : ''}
            </div>

            {filteredUsers.length > 0 && (
              <div className={clsx(styles['results-section'])}>
                <div className={clsx(styles['section-header'])}>
                  <FiUser size={24} />
                  <h2 className={clsx(styles['section-title'])}>Personnes</h2>
                  <span className={clsx(styles['result-count'])}>{filteredUsers.length} résultat{filteredUsers.length > 1 ? 's' : ''}</span>
                </div>
                <div className={clsx(styles['results-grid'])}>
                  {filteredUsers.map(user => (
                    <div 
                      key={user.id} 
                      className={clsx(styles['result-card'], styles['user-card'])}
                      onClick={() => onUserProfileClick && onUserProfileClick(user.id)}
                      style={{ cursor: onUserProfileClick ? 'pointer' : 'default' }}
                    >
                      <div className={clsx(styles['user-avatar'])}>
                        {user.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                      </div>
                      <h3 className={clsx(styles['user-name'])}>{user.display_name || user.email}</h3>
                      <p className={clsx(styles['user-email'])}>{user.email}</p>
                      <span className={clsx(styles['user-role'])}>
                        {user.role === 'farmer' ? 'Agriculteur' : ' Client'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredProducts.length > 0 && (
              <div className={clsx(styles['results-section'])}>
                <div className={clsx(styles['section-header'])}>
                  <FiPackage size={24} />
                  <h2 className={clsx(styles['section-title'])}>Produits</h2>
                  <span className={clsx(styles['result-count'])}>{filteredProducts.length} résultat{filteredProducts.length > 1 ? 's' : ''}</span>
                </div>
                <div className={clsx(styles['results-grid'])}>
                  {filteredProducts.map(product => (
                    <div key={product.id} className={clsx(styles['result-card'], styles['product-card'])}>
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
                        <div className={clsx(styles['product-image'])}>📦</div>
                      )}
                      <h3 className={clsx(styles['product-title'])}>{product.title}</h3>
                      <p className={clsx(styles['product-price'])}>{Number(product.price).toLocaleString('fr-FR')} Ar</p>
                      <p className={clsx(styles['product-meta'])}>
                        Quantité: {product.quantity} {product.unit}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredPosts.length > 0 && (
              <div className={clsx(styles['results-section'])}>
                <div className={clsx(styles['section-header'])}>
                  <FiFileText size={24} />
                  <h2 className={clsx(styles['section-title'])}>Publications</h2>
                  <span className={clsx(styles['result-count'])}>{filteredPosts.length} résultat{filteredPosts.length > 1 ? 's' : ''}</span>
                </div>
                <div className={clsx(styles['results-grid'])}>
                  {filteredPosts.map(post => (
                    <div key={post.id} className={clsx(styles['result-card'], styles['post-card'])}>
                      <div className={clsx(styles['post-author'])}>{post.display_name || post.email}</div>
                      <p className={clsx(styles['post-content'])}>{post.content}</p>
                      <div className={clsx(styles['post-date'])}>
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
        <div className={clsx(styles['empty-state'])}>
          <div className={clsx(styles['empty-icon'])}>
            <FiSearch size={48} />
          </div>
          <h3>Recherche active</h3>
          <p>Utilisez la barre de recherche en haut pour chercher des personnes, publications ou produits</p>
        </div>
      )}
    </div>
  );
}

