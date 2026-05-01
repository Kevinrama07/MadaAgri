import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { FiMoreVertical, FiCornerDownLeft, FiEdit, FiTrash2, FiXCircle, FiCheck, FiClock, FiMessageSquare } from 'react-icons/fi';
import { useAuth } from '../../contexts/ContextAuthentification';
import { useFadeIn, animateLikeButton, animateCounter } from '../../lib/animations';
import { dataApi } from '../../lib/api';
import styles from '../../styles/Publications/SocialFeed.module.css';

// Composant pour un commentaire individuel (récursif pour les réponses)
function CommentItem({ comment, onReply, onUserProfileClick, level = 0 }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replies, setReplies] = useState(comment.replies || []);
  const [showReplies, setShowReplies] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);

  const hasReplies = replies.length > 0 || comment.replies_count > 0;

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    try {
      const newReply = await dataApi.createPostCommentComment(comment.id, replyContent);
      setReplies([...replies, { ...newReply, replies: [] }]);
      setReplyContent('');
      setShowReplyForm(false);
    } catch (e) {
      console.error('Erreur envoi réponse:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const loadReplies = async () => {
    if (showReplies || loadingReplies) return;
    setLoadingReplies(true);
    try {
      const loadedReplies = await dataApi.fetchCommentReplies(comment.id);
      setReplies(loadedReplies || []);
      setShowReplies(true);
    } catch (e) {
      console.error('Erreur chargement réponses:', e);
    } finally {
      setLoadingReplies(false);
    }
  };

  return (
    <div className={clsx(styles['instagram-comment-item'], { [styles['comment-reply']]: level > 0 })}>
      <img 
        src={comment.profile_image_url || '/src/images/avatar.gif'} 
        alt={comment.display_name} 
        className={clsx(styles['comment-avatar'])}
        onClick={() => onUserProfileClick && onUserProfileClick(comment.user_id)}
        style={{ cursor: onUserProfileClick ? 'pointer' : 'default' }}
      />
      <div className={clsx(styles['comment-content-wrapper'])}>
        <div className={clsx(styles['comment-author'])}>
          <span 
            className={clsx(styles['comment-name'])}
            onClick={() => onUserProfileClick && onUserProfileClick(comment.user_id)}
            style={{ cursor: onUserProfileClick ? 'pointer' : 'default' }}
          >
            {comment.display_name || 'Anonyme'}
          </span>
          <span className={clsx(styles['comment-time'])}>{getTimeAgo(new Date(comment.created_at))}</span>
        </div>
        <p className={clsx(styles['comment-content'])}>{comment.content}</p>
        
        {/* Bouton répondre */}
        <button 
          className={clsx(styles['reply-btn'])}
          onClick={() => setShowReplyForm(!showReplyForm)}
        >
          <FiMessageSquare size={12} /> Répondre
        </button>

        {/* Afficher le nombre de réponses */}
        {(comment.replies_count > 0 || hasReplies) && !showReplies && (
          <button 
            className={clsx(styles['show-replies-btn'])}
            onClick={loadReplies}
          >
            {loadingReplies ? 'Chargement...' : `${comment.replies_count || replies.length} réponse(s)`}
          </button>
        )}

        {/* Formulaire de réponse */}
        {showReplyForm && (
          <div className={clsx(styles['reply-form'])}>
            <textarea
              className={clsx(styles['reply-input'])}
              placeholder="Écrire une réponse..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows="2"
            />
            <div className={clsx(styles['reply-form-actions'])}>
              <button 
                className={clsx(styles['cancel-reply-btn'])}
                onClick={() => setShowReplyForm(false)}
              >
                Annuler
              </button>
              <button 
                className={clsx(styles['submit-reply-btn'])}
                onClick={handleSubmitReply}
                disabled={!replyContent.trim() || submitting}
              >
                {submitting ? <FiClock style={{animation: 'spin 1s linear infinite'}} /> : 'Envoyer'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Réponses imbriquées */}
      {showReplies && replies.length > 0 && (
        <div className={clsx(styles['comment-replies'])}>
          {replies.map((reply) => (
            <CommentItem 
              key={reply.id} 
              comment={reply} 
              onReply={onReply}
              onUserProfileClick={onUserProfileClick}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'À l\'instant';
  if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)}j`;
  return date.toLocaleDateString('fr-FR');
}

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
    <div className={clsx(styles['instagram-post-card'])} ref={cardRef}>
      {/* Header - Profile Info */}
      <div className={clsx(styles['instagram-header'])}>
        <div 
          className={clsx(styles['instagram-user-section'])}
          onClick={() => onUserProfileClick && onUserProfileClick(post.user_id)}
          style={{ cursor: onUserProfileClick ? 'pointer' : 'default' }}
        >
          <img
            src={post.profile_image_url || '/src/images/avatar.gif'}
            alt={post.display_name}
            className={clsx(styles['instagram-avatar'])}
          />
          <div className={clsx(styles['instagram-user-info'])}>
            <h3 className={clsx(styles['instagram-username'])}>
              {post.display_name || post.email}
            </h3>
            <span className={clsx(styles['instagram-timestamp'])}>{timeAgo}</span>
          </div>
        </div>

        <div className={clsx(styles['instagram-menu-wrapper'])}>
          <button
            className={clsx(styles['instagram-menu-btn'])}
            onClick={() => setShowMenu(!showMenu)}
            title="Plus d'actions"
          >
            <FiMoreVertical />
          </button>
          {showMenu && (
            <div className={clsx(styles['instagram-dropdown-menu'])}>
              <button type="button" className={clsx(styles['instagram-dropdown-item'])}>
                <FiCornerDownLeft style={{marginRight: '8px'}} /> Épingler
              </button>
              {isOwnPost && (
                <>
                  <button type="button" className={clsx(styles['instagram-dropdown-item'])}>
                    <FiEdit style={{marginRight: '8px'}} /> Modifier
                  </button>
                  <button type="button" className={clsx(styles['instagram-dropdown-item'], styles['danger'])}>
                    <FiTrash2 style={{marginRight: '8px'}} /> Supprimer
                  </button>
                </>
              )}
              <button type="button" className={clsx(styles['instagram-dropdown-item'])}>
                <FiXCircle style={{marginRight: '8px'}} /> Signaler
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content - Text */}
      <div className={clsx(styles['instagram-content'])}>
        <p className={clsx(styles['instagram-text'])}>{post.content}</p>
      </div>

      {/* Image */}
      {post.image_url && (
        <div className={clsx(styles['instagram-image-container'])}>
          <img src={post.image_url} alt="Post" className={clsx(styles['instagram-image'])} />
        </div>
      )}

      {/* Actions - Like & Comment */}
      <div className={clsx(styles['instagram-actions'])}>
        <p
          ref={likeButtonRef}
          className={clsx(styles['instagram-like-btn'], { [styles['liked']]: isLiked })}
          onClick={toggleLike}
          title={isLiked ? 'Retirer le like' : 'J\'aime'}
          aria-label={`${isLiked ? 'Contrairement aimé' : 'Aimer ce post'} - ${likesCount} likes`}
        >
          <span className={clsx(styles['instagram-heart'], { [styles['liked']]: isLiked })}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={clsx(styles['heart-svg'], { [styles['filled']]: isLiked })}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </span>
          {likesCount > 0 && <span className={clsx(styles['instagram-like-count'])}>{likesCount}</span>}
        </p>

        <p
          className={clsx(styles['instagram-comment-btn'])}
          onClick={() => setShowComments(!showComments)}
          title={showComments ? 'Masquer les commentaires' : 'Afficher les commentaires'}
          aria-label={`${showComments ? 'Masquer' : 'Afficher'} les ${post.comments_count || 0} commentaires`}
        >
          <span className={clsx(styles['instagram-comment-icon'])}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </span>
          {(post.comments_count || 0) > 0 && <span className={clsx(styles['instagram-comment-count'])}>{post.comments_count}</span>}
        </p>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className={clsx(styles['instagram-comments-section'])}>
          {/* Comments List */}
          <div className={clsx(styles['instagram-comments-list'])}>
            {loadingComments ? (
              <div className={clsx(styles['comments-loading'])}>
                <span className={clsx(styles['spinner-mini'])}></span>
                <p>Chargement...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className={clsx(styles['comments-empty'])}>
                <p>Aucun commentaire pour le moment</p>
              </div>
            ) : (
              comments.map((comment) => (
                <CommentItem 
                  key={comment.id} 
                  comment={comment} 
                  onReply={() => {}}
                  onUserProfileClick={onUserProfileClick}
                />
              ))
            )}
          </div>

          {/* Add Comment Form */}
          <div className={clsx(styles['instagram-comment-form'])}>
            <textarea
              className={clsx(styles['comment-input'])}
              placeholder="Ajouter un commentaire..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows="2"
            />
            <button
              className={clsx(styles['comment-submit-btn'])}
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
