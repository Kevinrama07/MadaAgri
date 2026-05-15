import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productAPI } from '../../services';

export const fetchProducts = createAsyncThunk(
  'product/fetchProducts',
  async (params, { rejectWithValue }) => {
    try {
      const response = await productAPI.getProducts(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
    }
  }
);

export const searchProducts = createAsyncThunk(
  'product/searchProducts',
  async ({ query, filters }, { rejectWithValue }) => {
    try {
      const response = await productAPI.searchProducts(query, filters);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Search failed');
    }
  }
);

export const fetchProductsByRegion = createAsyncThunk(
  'product/fetchByRegion',
  async (region, { rejectWithValue }) => {
    try {
      const response = await productAPI.getProductsByRegion(region);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

const initialState = {
  products: [],
  selectedProduct: null,
  isLoading: false,
  error: null,
  filters: {
    region: '',
    culture: '',
    priceMin: 0,
    priceMax: 10000,
    searchQuery: '',
  },
};

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    setFilter: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    selectProduct: (state, action) => {
      state.selectedProduct = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(searchProducts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload;
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchProductsByRegion.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchProductsByRegion.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload;
      })
      .addCase(fetchProductsByRegion.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setFilter, selectProduct, clearError } = productSlice.actions;
export default productSlice.reducer;
