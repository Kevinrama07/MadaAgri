import { motion, AnimatePresence } from 'framer-motion';
import { MOTION_PRESETS, useReducedMotion } from '../lib/motion';
import styles from './PageTransition.module.css';

export const PageTransition = ({
  children,
  type = 'pageEnter',
  className,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const preset = MOTION_PRESETS[type] || MOTION_PRESETS.pageEnter;

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={`${styles.pageTransition} ${className || ''}`}
      initial={preset.initial}
      animate={preset.animate}
      exit={preset.exit}
      transition={preset.transition}
    >
      {children}
    </motion.div>
  );
};

export const AnimatedPresenceWrapper = ({ children, location }) => (
  <AnimatePresence mode="wait" initial={false}>
    <motion.div
      key={location?.pathname || 'default'}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      style={{ minHeight: '100%' }}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);

export default PageTransition;
