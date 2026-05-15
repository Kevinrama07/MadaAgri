/**
 * ReceivedOrdersPage - Commandes reçues (pour fermiers)
 */

import clsx from 'clsx';
import ReceivedOrders from '../../../Marketplace/ReceivedOrders';
import styles from '../../../../styles/Composants/TableauDeBord.module.css';

export default function ReceivedOrdersPage() {
  return (
    <section className={clsx(styles['mg-panel'])}>
      <ReceivedOrders />
    </section>
  );
}
