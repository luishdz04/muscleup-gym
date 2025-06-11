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
import Grid from '@mui/material/Grid'; // ✅ CORREGIDO: Grid normal
import {
  Search as SearchIcon,
  Payments as PaymentIcon,
  ShoppingCart as ConvertIcon,
  Cancel as CancelIcon,
  Visibility as ViewIcon,
  Add as AddPaymentIcon,
  History as HistoryIcon,
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
  items_count?: number;
  payment_count?: number;
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
  const [activeTab, setActiveTab] = useState(0);
  const [layaways, setLayaways] = useState<Layaway[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLayaway, setSelectedLayaway] = useState<Layaway | null>(null);
  const [stats, setStats] = useState<LayawayStats>({
    activeCount: 0,
    expiringCount: 0,
    expiredCount: 0,
    completedCount: 0,
    totalValue: 0,
    totalPending: 0,
    totalCollected: 0
  });
  const [refreshKey, setRefreshKey] = useState(0); // ✅ Para forzar actualización manual

  const supabase = createBrowserSupabaseClient();

  // ✅ TABS ESTÁTICOS - No causan re-renders infinitos
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
  ], [stats]); // ✅ Solo depende de stats

  // ✅ CARGAR ESTADÍSTICAS - Optimizado
  const loadStats = useCallback(async () => {
    try {
      console.log('📊 Cargando estadísticas...');
      
      const { data: allLayaways, error } = await supabase
        .from('sales')
        .select('*')
        .eq('sale_type', 'layaway');

      if (error) {
        console.error('❌ Error cargando estadísticas:', error);
        throw error;
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
      showNotification('Error al cargar estadísticas', 'error');
    }
  }, [supabase]);

  // ✅ CARGAR APARTADOS - Con nombres de clientes corregido
  const loadLayaways = useCallback(async () => {
    setLoading(true);
    try {
      console.log(`🔍 Cargando apartados para tab: ${tabsData[activeTab]?.value}`);
      
      // ✅ QUERY PRINCIPAL - Solo apartados
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

      // ✅ FILTRO DE BÚSQUEDA
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

      // ✅ OBTENER CLIENTES - Query separado y optimizado
      const customerIds = [...new Set(salesData.map(s => s.customer_id).filter(Boolean))];
      console.log(`👥 Obteniendo datos de ${customerIds.length} clientes únicos:`, customerIds);

      let customersData: any[] = [];
      if (customerIds.length > 0) {
        const { data: customers, error: customerError } = await supabase
          .from('users')
          .select('id, name, email, whatsapp')
          .in('id', customerIds);

        if (customerError) {
          console.error('❌ Error obteniendo clientes:', customerError);
        } else {
          customersData = customers || [];
          console.log(`✅ ${customersData.length} clientes obtenidos:`, customersData.map(c => ({ id: c.id, name: c.name })));
        }
      }

      // ✅ COMBINAR DATOS - Apartados con clientes
      const layawaysWithCustomers = salesData.map(layaway => {
        const customer = customersData.find(c => c.id === layaway.customer_id);
        
        const result = {
          ...layaway,
          customer_name: customer?.name || 'Cliente General',
          customer_email: customer?.email || '',
          customer_phone: customer?.whatsapp || ''
        };

        // Debug log para cada apartado
        console.log(`🔗 Apartado ${layaway.sale_number}: customer_id=${layaway.customer_id} → name=${result.customer_name}`);
        
        return result;
      });

      setLayaways(layawaysWithCustomers);
      console.log(`🎯 ${layawaysWithCustomers.length} apartados procesados con clientes`);

    } catch (error) {
      console.error('💥 Error cargando apartados:', error);
      showNotification(`Error al cargar apartados: ${(error as Error).message}`, 'error');
      setLayaways([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchTerm, supabase, tabsData]); // ✅ Dependencias estables

  // ✅ EFECTOS CONTROLADOS - Sin loops infinitos
  useEffect(() => {
    console.log('🔄 Efecto de estadísticas ejecutándose...');
    loadStats();
  }, [refreshKey]); // ✅ Solo depende de refreshKey manual

  useEffect(() => {
    console.log('🔄 Efecto de apartados ejecutándose...');
    loadLayaways();
  }, [activeTab, searchTerm, refreshKey]); // ✅ Dependencias estables

  // ✅ FUNCIÓN DE ACTUALIZACIÓN MANUAL
  const handleRefresh = useCallback(() => {
    console.log('🔄 Actualización manual iniciada...');
    setRefreshKey(prev => prev + 1);
    showNotification('Actualizando datos...', 'info');
  }, []);

  // ✅ FUNCIONES AUXILIARES - Optimizadas
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

  // ✅ HANDLERS DE ACCIONES
  const handleViewDetails = useCallback((layaway: Layaway) => {
    console.log('👁️ Ver detalles:', layaway.sale_number);
    showNotification(`Ver detalles de apartado ${layaway.sale_number}`, 'info');
    // TODO: Implementar dialog de detalles
  }, []);

  const handleAddPayment = useCallback((layaway: Layaway) => {
    console.log('💰 Agregar abono:', layaway.sale_number);
    showNotification(`Agregar abono a apartado ${layaway.sale_number}`, 'info');
    // TODO: Implementar dialog de abono
  }, []);

  const handleConvertToSale = useCallback((layaway: Layaway) => {
    console.log('🛒 Convertir a venta:', layaway.sale_number);
    showNotification(`Convertir apartado ${layaway.sale_number} a venta`, 'info');
    // TODO: Implementar dialog de conversión
  }, []);

  const handleCancelLayaway = useCallback((layaway: Layaway) => {
    console.log('❌ Cancelar apartado:', layaway.sale_number);
    showNotification(`Cancelar apartado ${layaway.sale_number}`, 'warning');
    // TODO: Implementar dialog de cancelación
  }, []);

  // ✅ HANDLER DE BÚSQUEDA CON DEBOUNCE
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    console.log('🔍 Búsqueda actualizada:', value);
  }, []);

  // ✅ HANDLER DE TAB CHANGE
  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    console.log('📑 Cambiando a tab:', newValue, tabsData[newValue]?.label);
    setActiveTab(newValue);
    setSearchTerm(''); // Limpiar búsqueda al cambiar tab
  }, [tabsData]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#333' }}>
            📦 Gestión de Apartados
          </Typography>
          <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
            2025-06-11 06:32:10 UTC - Usuario: luishdz04 - {layaways.length} apartados cargados
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

      {/* ✅ ESTADÍSTICAS CON GRID CORREGIDO */}
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

      {/* ✅ FILTROS CORREGIDOS */}
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

      {/* ✅ TABLA DE APARTADOS OPTIMIZADA */}
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
                  const progressPercentage = layaway.total_amount > 0 ? (layaway.paid_amount / layaway.total_amount) * 100 : 0;
                  const daysLeft = getDaysUntilExpiration(layaway.layaway_expires_at);
                  
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
                            bgcolor: layaway.customer_name === 'Cliente General' ? '#ff9800' : '#4caf50' 
                          }}>
                            <PersonIcon fontSize="small" />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="500">
                              {layaway.customer_name}
                            </Typography>
                            {layaway.customer_email && (
                              <Typography variant="caption" color="textSecondary">
                                {layaway.customer_email}
                              </Typography>
                            )}
                            <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                              ID: {layaway.customer_id || 'Sin ID'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" fontWeight="600">
                          {formatPrice(layaway.total_amount || 0)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" fontWeight="600" color="success.main">
                          {formatPrice(layaway.paid_amount || 0)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" fontWeight="600" color="warning.main">
                          {formatPrice(layaway.pending_amount || 0)}
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
                              disabled={layaway.pending_amount > 0 || layaway.status !== 'pending'}
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

      {/* ✅ INFORMACIÓN DE DEBUG MEJORADA */}
      <Card sx={{ mt: 3, background: 'rgba(33, 150, 243, 0.1)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#2196f3', mb: 2 }}>
            🔧 Estado del Sistema
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                <strong>Tab Activo:</strong> {tabsData[activeTab]?.label}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                <strong>Apartados Mostrados:</strong> {layaways.length}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                <strong>Búsqueda:</strong> {searchTerm || 'Sin filtro'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                <strong>Estado:</strong> {loading ? '🔄 Cargando...' : '✅ Listo'}
              </Typography>
            </Grid>
          </Grid>
          
          {layaways.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                <strong>Debug Clientes:</strong> {layaways.filter(l => l.customer_name !== 'Cliente General').length} con nombre real, {layaways.filter(l => l.customer_name === 'Cliente General').length} sin nombre
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
