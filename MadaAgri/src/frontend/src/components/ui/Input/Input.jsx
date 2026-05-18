import styles from './Input.module.css';

export function Input({
  label,
  error,
  helperText,
  icon,
  className = '',
  ...props
}) {
  const classes = [
    styles.wrapper,
    error ? styles.error : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.inputWrapper}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <input className={styles.input} {...props} />
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
      {helperText && !error && <span className={styles.helperText}>{helperText}</span>}
    </div>
  );
}
