import { useState, useEffect } from 'react';
import { FiTarget } from 'react-icons/fi';
import { useAuth } from '../contexts/ContextAuthentification';
import { dataApi } from '../lib/api';
import { useSlideInRight } from '../lib/animations';
import SuggestionCard from './SuggestionCard';
import '../styles/SocialFeed.css';

export default function RightSidebar({ onUserProfileClick }) {
  const { user } = useAuth();
  const sidebarRef = useSlideInRight(0.6, 0.2);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [userStats, setUserStats] = useState({
    followers_count: user?.followers_count || 0,
    following_count: user?.following_count || 0,
    posts_count: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuggestions();
    fetchAllPostsAndCalculateStats();
  }, [user?.id]);

  async function fetchSuggestions() {
    setLoading(true);
    try {
      // Récupérer les vrais utilisateurs de la base de données
      const users = await dataApi.fetchUsers();
      
      // Filtrer pour éviter l'utilisateur courant
      const suggestions = users
        .filter(u => u.id !== user?.id)
        .slice(0, 5); // Limiter à 5 suggestions
      
      setSuggestedUsers(suggestions);
    } catch (e) {
      console.error('Erreur fetch utilisateurs:', e);
      // Si l'API échoue, afficher vide
      setSuggestedUsers([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAllPostsAndCalculateStats() {
    if (!user?.id) return;
    
    try {
      // Récupérer tous les posts
      const posts = await dataApi.fetchPosts({});
      setAllPosts(posts);
      
      // Compter les posts de l'utilisateur courant
      const userPostsCount = posts.filter(post => post.user_id === user.id).length;
      
      // Utiliser les données du user object si elles existent, sinon 0
      setUserStats({
        followers_count: user?.followers_count || 0,
        following_count: user?.following_count || 0,
        posts_count: userPostsCount
      });
    } catch (e) {
      console.error('Erreur fetch posts:', e);
      // Valeurs par défaut si erreur
      setUserStats({
        followers_count: user?.followers_count || 0,
        following_count: user?.following_count || 0,
        posts_count: 0
      });
    }
  }

  return (
    <aside className="right-sidebar" ref={sidebarRef}>
      {/* User Profile Card */}
      {user && (
        <div className="sidebar-section profile-section">
          <div className="profile-card">
            <img
              src={user.profile_image_url || '/src/assets/avatar.gif'}
              alt={user.display_name}
              className="profile-card-avatar"
            />

            <h3 className="profile-card-name">{user.display_name || user.email}</h3>

            {user.role === 'farmer' && (
              <span className="profile-badge">
                <FiTarget style={{display: 'inline', marginRight: '6px'}} size={16} />
                Agriculteur certifié
              </span>
            )}

            <div className="profile-card-stats">
              <div className="stat">
                <strong>{userStats.followers_count || 0}</strong>
                <span>Abonnés</span>
              </div>
              <div className="stat">
                <strong>{userStats.following_count || 0}</strong>
                <span>Suivis</span>
              </div>
              <div className="stat">
                <strong>{userStats.posts_count || 0}</strong>
                <span>Posts</span>
              </div>
            </div>

            <button className="edit-profile-btn">Éditer le profil</button>
          </div>
        </div>
      )}

      {/* Suggestions Section */}
      <div className="sidebar-section suggestions-section">
        <h3 className="sidebar-title">Suggestions pour vous</h3>

        {loading ? (
          <div className="suggestions-loading">Chargement des utilisateurs...</div>
        ) : suggestedUsers.length === 0 ? (
          <div className="suggestions-empty">
            <p>Aucun utilisateur à suggérer</p>
            <small style={{ fontSize: '11px', opacity: 0.7 }}>
              Revenez plus tard <FiTarget style={{display: 'inline', marginLeft: '4px'}} size={12} />
            </small>
          </div>
        ) : (
          <div className="suggestions-list">
            {suggestedUsers.map((suggestedUser) => (
              <SuggestionCard
                key={suggestedUser.id}
                user={suggestedUser}
                onFollow={(userId) => {
                  console.log('Suivi:', userId);
                }}
                onUserProfileClick={onUserProfileClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="sidebar-section info-section">
        <h4 className="sidebar-info-title">À propos de MadaAgri</h4>
        <p className="sidebar-info-text">
          Connectez-vous avec les agriculteurs de Madagascar, partagez vos cultures et développez votre réseau.
        </p>

        <div className="sidebar-links">
          <a href="#" className="sidebar-link">À propos</a>
          <a href="#" className="sidebar-link">Centre d'aide</a>
          <a href="#" className="sidebar-link">Conditions</a>
          <a href="#" className="sidebar-link">Confidentialité</a>
        </div>

        <p className="sidebar-copyright">
          © 2026 MadaAgri. Tous droits réservés.
        </p>
      </div>
    </aside>
  );
}
