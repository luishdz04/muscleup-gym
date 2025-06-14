'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Alert,
  Stack,
  Avatar,
  Tooltip,
  CircularProgress,
  Snackbar
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Search as SearchIcon,
  Payments as PaymentIcon,
  ShoppingCart as ConvertIcon,
  Cancel as CancelIcon,
  Visibility as ViewIcon,
  Add as AddPaymentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Schedule as PendingIcon,
  Error as ErrorIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Bookmark as BookmarkIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
// ✅ IMPORTAR HELPERS DE FECHA CORREGIDOS
import { toMexicoTimestamp, toMexicoDate, formatMexicoDateTime } from '@/utils/dateHelpers';

// 🎨 DARK PRO SYSTEM - TOKENS
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
  roleModerator: '#9C27B0'
};

// ✅ IMPORTS ESTÁTICOS SIMPLES
import PaymentToLayawayDialog from '@/components/dialogs/PaymentToLayawayDialog';
import LayawayDetailsDialog from '@/components/dialogs/LayawayDetailsDialog';
import ConvertToSaleDialog from '@/components/dialogs/ConvertToSaleDialog';
import CancelLayawayDialog from '@/components/dialogs/CancelLayawayDialog';

interface Layaway {
  id: string;
  sale_number: string;
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  commission_amount: number;
  required_deposit: number;
  deposit_percentage: number;
  layaway_expires_at: string;
  expiration_date?: string;
  status: 'pending' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'partial' | 'paid';
  created_at: string;
  last_payment_date?: string;
  notes?: string;
  items?: any[];
  payment_history?: any[];
}

interface LayawayStats {
  activeCount: number;
  expiringCount: number;
  expiredCount: number;
  completedCount: number;
  totalValue: number;
  totalPending: number;
  totalCollected: number;
}

