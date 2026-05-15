/**
 * MessagesPage - Messagerie
 */

import clsx from 'clsx';
import Messagerie from '../../../Messages/Messagerie';
import styles from '../../../../styles/Composants/TableauDeBord.module.css';

export default function MessagesPage() {
  return (
    <section className={clsx(styles['mg-panel'])}>
      <Messagerie />
    </section>
  );
}
