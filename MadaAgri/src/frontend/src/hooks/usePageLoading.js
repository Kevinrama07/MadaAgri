import { useState, useCallback, useRef } from 'react';
import { useLoading } from '../contexts/LoadingContext';

export const usePageLoading = (autoStart = false) => {
  const [isLoading, setIsLoading] = useState(autoStart);
  const { startLoading: startGlobalLoading, completeLoading, hasShownSkeletons, markSkeletonsShown } = useLoading();
  const startTimeRef = useRef(null);
  const MIN_LOADING_DURATION = 2000; // 2 secondes

  const startLoading = useCallback(() => {
    setIsLoading(true);
    startTimeRef.current = Date.now();
    // Always show global loading bar
    startGlobalLoading();
  }, [startGlobalLoading]);

  const stopLoading = useCallback(() => {
    if (startTimeRef.current) {
      const elapsedTime = Date.now() - startTimeRef.current;
      const remainingTime = Math.max(0, MIN_LOADING_DURATION - elapsedTime);

      if (remainingTime > 0) {
        setTimeout(() => {
          setIsLoading(false);
          completeLoading();
        }, remainingTime);
      } else {
        // Si la durée minimale est déjà passée, cacher immédiatement
        setIsLoading(false);
        completeLoading();
      }
    } else {
      setIsLoading(false);
      completeLoading();
    }
  }, [completeLoading]);

  return {
    isLoading,
    setIsLoading,
    startLoading,
    stopLoading,
    hasShownSkeletons,
    markSkeletonsShown,
  };
};

export default usePageLoading;
