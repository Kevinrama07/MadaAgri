import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import { dataApi } from '../../../../lib/api';
import { useAuth } from '../../../../contexts/ContextAuthentification';
import PostCard from '../../../Publications/PostCard';
import styles from './PostDetailPage.module.css';

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      navigate('/dashboard', { replace: true });
      return;
    }
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    setLoading(true);
    setError(null);
    try {
      const found = await dataApi.fetchPostById(id);
      if (found) {
        setPost(found);
      } else {
        setError('Publication non trouvée');
      }
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = useCallback(async (postId) => {
    await dataApi.likePost(postId);
    setPost((prev) => prev ? { ...prev, user_likes: 1, likes_count: (prev.likes_count || 0) + 1 } : null);
  }, []);

  const handleUnlike = useCallback(async (postId) => {
    await dataApi.unlikePost(postId);
    setPost((prev) => prev ? { ...prev, user_likes: 0, likes_count: Math.max(0, (prev.likes_count || 0) - 1) } : null);
  }, []);

  const handleUserProfileClick = useCallback((userId) => {
    if (userId === currentUser?.id) {
      navigate('/profile');
    } else {
      navigate(`/profile/${userId}`);
    }
  }, [currentUser, navigate]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}><FiArrowLeft /></button>
          <h2>Chargement...</h2>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}><FiArrowLeft /></button>
          <h2>Publication</h2>
        </div>
        <div className={styles.errorState}>{error || 'Publication non trouvée'}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}><FiArrowLeft /></button>
        <h2>Publication</h2>
      </div>
      <div className={styles.postContainer}>
        <PostCard
          post={post}
          onLike={handleLike}
          onUnlike={handleUnlike}
          onRefresh={fetchPost}
          onUserProfileClick={handleUserProfileClick}
        />
      </div>
    </div>
  );
}
