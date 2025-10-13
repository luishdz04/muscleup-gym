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
  Category as CategoryIcon,
  Refresh as RefreshIcon,
  Receipt as ReceiptIcon,
  Star as StarIcon,
  Warning as WarningIcon,
  ArrowBack as ArrowBackIcon,
  Warehouse as WarehouseIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

// ✅ IMPORTS ENTERPRISE v6.0
import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { 
  getCurrentTimestamp,
  getTodayInMexico,
  getMexicoDateRange
} from '@/utils/dateUtils';
import { notify } from '@/utils/notifications';
import { useNotifications } from '@/hooks/useNotifications';
import { useEntityCRUD } from '@/hooks/useEntityCRUD';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

// ✅ TIPOS CENTRALIZADOS
import { Product, CartItem, Customer, Coupon, Totals, SalesStats } from '@/types/pos';

// COMPONENTES ESPECÍFICOS
import CustomerSelector from '@/components/pos/CustomerSelector';
import PaymentDialog from '@/components/pos/PaymentDialog';
import LayawayDialog from '@/components/pos/LayawayDialog-DEBUG';
import ErrorBoundary from '@/components/ErrorBoundary';

// ✅ ALMACÉN FIJO DESDE ENV
const FIXED_WAREHOUSE_ID = process.env.NEXT_PUBLIC_DEFAULT_WAREHOUSE_ID || '';

// CONSTANTES
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

// ✅ PRODUCTCARD MEMOIZADO CON SSR GUARD
const ProductCard = memo<{ product: Product; onAddToCart: (product: Product) => void; hydrated: boolean }>(
  ({ product, onAddToCart, hydrated }) => {
    const formatPrice = useCallback((price: number) => {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
      }).format(price);
    }, []);

    const handleClick = useCallback(() => {
      onAddToCart(product);
    }, [product, onAddToCart]);

    const CardWrapper = hydrated ? motion.div : 'div';
    const cardProps = hydrated ? {
      layout: true,
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      whileHover: { scale: 1.02 },
      whileTap: { scale: 0.98 }
    } : {};

    return (
      <CardWrapper {...cardProps}>
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
      </CardWrapper>
    );
  }
);

ProductCard.displayName = 'ProductCard';

