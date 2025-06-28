'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Avatar,
  LinearProgress,
  Chip,
  Paper,
  Stack,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Slider
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  CalendarToday as CalendarTodayIcon,
  AttachMoney as AttachMoneyIcon,
  People as PeopleIcon,
  ShoppingCart as ShoppingCartIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  CreditCard as CreditCardIcon,
  Category as CategoryIcon,
  AccountBalance as AccountBalanceIcon,
  Speed as SpeedIcon,
  Settings as SettingsIcon,
  Fullscreen as FullscreenIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Receipt as ReceiptIcon,
  Analytics as AnalyticsIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
  DateRange as DateRangeIcon,
  InsertChart as InsertChartIcon,
  ShowChart as ShowChartIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, ComposedChart, Area
} from 'recharts';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

// 🎨 DARK PRO SYSTEM - TOKENS ENTERPRISE (igual que el dashboard principal)
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
  success: '#388E3C',
  successHover: '#2E7D32',
  error: '#D32F2F',
  errorHover: '#B71C1C',
  warning: '#FFB300',
  warningHover: '#E6A700',
  info: '#1976D2',
  infoHover: '#1565C0',
  roleAdmin: '#E91E63',
  roleStaff: '#1976D2',
  roleTrainer: '#009688',
  roleModerator: '#9C27B0',
  chart1: '#FFCC00',
  chart2: '#388E3C',
  chart3: '#1976D2',
  chart4: '#FFB300',
  chart5: '#9C27B0',
  chart6: '#D32F2F',
  chart7: '#009688',
  chart8: '#E91E63'
};

// 🎨 CONFIGURACIÓN DE COLORES PERSONALIZABLE (igual que el dashboard)
const colorSchemes = {
  default: {
    primary: '#FFCC00',
    secondary: '#388E3C',
    tertiary: '#1976D2',
    quaternary: '#FFB300'
  },
  ocean: {
    primary: '#0077BE',
    secondary: '#00A8CC',
    tertiary: '#40E0D0',
    quaternary: '#87CEEB'
  },
  sunset: {
    primary: '#FF6B35',
    secondary: '#F7931E',
    tertiary: '#FFD23F',
    quaternary: '#FF006E'
  },
  forest: {
    primary: '#2E8B57',
    secondary: '#228B22',
    tertiary: '#32CD32',
    quaternary: '#90EE90'
  },
  purple: {
    primary: '#8A2BE2',
    secondary: '#9932CC',
    tertiary: '#BA55D3',
    quaternary: '#DDA0DD'
  },
  fire: {
    primary: '#DC143C',
    secondary: '#FF4500',
    tertiary: '#FF6347',
    quaternary: '#FFA07A'
  }
};

// ✅ FUNCIONES HELPER (iguales al dashboard principal)
function formatPrice(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(amount || 0);
}

function safePercentage(value, total) {
  if (total === 0 || isNaN(total) || isNaN(value)) return '0.0';
  const percentage = (value / total) * 100;
  if (!isFinite(percentage)) return '0.0';
  return percentage.toFixed(1);
}

