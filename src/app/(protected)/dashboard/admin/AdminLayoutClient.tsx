'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
  Collapse,
  useMediaQuery,
  useTheme,
  Badge,
  ListItemButton,
  LinearProgress,
  Container,
  Breadcrumbs,
  Link as MuiLink,
  Chip
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import Link from 'next/link';

// 🎨 ICONOS ORGANIZADOS POR CATEGORÍA
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import PersonIcon from '@mui/icons-material/Person';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SearchIcon from '@mui/icons-material/Search';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import EditIcon from '@mui/icons-material/Edit';

// 🏢 ICONO PROFESIONAL PARA SGI
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';

// 👥 GESTIÓN DE USUARIOS
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import BadgeIcon from '@mui/icons-material/Badge';

// 💪 PLANES (CATÁLOGO DE MEMBRESÍAS)
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import EventIcon from '@mui/icons-material/Event';

// 🔗 MEMBRESÍAS (NUEVO)
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HistoryIcon from '@mui/icons-material/History';

// 💰 PAGOS Y MEMBRESÍAS (ASIGNACIONES + TRANSACCIONES)
import PaymentIcon from '@mui/icons-material/Payment';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

// 🛍️ PUNTO DE VENTA
import StorefrontIcon from '@mui/icons-material/Storefront';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CashRegisterIcon from '@mui/icons-material/PointOfSale';

// 📦 CATÁLOGO
import CategoryIcon from '@mui/icons-material/Category';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import StorageIcon from '@mui/icons-material/Storage';
import QrCodeIcon from '@mui/icons-material/QrCode';

// 📊 REPORTES Y ANÁLISIS
import BarChartIcon from '@mui/icons-material/BarChart';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PieChartIcon from '@mui/icons-material/PieChart';

// 💳 EGRESOS Y GASTOS
import ReceiptIcon from '@mui/icons-material/Receipt';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

// 🔐 CONTROL DE ACCESO
import SecurityIcon from '@mui/icons-material/Security';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DoorFrontIcon from '@mui/icons-material/DoorFront';

// ⚙️ HERRAMIENTAS
import BuildIcon from '@mui/icons-material/Build';
import SettingsIcon from '@mui/icons-material/Settings';
import BackupIcon from '@mui/icons-material/Backup';
import SystemUpdateIcon from '@mui/icons-material/SystemUpdate';

const drawerWidth = 290;

// 🎨 ESTILOS PERSONALIZADOS MEJORADOS
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

// 🏗️ ESTRUCTURA DE MENÚ MEJORADA - ✅ MOVIDA FUERA DEL COMPONENTE
interface MenuItem {
  text: string;
  path?: string;
  icon: React.ReactElement;
  section: string;
  submenu?: boolean;
  parent?: string;
  badge?: number;
  items?: MenuItem[];
  color?: string;
  description?: string;
}

