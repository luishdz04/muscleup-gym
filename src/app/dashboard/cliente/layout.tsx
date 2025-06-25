'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
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

// CONSTANTES DE ANCHOS DEL DRAWER
const DRAWER_WIDTHS = { mobile: '100vw', tablet: 280, desktop: 290, large: 320 };

// Función auxiliar para obtener el ancho del drawer
const getDrawerWidth = (md: number, lg: number) => {
  if (typeof window === 'undefined') return DRAWER_WIDTHS.desktop;
  if (window.innerWidth >= lg) return DRAWER_WIDTHS.large;
  if (window.innerWidth >= md) return DRAWER_WIDTHS.desktop;
  return DRAWER_WIDTHS.tablet;
};

// ESTILOS DE COMPONENTES
const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  transition: theme.transitions.create(['margin', 'width', 'padding'], {
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
  
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
    marginLeft: 0,
    width: '100%',
    paddingBottom: '80px', // Espacio para la barra de navegación inferior
  },
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(3),
    width: `calc(100% - ${open ? `${getDrawerWidth(theme.breakpoints.values.md, theme.breakpoints.values.lg)}px` : '0px'})`,
    marginLeft: open ? `${getDrawerWidth(theme.breakpoints.values.md, theme.breakpoints.values.lg)}px` : 0,
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
  [theme.breakpoints.down('sm')]: { 
    padding: theme.spacing(0, 2), 
    minHeight: '72px !important' 
  },
  [theme.breakpoints.between('sm', 'md')]: { 
    padding: theme.spacing(0, 2), 
    minHeight: '80px !important' 
  },
  [theme.breakpoints.up('md')]: { 
    padding: theme.spacing(0, 3), 
    minHeight: '88px !important' 
  },
}));

const ResponsiveAppBar = styled(AppBar)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1, 
  background: 'rgba(0, 0, 0, 0.95)', 
  backdropFilter: 'blur(20px)',
  boxShadow: '0 4px 30px rgba(0,0,0,0.8)', 
  borderBottom: '1px solid rgba(255, 204, 0, 0.15)',
  '& .MuiToolbar-root': {
    minHeight: '72px',
    padding: theme.spacing(0, 1),
    [theme.breakpoints.between('sm', 'md')]: { 
      minHeight: '80px', 
      padding: theme.spacing(0, 2) 
    },
    [theme.breakpoints.up('md')]: { 
      minHeight: '88px', 
      padding: theme.spacing(0, 3) 
    },
  },
}));

