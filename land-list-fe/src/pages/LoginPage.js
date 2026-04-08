import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { clearAuthError, login } from '../features/auth/authSlice';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useSelector((s) => s.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (auth.token && auth.user) navigate('/', { replace: true });
  }, [auth.token, auth.user, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(login({ email, password })).unwrap();
      navigate('/', { replace: true });
    } catch {
      // error surfaced via auth.error
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper elevation={0} variant="outlined" sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Sign in
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Log in to save favorites, get live updates on listings you follow, and manage your own properties.
        </Typography>
        <Box component="form" onSubmit={onSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              fullWidth
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={auth.status === 'loading'}
              sx={{ alignSelf: 'flex-start', mt: 1 }}
            >
              {auth.status === 'loading' ? <CircularProgress size={24} color="inherit" /> : 'Log in'}
            </Button>
          </Stack>
        </Box>
        {auth.error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {auth.error}
          </Alert>
        ) : null}
      </Paper>
    </Container>
  );
}
