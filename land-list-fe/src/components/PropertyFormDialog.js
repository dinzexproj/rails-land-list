import { useEffect, useState } from 'react';
import { useDispatch, useStore } from 'react-redux';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { apiFetch } from '../app/api';
import { createProperty, updateProperty } from '../features/properties/propertiesSlice';

const PROPERTY_TYPES = ['HOUSE', 'APARTMENT', 'TOWNHOUSE', 'LAND', 'CONDO'];
const STATUS_OPTIONS = ['FOR_SALE', 'PENDING', 'SOLD', 'OFF_MARKET'];

const emptyRoom = () => ({ name: '', room_type: '', area_sqft: '' });

const initialForm = () => ({
  title: '',
  description: '',
  property_type: 'LAND',
  priceDollars: '',
  selling_status: 'FOR_SALE',
  bedrooms: '0',
  bathrooms: '0',
  sqft: '',
  address: '',
  city: '',
  state: '',
  country: 'US',
  lat: '',
  lng: '',
  rooms: [],
});

function formFromProperty(p) {
  return {
    title: p.title || '',
    description: p.description || '',
    property_type: p.property_type || 'LAND',
    priceDollars: p.price_cents != null ? String(p.price_cents / 100) : '',
    selling_status: p.selling_status || 'FOR_SALE',
    bedrooms: String(p.bedrooms ?? 0),
    bathrooms: String(p.bathrooms ?? 0),
    sqft: p.sqft != null ? String(p.sqft) : '',
    address: p.address || '',
    city: p.city || '',
    state: p.state || '',
    country: p.country || 'US',
    lat: p.lat != null ? String(p.lat) : '',
    lng: p.lng != null ? String(p.lng) : '',
    rooms: (p.rooms || []).map((r) => ({
      name: r.name || '',
      room_type: r.room_type || '',
      area_sqft: r.area_sqft != null ? String(r.area_sqft) : '',
    })),
  };
}

