import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import propertiesReducer from '../features/properties/propertiesSlice';
import watchlistReducer from '../features/watchlist/watchlistSlice';
import searchHistoryReducer from '../features/searchHistory/searchHistorySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    properties: propertiesReducer,
    watchlist: watchlistReducer,
    searchHistory: searchHistoryReducer,
  },
});

