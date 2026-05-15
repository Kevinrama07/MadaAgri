import React from 'react';
import clsx from 'clsx';
import styles from './Card.module.css';

export const Card = ({
  children,
  variant = 'default',
  padding = 'medium',
  shadow = 'base',
  hoverable = false,
  glass = false,
  className,
  onClick,
  ...props
}) => {
  return (
    <div
      className={clsx(
        styles.card,
        styles[variant],
        styles[`padding-${padding}`],
        styles[`shadow-${shadow}`],
        {
          [styles.hoverable]: hoverable,
          [styles.glass]: glass,
          [styles.clickable]: onClick,
        },
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
