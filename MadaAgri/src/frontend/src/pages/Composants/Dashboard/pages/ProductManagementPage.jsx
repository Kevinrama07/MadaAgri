/**
 * ProductManagementPage - Gestion des produits (fermiers)
 * Note: This wrapper is deprecated.
 */

import clsx from 'clsx';
import styles from '../../../../styles/Composants/TableauDeBord.module.css';

export default function ProductManagementPage() {
  return (
    <section className={clsx(styles['mg-panel'])}>
      <p>Gestion des produits</p>
    </section>
  );
}
