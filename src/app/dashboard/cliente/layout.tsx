'use client';

import React, { useState, useEffect, ReactNode } from 'react';
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
  ListItemButton,
  LinearProgress,
  Container,
  Chip,
  Collapse,
  Badge,
  SwipeableDrawer,
  BottomNavigation,
  BottomNavigationAction,
  Fab,
  Zoom
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

// ICONOS
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import PersonIcon from '@mui/icons-material/Person';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SearchIcon from '@mui/icons-material/Search';
import PaymentIcon from '@mui/icons-material/Payment';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import HistoryIcon from '@mui/icons-material/History';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import CloseIcon from '@mui/icons-material/Close';
import HomeIcon from '@mui/icons-material/Home';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LoginIcon from '@mui/icons-material/Login';

// 🎨 RESPONSIVE BREAKPOINTS
const BREAKPOINTS = {
  mobile: '(max-width: 599px)',
  tablet: '(max-width: 899px)',
  desktop: '(min-width: 900px)',
  large: '(min-width: 1200px)'
};

// 📱 DRAWER WIDTHS RESPONSIVOS
const DRAWER_WIDTHS = {
  mobile: '100vw',
  tablet: 280,
  desktop: 290,
  large: 320
};

// 🎨 ESTILOS RESPONSIVOS MEJORADOS
const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  backgroundColor: '#0a0a0a',
  backgroundImage: `
    radial-gradient(circle at 25px 25px, rgba(255,204,0,0.08) 2%, transparent 0%), 
    radial-gradient(circle at 75px 75px, rgba(255,204,0,0.04) 2%, transparent 0%)
  `,
  backgroundSize: '100px 100px',
  minHeight: '100vh',
  color: '#fff',
  position: 'relative',
  
  // 📱 MOBILE (< 600px)
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
    marginLeft: 0,
    width: '100%',
    paddingBottom: '80px', // Espacio para bottom navigation
  },
  
  // 📟 TABLET (600px - 899px)
  [theme.breakpoints.between('sm', 'md')]: {
    padding: theme.spacing(2),
    marginLeft: 0,
    width: '100%',
  },
  
  // 💻 DESKTOP (900px+)
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(3),
    marginLeft: open ? 0 : `-${DRAWER_WIDTHS.desktop}px`,
    width: open ? `calc(100% - ${DRAWER_WIDTHS.desktop}px)` : '100%',
  },
  
  // 🖥️ LARGE (1200px+)
  [theme.breakpoints.up('lg')]: {
    marginLeft: open ? 0 : `-${DRAWER_WIDTHS.large}px`,
    width: open ? `calc(100% - ${DRAWER_WIDTHS.large}px)` : '100%',
  },
  
  ...(open && {
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  ...theme.mixins.toolbar,
  
  // 📱 MOBILE
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0, 2),
    minHeight: '72px !important',
  },
  
  // 📟 TABLET
  [theme.breakpoints.between('sm', 'md')]: {
    padding: theme.spacing(0, 2),
    minHeight: '80px !important',
  },
  
  // 💻 DESKTOP+
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(0, 3),
    minHeight: '88px !important',
  },
}));

