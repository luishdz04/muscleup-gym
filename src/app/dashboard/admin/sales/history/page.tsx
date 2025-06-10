// src/app/dashboard/admin/sales/history/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  Menu,
  MenuItem,
  Fab,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  Alert,
  Tooltip,
  Badge,
  Stack,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Receipt as ReceiptIcon,
  Visibility as ViewIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Undo as RefundIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Payment as PaymentIcon,
  ShoppingCart as CartIcon,
  TrendingUp as TrendingIcon,
  AttachMoney as MoneyIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatPrice, formatDate } from '@/utils/formatUtils';
import { showNotification } from '@/utils/notifications';
import SaleDetailsDialog from '@/components/dialogs/SaleDetailsDialog';
import EditSaleDialog from '@/components/dialogs/EditSaleDialog';

interface Sale {
  id: string;
  sale_number: string;
  customer_name?: string;
  customer_email?: string;
  cashier_name?: string;
  sale_type: 'sale' | 'layaway';
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  coupon_discount: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  commission_amount: number;
  change_amount: number;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'partial' | 'paid' | 'refunded';
  payment_method?: string;
  is_mixed_payment: boolean;
  created_at: string;
  completed_at?: string;
  notes?: string;
  receipt_printed: boolean;
  email_sent: boolean;
  items?: SaleItem[];
  payment_details?: PaymentDetail[];
}

interface SaleItem {
  id: string;
  product_name: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_amount: number;
  tax_amount: number;
}

interface PaymentDetail {
  id: string;
  payment_method: string;
  amount: number;
  commission_rate: number;
  commission_amount: number;
  payment_reference?: string;
  sequence_order: number;
  payment_date: string;
}

