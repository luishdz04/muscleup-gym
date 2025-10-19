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
  CircularProgress,
  Fade,
  Zoom,
  Slide,
  Grow,
  Tooltip,
  Badge
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
  Warehouse as WarehouseIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingBag as ShoppingBagIcon,
  AttachMoney as MoneyIcon,
  AutoAwesome as AutoAwesomeIcon,
  FilterList as FilterIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';

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
import LayawayDialog from '@/components/pos/LayawayDialog';
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

// ✅ PRODUCTCARD MEMOIZADO CON SSR GUARD - REDESIGNED WITH GLASSMORPHISM
const ProductCard = memo<{ product: Product; onAddToCart: (product: Product) => void; hydrated: boolean }>(
  ({ product, onAddToCart, hydrated }) => {
    const [isHovered, setIsHovered] = useState(false);

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
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration: 0.3 }
    } : {};

    return (
      <CardWrapper {...cardProps}>
        <Card
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          sx={{
            height: '100%',
            cursor: 'pointer',
            background: `linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${colorTokens.border}`,
            borderRadius: 4,
            overflow: 'hidden',
            position: 'relative',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-8px) scale(1.02)',
              boxShadow: `0 16px 48px ${colorTokens.brand}40`,
              border: `1px solid ${colorTokens.brand}80`,
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(90deg, ${colorTokens.brand}, ${colorTokens.info})`,
              opacity: 0,
              transition: 'opacity 0.3s ease'
            },
            '&:hover::before': {
              opacity: 1
            }
          }}
        >
          <Box
            onClick={handleClick}
            sx={{
              height: 160,
              background: product.image_url
                ? `url(${product.image_url}) center/cover`
                : `linear-gradient(135deg, ${colorTokens.brand}DD, ${colorTokens.info}CC)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colorTokens.neutral0,
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.4s ease',
              '&:hover': {
                transform: product.image_url ? 'scale(1.1)' : 'scale(1.05)'
              }
            }}
          >
            {!product.image_url && (
              <Box sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${colorTokens.neutral0}20, ${colorTokens.neutral0}10)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)',
                border: `2px solid ${colorTokens.neutral0}40`,
                boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3)`
              }}>
                <Typography variant="h3" fontWeight="bold" sx={{ color: colorTokens.neutral0 }}>
                  {product.name.charAt(0)}
                </Typography>
              </Box>
            )}

            {/* Stock Badge */}
            <Zoom in={true} timeout={300}>
              <Chip
                label={`${product.current_stock} ${product.unit}`}
                size="small"
                sx={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  background: product.current_stock <= product.min_stock
                    ? `linear-gradient(135deg, ${colorTokens.warning}, ${colorTokens.warning}CC)`
                    : `linear-gradient(135deg, ${colorTokens.success}, ${colorTokens.success}CC)`,
                  color: colorTokens.neutral0,
                  backdropFilter: 'blur(10px)',
                  boxShadow: `0 4px 12px rgba(0, 0, 0, 0.3)`,
                  border: `1px solid ${colorTokens.neutral0}20`
                }}
              />
            </Zoom>

            {/* Floating Add Button on Hover */}
            <Zoom in={isHovered} timeout={200}>
              <Box
                onClick={handleClick}
                sx={{
                  position: 'absolute',
                  bottom: 10,
                  right: 10,
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: `0 8px 24px ${colorTokens.brand}60`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.15) rotate(90deg)',
                    boxShadow: `0 12px 32px ${colorTokens.brand}80`
                  }
                }}
              >
                <AddIcon sx={{ color: colorTokens.neutral100, fontSize: 28, fontWeight: 'bold' }} />
              </Box>
            </Zoom>
          </Box>

          <CardContent sx={{ p: 2.5 }}>
            <Tooltip title={product.name} arrow>
              <Typography
                variant="h6"
                noWrap
                fontWeight="bold"
                sx={{
                  color: colorTokens.textPrimary,
                  fontSize: '1rem',
                  mb: 0.5
                }}
              >
                {product.name}
              </Typography>
            </Tooltip>

            {product.brand && (
              <Typography
                variant="body2"
                sx={{
                  color: colorTokens.textSecondary,
                  fontSize: '0.8rem',
                  mb: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                <AutoAwesomeIcon sx={{ fontSize: 14 }} />
                {product.brand}
              </Typography>
            )}

            <Chip
              label={product.category}
              size="small"
              icon={<CategoryIcon sx={{ fontSize: 14 }} />}
              sx={{
                mb: 2,
                background: `linear-gradient(135deg, ${colorTokens.info}15, ${colorTokens.info}08)`,
                color: colorTokens.info,
                border: `1px solid ${colorTokens.info}40`,
                fontWeight: 600,
                fontSize: '0.7rem',
                backdropFilter: 'blur(10px)'
              }}
            />

            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              sx={{
                pt: 1.5,
                borderTop: `1px solid ${colorTokens.border}`
              }}
            >
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start'
              }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: colorTokens.textMuted,
                    fontSize: '0.65rem',
                    mb: 0.5
                  }}
                >
                  Precio
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: colorTokens.brand,
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    textShadow: `0 2px 8px ${colorTokens.brand}40`
                  }}
                >
                  {formatPrice(product.sale_price)}
                </Typography>
              </Box>

              {product.current_stock <= product.min_stock && (
                <Grow in={true} timeout={300}>
                  <Chip
                    icon={<WarningIcon sx={{ fontSize: 14 }} />}
                    label="Bajo"
                    size="small"
                    sx={{
                      background: `linear-gradient(135deg, ${colorTokens.warning}20, ${colorTokens.warning}10)`,
                      color: colorTokens.warning,
                      border: `1px solid ${colorTokens.warning}60`,
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      animation: 'pulse 2s infinite'
                    }}
                  />
                </Grow>
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

  // ✨ FUNCIÓN DE CONFETTI
  const triggerConfetti = useCallback(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Confetti desde la izquierda
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#FFCC00', '#FFD700', '#FFA500', '#22C55E', '#38BDF8']
      });

      // Confetti desde la derecha
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#FFCC00', '#FFD700', '#FFA500', '#22C55E', '#38BDF8']
      });
    }, 250);
  }, []);

  // MANEJAR ÉXITO DE VENTA
  const handleSaleSuccess = useCallback(() => {
    // Lanzar confetti
    triggerConfetti();

    clearCart();
    refreshProducts();
    loadSalesStats();
    toast.success('¡Venta completada exitosamente! 🎉');
  }, [clearCart, refreshProducts, loadSalesStats, toast, triggerConfetti]);

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
          p: { xs: 2, sm: 2.5, md: 3 }
        }}
      >
        <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
          {/* PANEL IZQUIERDO - PRODUCTOS */}
          <Grid size={{ xs: 12, lg: 8 }}>
            {/* Header - REDESIGNED WITH GLASSMORPHISM */}
            <Fade in={true} timeout={600}>
              <Paper sx={{
                p: { xs: 2, sm: 3, md: 4 },
                mb: { xs: 2, sm: 3, md: 4 },
                background: `linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)`,
                backdropFilter: 'blur(20px)',
                border: `1px solid ${colorTokens.border}`,
                borderRadius: 4,
                boxShadow: `0 8px 32px ${colorTokens.shadow}`,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '100%',
                  background: `linear-gradient(90deg, transparent 0%, ${colorTokens.brand}05 50%, transparent 100%)`,
                  animation: 'shine 3s infinite',
                  '@keyframes shine': {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' }
                  }
                }
              }}>
                <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} mb={{ xs: 2, sm: 2.5, md: 3 }} gap={2} sx={{ position: 'relative', zIndex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* Animated Icon */}
                    <Box sx={{
                      width: { xs: 56, sm: 64, md: 72 },
                      height: { xs: 56, sm: 64, md: 72 },
                      borderRadius: '20px',
                      background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 8px 32px ${colorTokens.brand}40`,
                      animation: 'float 3s ease-in-out infinite',
                      '@keyframes float': {
                        '0%, 100%': { transform: 'translateY(0px)' },
                        '50%': { transform: 'translateY(-10px)' }
                      }
                    }}>
                      <CartIcon sx={{
                        fontSize: { xs: 32, sm: 36, md: 42 },
                        color: colorTokens.neutral100
                      }} />
                    </Box>

                    <Box>
                      <Typography
                        variant="h3"
                        component="h1"
                        sx={{
                          fontWeight: 800,
                          color: colorTokens.textPrimary,
                          fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' }
                        }}
                      >
                        POS MUP
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: { xs: 'row', sm: 'row' }, gap: { xs: 1.5, sm: 2 }, width: { xs: '100%', md: 'auto' } }}>
                    <Tooltip title="Volver al dashboard" arrow>
                      <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => router.push('/dashboard/admin')}
                        sx={{
                          background: `linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))`,
                          backdropFilter: 'blur(10px)',
                          border: `1px solid ${colorTokens.border}`,
                          color: colorTokens.textPrimary,
                          px: { xs: 2, sm: 3 },
                          py: { xs: 1.25, sm: 1.5 },
                          fontSize: { xs: '0.8rem', sm: '0.875rem' },
                          borderRadius: 3,
                          fontWeight: 600,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: `linear-gradient(135deg, ${colorTokens.brand}20, ${colorTokens.brand}10)`,
                            border: `1px solid ${colorTokens.brand}60`,
                            transform: 'translateY(-2px)',
                            boxShadow: `0 8px 24px ${colorTokens.brand}30`
                          }
                        }}
                        variant="outlined"
                      >
                        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Dashboard</Box>
                      </Button>
                    </Tooltip>

                    <Tooltip title="Actualizar productos" arrow>
                      <Button
                        variant="outlined"
                        startIcon={productsLoading ? <CircularProgress size={16} sx={{ color: colorTokens.brand }} /> : <RefreshIcon />}
                        onClick={refreshProducts}
                        disabled={productsLoading}
                        sx={{
                          background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
                          border: `1px solid ${colorTokens.brand}`,
                          color: colorTokens.neutral100,
                          px: { xs: 2, sm: 3 },
                          py: { xs: 1.25, sm: 1.5 },
                          fontSize: { xs: '0.8rem', sm: '0.875rem' },
                          borderRadius: 3,
                          fontWeight: 700,
                          boxShadow: `0 4px 16px ${colorTokens.brand}40`,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: `linear-gradient(135deg, ${colorTokens.brandHover}, ${colorTokens.brand})`,
                            transform: 'translateY(-2px)',
                            boxShadow: `0 8px 24px ${colorTokens.brand}60`
                          },
                          '&:disabled': {
                            opacity: 0.6
                          }
                        }}
                      >
                        Actualizar
                      </Button>
                    </Tooltip>
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

              {/* ESTADÍSTICAS - REDESIGNED WITH GLASSMORPHISM */}
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Zoom in={true} timeout={400} style={{ transitionDelay: '100ms' }}>
                    <motion.div whileHover={{ scale: 1.05, y: -4 }}>
                      <Card sx={{
                        background: `linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(34, 197, 94, 0.02) 100%)`,
                        backdropFilter: 'blur(20px)',
                        border: `1px solid ${colorTokens.success}40`,
                        borderRadius: 4,
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          border: `1px solid ${colorTokens.success}80`,
                          boxShadow: `0 12px 40px ${colorTokens.success}30`,
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '3px',
                          background: `linear-gradient(90deg, ${colorTokens.success}, ${colorTokens.success}AA)`,
                          opacity: 0,
                          transition: 'opacity 0.3s ease'
                        },
                        '&:hover::before': { opacity: 1 }
                      }}>
                        <CardContent sx={{ p: 3 }}>
                          {/* Decorative background icon */}
                          <Box sx={{
                            position: 'absolute',
                            top: -15,
                            right: -15,
                            opacity: 0.04,
                            transform: 'rotate(-15deg)'
                          }}>
                            <MoneyIcon sx={{ fontSize: 120, color: colorTokens.success }} />
                          </Box>

                          <Box display="flex" alignItems="flex-start" justifyContent="space-between" sx={{ position: 'relative' }}>
                            <Box>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: colorTokens.textMuted,
                                  fontSize: '0.7rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: 1,
                                  mb: 1,
                                  display: 'block'
                                }}
                              >
                                Ventas del día
                              </Typography>
                              <Typography
                                variant="h4"
                                fontWeight="bold"
                                sx={{
                                  color: colorTokens.success,
                                  textShadow: `0 2px 12px ${colorTokens.success}40`,
                                  fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
                                }}
                              >
                                {formatPrice(salesStats.dailySales)}
                              </Typography>
                            </Box>

                            {/* Circular Icon Container */}
                            <Box sx={{
                              width: 56,
                              height: 56,
                              borderRadius: '50%',
                              background: `linear-gradient(135deg, ${colorTokens.success}, ${colorTokens.success}CC)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: `0 8px 24px ${colorTokens.success}40`
                            }}>
                              <MoneyIcon sx={{ fontSize: 32, color: colorTokens.neutral0 }} />
                            </Box>
                          </Box>

                          <Box sx={{
                            mt: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            color: colorTokens.success
                          }}>
                            <TrendingUpIcon sx={{ fontSize: 16 }} />
                            <Typography variant="caption" fontWeight="600">
                              Actualizado en tiempo real
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Zoom>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Zoom in={true} timeout={400} style={{ transitionDelay: '200ms' }}>
                    <motion.div whileHover={{ scale: 1.05, y: -4 }}>
                      <Card sx={{
                        background: `linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(56, 189, 248, 0.02) 100%)`,
                        backdropFilter: 'blur(20px)',
                        border: `1px solid ${colorTokens.info}40`,
                        borderRadius: 4,
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          border: `1px solid ${colorTokens.info}80`,
                          boxShadow: `0 12px 40px ${colorTokens.info}30`,
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '3px',
                          background: `linear-gradient(90deg, ${colorTokens.info}, ${colorTokens.info}AA)`,
                          opacity: 0,
                          transition: 'opacity 0.3s ease'
                        },
                        '&:hover::before': { opacity: 1 }
                      }}>
                        <CardContent sx={{ p: 3 }}>
                          {/* Decorative background icon */}
                          <Box sx={{
                            position: 'absolute',
                            top: -15,
                            right: -15,
                            opacity: 0.04,
                            transform: 'rotate(-15deg)'
                          }}>
                            <ShoppingBagIcon sx={{ fontSize: 120, color: colorTokens.info }} />
                          </Box>

                          <Box display="flex" alignItems="flex-start" justifyContent="space-between" sx={{ position: 'relative' }}>
                            <Box>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: colorTokens.textMuted,
                                  fontSize: '0.7rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: 1,
                                  mb: 1,
                                  display: 'block'
                                }}
                              >
                                Transacciones
                              </Typography>
                              <Typography
                                variant="h4"
                                fontWeight="bold"
                                sx={{
                                  color: colorTokens.info,
                                  textShadow: `0 2px 12px ${colorTokens.info}40`,
                                  fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
                                }}
                              >
                                {salesStats.dailyTransactions}
                              </Typography>
                            </Box>

                            {/* Circular Icon Container */}
                            <Box sx={{
                              width: 56,
                              height: 56,
                              borderRadius: '50%',
                              background: `linear-gradient(135deg, ${colorTokens.info}, ${colorTokens.info}CC)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: `0 8px 24px ${colorTokens.info}40`
                            }}>
                              <ShoppingBagIcon sx={{ fontSize: 32, color: colorTokens.neutral0 }} />
                            </Box>
                          </Box>

                          <Box sx={{
                            mt: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            color: colorTokens.info
                          }}>
                            <ReceiptIcon sx={{ fontSize: 16 }} />
                            <Typography variant="caption" fontWeight="600">
                              Ventas completadas
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Zoom>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Zoom in={true} timeout={400} style={{ transitionDelay: '300ms' }}>
                    <motion.div whileHover={{ scale: 1.05, y: -4 }}>
                      <Card sx={{
                        background: `linear-gradient(135deg, rgba(255, 204, 0, 0.08) 0%, rgba(255, 204, 0, 0.02) 100%)`,
                        backdropFilter: 'blur(20px)',
                        border: `1px solid ${colorTokens.brand}40`,
                        borderRadius: 4,
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          border: `1px solid ${colorTokens.brand}80`,
                          boxShadow: `0 12px 40px ${colorTokens.brand}30`,
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '3px',
                          background: `linear-gradient(90deg, ${colorTokens.brand}, ${colorTokens.brand}AA)`,
                          opacity: 0,
                          transition: 'opacity 0.3s ease'
                        },
                        '&:hover::before': { opacity: 1 }
                      }}>
                        <CardContent sx={{ p: 3 }}>
                          {/* Decorative background icon */}
                          <Box sx={{
                            position: 'absolute',
                            top: -15,
                            right: -15,
                            opacity: 0.04,
                            transform: 'rotate(-15deg)'
                          }}>
                            <StarIcon sx={{ fontSize: 120, color: colorTokens.brand }} />
                          </Box>

                          <Box display="flex" alignItems="flex-start" justifyContent="space-between" sx={{ position: 'relative' }}>
                            <Box>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: colorTokens.textMuted,
                                  fontSize: '0.7rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: 1,
                                  mb: 1,
                                  display: 'block'
                                }}
                              >
                                Ticket promedio
                              </Typography>
                              <Typography
                                variant="h4"
                                fontWeight="bold"
                                sx={{
                                  color: colorTokens.brand,
                                  textShadow: `0 2px 12px ${colorTokens.brand}40`,
                                  fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
                                }}
                              >
                                {formatPrice(salesStats.avgTicket)}
                              </Typography>
                            </Box>

                            {/* Circular Icon Container */}
                            <Box sx={{
                              width: 56,
                              height: 56,
                              borderRadius: '50%',
                              background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: `0 8px 24px ${colorTokens.brand}40`
                            }}>
                              <StarIcon sx={{ fontSize: 32, color: colorTokens.neutral100 }} />
                            </Box>
                          </Box>

                          <Box sx={{
                            mt: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            color: colorTokens.brand
                          }}>
                            <TrendingUpIcon sx={{ fontSize: 16 }} />
                            <Typography variant="caption" fontWeight="600">
                              Promedio por venta
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Zoom>
                </Grid>
              </Grid>
              </Paper>
            </Fade>

            {/* FILTROS - REDESIGNED WITH GLASSMORPHISM */}
            <Slide in={true} direction="up" timeout={500}>
              <Paper
                sx={{
                  p: 3,
                  mb: 3,
                  background: `linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)`,
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${colorTokens.border}`,
                  borderRadius: 4,
                  boxShadow: `0 4px 24px rgba(0, 0, 0, 0.1)`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: `0 8px 32px ${colorTokens.brand}20`
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                  <Box sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${colorTokens.info}, ${colorTokens.info}CC)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 16px ${colorTokens.info}40`
                  }}>
                    <FilterIcon sx={{ fontSize: 22, color: colorTokens.neutral0 }} />
                  </Box>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                    Filtros de búsqueda
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      placeholder="Buscar por nombre, SKU, código de barras..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      disabled={!FIXED_WAREHOUSE_ID}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: colorTokens.brand, fontSize: 24 }} />
                          </InputAdornment>
                        ),
                        endAdornment: searchTerm && (
                          <InputAdornment position="end">
                            <Tooltip title="Limpiar búsqueda" arrow>
                              <IconButton
                                size="small"
                                onClick={() => setSearchTerm('')}
                                sx={{
                                  color: colorTokens.textSecondary,
                                  '&:hover': {
                                    background: `${colorTokens.danger}20`,
                                    color: colorTokens.danger
                                  }
                                }}
                              >
                                <ClearIcon />
                              </IconButton>
                            </Tooltip>
                          </InputAdornment>
                        ),
                        sx: {
                          background: `linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))`,
                          backdropFilter: 'blur(10px)',
                          color: colorTokens.textPrimary,
                          borderRadius: 3,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: colorTokens.border,
                            transition: 'all 0.3s ease'
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: `${colorTokens.brand}60`
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: colorTokens.brand,
                            borderWidth: '2px'
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
                        startAdornment={
                          <InputAdornment position="start">
                            <CategoryIcon sx={{ color: categoryFilter ? colorTokens.brand : colorTokens.textMuted, ml: 1 }} />
                          </InputAdornment>
                        }
                        sx={{
                          background: `linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))`,
                          backdropFilter: 'blur(10px)',
                          color: colorTokens.textPrimary,
                          borderRadius: 3,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: colorTokens.border,
                            transition: 'all 0.3s ease'
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: `${colorTokens.brand}60`
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: colorTokens.brand,
                            borderWidth: '2px'
                          }
                        }}
                      >
                        <MenuItem value="">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CategoryIcon sx={{ fontSize: 18, color: colorTokens.textMuted }} />
                            Todas las categorías
                          </Box>
                        </MenuItem>
                        {CATEGORIES.map(category => (
                          <MenuItem key={category} value={category}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CategoryIcon sx={{ fontSize: 18, color: colorTokens.brand }} />
                              {category}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, md: 2 }}>
                    <Box sx={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `linear-gradient(135deg, ${colorTokens.brand}15, ${colorTokens.brand}08)`,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${colorTokens.brand}40`,
                      borderRadius: 3,
                      px: 2,
                      py: { xs: 2, md: 0 }
                    }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Badge
                          badgeContent={filteredProducts.length}
                          max={999}
                          sx={{
                            '& .MuiBadge-badge': {
                              background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
                              color: colorTokens.neutral100,
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              boxShadow: `0 2px 8px ${colorTokens.brand}60`
                            }
                          }}
                        >
                          <InventoryIcon sx={{ fontSize: 28, color: colorTokens.brand }} />
                        </Badge>
                        <Typography
                          variant="caption"
                          sx={{
                            color: colorTokens.textSecondary,
                            display: 'block',
                            mt: 1,
                            fontWeight: 600
                          }}
                        >
                          Productos
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Slide>

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

          {/* PANEL DERECHO - CARRITO - REDESIGNED WITH E-COMMERCE PREMIUM STYLE */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Slide in={true} direction="left" timeout={600}>
              <Paper
                sx={{
                  p: 3,
                  height: 'fit-content',
                  background: `linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)`,
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${colorTokens.border}`,
                  borderRadius: 4,
                  boxShadow: `0 8px 32px rgba(0, 0, 0, 0.2)`,
                  position: 'sticky',
                  top: 20,
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: `linear-gradient(90deg, ${colorTokens.brand}, ${colorTokens.info}, ${colorTokens.success})`,
                    animation: 'shimmer 3s infinite linear',
                    '@keyframes shimmer': {
                      '0%': { backgroundPosition: '-200% center' },
                      '100%': { backgroundPosition: '200% center' }
                    },
                    backgroundSize: '200% 100%'
                  }
                }}
              >
                {/* Header del carrito */}
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3, position: 'relative' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '14px',
                      background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 8px 24px ${colorTokens.brand}40`,
                      position: 'relative'
                    }}>
                      <CartIcon sx={{ color: colorTokens.neutral100, fontSize: 26 }} />
                      {cart.length > 0 && (
                        <Badge
                          badgeContent={cart.length}
                          sx={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            '& .MuiBadge-badge': {
                              background: `linear-gradient(135deg, ${colorTokens.success}, ${colorTokens.success}CC)`,
                              color: colorTokens.neutral0,
                              fontWeight: 700,
                              fontSize: '0.7rem',
                              minWidth: 20,
                              height: 20,
                              boxShadow: `0 4px 12px ${colorTokens.success}60`
                            }
                          }}
                        />
                      )}
                    </Box>
                    <Box>
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{ color: colorTokens.textPrimary, fontSize: '1.1rem' }}
                      >
                        Carrito de Compras
                      </Typography>
                      <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                        {cart.length} {cart.length === 1 ? 'artículo' : 'artículos'}
                      </Typography>
                    </Box>
                  </Box>

                  {cart.length > 0 && (
                    <Tooltip title="Vaciar carrito" arrow>
                      <IconButton
                        onClick={clearCart}
                        sx={{
                          background: `${colorTokens.danger}15`,
                          border: `1px solid ${colorTokens.danger}40`,
                          color: colorTokens.danger,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: `${colorTokens.danger}30`,
                            transform: 'scale(1.1) rotate(10deg)',
                            boxShadow: `0 4px 16px ${colorTokens.danger}40`
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>

              {/* Cliente seleccionado - REDESIGNED */}
              <Box sx={{ mb: 3 }}>
                {selectedCustomer ? (
                  <Grow in={true} timeout={400}>
                    <Paper
                      sx={{
                        p: 2.5,
                        background: `linear-gradient(135deg, ${colorTokens.success}15, ${colorTokens.success}08)`,
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${colorTokens.success}60`,
                        borderRadius: 3,
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          bottom: 0,
                          width: '4px',
                          background: `linear-gradient(180deg, ${colorTokens.success}, ${colorTokens.success}CC)`
                        }
                      }}
                    >
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{
                            width: 44,
                            height: 44,
                            background: `linear-gradient(135deg, ${colorTokens.success}, ${colorTokens.success}CC)`,
                            boxShadow: `0 4px 16px ${colorTokens.success}40`
                          }}>
                            <PersonIcon sx={{ fontSize: 24 }} />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ color: colorTokens.textPrimary, mb: 0.5 }}>
                              {selectedCustomer.firstName} {selectedCustomer.lastName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: colorTokens.textSecondary, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <AutoAwesomeIcon sx={{ fontSize: 12 }} />
                              {selectedCustomer.email || selectedCustomer.whatsapp}
                            </Typography>
                          </Box>
                        </Box>
                        <Tooltip title="Remover cliente" arrow>
                          <IconButton
                            size="small"
                            onClick={() => setSelectedCustomer(null)}
                            sx={{
                              background: `${colorTokens.danger}15`,
                              border: `1px solid ${colorTokens.danger}40`,
                              color: colorTokens.danger,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                background: `${colorTokens.danger}30`,
                                transform: 'scale(1.1) rotate(90deg)',
                                boxShadow: `0 4px 12px ${colorTokens.danger}40`
                              }
                            }}
                          >
                            <ClearIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Paper>
                  </Grow>
                ) : (
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<PersonIcon />}
                    onClick={() => setCustomerSelectorOpen(true)}
                    sx={{
                      background: `linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))`,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${colorTokens.border}`,
                      borderRadius: 3,
                      color: colorTokens.textPrimary,
                      py: 1.5,
                      fontWeight: 600,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: `linear-gradient(135deg, ${colorTokens.brand}20, ${colorTokens.brand}10)`,
                        border: `1px solid ${colorTokens.brand}60`,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 24px ${colorTokens.brand}30`
                      }
                    }}
                  >
                    Seleccionar Cliente (Opcional)
                  </Button>
                )}
              </Box>

              {/* Cupón - REDESIGNED */}
              <Box sx={{ mb: 3 }}>
                {appliedCoupon ? (
                  <Grow in={true} timeout={400}>
                    <Paper
                      sx={{
                        p: 2.5,
                        background: `linear-gradient(135deg, ${colorTokens.brand}15, ${colorTokens.brand}08)`,
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${colorTokens.brand}60`,
                        borderRadius: 3,
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          bottom: 0,
                          width: '4px',
                          background: `linear-gradient(180deg, ${colorTokens.brand}, ${colorTokens.brandHover})`
                        }
                      }}
                    >
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{
                            width: 44,
                            height: 44,
                            background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
                            boxShadow: `0 4px 16px ${colorTokens.brand}40`
                          }}>
                            <CouponIcon sx={{ fontSize: 24 }} />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ color: colorTokens.textPrimary, mb: 0.5 }}>
                              {appliedCoupon.code}
                            </Typography>
                            <Typography variant="caption" sx={{ color: colorTokens.success, display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 700 }}>
                              <AutoAwesomeIcon sx={{ fontSize: 12 }} />
                              Ahorras {formatPrice(totals.couponDiscount)}
                            </Typography>
                          </Box>
                        </Box>
                        <Tooltip title="Remover cupón" arrow>
                          <IconButton
                            size="small"
                            onClick={removeCoupon}
                            sx={{
                              background: `${colorTokens.danger}15`,
                              border: `1px solid ${colorTokens.danger}40`,
                              color: colorTokens.danger,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                background: `${colorTokens.danger}30`,
                                transform: 'scale(1.1) rotate(90deg)',
                                boxShadow: `0 4px 12px ${colorTokens.danger}40`
                              }
                            }}
                          >
                            <ClearIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Paper>
                  </Grow>
                ) : (
                  <Box display="flex" gap={1}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="¿Tienes un cupón?"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyPress={(e) => e.key === 'Enter' && applyCoupon()}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CouponIcon sx={{ color: colorTokens.brand, fontSize: 20 }} />
                          </InputAdornment>
                        ),
                        sx: {
                          background: `linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))`,
                          backdropFilter: 'blur(10px)',
                          color: colorTokens.textPrimary,
                          borderRadius: 2,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: colorTokens.border,
                            transition: 'all 0.3s ease'
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: `${colorTokens.brand}60`
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: colorTokens.brand,
                            borderWidth: '2px'
                          }
                        }
                      }}
                    />
                    <Tooltip title="Aplicar cupón" arrow>
                      <Button
                        variant="contained"
                        onClick={applyCoupon}
                        disabled={!couponCode.trim()}
                        sx={{
                          background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
                          color: colorTokens.neutral100,
                          fontWeight: 700,
                          minWidth: 80,
                          borderRadius: 2,
                          boxShadow: `0 4px 16px ${colorTokens.brand}40`,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: `linear-gradient(135deg, ${colorTokens.brandHover}, ${colorTokens.brand})`,
                            transform: 'translateY(-2px)',
                            boxShadow: `0 6px 20px ${colorTokens.brand}60`
                          },
                          '&:disabled': {
                            opacity: 0.5
                          }
                        }}
                      >
                        Usar
                      </Button>
                    </Tooltip>
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

                  {/* Botones de acción - REDESIGNED */}
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Tooltip title={!selectedCustomer ? "Selecciona un cliente para apartar" : "Crear apartado"} arrow>
                        <span>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<BookmarkIcon />}
                            onClick={() => setLayawayDialogOpen(true)}
                            disabled={!selectedCustomer}
                            sx={{
                              background: `linear-gradient(135deg, ${colorTokens.warning}15, ${colorTokens.warning}08)`,
                              backdropFilter: 'blur(10px)',
                              border: `2px solid ${colorTokens.warning}60`,
                              color: colorTokens.warning,
                              py: 1.5,
                              fontWeight: 700,
                              fontSize: '0.95rem',
                              borderRadius: 3,
                              boxShadow: `0 4px 16px ${colorTokens.warning}20`,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                background: `linear-gradient(135deg, ${colorTokens.warning}25, ${colorTokens.warning}15)`,
                                border: `2px solid ${colorTokens.warning}`,
                                transform: 'translateY(-3px)',
                                boxShadow: `0 8px 24px ${colorTokens.warning}40`
                              },
                              '&:disabled': {
                                opacity: 0.4,
                                transform: 'none'
                              }
                            }}
                          >
                            Apartar
                          </Button>
                        </span>
                      </Tooltip>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Tooltip title="Procesar pago" arrow>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<PaymentIcon />}
                          onClick={() => setPaymentDialogOpen(true)}
                          sx={{
                            background: `linear-gradient(135deg, ${colorTokens.success}, ${colorTokens.success}CC)`,
                            color: colorTokens.neutral0,
                            py: 1.5,
                            fontWeight: 800,
                            fontSize: '0.95rem',
                            borderRadius: 3,
                            boxShadow: `0 6px 20px ${colorTokens.success}40`,
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            overflow: 'hidden',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: '-100%',
                              width: '100%',
                              height: '100%',
                              background: `linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)`,
                              transition: 'left 0.5s ease'
                            },
                            '&:hover': {
                              background: `linear-gradient(135deg, ${colorTokens.success}CC, ${colorTokens.success})`,
                              transform: 'translateY(-3px) scale(1.02)',
                              boxShadow: `0 10px 32px ${colorTokens.success}60`
                            },
                            '&:hover::before': {
                              left: '100%'
                            }
                          }}
                        >
                          Pagar Ahora
                        </Button>
                      </Tooltip>
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
            </Slide>
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