import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const LoadingContext = createContext(null);

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasShownSkeletons, setHasShownSkeletons] = useState(false);

  // Mark that skeletons have been shown
  const markSkeletonsShown = useCallback(() => {
    if (!hasShownSkeletons) {
      setHasShownSkeletons(true);
    }
  }, [hasShownSkeletons]);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setProgress(10);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 20;
      });
    }, 800);

    return () => clearInterval(interval);
  }, []);

  const completeLoading = useCallback(() => {
    setProgress(100);
    setTimeout(() => {
      setIsLoading(false);
      setProgress(0);
    }, 600);
  }, []);

  const resetLoading = useCallback(() => {
    setIsLoading(false);
    setProgress(0);
  }, []);

  const value = {
    isLoading,
    progress,
    hasShownSkeletons,
    markSkeletonsShown,
    startLoading,
    completeLoading,
    resetLoading,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
};

export const useWithLoading = () => {
  const { startLoading, completeLoading } = useLoading();

  return useCallback(async (asyncFn) => {
    startLoading();
    try {
      const result = await asyncFn();
      return result;
    } finally {
      completeLoading();
    }
  }, [startLoading, completeLoading]);
};