import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import { Provider } from 'react-redux';
import App from './App';
import { store } from './app/store';
import { theme } from './app/theme';

test('renders app title', () => {
  render(
    <Provider store={store}>
      <MemoryRouter>
        <ThemeProvider theme={theme}>
          <App />
        </ThemeProvider>
      </MemoryRouter>
    </Provider>
  );
  expect(screen.getByText('Property Listings')).toBeInTheDocument();
});
