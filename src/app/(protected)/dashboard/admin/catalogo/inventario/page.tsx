// 📁 src/app/(protected)/dashboard/admin/catalogo/inventario/page.tsx - v8.4 MULTI-ALMACÉN COMPLETO
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
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
  Tabs,
  Tab,
  Collapse,
  Stack,
  Divider
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
  SwapHoriz as SwapHorizIcon,
  LocalShipping as ShippingIcon,
  Inventory2 as Inventory2Icon,
  LocationOn as LocationIcon,
  QrCode as QrCodeIcon,
  Timeline as TimelineIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Category as CategoryIcon
} from '@mui/icons-material';

// ✅ IMPORTS ENTERPRISE v8.4 CORREGIDOS
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
import WarehouseTransferDialog from '@/components/catalogo/WarehouseTransferDialog';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

// ✅ IMPORTAR INTERFACES CENTRALIZADAS v8.4
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

// ✅ TIPOS ENTERPRISE v8.4 - USANDO CENTRALIZADOS
type StockLevelFilter = '' | 'sin_stock' | 'stock_bajo' | 'stock_normal' | 'sobre_stock';
type ProductStatus = 'active' | 'inactive' | 'all';
type StockColor = 'error' | 'warning' | 'success' | 'info';
type TabValue = 'inventory' | 'movements' | 'transfers';

// ✅ INTERFACE PRODUCT CON STOCK MULTI-ALMACÉN v8.4
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
  // ✅ NUEVO: Stock distribuido por almacén
  warehouse_stocks?: {
    warehouse_id: string;
    current_stock: number;
    reserved_stock: number;
    available_stock: number;
    min_stock: number;
    max_stock?: number;
  }[];
}

