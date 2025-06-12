'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  CircularProgress,
  Snackbar
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

// Importar componentes del POS
import CustomerSelector from '@/components/pos/CustomerSelector';
import PaymentDialog from '@/components/pos/PaymentDialog';
import LayawayDialog from '@/components/pos/LayawayDialog-DEBUG';
import ErrorBoundary from '@/components/ErrorBoundary';

interface Product {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  brand?: string;
  category: string;
  current_stock: number;
  min_stock: number;
  unit: string;
  cost_price: number;
  sale_price: number;
  image_url?: string;
  is_active?: boolean;
  is_taxable?: boolean;
  tax_rate?: number;
  suppliers?: {
    company_name: string;
    contact_person: string;
  };
}

interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_amount: number;
  tax_amount: number;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  whatsapp?: string;
  membership_type?: string;
  points_balance?: number;
  total_purchases?: number;
}

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_amount?: number;
  max_uses?: number;
  current_uses?: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
}

interface SalesStats {
  dailySales: number;
  dailyTransactions: number;
  avgTicket: number;
  topProducts: any[];
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
  const router = useRouter();
  
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

  // ✅ MEMOIZAR OBJETOS ESTABLES PARA EVITAR RE-RENDERS
  const stableCart = useMemo(() => cart.map(item => ({
    product: { ...item.product },
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.total_price,
    discount_amount: item.discount_amount,
    tax_amount: item.tax_amount
  })), [cart]);

  const stableCustomer = useMemo(() => selectedCustomer ? {
    id: selectedCustomer.id,
    name: selectedCustomer.name,
    email: selectedCustomer.email,
    whatsapp: selectedCustomer.whatsapp,
    membership_type: selectedCustomer.membership_type,
    points_balance: selectedCustomer.points_balance,
    total_purchases: selectedCustomer.total_purchases
  } : null, [selectedCustomer]);

  const stableCoupon = useMemo(() => appliedCoupon ? {
    id: appliedCoupon.id,
    code: appliedCoupon.code,
    discount_type: appliedCoupon.discount_type,
    discount_value: appliedCoupon.discount_value,
    min_amount: appliedCoupon.min_amount,
    max_uses: appliedCoupon.max_uses,
    current_uses: appliedCoupon.current_uses
  } : null, [appliedCoupon]);

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

  // ✅ TOTALES ESTABLES - EVITAR RE-RENDERS
  const totals = useMemo(() => {
    const subtotal = stableCart.reduce((sum, item) => sum + item.total_price, 0);
    const taxAmount = stableCart.reduce((sum, item) => sum + item.tax_amount, 0);
    const discountAmount = stableCart.reduce((sum, item) => sum + item.discount_amount, 0);
    const couponDiscount = stableCoupon ? calculateCouponDiscount(subtotal) : 0;
    const total = subtotal + taxAmount - discountAmount - couponDiscount;
    return {
      subtotal,
      taxAmount,
      discountAmount,
      couponDiscount,
      total: Math.max(total, 0)
    };
  }, [stableCart, stableCoupon, calculateCouponDiscount]);

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

