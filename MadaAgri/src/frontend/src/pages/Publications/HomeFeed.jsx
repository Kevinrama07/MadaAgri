import { useEffect, useState, useMemo } from 'react';
import { FiSearch, FiMapPin, FiZap, FiCalendar, FiX, FiAlertTriangle, FiMail, FiTarget } from 'react-icons/fi';
import { AiFillFire } from 'react-icons/ai';
import clsx from 'clsx';
import { usePageLoading } from '../../hooks/usePageLoading';
import { SkeletonPublicationCard } from '../../components/Skeleton';
import { dataApi } from '../../lib/api';
import { useAuth } from '../../contexts/ContextAuthentification';
import { useFadeIn } from '../../lib/animations';
import PostCard from './PostCard';
import styles from '../../styles/Publications/SocialFeed.module.css';

export default function HomeFeed({ onUserProfileClick }) {
  const { user } = useAuth();
  const { isLoading, startLoading, stopLoading, hasShownSkeletons, markSkeletonsShown } = usePageLoading();
  
  useEffect(() => {
    if (isLoading && !hasShownSkeletons) {
      markSkeletonsShown();
    }
  }, [isLoading, hasShownSkeletons, markSkeletonsShown]);
  const feedRef = useFadeIn();
  const [posts, setPosts] = useState([]);
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
    startLoading();
    setError('');
    try {
      const list = await dataApi.fetchPosts({ sort, q: filterCulture || filterRegion });
      setPosts(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur chargement feed');
      setPosts([]);
    } finally {
      stopLoading();
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
    <div className={clsx(styles['home-feed'])} ref={feedRef}>
      <div className={clsx(styles['feed-filters'])}>
        <div className={clsx(styles['filters-header'])}>
          <h3 className={clsx(styles['filters-title'])}><FiSearch style={{marginRight: '8px'}} /> Filtrer les publications</h3>
        </div>

        <div className={clsx(styles['filters-wrapper'])}>
          <div className={clsx(styles['filter-group'])}>
            <label className={clsx(styles['filter-label'])}>Tri</label>
            <div className={clsx(styles['filter-select-wrapper'])}>
              <span className={clsx(styles['filter-icon'])}><FiZap /></span>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className={clsx(styles['filter-select'])}>
                <option value="recent">Récentes</option>
                <option value="popular">Populaires</option>
              </select>
            </div>
          </div>

          {(filterCulture || filterRegion) && (
            <button
              className={clsx(styles['clear-filters-btn'])}
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
        <div className={clsx(styles['feed-error'])}>
          <span><FiAlertTriangle style={{marginRight: '8px'}} /> {error}</span>
          <button onClick={fetchPosts} className={clsx(styles['retry-btn'])}>
            Réessayer
          </button>
        </div>
      )}

      {/* Feed */}
      <div className={clsx(styles['posts-feed'])}>
        {isLoading ? (
          <div className={clsx(styles['feed-loading'])}>
            {Array.from({ length: 2 }).map((_, i) => (
              <SkeletonPublicationCard key={i} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className={clsx(styles['feed-empty'])}>
            <div className={clsx(styles['empty-icon'])}><FiMail style={{fontSize: '48px'}} /></div>
            <p>Aucune publication à afficher</p>
            <p className={clsx(styles['empty-subtitle'])}>Soyez le premier à partager une activité agricole!</p>
          </div>
        ) : (
          <div className={clsx(styles['posts-list'])}>
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
      {!isLoading && posts.length > 0 && (
        <div className={clsx(styles['load-more-section'])}>
          <button className={clsx(styles['load-more-btn'])} onClick={fetchPosts}>
            Charger plus de publications
          </button>
        </div>
      )}
    </div>
  );
}
