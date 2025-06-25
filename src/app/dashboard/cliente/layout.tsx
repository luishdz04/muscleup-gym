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
} from '@mui name=cliente-layout-fixed-v3.tsx
'use client/material';
import { styled, alpha } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/';

import React, { useState, useEffect, ReactNode } from client';

// ICONOS
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import PersonIcon from '@mui'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Box, /icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
  Drawer, 
  AppBar, 
  Toolbar, 
  Typography, 
  Divider, 
  IconButton, 
  List, 
  ListItem, 
  
import NotificationsIcon from '@mui/icons-material/Notifications';
import SearchIcon from '@mui/ListItemIcon, 
  ListItemText, 
  Avatar, 
  Menu, 
  MenuItem, 
  Tooltip,
  useMediaQuery,
  useTheme,
  ListItemicons-material/Search';
importButton,
  LinearProgress,
  Container,
  Chip,
  Badge,
  SwipeableDrawer,
  Bott PaymentIcon from '@mui/icons-material/Payment';
import ShomNavigation,
  BottomNavigationAction,
  oppingCartIcon from '@mui/icons-material/ShoppingCart';Fab,
  Zoom
} from '@mui/material';
import { styled, alpha } from '@mui
import HistoryIcon from '@mui/icons-material/History';
import AccountCircleIcon from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserSupabase/icons-material/AccountCircle';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';Client } from '@/lib/supabase/client';

// ICONOS
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/
import CloseIcon from '@mui/icons-material/Close';
import HomeIcon from '@mui/icons-material/Home';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import AccessTimeIcon from '@mui/icons-material/AccessLogout';
import NotificationsIcon from '@mui/icons-material/Time';
import LoginIcon from '@mui/icons-material/Login';Notifications';
import SearchIcon from

// CONSTANTE DE ANCHO DEL DRAWER (como en admin)
const drawerWidth = 260;

// ESTI '@mui/icons-material/Search';
import PaymentIcon from '@mui/icons-material/Payment';
import ShoppingCartIcon from '@LOS DE COMPONENTES - MAIN CORREGIDO COMO EN ADMIN
const Main = styled('mainmui/icons-material/ShoppingCart';
import HistoryIcon from '@mui/icons-material/History';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import CloseIcon from '@mui/icons-material/Close', { shouldForwardProp: (prop) => prop !== '';
import HomeIcon from '@muiopen' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme/icons-material/Home';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Access.transitions.duration.leavingScreen,
  }),
  marginTimeIcon from '@mui/icons-material/AccessTime';
import LoginLeft: `-${drawerWidth}Icon from '@mui/icons-material/Login';

// CONSTANTEpx`,
  backgroundColor: '#0a0a0a',
  backgroundImage: `
    radial-gradient(circle at 25px 25px, rgba(255,204,0,0.08) DE ANCHO DEL DRAWER (como en admin)
const dra 2%, transparent 0%), 
    radial-gradient(circlewerWidth = 260;

// ESTILOS DE COMPONENTES - MAIN CORREGIDO COMO EN ADMIN
const Main = styled('main', { shouldForwar at 75px 75px, rgba(255,204,0,dProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing0.04) 2%, transparent 0%)
  `,(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    
  backgroundSize: '100px 100px',
  minHeight: '100vh',
  color:duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${dra '#fff',
  position: 'relative',
  
  //werWidth}px`,
  backgroundColor Mobile
  [theme.breakpoints: '#0a0a0a.down('sm')]: {
    marginLeft: 0,',
  backgroundImage: `
    radial-gradient(circle at 25px 25px, rgba(255,204,0,0
    padding: theme.spacing(1),
    paddingBottom: '80px', // Espacio para el bottom nav
  },
  
  //.08) 2%, transparent 0%), 
    radial- Cuando está abierto
  ...(open && {
    transition: theme.transitions.create('margin', {gradient(circle at 75px 75px, rgba(255,204
      easing: theme.transitions.easing.easeOut,,0,0.04) 
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));

const DrawerHeader = styled('div')(({2%, transparent 0%)
  `,
  backgroundSize: ' theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding100px 100px',
  : theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyminHeight: '100vh',
  color: '#fff',
  position: 'relative',
  Content: 'space-between',
}));