// ✅ INTERFACE INVENTORY MOVEMENT v8.4
interface InventoryMovement {
  id: string;
  product_id: string;
  source_warehouse_id?: string;
  target_warehouse_id?: string;
  movement_type: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  unit_cost: number;
  total_cost: number;
  reason: string;
  notes?: string;
  created_at: string;
  created_by?: string;
  // Relaciones
  products?: {
    id: string;
    name: string;
    sku?: string;
    unit?: string;
  };
  target_warehouse?: {
    id: string;
    name: string;
    code: string;
  };
  source_warehouse?: {
    id: string;
    name: string;
    code: string;
  };
  Users?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

// ✅ INTERFACE STATS REALES v8.4
interface InventoryStats {
  total: number;
  sinStock: number;
  critical: number;
  available: number;
  totalValue: number;
  totalWarehouses: number;
}

// ✅ CONFIGURACIONES TIPADAS v8.4 - CORREGIDAS
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

// ✅ USAR CONSTANTES CENTRALIZADAS v8.4
const WAREHOUSE_TYPE_CONFIGS = WAREHOUSE_TYPES.map(wt => ({
  ...wt,
  icon: wt.value === 'store' ? <StoreIcon /> :
        wt.value === 'central' ? <BusinessIcon /> :
        <WarehouseIcon />
}));

// ✅ CONFIGURACIÓN TIPOS DE MOVIMIENTO v8.4
const MOVEMENT_TYPE_LABELS: Record<string, { label: string; color: string; icon: React.ReactElement }> = {
  'recepcion_compra': { 
    label: 'Recepción Compra', 
    color: colorTokens.success, 
    icon: <TrendingUpIcon /> 
  },
  'devolucion': { 
    label: 'Devolución', 
    color: colorTokens.success, 
    icon: <TrendingUpIcon /> 
  },
  'ajuste_manual_mas': { 
    label: 'Ajuste Manual (+)', 
    color: colorTokens.success, 
    icon: <TrendingUpIcon /> 
  },
  'inventario_inicial': { 
    label: 'Inventario Inicial', 
    color: colorTokens.info, 
    icon: <InventoryIcon /> 
  },
  'ajuste_manual_menos': { 
    label: 'Ajuste Manual (-)', 
    color: colorTokens.danger, 
    icon: <TrendingDownIcon /> 
  },
  'merma': { 
    label: 'Merma/Dañado', 
    color: colorTokens.danger, 
    icon: <TrendingDownIcon /> 
  },
  'transferencia_entrada': { 
    label: 'Transferencia Entrada', 
    color: colorTokens.info, 
    icon: <TransferIcon /> 
  },
  'transferencia_salida': { 
    label: 'Transferencia Salida', 
    color: colorTokens.warning, 
    icon: <TransferIcon /> 
  },
  'transferencia_directa': { 
    label: 'Transferencia Directa', 
    color: colorTokens.brand, 
    icon: <SwapHorizIcon /> 
  }
} as const;

export default function InventarioPage() {
  // ✅ 1. HOOKS DE ESTADO PRIMERO (orden v8.4)
  const [currentTab, setCurrentTab] = useState<TabValue>('inventory');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<ProductStatus>('active');
  const [selectedStockLevel, setSelectedStockLevel] = useState<StockLevelFilter>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [showFilters, setShowFilters] = useState<boolean>(true);
  
  // Estados para diálogos
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockDialogOpen, setStockDialogOpen] = useState<boolean>(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState<boolean>(false);
  const [createWarehouseOpen, setCreateWarehouseOpen] = useState<boolean>(false);

  // ✅ Estados para crear almacén CORREGIDOS v8.4
  const [newWarehouse, setNewWarehouse] = useState({
    code: '',
    name: '',
    warehouse_type: 'store' as WarehouseType,
    description: '',
    address: '',
    phone: '',
    is_default: false,
    max_capacity: undefined as number | undefined
  });

  // ✅ NUEVO: Estados para stock por almacén v8.4
  const [warehouseStocks, setWarehouseStocks] = useState<Record<string, Record<string, number>>>({});
  const [loadingWarehouseStocks, setLoadingWarehouseStocks] = useState<boolean>(false);

  // Estados para notificación
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // ✅ 2. HOOKS DE CONTEXT/CUSTOM REALES (orden v8.4)
  const hydrated = useHydrated();
  const { addAuditFieldsFor } = useUserTracking();
  const supabase = createBrowserSupabaseClient();
  
  // ✅ CRUD WAREHOUSES CON AUDITORÍA INTELIGENTE v8.4
  const { 
    data: warehouses, 
    createItem: createWarehouse, 
    updateItem: updateWarehouse,
    fetchData: reloadWarehouses,
    loading: warehousesLoading,
    stats: warehouseStats
  } = useEntityCRUD<Warehouse>({
    tableName: 'warehouses',
    selectQuery: `
      id, code, name, description, address, warehouse_type, 
      is_active, is_default, manager_user_id, auto_restock_enabled,
      min_stock_threshold, max_capacity, current_capacity,
      operating_hours, time_zone, created_at, updated_at
    `
  });

  // ✅ CRUD TRANSFERS CON AUDITORÍA INTELIGENTE v8.4 - TABLAS CREADAS Y FUNCIONALES
  const { 
    data: transfers, 
    createItem: createTransfer,
    updateItem: updateTransfer,
    fetchData: reloadTransfers,
    loading: transfersLoading
  } = useEntityCRUD<WarehouseTransfer>({
    tableName: 'warehouse_transfers',
    selectQuery: `
      *,
      source_warehouse:warehouses!source_warehouse_id (id, code, name, warehouse_type),
      target_warehouse:warehouses!target_warehouse_id (id, code, name, warehouse_type),
      Users!created_by (id, firstName, lastName, email)
    `
  });

  // ✅ NUEVO: CRUD MOVEMENTS CON AUDITORÍA INTELIGENTE v8.4
  const { 
    data: rawMovements, 
    fetchData: reloadMovements,
    loading: movementsLoading
  } = useEntityCRUD<InventoryMovement>({
    tableName: 'inventory_movements',
    selectQuery: `
      id, product_id, source_warehouse_id, target_warehouse_id,
      movement_type, quantity, previous_stock, new_stock,
      unit_cost, total_cost, reason, notes, created_at, created_by,
      products!product_id (id, name, sku, unit),
      target_warehouse:warehouses!target_warehouse_id (id, name, code),
      source_warehouse:warehouses!source_warehouse_id (id, name, code),
      Users!created_by (id, firstName, lastName)
    `
  });

  // ✅ ORDENAR MOVIMIENTOS MANUALMENTE v8.4
  const movements = useMemo(() => {
    return [...(rawMovements || [])].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ).slice(0, 50); // Tomar solo los 50 más recientes
  }, [rawMovements]);

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

