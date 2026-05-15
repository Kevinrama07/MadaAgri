/**
 * ProductsPage - Liste des produits
 */

import clsx from 'clsx';
import ListeProduits from '../../../Produits/ListeProduits';
import styles from '../../../../styles/Composants/TableauDeBord.module.css';

export default function ProductsPage({ products, loading }) {
  return (
    <section className={clsx(styles['mg-panel'])}>
      <ListeProduits products={products} loading={loading} />
    </section>
  );
}
