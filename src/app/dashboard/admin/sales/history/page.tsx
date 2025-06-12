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
  CircularProgress,
  Avatar
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
  MoreVert as MoreVertIcon,
  Analytics as AnalyticsIcon,
  History as HistoryIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatPrice, formatDate } from '@/utils/formatUtils';
import { showNotification } from '@/utils/notifications';
import SaleDetailsDialog from '@/components/dialogs/SaleDetailsDialog';
import EditSaleDialog from '@/components/dialogs/EditSaleDialog';

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
  
  // Status Colors
  statusActive: '#4CAF50',
  statusInactive: '#F44336',
  statusPending: '#FF9800',
  statusSuspended: '#9E9E9E',
  
  // Interactions
  hoverOverlay: 'rgba(255,204,0,0.05)',
  activeOverlay: 'rgba(255,204,0,0.1)',
  borderDefault: '#333333',
  borderHover: '#FFCC00',
  borderActive: '#E6B800'
};

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
  const loadSales = useCallback(async () => {
    setLoading(true);
    try {
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
      case 'completed': return darkProTokens.success;
      case 'pending': return darkProTokens.warning;
      case 'cancelled': return darkProTokens.error;
      case 'refunded': return darkProTokens.roleModerator;
      default: return darkProTokens.grayMuted;
    }
  };

  // ✅ OBTENER COLOR DEL ESTADO DE PAGO
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return darkProTokens.success;
      case 'partial': return darkProTokens.warning;
      case 'pending': return darkProTokens.error;
      case 'refunded': return darkProTokens.roleModerator;
      default: return darkProTokens.grayMuted;
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
    <Box sx={{ 
      p: 3,
      background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
      minHeight: '100vh'
    }}>
      {/* ✅ HEADER CON DARK PRO SYSTEM */}
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
            bgcolor: darkProTokens.primary, 
            width: 56, 
            height: 56,
            color: darkProTokens.background
          }}>
            <HistoryIcon sx={{ fontSize: 30 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 800, 
              color: darkProTokens.textPrimary,
              mb: 1
            }}>
              📊 Historial de Ventas
            </Typography>
            <Typography variant="body1" sx={{ 
              color: darkProTokens.textSecondary
            }}>
              Gestión completa de transacciones y análisis de ventas
            </Typography>
          </Box>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={() => {
            loadSales();
            loadStats();
          }}
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
          {loading ? 'Cargando...' : 'Actualizar'}
        </Button>
      </Box>

      {/* ✅ ESTADÍSTICAS CON DARK PRO SYSTEM */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
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
                <TrendingIcon sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
                <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                  {stats.salesCount}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Ventas Completadas
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
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
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                  {formatPrice(stats.totalAmount)}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Total Vendido
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
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
                <PaymentIcon sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                  {formatPrice(stats.totalCommissions)}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Total Comisiones
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
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
                <CartIcon sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                  {formatPrice(stats.averageTicket)}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Ticket Promedio
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
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
                <RefundIcon sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
                <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                  {stats.refundsCount}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Devoluciones
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

            <Grid size={{ xs: 12, md: 2 }}>
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
                  label="Estado"
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
                  <MenuItem value="completed">Completadas</MenuItem>
                  <MenuItem value="pending">Pendientes</MenuItem>
                  <MenuItem value="cancelled">Canceladas</MenuItem>
                  <MenuItem value="refunded">Devueltas</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ 
                  color: darkProTokens.textSecondary,
                  '&.Mui-focused': { color: darkProTokens.primary }
                }}>
                  Pago
                </InputLabel>
                <Select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  label="Pago"
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
                      <CalendarIcon sx={{ color: darkProTokens.primary }} />
                    </InputAdornment>
                  ),
                  sx: {
                    color: darkProTokens.textPrimary,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: darkProTokens.grayDark
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
                      <CalendarIcon sx={{ color: darkProTokens.primary }} />
                    </InputAdornment>
                  ),
                  sx: {
                    color: darkProTokens.textPrimary,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: darkProTokens.grayDark
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

            <Grid size={{ xs: 12, md: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={clearFilters}
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
                LIMPIAR
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ✅ TABLA DE VENTAS CON DARK PRO SYSTEM */}
      <Card sx={{
        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
        border: `1px solid ${darkProTokens.grayDark}`,
        borderRadius: 4,
        overflow: 'hidden'
      }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ 
                background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
              }}>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  color: darkProTokens.background,
                  fontSize: '0.9rem'
                }}>
                  Número
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  color: darkProTokens.background,
                  fontSize: '0.9rem'
                }}>
                  Fecha
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  color: darkProTokens.background,
                  fontSize: '0.9rem'
                }}>
                  Cliente
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  color: darkProTokens.background,
                  fontSize: '0.9rem'
                }}>
                  Cajero
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  color: darkProTokens.background,
                  fontSize: '0.9rem'
                }}>
                  Total
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  color: darkProTokens.background,
                  fontSize: '0.9rem'
                }}>
                  Comisión
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  color: darkProTokens.background,
                  fontSize: '0.9rem'
                }}>
                  Método Pago
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  color: darkProTokens.background,
                  fontSize: '0.9rem'
                }}>
                  Estado
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  color: darkProTokens.background,
                  fontSize: '0.9rem'
                }}>
                  Pago
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  color: darkProTokens.background,
                  fontSize: '0.9rem'
                }}>
                  Acciones
                </TableCell>
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
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: `${darkProTokens.primary}10`,
                      },
                      '&:nth-of-type(even)': {
                        backgroundColor: `${darkProTokens.surfaceLevel1}40`
                      }
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="600" sx={{ color: darkProTokens.primary }}>
                        {sale.sale_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        {formatDate(sale.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="500" sx={{ color: darkProTokens.textPrimary }}>
                          {sale.customer_name || 'Cliente General'}
                        </Typography>
                        {sale.customer_email && (
                          <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                            {sale.customer_email}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        {sale.cashier_name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="600" sx={{ color: darkProTokens.textPrimary }}>
                        {formatPrice(sale.total_amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        fontWeight="500"
                        sx={{ 
                          color: sale.commission_amount > 0 ? darkProTokens.warning : darkProTokens.success
                        }}
                      >
                        {sale.commission_amount > 0 ? formatPrice(sale.commission_amount) : 'Sin comisión'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">
                          {getPaymentMethodIcon(sale.payment_method || '')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          {sale.payment_method || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={sale.status}
                        size="small" 
                        sx={{
                          backgroundColor: getStatusColor(sale.status),
                          color: darkProTokens.textPrimary,
                          fontWeight: 600,
                          textTransform: 'capitalize'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={sale.payment_status}
                        size="small" 
                        sx={{
                          backgroundColor: getPaymentStatusColor(sale.payment_status),
                          color: darkProTokens.textPrimary,
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
                          color: darkProTokens.textSecondary,
                          '&:hover': {
                            backgroundColor: `${darkProTokens.primary}20`,
                            color: darkProTokens.primary
                          }
                        }}
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
                  <TableCell colSpan={10} sx={{ textAlign: 'center', py: 6 }}>
                    <CircularProgress sx={{ color: darkProTokens.primary, mb: 2 }} />
                    <Typography variant="body1" sx={{ color: darkProTokens.textSecondary }}>
                      Cargando ventas...
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

              {/* ✅ ESTADO VACÍO */}
              {sales.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={10} sx={{ textAlign: 'center', py: 6 }}>
                    <Box sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <AssessmentIcon sx={{ 
                        fontSize: 60, 
                        color: darkProTokens.grayMuted,
                        opacity: 0.5
                      }} />
                      <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }}>
                        No se encontraron ventas
                      </Typography>
                      <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                        Intenta ajustar los filtros de búsqueda
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ✅ PAGINACIÓN CON DARK PRO SYSTEM */}
        {totalPages > 1 && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            p: 3,
            background: `${darkProTokens.surfaceLevel1}40`
          }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(e, newPage) => setPage(newPage)}
              showFirstButton
              showLastButton
              sx={{
                '& .MuiPaginationItem-root': {
                  color: darkProTokens.textSecondary,
                  '&:hover': {
                    backgroundColor: `${darkProTokens.primary}20`,
                    color: darkProTokens.primary
                  },
                  '&.Mui-selected': {
                    backgroundColor: darkProTokens.primary,
                    color: darkProTokens.background,
                    fontWeight: 700,
                    '&:hover': {
                      backgroundColor: darkProTokens.primaryHover
                    }
                  }
                }
              }}
            />
          </Box>
        )}
      </Card>

      {/* ✅ MENÚ DE ACCIONES CON DARK PRO SYSTEM */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 12,
          sx: { 
            minWidth: 220,
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
            border: `1px solid ${darkProTokens.grayDark}`,
            borderRadius: 3
          }
        }}
      >
        <MenuItem 
          onClick={() => handleViewDetails(menuSale!)}
          sx={{
            color: darkProTokens.textPrimary,
            '&:hover': {
              backgroundColor: `${darkProTokens.primary}20`,
              color: darkProTokens.primary
            }
          }}
        >
          <ViewIcon sx={{ mr: 2, color: darkProTokens.info }} />
          Ver Detalles
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleEditSale(menuSale!)}
          sx={{
            color: darkProTokens.textPrimary,
            '&:hover': {
              backgroundColor: `${darkProTokens.primary}20`,
              color: darkProTokens.primary
            }
          }}
        >
          <EditIcon sx={{ mr: 2, color: darkProTokens.warning }} />
          Editar Venta
        </MenuItem>
        
        <MenuItem 
          onClick={() => handlePrintReceipt(menuSale!)}
          sx={{
            color: darkProTokens.textPrimary,
            '&:hover': {
              backgroundColor: `${darkProTokens.primary}20`,
              color: darkProTokens.primary
            }
          }}
        >
          <PrintIcon sx={{ mr: 2, color: darkProTokens.roleTrainer }} />
          Reimprimir Ticket
        </MenuItem>
        
        <Divider sx={{ borderColor: darkProTokens.grayDark, my: 1 }} />
        
        <MenuItem 
          onClick={() => handleRefund(menuSale!)}
          disabled={menuSale?.status === 'refunded'}
          sx={{
            color: darkProTokens.textPrimary,
            '&:hover': {
              backgroundColor: `${darkProTokens.roleModerator}20`,
              color: darkProTokens.roleModerator
            },
            '&.Mui-disabled': {
              color: darkProTokens.textDisabled
            }
          }}
        >
          <RefundIcon sx={{ mr: 2, color: darkProTokens.roleModerator }} />
          Procesar Devolución
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleCancelSale(menuSale!)}
          disabled={menuSale?.status === 'cancelled'}
          sx={{
            color: darkProTokens.error,
            '&:hover': {
              backgroundColor: `${darkProTokens.error}20`
            },
            '&.Mui-disabled': {
              color: darkProTokens.textDisabled
            }
          }}
        >
          <DeleteIcon sx={{ mr: 2 }} />
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