  // ✅ FUNCIÓN PARA CARGAR STOCK POR ALMACÉN v8.4 - CON DEBUG MEJORADO
  const loadWarehouseStocks = useCallback(async () => {
    if (!selectedWarehouse || products.length === 0) return;
    
    console.log(`🔍 [DEBUG] Cargando stock para almacén: ${selectedWarehouse}`);
    setLoadingWarehouseStocks(true);
    try {
      const { data, error } = await supabase
        .from('product_warehouse_stock')
        .select('product_id, current_stock, available_stock, reserved_stock')
        .eq('warehouse_id', selectedWarehouse);
      
      if (error) {
        console.error(`❌ [ERROR] Error en consulta SQL:`, error);
        throw error;
      }
      
      console.log(`📊 [DEBUG] Respuesta de BD:`, data);
      
      const stocksByProduct: Record<string, number> = {};
      (data || []).forEach(item => {
        stocksByProduct[item.product_id] = item.current_stock || 0;
      });
      
      setWarehouseStocks(prev => ({ ...prev, [selectedWarehouse]: stocksByProduct }));
      
      const warehouseName = warehouses?.find(w => w.id === selectedWarehouse)?.name || 'Desconocido';
      console.log(`✅ [SUCCESS] Stock cargado para ${warehouseName}: ${data?.length || 0} productos`);
      console.log(`📦 [DEBUG] StocksByProduct:`, stocksByProduct);
      
      // Notificar si el almacén está vacío
      if (!data || data.length === 0) {
        console.warn(`⚠️ [WARNING] Almacén ${warehouseName} no tiene productos registrados`);
        notify.warning(`Almacén "${warehouseName}" no tiene productos registrados`);
      }
      
    } catch (error: any) {
      console.error('❌ [ERROR] Error cargando stocks por almacén:', error);
      notify.error('Error cargando stock del almacén: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoadingWarehouseStocks(false);
    }
  }, [selectedWarehouse, products, supabase, warehouses]);

  // ✅ 3. HOOKS DE EFECTO (después de custom)
  useEffect(() => {
    if (hydrated) {
      console.log('✅ [v8.4] Inventario Multi-Almacén completo inicializado');
      loadInitialData();
    }
  }, [hydrated]);

  // ✅ CARGAR STOCK POR ALMACÉN CUANDO CAMBIA SELECCIÓN
  useEffect(() => {
    if (selectedWarehouse) {
      loadWarehouseStocks();
    }
  }, [selectedWarehouse, loadWarehouseStocks]);

  // ✅ CARGAR DATOS REALES v8.4 - CON TRANSFERS HABILITADO
  const loadInitialData = useCallback(async () => {
    try {
      await Promise.all([
        reloadWarehouses(),
        reloadProducts(),
        reloadTransfers(), // ✅ HABILITADO: tabla existe
        reloadMovements()
      ]);
      console.log('✅ [v8.4] Sistema multi-almacén completo cargado - transfers operativo');
    } catch (error: any) {
      console.error('Error cargando datos v8.4:', error);
      notify.error('Error cargando datos del inventario');
    }
  }, [reloadWarehouses, reloadProducts, reloadTransfers, reloadMovements]); // ✅ RESTAURADO reloadTransfers

  // ✅ STATS REALES CORREGIDAS v8.4
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

  // ✅ PRODUCTOS FILTRADOS REAL v8.4 - CON FILTRO DINÁMICO POR ALMACÉN
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

    // ✅ FILTRO DINÁMICO POR ALMACÉN v8.4 - FUNCIONAL
    if (selectedWarehouse) {
      const warehouseStockData = warehouseStocks[selectedWarehouse] || {};
      filtered = filtered.filter((product: Product) => {
        const warehouseStock = warehouseStockData[product.id] || 0;
        return warehouseStock > 0; // Solo mostrar productos con stock en el almacén
      });
    }

    // ✅ FILTRO POR NIVEL DE STOCK CORREGIDO v8.4
    if (selectedStockLevel) {
      filtered = filtered.filter((product: Product) => {
        // Si hay almacén seleccionado, usar stock del almacén
        let stock = product.current_stock || 0;
        if (selectedWarehouse) {
          const warehouseStockData = warehouseStocks[selectedWarehouse] || {};
          stock = warehouseStockData[product.id] || 0;
        }
        
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

    return filtered;
  }, [products, selectedStatus, searchTerm, selectedCategory, selectedStockLevel, selectedWarehouse, warehouseStocks]);

  // ✅ PAGINACIÓN CALCULADA
  const paginatedProducts = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredProducts.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredProducts, page, rowsPerPage]);

