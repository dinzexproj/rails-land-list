import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { applyPropertyUpdate, deleteProperty, fetchProperties, resetProperties } from '../features/properties/propertiesSlice';
import { fetchWatchlist } from '../features/watchlist/watchlistSlice';
import { createCableConsumer } from '../app/cable';
import PropertyFormDialog from '../components/PropertyFormDialog';
import { useInfiniteScrollSentinel } from '../hooks/useInfiniteScrollSentinel';

const MINE_QUERY = { mine: true };

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

export default function MyListingsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useSelector((s) => s.auth);
  const properties = useSelector((s) => s.properties);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [editId, setEditId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const cableRef = useRef(null);
  const subRef = useRef(null);
  const scrollSentinelRef = useRef(null);

  useEffect(() => {
    if (!auth.token || !auth.user) {
      navigate('/login', { replace: true });
    }
  }, [auth.token, auth.user, navigate]);

  useEffect(() => {
    if (!auth.token || !auth.user) return undefined;

    dispatch(resetProperties());
    dispatch(fetchProperties({ query: MINE_QUERY, page: 1, perPage: 20 }));
    dispatch(fetchWatchlist());

    return undefined;
  }, [dispatch, auth.token, auth.user]);

  useEffect(() => {
    if (!auth.token || !auth.user) return undefined;

    cableRef.current = createCableConsumer(auth.token);
    subRef.current = cableRef.current.subscriptions.create(
      { channel: 'WatchedPropertiesChannel' },
      {
        received: (msg) => {
          if (msg?.type === 'property_updated' && msg.property?.id) {
            dispatch(applyPropertyUpdate(msg.property));
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
  }, [auth.token, auth.user, dispatch]);

  const loadMore = useCallback(() => {
    if (properties.status === 'loading' || properties.status === 'loadingMore') return;
    if (properties.page >= properties.totalPages) return;
    dispatch(
      fetchProperties({
        query: { ...properties.lastQuery, mine: true },
        page: properties.page + 1,
        perPage: 20,
      })
    );
  }, [dispatch, properties.lastQuery, properties.page, properties.status, properties.totalPages]);

  const canLoadMore =
    properties.items.length > 0 &&
    properties.page < properties.totalPages &&
    properties.status !== 'failed';

  useInfiniteScrollSentinel(scrollSentinelRef, loadMore, {
    enabled: canLoadMore,
    watchKey: properties.items.length,
  });

  const openCreate = () => {
    setFormMode('create');
    setEditId(null);
    setFormOpen(true);
  };

  const openEdit = (id) => {
    setFormMode('edit');
    setEditId(id);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await dispatch(deleteProperty(deleteTarget.id)).unwrap();
    } catch {
      // surfaced in UI if needed
    }
    setDeleteTarget(null);
  };

  const loading = properties.status === 'loading';
  const loadingMore = properties.status === 'loadingMore';

  if (!auth.token || !auth.user) {
    return null;
  }

  return (
    <>
      <Container maxWidth="lg" sx={{ py: 3, flex: 1 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
          My listings
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Lots you have listed. You can only edit or remove properties you own; changes to others’ listings are not allowed.
        </Typography>

        <Box sx={{ position: 'fixed', bottom: "20px", right: "20px", zIndex: 100 }}>
          {auth.token && auth.user ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
              Add listing
            </Button>
          ) : null}
        </Box>

        {properties.error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {properties.error}
          </Alert>
        ) : null}

        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          {properties.totalCount != null
            ? `${properties.totalCount} ${properties.totalCount === 1 ? 'listing' : 'listings'}`
            : `${properties.items.length} shown`}
        </Typography>

        <Grid container spacing={2.5}>
          {properties.items.map((p) => {
            const isOwner = auth.user && p.user_id === auth.user.id;
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
                  <CardMedia component="img" height="200" image={p.image_url} alt="" sx={{ objectFit: 'cover' }} />
                  <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                    <Typography variant="subtitle1" component="h2" fontWeight={700} gutterBottom>
                      {p.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {p.city}, {p.state}
                    </Typography>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
                      <Chip size="small" label={p.property_type} variant="outlined" />
                      <Chip size="small" label={`${p.bedrooms} bd / ${p.bathrooms} ba`} variant="outlined" />
                      <Chip size="small" label={p.selling_status} color={statusChipColor(p.selling_status)} variant="filled" />
                    </Stack>
                    <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                      ${(p.price_cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2, pt: 0, gap: 0.5 }}>
                    {isOwner ? (
                      <>
                        <Tooltip title="Edit listing">
                          <IconButton aria-label="Edit listing" color="primary" onClick={() => openEdit(p.id)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete listing">
                          <IconButton aria-label="Delete listing" color="error" onClick={() => setDeleteTarget(p)}>
                            <DeleteOutlineIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    ) : null}
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Box ref={scrollSentinelRef} sx={{ height: 32, width: '100%' }} aria-hidden />

        {loadingMore ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={28} />
          </Box>
        ) : null}

        {loading && properties.items.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : null}

        {!loading && properties.items.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
            You have no listings yet. Use “Add listing” to create one.
          </Typography>
        ) : null}
      </Container>

      <PropertyFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        mode={formMode}
        propertyId={editId}
        onSaved={() => {
          dispatch(resetProperties());
          dispatch(fetchProperties({ query: MINE_QUERY, page: 1, perPage: 20 }));
          dispatch(fetchWatchlist());
        }}
      />

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete listing?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {deleteTarget ? `Remove “${deleteTarget.title}”? This cannot be undone.` : ''}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
