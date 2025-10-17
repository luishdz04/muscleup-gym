// src/app/(protected)/dashboard/admin/catalogo/inventario/page.tsx
'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  Divider,
  Badge,
  Fade,
  Slide,
  Zoom,
  Skeleton,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon
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
  Assessment as AssessmentIcon,
  Add as AddIcon,
  Store as StoreIcon,
  Warehouse as WarehouseIcon,
  BusinessCenter as BusinessIcon,
  SwapHoriz as TransferIcon,
  Inventory2 as Inventory2Icon,
  LocationOn as LocationIcon,
  QrCode as QrCodeIcon,
  Timeline as TimelineIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Category as CategoryIcon,
  AutoAwesome as AutoAwesomeIcon,
  TrendingFlat as TrendingFlatIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { useUserTracking } from '@/hooks/useUserTracking';
import { useEntityCRUD } from '@/hooks/useEntityCRUD';
import { useInventoryManagement } from '@/hooks/useInventoryManagement';
import { useProductStock } from '@/hooks/useProductStock';
import { notify } from '@/utils/notifications';
import { useNotifications } from '@/hooks/useNotifications';
import { 
  formatTimestampForDisplay,
  getCurrentTimestamp,
  getTodayInMexico
} from '@/utils/dateUtils';
import ProductStockDialog from '@/components/catalogo/ProductStockDialog';
import WarehouseTransferDialog from '@/components/catalogo/WarehouseTransferDialog';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

// Types and Interfaces
type StockLevelFilter = '' | 'sin_stock' | 'stock_bajo' | 'stock_normal' | 'sobre_stock';
type ProductStatus = 'active' | 'inactive' | 'all';
type StockColor = 'error' | 'warning' | 'success' | 'info';
type TabValue = 'inventory' | 'movements';
type WarehouseType = 'store' | 'central' | 'warehouse' | 'temporary';

