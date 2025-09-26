'use client';

import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
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
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

// ✅ TIPOS EXISTENTES IMPORTADOS
import { 
  Sale, 
  SaleItem, 
  SalePaymentDetail, 
  InventoryMovement,
  Product,
  Customer,
  SaleStatus,
  PaymentStatus,
  SaleType
} from '@/types/pos';

// ✅ FILTROS ESPECÍFICOS PARA HISTORIAL (sin status - siempre completed)
interface HistoryFilters {
  sale_type: string; // 'all' | 'sale' | 'layaway'
  payment_status: string; // 'all' | 'paid' | 'partial' | 'refunded'  
  cashier_id: string;
  date_from: string;
  date_to: string;
  search: string;
}

interface HistoryStats {
  totalCompleted: number;
  totalAmount: number;
  totalCommissions: number;
  averageTicket: number;
  directSalesCount: number; // sale_type='sale' completed
  completedLayawayCount: number; // sale_type='layaway' completed  
  refundsCount: number;
  todayTotal: number;
  paymentMethodBreakdown: Record<string, { count: number; amount: number }>;
}

// ✅ INTERFACE ESPECÍFICA PARA CAJEROS (EVITA CONFLICTO CON CUSTOMER)
interface Cashier {
  id: string;
  firstName: string;
  lastName?: string;
  profilePictureUrl?: string;
}

// ✅ SALE CON RELACIONES EXTENDIDAS PARA HISTORIAL
interface SaleWithRelations extends Sale {
  customer?: {
    id: string;
    firstName: string;
    lastName?: string;
    email?: string;
    profilePictureUrl?: string;
  };
  cashier?: {
    id: string;
    firstName: string;
    lastName?: string;
    profilePictureUrl?: string;
  };
  sale_items?: SaleItem[];
  sale_payment_details?: SalePaymentDetail[];
  // Campos calculados para display
  customer_name?: string;
  cashier_name?: string;  
  payment_method?: string;
  items_count?: number;
}