function getMexicoDateLocal() {
  const now = new Date();
  const mexicoDate = new Date(now.toLocaleString("en-US", {timeZone: "America/Mexico_City"}));
  const year = mexicoDate.getFullYear();
  const month = String(mexicoDate.getMonth() + 1).padStart(2, '0');
  const day = String(mexicoDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatMexicoTimeLocal(date) {
  return date.toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

function formatDateTime(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('es-MX', {
      timeZone: 'America/Mexico_City',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    return dateString;
  }
}

// ============= FUNCIONES DE CONSULTA REALES (usando el patrón del dashboard principal) =============
const supabase = createBrowserSupabaseClient();

const getDashboardMetrics = async (fechas) => {
  try {
    console.log('📊 Obteniendo métricas del dashboard...', fechas);

    // Ingresos por membresías
    const { data: membresías, error: errorMembresías } = await supabase
      .from('user_memberships')
      .select('amount_paid, status')
      .gte('created_at', fechas.fechaInicio)
      .lte('created_at', fechas.fechaFin);

    if (errorMembresías) throw errorMembresías;

    // Ingresos por ventas POS
    const { data: ventas, error: errorVentas } = await supabase
      .from('sales')
      .select('total_amount, status, sale_type')
      .gte('created_at', fechas.fechaInicio)
      .lte('created_at', fechas.fechaFin)
      .eq('status', 'completed');

    if (errorVentas) throw errorVentas;

    // Gastos totales
    const { data: gastos, error: errorGastos } = await supabase
      .from('expenses')
      .select('amount')
      .gte('expense_date', fechas.fechaInicio)
      .lte('expense_date', fechas.fechaFin)
      .eq('status', 'active');

    if (errorGastos) throw errorGastos;

    // Usuarios totales
    const { count: usuariosTotales, error: errorUsuarios } = await supabase
      .from('Users')
      .select('*', { count: 'exact', head: true });

    if (errorUsuarios) throw errorUsuarios;

    // Membresías activas
    const { data: membresiasActivas, error: errorMembresiasActivas } = await supabase
      .from('user_memberships')
      .select('userid, status')
      .eq('status', 'active');

    if (errorMembresiasActivas) throw errorMembresiasActivas;

    // Apartados activos
    const { data: apartados, error: errorApartados } = await supabase
      .from('sales')
      .select('pending_amount, status')
      .eq('sale_type', 'layaway')
      .in('status', ['pending', 'partial']);

    if (errorApartados) throw errorApartados;

    // Calcular métricas
    const ingresosMembresías = membresías?.reduce((sum, m) => sum + (Number(m.amount_paid) || 0), 0) || 0;
    const ingresosVentas = ventas?.filter(v => v.sale_type !== 'layaway')
      .reduce((sum, v) => sum + (Number(v.total_amount) || 0), 0) || 0;
    const totalIngresos = ingresosMembresías + ingresosVentas;
    const totalGastos = gastos?.reduce((sum, g) => sum + (Number(g.amount) || 0), 0) || 0;

    console.log('✅ Métricas obtenidas:', { totalIngresos, totalGastos, ingresosMembresías, ingresosVentas });

    return {
      totalIngresos,
      totalGastos,
      utilidadNeta: totalIngresos - totalGastos,
      membresiasTotales: membresías?.length || 0,
      membresiasActivas: membresiasActivas?.length || 0,
      membresiasVencidas: 0,
      ingresosMembresías,
      ventasPOSTotales: ingresosVentas,
      apartadosActivos: apartados?.length || 0,
      apartadosPendientes: apartados?.reduce((sum, a) => sum + (Number(a.pending_amount) || 0), 0) || 0,
      productosVendidos: ventas?.length || 0,
      usuariosTotales: usuariosTotales || 0,
      usuariosActivos: new Set(membresiasActivas?.map(u => u.userid)).size || 0,
      nuevosUsuarios: 0
    };
  } catch (error) {
    console.error('❌ Error obteniendo métricas:', error);
    return {
      totalIngresos: 0, totalGastos: 0, utilidadNeta: 0, membresiasTotales: 0,
      membresiasActivas: 0, membresiasVencidas: 0, ingresosMembresías: 0,
      ventasPOSTotales: 0, apartadosActivos: 0, apartadosPendientes: 0,
      productosVendidos: 0, usuariosTotales: 0, usuariosActivos: 0, nuevosUsuarios: 0
    };
  }
};

const getVentasPorMetodo = async (fechas) => {
  try {
    console.log('💳 Obteniendo ventas por método de pago...');

    // Ventas POS
    const { data: ventasPOS, error: errorPOS } = await supabase
      .from('sale_payment_details')
      .select(`
        payment_method,
        amount,
        commission_amount,
        sales!inner(created_at, status)
      `)
      .gte('sales.created_at', fechas.fechaInicio)
      .lte('sales.created_at', fechas.fechaFin)
      .eq('sales.status', 'completed');

    if (errorPOS) throw errorPOS;

    // Membresías
    const { data: ventasMembresías, error: errorMembresías } = await supabase
      .from('membership_payment_details')
      .select(`
        payment_method,
        amount,
        commission_amount,
        user_memberships!inner(created_at)
      `)
      .gte('user_memberships.created_at', fechas.fechaInicio)
      .lte('user_memberships.created_at', fechas.fechaFin);

    if (errorMembresías) throw errorMembresías;

    // Combinar y agrupar por método
    const metodosMap = new Map();

    ventasPOS?.forEach(venta => {
      const metodo = venta.payment_method || 'Sin especificar';
      const existing = metodosMap.get(metodo) || { metodo, total: 0, transacciones: 0, comisiones: 0 };
      existing.total += Number(venta.amount) || 0;
      existing.transacciones += 1;
      existing.comisiones += Number(venta.commission_amount) || 0;
      metodosMap.set(metodo, existing);
    });

    ventasMembresías?.forEach(venta => {
      const metodo = venta.payment_method || 'Sin especificar';
      const existing = metodosMap.get(metodo) || { metodo, total: 0, transacciones: 0, comisiones: 0 };
      existing.total += Number(venta.amount) || 0;
      existing.transacciones += 1;
      existing.comisiones += Number(venta.commission_amount) || 0;
      metodosMap.set(metodo, existing);
    });

    const resultado = Array.from(metodosMap.values()).sort((a, b) => b.total - a.total);
    console.log('✅ Ventas por método obtenidas:', resultado);
    return resultado;
  } catch (error) {
    console.error('❌ Error obteniendo ventas por método:', error);
    return [];
  }
};

const getVentasPorCategoria = async (fechas) => {
  try {
    console.log('🛍️ Obteniendo ventas por categoría...');

    const { data, error } = await supabase
      .from('sale_items')
      .select(`
        quantity,
        total_price,
        products!inner(category),
        sales!inner(created_at, status)
      `)
      .gte('sales.created_at', fechas.fechaInicio)
      .lte('sales.created_at', fechas.fechaFin)
      .eq('sales.status', 'completed');

    if (error) throw error;

    const categoriasMap = new Map();

    data?.forEach(item => {
      const categoria = item.products?.category || 'Sin categoría';
      const existing = categoriasMap.get(categoria) || { categoria, total: 0, cantidad: 0, productos: 0 };
      existing.total += Number(item.total_price) || 0;
      existing.cantidad += Number(item.quantity) || 0;
      existing.productos += 1;
      categoriasMap.set(categoria, existing);
    });

    const resultado = Array.from(categoriasMap.values()).sort((a, b) => b.total - a.total);
    console.log('✅ Ventas por categoría obtenidas:', resultado);
    return resultado;
  } catch (error) {
    console.error('❌ Error obteniendo ventas por categoría:', error);
    return [];
  }
};

const getGastosPorTipo = async (fechas) => {
  try {
    console.log('💸 Obteniendo gastos por tipo...');

    const { data, error } = await supabase
      .from('expenses')
      .select('expense_type, amount')
      .gte('expense_date', fechas.fechaInicio)
      .lte('expense_date', fechas.fechaFin)
      .eq('status', 'active');

    if (error) throw error;

    const tiposMap = new Map();
    let totalGeneral = 0;

    data?.forEach(gasto => {
      const tipo = gasto.expense_type || 'otros';
      const amount = Number(gasto.amount) || 0;
      const existing = tiposMap.get(tipo) || { total: 0, count: 0 };
      existing.total += amount;
      existing.count += 1;
      totalGeneral += amount;
      tiposMap.set(tipo, existing);
    });

    const resultado = Array.from(tiposMap.entries()).map(([tipo, datos]) => ({
      tipo: tipo.charAt(0).toUpperCase() + tipo.slice(1),
      total: datos.total,
      transacciones: datos.count,
      porcentaje: totalGeneral > 0 ? (datos.total / totalGeneral) * 100 : 0
    })).sort((a, b) => b.total - a.total);

    console.log('✅ Gastos por tipo obtenidos:', resultado);
    return resultado;
  } catch (error) {
    console.error('❌ Error obteniendo gastos por tipo:', error);
    return [];
  }
};

const getVentasDiarias = async (fechas) => {
  try {
    console.log('📈 Obteniendo ventas diarias...');

    const { data: cortes, error } = await supabase
      .from('cash_cuts')
      .select('*')
      .gte('cut_date', fechas.fechaInicio)
      .lte('cut_date', fechas.fechaFin)
      .order('cut_date');

    if (error) throw error;

    const resultado = cortes?.map(corte => ({
      fecha: new Date(corte.cut_date).toLocaleDateString('es-MX', { 
        month: 'short', 
        day: 'numeric' 
      }),
      membresías: Number(corte.membership_total) || 0,
      pos: Number(corte.pos_total) || 0,
      abonos: Number(corte.abonos_total) || 0,
      gastos: Number(corte.expenses_amount) || 0,
      neto: Number(corte.final_balance) || 0
    })) || [];

    console.log('✅ Ventas diarias obtenidas:', resultado);
    return resultado;
  } catch (error) {
    console.error('❌ Error obteniendo ventas diarias:', error);
    return [];
  }
};

// ✅ COMPONENTE PRINCIPAL
export default function ReportesPage() {
  const [config, setConfig] = useState({
    colorScheme: 'default',
    showAnimations: true,
    compactMode: false
  });

  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [fullscreenChart, setFullscreenChart] = useState(null);
  
  const [fechas, setFechas] = useState({
    fechaInicio: '2025-06-01',
    fechaFin: '2025-06-30'
  });
  
  const [metrics, setMetrics] = useState(null);
  const [ventasMetodo, setVentasMetodo] = useState([]);
  const [ventasCategoria, setVentasCategoria] = useState([]);
  const [gastosTipo, setGastosTipo] = useState([]);
  const [ventasDiarias, setVentasDiarias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [currentMexicoTime, setCurrentMexicoTime] = useState('');

  const currentColors = colorSchemes[config.colorScheme];

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const mexicoTime = formatMexicoTimeLocal(now);
      setCurrentMexicoTime(mexicoTime);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [fechas]);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const [metricsData, ventasMetodoData, ventasCategoriaData, gastosTipoData, ventasDiariasData] = 
        await Promise.all([
          getDashboardMetrics(fechas),
          getVentasPorMetodo(fechas),
          getVentasPorCategoria(fechas),
          getGastosPorTipo(fechas),
          getVentasDiarias(fechas)
        ]);

      setMetrics(metricsData);
      setVentasMetodo(ventasMetodoData);
      setVentasCategoria(ventasCategoriaData);
      setGastosTipo(gastosTipoData);
      setVentasDiarias(ventasDiariasData);
      setLastUpdate(formatDateTime(new Date().toISOString()));
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error al cargar los datos. Verifica tu conexión a Supabase.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await cargarDatos();
  };

  // ✅ COMPONENTE DE MÉTRICA (estilo dashboard principal)
  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon, 
    color, 
    onClick
  }) => (
    <motion.div
      whileHover={{ scale: config.showAnimations ? 1.02 : 1, y: config.showAnimations ? -5 : 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{
        background: `linear-gradient(135deg, ${color}, ${color}DD)`,
        color: darkProTokens.textPrimary,
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        border: `1px solid ${color}40`,
        boxShadow: `0 8px 32px ${color}20`,
        minHeight: config.compactMode ? '160px' : { xs: '180px', sm: '200px', md: '220px' },
        '&:hover': { 
          boxShadow: `0 16px 48px ${color}40`,
          border: `1px solid ${color}60`
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${currentColors.primary}, ${color})`
        }
      }}
      onClick={onClick}
      >
        <CardContent sx={{ p: config.compactMode ? { xs: 1.5, sm: 2 } : { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Avatar sx={{ 
              bgcolor: `${darkProTokens.textPrimary}15`, 
              width: config.compactMode ? { xs: 40, sm: 48 } : { xs: 48, sm: 56, md: 64 }, 
              height: config.compactMode ? { xs: 40, sm: 48 } : { xs: 48, sm: 56, md: 64 },
              border: `2px solid ${darkProTokens.textPrimary}20`
            }}>
              {React.cloneElement(icon, { 
                sx: { fontSize: config.compactMode ? { xs: 20, sm: 24 } : { xs: 24, sm: 28, md: 32 }, color: darkProTokens.textPrimary }
              })}
            </Avatar>
          </Box>
          
          <Typography variant="h3" sx={{ 
            fontWeight: 800, 
            mb: 1,
            fontSize: config.compactMode ? { xs: '1.2rem', sm: '1.5rem' } : { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
            background: `linear-gradient(45deg, ${darkProTokens.textPrimary}, ${currentColors.primary})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {value}
          </Typography>
          
          <Typography variant="h6" sx={{ 
            opacity: 0.9, 
            fontWeight: 600,
            fontSize: config.compactMode ? { xs: '0.8rem', sm: '0.9rem' } : { xs: '0.9rem', sm: '1rem', md: '1.25rem' },
            textShadow: `0 2px 4px ${color}40`
          }}>
            {title}
          </Typography>
          
          {subtitle && (
            <Typography variant="body2" sx={{ 
              opacity: 0.7, 
              mt: 1,
              fontSize: config.compactMode ? { xs: '0.65rem', sm: '0.7rem' } : { xs: '0.75rem', sm: '0.8rem', md: '0.85rem' }
            }}>
              {subtitle}
            </Typography>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  const COLORS = [currentColors.primary, currentColors.secondary, currentColors.tertiary, currentColors.quaternary, darkProTokens.chart5];

  if (loading) {
    return (
      <Box sx={{ 
        p: 3,
        background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <motion.div
            animate={config.showAnimations ? { 
              scale: [1, 1.1, 1],
              rotate: [0, 360]
            } : {}}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Avatar sx={{ 
              bgcolor: currentColors.primary, 
              width: 100, 
              height: 100,
              mx: 'auto',
              mb: 3,
              boxShadow: `0 0 40px ${currentColors.primary}60`
            }}>
              <AssessmentIcon sx={{ fontSize: 50 }} />
            </Avatar>
          </motion.div>
          
          <Typography variant="h4" sx={{ 
            color: currentColors.primary, 
            fontWeight: 800,
            mb: 2,
            textShadow: `0 0 20px ${currentColors.primary}40`
          }}>
            Reportes MUP
          </Typography>
          <Typography variant="h6" sx={{ color: darkProTokens.textSecondary, mb: 3 }}>
            Cargando análisis avanzado del gimnasio...
          </Typography>
          
          <LinearProgress sx={{
            width: '300px',
            height: 6,
            borderRadius: 3,
            bgcolor: darkProTokens.grayDark,
            mt: 3,
            mx: 'auto',
            '& .MuiLinearProgress-bar': {
              bgcolor: currentColors.primary,
              borderRadius: 3,
              boxShadow: `0 0 10px ${currentColors.primary}40`
            }
          }} />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        p: 3,
        background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Box sx={{ textAlign: 'center', maxWidth: 'md', mx: 'auto' }}>
          <Paper sx={{
            p: 4,
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `1px solid ${darkProTokens.error}40`,
            borderRadius: 4
          }}>
            <Avatar sx={{ 
              bgcolor: darkProTokens.error, 
              width: 80, 
              height: 80,
              mx: 'auto',
              mb: 3
            }}>
              <AssessmentIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h5" sx={{ color: darkProTokens.error, mb: 2, fontWeight: 700 }}>
              Error al cargar reportes
            </Typography>
            <Typography variant="body1" sx={{ color: darkProTokens.textSecondary, mb: 3 }}>
              {error}
            </Typography>
            <Button
              onClick={cargarDatos}
              variant="contained"
              startIcon={<RefreshIcon />}
              sx={{
                background: `linear-gradient(135deg, ${currentColors.primary}, ${currentColors.primary}DD)`,
                fontWeight: 700,
                px: 4,
                py: 1.5
              }}
            >
              Reintentar
            </Button>
          </Paper>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3 },
      background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
      minHeight: '100vh',
      color: darkProTokens.textPrimary
    }}>
      {/* SNACKBAR DE ERROR */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={8000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setError(null)} 
          severity="error" 
          variant="filled"
          sx={{
            background: `linear-gradient(135deg, ${darkProTokens.error}, ${darkProTokens.errorHover})`,
            color: darkProTokens.textPrimary,
            fontWeight: 600,
            borderRadius: 3
          }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Paper sx={{
          p: config.compactMode ? { xs: 2, sm: 3 } : { xs: 3, sm: 4 },
          mb: 4,
          background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
          border: `1px solid ${darkProTokens.grayDark}`,
          borderRadius: 4,
          backdropFilter: 'blur(20px)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${currentColors.primary}, ${currentColors.secondary}, ${currentColors.tertiary})`
          }
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, sm: 3 } }}>
              <motion.div
                animate={config.showAnimations ? { 
                  scale: [1, 1.05, 1],
                  boxShadow: [
                    `0 0 20px ${currentColors.primary}40`,
                    `0 0 40px ${currentColors.primary}60`,
                    `0 0 20px ${currentColors.primary}40`
                  ]
                } : {}}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Avatar sx={{ 
                  bgcolor: currentColors.primary, 
                  width: config.compactMode ? { xs: 50, sm: 60 } : { xs: 60, sm: 80, md: 90 }, 
                  height: config.compactMode ? { xs: 50, sm: 60 } : { xs: 60, sm: 80, md: 90 },
                  border: `3px solid ${currentColors.primary}40`
                }}>
                  <AnalyticsIcon sx={{ fontSize: config.compactMode ? { xs: 25, sm: 30 } : { xs: 30, sm: 40, md: 45 } }} />
                </Avatar>
              </motion.div>
              
              <Box>
                <Typography variant="h3" sx={{ 
                  color: currentColors.primary, 
                  fontWeight: 800,
                  textShadow: `0 0 20px ${currentColors.primary}40`,
                  mb: 1,
                  fontSize: config.compactMode ? { xs: '1.5rem', sm: '2rem' } : { xs: '1.8rem', sm: '2.5rem', md: '3rem' },
                  background: `linear-gradient(45deg, ${currentColors.primary}, ${currentColors.secondary})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  📊 Reportes y Analytics
                </Typography>
                <Typography variant="h6" sx={{ 
                  color: darkProTokens.textSecondary, 
                  mb: 1,
                  fontSize: config.compactMode ? { xs: '0.8rem', sm: '0.9rem' } : { xs: '0.9rem', sm: '1rem', md: '1.25rem' }
                }}>
                  🚀 MuscleUp Gym - Business Intelligence
                </Typography>
                <Typography variant="body1" sx={{ 
                  color: darkProTokens.info, 
                  fontWeight: 600,
                  fontSize: config.compactMode ? { xs: '0.7rem', sm: '0.8rem' } : { xs: '0.8rem', sm: '0.9rem', md: '1rem' }
                }}>
                  ⏰ {currentMexicoTime}
                </Typography>
                {lastUpdate && (
                  <Typography variant="caption" sx={{ 
                    color: darkProTokens.success,
                    fontWeight: 600,
                    fontSize: config.compactMode ? { xs: '0.65rem', sm: '0.7rem' } : { xs: '0.7rem', sm: '0.75rem' }
                  }}>
                    ✅ Actualizado: {lastUpdate}
                  </Typography>
                )}
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip
                icon={<SpeedIcon />}
                label="Real Time"
                size="medium"
                sx={{
                  bgcolor: `${currentColors.secondary}20`,
                  color: currentColors.secondary,
                  border: `1px solid ${currentColors.secondary}40`,
                  fontWeight: 700,
                  fontSize: { xs: '0.7rem', sm: '0.9rem' }
                }}
              />

              <IconButton
                onClick={() => setConfigDialogOpen(true)}
                sx={{
                  bgcolor: `${currentColors.tertiary}20`,
                  color: currentColors.tertiary,
                  border: `1px solid ${currentColors.tertiary}40`,
                  '&:hover': {
                    bgcolor: `${currentColors.tertiary}30`,
                  }
                }}
              >
                <SettingsIcon />
              </IconButton>
              
              <Button
                size="large"
                startIcon={refreshing ? <CircularProgress size={24} sx={{ color: darkProTokens.background }} /> : <RefreshIcon />}
                onClick={handleRefresh}
                disabled={refreshing}
                variant="contained"
                sx={{ 
                  background: `linear-gradient(135deg, ${darkProTokens.info}, ${darkProTokens.infoHover})`,
                  fontWeight: 700,
                  px: { xs: 3, sm: 4 },
                  py: { xs: 1, sm: 1.5 },
                  borderRadius: 3,
                  fontSize: config.compactMode ? { xs: '0.7rem', sm: '0.8rem' } : { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                  boxShadow: `0 8px 32px ${darkProTokens.info}30`,
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: `0 12px 48px ${darkProTokens.info}50`
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {refreshing ? 'Actualizando...' : 'Actualizar Datos'}
              </Button>
            </Box>
          </Box>

          {/* FILTROS DE FECHA */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 2, sm: 4 },
            p: config.compactMode ? { xs: 2, sm: 3 } : { xs: 3, sm: 4 },
            background: `linear-gradient(135deg, ${currentColors.secondary}15, ${currentColors.primary}10)`,
            borderRadius: 3,
            border: `1px solid ${currentColors.secondary}30`,
            backdropFilter: 'blur(10px)',
            flexWrap: 'wrap'
          }}>
            <CalendarTodayIcon sx={{ color: currentColors.primary, fontSize: 28 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1" sx={{ 
                color: darkProTokens.textPrimary, 
                fontWeight: 600,
                fontSize: config.compactMode ? { xs: '0.8rem', sm: '0.9rem' } : { xs: '0.9rem', sm: '1rem' }
              }}>
                Desde:
              </Typography>
              <input
                type="date"
                value={fechas.fechaInicio}
                onChange={(e) => setFechas(prev => ({ ...prev, fechaInicio: e.target.value }))}
                style={{
                  border: `1px solid ${currentColors.primary}40`,
                  borderRadius: '8px',
                  padding: '8px 12px',
                  background: darkProTokens.surfaceLevel3,
                  color: darkProTokens.textPrimary,
                  fontSize: '14px'
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1" sx={{ 
                color: darkProTokens.textPrimary, 
                fontWeight: 600,
                fontSize: config.compactMode ? { xs: '0.8rem', sm: '0.9rem' } : { xs: '0.9rem', sm: '1rem' }
              }}>
                Hasta:
              </Typography>
              <input
                type="date"
                value={fechas.fechaFin}
                onChange={(e) => setFechas(prev => ({ ...prev, fechaFin: e.target.value }))}
                style={{
                  border: `1px solid ${currentColors.primary}40`,
                  borderRadius: '8px',
                  padding: '8px 12px',
                  background: darkProTokens.surfaceLevel3,
                  color: darkProTokens.textPrimary,
                  fontSize: '14px'
                }}
              />
            </Box>
          </Box>
        </Paper>
      </motion.div>

      {/* MÉTRICAS PRINCIPALES */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} lg={3}>
            <MetricCard
              title="Ingresos Totales"
              value={formatPrice(metrics?.totalIngresos || 0)}
              icon={<AttachMoneyIcon />}
              color={currentColors.primary}
              subtitle={`+12.5% vs periodo anterior`}
            />
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <MetricCard
              title="Utilidad Neta"
              value={formatPrice(metrics?.utilidadNeta || 0)}
              icon={<AccountBalanceIcon />}
              color={currentColors.secondary}
              subtitle={`Ingresos - Gastos`}
            />
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <MetricCard
              title="Membresías Activas"
              value={metrics?.membresiasActivas || 0}
              icon={<PeopleIcon />}
              color={currentColors.tertiary}
              subtitle={`${metrics?.membresiasTotales || 0} vendidas en total`}
            />
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <MetricCard
              title="Ventas POS"
              value={formatPrice(metrics?.ventasPOSTotales || 0)}
              icon={<ShoppingCartIcon />}
              color={currentColors.quaternary}
              subtitle={`${metrics?.productosVendidos || 0} productos vendidos`}
            />
          </Grid>
        </Grid>
      </motion.div>

      {/* GRÁFICOS PRINCIPALES */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
          {/* Ventas diarias */}
          <Grid item xs={12} lg={8}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 4,
              overflow: 'hidden'
            }}>
              <CardContent sx={{ p: config.compactMode ? { xs: 2, sm: 3 } : { xs: 2, sm: 4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TimelineIcon sx={{ color: currentColors.primary, fontSize: 28 }} />
                    <Typography variant="h6" sx={{ 
                      color: currentColors.primary, 
                      fontWeight: 700,
                      fontSize: config.compactMode ? { xs: '0.9rem', sm: '1rem' } : { xs: '1rem', sm: '1.25rem' }
                    }}>
                      📈 Tendencias de Ventas
                    </Typography>
                  </Box>
                  <IconButton 
                    onClick={() => setFullscreenChart('ventas')}
                    sx={{ color: darkProTokens.textSecondary }}
                  >
                    <FullscreenIcon />
                  </IconButton>
                </Box>
                
                <Box sx={{ height: config.compactMode ? 250 : { xs: 250, sm: 300, md: 350 }, width: '100%' }}>
                  {ventasDiarias.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={ventasDiarias} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={darkProTokens.grayDark} />
                        <XAxis 
                          dataKey="fecha" 
                          stroke={darkProTokens.textSecondary}
                          fontSize={12}
                        />
                        <YAxis 
                          stroke={darkProTokens.textSecondary}
                          fontSize={12}
                          tickFormatter={(value) => formatPrice(value)}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: darkProTokens.surfaceLevel4,
                            border: `1px solid ${darkProTokens.grayDark}`,
                            borderRadius: '8px',
                            color: darkProTokens.textPrimary
                          }}
                          formatter={(value, name) => [formatPrice(value), name]}
                        />
                        <Legend />
                        
                        <Area
                          type="monotone"
                          dataKey="membresías"
                          fill={`${currentColors.secondary}30`}
                          stroke={currentColors.secondary}
                          strokeWidth={3}
                          name="Membresías"
                        />
                        
                        <Bar
                          dataKey="pos"
                          fill={currentColors.primary}
                          name="Ventas POS"
                          radius={[4, 4, 0, 0]}
                        />
                        
                        <Line
                          type="monotone"
                          dataKey="neto"
                          stroke={currentColors.tertiary}
                          strokeWidth={3}
                          dot={{ fill: currentColors.tertiary, strokeWidth: 2, r: 6 }}
                          name="Total Neto"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexDirection: 'column',
                      gap: 2
                    }}>
                      <TimelineIcon sx={{ fontSize: { xs: 60, sm: 80 }, color: darkProTokens.grayMuted, opacity: 0.5 }} />
                      <Typography variant="h6" sx={{ color: darkProTokens.textSecondary, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                        Sin datos disponibles
                      </Typography>
                      <Typography variant="body2" sx={{ color: darkProTokens.textDisabled, textAlign: 'center', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                        Los gráficos aparecerán cuando haya datos<br />
                        en el rango de fechas seleccionado
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Ventas por método de pago */}
          <Grid item xs={12} lg={4}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 4,
              height: '100%'
            }}>
              <CardContent sx={{ p: config.compactMode ? { xs: 2, sm: 3 } : { xs: 2, sm: 4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CreditCardIcon sx={{ color: currentColors.tertiary, fontSize: 28 }} />
                    <Typography variant="h6" sx={{ 
                      color: currentColors.tertiary, 
                      fontWeight: 700,
                      fontSize: config.compactMode ? { xs: '0.9rem', sm: '1rem' } : { xs: '1rem', sm: '1.25rem' }
                    }}>
                      💳 Métodos de Pago
                    </Typography>
                  </Box>
                  <IconButton 
                    onClick={() => setFullscreenChart('pagos')}
                    sx={{ color: darkProTokens.textSecondary }}
                  >
                    <FullscreenIcon />
                  </IconButton>
                </Box>
                
                {ventasMetodo.length > 0 ? (
                  <Box sx={{ height: config.compactMode ? { xs: 180, sm: 200 } : { xs: 220, sm: 250, md: 280 }, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={ventasMetodo}
                          cx="50%"
                          cy="50%"
                          outerRadius={config.compactMode ? 70 : 90}
                          innerRadius={config.compactMode ? 40 : 50}
                          paddingAngle={5}
                          dataKey="total"
                          label={({ metodo, total }) => {
                            const totalGeneral = ventasMetodo.reduce((sum, item) => sum + item.total, 0);
                            const porcentaje = totalGeneral > 0 ? (total / totalGeneral * 100).toFixed(1) : '0';
                            return `${metodo} (${porcentaje}%)`;
                          }}
                        >
                          {ventasMetodo.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: darkProTokens.surfaceLevel4,
                            border: `1px solid ${darkProTokens.grayDark}`,
                            borderRadius: '8px',
                            color: darkProTokens.textPrimary
                          }}
                          formatter={(value) => formatPrice(value)}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                ) : (
                  <Box sx={{ 
                    height: config.compactMode ? { xs: 180, sm: 200 } : { xs: 220, sm: 250, md: 280 }, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 2
                  }}>
                    <CreditCardIcon sx={{ fontSize: config.compactMode ? { xs: 35, sm: 45 } : { xs: 40, sm: 60 }, color: darkProTokens.grayMuted, opacity: 0.5 }} />
                    <Typography variant="body1" sx={{ 
                      color: darkProTokens.textSecondary, 
                      fontSize: config.compactMode ? { xs: '0.8rem', sm: '0.9rem' } : { xs: '0.9rem', sm: '1rem' }
                    }}>
                      Sin datos de pagos
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>

      {/* GRÁFICOS SECUNDARIOS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
          {/* Ventas por categoría */}
          <Grid item xs={12} lg={6}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 4
            }}>
              <CardContent sx={{ p: config.compactMode ? { xs: 2, sm: 3 } : { xs: 2, sm: 4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <CategoryIcon sx={{ color: currentColors.primary, fontSize: 28 }} />
                  <Typography variant="h6" sx={{ 
                    color: currentColors.primary, 
                    fontWeight: 700,
                    fontSize: config.compactMode ? { xs: '0.9rem', sm: '1rem' } : { xs: '1rem', sm: '1.25rem' }
                  }}>
                    🛍️ Ventas por Categoría
                  </Typography>
                </Box>
                
                <Box sx={{ height: config.compactMode ? 250 : { xs: 250, sm: 300 }, width: '100%' }}>
                  {ventasCategoria.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ventasCategoria}>
                        <CartesianGrid strokeDasharray="3 3" stroke={darkProTokens.grayDark} />
                        <XAxis 
                          dataKey="categoria" 
                          stroke={darkProTokens.textSecondary}
                          fontSize={12}
                        />
                        <YAxis 
                          stroke={darkProTokens.textSecondary}
                          fontSize={12}
                          tickFormatter={(value) => formatPrice(value)}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: darkProTokens.surfaceLevel4,
                            border: `1px solid ${darkProTokens.grayDark}`,
                            borderRadius: '8px',
                            color: darkProTokens.textPrimary
                          }}
                          formatter={(value) => formatPrice(value)}
                        />
                        <Bar dataKey="total" fill={currentColors.primary} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexDirection: 'column',
                      gap: 2
                    }}>
                      <CategoryIcon sx={{ fontSize: { xs: 40, sm: 60 }, color: darkProTokens.grayMuted, opacity: 0.5 }} />
                      <Typography variant="body1" sx={{ color: darkProTokens.textSecondary }}>
                        Sin ventas por categoría
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Gastos por tipo */}
          <Grid item xs={12} lg={6}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 4
            }}>
              <CardContent sx={{ p: config.compactMode ? { xs: 2, sm: 3 } : { xs: 2, sm: 4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <TrendingDownIcon sx={{ color: darkProTokens.error, fontSize: 28 }} />
                  <Typography variant="h6" sx={{ 
                    color: darkProTokens.error, 
                    fontWeight: 700,
                    fontSize: config.compactMode ? { xs: '0.9rem', sm: '1rem' } : { xs: '1rem', sm: '1.25rem' }
                  }}>
                    💸 Gastos por Tipo
                  </Typography>
                </Box>
                
                <Box sx={{ height: config.compactMode ? 250 : { xs: 250, sm: 300 }, width: '100%' }}>
                  {gastosTipo.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={gastosTipo}>
                        <CartesianGrid strokeDasharray="3 3" stroke={darkProTokens.grayDark} />
                        <XAxis 
                          dataKey="tipo" 
                          stroke={darkProTokens.textSecondary}
                          fontSize={12}
                        />
                        <YAxis 
                          stroke={darkProTokens.textSecondary}
                          fontSize={12}
                          tickFormatter={(value) => formatPrice(value)}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: darkProTokens.surfaceLevel4,
                            border: `1px solid ${darkProTokens.grayDark}`,
                            borderRadius: '8px',
                            color: darkProTokens.textPrimary
                          }}
                          formatter={(value) => formatPrice(value)}
                        />
                        <Bar dataKey="total" fill={darkProTokens.error} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexDirection: 'column',
                      gap: 2
                    }}>
                      <ReceiptIcon sx={{ fontSize: { xs: 40, sm: 60 }, color: darkProTokens.grayMuted, opacity: 0.5 }} />
                      <Typography variant="body1" sx={{ color: darkProTokens.textSecondary }}>
                        Sin gastos registrados
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>

      {/* RESUMEN FINANCIERO */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <Card sx={{
          background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
          border: `1px solid ${darkProTokens.grayDark}`,
          borderRadius: 4
        }}>
          <CardContent sx={{ p: config.compactMode ? { xs: 2, sm: 3 } : { xs: 3, sm: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <AccountBalanceIcon sx={{ color: currentColors.primary, fontSize: 28 }} />
              <Typography variant="h6" sx={{ 
                color: currentColors.primary, 
                fontWeight: 700,
                fontSize: config.compactMode ? { xs: '0.9rem', sm: '1rem' } : { xs: '1rem', sm: '1.25rem' }
              }}>
                💰 Resumen Financiero del Período
              </Typography>
            </Box>
            
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 4, 
                  background: `linear-gradient(135deg, ${currentColors.secondary}15, ${currentColors.secondary}05)`,
                  borderRadius: 3,
                  border: `1px solid ${currentColors.secondary}30`
                }}>
                  <AttachMoneyIcon sx={{ 
                    fontSize: config.compactMode ? { xs: 40, sm: 50 } : { xs: 50, sm: 60 }, 
                    color: currentColors.secondary, 
                    mb: 2 
                  }} />
                  <Typography variant="body2" sx={{ 
                    color: darkProTokens.textSecondary, 
                    mb: 1,
                    fontSize: config.compactMode ? { xs: '0.7rem', sm: '0.8rem' } : { xs: '0.8rem', sm: '0.875rem' }
                  }}>
                    Ingresos Totales
                  </Typography>
                  <Typography variant="h4" sx={{ 
                    color: currentColors.secondary, 
                    fontWeight: 800,
                    fontSize: config.compactMode ? { xs: '1.5rem', sm: '1.8rem' } : { xs: '1.8rem', sm: '2.5rem' },
                    textShadow: `0 0 20px ${currentColors.secondary}40`
                  }}>
                    {formatPrice(metrics?.totalIngresos || 0)}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 4, 
                  background: `linear-gradient(135deg, ${darkProTokens.error}15, ${darkProTokens.error}05)`,
                  borderRadius: 3,
                  border: `1px solid ${darkProTokens.error}30`
                }}>
                  <TrendingDownIcon sx={{ 
                    fontSize: config.compactMode ? { xs: 40, sm: 50 } : { xs: 50, sm: 60 }, 
                    color: darkProTokens.error, 
                    mb: 2 
                  }} />
                  <Typography variant="body2" sx={{ 
                    color: darkProTokens.textSecondary, 
                    mb: 1,
                    fontSize: config.compactMode ? { xs: '0.7rem', sm: '0.8rem' } : { xs: '0.8rem', sm: '0.875rem' }
                  }}>
                    Gastos Totales
                  </Typography>
                  <Typography variant="h4" sx={{ 
                    color: darkProTokens.error, 
                    fontWeight: 800,
                    fontSize: config.compactMode ? { xs: '1.5rem', sm: '1.8rem' } : { xs: '1.8rem', sm: '2.5rem' },
                    textShadow: `0 0 20px ${darkProTokens.error}40`
                  }}>
                    {formatPrice(metrics?.totalGastos || 0)}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 4, 
                  background: `linear-gradient(135deg, ${currentColors.primary}15, ${currentColors.primary}05)`,
                  borderRadius: 3,
                  border: `1px solid ${currentColors.primary}30`
                }}>
                  <AssessmentIcon sx={{ 
                    fontSize: config.compactMode ? { xs: 40, sm: 50 } : { xs: 50, sm: 60 }, 
                    color: currentColors.primary, 
                    mb: 2 
                  }} />
                  <Typography variant="body2" sx={{ 
                    color: darkProTokens.textSecondary, 
                    mb: 1,
                    fontSize: config.compactMode ? { xs: '0.7rem', sm: '0.8rem' } : { xs: '0.8rem', sm: '0.875rem' }
                  }}>
                    Utilidad Neta
                  </Typography>
                  <Typography variant="h4" sx={{ 
                    color: (metrics?.utilidadNeta || 0) >= 0 ? currentColors.primary : darkProTokens.error, 
                    fontWeight: 800,
                    fontSize: config.compactMode ? { xs: '1.5rem', sm: '1.8rem' } : { xs: '1.8rem', sm: '2.5rem' },
                    textShadow: `0 0 20px ${(metrics?.utilidadNeta || 0) >= 0 ? currentColors.primary : darkProTokens.error}40`
                  }}>
                    {formatPrice(metrics?.utilidadNeta || 0)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>

      {/* DIALOG DE CONFIGURACIÓN */}
      <Dialog 
        open={configDialogOpen} 
        onClose={() => setConfigDialogOpen(false)}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `1px solid ${darkProTokens.grayDark}`,
            color: darkProTokens.textPrimary
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: `1px solid ${darkProTokens.grayDark}`,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <SettingsIcon sx={{ color: currentColors.primary }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            ⚙️ Configuración de Reportes
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={4}>
            {/* ESQUEMAS DE COLORES */}
            <Box>
              <Typography variant="h6" sx={{ color: currentColors.secondary, mb: 2, fontWeight: 600 }}>
                🎨 Esquemas de Colores
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(colorSchemes).map(([key, scheme]) => (
                  <Grid item xs={6} sm={4} key={key}>
                    <Paper 
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        cursor: 'pointer',
                        border: config.colorScheme === key ? 
                          `3px solid ${scheme.primary}` : 
                          `1px solid ${darkProTokens.grayDark}`,
                        background: config.colorScheme === key ? 
                          `${scheme.primary}10` : 
                          darkProTokens.surfaceLevel3,
                        '&:hover': {
                          border: `2px solid ${scheme.primary}60`
                        },
                        transition: 'all 0.3s ease'
                      }}
                      onClick={() => setConfig(prev => ({ ...prev, colorScheme: key }))}
                    >
                      <Typography variant="body2" sx={{ 
                        color: darkProTokens.textPrimary, 
                        mb: 1, 
                        fontWeight: 600,
                        textTransform: 'capitalize'
                      }}>
                        {key}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Box sx={{ width: 16, height: 16, bgcolor: scheme.primary, borderRadius: '50%' }} />
                        <Box sx={{ width: 16, height: 16, bgcolor: scheme.secondary, borderRadius: '50%' }} />
                        <Box sx={{ width: 16, height: 16, bgcolor: scheme.tertiary, borderRadius: '50%' }} />
                        <Box sx={{ width: 16, height: 16, bgcolor: scheme.quaternary, borderRadius: '50%' }} />
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* CONFIGURACIONES ADICIONALES */}
            <Box>
              <Typography variant="h6" sx={{ color: currentColors.tertiary, mb: 2, fontWeight: 600 }}>
                ⚡ Configuraciones Adicionales
              </Typography>
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.showAnimations}
                      onChange={(e) => setConfig(prev => ({ ...prev, showAnimations: e.target.checked }))}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: currentColors.primary,
                          '& + .MuiSwitch-track': {
                            bgcolor: currentColors.primary
                          }
                        }
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                      🎭 Animaciones
                    </Typography>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.compactMode}
                      onChange={(e) => setConfig(prev => ({ ...prev, compactMode: e.target.checked }))}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: currentColors.secondary,
                          '& + .MuiSwitch-track': {
                            bgcolor: currentColors.secondary
                          }
                        }
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                      📱 Modo Compacto
                    </Typography>
                  }
                />
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, borderTop: `1px solid ${darkProTokens.grayDark}` }}>
          <Button 
            onClick={() => setConfigDialogOpen(false)}
            sx={{ color: darkProTokens.textSecondary }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              setConfigDialogOpen(false);
              handleRefresh();
            }}
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{
              background: `linear-gradient(135deg, ${currentColors.primary}, ${currentColors.primary}DD)`,
              fontWeight: 700,
              '&:hover': {
                background: `linear-gradient(135deg, ${currentColors.primary}DD, ${currentColors.primary}BB)`
              }
            }}
          >
            Guardar y Aplicar
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG DE PANTALLA COMPLETA PARA GRÁFICOS */}
      <Dialog 
        open={!!fullscreenChart} 
        onClose={() => setFullscreenChart(null)}
        maxWidth="xl"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
            border: `1px solid ${darkProTokens.grayDark}`,
            color: darkProTokens.textPrimary,
            minHeight: '80vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: `1px solid ${darkProTokens.grayDark}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ShowChartIcon sx={{ color: currentColors.primary }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              📊 {fullscreenChart === 'ventas' ? 'Tendencias de Ventas' : 
                  fullscreenChart === 'pagos' ? 'Métodos de Pago' : 
                  'Análisis Detallado'} - Vista Completa
            </Typography>
          </Box>
          <IconButton onClick={() => setFullscreenChart(null)} sx={{ color: darkProTokens.textSecondary }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 4 }}>
          {fullscreenChart === 'ventas' && ventasDiarias.length > 0 && (
            <Box sx={{ height: 500, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={ventasDiarias} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkProTokens.grayDark} />
                  <XAxis dataKey="fecha" stroke={darkProTokens.textSecondary} fontSize={14} />
                  <YAxis stroke={darkProTokens.textSecondary} fontSize={14} tickFormatter={(value) => formatPrice(value)} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: darkProTokens.surfaceLevel4,
                      border: `1px solid ${darkProTokens.grayDark}`,
                      borderRadius: '8px',
                      color: darkProTokens.textPrimary,
                      fontSize: '14px'
                    }}
                    formatter={(value, name) => [formatPrice(value), name]}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="membresías" fill={`${currentColors.secondary}30`} stroke={currentColors.secondary} strokeWidth={3} name="Membresías" />
                  <Bar dataKey="pos" fill={currentColors.primary} name="Ventas POS" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="neto" stroke={currentColors.tertiary} strokeWidth={3} dot={{ fill: currentColors.tertiary, strokeWidth: 2, r: 6 }} name="Total Neto" />
                </ComposedChart>
              </ResponsiveContainer>
            </Box>
          )}
          
          {fullscreenChart === 'pagos' && ventasMetodo.length > 0 && (
            <Box sx={{ height: 500, width: '100%' }}>
              <Typography variant="h6" sx={{ 
                color: currentColors.tertiary, 
                mb: 3, 
                fontWeight: 700,
                textAlign: 'center'
              }}>
                💳 Distribución de Métodos de Pago
              </Typography>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ventasMetodo}
                    cx="50%"
                    cy="50%"
                    outerRadius={180}
                    innerRadius={100}
                    paddingAngle={5}
                    dataKey="total"
                    label={({ metodo, total }) => {
                      const totalGeneral = ventasMetodo.reduce((sum, item) => sum + item.total, 0);
                      const porcentaje = totalGeneral > 0 ? (total / totalGeneral * 100).toFixed(1) : '0';
                      return `${metodo} (${porcentaje}%)`;
                    }}
                  >
                    {ventasMetodo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: darkProTokens.surfaceLevel4,
                      border: `1px solid ${darkProTokens.grayDark}`,
                      borderRadius: '8px',
                      color: darkProTokens.textPrimary,
                      fontSize: '14px'
                    }}
                    formatter={(value) => formatPrice(value)}
                  />
                  <Legend 
                    wrapperStyle={{ color: darkProTokens.textSecondary, fontSize: '14px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