export default function LayawayManagementPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [layaways, setLayaways] = useState<Layaway[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLayaway, setSelectedLayaway] = useState<Layaway | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [stats, setStats] = useState<LayawayStats>({
    activeCount: 0,
    expiringCount: 0,
    expiredCount: 0,
    completedCount: 0,
    totalValue: 0,
    totalPending: 0,
    totalCollected: 0
  });
  const [refreshKey, setRefreshKey] = useState(0);

  // Estados de notificaciones
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const supabase = createBrowserSupabaseClient();

  // ✅ FUNCIONES UTILITARIAS CORREGIDAS CON HELPERS DE FECHA MÉXICO
  const getMexicoDate = useCallback(() => {
    return new Date();
  }, []);

  const getMexicoDateString = useCallback(() => {
    return toMexicoDate(new Date()); // ✅ USAR HELPER CORREGIDO
  }, []);

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  }, []);

  // ✅ FUNCIONES CORREGIDAS PARA MOSTRAR FECHAS EN UI
  const formatMexicoDate = useCallback((dateString: string) => {
    return formatMexicoDateTime(dateString); // ✅ USAR HELPER CORREGIDO
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return formatMexicoDateTime(dateString); // ✅ USAR HELPER CORREGIDO
  }, []);

  const showNotification = useCallback((message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({ open: true, message, severity });
  }, []);

  // ✅ MEMOIZACIÓN ESTABLE PARA TABS
  const tabsData = useMemo(() => [
    { 
      label: 'Activos', 
      value: 'active', 
      color: darkProTokens.success,
      icon: <CheckIcon />,
      count: stats.activeCount
    },
    { 
      label: 'Por Vencer', 
      value: 'expiring', 
      color: darkProTokens.warning,
      icon: <WarningIcon />,
      count: stats.expiringCount
    },
    { 
      label: 'Vencidos', 
      value: 'expired', 
      color: darkProTokens.error,
      icon: <ErrorIcon />,
      count: stats.expiredCount
    },
    { 
      label: 'Completados', 
      value: 'completed', 
      color: darkProTokens.info,
      icon: <CheckIcon />,
      count: stats.completedCount
    }
  ], [stats]);

  // ✅ FUNCIÓN PARA CARGAR ESTADÍSTICAS CORREGIDA CON FECHA MÉXICO
  const loadStats = useCallback(async () => {
    if (!mounted) return;

    try {
      const { data: allLayaways, error } = await supabase
        .from('sales')
        .select('*')
        .eq('sale_type', 'layaway');

      if (error) {
        console.error('Error cargando estadísticas:', error);
        return;
      }

      if (allLayaways) {
        // ✅ USAR FECHA MÉXICO PARA CÁLCULOS
        const mexicoToday = getMexicoDate();
        const weekFromNow = new Date(mexicoToday.getTime() + 7 * 24 * 60 * 60 * 1000);

        const active = allLayaways.filter(l => 
          l.status === 'pending' && 
          l.layaway_expires_at && 
          new Date(l.layaway_expires_at) >= mexicoToday
        );
        
        const expiring = allLayaways.filter(l => 
          l.status === 'pending' && 
          l.layaway_expires_at &&
          new Date(l.layaway_expires_at) >= mexicoToday &&
          new Date(l.layaway_expires_at) <= weekFromNow
        );
        
        const expired = allLayaways.filter(l => 
          l.status === 'pending' && 
          l.layaway_expires_at &&
          new Date(l.layaway_expires_at) < mexicoToday
        );
        
        const completed = allLayaways.filter(l => l.status === 'completed');

        setStats({
          activeCount: active.length,
          expiringCount: expiring.length,
          expiredCount: expired.length,
          completedCount: completed.length,
          totalValue: allLayaways.reduce((sum, l) => sum + (l.total_amount || 0), 0),
          totalPending: allLayaways.reduce((sum, l) => sum + (l.pending_amount || 0), 0),
          totalCollected: allLayaways.reduce((sum, l) => sum + (l.paid_amount || 0), 0)
        });
      }

    } catch (error) {
      console.error('Error en estadísticas:', error);
    }
  }, [mounted, supabase, getMexicoDate]);

  // ✅ FUNCIÓN PARA CARGAR APARTADOS CORREGIDA CON FECHA MÉXICO
  const loadLayaways = useCallback(async () => {
    if (!mounted) return;

    setLoading(true);
    try {
      let query = supabase
        .from('sales')
        .select('*')
        .eq('sale_type', 'layaway')
        .order('created_at', { ascending: false });

      const currentFilter = tabsData[activeTab]?.value;
      // ✅ USAR FECHA MÉXICO PARA FILTROS
      const mexicoToday = getMexicoDate();
      const weekFromNow = new Date(mexicoToday.getTime() + 7 * 24 * 60 * 60 * 1000);

      switch (currentFilter) {
        case 'active':
          query = query
            .eq('status', 'pending')
            .gte('layaway_expires_at', toMexicoTimestamp(mexicoToday)); // ✅ CORREGIDO
          break;
        case 'expiring':
          query = query
            .eq('status', 'pending')
            .gte('layaway_expires_at', toMexicoTimestamp(mexicoToday)) // ✅ CORREGIDO
            .lte('layaway_expires_at', toMexicoTimestamp(weekFromNow)); // ✅ CORREGIDO
          break;
        case 'expired':
          query = query
            .eq('status', 'pending')
            .lt('layaway_expires_at', toMexicoTimestamp(mexicoToday)); // ✅ CORREGIDO
          break;
        case 'completed':
          query = query.eq('status', 'completed');
          break;
      }

      if (searchTerm.trim()) {
        query = query.or(`sale_number.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`);
      }

      const { data: salesData, error } = await query;

      if (error) {
        console.error('Error en query principal:', error);
        throw error;
      }

      if (!salesData || salesData.length === 0) {
        setLayaways([]);
        return;
      }

      const layawaysWithDetails = await Promise.all(
        salesData.map(async (layaway) => {
          try {
            const { data: items } = await supabase
              .from('sale_items')
              .select('*')
              .eq('sale_id', layaway.id);

            const { data: payments } = await supabase
              .from('sale_payment_details')
              .select('*')
              .eq('sale_id', layaway.id)
              .order('payment_date', { ascending: false });

            let customer = null;
            if (layaway.customer_id) {
              const { data: customerData } = await supabase
                .from('Users')
                .select('id, firstName, lastName, name, email, whatsapp')
                .eq('id', layaway.customer_id)
                .single();
              customer = customerData;
            }

            let customerName = 'Cliente General';
            if (customer) {
              if (customer.name) {
                customerName = customer.name;
              } else if (customer.firstName) {
                customerName = `${customer.firstName} ${customer.lastName || ''}`.trim();
              }
            }

            return {
              ...layaway,
              customer_name: customerName,
              customer_email: customer?.email || '',
              customer_phone: customer?.whatsapp || '',
              items: items || [],
              payment_history: payments || [],
              expiration_date: layaway.layaway_expires_at,
              total_amount: layaway.total_amount || 0,
              paid_amount: layaway.paid_amount || 0,
              pending_amount: layaway.pending_amount || 0,
              commission_amount: layaway.commission_amount || 0,
              required_deposit: layaway.required_deposit || 0,
              deposit_percentage: layaway.deposit_percentage || 0
            };
          } catch (itemError) {
            console.error('Error cargando detalles para apartado:', layaway.id, itemError);
            return {
              ...layaway,
              customer_name: 'Cliente General',
              customer_email: '',
              customer_phone: '',
              items: [],
              payment_history: [],
              expiration_date: layaway.layaway_expires_at,
              total_amount: layaway.total_amount || 0,
              paid_amount: layaway.paid_amount || 0,
              pending_amount: layaway.pending_amount || 0,
              commission_amount: layaway.commission_amount || 0,
              required_deposit: layaway.required_deposit || 0,
              deposit_percentage: layaway.deposit_percentage || 0
            };
          }
        })
      );

      setLayaways(layawaysWithDetails);

    } catch (error) {
      console.error('Error cargando apartados:', error);
      if (mounted) {
        showNotification('Error al cargar apartados', 'error');
      }
      setLayaways([]);
    } finally {
      if (mounted) {
        setLoading(false);
      }
    }
  }, [mounted, supabase, tabsData, activeTab, searchTerm, getMexicoDate, showNotification]);

  // ✅ useEffect HÍBRIDO CON GUARD CLAUSES
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    loadStats();
  }, [mounted, refreshKey, loadStats]);

  useEffect(() => {
    if (!mounted) return;
    loadLayaways();
  }, [mounted, refreshKey, loadLayaways]);

  // ✅ HANDLERS CON useCallback CONTROLADO
  const handleRefresh = useCallback(() => {
    if (!mounted) return;
    setRefreshKey(prev => prev + 1);
    showNotification('Actualizando datos...', 'info');
  }, [mounted, showNotification]);

  const getProgressColor = useCallback((percentage: number) => {
    if (percentage >= 80) return darkProTokens.success;
    if (percentage >= 50) return darkProTokens.warning;
    return darkProTokens.error;
  }, []);

  // ✅ CÁLCULO DE DÍAS HASTA VENCIMIENTO CORREGIDO CON FECHA MÉXICO
  const getDaysUntilExpiration = useCallback((layawayExpiresAt: string) => {
    if (!layawayExpiresAt) return 0;
    // ✅ USAR FECHA MÉXICO PARA CÁLCULOS
    const mexicoToday = getMexicoDate();
    const expiration = new Date(layawayExpiresAt);
    const diffTime = expiration.getTime() - mexicoToday.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [getMexicoDate]);

  // ✅ HANDLERS DE DIALOGS CON useCallback HÍBRIDO
  const handleViewDetails = useCallback((layaway: Layaway) => {
    if (!mounted || !layaway?.id) {
      console.error('No se puede abrir detalles: layaway inválido o componente desmontado');
      return;
    }
    
    const validLayaway = {
      ...layaway,
      id: layaway.id || '',
      sale_number: layaway.sale_number || 'Sin número',
      total_amount: layaway.total_amount || 0,
      paid_amount: layaway.paid_amount || 0,
      pending_amount: layaway.pending_amount || 0,
      status: layaway.status || 'pending',
      customer_name: layaway.customer_name || 'Cliente General',
      items: layaway.items || [],
      payment_history: layaway.payment_history || [],
      layaway_expires_at: layaway.layaway_expires_at || layaway.expiration_date || '',
      expiration_date: layaway.expiration_date || layaway.layaway_expires_at || ''
    };
    
    setSelectedLayaway(validLayaway);
    setDetailsDialogOpen(true);
  }, [mounted]);

  const handleAddPayment = useCallback((layaway: Layaway) => {
    if (!mounted || !layaway?.id) {
      console.error('No se puede agregar abono: layaway inválido o componente desmontado');
      return;
    }
    
    const validLayaway = {
      ...layaway,
      id: layaway.id || '',
      sale_number: layaway.sale_number || 'Sin número',
      total_amount: layaway.total_amount || 0,
      paid_amount: layaway.paid_amount || 0,
      pending_amount: layaway.pending_amount || 0,
      status: layaway.status || 'pending',
      customer_name: layaway.customer_name || 'Cliente General',
      customer_email: layaway.customer_email || '',
      items: layaway.items || [],
      payment_history: layaway.payment_history || []
    };
    
    setSelectedLayaway(validLayaway);
    setPaymentDialogOpen(true);
  }, [mounted]);

  const handleConvertToSale = useCallback((layaway: Layaway) => {
    if (!mounted || !layaway?.id) {
      console.error('No se puede convertir: layaway inválido o componente desmontado');
      return;
    }
    
    const validLayaway = {
      ...layaway,
      id: layaway.id || '',
      sale_number: layaway.sale_number || 'Sin número',
      total_amount: layaway.total_amount || 0,
      paid_amount: layaway.paid_amount || 0,
      pending_amount: layaway.pending_amount || 0,
      status: layaway.status || 'pending',
      customer_name: layaway.customer_name || 'Cliente General',
      items: layaway.items || [],
      payment_history: layaway.payment_history || []
    };
    
    setSelectedLayaway(validLayaway);
    setConvertDialogOpen(true);
  }, [mounted]);

  const handleCancelLayaway = useCallback((layaway: Layaway) => {
    if (!mounted || !layaway?.id) {
      console.error('No se puede cancelar: layaway inválido o componente desmontado');
      return;
    }
    
    const validLayaway = {
      ...layaway,
      id: layaway.id || '',
      sale_number: layaway.sale_number || 'Sin número',
      total_amount: layaway.total_amount || 0,
      paid_amount: layaway.paid_amount || 0,
      pending_amount: layaway.pending_amount || 0,
      status: layaway.status || 'pending',
      customer_name: layaway.customer_name || 'Cliente General',
      items: layaway.items || [],
      payment_history: layaway.payment_history || []
    };
    
    setSelectedLayaway(validLayaway);
    setCancelDialogOpen(true);
  }, [mounted]);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (!mounted) return;
    setSearchTerm(event.target.value);
  }, [mounted]);

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    if (!mounted) return;
    setActiveTab(newValue);
    setSearchTerm('');
  }, [mounted]);

  const handleSuccess = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    setPaymentDialogOpen(false);
    setConvertDialogOpen(false);
    setCancelDialogOpen(false);
    setSelectedLayaway(null);
  }, []);

  if (!mounted) {
    return (
      <Box sx={{ 
        p: 3,
        background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
        minHeight: '100vh'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress size={60} sx={{ color: darkProTokens.primary }} />
          <Typography variant="h6" sx={{ ml: 2, color: darkProTokens.textPrimary }}>
            Cargando gestión de apartados...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 3,
      background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
      minHeight: '100vh'
    }}>
      {/* SNACKBAR */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          severity={notification.severity}
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          sx={{
            background: notification.severity === 'success' ? 
              `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})` :
              notification.severity === 'error' ?
              `linear-gradient(135deg, ${darkProTokens.error}, ${darkProTokens.errorHover})` :
              notification.severity === 'warning' ?
              `linear-gradient(135deg, ${darkProTokens.warning}, ${darkProTokens.warningHover})` :
              `linear-gradient(135deg, ${darkProTokens.info}, ${darkProTokens.infoHover})`,
            color: darkProTokens.textPrimary,
            border: `1px solid ${
              notification.severity === 'success' ? darkProTokens.success :
              notification.severity === 'error' ? darkProTokens.error :
              notification.severity === 'warning' ? darkProTokens.warning :
              darkProTokens.info
            }60`,
            borderRadius: 3,
            fontWeight: 600,
            '& .MuiAlert-icon': { color: darkProTokens.textPrimary },
            '& .MuiAlert-action': { color: darkProTokens.textPrimary }
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
        p: 3,
        borderRadius: 4,
        border: `1px solid ${darkProTokens.grayDark}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ 
            bgcolor: darkProTokens.roleModerator, 
            width: 56, 
            height: 56,
            color: darkProTokens.textPrimary
          }}>
            <BookmarkIcon sx={{ fontSize: 30 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 800, 
              color: darkProTokens.textPrimary 
            }}>
              📦 Gestión de Apartados
            </Typography>
            <Typography variant="body1" sx={{ 
              color: darkProTokens.textSecondary,
              mt: 1
            }}>
             Administra y da seguimiento a todos los apartados activos
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} sx={{ color: darkProTokens.textPrimary }} /> : <RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
          sx={{
            background: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})`,
            color: darkProTokens.textPrimary,
            fontWeight: 700,
            px: 3,
            py: 1.5,
            borderRadius: 3,
            '&:hover': {
              background: `linear-gradient(135deg, ${darkProTokens.successHover}, ${darkProTokens.success})`,
              transform: 'translateY(-2px)',
              boxShadow: `0 8px 20px ${darkProTokens.success}40`
            }
          }}
        >
          {loading ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </Box>

      {/* ✅ ESTADÍSTICAS CON DARK PRO SYSTEM */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} sm={6} md={2.4}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})`,
              color: darkProTokens.textPrimary,
              border: `1px solid ${darkProTokens.success}30`,
              borderRadius: 3,
              overflow: 'hidden',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: darkProTokens.primary
              }
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <CheckIcon sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
                <Typography variant="h3" fontWeight="bold">
                  {stats.activeCount}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Apartados Activos
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid xs={12} sm={6} md={2.4}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.warning}, ${darkProTokens.warningHover})`,
              color: darkProTokens.textPrimary,
              border: `1px solid ${darkProTokens.warning}30`,
              borderRadius: 3,
              overflow: 'hidden',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: darkProTokens.primary
              }
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <WarningIcon sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
                <Typography variant="h3" fontWeight="bold">
                  {stats.expiringCount}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Por Vencer (7 días)
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid xs={12} sm={6} md={2.4}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.info}, ${darkProTokens.infoHover})`,
              color: darkProTokens.textPrimary,
              border: `1px solid ${darkProTokens.info}30`,
              borderRadius: 3,
              overflow: 'hidden',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: darkProTokens.primary
              }
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <MoneyIcon sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
                <Typography variant="h4" fontWeight="bold">
                  {formatPrice(stats.totalValue)}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Valor Total
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid xs={12} sm={6} md={2.4}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.roleModerator}, ${darkProTokens.roleModerator}CC)`,
              color: darkProTokens.textPrimary,
              border: `1px solid ${darkProTokens.roleModerator}30`,
              borderRadius: 3,
              overflow: 'hidden',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: darkProTokens.primary
              }
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <PaymentIcon sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
                <Typography variant="h4" fontWeight="bold">
                  {formatPrice(stats.totalCollected)}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Total Cobrado
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid xs={12} sm={6} md={2.4}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.error}, ${darkProTokens.errorHover})`,
              color: darkProTokens.textPrimary,
              border: `1px solid ${darkProTokens.error}30`,
              borderRadius: 3,
              overflow: 'hidden',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: darkProTokens.primary
              }
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <PendingIcon sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
                <Typography variant="h4" fontWeight="bold">
                  {formatPrice(stats.totalPending)}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Total Pendiente
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      
      {/* ✅ FILTROS CON DARK PRO SYSTEM */}
      <Card sx={{ 
        mb: 4,
        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
        border: `1px solid ${darkProTokens.grayDark}`,
        borderRadius: 4
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <FilterIcon sx={{ color: darkProTokens.primary }} />
            <Typography variant="h6" sx={{ 
              color: darkProTokens.textPrimary,
              fontWeight: 700
            }}>
              Filtros de Búsqueda
            </Typography>
          </Box>
          
          <Grid container spacing={3} alignItems="center">
            <Grid xs={12} md={6}>
              <TextField
                fullWidth
                label="Buscar apartado"
                placeholder="Número de apartado, notas..."
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: darkProTokens.primary }} />
                    </InputAdornment>
                  ),
                  sx: {
                    color: darkProTokens.textPrimary,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: darkProTokens.grayDark
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

            <Grid xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ 
                  color: darkProTokens.textSecondary,
                  '&.Mui-focused': { color: darkProTokens.primary }
                }}>
                  Estado
                </InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{
                    color: darkProTokens.textPrimary,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: darkProTokens.grayDark
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: darkProTokens.primary
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: darkProTokens.primary
                    }
                  }}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="active">Activos</MenuItem>
                  <MenuItem value="expiring">Por Vencer</MenuItem>
                  <MenuItem value="expired">Vencidos</MenuItem>
                  <MenuItem value="completed">Completados</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                sx={{ 
                  height: '56px',
                  color: darkProTokens.textSecondary,
                  borderColor: darkProTokens.grayDark,
                  '&:hover': {
                    borderColor: darkProTokens.primary,
                    color: darkProTokens.primary
                  }
                }}
              >
                Limpiar Filtros
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs de estados */}
      <Card sx={{ 
        mb: 4,
        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
        border: `1px solid ${darkProTokens.grayDark}`,
        borderRadius: 4
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
              color: darkProTokens.textSecondary,
              '&.Mui-selected': {
                color: darkProTokens.primary
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: darkProTokens.primary,
              height: 3
            }
          }}
        >
          {tabsData.map((tab, index) => (
            <Tab 
              key={tab.value}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Badge badgeContent={tab.count} color="error">
                    {tab.icon}
                  </Badge>
                  <Typography variant="body1" fontWeight="inherit">
                    {tab.label}
                  </Typography>
                </Box>
              }
              sx={{
                color: activeTab === index ? tab.color : darkProTokens.textSecondary,
                '&.Mui-selected': {
                  color: tab.color
                }
              }}
            />
          ))}
        </Tabs>
      </Card>

      {/* Tabla de apartados */}
      <Card sx={{
        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
        border: `1px solid ${darkProTokens.grayDark}`,
        borderRadius: 4,
        overflow: 'hidden'
      }}>
        {loading && (
          <Box sx={{ p: 2 }}>
            <LinearProgress sx={{
              '& .MuiLinearProgress-bar': {
                backgroundColor: darkProTokens.primary
              }
            }} />
            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center', color: darkProTokens.textSecondary }}>
              Cargando apartados para {tabsData[activeTab]?.label}...
            </Typography>
          </Box>
        )}
        
            <TableContainer component={Paper} sx={{
          background: darkProTokens.surfaceLevel1,
          border: `1px solid ${darkProTokens.grayDark}`
        }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {/* ✅ HEADER CORREGIDO CON FONDO VISIBLE */}
                <TableCell sx={{ 
                  background: `linear-gradient(135deg, ${darkProTokens.roleModerator}, ${darkProTokens.roleModerator}CC)`,
                  color: darkProTokens.textPrimary, 
                  fontWeight: 'bold', 
                  minWidth: 140,
                  borderBottom: `2px solid ${darkProTokens.primary}`,
                  position: 'sticky',
                  top: 0,
                  zIndex: 10
                }}>
                  Número
                </TableCell>
                <TableCell sx={{ 
                  background: `linear-gradient(135deg, ${darkProTokens.roleModerator}, ${darkProTokens.roleModerator}CC)`,
                  color: darkProTokens.textPrimary, 
                  fontWeight: 'bold', 
                  minWidth: 200,
                  borderBottom: `2px solid ${darkProTokens.primary}`,
                  position: 'sticky',
                  top: 0,
                  zIndex: 10
                }}>
                  Cliente
                </TableCell>
                <TableCell sx={{ 
                  background: `linear-gradient(135deg, ${darkProTokens.roleModerator}, ${darkProTokens.roleModerator}CC)`,
                  color: darkProTokens.textPrimary, 
                  fontWeight: 'bold', 
                  minWidth: 120,
                  borderBottom: `2px solid ${darkProTokens.primary}`,
                  position: 'sticky',
                  top: 0,
                  zIndex: 10
                }}>
                  Total
                </TableCell>
                <TableCell sx={{ 
                  background: `linear-gradient(135deg, ${darkProTokens.roleModerator}, ${darkProTokens.roleModerator}CC)`,
                  color: darkProTokens.textPrimary, 
                  fontWeight: 'bold', 
                  minWidth: 120,
                  borderBottom: `2px solid ${darkProTokens.primary}`,
                  position: 'sticky',
                  top: 0,
                  zIndex: 10
                }}>
                  Pagado
                </TableCell>
                <TableCell sx={{ 
                  background: `linear-gradient(135deg, ${darkProTokens.roleModerator}, ${darkProTokens.roleModerator}CC)`,
                  color: darkProTokens.textPrimary, 
                  fontWeight: 'bold', 
                  minWidth: 120,
                  borderBottom: `2px solid ${darkProTokens.primary}`,
                  position: 'sticky',
                  top: 0,
                  zIndex: 10
                }}>
                  Pendiente
                </TableCell>
                <TableCell sx={{ 
                  background: `linear-gradient(135deg, ${darkProTokens.roleModerator}, ${darkProTokens.roleModerator}CC)`,
                  color: darkProTokens.textPrimary, 
                  fontWeight: 'bold', 
                  minWidth: 150,
                  borderBottom: `2px solid ${darkProTokens.primary}`,
                  position: 'sticky',
                  top: 0,
                  zIndex: 10
                }}>
                  Progreso
                </TableCell>
                <TableCell sx={{ 
                  background: `linear-gradient(135deg, ${darkProTokens.roleModerator}, ${darkProTokens.roleModerator}CC)`,
                  color: darkProTokens.textPrimary, 
                  fontWeight: 'bold', 
                  minWidth: 140,
                  borderBottom: `2px solid ${darkProTokens.primary}`,
                  position: 'sticky',
                  top: 0,
                  zIndex: 10
                }}>
                  Vence 
                </TableCell>
                <TableCell sx={{ 
                  background: `linear-gradient(135deg, ${darkProTokens.roleModerator}, ${darkProTokens.roleModerator}CC)`,
                  color: darkProTokens.textPrimary, 
                  fontWeight: 'bold', 
                  minWidth: 100,
                  borderBottom: `2px solid ${darkProTokens.primary}`,
                  position: 'sticky',
                  top: 0,
                  zIndex: 10
                }}>
                  Estado
                </TableCell>
                <TableCell sx={{ 
                  background: `linear-gradient(135deg, ${darkProTokens.roleModerator}, ${darkProTokens.roleModerator}CC)`,
                  color: darkProTokens.textPrimary, 
                  fontWeight: 'bold', 
                  minWidth: 200,
                  borderBottom: `2px solid ${darkProTokens.primary}`,
                  position: 'sticky',
                  top: 0,
                  zIndex: 10
                }}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <AnimatePresence>
                {layaways.map((layaway, index) => {
                  const totalAmount = layaway.total_amount || 0;
                  const paidAmount = layaway.paid_amount || 0;
                  const pendingAmount = layaway.pending_amount || 0;
                  
                  const progressPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
                  const daysLeft = getDaysUntilExpiration(layaway.layaway_expires_at);
                  const isRealCustomer = layaway.customer_name !== 'Cliente General';
                  
                  return (
                    <TableRow
                      key={layaway.id}
                      component={motion.tr}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: `${darkProTokens.primary}10`,
                        },
                        '&:nth-of-type(even)': {
                          backgroundColor: `${darkProTokens.surfaceLevel1}40`
                        },
                        '&:last-child td, &:last-child th': { border: 0 }
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="600" sx={{ color: darkProTokens.primary }}>
                          {layaway.sale_number}
                        </Typography>
                        <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                          {formatDate(layaway.created_at)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ 
                            width: 32, 
                            height: 32, 
                            bgcolor: isRealCustomer ? darkProTokens.success : darkProTokens.warning
                          }}>
                            <PersonIcon fontSize="small" />
                          </Avatar>
                          <Box>
                            <Typography 
                              variant="body2" 
                              fontWeight="500"
                              sx={{ 
                                color: isRealCustomer ? darkProTokens.textPrimary : darkProTokens.warning,
                                fontStyle: isRealCustomer ? 'normal' : 'italic'
                              }}
                            >
                              {layaway.customer_name || 'Cliente General'}
                            </Typography>
                            {layaway.customer_email && (
                              <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                                {layaway.customer_email}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" fontWeight="600" sx={{ color: darkProTokens.textPrimary }}>
                          {formatPrice(totalAmount)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" fontWeight="600" sx={{ color: darkProTokens.success }}>
                          {formatPrice(paidAmount)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" fontWeight="600" sx={{ color: darkProTokens.warning }}>
                          {formatPrice(pendingAmount)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={progressPercentage} 
                            sx={{ 
                              flexGrow: 1, 
                              height: 8, 
                              borderRadius: 4,
                              backgroundColor: `${darkProTokens.grayDark}`,
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: getProgressColor(progressPercentage)
                              }
                            }}
                          />
                          <Typography variant="caption" fontWeight="600" sx={{ color: darkProTokens.textPrimary }}>
                            {Math.round(progressPercentage)}%
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="500" sx={{ color: darkProTokens.textPrimary }}>
                            {layaway.layaway_expires_at ? formatDate(layaway.layaway_expires_at) : 'Sin fecha'}
                          </Typography>
                          {layaway.layaway_expires_at && (
                            <Chip 
                              label={
                                daysLeft > 0 ? `${daysLeft} días` : 
                                daysLeft === 0 ? 'Hoy' : 
                                `Vencido ${Math.abs(daysLeft)} días`
                              }
                              size="small"
                              sx={{
                                mt: 0.5,
                                fontSize: '0.7rem',
                                backgroundColor: 
                                  daysLeft > 7 ? darkProTokens.success :
                                  daysLeft > 0 ? darkProTokens.warning :
                                  darkProTokens.error,
                                color: darkProTokens.textPrimary,
                                fontWeight: 600
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Chip 
                          label={layaway.status}
                          size="small" 
                          sx={{
                            backgroundColor: 
                              layaway.status === 'completed' ? darkProTokens.success :
                              layaway.status === 'pending' ? darkProTokens.warning :
                              darkProTokens.error,
                            color: darkProTokens.textPrimary,
                            fontWeight: 600,
                            textTransform: 'capitalize'
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Ver Detalles">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(layaway)}
                              sx={{
                                color: darkProTokens.textSecondary,
                                '&:hover': {
                                  backgroundColor: `${darkProTokens.info}20`,
                                  color: darkProTokens.info
                                }
                              }}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Agregar Abono">
                            <IconButton
                              size="small"
                              onClick={() => handleAddPayment(layaway)}
                              disabled={layaway.status !== 'pending'}
                              sx={{
                                color: darkProTokens.textSecondary,
                                '&:hover': {
                                  backgroundColor: `${darkProTokens.primary}20`,
                                  color: darkProTokens.primary
                                },
                                '&.Mui-disabled': {
                                  color: darkProTokens.textDisabled
                                }
                              }}
                            >
                              <AddPaymentIcon />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Convertir a Venta">
                            <IconButton
                              size="small"
                              onClick={() => handleConvertToSale(layaway)}
                              disabled={pendingAmount > 0 || layaway.status !== 'pending'}
                              sx={{
                                color: darkProTokens.textSecondary,
                                '&:hover': {
                                  backgroundColor: `${darkProTokens.success}20`,
                                  color: darkProTokens.success
                                },
                                '&.Mui-disabled': {
                                  color: darkProTokens.textDisabled
                                }
                              }}
                            >
                              <ConvertIcon />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Cancelar Apartado">
                            <IconButton
                              size="small"
                              onClick={() => handleCancelLayaway(layaway)}
                              disabled={layaway.status !== 'pending'}
                              sx={{
                                color: darkProTokens.textSecondary,
                                '&:hover': {
                                  backgroundColor: `${darkProTokens.error}20`,
                                  color: darkProTokens.error
                                },
                                '&.Mui-disabled': {
                                  color: darkProTokens.textDisabled
                                }
                              }}
                            >
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </AnimatePresence>

              {layaways.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={9} sx={{ textAlign: 'center', py: 6 }}>
                    <Box sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <HistoryIcon sx={{ 
                        fontSize: 60, 
                        color: darkProTokens.grayMuted,
                        opacity: 0.5
                      }} />
                      <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }}>
                        📦 No se encontraron apartados
                      </Typography>
                      <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                        {tabsData[activeTab]?.label} - Prueba a cambiar de pestaña o actualizar
                      </Typography>
                     
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* ✅ DIALOGS CON DATOS VALIDADOS */}
      {mounted && (
        <>
          <PaymentToLayawayDialog
            open={paymentDialogOpen}
            onClose={() => setPaymentDialogOpen(false)}
            layaway={selectedLayaway}
            onSuccess={handleSuccess}
          />

          <LayawayDetailsDialog
            open={detailsDialogOpen}
            onClose={() => setDetailsDialogOpen(false)}
            layaway={selectedLayaway}
          />

          <ConvertToSaleDialog
            open={convertDialogOpen}
            onClose={() => setConvertDialogOpen(false)}
            layaway={selectedLayaway}
            onSuccess={handleSuccess}
                      />

          <CancelLayawayDialog
            open={cancelDialogOpen}
            onClose={() => setCancelDialogOpen(false)}
            layaway={selectedLayaway}
            onSuccess={handleSuccess}
          />
        </>
      )}

      {/* 🎨 ESTILOS CSS DARK PRO PERSONALIZADOS */}
      <style jsx>{`
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${darkProTokens.surfaceLevel1};
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover});
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive});
        }
      `}</style>
    </Box>
  );
}
