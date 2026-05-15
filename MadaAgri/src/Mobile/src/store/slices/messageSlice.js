import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { messageAPI } from '../../services';

export const fetchConversations = createAsyncThunk(
  'message/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await messageAPI.getConversations();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch conversations');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'message/fetchMessages',
  async (conversationId, { rejectWithValue }) => {
    try {
      const response = await messageAPI.getMessages(conversationId);
      return { conversationId, messages: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  'message/sendMessage',
  async ({ conversationId, message }, { rejectWithValue }) => {
    try {
      const response = await messageAPI.sendMessage(conversationId, message);
      return { conversationId, message: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

const initialState = {
  conversations: [],
  currentConversationId: null,
  messages: {},
  isLoading: false,
  error: null,
};

const messageSlice = createSlice({
  name: 'message',
  initialState,
  reducers: {
    setCurrentConversation: (state, action) => {
      state.currentConversationId = action.payload;
    },
    addMessageLocally: (state, action) => {
      const { conversationId, message } = action.payload;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      state.messages[conversationId].push(message);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.conversations = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchMessages.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages[action.payload.conversationId] = action.payload.messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { conversationId, message } = action.payload;
        if (!state.messages[conversationId]) {
          state.messages[conversationId] = [];
        }
        state.messages[conversationId].push(message);
      });
  },
});

export const { setCurrentConversation, addMessageLocally, clearError } = messageSlice.actions;
export default messageSlice.reducer;
