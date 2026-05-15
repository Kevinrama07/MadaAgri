import clsx from 'clsx';
import Orders from '../../../Marketplace/Orders';
import styles from '../../../../styles/Composants/TableauDeBord.module.css';

export default function OrdersPage() {
  return (
    <section className={clsx(styles['mg-panel'])}>
      <Orders />
    </section>
  );
}
