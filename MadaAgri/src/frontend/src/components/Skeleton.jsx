import { motion } from 'framer-motion';
import clsx from 'clsx';
import styles from './Skeleton.module.css';

export const SkeletonBox = ({ height = 20, width = '100%', className = '' }) => (
  <motion.div
    className={clsx('skeleton-box', className)}
    style={{ height: `${height}px`, width }}
    animate={{ 
      opacity: [0.5, 1, 0.5],
      scale: [1, 1.02, 1]
    }}
    transition={{ 
      duration: 2, 
      repeat: Infinity,
      ease: "easeInOut"
    }}
  />
);

export const SkeletonLine = ({ width = '100%' }) => (
  <SkeletonBox height={12} width={width} className={clsx(styles['skeleton-line'])} />
);

export const SkeletonTitle = ({ width = '60%' }) => (
  <SkeletonBox height={24} width={width} className={clsx(styles['skeleton-title'])} />
);

export const SkeletonAvatar = ({ size = 48 }) => (
  <motion.div
    className={clsx(styles['skeleton-avatar'])}
    style={{ width: `${size}px`, height: `${size}px` }}
    animate={{ 
      opacity: [0.5, 1, 0.5],
      scale: [1, 1.05, 1]
    }}
    transition={{ 
      duration: 2, 
      repeat: Infinity,
      ease: "easeInOut"
    }}
  />
);

export const SkeletonCard = () => (
  <motion.div 
    className={clsx(styles['skeleton-card'])}
    animate={{ 
      y: [0, -4, 0],
      boxShadow: [
        '0 2px 8px rgba(0, 0, 0, 0.06)',
        '0 8px 20px rgba(0, 0, 0, 0.12)',
        '0 2px 8px rgba(0, 0, 0, 0.06)'
      ]
    }}
    transition={{ 
      duration: 2, 
      repeat: Infinity,
      ease: "easeInOut"
    }}
  >
    <SkeletonBox height={200} width="100%" className={clsx(styles['skeleton-image'])} />
    <div className={clsx(styles['skeleton-content'])}>
      <SkeletonTitle width="80%" />
      <SkeletonLine width="100%" />
      <SkeletonLine width="60%" />
      <SkeletonBox height={40} width="100%" className={clsx(styles['skeleton-button'])} />
    </div>
  </motion.div>
);

export const SkeletonStat = () => (
  <motion.div 
    className={clsx(styles['skeleton-stat'])}
    animate={{ 
      y: [0, -3, 0],
      boxShadow: [
        '0 2px 8px rgba(0, 0, 0, 0.08)',
        '0 6px 16px rgba(0, 0, 0, 0.12)',
        '0 2px 8px rgba(0, 0, 0, 0.08)'
      ]
    }}
    transition={{ 
      duration: 2, 
      repeat: Infinity,
      ease: "easeInOut"
    }}
  >
    <SkeletonTitle width="40%" />
    <SkeletonBox height={32} width="60%" className={clsx(styles['skeleton-stat-value'])} />
    <SkeletonLine width="50%" />
  </motion.div>
);

export const SkeletonTableRow = ({ columns = 4 }) => (
  <motion.div 
    className={clsx(styles['skeleton-table-row'])}
    animate={{ 
      x: [0, 4, 0],
      opacity: [0.8, 1, 0.8]
    }}
    transition={{ 
      duration: 2, 
      repeat: Infinity,
      ease: "easeInOut"
    }}
  >
    {Array.from({ length: columns }).map((_, i) => (
      <SkeletonBox key={i} height={16} width={`${100 / columns - 2}%`} />
    ))}
  </motion.div>
);

export const SkeletonList = ({ count = 3, type = 'row' }) => (
  <motion.div 
    className={clsx(styles['skeleton-list'])}
    animate={{ 
      opacity: [0.85, 1, 0.85]
    }}
    transition={{ 
      duration: 2, 
      repeat: Infinity,
      ease: "easeInOut"
    }}
  >
    {Array.from({ length: count }).map((_, i) => (
      <motion.div 
        key={i} 
        className={clsx(styles['skeleton-list-item'])}
        animate={{ 
          y: [0, -2, 0]
        }}
        transition={{ 
          duration: 2 + (i * 0.1),
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {type === 'row' && <SkeletonTableRow />}
        {type === 'card' && <SkeletonCard />}
        {type === 'line' && (
          <>
            <SkeletonLine width="100%" />
            <SkeletonLine width="90%" />
          </>
        )}
      </motion.div>
    ))}
  </motion.div>
);

export const SkeletonPublicationCard = () => (
  <motion.div 
    className={clsx(styles['skeleton-publication-card'])}
    animate={{ 
      y: [0, -6, 0],
      boxShadow: [
        '0 4px 16px rgba(0, 0, 0, 0.1)',
        '0 12px 28px rgba(0, 0, 0, 0.15)',
        '0 4px 16px rgba(0, 0, 0, 0.1)'
      ]
    }}
    transition={{ 
      duration: 2, 
      repeat: Infinity,
      ease: "easeInOut"
    }}
  >
    <div className={clsx(styles['skeleton-pub-header'])}>
      <SkeletonAvatar size={64} />
      <div className={clsx(styles['skeleton-pub-user-info'])}>
        <SkeletonLine width="50%" />
        <SkeletonLine width="70%" />
        <SkeletonLine width="40%" />
      </div>
    </div>

    <div className={clsx(styles['skeleton-pub-content'])}>
      <SkeletonBox height={18} width="100%" className={clsx(styles['skeleton-pub-text'])} />
      <SkeletonBox height={18} width="100%" className={clsx(styles['skeleton-pub-text'])} />
      <SkeletonBox height={18} width="100%" className={clsx(styles['skeleton-pub-text'])} />
      <SkeletonBox height={18} width="85%" className={clsx(styles['skeleton-pub-text'])} />
    </div>

    <SkeletonBox height={500} width="100%" className={clsx(styles['skeleton-pub-image'])} />

    <div className={clsx(styles['skeleton-pub-footer'])}>
      <div className={clsx(styles['skeleton-pub-stats'])}>
        <SkeletonBox height={14} width="25%" className={clsx(styles['skeleton-pub-stat'])} />
        <SkeletonBox height={14} width="30%" className={clsx(styles['skeleton-pub-stat'])} />
      </div>
      <div className={clsx(styles['skeleton-pub-buttons'])}>
        <SkeletonBox height={40} width="22%" className={clsx(styles['skeleton-pub-btn'])} />
        <SkeletonBox height={40} width="22%" className={clsx(styles['skeleton-pub-btn'])} />
        <SkeletonBox height={40} width="22%" className={clsx(styles['skeleton-pub-btn'])} />
      </div>
    </div>
  </motion.div>
);

export default SkeletonBox;