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
  Chip
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

const drawerWidth = 290;

// ESTILOS PERSONALIZADOS
const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  backgroundColor: '#0a0a0a',
  backgroundImage: `
    radial-gradient(circle at 25px 25px, rgba(255,204,0,0.1) 2%, transparent 0%), 
    radial-gradient(circle at 75px 75px, rgba(255,204,0,0.05) 2%, transparent 0%)
  `,
  backgroundSize: '100px 100px',
  minHeight: '100vh',
  color: '#fff',
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: '25px',
  backgroundColor: alpha(theme.palette.common.white, 0.12),
  border: '1px solid rgba(255, 204, 0, 0.2)',
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.18),
    borderColor: 'rgba(255, 204, 0, 0.4)',
  },
  '&:focus-within': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
    borderColor: '#ffcc00',
    boxShadow: '0 0 0 2px rgba(255, 204, 0, 0.2)',
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
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
  padding: theme.spacing(1, 1, 1, 0),
  paddingLeft: `calc(1em + ${theme.spacing(4)})`,
  paddingRight: theme.spacing(2),
  transition: theme.transitions.create('width'),
  fontFamily: 'inherit',
  fontSize: '0.875rem',
  [theme.breakpoints.up('md')]: {
    width: '25ch',
  },
  '&:focus': {
    outline: 'none',
    width: '35ch',
  },
  '&::placeholder': {
    color: 'rgba(255, 255, 255, 0.5)',
  }
}));

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
}

