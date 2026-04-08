import { Outlet, NavLink, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import LandscapeIcon from '@mui/icons-material/Landscape';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { logout } from '../features/auth/authSlice';

function NavTab({ to, children, end }) {
  const theme = useTheme();
  return (
    <Button
      component={NavLink}
      to={to}
      end={end}
      color="inherit"
      sx={{
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '0.875rem',
        px: 1.75,
        py: 0.65,
        minWidth: 'auto',
        borderRadius: 2,
        color: 'text.secondary',
        '&:hover': {
          bgcolor: alpha(theme.palette.primary.main, 0.06),
          color: 'text.primary',
        },
        '&.active': {
          color: 'primary.main',
          bgcolor: alpha(theme.palette.primary.main, 0.12),
        },
      }}
    >
      {children}
    </Button>
  );
}

export default function MainLayout() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const auth = useSelector((s) => s.auth);

  const userInitial = auth.user?.email ? auth.user.email.charAt(0).toUpperCase() : '?';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ gap: { xs: 1, sm: 2 }, minHeight: { xs: 58, sm: 68 }, py: 0.5 }}>
            <Box
              component={RouterLink}
              to="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                textDecoration: 'none',
                color: 'inherit',
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.35)}`,
                }}
              >
                <LandscapeIcon sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={800} lineHeight={1.25} letterSpacing="-0.02em">
                  Property Listings
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: { xs: 'none', sm: 'block' }, lineHeight: 1.2 }}
                >
                  Land & property
                </Typography>
              </Box>
            </Box>

            <Box sx={{ flex: 1 }} />

            {auth.token && auth.user ? (
              <>
                <Stack
                  direction="row"
                  spacing={0.25}
                  alignItems="center"
                  sx={{
                    flexWrap: 'wrap',
                    justifyContent: 'flex-end',
                    rowGap: 0.5,
                  }}
                >
                  <NavTab to="/" end>
                    Browse
                  </NavTab>
                  <NavTab to="/favorites">Favorites</NavTab>
                  <NavTab to="/my-listings">My listings</NavTab>
                </Stack>

                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{
                    mx: { xs: 0.5, sm: 1.5 },
                    borderColor: 'divider',
                    display: { xs: 'none', md: 'block' },
                  }}
                />

                <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                  <Tooltip title={auth.user.email}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ maxWidth: { xs: 120, sm: 200 } }}>
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          bgcolor: alpha(theme.palette.primary.main, 0.15),
                          color: 'primary.dark',
                        }}
                      >
                        {userInitial}
                      </Avatar>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ display: { xs: 'none', lg: 'block' } }}
                        noWrap
                      >
                        {auth.user.email}
                      </Typography>
                    </Stack>
                  </Tooltip>
                  <Tooltip title="Log out">
                    <IconButton
                      onClick={() => dispatch(logout())}
                      size="small"
                      sx={{
                        color: 'text.secondary',
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 2,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.error.main, 0.06),
                          color: 'error.main',
                          borderColor: alpha(theme.palette.error.main, 0.25),
                        },
                      }}
                      aria-label="Log out"
                    >
                      <LogoutRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </>
            ) : (
              <Button
                variant="contained"
                color="primary"
                component={RouterLink}
                to="/login"
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 2.5,
                  py: 1,
                  borderRadius: 2,
                  boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.25)}`,
                }}
              >
                Sign in
              </Button>
            )}
          </Toolbar>
        </Container>
      </AppBar>
      <Outlet />
    </Box>
  );
}
