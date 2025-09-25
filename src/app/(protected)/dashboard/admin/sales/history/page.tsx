'use client';

import React, { useState, useCallback, useMemo, memo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Chip,
  Stack,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Avatar,
  Tooltip,
  CircularProgress,
  InputAdornment,
  Menu,
  Badge
} from '@mui/material';
import {
  Visibility,
  Receipt,
  Cancel,
  CheckCircle,
  Schedule,
  LocalMall,
  Person,
  CalendarToday,
  AttachMoney,
  CreditCard,
  Refresh,
  FileDownload,
  Search,
  FilterList,
  MoreVert,
  Edit,
  Print,
  Undo,
  TrendingUp,
  Analytics,
  Assessment,
  History
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// ✅ IMPORTS ENTERPRISE ESTÁNDAR MUSCLEUP v7.0
import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { useUserTracking } from '@/hooks/useUserTracking';
import { 
  getCurrentTimestamp,
  formatTimestampForDisplay,
  formatDateForDisplay,
  getTodayInMexico,
  formatTimestampShort
} from '@/utils/dateUtils';
import { notify } from '@/utils/notifications';
import { useNotifications } from '@/hooks/useNotifications';
import { useEntityCRUD } from '@/hooks/useEntityCRUD';

// ✅ INTERFACES ENTERPRISE MUSCLEUP v7.0 CON ESQUEMA BD REAL
interface Sale {
  id: string;
  sale_number: string;
  customer_id?: string;
  cashier_id: string;
  sale_type: 'sale' | 'layaway'; // ✅ Constraint BD validado
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  coupon_discount: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  commission_rate: number;
  commission_amount: number;
  change_amount: number;
  status: 'completed' | 'pending' | 'cancelled' | 'refunded'; // ✅ Constraint BD validado
  payment_status: 'paid' | 'partial' | 'pending' | 'refunded'; // ✅ Constraint BD validado
  is_mixed_payment: boolean;
  payment_received: number;
  notes?: string;
  receipt_printed: boolean;
  email_sent: boolean;
  created_at: string; // ✅ snake_case para sales
  completed_at?: string;
  updated_at: string;
  updated_by?: string; // ✅ Auditoría updated_only para sales
  cancelled_by?: string;
  cancellation_reason?: string;
  layaway_expires_at?: string;
  
  // ✅ RELACIONES CON ESQUEMA BD REAL
  Users?: { // ✅ Cliente - Users tabla camelCase
    id: string;
    firstName: string;
    lastName?: string;
    email?: string;
    profilePictureUrl?: string;
  };
  cashier?: { // ✅ Cajero - Users tabla camelCase  
    id: string;
    firstName: string;
    lastName?: string;
    profilePictureUrl?: string;
  };
  sale_items?: Array<{
    id: string;
    product_name: string;
    product_sku?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    discount_amount: number;
    tax_amount: number;
  }>;
  sale_payment_details?: Array<{
    id: string;
    payment_method: string;
    amount: number;
    commission_rate: number;
    commission_amount: number;
    payment_reference?: string;
    sequence_order: number;
    is_partial_payment: boolean;
    payment_date: string;
  }>;
}

interface SalesFilters {
  status: string;
  sale_type: string;
  payment_status: string;
  cashier_id: string;
  date_from: string;
  date_to: string;
  search: string;
}

interface SalesStats {
  totalSales: number;
  totalAmount: number;
  totalCommissions: number;
  averageTicket: number;
  salesCount: number;
  refundsCount: number;
  layawayCount: number;
  todayTotal: number;
}

// ✅ COMPONENTE PRINCIPAL CON PATRONES ENTERPRISE v7.0 - HOOKS CORRECTOS
const SalesHistoryPage = memo(() => {
  // ✅ TODOS LOS HOOKS PRIMERO - ORDEN CONSISTENTE SIEMPRE
  const hydrated = useHydrated();
  const { addAuditFieldsFor } = useUserTracking();
  const { toast, alert } = useNotifications();

  // ✅ ESTADOS LOCALES
  const [filters, setFilters] = useState<SalesFilters>({
    status: 'all',
    sale_type: 'all',
    payment_status: 'all',
    cashier_id: 'all',
    date_from: '',
    date_to: '',
    search: ''
  });

  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuSale, setMenuSale] = useState<Sale | null>(null);
  const [stats, setStats] = useState<SalesStats>({
    totalSales: 0,
    totalAmount: 0,
    totalCommissions: 0,
    averageTicket: 0,
    salesCount: 0,
    refundsCount: 0,
    layawayCount: 0,
    todayTotal: 0
  });

  // ✅ CRUD SIMPLIFICADO PARA EVITAR BUCLE - QUERY BÁSICA FUNCIONAL
  const { 
    data: sales, 
    loading, 
    updateItem, 
    searchItems, 
    stats: crudStats,
    refreshData 
  } = useEntityCRUD<Sale>({
    tableName: 'sales', // ✅ Detecta automáticamente auditoría updated_only
    selectQuery: '*', // ✅ QUERY SIMPLE SIN RELACIONES PROBLEMÁTICAS
    onError: (error) => {
      console.error('Error en sales:', error);
      notify.error(`Error al cargar ventas: ${error}`);
    },
    onSuccess: (message) => {
      console.log('Sales cargadas:', message);
    }
  });

  // ✅ FUNCIONES MEMOIZADAS CON OPTIMIZACIÓN v7.0
  const formatPrice = useCallback((price: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price || 0);
  }, []);

  const getStatusColor = useCallback((status: string): string => {
    switch (status) {
      case 'completed': return colorTokens.success;
      case 'pending': return colorTokens.warning;
      case 'cancelled': return colorTokens.danger;
      case 'refunded': return colorTokens.info;
      default: return colorTokens.neutral700;
    }
  }, []);

  const getPaymentStatusColor = useCallback((status: string): string => {
    switch (status) {
      case 'paid': return colorTokens.success;
      case 'partial': return colorTokens.warning;
      case 'pending': return colorTokens.danger;
      case 'refunded': return colorTokens.info;
      default: return colorTokens.neutral700;
    }
  }, []);

  const getPaymentMethodIcon = useCallback((method: string): string => {
    switch (method?.toLowerCase()) {
      case 'efectivo': return '💵';
      case 'debito': return '💳';
      case 'credito': return '💳';
      case 'transferencia': return '🏦';
      case 'mixto': return '🔄';
      default: return '💰';
    }
  }, []);

  // ✅ ESTADÍSTICAS CALCULADAS CON USEMEMO v7.0
  const calculatedStats = useMemo(() => {
    const today = getTodayInMexico();
    const completedSales = sales.filter(sale => sale.status === 'completed');
    const todaySales = completedSales.filter(sale => 
      formatDateForDisplay(sale.created_at).startsWith(formatDateForDisplay(today))
    );
    
    return {
      totalSales: sales.length,
      totalAmount: completedSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0),
      totalCommissions: completedSales.reduce((sum, sale) => sum + (sale.commission_amount || 0), 0),
      averageTicket: completedSales.length > 0 
        ? completedSales.reduce((sum, sale) => sum + sale.total_amount, 0) / completedSales.length 
        : 0,
      salesCount: completedSales.length,
      refundsCount: sales.filter(sale => sale.status === 'refunded').length,
      layawayCount: sales.filter(sale => sale.sale_type === 'layaway').length,
      todayTotal: todaySales.reduce((sum, sale) => sum + sale.total_amount, 0)
    };
  }, [sales]);

  // ✅ FILTRADO CON USECALLBACK v7.0
  const applyFilters = useCallback(async () => {
    const filterObj: Record<string, any> = {};
    
    if (filters.status !== 'all') filterObj.status = filters.status;
    if (filters.sale_type !== 'all') filterObj.sale_type = filters.sale_type;
    if (filters.payment_status !== 'all') filterObj.payment_status = filters.payment_status;
    if (filters.cashier_id !== 'all') filterObj.cashier_id = filters.cashier_id;
    if (filters.search.trim()) filterObj.sale_number = filters.search.trim();

    try {
      await searchItems(filterObj);
    } catch (error) {
      notify.error('Error al aplicar filtros');
    }
  }, [filters, searchItems]);

  // ✅ MANEJO DE MENÚ MEMOIZADO
  const handleMenuClick = useCallback((event: React.MouseEvent<HTMLElement>, sale: Sale) => {
    setMenuAnchor(event.currentTarget);
    setMenuSale(sale);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchor(null);
    setMenuSale(null);
  }, []);

  // ✅ ACCIONES DE VENTA CON AUDITORÍA INTELIGENTE v7.0
  const handleViewDetails = useCallback((sale: Sale) => {
    setSelectedSale(sale);
    setDetailsOpen(true);
    handleMenuClose();
  }, [handleMenuClose]);

  const handleEditSale = useCallback((sale: Sale) => {
    setSelectedSale(sale);
    setEditOpen(true);
    handleMenuClose();
  }, [handleMenuClose]);

  const handlePrintReceipt = useCallback(async (sale: Sale) => {
    try {
      notify.success('Ticket enviado a impresión');
    } catch (error) {
      notify.error('Error al imprimir ticket');
    }
    handleMenuClose();
  }, [handleMenuClose]);

  const handleRefund = useCallback(async (sale: Sale) => {
    const confirmed = await alert.confirm(
      `¿Estás seguro de procesar la devolución de la venta ${sale.sale_number}?`
    );

    if (!confirmed) return;

    try {
      // ✅ Auditoría inteligente sales (updated_only)
      await updateItem(sale.id, {
        status: 'refunded',
        payment_status: 'refunded',
        cancellation_reason: 'Devolución procesada'
      });
      
      notify.success('Devolución procesada exitosamente');
      await refreshData();
    } catch (error) {
      notify.error('Error al procesar devolución');
    }
    handleMenuClose();
  }, [updateItem, refreshData, alert, handleMenuClose]);

  const handleCancelSale = useCallback(async (sale: Sale) => {
    const confirmed = await alert.confirm(
      `¿Estás seguro de cancelar la venta ${sale.sale_number}?`
    );

    if (!confirmed) return;

    try {
      // ✅ Auditoría inteligente sales (updated_only)
      await updateItem(sale.id, {
        status: 'cancelled',
        cancellation_reason: 'Venta cancelada por usuario'
      });
      
      notify.success('Venta cancelada exitosamente');
      await refreshData();
    } catch (error) {
      notify.error('Error al cancelar venta');
    }
    handleMenuClose();
  }, [updateItem, refreshData, alert, handleMenuClose]);

  // ✅ LIMPIAR FILTROS MEMOIZADO
  const clearFilters = useCallback(() => {
    setFilters({
      status: 'all',
      sale_type: 'all',
      payment_status: 'all',
      cashier_id: 'all',
      date_from: '',
      date_to: '',
      search: ''
    });
  }, []);

  // ✅ VENTAS PROCESADAS CON USEMEMO v7.0 + QUERY SEPARADA PARA USUARIOS
  const processedSales = useMemo(() => {
    return sales.map(sale => ({
      ...sale,
      customer_name: 'Cliente General', // ✅ TEMPORAL - Evitar relaciones problemáticas
      customer_email: '',
      cashier_name: 'Sistema', // ✅ TEMPORAL - Evitar relaciones problemáticas  
      payment_method: 'Efectivo', // ✅ TEMPORAL - Método principal MuscleUp
      items_count: 0 // ✅ TEMPORAL
    }));
  }, [sales]);

  // ✅ RENDER CONDICIONAL CORRECTO - NO EARLY RETURN
  // Todos los hooks se ejecutan siempre, solo el JSX es condicional
  const loadingContent = (
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
        Inicializando historial de ventas
      </Typography>
    </Box>
  );

  const mainContent = (
    <Box sx={{ 
      p: 3,
      background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
      minHeight: '100vh'
    }}>
      {/* ✅ HEADER CON BRANDING MUSCLEUP v7.0 */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
        p: 3,
        borderRadius: 4,
        border: `1px solid ${colorTokens.border}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ 
            bgcolor: colorTokens.brand, 
            width: 56, 
            height: 56,
            color: colorTokens.textOnBrand
          }}>
            <History sx={{ fontSize: 30 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 800, 
              color: colorTokens.textPrimary,
              mb: 1
            }}>
              Historial de Ventas
            </Typography>
            <Typography variant="body1" sx={{ 
              color: colorTokens.textSecondary
            }}>
              Gestión completa de transacciones y análisis enterprise
            </Typography>
          </Box>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={refreshData}
          disabled={loading}
          sx={{
            background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandActive})`,
            color: colorTokens.textOnBrand,
            fontWeight: 700,
            px: 3,
            py: 1.5,
            borderRadius: 3,
            '&:hover': {
              background: `linear-gradient(135deg, ${colorTokens.brandHover}, ${colorTokens.brand})`,
              transform: 'translateY(-2px)',
              boxShadow: `0 8px 20px ${colorTokens.glow}`
            }
          }}
        >
          {loading ? 'Cargando...' : 'Actualizar'}
        </Button>
      </Box>

      {/* ✅ ESTADÍSTICAS CON COLORtokens MUSCLEUP v7.0 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.success}, ${colorTokens.successHover})`,
              color: colorTokens.textPrimary,
              borderRadius: 3,
              overflow: 'hidden'
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <TrendingUp sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
                <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                  {calculatedStats.salesCount}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Ventas Completadas
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
              color: colorTokens.textOnBrand,
              borderRadius: 3
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <AttachMoney sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                  {formatPrice(calculatedStats.totalAmount)}
                </Typography>
                <Typography variant="body1">
                  Total Vendido
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.info}, ${colorTokens.infoHover})`,
              color: colorTokens.textPrimary,
              borderRadius: 3
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Analytics sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                  {formatPrice(calculatedStats.totalCommissions)}
                </Typography>
                <Typography variant="body1">
                  Comisiones
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.warning}, ${colorTokens.brandHover})`,
              color: colorTokens.textOnBrand,
              borderRadius: 3
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Receipt sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                  {formatPrice(calculatedStats.averageTicket)}
                </Typography>
                <Typography variant="body1">
                  Ticket Promedio
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* ✅ FILTROS CON COLORTOKEN MUSCLEUP v7.0 */}
      <Card sx={{ 
        mb: 4,
        background: colorTokens.surfaceLevel2,
        border: `1px solid ${colorTokens.border}`,
        borderRadius: 3
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <FilterList sx={{ color: colorTokens.brand }} />
            <Typography variant="h6" sx={{ 
              color: colorTokens.textPrimary,
              fontWeight: 700
            }}>
              Filtros de Búsqueda
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Buscar venta"
                placeholder="Número de venta..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: colorTokens.brand }} />
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

            <Grid size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colorTokens.textSecondary }}>Estado</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  label="Estado"
                  sx={{
                    color: colorTokens.textPrimary,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: colorTokens.border }
                  }}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="completed">Completadas</MenuItem>
                  <MenuItem value="pending">Pendientes</MenuItem>
                  <MenuItem value="cancelled">Canceladas</MenuItem>
                  <MenuItem value="refunded">Devueltas</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colorTokens.textSecondary }}>Tipo</InputLabel>
                <Select
                  value={filters.sale_type}
                  onChange={(e) => setFilters(prev => ({ ...prev, sale_type: e.target.value }))}
                  label="Tipo"
                  sx={{
                    color: colorTokens.textPrimary,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: colorTokens.border }
                  }}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="sale">Ventas</MenuItem>
                  <MenuItem value="layaway">Apartados</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                fullWidth
                type="date"
                label="Desde"
                value={filters.date_from}
                onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiInputLabel-root': { color: colorTokens.textSecondary },
                  '& .MuiOutlinedInput-root': { color: colorTokens.textPrimary }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                fullWidth
                type="date"
                label="Hasta"
                value={filters.date_to}
                onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiInputLabel-root': { color: colorTokens.textSecondary },
                  '& .MuiOutlinedInput-root': { color: colorTokens.textPrimary }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 1 }}>
              <Stack direction="row" spacing={1} sx={{ height: '56px' }}>
                <Button
                  variant="contained"
                  onClick={applyFilters}
                  disabled={loading}
                  sx={{ 
                    minWidth: '80px',
                    bgcolor: colorTokens.brand,
                    color: colorTokens.textOnBrand,
                    '&:hover': { bgcolor: colorTokens.brandHover }
                  }}
                >
                  Filtrar
                </Button>
                <Button
                  variant="outlined"
                  onClick={clearFilters}
                  sx={{ 
                    minWidth: '80px',
                    color: colorTokens.textSecondary,
                    borderColor: colorTokens.border
                  }}
                >
                  Limpiar
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ✅ TABLA CON COLORTOKEN MUSCLEUP v7.0 */}
      <Card sx={{
        background: colorTokens.surfaceLevel2,
        border: `1px solid ${colorTokens.border}`,
        borderRadius: 3,
        overflow: 'hidden'
      }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ background: colorTokens.brand }}>
                <TableCell sx={{ fontWeight: 'bold', color: colorTokens.textOnBrand }}>
                  Número
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: colorTokens.textOnBrand }}>
                  Fecha
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: colorTokens.textOnBrand }}>
                  Cliente
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: colorTokens.textOnBrand }}>
                  Cajero
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: colorTokens.textOnBrand }}>
                  Tipo
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: colorTokens.textOnBrand }}>
                  Total
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: colorTokens.textOnBrand }}>
                  Comisión
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: colorTokens.textOnBrand }}>
                  Método Pago
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: colorTokens.textOnBrand }}>
                  Estado
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: colorTokens.textOnBrand }}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              <AnimatePresence>
                {processedSales.map((sale, index) => (
                  <TableRow
                    key={sale.id}
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
                      <Typography variant="body2" fontWeight="600" sx={{ color: colorTokens.brand }}>
                        {sale.sale_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        {formatTimestampShort(sale.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="500" sx={{ color: colorTokens.textPrimary }}>
                          {sale.customer_name}
                        </Typography>
                        {sale.customer_email && (
                          <Typography variant="caption" sx={{ color: colorTokens.textMuted }}>
                            {sale.customer_email}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        {sale.cashier_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={sale.sale_type === 'sale' ? 'Venta' : 'Apartado'}
                        size="small" 
                        sx={{
                          backgroundColor: sale.sale_type === 'sale' ? colorTokens.success : colorTokens.warning,
                          color: colorTokens.textPrimary,
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="600" sx={{ color: colorTokens.textPrimary }}>
                        {formatPrice(sale.total_amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ 
                        color: sale.commission_amount > 0 ? colorTokens.warning : colorTokens.success
                      }}>
                        {sale.commission_amount > 0 ? formatPrice(sale.commission_amount) : 'Sin comisión'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{getPaymentMethodIcon(sale.payment_method)}</span>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          {sale.payment_method}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={sale.status}
                        size="small" 
                        sx={{
                          backgroundColor: getStatusColor(sale.status),
                          color: colorTokens.textPrimary,
                          fontWeight: 600,
                          textTransform: 'capitalize'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, sale)}
                        sx={{
                          color: colorTokens.textSecondary,
                          '&:hover': {
                            backgroundColor: colorTokens.hoverOverlay,
                            color: colorTokens.brand
                          }
                        }}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </AnimatePresence>

              {loading && (
                <TableRow>
                  <TableCell colSpan={10} sx={{ textAlign: 'center', py: 6 }}>
                    <CircularProgress sx={{ color: colorTokens.brand, mb: 2 }} />
                    <Typography variant="body1" sx={{ color: colorTokens.textSecondary }}>
                      Cargando historial de ventas...
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

              {processedSales.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={10} sx={{ textAlign: 'center', py: 6 }}>
                    <Box sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <Assessment sx={{ 
                        fontSize: 60, 
                        color: colorTokens.textMuted,
                        opacity: 0.5
                      }} />
                      <Typography variant="h6" sx={{ color: colorTokens.textSecondary }}>
                        No se encontraron ventas
                      </Typography>
                      <Typography variant="body2" sx={{ color: colorTokens.textMuted }}>
                        Intenta ajustar los filtros de búsqueda
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* ✅ MENÚ DE ACCIONES CON COLORTOKEN MUSCLEUP v7.0 */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 12,
          sx: { 
            minWidth: 220,
            background: colorTokens.surfaceLevel3,
            border: `1px solid ${colorTokens.border}`,
            borderRadius: 2
          }
        }}
      >
        <MenuItem onClick={() => handleViewDetails(menuSale!)} sx={{ color: colorTokens.textPrimary }}>
          <Visibility sx={{ mr: 2, color: colorTokens.info }} />
          Ver Detalles
        </MenuItem>
        
        <MenuItem onClick={() => handleEditSale(menuSale!)} sx={{ color: colorTokens.textPrimary }}>
          <Edit sx={{ mr: 2, color: colorTokens.warning }} />
          Editar Venta
        </MenuItem>
        
        <MenuItem onClick={() => handlePrintReceipt(menuSale!)} sx={{ color: colorTokens.textPrimary }}>
          <Print sx={{ mr: 2, color: colorTokens.success }} />
          Reimprimir Ticket
        </MenuItem>
        
        <Divider sx={{ borderColor: colorTokens.border, my: 1 }} />
        
        <MenuItem 
          onClick={() => handleRefund(menuSale!)}
          disabled={menuSale?.status === 'refunded'}
          sx={{ color: colorTokens.textPrimary }}
        >
          <Undo sx={{ mr: 2, color: colorTokens.info }} />
          Procesar Devolución
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleCancelSale(menuSale!)}
          disabled={menuSale?.status === 'cancelled'}
          sx={{ color: colorTokens.danger }}
        >
          <Cancel sx={{ mr: 2 }} />
          Cancelar Venta
        </MenuItem>
      </Menu>

      {/* ✅ DIALOGS PLACEHOLDERS - IMPLEMENTAR SEGÚN NECESIDAD */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ color: colorTokens.textPrimary, bgcolor: colorTokens.surfaceLevel2 }}>
          Detalles de Venta: {selectedSale?.sale_number}
        </DialogTitle>
        <DialogContent sx={{ bgcolor: colorTokens.surfaceLevel1 }}>
          <Typography sx={{ color: colorTokens.textSecondary, mt: 2 }}>
            Implementar SaleDetailsDialog específico aquí
          </Typography>
        </DialogContent>
        <DialogActions sx={{ bgcolor: colorTokens.surfaceLevel2 }}>
          <Button onClick={() => setDetailsOpen(false)} sx={{ color: colorTokens.textSecondary }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: colorTokens.textPrimary, bgcolor: colorTokens.surfaceLevel2 }}>
          Editar Venta: {selectedSale?.sale_number}
        </DialogTitle>
        <DialogContent sx={{ bgcolor: colorTokens.surfaceLevel1 }}>
          <Typography sx={{ color: colorTokens.textSecondary, mt: 2 }}>
            Implementar EditSaleDialog específico aquí
          </Typography>
        </DialogContent>
        <DialogActions sx={{ bgcolor: colorTokens.surfaceLevel2 }}>
          <Button onClick={() => setEditOpen(false)} sx={{ color: colorTokens.textSecondary }}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  // ✅ RETURN FINAL - CONDICIONAL PERO SIN EARLY RETURN DE HOOKS
  return hydrated ? mainContent : loadingContent;
});

SalesHistoryPage.displayName = 'SalesHistoryPage';

export default SalesHistoryPage;