// 📁 src/app/dashboard/admin/catalogo/inventario/page.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';
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
  Divider,
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
  Assessment as AssessmentIcon,
  Build as BuildIcon,
  SwapHoriz as SwapHorizIcon
} from '@mui/icons-material';

// 🎯 IMPORTAR NUESTROS HOOKS ENTERPRISE Y TIPOS CON TIPADO FUERTE
import { useInventory, useInventoryStats } from '@/hooks/useCatalog';
import { Product, InventoryMovement } from '@/services/catalogService';
import ProductStockDialog from '@/components/catalogo/ProductStockDialog';
import InventoryMovementDialog from '@/components/catalogo/InventoryMovementDialog';

// 🎨 DARK PRO SYSTEM - TOKENS CENTRALIZADOS
const darkProTokens = {
  background: '#000000',
  surfaceLevel1: '#121212',
  surfaceLevel2: '#1E1E1E',
  surfaceLevel3: '#252525',
  surfaceLevel4: '#2E2E2E',
  grayDark: '#333333',
  grayMedium: '#444444',
  grayLight: '#555555',
  grayMuted: '#777777',
  textPrimary: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textDisabled: '#888888',
  primary: '#FFCC00',
  primaryHover: '#E6B800',
  primaryActive: '#CCAA00',
  primaryDisabled: 'rgba(255,204,0,0.3)',
  success: '#388E3C',
  successHover: '#2E7D32',
  error: '#D32F2F',
  errorHover: '#B71C1C',
  warning: '#FFB300',
  warningHover: '#E6A700',
  info: '#1976D2',
  infoHover: '#1565C0',
  hoverOverlay: 'rgba(255,204,0,0.05)',
  activeOverlay: 'rgba(255,204,0,0.1)',
  borderDefault: '#333333',
  borderHover: '#FFCC00',
  borderActive: '#E6B800'
} as const;

// 🎯 TIPOS MEJORADOS CON TIPADO FUERTE
type StockLevelFilter = '' | 'available' | 'low' | 'out' | 'overstock';
type ProductStatus = 'active' | 'inactive' | 'all';
type StockColor = 'error' | 'warning' | 'success' | 'info';
type MovementType = 'entrada' | 'salida' | 'ajuste' | 'transferencia';

interface StockFilter {
  value: StockLevelFilter;
  label: string;
}

interface StatusFilter {
  value: ProductStatus;
  label: string;
}

interface MovementTypeConfig {
  value: MovementType;
  label: string;
  icon: React.ReactElement;
  color: 'success' | 'error' | 'warning' | 'info';
}

// 🎯 CONFIGURACIONES TIPADAS
const STOCK_FILTERS: readonly StockFilter[] = [
  { value: '', label: 'Todos los productos' },
  { value: 'available', label: '✅ Stock disponible' },
  { value: 'low', label: '⚠️ Stock bajo' },
  { value: 'out', label: '❌ Sin stock' },
  { value: 'overstock', label: '📈 Sobre stock' }
] as const;

const STATUS_FILTERS: readonly StatusFilter[] = [
  { value: 'active', label: '✅ Productos Activos' },
  { value: 'inactive', label: '❌ Productos Inactivos' },
  { value: 'all', label: '📋 Todos los Productos' }
] as const;

const MOVEMENT_TYPES: readonly MovementTypeConfig[] = [
  { value: 'entrada', label: '📦 Entrada', icon: <TrendingUpIcon />, color: 'success' },
  { value: 'salida', label: '📤 Salida', icon: <TrendingDownIcon />, color: 'error' },
  { value: 'ajuste', label: '🔧 Ajuste', icon: <BuildIcon />, color: 'warning' },
  { value: 'transferencia', label: '🔄 Transferencia', icon: <SwapHorizIcon />, color: 'info' }
] as const;

