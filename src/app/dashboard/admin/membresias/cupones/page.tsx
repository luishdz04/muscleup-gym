'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  InputAdornment,
  Stack,
  Tooltip,
  Badge,
  Divider,
  Switch,
  FormControlLabel,
  Menu,
  MenuItem as MenuItemComponent,
  MenuList,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// ✅ FUNCIONES SIMPLIFICADAS - SIN DEPENDENCIAS EXTERNAS
const getMexicoToday = () => new Date().toISOString().split('T')[0];

const formatDateForDisplay = (dateString: string) => {
  if (!dateString) return 'Sin fecha';
  try {
    const date = new Date(dateString + 'T12:00:00');
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return 'Fecha inválida';
  }
};

const getDaysBetweenMexicoDates = (startDate: string, endDate: string) => {
  try {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
    return 0;
  }
};

// 🎨 DARK PRO SYSTEM - TOKENS ACTUALIZADOS
const darkProTokens = {
  // Base Colors
  background: '#000000',
  surfaceLevel1: '#121212',
  surfaceLevel2: '#1E1E1E',
  surfaceLevel3: '#252525',
  surfaceLevel4: '#2E2E2E',
  
  // Neutrals
  grayDark: '#333333',
  grayMedium: '#444444',
  grayLight: '#555555',
  grayMuted: '#777777',
  textPrimary: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textDisabled: '#888888',
  
  // Primary Accent (Golden)
  primary: '#FFCC00',
  primaryHover: '#E6B800',
  primaryActive: '#CCAA00',
  primaryDisabled: 'rgba(255,204,0,0.3)',
  
  // Semantic Colors
  success: '#388E3C',
  successHover: '#2E7D32',
  error: '#D32F2F',
  errorHover: '#B71C1C',
  warning: '#FFB300',
  warningHover: '#E6A700',
  info: '#1976D2',
  infoHover: '#1565C0',
  
  // User Roles
  roleAdmin: '#FFCC00',
  roleStaff: '#1976D2',
  roleTrainer: '#009688',
  roleUser: '#777777',
  roleModerator: '#9C27B0',
  roleGuest: '#444444',
  
  // Interactions
  hoverOverlay: 'rgba(255,204,0,0.05)',
  activeOverlay: 'rgba(255,204,0,0.1)',
  borderDefault: '#333333',
  borderHover: '#FFCC00',
  borderActive: '#E6B800'
};

// Iconos principales
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import GetAppIcon from '@mui/icons-material/GetApp';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import GroupIcon from '@mui/icons-material/Group';
import PercentIcon from '@mui/icons-material/Percent';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningIcon from '@mui/icons-material/Warning';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import QrCodeIcon from '@mui/icons-material/QrCode';
import ShareIcon from '@mui/icons-material/Share';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';

// ✅ INTERFACES CORREGIDAS
interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_amount: number;
  max_uses: number | null;
  current_uses: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
  // Campos calculados
  is_expired?: boolean;
  days_remaining?: number | null;
  usage_percentage?: number;
  effectiveness_rate?: number;
}

interface CouponUsage {
  id: string;
  coupon_id: string;
  user_id: string;
  membership_id: string;
  used_at: string;
  discount_applied: number;
  user_name?: string;
  plan_name?: string;
}

interface Filters {
  searchTerm: string;
  status: string;
  discountType: string;
  dateFrom: string;
  dateTo: string;
}

