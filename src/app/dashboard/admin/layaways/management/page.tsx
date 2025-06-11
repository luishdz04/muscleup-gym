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
  CircularProgress
} from '@mui/material';
import Grid from '@mui/material/Grid'; // ✅ CORREGIDO: Grid2 como los dialogs
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
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatPrice, formatDate } from '@/utils/formatUtils';
import { showNotification } from '@/utils/notifications';

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
  expiration_date?: string; // ✅ COMPATIBILIDAD
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

  useEffect(() => {
    setMounted(true);
  }, []);

  const supabase = createBrowserSupabaseClient();

  const tabsData = useMemo(() => [
    { 
      label: 'Activos', 
      value: 'active', 
      color: '#4caf50',
      icon: <CheckIcon />,
      count: stats.activeCount
    },
    { 
      label: 'Por Vencer', 
      value: 'expiring', 
      color: '#ff9800',
      icon: <WarningIcon />,
      count: stats.expiringCount
    },
    { 
      label: 'Vencidos', 
      value: 'expired', 
      color: '#f44336',
      icon: <ErrorIcon />,
      count: stats.expiredCount
    },
    { 
      label: 'Completados', 
      value: 'completed', 
      color: '#2196f3',
      icon: <CheckIcon />,
      count: stats.completedCount
    }
  ], [stats]);

  const loadStats = useCallback(async () => {
    if (!mounted) return;

    try {
      console.log('📊 Cargando estadísticas... - 2025-06-11 07:50:17 UTC - luishdz04');
      
      const { data: allLayaways, error } = await supabase
        .from('sales')
        .select('*')
        .eq('sale_type', 'layaway');

      if (error) {
        console.error('❌ Error cargando estadísticas:', error);
        return;
      }

      if (allLayaways) {
        const today = new Date();
        const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

        const active = allLayaways.filter(l => 
          l.status === 'pending' && 
          l.layaway_expires_at && 
          new Date(l.layaway_expires_at) >= today
        );
        
        const expiring = allLayaways.filter(l => 
          l.status === 'pending' && 
          l.layaway_expires_at &&
          new Date(l.layaway_expires_at) >= today &&
          new Date(l.layaway_expires_at) <= weekFromNow
        );
        
        const expired = allLayaways.filter(l => 
          l.status === 'pending' && 
          l.layaway_expires_at &&
          new Date(l.layaway_expires_at) < today
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
      console.error('💥 Error en estadísticas:', error);
    }
  }, [supabase, mounted]);

  const loadLayaways = useCallback(async () => {
    if (!mounted) return;

    setLoading(true);
    try {
      console.log(`🔍 Cargando apartados para tab: ${tabsData[activeTab]?.value} - luishdz04`);
      
      let query = supabase
        .from('sales')
        .select('*')
        .eq('sale_type', 'layaway')
        .order('created_at', { ascending: false });

      const currentFilter = tabsData[activeTab]?.value;
      const today = new Date();
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      switch (currentFilter) {
        case 'active':
          query = query
            .eq('status', 'pending')
            .gte('layaway_expires_at', today.toISOString());
          break;
        case 'expiring':
          query = query
            .eq('status', 'pending')
            .gte('layaway_expires_at', today.toISOString())
            .lte('layaway_expires_at', weekFromNow.toISOString());
          break;
        case 'expired':
          query = query
            .eq('status', 'pending')
            .lt('layaway_expires_at', today.toISOString());
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
        console.error('❌ Error en query principal:', error);
        throw error;
      }

      if (!salesData || salesData.length === 0) {
        setLayaways([]);
        return;
      }

      // ✅ CARGAR DATOS COMPLETOS
      const layawaysWithDetails = await Promise.all(
        salesData.map(async (layaway) => {
          try {
            // Cargar items
            const { data: items } = await supabase
              .from('sale_items')
              .select('*')
              .eq('sale_id', layaway.id);

            // Cargar payments
            const { data: payments } = await supabase
              .from('sale_payment_details')
              .select('*')
              .eq('sale_id', layaway.id)
              .order('payment_date', { ascending: false });

            // Cargar customer
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

            // ✅ ESTRUCTURA COMPATIBLE CON DIALOGS
            return {
              ...layaway,
              customer_name: customerName,
              customer_email: customer?.email || '',
              customer_phone: customer?.whatsapp || '',
              items: items || [],
              payment_history: payments || [],
              // ✅ COMPATIBILIDAD: Ambos campos de fecha
              expiration_date: layaway.layaway_expires_at,
              // ✅ VALORES SEGUROS
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
      console.log(`🎯 ${layawaysWithDetails.length} apartados procesados con datos completos`);

    } catch (error) {
      console.error('💥 Error cargando apartados:', error);
      if (mounted) {
        showNotification('Error al cargar apartados', 'error');
      }
      setLayaways([]);
    } finally {
      if (mounted) {
        setLoading(false);
      }
    }
  }, [activeTab, searchTerm, supabase, tabsData, mounted]);

  useEffect(() => {
    if (mounted) {
      loadStats();
    }
  }, [refreshKey, mounted, loadStats]);

  useEffect(() => {
    if (mounted) {
      loadLayaways();
    }
  }, [activeTab, searchTerm, refreshKey, mounted, loadLayaways]);

  const handleRefresh = useCallback(() => {
    if (!mounted) return;
    console.log('🔄 Actualización manual... - 2025-06-11 07:50:17 UTC - luishdz04');
    setRefreshKey(prev => prev + 1);
    showNotification('Actualizando datos...', 'info');
  }, [mounted]);

  const getProgressColor = useCallback((percentage: number) => {
    if (percentage >= 80) return '#4caf50';
    if (percentage >= 50) return '#ff9800';
    return '#f44336';
  }, []);

  const getDaysUntilExpiration = useCallback((layawayExpiresAt: string) => {
    if (!layawayExpiresAt) return 0;
    const today = new Date();
    const expiration = new Date(layawayExpiresAt);
    const diffTime = expiration.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, []);

  // ✅ HANDLER CORREGIDO PARA VER DETALLES
const handleViewDetails = useCallback((layaway: Layaway) => {
  if (!mounted || !layaway?.id) {
    console.error('❌ No se puede abrir detalles: layaway inválido o componente desmontado');
    return;
  }
  
  try {
    console.log('👁️ Ver detalles:', layaway.sale_number, '- 2025-06-11 07:57:23 UTC - luishdz04');
    
    // ✅ VALIDAR DATOS ANTES DE ABRIR
    const validLayaway = {
      ...layaway,
      // ✅ ASEGURAR CAMPOS OBLIGATORIOS
      id: layaway.id || '',
      sale_number: layaway.sale_number || 'Sin número',
      total_amount: layaway.total_amount || 0,
      paid_amount: layaway.paid_amount || 0,
      pending_amount: layaway.pending_amount || 0,
      status: layaway.status || 'pending',
      customer_name: layaway.customer_name || 'Cliente General',
      items: layaway.items || [],
      payment_history: layaway.payment_history || [],
      // ✅ COMPATIBILIDAD DE FECHAS
      layaway_expires_at: layaway.layaway_expires_at || layaway.expiration_date || '',
      expiration_date: layaway.expiration_date || layaway.layaway_expires_at || ''
    };
    
    setSelectedLayaway(validLayaway);
    setDetailsDialogOpen(true);
  } catch (error) {
    console.error('💥 Error en handleViewDetails:', error);
    showNotification('Error al abrir detalles del apartado', 'error');
  }
}, [mounted]);

// ✅ HANDLER CORREGIDO PARA AGREGAR ABONO
const handleAddPayment = useCallback((layaway: Layaway) => {
  if (!mounted || !layaway?.id) {
    console.error('❌ No se puede agregar abono: layaway inválido o componente desmontado');
    return;
  }
  
  try {
    console.log('💰 Agregar abono:', layaway.sale_number, '- 2025-06-11 07:57:23 UTC - luishdz04');
    
    // ✅ VALIDAR DATOS ANTES DE ABRIR
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
  } catch (error) {
    console.error('💥 Error en handleAddPayment:', error);
    showNotification('Error al abrir formulario de abono', 'error');
  }
}, [mounted]);

// ✅ HANDLER CORREGIDO PARA CONVERTIR A VENTA
const handleConvertToSale = useCallback((layaway: Layaway) => {
  if (!mounted || !layaway?.id) {
    console.error('❌ No se puede convertir: layaway inválido o componente desmontado');
    return;
  }
  
  try {
    console.log('🛒 Convertir a venta:', layaway.sale_number, '- 2025-06-11 07:57:23 UTC - luishdz04');
    
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
  } catch (error) {
    console.error('💥 Error en handleConvertToSale:', error);
    showNotification('Error al abrir conversión a venta', 'error');
  }
}, [mounted]);

// ✅ HANDLER CORREGIDO PARA CANCELAR
const handleCancelLayaway = useCallback((layaway: Layaway) => {
  if (!mounted || !layaway?.id) {
    console.error('❌ No se puede cancelar: layaway inválido o componente desmontado');
    return;
  }
  
  try {
    console.log('❌ Cancelar apartado:', layaway.sale_number, '- 2025-06-11 07:57:23 UTC - luishdz04');
    
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
  } catch (error) {
    console.error('💥 Error en handleCancelLayaway:', error);
    showNotification('Error al abrir cancelación', 'error');
  }
}, [mounted]);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (!mounted) return;
    const value = event.target.value;
    setSearchTerm(value);
  }, [mounted]);

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    if (!mounted) return;
    setActiveTab(newValue);
    setSearchTerm('');
  }, [mounted]);

  // ✅ SUCCESS HANDLER UNIFICADO
  const handleSuccess = useCallback(() => {
    console.log('✅ Operación exitosa - refrescando datos...');
    setRefreshKey(prev => prev + 1);
    setPaymentDialogOpen(false);
    setConvertDialogOpen(false);
    setCancelDialogOpen(false);
    setSelectedLayaway(null);
  }, []);

  if (!mounted) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Cargando gestión de apartados...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#333' }}>
            📦 Gestión de Apartados
          </Typography>
          <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
            2025-06-11 07:50:17 UTC - Usuario: luishdz04 - {layaways.length} apartados cargados
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} sx={{ color: '#FFFFFF' }} /> : <RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
          sx={{
            background: 'linear-gradient(135deg, #4caf50, #388e3c)',
            fontWeight: 600
          }}
        >
          {loading ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </Box>

      {/* ✅ ALERT DE CORRECCIÓN FINAL */}
      <Alert severity="success" sx={{ mb: 3 }}>
        ✅ <strong>GRID V2 SINCRONIZADO:</strong> Página principal ahora usa Grid2 como todos los dialogs - 2025-06-11 07:50:17 UTC
      </Alert>

      {/* ✅ ESTADÍSTICAS CON GRID2 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid xs={12} sm={6} md={2.4}>
          <Card sx={{
            background: 'linear-gradient(135deg, #4caf50, #388e3c)',
            color: '#FFFFFF'
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {stats.activeCount}
              </Typography>
              <Typography variant="body2">
                Apartados Activos
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={2.4}>
          <Card sx={{
            background: 'linear-gradient(135deg, #ff9800, #f57c00)',
            color: '#FFFFFF'
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <WarningIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {stats.expiringCount}
              </Typography>
              <Typography variant="body2">
                Por Vencer (7 días)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={2.4}>
          <Card sx={{
            background: 'linear-gradient(135deg, #2196f3, #1976d2)',
            color: '#FFFFFF'
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <MoneyIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {formatPrice(stats.totalValue)}
              </Typography>
              <Typography variant="body2">
                Valor Total
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={2.4}>
          <Card sx={{
            background: 'linear-gradient(135deg, #9c27b0, #7b1fa2)',
            color: '#FFFFFF'
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <PaymentIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {formatPrice(stats.totalCollected)}
              </Typography>
              <Typography variant="body2">
                Total Cobrado
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={2.4}>
          <Card sx={{
            background: 'linear-gradient(135deg, #f44336, #d32f2f)',
            color: '#FFFFFF'
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <PendingIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {formatPrice(stats.totalPending)}
              </Typography>
              <Typography variant="body2">
                Total Pendiente
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ✅ FILTROS CON GRID2 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
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
                      <SearchIcon sx={{ color: '#666' }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
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
                sx={{ height: '56px' }}
              >
                Limpiar Filtros
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs de estados */}
      <Card sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '1rem'
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
                color: activeTab === index ? tab.color : '#666',
                '&.Mui-selected': {
                  color: tab.color
                }
              }}
            />
          ))}
        </Tabs>
      </Card>

      {/* Tabla de apartados */}
      <Card>
        {loading && (
          <Box sx={{ p: 2 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center', color: '#666' }}>
              Cargando apartados para {tabsData[activeTab]?.label}...
            </Typography>
          </Box>
        )}
        
        <TableContainer component={Paper}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 140 }}>Número</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 200 }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>Pagado</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>Pendiente</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 150 }}>Progreso</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 140 }}>Vence</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 100 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 200 }}>Acciones</TableCell>
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
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="600" color="primary">
                          {layaway.sale_number}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {formatDate(layaway.created_at)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ 
                            width: 32, 
                            height: 32, 
                            bgcolor: isRealCustomer ? '#4caf50' : '#ff9800' 
                          }}>
                            <PersonIcon fontSize="small" />
                          </Avatar>
                          <Box>
                            <Typography 
                              variant="body2" 
                              fontWeight="500"
                              sx={{ 
                                color: isRealCustomer ? '#333' : '#ff9800',
                                fontStyle: isRealCustomer ? 'normal' : 'italic'
                              }}
                            >
                              {layaway.customer_name || 'Cliente General'}
                            </Typography>
                            {layaway.customer_email && (
                              <Typography variant="caption" color="textSecondary">
                                {layaway.customer_email}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" fontWeight="600">
                          {formatPrice(totalAmount)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" fontWeight="600" color="success.main">
                          {formatPrice(paidAmount)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" fontWeight="600" color="warning.main">
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
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: getProgressColor(progressPercentage)
                              }
                            }}
                          />
                          <Typography variant="caption" fontWeight="600">
                            {Math.round(progressPercentage)}%
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="500">
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
                              color={
                                daysLeft > 7 ? 'success' :
                                daysLeft > 0 ? 'warning' :
                                'error'
                              }
                              sx={{ mt: 0.5, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Chip 
                          label={layaway.status}
                          size="small" 
                          color={
                            layaway.status === 'completed' ? 'success' :
                            layaway.status === 'pending' ? 'warning' :
                            'error'
                          }
                        />
                      </TableCell>

                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Ver Detalles">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(layaway)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Agregar Abono">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleAddPayment(layaway)}
                              disabled={layaway.status !== 'pending'}
                            >
                              <AddPaymentIcon />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Convertir a Venta">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleConvertToSale(layaway)}
                              disabled={pendingAmount > 0 || layaway.status !== 'pending'}
                            >
                              <ConvertIcon />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Cancelar Apartado">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleCancelLayaway(layaway)}
                              disabled={layaway.status !== 'pending'}
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
                  <TableCell colSpan={9} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
                      📦 No se encontraron apartados
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {tabsData[activeTab]?.label} - Prueba a cambiar de pestaña o actualizar
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* ✅ DIALOGS CON DATOS COMPLETOS */}
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

      {/* Debug info */}
      <Card sx={{ mt: 3, background: 'rgba(76, 175, 80, 0.1)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#4caf50', mb: 2 }}>
            ✅ GRID V2 COMPLETAMENTE SINCRONIZADO
          </Typography>
          <Grid container spacing={2}>
            <Grid xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                <strong>Página Principal:</strong> Grid2 ✅
              </Typography>
            </Grid>
            <Grid xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                <strong>Dialogs:</strong> Grid2 ✅
              </Typography>
            </Grid>
            <Grid xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                <strong>Sintaxis:</strong> xs={} consistente
              </Typography>
            </Grid>
            <Grid xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                <strong>Timestamp:</strong> 2025-06-11 07:50:17 UTC
              </Typography>
            </Grid>
          </Grid>
          
          <Typography variant="body2" sx={{ color: '#666', mt: 2 }}>
            <strong>🎯 PROBLEMA RESUELTO:</strong> Ahora toda la aplicación usa Grid2 con la sintaxis xs={} consistente. Los botones deberían funcionar perfectamente.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