export default function ClienteLayout({ children }: ClienteLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [user, setUser] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  
  // MENÚ DEL CLIENTE
  const menuItems: MenuItem[] = [
    { 
      text: 'Mi Información', 
      path: '/dashboard/cliente', 
      icon: <AccountCircleIcon />,
      section: 'info',
      description: 'Gestiona tu perfil personal'
    },
    { 
      text: 'Pagos', 
      path: '/dashboard/cliente/pagos', 
      icon: <PaymentIcon />,
      section: 'pagos',
      description: 'Historial de membresías'
    },
    { 
      text: 'Compras', 
      path: '/dashboard/cliente/compras', 
      icon: <ShoppingCartIcon />,
      section: 'compras',
      description: 'Productos y servicios'
    },
    { 
      text: 'Historial de Accesos', 
      path: '/dashboard/cliente/historial', 
      icon: <HistoryIcon />,
      section: 'historial',
      description: 'Próximamente',
      disabled: true
    }
  ];
  
  // OBTENER DATOS DEL USUARIO
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
  
  // ACTUALIZAR SECCIÓN ACTIVA
  useEffect(() => {
    if (pathname) {
      const pathParts = pathname.split('/');
      const section = pathParts[pathParts.length - 1] || '';
      setActiveSection(section === 'cliente' ? 'info' : section);
    }
  }, [pathname]);
  
  // MANEJAR CIERRE DE SESIÓN
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
  
  // FUNCIÓN PARA NAVEGAR
  const navigateTo = (path: string) => {
    router.push(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };
  
  // HANDLERS PARA MENÚ DE USUARIO
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* BARRA SUPERIOR */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          background: '#000000',
          backdropFilter: 'none',
          boxShadow: '0 4px 20px 0 rgba(0,0,0,0.8)',
          borderBottom: '1px solid rgba(255, 204, 0, 0.15)'
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
              background: 'rgba(255,204,0,0.1)',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #ffcc00, #ffd700)'
              }
            }} 
          />
        )}
        
        <Toolbar sx={{ minHeight: '100px !important', px: { xs: 2, sm: 3 } }}>
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
              }
            }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* ÁREA DEL LOGO */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
            <Box 
              component="img"
              sx={{ 
                height: 65,
                width: 'auto',
                mr: 2,
                filter: 'drop-shadow(0 2px 4px rgba(255,204,0,0.3))'
              }}
              src="/logo.png"
              alt="Muscle Up Gym"
            />
            
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FitnessCenterIcon 
                  sx={{ 
                    color: '#ffcc00', 
                    fontSize: 24,
                    filter: 'drop-shadow(0 1px 2px rgba(255,204,0,0.3))'
                  }} 
                />
                <Typography 
                  variant="h5" 
                  sx={{ 
                    color: 'rgba(255,255,255,0.95)',
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
                    backgroundColor: '#ffcc00',
                    color: '#000',
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
          
          <Search sx={{ display: { xs: 'none', md: 'flex' }, flexGrow: 0.4, maxWidth: '600px' }}>
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
          
          {/* ÁREA DE NOTIFICACIONES Y USUARIO */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Notificaciones">
              <IconButton 
                color="inherit" 
                sx={{ 
                  mr: 1,
                  position: 'relative',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 204, 0, 0.1)',
                  }
                }}
              >
                <NotificationsIcon />
              </IconButton>
            </Tooltip>
            
            <Chip
              size="small"
              label={`Hola, ${user?.firstName || 'Cliente'}`}
              sx={{
                backgroundColor: 'rgba(255, 204, 0, 0.15)',
                color: '#ffcc00',
                border: '1px solid rgba(255, 204, 0, 0.3)',
                fontWeight: 600,
                display: { xs: 'none', md: 'flex' }
              }}
            />
            
            <Tooltip title={`Perfil de ${user?.firstName || 'Usuario'}`}>
              <IconButton 
                onClick={handleUserMenuOpen}
                size="small"
                edge="end"
                sx={{ 
                  bgcolor: 'rgba(255, 204, 0, 0.2)',
                  ml: 1,
                  border: '2px solid rgba(255, 204, 0, 0.3)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 204, 0, 0.3)',
                  }
                }}
              >
                <Avatar 
                  alt={user?.firstName || "Usuario"} 
                  src={user?.profilePictureUrl || ""}
                  sx={{ 
                    width: 40, 
                    height: 40
                  }}
                >
                  {user?.firstName?.charAt(0) || "C"}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
          
          {/* MENÚ DE USUARIO */}
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
                minWidth: 280,
                background: 'linear-gradient(135deg, rgba(18, 18, 18, 0.98) 0%, rgba(25, 25, 25, 0.95) 100%)',
                backdropFilter: 'blur(20px)',
                color: 'white',
                border: '1px solid rgba(255, 204, 0, 0.2)',
                borderRadius: 2,
                '& .MuiMenuItem-root': {
                  px: 3,
                  py: 1.5,
                  my: 0.5,
                  mx: 1,
                  borderRadius: 1.5,
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(255, 204, 0, 0.1)',
                  },
                },
              },
            }}
          >
            <Box 
              sx={{ 
                px: 3, 
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
                  width: 60, 
                  height: 60, 
                  mr: 2, 
                  border: '3px solid #ffcc00' 
                }}
                src={user?.profilePictureUrl || ""}
              >
                {user?.firstName?.charAt(0) || "C"}
              </Avatar>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  {user ? `${user.firstName} ${user.lastName}` : "Cliente"}
                </Typography>
                <Chip
                  size="small"
                  label="Miembro Activo"
                  sx={{
                    backgroundColor: '#ffcc00',
                    color: '#000',
                    fontWeight: 600,
                    fontSize: '0.75rem'
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
      </AppBar>
      
      {/* MENÚ LATERAL */}
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: 'linear-gradient(180deg, rgb(12, 12, 12) 0%, rgb(18, 18, 18) 100%)',
            color: 'white',
            borderRight: '1px solid rgba(255, 204, 0, 0.1)',
            backgroundImage: `
              radial-gradient(circle at 20% 50%, rgba(255,204,0,0.05) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255,204,0,0.03) 0%, transparent 50%)
            `,
            boxShadow: 'inset -1px 0 0 rgba(255,204,0,0.1), 4px 0 20px rgba(0,0,0,0.3)'
          },
        }}
        variant={isMobile ? "temporary" : "persistent"}
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {/* HEADER DEL DRAWER */}
        <DrawerHeader sx={{ 
          background: 'linear-gradient(135deg, rgba(18, 18, 18, 0.9) 0%, rgba(25, 25, 25, 0.8) 100%)',
          borderBottom: '1px solid rgba(255, 204, 0, 0.15)',
          minHeight: '100px !important',
          px: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', pl: 1 }}>
            <Box 
              component="img"
              sx={{ 
                height: 50, 
                mr: 2,
                filter: 'drop-shadow(0 2px 4px rgba(255,204,0,0.3))'
              }}
              src="/logo.png"
              alt="Muscle Up Gym"
            />
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <FitnessCenterIcon sx={{ color: '#ffcc00', fontSize: 18 }} />
                <Typography variant="h6" sx={{ 
                  fontWeight: 700,
                  lineHeight: 1.1,
                  background: 'linear-gradient(45deg, #ffcc00, #ffd700)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  MUP
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ 
                color: 'rgba(255,255,255,0.8)',
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
                backgroundColor: 'rgba(255, 204, 0, 0.1)',
              }
            }}
          >
            <ChevronLeftIcon sx={{ color: 'white' }} />
          </IconButton>
        </DrawerHeader>
        
        <Divider sx={{ borderColor: 'rgba(255, 204, 0, 0.1)' }} />
        
        {/* INFORMACIÓN DEL USUARIO EN EL DRAWER */}
        <Box sx={{ 
          p: 2.5, 
          display: 'flex', 
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 204, 0, 0.1)',
          background: 'rgba(255, 204, 0, 0.03)'
        }}>
          <Avatar 
            sx={{ 
              width: 50, 
              height: 50, 
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
              textOverflow: 'ellipsis'
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
                  fontSize: '0.7rem',
                  height: '20px'
                }}
              />
            </Box>
          </Box>
        </Box>
        
        {/* LISTA DE MENÚ */}
        <List 
          component="nav" 
          sx={{ 
            px: 1.5, 
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
                onClick={() => !item.disabled && navigateTo(item.path)}
                disabled={item.disabled}
                sx={{ 
                  minHeight: 52,
                  borderRadius: '12px',
                  px: 2.5,
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
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: 2.5,
                    justifyContent: 'center',
                    color: activeSection === item.section ? '#ffcc00' : 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  secondary={item.description}
                  primaryTypographyProps={{ 
                    fontWeight: activeSection === item.section ? 700 : 500,
                    color: activeSection === item.section ? '#ffcc00' : 'inherit',
                    fontSize: '0.95rem'
                  }}
                  secondaryTypographyProps={{
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.5)'
                  }}
                />
                {item.disabled && (
                  <Chip
                    size="small"
                    label="Pronto"
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: '0.7rem',
                      height: '20px'
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        {/* FOOTER DEL DRAWER */}
        <Box sx={{ 
          p: 2.5, 
          borderTop: '1px solid rgba(255, 204, 0, 0.1)',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(18,18,18,0.2) 100%)',
          mt: 'auto'
        }}>
          <Typography variant="caption" sx={{ 
            color: 'rgba(255,255,255,0.6)',
            fontWeight: 500
          }}>
            © {new Date().getFullYear()} Muscle Up Gym
          </Typography>
          <Typography variant="caption" sx={{ 
            display: 'block', 
            color: '#ffcc00', 
            mt: 0.5,
            fontWeight: 600
          }}>
            Panel de Cliente v1.0.0
          </Typography>
        </Box>
      </Drawer>
      
      {/* CONTENIDO PRINCIPAL */}
      <Main open={drawerOpen && !isMobile}>
        <DrawerHeader />
        <Container maxWidth="xl" disableGutters>
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
  );
}
