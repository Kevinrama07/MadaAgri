/**
 * AgriculturePage - Analyse culture
 */

import clsx from 'clsx';
import AnalyseCulture from '../../../Cultures/AnalyseCulture';
import styles from '../../../../styles/Composants/TableauDeBord.module.css';

export default function AgriculturePage() {
  return (
    <section className={clsx(styles['mg-panel'])}>
      <AnalyseCulture />
    </section>
  );
}
