/**
 * UserProfilePage - Voir le profil d'un autre utilisateur
 */

import clsx from 'clsx';
import UserProfile from '../../../Utilisateurs/UserProfile';
import styles from '../../../../styles/Composants/TableauDeBord.module.css';

export default function UserProfilePage({ userId, onBack, onUserProfileClick }) {
  return (
    <section className={clsx(styles['mg-panel'])}>
      <UserProfile 
        userId={userId} 
        onBack={onBack} 
        onUserProfileClick={onUserProfileClick}
      />
    </section>
  );
}
