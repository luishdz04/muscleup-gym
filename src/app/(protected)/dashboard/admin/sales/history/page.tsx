'use client';

import React, { useState, useCallback, useMemo, memo, useEffect, useRef } from 'react';
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
  CircularProgress,
  InputAdornment,
  Menu,
  SelectChangeEvent
} from '@mui/material';
import {
  Visibility,
  Cancel,
  CheckCircle,
  LocalMall,
  CalendarToday,
  AttachMoney,
  CreditCard,
  Refresh,
  Search,
  FilterList,
  MoreVert,
  Edit,
  Undo,
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
  formatTimestampShort,
  extractDateInMexico
} from '@/utils/dateUtils';
import { notify } from '@/utils/notifications';
import { useNotifications } from '@/hooks/useNotifications';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

// ✅ IMPORT DEL EDITDIALOG
import EditDialog from '@/components/pos/EditDialog';

// ✅ CONSTANTE FUERA DEL COMPONENTE PARA ESTABILIDAD
const SALES_SELECT_QUERY = `
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
`;

// ✅ TIPOS CORREGIDOS Y COMPLETOS v7.0
export type SaleStatus = 'pending' | 'completed' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'refunded';
export type SaleType = 'sale' | 'layaway';

// ✅ INTERFACES COMPLETAS SIN ANY
interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_amount?: number;
  tax_amount?: number;
  created_at: string;
}

interface SalePaymentDetail {
  id: string;
  sale_id: string;
  payment_method: string;
  amount: number;
  payment_reference?: string;
  commission_rate?: number;
  commission_amount?: number;
  sequence_order?: number;
  payment_date?: string;
  created_at: string;
  is_partial_payment?: boolean;
  payment_sequence?: number;
  notes?: string;
}

interface Customer {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  profilePictureUrl?: string;
}

interface Cashier {
  id: string;
  firstName: string;
  lastName?: string;
  profilePictureUrl?: string;
}

// ✅ SALE PRINCIPAL CON ESQUEMA BD MUSCLEUP (snake_case) - COMPATIBLE CON EDITDIALOG
interface Sale {
  id: string;
  sale_number: string;
  customer_id?: string;
  cashier_id: string;
  sale_type: SaleType;
  subtotal: number;
  tax_amount?: number;          // ✅ OPCIONAL PARA COMPATIBILIDAD
  discount_amount?: number;     // ✅ OPCIONAL PARA COMPATIBILIDAD
  coupon_discount?: number;     // ✅ OPCIONAL PARA COMPATIBILIDAD
  coupon_code?: string;
  total_amount: number;
  required_deposit?: number;
  paid_amount?: number;         // ✅ OPCIONAL PARA COMPATIBILIDAD
  pending_amount?: number;
  deposit_percentage?: number;
  layaway_expires_at?: string;
  status: SaleStatus;
  payment_status: PaymentStatus;
  is_mixed_payment?: boolean;   // ✅ OPCIONAL PARA COMPATIBILIDAD
  payment_received?: number;
  change_amount?: number;       // ✅ OPCIONAL PARA COMPATIBILIDAD
  commission_rate?: number;     // ✅ OPCIONAL PARA COMPATIBILIDAD
  commission_amount?: number;   // ✅ OPCIONAL PARA COMPATIBILIDAD
  notes?: string;
  receipt_printed?: boolean;
  created_at: string;
  completed_at?: string;
  updated_at: string;
  custom_commission_rate?: number;
  skip_inscription?: boolean;
  cancellation_date?: string;
  payment_plan_days?: number;
  initial_payment?: number;
  expiration_date?: string;
  last_payment_date?: string;
  cancellation_reason?: string;
  cancelled_by?: string;
  refund_amount?: number;
  refund_method?: string;
  cancellation_fee?: number;
  email_sent?: boolean;
  payment_date?: string;
  updated_by?: string;
}

// ✅ SALE CON RELACIONES EXTENDIDAS PARA HISTORIAL - COMPATIBLE CON EDITDIALOG
interface SaleWithRelations extends Sale {
  customer?: Customer;
  cashier?: Cashier;
  sale_items?: SaleItem[];
  sale_payment_details?: SalePaymentDetail[];
  // Campos calculados para display
  customer_name: string;
  cashier_name: string;  
  payment_method: string;
  items_count: number;
}

// ✅ FILTROS ESPECÍFICOS PARA HISTORIAL
interface HistoryFilters {
  sale_type: string;
  status: string;
  cashier_id: string;
  date_from: string;
  date_to: string;
  search: string;
}

// ✅ STATS AMPLIADAS CON KPIS FINANCIEROS REALES v7.0
interface HistoryStats {
  // Conteos básicos
  totalCompleted: number;
  directSalesCount: number;
  completedLayawayCount: number;  
  refundsCount: number;
  cancelledCount: number;
  
  // Métricas financieras core
  totalAmount: number;
  totalCommissions: number;
  averageTicket: number;
  todayTotal: number;
  
  // ✅ NUEVAS MÉTRICAS ENTERPRISE
  totalCancelledAmount: number;
  totalRefundedAmount: number;  
  netTotalAmount: number;
  cancellationRate: number;
  refundRate: number;
  averageCancellationTicket: number;
  averageRefundTicket: number;
  
  // Análisis de rendimiento
  conversionRate: number;
  netConversionRate: number;
  totalLostRevenue: number;
  
  paymentMethodBreakdown: Record<string, { count: number; amount: number }>;
}

