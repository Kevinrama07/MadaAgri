import React from 'react';
import clsx from 'clsx';
import styles from './Avatar.module.css';

export const Avatar = ({
  src,
  alt = 'Avatar',
  size = 'medium',
  initials,
  status,
  badge,
  className,
  ...props
}) => {
  const renderContent = () => {
    if (src) {
      return <img src={src} alt={alt} className={styles.image} />;
    }
    if (initials) {
      return <span className={styles.initials}>{initials}</span>;
    }
    return (
      <svg className={styles.placeholder} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    );
  };

  return (
    <div
      className={clsx(
        styles.avatar,
        styles[size],
        {
          [styles.hasStatus]: status,
        },
        className
      )}
      {...props}
    >
      {renderContent()}
      {status && (
        <span className={clsx(styles.status, styles[`status-${status}`])} />
      )}
      {badge && (
        <span className={styles.badge}>{badge}</span>
      )}
    </div>
  );
};

export default Avatar;