// ✅ DEFINICIÓN COMPLETA DEL MENÚ REESTRUCTURADO - FUERA DEL COMPONENTE
const menuItems: MenuItem[] = [
  { 
    text: 'Dashboard', 
    path: '/dashboard/admin/dashboard', 
    icon: <DashboardIcon />,
    section: 'dashboard',
    description: 'Vista general del sistema'
  },
  
  // 👥 GESTIÓN DE USUARIOS (Ya completado - MUP)
  { 
    text: 'Usuarios', 
    path: '/dashboard/admin/usuarios', 
    icon: <PeopleIcon />,
    section: 'usuarios',
    description: 'Gestión completa de clientes'
  },
  
  // 💪 PLANES (CATÁLOGO DE MEMBRESÍAS) - SIN SUBMENU
  { 
    text: 'Planes', 
    path: '/dashboard/admin/planes', 
    icon: <FitnessCenterIcon />,
    section: 'planes',
    description: 'Catálogo de membresías disponibles'
  },
  
  // 💰 MEMBRESÍAS & PAGOS (UNIFICADO) - REEMPLAZAR AMBAS SECCIONES
  { 
    text: 'Membresías & Pagos', 
    icon: <PaymentIcon />,
    submenu: true,
    section: 'membresias',
    description: 'Gestión completa de membresías y pagos',
    badge: 15,
    items: [
      { 
        text: 'Dashboard', 
        path: '/dashboard/admin/membresias', 
        icon: <DashboardIcon />,
        parent: 'membresias',
        section: 'membresias',
        description: 'Vista general y estadísticas'
      },
      { 
        text: 'Registrar Membresía', 
        path: '/dashboard/admin/membresias/registrar', 
        icon: <PersonAddAltIcon />,
        parent: 'membresias',
        section: 'registrar',
        description: 'Proceso completo usuario + plan + pago'
      },
      { 
        text: 'Historial de Pagos', 
        path: '/dashboard/admin/membresias/historial', 
        icon: <ReceiptLongIcon />,
        parent: 'membresias',
        section: 'historial',
        description: 'Registro de transacciones'
      },
      { 
        text: 'Cupones y Descuentos', 
        path: '/dashboard/admin/membresias/cupones', 
        icon: <LocalOfferIcon />,
        parent: 'membresias',
        section: 'cupones',
        description: 'Gestión de promociones'
      }
    ]
  },
  
  // 🛍️ POS MUP (PUNTO DE VENTA UNIFICADO) - CON SUBMENU
  { 
    text: 'POS MUP', 
    icon: <StorefrontIcon />,
    submenu: true,
    section: 'pos',
    description: 'Sistema de punto de venta completo',
    badge: 8,
    items: [
      { 
        text: 'Punto de Venta', 
        path: '/dashboard/admin/pos', 
        icon: <CashRegisterIcon />,
        parent: 'pos',
        section: 'venta',
        description: 'Terminal de venta principal'
      },
      { 
        text: 'Historial de Ventas', 
        path: '/dashboard/admin/sales/history', 
        icon: <HistoryIcon />,
        parent: 'pos',
        section: 'historial',
        description: 'Registro completo de transacciones'
      },
      { 
        text: 'Gestión de Apartados', 
        path: '/dashboard/admin/layaways/management', 
        icon: <ScheduleIcon />,
        parent: 'pos',
        section: 'apartados',
        description: 'Administración de apartados'
      }
    ]
  },
  
  // 📦 CATÁLOGO
  { 
    text: 'Catálogo', 
    icon: <CategoryIcon />,
    submenu: true,
    section: 'catalogo',
    description: 'Gestión de inventario y productos',
    items: [
      { 
        text: 'Productos', 
        path: '/dashboard/admin/catalogo/productos', 
        icon: <InventoryIcon />,
        parent: 'catalogo',
        section: 'productos'
      },
      { 
        text: 'Proveedores', 
        path: '/dashboard/admin/catalogo/proveedores', 
        icon: <LocalShippingIcon />,
        parent: 'catalogo',
        section: 'proveedores'
      },
      { 
        text: 'Inventario', 
        path: '/dashboard/admin/catalogo/inventario', 
        icon: <StorageIcon />,
        parent: 'catalogo',
        section: 'inventario'
      },
      { 
        text: 'Códigos QR', 
        path: '/dashboard/admin/catalogo/qr', 
        icon: <QrCodeIcon />,
        parent: 'catalogo',
        section: 'codigos-qr'
      }
    ]
  },
  
  // 💳 EGRESOS - CONVERTIR A SUBMENU
  { 
    text: 'Egresos', 
    icon: <ReceiptIcon />,
    submenu: true,
    section: 'egresos',
    description: 'Control de gastos y egresos',
    items: [
      { 
        text: 'Dashboard Egresos', 
        path: '/dashboard/admin/egresos', 
        icon: <MoneyOffIcon />,
        parent: 'egresos',
        section: 'dashboard',
        description: 'Vista general de egresos'
      },
      { 
        text: 'Nuevo Egreso', 
        path: '/dashboard/admin/egresos/nuevo', 
        icon: <ReceiptIcon />,
        parent: 'egresos',
        section: 'nuevo',
        description: 'Registrar nuevo gasto'
      },
      { 
        text: 'Historial de Egresos', 
        path: '/dashboard/admin/egresos/historial', 
        icon: <HistoryIcon />,
        parent: 'egresos',
        section: 'historial',
        description: 'Registro completo de gastos'
      }
    ]
  },
  
  // 📊 CORTES Y ANÁLISIS - CON SUBMENU
  { 
    text: 'Cortes', 
    icon: <BarChartIcon />,
    submenu: true,
    section: 'cortes',
    description: 'Cierre diario y mensual',
    items: [
      { 
        text: 'Dashboard Cortes', 
        path: '/dashboard/admin/cortes', 
        icon: <AssessmentIcon />,
        parent: 'cortes',
        section: 'dashboard',
        description: 'Vista general de cortes'
      },
      { 
        text: 'Nuevo Corte', 
        path: '/dashboard/admin/cortes/nuevo', 
        icon: <ReceiptIcon />,
        parent: 'cortes',
        section: 'nuevo',
        description: 'Crear nuevo corte'
      },
      { 
        text: 'Historial de Cortes', 
        path: '/dashboard/admin/cortes/historial', 
        icon: <HistoryIcon />,
        parent: 'cortes',
        section: 'historial',
        description: 'Registro completo de cortes'
      }
    ]
  },
  
  // 🔐 CONTROL DE ACCESO
  { 
    text: 'Control de Acceso', 
    icon: <SecurityIcon />,
    submenu: true,
    section: 'control_acceso',
    description: 'Seguridad y control de accesos',
    items: [
      { 
        text: 'Configuración', 
        path: '/dashboard/admin/acceso/configuracion', 
        icon: <SettingsIcon />,
        parent: 'control_acceso',
        section: 'config-acceso'
      },
      { 
        text: 'Accesos en Tiempo Real', 
        path: '/dashboard/admin/acceso/accesos', 
        icon: <DoorFrontIcon />,
        parent: 'control_acceso',
        section: 'accesos-tiempo-real'
      },
      { 
        text: 'Reportes de Acceso', 
        path: '/dashboard/admin/acceso/reportes', 
        icon: <FingerprintIcon />,
        parent: 'control_acceso',
        section: 'reportes-acceso'
      }
    ]
  },
  
  // 📈 REPORTES
  { 
    text: 'Reportes', 
    path: '/dashboard/admin/reportes', 
    icon: <AssessmentIcon />,
    section: 'reportes',
    description: 'Analytics y reportes del negocio'
  },
  
  // ⚙️ HERRAMIENTAS
  { 
    text: 'Herramientas', 
    icon: <BuildIcon />,
    submenu: true,
    section: 'herramientas',
    description: 'Configuración y mantenimiento',
    items: [
      { 
        text: 'Configuración General', 
        path: '/dashboard/admin/herramientas/configuracion', 
        icon: <SettingsIcon />,
        parent: 'herramientas',
        section: 'configuracion-sistema'
      },
      { 
        text: 'Historial del Sistema', 
        path: '/dashboard/admin/herramientas/historial', 
        icon: <HistoryIcon />,
        parent: 'herramientas',
        section: 'historial-sistema'
      },
      { 
        text: 'Respaldo de Datos', 
        path: '/dashboard/admin/herramientas/respaldo', 
        icon: <BackupIcon />,
        parent: 'herramientas',
        section: 'respaldo-datos'
      },
      { 
        text: 'Actualizaciones', 
        path: '/dashboard/admin/herramientas/actualizaciones', 
        icon: <SystemUpdateIcon />,
        parent: 'herramientas',
        section: 'actualizaciones'
      }
    ]
  }
];

