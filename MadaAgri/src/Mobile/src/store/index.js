import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './slices/authSlice';
import productReducer from './slices/productSlice';
import postReducer from './slices/postSlice';
import messageReducer from './slices/messageSlice';
import notificationReducer from './slices/notificationSlice';
import preferencesReducer from './slices/preferencesSlice';
import cartReducer from './slices/cartSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['preferences', 'cart'],
};

const rootReducer = combineReducers({
  auth: authReducer,
  product: productReducer,
  post: postReducer,
  message: messageReducer,
  notification: notificationReducer,
  preferences: preferencesReducer,
  cart: cartReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
export default store;
