/**
 * ProductsPage - Liste des produits
 * Note: This wrapper is deprecated. Use the dashboard products route instead.
 */

import clsx from 'clsx';
import styles from '../../../../styles/Composants/TableauDeBord.module.css';
import ListeProduits from '../../../../pages/Produits/ListeProduits';

export default function ProductsPage() {
  return (
    <section className={clsx(styles['mg-panel'])}>
      <ListeProduits/>
    </section>
  );
}
