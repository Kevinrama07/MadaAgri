import styles from './Card.module.css';

export function Card({
  children,
  className = '',
  hover = false,
  padding = 'md',
  border = true,
  ...props
}) {
  const classes = [
    styles.card,
    hover ? styles.hover : '',
    styles[padding],
    border ? styles.border : styles.noBorder,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
