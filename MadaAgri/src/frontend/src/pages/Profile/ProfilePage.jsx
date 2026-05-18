import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card/Card';
import { Badge } from '../../components/ui/Badge/Badge';
import PostCard from '../Publications/PostCard';
import { useAuth } from '../../contexts/ContextAuthentification';
import { dataApi } from '../../lib/api';
import styles from './ProfilePage.module.css';

export default function ProfilePage() {
  const { user: currentUser } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const isOwnProfile = !id || id === currentUser?.id;

  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followStatus, setFollowStatus] = useState(null);
  const [error, setError] = useState(null);
  const [followError, setFollowError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        if (isOwnProfile) {
          setProfileUser(currentUser);
          const [userPosts, userProducts] = await Promise.all([
            dataApi.fetchPosts({ q: '', sort: 'recent' }).catch((err) => {
              console.error('[ProfilePage] Failed to fetch posts:', err);
              return [];
            }),
            dataApi.getMyProducts('all').catch((err) => {
              console.error('[ProfilePage] Failed to fetch products:', err);
              return [];
            }),
          ]);
          if (!cancelled) {
            setPosts(userPosts.filter((p) => p.user_id === currentUser?.id));
            setProducts(userProducts);
          }
        } else {
          const users = await dataApi.fetchUsers().catch((err) => {
            console.error('[ProfilePage] Failed to fetch users:', err);
            return [];
          });
          const found = users.find((u) => u.id === id);
          if (!found) {
            navigate('/dashboard', { replace: true });
            return;
          }
          if (!cancelled) setProfileUser(found);

          const [userPosts, userProducts] = await Promise.all([
            dataApi.fetchPosts({ q: '', sort: 'recent' }).catch((err) => {
              console.error('[ProfilePage] Failed to fetch posts:', err);
              return [];
            }),
            dataApi.fetchProducts().catch((err) => {
              console.error('[ProfilePage] Failed to fetch products:', err);
              return [];
            }),
          ]);
          if (!cancelled) {
            setPosts(userPosts.filter((p) => p.user_id === id));
            setProducts(userProducts.filter((p) => p.farmer_id === id));
          }

          try {
            const status = await dataApi.fetchFollowStatus(id);
            if (!cancelled) setFollowStatus(status);
          } catch (err) {
            console.error('[ProfilePage] Failed to fetch follow status:', err);
          }
        }
      } catch (err) {
        console.error('[ProfilePage] Failed to load profile:', err);
        if (!cancelled) setError(err.message || 'Erreur lors du chargement du profil');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [id, currentUser, isOwnProfile, navigate]);

  const handleFollow = async () => {
    if (!profileUser || isOwnProfile) return;
    setFollowError(null);
    try {
      if (followStatus?.is_following) {
        await dataApi.unfollowUser(profileUser.id);
        setFollowStatus({ ...followStatus, is_following: false });
      } else {
        await dataApi.followUser(profileUser.id);
        setFollowStatus({ ...followStatus, is_following: true });
      }
    } catch (err) {
      console.error('[ProfilePage] Failed to update follow status:', err);
      setFollowError(err.message || 'Erreur lors de l\'action');
    }
  };

  const handleLike = useCallback(async (postId) => {
    await dataApi.likePost(postId);
  }, []);

  const handleUnlike = useCallback(async (postId) => {
    await dataApi.unlikePost(postId);
  }, []);

  const handleUserProfileClick = useCallback((userId) => {
    if (userId && userId !== currentUser?.id) {
      navigate(`/profile/${userId}`);
    } else {
      navigate('/profile');
    }
  }, [currentUser, navigate]);

  if (loading || !profileUser) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <div className={styles.container}>
            <Card className={styles.loadingCard}>
              <p className={styles.loadingText}>Chargement...</p>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <div className={styles.container}>
            <Card className={styles.errorCard}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className={styles.errorText}>{error}</p>
              <button className={styles.retryBtn} onClick={() => window.location.reload()}>
                Réessayer
              </button>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const initials = (profileUser.display_name || profileUser.email || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const memberSince = profileUser.created_at
    ? new Date(profileUser.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : '';

  const userStats = {
    products: products.length,
    posts: posts.length,
    followers: followStatus?.followers_count || 0,
    following: followStatus?.following_count || 0,
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.container}>
          <Card className={styles.profileCard}>
            <div className={styles.profileHeader}>
              <div className={styles.avatar}>
                {profileUser.profile_image_url ? (
                  <img src={profileUser.profile_image_url} alt={profileUser.display_name} className={styles.avatarImage} />
                ) : (
                  initials
                )}
              </div>
              <div className={styles.profileInfo}>
                <div className={styles.nameRow}>
                  <h1 className={styles.name}>{profileUser.display_name || profileUser.email}</h1>
                  {profileUser.role === 'farmer' && <Badge variant="success" size="md" dot>Agriculteur</Badge>}
                  {profileUser.role === 'client' && <Badge variant="info" size="md" dot>Client</Badge>}
                </div>
                <p className={styles.location}>{profileUser.location || 'Madagascar'}</p>
                {memberSince && <p className={styles.member}>Membre depuis {memberSince}</p>}
              </div>
              {isOwnProfile ? (
                <Link to="/settings" className={styles.editBtn}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Modifier
                </Link>
              ) : (
                <div className={styles.followContainer}>
                  <button className={styles.followBtn} onClick={handleFollow}>
                    {followStatus?.is_following ? 'Suivi' : 'Suivre'}
                  </button>
                  {followError && <span className={styles.followError}>{followError}</span>}
                </div>
              )}
            </div>
            {profileUser.bio && <p className={styles.bio}>{profileUser.bio}</p>}
          </Card>

          <div className={styles.statsGrid}>
            {[
              { label: 'Produits', value: userStats.products },
              { label: 'Publications', value: userStats.posts },
              { label: 'Abonnés', value: userStats.followers },
              { label: 'Abonnements', value: userStats.following },
            ].map((stat, i) => (
              <Card key={i} className={styles.statCard}>
                <span className={styles.statValue}>{stat.value}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </Card>
            ))}
          </div>

          {posts.length > 0 && (
            <Card className={styles.listingsCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Publications</h2>
              </div>
              <div className={styles.postsList}>
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={handleLike}
                    onUnlike={handleUnlike}
                    onUserProfileClick={handleUserProfileClick}
                  />
                ))}
              </div>
            </Card>
          )}

          {products.length > 0 && (
            <Card className={styles.listingsCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Produits</h2>
                {isOwnProfile && <Link to="/marketplace" className={styles.cardLink}>Voir le marketplace</Link>}
              </div>
              <div className={styles.listingsGrid}>
                {products.map((product) => (
                  <Link to={`/marketplace/${product.id}`} key={product.id} className={styles.listingLink}>
                    <Card hover className={styles.listingCard}>
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className={styles.listingImage} loading="lazy" />
                      ) : (
                        <div className={styles.listingImagePlaceholder}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>
                      )}
                      <div className={styles.listingBody}>
                        <h3 className={styles.listingName}>{product.name}</h3>
                        <div className={styles.listingFooter}>
                          <span className={styles.listingPrice}>
                            {product.price} {product.unit}
                          </span>
                          <Badge variant={product.status === 'active' ? 'success' : 'default'} size="sm">
                            {product.status === 'active' ? 'Actif' : 'Brouillon'}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {posts.length === 0 && products.length === 0 && (
            <Card className={styles.listingsCard}>
              <div className={styles.emptyState}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <p className={styles.emptyText}>
                  {isOwnProfile ? 'Aucune publication ou produit pour le moment' : 'Cet utilisateur n\'a pas encore de contenu'}
                </p>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
