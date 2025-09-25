// src/app/(protected)/dashboard/admin/pos/page.tsx

'use client';

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
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
  MenuItem,
  CircularProgress
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
  Warning as WarningIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

// ✅ IMPORTS ENTERPRISE OBLIGATORIOS v7.0
import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { useUserTracking } from '@/hooks/useUserTracking';
import { 
  getCurrentTimestamp,
  formatTimestampForDisplay,
  formatDateForDisplay,
  getTodayInMexico
} from '@/utils/dateUtils';
import { notify } from '@/utils/notifications';
import { useNotifications } from '@/hooks/useNotifications';
import { useEntityCRUD } from '@/hooks/useEntityCRUD';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

// ✅ IMPORTS TIPOS CENTRALIZADOS v7.0
import { Product, CartItem, Customer, Coupon, Totals, SalesStats } from '@/types/pos';

// COMPONENTES ESPECÍFICOS DEL PROYECTO  
import CustomerSelector from '@/components/pos/CustomerSelector';
import PaymentDialog from '@/components/pos/PaymentDialog';
import LayawayDialog from '@/components/pos/LayawayDialog-DEBUG';
import ErrorBoundary from '@/components/ErrorBoundary';

// ✅ CONSTANTES ENTERPRISE v7.0
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
] as const;

