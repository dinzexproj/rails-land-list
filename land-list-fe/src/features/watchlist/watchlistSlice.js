import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiFetch } from '../../app/api';
import { clearSession, logout } from '../auth/authSlice';

const initialState = {
  items: [],
  status: 'idle',
  error: null,
};

export const fetchWatchlist = createAsyncThunk('watchlist/fetch', async (_, { getState }) => {
  return apiFetch('/api/watchlist', { getState });
});

export const addToWatchlist = createAsyncThunk('watchlist/add', async ({ propertyId }, { getState }) => {
  return apiFetch('/api/watchlist/items', { method: 'POST', body: { property_id: propertyId }, getState });
});

export const removeFromWatchlist = createAsyncThunk(
  'watchlist/remove',
  async ({ propertyId }, { getState }) => {
    await apiFetch(`/api/watchlist/items/${propertyId}`, { method: 'DELETE', getState });
    return { propertyId };
  }
);

const watchlistSlice = createSlice({
  name: 'watchlist',
  initialState,
  reducers: {
    applyFavoritePropertyUpdate(state, action) {
      const { id, price_cents, selling_status } = action.payload;
      const idx = state.items.findIndex((p) => p.id === id);
      if (idx !== -1) {
        state.items[idx] = {
          ...state.items[idx],
          price_cents: price_cents ?? state.items[idx].price_cents,
          selling_status: selling_status ?? state.items[idx].selling_status,
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWatchlist.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchWatchlist.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.properties || [];
      })
      .addCase(fetchWatchlist.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(addToWatchlist.fulfilled, (state, action) => {
        const propertyId = action.payload.property_id;
        if (!state.items.some((p) => p.id === propertyId)) {
          state.items = [{ id: propertyId }, ...state.items];
        }
      })
      .addCase(removeFromWatchlist.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p.id !== action.payload.propertyId);
      })
      .addCase(clearSession, (state) => {
        state.items = [];
        state.status = 'idle';
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.items = [];
        state.status = 'idle';
        state.error = null;
      })
      .addCase(logout.rejected, (state) => {
        state.items = [];
        state.status = 'idle';
        state.error = null;
      });
  },
});

export const { applyFavoritePropertyUpdate } = watchlistSlice.actions;
export default watchlistSlice.reducer;