export default function InventarioPage() {
  
  // 🎯 USAR NUESTROS HOOKS ENTERPRISE CON TIPADO INICIAL
  const {
    products,
    productsLoading,
    productsError,
    productsTotal,
    productsPage,
    movements,
    movementsLoading,
    movementsError,
    filters,
    notification,
    updateFilters,
    changePage,
    reload,
    closeNotification,
    loadMovements
  } = useInventory({
    status: 'active' as ProductStatus,
    limit: 10
  });

  const {
    stats,
    loading: statsLoading,
    error: statsError
  } = useInventoryStats();

  // 🎯 ESTADOS LOCALES CON TIPADO FUERTE
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedMovement, setSelectedMovement] = useState<InventoryMovement | null>(null);
  const [stockDialogOpen, setStockDialogOpen] = useState<boolean>(false);
  const [movementDialogOpen, setMovementDialogOpen] = useState<boolean>(false);

  // ✅ MEJORA #1: MEMOIZAR CÁLCULO DE CATEGORÍAS ÚNICAS
  const uniqueCategories = useMemo(() => {
    return [...new Set(products.map(p => p.category))];
  }, [products]);

  // ✅ MEJORA #2: MEMOIZAR HANDLERS PARA EVITAR RE-RENDERS
  const memoizedHandlers = useMemo(() => ({
    search: (value: string) => {
      updateFilters({ search: value, page: 1 });
    },
    categoryFilter: (value: string) => {
      updateFilters({ category: value, page: 1 });
    },
    stockFilter: (value: StockLevelFilter) => {
      updateFilters({ stockLevel: value || undefined, page: 1 });
    },
    statusFilter: (value: ProductStatus) => {
      updateFilters({ status: value, page: 1 });
    },
    clearFilters: () => {
      updateFilters({ 
        search: '', 
        category: '', 
        stockLevel: undefined,
        status: 'active' as ProductStatus,
        page: 1 
      });
    }
  }), [updateFilters]);

  // ✅ MEJORA #3: MEMOIZAR FUNCIONES DE UTILIDAD
  const utilityFunctions = useMemo(() => ({
    formatPrice: (price: number): string => {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
      }).format(price);
    },
    
    formatDate: (dateString: string): string => {
      return new Date(dateString).toLocaleString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
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
    },
    
    getMovementTypeConfig: (type: string): MovementTypeConfig => {
      return MOVEMENT_TYPES.find(t => t.value === type) || MOVEMENT_TYPES[0];
    }
  }), []);

  // ✅ MEJORA #4: CALLBACKS OPTIMIZADOS
  const openStockDialog = useCallback((product: Product) => {
    setSelectedProduct(product);
    setStockDialogOpen(true);
  }, []);

  const closeStockDialog = useCallback(() => {
    setSelectedProduct(null);
    setStockDialogOpen(false);
  }, []);

  const openMovementDialog = useCallback((movement: InventoryMovement) => {
    setSelectedMovement(movement);
    setMovementDialogOpen(true);
  }, []);

  const closeMovementDialog = useCallback(() => {
    setSelectedMovement(null);
    setMovementDialogOpen(false);
  }, []);

const handleStockSave = useCallback(() => {
  console.log('🔄 Stock ajustado, recargando datos...');
  reload(); // Recargar productos y movimientos
  closeStockDialog(); // Cerrar el diálogo
}, [reload, closeStockDialog]);

