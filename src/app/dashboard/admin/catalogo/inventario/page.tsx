'use client';

import React, { useState, useEffect } from 'react';
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
  FormControlLabel,
  CircularProgress,
  Snackbar
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
  VisibilityOff as VisibilityOffIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// 🎨 DARK PRO SYSTEM - TOKENS ACTUALIZADOS
const darkProTokens = {
  // Base Colors
  background: '#000000',
  surfaceLevel1: '#121212',
  surfaceLevel2: '#1E1E1E',
  surfaceLevel3: '#252525',
  surfaceLevel4: '#2E2E2E',
  
  // Neutrals
  grayDark: '#333333',
  grayMedium: '#444444',
  grayLight: '#555555',
  grayMuted: '#777777',
  textPrimary: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textDisabled: '#888888',
  
  // Primary Accent (Golden)
  primary: '#FFCC00',
  primaryHover: '#E6B800',
  primaryActive: '#CCAA00',
  primaryDisabled: 'rgba(255,204,0,0.3)',
  
  // Semantic Colors
  success: '#388E3C',
  successHover: '#2E7D32',
  error: '#D32F2F',
  errorHover: '#B71C1C',
  warning: '#FFB300',
  warningHover: '#E6A700',
  info: '#1976D2',
  infoHover: '#1565C0',
  
  // User Roles
  roleAdmin: '#FFCC00',
  roleStaff: '#1976D2',
  roleTrainer: '#009688',
  roleUser: '#777777',
  roleModerator: '#9C27B0',
  roleGuest: '#444444',
  
  // Interactions
  hoverOverlay: 'rgba(255,204,0,0.05)',
  activeOverlay: 'rgba(255,204,0,0.1)',
  borderDefault: '#333333',
  borderHover: '#FFCC00',
  borderActive: '#E6B800'
};

interface Product {
  id: string;
  name: string;
  sku?: string;
  brand?: string;
  category: string;
  current_stock: number;
  min_stock: number;
  max_stock?: number;
  unit: string;
  cost_price: number;
  sale_price: number;
  is_active?: boolean;
  suppliers?: {
    company_name: string;
    contact_person: string;
  };
}

interface InventoryMovement {
  id: string;
  product_id: string;
  movement_type: string;
  quantity: number;
  previous_stock?: number;
  new_stock?: number;
  unit_cost?: number;
  total_cost?: number;
  reason: string;
  notes?: string;
  created_at?: string;
  created_by?: string;
  products?: {
    id: string;
    name: string;
    sku?: string;
    unit: string;
    is_active?: boolean;
    category: string;
    brand?: string;
  };
  Users?: {
    firstName: string;
    lastName?: string;
  };
}

