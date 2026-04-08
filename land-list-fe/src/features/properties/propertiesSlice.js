import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiFetch } from '../../app/api';

const initialState = {
  items: [],
  status: 'idle',
  error: null,
  page: 1,
  totalPages: 1,
  totalCount: null,
  lastQuery: {},
};

export const fetchProperties = createAsyncThunk(
  'properties/fetch',
  async ({ query, page = 1, perPage = 20 }, { getState }) => {
    return apiFetch('/api/properties', {
      getState,
      query: { ...query, page, per_page: perPage },
    });
  }
);

export const createProperty = createAsyncThunk('properties/create', async (payload, { getState }) => {
  return apiFetch('/api/properties', { method: 'POST', body: payload, getState });
});

export const updateProperty = createAsyncThunk(
  'properties/update',
  async ({ id, ...payload }, { getState }) => {
    return apiFetch(`/api/properties/${id}`, { method: 'PATCH', body: payload, getState });
  }
);

export const deleteProperty = createAsyncThunk('properties/delete', async (id, { getState }) => {
  await apiFetch(`/api/properties/${id}`, { method: 'DELETE', getState });
  return id;
});

const propertiesSlice = createSlice({
  name: 'properties',
  initialState,
  reducers: {
    resetProperties(state) {
      state.items = [];
      state.page = 1;
      state.totalPages = 1;
      state.totalCount = null;
      state.status = 'idle';
      state.error = null;
    },
    applyPropertyUpdate(state, action) {
      const { id, price_cents, selling_status, updated_at } = action.payload;
      const idx = state.items.findIndex((p) => p.id === id);
      if (idx !== -1) {
        state.items[idx] = {
          ...state.items[idx],
          price_cents: price_cents ?? state.items[idx].price_cents,
          selling_status: selling_status ?? state.items[idx].selling_status,
          updated_at: updated_at ?? state.items[idx].updated_at,
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProperties.pending, (state, action) => {
        const requestedPage = action.meta.arg.page ?? 1;
        state.status = requestedPage > 1 ? 'loadingMore' : 'loading';
        state.error = null;
        state.lastQuery = action.meta.arg.query || {};
      })
      .addCase(fetchProperties.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { properties, page, total_pages, total_count: totalCount } = action.payload;
        const p = Number(page);
        const tp = Number(total_pages);
        state.page = Number.isFinite(p) && p > 0 ? p : 1;
        state.totalPages = Number.isFinite(tp) && tp > 0 ? tp : 1;
        if (totalCount != null) state.totalCount = Number(totalCount);
        if (state.page === 1) state.items = properties;
        else state.items = [...state.items, ...properties];
      })
      .addCase(fetchProperties.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(createProperty.fulfilled, (state, action) => {
        state.items = [action.payload, ...state.items];
      })
      .addCase(updateProperty.fulfilled, (state, action) => {
        const p = action.payload;
        const idx = state.items.findIndex((x) => x.id === p.id);
        if (idx !== -1) state.items[idx] = { ...state.items[idx], ...p };
      })
      .addCase(deleteProperty.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p.id !== action.payload);
      });
  },
});

export const { resetProperties, applyPropertyUpdate } = propertiesSlice.actions;
export default propertiesSlice.reducer;

