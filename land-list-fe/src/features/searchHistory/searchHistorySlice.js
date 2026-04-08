import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiFetch } from '../../app/api';

const initialState = {
  items: [],
  status: 'idle',
  error: null,
};

export const fetchSearchHistory = createAsyncThunk('searchHistory/fetch', async (_, { getState }) => {
  return apiFetch('/api/search_histories', { getState });
});

const searchHistorySlice = createSlice({
  name: 'searchHistory',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSearchHistory.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchSearchHistory.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items || [];
      })
      .addCase(fetchSearchHistory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export default searchHistorySlice.reducer;

