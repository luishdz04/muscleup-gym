// 📁 src/app/(protected)/dashboard/admin/catalogo/inventario/page.tsx
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
  LinearProgress
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
  Assessment as AssessmentIcon
} from '@mui/icons-material';

// ✅ IMPORTS ENTERPRISE v8.1 CORREGIDOS SEGÚN COMPLETE_IMPLEMENTATION_GUIDE
import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { useUserTracking } from '@/hooks/useUserTracking';
import { useProductStock } from '@/hooks/useProductStock';
import { useInventoryManagement } from '@/hooks/useInventoryManagement';
import { useSalesInventoryIntegration } from '@/hooks/useSalesInventoryIntegration';
import { notify } from '@/utils/notifications';
import { useNotifications } from '@/hooks/useNotifications';
import { 
  formatTimestampForDisplay,
  formatDateForDisplay,
  getCurrentTimestamp,
  getTodayInMexico,
  formatMovementDate  // ✅ AGREGADO PARA MOVIMIENTOS
} from '@/utils/dateUtils';
import ProductStockDialog from '@/components/catalogo/ProductStockDialog';
import InventoryMovementDialog from '@/components/catalogo/InventoryMovementDialog';

// ✅ TIPOS MEJORADOS CON TIPADO FUERTE
type StockLevelFilter = '' | 'sin_stock' | 'stock_bajo' | 'stock_normal' | 'sobre_stock';
type ProductStatus = 'active' | 'inactive' | 'all';
type StockColor = 'error' | 'warning' | 'success' | 'info';

interface StockFilter {
  value: StockLevelFilter;
  label: string;
}

interface StatusFilter {
  value: ProductStatus;
  label: string;
}

