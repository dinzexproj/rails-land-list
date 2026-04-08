import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { applyPropertyUpdate, deleteProperty, fetchProperties, resetProperties } from '../features/properties/propertiesSlice';
import { addToWatchlist, fetchWatchlist, removeFromWatchlist } from '../features/watchlist/watchlistSlice';
import { createCableConsumer } from '../app/cable';
import PropertyFormDialog from '../components/PropertyFormDialog';
import { useInfiniteScrollSentinel } from '../hooks/useInfiniteScrollSentinel';

const STATUS_OPTIONS = ['FOR_SALE', 'PENDING', 'SOLD', 'OFF_MARKET'];
const DRAWER_WIDTH = 320;

/** Default browse filters. Omit `selling_status` entirely when unset so the API receives no status param. */
const DEFAULT_BROWSE_FILTERS = {
  min_price_cents: '',
  max_price_cents: '',
  bedrooms: '',
  property_type: '',
  lat: '',
  lng: '',
  distance_km: '',
};

function filtersToSearchQuery(f) {
  const q = { ...f };
  if (q.selling_status == null || q.selling_status === '') {
    delete q.selling_status;
  }
  return q;
}

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

export default function HomePage() {
  const dispatch = useDispatch();
  const auth = useSelector((s) => s.auth);
  const properties = useSelector((s) => s.properties);
  const watchlist = useSelector((s) => s.watchlist);

  const [filterOpen, setFilterOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [editId, setEditId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [filters, setFilters] = useState(() => ({ ...DEFAULT_BROWSE_FILTERS }));

  useEffect(() => {
    dispatch(resetProperties());
    dispatch(
      fetchProperties({
        query: filtersToSearchQuery(DEFAULT_BROWSE_FILTERS),
        page: 1,
        perPage: 20,
      })
    );
  }, [dispatch]);

  useEffect(() => {
    if (auth.token) dispatch(fetchWatchlist());
  }, [dispatch, auth.token]);

  const watchIds = useMemo(() => new Set((watchlist.items || []).map((p) => p.id)), [watchlist.items]);

  const cableRef = useRef(null);
  const subRef = useRef(null);
  const scrollSentinelRef = useRef(null);

  useEffect(() => {
    if (!auth.token) return undefined;

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
  }, [auth.token, dispatch]);

  const onSearch = () => {
    dispatch(resetProperties());
    dispatch(fetchProperties({ query: filtersToSearchQuery(filters), page: 1, perPage: 20 }));
    if (auth.token) dispatch(fetchWatchlist());
    setFilterOpen(false);
  };

  const loadMore = useCallback(() => {
    if (properties.status === 'loading' || properties.status === 'loadingMore') return;
    if (properties.page >= properties.totalPages) return;
    dispatch(fetchProperties({ query: properties.lastQuery, page: properties.page + 1, perPage: 20 }));
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
      // optional: toast
    }
    setDeleteTarget(null);
  };

  const searching = properties.status === 'loading';
  const loadingMore = properties.status === 'loadingMore';

  const filterDrawer = (
    <Drawer
      anchor="left"
      open={filterOpen}
      onClose={() => setFilterOpen(false)}
      slotProps={{
        paper: {
          sx: {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      <Toolbar sx={{ px: 2, gap: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1 }}>
          Filters
        </Typography>
        <IconButton edge="end" aria-label="Close filters" onClick={() => setFilterOpen(false)}>
          <CloseIcon />
        </IconButton>
      </Toolbar>
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.5 }}>
          Price & home
        </Typography>
        <Stack spacing={2} sx={{ mt: 1, mb: 2 }}>
          <TextField
            label="Min price (¢)"
            value={filters.min_price_cents}
            onChange={(e) => setFilters((f) => ({ ...f, min_price_cents: e.target.value }))}
            size="small"
            fullWidth
          />
          <TextField
            label="Max price (¢)"
            value={filters.max_price_cents}
            onChange={(e) => setFilters((f) => ({ ...f, max_price_cents: e.target.value }))}
            size="small"
            fullWidth
          />
          <TextField
            label="Bedrooms"
            value={filters.bedrooms}
            onChange={(e) => setFilters((f) => ({ ...f, bedrooms: e.target.value }))}
            size="small"
            fullWidth
          />
          <TextField
            label="Property type"
            value={filters.property_type}
            onChange={(e) => setFilters((f) => ({ ...f, property_type: e.target.value }))}
            placeholder="HOUSE, LAND…"
            size="small"
            fullWidth
          />
          <Stack direction="row" spacing={0.5} alignItems="flex-start">
            <FormControl size="small" sx={{ flex: 1, minWidth: 0 }}>
              <InputLabel id="drawer-status-label">Status</InputLabel>
              <Select
                labelId="drawer-status-label"
                label="Status"
                displayEmpty
                value={filters.selling_status ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, selling_status: e.target.value }))}
                renderValue={(v) => (v ? v : '')}
              >
                {STATUS_OPTIONS.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {filters.selling_status ? (
              <Tooltip title="Clear status">
                <IconButton
                  aria-label="Clear status filter"
                  size="small"
                  onClick={() =>
                    setFilters((f) => {
                      const next = { ...f };
                      delete next.selling_status;
                      return next;
                    })
                  }
                  sx={{ mt: 0.5 }}
                >
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            ) : null}
          </Stack>
        </Stack>
        <Divider sx={{ my: 1 }} />
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.5 }}>
          Location radius
        </Typography>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Latitude"
            value={filters.lat}
            onChange={(e) => setFilters((f) => ({ ...f, lat: e.target.value }))}
            size="small"
            fullWidth
          />
          <TextField
            label="Longitude"
            value={filters.lng}
            onChange={(e) => setFilters((f) => ({ ...f, lng: e.target.value }))}
            size="small"
            fullWidth
          />
          <TextField
            label="Distance (km)"
            value={filters.distance_km}
            onChange={(e) => setFilters((f) => ({ ...f, distance_km: e.target.value }))}
            size="small"
            fullWidth
          />
        </Stack>
      </Box>
      <Paper elevation={0} square sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Stack spacing={1.5}>
          <Button
            variant="contained"
            fullWidth
            startIcon={searching ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />}
            disabled={searching}
            onClick={onSearch}
          >
            {searching ? 'Searching…' : 'Apply search'}
          </Button>
          <Button
            variant="text"
            fullWidth
            onClick={() => setFilters({ ...DEFAULT_BROWSE_FILTERS })}
          >
            Clear filters
          </Button>
        </Stack>
      </Paper>
    </Drawer>
  );

  return (
    <>
      {filterDrawer}
      <Container maxWidth="lg" sx={{ py: 3, flex: 1 }}>
        {properties.error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {properties.error}
          </Alert>
        ) : null}
          <Box sx={{ position: 'fixed', bottom: "20px", right: "20px", zIndex: 100 }}>
            {auth.token && auth.user ? (
              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                Add listing
              </Button>
            ) : null}
          </Box>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
          flexWrap="wrap"
          gap={1}
        >
          <Typography variant="h6" sx={{ textAlign: 'center', px: 1 }}>
            Results
          </Typography>
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', minWidth: 120 }}>
            <Button variant="outlined" startIcon={<FilterListIcon />} onClick={() => setFilterOpen(true)}>
              Filters
            </Button>
          </Box>
        </Stack>

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
                    <Tooltip
                      title={
                        !auth.token ? 'Log in to save favorites' : watchIds.has(p.id) ? 'Remove from favorites' : 'Add to favorites'
                      }
                    >
                      <span>
                        <IconButton
                          aria-label={watchIds.has(p.id) ? 'Remove from favorites' : 'Add to favorites'}
                          color={watchIds.has(p.id) ? 'error' : 'default'}
                          disabled={!auth.token}
                          onClick={() =>
                            watchIds.has(p.id)
                              ? dispatch(removeFromWatchlist({ propertyId: p.id }))
                              : dispatch(addToWatchlist({ propertyId: p.id }))
                          }
                        >
                          {watchIds.has(p.id) ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                        </IconButton>
                      </span>
                    </Tooltip>
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

        {searching && properties.items.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : null}
      </Container>

      <PropertyFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        mode={formMode}
        propertyId={editId}
        onSaved={() => {
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
