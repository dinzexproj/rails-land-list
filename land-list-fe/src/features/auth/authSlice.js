import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiFetch } from '../../app/api';

const TOKEN_KEY = 'token';
const USER_KEY = 'auth_user';

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function credentialsToBasicHeader(email, password) {
  const raw = `${email}:${password}`;
  try {
    return btoa(raw);
  } catch {
    const bytes = new TextEncoder().encode(raw);
    let bin = '';
    bytes.forEach((b) => {
      bin += String.fromCharCode(b);
    });
    return btoa(bin);
  }
}

function normalizeInitialAuth() {
  const token = localStorage.getItem(TOKEN_KEY) || null;
  const user = readStoredUser();
  if (token && !user) {
    localStorage.removeItem(TOKEN_KEY);
    return { token: null, user: null };
  }
  return { token, user };
}

const initialState = {
  ...normalizeInitialAuth(),
  status: 'idle',
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    const basic = credentialsToBasicHeader(email, password);
    try {
      return await apiFetch('/api/auth/login', {
        method: 'POST',
        skipAuth: true,
        headers: { Authorization: `Basic ${basic}` },
      });
    } catch (err) {
      const msg =
        err?.data?.message ||
        err?.data?.error ||
        (typeof err?.message === 'string' ? err.message : null) ||
        'Sign in failed';
      return rejectWithValue(msg);
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async (_, { getState }) => {
  try {
    await apiFetch('/api/auth/logout', { method: 'DELETE', getState });
  } catch {
    // Expired or invalid tokens still get 401 from the API; local sign-out must always complete.
  }
  return true;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    /** Clears session without calling the server (e.g. after global 401). */
    clearSession(state) {
      state.status = 'idle';
      state.token = null;
      state.user = null;
      state.error = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.user = action.payload.user;
        localStorage.setItem(TOKEN_KEY, action.payload.token);
        if (action.payload.user) {
          localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user));
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = typeof action.payload === 'string' ? action.payload : action.error.message;
      })
      .addCase(logout.fulfilled, (state) => {
        state.status = 'idle';
        state.token = null;
        state.user = null;
        state.error = null;
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      })
      .addCase(logout.rejected, (state) => {
        state.status = 'idle';
        state.token = null;
        state.user = null;
        state.error = null;
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      });
  },
});

export const { clearAuthError, clearSession } = authSlice.actions;
export default authSlice.reducer;

