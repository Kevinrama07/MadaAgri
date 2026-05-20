import React from 'react';
import clsx from 'clsx';
import HomeFeed from './HomeFeed';
import LeftSidebar from '../Composants/LeftSidebar';
import RightSidebar from '../Composants/RightSidebar';
import styles from './SocialFeed.module.css';

export default function SocialFeed({ onUserProfileClick }) {
  return (
    <div className={clsx(styles['social-feed-container'])}>
      <div className={styles['feed-left']}>
        <LeftSidebar />
      </div>

      <div className={clsx(styles['feed-center'])}>
        <HomeFeed onUserProfileClick={onUserProfileClick} />
      </div>

      <div className={styles['feed-right']}>
        <RightSidebar onUserProfileClick={onUserProfileClick} />
      </div>
    </div>
  );
}
