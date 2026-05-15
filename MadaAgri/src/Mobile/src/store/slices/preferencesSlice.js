import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  theme: 'light',
  language: 'fr',
  userType: 'client', // 'client' or 'farmer'
  notifications: true,
  offlineMode: false,
};

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
    },
    setUserType: (state, action) => {
      state.userType = action.payload;
    },
    setNotifications: (state, action) => {
      state.notifications = action.payload;
    },
    setOfflineMode: (state, action) => {
      state.offlineMode = action.payload;
    },
  },
});

export const { setTheme, setLanguage, setUserType, setNotifications, setOfflineMode } = preferencesSlice.actions;
export default preferencesSlice.reducer;