// Componente de búsqueda simplificado para móviles
const Search = styled('div')(({ theme }) => ({
  position: 'relative', 
  borderRadius: '25px', 
  backgroundColor: alpha(theme.palette.common.white, 0.12),
  border: '1px solid rgba(255, 204, 0, 0.2)', 
  transition: 'all 0.3s ease',
  '&:hover': { 
    backgroundColor: alpha(theme.palette.common.white, 0.18), 
    borderColor: 'rgba(255, 204, 0, 0.4)'
  },
  // Solo mostrar en desktop para evitar problemas en móviles
  display: 'none',
  [theme.breakpoints.up('md')]: { 
    display: 'block',
    marginRight: theme.spacing(2), 
    marginLeft: theme.spacing(2), 
    width: '100%', 
    maxWidth: '400px' 
  },
  [theme.breakpoints.up('lg')]: { 
    maxWidth: '500px' 
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
  color: 'rgba(255, 204, 0, 0.7)' 
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
  '&:focus': { outline: 'none' }, 
  '&::placeholder': { color: 'rgba(255, 255, 255, 0.5)' } 
}));

const MobileBottomNav = styled(BottomNavigation)(({ theme }) => ({
  position: 'fixed', 
  bottom: 0, 
  left: 0, 
  right: 0, 
  zIndex: 1300, 
  backgroundColor: 'rgba(0, 0, 0, 0.95)',
  backdropFilter: 'blur(20px)', 
  borderTop: '1px solid rgba(255, 204, 0, 0.2)', 
  height: '70px',
  '& .MuiBottomNavigationAction-root': { 
    color: 'rgba(255, 255, 255, 0.6)', 
    minHeight: '70px', 
    padding: '8px 0',
    '&.Mui-selected': { color: '#ffcc00' },
    '& .MuiBottomNavigationAction-label': { 
      fontSize: '0.7rem', 
      fontWeight: 600 
    }
  },
  [theme.breakpoints.up('sm')]: { display: 'none' },
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

export default function ClienteLayout({ children }: ClienteLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  
  // Usar los breakpoints del tema correctamente
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  
  // Estado inicial basado en isDesktop
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [user, setUser] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mobileBottomValue, setMobileBottomValue] = useState(0);

  const menuItems: MenuItemDef[] = [
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

  // Efecto para actualizar el estado del drawer cuando cambia isDesktop
  useEffect(() => {
    setDrawerOpen(isDesktop);
  }, [isDesktop]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    async function getUserData() {
      setLoading(true);
      const supabase = createBrowserSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          const response = await fetch(`/api/user-profile?userId=${session.user.id}`);
          if (response.ok) setUser(await response.json());
        } catch (error) { 
          console.error("Error fetching user data:", error); 
        }
      }
      setLoading(false);
    }
    getUserData();
  }, []);
  
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
  
  const navigateTo = (path: string) => {
    router.push(path);
    if (isMobile) setDrawerOpen(false);
  };
  
  const handleLogout = async () => {
    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push('/login');
    setLoading(false);
  };
  
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => setUserMenuAnchor(event.currentTarget);
  const handleUserMenuClose = () => setUserMenuAnchor(null);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleMobileNavChange = (event: React.SyntheticEvent, newValue: number) => {
    const selectedItem = menuItems.filter(item => !item.disabled)[newValue];
    if (selectedItem) {
      navigateTo(selectedItem.path);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <ResponsiveAppBar position="fixed">
        {loading && (
          <LinearProgress 
            sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              height: '3px', 
              '& .MuiLinearProgress-bar': { 
                background: 'linear-gradient(90deg, #ffcc00, #ffd700)' 
              } 
            }} 
          />
        )}
        <Toolbar>
          {!isMobile && (
            <IconButton 
              color="inherit" 
              onClick={() => setDrawerOpen(!drawerOpen)} 
              edge="start" 
              sx={{ mr: 2, '&:hover': { backgroundColor: 'rgba(255, 204, 0, 0.1)' } }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: { xs: 1, sm: 2, md: 3 } }}>
            <Box 
              component="img" 
              sx={{ height: { xs: 40, sm: 50, md: 65 }, mr: { xs: 1, sm: 2 } }} 
              src="/logo.png" 
              alt="Muscle Up Gym Logo" 
            />
            <Typography 
              variant="h6" 
              sx={{ 
                display: { xs: 'none', sm: 'block' }, 
                fontWeight: 700,
                letterSpacing: 1.5
              }}
            >
              PANEL DE CLIENTE
            </Typography>
          </Box>
          
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
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
            <Tooltip title="Notificaciones">
              <IconButton color="inherit">
                <Badge badgeContent={3} color="error">
                  <NotificationsIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title={`Perfil de ${user?.firstName || 'Usuario'}`}>
              <IconButton 
                onClick={handleUserMenuOpen} 
                size="small" 
                sx={{ ml: { xs: 0.5, sm: 1 } }}
              >
                <Avatar 
                  alt={user?.firstName} 
                  src={user?.profilePictureUrl} 
                  sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }} 
                />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Menu 
            anchorEl={userMenuAnchor} 
            open={Boolean(userMenuAnchor)} 
            onClose={handleUserMenuClose} 
            PaperProps={{ 
              sx: { 
                mt: 1.5, 
                minWidth: 280, 
                bgcolor: 'rgba(18,18,18,0.95)', 
                backdropFilter: 'blur(10px)', 
                color: 'white', 
                border: '1px solid rgba(255,204,0,0.2)',
                borderRadius: 2
              } 
            }}
          >
            <MenuItem onClick={() => { handleUserMenuClose(); navigateTo('/dashboard/cliente'); }}>
              <ListItemIcon>
                <PersonIcon fontSize="small" sx={{ color: '#ffcc00' }} />
              </ListItemIcon>
              Mi Perfil
            </MenuItem>
            <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
            <MenuItem onClick={handleLogout} sx={{ color: '#ff6b6b' }}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" sx={{ color: '#ff6b6b' }} />
              </ListItemIcon>
              Cerrar Sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </ResponsiveAppBar>
      
      <SwipeableDrawer
        sx={{
          width: isDesktop ? getDrawerWidth(theme.breakpoints.values.md, theme.breakpoints.values.lg) : DRAWER_WIDTHS.tablet,
          flexShrink: 0,
          '& .MuiDrawer-paper': { 
            width: 'inherit', 
            boxSizing: 'border-box', 
            background: 'linear-gradient(180deg, rgb(12, 12, 12) 0%, rgb(18, 18, 18) 100%)', 
            color: 'white', 
            borderRight: '1px solid rgba(255, 204, 0, 0.1)' 
          },
        }}
        variant={isDesktop ? "persistent" : "temporary"}
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpen={() => setDrawerOpen(true)}
        ModalProps={{ keepMounted: true }}
      >
        <DrawerHeader>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box component="img" sx={{ height: 50, mr: 2 }} src="/logo.png" alt="Logo"/>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffcc00' }}>
              MUP
            </Typography>
          </Box>
          <IconButton onClick={() => setDrawerOpen(false)}>
            {isMobile ? (
              <CloseIcon sx={{ color: 'white' }} />
            ) : (
              <ChevronLeftIcon sx={{ color: 'white' }} />
            )}
          </IconButton>
        </DrawerHeader>
        <Divider sx={{ borderColor: 'rgba(255, 204, 0, 0.1)' }} />
        <List component="nav" sx={{ p: 1.5 }}>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton 
                onClick={() => !item.disabled && navigateTo(item.path)} 
                disabled={item.disabled} 
                sx={{ 
                  borderRadius: '12px', 
                  bgcolor: activeSection === item.section ? 'rgba(255, 204, 0, 0.2)' : 'transparent', 
                  '&:hover': { bgcolor: 'rgba(255, 204, 0, 0.1)' } 
                }}
              >
                <ListItemIcon sx={{ color: activeSection === item.section ? '#ffcc00' : 'rgba(255, 255, 255, 0.7)' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  secondary={!isMobile ? item.description : undefined}
                  primaryTypographyProps={{ 
                    fontWeight: activeSection === item.section ? 700 : 500, 
                    color: activeSection === item.section ? '#ffcc00' : 'inherit' 
                  }}
                  secondaryTypographyProps={{ 
                    fontSize: '0.75rem', 
                    color: 'rgba(255,255,255,0.5)' 
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </SwipeableDrawer>
      
      <MobileBottomNav value={mobileBottomValue} onChange={handleMobileNavChange} showLabels>
        {menuItems.filter(item => !item.disabled).map((item) => (
          <BottomNavigationAction 
            key={item.section} 
            label={item.text === 'Mi Información' ? 'Inicio' : item.text} 
            icon={item.mobileIcon || item.icon} 
          />
        ))}
      </MobileBottomNav>
      
      <Main open={drawerOpen && isDesktop}>
        <DrawerHeader />
        <Container maxWidth="xl" disableGutters={isMobile} sx={{ px: isMobile ? 1 : 0 }}>
          <AnimatePresence mode="wait">
            <motion.div 
              key={pathname} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -20 }} 
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </Container>
      </Main>
      
      <Zoom in={showScrollTop}>
        <Fab 
          onClick={scrollToTop} 
          color="primary" 
          size="large" 
          sx={{ 
            position: 'fixed', 
            bottom: isMobile ? 85 : 20, 
            right: 20, 
            background: 'linear-gradient(135deg, #ffcc00, #ffd700)', 
            '&:hover': { background: '#ffdd44' } 
          }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      </Zoom>
    </Box>
  );
}