interface Product {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  current_stock: number;
  total_system_stock?: number; // ✅ OPCIONAL - Fallback a current_stock si no existe
  reserved_stock?: number;
  min_stock: number;
  max_stock?: number;
  cost_price?: number;
  sale_price?: number;
  unit?: string;
  is_active?: boolean;
  warehouse_stocks?: {
    warehouse_id: string;
    current_stock: number;
    reserved_stock: number;
    available_stock: number;
    min_stock: number;
    max_stock?: number;
  }[];
}

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
  auto_generated?: boolean;
  skip_stock_processing?: boolean;
  reference_id?: string;
  created_at: string;
  created_by?: string;
  products?: {
    id: string;
    name: string;
    sku?: string;
    unit?: string;
    category?: string;
  };
  target_warehouse?: {
    id: string;
    name: string;
    code: string;
    warehouse_type: string;
  };
  source_warehouse?: {
    id: string;
    name: string;
    code: string;
    warehouse_type: string;
  };
  Users?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface Warehouse {
  id: string;
  code: string;
  name: string;
  description?: string;
  address?: any;
  warehouse_type: WarehouseType;
  is_active: boolean;
  is_default: boolean;
  manager_user_id?: string;
  auto_restock_enabled: boolean;
  min_stock_threshold: number;
  max_capacity?: number;
  current_capacity?: number;
  operating_hours?: any;
  time_zone?: string;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

interface InventoryStats {
  total: number;
  sinStock: number;
  critical: number;
  available: number;
  totalValue: number;
  totalWarehouses: number;
}

// Constants
const STOCK_FILTERS: readonly { value: StockLevelFilter; label: string; icon: React.ReactElement; color: string }[] = [
  { value: '', label: 'Todos los productos', icon: <InventoryIcon />, color: colorTokens.textSecondary },
  { value: 'stock_normal', label: 'Stock disponible', icon: <CheckCircleIcon />, color: colorTokens.success },
  { value: 'stock_bajo', label: 'Stock crítico', icon: <WarningIcon />, color: colorTokens.warning },
  { value: 'sin_stock', label: 'Sin stock', icon: <TrendingDownIcon />, color: colorTokens.danger },
  { value: 'sobre_stock', label: 'Sobre stock', icon: <TrendingUpIcon />, color: colorTokens.info }
] as const;

const STATUS_FILTERS: readonly { value: ProductStatus; label: string; icon: React.ReactElement; color: string }[] = [
  { value: 'active', label: 'Productos Activos', icon: <CheckCircleIcon />, color: colorTokens.success },
  { value: 'inactive', label: 'Productos Inactivos', icon: <WarningIcon />, color: colorTokens.danger },
  { value: 'all', label: 'Todos los Productos', icon: <InventoryIcon />, color: colorTokens.textSecondary }
] as const;

const MOVEMENT_TYPE_LABELS: Record<string, { label: string; color: string; icon: React.ReactElement }> = {
  'recepcion_compra': { label: 'Recepción Compra', color: colorTokens.success, icon: <TrendingUpIcon /> },
  'devolucion': { label: 'Devolución', color: colorTokens.success, icon: <TrendingUpIcon /> },
  'ajuste_manual_mas': { label: 'Ajuste Manual (+)', color: colorTokens.success, icon: <TrendingUpIcon /> },
  'inventario_inicial': { label: 'Inventario Inicial', color: colorTokens.info, icon: <InventoryIcon /> },
  'venta_directa': { label: 'Venta Directa', color: colorTokens.danger, icon: <TrendingDownIcon /> },
  'venta_apartado': { label: 'Venta Apartado', color: colorTokens.danger, icon: <TrendingDownIcon /> },
  'reserva_apartado': { label: 'Reserva Apartado', color: colorTokens.warning, icon: <TrendingFlatIcon /> },
  'cancelar_reserva': { label: 'Cancelar Reserva', color: colorTokens.info, icon: <TrendingFlatIcon /> },
  'ajuste_manual_menos': { label: 'Ajuste Manual (-)', color: colorTokens.danger, icon: <TrendingDownIcon /> },
  'merma': { label: 'Merma/Dañado', color: colorTokens.danger, icon: <TrendingDownIcon /> },
  'transferencia_entrada': { label: 'Transferencia Entrada', color: colorTokens.info, icon: <TransferIcon /> },
  'transferencia_salida': { label: 'Transferencia Salida', color: colorTokens.warning, icon: <TransferIcon /> },
  'traspaso_salida': { label: 'Traspaso Salida', color: colorTokens.brand, icon: <TransferIcon /> },
  'traspaso_entrada': { label: 'Traspaso Entrada', color: colorTokens.brand, icon: <TransferIcon /> },
  'reabastecimiento_auto': { label: 'Reabastecimiento Auto', color: colorTokens.info, icon: <AutoAwesomeIcon /> },
  'consolidacion_inventario': { label: 'Consolidación', color: colorTokens.brand, icon: <TransferIcon /> },
  'transferencia_directa': { label: 'Transferencia Directa', color: colorTokens.brand, icon: <TransferIcon /> },
  'distribucion_central': { label: 'Distribución Central', color: colorTokens.info, icon: <BusinessIcon /> }
} as const;

const WAREHOUSE_TYPES = [
  { value: 'store', label: 'Tienda', description: 'Punto de venta directo al cliente' },
  { value: 'central', label: 'Almacén Central', description: 'Distribución y almacenamiento principal' },
  { value: 'warehouse', label: 'Bodega', description: 'Almacenamiento general' },
  { value: 'temporary', label: 'Temporal', description: 'Ubicación temporal o móvil' }
] as const;

export default function InventarioPage() {
  // Router
  const router = useRouter();

  // State Management
  const [currentTab, setCurrentTab] = useState<TabValue>('inventory');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<ProductStatus>('active');
  const [selectedStockLevel, setSelectedStockLevel] = useState<StockLevelFilter>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(15);
  const [showFilters, setShowFilters] = useState<boolean>(true);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockDialogOpen, setStockDialogOpen] = useState<boolean>(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState<boolean>(false);
  const [createWarehouseOpen, setCreateWarehouseOpen] = useState<boolean>(false);

  const [newWarehouse, setNewWarehouse] = useState({
    code: '',
    name: '',
    warehouse_type: 'store' as WarehouseType,
    description: '',
    address: '',
    phone: '',
    is_default: false,
    max_capacity: undefined as number | undefined,
    auto_restock_enabled: false,
    min_stock_threshold: 10
  });

  const [warehouseStocks, setWarehouseStocks] = useState<Record<string, Record<string, number>>>({});
  const [loadingWarehouseStocks, setLoadingWarehouseStocks] = useState<boolean>(false);

  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // Hooks
  const hydrated = useHydrated();
  const { addAuditFieldsFor } = useUserTracking();
  const { toast } = useNotifications();
  const supabase = createBrowserSupabaseClient();
  
  // CRUD Hooks
  const { 
    data: warehouses, 
    createItem: createWarehouse, 
    updateItem: updateWarehouse,
    fetchData: reloadWarehouses,
    loading: warehousesLoading,
    stats: warehouseStats
  } = useEntityCRUD<Warehouse>({
    tableName: 'warehouses',
    selectQuery: 'id, code, name, description, address, warehouse_type, is_active, is_default, auto_restock_enabled, min_stock_threshold, max_capacity, created_at, updated_at, created_by, updated_by'
  });

  const { 
    data: rawMovements, 
    fetchData: reloadMovements,
    loading: movementsLoading,
    stats: movementStats
  } = useEntityCRUD<InventoryMovement>({
    tableName: 'inventory_movements',
    selectQuery: `
      id, product_id, source_warehouse_id, target_warehouse_id,
      movement_type, quantity, previous_stock, new_stock,
      unit_cost, total_cost, reason, notes, auto_generated,
      skip_stock_processing, reference_id,
      created_at, created_by,
      products!product_id (id, name, sku, unit, category),
      target_warehouse:warehouses!target_warehouse_id (id, name, code, warehouse_type),
      source_warehouse:warehouses!source_warehouse_id (id, name, code, warehouse_type),
      Users!created_by (id, firstName, lastName)
    `
  });

  const movements = useMemo(() => {
    if (!rawMovements) return [];
    return rawMovements
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50);
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

  // Data Loading Functions
  const loadWarehouseStocks = useCallback(async () => {
    if (!selectedWarehouse || products.length === 0) return;
    
    setLoadingWarehouseStocks(true);
    
    try {
      const { data, error } = await supabase
        .from('product_warehouse_stock')
        .select(`
          product_id, 
          current_stock, 
          available_stock, 
          reserved_stock,
          min_stock,
          max_stock,
          last_movement_at
        `)
        .eq('warehouse_id', selectedWarehouse)
        .order('last_movement_at', { ascending: false });
      
      if (error) throw error;
      
      const stocksByProduct: Record<string, number> = {};
      (data || []).forEach(item => {
        stocksByProduct[item.product_id] = item.current_stock || 0;
      });
      
      setWarehouseStocks(prev => ({ ...prev, [selectedWarehouse]: stocksByProduct }));
      
      const warehouseName = warehouses?.find(w => w.id === selectedWarehouse)?.name || 'Desconocido';
      
      if (!data || data.length === 0) {
        notify.warning(`Almacén "${warehouseName}" no tiene productos registrados`);
      } else {
        notify.success(`Stock actualizado: ${data.length} productos en ${warehouseName}`);
      }
      
    } catch (error: any) {
      notify.error('Error cargando stock del almacén: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoadingWarehouseStocks(false);
    }
  }, [selectedWarehouse, products, supabase, warehouses]);

  const loadInitialData = useCallback(async () => {
    try {
      await Promise.all([
        reloadWarehouses(),
        reloadProducts(),
        reloadMovements()
      ]);
      
      notify.success('Datos cargados correctamente');
      
    } catch (error: any) {
      notify.error('Error cargando datos: ' + error.message);
    }
  }, [reloadWarehouses, reloadProducts, reloadMovements]);

  // Effects - CON CONTROL DE EJECUCIÓN ÚNICA
  const hasLoadedInitialData = useRef(false);

  useEffect(() => {
    if (!hydrated || hasLoadedInitialData.current) return;
    hasLoadedInitialData.current = true;

    loadInitialData();
  }, [hydrated]); // ✅ Removido loadInitialData de dependencies

  useEffect(() => {
    if (selectedWarehouse) {
      loadWarehouseStocks();
    }
  }, [selectedWarehouse, loadWarehouseStocks]);

  // ✅ CORRECCIÓN: Computed Values con fallback seguro
  const enhancedStockStats = useMemo((): InventoryStats => {
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
      const stock = product.total_system_stock || product.current_stock || 0; // ✅ FALLBACK SEGURO
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

  const uniqueCategories = useMemo(() => {
    return [...new Set(
      products
        .map((p: Product) => p.category)
        .filter((category): category is string => Boolean(category))
    )].sort();
  }, [products]);

  // ✅ CORRECCIÓN: Filtros con fallback seguro
  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter((product: Product) => 
        selectedStatus === 'active' ? product.is_active !== false : product.is_active === false
      );
    }

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((product: Product) => 
        product.name.toLowerCase().includes(searchLower) ||
        product.sku?.toLowerCase().includes(searchLower) ||
        product.category?.toLowerCase().includes(searchLower)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((product: Product) => product.category === selectedCategory);
    }

    if (selectedWarehouse) {
      const warehouseStockData = warehouseStocks[selectedWarehouse] || {};
      filtered = filtered.filter((product: Product) => {
        const warehouseStock = warehouseStockData[product.id] || 0;
        return warehouseStock > 0;
      });
    }

    if (selectedStockLevel) {
      filtered = filtered.filter((product: Product) => {
        let stock = product.total_system_stock || product.current_stock || 0; // ✅ FALLBACK SEGURO
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

  const paginatedProducts = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredProducts.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredProducts, page, rowsPerPage]);

  // ✅ CORRECCIÓN: Utility Functions con fallback seguro
  const utilityFunctions = useMemo(() => ({
    formatPrice: (price: number): string => {
      const numPrice = typeof price === 'number' ? price : 0;
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(numPrice);
    },
    
    formatDate: (dateString: string): string => {
      return formatTimestampForDisplay(dateString);
    },
    
    getStockColor: (product: Product, useWarehouseStock = false): StockColor => {
      let stock = product.total_system_stock || product.current_stock || 0; // ✅ FALLBACK SEGURO
      
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
      let stock = product.total_system_stock || product.current_stock || 0; // ✅ FALLBACK SEGURO
      
      if (useWarehouseStock && selectedWarehouse) {
        const warehouseStockData = warehouseStocks[selectedWarehouse] || {};
        stock = warehouseStockData[product.id] || 0;
      }
      
      const maxStock = product.max_stock || stock * 2 || 100;
      return Math.min((stock / maxStock) * 100, 100);
    },

    getStockStatusText: (product: Product, useWarehouseStock = false): string => {
      let stock = product.total_system_stock || product.current_stock || 0; // ✅ FALLBACK SEGURO
      
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
      if (!selectedWarehouse) return product.total_system_stock || product.current_stock || 0; // ✅ FALLBACK SEGURO
      const warehouseStockData = warehouseStocks[selectedWarehouse] || {};
      return warehouseStockData[product.id] || 0;
    },

    getMovementBadge: (movement: InventoryMovement): React.ReactElement | null => {
      if (movement.auto_generated) {
        return (
          <Chip
            size="small"
            icon={<AutoAwesomeIcon />}
            label="Auto"
            sx={{
              backgroundColor: `${colorTokens.brand}20`,
              color: colorTokens.brand,
              ml: 1,
              fontWeight: 600
            }}
          />
        );
      }
      return null;
    }
  }), [selectedWarehouse, warehouseStocks]);

  // Event Handlers
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
      notify.info('Filtros limpiados');
    },
    toggleFilters: () => {
      setShowFilters(prev => !prev);
    }
  }), []);

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
        auto_restock_enabled: newWarehouse.auto_restock_enabled,
        min_stock_threshold: newWarehouse.min_stock_threshold,
        created_at: getCurrentTimestamp(),
        updated_at: getCurrentTimestamp()
      };

      await createWarehouse(warehouseData);
      
      notify.success(`Almacén ${newWarehouse.name} creado exitosamente`);
      setCreateWarehouseOpen(false);
      resetNewWarehouse();
      
      setTimeout(() => {
        reloadWarehouses();
      }, 1000);
      
    } catch (error: any) {
      notify.error('Error creando almacén: ' + error.message);
    }
  }, [newWarehouse, createWarehouse, reloadWarehouses]);

  const resetNewWarehouse = useCallback(() => {
    setNewWarehouse({
      code: '',
      name: '',
      warehouse_type: 'store',
      description: '',
      address: '',
      phone: '',
      is_default: false,
      max_capacity: undefined,
      auto_restock_enabled: false,
      min_stock_threshold: 10
    });
  }, []);

  const closeNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

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

  const handleStockSave = useCallback(() => {
    Promise.all([
      reloadProducts(),
      reloadMovements()
    ]).then(() => {
      if (selectedWarehouse) {
        loadWarehouseStocks();
      }
      notify.success('Stock actualizado correctamente');
    });
    
    closeStockDialog();
  }, [reloadProducts, reloadMovements, selectedWarehouse, loadWarehouseStocks, closeStockDialog]);

  const handleTransferSave = useCallback(() => {
    Promise.all([
      reloadProducts(),
      reloadMovements()
    ]).then(() => {
      if (selectedWarehouse) {
        loadWarehouseStocks();
      }
      notify.success('Traspaso procesado correctamente');
    });
    
    closeTransferDialog();
  }, [reloadProducts, reloadMovements, selectedWarehouse, loadWarehouseStocks, closeTransferDialog]);

  const handlePageChange = useCallback((_: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const reload = useCallback(() => {
    loadInitialData();
    notify.info('Recargando datos del sistema...');
  }, [loadInitialData]);

  // SSR Safety
  if (!hydrated) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
        flexDirection: 'column',
        gap: 3
      }}>
        <Box sx={{ 
          background: `linear-gradient(135deg, ${colorTokens.brand}20, ${colorTokens.brand}10)`,
          borderRadius: 4,
          p: 4,
          textAlign: 'center',
          border: `2px solid ${colorTokens.brand}30`
        }}>
          <CircularProgress size={80} sx={{ color: colorTokens.brand, mb: 3 }} />
          <Typography variant="h4" fontWeight="bold" sx={{ color: colorTokens.brand, mb: 1 }}>
            MuscleUp Gym
          </Typography>
          <Typography variant="h6" sx={{ color: colorTokens.textSecondary, mb: 2 }}>
            Cargando Sistema de Inventario
          </Typography>
          <LinearProgress 
            sx={{ 
              backgroundColor: colorTokens.neutral400,
              '& .MuiLinearProgress-bar': {
                backgroundColor: colorTokens.brand
              },
              borderRadius: 2,
              height: 6
            }} 
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
      color: colorTokens.textPrimary,
      p: { xs: 1.5, sm: 2, md: 3 },
      position: 'relative'
    }}>
      {/* Speed Dial - Solo acciones necesarias - Responsive */}
      <SpeedDial
        ariaLabel="Acciones Rápidas"
        sx={{
          position: 'fixed',
          bottom: { xs: 16, sm: 24, md: 32 },
          right: { xs: 16, sm: 24, md: 32 },
          '& .MuiFab-primary': {
            background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
            color: colorTokens.textOnBrand,
            width: { xs: 48, sm: 56 },
            height: { xs: 48, sm: 56 }
          }
        }}
        icon={<SpeedDialIcon icon={<InventoryIcon />} openIcon={<SettingsIcon />} />}
      >
        <SpeedDialAction
          icon={<WarehouseIcon />}
          tooltipTitle="Ver Almacenes"
          onClick={() => router.push('/dashboard/admin/catalogo/almacenes')}
          sx={{ 
            '& .MuiFab-primary': {
              backgroundColor: colorTokens.brand,
              color: colorTokens.textOnBrand
            }
          }}
        />
        <SpeedDialAction
          icon={<TransferIcon />}
          tooltipTitle="Crear Traspaso"
          onClick={openTransferDialog}
          sx={{ 
            '& .MuiFab-primary': {
              backgroundColor: colorTokens.info,
              color: colorTokens.textOnBrand
            }
          }}
        />
        <SpeedDialAction
          icon={<RefreshIcon />}
          tooltipTitle="Actualizar Datos"
          onClick={reload}
          sx={{ 
            '& .MuiFab-primary': {
              backgroundColor: colorTokens.warning,
              color: colorTokens.textOnBrand
            }
          }}
        />
      </SpeedDial>

      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={closeNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        TransitionComponent={Slide}
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
            color: colorTokens.textOnBrand,
            fontWeight: 700,
            borderRadius: 4,
            boxShadow: `0 8px 32px ${colorTokens.glow}`,
            border: `1px solid ${colorTokens.brand}30`
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Header with Statistics - LIMPIO Y PROFESIONAL */}
      <Fade in timeout={1000}>
        <Paper sx={{
          p: 4,
          mb: 4,
          background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
          border: `2px solid ${colorTokens.brand}30`,
          borderRadius: 4,
          boxShadow: `0 12px 40px ${colorTokens.glow}`,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${colorTokens.brand}, ${colorTokens.brandHover})`
          }
        }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography 
                variant="h3" 
                component="h1" 
                sx={{
                  fontWeight: 900,
                  color: colorTokens.brand,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 1,
                  textShadow: `0 2px 8px ${colorTokens.glow}`
                }}
              >
                <WarehouseIcon sx={{ fontSize: 50 }} />
                Sistema de inventario MUP
              </Typography>
              <Typography sx={{ 
                color: colorTokens.textSecondary,
                fontWeight: 400,
                fontSize: '1.1rem'
              }}>
                Gestión integral de inventario MUP
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={2}>
              <Tooltip title="Gestionar Almacenes">
                <Button
                  variant="outlined"
                  startIcon={<WarehouseIcon />}
                  onClick={() => router.push('/dashboard/admin/catalogo/almacenes')}
                  sx={{ 
                    color: colorTokens.brand,
                    borderColor: colorTokens.brand,
                    px: 3, py: 1.5, borderRadius: 3, fontWeight: 700,
                    background: `${colorTokens.brand}05`,
                    '&:hover': {
                      borderColor: colorTokens.brandHover,
                      backgroundColor: `${colorTokens.brand}15`
                    }
                  }}
                >
                  Ver Almacenes
                </Button>
              </Tooltip>

              <Tooltip title="Crear Traspaso Entre Almacenes">
                <Button
                  variant="outlined"
                  startIcon={<TransferIcon />}
                  onClick={openTransferDialog}
                  sx={{ 
                    color: colorTokens.info,
                    borderColor: colorTokens.info,
                    px: 3, py: 1.5, borderRadius: 3, fontWeight: 700,
                    background: `${colorTokens.info}05`,
                    '&:hover': {
                      borderColor: colorTokens.infoHover,
                      backgroundColor: `${colorTokens.info}15`
                    }
                  }}
                >
                  Crear Traspaso
                </Button>
              </Tooltip>
              
              <Tooltip title="Actualizar Datos del Sistema">
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
              </Tooltip>
            </Stack>
          </Box>

          {/* Statistics Grid - MEJORADO VISUALMENTE */}
          {productsLoading && !enhancedStockStats ? (
            <Box display="flex" justifyContent="center" py={4}>
              <Stack direction="row" spacing={2} alignItems="center">
                <CircularProgress sx={{ color: colorTokens.brand }} />
                <Typography sx={{ color: colorTokens.textSecondary }}>
                  Cargando estadísticas...
                </Typography>
              </Stack>
            </Box>
          ) : (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                <Zoom in timeout={500}>
                  <Card sx={{ 
                    background: `linear-gradient(135deg, ${colorTokens.info}15, ${colorTokens.info}10)`, 
                    border: `1px solid ${colorTokens.info}30`,
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 25px ${colorTokens.info}20`
                    }
                  }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="h3" fontWeight="bold" sx={{ color: colorTokens.info }}>
                            {enhancedStockStats.total}
                          </Typography>
                          <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                            Productos Total
                          </Typography>
                        </Box>
                        <InventoryIcon sx={{ fontSize: 40, color: colorTokens.info, opacity: 0.8 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Zoom>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                <Zoom in timeout={700}>
                  <Card sx={{ 
                    background: `linear-gradient(135deg, ${colorTokens.success}15, ${colorTokens.success}10)`, 
                    border: `1px solid ${colorTokens.success}30`,
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 25px ${colorTokens.success}20`
                    }
                  }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="h3" fontWeight="bold" sx={{ color: colorTokens.success }}>
                            {enhancedStockStats.available}
                          </Typography>
                          <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                            Stock Disponible
                          </Typography>
                        </Box>
                        <CheckCircleIcon sx={{ fontSize: 40, color: colorTokens.success, opacity: 0.8 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Zoom>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                <Zoom in timeout={900}>
                  <Card sx={{ 
                    background: `linear-gradient(135deg, ${colorTokens.warning}15, ${colorTokens.warning}10)`, 
                    border: `1px solid ${colorTokens.warning}30`,
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 25px ${colorTokens.warning}20`
                    }
                  }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="h3" fontWeight="bold" sx={{ color: colorTokens.warning }}>
                            {enhancedStockStats.critical}
                          </Typography>
                          <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                            Stock Crítico
                          </Typography>
                        </Box>
                        <WarningIcon sx={{ fontSize: 40, color: colorTokens.warning, opacity: 0.8 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Zoom>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                <Zoom in timeout={1100}>
                  <Card sx={{ 
                    background: `linear-gradient(135deg, ${colorTokens.danger}15, ${colorTokens.danger}10)`, 
                    border: `1px solid ${colorTokens.danger}30`,
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 25px ${colorTokens.danger}20`
                    }
                  }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="h3" fontWeight="bold" sx={{ color: colorTokens.danger }}>
                            {enhancedStockStats.sinStock}
                          </Typography>
                          <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                            Sin Stock
                          </Typography>
                        </Box>
                        <TrendingDownIcon sx={{ fontSize: 40, color: colorTokens.danger, opacity: 0.8 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Zoom>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                <Zoom in timeout={1300}>
                  <Card sx={{ 
                    background: `linear-gradient(135deg, ${colorTokens.brand}15, ${colorTokens.brand}10)`, 
                    border: `1px solid ${colorTokens.brand}30`,
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 25px ${colorTokens.brand}20`
                    }
                  }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="h3" fontWeight="bold" sx={{ color: colorTokens.brand }}>
                            {enhancedStockStats.totalWarehouses}
                          </Typography>
                          <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                            Almacenes
                          </Typography>
                        </Box>
                        <BusinessIcon sx={{ fontSize: 40, color: colorTokens.brand, opacity: 0.8 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Zoom>
              </Grid>
            </Grid>
          )}

          {/* ✅ VALOR TOTAL DESTACADO CORRECTAMENTE */}
          <Box sx={{ 
            mt: 4, 
            p: 3, 
            background: `linear-gradient(135deg, ${colorTokens.brand}10, ${colorTokens.brand}05)`,
            borderRadius: 3,
            border: `2px solid ${colorTokens.brand}30`,
            textAlign: 'center'
          }}>
            <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 1, fontWeight: 600 }}>
              Valor Total del Inventario
            </Typography>
            <Typography variant="h2" fontWeight="bold" sx={{ 
              color: colorTokens.brand,
              textShadow: `0 2px 12px ${colorTokens.glow}`,
              letterSpacing: '-0.02em'
            }}>
              {utilityFunctions.formatPrice(enhancedStockStats.totalValue)}
            </Typography>
          </Box>
        </Paper>
      </Fade>

      {/* Navigation Tabs - SOLO INVENTARIO Y MOVIMIENTOS */}
      <Slide in direction="up" timeout={800}>
        <Paper sx={{ 
          mb: 3,
          background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
          border: `1px solid ${colorTokens.border}`,
          borderRadius: 3,
          overflow: 'hidden'
        }}>
          <Tabs
            value={currentTab}
            onChange={(_, newValue) => setCurrentTab(newValue)}
            variant="fullWidth"
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: colorTokens.brand,
                height: 4,
                borderRadius: '2px 2px 0 0'
              },
              '& .MuiTab-root': {
                color: colorTokens.textSecondary,
                fontWeight: 700,
                fontSize: '1.1rem',
                minHeight: 64,
                transition: 'all 0.3s ease',
                '&.Mui-selected': {
                  color: colorTokens.brand,
                  backgroundColor: `${colorTokens.brand}05`
                },
                '&:hover': {
                  backgroundColor: `${colorTokens.brand}10`
                }
              }
            }}
          >
            <Tab 
              icon={<Badge badgeContent={filteredProducts.length} color="primary"><InventoryIcon /></Badge>} 
              label="Inventario" 
              value="inventory"
              iconPosition="start"
            />
            <Tab 
              icon={<Badge badgeContent={movements.length} color="secondary"><TimelineIcon /></Badge>} 
              label="Movimientos" 
              value="movements"
              iconPosition="start"
            />
          </Tabs>
        </Paper>
      </Slide>

      {/* Tab Content */}
      {currentTab === 'inventory' && (
        <>
          {/* Filters */}
          <Fade in timeout={600}>
            <Paper sx={{ 
              mb: 3,
              background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
              border: `1px solid ${colorTokens.border}`,
              borderRadius: 3,
              overflow: 'hidden'
            }}>
              <Box sx={{ 
                p: 2, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderBottom: showFilters ? `1px solid ${colorTokens.border}` : 'none',
                background: `${colorTokens.brand}05`
              }}>
                <Box sx={{ 
                  color: colorTokens.textPrimary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <SearchIcon sx={{ color: colorTokens.brand }} />
                  <Typography component="span" variant="h6" fontWeight="bold">
                    Filtros de Búsqueda
                  </Typography>
                  {(searchTerm || selectedCategory || selectedStockLevel || selectedWarehouse) && (
                    <Chip 
                      label="Activos"
                      size="small"
                      sx={{
                        backgroundColor: `${colorTokens.brand}20`,
                        color: colorTokens.brand,
                        fontWeight: 600,
                        ml: 1
                      }}
                    />
                  )}
                </Box>
                <Button
                  startIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  onClick={memoizedHandlers.toggleFilters}
                  sx={{ 
                    color: colorTokens.textSecondary,
                    fontWeight: 600
                  }}
                >
                  {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
                </Button>
              </Box>
              
              <Collapse in={showFilters} timeout={400}>
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
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: colorTokens.brand
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: colorTokens.brand
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
                            const typeIcon = warehouse.warehouse_type === 'store' ? <StoreIcon /> :
                                           warehouse.warehouse_type === 'central' ? <BusinessIcon /> :
                                           <WarehouseIcon />;
                            return (
                              <MenuItem key={warehouse.id} value={warehouse.id}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  {typeIcon}
                                  {warehouse.name} ({warehouse.code})
                                  {warehouse.is_default && (
                                    <Chip 
                                      label="Default"
                                      size="small"
                                      sx={{
                                        backgroundColor: `${colorTokens.brand}20`,
                                        color: colorTokens.brand,
                                        ml: 1
                                      }}
                                    />
                                  )}
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
                              <Box display="flex" alignItems="center" gap={1}>
                                <CategoryIcon />
                                {category}
                              </Box>
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
                              <Box display="flex" alignItems="center" gap={1}>
                                {filter.icon}
                                {filter.label}
                              </Box>
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
                              <Box display="flex" alignItems="center" gap={1}>
                                {filter.icon}
                                {filter.label}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid size={{ xs: 12, md: 1.0 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.brand }}>
                          {filteredProducts.length}
                        </Typography>
                        <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                          de {products.length}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid size={{ xs: 12, md: 0.9 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<FilterIcon />}
                        onClick={memoizedHandlers.clearFilters}
                        sx={{
                          color: colorTokens.textSecondary,
                          borderColor: `${colorTokens.textSecondary}40`,
                          '&:hover': {
                            borderColor: colorTokens.textSecondary,
                            backgroundColor: `${colorTokens.textSecondary}10`
                          }
                        }}
                      >
                        Limpiar
                      </Button>
                    </Grid>
                  </Grid>

                  {selectedWarehouse && (
                    <Box sx={{ mt: 2 }}>
                      {loadingWarehouseStocks ? (
                        <Alert 
                          severity="info" 
                          sx={{ 
                            backgroundColor: `${colorTokens.info}10`,
                            border: `1px solid ${colorTokens.info}30`,
                            borderRadius: 2
                          }}
                          icon={<CircularProgress size={16} sx={{ color: colorTokens.info }} />}
                        >
                          Cargando stock del almacén {warehouses?.find(w => w.id === selectedWarehouse)?.name}...
                        </Alert>
                      ) : (
                        <Alert 
                          severity={filteredProducts.length > 0 ? "success" : "warning"} 
                          sx={{ 
                            backgroundColor: filteredProducts.length > 0 ? `${colorTokens.success}10` : `${colorTokens.warning}10`,
                            border: `1px solid ${filteredProducts.length > 0 ? colorTokens.success : colorTokens.warning}30`,
                            borderRadius: 2
                          }}
                        >
                          Almacén: {warehouses?.find(w => w.id === selectedWarehouse)?.name} - {filteredProducts.length} productos con stock
                        </Alert>
                      )}
                    </Box>
                  )}
                </Box>
              </Collapse>
            </Paper>
          </Fade>

          {/* Products Table */}
          <Fade in timeout={1000}>
            <Paper sx={{ 
              background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
              border: `1px solid ${colorTokens.border}`,
              borderRadius: 3,
              overflow: 'hidden'
            }}>
              <Box sx={{ 
                p: 3, 
                borderBottom: `1px solid ${colorTokens.border}`,
                background: `${colorTokens.brand}05`
              }}>
                <Box sx={{ 
                  color: colorTokens.textPrimary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <InventoryIcon sx={{ color: colorTokens.brand }} />
                  <Typography component="span" variant="h6" fontWeight="bold">
                    Inventario Multi-Almacén
                  </Typography>
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
                  <Chip 
                    label={`${filteredProducts.length} productos`}
                    size="small"
                    sx={{
                      backgroundColor: `${colorTokens.info}20`,
                      color: colorTokens.info,
                      ml: 1,
                      fontWeight: 600
                    }}
                  />
                </Box>
              </Box>

              {productsLoading || loadingWarehouseStocks ? (
                <Box sx={{ p: 4 }}>
                  <Stack spacing={2}>
                    {[...Array(5)].map((_, index) => (
                      <Skeleton 
                        key={index}
                        variant="rectangular" 
                        height={80} 
                        sx={{ 
                          borderRadius: 2,
                          backgroundColor: `${colorTokens.neutral400}20`
                        }} 
                      />
                    ))}
                  </Stack>
                </Box>
              ) : (
                <>
                  <TableContainer sx={{ overflowX: 'auto' }}>
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
                        {paginatedProducts.map((product: Product, index) => {
                          const useWarehouseStock = Boolean(selectedWarehouse);
                          const stockColor = utilityFunctions.getStockColor(product, useWarehouseStock);
                          const stockPercentage = utilityFunctions.getStockPercentage(product, useWarehouseStock);
                          const displayStock = useWarehouseStock ? 
                            utilityFunctions.getWarehouseStock(product) : 
                            product.total_system_stock || product.current_stock || 0; // ✅ FALLBACK SEGURO
                          
                          return (
                            <Fade in timeout={200 + (index * 100)} key={product.id}>
                              <TableRow 
                                hover
                                sx={{ 
                                  opacity: product.is_active === false ? 0.6 : 1,
                                  backgroundColor: product.is_active === false ? `${colorTokens.danger}10` : 'transparent',
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    backgroundColor: colorTokens.hoverOverlay,
                                    transform: 'scale(1.01)'
                                  }
                                }}
                              >
                                <TableCell>
                                  <Box display="flex" alignItems="center" gap={2}>
                                    <Avatar sx={{ 
                                      backgroundColor: `${colorTokens.brand}20`,
                                      color: colorTokens.brand,
                                      fontWeight: 'bold',
                                      width: 48,
                                      height: 48
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
                                            color: colorTokens.textOnBrand,
                                            fontWeight: 700,
                                            ml: 1,
                                            fontSize: '0.7rem'
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
                                        Total global: {product.total_system_stock || product.current_stock || 0} {/* ✅ FALLBACK SEGURO */}
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
                                        height: 10,
                                        borderRadius: 5,
                                        backgroundColor: colorTokens.neutral400,
                                        '& .MuiLinearProgress-bar': {
                                          backgroundColor: stockColor === 'error' ? colorTokens.danger :
                                                          stockColor === 'warning' ? colorTokens.warning :
                                                          stockColor === 'info' ? colorTokens.info :
                                                          colorTokens.success,
                                          borderRadius: 5,
                                          transition: 'all 0.3s ease'
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
                                      }40`,
                                      fontWeight: 600
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
                                          transition: 'all 0.3s ease',
                                          '&:hover': {
                                            backgroundColor: `${colorTokens.brand}15`,
                                            transform: 'scale(1.1)'
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
                                          transition: 'all 0.3s ease',
                                          '&:hover': {
                                            backgroundColor: `${colorTokens.info}15`,
                                            transform: 'scale(1.1)'
                                          }
                                        }}
                                      >
                                        <TransferIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Ver Historial">
                                      <IconButton
                                        size="small"
                                        onClick={() => {
                                          setCurrentTab('movements');
                                          notify.info(`Historial de ${product.name}`);
                                        }}
                                        sx={{ 
                                          color: colorTokens.textSecondary,
                                          transition: 'all 0.3s ease',
                                          '&:hover': {
                                            backgroundColor: `${colorTokens.textSecondary}15`,
                                            transform: 'scale(1.1)'
                                          }
                                        }}
                                      >
                                        <HistoryIcon />
                                      </IconButton>
                                    </Tooltip>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            </Fade>
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
                    rowsPerPageOptions={[10, 15, 25, 50]}
                    labelRowsPerPage="Filas por página:"
                    labelDisplayedRows={({ from, to, count }) => 
                      `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                    }
                    sx={{
                      color: colorTokens.textSecondary,
                      borderTop: `1px solid ${colorTokens.border}`,
                      background: `${colorTokens.brand}03`,
                      '& .MuiTablePagination-selectIcon': { color: colorTokens.textSecondary },
                      '& .MuiTablePagination-actions button': { 
                        color: colorTokens.textSecondary,
                        '&:hover': {
                          backgroundColor: `${colorTokens.brand}10`
                        }
                      }
                    }}
                  />
                </>
              )}
            </Paper>
          </Fade>
        </>
      )}

      {/* Movements Tab */}
      {currentTab === 'movements' && (
        <Fade in timeout={800}>
          <Paper sx={{ 
            background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
            border: `1px solid ${colorTokens.border}`,
            borderRadius: 3,
            overflow: 'hidden'
          }}>
            <Box sx={{ 
              p: 3, 
              borderBottom: `1px solid ${colorTokens.border}`,
              background: `${colorTokens.info}05`
            }}>
              <Typography variant="h6" fontWeight="bold" sx={{ 
                color: colorTokens.textPrimary,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <TimelineIcon sx={{ color: colorTokens.info }} />
                Historial de Movimientos
                <Chip 
                  label={`${movements.length} registros`}
                  size="small"
                  sx={{
                    backgroundColor: `${colorTokens.info}20`,
                    color: colorTokens.info,
                    ml: 1,
                    fontWeight: 600
                  }}
                />
              </Typography>
            </Box>

            {movementsLoading ? (
              <Box sx={{ p: 4 }}>
                <Stack spacing={2}>
                  {[...Array(8)].map((_, index) => (
                    <Skeleton 
                      key={index}
                      variant="rectangular" 
                      height={70} 
                      sx={{ 
                        borderRadius: 2,
                        backgroundColor: `${colorTokens.neutral400}20`
                      }} 
                    />
                  ))}
                </Stack>
              </Box>
            ) : movements.length === 0 ? (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <TimelineIcon sx={{ fontSize: 120, color: colorTokens.textSecondary, mb: 3, opacity: 0.5 }} />
                <Typography variant="h5" fontWeight="bold" sx={{ color: colorTokens.textSecondary, mb: 2 }}>
                  No hay movimientos registrados
                </Typography>
                <Typography variant="body1" sx={{ color: colorTokens.textSecondary, mb: 3 }}>
                  Los movimientos de inventario aparecerán aquí cuando realices ajustes de stock o traspasos
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={reload}
                  sx={{
                    color: colorTokens.brand,
                    borderColor: colorTokens.brand,
                    '&:hover': {
                      backgroundColor: `${colorTokens.brand}10`
                    }
                  }}
                >
                  Actualizar Datos
                </Button>
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
                    {movements.map((movement, index) => {
                      const typeConfig = MOVEMENT_TYPE_LABELS[movement.movement_type] || {
                        label: movement.movement_type,
                        color: colorTokens.textSecondary,
                        icon: <HistoryIcon />
                      };
                      
                      return (
                        <Fade in timeout={200 + (index * 50)} key={movement.id}>
                          <TableRow 
                            hover
                            sx={{
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                backgroundColor: colorTokens.hoverOverlay,
                                transform: 'scale(1.005)'
                              }
                            }}
                          >
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                                {utilityFunctions.formatDate(movement.created_at)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={2}>
                                <Avatar sx={{ 
                                  backgroundColor: `${colorTokens.brand}15`,
                                  color: colorTokens.brand,
                                  width: 40,
                                  height: 40,
                                  fontWeight: 'bold'
                                }}>
                                  {movement.products?.name?.charAt(0) || 'P'}
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle2" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                                    {movement.products?.name || 'Producto eliminado'}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                                    SKU: {movement.products?.sku || 'N/A'}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Chip
                                  size="small"
                                  icon={typeConfig.icon}
                                  label={typeConfig.label}
                                  sx={{
                                    backgroundColor: `${typeConfig.color}15`,
                                    color: typeConfig.color,
                                    border: `1px solid ${typeConfig.color}30`,
                                    fontWeight: 600
                                  }}
                                />
                                {utilityFunctions.getMovementBadge(movement)}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box>
                                {movement.target_warehouse && (
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <WarehouseIcon sx={{ fontSize: 16, color: colorTokens.info }} />
                                    <Typography variant="body2" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                                      {movement.target_warehouse.name}
                                    </Typography>
                                  </Box>
                                )}
                                {movement.source_warehouse && (
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                                      Desde: {movement.source_warehouse.name}
                                    </Typography>
                                  </Box>
                                )}
                                {!movement.target_warehouse && !movement.source_warehouse && (
                                  <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                                    Sistema general
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
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                                  {movement.previous_stock}
                                </Typography>
                                <TrendingFlatIcon sx={{ fontSize: 16, color: colorTokens.textSecondary }} />
                                <Typography variant="body2" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                                  {movement.new_stock}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                                {movement.reason}
                              </Typography>
                              {movement.notes && (
                                <Typography variant="caption" sx={{ color: colorTokens.textSecondary, display: 'block' }}>
                                  {movement.notes}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Avatar sx={{ 
                                  backgroundColor: `${colorTokens.success}15`,
                                  color: colorTokens.success,
                                  width: 32,
                                  height: 32,
                                  fontSize: '0.8rem'
                                }}>
                                  {movement.Users?.firstName?.charAt(0) || 'S'}
                                </Avatar>
                                <Typography variant="body2" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                                  {movement.Users ? 
                                    `${movement.Users.firstName} ${movement.Users.lastName}` : 
                                    'Sistema'
                                  }
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        </Fade>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Fade>
      )}

      {/* Create Warehouse Dialog */}
      <Dialog
        open={createWarehouseOpen}
        onClose={closeCreateWarehouse}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
            border: `2px solid ${colorTokens.brand}30`,
            borderRadius: 4,
            boxShadow: `0 12px 40px ${colorTokens.glow}`
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
          background: `linear-gradient(135deg, ${colorTokens.brand}15, ${colorTokens.brand}05)`
        }}>
          <BusinessIcon sx={{ color: colorTokens.brand, fontSize: 32 }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Crear Nuevo Almacén
            </Typography>
            <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
              Configura un nuevo almacén para el sistema multi-ubicación
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <Grid container spacing={3}>
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
                placeholder="ALM001, TIENDA01"
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
                <InputLabel>Tipo de Almacén *</InputLabel>
                <Select
                  value={newWarehouse.warehouse_type}
                  label="Tipo de Almacén *"
                  onChange={(e) => setNewWarehouse(prev => ({ ...prev, warehouse_type: e.target.value as WarehouseType }))}
                >
                  {WAREHOUSE_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box display="flex" alignItems="center" gap={2}>
                        {type.value === 'store' ? <StoreIcon /> :
                         type.value === 'central' ? <BusinessIcon /> :
                         <WarehouseIcon />}
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

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Descripción"
                value={newWarehouse.description}
                onChange={(e) => setNewWarehouse(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción del almacén"
                multiline
                rows={2}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Dirección"
                value={newWarehouse.address}
                onChange={(e) => setNewWarehouse(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Dirección completa"
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

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
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
                label="Almacén por defecto"
                sx={{ color: colorTokens.textPrimary }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={newWarehouse.auto_restock_enabled}
                    onChange={(e) => setNewWarehouse(prev => ({ ...prev, auto_restock_enabled: e.target.checked }))}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: colorTokens.success,
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: colorTokens.success,
                      },
                    }}
                  />
                }
                label="Reabastecimiento automático"
                sx={{ color: colorTokens.textPrimary }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Umbral de Stock Mínimo"
                type="number"
                value={newWarehouse.min_stock_threshold}
                onChange={(e) => setNewWarehouse(prev => ({ 
                  ...prev, 
                  min_stock_threshold: parseInt(e.target.value) || 10
                }))}
                placeholder="10"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <WarningIcon sx={{ color: colorTokens.warning }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: `1px solid ${colorTokens.border}`, gap: 2 }}>
          <Button
            onClick={closeCreateWarehouse}
            sx={{ 
              color: colorTokens.textSecondary,
              px: 4, py: 1.5, borderRadius: 3, fontWeight: 600,
              '&:hover': {
                backgroundColor: `${colorTokens.textSecondary}10`
              }
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
              boxShadow: `0 4px 20px ${colorTokens.brand}40`,
              '&:hover': {
                background: `linear-gradient(135deg, ${colorTokens.brandHover}, ${colorTokens.brand})`,
                transform: 'translateY(-2px)',
                boxShadow: `0 6px 25px ${colorTokens.brand}50`
              },
              '&:disabled': {
                background: colorTokens.neutral400,
                color: colorTokens.textMuted,
                transform: 'none',
                boxShadow: 'none'
              },
              transition: 'all 0.3s ease'
            }}
          >
            {warehousesLoading ? (
              <Stack direction="row" alignItems="center" spacing={1}>
                <CircularProgress size={20} sx={{ color: colorTokens.textOnBrand }} />
                <Typography>Creando...</Typography>
              </Stack>
            ) : (
              <Stack direction="row" alignItems="center" spacing={1}>
                <AddIcon />
                <Typography>Crear Almacén</Typography>
              </Stack>
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Component Dialogs */}
      <ProductStockDialog
        open={stockDialogOpen}
        onClose={closeStockDialog}
        product={selectedProduct}
        onSave={handleStockSave}
      />

      <WarehouseTransferDialog
        open={transferDialogOpen}
        onClose={closeTransferDialog}
        product={selectedProduct}
        onSave={handleTransferSave}
      />
    </Box>
  );
}