'use client';

import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Badge,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Avatar,
  LinearProgress,
  Switch,
  FormControlLabel
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
  Remove as RemoveIcon,
  History as HistoryIcon,
  Assessment as AssessmentIcon,
  MoreVert as MoreVertIcon,
  FileDownload as ExportIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatPrice, formatDate, formatQuantity } from '@/utils/formatUtils';
import { showNotification } from '@/utils/notifications';
import { Product, InventoryMovement, InventoryStats } from '@/types';
import { corporateColors, getGradient } from '@/theme/colors';

interface StockAdjustmentData {
  product_id: string;
  movement_type: string;
  quantity: number;
  reason: string;
  notes: string;
}

const MOVEMENT_TYPES = [
  { value: 'entrada', label: '📦 Entrada', color: 'success' },
  { value: 'salida', label: '📤 Salida', color: 'error' },
  { value: 'ajuste', label: '🔧 Ajuste', color: 'warning' },
  { value: 'transferencia', label: '🔄 Transferencia', color: 'info' }
];

const STOCK_FILTERS = [
  { value: '', label: 'Todos los productos' },
  { value: 'available', label: '✅ Stock disponible' },
  { value: 'low', label: '⚠️ Stock bajo' },
  { value: 'out', label: '❌ Sin stock' },
  { value: 'overstock', label: '📈 Sobre stock' }
];

const STATUS_FILTERS = [
  { value: 'active', label: '✅ Productos Activos' },
  { value: 'inactive', label: '❌ Productos Inactivos' },
  { value: 'all', label: '📋 Todos los Productos' }
];