const ResponsiveAppBar = styled(AppBar)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  background: 'rgba(0, 0, 0, 0.95)',
  backdropFilter: 'blur(20px)',
  boxShadow: '0 4px 30px rgba(0,0,0,0.8)',
  borderBottom: '1px solid rgba(255, 204, 0, 0.15)',
  
  // 📱 MOBILE
  [theme.breakpoints.down('sm')]: {
    '& .MuiToolbar-root': {
      minHeight: '72px',
      padding: theme.spacing(0, 1),
    }
  },
  
  // 📟 TABLET
  [theme.breakpoints.between('sm', 'md')]: {
    '& .MuiToolbar-root': {
      minHeight: '80px',
      padding: theme.spacing(0, 2),
    }
  },
  
  // 💻 DESKTOP+
  [theme.breakpoints.up('md')]: {
    '& .MuiToolbar-root': {
      minHeight: '88px',
      padding: theme.spacing(0, 3),
    }
  },
}));

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: '25px',
  backgroundColor: alpha(theme.palette.common.white, 0.12),
  border: '1px solid rgba(255, 204, 0, 0.2)',
  transition: 'all 0.3s ease',
  
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.18),
    borderColor: 'rgba(255, 204, 0, 0.4)',
    transform: 'scale(1.02)',
  },
  
  '&:focus-within': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
    borderColor: '#ffcc00',
    boxShadow: '0 0 0 3px rgba(255, 204, 0, 0.2)',
    transform: 'scale(1.05)',
  },
  
  // 📱 MOBILE - Oculto
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
  
  // 💻 DESKTOP
  [theme.breakpoints.up('md')]: {
    marginRight: theme.spacing(2),
    marginLeft: theme.spacing(2),
    width: '100%',
    maxWidth: '400px',
  },
  
  // 🖥️ LARGE
  [theme.breakpoints.up('lg')]: {
    maxWidth: '500px',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'rgba(255, 204, 0, 0.7)',
}));

const StyledInputBase = styled('input')(({ theme }) => ({
  color: 'inherit',
  border: 'none',
  background: 'transparent',
  width: '100%',
  fontFamily: 'inherit',
  fontSize: '0.875rem',
  
  padding: theme.spacing(1.2, 2, 1.2, 0),
  paddingLeft: `calc(1em + ${theme.spacing(4)})`,
  
  transition: theme.transitions.create('width'),
  
  '&:focus': {
    outline: 'none',
  },
  
  '&::placeholder': {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  
  // 💻 DESKTOP
  [theme.breakpoints.up('md')]: {
    width: '100%',
  },
}));

// 📱 BOTTOM NAVIGATION PARA MOBILE
const MobileBottomNav = styled(BottomNavigation)(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: theme.zIndex.appBar,
  backgroundColor: 'rgba(0, 0, 0, 0.95)',
  backdropFilter: 'blur(20px)',
  borderTop: '1px solid rgba(255, 204, 0, 0.2)',
  height: '70px',
  
  '& .MuiBottomNavigationAction-root': {
    color: 'rgba(255, 255, 255, 0.6)',
    '&.Mui-selected': {
      color: '#ffcc00',
    },
    '& .MuiBottomNavigationAction-label': {
      fontSize: '0.7rem',
      fontWeight: 600,
    }
  },
  
  // Solo visible en mobile
  [theme.breakpoints.up('sm')]: {
    display: 'none',
  },
}));

// 🎯 INTERFACES
interface ClienteLayoutProps {
  children: ReactNode;
}

interface MenuItem {
  text: string;
  path: string;
  icon: React.ReactElement;
  section: string;
  description?: string;
  disabled?: boolean;
  mobileIcon?: React.ReactElement;
}

