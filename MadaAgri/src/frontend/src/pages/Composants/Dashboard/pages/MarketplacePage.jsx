/**
 * MarketplacePage - Marketplace des produits
 * Note: This wrapper is deprecated. Use the standalone MarketplacePage instead.
 */

import clsx from 'clsx';
import styles from '../../../../styles/Composants/TableauDeBord.module.css';

export default function MarketplacePage() {
  return (
    <section className={clsx(styles['mg-panel'])}>
      <p>Marketplace - Utilisez la page standalone</p>
    </section>
  );
}
