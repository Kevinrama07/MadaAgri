import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notificationAPI } from '../../services';

export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationAPI.getNotifications();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

export const markAsRead = createAsyncThunk(
  'notification/markAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await notificationAPI.markAsRead(notificationId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
    },
    clearAll: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter((n) => !n.read).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find((n) => n.id === action.payload.id);
        if (notification && !notification.read) {
          notification.read = true;
          state.unreadCount -= 1;
        }
      });
  },
});

export const { addNotification, removeNotification, clearAll } = notificationSlice.actions;
export default notificationSlice.reducer;
