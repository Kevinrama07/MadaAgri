import React from 'react';
import HomeFeed from './HomeFeed';
import RightSidebar from './RightSidebar';
import '../styles/SocialFeed.css';

/**
 * SocialFeed - 3-Column Layout Wrapper
 * 
 * Combines HomeFeed (center) and RightSidebar (right) into a
 * responsive 3-column layout with Navigation on the left.
 * 
 * Layout:
 * - Desktop: Navigation (280px) | HomeFeed (1fr) | RightSidebar (340px)
 * - Tablet: HomeFeed (1fr) | RightSidebar (340px)
 * - Mobile: Single column (full width)
 */
export default function SocialFeed({ onUserProfileClick }) {
  return (
    <div className="social-feed-container">
      {/* Center Column - Main Feed */}
      <div className="feed-center">
        <HomeFeed onUserProfileClick={onUserProfileClick} />
      </div>

      {/* Right Column - Sidebar */}
      <RightSidebar onUserProfileClick={onUserProfileClick} />
    </div>
  );
}