export default function InventarioPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    totalProducts: 0,
    totalValue: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    recentMovements: 0,
    totalMovements: 0
  });

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [movementTypeFilter, setMovementTypeFilter] = useState('');
  const [showInactiveProducts, setShowInactiveProducts] = useState(false);
  const [loading, setLoading] = useState(true);

  // Estados de tabla
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [movementsPage, setMovementsPage] = useState(0);
  const [movementsRowsPerPage, setMovementsRowsPerPage] = useState(5);

  // Estados de dialogs
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentData, setAdjustmentData] = useState<StockAdjustmentData>({
    product_id: '',
    movement_type: 'entrada',
    quantity: 0,
    reason: '',
    notes: ''
  });

  // Estados de menú
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuProduct, setMenuProduct] = useState<Product | null>(null);

  const supabase = createBrowserSupabaseClient();

  // ✅ Cargar productos
  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          suppliers (
            company_name,
            contact_person
          )
        `)
        .order('name');

      if (error) throw error;
      
      setProducts(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      showNotification('Error al cargar productos', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Cargar movimientos
  const loadMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_movements')
        .select(`
          *,
          products (
            id,
            name,
            sku,
            unit,
            is_active,
            category,
            brand
          ),
          Users (
            firstName,
            lastName
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // ✅ Filtrar movimientos según configuración
      let filteredMovements = data || [];
      if (!showInactiveProducts) {
        filteredMovements = filteredMovements.filter(movement => 
          movement.products?.is_active !== false
        );
      }
      
      setMovements(filteredMovements);
      
      setStats(prev => ({
        ...prev,
        recentMovements: filteredMovements.filter(m => {
          const movementDate = new Date(m.created_at || '');
          const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
          return movementDate >= threeDaysAgo;
        }).length,
        totalMovements: filteredMovements.length
      }));
    } catch (error) {
      console.error('Error loading movements:', error);
      showNotification('Error al cargar movimientos', 'error');
    }
  };

  // ✅ Calcular estadísticas
  const calculateStats = (productList: Product[]) => {
    const activeProducts = productList.filter(p => p.is_active !== false);
    const totalProducts = activeProducts.length;
    const totalValue = activeProducts.reduce((sum, p) => sum + (p.current_stock * p.cost_price), 0);
    const lowStockProducts = activeProducts.filter(p => p.current_stock <= p.min_stock && p.current_stock > 0).length;
    const outOfStockProducts = activeProducts.filter(p => p.current_stock === 0).length;

    setStats(prev => ({
      ...prev,
      totalProducts,
      totalValue,
      lowStockProducts,
      outOfStockProducts
    }));
  };

  // ✅ Filtrar productos
  useEffect(() => {
    let filtered = products;

    if (statusFilter === 'active') {
      filtered = filtered.filter(product => product.is_active !== false);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(product => product.is_active === false);
    }

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    if (stockFilter) {
      switch (stockFilter) {
        case 'low':
          filtered = filtered.filter(product => 
            product.current_stock <= product.min_stock && product.current_stock > 0
          );
          break;
        case 'out':
          filtered = filtered.filter(product => product.current_stock === 0);
          break;
        case 'available':
          filtered = filtered.filter(product => product.current_stock > product.min_stock);
          break;
        case 'overstock':
          filtered = filtered.filter(product => 
            product.max_stock && product.current_stock > product.max_stock
          );
          break;
      }
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, categoryFilter, stockFilter, statusFilter]);

  // ✅ Actualizar movimientos cuando cambie filtro
  useEffect(() => {
    loadMovements();
  }, [showInactiveProducts]);

  // Obtener categorías únicas
  const getUniqueCategories = () => {
    return [...new Set(products.map(p => p.category))];
  };

  // Obtener color de stock
  const getStockColor = (product: Product) => {
    if (product.current_stock === 0) return 'error';
    if (product.current_stock <= product.min_stock) return 'warning';
    if (product.max_stock && product.current_stock > product.max_stock) return 'info';
    return 'success';
  };

  // Obtener porcentaje de stock
  const getStockPercentage = (product: Product) => {
    if (!product.max_stock) return 100;
    return Math.min((product.current_stock / product.max_stock) * 100, 100);
  };

  // ✅ Procesar ajuste de stock
  const handleStockAdjustment = async () => {
    if (!selectedProduct || adjustmentData.quantity === 0) {
      showNotification('Datos del ajuste incompletos', 'error');
      return;
    }

    if (selectedProduct.is_active === false) {
      showNotification('No se puede ajustar stock de productos inactivos', 'error');
      return;
    }

    try {
      setLoading(true);

      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;

      // Calcular nuevo stock
      let newStock = selectedProduct.current_stock;
      let actualQuantity = adjustmentData.quantity;

      switch (adjustmentData.movement_type) {
        case 'entrada':
          newStock += adjustmentData.quantity;
          break;
        case 'salida':
          newStock -= adjustmentData.quantity;
          actualQuantity = -adjustmentData.quantity;
          break;
        case 'ajuste':
          actualQuantity = adjustmentData.quantity - selectedProduct.current_stock;
          newStock = adjustmentData.quantity;
          break;
      }

      if (newStock < 0) {
        showNotification('Stock insuficiente para la operación', 'error');
        return;
      }

      // Actualizar stock del producto
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          current_stock: newStock,
          updated_at: new Date().toISOString(),
          updated_by: userId
        })
        .eq('id', selectedProduct.id);

      if (updateError) throw updateError;

      // Registrar movimiento
      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert([{
          product_id: selectedProduct.id,
          movement_type: adjustmentData.movement_type,
          quantity: actualQuantity,
          previous_stock: selectedProduct.current_stock,
          new_stock: newStock,
          unit_cost: selectedProduct.cost_price,
          total_cost: Math.abs(actualQuantity) * selectedProduct.cost_price,
          reason: adjustmentData.reason,
          notes: adjustmentData.notes || null,
          created_by: userId
        }]);

      if (movementError) throw movementError;

      showNotification('Ajuste de stock realizado correctamente', 'success');
      setAdjustmentDialogOpen(false);
      setSelectedProduct(null);
      setAdjustmentData({
        product_id: '',
        movement_type: 'entrada',
        quantity: 0,
        reason: '',
        notes: ''
      });

      loadProducts();
      loadMovements();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      showNotification('Error al realizar el ajuste', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Abrir dialog de ajuste
  const openAdjustmentDialog = (product: Product) => {
    if (product.is_active === false) {
      showNotification('No se puede ajustar stock de productos inactivos', 'warning');
      return;
    }
    
    setSelectedProduct(product);
    setAdjustmentData({
      product_id: product.id,
      movement_type: 'entrada',
      quantity: 0,
      reason: '',
      notes: ''
    });
    setAdjustmentDialogOpen(true);
    setMenuAnchor(null);
  };

  // Manejar menú de acciones
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, product: Product) => {
    setMenuAnchor(event.currentTarget);
    setMenuProduct(product);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuProduct(null);
  };

  // Exportar datos
  const handleExport = async () => {
    try {
      showNotification('Funcionalidad de exportación en desarrollo', 'info');
    } catch (error) {
      showNotification('Error al exportar datos', 'error');
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadProducts();
    loadMovements();
  }, []);

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: corporateColors.background.default,
      color: corporateColors.text.primary,
      p: 3
    }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography 
          variant="h4" 
          component="h1" 
          fontWeight="bold"
          sx={{ color: corporateColors.text.primary }}
        >
          📦 Gestión de Inventario
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExport}
            sx={{ 
              borderColor: corporateColors.primary.main,
              color: corporateColors.primary.main 
            }}
          >
            Exportar
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              loadProducts();
              loadMovements();
            }}
            sx={{ 
              borderColor: corporateColors.primary.main,
              color: corporateColors.primary.main 
            }}
          >
            Actualizar
          </Button>
        </Box>
      </Box>

      {/* Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ background: getGradient('info'), color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalProducts}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Productos Activos
                  </Typography>
                </Box>
                <InventoryIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ background: getGradient('success'), color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatPrice(stats.totalValue)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Valor Total
                  </Typography>
                </Box>
                <AssessmentIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ background: getGradient('warning'), color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.lowStockProducts}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Stock Bajo
                  </Typography>
                </Box>
                <TrendingDownIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ background: getGradient('error'), color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.outOfStockProducts}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Sin Stock
                  </Typography>
                </Box>
                <WarningIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Paper sx={{ 
        p: 3, 
        mb: 3,
        bgcolor: corporateColors.background.paper,
        color: corporateColors.text.onWhite
      }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={categoryFilter}
                label="Categoría"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {getUniqueCategories().map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Stock</InputLabel>
              <Select
                value={stockFilter}
                label="Stock"
                onChange={(e) => setStockFilter(e.target.value)}
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
              <InputLabel>Estado</InputLabel>
              <Select
                value={statusFilter}
                label="Estado"
                onChange={(e) => setStatusFilter(e.target.value)}
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
            <Typography variant="body2" color="text.secondary">
              {filteredProducts.length} de {products.length} productos
            </Typography>
          </Grid>
          
          <Grid size={{ xs: 12, md: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('');
                setStockFilter('');
                setStatusFilter('active');
              }}
            >
              Limpiar
            </Button>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={showInactiveProducts}
                onChange={(e) => setShowInactiveProducts(e.target.checked)}
              />
            }
            label="Mostrar movimientos de productos inactivos"
          />
        </Box>
      </Paper>

      {/* Tabla de productos */}
      <Paper sx={{ 
        mb: 3,
        bgcolor: corporateColors.background.paper,
        color: corporateColors.text.onWhite
      }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: corporateColors.background.dark }}>
                <TableCell sx={{ color: corporateColors.text.primary }}>Producto</TableCell>
                <TableCell sx={{ color: corporateColors.text.primary }}>SKU</TableCell>
                <TableCell sx={{ color: corporateColors.text.primary }}>Categoría</TableCell>
                <TableCell align="center" sx={{ color: corporateColors.text.primary }}>Stock Actual</TableCell>
                <TableCell align="center" sx={{ color: corporateColors.text.primary }}>Stock Mín.</TableCell>
                <TableCell align="center" sx={{ color: corporateColors.text.primary }}>Estado</TableCell>
                <TableCell align="right" sx={{ color: corporateColors.text.primary }}>Valor</TableCell>
                <TableCell align="center" sx={{ color: corporateColors.text.primary }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((product) => (
                  <TableRow 
                    key={product.id} 
                    hover
                    sx={{ 
                      opacity: product.is_active === false ? 0.6 : 1,
                      backgroundColor: product.is_active === false ? 'error.50' : 'inherit'
                    }}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {product.name}
                          </Typography>
                          {product.brand && (
                            <Typography variant="caption" color="text.secondary">
                              {product.brand}
                            </Typography>
                          )}
                        </Box>
                        {product.is_active === false && (
                          <Chip label="INACTIVO" color="error" size="small" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {product.sku || 'Sin SKU'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={product.category} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="center">
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {formatQuantity(product.current_stock, product.unit)}
                        </Typography>
                        {product.max_stock && (
                          <LinearProgress
                            variant="determinate"
                            value={getStockPercentage(product)}
                            color={getStockColor(product)}
                            sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {formatQuantity(product.min_stock, product.unit)}
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
                        color={getStockColor(product)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        {formatPrice(product.current_stock * product.cost_price)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, product)}
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
          count={filteredProducts.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
        />
      </Paper>

      {/* Movimientos recientes */}
      <Paper sx={{ 
        p: 3,
        bgcolor: corporateColors.background.paper,
        color: corporateColors.text.onWhite
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon />
            Movimientos Recientes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {stats.recentMovements} movimientos últimos 3 días • {stats.totalMovements} total
          </Typography>
        </Box>
        
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: corporateColors.background.dark }}>
                <TableCell sx={{ color: corporateColors.text.primary }}>Fecha</TableCell>
                <TableCell sx={{ color: corporateColors.text.primary }}>Producto</TableCell>
                <TableCell sx={{ color: corporateColors.text.primary }}>Tipo</TableCell>
                <TableCell align="center" sx={{ color: corporateColors.text.primary }}>Cantidad</TableCell>
                <TableCell sx={{ color: corporateColors.text.primary }}>Razón</TableCell>
                <TableCell sx={{ color: corporateColors.text.primary }}>Usuario</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {movements
                .slice(movementsPage * movementsRowsPerPage, movementsPage * movementsRowsPerPage + movementsRowsPerPage)
                .map((movement) => {
                  const movementConfig = MOVEMENT_TYPES.find(mt => mt.value === movement.movement_type);
                  return (
                    <TableRow key={movement.id}>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(movement.created_at || '')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {movement.products?.name || 'Producto eliminado'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {movement.products?.sku || 'Sin SKU'}
                            </Typography>
                          </Box>
                          {movement.products?.is_active === false && (
                            <Chip label="INACTIVO" color="error" size="small" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={movementConfig?.label || movement.movement_type}
                          color={movementConfig?.color as any || 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography 
                          variant="body2" 
                          fontWeight="bold"
                          color={movement.quantity >= 0 ? 'success.main' : 'error.main'}
                        >
                          {movement.quantity >= 0 ? '+' : ''}{formatQuantity(movement.quantity, movement.products?.unit || 'pieza')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {movement.reason}
                        </Typography>
                        {movement.notes && (
                          <Typography variant="caption" color="text.secondary">
                            {movement.notes}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {movement.Users ? 
                            `${movement.Users.firstName} ${movement.Users.lastName || ''}`.trim() : 
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

        <TablePagination
          component="div"
          count={movements.length}
          page={movementsPage}
          onPageChange={(_, newPage) => setMovementsPage(newPage)}
          rowsPerPage={movementsRowsPerPage}
          onRowsPerPageChange={(e) => {
            setMovementsRowsPerPage(parseInt(e.target.value, 10));
            setMovementsPage(0);
          }}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
        />
      </Paper>

      {/* Menú de acciones */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem 
          onClick={() => {
            if (menuProduct) openAdjustmentDialog(menuProduct);
          }}
          disabled={menuProduct?.is_active === false}
        >
          <ListItemIcon>
            <EditIcon />
          </ListItemIcon>
          <ListItemText>
            {menuProduct?.is_active === false ? 'No se puede ajustar (Inactivo)' : 'Ajustar Stock'}
          </ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => {
          // TODO: Ver historial del producto
          handleMenuClose();
        }}>
          <ListItemIcon>
            <HistoryIcon />
          </ListItemIcon>
          <ListItemText>Ver Historial</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => {
          // TODO: Ver detalles del producto
          handleMenuClose();
        }}>
          <ListItemIcon>
            {menuProduct?.is_active === false ? <VisibilityOffIcon /> : <VisibilityIcon />}
          </ListItemIcon>
          <ListItemText>Ver Detalles</ListItemText>
        </MenuItem>
      </Menu>

      {/* Dialog de ajuste de stock */}
      <Dialog 
        open={adjustmentDialogOpen} 
        onClose={() => setAdjustmentDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: corporateColors.background.paper,
            color: corporateColors.text.onWhite
          }
        }}
      >
        <DialogTitle sx={{
          background: getGradient('primary'),
          color: corporateColors.text.onPrimary
        }}>
          Ajustar Stock - {selectedProduct?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid size={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Stock actual: <strong>{selectedProduct?.current_stock} {selectedProduct?.unit}</strong>
                </Alert>
              </Grid>

              <Grid size={12}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Ajuste</InputLabel>
                  <Select
                    value={adjustmentData.movement_type}
                    label="Tipo de Ajuste"
                    onChange={(e) => setAdjustmentData(prev => ({ 
                      ...prev, 
                      movement_type: e.target.value 
                    }))}
                  >
                    <MenuItem value="entrada">📦 Entrada (Agregar)</MenuItem>
                    <MenuItem value="salida">📤 Salida (Quitar)</MenuItem>
                    <MenuItem value="ajuste">🔧 Ajuste (Establecer cantidad exacta)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={12}>
                <TextField
                  fullWidth
                  label={adjustmentData.movement_type === 'ajuste' ? 'Nueva cantidad' : 'Cantidad'}
                  type="number"
                  value={adjustmentData.quantity}
                  onChange={(e) => setAdjustmentData(prev => ({ 
                    ...prev, 
                    quantity: parseInt(e.target.value) || 0 
                  }))}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">{selectedProduct?.unit}</InputAdornment>
                  }}
                />
              </Grid>

              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Razón del Ajuste *"
                  value={adjustmentData.reason}
                  onChange={(e) => setAdjustmentData(prev => ({ 
                    ...prev, 
                    reason: e.target.value 
                  }))}
                  placeholder="Ej: Inventario físico, Merma, Recepción"
                />
              </Grid>

              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Notas"
                  multiline
                  rows={3}
                  value={adjustmentData.notes}
                  onChange={(e) => setAdjustmentData(prev => ({ 
                    ...prev, 
                    notes: e.target.value 
                  }))}
                  placeholder="Observaciones adicionales..."
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustmentDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleStockAdjustment} 
            variant="contained"
            disabled={!adjustmentData.reason.trim() || adjustmentData.quantity === 0}
            sx={{
              background: getGradient('primary'),
              color: corporateColors.text.onPrimary
            }}
          >
            Aplicar Ajuste
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}