import { motion } from 'framer-motion';
import clsx from 'clsx';
import styles from './PageTransition.module.css';

export const PageTransition = ({ 
  children, 
  options = {},
  type = 'fade' // 'fade', 'slide', 'scale'
}) => {
  const defaultVariants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slide: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
    },
  };

  const variants = defaultVariants[type] || defaultVariants.fade;
  const transition = { duration: 0.3, ease: 'easeInOut', ...options };

  return (
    <motion.div
      className={clsx(styles['page-transition'])}
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
      transition={transition}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
