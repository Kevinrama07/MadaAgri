import { useState, useEffect, useRef } from 'react';
import { FiTarget } from 'react-icons/fi';
import clsx from 'clsx';
import { SkeletonCard, SkeletonAvatar } from '../../components/Skeleton';
import { useAuth } from '../../contexts/ContextAuthentification';
import { dataApi } from '../../lib/api';
import { useSlideInRight } from '../../lib/animations';
import SuggestionCard from './SuggestionCard';
import styles from '../../styles/Composants/RightSidebar.module.css';

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
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    // Debounce les appels fetch pour éviter les requêtes trop fréquentes
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions();
      fetchAllPostsAndCalculateStats();
    }, 500); // Attendre 500ms avant d'appeler

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
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
      // Si l'API échoue (y compris 429), afficher vide mais continuer
      // Le retry automatique gerera les 429
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
    <aside className={clsx(styles['right-sidebar'])} ref={sidebarRef}>
      {user && (
        <div className={clsx(styles['sidebar-section'])}>
          <div className={clsx(styles['profile-card'])}>
            <img
              src={user.profile_image_url || '/src/images/avatar.gif'}
              alt={user.display_name}
              className={clsx(styles['profile-card-avatar'])}
            />

            <h3 className={clsx(styles['profile-card-name'])}>{user.display_name || user.email}</h3>

            <div className={clsx(styles['profile-card-stats'])}>
              <div className={clsx(styles['stat'])}>
                <strong>{userStats.followers_count || 0}</strong>
                <span>Abonnés</span>
              </div>
              <div className={clsx(styles['stat'])}>
                <strong>{userStats.following_count || 0}</strong>
                <span>Suivis</span>
              </div>
              <div className={clsx(styles['stat'])}>
                <strong>{userStats.posts_count || 0}</strong>
                <span>Posts</span>
              </div>
            </div>

            <button className={clsx(styles['edit-profile-btn'])}>Éditer le profil</button>
          </div>
        </div>
      )}

      <div className={clsx(styles['sidebar-section'])}>
        <h3 className={clsx(styles['sidebar-title'])}>Suggestions pour vous</h3>

        {loading ? (
          <div className={clsx(styles['suggestions-list'])}>
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : suggestedUsers.length === 0 ? (
          <div className={clsx(styles['suggestions-empty'])}>
            <p>Aucun utilisateur à suggérer</p>
            <small style={{ fontSize: '11px', opacity: 0.7 }}>
              Revenez plus tard <FiTarget style={{display: 'inline', marginLeft: '4px'}} size={12} />
            </small>
          </div>
        ) : (
          <div className={clsx(styles['suggestions-list'])}>
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

      <div className={clsx(styles['sidebar-section'])}>
        <h4 className={clsx(styles['sidebar-info-title'])}>À propos de MadaAgri</h4>
        <p className={clsx(styles['sidebar-info-text'])}>
          Connectez-vous avec les agriculteurs de Madagascar, partagez vos cultures et développez votre réseau.
        </p>

        <div className={clsx(styles['sidebar-links'])}>
          <a href="#" className={clsx(styles['sidebar-link'])}>À propos</a>
          <a href="#" className={clsx(styles['sidebar-link'])}>Centre d'aide</a>
          <a href="#" className={clsx(styles['sidebar-link'])}>Conditions</a>
          <a href="#" className={clsx(styles['sidebar-link'])}>Confidentialité</a>
        </div>

        <p className={clsx(styles['sidebar-copyright'])}>
          © 2026 MadaAgri. Tous droits réservés.
        </p>
      </div>
    </aside>
  );
}
