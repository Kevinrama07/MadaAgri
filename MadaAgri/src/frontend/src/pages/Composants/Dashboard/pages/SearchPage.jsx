/**
 * SearchPage - Recherche globale
 */

import clsx from 'clsx';
import Recherche from '../../Recherche';
import styles from '../../../../styles/Composants/TableauDeBord.module.css';

export default function SearchPage({ searchValue, onUserProfileClick }) {
  return (
    <section className={clsx(styles['mg-panel'])}>
      <Recherche onUserProfileClick={onUserProfileClick} />
    </section>
  );
}
