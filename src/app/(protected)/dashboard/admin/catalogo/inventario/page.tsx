// 📁 src/app/(protected)/dashboard/admin/catalogo/inventario/page.tsx
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid as Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Alert,
  Snackbar,
  CircularProgress,
  Avatar,
  Tooltip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Autocomplete
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  FileDownload as ExportIcon,
  Assessment as AssessmentIcon,
  Add as AddIcon,
  Store as StoreIcon,
  Warehouse as WarehouseIcon,
  BusinessCenter as BusinessIcon,
  SwapHoriz as TransferIcon,
  LocalShipping as ShippingIcon,
  Inventory2 as Inventory2Icon,
  LocationOn as LocationIcon,
  QrCode as QrCodeIcon
} from '@mui/icons-material';

// ✅ IMPORTS ENTERPRISE v8.2 CORREGIDOS
import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { useUserTracking } from '@/hooks/useUserTracking';
import { useEntityCRUD } from '@/hooks/useEntityCRUD';
import { useInventoryManagement } from '@/hooks/useInventoryManagement';
import { useProductStock } from '@/hooks/useProductStock';
import { notify } from '@/utils/notifications';
import { 
  formatTimestampForDisplay,
  getCurrentTimestamp,
  getTodayInMexico
} from '@/utils/dateUtils';
import ProductStockDialog from '@/components/catalogo/ProductStockDialog';
import InventoryMovementDialog from '@/components/catalogo/InventoryMovementDialog';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

// ✅ IMPORTAR INTERFACES CENTRALIZADAS v8.2 - CORREGIDO IMPORTS
import { 
  Warehouse, 
  WarehouseBasic,
  WarehouseType,
  WarehouseTransfer,
  TransferItem,
  TransferStatus,
  TransferType,
  TransferPriority,
  WAREHOUSE_TYPES,
  getWarehouseTypeInfo
} from '@/types/warehouse';

// ✅ TIPOS ENTERPRISE v8.2 - USANDO CENTRALIZADOS
type StockLevelFilter = '' | 'sin_stock' | 'stock_bajo' | 'stock_normal' | 'sobre_stock';
type ProductStatus = 'active' | 'inactive' | 'all';
type StockColor = 'error' | 'warning' | 'success' | 'info';

// ✅ INTERFACE PRODUCT CON STOCK MULTI-ALMACÉN v8.2
interface Product {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  current_stock: number;
  reserved_stock?: number;
  min_stock: number;
  max_stock?: number;
  cost_price?: number;
  sale_price?: number;
  unit?: string;
  is_active?: boolean;
  // ✅ NUEVO: Stock distribuido
  warehouse_stocks?: {
    warehouse_id: string;
    current_stock: number;
    reserved_stock: number;
    available_stock: number;
    min_stock: number;
    max_stock?: number;
  }[];
}

// ✅ INTERFACE STATS REALES v8.2
interface InventoryStats {
  total: number;
  sinStock: number;
  critical: number;
  available: number;
  totalValue: number;
  totalWarehouses: number;
}

// ✅ CONFIGURACIONES TIPADAS v8.2 - CORREGIDAS
const STOCK_FILTERS: readonly { value: StockLevelFilter; label: string }[] = [
  { value: '', label: 'Todos los productos' },
  { value: 'stock_normal', label: '✅ Stock disponible' },
  { value: 'stock_bajo', label: '⚠️ Stock crítico' },
  { value: 'sin_stock', label: '❌ Sin stock' },
  { value: 'sobre_stock', label: '📈 Sobre stock' }
] as const;

const STATUS_FILTERS: readonly { value: ProductStatus; label: string }[] = [
  { value: 'active', label: '✅ Productos Activos' },
  { value: 'inactive', label: '❌ Productos Inactivos' },
  { value: 'all', label: '📋 Todos los Productos' }
] as const;

// ✅ USAR CONSTANTES CENTRALIZADAS v8.2
const WAREHOUSE_TYPE_CONFIGS = WAREHOUSE_TYPES.map(wt => ({
  ...wt,
  icon: wt.value === 'store' ? <StoreIcon /> :
        wt.value === 'central' ? <BusinessIcon /> :
        <WarehouseIcon />
}));