interface SalesStats {
  totalSales: number;
  totalAmount: number;
  totalCommissions: number;
  averageTicket: number;
  salesCount: number;
  refundsCount: number;
}

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState({
    from: '',
    to: ''
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuSale, setMenuSale] = useState<Sale | null>(null);
  const [stats, setStats] = useState<SalesStats>({
    totalSales: 0,
    totalAmount: 0,
    totalCommissions: 0,
    averageTicket: 0,
    salesCount: 0,
    refundsCount: 0
  });

  const supabase = createBrowserSupabaseClient();

  // ✅ CARGAR ESTADÍSTICAS
  const loadStats = useCallback(async () => {
    try {
      let statsQuery = supabase
        .from('sales')
        .select('total_amount, commission_amount, status')
        .eq('sale_type', 'sale');

      // Aplicar filtros de fecha si existen
      if (dateFilter.from) {
        statsQuery = statsQuery.gte('created_at', `${dateFilter.from}T00:00:00`);
      }
      if (dateFilter.to) {
        statsQuery = statsQuery.lte('created_at', `${dateFilter.to}T23:59:59`);
      }

      const { data: statsData, error } = await statsQuery;

      if (error) throw error;

      const completedSales = statsData?.filter(sale => sale.status === 'completed') || [];
      const refundedSales = statsData?.filter(sale => sale.status === 'refunded') || [];

      const totalAmount = completedSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      const totalCommissions = completedSales.reduce((sum, sale) => sum + (sale.commission_amount || 0), 0);
      const salesCount = completedSales.length;
      const averageTicket = salesCount > 0 ? totalAmount / salesCount : 0;

      setStats({
        totalSales: statsData?.length || 0,
        totalAmount,
        totalCommissions,
        averageTicket,
        salesCount,
        refundsCount: refundedSales.length
      });

    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [supabase, dateFilter]);

  // ✅ CARGAR VENTAS CON FILTROS Y MÉTODO DE PAGO
// ✅ CARGAR VENTAS CON FILTROS Y MÉTODO DE PAGO
const loadSales = useCallback(async () => {
    setLoading(true);
    try {
      console.log('🔍 Cargando ventas...');
      
      let query = supabase
        .from('sales')
        .select(`
          *,
          customer:Users!sales_customer_id_fkey(firstName, lastName, email),
          cashier:Users!sales_cashier_id_fkey(firstName, lastName),
          sale_items(*),
          sale_payment_details(*)
        `, { count: 'exact' })
        .eq('sale_type', 'sale')
        .order('created_at', { ascending: false });
  
      // ✅ APLICAR FILTROS - BÚSQUEDA CORREGIDA
      if (searchTerm.trim()) {
        const searchValue = searchTerm.trim();
        query = query.or(`sale_number.ilike.%${searchValue}%,notes.ilike.%${searchValue}%`);
      }
  
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
  
      if (paymentFilter !== 'all') {
        query = query.eq('payment_status', paymentFilter);
      }
  
      if (dateFilter.from) {
        query = query.gte('created_at', `${dateFilter.from}T00:00:00`);
      }
  
      if (dateFilter.to) {
        query = query.lte('created_at', `${dateFilter.to}T23:59:59`);
      }
  
      // ✅ PAGINACIÓN
      const itemsPerPage = 20;
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
  
      const { data, error, count } = await query.range(from, to);
  
      console.log('📊 Resultado:', { data, error, count });
  
      if (error) throw error;
  
      // ✅ FORMATEAR VENTAS CON MÉTODO DE PAGO
      const formattedSales = data?.map(sale => {
        // Procesar métodos de pago
        const paymentMethods = sale.sale_payment_details || [];
        const paymentMethodText = paymentMethods.length > 0
          ? paymentMethods.length > 1
            ? 'Mixto'
            : paymentMethods[0].payment_method
          : 'N/A';
  
        return {
          ...sale,
          customer_name: sale.customer 
            ? `${sale.customer.firstName} ${sale.customer.lastName || ''}`.trim()
            : 'Cliente General',
          customer_email: sale.customer?.email || '',
          cashier_name: sale.cashier 
            ? `${sale.cashier.firstName} ${sale.cashier.lastName || ''}`.trim()
            : 'Sistema',
          items: sale.sale_items || [],
          payment_details: paymentMethods,
          payment_method: paymentMethodText,
          payment_reference: paymentMethods[0]?.payment_reference || null
        };
      }) || [];
  
      setSales(formattedSales);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
  
    } catch (error) {
      console.error('❌ Error loading sales:', error);
      const errorObj = error as any;
      if (errorObj?.details) {
        console.error('❌ Error details:', errorObj.details);
      }
      if (errorObj?.message) {
        console.error('❌ Error message:', errorObj.message);
      }
      showNotification('Error al cargar las ventas', 'error');
    } finally {
      setLoading(false);
    }
  }, [supabase, searchTerm, statusFilter, paymentFilter, dateFilter, page]);

  // ✅ EFECTOS
  useEffect(() => {
    loadSales();
    loadStats();
  }, [loadSales, loadStats]);

  // ✅ RESET DE PÁGINA AL CAMBIAR FILTROS
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, paymentFilter, dateFilter]);

  // ✅ MANEJAR MENÚ DE ACCIONES
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, sale: Sale) => {
    setAnchorEl(event.currentTarget);
    setMenuSale(sale);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuSale(null);
  };

  // ✅ VER DETALLES DE VENTA
  const handleViewDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setDetailsOpen(true);
    handleMenuClose();
  };

  // ✅ EDITAR VENTA
  const handleEditSale = (sale: Sale) => {
    setSelectedSale(sale);
    setEditOpen(true);
    handleMenuClose();
  };

  // ✅ REIMPRIMIR TICKET
  const handlePrintReceipt = async (sale: Sale) => {
    try {
      showNotification('Ticket enviado a impresión', 'success');
    } catch (error) {
      showNotification('Error al imprimir ticket', 'error');
    }
    handleMenuClose();
  };

  // ✅ PROCESAR DEVOLUCIÓN
  const handleRefund = async (sale: Sale) => {
    try {
      const { error } = await supabase
        .from('sales')
        .update({ 
          status: 'refunded',
          payment_status: 'refunded',
          updated_at: new Date().toISOString()
        })
        .eq('id', sale.id);

      if (error) throw error;

      showNotification('Devolución procesada exitosamente', 'success');
      loadSales();
      loadStats();
    } catch (error) {
      showNotification('Error al procesar devolución', 'error');
    }
    handleMenuClose();
  };

  // ✅ CANCELAR VENTA
  const handleCancelSale = async (sale: Sale) => {
    try {
      const { error } = await supabase
        .from('sales')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', sale.id);

      if (error) throw error;

      showNotification('Venta cancelada exitosamente', 'success');
      loadSales();
      loadStats();
    } catch (error) {
      showNotification('Error al cancelar venta', 'error');
    }
    handleMenuClose();
  };

  // ✅ LIMPIAR FILTROS
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setDateFilter({ from: '', to: '' });
    setPage(1);
  };

  // ✅ OBTENER COLOR DEL ESTADO
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      case 'refunded': return 'secondary';
      default: return 'default';
    }
  };

  // ✅ OBTENER COLOR DEL ESTADO DE PAGO
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'partial': return 'warning';
      case 'pending': return 'error';
      case 'refunded': return 'secondary';
      default: return 'default';
    }
  };

  // ✅ OBTENER ICONO DEL MÉTODO DE PAGO
  const getPaymentMethodIcon = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'efectivo': return '💵';
      case 'debito': return '💳';
      case 'credito': return '💳';
      case 'transferencia': return '🏦';
      case 'mixto': return '🔄';
      default: return '💰';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* ✅ HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#333' }}>
          📊 Historial de Ventas
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={() => {
            loadSales();
            loadStats();
          }}
          disabled={loading}
          sx={{
            background: 'linear-gradient(135deg, #4caf50, #388e3c)',
            fontWeight: 600
          }}
        >
          {loading ? 'Cargando...' : 'Actualizar'}
        </Button>
      </Box>

      {/* ✅ ESTADÍSTICAS */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{
            background: 'linear-gradient(135deg, #4caf50, #388e3c)',
            color: '#FFFFFF'
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {stats.salesCount}
              </Typography>
              <Typography variant="body2">
                Ventas Completadas
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{
            background: 'linear-gradient(135deg, #2196f3, #1976d2)',
            color: '#FFFFFF'
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <MoneyIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {formatPrice(stats.totalAmount)}
              </Typography>
              <Typography variant="body2">
                Total Vendido
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{
            background: 'linear-gradient(135deg, #ff9800, #f57c00)',
            color: '#FFFFFF'
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <PaymentIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {formatPrice(stats.totalCommissions)}
              </Typography>
              <Typography variant="body2">
                Total Comisiones
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{
            background: 'linear-gradient(135deg, #9c27b0, #7b1fa2)',
            color: '#FFFFFF'
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <CartIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {formatPrice(stats.averageTicket)}
              </Typography>
              <Typography variant="body2">
                Ticket Promedio
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{
            background: 'linear-gradient(135deg, #f44336, #d32f2f)',
            color: '#FFFFFF'
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <RefundIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {stats.refundsCount}
              </Typography>
              <Typography variant="body2">
                Devoluciones
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ✅ FILTROS */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Buscar venta"
                placeholder="Número, cliente, notas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#666' }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Estado"
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
                <InputLabel>Pago</InputLabel>
                <Select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  label="Pago"
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="paid">Pagados</MenuItem>
                  <MenuItem value="partial">Parciales</MenuItem>
                  <MenuItem value="pending">Pendientes</MenuItem>
                  <MenuItem value="refunded">Devueltos</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                fullWidth
                type="date"
                label="Desde"
                value={dateFilter.from}
                onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarIcon sx={{ color: '#666' }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                fullWidth
                type="date"
                label="Hasta"
                value={dateFilter.to}
                onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarIcon sx={{ color: '#666' }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={clearFilters}
                sx={{ height: '56px' }}
              >
                LIMPIAR
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ✅ TABLA DE VENTAS */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Número</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Cajero</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Comisión</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Método Pago</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Pago</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              <AnimatePresence>
                {sales.map((sale, index) => (
                  <TableRow
                    key={sale.id}
                    component={motion.tr}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    hover
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="600" color="primary">
                        {sale.sale_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(sale.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="500">
                          {sale.customer_name || 'Cliente General'}
                        </Typography>
                        {sale.customer_email && (
                          <Typography variant="caption" color="textSecondary">
                            {sale.customer_email}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {sale.cashier_name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="600">
                        {formatPrice(sale.total_amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color={sale.commission_amount > 0 ? 'warning.main' : 'success.main'}
                        fontWeight="500"
                      >
                        {sale.commission_amount > 0 ? formatPrice(sale.commission_amount) : 'Sin comisión'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">
                          {getPaymentMethodIcon(sale.payment_method || '')}
                        </Typography>
                        <Typography variant="body2">
                          {sale.payment_method || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={sale.status}
                        size="small" 
                        color={getStatusColor(sale.status) as any}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={sale.payment_status}
                        size="small" 
                        color={getPaymentStatusColor(sale.payment_status) as any}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, sale)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </AnimatePresence>

              {/* ✅ ESTADO DE LOADING */}
              {loading && (
                <TableRow>
                  <TableCell colSpan={10} sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      Cargando ventas...
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

              {/* ✅ ESTADO VACÍO */}
              {sales.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={10} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      No se encontraron ventas con los filtros aplicados
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ✅ PAGINACIÓN */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(e, newPage) => setPage(newPage)}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Box>
        )}
      </Card>

      {/* ✅ MENÚ DE ACCIONES */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 8,
          sx: { minWidth: 200 }
        }}
      >
        <MenuItem onClick={() => handleViewDetails(menuSale!)}>
          <ViewIcon sx={{ mr: 1 }} />
          Ver Detalles
        </MenuItem>
        <MenuItem onClick={() => handleEditSale(menuSale!)}>
          <EditIcon sx={{ mr: 1 }} />
          Editar Venta
        </MenuItem>
        <MenuItem onClick={() => handlePrintReceipt(menuSale!)}>
          <PrintIcon sx={{ mr: 1 }} />
          Reimprimir Ticket
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => handleRefund(menuSale!)}
          disabled={menuSale?.status === 'refunded'}
        >
          <RefundIcon sx={{ mr: 1 }} />
          Procesar Devolución
        </MenuItem>
        <MenuItem 
          onClick={() => handleCancelSale(menuSale!)}
          disabled={menuSale?.status === 'cancelled'}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Cancelar Venta
        </MenuItem>
      </Menu>

      {/* ✅ DIALOGS */}
      <SaleDetailsDialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        sale={selectedSale}
      />

      <EditSaleDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        sale={selectedSale}
        onSuccess={() => {
          loadSales();
          loadStats();
          setEditOpen(false);
        }}
      />
    </Box>
  );
}