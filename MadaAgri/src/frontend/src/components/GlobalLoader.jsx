import { useLoading } from '../contexts/LoadingContext';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import styles from '../styles/ui/GlobalLoader.module.css';

export const GlobalLoader = () => {
  const { isLoading, progress } = useLoading();

  return (
    <AnimatePresence>
      {isLoading && (
        <>
          <motion.div
            className={clsx(styles.globalProgressBar)}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progress / 100 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          />
          <motion.div
            className={clsx(styles.globalLoaderOverlay)}
            initial={{ opacity: 0 }}
            animate={{ opacity: progress > 50 ? 0.02 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        </>
      )}
    </AnimatePresence>
  );
};

export default GlobalLoader;