  // ✅ CERRAR LAYAWAY DIALOG SOLO CUANDO NECESARIO
  const shouldCloseLayaway = cart.length === 0 && layawayDialogOpen;
  useEffect(() => {
    if (shouldCloseLayaway) {
      setLayawayDialogOpen(false);
    }
  }, [shouldCloseLayaway]);

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
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `1px solid ${darkProTokens.grayDark}`,
            color: darkProTokens.textPrimary,
            '&:hover': {
              boxShadow: `0 8px 32px ${darkProTokens.primary}30`,
              borderColor: darkProTokens.primary,
              transform: 'translateY(-2px)'
            },
            transition: 'all 0.3s ease',
            borderRadius: 3
          }}
          onClick={() => addToCart(product)}
        >
          <Box
            sx={{
              height: 120,
              background: product.image_url
                ? `url(${product.image_url}) center/cover`
                : `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: darkProTokens.background,
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
                backgroundColor: product.current_stock <= product.min_stock ? darkProTokens.warning : darkProTokens.success,
                color: darkProTokens.textPrimary
              }}
            />
          </Box>

          <CardContent sx={{ flexGrow: 1 }}>
            <Typography variant="h6" noWrap fontWeight="bold" gutterBottom sx={{ color: darkProTokens.textPrimary }}>
              {product.name}
            </Typography>
            {product.brand && (
              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }} gutterBottom>
                {product.brand}
              </Typography>
            )}
            <Chip 
              label={product.category} 
              size="small" 
              sx={{ 
                mb: 1,
                backgroundColor: `${darkProTokens.info}20`,
                color: darkProTokens.info,
                border: `1px solid ${darkProTokens.info}40`
              }} 
            />
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ color: darkProTokens.primary }} fontWeight="bold">
                {formatPrice(product.sale_price)}
              </Typography>
              {product.current_stock <= product.min_stock && (
                <Chip 
                  icon={<WarningIcon />} 
                  label="Stock Bajo" 
                  size="small" 
                  sx={{
                    backgroundColor: `${darkProTokens.warning}20`,
                    color: darkProTokens.warning,
                    border: `1px solid ${darkProTokens.warning}40`
                  }}
                />
              )}
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // ✅ DEBUG LOGGING
  console.log('🔍 POSPage Render:', {
    cartLength: cart.length,
    customerName: selectedCustomer?.name,
    layawayDialogOpen,
    totalsTotal: totals.total,
    timestamp: new Date().toISOString()
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
        color: darkProTokens.textPrimary,
        p: 2
      }}
    >
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

      <Grid container spacing={3}>
        {/* Panel izquierdo - Productos */}
        <Grid size={{ xs: 12, lg: 8 }}>
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
                  <CartIcon sx={{ fontSize: 50 }} />
                  Punto de Venta
                </Typography>
                <Typography variant="h6" sx={{ 
                  color: darkProTokens.textSecondary,
                  fontWeight: 300
                }}>
                  Sistema de Ventas | Gestión de Transacciones
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  startIcon={<ArrowBackIcon />}
                  onClick={() => router.push('/dashboard/admin')}
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
                  Dashboard
                </Button>

                <Button
                  variant="outlined"
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
                >
                  Actualizar
                </Button>
              </Box>
            </Box>

            {/* ✅ ESTADÍSTICAS CON DARK PRO SYSTEM */}
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Card sx={{ 
                  background: `${darkProTokens.success}10`, 
                  border: `1px solid ${darkProTokens.success}30`,
                  borderRadius: 3,
                  color: darkProTokens.textPrimary
                }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.success }}>
                          {formatPrice(salesStats.dailySales)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          Ventas del día
                        </Typography>
                      </Box>
                      <ReceiptIcon sx={{ fontSize: 40, color: darkProTokens.success, opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Card sx={{ 
                  background: `${darkProTokens.info}10`, 
                  border: `1px solid ${darkProTokens.info}30`,
                  borderRadius: 3,
                  color: darkProTokens.textPrimary
                }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.info }}>
                          {salesStats.dailyTransactions}
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          Transacciones
                        </Typography>
                      </Box>
                      <CartIcon sx={{ fontSize: 40, color: darkProTokens.info, opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Card sx={{ 
                  background: `${darkProTokens.warning}10`, 
                  border: `1px solid ${darkProTokens.warning}30`,
                  borderRadius: 3,
                  color: darkProTokens.textPrimary
                }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.warning }}>
                          {formatPrice(salesStats.avgTicket)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          Ticket promedio
                        </Typography>
                      </Box>
                      <StarIcon sx={{ fontSize: 40, color: darkProTokens.warning, opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>

          {/* ✅ FILTROS CON DARK PRO SYSTEM */}
          <Paper
            sx={{
              p: 3,
              mb: 3,
              background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 3,
              color: darkProTokens.textPrimary
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
                        <SearchIcon sx={{ color: darkProTokens.primary }} />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setSearchTerm('')}>
                          <ClearIcon sx={{ color: darkProTokens.textSecondary }} />
                        </IconButton>
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
              <Grid size={{ xs: 12, md: 4 }}>
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
                    onChange={e => setCategoryFilter(e.target.value)}
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
                  color: darkProTokens.textSecondary, 
                  pt: 2,
                  textAlign: 'center'
                }}>
                  {filteredProducts.length} productos
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* ✅ GRID DE PRODUCTOS CON DARK PRO SYSTEM */}
          <Paper
            sx={{
              p: 3,
              background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 3,
              color: darkProTokens.textPrimary
            }}
          >
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <CircularProgress sx={{ color: darkProTokens.primary }} size={60} thickness={4} />
              </Box>
            ) : filteredProducts.length === 0 ? (
              <Box textAlign="center" py={4}>
                <CategoryIcon sx={{ fontSize: 80, color: darkProTokens.textSecondary, mb: 2 }} />
                <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }} gutterBottom>
                  No se encontraron productos
                </Typography>
                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
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

        {/* ✅ PANEL DERECHO - CARRITO CON DARK PRO SYSTEM */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper
            sx={{
              p: 3,
              height: 'fit-content',
              background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 3,
              color: darkProTokens.textPrimary,
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
                  color: darkProTokens.textPrimary
                }}
              >
                <CartIcon sx={{ color: darkProTokens.primary }} />
                Carrito ({cart.length})
              </Typography>
              {cart.length > 0 && (
                <IconButton onClick={clearCart} sx={{ color: darkProTokens.error }}>
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
                    background: `${darkProTokens.success}20`,
                    border: `1px solid ${darkProTokens.success}`
                  }}
                >
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: darkProTokens.success }}>
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>
                          {selectedCustomer.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                          {selectedCustomer.email || selectedCustomer.whatsapp}
                        </Typography>
                        {selectedCustomer.membership_type && (
                          <Chip
                            label={selectedCustomer.membership_type}
                            size="small"
                            sx={{ 
                              ml: 1,
                              backgroundColor: `${darkProTokens.primary}20`,
                              color: darkProTokens.primary
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => setSelectedCustomer(null)}
                      sx={{ color: darkProTokens.error }}
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
                    borderColor: darkProTokens.primary,
                    color: darkProTokens.primary,
                    '&:hover': {
                      bgcolor: `${darkProTokens.primary}20`,
                      borderColor: darkProTokens.primary
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
                    background: `${darkProTokens.warning}20`,
                    border: `1px solid ${darkProTokens.warning}`
                  }}
                >
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: darkProTokens.warning }}>
                        <CouponIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>
                          {appliedCoupon.code}
                        </Typography>
                        <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                          -{formatPrice(totals.couponDiscount)}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton size="small" onClick={removeCoupon} sx={{ color: darkProTokens.error }}>
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
                          <CouponIcon sx={{ color: darkProTokens.primary }} />
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
                  <Button
                    variant="contained"
                    onClick={applyCoupon}
                    disabled={!couponCode.trim()}
                    sx={{
                      background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
                      color: darkProTokens.background,
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
                  <CartIcon sx={{ fontSize: 60, color: darkProTokens.textSecondary, mb: 2 }} />
                  <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                    El carrito está vacío
                  </Typography>
                  <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
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
                            border: `1px solid ${darkProTokens.grayDark}`,
                            borderRadius: 1,
                            mb: 1,
                            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
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
                              sx: { color: darkProTokens.textPrimary }
                            }}
                            secondaryTypographyProps={{
                              variant: 'body2',
                              component: 'div',
                              sx: {
                                color: darkProTokens.primary,
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
                              sx={{ color: darkProTokens.textSecondary }}
                            >
                              <RemoveIcon />
                            </IconButton>
                            <Typography
                              variant="body2"
                              fontWeight="bold"
                              sx={{ 
                                minWidth: 20, 
                                textAlign: 'center',
                                color: darkProTokens.textPrimary
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
                              sx={{ color: darkProTokens.textSecondary }}
                            >
                              <AddIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => removeFromCart(item.product.id)}
                              sx={{ color: darkProTokens.error }}
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
                            <Typography variant="body2" fontWeight="bold" sx={{ color: darkProTokens.primary }}>
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
                <Divider sx={{ mb: 2, borderColor: darkProTokens.grayDark }} />
                <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography sx={{ color: darkProTokens.textSecondary }}>Subtotal:</Typography>
                  <Typography sx={{ color: darkProTokens.textPrimary }}>{formatPrice(totals.subtotal)}</Typography>
                </Box>
                {totals.taxAmount > 0 && (
                  <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ color: darkProTokens.textSecondary }}>IVA:</Typography>
                    <Typography sx={{ color: darkProTokens.textPrimary }}>{formatPrice(totals.taxAmount)}</Typography>
                  </Box>
                )}
                {(totals.discountAmount + totals.couponDiscount) > 0 && (
                  <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ color: darkProTokens.error }}>Descuentos:</Typography>
                    <Typography sx={{ color: darkProTokens.error }}>
                      -{formatPrice(totals.discountAmount + totals.couponDiscount)}
                    </Typography>
                  </Box>
                )}
                <Divider sx={{ my: 1, borderColor: darkProTokens.grayDark }} />
                <Box display="flex" justifyContent="space-between" sx={{ mb: 3 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>
                    TOTAL:
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: darkProTokens.primary }}>
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
                        borderColor: darkProTokens.warning,
                        color: darkProTokens.warning,
                        '&:hover': {
                          bgcolor: `${darkProTokens.warning}20`,
                          borderColor: darkProTokens.warning
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
                        background: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})`,
                        color: darkProTokens.textPrimary,
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
                      backgroundColor: `${darkProTokens.info}10`,
                      color: darkProTokens.textPrimary,
                      border: `1px solid ${darkProTokens.info}30`,
                      '& .MuiAlert-icon': { color: darkProTokens.info }
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
        cart={stableCart}
        customer={stableCustomer}
        coupon={stableCoupon}
        totals={totals}
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
        totals={totals}
        onSuccess={() => {
          console.log('✅ LayawayDialog Success');
          handleSaleSuccess();
        }}
      />

      {/* FAB para scanner */}
      <Fab
        aria-label="scanner"
        sx={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
          color: darkProTokens.background,
          '&:hover': {
            background: `linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive})`,
            transform: 'scale(1.1)'
          }
        }}
        onClick={() => showNotification('Scanner en desarrollo', 'info')}
      >
        <ScannerIcon />
      </Fab>

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
