import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useCallback } from 'react';
import { getCurrentUser } from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, isLoading, isAuthenticated, error } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, isAuthenticated]);

  return { user, token, isLoading, isAuthenticated, error };
};

export const useProducts = () => {
  const { products, isLoading, error, filters } = useSelector((state) => state.product);
  return { products, isLoading, error, filters };
};

export const usePosts = () => {
  const { posts, isLoading, error, selectedPost } = useSelector((state) => state.post);
  return { posts, isLoading, error, selectedPost };
};

export const useMessages = () => {
  const { conversations, messages, isLoading, currentConversationId } = useSelector(
    (state) => state.message
  );
  return { conversations, messages, isLoading, currentConversationId };
};

export const useNotifications = () => {
  const { notifications, unreadCount, isLoading } = useSelector((state) => state.notification);
  return { notifications, unreadCount, isLoading };
};

export const usePreferences = () => {
  const { theme, language, userType, notifications, offlineMode } = useSelector(
    (state) => state.preferences
  );
  return { theme, language, userType, notifications, offlineMode };
};

export const useCart = () => {
  const { items, total, isLoading, error } = useSelector((state) => state.cart);
  return { items, total, isLoading, error };
};

export default {
  useAuth,
  useProducts,
  usePosts,
  useMessages,
  useNotifications,
  usePreferences,
  useCart,
};
