import React from 'react';
import clsx from 'clsx';
import styles from './Button.module.css';

export const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  onClick,
  type = 'button',
  className,
  ...props
}) => {
  return (
    <button
      type={type}
      className={clsx(
        styles.button,
        styles[variant],
        styles[size],
        {
          [styles.fullWidth]: fullWidth,
          [styles.disabled]: disabled,
          [styles.loading]: loading,
        },
        className
      )}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <span className={styles.spinner}>
          <svg className={styles.spinnerIcon} viewBox="0 0 24 24">
            <circle
              className={styles.spinnerCircle}
              cx="12"
              cy="12"
              r="10"
              fill="none"
              strokeWidth="3"
            />
          </svg>
        </span>
      )}
      {!loading && leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
      <span className={styles.content}>{children}</span>
      {!loading && rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
    </button>
  );
};

export default Button;
