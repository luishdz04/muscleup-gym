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
  ListItemText
} from '@mui/material';
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
  RestoreFromTrash as RestoreIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatPrice } from '@/utils/formatUtils';
import { showNotification } from '@/utils/notifications';
import ProductFormDialog from '@/components/catalogo/ProductFormDialog';
import { Product, InventoryStats } from '@/types';
import { corporateColors, getGradient } from '@/theme/colors';

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

export default function ProductosPage() {
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
  const getStockColor = (product: Product) => {
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
        border: product.is_active === false ? '1px dashed red' : 'none',
        background: product.is_active === false ? '#fafafa' : 'white',
        '&:hover': { 
          boxShadow: 6,
          transform: 'translateY(-2px)'
        },
        transition: 'all 0.3s ease'
      }}>
        <CardMedia
          component="div"
          sx={{
            height: 200,
            background: product.image_url
              ? `url(${product.image_url}) center/cover`
              : 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%)',
            backgroundSize: product.image_url ? 'cover' : '20px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999',
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
              fontWeight: 'bold'
            }}
          />

          {product.is_active === false && (
            <Chip
              label="INACTIVO"
              color="error"
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                fontWeight: 'bold'
              }}
            />
          )}
        </CardMedia>
        
        <CardContent sx={{ flexGrow: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
            <Typography variant="h6" component="h2" noWrap sx={{ flex: 1, mr: 1 }}>
              {product.name}
            </Typography>
            <IconButton 
              size="small"
              onClick={(e) => handleMenuOpen(e, product)}
            >
              <MoreVertIcon />
            </IconButton>
          </Box>
          
          <Typography variant="body2" color="text.secondary" gutterBottom noWrap>
            SKU: {product.sku || 'Sin SKU'}
          </Typography>
          
          {product.brand && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {product.brand}
            </Typography>
          )}
          
          <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
            <Chip 
              label={product.category} 
              size="small" 
              color="primary" 
              variant="outlined"
            />
            {product.suppliers && (
              <Chip 
                label={product.suppliers.company_name} 
                size="small" 
                variant="outlined"
              />
            )}
          </Box>
          
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Costo: {formatPrice(product.cost_price)}
              </Typography>
              <Typography variant="h6" color="primary" fontWeight="bold">
                {formatPrice(product.sale_price)}
              </Typography>
            </Box>
            <Box textAlign="right">
              <Typography variant="body2" color="text.secondary">
                Stock mín: {product.min_stock}
              </Typography>
              <Typography 
                variant="body2" 
                color={getStockColor(product)}
                fontWeight="bold"
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
              color="success"
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
              sx={{ color: corporateColors.primary.main }}
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
          🛍️ Gestión de Productos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedProduct(null);
            setFormDialogOpen(true);
          }}
          sx={{
            background: getGradient('primary'),
            color: corporateColors.text.onPrimary,
            fontWeight: 'bold',
            '&:hover': {
              background: getGradient('primaryDark'),
            }
          }}
        >
          Nuevo Producto
        </Button>
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
                    Total Productos Activos
                  </Typography>
                </Box>
                <InventoryIcon sx={{ fontSize: 40, opacity: 0.8 }} />
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
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ background: getGradient('success'), color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatPrice(stats.totalValue)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Valor Inventario
                  </Typography>
                </Box>
                <MoneyIcon sx={{ fontSize: 40, opacity: 0.8 }} />
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
              <InputLabel>Stock</InputLabel>
              <Select
                value={stockFilter}
                label="Stock"
                onChange={(e) => setStockFilter(e.target.value)}
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
              <InputLabel>Estado</InputLabel>
              <Select
                value={statusFilter}
                label="Estado"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="active">✅ Activos</MenuItem>
                <MenuItem value="inactive">❌ Inactivos</MenuItem>
                <MenuItem value="all">📋 Todos</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12, md: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ pt: 2 }}>
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
            >
              Limpiar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Grid de productos */}
      <AnimatePresence mode="wait">
        {loading ? (
          <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            minHeight="40vh"
            sx={{ color: corporateColors.text.primary }}
          >
            <Typography>Cargando productos...</Typography>
          </Box>
        ) : filteredProducts.length === 0 ? (
          <Paper sx={{ 
            p: 8, 
            textAlign: 'center',
            bgcolor: corporateColors.background.paper,
            color: corporateColors.text.onWhite
          }}>
            <InventoryIcon sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No se encontraron productos
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
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
                background: getGradient('primary'),
                color: corporateColors.text.onPrimary
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

      {/* Menú de acciones */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        {menuProduct?.is_active === false ? (
          <MenuItem onClick={() => {
            if (menuProduct) handleRestoreProduct(menuProduct);
            handleMenuClose();
          }}>
            <ListItemIcon>
              <RestoreIcon color="success" />
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
              <EditIcon />
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
            <VisibilityIcon />
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
            <InventoryIcon />
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
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon color="error" />
          </ListItemIcon>
          <ListItemText>
            {menuProduct?.is_active === false ? 'Eliminar Permanente' : 'Eliminar'}
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* Dialog de formulario */}
      <ProductFormDialog
        open={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        product={selectedProduct}
        onSave={() => {
          setFormDialogOpen(false);
          loadProducts();
        }}
      />

      {/* Dialog de confirmación de eliminación */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: corporateColors.background.paper,
            color: corporateColors.text.onWhite
          }
        }}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar el producto "{productToDelete?.name}"?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            {productToDelete?.is_active === false 
              ? 'Esta acción eliminará permanentemente el producto de la base de datos.'
              : 'Esta acción no se puede deshacer. El producto será eliminado o desactivado si tiene referencias.'
            }
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteProduct} 
            color="error" 
            variant="contained"
            sx={{
              background: getGradient('error')
            }}
          >
            {productToDelete?.is_active === false ? 'Eliminar Permanente' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* FAB para agregar producto */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: getGradient('primary'),
          color: corporateColors.text.onPrimary,
          '&:hover': {
            background: getGradient('primaryDark'),
          }
        }}
        onClick={() => {
          setSelectedProduct(null);
          setFormDialogOpen(true);
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}