interface InventoryStats {
  totalProducts: number;
  totalValue: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  recentMovements: number;
  totalMovements: number;
}

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
  const router = useRouter();
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

  // Estados de notificaciones
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const supabase = createBrowserSupabaseClient();

  // ✅ Formatear precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  // ✅ Formatear cantidad
  const formatQuantity = (quantity: number, unit: string) => {
    return `${quantity} ${unit}`;
  };

  // ✅ Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ✅ Mostrar notificación
  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({ open: true, message, severity });
  };

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
  const getStockColor = (product: Product): 'error' | 'warning' | 'success' | 'info' => {
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
      background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
      color: darkProTokens.textPrimary,
      p: 3
    }}>
      {/* ✅ SNACKBAR CON DARK PRO SYSTEM */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          severity={notification.severity}
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          sx={{
            background: notification.severity === 'success' ? 
              `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})` :
              notification.severity === 'error' ?
              `linear-gradient(135deg, ${darkProTokens.error}, ${darkProTokens.errorHover})` :
              notification.severity === 'warning' ?
              `linear-gradient(135deg, ${darkProTokens.warning}, ${darkProTokens.warningHover})` :
              `linear-gradient(135deg, ${darkProTokens.info}, ${darkProTokens.infoHover})`,
            color: darkProTokens.textPrimary,
            border: `1px solid ${
              notification.severity === 'success' ? darkProTokens.success :
              notification.severity === 'error' ? darkProTokens.error :
              notification.severity === 'warning' ? darkProTokens.warning :
              darkProTokens.info
            }60`,
            borderRadius: 3,
            fontWeight: 600,
            '& .MuiAlert-icon': { color: darkProTokens.textPrimary },
            '& .MuiAlert-action': { color: darkProTokens.textPrimary }
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      {/* ✅ HEADER CON DARK PRO SYSTEM */}
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
              Gestión de Inventario
            </Typography>
            <Typography variant="h6" sx={{ 
              color: darkProTokens.textSecondary,
              fontWeight: 300
            }}>
              Control de Stock | Movimientos y Ajustes de Inventario
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/dashboard/admin/catalogo')}
              sx={{ 
                color: darkProTokens.primary,
                borderColor: `${darkProTokens.primary}60`,
                px: 3,
                py: 1.5,
                borderRadius: 3,
                fontWeight: 600,
                '&:hover': {
                  borderColor: darkProTokens.primary,
                  backgroundColor: `${darkProTokens.primary}10`,
                  transform: 'translateY(-2px)'
                }
              }}
              variant="outlined"
            >
              Catálogo
            </Button>

            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={handleExport}
              sx={{ 
                color: darkProTokens.textSecondary,
                borderColor: `${darkProTokens.textSecondary}60`,
                px: 3,
                py: 1.5,
                borderRadius: 3,
                fontWeight: 600,
                '&:hover': {
                  borderColor: darkProTokens.textSecondary,
                  backgroundColor: `${darkProTokens.textSecondary}10`,
                  transform: 'translateY(-2px)'
                }
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
              disabled={loading}
              sx={{ 
                color: darkProTokens.textSecondary,
                borderColor: `${darkProTokens.textSecondary}60`,
                px: 3,
                py: 1.5,
                borderRadius: 3,
                fontWeight: 600,
                '&:hover': {
                  borderColor: darkProTokens.textSecondary,
                  backgroundColor: `${darkProTokens.textSecondary}10`,
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Actualizar
            </Button>
          </Box>
        </Box>

        {/* ✅ ESTADÍSTICAS CON DARK PRO SYSTEM */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ 
              background: `${darkProTokens.info}10`, 
              border: `1px solid ${darkProTokens.info}30`,
              borderRadius: 3,
              color: darkProTokens.textPrimary
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.info }}>
                      {stats.totalProducts}
                    </Typography>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                      Productos Activos
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
              borderRadius: 3,
              color: darkProTokens.textPrimary
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
                  <AssessmentIcon sx={{ fontSize: 40, color: darkProTokens.success, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ 
              background: `${darkProTokens.warning}10`, 
              border: `1px solid ${darkProTokens.warning}30`,
              borderRadius: 3,
              color: darkProTokens.textPrimary
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
                  <TrendingDownIcon sx={{ fontSize: 40, color: darkProTokens.warning, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ 
              background: `${darkProTokens.error}10`, 
              border: `1px solid ${darkProTokens.error}30`,
              borderRadius: 3,
              color: darkProTokens.textPrimary
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
                  <WarningIcon sx={{ fontSize: 40, color: darkProTokens.error, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* ✅ FILTROS CON DARK PRO SYSTEM */}
      <Paper sx={{ 
        p: 3, 
        mb: 3,
        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
        border: `1px solid ${darkProTokens.grayDark}`,
        borderRadius: 3,
        color: darkProTokens.textPrimary
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
                value={categoryFilter}
                label="Categoría"
                onChange={(e) => setCategoryFilter(e.target.value)}
                sx={{
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
                }}
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
              <InputLabel sx={{ 
                color: darkProTokens.textSecondary,
                '&.Mui-focused': { color: darkProTokens.primary }
              }}>
                Stock
              </InputLabel>
              <Select
                value={stockFilter}
                label="Stock"
                onChange={(e) => setStockFilter(e.target.value)}
                sx={{
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
                value={statusFilter}
                label="Estado"
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{
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
              sx={{
                color: darkProTokens.textSecondary,
                borderColor: `${darkProTokens.textSecondary}40`,
                '&:hover': {
                  borderColor: darkProTokens.textSecondary,
                  backgroundColor: `${darkProTokens.textSecondary}10`
                }
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
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: darkProTokens.primary,
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: darkProTokens.primary,
                  },
                }}
              />
            }
            label={
              <Typography sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                Mostrar movimientos de productos inactivos
              </Typography>
            }
          />
        </Box>
      </Paper>

      {/* ✅ TABLA DE PRODUCTOS CON DARK PRO SYSTEM */}
      <Paper sx={{ 
        mb: 3,
        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
        border: `1px solid ${darkProTokens.grayDark}`,
        borderRadius: 3,
        color: darkProTokens.textPrimary
      }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ 
                background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`
              }}>
                <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Producto</TableCell>
                <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>SKU</TableCell>
                <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Categoría</TableCell>
                <TableCell align="center" sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Stock Actual</TableCell>
                <TableCell align="center" sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Stock Mín.</TableCell>
                <TableCell align="center" sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Estado</TableCell>
                <TableCell align="right" sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Valor</TableCell>
                <TableCell align="center" sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Acciones</TableCell>
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
                      <Box>
                        <Typography variant="body2" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>
                          {formatQuantity(product.current_stock, product.unit)}
                        </Typography>
                        {product.max_stock && (
                          <LinearProgress
                            variant="determinate"
                            value={getStockPercentage(product)}
                            sx={{ 
                              mt: 0.5, 
                              height: 4, 
                              borderRadius: 2,
                              backgroundColor: `${darkProTokens.grayDark}`,
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: getStockColor(product) === 'error' ? darkProTokens.error :
                                               getStockColor(product) === 'warning' ? darkProTokens.warning :
                                               getStockColor(product) === 'info' ? darkProTokens.info :
                                               darkProTokens.success
                              }
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
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
                        sx={{
                          backgroundColor: getStockColor(product) === 'error' ? `${darkProTokens.error}20` :
                                         getStockColor(product) === 'warning' ? `${darkProTokens.warning}20` :
                                         getStockColor(product) === 'info' ? `${darkProTokens.info}20` :
                                         `${darkProTokens.success}20`,
                          color: getStockColor(product) === 'error' ? darkProTokens.error :
                                getStockColor(product) === 'warning' ? darkProTokens.warning :
                                getStockColor(product) === 'info' ? darkProTokens.info :
                                darkProTokens.success,
                          border: `1px solid ${
                            getStockColor(product) === 'error' ? darkProTokens.error :
                            getStockColor(product) === 'warning' ? darkProTokens.warning :
                            getStockColor(product) === 'info' ? darkProTokens.info :
                            darkProTokens.success
                          }40`
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold" sx={{ color: darkProTokens.primary }}>
                        {formatPrice(product.current_stock * product.cost_price)}
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
          sx={{
            color: darkProTokens.textSecondary,
            borderTop: `1px solid ${darkProTokens.grayDark}`,
            '& .MuiTablePagination-selectIcon': { color: darkProTokens.textSecondary },
            '& .MuiTablePagination-actions button': { color: darkProTokens.textSecondary }
          }}
        />
      </Paper>

      {/* ✅ MOVIMIENTOS RECIENTES CON DARK PRO SYSTEM */}
      <Paper sx={{ 
        p: 3,
        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
        border: `1px solid ${darkProTokens.grayDark}`,
        borderRadius: 3,
        color: darkProTokens.textPrimary
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            color: darkProTokens.textPrimary,
            fontWeight: 700
          }}>
            <HistoryIcon sx={{ color: darkProTokens.primary }} />
            Movimientos Recientes
          </Typography>
          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
            {stats.recentMovements} movimientos últimos 3 días • {stats.totalMovements} total
          </Typography>
        </Box>
        
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ 
                background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`
              }}>
                <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Fecha</TableCell>
                <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Producto</TableCell>
                <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Tipo</TableCell>
                <TableCell align="center" sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Cantidad</TableCell>
                <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Razón</TableCell>
                <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Usuario</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {movements
                .slice(movementsPage * movementsRowsPerPage, movementsPage * movementsRowsPerPage + movementsRowsPerPage)
                .map((movement) => {
                  const movementConfig = MOVEMENT_TYPES.find(mt => mt.value === movement.movement_type);
                  return (
                    <TableRow key={movement.id} sx={{
                      '&:hover': {
                        backgroundColor: `${darkProTokens.primary}05`
                      }
                    }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          {formatDate(movement.created_at || '')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box>
                            <Typography variant="body2" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>
                              {movement.products?.name || 'Producto eliminado'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                              {movement.products?.sku || 'Sin SKU'}
                            </Typography>
                          </Box>
                          {movement.products?.is_active === false && (
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
                        <Chip
                          label={movementConfig?.label || movement.movement_type}
                          size="small"
                          sx={{
                            backgroundColor: movementConfig?.color === 'success' ? `${darkProTokens.success}20` :
                                           movementConfig?.color === 'error' ? `${darkProTokens.error}20` :
                                           movementConfig?.color === 'warning' ? `${darkProTokens.warning}20` :
                                           movementConfig?.color === 'info' ? `${darkProTokens.info}20` :
                                           `${darkProTokens.grayMuted}20`,
                            color: movementConfig?.color === 'success' ? darkProTokens.success :
                                  movementConfig?.color === 'error' ? darkProTokens.error :
                                  movementConfig?.color === 'warning' ? darkProTokens.warning :
                                  movementConfig?.color === 'info' ? darkProTokens.info :
                                  darkProTokens.grayMuted,
                            border: `1px solid ${
                              movementConfig?.color === 'success' ? darkProTokens.success :
                              movementConfig?.color === 'error' ? darkProTokens.error :
                              movementConfig?.color === 'warning' ? darkProTokens.warning :
                              movementConfig?.color === 'info' ? darkProTokens.info :
                              darkProTokens.grayMuted
                            }40`
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography 
                          variant="body2" 
                          fontWeight="bold"
                          sx={{ 
                            color: movement.quantity >= 0 ? darkProTokens.success : darkProTokens.error
                          }}
                        >
                          {movement.quantity >= 0 ? '+' : ''}{formatQuantity(movement.quantity, movement.products?.unit || 'pieza')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: darkProTokens.textPrimary }}>
                          {movement.reason}
                        </Typography>
                        {movement.notes && (
                          <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                            {movement.notes}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
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
          sx={{
            color: darkProTokens.textSecondary,
            borderTop: `1px solid ${darkProTokens.grayDark}`,
            '& .MuiTablePagination-selectIcon': { color: darkProTokens.textSecondary },
            '& .MuiTablePagination-actions button': { color: darkProTokens.textSecondary }
          }}
        />
      </Paper>

      {/* ✅ MENÚ DE ACCIONES CON DARK PRO SYSTEM */}
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
        <MenuItem 
          onClick={() => {
            if (menuProduct) openAdjustmentDialog(menuProduct);
          }}
          disabled={menuProduct?.is_active === false}
        >
          <ListItemIcon>
            <EditIcon sx={{ 
              color: menuProduct?.is_active === false ? darkProTokens.textDisabled : darkProTokens.primary 
            }} />
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
            <HistoryIcon sx={{ color: darkProTokens.info }} />
          </ListItemIcon>
          <ListItemText>Ver Historial</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => {
          // TODO: Ver detalles del producto
          handleMenuClose();
        }}>
          <ListItemIcon>
            {menuProduct?.is_active === false ? 
              <VisibilityOffIcon sx={{ color: darkProTokens.warning }} /> : 
              <VisibilityIcon sx={{ color: darkProTokens.success }} />
            }
          </ListItemIcon>
          <ListItemText>Ver Detalles</ListItemText>
        </MenuItem>
      </Menu>

      {/* ✅ DIALOG DE AJUSTE DE STOCK CON DARK PRO SYSTEM */}
      <Dialog 
        open={adjustmentDialogOpen} 
        onClose={() => setAdjustmentDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `2px solid ${darkProTokens.primary}50`,
            borderRadius: 4,
            color: darkProTokens.textPrimary
          }
        }}
      >
        <DialogTitle sx={{
          background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
          color: darkProTokens.background,
          fontWeight: 700
        }}>
          Ajustar Stock - {selectedProduct?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid size={12}>
                <Alert 
                  severity="info" 
                  sx={{ 
                    mb: 2,
                    backgroundColor: `${darkProTokens.info}10`,
                    color: darkProTokens.textPrimary,
                    border: `1px solid ${darkProTokens.info}30`,
                    '& .MuiAlert-icon': { color: darkProTokens.info }
                  }}
                >
                  Stock actual: <strong>{selectedProduct?.current_stock} {selectedProduct?.unit}</strong>
                </Alert>
              </Grid>

              <Grid size={12}>
                <FormControl fullWidth>
                  <InputLabel sx={{ 
                    color: darkProTokens.textSecondary,
                    '&.Mui-focused': { color: darkProTokens.primary }
                  }}>
                    Tipo de Ajuste
                  </InputLabel>
                  <Select
                    value={adjustmentData.movement_type}
                    label="Tipo de Ajuste"
                    onChange={(e) => setAdjustmentData(prev => ({ 
                      ...prev, 
                      movement_type: e.target.value 
                    }))}
                    sx={{
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
                    }}
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
                    endAdornment: <InputAdornment position="end">{selectedProduct?.unit}</InputAdornment>,
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
                  InputLabelProps={{
                    sx: { 
                      color: darkProTokens.textSecondary,
                      '&.Mui-focused': { color: darkProTokens.primary }
                    }
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
                  InputProps={{
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
                                    InputLabelProps={{
                    sx: { 
                      color: darkProTokens.textSecondary,
                      '&.Mui-focused': { color: darkProTokens.primary }
                    }
                  }}
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
                  InputProps={{
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
                  InputLabelProps={{
                    sx: { 
                      color: darkProTokens.textSecondary,
                      '&.Mui-focused': { color: darkProTokens.primary }
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setAdjustmentDialogOpen(false)}
            sx={{ color: darkProTokens.textSecondary }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleStockAdjustment} 
            variant="contained"
            disabled={!adjustmentData.reason.trim() || adjustmentData.quantity === 0 || loading}
            startIcon={loading ? <CircularProgress size={20} sx={{ color: darkProTokens.background }} /> : <SaveIcon />}
            sx={{
              background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
              color: darkProTokens.background,
              fontWeight: 700,
              '&:hover': {
                background: `linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive})`
              }
            }}
          >
            {loading ? 'Procesando...' : 'Aplicar Ajuste'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 🎨 ESTILOS CSS DARK PRO PERSONALIZADOS */}
      <style jsx>{`
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${darkProTokens.surfaceLevel1};
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover});
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive});
        }
      `}</style>
    </Box>
  );
}
