import { motion } from 'framer-motion';
import clsx from 'clsx';
import { useReducedMotion } from '../lib/motion';
import styles from './Skeleton.module.css';

export const SkeletonBox = ({ height = 20, width = '100%', className = '', rounded = false }) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={clsx('skeleton-box', styles.skeletonBox, { [styles.rounded]: rounded }, className)}
      style={{ height: `${height}px`, width }}
    >
      {!prefersReducedMotion && <div className={styles.shimmer} />}
    </div>
  );
};

export const SkeletonLine = ({ width = '100%' }) => (
  <SkeletonBox height={14} width={width} className={styles.skeletonLine} rounded />
);

export const SkeletonTitle = ({ width = '60%' }) => (
  <SkeletonBox height={22} width={width} className={styles.skeletonTitle} rounded />
);

export const SkeletonHeading = ({ width = '40%' }) => (
  <SkeletonBox height={28} width={width} className={styles.skeletonHeading} rounded />
);

export const SkeletonAvatar = ({ size = 48 }) => (
  <SkeletonBox height={size} width={size} className={styles.skeletonAvatar} rounded />
);

export const SkeletonCircle = ({ size = 24 }) => (
  <SkeletonBox height={size} width={size} className={styles.skeletonCircle} rounded />
);

export const SkeletonCard = () => (
  <div className={styles.skeletonCard}>
    <SkeletonBox height={180} width="100%" className={styles.skeletonImage} />
    <div className={styles.skeletonContent}>
      <SkeletonTitle width="70%" />
      <SkeletonLine width="100%" />
      <SkeletonLine width="85%" />
      <div className={styles.skeletonCardFooter}>
        <SkeletonBox height={40} width="100%" className={styles.skeletonButton} rounded />
      </div>
    </div>
  </div>
);

export const SkeletonStat = () => (
  <div className={styles.skeletonStat}>
    <SkeletonCircle size={40} />
    <div className={styles.skeletonStatContent}>
      <SkeletonTitle width="50%" />
      <SkeletonBox height={28} width="70%" className={styles.skeletonStatValue} rounded />
    </div>
  </div>
);

export const SkeletonTableRow = ({ columns = 4 }) => (
  <div className={styles.skeletonTableRow}>
    {Array.from({ length: columns }).map((_, i) => (
      <SkeletonBox key={i} height={16} width={`${100 / columns - 4}%`} rounded />
    ))}
  </div>
);

export const SkeletonList = ({ count = 3, type = 'row' }) => (
  <div className={styles.skeletonList}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={styles.skeletonListItem}>
        {type === 'row' && <SkeletonTableRow />}
        {type === 'card' && <SkeletonCard />}
        {type === 'line' && (
          <>
            <SkeletonLine width="100%" />
            <SkeletonLine width="90%" />
          </>
        )}
      </div>
    ))}
  </div>
);

export const SkeletonPublicationCard = () => (
  <div className={styles.skeletonPublicationCard}>
    <div className={styles.skeletonPubHeader}>
      <SkeletonAvatar size={44} />
      <div className={styles.skeletonPubUserInfo}>
        <SkeletonLine width="45%" />
        <SkeletonLine width="30%" />
      </div>
    </div>
    <div className={styles.skeletonPubContent}>
      <SkeletonLine width="100%" />
      <SkeletonLine width="100%" />
      <SkeletonLine width="80%" />
    </div>
    <SkeletonBox height={320} width="100%" className={styles.skeletonPubImage} />
    <div className={styles.skeletonPubFooter}>
      <div className={styles.skeletonPubStats}>
        <SkeletonBox height={14} width="20%" rounded />
        <SkeletonBox height={14} width="25%" rounded />
      </div>
      <div className={styles.skeletonPubButtons}>
        <SkeletonBox height={36} width="30%" rounded />
        <SkeletonBox height={36} width="30%" rounded />
        <SkeletonBox height={36} width="30%" rounded />
      </div>
    </div>
  </div>
);

