import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLoading } from '../contexts/LoadingContext';

export const useRouteLoading = () => {
  const location = useLocation();
  const { startLoading, completeLoading } = useLoading();

  useEffect(() => {
    startLoading();
    const timer = setTimeout(() => {
      completeLoading();
    }, 600);

    return () => clearTimeout(timer);
  }, [location.pathname, startLoading, completeLoading]);
};

export default useRouteLoading;