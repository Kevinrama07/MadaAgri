import { useState, useRef, useEffect } from 'react';
import { FiMoreVertical, FiCornerDownLeft, FiEdit, FiTrash2, FiXCircle, FiCheck, FiClock } from 'react-icons/fi';
import { useAuth } from '../contexts/ContextAuthentification';
import { useFadeIn, animateLikeButton, animateCounter } from '../lib/animations';
import { dataApi } from '../lib/api';
import '../styles/SocialFeed.css';

export default function PostCard({ post, onLike, onUnlike, onRefresh, onUserProfileClick }) {
  const { user } = useAuth();
  const cardRef = useFadeIn();
  const likeButtonRef = useRef(null);
  const countRef = useRef(null);
  const [isLiked, setIsLiked] = useState(post.user_likes === 1);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const handleLike = async () => {
    try {
      if (!isLiked) {
        await onLike(post.id);
        setIsLiked(true);
        setLikesCount(likesCount + 1);
        if (likeButtonRef.current) {
          animateLikeButton(likeButtonRef.current);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUnlike = async () => {
    try {
      if (isLiked) {
        await onUnlike(post.id);
        setIsLiked(false);
        setLikesCount(Math.max(0, likesCount - 1));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleLike = () => {
    if (isLiked) {
      handleUnlike();
    } else {
      handleLike();
    }
  };

  const postDate = new Date(post.created_at);
  const timeAgo = getTimeAgo(postDate);

  function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)}j`;
    return date.toLocaleDateString('fr-FR');
  }

  // Load comments when showComments becomes true
  useEffect(() => {
    if (showComments && comments.length === 0 && !loadingComments) {
      loadComments();
    }
  }, [showComments]);

  async function loadComments() {
    setLoadingComments(true);
    try {
      const loadedComments = await dataApi.fetchPostComments(post.id);
      setComments(loadedComments || []);
    } catch (e) {
      console.error('Erreur chargement commentaires:', e);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  }

  async function handleAddComment() {
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const comment = await dataApi.createPostComment(post.id, newComment);
      // Add display_name from user context
      setComments([...comments, { ...comment, display_name: user?.display_name || user?.email || 'Anonyme' }]);
      setNewComment('');
    } catch (e) {
      console.error('Erreur envoi commentaire:', e);
    } finally {
      setSubmittingComment(false);
    }
  }

  const isOwnPost = user && user.id === post.user_id;

  return (
    <div className="instagram-post-card" ref={cardRef}>
      {/* Header - Profile Info */}
      <div className="instagram-header">
        <div 
          className="instagram-user-section"
          onClick={() => onUserProfileClick && onUserProfileClick(post.user_id)}
          style={{ cursor: onUserProfileClick ? 'pointer' : 'default' }}
        >
          <img
            src={post.profile_image_url || '/src/assets/avatar.gif'}
            alt={post.display_name}
            className="instagram-avatar"
          />
          <div className="instagram-user-info">
            <h3 className="instagram-username">{post.display_name || post.email}</h3>
            <span className="instagram-timestamp">{timeAgo}</span>
          </div>
        </div>

        <div className="instagram-menu-wrapper">
          <button
            className="instagram-menu-btn"
            onClick={() => setShowMenu(!showMenu)}
            title="Plus d'actions"
          >
            <FiMoreVertical />
          </button>
          {showMenu && (
            <div className="instagram-dropdown-menu">
              <button type="button" className="instagram-dropdown-item">
                <FiCornerDownLeft style={{marginRight: '8px'}} /> Épingler
              </button>
              {isOwnPost && (
                <>
                  <button type="button" className="instagram-dropdown-item">
                    <FiEdit style={{marginRight: '8px'}} /> Modifier
                  </button>
                  <button type="button" className="instagram-dropdown-item danger">
                    <FiTrash2 style={{marginRight: '8px'}} /> Supprimer
                  </button>
                </>
              )}
              <button type="button" className="instagram-dropdown-item">
                <FiXCircle style={{marginRight: '8px'}} /> Signaler
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content - Text */}
      <div className="instagram-content">
        <p className="instagram-text">{post.content}</p>
      </div>

      {/* Image */}
      {post.image_url && (
        <div className="instagram-image-container">
          <img src={post.image_url} alt="Post" className="instagram-image" />
        </div>
      )}

      {/* Actions - Like & Comment */}
      <div className="instagram-actions">
        <p
          ref={likeButtonRef}
          className={`instagram-like-btn ${isLiked ? 'liked' : ''}`}
          onClick={toggleLike}
          title={isLiked ? 'Retirer le like' : 'J\'aime'}
          aria-label={`${isLiked ? 'Contrairement aimé' : 'Aimer ce post'} - ${likesCount} likes`}
        >
          <span className={`instagram-heart ${isLiked ? 'liked' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`heart-svg ${isLiked ? 'filled' : ''}`}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </span>
          {likesCount > 0 && <span className="instagram-like-count">{likesCount}</span>}
        </p>

        <p
          className="instagram-comment-btn"
          onClick={() => setShowComments(!showComments)}
          title={showComments ? 'Masquer les commentaires' : 'Afficher les commentaires'}
          aria-label={`${showComments ? 'Masquer' : 'Afficher'} les ${post.comments_count || 0} commentaires`}
        >
          <span className="instagram-comment-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </span>
          {(post.comments_count || 0) > 0 && <span className="instagram-comment-count">{post.comments_count}</span>}
        </p>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="instagram-comments-section">
          {/* Comments List */}
          <div className="instagram-comments-list">
            {loadingComments ? (
              <div className="comments-loading">
                <span className="spinner-mini"></span>
                <p>Chargement...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="comments-empty">
                <p>Aucun commentaire pour le moment</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="instagram-comment-item">
                  <img 
                    src={comment.profile_image_url || '/src/assets/avatar.gif'} 
                    alt={comment.display_name} 
                    className="comment-avatar"
                  />
                  <div className="comment-content-wrapper">
                    <div className="comment-author">
                      <span className="comment-name">{comment.display_name || 'Anonyme'}</span>
                      <span className="comment-time">{getTimeAgo(new Date(comment.created_at))}</span>
                    </div>
                    <p className="comment-content">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Comment Form */}
          <div className="instagram-comment-form">
            <textarea
              className="comment-input"
              placeholder="Ajouter un commentaire..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows="2"
            />
            <button
              className="comment-submit-btn"
              onClick={handleAddComment}
              disabled={!newComment.trim() || submittingComment}
            >
              {submittingComment ? <FiClock style={{animation: 'spin 1s linear infinite'}} /> : <FiCheck />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
