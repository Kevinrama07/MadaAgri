import React from 'react';
import clsx from 'clsx';
import HomeFeed from './HomeFeed';
import RightSidebar from '../Composants/RightSidebar';
import styles from '../../styles/Publications/SocialFeed.module.css';

export default function SocialFeed({ onUserProfileClick }) {
  return (
    <div className={clsx(styles['social-feed-container'])}>
      {/* Center Column - Main Feed */}
      <div className={clsx(styles['feed-center'])}>
        <HomeFeed onUserProfileClick={onUserProfileClick} />
      </div>

      {/* Right Column - Sidebar Fixed */}
      <RightSidebar onUserProfileClick={onUserProfileClick} />
    </div>
  );
}