// ✅ COMPONENTE HISTORIAL DE VENTAS OPTIMIZADO v7.0
const SalesHistoryPage = memo(() => {
  // ✅ HOOKS ENTERPRISE ORDENADOS
  const hydrated = useHydrated();
  const { addAuditFieldsFor } = useUserTracking();
  const { toast, alert } = useNotifications();
  const supabase = createBrowserSupabaseClient();

  // ✅ ESTADOS ESPECÍFICOS PARA HISTORIAL
  const [filters, setFilters] = useState<HistoryFilters>({
    sale_type: 'all',
    payment_status: 'all',
    cashier_id: 'all', 
    date_from: '',
    date_to: '',
    search: ''
  });

  const [selectedSale, setSelectedSale] = useState<SaleWithRelations | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuSale, setMenuSale] = useState<SaleWithRelations | null>(null);
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [cashiers, setCashiers] = useState<Cashier[]>([]); // ✅ TIPO CORRECTO CASHIER[]

  // ✅ CONFIGURACIÓN CRUD OPTIMIZADA PARA HISTORIAL - MEMOIZADA
  const crudConfig = useMemo(() => ({
    tableName: 'sales' as const,
    selectQuery: `
      *,
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
    onError: useCallback((error: string) => {
      console.error('Error cargando historial:', error);
      notify.error(`Error al cargar historial: ${error}`);
    }, []),
    onSuccess: useCallback(() => {
      console.log('Historial cargado exitosamente');
    }, [])
  }), []);

  // ✅ CRUD CON CONFIGURACIÓN ESTABLE
  const { 
    data: allSales, 
    loading, 
    updateItem, 
    searchItems,
    loadMore,
    refreshData 
  } = useEntityCRUD<SaleWithRelations>(crudConfig);

  // ✅ FILTRO AUTOMÁTICO A COMPLETED PARA HISTORIAL
  const completedSales = useMemo(() => {
    return allSales.filter(sale => sale.status === 'completed');
  }, [allSales]);

  // ✅ CARGAR CASHIERS PARA FILTRO - CORREGIDO CON TIPO CASHIER
  const loadCashiers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('Users') // ✅ Tabla Users con camelCase
        .select('id, firstName, lastName, profilePictureUrl')
        .eq('rol', 'empleado') // ✅ Campo rol en Users
        .order('firstName');
      
      if (error) throw error;
      
      // ✅ TIPADO CORRECTO - data ya es Cashier[] compatible
      setCashiers(data || []);
    } catch (error) {
      console.error('Error cargando cajeros:', error);
      notify.error('Error al cargar lista de cajeros');
    }
  }, [supabase]);

  // ✅ CARGAR DATOS INICIALES - SOLO COMPLETED
  useEffect(() => {
    if (hydrated) {
      loadCashiers();
      
      // Cargar solo ventas completadas inicialmente
      searchItems({ status: 'completed' });
    }
  }, [hydrated, loadCashiers, searchItems]);

  // ✅ ESTADÍSTICAS CALCULADAS OPTIMIZADAS
  const historyStats = useMemo((): HistoryStats => {
    const today = getTodayInMexico();
    const todaySales = completedSales.filter(sale => 
      formatDateForDisplay(sale.created_at) === formatDateForDisplay(today)
    );

    // Breakdown por método de pago
    const paymentMethodBreakdown: Record<string, { count: number; amount: number }> = {};
    
    completedSales.forEach(sale => {
      const method = sale.is_mixed_payment ? 'mixto' : 
        sale.sale_payment_details?.[0]?.payment_method || 'efectivo';
      
      if (!paymentMethodBreakdown[method]) {
        paymentMethodBreakdown[method] = { count: 0, amount: 0 };
      }
      paymentMethodBreakdown[method].count++;
      paymentMethodBreakdown[method].amount += sale.total_amount;
    });

    return {
      totalCompleted: completedSales.length,
      totalAmount: completedSales.reduce((sum, sale) => sum + sale.total_amount, 0),
      totalCommissions: completedSales.reduce((sum, sale) => sum + (sale.commission_amount || 0), 0),
      averageTicket: completedSales.length > 0 
        ? completedSales.reduce((sum, sale) => sum + sale.total_amount, 0) / completedSales.length 
        : 0,
      directSalesCount: completedSales.filter(sale => sale.sale_type === 'sale').length,
      completedLayawayCount: completedSales.filter(sale => sale.sale_type === 'layaway').length,
      refundsCount: allSales.filter(sale => sale.status === 'refunded').length, // Todos los refunds
      todayTotal: todaySales.reduce((sum, sale) => sum + sale.total_amount, 0),
      paymentMethodBreakdown
    };
  }, [completedSales, allSales]);

  // ✅ FUNCIONES HELPER MEMOIZADAS
  const formatPrice = useCallback((price: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price || 0);
  }, []);

  const getStatusColor = useCallback((status: SaleStatus): string => {
    switch (status) {
      case 'completed': return colorTokens.success;
      case 'pending': return colorTokens.warning;
      case 'cancelled': return colorTokens.danger;
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

  // ✅ APLICAR FILTROS CON COMPLETED AUTOMÁTICO
  const applyFilters = useCallback(async () => {
    const activeFiltersCount = Object.entries(filters).filter(([key, value]) => 
      value !== 'all' && value !== ''
    ).length;
    
    const toastId = notify.loading(
      activeFiltersCount > 0 
        ? `Aplicando ${activeFiltersCount} filtro(s) a historial completado...`
        : 'Cargando historial completo...'
    );

    try {
      const filterObj: Record<string, any> = {
        status: 'completed' // ✅ SIEMPRE FILTRAR A COMPLETED PARA HISTORIAL
      };
      
      if (filters.sale_type !== 'all') filterObj.sale_type = filters.sale_type;
      if (filters.payment_status !== 'all') filterObj.payment_status = filters.payment_status;
      if (filters.cashier_id !== 'all') filterObj.cashier_id = filters.cashier_id;
      if (filters.search.trim()) filterObj.sale_number = filters.search.trim();

      // Filtros de fecha implementados en el searchItems
      if (filters.date_from) filterObj.date_from = filters.date_from;
      if (filters.date_to) filterObj.date_to = filters.date_to;

      setPage(0);
      await searchItems(filterObj);
      
      notify.dismiss(toastId);
      notify.success(
        activeFiltersCount > 0 
          ? `Filtros aplicados - ${completedSales.length} ventas completadas encontradas`
          : `Historial cargado - ${completedSales.length} ventas completadas totales`
      );
    } catch (error) {
      notify.dismiss(toastId);
      notify.error('Error al aplicar filtros');
      console.error('Error en filtros:', error);
    }
  }, [filters, searchItems, completedSales.length]);

  // ✅ LIMPIAR FILTROS
  const clearFilters = useCallback(async () => {
    setFilters({
      sale_type: 'all',
      payment_status: 'all',
      cashier_id: 'all',
      date_from: '',
      date_to: '',
      search: ''
    });
    setPage(0);
    
    const toastId = notify.loading('Limpiando filtros y cargando historial completo...');
    
    try {
      await searchItems({ status: 'completed' }); // Solo completed
      notify.dismiss(toastId);
      notify.success(`Filtros limpiados - ${completedSales.length} ventas completadas mostradas`);
    } catch (error) {
      notify.dismiss(toastId);
      notify.error('Error al limpiar filtros');
      console.error('Error en clearFilters:', error);
    }
  }, [searchItems, completedSales.length]);

  // ✅ PROCESAR SALES PARA DISPLAY
  const processedSales = useMemo(() => {
    return completedSales.map((sale): SaleWithRelations => {
      const customer = sale.customer;
      const cashier = sale.cashier;
      const paymentMethods = sale.sale_payment_details || [];
      const saleItems = sale.sale_items || [];
      
      return {
        ...sale,
        customer_name: customer 
          ? `${customer.firstName} ${customer.lastName || ''}`.trim()
          : 'Cliente General',
        cashier_name: cashier 
          ? `${cashier.firstName} ${cashier.lastName || ''}`.trim()
          : 'Sistema',
        payment_method: sale.is_mixed_payment 
          ? 'Mixto' 
          : paymentMethods[0]?.payment_method || 'Efectivo',
        items_count: saleItems.reduce((sum, item) => sum + (item.quantity || 0), 0)
      };
    });
  }, [completedSales]);

  // ✅ MANEJO DE MENÚ
  const handleMenuClick = useCallback((event: React.MouseEvent<HTMLElement>, sale: SaleWithRelations) => {
    setMenuAnchor(event.currentTarget);
    setMenuSale(sale);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchor(null);
    setMenuSale(null);
  }, []);

  // ✅ ACCIONES DEL MENÚ
  const handleViewDetails = useCallback((sale: SaleWithRelations) => {
    setSelectedSale(sale);
    setDetailsOpen(true);
    handleMenuClose();
  }, [handleMenuClose]);

  const handleEditSale = useCallback((sale: SaleWithRelations) => {
    setSelectedSale(sale);
    setEditOpen(true);
    handleMenuClose();
  }, [handleMenuClose]);

  // ✅ FUNCIÓN HELPER: OBTENER ITEMS DE VENTA
  const getSaleItems = useCallback(async (saleId: string) => {
    try {
      const { data, error } = await supabase
        .from('sale_items')
        .select('*')
        .eq('sale_id', saleId);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo sale_items:', error);
      throw new Error('No se pudieron obtener los productos de la venta');
    }
  }, [supabase]);

  // ✅ FUNCIÓN HELPER: CREAR MOVIMIENTO DE INVENTARIO CON AUDITORÍA
  const createInventoryMovement = useCallback(async (
    saleItem: SaleItem, 
    reason: string,
    movementType: 'entrada' | 'ajuste' = 'entrada'
  ) => {
    try {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('current_stock, name')
        .eq('id', saleItem.product_id)
        .single();
      
      if (productError) throw productError;
      
      const newStock = movementType === 'entrada' 
        ? productData.current_stock + saleItem.quantity 
        : productData.current_stock; // Para ajuste, stock no cambia físicamente
      
      // ✅ CREAR MOVIMIENTO CON AUDITORÍA
      const movementData = await addAuditFieldsFor('inventory_movements', {
        product_id: saleItem.product_id,
        movement_type: movementType,
        quantity: saleItem.quantity,
        previous_stock: productData.current_stock,
        new_stock: newStock,
        reason: reason,
        reference_id: saleItem.sale_id,
        unit_cost: saleItem.unit_price,
        total_cost: saleItem.total_price
      }, false);

      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert([movementData]);
      
      if (movementError) throw movementError;
      
      return { productName: productData.name, newStock };
    } catch (error) {
      console.error('Error creando movimiento de inventario:', error);
      throw error;
    }
  }, [supabase, addAuditFieldsFor]);

  // ✅ ACTUALIZAR STOCK FÍSICO CON AUDITORÍA
  const updateProductStock = useCallback(async (productId: string, quantityToAdd: number) => {
    try {
      const { data: currentProduct, error: fetchError } = await supabase
        .from('products')
        .select('current_stock')
        .eq('id', productId)
        .single();

      if (fetchError) throw fetchError;

      const newStock = currentProduct.current_stock + quantityToAdd;

      const stockUpdateData = await addAuditFieldsFor('products', {
        current_stock: newStock
      }, true);

      const { error } = await supabase
        .from('products')
        .update(stockUpdateData)
        .eq('id', productId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error actualizando stock:', error);
      throw error;
    }
  }, [supabase, addAuditFieldsFor]);

  // ✅ DEVOLUCIÓN COMPLETA CON LÓGICA DIFERENCIADA
  const handleRefund = useCallback(async (sale: SaleWithRelations) => {
    const isLayaway = sale.sale_type === 'layaway';
    
    const confirmed = await alert.confirm(
      `¿Confirmar devolución de ${sale.sale_number}?\n\n` +
      `Tipo: ${isLayaway ? 'Apartado Completado' : 'Venta Directa'}\n` +
      `Monto: ${formatPrice(sale.total_amount)}\n\n` +
      `${isLayaway 
        ? '• El apartado ya estaba completado\n• Se restaurará inventario físico normalmente' 
        : '• Se restaurará inventario físico\n• Se actualizarán movimientos de stock'
      }\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    const progressToast = notify.loading('Procesando devolución completa...');

    try {
      // 1. Obtener productos de la venta
      const saleItems = await getSaleItems(sale.id);
      
      if (saleItems.length === 0) {
        notify.dismiss(progressToast);
        notify.warning('La venta no tiene productos registrados');
        return;
      }

      const restoredProducts = [];

      // 2. PARA AMBOS TIPOS: Restaurar inventario físico (ya están completados)
      for (const item of saleItems) {
        try {
          const result = await createInventoryMovement(
            item, 
            `Devolución ${isLayaway ? 'apartado completado' : 'venta directa'} ${sale.sale_number}`,
            'entrada'
          );
          await updateProductStock(item.product_id, item.quantity);
          
          restoredProducts.push({
            name: result.productName,
            quantity: item.quantity,
            newStock: result.newStock,
            action: 'restaurado al inventario'
          });
        } catch (error) {
          console.error(`Error restaurando producto ${item.product_name}:`, error);
          throw new Error(`Error restaurando ${item.product_name}: ${(error as Error).message}`);
        }
      }

      // 3. Actualizar status de venta
      await updateItem(sale.id, {
        status: 'refunded' as SaleStatus,
        payment_status: 'refunded' as PaymentStatus,
        cancellation_reason: `${isLayaway ? 'Apartado completado' : 'Venta'} devuelto - ${restoredProducts.length} productos restaurados`,
        refund_amount: sale.total_amount,
        refund_method: 'efectivo'
      });

      notify.dismiss(progressToast);
      
      const productsList = restoredProducts
        .map(p => `• ${p.name}: ${p.quantity} unidades ${p.action}`)
        .join('\n');
      
      notify.success(
        `Devolución procesada correctamente\n\n${sale.sale_number}\n` +
        `Monto: ${formatPrice(sale.total_amount)}\n\n${productsList}`
      );

      await refreshData();
      
    } catch (error) {
      notify.dismiss(progressToast);
      notify.error(`Error en devolución: ${(error as Error).message}`);
      console.error('Error completo en devolución:', error);
    }
    handleMenuClose();
  }, [alert, getSaleItems, createInventoryMovement, updateProductStock, updateItem, refreshData, handleMenuClose, formatPrice]);

  // ✅ REIMPRESIÓN DE RECIBO
  const handlePrintReceipt = useCallback(async (sale: SaleWithRelations) => {
    const toastId = notify.loading('Generando recibo para reimpresión...');
    
    try {
      // Simular generación de recibo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      notify.dismiss(toastId);
      notify.success(`Recibo de ${sale.sale_number} enviado a impresora`);
      
    } catch (error) {
      notify.dismiss(toastId);
      notify.error('Error al reimprimir recibo');
    }
    handleMenuClose();
  }, [handleMenuClose]);

  // ✅ REFRESH CON FILTRO COMPLETED
  const handleRefresh = useCallback(async () => {
    const toastId = notify.loading('Actualizando historial de ventas...');
    
    try {
      await searchItems({ status: 'completed' }); // Solo completed
      
      notify.dismiss(toastId);
      notify.success(`Historial actualizado - ${completedSales.length} ventas completadas cargadas`);
      
    } catch (error) {
      notify.dismiss(toastId);
      notify.error('Error al actualizar historial');
      console.error('Error en refresh:', error);
    }
  }, [searchItems, completedSales.length]);

  // ✅ PAGINACIÓN
  const handleChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage - 1);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  // ✅ RENDER CONDICIONAL SIN EARLY RETURN DE HOOKS
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
        Inicializando historial de ventas completadas
      </Typography>
    </Box>
  );

  const mainContent = (
    <Box sx={{ 
      p: 3,
      background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
      minHeight: '100vh'
    }}>
      {/* ✅ HEADER CON BRANDING MUSCLEUP */}
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
              Historial de Ventas Completadas
            </Typography>
            <Typography variant="body1" sx={{ 
              color: colorTokens.textSecondary
            }}>
              Solo transacciones finalizadas - Análisis enterprise de rendimiento
            </Typography>
          </Box>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={handleRefresh}
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
          {loading ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </Box>

      {/* ✅ ESTADÍSTICAS ENTERPRISE */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <motion.div whileHover={{ scale: 1.02 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.success}, ${colorTokens.successHover})`,
              color: colorTokens.textPrimary,
              borderRadius: 3
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <CheckCircle sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                  {historyStats.totalCompleted}
                </Typography>
                <Typography variant="body1">
                  Ventas Completadas
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {historyStats.directSalesCount} directas + {historyStats.completedLayawayCount} apartados
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <motion.div whileHover={{ scale: 1.02 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
              color: colorTokens.textOnBrand,
              borderRadius: 3
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <AttachMoney sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                  {formatPrice(historyStats.totalAmount)}
                </Typography>
                <Typography variant="body1">
                  Ingresos Totales
                </Typography>
                <Typography variant="caption">
                  Hoy: {formatPrice(historyStats.todayTotal)}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <motion.div whileHover={{ scale: 1.02 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.info}, ${colorTokens.infoHover})`,
              color: colorTokens.textPrimary,
              borderRadius: 3
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Analytics sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                  {formatPrice(historyStats.totalCommissions)}
                </Typography>
                <Typography variant="body1">
                  Comisiones Generadas
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <motion.div whileHover={{ scale: 1.02 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.warning}, ${colorTokens.brandHover})`,
              color: colorTokens.textOnBrand,
              borderRadius: 3
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <TrendingUp sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                  {formatPrice(historyStats.averageTicket)}
                </Typography>
                <Typography variant="body1">
                  Ticket Promedio
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* ✅ FILTROS ESPECÍFICOS PARA HISTORIAL */}
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
              Filtros de Historial (Solo Completadas)
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 2.5 }}>
              <TextField
                fullWidth
                label="Buscar por número"
                placeholder="MUP-2025-001..."
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

            <Grid size={{ xs: 6, md: 1.5 }}>
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
                  <MenuItem value="sale">Ventas Directas</MenuItem>
                  <MenuItem value="layaway">Apartados Completados</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 6, md: 1.5 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colorTokens.textSecondary }}>Pago</InputLabel>
                <Select
                  value={filters.payment_status}
                  onChange={(e) => setFilters(prev => ({ ...prev, payment_status: e.target.value }))}
                  label="Pago"
                  sx={{
                    color: colorTokens.textPrimary,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: colorTokens.border }
                  }}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="paid">Pagado Completo</MenuItem>
                  <MenuItem value="partial">Pago Parcial</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 6, md: 1.5 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colorTokens.textSecondary }}>Cajero</InputLabel>
                <Select
                  value={filters.cashier_id}
                  onChange={(e) => setFilters(prev => ({ ...prev, cashier_id: e.target.value }))}
                  label="Cajero"
                  sx={{
                    color: colorTokens.textPrimary,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: colorTokens.border }
                  }}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  {cashiers.map((cashier) => (
                    <MenuItem key={cashier.id} value={cashier.id}>
                      {cashier.firstName} {cashier.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 6, md: 2 }}>
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

            <Grid size={{ xs: 6, md: 2 }}>
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
                  startIcon={<Search />}
                  sx={{ 
                    flex: 1,
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
                    borderColor: colorTokens.border,
                    '&:hover': {
                      borderColor: colorTokens.brand,
                      color: colorTokens.brand
                    }
                  }}
                >
                  Limpiar
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ✅ TABLA DE HISTORIAL */}
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
                  Fecha Completada
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
                  Items
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: colorTokens.textOnBrand }}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              <AnimatePresence>
                {processedSales.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((sale, index) => (
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircle sx={{ color: colorTokens.success, fontSize: 16 }} />
                        <Typography variant="body2" fontWeight="600" sx={{ color: colorTokens.brand }}>
                          {sale.sale_number}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        {formatTimestampShort(sale.completed_at || sale.updated_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="500" sx={{ color: colorTokens.textPrimary }}>
                          {sale.customer_name}
                        </Typography>
                        {sale.customer?.email && (
                          <Typography variant="caption" sx={{ color: colorTokens.textMuted }}>
                            {sale.customer.email}
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
                          backgroundColor: sale.sale_type === 'sale' ? colorTokens.success : colorTokens.info,
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
                        color: sale.commission_amount > 0 ? colorTokens.warning : colorTokens.textMuted
                      }}>
                        {sale.commission_amount > 0 ? formatPrice(sale.commission_amount) : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{getPaymentMethodIcon(sale.payment_method || '')}</span>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          {sale.payment_method}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`${sale.items_count || 0} items`}
                        size="small" 
                        sx={{
                          backgroundColor: `${colorTokens.brand}20`,
                          color: colorTokens.textPrimary,
                          fontWeight: 500
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
                      Cargando historial completado...
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
                        No se encontraron ventas completadas
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

        {/* ✅ PAGINACIÓN */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          background: `${colorTokens.surfaceLevel1}40`,
          borderTop: `1px solid ${colorTokens.border}`
        }}>
          <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
            Mostrando {Math.min(page * rowsPerPage + 1, processedSales.length)} - {Math.min((page + 1) * rowsPerPage, processedSales.length)} de {processedSales.length} ventas completadas
          </Typography>
          
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
              Filas por página:
            </Typography>
            <Select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              size="small"
              sx={{
                color: colorTokens.textPrimary,
                '& .MuiOutlinedInput-notchedOutline': { 
                  borderColor: colorTokens.border 
                },
                minWidth: '80px'
              }}
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </Select>
            
            <Pagination
              count={Math.ceil(processedSales.length / rowsPerPage)}
              page={page + 1}
              onChange={handleChangePage}
              showFirstButton
              showLastButton
              sx={{
                '& .MuiPaginationItem-root': {
                  color: colorTokens.textSecondary,
                  '&:hover': {
                    backgroundColor: `${colorTokens.brand}20`,
                    color: colorTokens.brand
                  },
                  '&.Mui-selected': {
                    backgroundColor: colorTokens.brand,
                    color: colorTokens.textOnBrand,
                    fontWeight: 700,
                    '&:hover': {
                      backgroundColor: colorTokens.brandHover
                    }
                  }
                }
              }}
            />
          </Stack>
        </Box>
      </Card>

      {/* ✅ MENÚ DE ACCIONES ESPECÍFICO PARA HISTORIAL */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 12,
          sx: { 
            minWidth: 240,
            background: colorTokens.surfaceLevel3,
            border: `1px solid ${colorTokens.border}`,
            borderRadius: 2
          }
        }}
      >
        <MenuItem onClick={() => handleViewDetails(menuSale!)} sx={{ color: colorTokens.textPrimary }}>
          <Visibility sx={{ mr: 2, color: colorTokens.info }} />
          Ver Detalles Completos
        </MenuItem>
        
        <MenuItem onClick={() => handlePrintReceipt(menuSale!)} sx={{ color: colorTokens.textPrimary }}>
          <Print sx={{ mr: 2, color: colorTokens.success }} />
          Reimprimir Recibo
        </MenuItem>
        
        <Divider sx={{ borderColor: colorTokens.border, my: 1 }} />
        
        <MenuItem onClick={() => handleRefund(menuSale!)} sx={{ color: colorTokens.textPrimary }}>
          <Undo sx={{ mr: 2, color: colorTokens.warning }} />
          Procesar Devolución Completa
        </MenuItem>
        
        <MenuItem onClick={() => handleEditSale(menuSale!)} sx={{ color: colorTokens.textSecondary }}>
          <Edit sx={{ mr: 2, color: colorTokens.textMuted }} />
          Editar Información
        </MenuItem>
      </Menu>

      {/* ✅ DIALOGS PLACEHOLDER */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ 
          color: colorTokens.textPrimary, 
          bgcolor: colorTokens.surfaceLevel2,
          borderBottom: `1px solid ${colorTokens.border}`
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CheckCircle sx={{ color: colorTokens.success }} />
            Detalles de Venta Completada: {selectedSale?.sale_number}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: colorTokens.surfaceLevel1, p: 3 }}>
          {selectedSale && (
            <Box>
              <Typography variant="h6" sx={{ color: colorTokens.textPrimary, mb: 2 }}>
                Resumen de Transacción
              </Typography>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                    Tipo: {selectedSale.sale_type === 'sale' ? 'Venta Directa' : 'Apartado Completado'}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                    Total: {formatPrice(selectedSale.total_amount)}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                    Cliente: {selectedSale.customer_name}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                    Cajero: {selectedSale.cashier_name}
                  </Typography>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 3, borderColor: colorTokens.border }} />
              
              <Typography variant="body2" sx={{ color: colorTokens.textMuted, fontStyle: 'italic' }}>
                Implementar SaleDetailsDialog completo con productos, pagos y historial
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: colorTokens.surfaceLevel2, p: 2 }}>
          <Button 
            onClick={() => setDetailsOpen(false)} 
            sx={{ color: colorTokens.textSecondary }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          color: colorTokens.textPrimary, 
          bgcolor: colorTokens.surfaceLevel2,
          borderBottom: `1px solid ${colorTokens.border}`
        }}>
          Editar Información: {selectedSale?.sale_number}
        </DialogTitle>
        <DialogContent sx={{ bgcolor: colorTokens.surfaceLevel1, p: 3 }}>
          <Typography variant="body2" sx={{ color: colorTokens.textMuted, fontStyle: 'italic' }}>
            Implementar EditSaleDialog para modificar notas, referencias y datos no críticos
          </Typography>
        </DialogContent>
        <DialogActions sx={{ bgcolor: colorTokens.surfaceLevel2, p: 2 }}>
          <Button 
            onClick={() => setEditOpen(false)} 
            sx={{ color: colorTokens.textSecondary }}
          >
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  return hydrated ? mainContent : loadingContent;
});

SalesHistoryPage.displayName = 'SalesHistoryPage';

export default SalesHistoryPage;