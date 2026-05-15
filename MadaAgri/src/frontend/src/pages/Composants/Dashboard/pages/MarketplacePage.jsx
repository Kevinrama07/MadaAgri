/**
 * MarketplacePage - Marketplace des produits
 */

import clsx from 'clsx';
import Marketplace from '../../../Marketplace/Marketplace';
import styles from '../../../../styles/Composants/TableauDeBord.module.css';

export default function MarketplacePage({ onUserProfileClick }) {
  return (
    <section className={clsx(styles['mg-panel'])}>
      <Marketplace onUserProfileClick={onUserProfileClick} />
    </section>
  );
}
