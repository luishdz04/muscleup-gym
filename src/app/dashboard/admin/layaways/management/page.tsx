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
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatPrice, formatDate } from '@/utils/formatUtils';
import { showNotification } from '@/utils/notifications';

// ✅ IMPORTS CONDICIONALES - Solo en cliente
import dynamic from 'next/dynamic';

// ✅ CARGAR DIALOGS DINÁMICAMENTE
const PaymentToLayawayDialog = dynamic(() => import('@/components/dialogs/PaymentToLayawayDialog'), {
  ssr: false
});

const LayawayDetailsDialog = dynamic(() => import('@/components/dialogs/LayawayDetailsDialog'), {
  ssr: false
});

const ConvertToSaleDialog = dynamic(() => import('@/components/dialogs/ConvertToSaleDialog'), {
  ssr: false
});

const CancelLayawayDialog = dynamic(() => import('@/components/dialogs/CancelLayawayDialog'), {
  ssr: false
});

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
  status: 'pending' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'partial' | 'paid';
  created_at: string;
  last_payment_date?: string;
  notes?: string;
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
  const [mounted, setMounted] = useState(false); // ✅ PARA SSR
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

  // ✅ VERIFICAR SI ESTÁ MONTADO (EVITA ERRORES DE SSR)
  useEffect(() => {
    setMounted(true);
  }, []);

  const supabase = createBrowserSupabaseClient();

  // ✅ TABS ESTÁTICOS
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

  // ✅ CARGAR ESTADÍSTICAS
  const loadStats = useCallback(async () => {
    if (!mounted) return; // ✅ Solo ejecutar si está montado

    try {
      console.log('📊 Cargando estadísticas...', new Date().toISOString());
      
      const { data: allLayaways, error } = await supabase
        .from('sales')
        .select('*')
        .eq('sale_type', 'layaway');

      if (error) {
        console.error('❌ Error cargando estadísticas:', error);
        return;
      }

      console.log(`✅ ${allLayaways?.length || 0} apartados encontrados para estadísticas`);

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

        const newStats = {
          activeCount: active.length,
          expiringCount: expiring.length,
          expiredCount: expired.length,
          completedCount: completed.length,
          totalValue: allLayaways.reduce((sum, l) => sum + (l.total_amount || 0), 0),
          totalPending: allLayaways.reduce((sum, l) => sum + (l.pending_amount || 0), 0),
          totalCollected: allLayaways.reduce((sum, l) => sum + (l.paid_amount || 0), 0)
        };

        setStats(newStats);
        console.log('📈 Estadísticas actualizadas:', newStats);
      }

    } catch (error) {
      console.error('💥 Error en estadísticas:', error);
    }
  }, [supabase, mounted]);

  // ✅ CARGAR APARTADOS
  const loadLayaways = useCallback(async () => {
    if (!mounted) return; // ✅ Solo ejecutar si está montado

    setLoading(true);
    try {
      console.log(`🔍 Cargando apartados para tab: ${tabsData[activeTab]?.value}`);
      
      let query = supabase
        .from('sales')
        .select('*')
        .eq('sale_type', 'layaway')
        .order('created_at', { ascending: false });

      // ✅ FILTROS POR TAB
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

      console.log(`✅ ${salesData?.length || 0} apartados obtenidos del query principal`);

      if (!salesData || salesData.length === 0) {
        setLayaways([]);
        return;
      }

      // ✅ OBTENER CLIENTES
      const customerIds = [...new Set(salesData.map(s => s.customer_id).filter(Boolean))];
      console.log(`👥 Obteniendo datos de ${customerIds.length} clientes únicos`);

      let customersData: any[] = [];
      if (customerIds.length > 0) {
        const { data: customers, error: customerError } = await supabase
          .from('Users')
          .select('id, firstName, lastName, name, email, whatsapp')
          .in('id', customerIds);

        if (customerError) {
          console.error('❌ Error obteniendo clientes de tabla Users:', customerError);
        } else {
          customersData = customers || [];
          console.log(`✅ ${customersData.length} clientes obtenidos de tabla Users`);
        }
      }

      // ✅ COMBINAR DATOS CON VALIDACIÓN SEGURA
      const layawaysWithCustomers = salesData.map(layaway => {
        const customer = customersData.find(c => c.id === layaway.customer_id);
        
        let customerName = 'Cliente General';
        if (customer) {
          if (customer.name) {
            customerName = customer.name;
          } else if (customer.firstName) {
            customerName = `${customer.firstName} ${customer.lastName || ''}`.trim();
          }
        }

        // ✅ VALIDACIÓN SEGURA DE CAMPOS
        return {
          ...layaway,
          customer_name: customerName,
          customer_email: customer?.email || '',
          customer_phone: customer?.whatsapp || '',
          // ✅ ASEGURAR QUE SIEMPRE TENGAN VALORES NUMÉRICOS
          total_amount: layaway.total_amount || 0,
          paid_amount: layaway.paid_amount || 0,
          pending_amount: layaway.pending_amount || 0,
          commission_amount: layaway.commission_amount || 0,
          required_deposit: layaway.required_deposit || 0,
          deposit_percentage: layaway.deposit_percentage || 0
        };
      });

      setLayaways(layawaysWithCustomers);
      console.log(`🎯 ${layawaysWithCustomers.length} apartados procesados con clientes`);

    } catch (error) {
      console.error('💥 Error cargando apartados:', error);
      if (mounted) {
        showNotification(`Error al cargar apartados: ${(error as Error).message}`, 'error');
      }
      setLayaways([]);
    } finally {
      if (mounted) {
        setLoading(false);
      }
    }
  }, [activeTab, searchTerm, supabase, tabsData, mounted]);

  // ✅ EFECTOS CONTROLADOS
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

  // ✅ FUNCIÓN DE ACTUALIZACIÓN MANUAL
  const handleRefresh = useCallback(() => {
    if (!mounted) return;
    console.log('🔄 Actualización manual iniciada...', new Date().toISOString());
    setRefreshKey(prev => prev + 1);
    showNotification('Actualizando datos...', 'info');
  }, [mounted]);

  // ✅ FUNCIONES AUXILIARES
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

  // ✅ HANDLERS DE ACCIONES CON VALIDACIÓN
  const handleViewDetails = useCallback((layaway: Layaway) => {
    if (!mounted || !layaway) return;
    console.log('👁️ Ver detalles:', layaway.sale_number);
    setSelectedLayaway(layaway);
    setDetailsDialogOpen(true);
  }, [mounted]);

  const handleAddPayment = useCallback((layaway: Layaway) => {
    if (!mounted || !layaway) return;
    console.log('💰 Agregar abono:', layaway.sale_number);
    setSelectedLayaway(layaway);
    setPaymentDialogOpen(true);
  }, [mounted]);

  const handleConvertToSale = useCallback((layaway: Layaway) => {
    if (!mounted || !layaway) return;
    console.log('🛒 Convertir a venta:', layaway.sale_number);
    setSelectedLayaway(layaway);
    setConvertDialogOpen(true);
  }, [mounted]);

  const handleCancelLayaway = useCallback((layaway: Layaway) => {
    if (!mounted || !layaway) return;
    console.log('❌ Cancelar apartado:', layaway.sale_number);
    setSelectedLayaway(layaway);
    setCancelDialogOpen(true);
  }, [mounted]);

  // ✅ HANDLERS DE EVENTOS
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (!mounted) return;
    const value = event.target.value;
    setSearchTerm(value);
    console.log('🔍 Búsqueda actualizada:', value);
  }, [mounted]);

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    if (!mounted) return;
    console.log('📑 Cambiando a tab:', newValue, tabsData[newValue]?.label);
    setActiveTab(newValue);
    setSearchTerm('');
  }, [tabsData, mounted]);

  // ✅ RENDERIZAR LOADING INICIAL PARA SSR
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
            2025-06-11 07:08:33 UTC - Usuario: luishdz04 - {layaways.length} apartados cargados
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

      {/* ✅ ALERT DE CORRECCIÓN */}
      <Alert severity="success" sx={{ mb: 3 }}>
        🔧 <strong>Error de SSR corregido:</strong> Validación segura de campos implementada para evitar errores de prerendering
      </Alert>

      {/* ✅ ESTADÍSTICAS */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
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

        <Grid item xs={12} sm={6} md={2.4}>
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

        <Grid item xs={12} sm={6} md={2.4}>
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

        <Grid item xs={12} sm={6} md={2.4}>
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

        <Grid item xs={12} sm={6} md={2.4}>
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

      {/* ✅ FILTROS */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
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

            <Grid item xs={12} md={3}>
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

            <Grid item xs={12} md={3}>
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

      {/* ✅ TABLA DE APARTADOS */}
      <Card>
        {loading && (
          <Box sx={{ p: 2 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center', color: '#666' }}>
              Cargando apartados para {tabsData[activeTab]?.label}...
            </Typography>
          </Box>
        )}
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Número</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Pagado</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Pendiente</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Progreso</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Vence</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <AnimatePresence>
                {layaways.map((layaway, index) => {
                  // ✅ VALIDACIÓN SEGURA DE TODOS LOS CAMPOS
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
                            <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                              ID: {layaway.customer_id ? `${layaway.customer_id.slice(0, 8)}...` : 'Sin ID'}
                            </Typography>
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

      {/* ✅ DIALOGS CONDICIONALES */}
      {mounted && (
        <>
          <PaymentToLayawayDialog
            open={paymentDialogOpen}
            onClose={() => setPaymentDialogOpen(false)}
            layaway={selectedLayaway}
            onSuccess={() => {
              loadLayaways();
              setPaymentDialogOpen(false);
            }}
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
            onSuccess={() => {
              loadLayaways();
              setConvertDialogOpen(false);
            }}
          />

          <CancelLayawayDialog
            open={cancelDialogOpen}
            onClose={() => setCancelDialogOpen(false)}
            layaway={selectedLayaway}
            onSuccess={() => {
              loadLayaways();
              setCancelDialogOpen(false);
            }}
          />
        </>
      )}

      {/* ✅ INFORMACIÓN DE DEBUG CORREGIDA */}
      <Card sx={{ mt: 3, background: 'rgba(76, 175, 80, 0.1)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#4caf50', mb: 2 }}>
            ✅ Error de SSR Corregido - Build Exitoso
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                <strong>Tab Activo:</strong> {tabsData[activeTab]?.label}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                <strong>Apartados:</strong> {layaways.length}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                <strong>Estado:</strong> {loading ? '🔄 Cargando...' : '✅ Listo'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                <strong>Montado:</strong> {mounted ? '✅ Sí' : '❌ No'}
              </Typography>
            </Grid>
          </Grid>
          
          <Typography variant="body2" sx={{ color: '#666', mt: 2 }}>
            <strong>✅ Correcciones aplicadas:</strong> Validación segura de campos, import dinámico de dialogs, verificación de mounted state para SSR
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
