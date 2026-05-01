import React from 'react';
import clsx from 'clsx';

export const GlassCard = ({
  children,
  title,
  subtitle,
  icon,
  variant = 'default', // default | primary | floating | flat
  size = 'md', // sm | md | lg
  onClick,
  className = '',
  ...props
}) => {
  const variantClass = variant ? `glass-card-${variant}` : '';
  const sizeClass = size ? `glass-card-${size}` : '';

  return (
    <div
      className={clsx('glass-card', variantClass, sizeClass, className)}
      onClick={onClick}
      role="region"
      {...props}
    >
      {(title || icon) && (
        <div className="glass-card-header">
          {icon && <span className="glass-card-icon">{icon}</span>}
          <div className="glass-card-title-group">
            {title && <h3 className="glass-card-title">{title}</h3>}
            {subtitle && <p className="glass-card-subtitle">{subtitle}</p>}
          </div>
        </div>
      )}
      
      {children && (
        <div className="glass-card-body">
          {children}
        </div>
      )}
    </div>
  );
};

/**
 * GlassButton Component
 * =====================
 */
export const GlassButton = ({
  children,
  variant = 'default', // default | primary | secondary | danger
  size = 'md', // sm | md | lg
  icon,
  loading = false,
  disabled = false,
  onClick,
  className = '',
  ...props
}) => {
  const variantClass = variant ? `glass-btn-${variant}` : '';
  const sizeClass = size ? `glass-btn-${size}` : '';
  
  return (
    <button
      className={clsx('glass-btn', variantClass, sizeClass, className)}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="spinner"></span>
          Chargement...
        </>
      ) : (
        <>
          {icon && <span className="glass-btn-icon">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

/**
 * GlassInput Component
 * ====================
 */
export const GlassInput = ({
  label,
  error,
  hint,
  icon,
  variant = 'default',
  className = '',
  ...props
}) => {
  return (
    <div className={clsx('glass-input-group', className)}>
      {label && (
        <label className="glass-input-label">
          {label}
          {props.required && <span className="required">*</span>}
        </label>
      )}
      
      <div className="glass-input-wrapper">
        {icon && <span className="glass-input-icon">{icon}</span>}
        <input
          className={clsx('glass-input', { 'with-icon': icon }, { 'error': error })}
          {...props}
        />
      </div>
      
      {error && <span className="glass-input-error">{error}</span>}
      {hint && <span className="glass-input-hint">{hint}</span>}
    </div>
  );
};

/**
 * GlassGrid Component
 * ===================
 */
export const GlassGrid = ({
  children,
  columns = 'auto', // auto | 1 | 2 | 3 | 4
  gap = 'lg', // xs | sm | md | lg | xl
  className = '',
  ...props
}) => {
  const columnClass = columns === 'auto' ? 'glass-grid' : `glass-grid-${columns}`;
  const gapClass = `glass-gap-${gap}`;
  
  return (
    <div
      className={clsx(columnClass, gapClass, className)}
      role="generic"
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * GlassSection Component
 * ======================
 */
export const GlassSection = ({
  children,
  title,
  subtitle,
  compact = false,
  className = '',
  ...props
}) => {
  const sizeClass = compact ? 'glass-section compact' : 'glass-section';
  
  return (
    <section className={clsx(sizeClass, className)} {...props}>
      {(title || subtitle) && (
        <div className="glass-header">
          {title && <h2>{title}</h2>}
          {subtitle && <p className="subtitle">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
};

export default {
  GlassCard,
  GlassButton,
  GlassInput,
  GlassGrid,
  GlassSection,
};
