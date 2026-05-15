/**
 * NetworkPage - Réseau de collaborateurs
 */

import clsx from 'clsx';
import InvitationsCollaborateurs from '../../../Utilisateurs/InvitationsCollaborateurs';
import styles from '../../../../styles/Composants/TableauDeBord.module.css';

export default function NetworkPage({ onUserProfileClick }) {
  return (
    <section className={clsx(styles['mg-panel'])}>
      <InvitationsCollaborateurs onUserProfileClick={onUserProfileClick} />
    </section>
  );
}
