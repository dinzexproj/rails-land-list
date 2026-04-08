import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { applyFavoritePropertyUpdate, fetchWatchlist, removeFromWatchlist } from '../features/watchlist/watchlistSlice';
import { createCableConsumer } from '../app/cable';

function statusChipColor(status) {
  switch (status) {
    case 'FOR_SALE':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'SOLD':
      return 'default';
    case 'OFF_MARKET':
      return 'error';
    default:
      return 'default';
  }
}

export default function FavoritesPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useSelector((s) => s.auth);
  const watchlist = useSelector((s) => s.watchlist);

  const cableRef = useRef(null);
  const subRef = useRef(null);

  useEffect(() => {
    if (!auth.token || !auth.user) {
      navigate('/login', { replace: true });
    }
  }, [auth.token, auth.user, navigate]);

  useEffect(() => {
    if (!auth.token || !auth.user) return undefined;
    dispatch(fetchWatchlist());
    return undefined;
  }, [dispatch, auth.token, auth.user]);

  useEffect(() => {
    if (!auth.token) return undefined;

    cableRef.current = createCableConsumer(auth.token);
    subRef.current = cableRef.current.subscriptions.create(
      { channel: 'WatchedPropertiesChannel' },
      {
        received: (msg) => {
          if (msg?.type === 'property_updated' && msg.property?.id) {
            dispatch(applyFavoritePropertyUpdate(msg.property));
          }
        },
      }
    );

    return () => {
      try {
        if (subRef.current) cableRef.current.subscriptions.remove(subRef.current);
        if (cableRef.current) cableRef.current.disconnect();
      } catch (_) {
        // ignore
      }
      subRef.current = null;
      cableRef.current = null;
    };
  }, [auth.token, dispatch]);

  if (!auth.token || !auth.user) {
    return null;
  }

  const loading = watchlist.status === 'loading';
  const items = watchlist.items || [];

  return (
    <Container maxWidth="lg" sx={{ py: 3, flex: 1 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
        Favorites
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Listings you saved. You’ll get live updates when price or status changes.
      </Typography>

      {watchlist.error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {watchlist.error}
        </Alert>
      ) : null}

      {loading && items.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : null}

      {!loading && items.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            px: 2,
            borderRadius: 3,
            bgcolor: 'action.hover',
            border: 1,
            borderColor: 'divider',
          }}
        >
          <FavoriteIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            No favorites yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 360, mx: 'auto' }}>
            Browse listings and tap the heart on any card to save it here.
          </Typography>
          <Button variant="contained" component={RouterLink} to="/" sx={{ textTransform: 'none', fontWeight: 600 }}>
            Browse listings
          </Button>
        </Box>
      ) : null}

      {items.length > 0 ? (
        <Grid container spacing={2.5}>
          {items.map((p) => {
            const bathrooms = p.bathrooms ?? 0;
            const imageUrl = p.image_url || `https://picsum.photos/seed/landlot-${p.id}/800/500`;
            return (
              <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <CardMedia component="img" height="200" image={imageUrl} alt="" sx={{ objectFit: 'cover' }} />
                  <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                    <Typography variant="subtitle1" component="h2" fontWeight={700} gutterBottom>
                      {p.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {p.city}, {p.state}
                    </Typography>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
                      <Chip size="small" label={p.property_type} variant="outlined" />
                      <Chip size="small" label={`${p.bedrooms ?? 0} bd / ${bathrooms} ba`} variant="outlined" />
                      <Chip size="small" label={p.selling_status} color={statusChipColor(p.selling_status)} variant="filled" />
                    </Stack>
                    <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                      ${((p.price_cents ?? 0) / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2, pt: 0 }}>
                    <Tooltip title="Remove from favorites">
                      <IconButton
                        aria-label="Remove from favorites"
                        color="error"
                        onClick={() => dispatch(removeFromWatchlist({ propertyId: p.id }))}
                      >
                        <FavoriteIcon />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : null}
    </Container>
  );
}