export default function ClienteLayout({ children }: ClienteLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  
  // 📱 RESPONSIVE HOOKS
  const isMobile = useMediaQuery(BREAKPOINTS.mobile);
  const isTablet = useMediaQuery(BREAKPOINTS.tablet);
  const isDesktop = useMediaQuery(BREAKPOINTS.desktop);
  const isLarge = useMediaQuery(BREAKPOINTS.large);
  
  // 🎯 ESTADOS
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [user, setUser] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mobileBottomValue, setMobileBottomValue] = useState(0);

  // ✅ MENÚ CORREGIDO CON ACCESOS
  const menuItems: MenuItem[] = [
    { 
      text: 'Mi Información', 
      path: '/dashboard/cliente', 
      icon: <AccountCircleIcon />,
      mobileIcon: <HomeIcon />,
      section: 'info',
      description: 'Gestiona tu perfil personal'
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
      text: 'Accesos', 
      path: '/dashboard/cliente/accesos', 
      icon: <LoginIcon />,
      mobileIcon: <AccessTimeIcon />,
      section: 'accesos',
      description: 'Historial de entradas al gym'
    },
    { 
      text: 'Historial', 
      path: '/dashboard/cliente/historial', 
      icon: <HistoryIcon />,
      mobileIcon: <HistoryIcon />,
      section: 'historial',
      description: 'Próximamente',
      disabled: true
    }
  ];

  // 🎯 RESPONSIVE DRAWER WIDTH
  const getDrawerWidth = () => {
    if (isMobile) return DRAWER_WIDTHS.mobile;
    if (isTablet) return DRAWER_WIDTHS.tablet;
    if (isLarge) return DRAWER_WIDTHS.large;
    return DRAWER_WIDTHS.desktop;
  };

  // 📱 EFECTO PARA MANEJAR RESPONSIVE
  useEffect(() => {
    if (isMobile) {
      setDrawerOpen(false);
    } else if (isDesktop) {
      setDrawerOpen(true);
    }
  }, [isMobile, isDesktop]);

  // 📜 SCROLL TO TOP
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 🎯 OBTENER DATOS DEL USUARIO
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
  
  // ✅ ACTUALIZAR SECCIÓN ACTIVA - CORREGIDO
  useEffect(() => {
    if (pathname) {
      const pathParts = pathname.split('/');
      const section = pathParts[pathParts.length - 1] || '';
      const activeSection = section === 'cliente' ? 'info' : section;
      setActiveSection(activeSection);
      
      // ✅ CORREGIDO: Actualizar bottom navigation correctamente
      const activeIndex = menuItems.findIndex(item => item.section === activeSection);
      if (activeIndex !== -1) {
        setMobileBottomValue(activeIndex);
      }
    }
  }, [pathname, menuItems]);
  
  // 🎯 HANDLERS
  const handleLogout = async () => {
    try {
      setLoading(true);
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // ✅ FUNCIÓN DE NAVEGACIÓN CORREGIDA
  const navigateTo = (path: string) => {
    console.log(`🚀 Navegando a: ${path}`); // Debug
    router.push(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };
  
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ✅ MOBILE BOTTOM NAVIGATION HANDLER CORREGIDO
  const handleMobileNavChange = (event: React.SyntheticEvent, newValue: number) => {
    console.log(`📱 Bottom nav clicked: ${newValue}`); // Debug
    setMobileBottomValue(newValue);
    const selectedItem = menuItems[newValue];
    if (selectedItem && !selectedItem.disabled) {
      console.log(`📱 Navegando a: ${selectedItem.path}`); // Debug
      navigateTo(selectedItem.path);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* 🎯 BARRA SUPERIOR RESPONSIVA */}
      <ResponsiveAppBar position="fixed">
        {loading && (
          <LinearProgress 
            sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              height: '3px',
              background: 'rgba(255,204,0,0.1)',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #ffcc00, #ffd700)'
              }
            }} 
          />
        )}
        
        <Toolbar>
          {/* 🎯 MENU BUTTON - Solo desktop/tablet */}
          {!isMobile && (
            <IconButton
              color="inherit"
              aria-label={drawerOpen ? "cerrar menú" : "abrir menú"}
              onClick={() => setDrawerOpen(!drawerOpen)}
              edge="start"
              sx={{ 
                mr: 2,
                backgroundColor: 'rgba(255, 204, 0, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 204, 0, 0.2)',
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.3s ease'
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          {/* 🎯 LOGO ÁREA RESPONSIVA */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mr: { xs: 1, sm: 2, md: 3 },
            minWidth: 0
          }}>
            <Box 
              component="img"
              sx={{ 
                height: { xs: 40, sm: 50, md: 65 },
                width: 'auto',
                mr: { xs: 1, sm: 1.5, md: 2 },
                filter: 'drop-shadow(0 2px 4px rgba(255,204,0,0.3))'
              }}
              src="/logo.png"
              alt="Muscle Up Gym"
            />
            
            {/* 🎯 TÍTULO RESPONSIVO */}
            <Box sx={{ 
              display: { xs: 'none', sm: 'block' },
              minWidth: 0,
              overflow: 'hidden'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FitnessCenterIcon 
                  sx={{ 
                    color: '#ffcc00', 
                    fontSize: { sm: 20, md: 24 },
                    filter: 'drop-shadow(0 1px 2px rgba(255,204,0,0.3))'
                  }} 
                />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'rgba(255,255,255,0.95)',
                    fontWeight: 700,
                    letterSpacing: { sm: 1, md: 1.5 },
                    fontSize: { sm: '0.9rem', md: '1.1rem' },
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {isTablet && !isDesktop ? 'CLIENTE' : 'PANEL DE CLIENTE'}
                </Typography>
                <Chip
                  size="small"
                  label="MUP"
                  sx={{
                    backgroundColor: '#ffcc00',
                    color: '#000',
                    fontWeight: 800,
                    fontSize: { sm: '0.7rem', md: '0.75rem' },
                    height: { sm: '20px', md: '24px' },
                    minWidth: { sm: '35px', md: '45px' },
                    ml: 1,
                    display: { xs: 'none', md: 'flex' }
                  }}
                />
              </Box>
            </Box>
          </Box>
          
          {/* 🎯 BÚSQUEDA - Solo desktop */}
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Buscar en mi cuenta..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </Search>
          
          <Box sx={{ flexGrow: 1 }} />
          
          {/* 🎯 ÁREA DE USUARIO RESPONSIVA */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 0.5, sm: 1 }
          }}>
            {/* 🔔 NOTIFICACIONES */}
            <Tooltip title="Notificaciones">
              <IconButton 
                color="inherit" 
                sx={{ 
                  mr: { xs: 0, sm: 1 },
                  position: 'relative',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 204, 0, 0.1)',
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <Badge badgeContent={3} color="error">
                  <NotificationsIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </Badge>
              </IconButton>
            </Tooltip>
            
            {/* 👋 SALUDO - Solo tablet+ */}
            <Chip
              size="small"
              label={`Hola, ${user?.firstName || 'Cliente'}`}
              sx={{
                backgroundColor: 'rgba(255, 204, 0, 0.15)',
                color: '#ffcc00',
                border: '1px solid rgba(255, 204, 0, 0.3)',
                fontWeight: 600,
                display: { xs: 'none', md: 'flex' },
                maxWidth: { md: 150, lg: 200 },
                '& .MuiChip-label': {
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }
              }}
            />
            
            {/* 👤 AVATAR USUARIO */}
            <Tooltip title={`Perfil de ${user?.firstName || 'Usuario'}`}>
              <IconButton 
                onClick={handleUserMenuOpen}
                size="small"
                edge="end"
                sx={{ 
                  bgcolor: 'rgba(255, 204, 0, 0.2)',
                  ml: { xs: 0.5, sm: 1 },
                  border: '2px solid rgba(255, 204, 0, 0.3)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 204, 0, 0.3)',
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <Avatar 
                  alt={user?.firstName || "Usuario"} 
                  src={user?.profilePictureUrl || ""}
                  sx={{ 
                    width: { xs: 32, sm: 36, md: 40 }, 
                    height: { xs: 32, sm: 36, md: 40 }
                  }}
                >
                  {user?.firstName?.charAt(0) || "C"}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
          
          {/* 🎯 MENÚ DE USUARIO RESPONSIVO */}
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
                filter: 'drop-shadow(0px 4px 20px rgba(0,0,0,0.5))',
                mt: 1.5,
                minWidth: { xs: 260, sm: 280 },
                maxWidth: { xs: '90vw', sm: 320 },
                background: 'linear-gradient(135deg, rgba(18, 18, 18, 0.98) 0%, rgba(25, 25, 25, 0.95) 100%)',
                backdropFilter: 'blur(20px)',
                color: 'white',
                border: '1px solid rgba(255, 204, 0, 0.2)',
                borderRadius: 2,
                '& .MuiMenuItem-root': {
                  px: { xs: 2, sm: 3 },
                  py: 1.5,
                  my: 0.5,
                  mx: 1,
                  borderRadius: 1.5,
                  color: 'white',
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  '&:hover': {
                    bgcolor: 'rgba(255, 204, 0, 0.1)',
                  },
                },
              },
            }}
          >
            {/* 👤 HEADER DEL MENÚ */}
            <Box 
              sx={{ 
                px: { xs: 2, sm: 3 }, 
                py: 2, 
                display: 'flex', 
                alignItems: 'center',
                background: 'rgba(255, 204, 0, 0.05)',
                mx: 1,
                borderRadius: 1.5,
                mb: 1
              }}
            >
              <Avatar 
                sx={{ 
                  width: { xs: 50, sm: 60 }, 
                  height: { xs: 50, sm: 60 }, 
                  mr: 2, 
                  border: '3px solid #ffcc00' 
                }}
                src={user?.profilePictureUrl || ""}
              >
                {user?.firstName?.charAt(0) || "C"}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontWeight: 'bold', 
                    mb: 0.5,
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {user ? `${user.firstName} ${user.lastName}` : "Cliente"}
                </Typography>
                <Chip
                  size="small"
                  label="Miembro Activo"
                  sx={{
                    backgroundColor: '#ffcc00',
                    color: '#000',
                    fontWeight: 600,
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    height: { xs: '18px', sm: '20px' }
                  }}
                />
              </Box>
            </Box>
            
            <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
            
            <MenuItem onClick={() => router.push('/dashboard/cliente')}>
              <ListItemIcon>
                <PersonIcon fontSize="small" sx={{ color: '#ffcc00' }} />
              </ListItemIcon>
              Mi Perfil
            </MenuItem>
            
            <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
            
            <MenuItem 
              onClick={handleLogout}
              sx={{
                color: '#ff6b6b !important',
                '&:hover': {
                  bgcolor: 'rgba(255, 107, 107, 0.1) !important',
                }
              }}
            >
              <ListItemIcon>
                <LogoutIcon fontSize="small" sx={{ color: '#ff6b6b' }} />
              </ListItemIcon>
              Cerrar Sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </ResponsiveAppBar>
      
      {/* 🎯 DRAWER LATERAL RESPONSIVO */}
      <SwipeableDrawer
        sx={{
          width: getDrawerWidth(),
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: getDrawerWidth(),
            boxSizing: 'border-box',
            background: 'linear-gradient(180deg, rgb(12, 12, 12) 0%, rgb(18, 18, 18) 100%)',
            color: 'white',
            borderRight: '1px solid rgba(255, 204, 0, 0.1)',
            backgroundImage: `
              radial-gradient(circle at 20% 50%, rgba(255,204,0,0.05) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255,204,0,0.03) 0%, transparent 50%)
            `,
            boxShadow: 'inset -1px 0 0 rgba(255,204,0,0.1), 4px 0 20px rgba(0,0,0,0.3)',
            
            // 📱 MOBILE - Full screen
            [theme.breakpoints.down('sm')]: {
              width: '100vw',
              maxWidth: '100vw',
            }
          },
        }}
        variant={isMobile ? "temporary" : "persistent"}
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpen={() => setDrawerOpen(true)}
        disableBackdropTransition={!isMobile}
        disableDiscovery={!isMobile}
      >
        {/* 🎯 HEADER DEL DRAWER RESPONSIVO */}
        <DrawerHeader sx={{ 
          background: 'linear-gradient(135deg, rgba(18, 18, 18, 0.9) 0%, rgba(25, 25, 25, 0.8) 100%)',
          borderBottom: '1px solid rgba(255, 204, 0, 0.15)',
          px: { xs: 1.5, sm: 2, md: 3 }
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            pl: { xs: 0.5, sm: 1 },
            minWidth: 0,
            flex: 1
          }}>
            <Box 
              component="img"
              sx={{ 
                height: { xs: 40, sm: 45, md: 50 }, 
                mr: { xs: 1.5, sm: 2 },
                filter: 'drop-shadow(0 2px 4px rgba(255,204,0,0.3))'
              }}
              src="/logo.png"
              alt="Muscle Up Gym"
            />
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <FitnessCenterIcon sx={{ 
                  color: '#ffcc00', 
                  fontSize: { xs: 16, sm: 18 }
                }} />
                <Typography variant="h6" sx={{ 
                  fontWeight: 700,
                  lineHeight: 1.1,
                  background: 'linear-gradient(45deg, #ffcc00, #ffd700)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' }
                }}>
                  MUP
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ 
                color: 'rgba(255,255,255,0.8)',
                fontWeight: 600,
                letterSpacing: 0.5,
                fontSize: { xs: '0.65rem', sm: '0.7rem' }
              }}>
                Cliente Panel
              </Typography>
            </Box>
          </Box>
          
          <IconButton 
            onClick={() => setDrawerOpen(false)}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255, 204, 0, 0.1)',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.3s ease'
            }}
          >
            {isMobile ? <CloseIcon sx={{ color: 'white' }} /> : <ChevronLeftIcon sx={{ color: 'white' }} />}
          </IconButton>
        </DrawerHeader>
        
        <Divider sx={{ borderColor: 'rgba(255, 204, 0, 0.1)' }} />
        
        {/* 🎯 INFO DEL USUARIO EN DRAWER RESPONSIVO */}
        <Box sx={{ 
          p: { xs: 2, sm: 2.5 }, 
          display: 'flex', 
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 204, 0, 0.1)',
          background: 'rgba(255, 204, 0, 0.03)'
        }}>
          <Avatar 
            sx={{ 
              width: { xs: 45, sm: 50 }, 
              height: { xs: 45, sm: 50 }, 
              mr: 2,
              border: '3px solid #ffcc00',
              background: 'linear-gradient(45deg, #ffcc00, #ffd700)'
            }}
            src={user?.profilePictureUrl || ""}
          >
            {user?.firstName?.charAt(0) || "C"}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body1" sx={{ 
              fontWeight: 'bold', 
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}>
              {user ? `${user.firstName} ${user.lastName}` : "Cliente"}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Chip
                size="small"
                label="Miembro"
                sx={{
                  backgroundColor: '#ffcc00',
                  color: '#000',
                  fontWeight: 600,
                  fontSize: { xs: '0.65rem', sm: '0.7rem' },
                  height: { xs: '18px', sm: '20px' }
                }}
              />
            </Box>
          </Box>
        </Box>
        
        {/* 🎯 LISTA DE MENÚ RESPONSIVA */}
        <List 
          component="nav" 
          sx={{ 
            px: { xs: 1, sm: 1.5 }, 
            py: 2,
            height: 'calc(100% - 240px)',
            overflowY: 'auto',
            overflowX: 'hidden',
            '&::-webkit-scrollbar': {
              width: '6px',
              backgroundColor: 'transparent'
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(255, 204, 0, 0.3)',
              borderRadius: '3px',
              '&:hover': {
                backgroundColor: 'rgba(255, 204, 0, 0.5)'
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
                onClick={() => {
                  console.log(`🖱️ Drawer item clicked: ${item.path}`); // Debug
                  if (!item.disabled) {
                    navigateTo(item.path);
                  }
                }}
                disabled={item.disabled}
                sx={{ 
                  minHeight: { xs: 48, sm: 52 },
                  borderRadius: '12px',
                  px: { xs: 2, sm: 2.5 },
                  py: 1.5,
                  background: activeSection === item.section 
                    ? 'linear-gradient(135deg, rgba(255, 204, 0, 0.2) 0%, rgba(255, 204, 0, 0.1) 100%)'
                    : 'transparent',
                  border: activeSection === item.section 
                    ? '1px solid rgba(255, 204, 0, 0.3)' 
                    : '1px solid transparent',
                  opacity: item.disabled ? 0.5 : 1,
                  '&:hover': {
                    background: item.disabled 
                      ? 'transparent' 
                      : 'linear-gradient(135deg, rgba(255, 204, 0, 0.12) 0%, rgba(255, 204, 0, 0.06) 100%)',
                    border: item.disabled 
                      ? '1px solid transparent' 
                      : '1px solid rgba(255, 204, 0, 0.2)',
                    transform: item.disabled ? 'none' : 'translateX(4px)',
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: { xs: 2, sm: 2.5 },
                    justifyContent: 'center',
                    color: activeSection === item.section ? '#ffcc00' : 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  secondary={!isMobile ? item.description : undefined}
                  primaryTypographyProps={{ 
                    fontWeight: activeSection === item.section ? 700 : 500,
                    color: activeSection === item.section ? '#ffcc00' : 'inherit',
                    fontSize: { xs: '0.875rem', sm: '0.95rem' }
                  }}
                  secondaryTypographyProps={{
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    color: 'rgba(255,255,255,0.5)',
                    display: isMobile ? 'none' : 'block'
                  }}
                />
                {item.disabled && (
                  <Chip
                    size="small"
                    label="Pronto"
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: { xs: '0.65rem', sm: '0.7rem' },
                      height: { xs: '18px', sm: '20px' }
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        {/* 🎯 FOOTER DEL DRAWER RESPONSIVO */}
        <Box sx={{ 
          p: { xs: 2, sm: 2.5 }, 
          borderTop: '1px solid rgba(255, 204, 0, 0.1)',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(18,18,18,0.2) 100%)',
          mt: 'auto'
        }}>
          <Typography variant="caption" sx={{ 
            color: 'rgba(255,255,255,0.6)',
            fontWeight: 500,
            fontSize: { xs: '0.7rem', sm: '0.75rem' }
          }}>
            © {new Date().getFullYear()} Muscle Up Gym
          </Typography>
          <Typography variant="caption" sx={{ 
            display: 'block', 
            color: '#ffcc00', 
            mt: 0.5,
            fontWeight: 600,
            fontSize: { xs: '0.65rem', sm: '0.7rem' }
          }}>
            Panel de Cliente v1.0.0
          </Typography>
        </Box>
      </SwipeableDrawer>
      
      {/* ✅ BOTTOM NAVIGATION PARA MOBILE CORREGIDO */}
      <MobileBottomNav
        value={mobileBottomValue}
        onChange={handleMobileNavChange}
        showLabels
      >
        {menuItems.filter(item => !item.disabled).map((item, index) => (
          <BottomNavigationAction
            key={`${item.section}-${index}`}
            label={item.text === 'Mi Información' ? 'Inicio' : item.text}
            icon={item.mobileIcon || item.icon}
            sx={{
              '&.Mui-selected': {
                '& .MuiBottomNavigationAction-label': {
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#ffcc00'
                }
              }
            }}
          />
        ))}
      </MobileBottomNav>
      
      {/* 🎯 CONTENIDO PRINCIPAL RESPONSIVO */}
      <Main open={drawerOpen && !isMobile}>
        <DrawerHeader />
        <Container 
          maxWidth="xl" 
          disableGutters={isMobile}
          sx={{
            px: isMobile ? 1 : 0,
            minHeight: 'calc(100vh - 100px)',
          }}
        >
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
              style={{ 
                height: '100%',
                paddingBottom: isMobile ? '20px' : '0px'
              }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </Container>
      </Main>
      
      {/* 🎯 SCROLL TO TOP BUTTON */}
      <Zoom in={showScrollTop}>
        <Fab
          onClick={scrollToTop}
          color="primary"
          size={isMobile ? "medium" : "large"}
          sx={{
            position: 'fixed',
            bottom: isMobile ? 85 : 20,
            right: isMobile ? 15 : 20,
            background: 'linear-gradient(135deg, #ffcc00, #ffd700)',
            color: '#000',
            zIndex: 1000,
            '&:hover': {
              background: 'linear-gradient(135deg, #ffd700, #ffcc00)',
              transform: 'scale(1.1)',
            },
            boxShadow: '0 8px 32px rgba(255, 204, 0, 0.3)',
            transition: 'all 0.3s ease'
          }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      </Zoom>
    </Box>
  );
}