  // ✅ FUNCIONES UTILITARIAS MEMOIZADAS v8.4
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
    
    getStockColor: (product: Product, useWarehouseStock = false): StockColor => {
      let stock = product.current_stock || 0;
      
      // Si hay almacén seleccionado y se solicita usar stock del almacén
      if (useWarehouseStock && selectedWarehouse) {
        const warehouseStockData = warehouseStocks[selectedWarehouse] || {};
        stock = warehouseStockData[product.id] || 0;
      }
      
      const minStock = product.min_stock || 0;
      const maxStock = product.max_stock || 0;

      if (stock === 0) return 'error';
      if (stock <= minStock) return 'warning';
      if (maxStock > 0 && stock > maxStock) return 'info';
      return 'success';
    },
    
    getStockPercentage: (product: Product, useWarehouseStock = false): number => {
      let stock = product.current_stock || 0;
      
      if (useWarehouseStock && selectedWarehouse) {
        const warehouseStockData = warehouseStocks[selectedWarehouse] || {};
        stock = warehouseStockData[product.id] || 0;
      }
      
      const maxStock = product.max_stock || 0;
      
      if (maxStock > 0) {
        return Math.min((stock / maxStock) * 100, 100);
      }
      return stock > product.min_stock ? 100 : 
             stock === 0 ? 0 : 50;
    },

    getStockStatusText: (product: Product, useWarehouseStock = false): string => {
      let stock = product.current_stock || 0;
      
      if (useWarehouseStock && selectedWarehouse) {
        const warehouseStockData = warehouseStocks[selectedWarehouse] || {};
        stock = warehouseStockData[product.id] || 0;
      }
      
      const minStock = product.min_stock || 0;

      if (stock === 0) return 'Agotado';
      if (stock <= minStock) return 'Stock Crítico';
      return 'Disponible';
    },