export default function InventarioPage() {
  // ✅ 1. HOOKS DE ESTADO PRIMERO (orden v8.2)
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<ProductStatus>('active');
  const [selectedStockLevel, setSelectedStockLevel] = useState<StockLevelFilter>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  
  // Estados para diálogos
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockDialogOpen, setStockDialogOpen] = useState<boolean>(false);
  const [createWarehouseOpen, setCreateWarehouseOpen] = useState<boolean>(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState<boolean>(false);

  // ✅ Estados para crear almacén CORREGIDOS v8.2
  const [newWarehouse, setNewWarehouse] = useState({
    code: '',
    name: '',
    warehouse_type: 'store' as WarehouseType, // ✅ CORREGIDO: usar valores BD
    description: '',
    address: '',
    phone: '',
    is_default: false,
    max_capacity: undefined as number | undefined // ✅ CORREGIDO: undefined consistente
  });

  // ✅ Estados para traspaso CORREGIDOS v8.2
  const [transferData, setTransferData] = useState({
    source_warehouse_id: '',
    target_warehouse_id: '',
    transfer_type: 'manual' as TransferType, // ✅ USAR TIPO CENTRALIZADO
    priority: 'normal' as TransferPriority,  // ✅ USAR TIPO CENTRALIZADO
    reason: '',
    notes: '',
    items: [] as { product_id: string; requested_quantity: number }[]
  });

  // Estados para notificación
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // ✅ 2. HOOKS DE CONTEXT/CUSTOM REALES (orden v8.2)
  const hydrated = useHydrated();
  const { addAuditFieldsFor } = useUserTracking();
  const supabase = createBrowserSupabaseClient();
  
  // ✅ CRUD WAREHOUSES CON AUDITORÍA INTELIGENTE v8.2 - TIPOS CORREGIDOS
  const { 
    data: warehouses, 
    createItem: createWarehouse, 
    updateItem: updateWarehouse,
    fetchData: reloadWarehouses,
    loading: warehousesLoading,
    stats: warehouseStats
  } = useEntityCRUD<Warehouse>({
    tableName: 'warehouses', // ✅ Auditoría: full_snake (según v8.2)
    selectQuery: `
      id, code, name, description, address, warehouse_type, 
      is_active, is_default, manager_user_id, auto_restock_enabled,
      min_stock_threshold, max_capacity, current_capacity,
      operating_hours, time_zone, created_at, updated_at
    `
  });

  // ✅ CRUD TRANSFERS CON AUDITORÍA INTELIGENTE v8.2 - TIPOS CORREGIDOS
  const { 
    data: transfers, 
    createItem: createTransfer,
    updateItem: updateTransfer,
    fetchData: reloadTransfers,
    loading: transfersLoading
  } = useEntityCRUD<WarehouseTransfer>({
    tableName: 'warehouse_transfers', // Auditoría: full_snake (según v8.2)
    selectQuery: `
      *,
      source_warehouse:warehouses!source_warehouse_id (id, code, name, warehouse_type),
      target_warehouse:warehouses!target_warehouse_id (id, code, name, warehouse_type),
      Users!created_by (id, firstName, lastName, email)
    `
  });

  const { 
    products,
    stockStats: rawStockStats,
    criticalProducts,
    inventoryValue,
    getProductsByStatus,
    searchProducts,
    fetchData: reloadProducts,
    loading: productsLoading
  } = useProductStock();

  const { 
    getAvailableStock,
    checkAvailableStock,
    getRecentMovements,
    adjustInventory,
    loading: inventoryLoading 
  } = useInventoryManagement();

  // ✅ 3. HOOKS DE EFECTO (después de custom)
  useEffect(() => {
    if (hydrated) {
      console.log('✅ [v8.2] Inventario Multi-Almacén inicializado');
      loadInitialData();
    }
  }, [hydrated]);

  // ✅ CARGAR DATOS REALES v8.2
  const loadInitialData = useCallback(async () => {
    try {
      await Promise.all([
        reloadWarehouses(),
        reloadProducts(),
        reloadTransfers()
      ]);
      console.log('✅ [v8.2] Datos multi-almacén cargados desde BD');
    } catch (error: any) {
      console.error('Error cargando datos v8.2:', error);
      notify.error('Error cargando datos del inventario');
    }
  }, [reloadWarehouses, reloadProducts, reloadTransfers]);

  // ✅ STATS REALES CORREGIDAS v8.2 - USA FUNCIONES BD
  const correctedStockStats = useMemo((): InventoryStats => {
    if (!products || products.length === 0) {
      return {
        total: 0,
        sinStock: 0,
        critical: 0,
        available: 0,
        totalValue: 0,
        totalWarehouses: warehouses?.length || 0
      };
    }

    const stats = products.reduce((acc, product) => {
      const stock = product.current_stock || 0;
      const minStock = product.min_stock || 0;
      const cost = product.cost_price || 0;

      acc.total += 1;
      
      // ✅ CORREGIDO: Stock crítico es cuando current_stock <= min_stock
      if (stock === 0) {
        acc.sinStock += 1;
      } else if (stock <= minStock) {
        acc.critical += 1;
      } else {
        acc.available += 1;
      }

      acc.totalValue += stock * cost;
      return acc;
    }, {
      total: 0,
      sinStock: 0,
      critical: 0,
      available: 0,
      totalValue: 0,
      totalWarehouses: warehouses?.length || 0
    });

    console.log('✅ [v8.2] Stats calculadas correctamente:', stats);
    return stats;
  }, [products, warehouses]);

  // ✅ CATEGORÍAS ÚNICAS USANDO useProductStock REAL
  const uniqueCategories = useMemo(() => {
    return [...new Set(
      products
        .map((p: Product) => p.category)
        .filter((category): category is string => Boolean(category))
    )];
  }, [products]);

  // ✅ PRODUCTOS FILTRADOS REAL v8.2
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filtro por estado activo/inactivo
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((product: Product) => 
        selectedStatus === 'active' ? product.is_active !== false : product.is_active === false
      );
    }

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter((product: Product) => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por categoría
    if (selectedCategory) {
      filtered = filtered.filter((product: Product) => product.category === selectedCategory);
    }

    // ✅ FILTRO POR NIVEL DE STOCK CORREGIDO v8.2
    if (selectedStockLevel) {
      filtered = filtered.filter((product: Product) => {
        const stock = product.current_stock || 0;
        const minStock = product.min_stock || 0;
        const maxStock = product.max_stock || 0;

        switch (selectedStockLevel) {
          case 'sin_stock':
            return stock === 0;
          case 'stock_bajo':
            return stock > 0 && stock <= minStock;
          case 'sobre_stock':
            return maxStock > 0 && stock > maxStock;
          case 'stock_normal':
            return stock > minStock && (maxStock === 0 || stock <= maxStock);
          default:
            return true;
        }
      });
    }

    // ✅ TODO: Filtro por warehouse cuando esté implementado stock distribuido
    // if (selectedWarehouse) {
    //   filtered = filtered.filter(product => 
    //     product.warehouse_stocks?.some(ws => ws.warehouse_id === selectedWarehouse)
    //   );
    // }

    return filtered;
  }, [products, selectedStatus, searchTerm, selectedCategory, selectedStockLevel, selectedWarehouse]);

  // ✅ PAGINACIÓN CALCULADA
  const paginatedProducts = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredProducts.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredProducts, page, rowsPerPage]);

  // ✅ FUNCIONES UTILITARIAS MEMOIZADAS v8.2
  const utilityFunctions = useMemo(() => ({
    formatPrice: (price: number): string => {
      const numPrice = typeof price === 'number' ? price : 0;
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
      }).format(numPrice);
    },
    
    formatDate: (dateString: string): string => {
      return formatTimestampForDisplay(dateString);
    },
    
    getStockColor: (product: Product): StockColor => {
      const stock = product.current_stock || 0;
      const minStock = product.min_stock || 0;
      const maxStock = product.max_stock || 0;

      if (stock === 0) return 'error';
      if (stock <= minStock) return 'warning';
      if (maxStock > 0 && stock > maxStock) return 'info';
      return 'success';
    },
    
    getStockPercentage: (product: Product): number => {
      const stock = product.current_stock || 0;
      const maxStock = product.max_stock || 0;
      
      if (maxStock > 0) {
        return Math.min((stock / maxStock) * 100, 100);
      }
      return stock > product.min_stock ? 100 : 
             stock === 0 ? 0 : 50;
    },

    getStockStatusText: (product: Product): string => {
      const stock = product.current_stock || 0;
      const minStock = product.min_stock || 0;

      if (stock === 0) return 'Agotado';
      if (stock <= minStock) return 'Stock Crítico';
      return 'Disponible';
    }
  }), []);

  // ✅ HANDLERS MEMOIZADOS v8.2
  const memoizedHandlers = useMemo(() => ({
    search: (value: string) => {
      setSearchTerm(value);
      setPage(0);
    },
    categoryFilter: (value: string) => {
      setSelectedCategory(value);
      setPage(0);
    },
    stockFilter: (value: StockLevelFilter) => {
      setSelectedStockLevel(value);
      setPage(0);
    },
    statusFilter: (value: ProductStatus) => {
      setSelectedStatus(value);
      setPage(0);
    },
    warehouseFilter: (value: string) => {
      setSelectedWarehouse(value);
      setPage(0);
    },
    clearFilters: () => {
      setSearchTerm('');
      setSelectedCategory('');
      setSelectedStockLevel('');
      setSelectedStatus('active');
      setSelectedWarehouse('');
      setPage(0);
    }
  }), []);

  // ✅ CREAR ALMACÉN CON AUDITORÍA REAL v8.2 - TIPOS CORREGIDOS
  const handleCreateWarehouse = useCallback(async () => {
    try {
      if (!newWarehouse.code || !newWarehouse.name) {
        notify.error('Código y nombre son requeridos');
        return;
      }

      // ✅ AUDITORÍA AUTOMÁTICA: warehouses tabla con full_snake según v8.2
      const warehouseData = {
        code: newWarehouse.code.toUpperCase(),
        name: newWarehouse.name,
        warehouse_type: newWarehouse.warehouse_type,
        description: newWarehouse.description || undefined, // ✅ CORREGIDO: undefined si vacío
        address: newWarehouse.address ? { address: newWarehouse.address } : undefined, // ✅ CORREGIDO: undefined
        is_active: true,
        is_default: newWarehouse.is_default,
        max_capacity: newWarehouse.max_capacity, // ✅ CORREGIDO: puede ser undefined
        created_at: getCurrentTimestamp()
      };

      await createWarehouse(warehouseData);
      
      notify.success(`Almacén ${newWarehouse.name} creado exitosamente`);
      setCreateWarehouseOpen(false);
      setNewWarehouse({
        code: '',
        name: '',
        warehouse_type: 'store',
        description: '',
        address: '',
        phone: '',
        is_default: false,
        max_capacity: undefined // ✅ CORREGIDO: undefined
      });
    } catch (error: any) {
      console.error('Error creando almacén:', error);
      notify.error('Error creando almacén: ' + error.message);
    }
  }, [newWarehouse, createWarehouse]);

  // ✅ CREAR TRASPASO CON AUDITORÍA REAL v8.2
  const handleCreateTransfer = useCallback(async () => {
    try {
      if (!transferData.source_warehouse_id || !transferData.target_warehouse_id) {
        notify.error('Almacén origen y destino son requeridos');
        return;
      }

      if (transferData.source_warehouse_id === transferData.target_warehouse_id) {
        notify.error('Almacén origen y destino deben ser diferentes');
        return;
      }

      if (transferData.items.length === 0) {
        notify.error('Debe agregar al menos un producto al traspaso');
        return;
      }

      // ✅ GENERAR NÚMERO DE TRASPASO
      const transferNumber = `TR-${Date.now().toString().slice(-8)}`;
      
      // ✅ AUDITORÍA AUTOMÁTICA: warehouse_transfers usa full_snake según v8.2
      const transferDataWithAudit = await addAuditFieldsFor('warehouse_transfers', {
        transfer_number: transferNumber,
        source_warehouse_id: transferData.source_warehouse_id,
        target_warehouse_id: transferData.target_warehouse_id,
        status: 'pending' as TransferStatus,
        transfer_type: transferData.transfer_type,
        priority: transferData.priority,
        reason: transferData.reason || null, // ✅ CORREGIDO: null si vacío
        notes: transferData.notes || null,   // ✅ CORREGIDO: null si vacío
        total_items: transferData.items.length,
        total_quantity: transferData.items.reduce((sum, item) => sum + item.requested_quantity, 0),
        total_value: null, // Calculado después
        requested_at: getCurrentTimestamp()
      }, false);

      const newTransfer = await createTransfer(transferDataWithAudit);
      
      notify.success(`Traspaso ${transferNumber} creado exitosamente`);
      setTransferDialogOpen(false);
      resetTransferData();
    } catch (error: any) {
      console.error('Error creando traspaso:', error);
      notify.error('Error creando traspaso: ' + error.message);
    }
  }, [transferData, createTransfer, addAuditFieldsFor]);

  // ✅ RESET TRANSFER DATA
  const resetTransferData = useCallback(() => {
    setTransferData({
      source_warehouse_id: '',
      target_warehouse_id: '',
      transfer_type: 'manual',
      priority: 'normal',
      reason: '',
      notes: '',
      items: []
    });
  }, []);

  // ✅ MANEJO DE NOTIFICACIONES
  const closeNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  // ✅ MANEJO DE DIÁLOGOS v8.2
  const openStockDialog = useCallback((product: Product) => {
    setSelectedProduct(product);
    setStockDialogOpen(true);
  }, []);

  const closeStockDialog = useCallback(() => {
    setSelectedProduct(null);
    setStockDialogOpen(false);
  }, []);

  const openCreateWarehouse = useCallback(() => {
    setCreateWarehouseOpen(true);
  }, []);

  const closeCreateWarehouse = useCallback(() => {
    setCreateWarehouseOpen(false);
    setNewWarehouse({
      code: '',
      name: '',
      warehouse_type: 'store',
      description: '',
      address: '',
      phone: '',
      is_default: false,
      max_capacity: undefined // ✅ CORREGIDO: undefined
    });
  }, []);

  const openTransferDialog = useCallback(() => {
    setTransferDialogOpen(true);
  }, []);

  const closeTransferDialog = useCallback(() => {
    setTransferDialogOpen(false);
    resetTransferData();
  }, [resetTransferData]);

  // ✅ CALLBACKS SAVE CORREGIDOS
  const handleStockSave = useCallback(() => {
    console.log('🔄 Stock ajustado, recargando datos...');
    reloadProducts();
    closeStockDialog();
  }, [reloadProducts, closeStockDialog]);

  // ✅ HANDLERS DE PAGINACIÓN
  const handlePageChange = useCallback((_: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  // ✅ CALLBACK RELOAD GENERAL
  const reload = useCallback(() => {
    loadInitialData();
    notify.info('Recargando inventario multi-almacén...');
  }, [loadInitialData]);

  // ✅ SSR SAFETY v8.2
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
          Cargando Sistema Multi-Almacén v8.2...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
      color: colorTokens.textPrimary,
      p: 3
    }}>
      {/* 🔔 NOTIFICACIÓN ENTERPRISE */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={closeNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          severity={notification.severity}
          onClose={closeNotification}
          sx={{
            background: notification.severity === 'success' ? 
              `linear-gradient(135deg, ${colorTokens.success}, ${colorTokens.successHover})` :
              notification.severity === 'error' ?
              `linear-gradient(135deg, ${colorTokens.danger}, ${colorTokens.dangerHover})` :
              notification.severity === 'warning' ?
              `linear-gradient(135deg, ${colorTokens.warning}, ${colorTokens.brandHover})` :
              `linear-gradient(135deg, ${colorTokens.info}, ${colorTokens.infoHover})`,
            color: colorTokens.textPrimary,
            fontWeight: 600,
            borderRadius: 3
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      {/* 📊 HEADER CON ESTADÍSTICAS REALES CORREGIDAS v8.2 */}
      <Paper sx={{
        p: 4,
        mb: 4,
        background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
        border: `2px solid ${colorTokens.brand}30`,
        borderRadius: 4,
        boxShadow: `0 8px 32px ${colorTokens.glow}`
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography 
              variant="h3" 
              component="h1" 
              sx={{
                fontWeight: 800,
                color: colorTokens.brand,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 1
              }}
            >
              <WarehouseIcon sx={{ fontSize: 50 }} />
              Sistema Multi-Almacén
            </Typography>
            <Typography variant="h6" sx={{ 
              color: colorTokens.textSecondary,
              fontWeight: 300
            }}>
              Inventario | {correctedStockStats.totalWarehouses} Almacenes | Traspasos | Enterprise v8.2
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={openCreateWarehouse}
              sx={{ 
                color: colorTokens.brand,
                borderColor: colorTokens.brand,
                px: 3, py: 1.5, borderRadius: 3, fontWeight: 600,
                '&:hover': {
                  borderColor: colorTokens.brandHover,
                  backgroundColor: `${colorTokens.brand}10`
                }
              }}
            >
              Crear Almacén
            </Button>

            <Button
              variant="outlined"
              startIcon={<TransferIcon />}
              onClick={openTransferDialog}
              sx={{ 
                color: colorTokens.info,
                borderColor: colorTokens.info,
                px: 3, py: 1.5, borderRadius: 3, fontWeight: 600,
                '&:hover': {
                  borderColor: colorTokens.infoHover,
                  backgroundColor: `${colorTokens.info}10`
                }
              }}
            >
              Crear Traspaso
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<AssessmentIcon />}
              sx={{ 
                color: colorTokens.textSecondary,
                borderColor: `${colorTokens.textSecondary}60`,
                px: 3, py: 1.5, borderRadius: 3, fontWeight: 600
              }}
            >
              Reportes
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={reload}
              disabled={productsLoading || warehousesLoading}
              sx={{ 
                color: colorTokens.textSecondary,
                borderColor: `${colorTokens.textSecondary}60`,
                px: 3, py: 1.5, borderRadius: 3, fontWeight: 600
              }}
            >
              {(productsLoading || warehousesLoading) ? <CircularProgress size={20} /> : 'Actualizar'}
            </Button>
          </Box>
        </Box>

        {/* 📊 ESTADÍSTICAS REALES CORREGIDAS v8.2 */}
        {productsLoading && !correctedStockStats ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress sx={{ color: colorTokens.brand }} />
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Card sx={{ 
                background: `${colorTokens.info}10`, 
                border: `1px solid ${colorTokens.info}30`,
                borderRadius: 3
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: colorTokens.info }}>
                        {correctedStockStats.total}
                      </Typography>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        Productos Total
                      </Typography>
                    </Box>
                    <InventoryIcon sx={{ fontSize: 40, color: colorTokens.info, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Card sx={{ 
                background: `${colorTokens.success}10`, 
                border: `1px solid ${colorTokens.success}30`,
                borderRadius: 3
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: colorTokens.success }}>
                        {correctedStockStats.available}
                      </Typography>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        Stock Disponible
                      </Typography>
                    </Box>
                    <CheckCircleIcon sx={{ fontSize: 40, color: colorTokens.success, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Card sx={{ 
                background: `${colorTokens.warning}10`, 
                border: `1px solid ${colorTokens.warning}30`,
                borderRadius: 3
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: colorTokens.warning }}>
                        {correctedStockStats.critical}
                      </Typography>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        Stock Crítico
                      </Typography>
                    </Box>
                    <WarningIcon sx={{ fontSize: 40, color: colorTokens.warning, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Card sx={{ 
                background: `${colorTokens.danger}10`, 
                border: `1px solid ${colorTokens.danger}30`,
                borderRadius: 3
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: colorTokens.danger }}>
                        {correctedStockStats.sinStock}
                      </Typography>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        Sin Stock
                      </Typography>
                    </Box>
                    <TrendingDownIcon sx={{ fontSize: 40, color: colorTokens.danger, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Card sx={{ 
                background: `${colorTokens.brand}10`, 
                border: `1px solid ${colorTokens.brand}30`,
                borderRadius: 3
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: colorTokens.brand }}>
                        {correctedStockStats.totalWarehouses}
                      </Typography>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        Almacenes
                      </Typography>
                    </Box>
                    <BusinessIcon sx={{ fontSize: 40, color: colorTokens.brand, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* 🔍 FILTROS ENTERPRISE v8.2 */}
      <Paper sx={{ 
        p: 3, 
        mb: 3,
        background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
        border: `1px solid ${colorTokens.border}`,
        borderRadius: 3
      }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 2.5 }}>
            <TextField
              fullWidth
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => memoizedHandlers.search(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: colorTokens.brand }} />
                  </InputAdornment>
                ),
                sx: {
                  color: colorTokens.textPrimary,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: `${colorTokens.brand}30`
                  }
                }
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 1.5 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ 
                color: colorTokens.textSecondary,
                '&.Mui-focused': { color: colorTokens.brand }
              }}>
                Almacén
              </InputLabel>
              <Select
                value={selectedWarehouse}
                label="Almacén"
                onChange={(e) => memoizedHandlers.warehouseFilter(e.target.value as string)}
                sx={{
                  color: colorTokens.textPrimary,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: `${colorTokens.brand}30`
                  }
                }}
              >
                <MenuItem value="">Todos</MenuItem>
                {warehouses?.filter(w => w.is_active).map((warehouse: Warehouse) => {
                  const typeInfo = getWarehouseTypeInfo(warehouse.warehouse_type);
                  return (
                    <MenuItem key={warehouse.id} value={warehouse.id}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {WAREHOUSE_TYPE_CONFIGS.find(wt => wt.value === warehouse.warehouse_type)?.icon}
                        {warehouse.name} ({warehouse.code})
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12, md: 1.5 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ 
                color: colorTokens.textSecondary,
                '&.Mui-focused': { color: colorTokens.brand }
              }}>
                Categoría
              </InputLabel>
              <Select
                value={selectedCategory}
                label="Categoría"
                onChange={(e) => memoizedHandlers.categoryFilter(e.target.value as string)}
                sx={{
                  color: colorTokens.textPrimary,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: `${colorTokens.brand}30`
                  }
                }}
              >
                <MenuItem value="">Todas</MenuItem>
                {uniqueCategories.map((category: string) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ 
                color: colorTokens.textSecondary,
                '&.Mui-focused': { color: colorTokens.brand }
              }}>
                Nivel de Stock
              </InputLabel>
              <Select
                value={selectedStockLevel}
                label="Nivel de Stock"
                onChange={(e) => memoizedHandlers.stockFilter(e.target.value as StockLevelFilter)}
                sx={{
                  color: colorTokens.textPrimary,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: `${colorTokens.brand}30`
                  }
                }}
              >
                {STOCK_FILTERS.map((filter) => (
                  <MenuItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 1.5 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ 
                color: colorTokens.textSecondary,
                '&.Mui-focused': { color: colorTokens.brand }
              }}>
                Estado
              </InputLabel>
              <Select
                value={selectedStatus}
                label="Estado"
                onChange={(e) => memoizedHandlers.statusFilter(e.target.value as ProductStatus)}
                sx={{
                  color: colorTokens.textPrimary,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: `${colorTokens.brand}30`
                  }
                }}
              >
                {STATUS_FILTERS.map((filter) => (
                  <MenuItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12, md: 1.5 }}>
            <Typography variant="body2" sx={{ 
              color: colorTokens.textSecondary, 
              textAlign: 'center' 
            }}>
              {filteredProducts.length} de {products.length}
            </Typography>
          </Grid>
          
          <Grid size={{ xs: 12, md: 1.5 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={memoizedHandlers.clearFilters}
              sx={{
                color: colorTokens.textSecondary,
                borderColor: `${colorTokens.textSecondary}40`
              }}
            >
              Limpiar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* 📋 TABLA DE PRODUCTOS CON STOCK CORREGIDO v8.2 */}
      <Paper sx={{ 
        background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
        border: `1px solid ${colorTokens.border}`,
        borderRadius: 3
      }}>
        <Box sx={{ p: 3, borderBottom: `1px solid ${colorTokens.border}` }}>
          <Typography variant="h6" fontWeight="bold" sx={{ 
            color: colorTokens.textPrimary,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <InventoryIcon />
            Productos en Inventario Multi-Almacén
            {selectedWarehouse && (
              <Chip 
                label={warehouses?.find((w: Warehouse) => w.id === selectedWarehouse)?.name || 'Almacén'}
                size="small"
                sx={{
                  backgroundColor: `${colorTokens.brand}20`,
                  color: colorTokens.brand,
                  ml: 1
                }}
              />
            )}
          </Typography>
        </Box>

        {productsLoading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress sx={{ color: colorTokens.brand }} size={40} />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ 
                    background: `linear-gradient(135deg, ${colorTokens.surfaceLevel3}, ${colorTokens.neutral400})`
                  }}>
                    <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Producto</TableCell>
                    <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Stock Actual</TableCell>
                    <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Nivel</TableCell>
                    <TableCell align="center" sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Estado</TableCell>
                    <TableCell align="right" sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Valor</TableCell>
                    <TableCell align="center" sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedProducts.map((product: Product) => {
                    const stockColor = utilityFunctions.getStockColor(product);
                    const stockPercentage = utilityFunctions.getStockPercentage(product);
                    
                    return (
                      <TableRow 
                        key={product.id} 
                        hover
                        sx={{ 
                          opacity: product.is_active === false ? 0.6 : 1,
                          backgroundColor: product.is_active === false ? `${colorTokens.danger}10` : 'transparent',
                          '&:hover': {
                            backgroundColor: colorTokens.hoverOverlay
                          }
                        }}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar sx={{ 
                              backgroundColor: `${colorTokens.brand}20`,
                              color: colorTokens.brand,
                              fontWeight: 'bold'
                            }}>
                              {product.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                                {product.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                                SKU: {product.sku || 'Sin SKU'} | {product.category}
                              </Typography>
                              {product.is_active === false && (
                                <Chip 
                                  label="INACTIVO" 
                                  sx={{
                                    backgroundColor: colorTokens.danger,
                                    color: colorTokens.textPrimary,
                                    fontWeight: 700,
                                    ml: 1
                                  }} 
                                  size="small" 
                                />
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                              {product.current_stock} {product.unit || 'pcs'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                              Min: {product.min_stock} | Max: {product.max_stock || 'N/A'}
                            </Typography>
                            {(product.reserved_stock || 0) > 0 && (
                              <Typography variant="caption" sx={{ color: colorTokens.warning, display: 'block' }}>
                                Reservado: {product.reserved_stock || 0}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ width: '100%' }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={stockPercentage}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: colorTokens.neutral400,
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: stockColor === 'error' ? colorTokens.danger :
                                                  stockColor === 'warning' ? colorTokens.warning :
                                                  stockColor === 'info' ? colorTokens.info :
                                                  colorTokens.success
                                }
                              }}
                            />
                            <Typography variant="caption" sx={{ color: colorTokens.textSecondary, mt: 0.5 }}>
                              {stockPercentage.toFixed(0)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            size="small"
                            icon={
                              product.current_stock === 0 ? <WarningIcon /> :
                              product.current_stock <= product.min_stock ? <TrendingDownIcon /> :
                              <CheckCircleIcon />
                            }
                            label={utilityFunctions.getStockStatusText(product)}
                            sx={{
                              backgroundColor: stockColor === 'error' ? `${colorTokens.danger}20` :
                                             stockColor === 'warning' ? `${colorTokens.warning}20` :
                                             `${colorTokens.success}20`,
                              color: stockColor === 'error' ? colorTokens.danger :
                                    stockColor === 'warning' ? colorTokens.warning :
                                    colorTokens.success,
                              border: `1px solid ${
                                stockColor === 'error' ? colorTokens.danger :
                                stockColor === 'warning' ? colorTokens.warning :
                                colorTokens.success
                              }40`
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold" sx={{ color: colorTokens.brand }}>
                            {utilityFunctions.formatPrice(product.current_stock * (product.cost_price || 0))}
                          </Typography>
                          <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                            @{utilityFunctions.formatPrice(product.cost_price || 0)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Ajustar Stock">
                            <IconButton
                              size="small"
                              onClick={() => openStockDialog(product)}
                              sx={{ 
                                color: colorTokens.brand,
                                '&:hover': {
                                  backgroundColor: `${colorTokens.brand}10`
                                }
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              component="div"
              count={filteredProducts.length}
              page={page}
              onPageChange={handlePageChange}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleRowsPerPageChange}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) => 
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
              sx={{
                color: colorTokens.textSecondary,
                borderTop: `1px solid ${colorTokens.border}`,
                '& .MuiTablePagination-selectIcon': { color: colorTokens.textSecondary },
                '& .MuiTablePagination-actions button': { color: colorTokens.textSecondary }
              }}
            />
          </>
        )}
      </Paper>

      {/* ✅ MODAL CREAR ALMACÉN REAL v8.2 - TIPOS CORREGIDOS */}
      <Dialog
        open={createWarehouseOpen}
        onClose={closeCreateWarehouse}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
            border: `2px solid ${colorTokens.brand}30`,
            borderRadius: 4
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          color: colorTokens.textPrimary,
          borderBottom: `1px solid ${colorTokens.border}`,
          pb: 2
        }}>
          <BusinessIcon sx={{ color: colorTokens.brand }} />
          Crear Nuevo Almacén
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Código del Almacén"
                value={newWarehouse.code}
                onChange={(e) => setNewWarehouse(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="ALM001"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <QrCodeIcon sx={{ color: colorTokens.brand }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: `${colorTokens.brand}30` },
                    '&:hover fieldset': { borderColor: colorTokens.brand },
                    '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                  }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Nombre del Almacén"
                value={newWarehouse.name}
                onChange={(e) => setNewWarehouse(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Almacén Principal"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <WarehouseIcon sx={{ color: colorTokens.brand }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: `${colorTokens.brand}30` },
                    '&:hover fieldset': { borderColor: colorTokens.brand },
                    '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                  }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Almacén</InputLabel>
                <Select
                  value={newWarehouse.warehouse_type}
                  label="Tipo de Almacén"
                  onChange={(e) => setNewWarehouse(prev => ({ ...prev, warehouse_type: e.target.value as WarehouseType }))}
                >
                  {WAREHOUSE_TYPE_CONFIGS.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {type.icon}
                        {type.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Descripción"
                value={newWarehouse.description}
                onChange={(e) => setNewWarehouse(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción del almacén"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon sx={{ color: colorTokens.brand }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Capacidad Máxima (opcional)"
                type="number"
                value={newWarehouse.max_capacity || ''}
                onChange={(e) => setNewWarehouse(prev => ({ 
                  ...prev, 
                  max_capacity: e.target.value ? parseInt(e.target.value) : undefined // ✅ CORREGIDO: undefined
                }))}
                placeholder="1000"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Inventory2Icon sx={{ color: colorTokens.brand }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Dirección"
                value={newWarehouse.address}
                onChange={(e) => setNewWarehouse(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Calle y número completo"
                multiline
                rows={2}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Teléfono"
                value={newWarehouse.phone}
                onChange={(e) => setNewWarehouse(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+52 81 1234 5678"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={newWarehouse.is_default}
                    onChange={(e) => setNewWarehouse(prev => ({ ...prev, is_default: e.target.checked }))}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: colorTokens.brand,
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: colorTokens.brand,
                      },
                    }}
                  />
                }
                label="Establecer como almacén por defecto"
                sx={{ color: colorTokens.textPrimary }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: `1px solid ${colorTokens.border}` }}>
          <Button
            onClick={closeCreateWarehouse}
            sx={{ color: colorTokens.textSecondary }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreateWarehouse}
            variant="contained"
            disabled={!newWarehouse.code || !newWarehouse.name || warehousesLoading}
            sx={{
              background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
              color: colorTokens.textOnBrand,
              fontWeight: 700,
              px: 4, py: 1.5, borderRadius: 3,
              '&:disabled': {
                background: colorTokens.neutral400,
                color: colorTokens.textMuted
              }
            }}
          >
            {warehousesLoading ? <CircularProgress size={20} /> : 'Crear Almacén'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ MODAL CREAR TRASPASO REAL v8.2 - TIPOS CORREGIDOS */}
      <Dialog
        open={transferDialogOpen}
        onClose={closeTransferDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
            border: `2px solid ${colorTokens.info}30`,
            borderRadius: 4,
            minHeight: '80vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          color: colorTokens.textPrimary,
          borderBottom: `1px solid ${colorTokens.border}`,
          pb: 2
        }}>
          <TransferIcon sx={{ color: colorTokens.info }} />
          Crear Traspaso Entre Almacenes
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <Alert severity="info" sx={{ 
            mb: 3,
            backgroundColor: `${colorTokens.info}10`,
            border: `1px solid ${colorTokens.info}30`,
            color: colorTokens.textPrimary
          }}>
            <Typography variant="body2">
              El sistema de traspasos completo estará disponible en la próxima actualización v8.3. 
              Por ahora, puedes crear la estructura básica del traspaso.
            </Typography>
          </Alert>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Almacén Origen</InputLabel>
                <Select
                  value={transferData.source_warehouse_id}
                  label="Almacén Origen"
                  onChange={(e) => setTransferData(prev => ({ ...prev, source_warehouse_id: e.target.value }))}
                >
                  {warehouses?.filter(w => w.is_active).map((warehouse) => {
                    const typeInfo = getWarehouseTypeInfo(warehouse.warehouse_type);
                    return (
                      <MenuItem key={warehouse.id} value={warehouse.id}>
                        <Box display="flex" alignItems="center" gap={1}>
                          {WAREHOUSE_TYPE_CONFIGS.find(wt => wt.value === warehouse.warehouse_type)?.icon}
                          {warehouse.name} ({warehouse.code})
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Almacén Destino</InputLabel>
                <Select
                  value={transferData.target_warehouse_id}
                  label="Almacén Destino"
                  onChange={(e) => setTransferData(prev => ({ ...prev, target_warehouse_id: e.target.value }))}
                >
                  {warehouses?.filter(w => w.is_active && w.id !== transferData.source_warehouse_id).map((warehouse) => {
                    const typeInfo = getWarehouseTypeInfo(warehouse.warehouse_type);
                    return (
                      <MenuItem key={warehouse.id} value={warehouse.id}>
                        <Box display="flex" alignItems="center" gap={1}>
                          {WAREHOUSE_TYPE_CONFIGS.find(wt => wt.value === warehouse.warehouse_type)?.icon}
                          {warehouse.name} ({warehouse.code})
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Traspaso</InputLabel>
                <Select
                  value={transferData.transfer_type}
                  label="Tipo de Traspaso"
                  onChange={(e) => setTransferData(prev => ({ ...prev, transfer_type: e.target.value as TransferType }))}
                >
                  <MenuItem value="manual">Manual</MenuItem>
                  <MenuItem value="automatic">Automático</MenuItem>
                  <MenuItem value="emergency">Emergencia</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Prioridad</InputLabel>
                <Select
                  value={transferData.priority}
                  label="Prioridad"
                  onChange={(e) => setTransferData(prev => ({ ...prev, priority: e.target.value as TransferPriority }))}
                >
                  <MenuItem value="low">Baja</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="high">Alta</MenuItem>
                  <MenuItem value="urgent">Urgente</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Razón del Traspaso"
                value={transferData.reason}
                onChange={(e) => setTransferData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Reabastecimiento, reorganización, etc."
                multiline
                rows={2}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Notas Adicionales"
                value={transferData.notes}
                onChange={(e) => setTransferData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notas adicionales sobre el traspaso..."
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: `1px solid ${colorTokens.border}` }}>
          <Button
            onClick={closeTransferDialog}
            sx={{ color: colorTokens.textSecondary }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreateTransfer}
            variant="contained"
            disabled={!transferData.source_warehouse_id || !transferData.target_warehouse_id || transfersLoading}
            sx={{
              background: `linear-gradient(135deg, ${colorTokens.info}, ${colorTokens.infoHover})`,
              color: colorTokens.textOnBrand,
              fontWeight: 700,
              px: 4, py: 1.5, borderRadius: 3,
              '&:disabled': {
                background: colorTokens.neutral400,
                color: colorTokens.textMuted
              }
            }}
          >
            {transfersLoading ? <CircularProgress size={20} /> : 'Crear Traspaso'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 📝 DIALOGS EXISTENTES */}
      <ProductStockDialog
        open={stockDialogOpen}
        onClose={closeStockDialog}
        product={selectedProduct}
        onSave={handleStockSave}
      />
    </Box>
  );
}