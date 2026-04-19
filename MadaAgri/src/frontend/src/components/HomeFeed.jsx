import { useEffect, useState, useMemo } from 'react';
import { FiSearch, FiMapPin, FiZap, FiCalendar, FiX, FiAlertTriangle, FiMail, FiTarget } from 'react-icons/fi';
import { AiFillFire } from 'react-icons/ai';
import { dataApi } from '../lib/api';
import { useAuth } from '../contexts/ContextAuthentification';
import { useFadeIn } from '../lib/animations';
import PostCard from './PostCard';
import '../styles/SocialFeed.css';

export default function HomeFeed({ onUserProfileClick }) {
  const { user } = useAuth();
  const feedRef = useFadeIn();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('recent');
  const [filterCulture, setFilterCulture] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [error, setError] = useState('');

  const params = useMemo(
    () => ({ sort, q: filterCulture || filterRegion }),
    [sort, filterCulture, filterRegion]
  );

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  async function fetchPosts() {
    setLoading(true);
    setError('');
    try {
      const list = await dataApi.fetchPosts({ sort, q: filterCulture || filterRegion });
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
      // Update local state
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                user_likes: 1,
                likes_count: (post.likes_count || 0) + 1
              }
            : post
        )
      );
    } catch (e) {
      console.error(e);
    }
  }

  async function handleUnlike(postId) {
    try {
      await dataApi.unlikePost(postId);
      // Update local state
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                user_likes: 0,
                likes_count: Math.max(0, (post.likes_count || 0) - 1)
              }
            : post
        )
      );
    } catch (e) {
      console.error(e);
    }
  }

  const handlePostCreated = () => {
    // Refresh posts when a new one is created
    fetchPosts();
  };

  return (
    <div className="home-feed" ref={feedRef}>
      <div className="feed-filters">
        <div className="filters-header">
          <h3 className="filters-title"><FiSearch style={{marginRight: '8px'}} /> Filtrer les publications</h3>
        </div>
        
        <div className="filters-wrapper">
          <div className="filter-group">
            <label className="filter-label">Cultures</label>
            <div className="filter-input-wrapper">
              <span className="filter-icon"><FiTarget /></span>
              <input
                type="text"
                placeholder="Ex: Riz, Maïs..."
                value={filterCulture}
                onChange={(e) => setFilterCulture(e.target.value)}
                className="filter-input"
              />
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Région</label>
            <div className="filter-input-wrapper">
              <span className="filter-icon"><FiMapPin /></span>
              <input
                type="text"
                placeholder="Ex: Vakinankaratra..."
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="filter-input"
              />
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Tri</label>
            <div className="filter-select-wrapper">
              <span className="filter-icon"><FiZap /></span>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="filter-select">
                <option value="recent">Récentes</option>
                <option value="popular">Populaires</option>
              </select>
            </div>
          </div>

          {(filterCulture || filterRegion) && (
            <button
              className="clear-filters-btn"
              onClick={() => {
                setFilterCulture('');
                setFilterRegion('');
              }}
              title="Effacer tous les filtres"
            >
              <FiX style={{marginRight: '6px'}} /> Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="feed-error">
          <span><FiAlertTriangle style={{marginRight: '8px'}} /> {error}</span>
          <button onClick={fetchPosts} className="retry-btn">
            Réessayer
          </button>
        </div>
      )}

      {/* Feed */}
      <div className="posts-feed">
        {loading ? (
          <div className="feed-loading">
            <div className="spinner"></div>
            <p>Chargement des publications...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="feed-empty">
            <div className="empty-icon"><FiMail style={{fontSize: '48px'}} /></div>
            <p>Aucune publication à afficher</p>
            <p className="empty-subtitle">Soyez le premier à partager une activité agricole!</p>
          </div>
        ) : (
          <div className="posts-list">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onUnlike={handleUnlike}
                onRefresh={fetchPosts}
                onUserProfileClick={onUserProfileClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Load More Button */}
      {!loading && posts.length > 0 && (
        <div className="load-more-section">
          <button className="load-more-btn" onClick={fetchPosts}>
            Charger plus de publications
          </button>
        </div>
      )}
    </div>
  );
}
