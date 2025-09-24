// pages/CuponesPage.tsx - ENTERPRISE v4.2 CORREGIDO
'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
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
  CircularProgress,
  InputAdornment,
  Stack,
  Tooltip,
  Badge,
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

// ✅ IMPORTS ENTERPRISE OBLIGATORIOS
import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { useUserTracking } from '@/hooks/useUserTracking';
import { notify } from '@/utils/notifications';
import { 
  getCurrentTimestamp,
  formatTimestampForDisplay, 
  formatDateForDisplay,
  getTodayInMexico,
  daysBetween,
  addDaysToDate
} from '@/utils/dateUtils';

// Icons
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import PercentIcon from '@mui/icons-material/Percent';

// ✅ INTERFACES OPTIMIZADAS
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
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  // Campos calculados
  is_expired?: boolean;
  days_remaining?: number | null;
  usage_percentage?: number;
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

// ✅ CONSTANTES MEMOIZADAS CON colorTokens CORRECTOS
const statusOptions = [
  { value: '', label: 'Todos los estados', color: colorTokens.textSecondary, icon: '📋' },
  { value: 'active', label: 'Activos', color: colorTokens.success, icon: '✅' },
  { value: 'expired', label: 'Vencidos', color: colorTokens.danger, icon: '❌' },
  { value: 'inactive', label: 'Inactivos', color: colorTokens.textMuted, icon: '⏸️' },
  { value: 'exhausted', label: 'Agotados', color: colorTokens.warning, icon: '🔚' }
];

const discountTypeOptions = [
  { value: '', label: 'Todos los tipos', icon: '💳' },
  { value: 'percentage', label: 'Porcentaje', icon: '📊' },
  { value: 'fixed', label: 'Monto Fijo', icon: '💰' }
];

// ✅ HOOK PERSONALIZADO CON AUDITORÍA AUTOMÁTICA ENTERPRISE

const useCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createBrowserSupabaseClient();
  
  // ✅ HOOK INTELIGENTE CORREGIDO
  const { addAuditFieldsFor } = useUserTracking();

  // ✅ CARGAR CUPONES CON FECHAS CENTRALIZADAS
  const loadCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // ✅ PROCESAR CON FUNCIONES CENTRALIZADAS
      const processedCoupons: Coupon[] = (data || []).map(coupon => {
        const today = getTodayInMexico();
        const isExpired = coupon.end_date < today;
        const daysRemaining = isExpired ? 0 : daysBetween(today, coupon.end_date);
        const usagePercentage = coupon.max_uses ? (coupon.current_uses / coupon.max_uses) * 100 : 0;
        
        return {
          ...coupon,
          is_expired: isExpired,
          days_remaining: daysRemaining,
          usage_percentage: usagePercentage
        };
      });

      setCoupons(processedCoupons);
      
    } catch (err: any) {
      setError(`Error al cargar cupones: ${err.message}`);
      notify.error('Error al cargar cupones');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // ✅ CREAR O EDITAR CUPÓN - CORREGIDO PARA TABLA REAL
  const saveCoupon = useCallback(async (formData: FormData, selectedCoupon?: Coupon | null) => {
    try {
      // Validaciones
      if (!formData.code.trim()) {
        throw new Error('El código del cupón es requerido');
      }
      if (formData.discount_value <= 0) {
        throw new Error('El valor del descuento debe ser mayor a 0');
      }
      if (formData.discount_type === 'percentage' && formData.discount_value > 100) {
        throw new Error('El porcentaje no puede ser mayor a 100%');
      }
      if (formData.start_date > formData.end_date) {
        throw new Error('La fecha de inicio no puede ser posterior a la fecha de fin');
      }

      const couponData = {
        ...formData,
        code: formData.code.toUpperCase().trim()
      };

      if (selectedCoupon) {
        // ✅ EDITAR - Tabla coupons con auditoría parcial (solo trigger)
        const dataWithAudit = await addAuditFieldsFor('coupons', couponData, true);
        
        const { error } = await supabase
          .from('coupons')
          .update(dataWithAudit)
          .eq('id', selectedCoupon.id);

        if (error) throw error;
        notify.success('Cupón actualizado exitosamente');
      } else {
        // ✅ CREAR - Tabla coupons con auditoría parcial (solo created_by)
        const dataWithAudit = await addAuditFieldsFor('coupons', couponData, false);
        
        const { error } = await supabase
          .from('coupons')
          .insert([dataWithAudit]);

        if (error) throw error;
        notify.success('Cupón creado exitosamente');
      }

      await loadCoupons();
      return true;
      
    } catch (err: any) {
      if (err.code === '23505') {
        notify.error('Ya existe un cupón con ese código');
      } else {
        notify.error(`Error al guardar cupón: ${err.message}`);
      }
      return false;
    }
  }, [supabase, addAuditFieldsFor, loadCoupons]);

  // ✅ TOGGLE ESTADO CON AUDITORÍA PARCIAL
  const toggleActive = useCallback(async (coupon: Coupon) => {
    try {
      // ✅ APLICAR AUDITORÍA ESPECÍFICA PARA TABLA COUPONS
      const dataWithAudit = await addAuditFieldsFor('coupons', {
        is_active: !coupon.is_active
      }, true);

      const { error } = await supabase
        .from('coupons')
        .update(dataWithAudit)
        .eq('id', coupon.id);

      if (error) throw error;

      notify.success(`Cupón ${!coupon.is_active ? 'activado' : 'desactivado'} exitosamente`);
      await loadCoupons();
      
    } catch (err: any) {
      notify.error(`Error al cambiar estado: ${err.message}`);
    }
  }, [supabase, loadCoupons, addAuditFieldsFor]);

  // ✅ ELIMINAR CUPÓN (sin auditoría - eliminación completa)
  const deleteCoupon = useCallback(async (coupon: Coupon) => {
    if (!confirm(`¿Está seguro de eliminar el cupón "${coupon.code}"?`)) return;

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', coupon.id);

      if (error) throw error;

      notify.success('Cupón eliminado exitosamente');
      await loadCoupons();
      
    } catch (err: any) {
      notify.error(`Error al eliminar cupón: ${err.message}`);
    }
  }, [supabase, loadCoupons]);

  return {
    coupons,
    loading,
    error,
    loadCoupons,
    saveCoupon,
    deleteCoupon,
    toggleActive,
    clearError: () => setError(null)
  };
};

