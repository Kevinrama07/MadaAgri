import { useState } from 'react';
import clsx from 'clsx';
import SocialFeed from '../../../Publications/SocialFeed';
import styles from '../../../../styles/Composants/TableauDeBord.module.css';

export default function FeedPage({ onUserProfileClick }) {
  return (
    <section className={clsx(styles['mg-panel'])}>
      <SocialFeed onUserProfileClick={onUserProfileClick} />
    </section>
  );
}
