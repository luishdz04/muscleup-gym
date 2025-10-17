'use client';

import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  LinearProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Avatar,
  Tooltip,
  CircularProgress,
  Grid,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Payments as PaymentIcon,
  Cancel as CancelIcon,
  Visibility as ViewIcon,
  Add as AddPaymentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Bookmark as BookmarkIcon,
    CheckCircle as CheckCircleIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// ✅ IMPORTS ENTERPRISE ESTÁNDAR MUSCLEUP v8.2
import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { useUserTracking } from '@/hooks/useUserTracking';
import { 
  formatTimestampShort,
  getTodayInMexico
} from '@/utils/dateUtils';
import { notify } from '@/utils/notifications';
import { useNotifications } from '@/hooks/useNotifications';
import { useEntityCRUD } from '@/hooks/useEntityCRUD';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

// ✅ TIPOS EXISTENTES IMPORTADOS
import { 
  Sale, 
  SaleItem, 
  SalePaymentDetail
} from '@/types/pos';

// ✅ DIÁLOGOS SIMPLIFICADOS v8.2 - SOLO 3 NECESARIOS
import PaymentToLayawayDialog from '@/components/dialogs/PaymentToLayawayDialog';
import LayawayDetailsDialog from '@/components/dialogs/LayawayDetailsDialog';
import CancelLayawayDialog from '@/components/dialogs/CancelLayawayDialog';

// ✅ INTERFACE ESPECÍFICA PARA CLIENTES DEL FILTRO
interface CustomerFilter {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
}

// ✅ INTERFACE LAYAWAY EXTENDIDA BASADA EN SALE v8.2
interface LayawayWithDetails extends Sale {
  source_warehouse_id?: string;
  cancelled_at?: string; // ✅ AÑADIR ESTA LÍNEA
  customer?: {
    id: string;
    firstName: string;
    lastName?: string;
    
    email?: string;
    profilePictureUrl?: string;
  };
  sale_items?: SaleItem[];
  sale_payment_details?: SalePaymentDetail[];
  // Campos calculados
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  progress_percentage?: number;
  days_until_expiration?: number;
  is_expired?: boolean;
  is_expiring_soon?: boolean;
}

// ✅ FILTROS ESPECÍFICOS PARA APARTADOS
interface LayawayFilters {
  status_category: 'active' | 'expiring' | 'expired' | 'completed' | 'cancelled' | 'all';
  search: string;
  customer_filter: string;
}

// ✅ ESTADÍSTICAS ESPECÍFICAS APARTADOS v8.2 - CON CANCELADOS
interface LayawayStats {
  activeCount: number;
  expiringCount: number;
  expiredCount: number;
  completedCount: number;
  cancelledCount: number; // ✅ NUEVO
  totalValue: number;
  totalCollected: number;
  totalPending: number;
  averageProgress: number;
}

