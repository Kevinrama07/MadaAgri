import styles from './Badge.module.css';

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  className = '',
  ...props
}) {
  const classes = [
    styles.badge,
    styles[variant],
    styles[size],
    dot ? styles.dot : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} {...props}>
      {dot && <span className={styles.dotIndicator} />}
      {children}
    </span>
  );
}
