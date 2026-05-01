import { useState, useRef } from 'react';
import clsx from 'clsx';
import { FiMapPin, FiCheck, FiPlus, FiTarget } from 'react-icons/fi';
import { useFadeIn, animatePopIn } from '../../lib/animations';
import styles from '../../styles/Composants/SuggestionCard.module.css';

export default function SuggestionCard({ user, isFollowing = false, onFollow, onUserProfileClick }) {
  const cardRef = useFadeIn();
  const followBtnRef = useRef(null);
  const [isFollowed, setIsFollowed] = useState(isFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    setIsLoading(true);
    // Animate button on follow
    if (followBtnRef.current) {
      animatePopIn(followBtnRef.current);
    }
    try {
      if (onFollow) {
        await onFollow(user.id);
      }
      setIsFollowed(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={clsx(styles['suggestion-card'])} ref={cardRef}>
      <div 
        className={clsx(styles['suggestion-content'])}
        onClick={() => onUserProfileClick && onUserProfileClick(user.id)}
        style={{ cursor: onUserProfileClick ? 'pointer' : 'default' }}
      >
        <img
          src={user.profile_image_url || '/src/images/avatar.gif'}
          alt={user.display_name}
          className={clsx(styles['suggestion-avatar'])}
        />

        <div className={clsx(styles['suggestion-info'])}>
          <h4 className={clsx(styles['suggestion-name'])}>{user.display_name || user.email}</h4>
          {user.region && (
            <p className={clsx(styles['suggestion-region'])}><FiMapPin style={{display: 'inline', marginRight: '4px'}} size={14} /> {user.region}</p>
          )}
          {user.culture && (
            <p className={clsx(styles['suggestion-culture'])}><FiTarget style={{display: 'inline', marginRight: '4px'}} size={14} /> {user.culture}</p>
          )}
          {user.farming_type && (
            <p className={clsx(styles['suggestion-badge'])}>{user.farming_type}</p>
          )}
        </div>
      </div>

      <button
        ref={followBtnRef}
        className={clsx(styles['follow-btn'], { [styles['following']]: isFollowed })}
        onClick={handleFollow}
        disabled={isLoading}
        title={isFollowed ? 'Suivi' : 'Suivre'}
      >
        {isLoading ? '...' : isFollowed ? (
          <>
            <FiCheck style={{display: 'inline', marginRight: '4px'}} size={14} />
            Suivi
          </>
        ) : (
          <>
            <FiPlus style={{display: 'inline', marginRight: '4px'}} size={14} />
            Suivre
          </>
        )}
      </button>
    </div>
  );
}