const
  // Mobile - sin margin negativo
  [theme.breakpoints AppBarStyled = styled(AppBar, {
  shouldForwardProp:.down('sm')]: {
    marginLeft: 0,
    padding: theme.spacing(1),
     (prop) => prop !== 'paddingBottom: '80px', // Espacio para navegación inferior
  },
  
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.open',
})<{ open?: boolean }>(({ theme,transitions.easing.easeOut,
      duration: theme.transitions open }) => ({
  transition: theme.transitions.create(['margin.duration.enteringScreen,
    }),
    marginLeft: ', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leav0,
  }),
}));ingScreen,
  }),
  background: 'rgba(0, 0, 0

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',, 0.95)',
  back 
  alignItems: 'center', 
  justifyContent: 'spacedropFilter: 'blur(20px)',
  boxShadow: '0 4px 30px rgba(0,-between', 
  ...theme.mixins.toolbar,0,0,0.8)',
  borderBottom: '1px solid rgba(255, 204, 0, 0.15)',
  ...(open && {
    width: `calc(100% - ${dra
  padding: theme.spacing(0, 1),
}));

const ResponsiveAppBar = styled(AppBar)(werWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme({ theme }) => ({
  transition: theme.transitions.create(['margin.transitions.create(['margin', 'width'], {
      easing', 'width'], {
    easing: theme.transitions.e: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),asing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  
}));

// Componente de búsqueda simplificado
const Searchbackground: 'rgba(0, 0, 0, 0 = styled('div')(({ theme }).95)', 
  backdropFilter: 'blur(20px)',
  boxShadow: '0 4px 30px rgba(0, => ({
  position: 'relative',
  borderRadius: '25px',
  backgroundColor: alpha(0,0,0.8)', 
  borderBottom: '1px solid rgba(255, 204theme.palette.common.white,, 0, 0.15)',
}));

const StyledAppBar = styled(ResponsiveAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<{ open?: boolean }>(({ theme, 0.12),
  border: '1px solid rgba(255, 204, 0, 0.2)',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.common open }) => ({
  ...(open && {
    width.white, 0.18),
    borderColor: 'rgba(255,: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 204, 0, 0 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration.4)'
  },
  display: 'none',
  [theme.breakpoints: theme.transitions.duration.enter.up('md')]: {
    display: 'block',
    marginRight: theme.spacing(2),
    marginLeft: theme.spacing(2),ingScreen,
    }),
  }),
}));

// Componente de búsqueda
const Search
    width: '100%',
    maxWidth: '350px'
  },
}));

const = styled('div')(({ theme }) SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: ' => ({
  position: 'relative', 
  borderRadius: '25px', 
  backgroundColor: alpha(themeabsolute',
  pointerEvents:.palette.common.white,  'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  0.12),
  border: '1px solid rgba(255, 204, 0, 0.2)', 
  transition: 'all 0.3s easecolor: 'rgba(255, 204, 0, 0',
  '&:hover': {.7)'
}));

const Style 
    backgroundColor: alpha(theme.dInputBase = styled('input')(({ theme }) => ({
  color: 'inherit',
  border: 'none',
  backgrounpalette.common.white, 0.18), 
    borderColor: 'rgba(255, 204, 0, 0d: 'transparent',
  width: '100%',
  fontFamily: 'inherit',
  fontSize.4)'
  },
  display: 'none',
  [theme.breakpoints.up('md')]: { 
    display: 'block',
    marginRight: theme.spacing(2),: '0.875rem',
  padding: theme.spacing(1.2 
    marginLeft: theme.spacing(2), 
    width: '100%',, 2, 1.2, 0),
  paddingLeft: `calc(1em 
    maxWidth: '350px'
  },
})); + ${theme.spacing(4)})`,
  transition: theme.

const SearchIconWrapper = styled('transitions.create('width'),
  '&:focus': {div')(({ theme }) => ({ 
  padding: theme.spacing outline: 'none' },
  (0, 2), 
  height: '100%', 
  position: 'absolute','&::placeholder': { color: 'rgba(255, 
  pointerEvents: 'none', 
  display: 'flex', 
  align 255, 255, 0.5)' }
}));

const MobileBottomNav = styled(BottomNavigationItems: 'center', 
  justifyContent: 'center',)(({ theme }) => ({
  position: 'fixed',
   
  color: 'rgba(255, 204, 0, 0bottom: 0,
  left: 0,
  right:.7)' 
}));

const St 0,
  zIndex: 1300,
  backgroundColor: 'rgba(0, 0, 0yledInputBase = styled('input')(({ theme }) => ({ 
  color: 'inherit', 
  border: 'none', 
  , 0.95)',
  backbackground: 'transparent', 
  width: '100%', 
  fontFamily: 'inherit', 
  dropFilter: 'blur(20px)',
  borderTop: '1px solid rgba(fontSize: '0.875rem', 
  padding: theme.spacing(1.2, 2255, 204, 0,, 1.2, 0), 
  paddingLeft: `calc(1em 0.2)',
  height: '70px',
  '& .MuiBottomNavigationAction-root': {
     + ${theme.spacing(4)})`, 
  transition: themecolor: 'rgba(255, 255, 255, 0.6)',
    minHeight: '70px',
    padding.transitions.create('width'), 
  '&:focus': {: '8px 0',
    '& outline: 'none' }, 
  '&::placeholder':.Mui-selected': { { color: 'rgba(255, 255, 255, 0.5)' } 
}));

const MobileBottomNav = styled(BottomNavigation color: '#ffcc00' },
    '& .MuiBottomNavigationAction-label': {
      fontSize: '0.7rem',
      fontWeight: )(({ theme }) => ({
  position: 'fixed', 
  bottom: 0,600
    }
  },
  [theme.breakpoints.up('sm 
  left: 0, 
  right: 0,')]: { display: 'none' }, 
  zIndex: 1300, 
  backgroundColor: 'rgba
}));

// INTERFACES Y TIPOS
interface ClienteLayoutProps {(0, 0, 0, 0.95 children: ReactNode; }
interface MenuItemDef {
  text: string;
  path)',
  backdropFilter: 'blur(20px)', 
  borderTop: '1: string;
  icon: React.ReactElement;
  section:px solid rgba(255, 204, 0, 0.2)', 
  height: '70px',
  '& .MuiBottomNavigationAction-root': { 
    color string;
  description?: string;
  disabled?: boolean;
  mobileIcon?: React.ReactElement;
}: 'rgba(255, 255, 255, 0.6

export default function ClienteLayout({ children }: ClienteLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  )', 
    minHeight: '70px', 
    padding
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));: '8px 0',
    '&.Mui-
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  
  const [open, setOpen] = useState(false);
  const [userMenuAnchorselected': { color: '#ff, setUserMenuAnchor] = useState<null | HTMLElement>(cc00' },
    '&null);
  const [user .MuiBottomNavigationAction-label': { 
      fontSize: '0.7rem', 
      fontWeight:, setUser] = useState<any 600 
    }
  },
  [theme.breakpoints.up('sm>(null);
  const [activeSection, setActiveSection] = useState<string>('');
  const [loading')]: { display: 'none' },
}));

// INTERFACES
interface ClienteLayoutProps { children: ReactNode; }, setLoading] = useState(
interface MenuItemDef { 
  textfalse);
  const [searchValue: string; 
  path: string; 
  icon: React.ReactElement; 
  section, setSearchValue] = useState(': string; 
  description?: string; 
  disabled?: boolean; 
  mobileIcon?: React.ReactElement; 
}

export default function ClienteLayout({ children ');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mobileBottomValue, setMobileBottomValue] = useState(0);

  const menuItems: MenuItemDef[] =}: ClienteLayoutProps) { [
    {
      text:
  const pathname = usePathname(); 'Mi Información',
      path: '/dashboard/cliente',
      icon: <AccountCircleIcon />,
      m
  const router = useRouter();
  const theme = useTheme();
  
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDesktop = useMediaQuery(theme.obileIcon: <HomeIcon />,
      section: 'info',
      description: 'Gestiona tu perfil personal'
    },
    {
      text: 'Pagos',
      path: '/dashboard/cliente/pagos',
      breakpoints.up('md'));
  
  const [open, seticon: <PaymentIcon />,
      mobileIcon: <PayOpen] = useState(true); // Drawer abierto por defecto en desktop
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(mentIcon />,
      section: 'pagos',
      description: 'Historial de membresías'
    },
    {
      text: 'Compras',
      path: '/dashboarnull);
  const [user, setUser] = useState<anyd/cliente/compras',
      >(null);
  const [activeSection, setActiveSection] = useState<string>('');
  const [loading, setLoading] = useState(icon: <ShoppingCartIcon />,
      mobileIcon: <ShoppingCartIcon />,
      false);
  const [searchValuesection: 'compras',
      description: 'Productos y servicios'
    },
    , setSearchValue] = useState('{
      text: 'Accesos',
      path: '/dashboard/cliente/accesos',
      icon: <LoginIcon />,
      mobileIcon');
  const [showScrollTop, setShowScrollTop] =: <AccessTimeIcon />,
      section: useState(false);
  const [mobileBottomValue, setMobileBottomValue] 'accesos',
      description: 'Historial de ent = useState(0);

  const menuItems: MenuItemDef[] = [
    { 
      text: 'Miradas al gym'
    },
    {
      text: 'Historial',
      path: '/dashboard/cliente/historial',
      icon Información', 
      path: '/dashboard/cliente', 
      icon: <AccountCirc: <HistoryIcon />,
      mobileIcon: leIcon />, 
      m<HistoryIcon />,
      section: 'historial',
      description: 'Próximamente',
      disabled: true
    }
  ];

  // Abrir drawer automáticamente en desktop
  useEffect(() => {obileIcon: <HomeIcon />, 
      section: 'info', 
      description: '
    setOpen(isDesktop);
  }, [isGestiona tu perfil personal' 
    },
    { Desktop]);

  useEffect(() => {
    const handle
      text: 'PagScroll = () => setShowScrollTop(window.scrollYos', 
      path: '/dashboard/cliente/pagos', 
      icon > 300);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return: <PaymentIcon />, 
      mobileIcon: <PaymentIcon />, 
      section: 'pagos', 
      description: 'Historial de membresías' 
    },
    { 
      text: 'Compras', 
      path: '/ () => window.removeEventListener('scroll', handleScroll);
  dashboard/cliente/compras', }, []);

  useEffect(() => {
    async function getUserData() {
      setLoading(true);
      const supabase = createBrowserSupa
      icon: <ShoppingCartIcon />, 
      mobileIcon: <ShoppingCartIcon /baseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          const response>, 
      section: 'compras', 
      description: 'Productos y servicios' 
    },
    { 
      text: 'Acc = await fetch(`/api/user-esos', 
      path: '/dashboard/cliente/accesos', 
      icon: <LoginIcon />, 
      mobileIcon: <AccessTimeIcon />, 
      section: 'accesos', 
      description: 'Historial de entradas al gym' 
    },
    { 
      text: 'Historial', 
      path:profile?userId=${session.user.id}`); '/dashboard/cliente/historial', 
      icon: <HistoryIcon />, 
      mobileIcon: <HistoryIcon />, 
      
          if (response.ok) setUser(await response.json());section: 'historial', 
      description: 'Pró
        } catch (error) {
          console.error("Error fetching user data:", error);
        ximamente', 
      disabled: true 
    }
  ];

  use}
      }
      setLoading(false);
    }Effect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY
    getUserData();
  }, [ > 300);
    window.addEventListener('scroll]);
  
  useEffect(() => {
    if (pathname) {
      const pathP', handleScroll, { passive: true });
    returnarts = pathname.split('/');
      const currentSection = pathParts[pathP () => window.removeEventListener('scroll', handleScroll);
  arts.length - 1] || '';
      const sectionId = currentSection ===}, []);

  useEffect(() 'cliente' ? 'info' : current => {
    async function getUserData() {
      setLoading(true);
      constSection;
      setActiveSection(sectionId);
      const activeIndex = menuItems.findIndex(item => item.section === sectionId);
      if (activeIndex !== -1) setMobileBottomValue(activeIndex);
    }
  }, [pathname]);
  
  const navigateTo = (path: string) => {
    router.push(path);
    if supabase = createBrowserSupabaseClient();
      const { data (isMobile) setOpen(false);
  };
  
  const handleLogout = async () => {
    setLoading(true);
    const: { session } } = await supabase.auth.getSession();
      if supabase = createBrowserSup (session) {
        try {
          const response = await fetch(`/api/user-profile?userId=${session.user.iabaseClient();
    await supabase.auth.signOut();
    router.push('/login');
    setLoading(false);
  };
  
  const handleUserMenuOpen = (event: React.d}`);
          if (response.ok) setMouseEvent<HTMLElement>) => setUserMenuAnchor(event.User(await response.json());
        } catch (error) { 
          console.error("Error fetching user data:", error); 
        }
      }
      setLoading(false);
    }
    getUserData();
  },currentTarget);
  const handleUserMenuClose = () => setUserMenuAnchor(null);
   []);
  
  useEffect(() => {
    if (pathname) {
      const pathPconst handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(falsearts = pathname.split('/');
      const currentSection = pathParts[pathParts.length - 1] || '';
      const sectionId = currentSection === 'cliente' ? 'info' : currentSection;
      setActiveSection(sectionId);
      const activeIndex = menuItems.findIndex(item => item.section === sectionId);
      if (activeIndex !==);
  const scrollToTop = () => window.scroll -1) setMobileBottomValue(activeIndex);
    }
  }, [pathnameTo({ top: 0, behavior: 'smooth' });

  ]);
  
  const handleDrawerTogconst handleMobileNavChange = (event: React.SyntheticEvent, newValue: number) => {
    const selectedItem = menuItems.filtergle = () => {
    setOpen(!open);
  };(item => !item.disabled)[newValue];
    if (selectedItem) {
      navig
  
  const navigateTo = (path: string) => {
    router.push(pathateTo(selectedItem.path);
    );
  };
  
  const handleLogout = async () => {
    setLoading(true);
    const supabase = createBrowser}
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBarStyled position="fixed" openSupabaseClient();
    await supabase.auth.signOut();
    router.push('/login={open && !isMobile}>
        {');
    setLoading(false);
  };
  
  const handleUserloading && (
          <LinearProgressMenuOpen = (event: React.Mouse
            sx={{
              position: 'absolute',
              top: 0,
              left: 0Event<HTMLElement>) => setUserMenuAnchor(event.currentTarget);
  const handleUser,
              right: 0,
              height: '3px',
              '& .MuiLinearProgress-bar': {
                background: MenuClose = () => setUserMenuAnchor(null);

  const scroll'linear-gradient(90deg, #ffcc00,ToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleMobileNavChange #ffd700)'
              }
            }}
          />
        )}
        <Toolbar>
          <IconButton
            color="inherit"
            aria = (event: React.SyntheticEvent, newValue: number) => {
    const selectedItem = menuItems.filter-label="open drawer"
            onClick={handleDrawerOpen}(item => !item.disabled)[
            edge="start"
            sx={{ mr: 2, ...(open && { display: 'none' }) }}
          >
            newValue];
    if (selectedItem) {
      navigateTo(selectedItem.path);
    }
  };

  return<MenuIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: (
    <Box sx={{ display: 'flex' }}>
      <StyledAppBar position="fixed" open={open && !isMobile}>
        { 'center', mr: { xs: 1, sm: 2, md: 3 } }}>
            <Box
              component="img"
              sx={{ height: { xs: 40, sm: 50loading && (
          <LinearProgress 
            sx={{ 
              position:, md: 55 }, mr 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              height: '3px', 
              '& .MuiLinearProgress: { xs: 1, sm: -bar': { 
                background: 'linear-gradient(902 } }}
              src="/logo.png"
              alt="Muscle Up Gym Logo"
            />
            deg, #ffcc00, #ffd700)' 
              } 
            }} 
          />
        )}
        <Toolbar>
          <IconButton
            color="inherit"
            aria<Typography
              variant="h6"
              noWrap
              sx={{
                display: { xs: 'none', sm: 'block' },
                fontWeight: 700,
                letterSp-label="open drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ 
              mr: 2, 
              ...(open && !isMobile && { display: acing: 1.5
              }}
            >
              PANEL DE CLIENTE
            </Typography>
          </Box>
          
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            'none' }),
              '&:hover': { backgroundColor: <StyledInputBase
              placeholder="Buscar en mi cuenta..."
              value={searchValue}
              onChange={('rgba(255, 204, 0, 0.1)e) => setSearchValue(e.target.value)}
            ' }
            }}
          >
            <MenuIcon />
          />
          </Search>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Box sx={{ display: 'flex', alignItems: '</IconButton>
          
          <Box sx={{ displaycenter', gap: { xs: 0: 'flex', alignItems:.5, sm: 1 } }}>
             'center', mr: 2 }}>
            <Box 
              component<Tooltip title="Notificaciones">
              <IconButton color="inherit">
                <Badge="img" 
              sx={{ height: { xs: 40, sm: 50, md: 55 }, mr: { badgeContent={3} color="error">
                  <NotificationsIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title={`Perf xs: 1, sm: 2 } }} 
              src="/logo.png" 
              alt="Muscle Up Gym Logo" 
            />
            <Typography 
              variant="il de ${user?.firstName || 'Usuario'}`}>
              <IconButton
                onClick={handleUserMenuOpen}
                size="small"
                sx={{ ml: { xs: 0.5, sm: 1 }h6" 
              noW }}
              >
                <Avatarrap
              component="div"
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
                  alt={user?.firstName}
                  src={user?.profilePictureUrl}
                  sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}
                />
              
              placeholder="Buscar en mi cuenta..." 
              value={searchValue} 
              onChange={(e) => setSearchValue(e.target.</IconButton>
            </Tooltip>
          </Box>
          value)} 
            />
          </Search>
          
          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={handleUserMenuClose}
            P
          <Box sx={{ flexGrow: 1 }} />aperProps={{
              sx: {
                mt: 1.5,
                minWidth: 280,
                bgcolor
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
            : 'rgba(18,18,18,0.95)',<Tooltip title="Notificaciones">
              <IconButton
                backdropFilter: 'blur(10px)',
                color: 'white',
                border: '1px solid rgba(255,204,0 color="inherit">
                <Badge badgeContent={3,0.2)',
                borderRadius: 2
              }
            }}
          } color="error">
                  <NotificationsIcon sx={{ fontSize: {>
            <MenuItem onClick={() => { xs: 20, sm: 24 } }} />
                 handleUserMenuClose(); navigateTo('/dashboard/cliente'); }}>
              <ListItemIcon>
                <Person</Badge>
              </IconButton>
            </Tooltip>
            Icon fontSize="small" sx={{ color: '#ffcc00' }} />
              </ListItemIcon>
              Mi Perfil
            </MenuItem>
            <Tooltip title={`Perfil de ${user?.firstName || 'Usuario'}`}>
              <IconButton 
                onClick={handleUserMenuOpen} <Divider sx={{ my: 1, borderColor: 'rgba(255,
                size="small" 
                sx255,255,0.1)'={{ ml: { xs: 0.5, sm: 1 } }}
              >
                <Avatar }} />
            <MenuItem onClick={handleLogout} sx={{ color: '#ff6b6b' }}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" sx 
                  alt={user?.firstName} 
                  src={user?.profilePictureUrl} 
                  ={{ color: '#ff6b6b' }} />
              </ListItemIcon>
              Cerrar Sesión
            </MenuItem>sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }} 
                />
              
          </Menu>
        </Toolbar>
      </AppBarStyled>
      
      <Drawer
        sx={{
          width: drawerWidth</IconButton>
            ,
          flexShrink: 0,
          '& .MuiDrawer-paper':</Tooltip>
          </Box>
          
          <Menu {
            width: drawerWidth,
            boxSizing:  
            anchorEl={userMenuAnchor} 
            open={Boolean(userMenuAnchor)} 
            onClose={handle'border-box',
            background: 'linear-gradient(180deg, rgb(12, 12, 12) UserMenuClose} 
            PaperProps={{ 
              sx: { 
                mt0%, rgb(18, 18, 18: 1.5, 
                minWidth: 280, 
                bgcolor: 'rgba(18,18,18,0.95)', 
                backdropFilter: 'blur(10px)', 
                color: 'white', 
                border: '1px) 100%)',
            color: 'white',
            borderRight: '1px solid rgba(255, 204, 0, 0.1)'
          },
        }}
        variant={isMobile ? 'temporary' : 'persistent'}
        anchor="left" solid rgba(255,204,0,0.2)',
                borderRadius: 2
              } 
            }}
        open={open}
        onClose={handleDrawerClose}
        ModalProps={{
          keepMounted: true,
        }}
          >
            <MenuItem onClick={()
      >
        <DrawerHeader => { handleUserMenuClose(); navigateTo('/dashboard/cliente'); }}>
              <ListItemIcon>
                <Person>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box componentIcon fontSize="small" sx={{ color: '#ffcc00' }} />
              </ListItemIcon>
              Mi Perfil
            </MenuItem>
            <Divider sx="img" sx={{ height: ={{ my: 1, borderColor: 'rgba(255,255,255,0.1)'45, mr: 1.5 }} src="/logo.png }} />
            <MenuItem onClick={handleLogout}" alt="Logo"/>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffcc00', fontSize: ' sx={{ color: '#ff6b6b' }}>
              <ListItemIcon>
                1.1rem' }}><LogoutIcon fontSize="small"
              MUP
            </Typography>
          </Box>
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon sx={{ color: ' sx={{ color: '#ff6b6b' }} />
              </ListItemIcon>
              Cerrar Sesión
            </MenuItemwhite' }} />
          </IconButton>
        </DrawerHeader>
          </Menu>
        >
        <Divider sx={{ borderColor:</Toolbar>
      </StyledAppBar>
      
      <Drawer
        sx 'rgba(255, 204, 0, 0.1)' }} />
        <List component="nav" sx={{ p: 1={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: .5 }}>
          {menuItems.map((item) => ('border-box',
            background: 'linear-gradient(180
            <ListItem key={item.text} disablePadding sx={{ mbdeg, rgb(12, 12, 12) 0%, rgb(18, 18, 18: 0.5 }}>
              <ListItemButton
                onClick={() => !item.disabled && navigateTo() 100%)', 
            color: 'white', 
            borderRight: '1px solid rgba(255, 204, 0, 0.1)'
          },
        }}
        variant={isMobile ? 'temporary' :item.path)}
                disabled={item.disabled}
                sx={{
                  borderRadius: '12px',
                  bgcolor 'persistent'}
        anchor="left": activeSection === item.section ? 'rgba(255, 204, 0, 0.2
        open={isMobile ? false : open}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
      >
        )' : 'transparent',
                  '&:hover': { bgcolor: 'rgba(255, 204, 0, 0<DrawerHeader>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box component=".1)' },
                  py: 1.2,
                  px: 2
                }}
              >
                <ListItemIcon sx={{
                  color: activeSection === item.section ? '#ffcc00' : 'img" sx={{ height: 45, mr: 1.5 }} src="/logo.pngrgba(255, 255, 255, 0.7)',
                  minWidth: 40" alt="Logo"/>
            <Typography variant="h6" sx={{ fontWeight: 700, color
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItem: '#ffcc00', fontSize: '1.1rem' }}>
              MUP
            </Typography>
          Text
                  primary={item.text}
                  secondary={!isMobile ? item.description : undefined}
                  primaryTypographyProps={{
                    fontWeight: activeSection === item.section</Box>
          <IconButton onClick={handleDrawerToggle} size ? 700 : 500,
                    color: activeSection="small">
            <ChevronLeftIcon sx={{ color: 'white', fontSize: 20 === item.section ? '#ffcc00' : 'inherit',
                    fontSize: '0. }} />
          </IconButton>
        </DrawerHeader>95rem'
                  }}
                  secondaryTypographyProps={{
                    fontSize: '0.75
        <Divider sx={{ borderColor:rem',
                    color: 'rgba(255, 'rgba(255, 204, 0, 0.1)' }} />
        <List component="nav" sx={{ p: 1.5 }}>
          {menu255,255,0.5)'
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
      
      <MobileBottomNav value={mobileBottomValue} onChange={handleMobileNavChange} showLabels>
        {menuItems.filterItems.map((item) => (
            <ListItem key={item.text} disablePadding sx(item => !item.disabled).map((item) => (
          <BottomNavigationAction
            key={{ mb: 0.5 }}>
              <ListItemButton 
                onClick={() => !item.disabled && navigateTo(={item.section}
            label={item.text === 'Mi Información' ? 'item.path)} 
                disabled={item.disabled} 
                sx={{ 
                  borderRadius: '12px', 
                  bgcolor: activeInicio' : item.text}
            icon={item.mobileIcon || itemSection === item.section ? '.icon}
          />
        ))}
      </MobileBottomNav>
      rgba(255, 204, 0, 0.2
      <Main open={open && !isMobile}>
        <DrawerHeader />
        <Container)' : 'transparent', 
                  ' maxWidth="lg" sx={{ mt: 2 }}>
          <Anim&:hover': { bgcolor: 'rgba(255, 204, 0, 0.1)' },atePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 
                  py: 1.2,
                  px: 20, y: 20 }}
              animate={{ opacity: 1
                }}
              >
                <ListItemIcon sx={{ 
                  color: activeSection === item.section ? '#ffcc00' : 'rgba, y: 0 }}
              exit={{ opacity: 0,(255, 255, 255, 0.7 y: -20 }}
              transition={{ duration: 0.3 }})',
                  minWidth: 40
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItem
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </Container>
      </Main>
      
      Text 
                  primary={item.text<Zoom in={showScrollTop}>
        <Fab
          onClick={scrollToTop}
          color} 
                  secondary={item.description}
                  primaryTypographyProps={{ 
                ="primary"
          size="large"
          sx={{
            position    fontWeight: activeSection === item.section ? 700 : 500, 
                    color: activeSection: 'fixed',
            bottom === item.section ? '#ffcc00' : 'inherit',
                    fontSize: '0.95rem'
                  }}
                : isMobile ? 85 : 20  secondaryTypographyProps={{ 
                    fontSize: '0.75rem', 
                    color:,
            right: 20,
            background: 'linear-gradient(135 'rgba(255,255,255,0.5)' 
                  }}
                />
              </ListItemButton>deg, #ffcc00, #ffd700)',
            '
            </ListItem>
          ))}
        </List>
      </Drawer>
      
      <Main open={open && !isMobile}>
        <DrawerHeader />
        <Container 
          maxWidth={false}
          sx={{ 
            maxWidth: '1400px',
            mx: 'auto',&:hover': { background: '#ffdd44' }
          }}
        >
          <KeyboardArrowUpIcon />
        
            px: { xs: 1, sm: 2, md: 3 }
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div 
              key={pathname}</Fab>
      </Zoom>
    </Box>
  );
}
