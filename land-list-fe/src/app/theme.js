import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1b5e20',
      light: '#4c8c4a',
      dark: '#003300',
    },
    secondary: {
      main: '#5d4037',
    },
    background: {
      default: '#f5f7f4',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica Neue", "Arial", sans-serif',
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          overflow: 'hidden',
        },
      },
    },
  },
});
