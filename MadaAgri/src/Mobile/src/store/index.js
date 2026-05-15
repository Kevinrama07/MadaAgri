import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import productReducer from './slices/productSlice';
import postReducer from './slices/postSlice';
import messageReducer from './slices/messageSlice';
import notificationReducer from './slices/notificationSlice';
import preferencesReducer from './slices/preferencesSlice';
import cartReducer from './slices/cartSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    product: productReducer,
    post: postReducer,
    message: messageReducer,
    notification: notificationReducer,
    preferences: preferencesReducer,
    cart: cartReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export default store;
