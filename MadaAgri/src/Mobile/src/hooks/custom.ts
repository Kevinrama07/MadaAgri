
import { useRef, useEffect, useCallback, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

export const useThrottle = <T,>(value: T, interval: number): T => {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdated = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    if (now >= lastUpdated.current + interval) {
      lastUpdated.current = now;
      setThrottledValue(value);
    }
  }, [value, interval]);

  return throttledValue;
};

export const usePagination = (initialPage: number = 1, pageSize: number = 20) => {
  const [page, setPage] = useState(initialPage);
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async (fetchFn: (page: number) => Promise<any[]>) => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const newItems = await fetchFn(page);
      if (newItems.length < pageSize) {
        setHasMore(false);
      }
      setItems((prev) => [...prev, ...newItems]);
      setPage((prev) => prev + 1);
    } finally {
      setIsLoading(false);
    }
  }, [page, isLoading, hasMore, pageSize]);

  const reset = useCallback(() => {
    setItems([]);
    setPage(initialPage);
    setHasMore(true);
  }, [initialPage]);

  return { items, page, isLoading, hasMore, loadMore, reset, setItems };
};

export const usePullToRefresh = (onRefresh: () => Promise<void>) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  return { refreshing, handleRefresh };
};

export const useErrorHandler = () => {
  const [error, setError] = useState<string | null>(null);

  const showError = useCallback((message: string, duration: number = 3000) => {
    setError(message);
    setTimeout(() => setError(null), duration);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, showError, clearError };
};

export const useInfiniteScroll = (
  onLoadMore: () => Promise<void>,
  threshold: number = 0.8
) => {
  const [isLoading, setIsLoading] = useState(false);
  const canLoadMore = useRef(true);

  const handleEndReached = useCallback(async () => {
    if (isLoading || !canLoadMore.current) return;

    setIsLoading(true);
    try {
      await onLoadMore();
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, onLoadMore]);

  const setCanLoadMore = useCallback((value: boolean) => {
    canLoadMore.current = value;
  }, []);

  return { isLoading, handleEndReached, setCanLoadMore };
};

export const useLoadingState = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startLoading = useCallback(() => {
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const startRefreshing = useCallback(() => {
    setIsRefreshing(true);
  }, []);

  const stopRefreshing = useCallback(() => {
    setIsRefreshing(false);
  }, []);

  return {
    isLoading,
    isRefreshing,
    startLoading,
    stopLoading,
    startRefreshing,
    stopRefreshing,
  };
};

export const useResponsive = () => {
  const { spacing } = useTheme().theme;

  return {
    spacing,
    isMobileScreen: true, // Toujours mobile en React Native
  };
};

export default {
  useDebounce,
  useThrottle,
  usePagination,
  usePullToRefresh,
  useErrorHandler,
  useInfiniteScroll,
  useLoadingState,
  useResponsive,
};
