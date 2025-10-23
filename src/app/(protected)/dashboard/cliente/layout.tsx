'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { keyframes } from '@mui/system';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  useMediaQuery,
  useTheme,
  Badge,
  ListItemButton,
  LinearProgress,
  Container,
  Breadcrumbs,
  Link as MuiLink,
  Chip,
  BottomNavigation,
  BottomNavigationAction,
  Fab,
  Zoom
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import Link from 'next/link';

// ✅ IMPORTS ENTERPRISE v7.0
import { colorTokens } from '@/theme';
import { formatMexicoTime } from '@/utils/dateUtils';

// 🎨 ICONOS ORGANIZADOS POR CATEGORÍA
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PaymentIcon from '@mui/icons-material/Payment';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LoginIcon from '@mui/icons-material/Login';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import PollIcon from '@mui/icons-material/Poll';

// 🎨 Animaciones keyframes
const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
`;

const drawerWidth = 290;
const mobileDrawerWidth = 280;

// 🎨 ESTILOS PERSONALIZADOS CON THEME CENTRALIZADO v7.0
const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(3),
  },
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: 0,
  [theme.breakpoints.up('lg')]: {
    marginLeft: open ? 0 : `-${drawerWidth}px`,
  },
  backgroundColor: colorTokens.neutral0,
  backgroundImage: `
    radial-gradient(circle at 25px 25px, ${colorTokens.brand}18 2%, transparent 0%),
    radial-gradient(circle at 75px 75px, ${colorTokens.brand}0D 2%, transparent 0%)
  `,
  backgroundSize: '100px 100px',
  minHeight: '100vh',
  color: colorTokens.textPrimary,
  maxWidth: '100vw',
  overflowX: 'hidden',
  // Mobile - espacio para bottom nav
  [theme.breakpoints.down('sm')]: {
    paddingBottom: '80px',
  },
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
  borderBottom: `1px solid ${colorTokens.border}`,
}));

// AppBar móvil simplificado
const MobileAppBar = styled(AppBar)(({ theme }) => ({
  background: colorTokens.black,
  backdropFilter: 'none',
  boxShadow: `0 4px 20px 0 ${alpha(colorTokens.black, 0.8)}`,
  borderBottom: `1px solid ${alpha(colorTokens.brand, 0.15)}`,
  display: 'none',
  [theme.breakpoints.down('lg')]: {
    display: 'block',
  },
  '& .MuiToolbar-root': {
    minHeight: '64px !important',
    px: 2,
  },
}));

const MobileBottomNav = styled(BottomNavigation)(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 1300,
  backgroundColor: alpha(colorTokens.black, 0.95),
  backdropFilter: 'blur(20px)',
  borderTop: `1px solid ${alpha(colorTokens.brand, 0.2)}`,
  height: '70px',
  '& .MuiBottomNavigationAction-root': {
    color: alpha(colorTokens.textPrimary, 0.6),
    minHeight: '70px',
    padding: '8px 0',
    '&.Mui-selected': { color: colorTokens.brand },
    '& .MuiBottomNavigationAction-label': {
      fontSize: '0.7rem',
      fontWeight: 600
    }
  },
  [theme.breakpoints.up('lg')]: { display: 'none' },
}));

// INTERFACES Y TIPOS
interface ClienteLayoutProps { children: ReactNode; }
interface MenuItemDef {
  text: string;
  path: string;
  icon: React.ReactElement;
  section: string;
  description?: string;
  disabled?: boolean;
  mobileIcon?: React.ReactElement;
}

// ✅ DEFINICIÓN COMPLETA DEL MENÚ - FUERA DEL COMPONENTE
const menuItems: MenuItemDef[] = [
  {
    text: 'Dashboard',
    path: '/dashboard/cliente',
    icon: <AccountCircleIcon />,
    mobileIcon: <HomeIcon />,
    section: 'info',
    description: 'Vista general de tu información'
  },
  {
    text: 'Pagos',
    path: '/dashboard/cliente/pagos',
    icon: <PaymentIcon />,
    mobileIcon: <PaymentIcon />,
    section: 'pagos',
    description: 'Historial de membresías'
  },
  {
    text: 'Compras',
    path: '/dashboard/cliente/compras',
    icon: <ShoppingCartIcon />,
    mobileIcon: <ShoppingCartIcon />,
    section: 'compras',
    description: 'Productos y servicios'
  },
  {
    text: 'Asistencias',
    path: '/dashboard/cliente/asistencias',
    icon: <LoginIcon />,
    mobileIcon: <AccessTimeIcon />,
    section: 'asistencias',
    description: 'Historial de entradas al gym'
  },
  {
    text: 'Encuestas',
    path: '/dashboard/cliente/encuestas',
    icon: <PollIcon />,
    mobileIcon: <PollIcon />,
    section: 'encuestas',
    description: 'Completa encuestas disponibles'
  },
  {
    text: 'Rutinas',
    path: '/dashboard/cliente/rutinas',
    icon: <FitnessCenterIcon />,
    mobileIcon: <FitnessCenterIcon />,
    section: 'rutinas',
    description: 'Próximamente',
    disabled: true
  }
];

export default function ClienteLayout({ children }: ClienteLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  // 🔧 ESTADOS MEJORADOS
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [user, setUser] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mobileBottomValue, setMobileBottomValue] = useState(0);
  const [currentMexicoTime, setCurrentMexicoTime] = useState<string>('');

  const unreadCount = 3; // TODO: Implement real notification count

  // Update current time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const mexicoTime = formatMexicoTime(now, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      setCurrentMexicoTime(mexicoTime);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get user data
  useEffect(() => {
    async function getUserData() {
      try {
        setLoading(true);
        const supabase = createBrowserSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          const response = await fetch(`/api/user-profile?userId=${session.user.id}`);
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          }
        }
      } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
      } finally {
        setLoading(false);
      }
    }

    getUserData();
  }, []);

  // Handle scroll top button
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ✅ useEffect OPTIMIZADO - SIN menuItems como dependencia
  useEffect(() => {
    if (pathname) {
      const pathParts = pathname.split('/');
      const currentSection = pathParts[pathParts.length - 1] || '';
      const sectionId = currentSection === 'cliente' ? 'info' : currentSection;
      setActiveSection(sectionId);

      const activeIndex = menuItems.findIndex(item => item.section === sectionId);
      if (activeIndex !== -1) setMobileBottomValue(activeIndex);
    }
  }, [pathname]);

  // ✅ useEffect para refrescar sesión en navegación
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    const refreshSession = async () => {
      await supabase.auth.getSession();
    };

    refreshSession();
  }, [pathname]);

  // 🚪 MANEJAR CIERRE DE SESIÓN
  const handleLogout = async () => {
    try {
      setLoading(true);
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signOut();
      router.refresh();
      router.push('/');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FUNCIÓN PARA NAVEGAR OPTIMIZADA
  const navigateTo = (path: string) => {
    console.log('🧭 Navegando a:', path);

    setLoading(true);
    router.push(path);
    router.refresh();

    if (isMobile) {
      setDrawerOpen(false);
    }

    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  // 👤 HANDLERS PARA MENÚ DE USUARIO
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleMobileNavChange = (event: React.SyntheticEvent, newValue: number) => {
    const selectedItem = menuItems.filter(item => !item.disabled)[newValue];
    if (selectedItem) {
      navigateTo(selectedItem.path);
    }
  };

  // 🍞 GENERAR BREADCRUMBS MEJORADOS
  const generateBreadcrumbs = () => {
    if (!pathname) return null;

    const pathParts = pathname.split('/').filter(part => part !== '');

    if (pathParts.length <= 2) return null;

    const breadcrumbs = [];
    let currentPath = '';

    breadcrumbs.push(
      <MuiLink
        key="home"
        underline="hover"
        color="inherit"
        component={Link}
        href="/dashboard/cliente"
        sx={{
          display: 'flex',
          alignItems: 'center',
          '&:hover': { color: colorTokens.brand }
        }}
      >
        <HomeIcon sx={{ mr: 0.5, fontSize: 20 }} />
        Inicio
      </MuiLink>
    );

    for (let i = 2; i < pathParts.length; i++) {
      const part = pathParts[i];
      currentPath += `/${part}`;

      let sectionName = part.charAt(0).toUpperCase() + part.slice(1);
      let sectionIcon = null;

      const fullPathToHere = '/dashboard/cliente' + currentPath;

      menuItems.forEach(item => {
        if (item.path === fullPathToHere) {
          sectionName = item.text;
          sectionIcon = item.icon;
        }
      });

      const isLast = i === pathParts.length - 1;

      breadcrumbs.push(
        isLast ? (
          <Typography
            key={part}
            color={colorTokens.brand}
            sx={{
              display: 'flex',
              alignItems: 'center',
              fontWeight: 600
            }}
          >
            {sectionIcon && React.cloneElement(sectionIcon, { sx: { mr: 0.5, fontSize: 20 } })}
            {sectionName}
          </Typography>
        ) : (
          <MuiLink
            key={part}
            underline="hover"
            color="inherit"
            component={Link}
            href={`/dashboard/cliente${currentPath}`}
            sx={{
              display: 'flex',
              alignItems: 'center',
              '&:hover': { color: colorTokens.brand }
            }}
          >
            {sectionIcon && React.cloneElement(sectionIcon, { sx: { mr: 0.5, fontSize: 20 } })}
            {sectionName}
          </MuiLink>
        )
      );
    }

    return (
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" sx={{ color: alpha(colorTokens.brand, 0.6) }} />}
        aria-label="breadcrumb"
        sx={{
          mb: 3,
          mt: 1,
          color: colorTokens.textSecondary,
          '& .MuiBreadcrumbs-ol': {
            alignItems: 'center'
          }
        }}
      >
        {breadcrumbs}
      </Breadcrumbs>
    );
  };

  return (
    <>
      <Box sx={{ display: 'flex', maxWidth: '100vw', overflowX: 'hidden' }}>
        {/* 🏢 BARRA SUPERIOR MÓVIL */}
        <MobileAppBar position="fixed">
          <Toolbar sx={{
            minHeight: { xs: '64px', sm: '64px' },
            px: { xs: 1.5, sm: 2 }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <Box
                component={motion.img}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                whileHover={{ scale: 1.02 }}
                sx={{
                  height: 40,
                  width: 'auto',
                  mr: 1.5,
                  cursor: 'pointer'
                }}
                src="/logo.png"
                alt="Muscle Up Gym"
                onClick={() => router.push('/dashboard/cliente')}
              />
              <Chip
                label="PANEL MUP"
                size="small"
                sx={{
                  backgroundColor: colorTokens.brand,
                  color: colorTokens.black,
                  fontWeight: 900,
                  fontSize: '0.75rem',
                  height: '24px',
                  '& .MuiChip-label': {
                    px: 1.5,
                    fontWeight: 900,
                    fontSize: '0.75rem'
                  }
                }}
              />
            </Box>


            <Tooltip title="Cerrar sesión">
              <IconButton
                onClick={handleLogout}
                sx={{
                  color: colorTokens.danger,
                  '&:hover': {
                    backgroundColor: alpha(colorTokens.danger, 0.1),
                  }
                }}
              >
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </MobileAppBar>

        {/* 🏢 BARRA SUPERIOR DESKTOP CON THEME CENTRALIZADO v7.0 */}
        <AppBar
          position="fixed"
          sx={{
            zIndex: theme.zIndex.drawer + 1,
            background: colorTokens.black,
            backdropFilter: 'none',
            boxShadow: `0 4px 20px 0 ${alpha(colorTokens.black, 0.8)}`,
            borderBottom: `1px solid ${alpha(colorTokens.brand, 0.15)}`,
            display: { xs: 'none', lg: 'block' }
          }}
        >
          {loading && (
            <LinearProgress
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: alpha(colorTokens.brand, 0.1),
                '& .MuiLinearProgress-bar': {
                  background: `linear-gradient(90deg, ${colorTokens.brand}, ${colorTokens.brandHover})`
                }
              }}
            />
          )}

          <Toolbar sx={{
            minHeight: { xs: '64px', sm: '80px', md: '100px' },
            px: { xs: 1.5, sm: 2, md: 3 }
          }}>
            <IconButton
              color="inherit"
              aria-label={drawerOpen ? "cerrar menú" : "abrir menú"}
              onClick={() => setDrawerOpen(!drawerOpen)}
              edge="start"
              sx={{
                mr: { xs: 1, sm: 2 },
                backgroundColor: alpha(colorTokens.brand, 0.1),
                '&:hover': {
                  backgroundColor: alpha(colorTokens.brand, 0.2),
                }
              }}
            >
              <MenuIcon />
            </IconButton>

            {/* ÁREA DEL LOGO MEJORADA Y RESPONSIVA */}
            <Box sx={{ display: 'flex', alignItems: 'center', mr: { xs: 1, sm: 2, md: 3 } }}>
              <Box
                component={motion.img}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                whileHover={{ scale: 1.02 }}
                sx={{
                  height: { xs: 40, sm: 50, md: 65 },
                  width: 'auto',
                  mr: { xs: 1, sm: 1.5, md: 2 },
                  cursor: 'pointer'
                }}
                src="/logo.png"
                alt="Muscle Up Gym"
                onClick={() => router.push('/dashboard/cliente')}
              />

              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonOutlineIcon
                    sx={{
                      color: colorTokens.brand,
                      fontSize: 24
                    }}
                  />
                  <Typography
                    variant="h5"
                    sx={{
                      color: colorTokens.textPrimary,
                      fontWeight: 700,
                      letterSpacing: 1.5,
                      fontSize: '1.1rem'
                    }}
                  >
                    PANEL DE CLIENTE
                  </Typography>
                  <Chip
                    size="small"
                    label="MUP"
                    sx={{
                      backgroundColor: colorTokens.brand,
                      color: colorTokens.black,
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      height: '24px',
                      minWidth: '45px',
                      ml: 1
                    }}
                  />
                </Box>
              </Box>
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            {/* 👤 ÁREA DE USUARIO - RESPONSIVE */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>

              {/* Chip de bienvenida solo en desktop */}
              <Chip
                size="small"
                label={`Bienvenido, ${user?.firstName || 'Cliente'}`}
                sx={{
                  backgroundColor: alpha(colorTokens.brand, 0.15),
                  color: colorTokens.brand,
                  border: `1px solid ${alpha(colorTokens.brand, 0.3)}`,
                  fontWeight: 600,
                  display: { xs: 'none', lg: 'flex' }
                }}
              />

              {/* Avatar de usuario */}
              <Tooltip title={`Perfil de ${user?.firstName || 'Usuario'}`}>
                <IconButton
                  component={motion.button}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleUserMenuOpen}
                  size="small"
                  edge="end"
                  aria-label="cuenta de usuario"
                  aria-haspopup="true"
                  sx={{
                    bgcolor: alpha(colorTokens.brand, 0.2),
                    ml: { xs: 0.5, sm: 1 },
                    border: `2px solid ${alpha(colorTokens.brand, 0.3)}`,
                    padding: { xs: '4px', sm: '6px' },
                    '&:hover': {
                      bgcolor: alpha(colorTokens.brand, 0.3),
                    }
                  }}
                >
                  <Avatar
                    alt={user?.firstName || "Usuario"}
                    src={user?.profilePictureUrl || ""}
                    sx={{
                      width: { xs: 32, sm: 36, md: 40 },
                      height: { xs: 32, sm: 36, md: 40 },
                      border: `2px solid ${alpha(colorTokens.brand, 0.5)}`
                    }}
                  >
                    {user?.firstName?.charAt(0) || "U"}
                  </Avatar>
                </IconButton>
              </Tooltip>
            </Box>

            {/* 👤 MENÚ DE USUARIO MEJORADO */}
            <Menu
              anchorEl={userMenuAnchor}
              id="user-menu"
              open={Boolean(userMenuAnchor)}
              onClose={handleUserMenuClose}
              onClick={handleUserMenuClose}
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: `drop-shadow(0px 4px 20px ${alpha(colorTokens.black, 0.5)})`,
                  mt: 1.5,
                  minWidth: 280,
                  background: `linear-gradient(135deg, ${colorTokens.neutral100} 0%, ${colorTokens.neutral200} 100%)`,
                  backdropFilter: 'blur(20px)',
                  color: colorTokens.textPrimary,
                  border: `1px solid ${alpha(colorTokens.brand, 0.2)}`,
                  borderRadius: 2,
                  '& .MuiMenuItem-root': {
                    px: 3,
                    py: 1.5,
                    my: 0.5,
                    mx: 1,
                    borderRadius: 1.5,
                    color: colorTokens.textPrimary,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: alpha(colorTokens.brand, 0.1),
                      transform: 'translateX(4px)'
                    },
                  },
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 20,
                    width: 12,
                    height: 12,
                    bgcolor: colorTokens.neutral100,
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                    borderTop: `1px solid ${alpha(colorTokens.brand, 0.2)}`,
                    borderLeft: `1px solid ${alpha(colorTokens.brand, 0.2)}`,
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              {/* PERFIL DE USUARIO */}
              <Box
                sx={{
                  px: 3,
                  py: 2,
                  display: 'flex',
                  alignItems: 'center',
                  background: alpha(colorTokens.brand, 0.05),
                  mx: 1,
                  borderRadius: 1.5,
                  mb: 1
                }}
              >
                <Box sx={{ position: 'relative', mr: 2 }}>
                  <Avatar
                    sx={{
                      width: 60,
                      height: 60,
                      border: `3px solid ${colorTokens.brand}`
                    }}
                    src={user?.profilePictureUrl || ""}
                  >
                    {user?.firstName?.charAt(0) || "U"}
                  </Avatar>
                  {/* Badge online */}
                  <Box sx={{
                    position: 'absolute',
                    bottom: 2,
                    right: 2,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    bgcolor: colorTokens.success,
                    border: `3px solid ${colorTokens.neutral100}`,
                    boxShadow: `0 0 10px ${alpha(colorTokens.success, 0.8)}`
                  }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{
                    fontWeight: 700,
                    mb: 0.3,
                    color: colorTokens.textPrimary,
                    lineHeight: 1.2
                  }}>
                    {user ? `${user.firstName} ${user.lastName}` : "Usuario"}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.5 }}>
                    <Chip
                      size="small"
                      label='Cliente'
                      sx={{
                        backgroundColor: colorTokens.brand,
                        color: colorTokens.black,
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        height: '22px'
                      }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    color: colorTokens.textSecondary,
                    fontSize: '0.72rem',
                    fontWeight: 500
                  }}>
                    <Box component="span" sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: colorTokens.success
                    }} />
                    {formatMexicoTime(new Date())}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 1, borderColor: alpha(colorTokens.white, 0.1) }} />

              <MenuItem
                onClick={handleLogout}
                sx={{
                  color: `${colorTokens.danger} !important`,
                  '&:hover': {
                    bgcolor: `${alpha(colorTokens.danger, 0.1)} !important`,
                  }
                }}
              >
                <ListItemIcon>
                  <LogoutIcon fontSize="small" sx={{ color: colorTokens.danger }} />
                </ListItemIcon>
                Cerrar Sesión
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* 📂 MENÚ LATERAL CON THEME CENTRALIZADO v7.0 */}
        <Drawer
          sx={{
            width: isMobile ? mobileDrawerWidth : drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: isMobile ? mobileDrawerWidth : drawerWidth,
              boxSizing: 'border-box',
              background: `linear-gradient(180deg, ${colorTokens.neutral50} 0%, ${colorTokens.neutral100} 100%)`,
              color: colorTokens.textPrimary,
              borderRight: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
              backgroundImage: `
                radial-gradient(circle at 20% 50%, ${alpha(colorTokens.brand, 0.05)} 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, ${alpha(colorTokens.brand, 0.03)} 0%, transparent 50%)
              `,
              boxShadow: `inset -1px 0 0 ${alpha(colorTokens.brand, 0.1)}, 4px 0 20px ${alpha(colorTokens.black, 0.3)}`
            },
          }}
          variant={isMobile ? "temporary" : "persistent"}
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        >
          {/* HEADER DEL DRAWER */}
          <DrawerHeader sx={{
            background: `linear-gradient(135deg, ${alpha(colorTokens.neutral100, 0.9)} 0%, ${alpha(colorTokens.neutral200, 0.8)} 100%)`,
            borderBottom: `1px solid ${alpha(colorTokens.brand, 0.15)}`,
            minHeight: { xs: '64px', sm: '80px', md: '100px' },
            px: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', pl: 0 }}>
              <Box
                component={motion.img}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.5,
                  ease: [0.4, 0, 0.2, 1]
                }}
                whileHover={{
                  scale: 1.05,
                  transition: { duration: 0.2 }
                }}
                sx={{
                  height: 50,
                  mr: 2,
                  cursor: 'pointer'
                }}
                src="/logo.png"
                alt="Muscle Up Gym"
                onClick={() => router.push('/dashboard/cliente')}
              />
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PersonOutlineIcon sx={{ color: colorTokens.brand, fontSize: 18 }} />
                  <Typography variant="h6" sx={{
                    fontWeight: 700,
                    lineHeight: 1.1,
                    background: `linear-gradient(45deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    MUP
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{
                  color: colorTokens.textSecondary,
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  fontSize: '0.7rem'
                }}>
                  Cliente Panel
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={() => setDrawerOpen(false)}
              sx={{
                '&:hover': {
                  backgroundColor: alpha(colorTokens.brand, 0.1),
                }
              }}
            >
              <ChevronLeftIcon sx={{ color: colorTokens.textPrimary }} />
            </IconButton>
          </DrawerHeader>

          <Divider sx={{ borderColor: alpha(colorTokens.brand, 0.1) }} />

          {/* INFORMACIÓN DEL USUARIO EN EL DRAWER */}
          <Box sx={{
            p: 2.5,
            display: 'flex',
            alignItems: 'center',
            borderBottom: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
            background: alpha(colorTokens.brand, 0.03)
          }}>
            <Box sx={{ position: 'relative', mr: 2 }}>
              <Avatar
                component={motion.div}
                whileHover={{ scale: 1.05 }}
                sx={{
                  width: 50,
                  height: 50,
                  border: `3px solid ${colorTokens.brand}`,
                  cursor: 'pointer'
                }}
                src={user?.profilePictureUrl || ""}
                onClick={() => router.push('/dashboard/cliente')}
              >
                {user?.firstName?.charAt(0) || "U"}
              </Avatar>
              {/* Badge online */}
              <Box sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 14,
                height: 14,
                borderRadius: '50%',
                bgcolor: colorTokens.success,
                border: `2.5px solid ${colorTokens.neutral100}`,
                boxShadow: `0 0 8px ${alpha(colorTokens.success, 0.8)}`
              }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body1" sx={{
                fontWeight: 700,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                color: colorTokens.textPrimary,
                fontSize: '0.95rem'
              }}>
                {user ? `${user.firstName} ${user.lastName}` : "Usuario"}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.5 }}>
                <Chip
                  size="small"
                  label='Cliente'
                  sx={{
                    backgroundColor: colorTokens.brand,
                    color: colorTokens.black,
                    fontWeight: 700,
                    fontSize: '0.68rem',
                    height: '19px'
                  }}
                />
                <Typography variant="caption" sx={{
                  color: colorTokens.textSecondary,
                  fontSize: '0.7rem',
                  fontWeight: 500
                }}>
                  {currentMexicoTime || '--:-- --'}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* 📋 LISTA DE MENÚ COMPLETA */}
          <List
            component="nav"
            sx={{
              px: 1.5,
              py: 2,
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              '&::-webkit-scrollbar': {
                width: '6px',
                backgroundColor: 'transparent'
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: alpha(colorTokens.brand, 0.3),
                borderRadius: '3px',
                '&:hover': {
                  backgroundColor: alpha(colorTokens.brand, 0.5)
                }
              }
            }}
          >
            {menuItems.map((item) => (
              <ListItem
                key={item.text}
                disablePadding
                sx={{ mb: 0.5 }}
              >
                <ListItemButton
                  component={motion.div}
                  whileHover={{ x: 4 }}
                  onClick={() => !item.disabled && navigateTo(item.path)}
                  disabled={item.disabled}
                  sx={{
                    minHeight: 52,
                    borderRadius: '12px',
                    px: 2.5,
                    py: 1.5,
                    background: activeSection === item.section
                      ? `linear-gradient(90deg, ${alpha(colorTokens.brand, 0.15)}, ${alpha(colorTokens.brand, 0.05)})`
                      : 'transparent',
                    borderLeft: activeSection === item.section
                      ? `3px solid ${colorTokens.brand}`
                      : '3px solid transparent',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      background: `linear-gradient(90deg, ${alpha(colorTokens.brand, 0.1)}, ${alpha(colorTokens.brand, 0.05)})`,
                      borderLeft: `3px solid ${alpha(colorTokens.brand, 0.5)}`
                    }
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: 2.5,
                      justifyContent: 'center',
                      color: activeSection === item.section ? colorTokens.brand : colorTokens.textSecondary,
                      transition: 'color 0.2s ease'
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    secondary={item.description}
                    primaryTypographyProps={{
                      fontWeight: activeSection === item.section ? 700 : 500,
                      color: activeSection === item.section ? colorTokens.brand : colorTokens.textPrimary,
                      fontSize: '0.95rem'
                    }}
                    secondaryTypographyProps={{
                      fontSize: '0.75rem',
                      color: colorTokens.textSecondary
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

        </Drawer>

        {/* BOTTOM NAVIGATION MÓVIL */}
        <MobileBottomNav value={mobileBottomValue} onChange={handleMobileNavChange} showLabels>
          {menuItems.filter(item => !item.disabled).map((item) => (
            <BottomNavigationAction
              key={item.section}
              label={item.text === 'Mi Información' ? 'Inicio' : item.text}
              icon={item.mobileIcon || item.icon}
            />
          ))}
        </MobileBottomNav>

        {/* 📄 CONTENIDO PRINCIPAL */}
        <Main open={drawerOpen && !isMobile}>
          <Box sx={{ minHeight: { xs: '64px', sm: '80px', md: '100px' } }} />
          <Container maxWidth="xl" disableGutters>
            {/* 🍞 BREADCRUMBS */}
            {generateBreadcrumbs()}

            {/* 📱 CONTENIDO DE LA PÁGINA CON ANIMACIÓN */}
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{
                  duration: 0.4,
                  ease: [0.4, 0.0, 0.2, 1]
                }}
                style={{ height: '100%' }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </Container>
        </Main>
      </Box>

      {/* 🚀 TOAST CONTAINER CON TEMA DARK PRO */}
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastStyle={{
          backgroundColor: colorTokens.neutral100,
          color: colorTokens.white,
          border: `1px solid ${colorTokens.neutral200}`,
          borderRadius: '12px',
          boxShadow: `0 8px 25px ${alpha(colorTokens.black, 0.3)}`
        }}
      />

      {/* SCROLL TO TOP BUTTON */}
      <Zoom in={showScrollTop}>
        <Fab
          onClick={scrollToTop}
          color="primary"
          size="large"
          sx={{
            position: 'fixed',
            bottom: isMobile ? 85 : 20,
            right: 20,
            background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
            '&:hover': { background: colorTokens.brandHover }
          }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      </Zoom>
    </>
  );
}