// ✅ COMPONENTE PRODUCTCARD MEMOIZADO v7.0
const ProductCard = memo<{ product: Product; onAddToCart: (product: Product) => void }>(
  ({ product, onAddToCart }) => {
    const formatPrice = useCallback((price: number) => {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
      }).format(price);
    }, []);

    const handleClick = useCallback(() => {
      onAddToCart(product);
    }, [product, onAddToCart]);

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
            background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
            border: `1px solid ${colorTokens.border}`,
            color: colorTokens.textPrimary,
            '&:hover': {
              boxShadow: `0 8px 32px ${colorTokens.glow}`,
              borderColor: colorTokens.brand,
              transform: 'translateY(-2px)'
            },
            transition: 'all 0.3s ease',
            borderRadius: 3
          }}
          onClick={handleClick}
        >
          <Box
            sx={{
              height: 120,
              background: product.image_url
                ? `url(${product.image_url}) center/cover`
                : `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colorTokens.textOnBrand,
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
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                fontWeight: 'bold',
                backgroundColor: product.current_stock <= product.min_stock 
                  ? colorTokens.warning 
                  : colorTokens.success,
                color: colorTokens.textOnBrand
              }}
            />
          </Box>

          <CardContent sx={{ flexGrow: 1 }}>
            <Typography 
              variant="h6" 
              noWrap 
              fontWeight="bold" 
              gutterBottom 
              sx={{ color: colorTokens.textPrimary }}
            >
              {product.name}
            </Typography>
            {product.brand && (
              <Typography variant="body2" sx={{ color: colorTokens.textSecondary }} gutterBottom>
                {product.brand}
              </Typography>
            )}
            <Chip 
              label={product.category} 
              size="small" 
              sx={{ 
                mb: 1,
                backgroundColor: `${colorTokens.info}20`,
                color: colorTokens.info,
                border: `1px solid ${colorTokens.info}40`
              }} 
            />
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ color: colorTokens.brand }} fontWeight="bold">
                {formatPrice(product.sale_price)}
              </Typography>
              {product.current_stock <= product.min_stock && (
                <Chip 
                  icon={<WarningIcon />} 
                  label="Stock Bajo" 
                  size="small" 
                  sx={{
                    backgroundColor: `${colorTokens.warning}20`,
                    color: colorTokens.warning,
                    border: `1px solid ${colorTokens.warning}40`
                  }}
                />
              )}
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
);

ProductCard.displayName = 'ProductCard';

export default function POSPage() {
  // ✅ ORDEN ESTABLE DE HOOKS - SIEMPRE AL INICIO v7.0
  const router = useRouter();
  const hydrated = useHydrated();
  const { addAuditFieldsFor, getCurrentUser } = useUserTracking();
  const { toast, alert } = useNotifications();
  const supabase = createBrowserSupabaseClient();

  // ✅ ESTADOS PRINCIPALES ESTABLES v7.0 - TODOS AL INICIO
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Estados de filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [couponCode, setCouponCode] = useState('');

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

  // ✅ CALLBACKS ESTABLES PARA CRUD - DEFINIR ANTES DE USEENTITYCRUD v7.0
  const handleProductError = useCallback((error: string) => {
    toast.error(`Error en productos: ${error}`);
  }, [toast]);

  const handleProductSuccess = useCallback((message: string) => {
    toast.success(message);
  }, [toast]);

  const handleCouponError = useCallback((error: string) => {
    toast.error(`Error en cupones: ${error}`);
  }, [toast]);

  // ✅ CRUD ENTERPRISE v7.0 - DESPUÉS DE CALLBACKS ESTABLES
  const {
    data: products,
    loading: productsLoading,
    createItem: createProduct,
    updateItem: updateProduct,
    refreshData: refreshProducts,
    stats: productStats
  } = useEntityCRUD<Product>({
    tableName: 'products', // Detecta snake_case automáticamente
    selectQuery: `
      *,
      suppliers!supplier_id (
        id,
        company_name,
        contact_person
      )
    `,
    onError: handleProductError,
    onSuccess: handleProductSuccess
  });

  const {
    data: coupons,
    loading: couponsLoading
  } = useEntityCRUD<Coupon>({
    tableName: 'coupons', // Detecta created_only automáticamente  
    selectQuery: '*',
    onError: handleCouponError
  });

  // ✅ FUNCIONES ESTABLES MEMOIZADAS v7.0
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  }, []);

  // Cargar estadísticas de ventas con dateUtils v7.0
  const loadSalesStats = useCallback(async () => {
    try {
      const today = getTodayInMexico();
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
      toast.error('Error al cargar estadísticas de ventas');
    }
  }, [supabase, toast]);

  // ✅ AGREGAR AL CARRITO OPTIMIZADO v7.0
  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    if (product.current_stock < quantity) {
      toast.error('Stock insuficiente');
      return;
    }
    
    setCart(prev => {
      const existingItem = prev.find(item => item.product.id === product.id);
      
      if (existingItem) {
        if (existingItem.quantity + quantity > product.current_stock) {
          toast.error('Stock insuficiente');
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
    
    toast.success(`${product.name} agregado al carrito`);
  }, [toast]);

  // ✅ ACTUALIZAR CANTIDAD EN CARRITO v7.0
  const updateCartItemQuantity = useCallback((productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(prev => prev.filter(item => item.product.id !== productId));
      return;
    }
    
    setCart(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          if (newQuantity > item.product.current_stock) {
            toast.error('Stock insuficiente');
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
  }, [toast]);

  // ✅ REMOVER DEL CARRITO v7.0
  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  // ✅ LIMPIAR CARRITO v7.0
  const clearCart = useCallback(() => {
    setCart([]);
    setSelectedCustomer(null);
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('Carrito limpiado');
  }, [toast]);

  // ✅ CALCULAR DESCUENTO DE CUPÓN ESTABLE v7.0
  const calculateCouponDiscount = useCallback((subtotal: number): number => {
    if (!appliedCoupon) return 0;
    
    if (appliedCoupon.discount_type === 'percentage') {
      return (subtotal * appliedCoupon.discount_value) / 100;
    } else {
      return Math.min(appliedCoupon.discount_value, subtotal);
    }
  }, [appliedCoupon]);

  // ✅ TOTALES ESTABLES OPTIMIZADOS v7.0  
  const totals = useMemo<Totals>(() => {
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

  // ✅ APLICAR CUPÓN CON VALIDACIÓN ENTERPRISE v7.0 - FIXED CURRENT_USES
  const applyCoupon = useCallback(async () => {
    if (!couponCode.trim()) {
      toast.error('Ingresa un código de cupón');
      return;
    }
    
    try {
      const coupon = coupons.find(c => 
        c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.is_active
      );
      
      if (!coupon) {
        toast.error('Cupón no válido');
        return;
      }
      
      const now = getCurrentTimestamp();
      const currentDate = new Date(now);
      
      if (coupon.start_date && new Date(coupon.start_date) > currentDate) {
        toast.error('Cupón aún no es válido');
        return;
      }
      
      if (coupon.end_date && new Date(coupon.end_date) < currentDate) {
        toast.error('Cupón expirado');
        return;
      }
      
      // ✅ FIXED: Validación safe de current_uses
      if (coupon.max_uses && (coupon.current_uses || 0) >= coupon.max_uses) {
        toast.error('Cupón agotado');
        return;
      }
      
      if (coupon.min_amount && totals.subtotal < coupon.min_amount) {
        toast.error(`Compra mínima de ${formatPrice(coupon.min_amount)}`);
        return;
      }
      
      setAppliedCoupon(coupon);
      toast.success(`Cupón aplicado: -${formatPrice(calculateCouponDiscount(totals.subtotal))}`);
      
    } catch (error) {
      console.error('Error applying coupon:', error);
      toast.error('Error al aplicar cupón');
    }
  }, [couponCode, coupons, totals.subtotal, toast, formatPrice, calculateCouponDiscount]);

  // ✅ REMOVER CUPÓN v7.0
  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('Cupón removido');
  }, [toast]);

  // ✅ MANEJAR ÉXITO DE VENTA v7.0
  const handleSaleSuccess = useCallback(() => {
    clearCart();
    refreshProducts();
    loadSalesStats();
    toast.success('Venta completada exitosamente');
  }, [clearCart, refreshProducts, loadSalesStats, toast]);

  // ✅ OBJETOS ESTABLES PARA DIALOGS v7.0
  const stableCart = useMemo(() => cart, [cart]);
  const stableCustomer = useMemo(() => selectedCustomer, [selectedCustomer]);
  const stableCoupon = useMemo(() => appliedCoupon, [appliedCoupon]);
  const stableTotals = useMemo(() => totals, [totals]);

  // ✅ FILTRADO DE PRODUCTOS OPTIMIZADO v7.0
  useEffect(() => {
    let filtered = products.filter(product => 
      product.is_active && product.current_stock > 0
    );
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        (product.sku && product.sku.toLowerCase().includes(searchLower)) ||
        (product.barcode && product.barcode.includes(searchTerm)) ||
        (product.brand && product.brand.toLowerCase().includes(searchLower))
      );
    }
    
    if (categoryFilter) {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }
    
    setFilteredProducts(filtered);
  }, [products, searchTerm, categoryFilter]);

  // ✅ CARGAR DATOS INICIALES v7.0
  useEffect(() => {
    if (hydrated) {
      loadSalesStats();
    }
  }, [hydrated, loadSalesStats]);

  // ✅ CERRAR LAYAWAY DIALOG CUANDO CARRITO VACÍO
  useEffect(() => {
    if (cart.length === 0 && layawayDialogOpen) {
      setLayawayDialogOpen(false);
    }
  }, [cart.length, layawayDialogOpen]);

  // ✅ SSR SAFETY MUSCLEUP - DESPUÉS DE TODOS LOS HOOKS v7.0
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
          Cargando MuscleUp Gym POS...
        </Typography>
        <Typography variant="body2" sx={{ color: colorTokens.textMuted }}>
          Inicializando punto de venta enterprise
        </Typography>
      </Box>
    );
  }

  return (
    <ErrorBoundary>
      <Box
        sx={{
          minHeight: '100vh',
          background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.surfaceLevel1})`,
          color: colorTokens.textPrimary,
          p: 2
        }}
      >
        <Grid container spacing={3}>
          {/* ✅ PANEL IZQUIERDO - PRODUCTOS v7.0 */}
          <Grid size={{ xs: 12, lg: 8 }}>
            {/* Header con branding MuscleUp */}
            <Paper sx={{
              p: 4,
              mb: 4,
              background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
              border: `2px solid ${colorTokens.glow}`,
              borderRadius: 4,
              boxShadow: `0 8px 32px ${colorTokens.shadow}`
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
                    <CartIcon sx={{ fontSize: 50 }} />
                    POS MUP
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: colorTokens.textSecondary,
                    fontWeight: 300
                  }}>
                    Sistema de ventas MUP | Ventas | Apartados
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => router.push('/dashboard/admin')}
                    sx={{ 
                      color: colorTokens.brand,
                      borderColor: colorTokens.glow,
                      px: 3,
                      py: 1.5,
                      borderRadius: 3,
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: colorTokens.brand,
                        backgroundColor: colorTokens.hoverOverlay,
                        transform: 'translateY(-2px)'
                      }
                    }}
                    variant="outlined"
                  >
                    Dashboard
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={refreshProducts}
                    disabled={productsLoading}
                    sx={{
                      color: colorTokens.textSecondary,
                      borderColor: colorTokens.border,
                      px: 3,
                      py: 1.5,
                      borderRadius: 3,
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: colorTokens.brand,
                        backgroundColor: colorTokens.hoverOverlay,
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    Actualizar
                  </Button>
                </Box>
              </Box>

              {/* ✅ ESTADÍSTICAS CON COLORTOKENS v7.0 */}
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Card sx={{ 
                    background: `${colorTokens.success}20`, 
                    border: `1px solid ${colorTokens.success}60`,
                    borderRadius: 3,
                    color: colorTokens.textPrimary
                  }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="h5" fontWeight="bold" sx={{ color: colorTokens.success }}>
                            {formatPrice(salesStats.dailySales)}
                          </Typography>
                          <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                            Ventas del día
                          </Typography>
                        </Box>
                        <ReceiptIcon sx={{ fontSize: 40, color: colorTokens.success, opacity: 0.8 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Card sx={{ 
                    background: `${colorTokens.info}20`, 
                    border: `1px solid ${colorTokens.info}60`,
                    borderRadius: 3,
                    color: colorTokens.textPrimary
                  }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="h5" fontWeight="bold" sx={{ color: colorTokens.info }}>
                            {salesStats.dailyTransactions}
                          </Typography>
                          <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                            Transacciones
                          </Typography>
                        </Box>
                        <CartIcon sx={{ fontSize: 40, color: colorTokens.info, opacity: 0.8 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Card sx={{ 
                    background: `${colorTokens.warning}20`, 
                    border: `1px solid ${colorTokens.warning}60`,
                    borderRadius: 3,
                    color: colorTokens.textPrimary
                  }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="h5" fontWeight="bold" sx={{ color: colorTokens.warning }}>
                            {formatPrice(salesStats.avgTicket)}
                          </Typography>
                          <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                            Ticket promedio
                          </Typography>
                        </Box>
                        <StarIcon sx={{ fontSize: 40, color: colorTokens.warning, opacity: 0.8 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>

            {/* ✅ FILTROS CON COLORTOKENS v7.0 */}
            <Paper
              sx={{
                p: 3,
                mb: 3,
                background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
                border: `1px solid ${colorTokens.border}`,
                borderRadius: 3,
                color: colorTokens.textPrimary
              }}
            >
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: colorTokens.brand }} />
                        </InputAdornment>
                      ),
                      endAdornment: searchTerm && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setSearchTerm('')}>
                            <ClearIcon sx={{ color: colorTokens.textSecondary }} />
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: {
                        color: colorTokens.textPrimary,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: colorTokens.border
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
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ 
                      color: colorTokens.textSecondary,
                      '&.Mui-focused': { color: colorTokens.brand }
                    }}>
                      Categoría
                    </InputLabel>
                    <Select
                      value={categoryFilter}
                      label="Categoría"
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      sx={{
                        color: colorTokens.textPrimary,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: colorTokens.border
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: colorTokens.brand
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: colorTokens.brand
                        }
                      }}
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
                  <Typography variant="body2" sx={{ 
                    color: colorTokens.textSecondary, 
                    pt: 2,
                    textAlign: 'center'
                  }}>
                    {filteredProducts.length} productos
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* ✅ GRID DE PRODUCTOS v7.0 */}
            <Paper
              sx={{
                p: 3,
                background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
                border: `1px solid ${colorTokens.border}`,
                borderRadius: 3,
                color: colorTokens.textPrimary
              }}
            >
              {productsLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                  <CircularProgress sx={{ color: colorTokens.brand }} size={60} thickness={4} />
                </Box>
              ) : filteredProducts.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <CategoryIcon sx={{ fontSize: 80, color: colorTokens.textSecondary, mb: 2 }} />
                  <Typography variant="h6" sx={{ color: colorTokens.textSecondary }} gutterBottom>
                    No se encontraron productos
                  </Typography>
                  <Typography variant="body2" sx={{ color: colorTokens.textMuted }}>
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
                      <ProductCard product={product} onAddToCart={addToCart} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          </Grid>

          {/* ✅ PANEL DERECHO - CARRITO v7.0 */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Paper
              sx={{
                p: 3,
                height: 'fit-content',
                background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
                border: `1px solid ${colorTokens.border}`,
                borderRadius: 3,
                color: colorTokens.textPrimary,
                position: 'sticky',
                top: 20
              }}
            >
              {/* Header del carrito */}
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    color: colorTokens.textPrimary
                  }}
                >
                  <CartIcon sx={{ color: colorTokens.brand }} />
                  Carrito ({cart.length})
                </Typography>
                {cart.length > 0 && (
                  <IconButton onClick={clearCart} sx={{ color: colorTokens.danger }}>
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
                      background: `${colorTokens.success}20`,
                      border: `1px solid ${colorTokens.success}60`
                    }}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: colorTokens.success }}>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                            {selectedCustomer.firstName} {selectedCustomer.lastName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                            {selectedCustomer.email || selectedCustomer.whatsapp}
                          </Typography>
                          {selectedCustomer.membership_type && (
                            <Chip
                              label={selectedCustomer.membership_type}
                              size="small"
                              sx={{ 
                                ml: 1,
                                backgroundColor: `${colorTokens.brand}20`,
                                color: colorTokens.brand
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => setSelectedCustomer(null)}
                        sx={{ color: colorTokens.danger }}
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
                      borderColor: colorTokens.brand,
                      color: colorTokens.brand,
                      '&:hover': {
                        bgcolor: colorTokens.hoverOverlay,
                        borderColor: colorTokens.brand
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
                      background: `${colorTokens.warning}20`,
                      border: `1px solid ${colorTokens.warning}60`
                    }}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: colorTokens.warning }}>
                          <CouponIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                            {appliedCoupon.code}
                          </Typography>
                          <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                            -{formatPrice(totals.couponDiscount)}
                          </Typography>
                        </Box>
                      </Box>
                      <IconButton size="small" onClick={removeCoupon} sx={{ color: colorTokens.danger }}>
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
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyPress={(e) => e.key === 'Enter' && applyCoupon()}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CouponIcon sx={{ color: colorTokens.brand }} />
                          </InputAdornment>
                        ),
                        sx: {
                          color: colorTokens.textPrimary,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: colorTokens.border
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
                    <Button
                      variant="contained"
                      onClick={applyCoupon}
                      disabled={!couponCode.trim()}
                      sx={{
                        background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
                        color: colorTokens.textOnBrand,
                        fontWeight: 700
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
                    <CartIcon sx={{ fontSize: 60, color: colorTokens.textSecondary, mb: 2 }} />
                    <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                      El carrito está vacío
                    </Typography>
                    <Typography variant="caption" sx={{ color: colorTokens.textMuted }}>
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
                              border: `1px solid ${colorTokens.border}`,
                              borderRadius: 1,
                              mb: 1,
                              background: `linear-gradient(135deg, ${colorTokens.surfaceLevel3}, ${colorTokens.surfaceLevel2})`,
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
                                component: 'div',
                                sx: { color: colorTokens.textPrimary }
                              }}
                              secondaryTypographyProps={{
                                variant: 'body2',
                                component: 'div',
                                sx: {
                                  color: colorTokens.brand,
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
                                sx={{ color: colorTokens.textSecondary }}
                              >
                                <RemoveIcon />
                              </IconButton>
                              <Typography
                                variant="body2"
                                fontWeight="bold"
                                sx={{ 
                                  minWidth: 20, 
                                  textAlign: 'center',
                                  color: colorTokens.textPrimary
                                }}
                              >
                                {item.quantity}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() =>
                                  updateCartItemQuantity(item.product.id, item.quantity + 1)
                                }
                                disabled={item.quantity >= item.product.current_stock}
                                sx={{ color: colorTokens.textSecondary }}
                              >
                                <AddIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => removeFromCart(item.product.id)}
                                sx={{ color: colorTokens.danger }}
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
                              <Typography variant="body2" fontWeight="bold" sx={{ color: colorTokens.brand }}>
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
                  <Divider sx={{ mb: 2, borderColor: colorTokens.divider }} />
                  <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ color: colorTokens.textSecondary }}>Subtotal:</Typography>
                    <Typography sx={{ color: colorTokens.textPrimary }}>{formatPrice(totals.subtotal)}</Typography>
                  </Box>
                  {totals.taxAmount > 0 && (
                    <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography sx={{ color: colorTokens.textSecondary }}>IVA:</Typography>
                      <Typography sx={{ color: colorTokens.textPrimary }}>{formatPrice(totals.taxAmount)}</Typography>
                    </Box>
                  )}
                  {(totals.discountAmount + totals.couponDiscount) > 0 && (
                    <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography sx={{ color: colorTokens.danger }}>Descuentos:</Typography>
                      <Typography sx={{ color: colorTokens.danger }}>
                        -{formatPrice(totals.discountAmount + totals.couponDiscount)}
                      </Typography>
                    </Box>
                  )}
                  <Divider sx={{ my: 1, borderColor: colorTokens.divider }} />
                  <Box display="flex" justifyContent="space-between" sx={{ mb: 3 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                      TOTAL:
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.brand }}>
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
                          borderColor: colorTokens.warning,
                          color: colorTokens.warning,
                          '&:hover': {
                            bgcolor: `${colorTokens.warning}20`,
                            borderColor: colorTokens.warning
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
                          background: `linear-gradient(135deg, ${colorTokens.success}, ${colorTokens.successHover})`,
                          color: colorTokens.textPrimary,
                          fontWeight: 'bold'
                        }}
                      >
                        Pagar
                      </Button>
                    </Grid>
                  </Grid>

                  {!selectedCustomer && (
                    <Alert 
                      severity="info" 
                      sx={{ 
                        mt: 2,
                        backgroundColor: `${colorTokens.info}10`,
                        color: colorTokens.textPrimary,
                        border: `1px solid ${colorTokens.info}30`,
                        '& .MuiAlert-icon': { color: colorTokens.info }
                      }}
                    >
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

        {/* ✅ DIALOGS ENTERPRISE v7.0 */}
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
          cart={stableCart}
          customer={stableCustomer}
          coupon={stableCoupon}
          totals={stableTotals}
          onSuccess={handleSaleSuccess}
        />

        <LayawayDialog
          open={layawayDialogOpen}
          onClose={() => {
            console.log('🔐 Cerrando LayawayDialog');
            setLayawayDialogOpen(false);
          }}
          cart={stableCart}
          customer={stableCustomer}
          coupon={stableCoupon}
          totals={stableTotals}
          onSuccess={() => {
            console.log('✅ LayawayDialog Success');
            handleSaleSuccess();
          }}
        />

        {/* ✅ FAB SCANNER v7.0 */}
        <Fab
          aria-label="scanner"
          sx={{
            position: 'fixed',
            bottom: 24,
            left: 24,
            background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
            color: colorTokens.textOnBrand,
            '&:hover': {
              background: `linear-gradient(135deg, ${colorTokens.brandHover}, ${colorTokens.brandActive})`,
              transform: 'scale(1.1)'
            }
          }}
          onClick={() => toast.success('Scanner en desarrollo')}
        >
          <ScannerIcon />
        </Fab>

        {/* ✅ ESTILOS CSS MUSCLEUP v7.0 */}
        <style jsx>{`
          ::-webkit-scrollbar {
            width: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: ${colorTokens.surfaceLevel1};
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover});
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, ${colorTokens.brandHover}, ${colorTokens.brandActive});
          }
        `}</style>
      </Box>
    </ErrorBoundary>
  );
}