interface AdminLayoutClientProps {
  children: ReactNode;
  user: {
    id: string;
    email?: string;
    rol: string;
    firstName?: string;
    lastName?: string;
    profilePictureUrl?: string;
  };
}

export default function AdminLayoutClient({ children, user }: AdminLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  
  // 🔧 ESTADOS MEJORADOS
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [activeSection, setActiveSection] = useState<string>('');
  
  // ✅ ESTADO SIMPLIFICADO PARA SUBMENÚS (solo uno abierto a la vez)
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  
  // ✅ useEffect OPTIMIZADO - SIN menuItems como dependencia
  useEffect(() => {
    if (pathname) {
      let currentSection = '';
      let parentSection: string | null = null;

      // Buscar coincidencia más específica
      const allItems = menuItems.flatMap(item => 
        item.items ? [item, ...item.items] : [item]
      );
      
      const bestMatch = allItems
        .filter(item => item.path && pathname.startsWith(item.path))
        .sort((a, b) => b.path!.length - a.path!.length)[0];

      if (bestMatch) {
        currentSection = bestMatch.section;
        parentSection = bestMatch.parent || null;
      } else {
        // Fallback: usar último segmento de la ruta
        const pathParts = pathname.split('/');
        currentSection = pathParts[pathParts.length - 1] || '';
        
        // Buscar si es un item de submenú
        for (const item of menuItems) {
          if (item.submenu && item.items) {
            const childSections = item.items.map(child => child.section);
            if (childSections.includes(currentSection)) {
              parentSection = item.section;
              break;
            }
          }
        }
      }

      setActiveSection(currentSection);
      setOpenSubMenu(parentSection);
    }
  }, [pathname]); // ✅ SOLO pathname como dependencia

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
    
    // Limpiar estados problemáticos
    setLoading(true);
    
    // Navegar con refresh forzado
    router.push(path);
    router.refresh();
    
    if (isMobile) {
      setDrawerOpen(false);
    }
    
    // Reset después de navegación
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
  
  // ✅ TOGGLE PARA SUBMENÚS SIMPLIFICADO
  const toggleSubMenu = (section: string) => {
    setOpenSubMenu(prev => prev === section ? null : section);
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
        href="/dashboard"
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          '&:hover': { color: '#ffcc00' }
        }}
      >
        <HomeIcon sx={{ mr: 0.5, fontSize: 20 }} />
        Inicio
      </MuiLink>
    );
    
    breadcrumbs.push(
      <MuiLink
        key="admin"
        underline="hover"
        color="inherit"
        component={Link}
        href="/dashboard/admin/dashboard"
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          '&:hover': { color: '#ffcc00' }
        }}
      >
        <DashboardIcon sx={{ mr: 0.5, fontSize: 20 }} />
        Admin
      </MuiLink>
    );
    
    for (let i = 2; i < pathParts.length; i++) {
      const part = pathParts[i];
      currentPath += `/${part}`;
      
      let sectionName = part.charAt(0).toUpperCase() + part.slice(1);
      let sectionIcon = null;
      
      // Buscar nombre e icono bonito
      menuItems.forEach(item => {
        if (item.section === part) {
          sectionName = item.text;
          sectionIcon = item.icon;
        } else if (item.submenu && item.items) {
          item.items.forEach(subItem => {
            if (subItem.section === part) {
              sectionName = subItem.text;
              sectionIcon = subItem.icon;
            }
          });
        }
      });
      
      const isLast = i === pathParts.length - 1;
      
      breadcrumbs.push(
        isLast ? (
          <Typography 
            key={part} 
            color="#ffcc00" 
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
            href={`/dashboard/admin${currentPath}`}
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              '&:hover': { color: '#ffcc00' }
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
        separator={<NavigateNextIcon fontSize="small" sx={{ color: 'rgba(255,204,0,0.6)' }} />}
        aria-label="breadcrumb"
        sx={{ 
          mb: 3, 
          mt: 1,
          color: 'rgba(255,255,255,0.8)',
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
      <Box sx={{ display: 'flex' }}>
        {/* 🏢 BARRA SUPERIOR COMPLETAMENTE NEGRA Y MÁS ALTA */}
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
            
            {/* ÁREA DEL LOGO MEJORADA */}
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
                  <IntegrationInstructionsIcon 
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
                    SISTEMA DE GESTIÓN INTEGRAL
                  </Typography>
                  <Chip
                    size="small"
                    label="SGI"
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
                placeholder="Buscar usuarios, productos, reportes..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </Search>
            
            <Box sx={{ flexGrow: 1 }} />
            
            {/* 🔔 ÁREA DE NOTIFICACIONES Y USUARIO */}
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
                  aria-label="mostrar notificaciones"
                >
                  <Badge 
                    badgeContent={7} 
                    color="error"
                    sx={{
                      '& .MuiBadge-badge': {
                        background: 'linear-gradient(45deg, #ff4444, #ff6666)',
                        color: 'white',
                        fontWeight: 'bold'
                      }
                    }}
                  >
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
              
              <Chip
                size="small"
                label={`Bienvenido, ${user?.firstName || 'Admin'}`}
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
                  aria-label="cuenta de usuario"
                  aria-haspopup="true"
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
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 20,
                    width: 12,
                    height: 12,
                    bgcolor: 'rgba(18, 18, 18, 0.98)',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                    borderTop: '1px solid rgba(255, 204, 0, 0.2)',
                    borderLeft: '1px solid rgba(255, 204, 0, 0.2)',
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
                  {user?.firstName?.charAt(0) || "U"}
                </Avatar>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    {user ? `${user.firstName} ${user.lastName}` : "Usuario"}
                  </Typography>
                  <Chip
                    size="small"
                    label={user?.rol === 'admin' ? 'Administrador' : 'Empleado'}
                    sx={{
                      backgroundColor: '#ffcc00',
                      color: '#000',
                      fontWeight: 600,
                      fontSize: '0.75rem'
                    }}
                  />
                  <Typography variant="caption" sx={{ 
                    display: 'block', 
                    color: 'rgba(255,255,255,0.6)',
                    mt: 0.5
                  }}>
                    {new Date().toLocaleDateString('es-MX', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
              
              <MenuItem onClick={() => router.push('/dashboard/admin/perfil')}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" sx={{ color: '#ffcc00' }} />
                </ListItemIcon>
                Mi Perfil
              </MenuItem>
              
              <MenuItem onClick={() => router.push('/dashboard/admin/herramientas/configuracion')}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" sx={{ color: '#ffcc00' }} />
                </ListItemIcon>
                Configuración
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
        
        {/* 📂 MENÚ LATERAL MEJORADO */}
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
                  <IntegrationInstructionsIcon sx={{ color: '#ffcc00', fontSize: 18 }} />
                  <Typography variant="h6" sx={{ 
                    fontWeight: 700,
                    lineHeight: 1.1,
                    background: 'linear-gradient(45deg, #ffcc00, #ffd700)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    SGI
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ 
                  color: 'rgba(255,255,255,0.8)',
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  fontSize: '0.7rem'
                }}>
                  Admin Panel
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
              {user?.firstName?.charAt(0) || "U"}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body1" sx={{ 
                fontWeight: 'bold', 
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {user ? `${user.firstName} ${user.lastName}` : "Usuario"}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Chip
                  size="small"
                  label={user?.rol === 'admin' ? 'Admin' : 'Staff'}
                  sx={{
                    backgroundColor: '#ffcc00',
                    color: '#000',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: '20px'
                  }}
                />
                <EditIcon sx={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)' }} />
              </Box>
            </Box>
          </Box>
          
          {/* 📋 LISTA DE MENÚ COMPLETA */}
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
            {menuItems.map((item, index) => {
              // ITEMS CON SUBMENÚ
              if (item.submenu && item.items) {
                return (
                  <React.Fragment key={item.text}>
                    <ListItem 
                      disablePadding
                      sx={{ mb: 0.5 }}
                    >
                      <ListItemButton
                        onClick={() => toggleSubMenu(item.section)}
                        sx={{ 
                          minHeight: 52,
                          borderRadius: '12px',
                          px: 2.5,
                          py: 1.5,
                          background: openSubMenu === item.section 
                            ? 'linear-gradient(135deg, rgba(255, 204, 0, 0.15) 0%, rgba(255, 204, 0, 0.05) 100%)'
                            : 'transparent',
                          border: openSubMenu === item.section 
                            ? '1px solid rgba(255, 204, 0, 0.2)' 
                            : '1px solid transparent',
                          '&:hover': {
                            background: 'linear-gradient(135deg, rgba(255, 204, 0, 0.1) 0%, rgba(255, 204, 0, 0.05) 100%)',
                            border: '1px solid rgba(255, 204, 0, 0.15)',
                          }
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 0,
                            mr: 2.5,
                            justifyContent: 'center',
                            color: openSubMenu === item.section ? '#ffcc00' : 'rgba(255, 255, 255, 0.7)',
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={item.text}
                          secondary={item.description}
                          primaryTypographyProps={{ 
                            fontWeight: openSubMenu === item.section ? 700 : 500,
                            color: openSubMenu === item.section ? '#ffcc00' : 'inherit',
                            fontSize: '0.95rem'
                          }}
                          secondaryTypographyProps={{
                            fontSize: '0.75rem',
                            color: 'rgba(255,255,255,0.5)'
                          }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {item.badge && (
                            <Badge 
                              badgeContent={item.badge} 
                              color="error"
                              sx={{
                                '& .MuiBadge-badge': {
                                  background: 'linear-gradient(45deg, #ff4444, #ff6666)',
                                  color: 'white',
                                  fontWeight: 'bold',
                                  fontSize: '0.7rem'
                                }
                              }}
                            />
                          )}
                          {openSubMenu === item.section ? (
                            <ExpandLess sx={{ color: '#ffcc00' }} />
                          ) : (
                            <ExpandMore sx={{ color: 'rgba(255,255,255,0.7)' }} />
                          )}
                        </Box>
                      </ListItemButton>
                    </ListItem>
                    
                    <Collapse in={openSubMenu === item.section} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding sx={{ pl: 1, pr: 0.5 }}>
                        {item.items.map((subItem) => (
                          <ListItem 
                            key={subItem.text}
                            disablePadding
                            sx={{ mb: 0.5 }}
                          >
                            <ListItemButton
                              onClick={() => navigateTo(subItem.path!)}
                              sx={{ 
                                minHeight: 44,
                                borderRadius: '10px',
                                pl: 3.5,
                                pr: 2,
                                py: 1,
                                background: activeSection === subItem.section 
                                  ? 'linear-gradient(135deg, rgba(255, 204, 0, 0.2) 0%, rgba(255, 204, 0, 0.1) 100%)'
                                  : 'transparent',
                                border: activeSection === subItem.section 
                                  ? '1px solid rgba(255, 204, 0, 0.3)' 
                                  : '1px solid transparent',
                                '&:hover': {
                                  background: 'linear-gradient(135deg, rgba(255, 204, 0, 0.12) 0%, rgba(255, 204, 0, 0.06) 100%)',
                                  border: '1px solid rgba(255, 204, 0, 0.2)',
                                }
                              }}
                            >
                              <ListItemIcon
                                sx={{
                                  minWidth: 0,
                                  mr: 2,
                                  justifyContent: 'center',
                                  color: activeSection === subItem.section ? '#ffcc00' : 'rgba(255, 255, 255, 0.6)',
                                }}
                              >
                                {subItem.icon}
                              </ListItemIcon>
                              <ListItemText 
                                primary={subItem.text} 
                                primaryTypographyProps={{ 
                                  fontWeight: activeSection === subItem.section ? 700 : 500,
                                  color: activeSection === subItem.section ? '#ffcc00' : 'inherit',
                                  fontSize: '0.85rem'
                                }}
                              />
                              {subItem.badge && (
                                <Badge 
                                  badgeContent={subItem.badge} 
                                  color="error"
                                  sx={{
                                    '& .MuiBadge-badge': {
                                      background: 'linear-gradient(45deg, #ff4444, #ff6666)',
                                      color: 'white',
                                      fontWeight: 'bold',
                                      fontSize: '0.65rem',
                                      minWidth: '16px',
                                      height: '16px'
                                    }
                                  }}
                                />
                              )}
                            </ListItemButton>
                          </ListItem>
                        ))}
                      </List>
                    </Collapse>
                  </React.Fragment>
                );
              }
              
              // ITEMS NORMALES
              if (!item.submenu && !item.parent) {
                return (
                  <ListItem 
                    key={item.text} 
                    disablePadding
                    sx={{ mb: 0.5 }}
                  >
                    <ListItemButton
                      onClick={() => navigateTo(item.path!)}
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
                        '&:hover': {
                          background: 'linear-gradient(135deg, rgba(255, 204, 0, 0.12) 0%, rgba(255, 204, 0, 0.06) 100%)',
                          border: '1px solid rgba(255, 204, 0, 0.2)',
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
                      {item.badge && (
                        <Badge 
                          badgeContent={item.badge} 
                          color="error"
                          sx={{
                            '& .MuiBadge-badge': {
                              background: 'linear-gradient(45deg, #ff4444, #ff6666)',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.7rem'
                            }
                          }}
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                );
              }
              
              return null;
            })}
          </List>
          
          {/* 🦶 FOOTER DEL DRAWER */}
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
              Sistema de Gestión v2.0.0
            </Typography>
          </Box>
        </Drawer>
        
        {/* 📄 CONTENIDO PRINCIPAL */}
        <Main open={drawerOpen && !isMobile}>
          <DrawerHeader />
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
          backgroundColor: '#1E1E1E',
          color: '#FFFFFF',
          border: '1px solid #333333',
          borderRadius: '12px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.3)'
        }}
      />
    </>
  );
}