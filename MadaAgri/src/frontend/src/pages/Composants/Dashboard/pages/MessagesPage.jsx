/**
 * MessagesPage - Messagerie
 */

import clsx from 'clsx';
import Messagerie from '../../../Messages/Messagerie';
import styles from '../../../../styles/Composants/TableauDeBord.module.css';

export default function MessagesPage({ targetUserId }) {
  return (
    <section className={clsx(styles['mg-panel'])}>
      <Messagerie targetUserId={targetUserId} />
    </section>
  );
}
