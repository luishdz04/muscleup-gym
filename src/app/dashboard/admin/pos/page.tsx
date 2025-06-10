'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid as Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Avatar,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  Fab,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Search as SearchIcon,
  ShoppingCart as CartIcon,
  Person as PersonIcon,
  LocalOffer as CouponIcon,
  Clear as ClearIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon,
  Bookmark as BookmarkIcon,
  QrCodeScanner as ScannerIcon,
  Category as CategoryIcon,
  Refresh as RefreshIcon,
  Receipt as ReceiptIcon,
  Star as StarIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatPrice } from '@/utils/formatUtils';
import { showNotification } from '@/utils/notifications';
import { Product, Coupon, User, CartItem, SalesStats } from '@/types';
import { corporateColors, getGradient } from '@/theme/colors';

// Importar componentes del POS
import CustomerSelector from '@/components/pos/CustomerSelector';
import PaymentDialog from '@/components/pos/PaymentDialog';
import LayawayDialog from '@/components/pos/LayawayDialog';

interface Customer extends User {
  name: string;
  whatsapp?: string;
  membership_type?: string;
  points_balance?: number;
  total_purchases?: number;
}

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

export default function POSPage() {
  // Estados principales
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Estados de filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(true);

  // Estados de dialogs
  const [customerSelectorOpen, setCustomerSelectorOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [layawayDialogOpen, setLayawayDialogOpen] = useState(false);

  // Estados adicionales
  const [salesStats, setSalesStats] = useState<SalesStats>({
    dailySales: 0,
    dailyTransactions: 0,
    avgTicket: 0,
    topProducts: []
  });

  const supabase = createBrowserSupabaseClient();

  // Cargar productos activos con stock
  const loadProducts = useCallback(async () => {
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
        .eq('is_active', true)
        .gt('current_stock', 0)
        .order('name');
      if (error) throw error;
      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      showNotification('Error al cargar productos', 'error');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Cargar estadísticas de ventas diarias
  const loadSalesStats = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('sales')
        .select('total_amount, created_at')
        .gte('created_at', today + 'T00:00:00')
        .lte('created_at', today + 'T23:59:59')
        .eq('status', 'completed');
      if (error) throw error;
      const dailySales = data?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;
      const dailyTransactions = data?.length || 0;
      const avgTicket = dailyTransactions > 0 ? dailySales / dailyTransactions : 0;
      setSalesStats({
        dailySales,
        dailyTransactions,
        avgTicket,
        topProducts: []
      });
    } catch (error) {
      console.error('Error loading sales stats:', error);
    }
  }, [supabase]);

  // Filtrar productos
  useEffect(() => {
    let filtered = products;
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
    setFilteredProducts(filtered);
  }, [products, searchTerm, categoryFilter]);

  // Agregar producto al carrito
  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    if (product.current_stock < quantity) {
      showNotification('Stock insuficiente', 'error');
      return;
    }
    setCart(prev => {
      const existingItem = prev.find(item => item.product.id === product.id);
      if (existingItem) {
        if (existingItem.quantity + quantity > product.current_stock) {
          showNotification('Stock insuficiente', 'error');
          return prev;
        }
        return prev.map(item => {
          if (item.product.id === product.id) {
            const newQty = item.quantity + quantity;
            const total_price = item.unit_price * newQty;
            const tax_amount = item.product.is_taxable
              ? (total_price * (item.product.tax_rate || 16)) / 100
              : 0;
            return {
              ...item,
              quantity: newQty,
              total_price,
              tax_amount
            };
          }
          return item;
        });
      } else {
        const newItem: CartItem = {
          product,
          quantity,
          unit_price: product.sale_price,
          total_price: product.sale_price * quantity,
          discount_amount: 0,
          tax_amount: product.is_taxable
            ? (product.sale_price * quantity * (product.tax_rate || 16)) / 100
            : 0
        };
        return [...prev, newItem];
      }
    });
  }, []);

  // Actualizar cantidad en carrito
  const updateCartItemQuantity = useCallback((productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(prev => prev.filter(item => item.product.id !== productId));
      return;
    }
    setCart(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          if (newQuantity > item.product.current_stock) {
            showNotification('Stock insuficiente', 'error');
            return item;
          }
          const total_price = item.unit_price * newQuantity;
          const tax_amount = item.product.is_taxable
            ? (total_price * (item.product.tax_rate || 16)) / 100
            : 0;
          return {
            ...item,
            quantity: newQuantity,
            total_price,
            tax_amount
          };
        }
        return item;
      })
    );
  }, []);

  // Remover del carrito
  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  // Limpiar carrito
  const clearCart = useCallback(() => {
    setCart([]);
    setSelectedCustomer(null);
    setAppliedCoupon(null);
    setCouponCode('');
  }, []);

  // Calcular descuento de cupón
  const calculateCouponDiscount = useCallback((subtotal: number): number => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discount_type === 'percentage') {
      return (subtotal * appliedCoupon.discount_value) / 100;
    } else {
      return Math.min(appliedCoupon.discount_value, subtotal);
    }
  }, [appliedCoupon]);

  // Totales calculados con useMemo
  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);
    const taxAmount = cart.reduce((sum, item) => sum + item.tax_amount, 0);
    const discountAmount = cart.reduce((sum, item) => sum + item.discount_amount, 0);
    const couponDiscount = appliedCoupon ? calculateCouponDiscount(subtotal) : 0;
    const total = subtotal + taxAmount - discountAmount - couponDiscount;
    return {
      subtotal,
      taxAmount,
      discountAmount,
      couponDiscount,
      total: Math.max(total, 0)
    };
  }, [cart, appliedCoupon, calculateCouponDiscount]);

  // Aplicar cupón
  const applyCoupon = useCallback(async () => {
    if (!couponCode.trim()) return;
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.trim().toUpperCase())
        .eq('is_active', true)
        .single();
      if (error || !data) {
        showNotification('Cupón no válido', 'error');
        return;
      }
      const now = new Date();
      if (data.start_date && new Date(data.start_date) > now) {
        showNotification('Cupón aún no es válido', 'error');
        return;
      }
      if (data.end_date && new Date(data.end_date) < now) {
        showNotification('Cupón expirado', 'error');
        return;
      }
      if (data.max_uses && data.current_uses >= data.max_uses) {
        showNotification('Cupón agotado', 'error');
        return;
      }
      if (data.min_amount && totals.subtotal < data.min_amount) {
        showNotification(`Compra mínima de ${formatPrice(data.min_amount)}`, 'error');
        return;
      }
      setAppliedCoupon(data);
      showNotification('Cupón aplicado correctamente', 'success');
    } catch (error) {
      console.error('Error applying coupon:', error);
      showNotification('Error al aplicar cupón', 'error');
    }
  }, [couponCode, supabase, totals.subtotal]);

  // Remover cupón
  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponCode('');
  }, []);

  // Manejar éxito de venta
  const handleSaleSuccess = useCallback(() => {
    clearCart();
    loadProducts();
    loadSalesStats();
  }, [clearCart, loadProducts, loadSalesStats]);

  // Cargar datos iniciales
  useEffect(() => {
    loadProducts();
    loadSalesStats();
  }, [loadProducts, loadSalesStats]);

  // Cerrar LayawayDialog automáticamente si carrito vacío
  useEffect(() => {
    if (cart.length === 0 && layawayDialogOpen) {
      setLayawayDialogOpen(false);
    }
  }, [cart.length, layawayDialogOpen]);

  // ProductCard como componente anidado normal
  const ProductCard = ({ product }: { product: Product }) => {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Card
          sx={{
            height: '100%',
            cursor: 'pointer',
            '&:hover': {
              boxShadow: 6,
              borderColor: corporateColors.primary.main
            },
            transition: 'all 0.3s ease'
          }}
          onClick={() => {
            if (typeof addToCart === 'function') {
              addToCart(product);
            } else {
              console.error('addToCart no es función:', addToCart);
            }
          }}
        >
          <Box
            sx={{
              height: 120,
              background: product.image_url
                ? `url(${product.image_url}) center/cover`
                : getGradient('primary'),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              position: 'relative'
            }}
          >
            {!product.image_url && (
              <Typography variant="h4" fontWeight="bold">
                {product.name.charAt(0)}
              </Typography>
            )}

            <Chip
              label={`${product.current_stock} ${product.unit}`}
              size="small"
              color={product.current_stock <= product.min_stock ? 'warning' : 'success'}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                fontWeight: 'bold'
              }}
            />
          </Box>

          <CardContent sx={{ flexGrow: 1 }}>
            <Typography variant="h6" noWrap fontWeight="bold" gutterBottom>
              {product.name}
            </Typography>
            {product.brand && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {product.brand}
              </Typography>
            )}
            <Chip label={product.category} size="small" variant="outlined" sx={{ mb: 1 }} />
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
              <Typography variant="h6" color="primary" fontWeight="bold">
                {formatPrice(product.sale_price)}
              </Typography>
              {product.current_stock <= product.min_stock && (
                <Chip icon={<WarningIcon />} label="Stock Bajo" size="small" color="warning" />
              )}
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: corporateColors.background.default,
        color: corporateColors.text.primary,
        p: 2
      }}
    >
      <Grid container spacing={3}>
        {/* Panel izquierdo - Productos */}
        <Grid size={{ xs: 12, lg: 8 }}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography
              variant="h4"
              component="h1"
              fontWeight="bold"
              sx={{ color: corporateColors.text.primary }}
            >
              🛒 Punto de Venta
            </Typography>
            <Box>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadProducts}
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
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card sx={{ background: getGradient('success') }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h5" fontWeight="bold" color="white">
                        {formatPrice(salesStats.dailySales)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
                        Ventas del día
                      </Typography>
                    </Box>
                    <ReceiptIcon sx={{ fontSize: 40, color: 'white', opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card sx={{ background: getGradient('info') }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h5" fontWeight="bold" color="white">
                        {salesStats.dailyTransactions}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
                        Transacciones
                      </Typography>
                    </Box>
                    <CartIcon sx={{ fontSize: 40, color: 'white', opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card sx={{ background: getGradient('warning') }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h5" fontWeight="bold" color="white">
                        {formatPrice(salesStats.avgTicket)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
                        Ticket promedio
                      </Typography>
                    </Box>
                    <StarIcon sx={{ fontSize: 40, color: 'white', opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Filtros */}
          <Paper
            sx={{
              p: 2,
              mb: 3,
              bgcolor: corporateColors.background.paper,
              color: corporateColors.text.onWhite
            }}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setSearchTerm('')}>
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Categoría</InputLabel>
                  <Select
                    value={categoryFilter}
                    label="Categoría"
                    onChange={e => setCategoryFilter(e.target.value)}
                  >
                    <MenuItem value="">Todas las categorías</MenuItem>
                    {CATEGORIES.map(category => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ pt: 2 }}>
                  {filteredProducts.length} productos
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Grid de productos */}
          <Paper
            sx={{
              p: 2,
              bgcolor: corporateColors.background.paper,
              color: corporateColors.text.onWhite
            }}
          >
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <Typography>Cargando productos...</Typography>
              </Box>
            ) : filteredProducts.length === 0 ? (
              <Box textAlign="center" py={4}>
                <CategoryIcon sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No se encontraron productos
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {products.length === 0
                    ? 'No hay productos disponibles'
                    : 'Intenta ajustar los filtros de búsqueda'
                  }
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {filteredProducts.map(product => (
                  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={product.id}>
                    <ProductCard product={product} />
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>

        {/* Panel derecho - Carrito */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper
            sx={{
              p: 3,
              height: 'fit-content',
              bgcolor: corporateColors.background.paper,
              color: corporateColors.text.onWhite,
              position: 'sticky',
              top: 20
            }}
          >
            {/* Header del carrito */}
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <CartIcon color="primary" />
                Carrito ({cart.length})
              </Typography>
              {cart.length > 0 && (
                <IconButton onClick={clearCart} color="error">
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>

            {/* Cliente seleccionado */}
            <Box sx={{ mb: 3 }}>
              {selectedCustomer ? (
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: corporateColors.success.main + '20',
                    border: `1px solid ${corporateColors.success.main}`
                  }}
                >
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: corporateColors.success.main }}>
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {selectedCustomer.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {selectedCustomer.email || selectedCustomer.whatsapp}
                        </Typography>
                        {selectedCustomer.membership_type && (
                          <Chip
                            label={selectedCustomer.membership_type}
                            size="small"
                            color="primary"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => setSelectedCustomer(null)}
                      color="error"
                    >
                      <ClearIcon />
                    </IconButton>
                  </Box>
                </Paper>
              ) : (
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<PersonIcon />}
                  onClick={() => setCustomerSelectorOpen(true)}
                  sx={{
                    borderColor: corporateColors.primary.main,
                    color: corporateColors.primary.main,
                    '&:hover': {
                      bgcolor: corporateColors.primary.main + '20'
                    }
                  }}
                >
                  Seleccionar Cliente (Opcional)
                </Button>
              )}
            </Box>

            {/* Cupón */}
            <Box sx={{ mb: 3 }}>
              {appliedCoupon ? (
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: corporateColors.warning.main + '20',
                    border: `1px solid ${corporateColors.warning.main}`
                  }}
                >
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: corporateColors.warning.main }}>
                        <CouponIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {appliedCoupon.code}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          -{formatPrice(totals.couponDiscount)}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton size="small" onClick={removeCoupon} color="error">
                      <ClearIcon />
                    </IconButton>
                  </Box>
                </Paper>
              ) : (
                <Box display="flex" gap={1}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Código de cupón"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    onKeyPress={e => e.key === 'Enter' && applyCoupon()}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CouponIcon />
                        </InputAdornment>
                      )
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={applyCoupon}
                    disabled={!couponCode.trim()}
                    sx={{
                      background: getGradient('primary'),
                      color: corporateColors.text.onPrimary
                    }}
                  >
                    Aplicar
                  </Button>
                </Box>
              )}
            </Box>

            {/* Items del carrito */}
            <Box sx={{ mb: 3, maxHeight: 300, overflow: 'auto' }}>
              {cart.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <CartIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    El carrito está vacío
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Selecciona productos para agregar
                  </Typography>
                </Box>
              ) : (
                <List dense>
                  <AnimatePresence mode="wait">
                    {cart.map((item, index) => (
                      <motion.div
                        key={item.product.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <ListItem
                          sx={{
                            border: 1,
                            borderColor: 'grey.200',
                            borderRadius: 1,
                            mb: 1,
                            bgcolor: 'background.default',
                            position: 'relative',
                            minHeight: 70,
                            pr: 14 // Espacio para botones
                          }}
                        >
                          <ListItemText
                            primary={item.product.name}
                            secondary={`${formatPrice(item.unit_price)} x ${item.quantity} • Stock: ${item.product.current_stock} ${item.product.unit}`}
                            primaryTypographyProps={{
                              variant: 'subtitle2',
                              fontWeight: 'bold',
                              noWrap: true,
                              component: 'div'
                            }}
                            secondaryTypographyProps={{
                              variant: 'body2',
                              component: 'div',
                              sx: {
                                color: 'primary.main',
                                fontWeight: 'bold'
                              }
                            }}
                          />

                          {/* Controles de cantidad */}
                          <Box
                            sx={{
                              position: 'absolute',
                              right: 8,
                              top: 8,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5
                            }}
                          >
                            <IconButton
                              size="small"
                              onClick={() =>
                                updateCartItemQuantity(item.product.id, item.quantity - 1)
                              }
                              disabled={item.quantity <= 1}
                            >
                              <RemoveIcon />
                            </IconButton>
                            <Typography
                              variant="body2"
                              fontWeight="bold"
                              sx={{ minWidth: 20, textAlign: 'center' }}
                            >
                              {item.quantity}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() =>
                                updateCartItemQuantity(item.product.id, item.quantity + 1)
                              }
                              disabled={item.quantity >= item.product.current_stock}
                            >
                              <AddIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => removeFromCart(item.product.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>

                          {/* Precio total */}
                          <Box
                            sx={{
                              position: 'absolute',
                              right: 8,
                              bottom: 8
                            }}
                          >
                            <Typography variant="body2" fontWeight="bold" color="primary">
                              {formatPrice(item.total_price)}
                            </Typography>
                          </Box>
                        </ListItem>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </List>
              )}
            </Box>

            {/* Totales */}
            {cart.length > 0 && (
              <Box>
                <Divider sx={{ mb: 2 }} />
                <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography>Subtotal:</Typography>
                  <Typography>{formatPrice(totals.subtotal)}</Typography>
                </Box>
                {totals.taxAmount > 0 && (
                  <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography>IVA:</Typography>
                    <Typography>{formatPrice(totals.taxAmount)}</Typography>
                  </Box>
                )}
                {(totals.discountAmount + totals.couponDiscount) > 0 && (
                  <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography color="error">Descuentos:</Typography>
                    <Typography color="error">
                      -{formatPrice(totals.discountAmount + totals.couponDiscount)}
                    </Typography>
                  </Box>
                )}
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between" sx={{ mb: 3 }}>
                  <Typography variant="h6" fontWeight="bold">
                    TOTAL:
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    {formatPrice(totals.total)}
                  </Typography>
                </Box>

                {/* Botones de acción */}
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<BookmarkIcon />}
                      onClick={() => setLayawayDialogOpen(true)}
                      disabled={!selectedCustomer}
                      sx={{
                        borderColor: corporateColors.warning.main,
                        color: corporateColors.warning.main,
                        '&:hover': {
                          bgcolor: corporateColors.warning.main + '20'
                        }
                      }}
                    >
                      Apartar
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<PaymentIcon />}
                      onClick={() => setPaymentDialogOpen(true)}
                      sx={{
                        background: getGradient('success'),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    >
                      Pagar
                    </Button>
                  </Grid>
                </Grid>

                {!selectedCustomer && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      💡 Para crear apartados, primero selecciona un cliente
                    </Typography>
                  </Alert>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Dialogs */}
      <CustomerSelector
        open={customerSelectorOpen}
        onClose={() => setCustomerSelectorOpen(false)}
        onSelect={customer => {
          setSelectedCustomer(customer);
          setCustomerSelectorOpen(false);
        }}
      />

      <PaymentDialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        cart={cart}
        customer={selectedCustomer}
        coupon={appliedCoupon}
        totals={totals}
        onSuccess={handleSaleSuccess}
      />

      <LayawayDialog
        open={layawayDialogOpen}
        onClose={() => setLayawayDialogOpen(false)}
        cart={cart}
        customer={selectedCustomer}
        coupon={appliedCoupon}
        totals={totals}
        onSuccess={handleSaleSuccess}
      />

      {/* FAB para scanner */}
      <Fab
        color="primary"
        aria-label="scanner"
        sx={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          background: getGradient('primary'),
          color: corporateColors.text.onPrimary,
          '&:hover': {
            background: getGradient('primaryDark')
          }
        }}
        onClick={() => showNotification('Scanner en desarrollo', 'info')}
      >
        <ScannerIcon />
      </Fab>
    </Box>
  );
}
