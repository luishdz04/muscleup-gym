'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Fab,
  Badge,
  Avatar,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Snackbar
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Category as CategoryIcon,
  LocalOffer as LocalOfferIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  RestoreFromTrash as RestoreIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon
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

const CATEGORIES = [
  'Suplementos',
  'Bebidas',
  'Ropa Deportiva',
  'Accesorios',
  'Equipamiento',
  'Snacks',
  'Proteínas',
  'Vitaminas',
  'Equipos de Gimnasio',
  'Limpieza',
  'Otros'
];

interface Product {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  brand?: string;
  category: string;
  description?: string;
  cost_price: number;
  sale_price: number;
  current_stock: number;
  min_stock: number;
  max_stock?: number;
  unit: string;
  supplier_id?: string;
  image_url?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
  suppliers?: {
    company_name: string;
    contact_person: string;
  };
}

interface InventoryStats {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalValue: number;
  recentMovements: number;
  totalMovements: number;
}

export default function ProductosPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    totalProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalValue: 0,
    recentMovements: 0,
    totalMovements: 0
  });
  
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [loading, setLoading] = useState(true);
  
  // Estados de dialogs
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  
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

  // ✅ Calcular estadísticas
  const calculateStats = (productList: Product[]) => {
    const activeProducts = productList.filter(p => p.is_active !== false);
    const lowStockProducts = activeProducts.filter(p => p.current_stock <= p.min_stock && p.current_stock > 0);
    const outOfStockProducts = activeProducts.filter(p => p.current_stock === 0);
    const totalValue = activeProducts.reduce((sum, p) => sum + (p.current_stock * p.cost_price), 0);

    setStats({
      totalProducts: activeProducts.length,
      lowStockProducts: lowStockProducts.length,
      outOfStockProducts: outOfStockProducts.length,
      totalValue,
      recentMovements: 0,
      totalMovements: 0
    });
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
        (product.barcode && product.barcode.includes(searchTerm)) ||
        (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    if (stockFilter) {
      switch (stockFilter) {
        case 'low':
          filtered = filtered.filter(product => product.current_stock <= product.min_stock && product.current_stock > 0);
          break;
        case 'out':
          filtered = filtered.filter(product => product.current_stock === 0);
          break;
        case 'available':
          filtered = filtered.filter(product => product.current_stock > product.min_stock);
          break;
      }
    }

    if (supplierFilter) {
      filtered = filtered.filter(product => product.supplier_id === supplierFilter);
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, categoryFilter, stockFilter, supplierFilter, statusFilter]);

  // ✅ Eliminar producto
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete.id);

      if (error) throw error;

      showNotification('Producto eliminado permanentemente', 'success');
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      loadProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      
      if (error.code === '23503') {
        try {
          const { error: softError } = await supabase
            .from('products')
            .update({ 
              is_active: false,
              updated_at: new Date().toISOString()
            })
            .eq('id', productToDelete.id);

          if (softError) throw softError;
          
          showNotification('Producto desactivado (tiene referencias en ventas)', 'warning');
          setDeleteDialogOpen(false);
          setProductToDelete(null);
          loadProducts();
        } catch (softDeleteError) {
          showNotification('Error al eliminar producto', 'error');
        }
      } else {
        showNotification('Error al eliminar producto', 'error');
      }
    }
  };

  // ✅ Restaurar producto
  const handleRestoreProduct = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id);

      if (error) throw error;

      showNotification('Producto restaurado correctamente', 'success');
      loadProducts();
    } catch (error) {
      console.error('Error restoring product:', error);
      showNotification('Error al restaurar producto', 'error');
    }
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

  // Obtener color de stock
  const getStockColor = (product: Product): 'error' | 'warning' | 'success' => {
    if (product.current_stock === 0) return 'error';
    if (product.current_stock <= product.min_stock) return 'warning';
    return 'success';
  };

  // Obtener icono de stock
  const getStockIcon = (product: Product) => {
    if (product.current_stock === 0) return <WarningIcon />;
    if (product.current_stock <= product.min_stock) return <TrendingDownIcon />;
    return <CheckCircleIcon />;
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadProducts();
  }, []);

  const ProductCard = ({ product }: { product: Product }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{ 
        height: '100%',
        opacity: product.is_active === false ? 0.6 : 1,
        border: product.is_active === false ? `1px dashed ${darkProTokens.error}` : `1px solid ${darkProTokens.grayDark}`,
        background: product.is_active === false 
          ? `${darkProTokens.surfaceLevel2}80` 
          : `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
        color: darkProTokens.textPrimary,
        '&:hover': { 
          boxShadow: `0 8px 32px ${darkProTokens.primary}20`,
          transform: 'translateY(-4px)',
          borderColor: darkProTokens.primary
        },
        transition: 'all 0.3s ease',
        borderRadius: 3
      }}>
        <CardMedia
          component="div"
          sx={{
            height: 200,
            background: product.image_url
              ? `url(${product.image_url}) center/cover`
              : `linear-gradient(45deg, ${darkProTokens.grayDark} 25%, transparent 25%)`,
            backgroundSize: product.image_url ? 'cover' : '20px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: darkProTokens.textSecondary,
            position: 'relative'
          }}
        >
          {!product.image_url && <InventoryIcon sx={{ fontSize: 60 }} />}
          
          <Chip
            icon={getStockIcon(product)}
            label={`${product.current_stock} ${product.unit}`}
            color={getStockColor(product)}
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              fontWeight: 'bold',
              color: darkProTokens.textPrimary
            }}
          />

          {product.is_active === false && (
            <Chip
              label="INACTIVO"
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                fontWeight: 'bold',
                backgroundColor: darkProTokens.error,
                color: darkProTokens.textPrimary
              }}
            />
          )}
        </CardMedia>
        
        <CardContent sx={{ flexGrow: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
            <Typography variant="h6" component="h2" noWrap sx={{ 
              flex: 1, 
              mr: 1,
              color: darkProTokens.textPrimary,
              fontWeight: 700
            }}>
              {product.name}
            </Typography>
            <IconButton 
              size="small"
              onClick={(e) => handleMenuOpen(e, product)}
              sx={{ color: darkProTokens.textSecondary }}
            >
              <MoreVertIcon />
            </IconButton>
          </Box>
          
          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }} gutterBottom noWrap>
            SKU: {product.sku || 'Sin SKU'}
          </Typography>
          
          {product.brand && (
            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }} gutterBottom>
              {product.brand}
            </Typography>
          )}
          
          <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
            <Chip 
              label={product.category} 
              size="small" 
              sx={{
                backgroundColor: `${darkProTokens.primary}20`,
                color: darkProTokens.primary,
                fontWeight: 600
              }}
            />
            {product.suppliers && (
              <Chip 
                label={product.suppliers.company_name} 
                size="small" 
                sx={{
                  backgroundColor: `${darkProTokens.info}20`,
                  color: darkProTokens.info,
                  fontWeight: 600
                }}
              />
            )}
          </Box>
          
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                Costo: {formatPrice(product.cost_price)}
              </Typography>
              <Typography variant="h6" sx={{ 
                color: darkProTokens.primary, 
                fontWeight: 'bold' 
              }}>
                {formatPrice(product.sale_price)}
              </Typography>
            </Box>
            <Box textAlign="right">
              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                Stock mín: {product.min_stock}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: getStockColor(product) === 'error' ? darkProTokens.error :
                         getStockColor(product) === 'warning' ? darkProTokens.warning :
                         darkProTokens.success,
                  fontWeight: 'bold'
                }}
              >
                Actual: {product.current_stock}
              </Typography>
            </Box>
          </Box>
        </CardContent>
        
        <CardActions sx={{ px: 2, pb: 2 }}>
          {product.is_active === false ? (
            <Button 
              size="small" 
              startIcon={<RestoreIcon />}
              onClick={() => handleRestoreProduct(product)}
              sx={{ 
                color: darkProTokens.success,
                fontWeight: 600
              }}
            >
              Restaurar
            </Button>
          ) : (
            <Button 
              size="small" 
              startIcon={<EditIcon />}
              onClick={() => {
                setSelectedProduct(product);
                setFormDialogOpen(true);
              }}
              sx={{ 
                color: darkProTokens.primary,
                fontWeight: 600
              }}
            >
              Editar
            </Button>
          )}
          
          <Button 
            size="small" 
            startIcon={<VisibilityIcon />}
            onClick={() => {
              // TODO: Ver detalles
            }}
            sx={{ 
              color: darkProTokens.info,
              fontWeight: 600
            }}
          >
            Ver
          </Button>
        </CardActions>
      </Card>
    </motion.div>
  );

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
      color: darkProTokens.textPrimary,
      p: 3
    }}>
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
              Gestión de Productos
            </Typography>
            <Typography variant="h6" sx={{ 
              color: darkProTokens.textSecondary,
              fontWeight: 300
            }}>
              Inventario y Catálogo | Control Total de Stock
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
              startIcon={<RefreshIcon />}
              onClick={loadProducts}
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
              variant="outlined"
            >
              Actualizar
            </Button>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedProduct(null);
                setFormDialogOpen(true);
              }}
              sx={{
                background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
                color: darkProTokens.background,
                fontWeight: 700,
                px: 4,
                py: 1.5,
                borderRadius: 3,
                '&:hover': {
                  background: `linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive})`,
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Nuevo Producto
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
                      Total Productos Activos
                    </Typography>
                  </Box>
                  <InventoryIcon sx={{ fontSize: 40, color: darkProTokens.info, opacity: 0.8 }} />
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
                      Valor Inventario
                    </Typography>
                  </Box>
                  <MoneyIcon sx={{ fontSize: 40, color: darkProTokens.success, opacity: 0.8 }} />
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
        <Grid container spacing={2}>
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
              InputLabelProps={{
                sx: { 
                  color: darkProTokens.textSecondary,
                  '&.Mui-focused': { color: darkProTokens.primary }
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
                {CATEGORIES.map((category) => (
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
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="available">Disponible</MenuItem>
                <MenuItem value="low">Stock Bajo</MenuItem>
                <MenuItem value="out">Sin Stock</MenuItem>
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
                <MenuItem value="active">✅ Activos</MenuItem>
                <MenuItem value="inactive">❌ Inactivos</MenuItem>
                <MenuItem value="all">📋 Todos</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12, md: 1 }}>
            <Typography variant="body2" sx={{ 
              color: darkProTokens.textSecondary, 
              pt: 2,
              textAlign: 'center'
            }}>
              {filteredProducts.length} de {products.length}
            </Typography>
          </Grid>
          
          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('');
                setStockFilter('');
                setSupplierFilter('');
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
      </Paper>

      {/* ✅ GRID DE PRODUCTOS CON DARK PRO SYSTEM */}
      <AnimatePresence mode="wait">
        {loading ? (
          <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            minHeight="40vh"
            sx={{ color: darkProTokens.textPrimary }}
          >
            <CircularProgress sx={{ color: darkProTokens.primary }} size={60} thickness={4} />
          </Box>
        ) : filteredProducts.length === 0 ? (
          <Paper sx={{ 
            p: 8, 
            textAlign: 'center',
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `1px solid ${darkProTokens.grayDark}`,
            borderRadius: 3,
            color: darkProTokens.textPrimary
          }}>
            <InventoryIcon sx={{ fontSize: 80, color: darkProTokens.textSecondary, mb: 2 }} />
            <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }} gutterBottom>
              No se encontraron productos
            </Typography>
            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 3 }}>
              {products.length === 0 
                ? 'Comienza agregando tu primer producto al inventario'
                : 'Intenta ajustar los filtros de búsqueda'
              }
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedProduct(null);
                setFormDialogOpen(true);
              }}
              sx={{
                background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
                color: darkProTokens.background,
                fontWeight: 700
              }}
            >
              {products.length === 0 ? 'Agregar Primer Producto' : 'Agregar Producto'}
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {filteredProducts.map((product) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={product.id}>
                <ProductCard product={product} />
              </Grid>
            ))}
          </Grid>
        )}
      </AnimatePresence>

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
        {menuProduct?.is_active === false ? (
          <MenuItem onClick={() => {
            if (menuProduct) handleRestoreProduct(menuProduct);
            handleMenuClose();
          }}>
            <ListItemIcon>
              <RestoreIcon sx={{ color: darkProTokens.success }} />
            </ListItemIcon>
            <ListItemText>Restaurar Producto</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={() => {
            if (menuProduct) {
              setSelectedProduct(menuProduct);
              setFormDialogOpen(true);
            }
            handleMenuClose();
          }}>
            <ListItemIcon>
              <EditIcon sx={{ color: darkProTokens.primary }} />
            </ListItemIcon>
            <ListItemText>Editar</ListItemText>
          </MenuItem>
        )}
        
        <MenuItem onClick={() => {
          if (menuProduct) {
            // TODO: Ver detalles
          }
          handleMenuClose();
        }}>
          <ListItemIcon>
            <VisibilityIcon sx={{ color: darkProTokens.info }} />
          </ListItemIcon>
          <ListItemText>Ver Detalles</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => {
          if (menuProduct) {
            // TODO: Gestionar stock
          }
          handleMenuClose();
        }}>
          <ListItemIcon>
            <InventoryIcon sx={{ color: darkProTokens.warning }} />
          </ListItemIcon>
          <ListItemText>Gestionar Stock</ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => {
            if (menuProduct) {
              setProductToDelete(menuProduct);
              setDeleteDialogOpen(true);
            }
            handleMenuClose();
          }}
          sx={{ color: darkProTokens.error }}
        >
          <ListItemIcon>
            <DeleteIcon sx={{ color: darkProTokens.error }} />
          </ListItemIcon>
          <ListItemText>
            {menuProduct?.is_active === false ? 'Eliminar Permanente' : 'Eliminar'}
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* ✅ DIALOG DE CONFIRMACIÓN CON DARK PRO SYSTEM */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `2px solid ${darkProTokens.error}50`,
            borderRadius: 4,
            color: darkProTokens.textPrimary
          }
        }}
      >
        <DialogTitle sx={{ color: darkProTokens.error, fontWeight: 700 }}>
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: darkProTokens.textPrimary, mb: 2 }}>
            ¿Estás seguro de que deseas eliminar el producto "{productToDelete?.name}"?
          </Typography>
          <Alert 
            severity="warning" 
            sx={{
              backgroundColor: `${darkProTokens.warning}10`,
              color: darkProTokens.textPrimary,
              border: `1px solid ${darkProTokens.warning}30`,
              '& .MuiAlert-icon': { color: darkProTokens.warning }
            }}
          >
            {productToDelete?.is_active === false 
              ? 'Esta acción eliminará permanentemente el producto de la base de datos.'
              : 'Esta acción no se puede deshacer. El producto será eliminado o desactivado si tiene referencias.'
            }
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ color: darkProTokens.textSecondary }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteProduct} 
            variant="contained"
            sx={{
              background: `linear-gradient(135deg, ${darkProTokens.error}, ${darkProTokens.errorHover})`,
              color: darkProTokens.textPrimary,
              fontWeight: 700
            }}
          >
            {productToDelete?.is_active === false ? 'Eliminar Permanente' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ FAB CON DARK PRO SYSTEM */}
      <Fab
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
          color: darkProTokens.background,
          '&:hover': {
            background: `linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive})`,
            transform: 'scale(1.1)'
          }
        }}
        onClick={() => {
          setSelectedProduct(null);
          setFormDialogOpen(true);
        }}
      >
        <AddIcon />
      </Fab>

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