// ✅ COMPONENTE PRINCIPAL GESTIÓN DE APARTADOS v8.2 MULTI-ALMACÉN
const LayawayManagementPage = memo(() => {
  // ✅ HOOKS ENTERPRISE ORDENADOS
  const hydrated = useHydrated();
  const { addAuditFieldsFor } = useUserTracking();
  const { toast, alert } = useNotifications();
  const supabase = createBrowserSupabaseClient();

  // ✅ ESTADOS ESPECÍFICOS PARA APARTADOS - SIMPLIFICADOS
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState<LayawayFilters>({
    status_category: 'active',
    search: '',
    customer_filter: 'all'
  });
  
  const [selectedLayaway, setSelectedLayaway] = useState<LayawayWithDetails | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  
  const [customers, setCustomers] = useState<CustomerFilter[]>([]);

  // ✅ CALLBACKS ESTABLES FUERA DEL USEMEMO
  const handleLayawayCrudError = useCallback((error: string) => {
    console.error('Error cargando apartados:', error);
    notify.error(`Error al cargar apartados: ${error}`);
  }, []);

  const handleLayawayCrudSuccess = useCallback(() => {
    console.log('✅ Apartados cargados exitosamente');
  }, []);

  // ✅ CONFIGURACIÓN CRUD v8.2 - CON source_warehouse_id MULTI-ALMACÉN
  const layawayCrudConfig = useMemo(() => ({
    tableName: 'sales' as const,
    selectQuery: `
      *,
      source_warehouse_id,
      customer:Users!sales_customer_id_fkey (
        id,
        firstName,
        lastName,
        email,
        profilePictureUrl
      ),
      cashier:Users!sales_cashier_id_fkey (
        id,
        firstName,
        lastName,
        profilePictureUrl
      ),
      sale_items (
        id,
        product_id,
        product_name,
        product_sku,
        source_warehouse_id,
        quantity,
        unit_price,
        total_price,
        discount_amount,
        tax_amount
      ),
      sale_payment_details (
        id,
        payment_method,
        amount,
        commission_rate,
        commission_amount,
        payment_reference,
        sequence_order,
        is_partial_payment,
        payment_date
      )
    `,
    onError: handleLayawayCrudError,
    onSuccess: handleLayawayCrudSuccess
  }), [handleLayawayCrudError, handleLayawayCrudSuccess]);

  // ✅ CRUD CON FILTRO AUTOMÁTICO A LAYAWAYS
  const { 
    data: allSales, 
    loading, 
    updateItem,
    searchItems,
    refreshData 
  } = useEntityCRUD<LayawayWithDetails>(layawayCrudConfig);

  // ✅ FILTRO AUTOMÁTICO A LAYAWAYS
  const layaways = useMemo(() => {
    return allSales.filter(sale => sale.sale_type === 'layaway');
  }, [allSales]);

  // ✅ CARGAR CUSTOMERS PARA FILTRO
  const loadCustomers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('Users')
        .select('id, firstName, lastName, email')
        .eq('rol', 'cliente')
        .order('firstName');
      
      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  }, [supabase]);

  // ✅ CARGAR DATOS INICIALES
  useEffect(() => {
    if (hydrated) {
      loadCustomers();
      searchItems({ sale_type: 'layaway' });
    }
  }, [hydrated, loadCustomers, searchItems]);

  // ✅ FUNCIONES HELPER MEMOIZADAS
  const formatPrice = useCallback((price: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price || 0);
  }, []);

  const getDaysUntilExpiration = useCallback((layawayExpiresAt: string): number => {
    if (!layawayExpiresAt) return 0;
    
    try {
      const today = new Date();
      const expiration = new Date(layawayExpiresAt);
      
      today.setHours(0, 0, 0, 0);
      expiration.setHours(0, 0, 0, 0);
      
      const diffTime = expiration.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays;
    } catch (error) {
      console.error('Error calculando días hasta vencimiento:', error);
      return 0;
    }
  }, []);

  // ✅ PROCESAR LAYAWAYS CON CÁLCULOS ENTERPRISE
  const processedLayaways = useMemo(() => {
    return layaways.map((layaway): LayawayWithDetails => {
      const customer = layaway.customer;
      const totalAmount = layaway.total_amount || 0;
      const paidAmount = layaway.paid_amount || 0;
      
      const realPendingAmount = Math.max(0, totalAmount - paidAmount);
      const progressPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
      const daysUntilExpiration = getDaysUntilExpiration(layaway.layaway_expires_at || '');
      
      return {
        ...layaway,
        pending_amount: realPendingAmount,
        customer_name: customer 
          ? `${customer.firstName} ${customer.lastName || ''}`.trim()
          : 'Cliente General',
        customer_email: customer?.email || '',
        customer_phone: '',
        progress_percentage: progressPercentage,
        days_until_expiration: daysUntilExpiration,
        is_expired: daysUntilExpiration < 0 && layaway.status === 'pending',
        is_expiring_soon: daysUntilExpiration >= 0 && daysUntilExpiration <= 7 && layaway.status === 'pending'
      };
    });
  }, [layaways, getDaysUntilExpiration]);

  // ✅ ESTADÍSTICAS CALCULADAS v8.2 - CON CANCELADOS
  const layawayStats = useMemo((): LayawayStats => {
    const active = processedLayaways.filter(l => 
      l.status === 'pending' && !l.is_expired
    );
    const expiring = processedLayaways.filter(l => l.is_expiring_soon);
    const expired = processedLayaways.filter(l => l.is_expired);
    const completed = processedLayaways.filter(l => l.status === 'completed');
    const cancelled = processedLayaways.filter(l => l.status === 'cancelled'); // ✅ NUEVO

 // ✅ LÓGICA CORREGIDA: Filtrar antes de sumar
const activeAndCompleted = processedLayaways.filter(l => l.status !== 'cancelled');

const totalValue = activeAndCompleted.reduce((sum, l) => sum + l.total_amount, 0);

// ✅ CORREGIDO: Usar payment_received que incluye comisiones cobradas
// paid_amount = valor neto aplicado a la deuda
// payment_received = total cobrado incluyendo comisiones
const totalCollected = activeAndCompleted.reduce((sum, l) => {
  // Si tiene payment_received (lo que realmente cobró), usarlo
  // Si no, usar paid_amount como fallback
  const collected = l.payment_received || l.paid_amount || 0;
  return sum + collected;
}, 0);

// El pendiente real solo existe en los apartados con estado 'pending'
const totalPending = processedLayaways
  .filter(l => l.status === 'pending')
  .reduce((sum, l) => sum + (l.pending_amount || 0), 0);
    
    const averageProgress = processedLayaways.length > 0
      ? processedLayaways.reduce((sum, l) => sum + (l.progress_percentage || 0), 0) / processedLayaways.length
      : 0;

    return {
      activeCount: active.length,
      expiringCount: expiring.length,
      expiredCount: expired.length,
      completedCount: completed.length,
      cancelledCount: cancelled.length, // ✅ NUEVO
      totalValue,
      totalCollected,
      totalPending,
      averageProgress
    };
  }, [processedLayaways]);

  // ✅ CONFIGURACIÓN DE TABS v8.2 - CON CANCELADOS
  const tabsData = useMemo(() => [
    { 
      label: 'Activos', 
      value: 'active', 
      color: colorTokens.success,
      icon: <CheckIcon />,
      count: layawayStats.activeCount,
      filter: (layaways: LayawayWithDetails[]) => 
        layaways.filter(l => l.status === 'pending' && !l.is_expired)
    },
    { 
      label: 'Por Vencer', 
      value: 'expiring', 
      color: colorTokens.warning,
      icon: <WarningIcon />,
      count: layawayStats.expiringCount,
      filter: (layaways: LayawayWithDetails[]) => 
        layaways.filter(l => l.is_expiring_soon)
    },
    { 
      label: 'Vencidos', 
      value: 'expired', 
      color: colorTokens.danger,
      icon: <ErrorIcon />,
      count: layawayStats.expiredCount,
      filter: (layaways: LayawayWithDetails[]) => 
        layaways.filter(l => l.is_expired)
    },
    { 
      label: 'Completados', 
      value: 'completed', 
      color: colorTokens.info,
      icon: <CheckIcon />,
      count: layawayStats.completedCount,
      filter: (layaways: LayawayWithDetails[]) => 
        layaways.filter(l => l.status === 'completed')
    },
    // ✅ NUEVA PESTAÑA CANCELADOS
    { 
      label: 'Cancelados', 
      value: 'cancelled', 
      color: colorTokens.danger,
      icon: <CancelIcon />,
      count: layawayStats.cancelledCount,
      filter: (layaways: LayawayWithDetails[]) => 
        layaways.filter(l => l.status === 'cancelled')
    }
  ], [layawayStats]);

  // ✅ APARTADOS FILTRADOS
  const filteredLayaways = useMemo(() => {
    const currentTab = tabsData[activeTab];
    if (!currentTab) return processedLayaways;
    
    let filtered = currentTab.filter(processedLayaways);
    
    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(layaway =>
        layaway.sale_number?.toLowerCase().includes(searchLower) ||
        layaway.customer_name?.toLowerCase().includes(searchLower) ||
        layaway.notes?.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.customer_filter !== 'all') {
      filtered = filtered.filter(layaway => 
        layaway.customer_id === filters.customer_filter
      );
    }
    
    return filtered;
  }, [processedLayaways, activeTab, tabsData, filters]);

  // ✅ HANDLERS MEMOIZADOS
  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setFilters(prev => ({ ...prev, search: '', customer_filter: 'all' }));
  }, []);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: event.target.value }));
  }, []);

  const handleCustomerFilterChange = useCallback((event: any) => {
    setFilters(prev => ({ ...prev, customer_filter: event.target.value }));
  }, []);

  const handleRefresh = useCallback(async () => {
    const toastId = notify.loading('Actualizando apartados...');
    
    try {
      await searchItems({ sale_type: 'layaway' });
      await loadCustomers();
      
      notify.dismiss(toastId);
      notify.success(`✅ ${layaways.length} apartados actualizados`);
      
    } catch (error) {
      notify.dismiss(toastId);
      notify.error('Error al actualizar apartados');
      console.error('Error en refresh:', error);
    }
  }, [searchItems, loadCustomers, layaways.length]);

  const clearFilters = useCallback(() => {
    setFilters({
      status_category: 'active',
      search: '',
      customer_filter: 'all'
    });
    setActiveTab(0);
  }, []);

  // ✅ HANDLERS DE ACCIONES SIMPLIFICADOS v8.2
  const handleViewDetails = useCallback((layaway: LayawayWithDetails) => {
    if (!layaway?.id) {
      notify.error('⚠️ No se puede abrir detalles: apartado inválido');
      return;
    }
    
    console.log(`📋 Abriendo detalles de apartado: ${layaway.sale_number}`);
    setSelectedLayaway(layaway);
    setDetailsDialogOpen(true);
  }, []);

  const handleAddPayment = useCallback((layaway: LayawayWithDetails) => {
    if (!layaway?.id) {
      notify.error('⚠️ Apartado inválido');
      return;
    }
    
    if (layaway.status !== 'pending') {
      notify.error('⚠️ Solo se pueden agregar abonos a apartados pendientes');
      return;
    }
    
    if (!layaway.source_warehouse_id) {
      notify.error('⚠️ Almacén origen no configurado - contacta al administrador');
      console.error('Apartado sin source_warehouse_id:', layaway);
      return;
    }
    
    console.log(`💰 Abriendo diálogo de abono - Apartado: ${layaway.sale_number}, Almacén: ${layaway.source_warehouse_id}`);
    setSelectedLayaway(layaway);
    setPaymentDialogOpen(true);
  }, []);

  const handleCancelLayaway = useCallback((layaway: LayawayWithDetails) => {
    if (!layaway?.id) {
      notify.error('⚠️ Apartado inválido');
      return;
    }
    
    if (layaway.status !== 'pending') {
      notify.error('⚠️ Solo se pueden cancelar apartados pendientes');
      return;
    }
    
    if (!layaway.source_warehouse_id) {
      notify.error('⚠️ Almacén origen no configurado - contacta al administrador');
      console.error('Apartado sin source_warehouse_id:', layaway);
      return;
    }
    
    console.log(`❌ Cancelando apartado - ${layaway.sale_number}, Almacén: ${layaway.source_warehouse_id}`);
    setSelectedLayaway(layaway);
    setCancelDialogOpen(true);
  }, []);

  // ✅ FUNCIONES DE ÉXITO SIMPLIFICADAS
  const handleDialogSuccess = useCallback(() => {
    console.log('✅ Operación exitosa - refrescando datos');
    setPaymentDialogOpen(false);
    setCancelDialogOpen(false);
    setDetailsDialogOpen(false);
    setSelectedLayaway(null);
    handleRefresh();
  }, [handleRefresh]);

  const handleDialogClose = useCallback(() => {
    console.log('🚪 Cerrando diálogo sin cambios');
    setPaymentDialogOpen(false);
    setCancelDialogOpen(false);
    setDetailsDialogOpen(false);
    setSelectedLayaway(null);
  }, []);

  const getProgressColor = useCallback((percentage: number): string => {
    if (percentage >= 80) return colorTokens.success;
    if (percentage >= 50) return colorTokens.warning;
    return colorTokens.danger;
  }, []);

  // ✅ SSR SAFETY MUSCLEUP v8.2
  if (!hydrated) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={60} sx={{ color: colorTokens.brand }} />
        <Typography variant="h6" sx={{ color: colorTokens.textSecondary }}>
          Cargando MuscleUp Gym...
        </Typography>
        <Typography variant="body2" sx={{ color: colorTokens.textMuted }}>
          Inicializando gestión de apartados
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      p: { xs: 2, sm: 2.5, md: 3 },
      background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
      minHeight: '100vh'
    }}>
      {/* ✅ HEADER CON BRANDING MUSCLEUP */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', md: 'center' },
        mb: { xs: 2, sm: 3, md: 4 },
        background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
        p: { xs: 2, sm: 2.5, md: 3 },
        borderRadius: 4,
        border: `1px solid ${colorTokens.border}`,
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
          <Avatar sx={{
            bgcolor: colorTokens.warning,
            width: { xs: 48, sm: 52, md: 56 },
            height: { xs: 48, sm: 52, md: 56 },
            color: colorTokens.textOnBrand
          }}>
            <BookmarkIcon sx={{ fontSize: { xs: 26, sm: 28, md: 30 } }} />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{
              fontWeight: 800,
              color: colorTokens.textPrimary,
              mb: 1,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
            }}>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Gestión de Apartados</Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Apartados</Box>
            </Typography>
            <Typography variant="body1" sx={{
              color: colorTokens.textSecondary,
              fontSize: { xs: '0.875rem', sm: '1rem' },
              display: { xs: 'none', sm: 'block' }
            }}>
              Gestión de apartados | Activos | Cancelados | Completados
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} sx={{ color: colorTokens.textOnBrand }} /> : <RefreshIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
          onClick={handleRefresh}
          disabled={loading}
          sx={{
            background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandActive})`,
            color: colorTokens.textOnBrand,
            fontWeight: 700,
            px: { xs: 2, sm: 2.5, md: 3 },
            py: { xs: 1, sm: 1.25, md: 1.5 },
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
            borderRadius: 3,
            width: { xs: '100%', md: 'auto' },
            '&:hover': {
              background: `linear-gradient(135deg, ${colorTokens.brandHover}, ${colorTokens.brand})`,
              transform: 'translateY(-2px)',
              boxShadow: `0 8px 20px ${colorTokens.glow}`
            }
          }}
        >
          {loading ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </Box>

      {/* ✅ ESTADÍSTICAS ENTERPRISE MUSCLEUP */}
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <motion.div whileHover={{ scale: 1.02 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.success}, ${colorTokens.successHover})`,
              color: colorTokens.textPrimary,
              borderRadius: 3,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: colorTokens.brand
              }
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <CheckIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                  {layawayStats.activeCount}
                </Typography>
                <Typography variant="body1">
                  Apartados Activos
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <motion.div whileHover={{ scale: 1.02 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.warning}, ${colorTokens.brandHover})`,
              color: colorTokens.textOnBrand,
              borderRadius: 3,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: colorTokens.brand
              }
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <TimeIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                  {layawayStats.expiringCount}
                </Typography>
                <Typography variant="body1">
                  Por Vencer (7 días)
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <motion.div whileHover={{ scale: 1.02 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.danger}, ${colorTokens.dangerHover})`,
              color: colorTokens.textPrimary,
              borderRadius: 3,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: colorTokens.brand
              }
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <ErrorIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                  {layawayStats.expiredCount}
                </Typography>
                <Typography variant="body1">
                  Vencidos
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <motion.div whileHover={{ scale: 1.02 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.info}, ${colorTokens.infoHover})`,
              color: colorTokens.textPrimary,
              borderRadius: 3,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: colorTokens.brand
              }
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <MoneyIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                  {formatPrice(layawayStats.totalValue)}
                </Typography>
                <Typography variant="body1">
                  Valor Total
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <motion.div whileHover={{ scale: 1.02 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
              color: colorTokens.textOnBrand,
              borderRadius: 3,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: colorTokens.success
              }
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <PaymentIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                  {formatPrice(layawayStats.totalCollected)}
                </Typography>
                <Typography variant="body1">
                  Total Cobrado
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Promedio: {Math.round(layawayStats.averageProgress)}%
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* ✅ FILTROS ESPECÍFICOS APARTADOS */}
      <Card sx={{ 
        mb: 4,
        background: colorTokens.surfaceLevel2,
        border: `1px solid ${colorTokens.border}`,
        borderRadius: 3
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <FilterIcon sx={{ color: colorTokens.brand }} />
            <Typography variant="h6" sx={{ 
              color: colorTokens.textPrimary,
              fontWeight: 700
            }}>
              Filtros de Apartados
            </Typography>
          </Box>
          
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Buscar apartado"
                placeholder="Número, cliente, notas..."
                value={filters.search}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: colorTokens.brand }} />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiInputLabel-root': { color: colorTokens.textSecondary },
                  '& .MuiOutlinedInput-root': {
                    color: colorTokens.textPrimary,
                    '& fieldset': { borderColor: colorTokens.border },
                    '&:hover fieldset': { borderColor: colorTokens.brand },
                    '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                  }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colorTokens.textSecondary }}>Cliente</InputLabel>
                <Select
                  value={filters.customer_filter}
                  onChange={handleCustomerFilterChange}
                  label="Cliente"
                  sx={{
                    color: colorTokens.textPrimary,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: colorTokens.border }
                  }}
                >
                  <MenuItem value="all">Todos los clientes</MenuItem>
                  {customers.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.firstName} {customer.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={clearFilters}
                sx={{ 
                  height: '56px',
                  color: colorTokens.textSecondary,
                  borderColor: colorTokens.border,
                  '&:hover': {
                    borderColor: colorTokens.brand,
                    color: colorTokens.brand
                  }
                }}
              >
                Limpiar Filtros
              </Button>
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <Typography variant="body2" sx={{ 
                color: colorTokens.textMuted,
                textAlign: 'center'
              }}>
                {filteredLayaways.length} apartados mostrados
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ✅ TABS DE ESTADOS APARTADOS v8.2 - CON CANCELADOS */}
      <Card sx={{ 
        mb: 4,
        background: colorTokens.surfaceLevel2,
        border: `1px solid ${colorTokens.border}`,
        borderRadius: 3
      }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '1rem',
              color: colorTokens.textSecondary,
              '&.Mui-selected': {
                color: colorTokens.brand
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: colorTokens.brand,
              height: 3
            }
          }}
        >
          {tabsData.map((tab, index) => (
            <Tab 
              key={tab.value}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Badge badgeContent={tab.count} color="error" max={99}>
                    {tab.icon}
                  </Badge>
                  <Typography variant="body1" fontWeight="inherit">
                    {tab.label}
                  </Typography>
                </Box>
              }
              sx={{
                color: activeTab === index ? tab.color : colorTokens.textSecondary,
                '&.Mui-selected': {
                  color: tab.color
                }
              }}
            />
          ))}
        </Tabs>
      </Card>

      {/* ✅ TABLA DE APARTADOS OPTIMIZADA (resto del código igual) */}
      <Card sx={{
        background: colorTokens.surfaceLevel2,
        border: `1px solid ${colorTokens.border}`,
        borderRadius: 3,
        overflow: 'hidden'
      }}>
        {loading && (
          <Box sx={{ p: 2 }}>
            <LinearProgress sx={{
              '& .MuiLinearProgress-bar': {
                backgroundColor: colorTokens.brand
              }
            }} />
            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center', color: colorTokens.textSecondary }}>
              Cargando apartados para {tabsData[activeTab]?.label}...
            </Typography>
          </Box>
        )}
        
        <TableContainer component={Paper} sx={{
          background: colorTokens.surfaceLevel1,
          border: `1px solid ${colorTokens.border}`
        }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ background: colorTokens.brand, color: colorTokens.textOnBrand, fontWeight: 'bold', borderBottom: `2px solid ${colorTokens.brandActive}` }}>Número</TableCell>
                <TableCell sx={{ background: colorTokens.brand, color: colorTokens.textOnBrand, fontWeight: 'bold', borderBottom: `2px solid ${colorTokens.brandActive}` }}>Cliente</TableCell>
                <TableCell sx={{ background: colorTokens.brand, color: colorTokens.textOnBrand, fontWeight: 'bold', borderBottom: `2px solid ${colorTokens.brandActive}` }}>Total</TableCell>
                <TableCell sx={{ background: colorTokens.brand, color: colorTokens.textOnBrand, fontWeight: 'bold', borderBottom: `2px solid ${colorTokens.brandActive}` }}>Pagado</TableCell>
                <TableCell sx={{ background: colorTokens.brand, color: colorTokens.textOnBrand, fontWeight: 'bold', borderBottom: `2px solid ${colorTokens.brandActive}` }}>Pendiente</TableCell>
                <TableCell sx={{ background: colorTokens.brand, color: colorTokens.textOnBrand, fontWeight: 'bold', borderBottom: `2px solid ${colorTokens.brandActive}` }}>Progreso</TableCell>
                <TableCell sx={{ background: colorTokens.brand, color: colorTokens.textOnBrand, fontWeight: 'bold', borderBottom: `2px solid ${colorTokens.brandActive}` }}>Vence</TableCell>
                <TableCell sx={{ background: colorTokens.brand, color: colorTokens.textOnBrand, fontWeight: 'bold', borderBottom: `2px solid ${colorTokens.brandActive}` }}>Estado</TableCell>
                <TableCell sx={{ background: colorTokens.brand, color: colorTokens.textOnBrand, fontWeight: 'bold', borderBottom: `2px solid ${colorTokens.brandActive}` }}>Acciones</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              <AnimatePresence>
                {filteredLayaways.map((layaway, index) => (
                  <TableRow
                    key={layaway.id}
                    component={motion.tr}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    sx={{ 
                      '&:hover': { backgroundColor: colorTokens.hoverOverlay },
                      '&:nth-of-type(even)': { backgroundColor: `${colorTokens.surfaceLevel1}40` }
                    }}
                  >
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="600" sx={{ color: colorTokens.brand }}>
                          {layaway.sale_number}
                        </Typography>
                        <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                          {formatTimestampShort(layaway.created_at)}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: layaway.customer_name !== 'Cliente General' ? colorTokens.success : colorTokens.warning }}>
                          <PersonIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="500" sx={{ color: colorTokens.textPrimary }}>
                            {layaway.customer_name}
                          </Typography>
                          {layaway.customer_email && (
                            <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                              {layaway.customer_email}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight="600" sx={{ color: colorTokens.textPrimary }}>
                        {formatPrice(layaway.total_amount)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight="600" sx={{ color: colorTokens.success }}>
                        {formatPrice(layaway.paid_amount)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight="600" sx={{ color: colorTokens.warning }}>
                        {formatPrice(layaway.pending_amount || 0)}
                      </Typography>
                      {(layaway.pending_amount || 0) === 0 && (
                        <Chip label="Completado" size="small" sx={{ mt: 0.5, fontSize: '0.7rem', backgroundColor: colorTokens.success, color: colorTokens.textPrimary, fontWeight: 600 }} />
                      )}
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
                        <LinearProgress variant="determinate" value={layaway.progress_percentage || 0} sx={{ flexGrow: 1, height: 8, borderRadius: 4, backgroundColor: colorTokens.neutral500, '& .MuiLinearProgress-bar': { backgroundColor: getProgressColor(layaway.progress_percentage || 0) }}} />
                        <Typography variant="caption" fontWeight="600" sx={{ color: colorTokens.textPrimary }}>
                          {Math.round(layaway.progress_percentage || 0)}%
                        </Typography>
                      </Box>
                    </TableCell>

                  <TableCell>
  <Box>
    <Typography variant="body2" fontWeight="500" sx={{ color: colorTokens.textPrimary }}>
      {/* Mostramos la fecha de completado o cancelación si existe */}
      {layaway.status === 'completed' && layaway.completed_at ? formatTimestampShort(layaway.completed_at) :
       layaway.status === 'cancelled' && layaway.cancelled_at ? formatTimestampShort(layaway.cancelled_at) :
       layaway.layaway_expires_at ? formatTimestampShort(layaway.layaway_expires_at) : 'Sin fecha'}
    </Typography>
    
    {/* Lógica condicional para el Chip */}
    {layaway.status === 'completed' ? (
      <Chip 
        label="Completado"
        size="small"
        icon={<CheckCircleIcon />}
        sx={{ mt: 0.5, backgroundColor: `${colorTokens.success}20`, color: colorTokens.success }}
      />
    ) : layaway.status === 'cancelled' ? (
      <Chip 
        label="Cancelado"
        size="small"
        icon={<CancelIcon />}
        sx={{ mt: 0.5, backgroundColor: `${colorTokens.danger}20`, color: colorTokens.danger }}
      />
    ) : layaway.layaway_expires_at ? (
      <Chip 
        label={
          (layaway.days_until_expiration || 0) > 1 ? `${layaway.days_until_expiration} días restantes` : 
          (layaway.days_until_expiration || 0) === 1 ? 'Vence mañana' :
          (layaway.days_until_expiration || 0) === 0 ? 'Vence hoy' :
          `Vencido hace ${Math.abs(layaway.days_until_expiration || 0)} días`
        }
        size="small"
        sx={{
          mt: 0.5,
          backgroundColor: (layaway.days_until_expiration || 0) > 7 ? colorTokens.success : (layaway.days_until_expiration || 0) >= 0 ? colorTokens.warning : colorTokens.danger,
          color: colorTokens.textPrimary
        }}
      />
    ) : null}
  </Box>
</TableCell>

                    <TableCell>
                      <Chip 
                        label={layaway.status} size="small" 
                        sx={{
                          backgroundColor: layaway.status === 'completed' ? colorTokens.success : layaway.status === 'pending' ? (layaway.is_expired ? colorTokens.danger : colorTokens.warning) : colorTokens.neutral700,
                          color: colorTokens.textPrimary, fontWeight: 600, textTransform: 'capitalize'
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Ver Detalles">
                          <IconButton size="small" onClick={() => handleViewDetails(layaway)} sx={{ color: colorTokens.textSecondary, '&:hover': { backgroundColor: `${colorTokens.info}20`, color: colorTokens.info }}}>
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Agregar Abono">
                          <IconButton size="small" onClick={() => handleAddPayment(layaway)} disabled={layaway.status !== 'pending'} sx={{ color: colorTokens.textSecondary, '&:hover': { backgroundColor: `${colorTokens.brand}20`, color: colorTokens.brand }, '&.Mui-disabled': { color: colorTokens.textDisabled }}}>
                            <AddPaymentIcon />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Cancelar Apartado">
                          <IconButton size="small" onClick={() => handleCancelLayaway(layaway)} disabled={layaway.status !== 'pending'} sx={{ color: colorTokens.textSecondary, '&:hover': { backgroundColor: `${colorTokens.danger}20`, color: colorTokens.danger }, '&.Mui-disabled': { color: colorTokens.textDisabled }}}>
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </AnimatePresence>

              {filteredLayaways.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={9} sx={{ textAlign: 'center', py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <BookmarkIcon sx={{ fontSize: 60, color: colorTokens.textMuted, opacity: 0.5 }} />
                      <Typography variant="h6" sx={{ color: colorTokens.textSecondary }}>
                        No se encontraron apartados
                      </Typography>
                      <Typography variant="body2" sx={{ color: colorTokens.textMuted }}>
                        {tabsData[activeTab]?.label} - Intenta cambiar de pestaña o ajustar filtros
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ p: 2, background: `${colorTokens.surfaceLevel1}40`, borderTop: `1px solid ${colorTokens.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
            Mostrando {filteredLayaways.length} de {layawayStats.activeCount + layawayStats.expiringCount + layawayStats.expiredCount + layawayStats.completedCount + layawayStats.cancelledCount} apartados totales
          </Typography>
          
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" sx={{ color: colorTokens.textMuted }}>
              Pendiente total: {formatPrice(layawayStats.totalPending)}
            </Typography>
            <Divider orientation="vertical" flexItem sx={{ borderColor: colorTokens.border }} />
            <Typography variant="body2" sx={{ color: colorTokens.success }}>
              Cobrado: {formatPrice(layawayStats.totalCollected)}
            </Typography>
          </Stack>
        </Box>
      </Card>

      {/* ✅ DIALOGS ENTERPRISE v8.2 SIMPLIFICADOS */}
      <PaymentToLayawayDialog
        open={paymentDialogOpen}
        onClose={handleDialogClose}
        layaway={selectedLayaway}
        warehouseId={selectedLayaway?.source_warehouse_id || ''}
        onSuccess={handleDialogSuccess}
      />

      <LayawayDetailsDialog
        open={detailsDialogOpen}
        onClose={handleDialogClose}
        layaway={selectedLayaway}
      />

      <CancelLayawayDialog
        open={cancelDialogOpen}
        onClose={handleDialogClose}
        layaway={selectedLayaway}
        warehouseId={selectedLayaway?.source_warehouse_id || ''}
        onSuccess={handleDialogSuccess}
      />
    </Box>
  );
});

LayawayManagementPage.displayName = 'LayawayManagementPage';

export default LayawayManagementPage;