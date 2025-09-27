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
  DialogActions
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
  BusinessCenter as BusinessIcon
} from '@mui/icons-material';

// ✅ IMPORTS ENTERPRISE v6.0 CORREGIDOS
import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { useUserTracking } from '@/hooks/useUserTracking';
import { useInventoryManagement } from '@/hooks/useInventoryManagement';
import { useProductStock } from '@/hooks/useProductStock'; // ✅ IMPORTADO CORRECTAMENTE
import { notify } from '@/utils/notifications';
import { 
  formatTimestampForDisplay,
  getCurrentTimestamp,
  getTodayInMexico
} from '@/utils/dateUtils';
import ProductStockDialog from '@/components/catalogo/ProductStockDialog';
import InventoryMovementDialog from '@/components/catalogo/InventoryMovementDialog';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

// ✅ TIPOS ENTERPRISE v6.0 CORREGIDOS - COMPATIBLE CON INVENTORYMOVEMENT
type StockLevelFilter = '' | 'sin_stock' | 'stock_bajo' | 'stock_normal' | 'sobre_stock';
type ProductStatus = 'active' | 'inactive' | 'all';
type StockColor = 'error' | 'warning' | 'success' | 'info';

// ✅ MOVEMENT TYPE EXPLÍCITO v6.0 - COMPATIBLE CON DIALOG
type MovementType = 
  | 'venta_directa' | 'venta_apartado' | 'reserva_apartado' | 'cancelar_reserva'
  | 'devolucion' | 'recepcion_compra' | 'ajuste_manual_mas' | 'ajuste_manual_menos'
  | 'transferencia_entrada' | 'transferencia_salida' | 'merma' | 'inventario_inicial';

interface StockFilter {
  value: StockLevelFilter;
  label: string;
}

interface StatusFilter {
  value: ProductStatus;
  label: string;
}

// ✅ INTERFACE PRODUCT TIPADA v6.0
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
  location?: string;
  is_active?: boolean;
}

// ✅ INTERFACE WAREHOUSE v6.0
interface Warehouse {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  location?: string;
}

// ✅ INTERFACE MOVEMENT EXPANDIDA v6.0 - COMPATIBLE CON INVENTORYMOVEMENT REAL
interface Movement {
  id: string;
  product_id: string;
  warehouse_id?: string;
  movement_type: MovementType; // ✅ CORREGIDO: MovementType específico no string
  quantity: number;
  previous_stock: number;
  new_stock: number;
  unit_cost?: number; // ✅ OPCIONAL - compatible con useInventoryManagement
  total_cost?: number; // ✅ OPCIONAL - compatible con useInventoryManagement
  reason?: string;
  reference_id?: string;
  notes?: string;
  created_at: string;
  created_by?: string;
  products?: {
    id: string;
    name: string;
    sku?: string;
    category?: string;
    current_stock: number;
    reserved_stock?: number;
    min_stock: number;
    max_stock?: number;
    unit?: string;
    location?: string;
  };
  Users?: {
    id: string;
    firstName: string;
    lastName?: string;
    email?: string;
    profilePictureUrl?: string;
  };
}

// ✅ CONFIGURACIONES TIPADAS v6.0
const STOCK_FILTERS: readonly StockFilter[] = [
  { value: '', label: 'Todos los productos' },
  { value: 'stock_normal', label: '✅ Stock disponible' },
  { value: 'stock_bajo', label: '⚠️ Stock bajo' },
  { value: 'sin_stock', label: '❌ Sin stock' },
  { value: 'sobre_stock', label: '📈 Sobre stock' }
] as const;

const STATUS_FILTERS: readonly StatusFilter[] = [
  { value: 'active', label: '✅ Productos Activos' },
  { value: 'inactive', label: '❌ Productos Inactivos' },
  { value: 'all', label: '📋 Todos los Productos' }
] as const;