export default function POSPage() {
  // ✅ HOOKS ESTABLES
  const router = useRouter();
  const hydrated = useHydrated();
  const { toast } = useNotifications();
  const supabase = createBrowserSupabaseClient();

  // ✅ ALMACÉN FIJO - NO ES ESTADO
  const activeWarehouseId = FIXED_WAREHOUSE_ID;

  // ✅ ESTADO DE PRODUCTOS
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // ESTADOS PRINCIPALES
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Estados de filtros
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

  // ✅ CRUD PARA COUPONS
  const {
    data: coupons,
    loading: couponsLoading
  } = useEntityCRUD<Coupon>({
    tableName: 'coupons',
    selectQuery: '*'
  });

  // ✅ CARGAR PRODUCTOS DEL ALMACÉN FIJO
  const loadProductsFromWarehouse = useCallback(async () => {
    if (!FIXED_WAREHOUSE_ID) {
      notify.error('Almacén no configurado - contacta al administrador');
      setProducts([]);
      return;
    }

    setProductsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_products_for_pos', {
        p_warehouse_id: FIXED_WAREHOUSE_ID
      });

      if (error) {
        console.error('Error loading products:', error);
        notify.error('Error al cargar productos del almacén');
        setProducts([]);
      } else {
        setProducts(data || []);
        console.log(`✅ ${data?.length || 0} productos cargados del almacén`);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      notify.error('Error inesperado al cargar productos');
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, [supabase]);

  // ✅ RECARGAR PRODUCTOS
  const refreshProducts = useCallback(() => {
    loadProductsFromWarehouse();
  }, [loadProductsFromWarehouse]);

  // ✅ CARGAR PRODUCTOS AL INICIO
  useEffect(() => {
    if (hydrated && FIXED_WAREHOUSE_ID) {
      loadProductsFromWarehouse();
    }
  }, [hydrated, loadProductsFromWarehouse]);

  // FUNCIONES HELPER
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  }, []);

  // Cargar estadísticas de ventas
  const loadSalesStats = useCallback(async () => {
    try {
      const today = getTodayInMexico();
      const { startISO, endISO } = getMexicoDateRange(today);
      
      console.log('🔍 Cargando ventas del día:', {
        fecha_mexico: today,
        rango_utc_inicio: startISO,
        rango_utc_fin: endISO
      });
      
      const { data, error } = await supabase
        .from('sales')
        .select('total_amount, created_at')
        .gte('created_at', startISO)
        .lte('created_at', endISO)
        .eq('status', 'completed');
        
      if (error) throw error;
      
      console.log('✅ Ventas encontradas:', data?.length || 0, 'ventas');
      
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

  // AGREGAR AL CARRITO
  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    if (product.current_stock < quantity) {
      toast.error('Stock insuficiente en este almacén');
      return;
    }
    
    setCart(prev => {
      const existingItem = prev.find(item => item.product.id === product.id);
      
      if (existingItem) {
        if (existingItem.quantity + quantity > product.current_stock) {
          toast.error('Stock insuficiente en este almacén');
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

  // ACTUALIZAR CANTIDAD
  const updateCartItemQuantity = useCallback((productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(prev => prev.filter(item => item.product.id !== productId));
      return;
    }
    
    setCart(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          if (newQuantity > item.product.current_stock) {
            toast.error('Stock insuficiente en este almacén');
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

  // REMOVER DEL CARRITO
  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  // LIMPIAR CARRITO
  const clearCart = useCallback(() => {
    setCart([]);
    setSelectedCustomer(null);
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('Carrito limpiado');
  }, [toast]);

  // CALCULAR DESCUENTO DE CUPÓN
  const calculateCouponDiscount = useCallback((subtotal: number): number => {
    if (!appliedCoupon) return 0;
    
    if (appliedCoupon.discount_type === 'percentage') {
      return (subtotal * appliedCoupon.discount_value) / 100;
    } else {
      return Math.min(appliedCoupon.discount_value, subtotal);
    }
  }, [appliedCoupon]);

  // TOTALES
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

  // APLICAR CUPÓN
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

  // REMOVER CUPÓN
  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('Cupón removido');
  }, [toast]);

  // MANEJAR ÉXITO DE VENTA
  const handleSaleSuccess = useCallback(() => {
    clearCart();
    refreshProducts();
    loadSalesStats();
    toast.success('Venta completada exitosamente');
  }, [clearCart, refreshProducts, loadSalesStats, toast]);

  // OBJETOS ESTABLES PARA DIALOGS
  const stableCart = useMemo(() => cart, [cart]);
  const stableCustomer = useMemo(() => selectedCustomer, [selectedCustomer]);
  const stableCoupon = useMemo(() => appliedCoupon, [appliedCoupon]);
  const stableTotals = useMemo(() => totals, [totals]);

  // FILTRADO DE PRODUCTOS
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

  // CARGAR DATOS INICIALES
  useEffect(() => {
    if (hydrated) {
      loadSalesStats();
    }
  }, [hydrated, loadSalesStats]);

  // CERRAR LAYAWAY SI CARRITO VACÍO
  useEffect(() => {
    if (cart.length === 0 && layawayDialogOpen) {
      setLayawayDialogOpen(false);
    }
  }, [cart.length, layawayDialogOpen]);

  // SSR SAFETY
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
          {/* PANEL IZQUIERDO - PRODUCTOS */}
          <Grid size={{ xs: 12, lg: 8 }}>
            {/* Header */}
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
                      fontWeight: 600
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
                      fontWeight: 600
                    }}
                  >
                    Actualizar
                  </Button>
                </Box>
              </Box>

              {/* ✅ ALERTA DE ALMACÉN FIJO */}
              {!FIXED_WAREHOUSE_ID ? (
                <Alert 
                  severity="error"
                  icon={<WarehouseIcon />}
                  sx={{ 
                    mb: 3,
                    backgroundColor: `${colorTokens.danger}10`,
                    border: `2px solid ${colorTokens.danger}40`,
                    color: colorTokens.textPrimary,
                    '& .MuiAlert-icon': { color: colorTokens.danger }
                  }}
                >
                  <Typography variant="body1" fontWeight="bold">
                    ⚠️ Almacén no configurado
                  </Typography>
                  <Typography variant="body2">
                    Configura NEXT_PUBLIC_DEFAULT_WAREHOUSE_ID en .env.local
                  </Typography>
                </Alert>
              ) : (
                <Alert 
                  severity="success"
                  icon={<WarehouseIcon />}
                  sx={{ 
                    mb: 3,
                    backgroundColor: `${colorTokens.success}10`,
                    border: `1px solid ${colorTokens.success}40`,
                    color: colorTokens.textPrimary,
                    '& .MuiAlert-icon': { color: colorTokens.success }
                  }}
                >
                  <Typography variant="body2">
                    Vendiendo desde: <strong>STORE MUP PRINICIPAL</strong> (ID: {FIXED_WAREHOUSE_ID.slice(0, 8)}...)
                  </Typography>
                </Alert>
              )}

              {/* ESTADÍSTICAS */}
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

            {/* FILTROS */}
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
                    disabled={!FIXED_WAREHOUSE_ID}
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
                      disabled={!FIXED_WAREHOUSE_ID}
                      sx={{
                        color: colorTokens.textPrimary,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: colorTokens.border
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

            {/* GRID DE PRODUCTOS */}
            <Paper
              sx={{
                p: 3,
                background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
                border: `1px solid ${colorTokens.border}`,
                borderRadius: 3,
                color: colorTokens.textPrimary
              }}
            >
              {!FIXED_WAREHOUSE_ID ? (
                <Box textAlign="center" py={8}>
                  <WarehouseIcon sx={{ fontSize: 100, color: colorTokens.textSecondary, mb: 3 }} />
                  <Typography variant="h5" sx={{ color: colorTokens.textPrimary }} gutterBottom>
                    Almacén no configurado
                  </Typography>
                  <Typography variant="body1" sx={{ color: colorTokens.textSecondary }}>
                    Configura la variable de entorno para comenzar
                  </Typography>
                </Box>
              ) : productsLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px" flexDirection="column" gap={2}>
                  <CircularProgress sx={{ color: colorTokens.brand }} size={60} thickness={4} />
                  <Typography variant="body1" sx={{ color: colorTokens.textSecondary }}>
                    Cargando productos del almacén...
                  </Typography>
                </Box>
              ) : filteredProducts.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <CategoryIcon sx={{ fontSize: 80, color: colorTokens.textSecondary, mb: 2 }} />
                  <Typography variant="h6" sx={{ color: colorTokens.textSecondary }} gutterBottom>
                    No se encontraron productos
                  </Typography>
                  <Typography variant="body2" sx={{ color: colorTokens.textMuted }}>
                    {products.length === 0
                      ? 'No hay productos con stock en este almacén'
                      : 'Intenta ajustar los filtros de búsqueda'
                    }
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {filteredProducts.map(product => (
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={product.id}>
                      <ProductCard product={product} onAddToCart={addToCart} hydrated={hydrated} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          </Grid>

          {/* PANEL DERECHO - CARRITO */}
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
                      color: colorTokens.brand
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
                      {cart.map((item, index) => {
                        const ItemWrapper = hydrated ? motion.div : 'div';
                        const itemProps = hydrated ? {
                          initial: { opacity: 0, x: -20 },
                          animate: { opacity: 1, x: 0 },
                          exit: { opacity: 0, x: 20 },
                          transition: { duration: 0.3, delay: index * 0.05 }
                        } : {};

                        return (
                          <ItemWrapper key={item.product.id} {...itemProps}>
                            <ListItem
                              sx={{
                                border: `1px solid ${colorTokens.border}`,
                                borderRadius: 1,
                                mb: 1,
                                background: `linear-gradient(135deg, ${colorTokens.surfaceLevel3}, ${colorTokens.surfaceLevel2})`,
                                position: 'relative',
                                minHeight: 70,
                                pr: 14
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
                          </ItemWrapper>
                        );
                      })}
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
                          color: colorTokens.warning
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
                        border: `1px solid ${colorTokens.info}30`
                      }}
                    >
                      <Typography variant="body2">
                        Para crear apartados, primero selecciona un cliente
                      </Typography>
                    </Alert>
                  )}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* DIALOGS */}
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
          warehouseId={activeWarehouseId}
          onSuccess={handleSaleSuccess}
        />

        <LayawayDialog
          open={layawayDialogOpen}
          onClose={() => setLayawayDialogOpen(false)}
          cart={stableCart}
          customer={stableCustomer}
          coupon={stableCoupon}
          totals={stableTotals}
          warehouseId={activeWarehouseId}
          onSuccess={handleSaleSuccess}
        />
      </Box>
    </ErrorBoundary>
  );
}