const handleMovementSave = useCallback(() => {
  console.log('🔄 Movimiento registrado, recargando datos...');
  reload(); // Recargar productos y movimientos
  closeMovementDialog(); // Cerrar el diálogo
}, [reload, closeMovementDialog]);

  const handlePageChange = useCallback((_: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    changePage(newPage + 1);
  }, [changePage]);

  const handleRowsPerPageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ limit: parseInt(event.target.value, 10), page: 1 });
  }, [updateFilters]);

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
      color: darkProTokens.textPrimary,
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
              `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})` :
              notification.severity === 'error' ?
              `linear-gradient(135deg, ${darkProTokens.error}, ${darkProTokens.errorHover})` :
              notification.severity === 'warning' ?
              `linear-gradient(135deg, ${darkProTokens.warning}, ${darkProTokens.warningHover})` :
              `linear-gradient(135deg, ${darkProTokens.info}, ${darkProTokens.infoHover})`,
            color: darkProTokens.textPrimary,
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
        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
        border: `2px solid ${darkProTokens.primary}30`,
        borderRadius: 4,
        boxShadow: `0 8px 32px ${darkProTokens.primary}10`
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography 
              variant="h3" 
              component="h1" 
              sx={{
                fontWeight: 800,
                color: darkProTokens.primary,
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
              color: darkProTokens.textSecondary,
              fontWeight: 300
            }}>
              Stock | Movimientos | Auditoría
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<AssessmentIcon />}
              sx={{ 
                color: darkProTokens.textSecondary,
                borderColor: `${darkProTokens.textSecondary}60`,
                px: 3, py: 1.5, borderRadius: 3, fontWeight: 600
              }}
            >
              Reportes
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              sx={{ 
                color: darkProTokens.textSecondary,
                borderColor: `${darkProTokens.textSecondary}60`,
                px: 3, py: 1.5, borderRadius: 3, fontWeight: 600
              }}
            >
              Exportar
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={reload}
              disabled={productsLoading}
              sx={{ 
                color: darkProTokens.textSecondary,
                borderColor: `${darkProTokens.textSecondary}60`,
                px: 3, py: 1.5, borderRadius: 3, fontWeight: 600
              }}
            >
              {productsLoading ? <CircularProgress size={20} /> : 'Actualizar'}
            </Button>
          </Box>
        </Box>

        {/* 📊 ESTADÍSTICAS CON LOADING STATE */}
        {statsLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress sx={{ color: darkProTokens.primary }} />
          </Box>
        ) : statsError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            Error al cargar estadísticas: {statsError}
          </Alert>
        ) : stats ? (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ 
                background: `${darkProTokens.info}10`, 
                border: `1px solid ${darkProTokens.info}30`,
                borderRadius: 3
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.info }}>
                        {stats.totalProducts}
                      </Typography>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        Productos en Inventario
                      </Typography>
                    </Box>
                    <InventoryIcon sx={{ fontSize: 40, color: darkProTokens.info, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ 
                background: `${darkProTokens.success}10`, 
                border: `1px solid ${darkProTokens.success}30`,
                borderRadius: 3
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: darkProTokens.success }}>
                        {utilityFunctions.formatPrice(stats.totalValue)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        Valor Total del Inventario
                      </Typography>
                    </Box>
                    <TrendingUpIcon sx={{ fontSize: 40, color: darkProTokens.success, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ 
                background: `${darkProTokens.warning}10`, 
                border: `1px solid ${darkProTokens.warning}30`,
                borderRadius: 3
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.warning }}>
                        {stats.lowStockProducts}
                      </Typography>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        Productos con Stock Bajo
                      </Typography>
                    </Box>
                    <WarningIcon sx={{ fontSize: 40, color: darkProTokens.warning, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ 
                background: `${darkProTokens.error}10`, 
                border: `1px solid ${darkProTokens.error}30`,
                borderRadius: 3
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.error }}>
                        {stats.outOfStockProducts}
                      </Typography>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        Productos Agotados
                      </Typography>
                    </Box>
                    <TrendingDownIcon sx={{ fontSize: 40, color: darkProTokens.error, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : null}
      </Paper>

      {/* 🔍 FILTROS ENTERPRISE CON HANDLERS MEMORIZADOS */}
      <Paper sx={{ 
        p: 3, 
        mb: 3,
        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
        border: `1px solid ${darkProTokens.grayDark}`,
        borderRadius: 3
      }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              placeholder="Buscar productos..."
              value={filters.search || ''}
              onChange={(e) => memoizedHandlers.search(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: darkProTokens.primary }} />
                  </InputAdornment>
                ),
                sx: {
                  color: darkProTokens.textPrimary,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: `${darkProTokens.primary}30`
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: darkProTokens.primary
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: darkProTokens.primary
                  }
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
                Categoría
              </InputLabel>
              <Select
                value={filters.category || ''}
                label="Categoría"
                onChange={(e) => memoizedHandlers.categoryFilter(e.target.value)}
                sx={{
                  color: darkProTokens.textPrimary,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: `${darkProTokens.primary}30`
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
                color: darkProTokens.textSecondary,
                '&.Mui-focused': { color: darkProTokens.primary }
              }}>
                Nivel de Stock
              </InputLabel>
              <Select
                value={filters.stockLevel || ''}
                label="Nivel de Stock"
                onChange={(e) => memoizedHandlers.stockFilter(e.target.value as StockLevelFilter)}
                sx={{
                  color: darkProTokens.textPrimary,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: `${darkProTokens.primary}30`
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
                color: darkProTokens.textSecondary,
                '&.Mui-focused': { color: darkProTokens.primary }
              }}>
                Estado
              </InputLabel>
              <Select
                value={filters.status}
                label="Estado"
                onChange={(e) => memoizedHandlers.statusFilter(e.target.value as ProductStatus)}
                sx={{
                  color: darkProTokens.textPrimary,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: `${darkProTokens.primary}30`
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
              color: darkProTokens.textSecondary, 
              textAlign: 'center' 
            }}>
              {products.length} de {productsTotal} productos
            </Typography>
          </Grid>
          
          <Grid size={{ xs: 12, md: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={memoizedHandlers.clearFilters}
              sx={{
                color: darkProTokens.textSecondary,
                borderColor: `${darkProTokens.textSecondary}40`
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
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `1px solid ${darkProTokens.grayDark}`,
            borderRadius: 3
          }}>
            <Box sx={{ p: 3, borderBottom: `1px solid ${darkProTokens.grayDark}` }}>
              <Typography variant="h6" fontWeight="bold" sx={{ 
                color: darkProTokens.textPrimary,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <InventoryIcon />
                Productos en Inventario
              </Typography>
            </Box>

            {productsLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress sx={{ color: darkProTokens.primary }} size={40} />
              </Box>
            ) : productsError ? (
              <Alert severity="error" sx={{ m: 3 }}>
                Error al cargar productos: {productsError}
              </Alert>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ 
                        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`
                      }}>
                        <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Producto</TableCell>
                        <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Stock Actual</TableCell>
                        <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Nivel</TableCell>
                        <TableCell align="center" sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Estado</TableCell>
                        <TableCell align="right" sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Valor</TableCell>
                        <TableCell align="center" sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {products.map((product) => {
                        const stockColor = utilityFunctions.getStockColor(product);
                        const stockPercentage = utilityFunctions.getStockPercentage(product);
                        
                        return (
                          <TableRow 
                            key={product.id} 
                            hover
                            sx={{ 
                              opacity: product.is_active === false ? 0.6 : 1,
                              backgroundColor: product.is_active === false ? `${darkProTokens.error}10` : 'transparent',
                              '&:hover': {
                                backgroundColor: `${darkProTokens.primary}05`
                              }
                            }}
                          >
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={2}>
                                <Avatar sx={{ 
                                  backgroundColor: `${darkProTokens.primary}20`,
                                  color: darkProTokens.primary,
                                  fontWeight: 'bold'
                                }}>
                                  {product.name.charAt(0)}
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle2" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>
                                    {product.name}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                                    SKU: {product.sku || 'Sin SKU'} | {product.category}
                                  </Typography>
                                  {product.is_active === false && (
                                    <Chip 
                                      label="INACTIVO" 
                                      sx={{
                                        backgroundColor: darkProTokens.error,
                                        color: darkProTokens.textPrimary,
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
                                <Typography variant="h6" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>
                                  {product.current_stock} {product.unit}
                                </Typography>
                                <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                                  Min: {product.min_stock} | Max: {product.max_stock || 'N/A'}
                                </Typography>
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
                                    backgroundColor: `${darkProTokens.grayDark}`,
                                    '& .MuiLinearProgress-bar': {
                                      backgroundColor: stockColor === 'error' ? darkProTokens.error :
                                                      stockColor === 'warning' ? darkProTokens.warning :
                                                      stockColor === 'info' ? darkProTokens.info :
                                                      darkProTokens.success
                                    }
                                  }}
                                />
                                <Typography variant="caption" sx={{ color: darkProTokens.textSecondary, mt: 0.5 }}>
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
                                  backgroundColor: stockColor === 'error' ? `${darkProTokens.error}20` :
                                                 stockColor === 'warning' ? `${darkProTokens.warning}20` :
                                                 `${darkProTokens.success}20`,
                                  color: stockColor === 'error' ? darkProTokens.error :
                                        stockColor === 'warning' ? darkProTokens.warning :
                                        darkProTokens.success,
                                  border: `1px solid ${
                                    stockColor === 'error' ? darkProTokens.error :
                                    stockColor === 'warning' ? darkProTokens.warning :
                                    darkProTokens.success
                                  }40`
                                }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="bold" sx={{ color: darkProTokens.primary }}>
                                {utilityFunctions.formatPrice(product.current_stock * product.cost_price)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                                @{utilityFunctions.formatPrice(product.cost_price)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Ajustar Stock">
                                <IconButton
                                  size="small"
                                  onClick={() => openStockDialog(product)}
                                  sx={{ 
                                    color: darkProTokens.primary,
                                    '&:hover': {
                                      backgroundColor: `${darkProTokens.primary}10`
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
                  count={productsTotal}
                  page={productsPage - 1}
                  onPageChange={handlePageChange}
                  rowsPerPage={filters.limit || 10}
                  onRowsPerPageChange={handleRowsPerPageChange}
                  labelRowsPerPage="Filas por página:"
                  labelDisplayedRows={({ from, to, count }) => 
                    `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                  }
                  sx={{
                    color: darkProTokens.textSecondary,
                    borderTop: `1px solid ${darkProTokens.grayDark}`,
                    '& .MuiTablePagination-selectIcon': { color: darkProTokens.textSecondary },
                    '& .MuiTablePagination-actions button': { color: darkProTokens.textSecondary }
                  }}
                />
              </>
            )}
          </Paper>
        </Grid>

        {/* 📜 MOVIMIENTOS RECIENTES */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper sx={{ 
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `1px solid ${darkProTokens.grayDark}`,
            borderRadius: 3,
            height: 'fit-content'
          }}>
            <Box sx={{ p: 3, borderBottom: `1px solid ${darkProTokens.grayDark}` }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight="bold" sx={{ 
                  color: darkProTokens.textPrimary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <HistoryIcon />
                  Movimientos Recientes
                </Typography>
                <Button
                  size="small"
                  onClick={() => loadMovements()}
                  disabled={movementsLoading}
                  sx={{ color: darkProTokens.textSecondary }}
                >
                  {movementsLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
                </Button>
              </Box>
            </Box>

            <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
              {movementsLoading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress sx={{ color: darkProTokens.primary }} size={30} />
                </Box>
              ) : movementsError ? (
                <Alert severity="error" sx={{ m: 2 }}>
                  Error al cargar movimientos: {movementsError}
                </Alert>
              ) : movements.length === 0 ? (
                <Box p={3} textAlign="center">
                  <Typography sx={{ color: darkProTokens.textSecondary }}>
                    No hay movimientos recientes
                  </Typography>
                </Box>
              ) : (
                movements.map((movement, index) => {
                  const typeConfig = utilityFunctions.getMovementTypeConfig(movement.movement_type);
                  return (
                    <Box key={movement.id}>
                      <Box 
                        sx={{ 
                          p: 2, 
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: `${darkProTokens.primary}05`
                          }
                        }}
                        onClick={() => openMovementDialog(movement)}
                      >
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{
                            backgroundColor: typeConfig.color === 'success' ? `${darkProTokens.success}20` :
                                             typeConfig.color === 'error' ? `${darkProTokens.error}20` :
                                             typeConfig.color === 'warning' ? `${darkProTokens.warning}20` :
                                             `${darkProTokens.info}20`,
                            color: typeConfig.color === 'success' ? darkProTokens.success :
                                  typeConfig.color === 'error' ? darkProTokens.error :
                                  typeConfig.color === 'warning' ? darkProTokens.warning :
                                  darkProTokens.info,
                            width: 40,
                            height: 40
                          }}>
                            {typeConfig.icon}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>
                              {movement.products?.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                              {typeConfig.label}: {movement.quantity > 0 ? '+' : ''}{movement.quantity} {movement.products?.unit}
                            </Typography>
                            <Typography variant="caption" display="block" sx={{ color: darkProTokens.textSecondary }}>
                              {utilityFunctions.formatDate(movement.created_at || '')}
                            </Typography>
                          </Box>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: movement.quantity > 0 ? darkProTokens.success : darkProTokens.error,
                              fontWeight: 'bold'
                            }}
                          >
                            {movement.previous_stock} → {movement.new_stock}
                          </Typography>
                        </Box>
                      </Box>
                      {index < movements.length - 1 && (
                        <Divider sx={{ backgroundColor: `${darkProTokens.grayDark}60` }} />
                      )}
                    </Box>
                  );
                })
              )}
            </Box>

            {movements.length > 0 && (
              <Box sx={{ p: 2, borderTop: `1px solid ${darkProTokens.grayDark}` }}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  onClick={() => loadMovements({ page: 1, limit: 10 })}
                  sx={{ 
                    color: darkProTokens.textSecondary,
                    borderColor: `${darkProTokens.textSecondary}40`
                  }}
                >
                  Ver Todos los Movimientos
                </Button>
              </Box>
            )}
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