export default function InventarioPage() {
  // ✅ 1. HOOKS DE ESTADO PRIMERO (orden v6.0)
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<ProductStatus>('active');
  const [selectedStockLevel, setSelectedStockLevel] = useState<StockLevelFilter>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>(''); // ✅ MULTI-ALMACÉN v6.0
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  
  // Estados para diálogos
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
  const [stockDialogOpen, setStockDialogOpen] = useState<boolean>(false);
  const [movementDialogOpen, setMovementDialogOpen] = useState<boolean>(false);
  const [createWarehouseOpen, setCreateWarehouseOpen] = useState<boolean>(false);

  // Estados para datos REALES v6.0
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [recentMovements, setRecentMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para notificación
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // ✅ 2. HOOKS DE CONTEXT/CUSTOM REALES (orden v6.0)
  const hydrated = useHydrated();
  const { addAuditFieldsFor } = useUserTracking();
  const { 
    products,
    stockStats,
    criticalProducts,
    inventoryValue,
    getProductsByStatus,
    searchProducts,
    fetchData: reloadProducts, // ✅ CORREGIDO: USAR reloadProducts NO loadProducts
    loading: productsLoading
  } = useProductStock(); // ✅ IMPORTADO CORRECTAMENTE
  const { 
    getAvailableStock,
    checkAvailableStock,
    getRecentMovements,
    adjustInventory,
    loading: inventoryLoading 
  } = useInventoryManagement();
  const supabase = createBrowserSupabaseClient();

  // ✅ 3. HOOKS DE EFECTO (después de custom)
  useEffect(() => {
    if (hydrated) {
      console.log('✅ [v6.0] Inventario Multi-Almacén inicializado');
      loadInitialData();
    }
  }, [hydrated]);

  // ✅ 4. HOOKS DE CALLBACK Y MEMO (al final)

  // ✅ CARGAR DATOS REALES v6.0
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      await loadWarehouses(); // Cargar warehouses reales de Supabase
      await loadRecentMovements(); // Usar getRecentMovements real
      console.log('✅ [v6.0] Datos reales cargados desde BD');
    } catch (error: any) {
      console.error('Error cargando datos reales:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ CARGAR WAREHOUSES REALES v6.0
  const loadWarehouses = useCallback(async () => {
    try {
      // Query real a tu tabla warehouses funcionando
      const { data, error } = await supabase
        .from('warehouses')
        .select('id, name, code, is_active, location, warehouse_type')
        .eq('is_active', true)
        .order('is_default', { ascending: false });

      if (error) throw error;

      const warehousesData: Warehouse[] = data.map((w: any) => ({
        id: w.id,
        name: w.name,
        code: w.code,
        is_active: w.is_active,
        location: w.location
      }));

      setWarehouses(warehousesData);
      console.log('✅ [v6.0] Warehouses reales cargados:', warehousesData.length);
    } catch (error: any) {
      console.error('Error cargando warehouses reales:', error);
      throw error;
    }
  }, [supabase]);

  // ✅ CARGAR MOVIMIENTOS RECIENTES REALES v6.0
  const loadRecentMovements = useCallback(async () => {
    if (!getRecentMovements) return;
    
    try {
      const movements = await getRecentMovements(8, selectedWarehouse || undefined);
      setRecentMovements(movements);
      console.log('✅ [v6.0] Movimientos reales cargados:', movements.length);
    } catch (error: any) {
      console.error('Error cargando movimientos reales:', error);
    }
  }, [getRecentMovements, selectedWarehouse]);

  // ✅ RECARGA MOVIMIENTOS CUANDO CAMBIA WAREHOUSE
  useEffect(() => {
    if (hydrated) {
      loadRecentMovements();
    }
  }, [selectedWarehouse, loadRecentMovements, hydrated]);

  // ✅ CATEGORÍAS ÚNICAS USANDO useProductStock REAL - FILTRAR UNDEFINED
  const uniqueCategories = useMemo(() => {
    return [...new Set(
      products
        .map((p: Product) => p.category)
        .filter((category): category is string => Boolean(category))
    )];
  }, [products]);

  // ✅ PRODUCTOS FILTRADOS USANDO useProductStock REAL v6.0
  const getProductsByActiveStatus = useCallback((status: 'active' | 'inactive') => {
    return products.filter((product: Product) => 
      status === 'active' ? product.is_active !== false : product.is_active === false
    );
  }, [products]);

  // ✅ PRODUCTOS FILTRADOS USANDO useProductStock REAL v6.0
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filtro por estado activo/inactivo
    if (selectedStatus !== 'all') {
      filtered = getProductsByActiveStatus(selectedStatus);
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

    // Filtro por nivel de stock usando useProductStock real
    if (selectedStockLevel && getProductsByStatus) {
      filtered = getProductsByStatus(selectedStockLevel);
    }

    // ✅ TODO: Filtro por warehouse cuando esté implementado el stock distribuido
    // if (selectedWarehouse) {
    //   filtered = filtered.filter(product => product.warehouse_id === selectedWarehouse);
    // }

    return filtered;
  }, [products, selectedStatus, searchTerm, selectedCategory, selectedStockLevel, selectedWarehouse, getProductsByActiveStatus, getProductsByStatus]);

  // ✅ PAGINACIÓN CALCULADA
  const paginatedProducts = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredProducts.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredProducts, page, rowsPerPage]);

  // ✅ FUNCIONES UTILITARIAS MEMOIZADAS - TIPOS EXPLÍCITOS v6.0
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
      if (product.current_stock === 0) return 'error';
      if (product.current_stock <= product.min_stock) return 'warning';
      if (product.max_stock && product.current_stock > product.max_stock) return 'info';
      return 'success';
    },
    
    getStockPercentage: (product: Product): number => {
      if (product.max_stock && product.max_stock > 0) {
        return Math.min((product.current_stock / product.max_stock) * 100, 100);
      }
      return product.current_stock > product.min_stock ? 100 : 
             product.current_stock === 0 ? 0 : 50;
    }
  }), []);

  // ✅ HANDLERS MEMOIZADOS v6.0
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
    warehouseFilter: (value: string) => { // ✅ NUEVO v6.0
      setSelectedWarehouse(value);
      setPage(0);
    },
    clearFilters: () => {
      setSearchTerm('');
      setSelectedCategory('');
      setSelectedStockLevel('');
      setSelectedStatus('active');
      setSelectedWarehouse(''); // ✅ NUEVO v6.0
      setPage(0);
    }
  }), []);

  // ✅ CALLBACK PARA RECARGAR MOVIMIENTOS
  const reloadMovements = useCallback(async () => {
    if (!getRecentMovements) return;
    
    try {
      const movements = await getRecentMovements(8, selectedWarehouse || undefined);
      setRecentMovements(movements);
      notify.info('Movimientos actualizados');
    } catch (error: any) {
      notify.error('Error recargando movimientos');
    }
  }, [getRecentMovements, selectedWarehouse]);

  // ✅ MANEJO DE NOTIFICACIONES
  const closeNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  // ✅ MANEJO DE DIÁLOGOS - TIPOS EXPLÍCITOS v6.0
  const openStockDialog = useCallback((product: Product) => {
    setSelectedProduct(product);
    setStockDialogOpen(true);
  }, []);

  const closeStockDialog = useCallback(() => {
    setSelectedProduct(null);
    setStockDialogOpen(false);
  }, []);

  const openMovementDialog = useCallback((movement: Movement) => {
    setSelectedMovement(movement);
    setMovementDialogOpen(true);
  }, []);

  const closeMovementDialog = useCallback(() => {
    setSelectedMovement(null);
    setMovementDialogOpen(false);
  }, []);

  // ✅ NUEVO: MANEJO CREAR WAREHOUSE v6.0
  const openCreateWarehouse = useCallback(() => {
    setCreateWarehouseOpen(true);
  }, []);

  const closeCreateWarehouse = useCallback(() => {
    setCreateWarehouseOpen(false);
  }, []);

  // ✅ CALLBACKS SAVE CORREGIDOS - USAR reloadProducts
  const handleStockSave = useCallback(() => {
    console.log('🔄 Stock ajustado, recargando datos...');
    reloadProducts(); // ✅ CORREGIDO: USAR reloadProducts
    reloadMovements();
    closeStockDialog();
  }, [reloadProducts, reloadMovements, closeStockDialog]);

  const handleMovementSave = useCallback(() => {
    console.log('🔄 Movimiento registrado, recargando datos...');
    reloadProducts(); // ✅ CORREGIDO: USAR reloadProducts
    reloadMovements();
    closeMovementDialog();
  }, [reloadProducts, reloadMovements, closeMovementDialog]);

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

  // ✅ SSR SAFETY SIMPLIFICADO v6.0
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
          Cargando Inventario Multi-Almacén...
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

      {/* 📊 HEADER CON ESTADÍSTICAS ENTERPRISE v6.0 */}
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
              Control Multi-Almacén
            </Typography>
            <Typography variant="h6" sx={{ 
              color: colorTokens.textSecondary,
              fontWeight: 300
            }}>
              Inventario | Almacenes | Movimientos | Enterprise v6.0
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
              disabled={loading}
              sx={{ 
                color: colorTokens.textSecondary,
                borderColor: `${colorTokens.textSecondary}60`,
                px: 3, py: 1.5, borderRadius: 3, fontWeight: 600
              }}
            >
              {loading ? <CircularProgress size={20} /> : 'Actualizar'}
            </Button>
          </Box>
        </Box>

        {/* 📊 ESTADÍSTICAS v6.0 */}
        {loading && !stockStats ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress sx={{ color: colorTokens.brand }} />
          </Box>
        ) : stockStats ? (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ 
                background: `${colorTokens.info}10`, 
                border: `1px solid ${colorTokens.info}30`,
                borderRadius: 3
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: colorTokens.info }}>
                        {stockStats.total}
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
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ 
                background: `${colorTokens.success}10`, 
                border: `1px solid ${colorTokens.success}30`,
                borderRadius: 3
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: colorTokens.success }}>
                        {stockStats.total - stockStats.sinStock - stockStats.critical}
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
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ 
                background: `${colorTokens.warning}10`, 
                border: `1px solid ${colorTokens.warning}30`,
                borderRadius: 3
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: colorTokens.warning }}>
                        {stockStats.critical}
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
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ 
                background: `${colorTokens.danger}10`, 
                border: `1px solid ${colorTokens.danger}30`,
                borderRadius: 3
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: colorTokens.danger }}>
                        {stockStats.sinStock}
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
          </Grid>
        ) : null}
      </Paper>

      {/* 🔍 FILTROS ENTERPRISE v6.0 - CON WAREHOUSE */}
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

          {/* ✅ NUEVO: FILTRO POR ALMACÉN v6.0 */}
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
                {warehouses.filter(w => w.is_active).map((warehouse: Warehouse) => (
                  <MenuItem key={warehouse.id} value={warehouse.id}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <StoreIcon sx={{ fontSize: 16, color: colorTokens.brand }} />
                      {warehouse.name}
                    </Box>
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

      {/* 📋 CONTENIDO PRINCIPAL v6.0 */}
      <Grid container spacing={3}>
        {/* 📦 LISTA DE PRODUCTOS */}
        <Grid size={{ xs: 12, lg: 8 }}>
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
                Productos en Inventario
                {selectedWarehouse && (
                  <Chip 
                    label={warehouses.find(w => w.id === selectedWarehouse)?.name || 'Almacén'}
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

            {loading ? (
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
                                label={
                                  product.current_stock === 0 ? 'Agotado' :
                                  product.current_stock <= product.min_stock ? 'Stock Bajo' :
                                  'Disponible'
                                }
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
        </Grid>

        {/* 📜 MOVIMIENTOS RECIENTES v6.0 - MEJORADO */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper sx={{ 
            background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
            border: `1px solid ${colorTokens.border}`,
            borderRadius: 3,
            height: 'fit-content'
          }}>
            <Box sx={{ p: 3, borderBottom: `1px solid ${colorTokens.border}` }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight="bold" sx={{ 
                  color: colorTokens.textPrimary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <HistoryIcon />
                  Movimientos Recientes
                  {selectedWarehouse && (
                    <Chip 
                      label={warehouses.find(w => w.id === selectedWarehouse)?.code || 'ALM'}
                      size="small"
                      sx={{
                        backgroundColor: `${colorTokens.info}20`,
                        color: colorTokens.info,
                        ml: 1
                      }}
                    />
                  )}
                </Typography>
                <Button
                  size="small"
                  onClick={reloadMovements}
                  disabled={loading}
                  sx={{ 
                    color: colorTokens.textSecondary,
                    minWidth: 'auto',
                    px: 1
                  }}
                >
                  {loading ? <CircularProgress size={16} /> : <RefreshIcon />}
                </Button>
              </Box>
            </Box>

            <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
              {loading && recentMovements.length === 0 ? (
                <Box display="flex" justifyContent="center" alignItems="center" sx={{ p: 4 }}>
                  <CircularProgress size={32} sx={{ color: colorTokens.brand }} />
                </Box>
              ) : recentMovements.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <HistoryIcon sx={{ fontSize: 48, color: colorTokens.textMuted, mb: 2 }} />
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                    No hay movimientos recientes
                  </Typography>
                  <Typography variant="caption" sx={{ color: colorTokens.textMuted }}>
                    Los movimientos aparecerán aquí
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ p: 2 }}>
                  {recentMovements.map((movement: Movement) => {
                    const isPositive = movement.quantity > 0;
                    const movementColor = isPositive ? colorTokens.success : colorTokens.danger;
                    const movementIcon = isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />;

                    return (
                      <Card 
                        key={movement.id} 
                        sx={{ 
                          mb: 2, 
                          cursor: 'pointer',
                          background: colorTokens.surfaceLevel1,
                          border: `1px solid ${colorTokens.border}`,
                          borderRadius: 2,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: colorTokens.hoverOverlay,
                            borderColor: colorTokens.brand,
                            transform: 'translateY(-1px)',
                            boxShadow: `0 4px 12px ${colorTokens.glow}`
                          }
                        }}
                        onClick={() => openMovementDialog(movement)}
                      >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar sx={{
                              backgroundColor: `${movementColor}20`,
                              color: movementColor,
                              width: 36,
                              height: 36
                            }}>
                              {movementIcon}
                            </Avatar>
                            
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle2" fontWeight="bold" sx={{ 
                                color: colorTokens.textPrimary,
                                fontSize: '0.875rem'
                              }}>
                                {movement.products?.name || 'Producto'}
                              </Typography>
                              
                              <Typography variant="caption" sx={{ 
                                color: colorTokens.textSecondary,
                                display: 'block'
                              }}>
                                {movement.movement_type?.replace('_', ' ') || 'Movimiento'}
                              </Typography>

                              <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                                <Chip
                                  size="small"
                                  label={`${isPositive ? '+' : ''}${movement.quantity} ${movement.products?.unit || 'u'}`}
                                  sx={{
                                    backgroundColor: `${movementColor}20`,
                                    color: movementColor,
                                    border: `1px solid ${movementColor}30`,
                                    fontSize: '0.75rem',
                                    height: 20
                                  }}
                                />
                                
                                <Typography variant="caption" sx={{ 
                                  color: colorTokens.textMuted,
                                  fontSize: '0.7rem'
                                }}>
                                  {utilityFunctions.formatDate(movement.created_at)}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}

                  <Box sx={{ p: 2, textAlign: 'center', borderTop: `1px solid ${colorTokens.border}` }}>
                    <Button
                      size="small"
                      sx={{ 
                        color: colorTokens.textSecondary,
                        fontSize: '0.75rem'
                      }}
                      onClick={() => notify.info('Ver todos - próximamente')}
                    >
                      Ver todos los movimientos
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ✅ NUEVO: MODAL CREAR ALMACÉN v6.0 */}
      <Dialog
        open={createWarehouseOpen}
        onClose={closeCreateWarehouse}
        maxWidth="sm"
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
          color: colorTokens.textPrimary
        }}>
          <BusinessIcon sx={{ color: colorTokens.brand }} />
          Crear Nuevo Almacén
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 3 }}>
            Esta funcionalidad estará disponible próximamente en la versión completa del sistema multi-almacén.
          </Typography>
          <Alert severity="info" sx={{ 
            backgroundColor: `${colorTokens.info}10`,
            border: `1px solid ${colorTokens.info}30`,
            color: colorTokens.textPrimary
          }}>
            Por ahora, los almacenes se gestionan directamente en la base de datos. 
            La interfaz completa de gestión de almacenes estará disponible en la próxima actualización.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={closeCreateWarehouse}
            variant="contained"
            sx={{
              background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
              color: colorTokens.textOnBrand,
              fontWeight: 700,
              px: 4, py: 1.5, borderRadius: 3
            }}
          >
            Entendido
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

      <InventoryMovementDialog
        open={movementDialogOpen}
        onClose={closeMovementDialog}
        movement={selectedMovement}
      />
    </Box>
  );
}