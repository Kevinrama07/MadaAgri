import { useLoading } from '../contexts/LoadingContext';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import styles from './GlobalLoader.module.css';

export const GlobalLoader = () => {
  const { isLoading, progress } = useLoading();

  return (
    <AnimatePresence>
      {isLoading && (
        <>
          <motion.div
            className={clsx(styles['global-progress-bar'])}
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />

          <motion.div
            className={clsx(styles['global-loader-overlay'])}
            initial={{ opacity: 0 }}
            animate={{ opacity: progress > 50 ? 0.02 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        </>
      )}
    </AnimatePresence>
  );
};

export default GlobalLoader;
