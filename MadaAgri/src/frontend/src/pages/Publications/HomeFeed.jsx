import { useEffect, useState, useMemo } from 'react';
import { FiSearch, FiTrendingUp, FiUsers, FiActivity, FiX, FiAlertTriangle, FiMail, FiFilter, FiRefreshCw } from 'react-icons/fi';
import { AiFillFire } from 'react-icons/ai';
import clsx from 'clsx';
import { usePageLoading } from '../../hooks/usePageLoading';
import { SkeletonPublicationCard } from '../../components/Skeleton';
import { dataApi } from '../../lib/api';
import { useAuth } from '../../contexts/ContextAuthentification';
import { useFadeIn } from '../../lib/animations';
import CreatePost from './CreatePost';
import PostCard from './PostCard';
import styles from '../../styles/Publications/SocialFeed.module.css';

// Quick Stats Component
function QuickStats({ postsCount, activeUsers }) {
  return (
    <div className="modern-grid modern-grid-3" style={{ marginBottom: '24px' }}>
      <div className="modern-card" style={{ padding: '16px' }}>
        <div className="modern-flex modern-flex-between">
          <div>
            <div className="modern-text-muted" style={{ fontSize: '13px', marginBottom: '4px' }}>
              Publications
            </div>
            <div className="modern-title" style={{ fontSize: '24px' }}>
              {postsCount}
            </div>
          </div>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px', 
            background: 'var(--theme-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '24px'
          }}>
            <FiActivity />
          </div>
        </div>
      </div>

      <div className="modern-card" style={{ padding: '16px' }}>
        <div className="modern-flex modern-flex-between">
          <div>
            <div className="modern-text-muted" style={{ fontSize: '13px', marginBottom: '4px' }}>
              Agriculteurs actifs
            </div>
            <div className="modern-title" style={{ fontSize: '24px' }}>
              {activeUsers}
            </div>
          </div>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px', 
            background: 'var(--theme-success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '24px'
          }}>
            <FiUsers />
          </div>
        </div>
      </div>

      <div className="modern-card" style={{ padding: '16px' }}>
        <div className="modern-flex modern-flex-between">
          <div>
            <div className="modern-text-muted" style={{ fontSize: '13px', marginBottom: '4px' }}>
              Tendances
            </div>
            <div className="modern-title" style={{ fontSize: '24px' }}>
              <AiFillFire style={{ color: 'var(--theme-warning)' }} />
            </div>
          </div>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px', 
            background: 'var(--theme-warning)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '24px'
          }}>
            <FiTrendingUp />
          </div>
        </div>
      </div>
    </div>
  );
}

// Filter Tabs Component
function FilterTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'recent', label: 'Récentes', icon: <FiActivity /> },
    { id: 'popular', label: 'Populaires', icon: <FiTrendingUp /> },
    { id: 'following', label: 'Abonnements', icon: <FiUsers /> }
  ];

  return (
    <div className="modern-flex" style={{ 
      gap: '8px', 
      marginBottom: '24px',
      overflowX: 'auto',
      padding: '4px'
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={clsx(
            'modern-btn',
            activeTab === tab.id ? 'modern-btn-primary' : 'modern-btn-secondary'
          )}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            whiteSpace: 'nowrap'
          }}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

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
  const [showFilters, setShowFilters] = useState(false);

  const params = useMemo(
    () => ({ sort, q: filterCulture || filterRegion }),
    [sort, filterCulture, filterRegion]
  );

  useEffect(() => {
    fetchPosts();
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
    fetchPosts();
  };

  return (
    <div className="modern-container" style={{ paddingTop: '24px', paddingBottom: '24px' }} ref={feedRef}>
      <CreatePost onPostCreated={handlePostCreated} />

      <QuickStats postsCount={posts.length} activeUsers={42} />
      <FilterTabs activeTab={sort} onTabChange={setSort} />

      <div className="modern-card" style={{ marginBottom: '24px', padding: '16px' }}>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="modern-btn modern-btn-secondary"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <FiFilter />
          <span>{showFilters ? 'Masquer les filtres' : 'Afficher les filtres avancés'}</span>
        </button>

        {showFilters && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--theme-border)' }}>
            <div className="modern-grid modern-grid-2">
              <div>
                <label className="modern-text-secondary" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  Culture
                </label>
                <input
                  type="text"
                  className="modern-input"
                  placeholder="Ex: Riz, Maïs..."
                  value={filterCulture}
                  onChange={(e) => setFilterCulture(e.target.value)}
                />
              </div>

              <div>
                <label className="modern-text-secondary" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  Région
                </label>
                <input
                  type="text"
                  className="modern-input"
                  placeholder="Ex: Analamanga..."
                  value={filterRegion}
                  onChange={(e) => setFilterRegion(e.target.value)}
                />
              </div>
            </div>

            {(filterCulture || filterRegion) && (
              <button
                onClick={() => {
                  setFilterCulture('');
                  setFilterRegion('');
                }}
                className="modern-btn modern-btn-secondary"
                style={{ marginTop: '12px' }}
              >
                <FiX />
                <span>Réinitialiser les filtres</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="modern-card" style={{ 
          marginBottom: '24px',
          padding: '16px',
          background: 'var(--theme-danger-light)',
          border: '1px solid var(--theme-danger)'
        }}>
          <div className="modern-flex modern-flex-between">
            <div className="modern-flex" style={{ gap: '12px', alignItems: 'center' }}>
              <FiAlertTriangle style={{ color: 'var(--theme-danger)', fontSize: '20px' }} />
              <span style={{ color: 'var(--theme-danger)' }}>{error}</span>
            </div>
            <button onClick={fetchPosts} className="modern-btn modern-btn-secondary" style={{ padding: '8px 16px' }}>
              <FiRefreshCw />
              Réessayer
            </button>
          </div>
        </div>
      )}

      {/* Feed */}
      <div>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonPublicationCard key={i} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="modern-card" style={{ 
            padding: '48px 24px',
            textAlign: 'center'
          }}>
            <div style={{ 
              fontSize: '64px',
              marginBottom: '16px',
              opacity: 0.5
            }}>
              <FiMail />
            </div>
            <h3 className="modern-title" style={{ marginBottom: '8px' }}>
              Aucune publication
            </h3>
            <p className="modern-text-muted">
              Soyez le premier à partager une activité agricole!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {posts.map((post, index) => (
              <div
                key={post.id}
                style={{
                  animation: `fadeInUp 0.4s ease-out ${index * 0.1}s both`
                }}
              >
                <PostCard
                  post={post}
                  onLike={handleLike}
                  onUnlike={handleUnlike}
                  onRefresh={fetchPosts}
                  onUserProfileClick={onUserProfileClick}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Load More Button */}
      {!isLoading && posts.length > 0 && (
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button 
            onClick={fetchPosts}
            className="modern-btn modern-btn-secondary"
            style={{ padding: '12px 32px' }}
          >
            <FiRefreshCw />
            Charger plus de publications
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
