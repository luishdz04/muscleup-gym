// 📁 src/app/dashboard/admin/catalogo/productos/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
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
  Fab,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Restore as RestoreIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  FileDownload as ExportIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

// 🎯 IMPORTAR NUESTROS HOOKS ENTERPRISE Y TIPOS
import { useProducts, useProductStats } from '@/hooks/useCatalog';
import { Product } from '@/services/catalogService'; // Mejora #3: Tipado fuerte
import ProductFormDialog from '@/components/catalogo/ProductFormDialog';

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
};

const STATUS_FILTERS = [
  { value: 'active', label: '✅ Productos Activos' },
  { value: 'inactive', label: '❌ Productos Inactivos' },
  { value: 'all', label: '📋 Todos los Productos' }
];

const STOCK_FILTERS = [
  { value: '', label: 'Todos los productos' },
  { value: 'available', label: '✅ Stock disponible' },
  { value: 'low', label: '⚠️ Stock bajo' },
  { value: 'out', label: '❌ Sin stock' },
  { value: 'overstock', label: '📈 Sobre stock' }
];

export default function ProductosPage() {
  const router = useRouter();
  
  // 🎯 USAR NUESTROS HOOKS ENTERPRISE
  const {
    products,
    loading,
    error,
    total,
    page,
    hasMore,
    filters,
    notification,
    createProduct,
    updateProduct,
    deleteProduct,
    restoreProduct,
    updateFilters,
    changePage,
    reload,
    closeNotification
  } = useProducts({
    status: 'active',
    limit: 20
  });

  const {
    stats,
    loading: statsLoading,
    error: statsError,
    reload: reloadStats
  } = useProductStats();

  // 🎯 ESTADOS LOCALES SIMPLIFICADOS - MEJORA #3: TIPADO FUERTE
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuProduct, setMenuProduct] = useState<Product | null>(null);

  // ✅ MEJORA #2: MEMORIZAR CÁLCULO DE CATEGORÍAS ÚNICAS
  const uniqueCategories = useMemo(() => {
    return [...new Set(products.map(p => p.category))];
  }, [products]);

  // 🎯 FUNCIONES SIMPLIFICADAS - MEJORA #1: ELIMINAR ESTADOS REDUNDANTES
  const handleSearch = (value: string) => {
    updateFilters({ search: value, page: 1 }); // Resetear página al filtrar
  };

  const handleCategoryFilter = (value: string) => {
    updateFilters({ category: value, page: 1 });
  };

  const handleStockFilter = (value: string) => {
    updateFilters({ stockLevel: value as any, page: 1 });
  };

  const handleStatusFilter = (value: string) => {
    updateFilters({ status: value as any, page: 1 });
  };

  const openProductDialog = (product?: Product) => {
    setSelectedProduct(product || null);
    setProductDialogOpen(true);
    setMenuAnchor(null);
  };

  const closeProductDialog = () => {
    setSelectedProduct(null);
    setProductDialogOpen(false);
  };

  const handleProductSave = () => {
  console.log('🔄 Producto guardado, recargando datos...');
  reload(); // Recargar la lista de productos
  reloadStats(); // Recargar las estadísticas también
  closeProductDialog(); // Cerrar el diálogo
};

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, product: Product) => {
    setMenuAnchor(event.currentTarget);
    setMenuProduct(product);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuProduct(null);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return;
    
    await deleteProduct(productId);
    handleMenuClose();
  };

  const handleRestore = async (productId: string) => {
    await restoreProduct(productId);
    handleMenuClose();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  const getStockColor = (product: Product): 'error' | 'warning' | 'success' | 'info' => {
    if (product.current_stock === 0) return 'error';
    if (product.current_stock <= product.min_stock) return 'warning';
    if (product.max_stock && product.current_stock > product.max_stock) return 'info';
    return 'success';
  };

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
              Gestión de Productos
            </Typography>
            <Typography variant="h6" sx={{ 
              color: darkProTokens.textSecondary,
              fontWeight: 300
            }}>
              Catálogo | Inventario | Control de Stock
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
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
              disabled={loading}
              sx={{ 
                color: darkProTokens.textSecondary,
                borderColor: `${darkProTokens.textSecondary}60`,
                px: 3, py: 1.5, borderRadius: 3, fontWeight: 600
              }}
            >
              {loading ? <CircularProgress size={20} /> : 'Actualizar'}
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
                        Productos Totales
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
                        {formatPrice(stats.totalValue)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        Valor Total
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
                        Stock Bajo
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
                        Sin Stock
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

      {/* 🔍 FILTROS ENTERPRISE - MEJORA #1: USAR ESTADO CENTRALIZADO */}
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
              value={filters.search || ''} // ✅ Usar estado centralizado
              onChange={(e) => handleSearch(e.target.value)}
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
                value={filters.category || ''} // ✅ Usar estado centralizado
                label="Categoría"
                onChange={(e) => handleCategoryFilter(e.target.value)}
                sx={{
                  color: darkProTokens.textPrimary,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: `${darkProTokens.primary}30`
                  }
                }}
              >
                <MenuItem value="">Todas</MenuItem>
                {/* ✅ MEJORA #2: USAR CATEGORÍAS MEMORIZADAS */}
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
                Stock
              </InputLabel>
              <Select
                value={filters.stockLevel || ''} // ✅ Usar estado centralizado
                label="Stock"
                onChange={(e) => handleStockFilter(e.target.value)}
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
                onChange={(e) => handleStatusFilter(e.target.value)}
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
              {products.length} de {total} productos
            </Typography>
          </Grid>
          
          <Grid size={{ xs: 12, md: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => {
                // ✅ LIMPIAR FILTROS USANDO ESTADO CENTRALIZADO
                updateFilters({ 
                  search: '', 
                  category: '', 
                  stockLevel: undefined,
                  page: 1 
                });
              }}
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

      {/* 📋 TABLA DE PRODUCTOS ENTERPRISE */}
      <Paper sx={{ 
        mb: 3,
        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
        border: `1px solid ${darkProTokens.grayDark}`,
        borderRadius: 3
      }}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress sx={{ color: darkProTokens.primary }} size={40} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 3 }}>
            Error al cargar productos: {error}
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
                    <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>SKU</TableCell>
                    <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Categoría</TableCell>
                    <TableCell align="center" sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Stock</TableCell>
                    <TableCell align="center" sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Estado</TableCell>
                    <TableCell align="right" sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Precio</TableCell>
                    <TableCell align="center" sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product) => (
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
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>
                              {product.name}
                            </Typography>
                            {product.brand && (
                              <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                                {product.brand}
                              </Typography>
                            )}
                          </Box>
                          {product.is_active === false && (
                            <Chip 
                              label="INACTIVO" 
                              sx={{
                                backgroundColor: darkProTokens.error,
                                color: darkProTokens.textPrimary,
                                fontWeight: 700
                              }} 
                              size="small" 
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace" sx={{ color: darkProTokens.textSecondary }}>
                          {product.sku || 'Sin SKU'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={product.category} 
                          size="small" 
                          sx={{
                            backgroundColor: `${darkProTokens.info}20`,
                            color: darkProTokens.info,
                            border: `1px solid ${darkProTokens.info}40`
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>
                          {product.current_stock} {product.unit}
                        </Typography>
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
                            product.current_stock === 0 ? 'Sin Stock' :
                            product.current_stock <= product.min_stock ? 'Stock Bajo' :
                            'Disponible'
                          }
                          sx={{
                            backgroundColor: getStockColor(product) === 'error' ? `${darkProTokens.error}20` :
                                           getStockColor(product) === 'warning' ? `${darkProTokens.warning}20` :
                                           `${darkProTokens.success}20`,
                            color: getStockColor(product) === 'error' ? darkProTokens.error :
                                  getStockColor(product) === 'warning' ? darkProTokens.warning :
                                  darkProTokens.success,
                            border: `1px solid ${
                              getStockColor(product) === 'error' ? darkProTokens.error :
                              getStockColor(product) === 'warning' ? darkProTokens.warning :
                              darkProTokens.success
                            }40`
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold" sx={{ color: darkProTokens.primary }}>
                          {formatPrice(product.sale_price)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                          Costo: {formatPrice(product.cost_price)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, product)}
                          sx={{ color: darkProTokens.textSecondary }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              component="div"
              count={total}
              page={page - 1} // TablePagination usa índice base 0
              onPageChange={(_, newPage) => changePage(newPage + 1)}
              rowsPerPage={filters.limit || 20}
              onRowsPerPageChange={(e) => {
                updateFilters({ limit: parseInt(e.target.value, 10) });
              }}
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

      {/* 🎯 FAB PARA AGREGAR PRODUCTO */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
          color: darkProTokens.background,
          fontWeight: 700,
          '&:hover': {
            background: `linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive})`,
            transform: 'scale(1.1)'
          }
        }}
        onClick={() => openProductDialog()}
      >
        <AddIcon />
      </Fab>

      {/* 📝 MENÚ DE ACCIONES */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `1px solid ${darkProTokens.primary}30`,
            borderRadius: 2,
            color: darkProTokens.textPrimary
          }
        }}
      >
        <MenuItem onClick={() => openProductDialog(menuProduct!)}>
          <ListItemIcon>
            <EditIcon sx={{ color: darkProTokens.primary }} />
          </ListItemIcon>
          <ListItemText>Editar Producto</ListItemText>
        </MenuItem>
        
        {menuProduct?.is_active === false ? (
          <MenuItem onClick={() => handleRestore(menuProduct.id)}>
            <ListItemIcon>
              <RestoreIcon sx={{ color: darkProTokens.success }} />
            </ListItemIcon>
            <ListItemText>Restaurar Producto</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={() => handleDelete(menuProduct?.id!)}>
            <ListItemIcon>
              <DeleteIcon sx={{ color: darkProTokens.error }} />
            </ListItemIcon>
            <ListItemText>Eliminar Producto</ListItemText>
          </MenuItem>
        )}

        <MenuItem onClick={() => {
          router.push(`/dashboard/admin/catalogo/inventario`);
          handleMenuClose();
        }}>
          <ListItemIcon>
            {menuProduct?.is_active === false ? 
              <VisibilityOffIcon sx={{ color: darkProTokens.warning }} /> : 
              <VisibilityIcon sx={{ color: darkProTokens.info }} />
            }
          </ListItemIcon>
          <ListItemText>Ver en Inventario</ListItemText>
        </MenuItem>
      </Menu>

      {/* 📝 DIALOG DE FORMULARIO */}
      <ProductFormDialog
  open={productDialogOpen}
  onClose={closeProductDialog}
  product={selectedProduct || undefined}
  onSave={handleProductSave}
/>
    </Box>
  );
}