export default function PropertyFormDialog({ open, onClose, mode, propertyId, onSaved }) {
  const dispatch = useDispatch();
  const store = useStore();
  const [form, setForm] = useState(initialForm);
  const [loadError, setLoadError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return undefined;

    setLoadError(null);
    setSubmitError(null);

    if (mode === 'edit' && propertyId) {
      let cancelled = false;
      setLoadingDetail(true);
      apiFetch(`/api/properties/${propertyId}`, { getState: store.getState })
        .then((data) => {
          if (!cancelled) setForm(formFromProperty(data));
        })
        .catch((err) => {
          if (!cancelled) setLoadError(err.message || 'Failed to load listing');
        })
        .finally(() => {
          if (!cancelled) setLoadingDetail(false);
        });

      return () => {
        cancelled = true;
      };
    }

    setForm(initialForm());
    return undefined;
  }, [open, mode, propertyId, store]);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const setRoomField = (index, key, value) => {
    setForm((f) => {
      const rooms = [...f.rooms];
      rooms[index] = { ...rooms[index], [key]: value };
      return { ...f, rooms };
    });
  };

  const addRoomRow = () => setForm((f) => ({ ...f, rooms: [...f.rooms, emptyRoom()] }));

  const removeRoomRow = (index) =>
    setForm((f) => ({ ...f, rooms: f.rooms.filter((_, i) => i !== index) }));

  const buildPayload = () => {
    const price = Number(form.priceDollars);
    const price_cents = Math.round(price * 100);
    const rooms = form.rooms
      .filter((r) => r.name?.trim() && r.room_type?.trim())
      .map((r) => ({
        name: r.name.trim(),
        room_type: r.room_type.trim(),
        area_sqft: r.area_sqft === '' ? null : Number(r.area_sqft),
      }));

    return {
      title: form.title.trim(),
      description: form.description.trim() || null,
      property_type: form.property_type,
      price_cents,
      selling_status: form.selling_status,
      bedrooms: parseInt(form.bedrooms, 10) || 0,
      bathrooms: parseInt(form.bathrooms, 10) || 0,
      sqft: form.sqft === '' ? null : parseInt(form.sqft, 10),
      address: form.address.trim() || null,
      city: form.city.trim(),
      state: form.state.trim(),
      country: form.country.trim() || null,
      lat: Number(form.lat),
      lng: Number(form.lng),
      rooms,
    };
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    const payload = buildPayload();
    if (!payload.title || !payload.city || !payload.state) {
      setSubmitError('Title, city, and state are required.');
      return;
    }
    if (Number.isNaN(payload.lat) || Number.isNaN(payload.lng)) {
      setSubmitError('Valid latitude and longitude are required.');
      return;
    }
    if (Number.isNaN(payload.price_cents) || payload.price_cents < 0) {
      setSubmitError('Enter a valid price.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'create') {
        await dispatch(createProperty(payload)).unwrap();
      } else {
        await dispatch(updateProperty({ id: propertyId, ...payload })).unwrap();
      }
      onSaved?.();
      onClose();
    } catch (err) {
      const msg = err?.data?.messages?.join?.(', ') || err.message || 'Could not save listing';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle>{mode === 'create' ? 'Add listing' : 'Edit listing'}</DialogTitle>
      <DialogContent dividers>
        {loadError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {loadError}
          </Alert>
        ) : null}
        {loadingDetail ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={2} sx={{ pt: 1 }}>
            {submitError ? <Alert severity="error">{submitError}</Alert> : null}
            <TextField
              label="Title"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              multiline
              minRows={2}
              fullWidth
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  label="Type"
                  value={form.property_type}
                  onChange={(e) => setField('property_type', e.target.value)}
                >
                  {PROPERTY_TYPES.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={form.selling_status}
                  onChange={(e) => setField('selling_status', e.target.value)}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Price (USD)"
                type="number"
                value={form.priceDollars}
                onChange={(e) => setField('priceDollars', e.target.value)}
                required
                fullWidth
                inputProps={{ min: 0, step: '0.01' }}
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Bedrooms"
                type="number"
                value={form.bedrooms}
                onChange={(e) => setField('bedrooms', e.target.value)}
                fullWidth
                inputProps={{ min: 0 }}
              />
              <TextField
                label="Bathrooms"
                type="number"
                value={form.bathrooms}
                onChange={(e) => setField('bathrooms', e.target.value)}
                fullWidth
                inputProps={{ min: 0 }}
              />
              <TextField
                label="Sq ft"
                type="number"
                value={form.sqft}
                onChange={(e) => setField('sqft', e.target.value)}
                fullWidth
                inputProps={{ min: 0 }}
              />
            </Stack>
            <TextField
              label="Address"
              value={form.address}
              onChange={(e) => setField('address', e.target.value)}
              fullWidth
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="City"
                value={form.city}
                onChange={(e) => setField('city', e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="State"
                value={form.state}
                onChange={(e) => setField('state', e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Country"
                value={form.country}
                onChange={(e) => setField('country', e.target.value)}
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Latitude"
                value={form.lat}
                onChange={(e) => setField('lat', e.target.value)}
                required
                fullWidth
                inputProps={{ step: 'any' }}
              />
              <TextField
                label="Longitude"
                value={form.lng}
                onChange={(e) => setField('lng', e.target.value)}
                required
                fullWidth
                inputProps={{ step: 'any' }}
              />
            </Stack>

            <Box sx={{ pt: 1 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Rooms (optional)
                </Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={addRoomRow}>
                  Add room
                </Button>
              </Stack>
              {form.rooms.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Add rooms to describe interior spaces (e.g. kitchen, living room).
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {form.rooms.map((r, i) => (
                    <Stack key={i} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                      <TextField
                        label="Name"
                        value={r.name}
                        onChange={(e) => setRoomField(i, 'name', e.target.value)}
                        size="small"
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        label="Room type"
                        value={r.room_type}
                        onChange={(e) => setRoomField(i, 'room_type', e.target.value)}
                        size="small"
                        placeholder="KITCHEN, LIVING…"
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        label="Area (sq ft)"
                        type="number"
                        value={r.area_sqft}
                        onChange={(e) => setRoomField(i, 'area_sqft', e.target.value)}
                        size="small"
                        sx={{ width: 140 }}
                      />
                      <IconButton aria-label="Remove room" onClick={() => removeRoomRow(i)} color="error" size="small">
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loadingDetail || submitting || !!loadError}
        >
          {submitting ? <CircularProgress size={22} color="inherit" /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
