/**
 * ProductManagementPage - Gestion des produits (fermiers)
 */

import clsx from 'clsx';
import GestionProduits from '../../../Produits/GestionProduits';
import styles from '../../../../styles/Composants/TableauDeBord.module.css';

export default function ProductManagementPage() {
  return (
    <section className={clsx(styles['mg-panel'])}>
      <GestionProduits />
    </section>
  );
}