interface FormData {
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_amount: number;
  max_uses: number | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

const statusOptions = [
  { value: '', label: 'Todos los estados', color: darkProTokens.textSecondary, icon: '📋' },
  { value: 'active', label: 'Activos', color: darkProTokens.success, icon: '✅' },
  { value: 'expired', label: 'Vencidos', color: darkProTokens.error, icon: '❌' },
  { value: 'inactive', label: 'Inactivos', color: darkProTokens.grayMuted, icon: '⏸️' },
  { value: 'exhausted', label: 'Agotados', color: darkProTokens.warning, icon: '🔚' }
];

const discountTypeOptions = [
  { value: '', label: 'Todos los tipos', icon: '💳' },
  { value: 'percentage', label: 'Porcentaje', icon: '📊' },
  { value: 'fixed', label: 'Monto Fijo', icon: '💰' }
];

// ✅ HELPER FUNCTION PARA DÍAS RESTANTES
const getDaysRemainingDisplay = (coupon: Coupon) => {
  const daysRemaining = coupon.days_remaining;
  
  if (daysRemaining === null || daysRemaining === undefined || daysRemaining < 0) {
    return null;
  }
  
  return {
    value: daysRemaining,
    color: daysRemaining < 7 ? darkProTokens.warning : darkProTokens.success,
    text: `${daysRemaining} días restantes`
  };
};

export default function CuponesPage() {
  const router = useRouter();
  
  // Estados principales
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [filteredCoupons, setFilteredCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Estados de paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estados de filtros
  const [filters, setFilters] = useState<Filters>({
    searchTerm: '',
    status: '',
    discountType: '',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados de UI
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  
  // Estados del formulario
  const [formData, setFormData] = useState<FormData>({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    min_amount: 0,
    max_uses: null,
    start_date: getMexicoToday(),
    end_date: getMexicoToday(),
    is_active: true
  });
  const [formLoading, setFormLoading] = useState(false);
  
  // Estado para el usuario actual
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Estados de estadísticas
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    totalUsages: 0,
    totalDiscounts: 0,
    averageDiscount: 0
  });

  const supabase = createBrowserSupabaseClient();

  // Cargar usuario actual
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Error obteniendo usuario:', error);
          return;
        }
        if (user) {
          setCurrentUserId(user.id);
          console.log('Usuario actual obtenido:', user.id, 'Email:', user.email);
        }
      } catch (err) {
        console.error('Error crítico obteniendo usuario:', err);
      }
    };
    getCurrentUser();
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    loadCoupons();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    applyFilters();
  }, [coupons, filters]);

  // 🎟️ CARGAR CUPONES CON DATOS CALCULADOS
  const loadCoupons = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Procesar y calcular campos adicionales
      const processedCoupons: Coupon[] = (data || []).map(coupon => {
        const today = getMexicoToday();
        const isExpired = coupon.end_date < today;
        const daysRemaining = isExpired ? 0 : getDaysBetweenMexicoDates(today, coupon.end_date);
        const usagePercentage = coupon.max_uses ? (coupon.current_uses / coupon.max_uses) * 100 : 0;
        
        return {
          ...coupon,
          is_expired: isExpired,
          days_remaining: daysRemaining,
          usage_percentage: usagePercentage
        };
      });

      setCoupons(processedCoupons);
      calculateStats(processedCoupons);
      
    } catch (err: any) {
      setError(`Error al cargar cupones: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 📊 CALCULAR ESTADÍSTICAS
  const calculateStats = (data: Coupon[]) => {
    const today = getMexicoToday();
    
    const stats = {
      total: data.length,
      active: data.filter(c => c.is_active && c.end_date >= today).length,
      expired: data.filter(c => c.end_date < today).length,
      totalUsages: data.reduce((sum, c) => sum + c.current_uses, 0),
      totalDiscounts: 0, // Se calculará desde user_memberships
      averageDiscount: data.length > 0 ? data.reduce((sum, c) => sum + c.discount_value, 0) / data.length : 0
    };
    
    setStats(stats);
  };

  // ✅ APLICAR FILTROS
  const applyFilters = () => {
    let filtered = [...coupons];

    // Búsqueda por texto
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(coupon => 
        coupon.code.toLowerCase().includes(searchLower) ||
        coupon.description.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por estado
    if (filters.status) {
      const today = getMexicoToday();
      filtered = filtered.filter(coupon => {
        switch (filters.status) {
          case 'active':
            return coupon.is_active && coupon.end_date >= today;
          case 'expired':
            return coupon.end_date < today;
          case 'inactive':
            return !coupon.is_active;
          case 'exhausted':
            return coupon.max_uses && coupon.current_uses >= coupon.max_uses;
          default:
            return true;
        }
      });
    }

    // Filtro por tipo de descuento
    if (filters.discountType) {
      filtered = filtered.filter(coupon => coupon.discount_type === filters.discountType);
    }

    // Filtros por fecha
    if (filters.dateFrom) {
      filtered = filtered.filter(coupon => coupon.start_date >= filters.dateFrom);
    }
    
    if (filters.dateTo) {
      filtered = filtered.filter(coupon => coupon.start_date <= filters.dateTo);
    }

    setFilteredCoupons(filtered);
    setPage(0);
  };

  // ✅ CREAR O EDITAR CUPÓN - VERSIÓN CORREGIDA SIN TIMESTAMPS MANUALES
  const handleSaveCoupon = async () => {
    setFormLoading(true);
    try {
      // Validaciones
      if (!formData.code.trim()) {
        setError('El código del cupón es requerido');
        return;
      }

      if (formData.discount_value <= 0) {
        setError('El valor del descuento debe ser mayor a 0');
        return;
      }

      if (formData.discount_type === 'percentage' && formData.discount_value > 100) {
        setError('El porcentaje no puede ser mayor a 100%');
        return;
      }

      if (formData.start_date > formData.end_date) {
        setError('La fecha de inicio no puede ser posterior a la fecha de fin');
        return;
      }

      // ✅ DATOS PARA ENVIAR SIN TIMESTAMPS MANUALES
      const couponData = {
        ...formData,
        code: formData.code.toUpperCase().trim()
        // ✅ updated_at se maneja automáticamente por la BD
      };

      if (selectedCoupon) {
        // Editar cupón existente
        const { error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', selectedCoupon.id);

        if (error) throw error;
        setSuccessMessage('Cupón actualizado exitosamente');
        setEditDialogOpen(false);
      } else {
        // ✅ CREAR NUEVO CUPÓN SIN TIMESTAMPS MANUALES
        const { error } = await supabase
          .from('coupons')
          .insert([{
            ...couponData,
            created_by: currentUserId
            // ✅ created_at se maneja automáticamente por la BD
          }]);

        if (error) throw error;
        setSuccessMessage('Cupón creado exitosamente');
        setCreateDialogOpen(false);
      }

      // Limpiar formulario y recargar datos
      resetForm();
      loadCoupons();
      
    } catch (err: any) {
      if (err.code === '23505') {
        setError('Ya existe un cupón con ese código');
      } else {
        setError(`Error al guardar cupón: ${err.message}`);
      }
    } finally {
      setFormLoading(false);
    }
  };

  // 🗑️ ELIMINAR CUPÓN
  const handleDeleteCoupon = async (coupon: Coupon) => {
    if (!confirm(`¿Está seguro de eliminar el cupón "${coupon.code}"?`)) return;

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', coupon.id);

      if (error) throw error;

      setSuccessMessage('Cupón eliminado exitosamente');
      loadCoupons();
      
    } catch (err: any) {
      setError(`Error al eliminar cupón: ${err.message}`);
    }
  };

  // ✅ ALTERNAR ESTADO ACTIVO/INACTIVO - VERSIÓN CORREGIDA
  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ 
          is_active: !coupon.is_active
          // ✅ updated_at se maneja automáticamente por la BD
        })
        .eq('id', coupon.id);

      if (error) throw error;

      setSuccessMessage(`Cupón ${!coupon.is_active ? 'activado' : 'desactivado'} exitosamente`);
      loadCoupons();
      
    } catch (err: any) {
      setError(`Error al cambiar estado: ${err.message}`);
    }
  };

  // 📋 COPIAR CÓDIGO AL PORTAPAPELES
  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setSuccessMessage(`Código "${code}" copiado al portapapeles`);
    } catch (err) {
      setError('Error al copiar código');
    }
  };

  // 🔄 RESETEAR FORMULARIO
  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      min_amount: 0,
      max_uses: null,
      start_date: getMexicoToday(),
      end_date: getMexicoToday(),
      is_active: true
    });
    setSelectedCoupon(null);
  };

  // 🎨 OBTENER COLOR DEL ESTADO
  const getCouponStatus = (coupon: Coupon) => {
    const today = getMexicoToday();
    
    if (coupon.end_date < today) {
      return { status: 'expired', label: 'Vencido', color: darkProTokens.error, icon: '❌' };
    }
    
    if (!coupon.is_active) {
      return { status: 'inactive', label: 'Inactivo', color: darkProTokens.grayMuted, icon: '⏸️' };
    }
    
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return { status: 'exhausted', label: 'Agotado', color: darkProTokens.warning, icon: '🔚' };
    }
    
    return { status: 'active', label: 'Activo', color: darkProTokens.success, icon: '✅' };
  };

  // 🎨 FORMATEAR PRECIO
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  // 🎨 FORMATEAR DESCUENTO
  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}%`;
    } else {
      return formatPrice(coupon.discount_value);
    }
  };

  // 🔧 LIMPIAR FILTROS
  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      status: '',
      discountType: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  // 🎯 INICIALIZAR EDICIÓN
  const initializeEdit = (coupon: Coupon) => {
    setFormData({
      code: coupon.code,
      description: coupon.description,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_amount: coupon.min_amount,
      max_uses: coupon.max_uses,
      start_date: coupon.start_date,
      end_date: coupon.end_date,
      is_active: coupon.is_active
    });
    setSelectedCoupon(coupon);
    setEditDialogOpen(true);
  };

  // ✅ FUNCIONES PARA CERRAR NOTIFICACIONES
  const handleCloseError = () => setError(null);
  const handleCloseSuccess = () => setSuccessMessage(null);

  return (
    <Box sx={{ 
      p: 3, 
      background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
      minHeight: '100vh',
      color: darkProTokens.textPrimary
    }}>
      {/* ✅ SNACKBARS CON DARK PRO SYSTEM */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={8000} 
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseError} 
          severity="error" 
          variant="filled"
          sx={{
            background: `linear-gradient(135deg, ${darkProTokens.error}, ${darkProTokens.errorHover})`,
            color: darkProTokens.textPrimary,
            border: `1px solid ${darkProTokens.error}60`,
            borderRadius: 3,
            boxShadow: `0 8px 32px ${darkProTokens.error}40`,
            backdropFilter: 'blur(20px)',
            fontWeight: 600,
            '& .MuiAlert-icon': { color: darkProTokens.textPrimary },
            '& .MuiAlert-action': { color: darkProTokens.textPrimary }
          }}
        >
          {error}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!successMessage} 
        autoHideDuration={5000} 
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSuccess} 
          severity="success" 
          variant="filled"
          sx={{
            background: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})`,
            color: darkProTokens.textPrimary,
            border: `1px solid ${darkProTokens.success}60`,
            borderRadius: 3,
            boxShadow: `0 8px 32px ${darkProTokens.success}40`,
            backdropFilter: 'blur(20px)',
            fontWeight: 600,
            '& .MuiAlert-icon': { color: darkProTokens.textPrimary },
            '& .MuiAlert-action': { color: darkProTokens.textPrimary }
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Header Enterprise */}
      <Paper sx={{
        p: 4,
        mb: 4,
        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}98, ${darkProTokens.surfaceLevel3}95)`,
        border: `2px solid ${darkProTokens.primary}30`,
        borderRadius: 4,
        boxShadow: `0 8px 32px ${darkProTokens.primary}10`
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3
        }}>
          <Box>
            <Typography variant="h3" sx={{ 
              color: darkProTokens.primary, 
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 1
            }}>
              <LocalOfferIcon sx={{ fontSize: 50 }} />
              Cupones y Descuentos
            </Typography>
            <Typography variant="h6" sx={{ 
              color: darkProTokens.textSecondary,
              fontWeight: 300
            }}>
              Sistema de Promociones | Gestión Completa de Descuentos
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={2}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/dashboard/admin/membresias')}
              sx={{ 
                color: darkProTokens.primary,
                borderColor: `${darkProTokens.primary}60`,
                px: 3,
                py: 1.5,
                borderRadius: 3,
                fontWeight: 600,
                '&:hover': {
                  borderColor: darkProTokens.primary,
                  backgroundColor: `${darkProTokens.primary}10`,
                  transform: 'translateY(-2px)'
                }
              }}
              variant="outlined"
              size="large"
            >
              Membresías
            </Button>
            
            <Button
              startIcon={<RefreshIcon />}
              onClick={loadCoupons}
              disabled={loading}
              sx={{
                color: darkProTokens.textSecondary,
                borderColor: `${darkProTokens.textSecondary}60`,
                px: 3,
                py: 1.5,
                borderRadius: 3,
                fontWeight: 600,
                '&:hover': {
                  borderColor: darkProTokens.textSecondary,
                  backgroundColor: `${darkProTokens.textSecondary}10`,
                  transform: 'translateY(-2px)'
                }
              }}
              variant="outlined"
              size="large"
            >
              Actualizar
            </Button>
            
            <Button
              startIcon={<AddIcon />}
              onClick={() => {
                resetForm();
                setCreateDialogOpen(true);
              }}
              sx={{
                background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
                color: darkProTokens.background,
                fontWeight: 700,
                px: 4,
                py: 1.5,
                borderRadius: 3,
                '&:hover': {
                  background: `linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive})`,
                  transform: 'translateY(-2px)'
                }
              }}
              variant="contained"
              size="large"
            >
              Crear Cupón
            </Button>
          </Stack>
        </Box>

        {/* Estadísticas Dashboard */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.primary}20, ${darkProTokens.primary}10)`,
              border: `1px solid ${darkProTokens.primary}30`,
              borderRadius: 3,
              textAlign: 'center',
              p: 2
            }}>
              <Typography variant="h4" sx={{ 
                color: darkProTokens.primary, 
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}>
                <LocalOfferIcon />
                {stats.total}
              </Typography>
              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                Total Cupones
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.success}20, ${darkProTokens.success}10)`,
              border: `1px solid ${darkProTokens.success}30`,
              borderRadius: 3,
              textAlign: 'center',
              p: 2
            }}>
              <Typography variant="h4" sx={{ 
                color: darkProTokens.success, 
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}>
                <CheckCircleIcon />
                {stats.active}
              </Typography>
              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                Activos
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.error}20, ${darkProTokens.error}10)`,
              border: `1px solid ${darkProTokens.error}30`,
              borderRadius: 3,
              textAlign: 'center',
              p: 2
            }}>
              <Typography variant="h4" sx={{ 
                color: darkProTokens.error, 
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}>
                <AccessTimeIcon />
                {stats.expired}
              </Typography>
              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                Vencidos
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.info}20, ${darkProTokens.info}10)`,
              border: `1px solid ${darkProTokens.info}30`,
              borderRadius: 3,
              textAlign: 'center',
              p: 2
            }}>
              <Typography variant="h4" sx={{ 
                color: darkProTokens.info, 
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}>
                <TrendingUpIcon />
                {stats.totalUsages}
              </Typography>
              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                Total Usos
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.warning}20, ${darkProTokens.warning}10)`,
              border: `1px solid ${darkProTokens.warning}30`,
              borderRadius: 3,
              textAlign: 'center',
              p: 2
            }}>
              <Typography variant="h6" sx={{ 
                color: darkProTokens.warning, 
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}>
                <AttachMoneyIcon />
                {formatPrice(stats.totalDiscounts)}
              </Typography>
              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                Descuentos
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.info}20, ${darkProTokens.info}10)`,
              border: `1px solid ${darkProTokens.info}30`,
              borderRadius: 3,
              textAlign: 'center',
              p: 2
            }}>
              <Typography variant="h6" sx={{ 
                color: darkProTokens.info, 
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}>
                <PercentIcon />
                {stats.averageDiscount.toFixed(1)}%
              </Typography>
              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                Promedio
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Panel de Filtros */}
      <Card sx={{
        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}95, ${darkProTokens.surfaceLevel3}90)`,
        border: `1px solid ${darkProTokens.primary}20`,
        borderRadius: 4,
        mb: 3
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: showFilters ? 3 : 0
          }}>
            <Typography variant="h6" sx={{ 
              color: darkProTokens.primary, 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <FilterListIcon />
              Filtros de Búsqueda
              {(filters.searchTerm || filters.status || filters.discountType) && (
                <Badge 
                  badgeContent="●" 
                  color="primary"
                  sx={{ '& .MuiBadge-badge': { backgroundColor: darkProTokens.primary } }}
                />
              )}
            </Typography>
            
            <Button
              onClick={() => setShowFilters(!showFilters)}
              sx={{ 
                color: darkProTokens.primary,
                fontWeight: 600
              }}
            >
              {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
            </Button>
          </Box>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Buscar"
                      value={filters.searchTerm}
                      onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                      placeholder="Código, descripción..."
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: darkProTokens.primary }} />
                          </InputAdornment>
                        ),
                        sx: {
                          color: darkProTokens.textPrimary,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: `${darkProTokens.primary}30`
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: darkProTokens.primary
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: darkProTokens.primary
                          }
                        }
                      }}
                      InputLabelProps={{
                        sx: { 
                          color: darkProTokens.textSecondary,
                          '&.Mui-focused': { color: darkProTokens.primary }
                        }
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ 
                        color: darkProTokens.textSecondary,
                        '&.Mui-focused': { color: darkProTokens.primary }
                      }}>
                        Estado
                      </InputLabel>
                      <Select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        sx={{
                          color: darkProTokens.textPrimary,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: `${darkProTokens.primary}30`
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: darkProTokens.primary
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: darkProTokens.primary
                          }
                        }}
                      >
                        {statusOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <span>{option.icon}</span>
                              <span>{option.label}</span>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, md: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ 
                        color: darkProTokens.textSecondary,
                        '&.Mui-focused': { color: darkProTokens.primary }
                      }}>
                        Tipo
                      </InputLabel>
                      <Select
                        value={filters.discountType}
                        onChange={(e) => setFilters(prev => ({ ...prev, discountType: e.target.value }))}
                        sx={{
                          color: darkProTokens.textPrimary,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: `${darkProTokens.primary}30`
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: darkProTokens.primary
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: darkProTokens.primary
                          }
                        }}
                      >
                        {discountTypeOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <span>{option.icon}</span>
                              <span>{option.label}</span>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, md: 2 }}>
                    <TextField
                      fullWidth
                      label="Fecha Desde"
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                      InputLabelProps={{ 
                        shrink: true,
                        sx: { 
                          color: darkProTokens.textSecondary,
                          '&.Mui-focused': { color: darkProTokens.primary }
                        }
                      }}
                      InputProps={{
                        sx: {
                          color: darkProTokens.textPrimary,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: `${darkProTokens.primary}30`
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: darkProTokens.primary
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: darkProTokens.primary
                          }
                        }
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 2 }}>
                    <Button
                      fullWidth
                      onClick={clearFilters}
                      sx={{
                        color: darkProTokens.textSecondary,
                        borderColor: `${darkProTokens.textSecondary}30`,
                        height: '56px',
                        '&:hover': {
                          borderColor: darkProTokens.textSecondary,
                          backgroundColor: `${darkProTokens.textSecondary}05`
                        }
                      }}
                      variant="outlined"
                    >
                      Limpiar
                    </Button>
                  </Grid>
                </Grid>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Tabla de Cupones */}
      <Card sx={{
        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
        border: `1px solid ${darkProTokens.primary}20`,
        borderRadius: 4,
        overflow: 'hidden'
      }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress 
                size={60} 
                sx={{ color: darkProTokens.primary }}
                thickness={4}
              />
            </Box>
          ) : filteredCoupons.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h5" sx={{ 
                color: darkProTokens.textSecondary,
                mb: 2
              }}>
                📋 No se encontraron cupones
              </Typography>
              <Typography variant="body1" sx={{ 
                color: darkProTokens.textSecondary
              }}>
                Intente ajustar los filtros de búsqueda
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: `${darkProTokens.grayDark}30` }}>
                      <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700, borderBottom: `1px solid ${darkProTokens.primary}30` }}>
                        Código
                      </TableCell>
                      <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700, borderBottom: `1px solid ${darkProTokens.primary}30` }}>
                        Descripción
                      </TableCell>
                      <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700, borderBottom: `1px solid ${darkProTokens.primary}30` }}>
                        Descuento
                      </TableCell>
                      <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700, borderBottom: `1px solid ${darkProTokens.primary}30` }}>
                        Estado
                      </TableCell>
                      <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700, borderBottom: `1px solid ${darkProTokens.primary}30` }}>
                        Uso
                      </TableCell>
                      <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700, borderBottom: `1px solid ${darkProTokens.primary}30` }}>
                        Vigencia
                      </TableCell>
                      <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700, borderBottom: `1px solid ${darkProTokens.primary}30`, textAlign: 'center' }}>
                        Acciones
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCoupons
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((coupon) => {
                        const status = getCouponStatus(coupon);
                        const daysDisplay = getDaysRemainingDisplay(coupon);
                        
                        return (
                          <TableRow 
                            key={coupon.id}
                            sx={{ 
                              '&:hover': { 
                                backgroundColor: `${darkProTokens.primary}05` 
                              },
                              borderBottom: `1px solid ${darkProTokens.grayDark}40`
                            }}
                          >
                            <TableCell sx={{ color: darkProTokens.textPrimary, borderBottom: 'none' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body1" sx={{ 
                                  fontWeight: 700,
                                  fontFamily: 'monospace',
                                  color: darkProTokens.primary
                                }}>
                                  {coupon.code}
                                </Typography>
                                <Tooltip title="Copiar código">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleCopyCode(coupon.code)}
                                    sx={{ color: darkProTokens.textSecondary }}
                                  >
                                    <ContentCopyIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                            
                            <TableCell sx={{ color: darkProTokens.textPrimary, borderBottom: 'none' }}>
                              <Typography variant="body1" sx={{ 
                                maxWidth: 200,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {coupon.description}
                              </Typography>
                            </TableCell>
                            
                            <TableCell sx={{ borderBottom: 'none' }}>
                              <Box>
                                <Typography variant="h6" sx={{ 
                                  color: darkProTokens.primary,
                                  fontWeight: 700
                                }}>
                                  {formatDiscount(coupon)}
                                </Typography>
                                {coupon.min_amount > 0 && (
                                  <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                                    Min: {formatPrice(coupon.min_amount)}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            
                            <TableCell sx={{ borderBottom: 'none' }}>
                              <Chip 
                                label={`${status.icon} ${status.label}`}
                                sx={{
                                  backgroundColor: status.color,
                                  color: darkProTokens.textPrimary,
                                  fontWeight: 600
                                }}
                              />
                            </TableCell>
                            
                            <TableCell sx={{ color: darkProTokens.textPrimary, borderBottom: 'none' }}>
                              <Box>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                  {coupon.current_uses}{coupon.max_uses ? `/${coupon.max_uses}` : ''}
                                </Typography>
                                {coupon.max_uses && (
                                  <Typography variant="caption" sx={{ 
                                    color: (coupon.usage_percentage || 0) > 80 ? darkProTokens.warning : darkProTokens.textSecondary
                                  }}>
                                    {(coupon.usage_percentage || 0).toFixed(1)}% usado
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            
                            <TableCell sx={{ color: darkProTokens.textPrimary, borderBottom: 'none' }}>
                              <Box>
                                <Typography variant="body2">
                                  📅 {formatDateForDisplay(coupon.start_date)}
                                </Typography>
                                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                  → {formatDateForDisplay(coupon.end_date)}
                                </Typography>
                                {daysDisplay && (
                                  <Typography variant="caption" sx={{ color: daysDisplay.color }}>
                                    {daysDisplay.text}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            
                            <TableCell sx={{ borderBottom: 'none', textAlign: 'center' }}>
                              <Stack direction="row" spacing={1} justifyContent="center">
                                <Tooltip title="Ver Detalles">
                                  <IconButton
                                    onClick={() => {
                                      setSelectedCoupon(coupon);
                                      setDetailsDialogOpen(true);
                                    }}
                                    sx={{ color: darkProTokens.primary }}
                                  >
                                    <VisibilityIcon />
                                  </IconButton>
                                </Tooltip>
                                
                                <Tooltip title="Editar">
                                  <IconButton
                                    onClick={() => initializeEdit(coupon)}
                                    sx={{ color: darkProTokens.info }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                                
                                <Tooltip title="Más Acciones">
                                  <IconButton
                                    onClick={(e) => {
                                      setSelectedCoupon(coupon);
                                      setActionMenuAnchor(e.currentTarget);
                                    }}
                                    sx={{ color: darkProTokens.textSecondary }}
                                  >
                                    <MoreVertIcon />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={filteredCoupons.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(event, newPage) => setPage(newPage)}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(parseInt(event.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
                sx={{
                  color: darkProTokens.textPrimary,
                  borderTop: `1px solid ${darkProTokens.grayDark}`,
                  '& .MuiTablePagination-actions button': {
                    color: darkProTokens.primary
                  },
                  '& .MuiTablePagination-select': {
                    color: darkProTokens.textPrimary
                  }
                }}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) => 
                  `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                }
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Menu de Acciones */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={() => setActionMenuAnchor(null)}
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `1px solid ${darkProTokens.primary}30`,
            borderRadius: 2
          }
        }}
      >
        <MenuList>
          {selectedCoupon && (
            <>
              <MenuItemComponent 
                onClick={() => {
                  handleToggleActive(selectedCoupon);
                  setActionMenuAnchor(null);
                }}
                sx={{ color: selectedCoupon.is_active ? darkProTokens.warning : darkProTokens.success }}
              >
                <ListItemIcon>
                  {selectedCoupon.is_active ? (
                    <ToggleOffIcon sx={{ color: darkProTokens.warning }} />
                  ) : (
                    <ToggleOnIcon sx={{ color: darkProTokens.success }} />
                  )}
                </ListItemIcon>
                <ListItemText>
                  {selectedCoupon.is_active ? 'Desactivar' : 'Activar'}
                </ListItemText>
              </MenuItemComponent>
              
              <MenuItemComponent 
                onClick={() => {
                  handleCopyCode(selectedCoupon.code);
                  setActionMenuAnchor(null);
                }}
                sx={{ color: darkProTokens.info }}
              >
                <ListItemIcon>
                  <ContentCopyIcon sx={{ color: darkProTokens.info }} />
                </ListItemIcon>
                <ListItemText>Copiar Código</ListItemText>
              </MenuItemComponent>
              
              <MenuItemComponent 
                onClick={() => {
                  handleDeleteCoupon(selectedCoupon);
                  setActionMenuAnchor(null);
                }}
                sx={{ color: darkProTokens.error }}
              >
                <ListItemIcon>
                  <DeleteIcon sx={{ color: darkProTokens.error }} />
                </ListItemIcon>
                <ListItemText>Eliminar</ListItemText>
              </MenuItemComponent>
            </>
          )}
        </MenuList>
      </Menu>

      {/* 🆕 MODAL CREAR CUPÓN */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => !formLoading && setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `2px solid ${darkProTokens.primary}50`,
            borderRadius: 4,
            color: darkProTokens.textPrimary,
            boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5)`
          }
        }}
      >
        <DialogTitle sx={{ 
          color: darkProTokens.primary, 
          fontWeight: 800,
          fontSize: '1.6rem',
          textAlign: 'center',
          pb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AddIcon sx={{ fontSize: 35 }} />
            Crear Nuevo Cupón
          </Box>
          <IconButton 
            onClick={() => setCreateDialogOpen(false)}
            disabled={formLoading}
            sx={{ color: darkProTokens.textSecondary }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              {/* Código */}
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Código del Cupón"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') 
                  }))}
                  placeholder="Ej: DESC20, PROMO50"
                  InputProps={{
                    sx: {
                      color: darkProTokens.textPrimary,
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: `${darkProTokens.primary}30`
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: darkProTokens.primary
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: darkProTokens.primary
                      }
                    }
                  }}
                  InputLabelProps={{
                    sx: { 
                      color: darkProTokens.textSecondary,
                      '&.Mui-focused': { color: darkProTokens.primary }
                    }
                  }}
                />
              </Grid>

              {/* Tipo de Descuento */}
              <Grid size={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ 
                    color: darkProTokens.textSecondary,
                    '&.Mui-focused': { color: darkProTokens.primary }
                  }}>
                    Tipo de Descuento
                  </InputLabel>
                  <Select
                    value={formData.discount_type}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      discount_type: e.target.value as 'percentage' | 'fixed'
                    }))}
                    sx={{
                      color: darkProTokens.textPrimary,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: `${darkProTokens.primary}30`
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: darkProTokens.primary
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: darkProTokens.primary
                      }
                    }}
                  >
                    <MenuItem value="percentage">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PercentIcon />
                        Porcentaje
                      </Box>
                    </MenuItem>
                    <MenuItem value="fixed">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AttachMoneyIcon />
                        Monto Fijo
                      </Box>
                    </MenuItem>
                                    </Select>
                </FormControl>
              </Grid>

              {/* Valor del Descuento */}
              <Grid size={6}>
                <TextField
                  fullWidth
                  label={formData.discount_type === 'percentage' ? 'Porcentaje (%)' : 'Monto Fijo ($)'}
                  type="number"
                  value={formData.discount_value || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    discount_value: parseFloat(e.target.value) || 0 
                  }))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {formData.discount_type === 'percentage' ? '%' : '$'}
                      </InputAdornment>
                    ),
                    sx: {
                      color: darkProTokens.textPrimary,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: `${darkProTokens.primary}30`
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: darkProTokens.primary
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: darkProTokens.primary
                      }
                    }
                  }}
                  InputLabelProps={{
                    sx: { 
                      color: darkProTokens.textSecondary,
                      '&.Mui-focused': { color: darkProTokens.primary }
                    }
                  }}
                />
              </Grid>

              {/* Monto Mínimo */}
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Monto Mínimo"
                  type="number"
                  value={formData.min_amount || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    min_amount: parseFloat(e.target.value) || 0 
                  }))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    sx: {
                      color: darkProTokens.textPrimary,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: `${darkProTokens.primary}30`
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: darkProTokens.primary
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: darkProTokens.primary
                      }
                    }
                  }}
                  InputLabelProps={{
                    sx: { 
                      color: darkProTokens.textSecondary,
                      '&.Mui-focused': { color: darkProTokens.primary }
                    }
                  }}
                />
              </Grid>

              {/* Límite de Usos */}
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Límite de Usos"
                  type="number"
                  value={formData.max_uses || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    max_uses: e.target.value ? parseInt(e.target.value) : null 
                  }))}
                  placeholder="Ilimitado si está vacío"
                  InputProps={{
                    sx: {
                      color: darkProTokens.textPrimary,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: `${darkProTokens.primary}30`
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: darkProTokens.primary
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: darkProTokens.primary
                      }
                    }
                  }}
                  InputLabelProps={{
                    sx: { 
                      color: darkProTokens.textSecondary,
                      '&.Mui-focused': { color: darkProTokens.primary }
                    }
                  }}
                />
              </Grid>

              {/* Fecha de Inicio */}
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Fecha de Inicio"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  InputLabelProps={{ 
                    shrink: true,
                    sx: { 
                      color: darkProTokens.textSecondary,
                      '&.Mui-focused': { color: darkProTokens.primary }
                    }
                  }}
                  InputProps={{
                    sx: {
                      color: darkProTokens.textPrimary,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: `${darkProTokens.primary}30`
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: darkProTokens.primary
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: darkProTokens.primary
                      }
                    }
                  }}
                />
              </Grid>

              {/* Fecha de Fin */}
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Fecha de Fin"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  InputLabelProps={{ 
                    shrink: true,
                    sx: { 
                      color: darkProTokens.textSecondary,
                      '&.Mui-focused': { color: darkProTokens.primary }
                    }
                  }}
                  InputProps={{
                    sx: {
                      color: darkProTokens.textPrimary,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: `${darkProTokens.primary}30`
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: darkProTokens.primary
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: darkProTokens.primary
                      }
                    }
                  }}
                />
              </Grid>

              {/* Descripción */}
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Descripción"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción detallada del cupón y sus condiciones..."
                  InputProps={{
                    sx: {
                      color: darkProTokens.textPrimary,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: `${darkProTokens.primary}30`
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: darkProTokens.primary
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: darkProTokens.primary
                      }
                    }
                  }}
                  InputLabelProps={{
                    sx: { 
                      color: darkProTokens.textSecondary,
                      '&.Mui-focused': { color: darkProTokens.primary }
                    }
                  }}
                />
              </Grid>

              {/* Estado Activo */}
              <Grid size={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: darkProTokens.primary,
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: darkProTokens.primary,
                        },
                      }}
                    />
                  }
                  label={
                    <Typography variant="body1" sx={{ 
                      color: darkProTokens.textPrimary, 
                      fontWeight: 600 
                    }}>
                      ✅ Cupón Activo (disponible para uso inmediato)
                    </Typography>
                  }
                />
              </Grid>
            </Grid>

            {/* Vista Previa del Cupón */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" sx={{ 
                color: darkProTokens.primary,
                fontWeight: 700,
                mb: 2
              }}>
                📋 Vista Previa del Cupón
              </Typography>
              
              <Card sx={{
                background: `linear-gradient(135deg, ${darkProTokens.primary}15, ${darkProTokens.primary}05)`,
                border: `2px solid ${darkProTokens.primary}50`,
                borderRadius: 3,
                p: 3
              }}>
                <Grid container spacing={2}>
                  <Grid size={6}>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                      Código:
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      color: darkProTokens.primary,
                      fontFamily: 'monospace',
                      fontWeight: 700
                    }}>
                      {formData.code || 'CODIGO123'}
                    </Typography>
                  </Grid>
                  
                  <Grid size={6}>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                      Descuento:
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      color: darkProTokens.success,
                      fontWeight: 700
                    }}>
                      {formData.discount_type === 'percentage' 
                        ? `${formData.discount_value}%` 
                        : formatPrice(formData.discount_value)
                      }
                    </Typography>
                  </Grid>
                  
                  <Grid size={12}>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                      Descripción:
                    </Typography>
                    <Typography variant="body1" sx={{ color: darkProTokens.textPrimary }}>
                      {formData.description || 'Sin descripción'}
                    </Typography>
                  </Grid>
                  
                  <Grid size={6}>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                      Vigencia:
                    </Typography>
                    <Typography variant="body1" sx={{ color: darkProTokens.textPrimary }}>
                      {formatDateForDisplay(formData.start_date)} → {formatDateForDisplay(formData.end_date)}
                    </Typography>
                  </Grid>
                  
                  <Grid size={6}>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                      Límite:
                    </Typography>
                    <Typography variant="body1" sx={{ color: darkProTokens.textPrimary }}>
                      {formData.max_uses ? `${formData.max_uses} usos` : 'Ilimitado'}
                    </Typography>
                  </Grid>
                </Grid>
              </Card>
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={() => setCreateDialogOpen(false)}
            disabled={formLoading}
            sx={{ 
              color: darkProTokens.textSecondary,
              borderColor: `${darkProTokens.textSecondary}40`,
              px: 3,
              py: 1
            }}
            variant="outlined"
          >
            Cancelar
          </Button>
          
          <Button 
            onClick={handleSaveCoupon}
            disabled={formLoading || !formData.code.trim()}
            variant="contained"
            startIcon={formLoading ? <CircularProgress size={20} sx={{ color: darkProTokens.background }} /> : <SaveIcon />}
            sx={{
              background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
              color: darkProTokens.background,
              fontWeight: 700,
              px: 4,
              py: 1,
              '&:hover': {
                background: `linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive})`,
                transform: 'translateY(-1px)'
              },
              '&:disabled': {
                background: `${darkProTokens.grayMedium}60`,
                color: `${darkProTokens.textSecondary}60`
              }
            }}
          >
            {formLoading ? 'Creando...' : 'Crear Cupón'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✏️ MODAL EDITAR CUPÓN */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => !formLoading && setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `2px solid ${darkProTokens.primary}50`,
            borderRadius: 4,
            color: darkProTokens.textPrimary,
            boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5)`
          }
        }}
      >
        <DialogTitle sx={{ 
          color: darkProTokens.primary, 
          fontWeight: 800,
          fontSize: '1.6rem',
          textAlign: 'center',
          pb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EditIcon sx={{ fontSize: 35 }} />
            Editar Cupón: {selectedCoupon?.code}
          </Box>
          <IconButton 
            onClick={() => setEditDialogOpen(false)}
            disabled={formLoading}
            sx={{ color: darkProTokens.textSecondary }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          {selectedCoupon && (
            <Box sx={{ mt: 2 }}>
              {/* Información del cupón actual */}
              <Card sx={{
                background: `${darkProTokens.primary}10`,
                border: `1px solid ${darkProTokens.primary}30`,
                borderRadius: 3,
                p: 3,
                mb: 3
              }}>
                <Typography variant="h6" sx={{ 
                  color: darkProTokens.primary,
                  fontWeight: 700,
                  mb: 2
                }}>
                  📊 Estado Actual del Cupón
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid size={3}>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                      Usos:
                    </Typography>
                    <Typography variant="h6" sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>
                      {selectedCoupon.current_uses}{selectedCoupon.max_uses ? `/${selectedCoupon.max_uses}` : ''}
                    </Typography>
                  </Grid>
                  
                  <Grid size={3}>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                      Estado:
                    </Typography>
                    <Chip 
                      label={getCouponStatus(selectedCoupon).label}
                      size="small"
                      sx={{
                        backgroundColor: getCouponStatus(selectedCoupon).color,
                        color: darkProTokens.textPrimary,
                        fontWeight: 600
                      }}
                    />
                  </Grid>
                  
                  <Grid size={3}>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                      Creado:
                    </Typography>
                    <Typography variant="body1" sx={{ color: darkProTokens.textPrimary }}>
                      {formatDateForDisplay(selectedCoupon.created_at)}
                    </Typography>
                  </Grid>
                  
                  <Grid size={3}>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                      ID:
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: darkProTokens.textSecondary,
                      fontFamily: 'monospace'
                    }}>
                      {selectedCoupon.id.substring(0, 8)}...
                    </Typography>
                  </Grid>
                </Grid>
              </Card>

              {/* Formulario de edición (mismo que crear) */}
              <Grid container spacing={3}>
                {/* Los mismos campos que en crear cupón */}
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Código del Cupón"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') 
                    }))}
                    InputProps={{
                      sx: {
                        color: darkProTokens.textPrimary,
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: `${darkProTokens.primary}30`
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: darkProTokens.primary
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: darkProTokens.primary
                        }
                      }
                    }}
                    InputLabelProps={{
                      sx: { 
                        color: darkProTokens.textSecondary,
                        '&.Mui-focused': { color: darkProTokens.primary }
                      }
                    }}
                  />
                </Grid>

                <Grid size={6}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ 
                      color: darkProTokens.textSecondary,
                      '&.Mui-focused': { color: darkProTokens.primary }
                    }}>
                      Tipo de Descuento
                    </InputLabel>
                    <Select
                      value={formData.discount_type}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        discount_type: e.target.value as 'percentage' | 'fixed'
                      }))}
                      sx={{
                        color: darkProTokens.textPrimary,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: `${darkProTokens.primary}30`
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: darkProTokens.primary
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: darkProTokens.primary
                        }
                      }}
                    >
                      <MenuItem value="percentage">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PercentIcon />
                          Porcentaje
                        </Box>
                      </MenuItem>
                      <MenuItem value="fixed">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AttachMoneyIcon />
                          Monto Fijo
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Resto de campos similares */}
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label={formData.discount_type === 'percentage' ? 'Porcentaje (%)' : 'Monto Fijo ($)'}
                    type="number"
                    value={formData.discount_value || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      discount_value: parseFloat(e.target.value) || 0 
                    }))}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          {formData.discount_type === 'percentage' ? '%' : '$'}
                        </InputAdornment>
                      ),
                      sx: {
                        color: darkProTokens.textPrimary,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: `${darkProTokens.primary}30`
                        }
                      }
                    }}
                    InputLabelProps={{
                      sx: { 
                        color: darkProTokens.textSecondary,
                        '&.Mui-focused': { color: darkProTokens.primary }
                      }
                    }}
                  />
                </Grid>

                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Monto Mínimo"
                    type="number"
                    value={formData.min_amount || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      min_amount: parseFloat(e.target.value) || 0 
                    }))}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      sx: {
                        color: darkProTokens.textPrimary,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: `${darkProTokens.primary}30`
                        }
                      }
                    }}
                    InputLabelProps={{
                      sx: { 
                        color: darkProTokens.textSecondary,
                        '&.Mui-focused': { color: darkProTokens.primary }
                      }
                    }}
                  />
                </Grid>

                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Límite de Usos"
                    type="number"
                    value={formData.max_uses || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      max_uses: e.target.value ? parseInt(e.target.value) : null 
                    }))}
                    placeholder="Ilimitado si está vacío"
                    InputProps={{
                      sx: {
                        color: darkProTokens.textPrimary,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: `${darkProTokens.primary}30`
                        }
                      }
                    }}
                    InputLabelProps={{
                      sx: { 
                        color: darkProTokens.textSecondary,
                        '&.Mui-focused': { color: darkProTokens.primary }
                      }
                    }}
                  />
                </Grid>

                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Fecha de Inicio"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    InputLabelProps={{ 
                      shrink: true,
                      sx: { 
                        color: darkProTokens.textSecondary,
                        '&.Mui-focused': { color: darkProTokens.primary }
                      }
                    }}
                    InputProps={{
                      sx: {
                        color: darkProTokens.textPrimary,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: `${darkProTokens.primary}30`
                        }
                      }
                    }}
                  />
                </Grid>

                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Fecha de Fin"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    InputLabelProps={{ 
                      shrink: true,
                      sx: { 
                        color: darkProTokens.textSecondary,
                        '&.Mui-focused': { color: darkProTokens.primary }
                      }
                    }}
                    InputProps={{
                      sx: {
                        color: darkProTokens.textPrimary,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: `${darkProTokens.primary}30`
                        }
                      }
                    }}
                  />
                </Grid>

                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Descripción"
                    multiline
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    InputProps={{
                      sx: {
                        color: darkProTokens.textPrimary,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: `${darkProTokens.primary}30`
                        }
                      }
                    }}
                    InputLabelProps={{
                      sx: { 
                        color: darkProTokens.textSecondary,
                        '&.Mui-focused': { color: darkProTokens.primary }
                      }
                    }}
                  />
                </Grid>

                <Grid size={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.is_active}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: darkProTokens.primary,
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: darkProTokens.primary,
                          },
                        }}
                      />
                    }
                    label={
                      <Typography variant="body1" sx={{ 
                        color: darkProTokens.textPrimary, 
                        fontWeight: 600 
                      }}>
                        ✅ Cupón Activo
                      </Typography>
                    }
                  />
                </Grid>
              </Grid>

              {/* Alerta para usuarios que ya lo usaron */}
              {selectedCoupon.current_uses > 0 && (
                <Alert 
                  severity="warning"
                  sx={{
                    mt: 3,
                    backgroundColor: `${darkProTokens.warning}10`,
                    color: darkProTokens.textPrimary,
                    border: `1px solid ${darkProTokens.warning}30`,
                    '& .MuiAlert-icon': { color: darkProTokens.warning }
                  }}
                >
                  <Typography variant="body2">
                    <strong>⚠️ Atención:</strong> Este cupón ya ha sido usado {selectedCoupon.current_uses} veces. 
                    Los cambios pueden afectar a usuarios que ya lo aplicaron.
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={() => setEditDialogOpen(false)}
            disabled={formLoading}
            sx={{ 
              color: darkProTokens.textSecondary,
              borderColor: `${darkProTokens.textSecondary}40`,
              px: 3,
              py: 1
            }}
            variant="outlined"
          >
            Cancelar
          </Button>
          
          <Button 
            onClick={handleSaveCoupon}
            disabled={formLoading || !formData.code.trim()}
            variant="contained"
            startIcon={formLoading ? <CircularProgress size={20} sx={{ color: darkProTokens.background }} /> : <SaveIcon />}
            sx={{
              background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
              color: darkProTokens.background,
              fontWeight: 700,
              px: 4,
              py: 1,
              '&:hover': {
                background: `linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive})`,
                transform: 'translateY(-1px)'
              },
              '&:disabled': {
                background: `${darkProTokens.grayMedium}60`,
                color: `${darkProTokens.textSecondary}60`
              }
            }}
          >
            {formLoading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 👁️ MODAL DE DETALLES SIMPLIFICADO */}
      <Dialog 
        open={detailsDialogOpen} 
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `2px solid ${darkProTokens.primary}50`,
            borderRadius: 4,
            color: darkProTokens.textPrimary,
            boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5)`,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          color: darkProTokens.primary, 
          fontWeight: 800,
          fontSize: '1.8rem',
          textAlign: 'center',
          pb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LocalOfferIcon sx={{ fontSize: 40 }} />
            Detalles del Cupón
          </Box>
          <IconButton 
            onClick={() => setDetailsDialogOpen(false)}
            sx={{ color: darkProTokens.textSecondary }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ maxHeight: '70vh', overflow: 'auto' }}>
          {selectedCoupon && (
            <Grid container spacing={4}>
              {/* 🎟️ Información Principal */}
              <Grid size={12}>
                <Card sx={{
                  background: `linear-gradient(135deg, ${darkProTokens.primary}15, ${darkProTokens.primary}05)`,
                  border: `2px solid ${darkProTokens.primary}50`,
                  borderRadius: 4,
                  p: 4,
                  textAlign: 'center'
                }}>
                  <Typography variant="h3" sx={{ 
                    color: darkProTokens.primary,
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    mb: 2,
                    letterSpacing: 2
                  }}>
                    {selectedCoupon.code}
                  </Typography>
                  
                  <Typography variant="h4" sx={{ 
                    color: darkProTokens.success,
                    fontWeight: 700,
                    mb: 1
                  }}>
                    {formatDiscount(selectedCoupon)} de descuento
                  </Typography>
                  
                  <Typography variant="h6" sx={{ 
                    color: darkProTokens.textPrimary,
                    mb: 2
                  }}>
                    {selectedCoupon.description}
                  </Typography>
                  
                  <Chip 
                    label={`${getCouponStatus(selectedCoupon).icon} ${getCouponStatus(selectedCoupon).label}`}
                    sx={{
                      backgroundColor: getCouponStatus(selectedCoupon).color,
                      color: darkProTokens.textPrimary,
                      fontWeight: 700,
                      fontSize: '1rem',
                      px: 2,
                      py: 1
                    }}
                  />
                  
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                    <Button
                      startIcon={<ContentCopyIcon />}
                      onClick={() => handleCopyCode(selectedCoupon.code)}
                      sx={{
                        background: `linear-gradient(135deg, ${darkProTokens.info}, ${darkProTokens.infoHover})`,
                        color: darkProTokens.textPrimary,
                        fontWeight: 600
                      }}
                    >
                      Copiar Código
                    </Button>
                    
                    <Button
                      startIcon={<EditIcon />}
                      onClick={() => {
                        initializeEdit(selectedCoupon);
                        setDetailsDialogOpen(false);
                      }}
                      sx={{
                        background: `linear-gradient(135deg, ${darkProTokens.warning}, ${darkProTokens.warningHover})`,
                        color: darkProTokens.background,
                        fontWeight: 600
                      }}
                    >
                      Editar
                    </Button>
                  </Box>
                </Card>
              </Grid>

              {/* Más información en columnas */}
              <Grid size={6}>
                <Card sx={{
                  background: `${darkProTokens.info}10`,
                  border: `1px solid ${darkProTokens.info}30`,
                  borderRadius: 3,
                  p: 3
                }}>
                  <Typography variant="h6" sx={{ 
                    color: darkProTokens.info,
                    fontWeight: 700,
                    mb: 2
                  }}>
                    📊 Estadísticas de Uso
                  </Typography>
                  
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        Usos actuales:
                      </Typography>
                      <Typography variant="h5" sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>
                        {selectedCoupon.current_uses}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        Límite máximo:
                      </Typography>
                      <Typography variant="h5" sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>
                        {selectedCoupon.max_uses || '∞'}
                      </Typography>
                    </Box>

                    {selectedCoupon.max_uses && (
                      <Box>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          Porcentaje usado:
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          color: (selectedCoupon.usage_percentage || 0) > 80 ? darkProTokens.warning : darkProTokens.success,
                          fontWeight: 700 
                        }}>
                          {(selectedCoupon.usage_percentage || 0).toFixed(1)}%
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Card>
              </Grid>

              <Grid size={6}>
                <Card sx={{
                  background: `${darkProTokens.success}10`,
                  border: `1px solid ${darkProTokens.success}30`,
                  borderRadius: 3,
                  p: 3
                }}>
                  <Typography variant="h6" sx={{ 
                    color: darkProTokens.success,
                    fontWeight: 700,
                    mb: 2
                  }}>
                    📅 Información de Vigencia
                  </Typography>
                  
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        Fecha de inicio:
                      </Typography>
                      <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                        {formatDateForDisplay(selectedCoupon.start_date)}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        Fecha de fin:
                      </Typography>
                      <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                        {formatDateForDisplay(selectedCoupon.end_date)}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        Estado de vigencia:
                      </Typography>
                      {(() => {
                        const daysDisplay = getDaysRemainingDisplay(selectedCoupon);
                        return daysDisplay ? (
                          <Typography variant="body1" sx={{ 
                            color: daysDisplay.color,
                            fontWeight: 700
                          }}>
                            ⏰ {daysDisplay.text}
                          </Typography>
                        ) : (
                          <Typography variant="body1" sx={{ 
                            color: darkProTokens.error,
                            fontWeight: 700
                          }}>
                            ❌ Vencido
                          </Typography>
                        );
                      })()}
                    </Box>
                  </Stack>
                </Card>
              </Grid>

              {/* Metadatos */}
              <Grid size={12}>
                <Card sx={{
                  background: `${darkProTokens.grayDark}10`,
                  border: `1px solid ${darkProTokens.grayDark}30`,
                  borderRadius: 3,
                  p: 2
                }}>
                  <Typography variant="body2" sx={{ 
                    color: darkProTokens.textSecondary,
                    mb: 1
                  }}>
                    🆔 ID: {selectedCoupon.id}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: darkProTokens.textSecondary
                  }}>
                    📅 Creado: {formatDateForDisplay(selectedCoupon.created_at)}
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
