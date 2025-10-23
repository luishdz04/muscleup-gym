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
  SelectChangeEvent,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import {
  Visibility,
  Cancel,
  CheckCircle,
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
  History,
  Delete,
  Warning
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// ✅ IMPORTS ENTERPRISE ESTÁNDAR MUSCLEUP v7.2
import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { useUserTracking } from '@/hooks/useUserTracking';
import { 
  getCurrentTimestamp,
  formatTimestampShort,
  extractDateInMexico,
  getTodayInMexico
} from '@/utils/dateUtils';
import { notify } from '@/utils/notifications';
import { useNotifications } from '@/hooks/useNotifications';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

// ✅ IMPORT DEL EDITDIALOG
import EditDialog from '@/components/pos/EditDialog';
import SaleDetailsDialog from '@/components/dialogs/SaleDetailsDialog';

// SWEETALERT2 para confirmaciones de eliminación
import MySwal, { showDeleteConfirmation } from '@/lib/notifications/MySwal';


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

// ✅ TIPOS CORREGIDOS Y COMPLETOS v7.2
export type SaleStatus = 'pending' | 'completed' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'refunded';
export type SaleType = 'sale' | 'layaway';

// ✅ INTERFACES COMPLETAS
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

// ✅ SALE PRINCIPAL v7.2
interface Sale {
  id: string;
  sale_number: string;
  customer_id?: string;
  cashier_id: string;
  sale_type: SaleType;
  source_warehouse_id?: string;
  subtotal: number;
  tax_amount?: number;
  discount_amount?: number;
  coupon_discount?: number;
  coupon_code?: string;
  total_amount: number;
  required_deposit?: number;
  paid_amount?: number;
  pending_amount?: number;
  deposit_percentage?: number;
  layaway_expires_at?: string;
  status: SaleStatus;
  payment_status: PaymentStatus;
  is_mixed_payment?: boolean;
  payment_received?: number;
  change_amount?: number;
  commission_rate?: number;
  commission_amount?: number;
  notes?: string;
  receipt_printed?: boolean;
  created_at: string;
  completed_at?: string;
  updated_at: string;
  custom_commission_rate?: number;
  skip_inscription?: boolean;
  cancelled_at?: string;
  cancel_reason?: string;
  payment_plan_days?: number;
  initial_payment?: number;
  expiration_date?: string;
  last_payment_date?: string;
  cancelled_by?: string;
  refund_amount?: number;
  refund_method?: string;
  cancellation_fee?: number;
  email_sent?: boolean;
  payment_date?: string;
  updated_by?: string;
}

interface SaleWithRelations extends Sale {
  customer?: Customer;
  cashier?: Cashier;
  sale_items?: SaleItem[];
  sale_payment_details?: SalePaymentDetail[];
  customer_name: string;
  cashier_name: string;  
  payment_method: string;
  items_count: number;
}

// ✅ FILTROS v7.2 (SIN status - manejado por pestañas)
interface HistoryFilters {
  cashier_id: string;
  date_from: string;
  date_to: string;
  search: string;
}

// ✅ STATS v7.2
interface HistoryStats {
  totalCompleted: number;
  refundsCount: number;
  cancelledCount: number;
  totalAmount: number;
  totalCommissions: number;
  averageTicket: number;
  todayTotal: number;
  totalCancelledAmount: number;
  totalRefundedAmount: number;  
  netTotalAmount: number;
  cancellationRate: number;
  refundRate: number;
  averageCancellationTicket: number;
  averageRefundTicket: number;
  conversionRate: number;
  netConversionRate: number;
  totalLostRevenue: number;
  paymentMethodBreakdown: Record<string, { count: number; amount: number }>;
}

// ✅ COMPONENTE PRINCIPAL v7.2
const SalesHistoryPage = memo(() => {
  // ✅ HOOKS ENTERPRISE
  const hydrated = useHydrated();
  const { addAuditFieldsFor } = useUserTracking();
  const { toast, alert } = useNotifications();
  const supabase = createBrowserSupabaseClient();

  const refreshInProgress = useRef(false);

  // ✅ ESTADOS PRINCIPALES
  const [allSales, setAllSales] = useState<SaleWithRelations[]>([]);
  const [globalSalesData, setGlobalSalesData] = useState<SaleWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ✅ NUEVO: Estado para pestañas v7.2
  const [activeTab, setActiveTab] = useState(0);
  
  // ✅ FILTROS v7.2 (SIN status)
  const [filters, setFilters] = useState<HistoryFilters>({
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

  // ✅ FUNCIÓN UNIFICADA PARA PROCESAR SALES
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

  // ✅ CARGAR STATS GLOBALES - SOLO VENTAS DIRECTAS
  const loadGlobalStatsData = useCallback(async () => {
    try {
      let query = supabase
        .from('sales')
        .select(SALES_SELECT_QUERY)
        .in('status', ['completed', 'cancelled', 'refunded'])
        .eq('sale_type', 'sale');

      const { data, error } = await query;
      if (error) throw error;

      const processedData = (data || []).map(processSaleWithCalculatedFields);
      setGlobalSalesData(processedData);
      console.log(`✅ Stats globales: ${processedData.length} ventas directas`);
    } catch (error) {
      console.error('Error cargando stats globales:', error);
      setGlobalSalesData([]);
    }
  }, [supabase, processSaleWithCalculatedFields]);

  // ✅ FUNCIÓN SEARCHITEMS - SOLO VENTAS DIRECTAS
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

      // ✅ FILTROS BASE
      query = query.eq('sale_type', 'sale');

      // ✅ FILTROS SERVIDOR
      Object.entries(filterParams).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== '') {
          switch (key) {
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

      const from = pageNum * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;
      
      if (error) throw error;

      const processedData = (data || []).map(processSaleWithCalculatedFields);
      setAllSales(processedData);

      if (returnTotalCount && count !== null) {
        setTotalCount(count);
      }

      console.log(`✅ Búsqueda completada: ${processedData.length} ventas directas de ${count || 'N/A'} total`);
      return processedData;
    } catch (error) {
      console.error('Error en searchItemsWithServerFilters:', error);
      setAllSales([]);
      throw error;
    }
  }, [supabase, processSaleWithCalculatedFields]);

  // ✅ CARGAR STATS GLOBALES PRIMERO
  useEffect(() => {
    if (!hydrated) return;
    console.log('💧 Hidratado - cargando stats globales primero...');
    loadGlobalStatsData();
  }, [hydrated, loadGlobalStatsData]);

  // ✅ ESTADÍSTICAS GLOBALES
  const globalStats = useMemo((): HistoryStats => {
    const today = getTodayInMexico();
    
    const todayTransactions = globalSalesData.filter((sale: SaleWithRelations) => {
      const saleDate = extractDateInMexico(sale.created_at);
      return saleDate === today;
    });

    const completedSales = globalSalesData.filter((sale: SaleWithRelations) => sale.status === 'completed');
    const cancelledSales = globalSalesData.filter((sale: SaleWithRelations) => sale.status === 'cancelled');
    const refundedSales = globalSalesData.filter((sale: SaleWithRelations) => sale.status === 'refunded');
    
    const totalAmount = completedSales.reduce((sum: number, sale: SaleWithRelations) => sum + sale.total_amount, 0);
    const totalCancelledAmount = cancelledSales.reduce((sum: number, sale: SaleWithRelations) => sum + sale.total_amount, 0);
    const totalRefundedAmount = refundedSales.reduce((sum: number, sale: SaleWithRelations) => sum + sale.total_amount, 0);
    
    const totalTransactions = completedSales.length + cancelledSales.length + refundedSales.length;
    const successfulTransactions = completedSales.length;
    
    const todayTotal = todayTransactions
      .filter((sale: SaleWithRelations) => sale.status === 'completed')
      .reduce((sum: number, sale: SaleWithRelations) => sum + sale.total_amount, 0);

    return {
      totalCompleted: completedSales.length,
      refundsCount: refundedSales.length,
      cancelledCount: cancelledSales.length,
      totalAmount,
      totalCommissions: completedSales.reduce((sum: number, sale: SaleWithRelations) => sum + (sale.commission_amount || 0), 0),
      averageTicket: completedSales.length > 0 ? totalAmount / completedSales.length : 0,
      todayTotal,
      totalCancelledAmount,
      totalRefundedAmount,
      netTotalAmount: totalAmount - totalRefundedAmount,
      cancellationRate: totalTransactions > 0 ? (cancelledSales.length / totalTransactions) * 100 : 0,
      refundRate: successfulTransactions > 0 ? (refundedSales.length / successfulTransactions) * 100 : 0,
      averageCancellationTicket: cancelledSales.length > 0 ? totalCancelledAmount / cancelledSales.length : 0,
      averageRefundTicket: refundedSales.length > 0 ? totalRefundedAmount / refundedSales.length : 0,
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

  // ✅ NUEVO: Configuración de pestañas v7.2
  const tabsData = useMemo(() => [
    { 
      label: 'Completadas', 
      value: 'completed', 
      color: colorTokens.success,
      icon: <CheckCircle />,
      count: globalStats.totalCompleted,
    },
    { 
      label: 'Canceladas', 
      value: 'cancelled', 
      color: colorTokens.danger,
      icon: <Cancel />,
      count: globalStats.cancelledCount,
    },
    { 
      label: 'Devueltas', 
      value: 'refunded', 
      color: colorTokens.info,
      icon: <Undo />,
      count: globalStats.refundsCount,
    }
  ], [globalStats]);

  // ✅ NUEVO: TABLA SE CARGA SEGÚN PESTAÑA ACTIVA v7.2
  useEffect(() => {
    if (!hydrated || globalSalesData.length === 0) {
      console.log(`⏳ Esperando stats globales: hydrated=${hydrated}, globalSalesData=${globalSalesData.length}`);
      return;
    }

    const currentTabStatus = tabsData[activeTab]?.value;
    if (!currentTabStatus) return;
    
    console.log(`🔄 Stats globales listas, cargando tabla para: ${currentTabStatus}`);
    
    const cargarTabla = async () => {
      setLoading(true);
      try {
        const serverFilters: Record<string, any> = { ...filters };
        serverFilters.status = currentTabStatus; // ✅ Forzar filtro según pestaña
        
        if (serverFilters.cashier_id === 'all') delete serverFilters.cashier_id;

        await searchItemsWithServerFilters(serverFilters, page, rowsPerPage, true);
      } catch (error) {
        console.error('❌ Error cargando tabla:', error);
        notify.error("Error al cargar historial de ventas.");
      } finally {
        setLoading(false);
      }
    };
    
    cargarTabla();
  }, [hydrated, globalSalesData.length, activeTab, tabsData, filters, page, rowsPerPage, searchItemsWithServerFilters]);

  // ✅ PROCESAR SALES PARA DISPLAY
  const processedSales = useMemo(() => {
    return allSales;
  }, [allSales]);

  // ✅ FILTRADO SOLO PARA BÚSQUEDA
  const filteredSales = useMemo(() => {
    return processedSales.filter(sale => {
      if (filters.search.trim() && !sale.sale_number.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [processedSales, filters.search]);

  // ✅ CAJEROS DINÁMICOS
  const availableCashiers = useMemo(() => {
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
    
    return Array.from(cashierMap.values()).sort((a, b) => 
      a.firstName.localeCompare(b.firstName)
    );
  }, [filteredSales]);

  // ✅ ESTADÍSTICAS CONTEXTUALES
  const contextualStats = useMemo((): HistoryStats => {
    const today = getTodayInMexico();
    
    const todayTransactions = filteredSales.filter((sale: SaleWithRelations) => {
      const saleDate = extractDateInMexico(sale.created_at);
      return saleDate === today;
    });

    const completedSales = filteredSales.filter((sale: SaleWithRelations) => sale.status === 'completed');
    const cancelledSales = filteredSales.filter((sale: SaleWithRelations) => sale.status === 'cancelled');
    const refundedSales = filteredSales.filter((sale: SaleWithRelations) => sale.status === 'refunded');
    
    const totalAmount = completedSales.reduce((sum: number, sale: SaleWithRelations) => sum + sale.total_amount, 0);
    const totalCancelledAmount = cancelledSales.reduce((sum: number, sale: SaleWithRelations) => sum + sale.total_amount, 0);
    const totalRefundedAmount = refundedSales.reduce((sum: number, sale: SaleWithRelations) => sum + sale.total_amount, 0);
    
    const totalTransactions = completedSales.length + cancelledSales.length + refundedSales.length;
    const successfulTransactions = completedSales.length;
    
    return {
      totalCompleted: completedSales.length,
      refundsCount: refundedSales.length,
      cancelledCount: cancelledSales.length,
      totalAmount,
      totalCommissions: completedSales.reduce((sum: number, sale: SaleWithRelations) => sum + (sale.commission_amount || 0), 0),
      averageTicket: completedSales.length > 0 ? totalAmount / completedSales.length : 0,
      todayTotal: todayTransactions
        .filter((sale: SaleWithRelations) => sale.status === 'completed')
        .reduce((sum: number, sale: SaleWithRelations) => sum + sale.total_amount, 0),
      totalCancelledAmount,
      totalRefundedAmount,
      netTotalAmount: totalAmount - totalRefundedAmount,
      cancellationRate: totalTransactions > 0 ? (cancelledSales.length / totalTransactions) * 100 : 0,
      refundRate: successfulTransactions > 0 ? (refundedSales.length / successfulTransactions) * 100 : 0,
      averageCancellationTicket: cancelledSales.length > 0 ? totalCancelledAmount / cancelledSales.length : 0,
      averageRefundTicket: refundedSales.length > 0 ? totalRefundedAmount / refundedSales.length : 0,
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

  // ✅ FUNCIONES HELPER
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
    setPage(0);
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // ✅ MANEJADOR DE BÚSQUEDA
  const handleSearchChange = useCallback((searchValue: string) => {
    setFilters(prev => ({ ...prev, search: searchValue }));
  }, []);

  // ✅ LIMPIAR FILTROS v7.2
  const clearFilters = useCallback(() => {
    setFilters({
      cashier_id: 'all',
      date_from: '',
      date_to: '',
      search: ''
    });
    setPage(0);
    notify.success('Filtros limpiados');
  }, []);

  // ✅ NUEVO: Handler para cambio de pestaña v7.2
  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setPage(0);
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

  // ✅ UPDATE ITEM CON AUDITORÍA
  const updateItem = useCallback(async (saleId: string, updates: Partial<Sale>) => {
    try {
      const dataWithAudit = await addAuditFieldsFor('sales', updates, true);
      
      const { data, error } = await supabase
        .from('sales')
        .update(dataWithAudit)
        .eq('id', saleId)
        .select(SALES_SELECT_QUERY)
        .single();
        
      if (error) throw error;
      
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

  // ✅ OBTENER USUARIO ACTUAL
  const getCurrentUser = useCallback(async (): Promise<string> => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) throw new Error('Usuario no autenticado');
      return user.id;
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      throw new Error('No se pudo identificar al usuario actual');
    }
  }, [supabase]);

  // ✅ FUNCIÓN REFRESH
  const refreshData = useCallback(async () => {
    if (refreshInProgress.current) {
      console.log('⏳ Refresh ya en progreso, omitiendo...');
      return;
    }

    console.log('🔄 Refresh manual iniciado...');
    refreshInProgress.current = true;
    
    try {
      await loadGlobalStatsData();
      
      const currentTabStatus = tabsData[activeTab]?.value;
      const serverFilters: Record<string, any> = { ...filters };
      if (currentTabStatus) serverFilters.status = currentTabStatus;
      if (serverFilters.cashier_id === 'all') delete serverFilters.cashier_id;

      await searchItemsWithServerFilters(serverFilters, page, rowsPerPage, true);
      
      notify.success('Historial actualizado correctamente');
    } catch (error) {
      notify.error('Error al actualizar historial');
      console.error('❌ Error en refresh:', error);
    } finally {
      refreshInProgress.current = false;
    }
  }, [loadGlobalStatsData, activeTab, tabsData, filters, page, rowsPerPage, searchItemsWithServerFilters]);

  // ✅ FUSIÓN DE ESTADO
  const updateSaleInLocalState = useCallback((updatedSale: SaleWithRelations) => {
    const merger = (sale: SaleWithRelations) => 
      sale.id === updatedSale.id ? { ...sale, ...updatedSale } : sale;

    setAllSales(prev => prev.map(merger));
    setGlobalSalesData(prev => prev.map(merger));
  }, []);

  // ✅ CALLBACK PARA EDITDIALOG
  const handleEditSuccess = useCallback((updatedSale?: SaleWithRelations) => {
    if (updatedSale) {
      updateSaleInLocalState(updatedSale);
    }
    setTimeout(() => refreshData(), 1000);
    notify.success('Venta actualizada correctamente');
  }, [updateSaleInLocalState, refreshData]);

  // ✅ CANCELACIÓN/DEVOLUCIÓN CON INVENTORY_MOVEMENTS
  const processTransactionReversal = useCallback(async (
    sale: SaleWithRelations,
    actionType: 'cancel' | 'refund'
  ) => {
    const actionName = actionType === 'cancel' ? 'cancelación' : 'devolución';

    // Confirmación con SweetAlert
    const result = await MySwal.fire({
      background: colorTokens.neutral200,
      color: colorTokens.neutral1200,
      icon: 'question',
      title: `¿Confirmar ${actionName}?`,
      html: `
        <div style="text-align: center; color: ${colorTokens.neutral1000};">
          <p><strong>Venta #${sale.sale_number}</strong></p>
          <p>Monto: <strong>${formatPrice(sale.total_amount)}</strong></p>
          <div style="background: ${colorTokens.warning}20; border: 1px solid ${colorTokens.warning}40; border-radius: 8px; padding: 12px; margin: 16px 0;">
            <p style="color: ${colorTokens.warning}; margin: 0;">⚠️ Esta acción restaurará el inventario automáticamente</p>
          </div>
          <p>¿Deseas continuar?</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: `Sí, ${actionName}`,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: actionType === 'cancel' ? colorTokens.warning : colorTokens.info,
      cancelButtonColor: colorTokens.neutral600,
      iconColor: colorTokens.info,
      focusCancel: true,
    });

    if (!result.isConfirmed) {
      handleMenuClose();
      return;
    }

    const progressToast = notify.loading(`Procesando ${actionName}...`);

    try {
      const currentUserId = await getCurrentUser();
      const saleItems = sale.sale_items || [];
      
      if (saleItems.length === 0) {
        throw new Error('La venta no tiene productos para procesar');
      }

      const warehouseId = sale.source_warehouse_id;
      if (!warehouseId) {
        throw new Error('No se pudo determinar el almacén de origen');
      }

      const inventoryMovements = saleItems.map((item: SaleItem) => ({
        product_id: item.product_id,
        movement_type: 'devolucion_cliente',
        quantity: item.quantity,
        target_warehouse_id: warehouseId,
        reason: `${actionName.charAt(0).toUpperCase() + actionName.slice(1)} de Venta #${sale.sale_number}`,
        reference_id: sale.id,
        created_by: currentUserId,
      }));

      const { error: movementsError } = await supabase
        .from('inventory_movements')
        .insert(inventoryMovements);

      if (movementsError) {
        throw new Error(`Error al revertir el inventario: ${movementsError.message}`);
      }

      const statusUpdate = actionType === 'cancel' ? 'cancelled' : 'refunded';
      const reason = prompt(`Motivo de la ${actionName} (opcional):`) || `${actionName.charAt(0).toUpperCase() + actionName.slice(1)} procesada`;
      
      await updateItem(sale.id, {
        status: statusUpdate as SaleStatus,
        payment_status: 'refunded' as PaymentStatus,
        cancelled_at: getCurrentTimestamp(),
        cancel_reason: reason,
      });

      notify.dismiss(progressToast);
      notify.success(
        `${actionName.charAt(0).toUpperCase() + actionName.slice(1)} procesada exitosamente\n\n` +
        `Venta #${sale.sale_number}\n` +
        `Monto: ${formatPrice(sale.total_amount)}\n` +
        `Inventario restaurado automáticamente`
      );

      await refreshData();
      
    } catch (error) {
      notify.dismiss(progressToast);
      notify.error(`Error en ${actionName}: ${(error as Error).message}`);
    }
    
    handleMenuClose();
  }, [alert, getCurrentUser, updateItem, refreshData, handleMenuClose, formatPrice, supabase]);

  const handleRefund = useCallback(async (sale: SaleWithRelations) => {
    await processTransactionReversal(sale, 'refund');
  }, [processTransactionReversal]);

  const handleCancelSale = useCallback(async (sale: SaleWithRelations) => {
    await processTransactionReversal(sale, 'cancel');
  }, [processTransactionReversal]);

  // ✅ NUEVA FUNCIÓN: ELIMINAR VENTA COMPLETAMENTE
  const handleDeleteSale = useCallback(async (sale: SaleWithRelations) => {
    // Crear descripción para el diálogo
    const itemDescription = `
      Venta #${sale.sale_number}
      Monto: ${formatPrice(sale.total_amount)}
      Items: ${sale.items_count || 0}
    `;

    // Primera confirmación con SweetAlert
    const result = await showDeleteConfirmation(itemDescription);

    if (!result.isConfirmed) {
      handleMenuClose();
      return;
    }

    // Segunda confirmación con SweetAlert personalizado
    const secondConfirm = await MySwal.fire({
      background: colorTokens.neutral200,
      color: colorTokens.neutral1200,
      icon: 'warning',
      title: '🔴 SEGUNDA CONFIRMACIÓN',
      html: `
        <div style="text-align: center; color: ${colorTokens.neutral1000};">
          <p><strong>Venta #${sale.sale_number}</strong></p>
          <p>Monto: <strong>${formatPrice(sale.total_amount)}</strong></p>
          <div style="background: ${colorTokens.danger}20; border: 1px solid ${colorTokens.danger}40; border-radius: 8px; padding: 12px; margin: 16px 0;">
            <p style="color: ${colorTokens.danger}; margin: 0;">⚠️ El inventario será restaurado automáticamente</p>
          </div>
          <p style="margin-top: 20px;">¿Realmente deseas continuar?</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar definitivamente',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: colorTokens.danger,
      cancelButtonColor: colorTokens.neutral600,
      iconColor: colorTokens.danger,
      focusCancel: true,
    });

    if (!secondConfirm.isConfirmed) {
      handleMenuClose();
      return;
    }

    const progressToast = notify.loading('Eliminando venta y restaurando inventario...');

    try {
      const response = await fetch(`/api/sales/${sale.id}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar la venta');
      }

      notify.dismiss(progressToast);
      notify.success(
        `✅ Venta eliminada completamente\n\n` +
        `Venta #${sale.sale_number}\n` +
        `Monto: ${formatPrice(sale.total_amount)}\n` +
        `Items restaurados: ${result.details?.items_restored || 0}\n` +
        `Inventario restaurado: ✓`
      );

      // Remover la venta del estado local inmediatamente
      setAllSales(prev => prev.filter(s => s.id !== sale.id));
      setGlobalSalesData(prev => prev.filter(s => s.id !== sale.id));

      // Refrescar los datos después de un momento
      setTimeout(() => refreshData(), 1000);

    } catch (error) {
      notify.dismiss(progressToast);
      notify.error(`Error al eliminar la venta: ${(error as Error).message}`);
      console.error('Error eliminando venta:', error);
    }

    handleMenuClose();
  }, [alert, handleMenuClose, formatPrice, refreshData]);

  // ✅ REFRESH MANUAL
  const handleRefresh = useCallback(async () => {
    if (refreshInProgress.current) {
      notify.warning('Actualización ya en progreso...');
      return;
    }
    
    const toastId = notify.loading('Actualizando historial...');
    
    try {
      await refreshData();
      notify.dismiss(toastId);
      notify.success('Historial actualizado');
    } catch (error) {
      notify.dismiss(toastId);
      notify.error('Error al actualizar historial');
    }
  }, [refreshData]);

  // ✅ PAGINACIÓN
  const handleChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage - 1);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: SelectChangeEvent<number>) => {
    setRowsPerPage(event.target.value as number);
    setPage(0);
  }, []);

  // ✅ SSR SAFETY
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
          Inicializando historial de ventas directas
        </Typography>
      </Box>
    );
  }

  // ✅ CONTENIDO PRINCIPAL
  return (
    <Box sx={{
      p: { xs: 2, sm: 2.5, md: 3 },
      background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
      minHeight: '100vh'
    }}>
      {/* HEADER */}
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
            bgcolor: colorTokens.brand,
            width: { xs: 48, sm: 52, md: 56 },
            height: { xs: 48, sm: 52, md: 56 },
            color: colorTokens.textOnBrand
          }}>
            <History sx={{ fontSize: { xs: 26, sm: 28, md: 30 } }} />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{
              fontWeight: 800,
              color: colorTokens.textPrimary,
              mb: 1,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
            }}>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Historial de Ventas Directas</Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Historial Ventas</Box>
            </Typography>
            <Typography variant="body1" sx={{
              color: colorTokens.textSecondary,
              fontSize: { xs: '0.875rem', sm: '1rem' },
              display: { xs: 'none', sm: 'block' }
            }}>
              Solo ventas directas - Análisis por estado
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<Refresh sx={{ fontSize: { xs: 18, sm: 20 } }} />}
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
            },
            '&:disabled': { opacity: 0.6 }
          }}
        >
          {loading ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </Box>

      {/* ESTADÍSTICAS */}
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
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
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Conversión: {globalStats.conversionRate.toFixed(1)}%
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
              borderRadius: 3,
              position: 'relative'
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <AttachMoney sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h3" fontWeight="bold" sx={{ mb: 0.5 }}>
                  {formatPrice(globalStats.netTotalAmount)}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1, fontWeight: 600 }}>
                  Ingreso Real (Neto)
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>
                  Bruto: {formatPrice(globalStats.totalAmount)}
                </Typography>
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
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Comisiones pagadas
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
                  {formatPrice(globalStats.averageTicket)}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Ticket Promedio
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Conversión: {globalStats.conversionRate.toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* ANÁLISIS FINANCIERO */}
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
              Análisis Financiero Enterprise
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h6" sx={{ color: colorTokens.warning, fontWeight: 700 }}>
                  {formatPrice(globalStats.totalCommissions)}
                </Typography>
                <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                  Comisiones Generadas
                </Typography>
              </Box>
            </Grid>
            
            <Grid size={{ xs: 12, md: 3 }}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h6" sx={{ color: colorTokens.danger, fontWeight: 700 }}>
                  {globalStats.cancellationRate.toFixed(1)}%
                </Typography>
                <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                  Tasa Cancelación
                </Typography>
              </Box>
            </Grid>
            
            <Grid size={{ xs: 12, md: 3 }}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h6" sx={{ color: colorTokens.info, fontWeight: 700 }}>
                  {globalStats.refundRate.toFixed(1)}%
                </Typography>
                <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                  Tasa Devolución
                </Typography>
              </Box>
            </Grid>
            
            <Grid size={{ xs: 12, md: 3 }}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h6" sx={{ color: colorTokens.success, fontWeight: 700 }}>
                  {globalStats.totalAmount > 0 ? ((globalStats.netTotalAmount / globalStats.totalAmount) * 100).toFixed(1) : '0.0'}%
                </Typography>
                <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                  Retención Neta
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ANÁLISIS CONTEXTUAL */}
      {(filters.search !== '' || filters.cashier_id !== 'all' || 
        filters.date_from !== '' || filters.date_to !== '') && (
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

      {/* FILTROS v7.2 (SIN filtro de estado) */}
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
              Filtros Adicionales
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 5 }}>
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

            <Grid size={{ xs: 6, md: 2.5 }}>
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
                  <MenuItem value="all">Todos ({availableCashiers.length})</MenuItem>
                  {availableCashiers.map((cashier) => (
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
                onChange={(e) => updateFiltersWithPageReset({ date_from: e.target.value })}
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
                  }
                }}
              >
                ✕
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ✅ NUEVO: PESTAÑAS v7.2 */}
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                  <Badge badgeContent={tab.count} color="error" max={999}>
                    {React.cloneElement(tab.icon, { 
                      sx: { 
                        color: activeTab === index ? tab.color : colorTokens.textSecondary,
                        fontSize: 24
                      }
                    })}
                  </Badge>
                  <Typography sx={{ 
                    fontWeight: activeTab === index ? 700 : 500,
                    color: activeTab === index ? tab.color : colorTokens.textSecondary,
                    fontSize: '1rem'
                  }}>
                    {tab.label}
                  </Typography>
                </Box>
              }
              sx={{
                '&.Mui-selected': {
                  backgroundColor: `${colorTokens.brand}10`
                }
              }}
            />
          ))}
        </Tabs>
      </Card>

      {/* TABLA */}
      <Card sx={{
        background: colorTokens.surfaceLevel2,
        border: `1px solid ${colorTokens.border}`,
        borderRadius: 3,
        overflow: 'hidden'
      }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ background: colorTokens.brand }}>
                <TableCell sx={{ fontWeight: 'bold', color: colorTokens.textOnBrand }}>Número</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: colorTokens.textOnBrand }}>Fecha/Estado</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: colorTokens.textOnBrand }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: colorTokens.textOnBrand }}>Cajero</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: colorTokens.textOnBrand }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: colorTokens.textOnBrand }}>Comisión</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: colorTokens.textOnBrand }}>Método Pago</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: colorTokens.textOnBrand }}>Items</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: colorTokens.textOnBrand }}>Acciones</TableCell>
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
                  <TableCell colSpan={9} sx={{ textAlign: 'center', py: 6 }}>
                    <CircularProgress sx={{ color: colorTokens.brand, mb: 2 }} />
                    <Typography variant="body1" sx={{ color: colorTokens.textSecondary }}>
                      Cargando historial...
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

              {filteredSales.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={9} sx={{ textAlign: 'center', py: 6 }}>
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
                        No se encontraron ventas directas
                      </Typography>
                      <Typography variant="body2" sx={{ color: colorTokens.textMuted }}>
                        Intenta ajustar los filtros
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* PAGINACIÓN */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          background: `${colorTokens.surfaceLevel1}40`,
          borderTop: `1px solid ${colorTokens.border}`
        }}>
          <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
            Mostrando {Math.min(page * rowsPerPage + 1, totalCount)} - {Math.min((page + 1) * rowsPerPage, totalCount)} de {totalCount}
            {filteredSales.length < totalCount && ` (filtrados: ${filteredSales.length})`}
          </Typography>
          
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
              Filas:
            </Typography>
            <Select
              value={rowsPerPage}
              onChange={handleChangeRowsPerPage}
              disabled={loading}
              size="small"
              sx={{
                color: colorTokens.textPrimary,
                minWidth: '80px'
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
                  '&.Mui-selected': {
                    backgroundColor: colorTokens.brand,
                    color: colorTokens.textOnBrand,
                    fontWeight: 700
                  }
                }
              }}
            />
          </Stack>
        </Box>
      </Card>

      {/* MENÚ ACCIONES */}
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
          Ver Detalles
        </MenuItem>
        
        <Divider sx={{ borderColor: colorTokens.border, my: 1 }} />
        
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
          Editar
        </MenuItem>

        <Divider sx={{ borderColor: colorTokens.border, my: 1 }} />

        <MenuItem
          onClick={() => menuSale && handleDeleteSale(menuSale)}
          sx={{
            color: colorTokens.danger,
            '&:hover': {
              backgroundColor: `${colorTokens.danger}20`,
              '& .MuiSvgIcon-root': {
                color: colorTokens.danger
              }
            }
          }}
        >
          <Delete sx={{ mr: 2, color: colorTokens.danger }} />
          <Box>
            <Typography variant="body2" fontWeight="600">
              Eliminar Permanentemente
            </Typography>
            <Typography variant="caption" sx={{ color: colorTokens.textMuted }}>
              Solo si fue un error
            </Typography>
          </Box>
        </MenuItem>
      </Menu>

      {/* VISTA DETALLES*/}

      <SaleDetailsDialog
  open={detailsOpen}
  onClose={() => setDetailsOpen(false)}
  sale={selectedSale}
/>

      {/* EDITDIALOG */}
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