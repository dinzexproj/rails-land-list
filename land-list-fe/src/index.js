import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, CssBaseline } from '@mui/material';
import './index.css';
import App from './App';
import { store } from './app/store';
import { configureApiAuthHandler } from './app/api';
import { clearSession } from './features/auth/authSlice';
import { theme } from './app/theme';
import reportWebVitals from './reportWebVitals';

configureApiAuthHandler(() => {
  store.dispatch(clearSession());
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);

reportWebVitals();
