import React from 'react';
import clsx from 'clsx';
import HomeFeed from './HomeFeed';
import LeftSidebar from '../Composants/LeftSidebar';
import RightSidebar from '../Composants/RightSidebar';
import styles from '../../styles/Publications/SocialFeed.module.css';

export default function SocialFeed({ onUserProfileClick }) {
  return (
    <div className={clsx(styles['social-feed-container'])}>
      {/* Left Column - Navigation Sidebar */}
      <LeftSidebar />

      {/* Center Column - Main Feed */}
      <div className={clsx(styles['feed-center'])}>
        <HomeFeed onUserProfileClick={onUserProfileClick} />
      </div>

      {/* Right Column - Suggestions Sidebar */}
      <RightSidebar onUserProfileClick={onUserProfileClick} />
    </div>
  );
}