    getWarehouseStock: (product: Product): number => {
      if (!selectedWarehouse) return product.current_stock || 0;
      const warehouseStockData = warehouseStocks[selectedWarehouse] || {};
      return warehouseStockData[product.id] || 0;
    }
  }), [selectedWarehouse, warehouseStocks]);

  // ✅ HANDLERS MEMOIZADOS v8.4
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
    },
    toggleFilters: () => {
      setShowFilters(prev => !prev);
    }
  }), []);

  // ✅ CREAR ALMACÉN CON AUDITORÍA REAL v8.4
  const handleCreateWarehouse = useCallback(async () => {
    try {
      if (!newWarehouse.code || !newWarehouse.name) {
        notify.error('Código y nombre son requeridos');
        return;
      }

      const warehouseData = {
        code: newWarehouse.code.toUpperCase(),
        name: newWarehouse.name,
        warehouse_type: newWarehouse.warehouse_type,
        description: newWarehouse.description || undefined,
        address: newWarehouse.address ? { address: newWarehouse.address } : undefined,
        is_active: true,
        is_default: newWarehouse.is_default,
        max_capacity: newWarehouse.max_capacity,
        created_at: getCurrentTimestamp()
      };

      await createWarehouse(warehouseData);
      
      notify.success(`Almacén ${newWarehouse.name} creado exitosamente`);
      setCreateWarehouseOpen(false);
      resetNewWarehouse();
    } catch (error: any) {
      console.error('Error creando almacén:', error);
      notify.error('Error creando almacén: ' + error.message);
    }
  }, [newWarehouse, createWarehouse]);

  // ✅ RESET NEW WAREHOUSE
  const resetNewWarehouse = useCallback(() => {
    setNewWarehouse({
      code: '',
      name: '',
      warehouse_type: 'store',
      description: '',
      address: '',
      phone: '',
      is_default: false,
      max_capacity: undefined
    });
  }, []);

  // ✅ MANEJO DE NOTIFICACIONES
  const closeNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  // ✅ MANEJO DE DIÁLOGOS v8.4
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
    resetNewWarehouse();
  }, [resetNewWarehouse]);

  const openTransferDialog = useCallback(() => {
    setTransferDialogOpen(true);
  }, []);

  const closeTransferDialog = useCallback(() => {
    setTransferDialogOpen(false);
  }, []);

  // ✅ CALLBACKS SAVE CORREGIDOS
  const handleStockSave = useCallback(() => {
    console.log('🔄 Stock ajustado, recargando datos...');
    reloadProducts();
    reloadMovements();
    if (selectedWarehouse) {
      loadWarehouseStocks();
    }
    closeStockDialog();
  }, [reloadProducts, reloadMovements, selectedWarehouse, loadWarehouseStocks, closeStockDialog]);

  const handleTransferSave = useCallback(() => {
    console.log('🔄 Traspaso realizado, recargando datos...');
    reloadProducts();
    reloadMovements();
    reloadTransfers(); // ✅ HABILITADO: tabla existe
    if (selectedWarehouse) {
      loadWarehouseStocks();
    }
    closeTransferDialog();
  }, [reloadProducts, reloadMovements, reloadTransfers, selectedWarehouse, loadWarehouseStocks, closeTransferDialog]); // ✅ RESTAURADO reloadTransfers

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

  // ✅ HANDLER REPORTES PRÓXIMAMENTE
  const handleReports = useCallback(() => {
    notify.info('Reportes avanzados - Próximamente en v8.5');
  }, []);

  // ✅ SSR SAFETY v8.4
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

      {/* 📊 HEADER CON ESTADÍSTICAS REALES CORREGIDAS v8.4 */}
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
              Inventario | {correctedStockStats.totalWarehouses} Almacenes | Traspasos | Enterprise v8.4
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={2}>
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
              onClick={handleReports}
              sx={{ 
                color: colorTokens.textSecondary,
                borderColor: `${colorTokens.textSecondary}60`,
                px: 3, py: 1.5, borderRadius: 3, fontWeight: 600
              }}
            >
              Próximamente
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
          </Stack>
        </Box>

        {/* 📊 ESTADÍSTICAS REALES CORREGIDAS v8.4 */}
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

      {/* ✅ PESTAÑAS DE NAVEGACIÓN v8.4 */}
      <Paper sx={{ 
        mb: 3,
        background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
        border: `1px solid ${colorTokens.border}`,
        borderRadius: 3
      }}>
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: colorTokens.brand,
              height: 3
            },
            '& .MuiTab-root': {
              color: colorTokens.textSecondary,
              fontWeight: 600,
              '&.Mui-selected': {
                color: colorTokens.brand
              }
            }
          }}
        >
          <Tab 
            icon={<InventoryIcon />} 
            label="Inventario" 
            value="inventory"
            iconPosition="start"
          />
          <Tab 
            icon={<TimelineIcon />} 
            label="Movimientos" 
            value="movements"
            iconPosition="start"
          />
          <Tab 
            icon={<TransferIcon />} 
            label="Traspasos" 
            value="transfers"
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* ✅ CONTENIDO POR PESTAÑA v8.4 */}
      {currentTab === 'inventory' && (
        <>
          {/* 🔍 FILTROS ENTERPRISE v8.4 */}
          <Paper sx={{ 
            mb: 3,
            background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
            border: `1px solid ${colorTokens.border}`,
            borderRadius: 3
          }}>
            <Box sx={{ 
              p: 2, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              borderBottom: showFilters ? `1px solid ${colorTokens.border}` : 'none'
            }}>
              <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                Filtros de Búsqueda
              </Typography>
              <Button
                startIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={memoizedHandlers.toggleFilters}
                sx={{ color: colorTokens.textSecondary }}
              >
                {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
              </Button>
            </Box>
            
            <Collapse in={showFilters}>
              <Box sx={{ p: 3 }}>
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

                  <Grid size={{ xs: 12, md: 1.8 }}>
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
                        <MenuItem value="">
                          <Box display="flex" alignItems="center" gap={1}>
                            <WarehouseIcon />
                            Todos los almacenes
                          </Box>
                        </MenuItem>
                        {warehouses?.filter(w => w.is_active).map((warehouse: Warehouse) => {
                          const typeIcon = WAREHOUSE_TYPE_CONFIGS.find(wt => wt.value === warehouse.warehouse_type)?.icon;
                          return (
                            <MenuItem key={warehouse.id} value={warehouse.id}>
                              <Box display="flex" alignItems="center" gap={1}>
                                {typeIcon}
                                {warehouse.name} ({warehouse.code})
                              </Box>
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 1.8 }}>
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
                        <MenuItem value="">
                          <Box display="flex" alignItems="center" gap={1}>
                            <CategoryIcon />
                            Todas las categorías
                          </Box>
                        </MenuItem>
                        {uniqueCategories.map((category: string) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 2.2 }}>
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

                  <Grid size={{ xs: 12, md: 1.8 }}>
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
                  
                  <Grid size={{ xs: 12, md: 1.0 }}>
                    <Typography variant="body2" sx={{ 
                      color: colorTokens.textSecondary, 
                      textAlign: 'center',
                      fontWeight: 600
                    }}>
                      {filteredProducts.length} de {products.length}
                    </Typography>
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 0.9 }}>
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

                {/* ✅ INDICADOR DE FILTRO ACTIVO DE ALMACÉN MEJORADO */}
                {selectedWarehouse && (
                  <Box sx={{ mt: 2 }}>
                    {loadingWarehouseStocks ? (
                      <Alert severity="info" sx={{ backgroundColor: `${colorTokens.info}10` }}>
                        <Typography variant="body2">
                          <CircularProgress size={16} sx={{ mr: 1, color: colorTokens.info }} />
                          Cargando stock del almacén{' '}
                          <strong>
                            {warehouses?.find(w => w.id === selectedWarehouse)?.name || 'Almacén'}
                          </strong>...
                        </Typography>
                      </Alert>
                    ) : (
                      <Alert 
                        severity={filteredProducts.length > 0 ? "info" : "warning"} 
                        sx={{ backgroundColor: filteredProducts.length > 0 ? `${colorTokens.info}10` : `${colorTokens.warning}10` }}
                      >
                        <Typography variant="body2">
                          <strong>Filtro activo:</strong> Mostrando productos con stock en{' '}
                          <strong>
                            {warehouses?.find(w => w.id === selectedWarehouse)?.name || 'Almacén'}
                          </strong>
                          <br />
                          {filteredProducts.length > 0 ? (
                            `Encontrados: ${filteredProducts.length} productos con stock`
                          ) : (
                            `⚠️ Este almacén no tiene productos con stock. Selecciona otro almacén o agrega productos.`
                          )}
                        </Typography>
                      </Alert>
                    )}
                  </Box>
                )}
              </Box>
            </Collapse>
          </Paper>

          {/* 📋 TABLA DE PRODUCTOS CON STOCK CORREGIDO v8.4 */}
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
                      ml: 1,
                      fontWeight: 600
                    }}
                  />
                )}
              </Typography>
            </Box>

            {productsLoading || loadingWarehouseStocks ? (
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
                        <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>
                          {selectedWarehouse ? 'Stock en Almacén' : 'Stock Total'}
                        </TableCell>
                        <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Nivel</TableCell>
                        <TableCell align="center" sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Estado</TableCell>
                        <TableCell align="right" sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Valor</TableCell>
                        <TableCell align="center" sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedProducts.map((product: Product) => {
                        const useWarehouseStock = Boolean(selectedWarehouse);
                        const stockColor = utilityFunctions.getStockColor(product, useWarehouseStock);
                        const stockPercentage = utilityFunctions.getStockPercentage(product, useWarehouseStock);
                        const displayStock = useWarehouseStock ? 
                          utilityFunctions.getWarehouseStock(product) : 
                          product.current_stock || 0;
                        
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
                                  {displayStock} {product.unit || 'pcs'}
                                </Typography>
                                <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                                  Min: {product.min_stock} | Max: {product.max_stock || 'N/A'}
                                </Typography>
                                {useWarehouseStock && (
                                  <Typography variant="caption" sx={{ color: colorTokens.info, display: 'block' }}>
                                    Total global: {product.current_stock}
                                  </Typography>
                                )}
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
                                  displayStock === 0 ? <WarningIcon /> :
                                  displayStock <= product.min_stock ? <TrendingDownIcon /> :
                                  <CheckCircleIcon />
                                }
                                label={utilityFunctions.getStockStatusText(product, useWarehouseStock)}
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
                                {utilityFunctions.formatPrice(displayStock * (product.cost_price || 0))}
                              </Typography>
                              <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                                @{utilityFunctions.formatPrice(product.cost_price || 0)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Stack direction="row" spacing={1} justifyContent="center">
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
                                <Tooltip title="Crear Traspaso">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setSelectedProduct(product);
                                      openTransferDialog();
                                    }}
                                    sx={{ 
                                      color: colorTokens.info,
                                      '&:hover': {
                                        backgroundColor: `${colorTokens.info}10`
                                      }
                                    }}
                                  >
                                    <TransferIcon />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
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
        </>
      )}

      {/* ✅ PESTAÑA MOVIMIENTOS v8.4 */}
      {currentTab === 'movements' && (
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
              <TimelineIcon />
              Últimos Movimientos de Inventario (50 recientes)
            </Typography>
          </Box>

          {movementsLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress sx={{ color: colorTokens.brand }} size={40} />
            </Box>
          ) : movements.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ color: colorTokens.textSecondary, mb: 2 }}>
                No hay movimientos registrados
              </Typography>
              <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                Los movimientos de inventario aparecerán aquí cuando realices ajustes de stock
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ 
                    background: `linear-gradient(135deg, ${colorTokens.surfaceLevel3}, ${colorTokens.neutral400})`
                  }}>
                    <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Fecha</TableCell>
                    <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Producto</TableCell>
                    <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Tipo</TableCell>
                    <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Almacén</TableCell>
                    <TableCell align="center" sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Cantidad</TableCell>
                    <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Stock</TableCell>
                    <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Razón</TableCell>
                    <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Usuario</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movements.map((movement) => {
                    const typeConfig = MOVEMENT_TYPE_LABELS[movement.movement_type] || {
                      label: movement.movement_type,
                      color: colorTokens.textSecondary,
                      icon: <HistoryIcon />
                    };
                    
                    return (
                      <TableRow key={movement.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: colorTokens.textPrimary }}>
                            {utilityFunctions.formatDate(movement.created_at)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                              {movement.products?.name || 'Producto eliminado'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                              SKU: {movement.products?.sku || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            icon={typeConfig.icon}
                            label={typeConfig.label}
                            sx={{
                              backgroundColor: `${typeConfig.color}20`,
                              color: typeConfig.color,
                              border: `1px solid ${typeConfig.color}40`
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box>
                            {movement.target_warehouse && (
                              <Typography variant="body2" sx={{ color: colorTokens.textPrimary }}>
                                {movement.target_warehouse.name}
                              </Typography>
                            )}
                            {movement.source_warehouse && (
                              <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                                Desde: {movement.source_warehouse.name}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography 
                            variant="h6" 
                            fontWeight="bold" 
                            sx={{ 
                              color: movement.quantity >= 0 ? colorTokens.success : colorTokens.danger 
                            }}
                          >
                            {movement.quantity >= 0 ? '+' : ''}{movement.quantity}
                          </Typography>
                          <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                            {movement.products?.unit || 'u'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                            {movement.previous_stock} → <strong>{movement.new_stock}</strong>
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: colorTokens.textPrimary }}>
                            {movement.reason}
                          </Typography>
                          {movement.notes && (
                            <Typography variant="caption" sx={{ color: colorTokens.textSecondary, display: 'block' }}>
                              {movement.notes}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: colorTokens.textPrimary }}>
                            {movement.Users ? 
                              `${movement.Users.firstName} ${movement.Users.lastName}` : 
                              'Sistema'
                            }
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* ✅ PESTAÑA TRASPASOS v8.4 */}
      {currentTab === 'transfers' && (
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
              <TransferIcon />
              Traspasos Entre Almacenes
            </Typography>
          </Box>

          <Box sx={{ p: 4, textAlign: 'center' }}>
            <TransferIcon sx={{ fontSize: 80, color: colorTokens.textSecondary, mb: 2 }} />
            <Typography variant="h6" sx={{ color: colorTokens.textSecondary, mb: 2 }}>
              Sistema de Traspasos Completo
            </Typography>
            <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 3 }}>
              La gestión completa de traspasos entre almacenes estará disponible en la próxima actualización v8.5
            </Typography>
            <Button
              variant="outlined"
              startIcon={<TransferIcon />}
              onClick={openTransferDialog}
              sx={{ 
                color: colorTokens.info,
                borderColor: colorTokens.info,
                px: 4, py: 1.5, borderRadius: 3, fontWeight: 600,
                '&:hover': {
                  borderColor: colorTokens.infoHover,
                  backgroundColor: `${colorTokens.info}10`
                }
              }}
            >
              Crear Traspaso Individual
            </Button>
          </Box>
        </Paper>
      )}

      {/* ✅ MODAL CREAR ALMACÉN MEJORADO v8.4 */}
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
          pb: 2,
          background: `linear-gradient(135deg, ${colorTokens.brand}10, ${colorTokens.brand}05)`
        }}>
          <BusinessIcon sx={{ color: colorTokens.brand, fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Crear Nuevo Almacén
            </Typography>
            <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
              Configura un nuevo almacén para el sistema multi-ubicación
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <Grid container spacing={3}>
            {/* ✅ INFORMACIÓN BÁSICA */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ 
                color: colorTokens.brand, 
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <QrCodeIcon />
                Información Básica
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Código del Almacén *"
                value={newWarehouse.code}
                onChange={(e) => setNewWarehouse(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="ALM001, TIENDA01, BODEGA01"
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
                label="Nombre del Almacén *"
                value={newWarehouse.name}
                onChange={(e) => setNewWarehouse(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Almacén Principal, Tienda Centro, Bodega Norte"
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
                <InputLabel>Tipo de Almacén *</InputLabel>
                <Select
                  value={newWarehouse.warehouse_type}
                  label="Tipo de Almacén *"
                  onChange={(e) => setNewWarehouse(prev => ({ ...prev, warehouse_type: e.target.value as WarehouseType }))}
                >
                  {WAREHOUSE_TYPE_CONFIGS.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box display="flex" alignItems="center" gap={2}>
                        {type.icon}
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {type.label}
                          </Typography>
                          <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                            {type.description}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Capacidad Máxima (opcional)"
                type="number"
                value={newWarehouse.max_capacity || ''}
                onChange={(e) => setNewWarehouse(prev => ({ 
                  ...prev, 
                  max_capacity: e.target.value ? parseInt(e.target.value) : undefined
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

            {/* ✅ INFORMACIÓN ADICIONAL */}
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" fontWeight="bold" sx={{ 
                color: colorTokens.info, 
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <LocationIcon />
                Información Adicional
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Descripción"
                value={newWarehouse.description}
                onChange={(e) => setNewWarehouse(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción detallada del almacén, ubicación, propósito..."
                multiline
                rows={2}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Dirección Completa"
                value={newWarehouse.address}
                onChange={(e) => setNewWarehouse(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Calle, número, colonia, ciudad, código postal"
                multiline
                rows={2}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon sx={{ color: colorTokens.info }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* ✅ CONFIGURACIÓN */}
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" fontWeight="bold" sx={{ 
                color: colorTokens.success, 
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <CheckCircleIcon />
                Configuración
              </Typography>
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
                label={
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      Establecer como almacén por defecto
                    </Typography>
                    <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                      Los movimientos sin almacén específico usarán este almacén
                    </Typography>
                  </Box>
                }
                sx={{ color: colorTokens.textPrimary }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: `1px solid ${colorTokens.border}`, gap: 2 }}>
          <Button
            onClick={closeCreateWarehouse}
            sx={{ 
              color: colorTokens.textSecondary,
              px: 3, py: 1.5, borderRadius: 3, fontWeight: 600
            }}
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

      {/* 📝 DIALOGS EXISTENTES v8.4 */}
      <ProductStockDialog
        open={stockDialogOpen}
        onClose={closeStockDialog}
        product={selectedProduct}
        onSave={handleStockSave}
      />

      {/* ✅ NUEVO: WAREHOUSE TRANSFER DIALOG CONECTADO v8.4 */}
      <WarehouseTransferDialog
        open={transferDialogOpen}
        onClose={closeTransferDialog}
        product={selectedProduct}
        onSave={handleTransferSave}
      />
    </Box>
  );
}