// ✅ CONFIGURACIONES TIPADAS
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
  // ✅ TODOS LOS HOOKS AL INICIO - ORDEN CONSISTENTE
  const hydrated = useHydrated();
  
  // ✅ HOOKS ENTERPRISE v8.1 CORREGIDOS CON getRecentMovements
  const { 
    products, 
    stockStats, 
    criticalProducts, 
    searchProducts, 
    inventoryValue,
    loading: productsLoading,
    getProductsByStatus,
    fetchData: reloadProducts
  } = useProductStock();
  
  const { 
    adjustInventory,
    getAvailableStock,
    checkAvailableStock,
    getRecentMovements,           // ✅ CORREGIDO: Agregado para movimientos
    loading: inventoryLoading 
  } = useInventoryManagement();
  
  const { alert } = useNotifications();

  // ✅ ESTADOS LOCALES CON TIPADO FUERTE - TODOS JUNTOS
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<ProductStatus>('active');
  const [selectedStockLevel, setSelectedStockLevel] = useState<StockLevelFilter>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  
  // Estados para diálogos
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedMovement, setSelectedMovement] = useState<any>(null);
  const [stockDialogOpen, setStockDialogOpen] = useState<boolean>(false);
  const [movementDialogOpen, setMovementDialogOpen] = useState<boolean>(false);

  // ✅ ESTADOS PARA MOVIMIENTOS RECIENTES - AGREGADOS
  const [recentMovements, setRecentMovements] = useState<any[]>([]);
  const [movementsError, setMovementsError] = useState<string | null>(null);

  // Estados de notificación
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // ✅ EFECTO PARA CARGAR MOVIMIENTOS RECIENTES - AGREGADO
  useEffect(() => {
    const loadRecentMovements = async () => {
      if (!hydrated || !getRecentMovements) return;
      
      try {
        setMovementsError(null);
        const movements = await getRecentMovements(8); // Últimos 8 movimientos
        setRecentMovements(movements);
        console.log('🔄 Movimientos recientes cargados:', movements.length);
      } catch (error: any) {
        console.error('Error cargando movimientos recientes:', error);
        setMovementsError(error.message);
      }
    };

    loadRecentMovements();
  }, [hydrated, getRecentMovements]);

  // ✅ CATEGORÍAS ÚNICAS MEMOIZADAS
  const uniqueCategories = useMemo(() => {
    return [...new Set(products.map(p => p.category).filter(Boolean))];
  }, [products]);

  // ✅ FUNCIÓN HELPER PARA FILTRAR POR ESTADO ACTIVO/INACTIVO
  const getProductsByActiveStatus = useCallback((status: 'active' | 'inactive') => {
    return products.filter(product => 
      status === 'active' ? product.is_active !== false : product.is_active === false
    );
  }, [products]);

  // ✅ PRODUCTOS FILTRADOS CON PERFORMANCE OPTIMIZADA
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filtro por estado activo/inactivo
    if (selectedStatus !== 'all') {
      filtered = getProductsByActiveStatus(selectedStatus);
    }

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por categoría
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Filtro por nivel de stock
    if (selectedStockLevel) {
      filtered = getProductsByStatus(selectedStockLevel);
    }

    return filtered;
  }, [products, selectedStatus, searchTerm, selectedCategory, selectedStockLevel, getProductsByActiveStatus, getProductsByStatus]);

  // ✅ PAGINACIÓN CALCULADA
  const paginatedProducts = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredProducts.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredProducts, page, rowsPerPage]);

  // ✅ FUNCIONES UTILITARIAS MEMOIZADAS CON CORRECCIONES
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
    
    getStockColor: (product: any): StockColor => {
      if (product.current_stock === 0) return 'error';
      if (product.current_stock <= product.min_stock) return 'warning';
      if (product.max_stock && product.current_stock > product.max_stock) return 'info';
      return 'success';
    },
    
    getStockPercentage: (product: any): number => {
      if (product.max_stock && product.max_stock > 0) {
        return Math.min((product.current_stock / product.max_stock) * 100, 100);
      }
      return product.current_stock > product.min_stock ? 100 : 
             product.current_stock === 0 ? 0 : 50;
    }
  }), []);

  // ✅ HANDLERS MEMOIZADOS PARA PERFORMANCE
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
    clearFilters: () => {
      setSearchTerm('');
      setSelectedCategory('');
      setSelectedStockLevel('');
      setSelectedStatus('active');
      setPage(0);
    }
  }), []);

  // ✅ CALLBACK PARA RECARGAR MOVIMIENTOS - AGREGADO
  const reloadMovements = useCallback(async () => {
    if (!getRecentMovements) return;
    
    try {
      setMovementsError(null);
      const movements = await getRecentMovements(8);
      setRecentMovements(movements);
      notify.info('Movimientos actualizados');
      console.log('🔄 Movimientos recargados:', movements.length);
    } catch (error: any) {
      setMovementsError(error.message);
      notify.error('Error recargando movimientos');
      console.error('Error en reloadMovements:', error);
    }
  }, [getRecentMovements]);

  // ✅ MANEJO DE NOTIFICACIONES
  const closeNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  // ✅ MANEJO DE DIÁLOGOS
  const openStockDialog = useCallback((product: any) => {
    setSelectedProduct(product);
    setStockDialogOpen(true);
  }, []);

  const closeStockDialog = useCallback(() => {
    setSelectedProduct(null);
    setStockDialogOpen(false);
  }, []);

  const openMovementDialog = useCallback((movement: any) => {
    setSelectedMovement(movement);
    setMovementDialogOpen(true);
  }, []);

  const closeMovementDialog = useCallback(() => {
    setSelectedMovement(null);
    setMovementDialogOpen(false);
  }, []);

  // ✅ CALLBACK CORREGIDO PARA INCLUIR RECARGA DE MOVIMIENTOS
  const handleStockSave = useCallback(() => {
    console.log('🔄 Stock ajustado, recargando datos...');
    reloadProducts();
    reloadMovements(); // ✅ AGREGADO: Recargar movimientos también
    closeStockDialog();
  }, [reloadProducts, reloadMovements, closeStockDialog]);

  const handleMovementSave = useCallback(() => {
    console.log('🔄 Movimiento registrado, recargando datos...');
    reloadProducts();
    reloadMovements(); // ✅ AGREGADO: Recargar movimientos también
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

  // ✅ CALLBACK RELOAD CORREGIDO PARA INCLUIR MOVIMIENTOS
  const reload = useCallback(() => {
    reloadProducts();
    reloadMovements(); // ✅ CORREGIDO: Agregar recarga de movimientos
    notify.info('Recargando datos de inventario...');
  }, [reloadProducts, reloadMovements]);

  // ✅ LOADING STATE CALCULADO
  const loading = productsLoading || inventoryLoading;

  // ✅ SSR SAFETY CON BRANDING MUSCLEUP v8.1 - DESPUÉS DE TODOS LOS HOOKS
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
          Cargando Inventario MuscleUp...
        </Typography>
        <Typography variant="body2" sx={{ color: colorTokens.textMuted }}>
          Inicializando control de stock enterprise v8.1
        </Typography>
      </Box>
    );
  }

  // ✅ LOADING STATE CONDICIONAL - DESPUÉS DE SSR CHECK
  if (loading && products.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '50vh'
      }}>
        <CircularProgress sx={{ color: colorTokens.brand }} />
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

      {/* 📊 HEADER CON ESTADÍSTICAS ENTERPRISE */}
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
              <InventoryIcon sx={{ fontSize: 50 }} />
              Control de Inventario
            </Typography>
            <Typography variant="h6" sx={{ 
              color: colorTokens.textSecondary,
              fontWeight: 300
            }}>
              Stock | Movimientos | Auditoría Enterprise v8.1
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
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
              startIcon={<ExportIcon />}
              sx={{ 
                color: colorTokens.textSecondary,
                borderColor: `${colorTokens.textSecondary}60`,
                px: 3, py: 1.5, borderRadius: 3, fontWeight: 600
              }}
            >
              Exportar
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

        {/* 📊 ESTADÍSTICAS CON LOADING STATE CORREGIDAS */}
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
                        Productos en Inventario
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
                      <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.success }}>
                        {utilityFunctions.formatPrice(inventoryValue.sale)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        Valor Total del Inventario
                      </Typography>
                    </Box>
                    <TrendingUpIcon sx={{ fontSize: 40, color: colorTokens.success, opacity: 0.8 }} />
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
                        Productos con Stock Bajo
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
                        Productos Agotados
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

      {/* ✅ ALERTA DE STOCK CRÍTICO */}
      {criticalProducts.length > 0 && (
        <Alert 
          severity="warning" 
          sx={{ 
            mb: 3,
            backgroundColor: colorTokens.surfaceLevel2,
            border: `1px solid ${colorTokens.warning}`,
            '& .MuiAlert-icon': { color: colorTokens.warning }
          }}
        >
          <Typography sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
            Stock Crítico Detectado
          </Typography>
          <Typography sx={{ color: colorTokens.textSecondary }}>
            {criticalProducts.length} productos requieren atención inmediata
          </Typography>
        </Alert>
      )}

      {/* 🔍 FILTROS ENTERPRISE CON HANDLERS MEMORIZADOS */}
      <Paper sx={{ 
        p: 3, 
        mb: 3,
        background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
        border: `1px solid ${colorTokens.border}`,
        borderRadius: 3
      }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 3 }}>
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
          
          <Grid size={{ xs: 12, md: 2 }}>
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
                onChange={(e) => memoizedHandlers.categoryFilter(e.target.value)}
                sx={{
                  color: colorTokens.textPrimary,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: `${colorTokens.brand}30`
                  }
                }}
              >
                <MenuItem value="">Todas</MenuItem>
                {uniqueCategories.map((category) => (
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

          <Grid size={{ xs: 12, md: 2 }}>
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
          
          <Grid size={{ xs: 12, md: 2 }}>
            <Typography variant="body2" sx={{ 
              color: colorTokens.textSecondary, 
              textAlign: 'center' 
            }}>
              {filteredProducts.length} de {products.length} productos
            </Typography>
          </Grid>
          
          <Grid size={{ xs: 12, md: 1 }}>
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

      {/* 📋 CONTENIDO PRINCIPAL - GRID DE PRODUCTOS Y MOVIMIENTOS */}
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
                      {paginatedProducts.map((product) => {
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

        {/* 📜 MOVIMIENTOS RECIENTES - IMPLEMENTADO Y FUNCIONANDO v8.1 */}
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
              ) : movementsError ? (
                <Box sx={{ p: 3 }}>
                  <Alert severity="error" sx={{ backgroundColor: colorTokens.surfaceLevel1 }}>
                    Error cargando movimientos: {movementsError}
                  </Alert>
                  <Button 
                    fullWidth 
                    onClick={reloadMovements} 
                    sx={{ mt: 2, color: colorTokens.textSecondary }}
                  >
                    Reintentar
                  </Button>
                </Box>
              ) : recentMovements.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <HistoryIcon sx={{ fontSize: 48, color: colorTokens.textMuted, mb: 2 }} />
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                    No hay movimientos recientes
                  </Typography>
                  <Typography variant="caption" sx={{ color: colorTokens.textMuted }}>
                    Los movimientos de inventario aparecerán aquí
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ p: 2 }}>
                  {recentMovements.map((movement) => {
                    const isPositive = movement.quantity > 0;
                    const movementColor = isPositive ? colorTokens.success : colorTokens.danger;
                    const movementIcon = isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />;
                    
                    // Helper para formatear tipo de movimiento
                    const formatMovementType = (type: string): string => {
                      const types: Record<string, string> = {
                        'venta_directa': 'Venta Directa',
                        'venta_apartado': 'Venta Apartado',
                        'reserva_apartado': 'Reserva Apartado',
                        'cancelar_reserva': 'Cancelar Reserva',
                        'devolucion': 'Devolución',
                        'recepcion_compra': 'Recepción Compra',
                        'ajuste_manual_mas': 'Ajuste Manual (+)',
                        'ajuste_manual_menos': 'Ajuste Manual (-)',
                        'transferencia_entrada': 'Transferencia Entrada',
                        'transferencia_salida': 'Transferencia Salida',
                        'merma': 'Merma',
                        'inventario_inicial': 'Inventario Inicial'
                      };
                      return types[type] || type;
                    };

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
                                {movement.products?.name || 'Producto no encontrado'}
                              </Typography>
                              
                              <Typography variant="caption" sx={{ 
                                color: colorTokens.textSecondary,
                                display: 'block'
                              }}>
                                {formatMovementType(movement.movement_type)}
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
                                  {formatMovementDate(movement.created_at)}
                                </Typography>
                              </Box>

                              {movement.reason && (
                                <Typography variant="caption" sx={{ 
                                  color: colorTokens.textSecondary,
                                  display: 'block',
                                  mt: 0.5,
                                  fontStyle: 'italic',
                                  fontSize: '0.7rem'
                                }}>
                                  {movement.reason.length > 30 ? 
                                    `${movement.reason.substring(0, 30)}...` : 
                                    movement.reason
                                  }
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {/* Footer con enlace a ver todos */}
                  <Box sx={{ p: 2, textAlign: 'center', borderTop: `1px solid ${colorTokens.border}` }}>
                    <Button
                      size="small"
                      sx={{ 
                        color: colorTokens.textSecondary,
                        fontSize: '0.75rem'
                      }}
                      onClick={() => {
                        notify.info('Funcionalidad próximamente disponible');
                      }}
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

      {/* 📝 DIALOGS */}
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