export const SkeletonDashboard = () => (
  <div className={styles.skeletonDashboard}>
    <div className={styles.skeletonDashboardHeader}>
      <SkeletonHeading width="35%" />
      <SkeletonBox height={40} width="200px" rounded />
    </div>
    <div className={styles.skeletonStatsGrid}>
      <SkeletonStat />
      <SkeletonStat />
      <SkeletonStat />
      <SkeletonStat />
    </div>
    <div className={styles.skeletonChartSection}>
      <SkeletonTitle width="25%" />
      <SkeletonBox height={280} width="100%" className={styles.skeletonChart} />
    </div>
    <div className={styles.skeletonRecentSection}>
      <SkeletonTitle width="30%" />
      <SkeletonList count={4} type="row" />
    </div>
  </div>
);

export const SkeletonProductGrid = ({ count = 6 }) => (
  <div className={styles.skeletonProductGrid}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const SkeletonProfile = () => (
  <div className={styles.skeletonProfile}>
    <SkeletonBox height={200} width="100%" className={styles.skeletonCover} />
    <div className={styles.skeletonProfileInfo}>
      <SkeletonAvatar size={80} />
      <div className={styles.skeletonProfileDetails}>
        <SkeletonHeading width="40%" />
        <SkeletonLine width="30%" />
        <SkeletonLine width="50%" />
      </div>
    </div>
    <div className={styles.skeletonProfileTabs}>
      <SkeletonBox height={44} width="120px" rounded />
      <SkeletonBox height={44} width="120px" rounded />
      <SkeletonBox height={44} width="120px" rounded />
    </div>
    <SkeletonProductGrid count={4} />
  </div>
);

export const SkeletonSettings = () => (
  <div className={styles.skeletonSettings}>
    <SkeletonHeading width="30%" />
    <div className={styles.skeletonSettingsSection}>
      <SkeletonTitle width="25%" />
      <SkeletonList count={3} type="line" />
    </div>
    <div className={styles.skeletonSettingsSection}>
      <SkeletonTitle width="30%" />
      <SkeletonList count={4} type="line" />
    </div>
  </div>
);

export const SkeletonMessages = () => (
  <div className={styles.skeletonMessages}>
    <div className={styles.skeletonMessagesSidebar}>
      <SkeletonBox height={44} width="100%" rounded />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className={styles.skeletonConversationItem}>
          <SkeletonAvatar size={40} />
          <div className={styles.skeletonConversationInfo}>
            <SkeletonLine width="60%" />
            <SkeletonLine width="80%" />
          </div>
        </div>
      ))}
    </div>
    <div className={styles.skeletonMessagesMain}>
      <div className={styles.skeletonMessagesHeader}>
        <SkeletonAvatar size={40} />
        <SkeletonLine width="30%" />
      </div>
      <div className={styles.skeletonMessagesList}>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBox key={i} height={40} width={i % 2 === 0 ? '60%' : '50%'} rounded className={i % 2 === 0 ? styles.skeletonMsgLeft : styles.skeletonMsgRight} />
        ))}
      </div>
      <SkeletonBox height={48} width="100%" rounded className={styles.skeletonMsgInput} />
    </div>
  </div>
);

export const SkeletonMarketplace = () => (
  <div className={styles.skeletonMarketplace}>
    <div className={styles.skeletonMarketplaceHeader}>
      <SkeletonHeading width="25%" />
      <SkeletonBox height={44} width="300px" rounded />
    </div>
    <SkeletonProductGrid count={8} />
  </div>
);

export const SkeletonLanding = () => (
  <div className={styles.skeletonLanding}>
    <SkeletonBox height={64} width="100%" className={styles.skeletonNavbar} />
    <SkeletonBox height={500} width="100%" className={styles.skeletonHero} />
    <div className={styles.skeletonFeatures}>
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  </div>
);

export default SkeletonBox;