// ✅ COMPONENTE PRINCIPAL CON useHydrated
export default function CuponesPage() {
  const router = useRouter();
  const hydrated = useHydrated(); // ✅ SSR SAFETY
  
  // ✅ HOOK PERSONALIZADO CON AUDITORÍA AUTOMÁTICA
  const {
    coupons,
    loading,
    error,
    loadCoupons,
    saveCoupon,
    deleteCoupon,
    toggleActive,
    clearError
  } = useCoupons();

  // Estados de UI
  const [filteredCoupons, setFilteredCoupons] = useState<Coupon[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Estados de filtros
  const [filters, setFilters] = useState<Filters>({
    searchTerm: '',
    status: '',
    discountType: '',
    dateFrom: '',
    dateTo: ''
  });

  // ✅ FORM DATA INICIAL MEMOIZADO
  const initialFormData = useMemo((): FormData => ({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    min_amount: 0,
    max_uses: null,
    start_date: getTodayInMexico(),
    end_date: getTodayInMexico(),
    is_active: true
  }), []);

  const [formData, setFormData] = useState<FormData>(initialFormData);

  // ✅ ESTADÍSTICAS MEMOIZADAS
  const stats = useMemo(() => {
    const today = getTodayInMexico();
    return {
      total: coupons.length,
      active: coupons.filter(c => c.is_active && c.end_date >= today).length,
      expired: coupons.filter(c => c.end_date < today).length,
      totalUsages: coupons.reduce((sum, c) => sum + c.current_uses, 0),
      averageDiscount: coupons.length > 0 ? coupons.reduce((sum, c) => sum + c.discount_value, 0) / coupons.length : 0
    };
  }, [coupons]);

  // ✅ EFECTOS CON HIDRATACIÒN
  useEffect(() => {
    if (hydrated) {
      loadCoupons();
    }
  }, [hydrated, loadCoupons]);

  // ✅ APLICAR FILTROS MEMOIZADO
  const applyFilters = useCallback(() => {
    let filtered = [...coupons];

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(coupon => 
        coupon.code.toLowerCase().includes(searchLower) ||
        coupon.description.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status) {
      const today = getTodayInMexico();
      filtered = filtered.filter(coupon => {
        switch (filters.status) {
          case 'active': return coupon.is_active && coupon.end_date >= today;
          case 'expired': return coupon.end_date < today;
          case 'inactive': return !coupon.is_active;
          case 'exhausted': return coupon.max_uses && coupon.current_uses >= coupon.max_uses;
          default: return true;
        }
      });
    }

    if (filters.discountType) {
      filtered = filtered.filter(coupon => coupon.discount_type === filters.discountType);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(coupon => coupon.start_date >= filters.dateFrom);
    }
    
    if (filters.dateTo) {
      filtered = filtered.filter(coupon => coupon.start_date <= filters.dateTo);
    }

    setFilteredCoupons(filtered);
    setPage(0);
  }, [coupons, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // ✅ FUNCIONES MEMOIZADAS
  const getCouponStatus = useCallback((coupon: Coupon) => {
    const today = getTodayInMexico();
    
    if (coupon.end_date < today) {
      return { status: 'expired', label: 'Vencido', color: colorTokens.danger, icon: '❌' };
    }
    if (!coupon.is_active) {
      return { status: 'inactive', label: 'Inactivo', color: colorTokens.textMuted, icon: '⏸️' };
    }
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return { status: 'exhausted', label: 'Agotado', color: colorTokens.warning, icon: '🔚' };
    }
    return { status: 'active', label: 'Activo', color: colorTokens.success, icon: '✅' };
  }, []);

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  }, []);

  const formatDiscount = useCallback((coupon: Coupon) => {
    return coupon.discount_type === 'percentage' 
      ? `${coupon.discount_value}%`
      : formatPrice(coupon.discount_value);
  }, [formatPrice]);

  const handleCopyCode = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      notify.success(`Código "${code}" copiado al portapapeles`);
    } catch (err) {
      notify.error('Error al copiar código');
    }
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setSelectedCoupon(null);
  }, [initialFormData]);

  const handleSaveCoupon = useCallback(async () => {
    setFormLoading(true);
    const success = await saveCoupon(formData, selectedCoupon);
    
    if (success) {
      resetForm();
      setCreateDialogOpen(false);
      setEditDialogOpen(false);
    }
    
    setFormLoading(false);
  }, [saveCoupon, formData, selectedCoupon, resetForm]);

  const initializeEdit = useCallback((coupon: Coupon) => {
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
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      status: '',
      discountType: '',
      dateFrom: '',
      dateTo: ''
    });
  }, []);

  // ✅ PANTALLA DE CARGA HASTA HIDRATACIÒN
  if (!hydrated) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`
      }}>
        <CircularProgress size={60} sx={{ color: colorTokens.brand }} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 3, 
      background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.surfaceLevel1})`,
      minHeight: '100vh',
      color: colorTokens.textPrimary
    }}>
      {/* ✅ HEADER ENTERPRISE */}
      <Paper sx={{
        p: 4,
        mb: 4,
        background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}98, ${colorTokens.surfaceLevel3}95)`,
        border: `2px solid ${colorTokens.brand}30`,
        borderRadius: 4,
        boxShadow: `0 8px 32px ${colorTokens.brand}10`
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3
        }}>
          <Box>
            <Typography variant="h3" sx={{ 
              color: colorTokens.brand, 
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
              color: colorTokens.textSecondary,
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
                color: colorTokens.brand,
                borderColor: `${colorTokens.brand}60`,
                px: 3,
                py: 1.5,
                borderRadius: 3,
                fontWeight: 600,
                '&:hover': {
                  borderColor: colorTokens.brand,
                  backgroundColor: `${colorTokens.brand}10`,
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
                color: colorTokens.textSecondary,
                borderColor: `${colorTokens.textSecondary}60`,
                px: 3,
                py: 1.5,
                borderRadius: 3,
                fontWeight: 600,
                '&:hover': {
                  borderColor: colorTokens.textSecondary,
                  backgroundColor: `${colorTokens.textSecondary}10`,
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
                background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
                color: colorTokens.textOnBrand,
                fontWeight: 700,
                px: 4,
                py: 1.5,
                borderRadius: 3,
                '&:hover': {
                  background: `linear-gradient(135deg, ${colorTokens.brandHover}, ${colorTokens.brandActive})`,
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

        {/* ✅ ESTADÍSTICAS */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.brand}20, ${colorTokens.brand}10)`,
              border: `1px solid ${colorTokens.brand}30`,
              borderRadius: 3,
              textAlign: 'center',
              p: 2
            }}>
              <Typography variant="h4" sx={{ 
                color: colorTokens.brand, 
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}>
                <LocalOfferIcon />
                {stats.total}
              </Typography>
              <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                Total Cupones
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.success}20, ${colorTokens.success}10)`,
              border: `1px solid ${colorTokens.success}30`,
              borderRadius: 3,
              textAlign: 'center',
              p: 2
            }}>
              <Typography variant="h4" sx={{ 
                color: colorTokens.success, 
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}>
                <CheckCircleIcon />
                {stats.active}
              </Typography>
              <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                Activos
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.danger}20, ${colorTokens.danger}10)`,
              border: `1px solid ${colorTokens.danger}30`,
              borderRadius: 3,
              textAlign: 'center',
              p: 2
            }}>
              <Typography variant="h4" sx={{ 
                color: colorTokens.danger, 
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}>
                <AccessTimeIcon />
                {stats.expired}
              </Typography>
              <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                Vencidos
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.info}20, ${colorTokens.info}10)`,
              border: `1px solid ${colorTokens.info}30`,
              borderRadius: 3,
              textAlign: 'center',
              p: 2
            }}>
              <Typography variant="h4" sx={{ 
                color: colorTokens.info, 
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}>
                <TrendingUpIcon />
                {stats.totalUsages}
              </Typography>
              <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                Total Usos
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.warning}20, ${colorTokens.warning}10)`,
              border: `1px solid ${colorTokens.warning}30`,
              borderRadius: 3,
              textAlign: 'center',
              p: 2
            }}>
              <Typography variant="h6" sx={{ 
                color: colorTokens.warning, 
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}>
                <PercentIcon />
                {stats.averageDiscount.toFixed(1)}%
              </Typography>
              <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                Promedio
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* ✅ RESTO DEL COMPONENTE - MANTIENE TODA LA FUNCIONALIDAD */}
      {/* (Panel de filtros, tabla, modales) - Sin cambios en la UI */}
      {/* Solo se corrigieron las operaciones CRUD con auditoría automática */}

      {/* ✅ PANEL DE FILTROS */}
      <Card sx={{
        background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}95, ${colorTokens.surfaceLevel3}90)`,
        border: `1px solid ${colorTokens.brand}20`,
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
              color: colorTokens.brand, 
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
                  sx={{ '& .MuiBadge-badge': { backgroundColor: colorTokens.brand } }}
                />
              )}
            </Typography>
            
            <Button
              onClick={() => setShowFilters(!showFilters)}
              sx={{ 
                color: colorTokens.brand,
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
                            <SearchIcon sx={{ color: colorTokens.brand }} />
                          </InputAdornment>
                        ),
                        sx: {
                          color: colorTokens.textPrimary,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: `${colorTokens.brand}30`
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: colorTokens.brand
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: colorTokens.brand
                          }
                        }
                      }}
                      InputLabelProps={{
                        sx: { 
                          color: colorTokens.textSecondary,
                          '&.Mui-focused': { color: colorTokens.brand }
                        }
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ 
                        color: colorTokens.textSecondary,
                        '&.Mui-focused': { color: colorTokens.brand }
                      }}>
                        Estado
                      </InputLabel>
                      <Select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        sx={{
                          color: colorTokens.textPrimary,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: `${colorTokens.brand}30`
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: colorTokens.brand
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: colorTokens.brand
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
                        color: colorTokens.textSecondary,
                        '&.Mui-focused': { color: colorTokens.brand }
                      }}>
                        Tipo
                      </InputLabel>
                      <Select
                        value={filters.discountType}
                        onChange={(e) => setFilters(prev => ({ ...prev, discountType: e.target.value }))}
                        sx={{
                          color: colorTokens.textPrimary,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: `${colorTokens.brand}30`
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: colorTokens.brand
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: colorTokens.brand
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
                          color: colorTokens.textSecondary,
                          '&.Mui-focused': { color: colorTokens.brand }
                        }
                      }}
                      InputProps={{
                        sx: {
                          color: colorTokens.textPrimary,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: `${colorTokens.brand}30`
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: colorTokens.brand
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: colorTokens.brand
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
                        color: colorTokens.textSecondary,
                        borderColor: `${colorTokens.textSecondary}30`,
                        height: '56px',
                        '&:hover': {
                          borderColor: colorTokens.textSecondary,
                          backgroundColor: `${colorTokens.textSecondary}05`
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

      {/* ✅ TABLA DE CUPONES (SIN CAMBIOS - SOLO PRESENTACIÓN) */}
      <Card sx={{
        background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
        border: `1px solid ${colorTokens.brand}20`,
        borderRadius: 4,
        overflow: 'hidden'
      }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress 
                size={60} 
                sx={{ color: colorTokens.brand }}
                thickness={4}
              />
            </Box>
          ) : filteredCoupons.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h5" sx={{ 
                color: colorTokens.textSecondary,
                mb: 2
              }}>
                📋 No se encontraron cupones
              </Typography>
              <Typography variant="body1" sx={{ 
                color: colorTokens.textSecondary
              }}>
                Intente ajustar los filtros de búsqueda
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: `${colorTokens.neutral300}30` }}>
                      <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700, borderBottom: `1px solid ${colorTokens.brand}30` }}>
                        Código
                      </TableCell>
                      <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700, borderBottom: `1px solid ${colorTokens.brand}30` }}>
                        Descripción
                      </TableCell>
                      <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700, borderBottom: `1px solid ${colorTokens.brand}30` }}>
                        Descuento
                      </TableCell>
                      <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700, borderBottom: `1px solid ${colorTokens.brand}30` }}>
                        Estado
                      </TableCell>
                      <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700, borderBottom: `1px solid ${colorTokens.brand}30` }}>
                        Uso
                      </TableCell>
                      <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700, borderBottom: `1px solid ${colorTokens.brand}30` }}>
                        Vigencia
                      </TableCell>
                      <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700, borderBottom: `1px solid ${colorTokens.brand}30`, textAlign: 'center' }}>
                        Acciones
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCoupons
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((coupon) => {
                        const status = getCouponStatus(coupon);
                        
                        return (
                          <TableRow 
                            key={coupon.id}
                            sx={{ 
                              '&:hover': { 
                                backgroundColor: `${colorTokens.brand}05` 
                              },
                              borderBottom: `1px solid ${colorTokens.neutral300}40`
                            }}
                          >
                            <TableCell sx={{ color: colorTokens.textPrimary, borderBottom: 'none' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body1" sx={{ 
                                  fontWeight: 700,
                                  fontFamily: 'monospace',
                                  color: colorTokens.brand
                                }}>
                                  {coupon.code}
                                </Typography>
                                <Tooltip title="Copiar código">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleCopyCode(coupon.code)}
                                    sx={{ color: colorTokens.textSecondary }}
                                  >
                                    <ContentCopyIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                            
                            <TableCell sx={{ color: colorTokens.textPrimary, borderBottom: 'none' }}>
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
                                  color: colorTokens.brand,
                                  fontWeight: 700
                                }}>
                                  {formatDiscount(coupon)}
                                </Typography>
                                {coupon.min_amount > 0 && (
                                  <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
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
                                  color: colorTokens.textPrimary,
                                  fontWeight: 600
                                }}
                              />
                            </TableCell>
                            
                            <TableCell sx={{ color: colorTokens.textPrimary, borderBottom: 'none' }}>
                              <Box>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                  {coupon.current_uses}{coupon.max_uses ? `/${coupon.max_uses}` : ''}
                                </Typography>
                                {coupon.max_uses && (
                                  <Typography variant="caption" sx={{ 
                                    color: (coupon.usage_percentage || 0) > 80 ? colorTokens.warning : colorTokens.textSecondary
                                  }}>
                                    {(coupon.usage_percentage || 0).toFixed(1)}% usado
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            
                            <TableCell sx={{ color: colorTokens.textPrimary, borderBottom: 'none' }}>
                              <Box>
                                <Typography variant="body2">
                                  📅 {formatDateForDisplay(coupon.start_date)}
                                </Typography>
                                <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                                  → {formatDateForDisplay(coupon.end_date)}
                                </Typography>
                                {coupon.days_remaining && coupon.days_remaining > 0 && (
                                  <Typography variant="caption" sx={{ 
                                    color: coupon.days_remaining < 7 ? colorTokens.warning : colorTokens.success 
                                  }}>
                                    {coupon.days_remaining} días restantes
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
                                    sx={{ color: colorTokens.brand }}
                                  >
                                    <VisibilityIcon />
                                  </IconButton>
                                </Tooltip>
                                
                                <Tooltip title="Editar">
                                  <IconButton
                                    onClick={() => initializeEdit(coupon)}
                                    sx={{ color: colorTokens.info }}
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
                                    sx={{ color: colorTokens.textSecondary }}
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
                  color: colorTokens.textPrimary,
                  borderTop: `1px solid ${colorTokens.neutral300}`,
                  '& .MuiTablePagination-actions button': {
                    color: colorTokens.brand
                  },
                  '& .MuiTablePagination-select': {
                    color: colorTokens.textPrimary
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

      {/* ✅ MENU DE ACCIONES */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={() => setActionMenuAnchor(null)}
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
            border: `1px solid ${colorTokens.brand}30`,
            borderRadius: 2
          }
        }}
      >
        {selectedCoupon ? [
          <MenuItemComponent 
            key="toggle"
            onClick={() => {
              toggleActive(selectedCoupon);
              setActionMenuAnchor(null);
            }}
            sx={{ color: selectedCoupon.is_active ? colorTokens.warning : colorTokens.success }}
          >
            <ListItemIcon>
              {selectedCoupon.is_active ? (
                <ToggleOffIcon sx={{ color: colorTokens.warning }} />
              ) : (
                <ToggleOnIcon sx={{ color: colorTokens.success }} />
              )}
            </ListItemIcon>
            <ListItemText>
              {selectedCoupon.is_active ? 'Desactivar' : 'Activar'}
            </ListItemText>
          </MenuItemComponent>,
          
          <MenuItemComponent 
            key="copy"
            onClick={() => {
              handleCopyCode(selectedCoupon.code);
              setActionMenuAnchor(null);
            }}
            sx={{ color: colorTokens.info }}
          >
            <ListItemIcon>
              <ContentCopyIcon sx={{ color: colorTokens.info }} />
            </ListItemIcon>
            <ListItemText>Copiar Código</ListItemText>
          </MenuItemComponent>,
          
          <MenuItemComponent 
            key="delete"
            onClick={() => {
              deleteCoupon(selectedCoupon);
              setActionMenuAnchor(null);
            }}
            sx={{ color: colorTokens.danger }}
          >
            <ListItemIcon>
              <DeleteIcon sx={{ color: colorTokens.danger }} />
            </ListItemIcon>
            <ListItemText>Eliminar</ListItemText>
          </MenuItemComponent>
        ] : []}
      </Menu>

      {/* ✅ MODALES MANTIENEN FUNCIONALIDAD PERO YA CON AUDITORÍA AUTOMÁTICA */}
      <CouponFormDialog
        open={createDialogOpen}
        onClose={() => !formLoading && setCreateDialogOpen(false)}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSaveCoupon}
        loading={formLoading}
        title="Crear Nuevo Cupón"
        isEditing={false}
      />

      <CouponFormDialog
        open={editDialogOpen}
        onClose={() => !formLoading && setEditDialogOpen(false)}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSaveCoupon}
        loading={formLoading}
        title={`Editar Cupón: ${selectedCoupon?.code}`}
        isEditing={true}
        selectedCoupon={selectedCoupon}
      />

      <CouponDetailsDialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        coupon={selectedCoupon}
        onEdit={initializeEdit}
        onCopyCode={handleCopyCode}
        getCouponStatus={getCouponStatus}
        formatDiscount={formatDiscount}
        formatPrice={formatPrice}
      />
    </Box>
  );
}

// ✅ COMPONENTE OPTIMIZADO PARA FORMULARIO (MANTIENE FUNCIONALIDAD - SIN CAMBIOS)
const CouponFormDialog = memo<{
  open: boolean;
  onClose: () => void;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onSave: () => void;
  loading: boolean;
  title: string;
  isEditing: boolean;
  selectedCoupon?: Coupon | null;
}>(({
  open,
  onClose,
  formData,
  setFormData,
  onSave,
  loading,
  title,
  isEditing,
  selectedCoupon
}) => {
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  }, []);

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
          border: `2px solid ${colorTokens.brand}50`,
          borderRadius: 4,
          color: colorTokens.textPrimary,
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5)`
        }
      }}
    >
      <DialogTitle sx={{ 
        color: colorTokens.brand, 
        fontWeight: 800,
        fontSize: '1.6rem',
        textAlign: 'center',
        pb: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isEditing ? <EditIcon sx={{ fontSize: 35 }} /> : <AddIcon sx={{ fontSize: 35 }} />}
          {title}
        </Box>
        <IconButton 
          onClick={onClose}
          disabled={loading}
          sx={{ color: colorTokens.textSecondary }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {isEditing && selectedCoupon && (
            <Card sx={{
              background: `${colorTokens.brand}10`,
              border: `1px solid ${colorTokens.brand}30`,
              borderRadius: 3,
              p: 3,
              mb: 3
            }}>
              <Typography variant="h6" sx={{ 
                color: colorTokens.brand,
                fontWeight: 700,
                mb: 2
              }}>
                📊 Estado Actual del Cupón
              </Typography>
              
              <Grid container spacing={2}>
                <Grid size={3}>
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                    Usos:
                  </Typography>
                  <Typography variant="h6" sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>
                    {selectedCoupon.current_uses}{selectedCoupon.max_uses ? `/${selectedCoupon.max_uses}` : ''}
                  </Typography>
                </Grid>
                
                <Grid size={3}>
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                    Creado:
                  </Typography>
                  <Typography variant="body1" sx={{ color: colorTokens.textPrimary }}>
                    {formatDateForDisplay(selectedCoupon.created_at)}
                  </Typography>
                </Grid>
                
                <Grid size={6}>
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                    ID:
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: colorTokens.textSecondary,
                    fontFamily: 'monospace'
                  }}>
                    {selectedCoupon.id.substring(0, 8)}...
                  </Typography>
                </Grid>
              </Grid>
            </Card>
          )}

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
                    color: colorTokens.textPrimary,
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: `${colorTokens.brand}30`
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: colorTokens.brand
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: colorTokens.brand
                    }
                  }
                }}
                InputLabelProps={{
                  sx: { 
                    color: colorTokens.textSecondary,
                    '&.Mui-focused': { color: colorTokens.brand }
                  }
                }}
              />
            </Grid>

            {/* Tipo de Descuento */}
            <Grid size={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ 
                  color: colorTokens.textSecondary,
                  '&.Mui-focused': { color: colorTokens.brand }
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
                    color: colorTokens.textPrimary,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: `${colorTokens.brand}30`
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: colorTokens.brand
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: colorTokens.brand
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

            {/* Resto de campos mantienen la misma funcionalidad */}
            {/* (Valor del descuento, monto mínimo, límite, fechas, descripción, switch activo) */}
            
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
                    color: colorTokens.textPrimary,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: `${colorTokens.brand}30`
                    }
                  }
                }}
                InputLabelProps={{
                  sx: { 
                    color: colorTokens.textSecondary,
                    '&.Mui-focused': { color: colorTokens.brand }
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
                    color: colorTokens.textPrimary,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: `${colorTokens.brand}30`
                    }
                  }
                }}
                InputLabelProps={{
                  sx: { 
                    color: colorTokens.textSecondary,
                    '&.Mui-focused': { color: colorTokens.brand }
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
                    color: colorTokens.textPrimary,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: `${colorTokens.brand}30`
                    }
                  }
                }}
                InputLabelProps={{
                  sx: { 
                    color: colorTokens.textSecondary,
                    '&.Mui-focused': { color: colorTokens.brand }
                  }
                }}
              />
            </Grid>

            {/* Fechas */}
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
                    color: colorTokens.textSecondary,
                    '&.Mui-focused': { color: colorTokens.brand }
                  }
                }}
                InputProps={{
                  sx: {
                    color: colorTokens.textPrimary,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: `${colorTokens.brand}30`
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
                    color: colorTokens.textSecondary,
                    '&.Mui-focused': { color: colorTokens.brand }
                  }
                }}
                InputProps={{
                  sx: {
                    color: colorTokens.textPrimary,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: `${colorTokens.brand}30`
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
                    color: colorTokens.textPrimary,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: `${colorTokens.brand}30`
                    }
                  }
                }}
                InputLabelProps={{
                  sx: { 
                    color: colorTokens.textSecondary,
                    '&.Mui-focused': { color: colorTokens.brand }
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
                        color: colorTokens.brand,
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: colorTokens.brand,
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="body1" sx={{ 
                    color: colorTokens.textPrimary, 
                    fontWeight: 600 
                  }}>
                    ✅ Cupón Activo (disponible para uso inmediato)
                  </Typography>
                }
              />
            </Grid>
          </Grid>

          {/* Vista Previa */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ 
              color: colorTokens.brand,
              fontWeight: 700,
              mb: 2
            }}>
              📋 Vista Previa del Cupón
            </Typography>
            
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.brand}15, ${colorTokens.brand}05)`,
              border: `2px solid ${colorTokens.brand}50`,
              borderRadius: 3,
              p: 3
            }}>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                    Código:
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: colorTokens.brand,
                    fontFamily: 'monospace',
                    fontWeight: 700
                  }}>
                    {formData.code || 'CODIGO123'}
                  </Typography>
                </Grid>
                
                <Grid size={6}>
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                    Descuento:
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: colorTokens.success,
                    fontWeight: 700
                  }}>
                    {formData.discount_type === 'percentage' 
                      ? `${formData.discount_value}%` 
                      : formatPrice(formData.discount_value)
                    }
                  </Typography>
                </Grid>
              </Grid>
            </Card>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button 
          onClick={onClose}
          disabled={loading}
          sx={{ 
            color: colorTokens.textSecondary,
            borderColor: `${colorTokens.textSecondary}40`,
            px: 3,
            py: 1
          }}
          variant="outlined"
        >
          Cancelar
        </Button>
        
        <Button 
          onClick={onSave}
          disabled={loading || !formData.code.trim()}
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} sx={{ color: colorTokens.textOnBrand }} /> : <SaveIcon />}
          sx={{
            background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
            color: colorTokens.textOnBrand,
            fontWeight: 700,
            px: 4,
            py: 1,
            '&:hover': {
              background: `linear-gradient(135deg, ${colorTokens.brandHover}, ${colorTokens.brandActive})`,
              transform: 'translateY(-1px)'
            },
            '&:disabled': {
              background: `${colorTokens.neutral500}60`,
              color: `${colorTokens.textSecondary}60`
            }
          }}
        >
          {loading ? (isEditing ? 'Guardando...' : 'Creando...') : (isEditing ? 'Guardar Cambios' : 'Crear Cupón')}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

CouponFormDialog.displayName = 'CouponFormDialog';

// ✅ COMPONENTE OPTIMIZADO PARA DETALLES (MANTIENE FUNCIONALIDAD - SIN CAMBIOS)
const CouponDetailsDialog = memo<{
  open: boolean;
  onClose: () => void;
  coupon: Coupon | null;
  onEdit: (coupon: Coupon) => void;
  onCopyCode: (code: string) => void;
  getCouponStatus: (coupon: Coupon) => any;
  formatDiscount: (coupon: Coupon) => string;
  formatPrice: (price: number) => string;
}>(({
  open,
  onClose,
  coupon,
  onEdit,
  onCopyCode,
  getCouponStatus,
  formatDiscount,
  formatPrice
}) => {
  if (!coupon) return null;

  const status = getCouponStatus(coupon);

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
          border: `2px solid ${colorTokens.brand}50`,
          borderRadius: 4,
          color: colorTokens.textPrimary,
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5)`,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        color: colorTokens.brand, 
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
          onClick={onClose}
          sx={{ color: colorTokens.textSecondary }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ maxHeight: '70vh', overflow: 'auto' }}>
        <Grid container spacing={4}>
          {/* Información Principal */}
          <Grid size={12}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.brand}15, ${colorTokens.brand}05)`,
              border: `2px solid ${colorTokens.brand}50`,
              borderRadius: 4,
              p: 4,
              textAlign: 'center'
            }}>
              <Typography variant="h3" sx={{ 
                color: colorTokens.brand,
                fontFamily: 'monospace',
                fontWeight: 800,
                mb: 2,
                letterSpacing: 2
              }}>
                {coupon.code}
              </Typography>
              
              <Typography variant="h4" sx={{ 
                color: colorTokens.success,
                fontWeight: 700,
                mb: 1
              }}>
                {formatDiscount(coupon)} de descuento
              </Typography>
              
              <Typography variant="h6" sx={{ 
                color: colorTokens.textPrimary,
                mb: 2
              }}>
                {coupon.description}
              </Typography>
              
              <Chip 
                label={`${status.icon} ${status.label}`}
                sx={{
                  backgroundColor: status.color,
                  color: colorTokens.textPrimary,
                  fontWeight: 700,
                  fontSize: '1rem',
                  px: 2,
                  py: 1
                }}
              />
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button
                  startIcon={<ContentCopyIcon />}
                  onClick={() => onCopyCode(coupon.code)}
                  sx={{
                    background: `linear-gradient(135deg, ${colorTokens.info}, ${colorTokens.infoHover})`,
                    color: colorTokens.textPrimary,
                    fontWeight: 600
                  }}
                >
                  Copiar Código
                </Button>
                
                <Button
                  startIcon={<EditIcon />}
                  onClick={() => {
                    onEdit(coupon);
                    onClose();
                  }}
                  sx={{
                    background: `linear-gradient(135deg, ${colorTokens.warning}, ${colorTokens.warning})`,
                    color: colorTokens.textOnBrand,
                    fontWeight: 600
                  }}
                >
                  Editar
                </Button>
              </Box>
            </Card>
          </Grid>

          {/* Estadísticas y detalles adicionales */}
          <Grid size={12}>
            <Grid container spacing={3}>
              <Grid size={4}>
                <Card sx={{
                  background: `${colorTokens.info}10`,
                  border: `1px solid ${colorTokens.info}30`,
                  borderRadius: 3,
                  p: 3,
                  textAlign: 'center'
                }}>
                  <Typography variant="h4" sx={{ color: colorTokens.info, fontWeight: 800 }}>
                    {coupon.current_uses}
                  </Typography>
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                    Usos Actuales
                  </Typography>
                </Card>
              </Grid>
              
              <Grid size={4}>
                <Card sx={{
                  background: `${colorTokens.success}10`,
                  border: `1px solid ${colorTokens.success}30`,
                  borderRadius: 3,
                  p: 3,
                  textAlign: 'center'
                }}>
                  <Typography variant="h4" sx={{ color: colorTokens.success, fontWeight: 800 }}>
                    {coupon.max_uses || '∞'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                    Límite Máximo
                  </Typography>
                </Card>
              </Grid>
              
              <Grid size={4}>
                <Card sx={{
                  background: `${colorTokens.warning}10`,
                  border: `1px solid ${colorTokens.warning}30`,
                  borderRadius: 3,
                  p: 3,
                  textAlign: 'center'
                }}>
                  <Typography variant="h4" sx={{ color: colorTokens.warning, fontWeight: 800 }}>
                    {coupon.days_remaining || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                    Días Restantes
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          {/* Metadatos */}
          <Grid size={12}>
            <Card sx={{
              background: `${colorTokens.neutral300}10`,
              border: `1px solid ${colorTokens.neutral300}30`,
              borderRadius: 3,
              p: 2
            }}>
              <Typography variant="body2" sx={{ 
                color: colorTokens.textSecondary,
                mb: 1
              }}>
                🆔 ID: {coupon.id}
              </Typography>
              <Typography variant="body2" sx={{ 
                color: colorTokens.textSecondary,
                mb: 1
              }}>
                📅 Creado: {formatTimestampForDisplay(coupon.created_at)}
              </Typography>
              <Typography variant="body2" sx={{ 
                color: colorTokens.textSecondary
              }}>
                📅 Vigencia: {formatDateForDisplay(coupon.start_date)} → {formatDateForDisplay(coupon.end_date)}
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
});

CouponDetailsDialog.displayName = 'CouponDetailsDialog';