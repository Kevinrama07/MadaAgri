/**
 * RoutesPage - Optimisation itinéraires
 */

import clsx from 'clsx';
import OptimisationItineraire from '../../../Carte/OptimisationItineraire';
import styles from '../../../../styles/Composants/TableauDeBord.module.css';

export default function RoutesPage() {
  return (
    <section className={clsx(styles['mg-panel'])}>
      <OptimisationItineraire />
    </section>
  );
}