// ✅ COMPONENTE CORREGIDO CON REFRESH Y SINCRONIZACIÓN PERFECTOS
const SalesHistoryPage = memo(() => {
  // ✅ HOOKS ENTERPRISE ORDENADOS
  const hydrated = useHydrated();
  const { addAuditFieldsFor } = useUserTracking();
  const { toast, alert } = useNotifications();
  const supabase = createBrowserSupabaseClient();

  // ✅ REF PARA EVITAR LOOPS EN EFFECTS
  const refreshInProgress = useRef(false);

  // ✅ ESTADOS PRINCIPALES
  const [allSales, setAllSales] = useState<SaleWithRelations[]>([]);
  const [globalSalesData, setGlobalSalesData] = useState<SaleWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ✅ ESTADOS ESPECÍFICOS PARA HISTORIAL CON PAGINACIÓN SERVIDOR
  const [filters, setFilters] = useState<HistoryFilters>({
    sale_type: 'all',
    status: 'all',
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
  const [totalCount, setTotalCount] = useState(0);

  // ✅ FUNCIÓN UNIFICADA PARA PROCESAR SALES - CORRECCIÓN PRINCIPAL v7.0
  const processSaleWithCalculatedFields = useCallback((rawSale: any): SaleWithRelations => {
    const customer = rawSale.customer;
    const cashier = rawSale.cashier;
    const paymentMethods = rawSale.sale_payment_details || [];
    const saleItems = rawSale.sale_items || [];
    
    return {
      ...rawSale,
      customer_name: customer 
        ? `${customer.firstName} ${customer.lastName || ''}`.trim()
        : 'Cliente General',
      cashier_name: cashier 
        ? `${cashier.firstName} ${cashier.lastName || ''}`.trim()
        : 'Sistema',
      payment_method: rawSale.is_mixed_payment 
        ? 'Mixto' 
        : paymentMethods[0]?.payment_method || 'Efectivo',
      items_count: saleItems.reduce((sum: number, item: SaleItem) => sum + item.quantity, 0)
    };
  }, []);

  // ✅ CARGAR STATS GLOBALES - USANDO FUNCIÓN UNIFICADA
  const loadGlobalStatsData = useCallback(async () => {
    try {
      let query = supabase
        .from('sales')
        .select(SALES_SELECT_QUERY)
        .in('status', ['completed', 'cancelled', 'refunded']);

      const { data, error } = await query;
      if (error) throw error;

      // ✅ USAR FUNCIÓN UNIFICADA PARA PROCESAR
      const processedData = (data || []).map(processSaleWithCalculatedFields);
      setGlobalSalesData(processedData);
      console.log(`✅ Stats globales: ${processedData.length} transacciones`);
    } catch (error) {
      console.error('Error cargando stats globales:', error);
      setGlobalSalesData([]);
    }
  }, [supabase, processSaleWithCalculatedFields]);

  // ✅ FUNCIÓN SEARCHITEMS - USANDO FUNCIÓN UNIFICADA
  const searchItemsWithServerFilters = useCallback(async (
    filterParams: Record<string, any> = {},
    pageNum: number = 0,
    pageSize: number = 20,
    returnTotalCount: boolean = false
  ) => {
    console.log(`🔍 Buscando: página=${pageNum}, filtros=`, filterParams);
    
    try {
      let query = supabase
        .from('sales')
        .select(SALES_SELECT_QUERY, { count: returnTotalCount ? 'exact' : undefined });

      // ✅ FILTRO BASE: SOLO ESTADOS PROCESADOS
      query = query.in('status', ['completed', 'cancelled', 'refunded']);

      // ✅ FILTROS SERVIDOR - CONSTRUCCIÓN INTELIGENTE
      Object.entries(filterParams).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== '') {
          switch (key) {
            case 'sale_type':
              query = query.eq('sale_type', value);
              break;
            case 'status':
              query = query.eq('status', value);
              break;
            case 'cashier_id':
              query = query.eq('cashier_id', value);
              break;
            case 'date_from':
              query = query.gte('created_at', `${value}T00:00:00.000Z`);
              break;
            case 'date_to':
              query = query.lte('created_at', `${value}T23:59:59.999Z`);
              break;
          }
        }
      });

      // ✅ PAGINACIÓN REAL EN SERVIDOR
      const from = pageNum * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      // ✅ ORDENAMIENTO POR TABLA SALES (snake_case)
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;
      
      if (error) throw error;

      // ✅ USAR FUNCIÓN UNIFICADA Y ACTUALIZAR ESTADO PRINCIPAL
      const processedData = (data || []).map(processSaleWithCalculatedFields);
      setAllSales(processedData);

      // ✅ ACTUALIZAR TOTAL COUNT SI SE SOLICITA
      if (returnTotalCount && count !== null) {
        setTotalCount(count);
      }

      console.log(`✅ Búsqueda completada: ${processedData.length} resultados de ${count || 'N/A'} total`);
      return processedData;
    } catch (error) {
      console.error('Error en searchItemsWithServerFilters:', error);
      setAllSales([]); // Reset en caso de error
      throw error;
    }
  }, [supabase, processSaleWithCalculatedFields]);

  // ✅ NUEVA LÓGICA: CARGAR STATS GLOBALES PRIMERO, LUEGO TABLA
  useEffect(() => {
    if (!hydrated) return;
    
    console.log('💧 Hidratado - cargando stats globales primero...');
    loadGlobalStatsData();
  }, [hydrated, loadGlobalStatsData]);

  // ✅ NUEVA LÓGICA: TABLA SE CARGA CUANDO YA TENEMOS DATOS GLOBALES
  useEffect(() => {
    // Solo proceder cuando tengamos stats globales (aunque sea array vacío)
    if (!hydrated || globalSalesData.length === 0) {
      console.log(`⏳ Esperando stats globales: hydrated=${hydrated}, globalSalesData=${globalSalesData.length}`);
      return;
    }
    
    console.log(`🔄 Stats globales listas (${globalSalesData.length}), cargando tabla...`);
    console.log(`📊 Página=${page}, Filtros=`, filters);
    
    const cargarTabla = async () => {
      setLoading(true);
      try {
        const serverFilters: Record<string, any> = {};
        if (filters.sale_type !== 'all') serverFilters.sale_type = filters.sale_type;
        if (filters.status !== 'all') serverFilters.status = filters.status;
        if (filters.cashier_id !== 'all') serverFilters.cashier_id = filters.cashier_id;
        if (filters.date_from) serverFilters.date_from = filters.date_from;
        if (filters.date_to) serverFilters.date_to = filters.date_to;

        await searchItemsWithServerFilters(serverFilters, page, rowsPerPage, true);
      } catch (error) {
        console.error('❌ Error cargando tabla:', error);
        notify.error("Error al cargar historial de ventas.");
      } finally {
        setLoading(false);
      }
    };
    
    cargarTabla();
  }, [hydrated, globalSalesData.length, filters, page, rowsPerPage, searchItemsWithServerFilters]);

  // ✅ PROCESAR SALES PARA DISPLAY - SIN FILTRADO DUPLICADO (YA PROCESADAS)
  const processedSales = useMemo(() => {
    // NO HAY FILTRADO AQUÍ - SOLO USAR LAS YA PROCESADAS
    return allSales;
  }, [allSales]);

  // ✅ FILTRADO SOLO PARA BÚSQUEDA (TEXTO) - INSTANTÁNEO
  const filteredSales = useMemo(() => {
    return processedSales.filter(sale => {
      // Solo filtro de búsqueda en cliente para UX instantánea
      if (filters.search.trim() && !sale.sale_number.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [processedSales, filters.search]);

  // ✅ CAJEROS DINÁMICOS - EXTRAÍDOS DE LAS VENTAS MOSTRADAS ACTUALMENTE
  const availableCashiers = useMemo(() => {
    // Obtener cajeros únicos de las ventas que se están mostrando
    const cashierMap = new Map<string, Cashier>();
    
    filteredSales.forEach(sale => {
      if (sale.cashier && sale.cashier.id) {
        cashierMap.set(sale.cashier.id, {
          id: sale.cashier.id,
          firstName: sale.cashier.firstName,
          lastName: sale.cashier.lastName,
          profilePictureUrl: sale.cashier.profilePictureUrl
        });
      }
    });
    
    // Convertir a array y ordenar
    const cashiersArray = Array.from(cashierMap.values()).sort((a, b) => 
      a.firstName.localeCompare(b.firstName)
    );
    
    console.log(`📊 Cajeros dinámicos extraídos: ${cashiersArray.length} de ${filteredSales.length} ventas`);
    return cashiersArray;
  }, [filteredSales]);

  // ✅ ESTADÍSTICAS GLOBALES - CORREGIDAS CON extractDateInMexico
  const globalStats = useMemo((): HistoryStats => {
    const today = getTodayInMexico();
    
    // ✅ CORRECCIÓN CRÍTICA: Usar extractDateInMexico para comparación precisa
    const todayTransactions = globalSalesData.filter((sale: SaleWithRelations) => {
      const saleDate = extractDateInMexico(sale.created_at);
      return saleDate === today;
    });

    // Separar por status para análisis detallado
    const completedSales = globalSalesData.filter((sale: SaleWithRelations) => sale.status === 'completed');
    const cancelledSales = globalSalesData.filter((sale: SaleWithRelations) => sale.status === 'cancelled');
    const refundedSales = globalSalesData.filter((sale: SaleWithRelations) => sale.status === 'refunded');
    
    // Métricas financieras básicas
    const totalAmount = completedSales.reduce((sum: number, sale: SaleWithRelations) => sum + sale.total_amount, 0);
    const totalCancelledAmount = cancelledSales.reduce((sum: number, sale: SaleWithRelations) => sum + sale.total_amount, 0);
    const totalRefundedAmount = refundedSales.reduce((sum: number, sale: SaleWithRelations) => sum + sale.total_amount, 0);
    
    // Análisis de rendimiento y conversión
    const totalTransactions = completedSales.length + cancelledSales.length + refundedSales.length;
    const successfulTransactions = completedSales.length;
    
    // ✅ CÁLCULO CORREGIDO DE TOTAL HOY
    const todayTotal = todayTransactions
      .filter((sale: SaleWithRelations) => sale.status === 'completed')
      .reduce((sum: number, sale: SaleWithRelations) => sum + sale.total_amount, 0);

    return {
      // Conteos básicos
      totalCompleted: completedSales.length,
      directSalesCount: completedSales.filter((sale: SaleWithRelations) => sale.sale_type === 'sale').length,
      completedLayawayCount: completedSales.filter((sale: SaleWithRelations) => sale.sale_type === 'layaway').length,
      refundsCount: refundedSales.length,
      cancelledCount: cancelledSales.length,
      
      // Métricas financieras core
      totalAmount,
      totalCommissions: completedSales.reduce((sum: number, sale: SaleWithRelations) => sum + (sale.commission_amount || 0), 0),
      averageTicket: completedSales.length > 0 ? totalAmount / completedSales.length : 0,
      todayTotal,
      
      // ✅ NUEVAS MÉTRICAS ENTERPRISE
      totalCancelledAmount,
      totalRefundedAmount,
      netTotalAmount: totalAmount - totalRefundedAmount,
      cancellationRate: totalTransactions > 0 ? (cancelledSales.length / totalTransactions) * 100 : 0,
      refundRate: successfulTransactions > 0 ? (refundedSales.length / successfulTransactions) * 100 : 0,
      averageCancellationTicket: cancelledSales.length > 0 ? totalCancelledAmount / cancelledSales.length : 0,
      averageRefundTicket: refundedSales.length > 0 ? totalRefundedAmount / refundedSales.length : 0,
      
      // Análisis de rendimiento
      conversionRate: totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0,
      netConversionRate: totalTransactions > 0 ? ((successfulTransactions - refundedSales.length) / totalTransactions) * 100 : 0,
      totalLostRevenue: totalCancelledAmount + totalRefundedAmount,
      
      paymentMethodBreakdown: globalSalesData.reduce((breakdown: Record<string, { count: number; amount: number }>, sale: SaleWithRelations) => {
        const method = sale.payment_method;
        if (!breakdown[method]) {
          breakdown[method] = { count: 0, amount: 0 };
        }
        breakdown[method].count++;
        breakdown[method].amount += sale.total_amount;
        return breakdown;
      }, {})
    };
  }, [globalSalesData]);

  // ✅ ESTADÍSTICAS CONTEXTUALES - CORREGIDAS CON extractDateInMexico
  const contextualStats = useMemo((): HistoryStats => {
    const today = getTodayInMexico();
    
    const todayTransactions = filteredSales.filter((sale: SaleWithRelations) => {
      const saleDate = extractDateInMexico(sale.created_at);
      return saleDate === today;
    });

    // Separar por status para análisis detallado - FILTRADOS
    const completedSales = filteredSales.filter((sale: SaleWithRelations) => sale.status === 'completed');
    const cancelledSales = filteredSales.filter((sale: SaleWithRelations) => sale.status === 'cancelled');
    const refundedSales = filteredSales.filter((sale: SaleWithRelations) => sale.status === 'refunded');
    
    // Métricas financieras básicas - FILTRADAS
    const totalAmount = completedSales.reduce((sum: number, sale: SaleWithRelations) => sum + sale.total_amount, 0);
    const totalCancelledAmount = cancelledSales.reduce((sum: number, sale: SaleWithRelations) => sum + sale.total_amount, 0);
    const totalRefundedAmount = refundedSales.reduce((sum: number, sale: SaleWithRelations) => sum + sale.total_amount, 0);
    
    // Análisis de rendimiento y conversión - FILTRADOS
    const totalTransactions = completedSales.length + cancelledSales.length + refundedSales.length;
    const successfulTransactions = completedSales.length;
    
    return {
      // Conteos básicos - FILTRADOS
      totalCompleted: completedSales.length,
      directSalesCount: completedSales.filter((sale: SaleWithRelations) => sale.sale_type === 'sale').length,
      completedLayawayCount: completedSales.filter((sale: SaleWithRelations) => sale.sale_type === 'layaway').length,
      refundsCount: refundedSales.length,
      cancelledCount: cancelledSales.length,
      
      // Métricas financieras core - FILTRADAS
      totalAmount,
      totalCommissions: completedSales.reduce((sum: number, sale: SaleWithRelations) => sum + (sale.commission_amount || 0), 0),
      averageTicket: completedSales.length > 0 ? totalAmount / completedSales.length : 0,
      todayTotal: todayTransactions
        .filter((sale: SaleWithRelations) => sale.status === 'completed')
        .reduce((sum: number, sale: SaleWithRelations) => sum + sale.total_amount, 0),
      
      // ✅ NUEVAS MÉTRICAS ENTERPRISE - FILTRADAS
      totalCancelledAmount,
      totalRefundedAmount,
      netTotalAmount: totalAmount - totalRefundedAmount,
      cancellationRate: totalTransactions > 0 ? (cancelledSales.length / totalTransactions) * 100 : 0,
      refundRate: successfulTransactions > 0 ? (refundedSales.length / successfulTransactions) * 100 : 0,
      averageCancellationTicket: cancelledSales.length > 0 ? totalCancelledAmount / cancelledSales.length : 0,
      averageRefundTicket: refundedSales.length > 0 ? totalRefundedAmount / refundedSales.length : 0,
      
      // Análisis de rendimiento - FILTRADOS
      conversionRate: totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0,
      netConversionRate: totalTransactions > 0 ? ((successfulTransactions - refundedSales.length) / totalTransactions) * 100 : 0,
      totalLostRevenue: totalCancelledAmount + totalRefundedAmount,
      
      paymentMethodBreakdown: filteredSales.reduce((breakdown: Record<string, { count: number; amount: number }>, sale: SaleWithRelations) => {
        const method = sale.payment_method;
        if (!breakdown[method]) {
          breakdown[method] = { count: 0, amount: 0 };
        }
        breakdown[method].count++;
        breakdown[method].amount += sale.total_amount;
        return breakdown;
      }, {})
    };
  }, [filteredSales]);

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

  // ✅ ACTUALIZAR FILTROS CON RESET DE PÁGINA
  const updateFiltersWithPageReset = useCallback((newFilters: Partial<HistoryFilters>) => {
    setPage(0); // ✅ CRÍTICO: Resetear página antes de cambiar filtros
    setFilters(prev => ({ ...prev, ...newFilters }));
    console.log('🔄 Filtros actualizados, página reseteada:', newFilters);
  }, []);

  // ✅ MANEJADOR DE BÚSQUEDA INSTANTÁNEA (SIN RESET DE PÁGINA)
  const handleSearchChange = useCallback((searchValue: string) => {
    setFilters(prev => ({ ...prev, search: searchValue }));
    // NO resetear página para búsqueda - es filtro instantáneo cliente
  }, []);

  // ✅ LIMPIAR FILTROS
  const clearFilters = useCallback(() => {
    setFilters({
      sale_type: 'all',
      status: 'all',
      cashier_id: 'all',
      date_from: '',
      date_to: '',
      search: ''
    });
    setPage(0);
    notify.success('Filtros limpiados');
  }, []);

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

  // ✅ UPDATE ITEM CON AUDITORÍA sales (updated_only)
  const updateItem = useCallback(async (saleId: string, updates: Partial<Sale>) => {
    try {
      // Aplicar auditoría para tabla sales (updated_only)
      const dataWithAudit = await addAuditFieldsFor('sales', updates, true);
      
      const { data, error } = await supabase
        .from('sales')
        .update(dataWithAudit)
        .eq('id', saleId)
        .select(SALES_SELECT_QUERY)
        .single();
        
      if (error) throw error;
      
      // ✅ CORRECCIÓN CRÍTICA: FUSIÓN DE ESTADO EN LUGAR DE REEMPLAZO
      const processedSale = processSaleWithCalculatedFields(data);
      setAllSales(prev => prev.map(sale => 
        sale.id === saleId ? { ...sale, ...processedSale } : sale
      ));
      
      return data;
    } catch (error) {
      console.error('Error actualizando venta:', error);
      throw error;
    }
  }, [supabase, addAuditFieldsFor, processSaleWithCalculatedFields]);

  // ✅ FUNCIÓN HELPER: OBTENER ITEMS DE VENTA
  const getSaleItems = useCallback(async (saleId: string): Promise<SaleItem[]> => {
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
  ): Promise<{ productName: string; newStock: number }> => {
    try {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('current_stock, name')
        .eq('id', saleItem.product_id)
        .single();
      
      if (productError) throw productError;
      
      const newStock = movementType === 'entrada' 
        ? productData.current_stock + saleItem.quantity 
        : productData.current_stock;
      
      // Crear movimiento sin auditoría (inventory_movements = none)
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

  // ✅ ACTUALIZAR STOCK FÍSICO CON AUDITORÍA products (full_snake)
  const updateProductStock = useCallback(async (productId: string, quantityToAdd: number): Promise<void> => {
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

  // ✅ FUNCIÓN REFRESH CORREGIDA - RECARGA DIRECTA SIN TRUCOS
  const refreshData = useCallback(async () => {
    if (refreshInProgress.current) {
      console.log('⏳ Refresh ya en progreso, omitiendo...');
      return;
    }

    console.log('🔄 Refresh manual iniciado...');
    refreshInProgress.current = true;
    
    try {
      // 1. Recargar stats globales PRIMERO
      await loadGlobalStatsData();
      
      // 2. Recargar tabla con parámetros actuales DIRECTAMENTE
      const serverFilters: Record<string, any> = {};
      if (filters.sale_type !== 'all') serverFilters.sale_type = filters.sale_type;
      if (filters.status !== 'all') serverFilters.status = filters.status;
      if (filters.cashier_id !== 'all') serverFilters.cashier_id = filters.cashier_id;
      if (filters.date_from) serverFilters.date_from = filters.date_from;
      if (filters.date_to) serverFilters.date_to = filters.date_to;

      await searchItemsWithServerFilters(serverFilters, page, rowsPerPage, true);
      
      notify.success('Historial actualizado correctamente');
    } catch (error) {
      notify.error('Error al actualizar historial');
      console.error('❌ Error en refresh:', error);
    } finally {
      refreshInProgress.current = false;
    }
  }, [loadGlobalStatsData, filters, page, rowsPerPage, searchItemsWithServerFilters]);

  // ✅ FUSIÓN DE ESTADO CORREGIDA - CORRECCIÓN PRINCIPAL v7.0
  const updateSaleInLocalState = useCallback((updatedSale: SaleWithRelations) => {
    console.log('🔄 Actualizando venta en estado local (método corregido):', updatedSale.sale_number);
    
    // ✅ FUSIÓN CORREGIDA: { ...sale, ...updatedSale }
    const merger = (sale: SaleWithRelations) => 
      sale.id === updatedSale.id 
        ? { ...sale, ...updatedSale } // ✅ FUSIONA el objeto viejo con el nuevo
        : sale;

    setAllSales(prev => prev.map(merger));
    setGlobalSalesData(prev => prev.map(merger));
    
    console.log('✅ Venta actualizada en ambos estados locales');
  }, []);

  // ✅ CALLBACK MEJORADO PARA EDITDIALOG - CON ACTUALIZACIÓN INMEDIATA
  const handleEditSuccess = useCallback((updatedSale?: SaleWithRelations) => {
    console.log('✅ Callback de éxito del EditDialog ejecutado');
    
    if (updatedSale) {
      console.log('📝 Actualizando venta local inmediatamente:', updatedSale.sale_number);
      updateSaleInLocalState(updatedSale);
    }
    
    // Opcional: refresh completo en background para garantizar sincronización
    setTimeout(() => {
      refreshData();
    }, 1000);
    
    notify.success('Venta actualizada correctamente en el historial');
  }, [updateSaleInLocalState, refreshData]);

  // ✅ FUNCIÓN UNIFICADA: PROCESAR CANCELACIÓN/DEVOLUCIÓN CON RESTAURACIÓN DE INVENTARIO
  const processTransactionReversal = useCallback(async (
    sale: SaleWithRelations, 
    actionType: 'cancel' | 'refund'
  ) => {
    const isLayaway = sale.sale_type === 'layaway';
    const actionName = actionType === 'cancel' ? 'cancelación' : 'devolución';
    
    const confirmed = await alert.confirm(
      `¿Confirmar ${actionName} de ${sale.sale_number}?\n\n` +
      `Tipo: ${isLayaway ? 'Apartado Completado' : 'Venta Directa'}\n` +
      `Monto: ${formatPrice(sale.total_amount)}\n\n` +
      `Esta acción:\n` +
      `• Cambiará el status de la transacción\n` +
      `• Restaurará el inventario físico automáticamente\n` +
      `• No se puede deshacer\n\n` +
      `¿Continuar?`
    );

    if (!confirmed) return;

    const progressToast = notify.loading(`Procesando ${actionName}...`);

    try {
      // 1. Obtener productos de la venta
      const saleItems = await getSaleItems(sale.id);
      
      if (saleItems.length === 0) {
        notify.dismiss(progressToast);
        notify.warning('La venta no tiene productos registrados');
        return;
      }

      const restoredProducts = [];

      // 2. Restaurar inventario físico para todos los productos
      for (const item of saleItems) {
        try {
          const result = await createInventoryMovement(
            item, 
            `${actionName.charAt(0).toUpperCase() + actionName.slice(1)} ${sale.sale_number}`,
            'entrada'
          );
          await updateProductStock(item.product_id, item.quantity);
          
          restoredProducts.push({
            name: result.productName,
            quantity: item.quantity,
            newStock: result.newStock
          });
        } catch (error) {
          console.error(`Error restaurando producto ${item.product_name}:`, error);
          throw new Error(`Error restaurando ${item.product_name}: ${(error as Error).message}`);
        }
      }

      // 3. Actualizar status de venta con auditoría sales (updated_only)
      const statusUpdate = actionType === 'cancel' ? 'cancelled' : 'refunded';
      const reason = prompt(`Motivo de la ${actionName} (opcional):`) || `${actionName.charAt(0).toUpperCase() + actionName.slice(1)} procesada`;

      await updateItem(sale.id, {
        status: statusUpdate as SaleStatus,
        payment_status: 'refunded' as PaymentStatus,
        cancellation_date: getCurrentTimestamp(),
        cancellation_reason: `${actionName.charAt(0).toUpperCase() + actionName.slice(1)} - ${reason}`,
        refund_amount: sale.total_amount,
        refund_method: 'efectivo'
      });

      notify.dismiss(progressToast);
      
      const productsList = restoredProducts
        .map(p => `• ${p.name}: +${p.quantity} unidades`)
        .join('\n');
      
      notify.success(
        `${actionName.charAt(0).toUpperCase() + actionName.slice(1)} procesada exitosamente\n\n` +
        `${sale.sale_number}\n` +
        `Monto: ${formatPrice(sale.total_amount)}\n\n` +
        `Inventario restaurado:\n${productsList}`
      );

      await refreshData();
      
    } catch (error) {
      notify.dismiss(progressToast);
      notify.error(`Error en ${actionName}: ${(error as Error).message}`);
      console.error(`Error completo en ${actionName}:`, error);
    }
    handleMenuClose();
  }, [alert, getSaleItems, createInventoryMovement, updateProductStock, updateItem, refreshData, handleMenuClose, formatPrice]);

  // ✅ FUNCIONES SIMPLIFICADAS QUE USAN LA LÓGICA UNIFICADA
  const handleRefund = useCallback(async (sale: SaleWithRelations) => {
    await processTransactionReversal(sale, 'refund');
  }, [processTransactionReversal]);

  const handleCancelSale = useCallback(async (sale: SaleWithRelations) => {
    await processTransactionReversal(sale, 'cancel');
  }, [processTransactionReversal]);

  // ✅ REFRESH MANUAL - BOTÓN CON PROTECCIÓN ANTI-SPAM
  const handleRefresh = useCallback(async () => {
    if (refreshInProgress.current) {
      notify.warning('Actualización ya en progreso...');
      return;
    }
    
    const toastId = notify.loading('Actualizando historial de ventas...');
    
    try {
      await refreshData();
      notify.dismiss(toastId);
      notify.success('Historial actualizado - datos refrescados');
    } catch (error) {
      notify.dismiss(toastId);
      notify.error('Error al actualizar historial');
      console.error('Error en refresh:', error);
    }
  }, [refreshData]);

  // ✅ PAGINACIÓN SIMPLIFICADA - SOLO CAMBIAR ESTADO, useEffect MAESTRO MANEJA EL RESTO
  const handleChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage - 1);
  }, []);

  // ✅ CAMBIO DE FILAS POR PÁGINA SIMPLIFICADO CON RESET
  const handleChangeRowsPerPage = useCallback((event: SelectChangeEvent<number>) => {
    setRowsPerPage(event.target.value as number);
    setPage(0); // ✅ CRÍTICO: Resetear página
    console.log(`📄 Cambiando filas por página: ${event.target.value}, página reseteada a 0`);
  }, []);

  // ✅ SSR SAFETY CON BRANDING MUSCLEUP
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
          Inicializando historial de ventas procesadas
        </Typography>
      </Box>
    );
  }

  // ✅ CONTENIDO PRINCIPAL
  return (
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
              Historial de Ventas Procesadas
            </Typography>
            <Typography variant="body1" sx={{ 
              color: colorTokens.textSecondary
            }}>
              Transacciones completadas, canceladas y devueltas - Análisis enterprise
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
            },
            '&:disabled': { opacity: 0.6 }
          }}
        >
          {loading ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </Box>

      {/* ✅ ESTADÍSTICAS ENTERPRISE AMPLIADAS - BASADAS EN GLOBALSTATS */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Card 1: Ventas Completadas con Desglose */}
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
                  {globalStats.totalCompleted}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Ventas Completadas
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>
                  {globalStats.directSalesCount} directas • {globalStats.completedLayawayCount} apartados
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.7rem' }}>
                  Conversión: {globalStats.conversionRate.toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Card 2: Ingresos con Protagonismo al NETO */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <motion.div whileHover={{ scale: 1.02 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
              color: colorTokens.textOnBrand,
              borderRadius: 3,
              position: 'relative',
              overflow: 'visible'
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <AttachMoney sx={{ fontSize: 40, mb: 1 }} />
                
                {/* Ingreso NETO - Lo más importante */}
                <Typography variant="h3" fontWeight="bold" sx={{ mb: 0.5 }}>
                  {formatPrice(globalStats.netTotalAmount)}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1, fontWeight: 600 }}>
                  Ingreso Real (Neto)
                </Typography>
                
                {/* Ingreso Bruto - Secundario */}
                <Typography variant="caption" sx={{ opacity: 0.9, display: 'block', mb: 0.5 }}>
                  Bruto: {formatPrice(globalStats.totalAmount)}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.7rem' }}>
                  Hoy: {formatPrice(globalStats.todayTotal)}
                </Typography>
                
                {/* Badge indicador de efectividad */}
                <Box sx={{ 
                  position: 'absolute', 
                  top: 8, 
                  right: 8, 
                  backgroundColor: 'rgba(255,255,255,0.2)', 
                  borderRadius: 2, 
                  px: 1, 
                  py: 0.5 
                }}>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700 }}>
                    {((globalStats.netTotalAmount / globalStats.totalAmount) * 100 || 0).toFixed(0)}% Neto
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Card 3: Costos de Transacción */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <motion.div whileHover={{ scale: 1.02 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.warning}, ${colorTokens.brandActive})`,
              color: colorTokens.textOnBrand,
              borderRadius: 3
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <CreditCard sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                  {formatPrice(globalStats.totalCommissions)}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Costos de Transacción
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>
                  Comisiones pagadas por métodos de pago
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.7rem' }}>
                  Promedio: {globalStats.totalCompleted > 0 ? formatPrice(globalStats.totalCommissions / globalStats.totalCompleted) : '$0'} por venta
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Card 4: KPIs de Rendimiento Empresarial */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <motion.div whileHover={{ scale: 1.02 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.info}, ${colorTokens.infoHover})`,
              color: colorTokens.textPrimary,
              borderRadius: 3,
              position: 'relative'
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Analytics sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                  {formatPrice(globalStats.averageTicket)}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Ticket Promedio
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>
                  Conversión: {globalStats.conversionRate.toFixed(1)}%
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.7rem' }}>
                  Retención Final: {globalStats.netConversionRate.toFixed(1)}%
                </Typography>
                
                {/* Indicador de salud del negocio */}
                {globalStats.netConversionRate >= 85 ? (
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 8, 
                    right: 8, 
                    backgroundColor: colorTokens.success, 
                    borderRadius: '50%', 
                    width: 12, 
                    height: 12 
                  }} />
                ) : globalStats.netConversionRate >= 70 ? (
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 8, 
                    right: 8, 
                    backgroundColor: colorTokens.warning, 
                    borderRadius: '50%', 
                    width: 12, 
                    height: 12 
                  }} />
                ) : (
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 8, 
                    right: 8, 
                    backgroundColor: colorTokens.danger, 
                    borderRadius: '50%', 
                    width: 12, 
                    height: 12 
                  }} />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* ✅ NUEVA SECCIÓN: ANÁLISIS DETALLADO DE RENDIMIENTO FINANCIERO */}
      <Card sx={{ 
        mb: 4,
        background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
        border: `1px solid ${colorTokens.border}`,
        borderRadius: 3
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Assessment sx={{ color: colorTokens.brand }} />
            <Typography variant="h6" sx={{ 
              color: colorTokens.textPrimary,
              fontWeight: 700
            }}>
              Análisis Financiero Enterprise - Panorama General
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h6" sx={{ color: colorTokens.warning, fontWeight: 700 }}>
                  {formatPrice(globalStats.totalCommissions)}
                </Typography>
                <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                  Comisiones Generadas
                </Typography>
                <Typography variant="caption" sx={{ color: colorTokens.textMuted }}>
                  De {globalStats.totalCompleted} ventas completadas
                </Typography>
              </Box>
            </Grid>
            
            <Grid size={{ xs: 12, md: 3 }}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h6" sx={{ color: colorTokens.danger, fontWeight: 700 }}>
                  {globalStats.cancellationRate.toFixed(1)}%
                </Typography>
                <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                  Tasa Cancelación
                </Typography>
                <Typography variant="caption" sx={{ color: colorTokens.textMuted }}>
                  Ticket promedio: {formatPrice(globalStats.averageCancellationTicket)}
                </Typography>
              </Box>
            </Grid>
            
            <Grid size={{ xs: 12, md: 3 }}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h6" sx={{ color: colorTokens.info, fontWeight: 700 }}>
                  {globalStats.refundRate.toFixed(1)}%
                </Typography>
                <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                  Tasa Devolución
                </Typography>
                <Typography variant="caption" sx={{ color: colorTokens.textMuted }}>
                  Ticket promedio: {formatPrice(globalStats.averageRefundTicket)}
                </Typography>
              </Box>
            </Grid>
            
            <Grid size={{ xs: 12, md: 3 }}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h6" sx={{ color: colorTokens.success, fontWeight: 700 }}>
                  {globalStats.totalAmount > 0 ? ((globalStats.netTotalAmount / globalStats.totalAmount) * 100).toFixed(1) : '0.0'}%
                </Typography>
                <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                  Retención Neta
                </Typography>
                <Typography variant="caption" sx={{ color: colorTokens.textMuted }}>
                  Ingresos realmente retenidos
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ✅ SECCIÓN CONTEXTUAL: ANÁLISIS DEL SUBSET FILTRADO */}
      {(filters.search !== '' || filters.sale_type !== 'all' || filters.status !== 'all' || 
        filters.cashier_id !== 'all' || filters.date_from !== '' || filters.date_to !== '') && (
        <Card sx={{ 
          mb: 4,
          background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
          border: `2px solid ${colorTokens.brand}`,
          borderRadius: 3
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <FilterList sx={{ color: colorTokens.brand }} />
              <Typography variant="h6" sx={{ 
                color: colorTokens.textPrimary,
                fontWeight: 700
              }}>
                Análisis Contextual - Filtros Aplicados ({filteredSales.length} transacciones)
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              <Grid size={{ xs: 6, md: 2 }}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h6" sx={{ color: colorTokens.success, fontWeight: 700 }}>
                    {contextualStats.totalCompleted}
                  </Typography>
                  <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                    Completadas
                  </Typography>
                </Box>
              </Grid>
              
              <Grid size={{ xs: 6, md: 2 }}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h6" sx={{ color: colorTokens.brand, fontWeight: 700 }}>
                    {formatPrice(contextualStats.totalAmount)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                    Ingresos
                  </Typography>
                </Box>
              </Grid>
              
              <Grid size={{ xs: 6, md: 2 }}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h6" sx={{ color: colorTokens.danger, fontWeight: 700 }}>
                    {contextualStats.cancelledCount}
                  </Typography>
                  <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                    Canceladas
                  </Typography>
                </Box>
              </Grid>
              
              <Grid size={{ xs: 6, md: 2 }}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h6" sx={{ color: colorTokens.info, fontWeight: 700 }}>
                    {contextualStats.refundsCount}
                  </Typography>
                  <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                    Devueltas
                  </Typography>
                </Box>
              </Grid>
              
              <Grid size={{ xs: 6, md: 2 }}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h6" sx={{ color: colorTokens.warning, fontWeight: 700 }}>
                    {formatPrice(contextualStats.averageTicket)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                    Ticket Promedio
                  </Typography>
                </Box>
              </Grid>
              
              <Grid size={{ xs: 6, md: 2 }}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h6" sx={{ color: colorTokens.success, fontWeight: 700 }}>
                    {contextualStats.conversionRate.toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                    Conversión
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

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
              Filtros de Análisis - Aplicación en Tiempo Real
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Buscar por número"
                placeholder="MUP-2025-001..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
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
                  onChange={(e) => updateFiltersWithPageReset({ sale_type: e.target.value })}
                  label="Tipo"
                  sx={{
                    color: colorTokens.textPrimary,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: colorTokens.border }
                  }}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="sale">Ventas Directas</MenuItem>
                  <MenuItem value="layaway">Apartados</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 6, md: 1.5 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colorTokens.textSecondary }}>Estado</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => updateFiltersWithPageReset({ status: e.target.value })}
                  label="Estado"
                  sx={{
                    color: colorTokens.textPrimary,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: colorTokens.border }
                  }}
                >
                  <MenuItem value="all">Todos los Estados</MenuItem>
                  <MenuItem value="completed">Completadas</MenuItem>
                  <MenuItem value="cancelled">Canceladas</MenuItem>
                  <MenuItem value="refunded">Devueltas</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 6, md: 2 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colorTokens.textSecondary }}>Cajero</InputLabel>
                <Select
                  value={filters.cashier_id}
                  onChange={(e) => updateFiltersWithPageReset({ cashier_id: e.target.value })}
                  label="Cajero"
                  sx={{
                    color: colorTokens.textPrimary,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: colorTokens.border }
                  }}
                >
                  <MenuItem value="all">
                    Todos los Cajeros ({availableCashiers.length})
                  </MenuItem>
                  {availableCashiers.map((cashier) => (
                    <MenuItem key={cashier.id} value={cashier.id}>
                      {cashier.firstName} {cashier.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 6, md: 1.75 }}>
              <TextField
                fullWidth
                type="date"
                label="Desde"
                value={filters.date_from}
                onChange={(e) => updateFiltersWithPageReset({ date_from: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiInputLabel-root': { color: colorTokens.textSecondary },
                  '& .MuiOutlinedInput-root': { color: colorTokens.textPrimary }
                }}
              />
            </Grid>

            <Grid size={{ xs: 6, md: 1.75 }}>
              <TextField
                fullWidth
                type="date"
                label="Hasta"
                value={filters.date_to}
                onChange={(e) => updateFiltersWithPageReset({ date_to: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiInputLabel-root': { color: colorTokens.textSecondary },
                  '& .MuiOutlinedInput-root': { color: colorTokens.textPrimary }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 0.5 }}>
              <Button
                variant="outlined"
                onClick={clearFilters}
                disabled={loading}
                sx={{ 
                  height: '56px',
                  minWidth: 'unset',
                  color: colorTokens.textSecondary,
                  borderColor: colorTokens.border,
                  '&:hover': {
                    borderColor: colorTokens.danger,
                    color: colorTokens.danger,
                    backgroundColor: `${colorTokens.danger}10`
                  },
                  '&:disabled': { opacity: 0.6 }
                }}
              >
                ✕
              </Button>
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
                  Fecha/Estado
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
                {filteredSales.map((sale: SaleWithRelations, index: number) => (
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
                        {sale.status === 'completed' && <CheckCircle sx={{ color: colorTokens.success, fontSize: 16 }} />}
                        {sale.status === 'cancelled' && <Cancel sx={{ color: colorTokens.danger, fontSize: 16 }} />}
                        {sale.status === 'refunded' && <Undo sx={{ color: colorTokens.info, fontSize: 16 }} />}
                        <Typography variant="body2" fontWeight="600" sx={{ color: colorTokens.brand }}>
                          {sale.sale_number}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          {formatTimestampShort(sale.completed_at || sale.updated_at)}
                        </Typography>
                        <Chip 
                          label={sale.status}
                          size="small" 
                          sx={{
                            backgroundColor: getStatusColor(sale.status),
                            color: colorTokens.textPrimary,
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            mt: 0.5
                          }}
                        />
                      </Box>
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
                        color: sale.commission_amount && sale.commission_amount > 0 ? colorTokens.warning : colorTokens.textMuted
                      }}>
                        {sale.commission_amount && sale.commission_amount > 0 ? formatPrice(sale.commission_amount) : '-'}
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
                      Cargando historial...
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

              {filteredSales.length === 0 && !loading && (
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
                        No se encontraron transacciones procesadas
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

        {/* ✅ PAGINACIÓN SERVIDOR */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          background: `${colorTokens.surfaceLevel1}40`,
          borderTop: `1px solid ${colorTokens.border}`
        }}>
          <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
            Mostrando {Math.min(page * rowsPerPage + 1, totalCount)} - {Math.min((page + 1) * rowsPerPage, totalCount)} de {totalCount} transacciones
            {filteredSales.length < totalCount && (
              <span> (búsqueda filtrada: {filteredSales.length})</span>
            )}
          </Typography>
          
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
              Filas por página:
            </Typography>
            <Select
              value={rowsPerPage}
              onChange={handleChangeRowsPerPage}
              disabled={loading}
              size="small"
              sx={{
                color: colorTokens.textPrimary,
                '& .MuiOutlinedInput-notchedOutline': { 
                  borderColor: colorTokens.border 
                },
                minWidth: '80px',
                '&.Mui-disabled': { opacity: 0.6 }
              }}
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </Select>
            
            <Pagination
              count={Math.ceil(totalCount / rowsPerPage)}
              page={page + 1}
              onChange={handleChangePage}
              disabled={loading}
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
                  },
                  '&.Mui-disabled': {
                    opacity: 0.4
                  }
                }
              }}
            />
          </Stack>
        </Box>
      </Card>

      {/* ✅ MENÚ DE ACCIONES SIMPLIFICADO - AMBAS ACCIONES RESTAURAN INVENTARIO */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 12,
          sx: { 
            minWidth: 250,
            background: colorTokens.surfaceLevel3,
            border: `1px solid ${colorTokens.border}`,
            borderRadius: 2
          }
        }}
      >
        <MenuItem onClick={() => menuSale && handleViewDetails(menuSale)} sx={{ color: colorTokens.textPrimary }}>
          <Visibility sx={{ mr: 2, color: colorTokens.info }} />
          Ver Detalles Completos
        </MenuItem>
        
        <Divider sx={{ borderColor: colorTokens.border, my: 1 }} />
        
        {/* ✅ ACCIONES SIMPLIFICADAS PARA VENTAS COMPLETADAS - SOLO COMPLETED STATUS */}
        {menuSale?.status === 'completed' && [
          <MenuItem 
            key="refund" 
            onClick={() => menuSale && handleRefund(menuSale)} 
            sx={{ 
              color: colorTokens.textPrimary,
              '&:hover': { backgroundColor: `${colorTokens.warning}20` }
            }}
          >
            <Undo sx={{ mr: 2, color: colorTokens.warning }} />
            Procesar Devolución
          </MenuItem>,
          <MenuItem 
            key="cancel" 
            onClick={() => menuSale && handleCancelSale(menuSale)} 
            sx={{ 
              color: colorTokens.textPrimary,
              '&:hover': { backgroundColor: `${colorTokens.danger}20` }
            }}
          >
            <Cancel sx={{ mr: 2, color: colorTokens.danger }} />
            Cancelar Venta
          </MenuItem>
        ]}
        
        <MenuItem onClick={() => menuSale && handleEditSale(menuSale)} sx={{ color: colorTokens.textSecondary }}>
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
            Detalles de Transacción: {selectedSale?.sale_number}
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
                    Tipo: {selectedSale.sale_type === 'sale' ? 'Venta Directa' : 'Apartado'}
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

      {/* ✅ EDITDIALOG CONECTADO CON CALLBACK MEJORADO */}
      <EditDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        sale={selectedSale}
        onSuccess={handleEditSuccess}
      />
    </Box>
  );
});

SalesHistoryPage.displayName = 'SalesHistoryPage';

export default SalesHistoryPage;