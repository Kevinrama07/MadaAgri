/**
 * PublicationPage - Créer une publication
 */

import clsx from 'clsx';
import FormulairePublication from '../../../Publications/FormulairePublication';
import styles from '../../../../styles/Composants/TableauDeBord.module.css';

export default function PublicationPage({ onCreated }) {
  return (
    <section className={clsx(styles['mg-panel'])}>
      <FormulairePublication onCreated={onCreated} />
    </section>
  );
}
