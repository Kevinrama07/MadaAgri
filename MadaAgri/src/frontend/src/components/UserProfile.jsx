import { useEffect, useState } from 'react';
import { FiArrowLeft, FiMail, FiPhone, FiUserPlus, FiUserCheck, FiUserX } from 'react-icons/fi';
import { useAuth } from '../contexts/ContextAuthentification';
import { dataApi } from '../lib/api';
import PostCard from './PostCard';
import '../styles/UserProfile.css';

export default function UserProfile({ userId, onBack, onUserProfileClick }) {
  console.log('[UserProfile] Rendu avec userId:', userId);
  const { user: currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      console.warn('[UserProfile] userId is undefined or null');
      setError('ID utilisateur manquant');
      setLoading(false);
      return;
    }
    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function fetchUserProfile() {
    setLoading(true);
    setError(null);
    try {
      console.log('[UserProfile] Chargement profil pour userId:', userId);
      const profileData = await dataApi.fetchUserProfile(userId);
      console.log('[UserProfile] Données reçues:', profileData);
      
      setUserProfile(profileData.user);
      
      const posts = await dataApi.fetchUserPosts(userId);
      console.log('[UserProfile] Posts reçus:', posts);
      setUserPosts(posts || []);

      // Check if current user is following this user
      try {
        const allFollowing = await dataApi.fetchNetworkSuggestions();
        const following = allFollowing && allFollowing.some && allFollowing.some(u => u.id === userId);
        setIsFollowing(following || false);
      } catch (followErr) {
        console.warn('Erreur chargement suivi:', followErr);
        setIsFollowing(false);
      }
    } catch (err) {
      console.error('Erreur chargement profil:', err);
      setError(err.message || 'Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  }

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await dataApi.unfollowUser(userId);
        setIsFollowing(false);
      } else {
        await dataApi.followUser(userId);
        setIsFollowing(true);
      }
    } catch (err) {
      console.error('Erreur suivi:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await dataApi.likePost(postId);
      setUserPosts(userPosts.map(p => 
        p.id === postId 
          ? { ...p, user_likes: 1, likes_count: (p.likes_count || 0) + 1 }
          : p
      ));
    } catch (err) {
      console.error('Erreur like:', err);
    }
  };

  const handleUnlike = async (postId) => {
    try {
      await dataApi.unlikePost(postId);
      setUserPosts(userPosts.map(p => 
        p.id === postId 
          ? { ...p, user_likes: 0, likes_count: Math.max(0, (p.likes_count || 0) - 1) }
          : p
      ));
    } catch (err) {
      console.error('Erreur unlike:', err);
    }
  };

  const roleDisplay = {
    farmer: 'Agriculteur',
    client: 'Client',
    trader: 'Commerçant'
  };

  if (loading) {
    return (
      <div className="user-profile-container">
        <div className="user-profile-header">
          <button className="user-profile-back-btn" onClick={onBack} title="Retour">
            <FiArrowLeft />
          </button>
          <h2>Chargement...</h2>
        </div>
        <div className="loading-spinner">Chargement du profil...</div>
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="user-profile-container">
        <div className="user-profile-header">
          <button className="user-profile-back-btn" onClick={onBack} title="Retour">
            <FiArrowLeft />
          </button>
          <h2>Profil utilisateur</h2>
        </div>
        <div className="error-message">
          {error || 'Utilisateur non trouvé'}
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser.id === userId;

  // DEBUG: Log render state
  console.log('[UserProfile] Render state:', { 
    loading,
    error, 
    hasUserProfile: !!userProfile,
    isOwnProfile,
    userProfile: userProfile ? {
      id: userProfile.id,
      display_name: userProfile.display_name,
      role: userProfile.role,
      email: userProfile.email
    } : null
  });

  return (
    <div className="user-profile-container">
      <div className="user-profile-header">
        <button className="user-profile-back-btn" onClick={onBack} title="Retour">
          <FiArrowLeft />
        </button>
        <h2>{userProfile.display_name}</h2>
      </div>

      <div className="user-profile-card">
        {/* Profile Picture and Main Info */}
        <div className="profile-top-section">
          <img
            src={userProfile.profile_image_url || '/src/assets/avatar.gif'}
            alt={userProfile.display_name}
            className="profile-picture"
          />

          <div className="profile-info">
            <h1 className="profile-name">{userProfile.display_name}</h1>
            <div className="profile-role">
              {roleDisplay[userProfile.role] || userProfile.role}
            </div>

            {userProfile.bio && (
              <p className="profile-bio">{userProfile.bio}</p>
            )}

            {/* Contacts Section */}
            <div className="profile-contacts">
              <div className="contact-item">
                <FiMail size={18} />
                <span>{userProfile.email || 'Non disponible'}</span>
              </div>
              {userProfile.phone && (
                <div className="contact-item">
                  <FiPhone size={18} />
                  <span>{userProfile.phone}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {!isOwnProfile && (
              <div className="profile-actions">
                <button className="action-btn add-btn" title="Ajouter">
                  <FiUserPlus size={18} />
                  <span>Ajouter</span>
                </button>
                <button
                  className={`action-btn ${isFollowing ? 'following-btn' : 'follow-btn'}`}
                  onClick={handleFollow}
                  disabled={followLoading}
                  title={isFollowing ? 'Arrêter de suivre' : 'Suivre'}
                >
                  {isFollowing ? (
                    <>
                      <FiUserCheck size={18} />
                      <span>Suivi</span>
                    </>
                  ) : (
                    <>
                      <FiUserX size={18} />
                      <span>Suivre</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Publications Section */}
        <div className="profile-publications-section">
          <h3 className="publications-title">
            Publications ({userPosts.length})
          </h3>

          {userPosts.length === 0 ? (
            <div className="no-posts-message">
              <p>Aucune publication pour le moment</p>
            </div>
          ) : (
            <div className="posts-grid">
              {userPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={handleLike}
                  onUnlike={handleUnlike}
                  onRefresh={fetchUserProfile}
                  onUserProfileClick={onUserProfileClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
