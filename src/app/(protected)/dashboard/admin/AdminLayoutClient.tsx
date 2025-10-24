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
  Collapse,
  useMediaQuery,
  useTheme,
  Badge,
  ListItemButton,
  LinearProgress,
  Container,
  Breadcrumbs,
  Link as MuiLink,
  Chip,
  Button,
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
import { useToast } from '@/hooks/useToast';
import { useUserRole } from '@/hooks/useUserRole';
import { hasPermission, canAccessRoute, type Permission } from '@/config/permissions';

// Hook para evitar errores de hidratación con tiempo
const useCurrentTime = () => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      const mexicoTime = formatMexicoTime(now, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      setCurrentTime(mexicoTime);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return mounted ? currentTime : '';
};

// 🎨 ICONOS ORGANIZADOS POR CATEGORÍA
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import PersonIcon from '@mui/icons-material/Person';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
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
import WarehouseIcon from '@mui/icons-material/Warehouse';

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
import CampaignIcon from '@mui/icons-material/Campaign';
import PollIcon from '@mui/icons-material/Poll';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

const drawerWidth = 290;
const mobileDrawerWidth = 280;

// 🎨 ESTILOS PERSONALIZADOS CON THEME CENTRALIZADO v7.0
const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(2), // Reducido para móviles
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(3),
  },
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  // En móvil NO hay margin left
  marginLeft: 0,
  // En desktop SÍ hay margin left cuando está cerrado
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
  // ✅ FIX: Prevent horizontal overflow on mobile
  maxWidth: '100vw',
  overflowX: 'hidden',
  // Mobile - espacio para bottom nav
  [theme.breakpoints.down('lg')]: {
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
  overflowX: 'auto',
  overflowY: 'hidden',
  display: 'flex',
  justifyContent: 'flex-start',
  '&::-webkit-scrollbar': {
    height: '4px'
  },
  '&::-webkit-scrollbar-track': {
    background: alpha(colorTokens.black, 0.3)
  },
  '&::-webkit-scrollbar-thumb': {
    background: alpha(colorTokens.brand, 0.5),
    borderRadius: '2px',
    '&:hover': {
      background: alpha(colorTokens.brand, 0.7)
    }
  },
  '& .MuiBottomNavigationAction-root': {
    color: alpha(colorTokens.textPrimary, 0.6),
    minHeight: '70px',
    minWidth: '80px',
    maxWidth: '100px',
    padding: '8px 4px',
    flex: '0 0 auto',
    '&.Mui-selected': {
      color: colorTokens.brand,
      backgroundColor: alpha(colorTokens.brand, 0.1)
    },
    '& .MuiBottomNavigationAction-label': {
      fontSize: '0.65rem',
      fontWeight: 600,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  },
  [theme.breakpoints.up('lg')]: { display: 'none' },
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
  permission?: Permission; // ✅ Permiso requerido para ver este item
}

// ✅ DEFINICIÓN COMPLETA DEL MENÚ REESTRUCTURADO - FUERA DEL COMPONENTE
const menuItems: MenuItem[] = [
  {
    text: 'Dashboard',
    path: '/dashboard/admin/dashboard',
    icon: <DashboardIcon />,
    section: 'dashboard',
    description: 'Vista general del sistema',
    permission: 'dashboard.view' // ❌ Empleado NO puede ver
  },
  
  // 👥 GESTIÓN DE USUARIOS (Ya completado - MUP)
  { 
    text: 'Usuarios', 
    path: '/dashboard/admin/usuarios', 
    icon: <PeopleIcon />,
    section: 'usuarios',
    description: 'Gestión completa de clientes'
  },
  
// 👨‍💼 EMPLEADOS (Gestión de staff interno) - SOLO ADMIN
{
  text: 'Empleados',
  icon: <BadgeIcon />,
  submenu: true,
  section: 'empleados',
  description: 'Gestión de personal interno',
  permission: 'employees.view', // ✅ Solo admin puede ver
  items: [
    {
      text: 'Registrar Empleado',
      path: '/dashboard/admin/empleados/registrar',
      icon: <PersonAddIcon />,
      parent: 'empleados',
      section: 'registrar-empleado',
      description: 'Agregar nuevo empleado',
      permission: 'employees.create'
    },
    {
      text: 'Lista de Empleados',
      path: '/dashboard/admin/empleados/lista',
      icon: <PeopleIcon />,
      parent: 'empleados',
      section: 'lista-empleados',
      description: 'Gestionar personal existente',
      permission: 'employees.view'
    }
  ]
},

  // 💪 PLANES (CATÁLOGO DE MEMBRESÍAS) - SOLO ADMIN
  {
    text: 'Planes',
    path: '/dashboard/admin/planes',
    icon: <FitnessCenterIcon />,
    section: 'planes',
    description: 'Catálogo de membresías disponibles',
    permission: 'plans.view' // ❌ Empleado NO puede ver
  },
  
  // 💰 MEMBRESÍAS & PAGOS - Empleado solo ve: Registrar Membresía + Historial de Pagos
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
        description: 'Vista general y estadísticas',
        permission: 'memberships.dashboard' // ❌ Empleado NO puede ver
      },
      {
        text: 'Registrar Membresía',
        path: '/dashboard/admin/membresias/registrar',
        icon: <PersonAddAltIcon />,
        parent: 'membresias',
        section: 'registrar',
        description: 'Proceso completo usuario + plan + pago'
        // ✅ NO tiene permission - Empleado SÍ puede ver
      },
      {
        text: 'Historial de Pagos',
        path: '/dashboard/admin/membresias/historial',
        icon: <ReceiptLongIcon />,
        parent: 'membresias',
        section: 'historial',
        description: 'Registro de transacciones'
        // ✅ NO tiene permission - Empleado SÍ puede ver
      },
      {
        text: 'Cupones y Descuentos',
        path: '/dashboard/admin/membresias/cupones',
        icon: <LocalOfferIcon />,
        parent: 'membresias',
        section: 'cupones',
        description: 'Gestión de promociones',
        permission: 'memberships.coupons' // ❌ Empleado NO puede ver
      }
    ]
  },
  
  // 🛍️ POS MUP - Empleado solo ve: Punto de Venta + Gestión de Apartados
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
        // ✅ NO tiene permission - Empleado SÍ puede ver
      },
      {
        text: 'Historial de Ventas',
        path: '/dashboard/admin/sales/history',
        icon: <HistoryIcon />,
        parent: 'pos',
        section: 'historial',
        description: 'Registro completo de transacciones',
        permission: 'sales.history' // ❌ Empleado NO puede ver
      },
      {
        text: 'Gestión de Apartados',
        path: '/dashboard/admin/layaways/management',
        icon: <ScheduleIcon />,
        parent: 'pos',
        section: 'apartados',
        description: 'Administración de apartados'
        // ✅ NO tiene permission - Empleado SÍ puede ver
      }
    ]
  },
  
  // 📦 CATÁLOGO - SOLO ADMIN
  {
    text: 'Catálogo',
    icon: <CategoryIcon />,
    submenu: true,
    section: 'catalogo',
    description: 'Gestión de inventario y productos',
    permission: 'catalog.view', // ❌ Empleado NO puede ver
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
        text: 'Almacenes', 
        path: '/dashboard/admin/catalogo/almacenes', 
        icon: <WarehouseIcon />,
        parent: 'catalogo',
        section: 'almacenes'
      }
    ]
  },
  
  // 💳 EGRESOS - SOLO ADMIN
  {
    text: 'Egresos',
    icon: <ReceiptIcon />,
    submenu: true,
    section: 'egresos',
    description: 'Control de gastos y egresos',
    permission: 'finance.expenses.view', // ❌ Empleado NO puede ver
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
  
  // 📊 CORTES Y ANÁLISIS - SOLO ADMIN
  {
    text: 'Cortes',
    icon: <BarChartIcon />,
    submenu: true,
    section: 'cortes',
    description: 'Cierre diario y mensual',
    permission: 'finance.cuts', // ❌ Empleado NO puede ver
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
  
  // 📋 HISTORIAL DE ASISTENCIAS - Empleado SÍ puede ver
  {
    text: 'Historial de Asistencias',
    path: '/dashboard/admin/acceso',
    icon: <HistoryIcon />,
    section: 'historial_asistencias',
    description: 'Registro de accesos y asistencias'
    // ✅ NO tiene permission - Empleado SÍ puede ver
  },

  // 📈 REPORTES - SOLO ADMIN
  {
    text: 'Reportes',
    path: '/dashboard/admin/reportes',
    icon: <AssessmentIcon />,
    section: 'reportes',
    description: 'Analytics y reportes del negocio',
    permission: 'reports.view' // ❌ Empleado NO puede ver
  },

  // 💪 BIBLIOTECA DE EJERCICIOS - SOLO ADMIN
  {
    text: 'Biblioteca de Ejercicios',
    path: '/dashboard/admin/biblioteca',
    icon: <FitnessCenterIcon />,
    section: 'biblioteca',
    description: 'Gestión de ejercicios',
    permission: 'exercises.view' // ❌ Empleado NO puede ver
  },

  // 📋 RUTINAS DE ENTRENAMIENTO - SOLO ADMIN
  {
    text: 'Rutinas',
    path: '/dashboard/admin/rutinas',
    icon: <EventIcon />,
    section: 'rutinas',
    description: 'Crear y asignar rutinas personalizadas',
    permission: 'routines.view' // ❌ Empleado NO puede ver
  },

  // ⚙️ HERRAMIENTAS - SOLO ADMIN
  {
    text: 'Herramientas',
    icon: <BuildIcon />,
    submenu: true,
    section: 'herramientas',
    description: 'Configuración y mantenimiento',
    permission: 'tools.settings', // ✅ Solo admin
    items: [
      {
        text: 'Configuración General',
        path: '/dashboard/admin/herramientas/configuracion',
        icon: <SettingsIcon />,
        parent: 'herramientas',
        section: 'configuracion-sistema',
        permission: 'tools.settings'
      },
      {
        text: 'Avisos para Clientes',
        path: '/dashboard/admin/herramientas/avisos',
        icon: <CampaignIcon />,
        parent: 'herramientas',
        section: 'avisos-clientes',
        permission: 'tools.announcements'
      },
      {
        text: 'Encuestas',
        path: '/dashboard/admin/encuestas',
        icon: <PollIcon />,
        parent: 'herramientas',
        section: 'encuestas',
        permission: 'tools.settings'
      },
      {
        text: 'Respaldo de Datos',
        path: '/dashboard/admin/herramientas/respaldos',
        icon: <BackupIcon />,
        parent: 'herramientas',
        section: 'respaldo-datos',
        permission: 'tools.backups' // ✅ Solo admin puede hacer respaldos
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
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mobileBottomValue, setMobileBottomValue] = useState(0);
  const [bottomNavMenuAnchor, setBottomNavMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedBottomNavItem, setSelectedBottomNavItem] = useState<MenuItem | null>(null);

  // Hook para tiempo sin errores de hidratación
  const currentTime = useCurrentTime();

  // ✅ HOOK DE TOAST para notificaciones
  const toast = useToast();

  // ✅ HOOK DE ROL DE USUARIO para permisos
  const { role, isAdmin, isEmpleado, loading: roleLoading } = useUserRole();

  // ✅ FILTRAR ITEMS DEL MENÚ SEGÚN PERMISOS
  const filteredMenuItems = menuItems
    .map(item => {
      // Si el item tiene permiso, verificar si el usuario lo tiene
      if (item.permission && !hasPermission(role, item.permission)) {
        return null; // Usuario no tiene permiso, ocultar item
      }

      // Si tiene subitems, filtrar también los subitems
      if (item.items) {
        const filteredSubItems = item.items.filter(subItem => {
          if (subItem.permission) {
            return hasPermission(role, subItem.permission);
          }
          return true; // Si no requiere permiso, mostrar
        });

        // Si no quedan subitems después del filtro, ocultar el item completo
        if (filteredSubItems.length === 0) {
          return null;
        }

        return { ...item, items: filteredSubItems };
      }

      return item;
    })
    .filter((item): item is MenuItem => item !== null); // Eliminar nulls
  
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

  // Handle scroll top button
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // Define bottom nav items - SOLO items principales del menú (filtrados por permisos)
  const bottomNavItems = filteredMenuItems;

  const handleMobileNavChange = (event: React.SyntheticEvent, newValue: number) => {
    const selectedItem = bottomNavItems[newValue];
    if (!selectedItem) return;

    // Si tiene submenú, mostrar popup
    if (selectedItem.submenu && selectedItem.items && selectedItem.items.length > 0) {
      setSelectedBottomNavItem(selectedItem);
      setBottomNavMenuAnchor(event.currentTarget as HTMLElement);
    } else if (selectedItem.path) {
      // Si no tiene submenú pero tiene path, navegar directamente
      navigateTo(selectedItem.path);
    }
  };

  // Cerrar menu emergente y navegar
  const handleBottomNavMenuItemClick = (path: string) => {
    navigateTo(path);
    setBottomNavMenuAnchor(null);
    setSelectedBottomNavItem(null);
  };

  // Update mobile bottom nav value based on active section
  useEffect(() => {
    const activeIndex = bottomNavItems.findIndex(item => item.section === activeSection);
    if (activeIndex !== -1) {
      setMobileBottomValue(activeIndex);
    }
  }, [activeSection, bottomNavItems]);
  
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
          '&:hover': { color: colorTokens.brand }
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
          '&:hover': { color: colorTokens.brand }
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
      
      // Construir la ruta completa hasta este punto
      const fullPathToHere = '/dashboard/admin' + currentPath;
      
      // Buscar nombre e icono bonito - EXACTO para esta ruta específica
      let found = false;
      menuItems.forEach(item => {
        // Buscar por path EXACTO
        if (item.path === fullPathToHere) {
          sectionName = item.text;
          sectionIcon = item.icon;
          found = true;
        } else if (item.submenu && item.items) {
          // Si es un submenu padre (ej: "catalogo")
          if (item.section === part) {
            sectionName = item.text;
            sectionIcon = item.icon;
            found = true;
          }
          // Buscar en los items del submenu
          item.items.forEach(subItem => {
            if (subItem.path === fullPathToHere) {
              sectionName = subItem.text;
              sectionIcon = subItem.icon;
              found = true;
            }
          });
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
            href={`/dashboard/admin${currentPath}`}
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
        {/* 🏢 BARRA SUPERIOR CON THEME CENTRALIZADO v7.0 */}
        <AppBar 
          position="fixed" 
          sx={{ 
            zIndex: theme.zIndex.drawer + 1,
            background: colorTokens.black,
            backdropFilter: 'none',
            boxShadow: `0 4px 20px 0 ${alpha(colorTokens.black, 0.8)}`,
            borderBottom: `1px solid ${alpha(colorTokens.brand, 0.15)}`
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
            {/* Botón hamburguesa - Solo visible en desktop */}
            <IconButton
              color="inherit"
              aria-label={drawerOpen ? "cerrar menú" : "abrir menú"}
              onClick={() => setDrawerOpen(!drawerOpen)}
              edge="start"
              sx={{
                mr: { xs: 1, sm: 2 },
                backgroundColor: alpha(colorTokens.brand, 0.1),
                display: { xs: 'none', lg: 'flex' },
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
                onClick={() => router.push('/dashboard/admin/dashboard')}
              />

              {/* Texto completo solo en tablets y desktop */}
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IntegrationInstructionsIcon
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
                    SISTEMA DE GESTIÓN INTEGRAL
                  </Typography>
                  <Chip
                    size="small"
                    label="SGI"
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

              {/* Solo chip SGI en móviles */}
              <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                <Chip
                  size="small"
                  label="SGI"
                  sx={{
                    backgroundColor: colorTokens.brand,
                    color: colorTokens.black,
                    fontWeight: 800,
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    height: { xs: '22px', sm: '24px' },
                    minWidth: { xs: '40px', sm: '45px' }
                  }}
                />
              </Box>
            </Box>
            
            {/* ✅ BUSCADOR ELIMINADO - Sin funcionalidad implementada */}

            <Box sx={{ flexGrow: 1 }} />

            {/* 🚀 ACCESOS DIRECTOS - Solo visible en desktop ≥960px */}
            <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 1.5, mr: 2 }}>
              <Tooltip title="Punto de Venta" arrow>
                <Button
                  component={Link}
                  href="/dashboard/admin/pos"
                  variant="contained"
                  size="medium"
                  startIcon={<ShoppingCartIcon />}
                  sx={{
                    bgcolor: colorTokens.brand,
                    color: colorTokens.black,
                    fontWeight: 700,
                    px: 2.5,
                    borderRadius: 2,
                    boxShadow: `0 4px 12px ${alpha(colorTokens.brand, 0.3)}`,
                    '&:hover': {
                      bgcolor: colorTokens.brandHover,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 6px 16px ${alpha(colorTokens.brand, 0.4)}`
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  POS
                </Button>
              </Tooltip>

              <Tooltip title="Registrar Membresía" arrow>
                <Button
                  component={Link}
                  href="/dashboard/admin/membresias/registrar"
                  variant="outlined"
                  size="medium"
                  startIcon={<PersonAddAltIcon />}
                  sx={{
                    borderColor: colorTokens.brand,
                    color: colorTokens.brand,
                    fontWeight: 600,
                    px: 2.5,
                    borderRadius: 2,
                    borderWidth: 2,
                    '&:hover': {
                      borderColor: colorTokens.brandHover,
                      borderWidth: 2,
                      bgcolor: alpha(colorTokens.brand, 0.1),
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  Membresía
                </Button>
              </Tooltip>
            </Box>

            {/* 👤 ÁREA DE USUARIO - RESPONSIVE */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>

              {/* Chip de bienvenida solo en desktop */}
              <Chip
                size="small"
                label={`Bienvenido, ${user?.firstName || 'Admin'}`}
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
                  {/* Badge online FUERA del avatar */}
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
                      label={user?.rol === 'admin' ? 'Administrador' : 'Empleado'}
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
                    {currentTime}
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 1, borderColor: alpha(colorTokens.white, 0.1) }} />
              
              <MenuItem onClick={() => router.push('/dashboard/admin/perfil')}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" sx={{ color: colorTokens.brand }} />
                </ListItemIcon>
                Mi Perfil
              </MenuItem>
              
              <MenuItem onClick={() => router.push('/dashboard/admin/herramientas/configuracion')}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" sx={{ color: colorTokens.brand }} />
                </ListItemIcon>
                Configuración
              </MenuItem>
              
              <Divider sx={{ my: 1, borderColor: alpha(colorTokens.textPrimary, 0.1) }} />
              
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
                onClick={() => router.push('/dashboard/admin/dashboard')}
              />
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <IntegrationInstructionsIcon sx={{ color: colorTokens.brand, fontSize: 18 }} />
                  <Typography variant="h6" sx={{ 
                    fontWeight: 700,
                    lineHeight: 1.1,
                    background: `linear-gradient(45deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    SGI
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ 
                  color: colorTokens.textSecondary,
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
                onClick={() => router.push('/dashboard/admin/perfil')}
              >
                {user?.firstName?.charAt(0) || "U"}
              </Avatar>
              {/* Badge online FUERA del avatar */}
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
                  label={user?.rol === 'admin' ? 'Admin' : 'Staff'}
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
                  {currentTime}
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
            {filteredMenuItems.map((item, index) => {
              // ITEMS CON SUBMENÚ
              if (item.submenu && item.items) {
                return (
                  <React.Fragment key={item.text}>
                    <ListItem 
                      disablePadding
                      sx={{ mb: 0.5 }}
                    >
                      <ListItemButton
                        component={motion.div}
                        onClick={() => toggleSubMenu(item.section)}
                        sx={{ 
                          minHeight: 52,
                          borderRadius: '12px',
                          px: 2.5,
                          py: 1.5,
                          background: openSubMenu === item.section 
                            ? `linear-gradient(90deg, ${alpha(colorTokens.brand, 0.15)}, ${alpha(colorTokens.brand, 0.05)})`
                            : 'transparent',
                          borderLeft: openSubMenu === item.section 
                            ? `3px solid ${colorTokens.brand}` 
                            : '3px solid transparent',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            background: `linear-gradient(90deg, ${alpha(colorTokens.brand, 0.1)}, ${alpha(colorTokens.brand, 0.05)})`,
                            borderLeft: `3px solid ${alpha(colorTokens.brand, 0.5)}`,
                            transform: 'translateX(4px)'
                          }
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 0,
                            mr: 2.5,
                            justifyContent: 'center',
                            color: openSubMenu === item.section ? colorTokens.brand : colorTokens.textSecondary,
                            transition: 'color 0.2s ease'
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={item.text}
                          secondary={item.description}
                          primaryTypographyProps={{ 
                            fontWeight: openSubMenu === item.section ? 700 : 500,
                            color: openSubMenu === item.section ? colorTokens.brand : colorTokens.textPrimary,
                            fontSize: '0.95rem'
                          }}
                          secondaryTypographyProps={{
                            fontSize: '0.75rem',
                            color: colorTokens.textSecondary
                          }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {item.badge && (
                            <Badge 
                              badgeContent={item.badge} 
                              color="error"
                              sx={{
                                '& .MuiBadge-badge': {
                                  background: colorTokens.danger,
                                  color: colorTokens.white,
                                  fontWeight: 'bold',
                                  fontSize: '0.7rem',
                                  animation: `${pulse} 2s ease-in-out infinite`
                                }
                              }}
                            />
                          )}
                          {openSubMenu === item.section ? (
                            <ExpandLess sx={{ color: colorTokens.brand }} />
                          ) : (
                            <ExpandMore sx={{ color: colorTokens.textSecondary }} />
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
                              component={motion.div}
                              whileHover={{ x: 4 }}
                              onClick={() => navigateTo(subItem.path!)}
                              sx={{ 
                                minHeight: 44,
                                borderRadius: '10px',
                                pl: 3.5,
                                pr: 2,
                                py: 1,
                                background: activeSection === subItem.section 
                                  ? alpha(colorTokens.brand, 0.15)
                                  : 'transparent',
                                borderLeft: activeSection === subItem.section 
                                  ? `2px solid ${colorTokens.brand}` 
                                  : '2px solid transparent',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  background: alpha(colorTokens.brand, 0.1),
                                  borderLeft: `2px solid ${alpha(colorTokens.brand, 0.5)}`
                                }
                              }}
                            >
                              <ListItemIcon
                                sx={{
                                  minWidth: 0,
                                  mr: 2,
                                  justifyContent: 'center',
                                  color: activeSection === subItem.section ? colorTokens.brand : colorTokens.textSecondary,
                                  transition: 'color 0.2s ease'
                                }}
                              >
                                {subItem.icon}
                              </ListItemIcon>
                              <ListItemText 
                                primary={subItem.text} 
                                primaryTypographyProps={{ 
                                  fontWeight: activeSection === subItem.section ? 700 : 500,
                                  color: activeSection === subItem.section ? colorTokens.brand : colorTokens.textPrimary,
                                  fontSize: '0.85rem'
                                }}
                              />
                              {subItem.badge && (
                                <Badge 
                                  badgeContent={subItem.badge} 
                                  color="error"
                                  sx={{
                                    '& .MuiBadge-badge': {
                                      background: colorTokens.danger,
                                      color: colorTokens.white,
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
                      component={motion.div}
                      whileHover={{ x: 4 }}
                      onClick={() => navigateTo(item.path!)}
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
                      {item.badge && (
                        <Badge 
                          badgeContent={item.badge} 
                          color="error"
                          sx={{
                            '& .MuiBadge-badge': {
                              background: colorTokens.danger,
                              color: colorTokens.white,
                              fontWeight: 'bold',
                              fontSize: '0.7rem',
                              animation: `${pulse} 2s ease-in-out infinite`
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
          
        </Drawer>
        
        {/* 📄 CONTENIDO PRINCIPAL */}
        <Main open={drawerOpen && !isMobile}>
          <Box sx={{ minHeight: { xs: '64px', sm: '80px', md: '100px' } }} /> {/* Spacer para AppBar */}
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

      {/* BOTTOM NAVIGATION MÓVIL */}
      <MobileBottomNav value={mobileBottomValue} onChange={handleMobileNavChange} showLabels>
        {bottomNavItems.map((item, index) => (
          <BottomNavigationAction
            key={item.section}
            label={item.text}
            icon={item.icon}
          />
        ))}
      </MobileBottomNav>

      {/* MENU EMERGENTE PARA ITEMS CON SUBMENU */}
      <Menu
        anchorEl={bottomNavMenuAnchor}
        open={Boolean(bottomNavMenuAnchor)}
        onClose={() => {
          setBottomNavMenuAnchor(null);
          setSelectedBottomNavItem(null);
        }}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        sx={{
          '& .MuiPaper-root': {
            bgcolor: alpha(colorTokens.black, 0.95),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(colorTokens.brand, 0.2)}`,
            borderRadius: 2,
            minWidth: 220,
            maxWidth: 280,
            boxShadow: `0 8px 32px ${alpha(colorTokens.black, 0.8)}`
          }
        }}
      >
        {selectedBottomNavItem?.items?.map((subItem) => (
          <MenuItem
            key={subItem.section}
            onClick={() => subItem.path && handleBottomNavMenuItemClick(subItem.path)}
            sx={{
              py: 1.5,
              px: 2,
              gap: 1.5,
              color: colorTokens.textPrimary,
              '&:hover': {
                bgcolor: alpha(colorTokens.brand, 0.1),
                color: colorTokens.brand
              }
            }}
          >
            <Box sx={{ color: 'inherit', display: 'flex', alignItems: 'center' }}>
              {subItem.icon}
            </Box>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {subItem.text}
              </Typography>
              {subItem.description && (
                <Typography variant="caption" sx={{ color: colorTokens.textSecondary, display: 'block' }}>
                  {subItem.description}
                </Typography>
              )}
            </Box>
          </MenuItem>
        ))}
      </Menu>

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