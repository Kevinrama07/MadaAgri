import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { postAPI } from '../../services';

export const fetchPosts = createAsyncThunk(
  'post/fetchPosts',
  async (params, { rejectWithValue }) => {
    try {
      const response = await postAPI.getPosts(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch posts');
    }
  }
);

export const createPost = createAsyncThunk(
  'post/createPost',
  async (postData, { rejectWithValue }) => {
    try {
      const response = await postAPI.createPost(postData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create post');
    }
  }
);

export const likePost = createAsyncThunk(
  'post/likePost',
  async (postId, { rejectWithValue }) => {
    try {
      const response = await postAPI.likePost(postId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

const initialState = {
  posts: [],
  selectedPost: null,
  isLoading: false,
  error: null,
};

const postSlice = createSlice({
  name: 'post',
  initialState,
  reducers: {
    selectPost: (state, action) => {
      state.selectedPost = action.payload;
    },
    addPost: (state, action) => {
      state.posts.unshift(action.payload);
    },
    updatePost: (state, action) => {
      const index = state.posts.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.posts[index] = action.payload;
      }
    },
    removePost: (state, action) => {
      state.posts = state.posts.filter((p) => p.id !== action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.posts = action.payload;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.posts.unshift(action.payload);
      })
      .addCase(likePost.fulfilled, (state, action) => {
        const post = state.posts.find((p) => p.id === action.payload.id);
        if (post) {
          post.likes = action.payload.likes;
          post.isLiked = action.payload.isLiked;
        }
      });
  },
});

export const { selectPost, addPost, updatePost, removePost, clearError } = postSlice.actions;
export default postSlice.reducer;
