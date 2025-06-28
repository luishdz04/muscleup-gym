'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Switch,
  FormControlLabel
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
  Timeline as TimelineIcon,
  PieChart as PieChartIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
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
  chart1: '#FFCC00',
  chart2: '#388E3C',
  chart3: '#1976D2',
  chart4: '#FFB300',
  chart5: '#9C27B0',
  chart6: '#D32F2F',
  chart7: '#009688',
  chart8: '#E91E63'
};

// 🎨 CONFIGURACIÓN DE COLORES PERSONALIZABLE
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

function getDateDaysAgo(daysAgo) {
  const now = new Date();
  const mexicoDate = new Date(now.toLocaleString("en-US", {timeZone: "America/Mexico_City"}));
  mexicoDate.setDate(mexicoDate.getDate() - daysAgo);
  
  const year = mexicoDate.getFullYear();
  const month = String(mexicoDate.getMonth() + 1).padStart(2, '0');
  const day = String(mexicoDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ============= FUNCIONES DE CONSULTA REALES (EXACTAMENTE COMO EL DASHBOARD) =============

// ✅ FUNCIÓN CRÍTICA: loadRealDailyData (EXACTA del dashboard)
const loadRealDailyData = useCallback(async (targetDate) => {
  try {
    console.log('📊 [REPORTES] Consultando API daily-data para:', targetDate);
    
    const response = await fetch(`/api/cuts/daily-data?date=${targetDate}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      console.log('📊 [REPORTES] Respuesta de API:', data);
      
      // ✅ USAR LA VALIDACIÓN DEL DASHBOARD
      if (data.success && data.totals) {
        console.log('✅ [REPORTES] Datos válidos encontrados:', {
          total: data.totals.total,
          efectivo: data.totals.efectivo,
          transferencia: data.totals.transferencia,
          pos: data.pos?.total,
          memberships: data.memberships?.total,
          abonos: data.abonos?.total
        });
        return data;
      } else {
        console.log('⚠️ [REPORTES] Sin datos válidos para:', targetDate);
        return null;
      }
    } else {
      console.log('❌ [REPORTES] Error HTTP:', response.status);
      return null;
    }
  } catch (error) {
    console.error('❌ [REPORTES] Error en loadRealDailyData:', error);
    return null;
  }
}, []);

// ✅ FUNCIÓN CRÍTICA: loadWeeklyRealData (EXACTA del dashboard)
const loadWeeklyRealData = useCallback(async () => {
  console.log('📈 [REPORTES] Cargando datos semanales...');
  const chartData = [];
  
  for (let i = 6; i >= 0; i--) {
    const dateString = getDateDaysAgo(i);
    const dayName = dateString.split('-').slice(1).join('/'); // "06/28"
    
    const dayData = await loadRealDailyData(dateString);
    
    // ✅ IMPORTANTE: Siempre agregar datos, incluso si son 0
    chartData.push({
      name: dayName,
      sales: dayData?.pos?.total || 0,
      memberships: dayData?.memberships?.total || 0,
      layaways: dayData?.abonos?.total || 0,
      date: dateString,
      total: dayData?.totals?.total || 0
    });
  }
  
  console.log('✅ [REPORTES] Datos semanales obtenidos:', chartData);
  return chartData;
}, [loadRealDailyData]);

// ✅ FUNCIÓN PRINCIPAL: loadDashboardStats (ADAPTADA del dashboard)
const loadDashboardStats = useCallback(async (selectedPeriod = 'today') => {
  try {
    console.log('📊 [REPORTES] Iniciando carga de estadísticas para:', selectedPeriod);

    let targetDate;
    let totalIngresos = 0;
    let totalPOS = 0;
    let totalMemberships = 0;
    let totalAbonos = 0;
    let totalEfectivo = 0;
    let totalTransferencia = 0;
    let totalDebito = 0;
    let totalCredito = 0;
    let totalTransacciones = 0;

    if (selectedPeriod === 'today') {
      // ✅ USAR FECHA ACTUAL COMO EL DASHBOARD
      targetDate = getMexicoDateLocal();
      const dailyDataResult = await loadRealDailyData(targetDate);
      
      if (dailyDataResult && dailyDataResult.totals) {
        totalIngresos = dailyDataResult.totals.total || 0;
        totalPOS = dailyDataResult.pos?.total || 0;
        totalMemberships = dailyDataResult.memberships?.total || 0;
        totalAbonos = dailyDataResult.abonos?.total || 0;
        totalEfectivo = dailyDataResult.totals.efectivo || 0;
        totalTransferencia = dailyDataResult.totals.transferencia || 0;
        totalDebito = dailyDataResult.totals.debito || 0;
        totalCredito = dailyDataResult.totals.credito || 0;
        totalTransacciones = dailyDataResult.totals.transactions || 0;
        
        console.log('✅ [REPORTES] Datos del día actual cargados:', {
          totalIngresos, totalPOS, totalMemberships, totalAbonos
        });
      } else {
        console.log('⚠️ [REPORTES] Sin datos para hoy:', targetDate);
      }
    } else if (selectedPeriod === 'week') {
      // ✅ SUMAR DATOS DE LA SEMANA
      for (let i = 6; i >= 0; i--) {
        const dateString = getDateDaysAgo(i);
        const dayData = await loadRealDailyData(dateString);
        
        if (dayData && dayData.totals) {
          totalIngresos += dayData.totals.total || 0;
          totalPOS += dayData.pos?.total || 0;
          totalMemberships += dayData.memberships?.total || 0;
          totalAbonos += dayData.abonos?.total || 0;
          totalEfectivo += dayData.totals.efectivo || 0;
          totalTransferencia += dayData.totals.transferencia || 0;
          totalDebito += dayData.totals.debito || 0;
          totalCredito += dayData.totals.credito || 0;
          totalTransacciones += dayData.totals.transactions || 0;
        }
      }
      console.log('✅ [REPORTES] Datos semanales acumulados:', { totalIngresos });
    }

    // ✅ CARGAR DATOS COMPLEMENTARIOS DE SUPABASE (como el dashboard)
    const supabase = createBrowserSupabaseClient();

    const { count: usuariosTotales } = await supabase
      .from('Users')
      .select('*', { count: 'exact', head: true })
      .eq('rol', 'cliente');

    const { data: membresiasActivas } = await supabase
      .from('user_memberships')
      .select('userid, status')
      .eq('status', 'active');

    const { data: apartados } = await supabase
      .from('sales')
      .select('pending_amount, status')
      .eq('sale_type', 'layaway')
      .in('status', ['pending', 'partial']);

    const { data: gastos } = await supabase
      .from('expenses')
      .select('amount')
      .eq('status', 'active');

    // ✅ CARGAR DATOS GRÁFICOS
    const realChartData = await loadWeeklyRealData();

    const totalGastos = gastos?.reduce((sum, g) => sum + (Number(g.amount) || 0), 0) || 0;

    // ✅ CONSTRUIR MÉTRICAS FINALES
    const finalStats = {
      totalIngresos,
      totalGastos,
      utilidadNeta: totalIngresos - totalGastos,
      membresiasTotales: 0,
      membresiasActivas: membresiasActivas?.length || 0,
      membresiasVencidas: 0,
      ingresosMembresías: totalMemberships,
      ventasPOSTotales: totalPOS,
      apartadosActivos: apartados?.length || 0,
      apartadosPendientes: apartados?.reduce((sum, a) => sum + (Number(a.pending_amount) || 0), 0) || 0,
      productosVendidos: totalTransacciones,
      usuariosTotales: usuariosTotales || 0,
      usuariosActivos: new Set(membresiasActivas?.map(u => u.userid)).size || 0,
      nuevosUsuarios: 0,
      // ✅ DESGLOSE DE MÉTODOS DE PAGO
      cashFlow: {
        efectivo: totalEfectivo,
        transferencia: totalTransferencia,
        debito: totalDebito,
        credito: totalCredito
      },
      // ✅ DATOS PARA GRÁFICOS
      chartData: realChartData,
      pieData: []
    };

    // ✅ CONSTRUIR PIE DATA
    if (totalIngresos > 0) {
      const pieData = [];
      if (totalEfectivo > 0) pieData.push({ name: 'Efectivo', value: totalEfectivo, color: colorSchemes.default.primary });
      if (totalTransferencia > 0) pieData.push({ name: 'Transferencia', value: totalTransferencia, color: colorSchemes.default.secondary });
      if (totalDebito > 0) pieData.push({ name: 'Débito', value: totalDebito, color: colorSchemes.default.tertiary });
      if (totalCredito > 0) pieData.push({ name: 'Crédito', value: totalCredito, color: colorSchemes.default.quaternary });
      finalStats.pieData = pieData;
    }

    console.log('✅ [REPORTES] Estadísticas finales calculadas:', finalStats);
    return finalStats;
    
  } catch (err) {
    console.error('❌ [REPORTES] Error en loadDashboardStats:', err);
    throw err;
  }
}, [loadRealDailyData, loadWeeklyRealData]);

// ✅ COMPONENTE PRINCIPAL
export default function ReportesPage() {
  const [config, setConfig] = useState({
    colorScheme: 'default',
    showAnimations: true,
    compactMode: false
  });

  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [fullscreenChart, setFullscreenChart] = useState(null);
  
  const [selectedPeriod, setSelectedPeriod] = useState('today'); // 'today', 'week', 'month'
  
  const [stats, setStats] = useState(null);
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
  }, [selectedPeriod, loadDashboardStats]);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 [REPORTES] Iniciando carga de datos...');
      const statsData = await loadDashboardStats(selectedPeriod);
      setStats(statsData);
      setLastUpdate(formatDateTime(new Date().toISOString()));
      console.log('✅ [REPORTES] Datos cargados exitosamente');
    } catch (error) {
      console.error('❌ [REPORTES] Error cargando datos:', error);
      setError('Error al cargar los datos. Verifica tu conexión y las APIs.');
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
      whileHover={{ scale: config.showAnimations ? 1.02 : 1, y: config.showAnimations ? -3 : 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card sx={{
        background: `linear-gradient(135deg, ${color}, ${color}DD)`,
        color: darkProTokens.textPrimary,
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        border: `1px solid ${color}40`,
        boxShadow: `0 4px 20px ${color}20`,
        minHeight: 140, // Más compacto
        '&:hover': { 
          boxShadow: `0 8px 32px ${color}40`,
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
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Avatar sx={{ 
              bgcolor: `${darkProTokens.textPrimary}15`, 
              width: 40, 
              height: 40,
              border: `2px solid ${darkProTokens.textPrimary}20`
            }}>
              {React.cloneElement(icon, { 
                sx: { fontSize: 20, color: darkProTokens.textPrimary }
              })}
            </Avatar>
          </Box>
          
          <Typography variant="h4" sx={{ 
            fontWeight: 800, 
            mb: 0.5,
            fontSize: { xs: '1.2rem', sm: '1.5rem' },
            background: `linear-gradient(45deg, ${darkProTokens.textPrimary}, ${currentColors.primary})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {value}
          </Typography>
          
          <Typography variant="body1" sx={{ 
            opacity: 0.9, 
            fontWeight: 600,
            fontSize: { xs: '0.75rem', sm: '0.85rem' },
            textShadow: `0 2px 4px ${color}40`
          }}>
            {title}
          </Typography>
          
          {subtitle && (
            <Typography variant="caption" sx={{ 
              opacity: 0.7, 
              mt: 0.5,
              fontSize: { xs: '0.65rem', sm: '0.7rem' },
              display: 'block'
            }}>
              {subtitle}
            </Typography>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  const COLORS = [currentColors.primary, currentColors.secondary, currentColors.tertiary, currentColors.quaternary];

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
              width: 80, 
              height: 80,
              mx: 'auto',
              mb: 3,
              boxShadow: `0 0 40px ${currentColors.primary}60`
            }}>
              <AnalyticsIcon sx={{ fontSize: 40 }} />
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
            Analizando datos del gimnasio...
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
        <Paper sx={{
          p: 4,
          background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
          border: `1px solid ${darkProTokens.error}40`,
          borderRadius: 4,
          textAlign: 'center',
          maxWidth: 500
        }}>
          <Avatar sx={{ 
            bgcolor: darkProTokens.error, 
            width: 60, 
            height: 60,
            mx: 'auto',
            mb: 2
          }}>
            <AnalyticsIcon sx={{ fontSize: 30 }} />
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
    );
  }

  return (
    <Box sx={{ 
      p: 2,
      background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
      minHeight: '100vh',
      color: darkProTokens.textPrimary
    }}>
      {/* HEADER COMPACTO */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Paper sx={{
          p: 3,
          mb: 3,
          background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
          border: `1px solid ${darkProTokens.grayDark}`,
          borderRadius: 3,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: `linear-gradient(90deg, ${currentColors.primary}, ${currentColors.secondary})`
          }
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ 
                bgcolor: currentColors.primary, 
                width: 50, 
                height: 50,
                border: `3px solid ${currentColors.primary}40`
              }}>
                <AnalyticsIcon sx={{ fontSize: 25 }} />
              </Avatar>
              
              <Box>
                <Typography variant="h4" sx={{ 
                  color: currentColors.primary, 
                  fontWeight: 800,
                  fontSize: { xs: '1.5rem', sm: '2rem' },
                  background: `linear-gradient(45deg, ${currentColors.primary}, ${currentColors.secondary})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  📊 Reportes MUP
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: darkProTokens.info, 
                  fontWeight: 600,
                  fontSize: { xs: '0.7rem', sm: '0.8rem' }
                }}>
                  ⏰ {currentMexicoTime} • {lastUpdate && `✅ ${lastUpdate}`}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {/* SELECTOR DE PERÍODO */}
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Button
                  size="small"
                  variant={selectedPeriod === 'today' ? 'contained' : 'outlined'}
                  onClick={() => setSelectedPeriod('today')}
                  sx={{
                    fontSize: '0.7rem',
                    px: 2,
                    py: 0.5,
                    background: selectedPeriod === 'today' ? currentColors.primary : 'transparent',
                    borderColor: currentColors.primary,
                    color: selectedPeriod === 'today' ? darkProTokens.background : currentColors.primary
                  }}
                >
                  Hoy
                </Button>
                <Button
                  size="small"
                  variant={selectedPeriod === 'week' ? 'contained' : 'outlined'}
                  onClick={() => setSelectedPeriod('week')}
                  sx={{
                    fontSize: '0.7rem',
                    px: 2,
                    py: 0.5,
                    background: selectedPeriod === 'week' ? currentColors.secondary : 'transparent',
                    borderColor: currentColors.secondary,
                    color: selectedPeriod === 'week' ? darkProTokens.background : currentColors.secondary
                  }}
                >
                  Semana
                </Button>
              </Box>

              <IconButton
                onClick={() => setConfigDialogOpen(true)}
                size="small"
                sx={{
                  bgcolor: `${currentColors.tertiary}20`,
                  color: currentColors.tertiary,
                  '&:hover': { bgcolor: `${currentColors.tertiary}30` }
                }}
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
              
              <Button
                size="small"
                startIcon={refreshing ? <CircularProgress size={16} sx={{ color: darkProTokens.background }} /> : <RefreshIcon />}
                onClick={handleRefresh}
                disabled={refreshing}
                variant="contained"
                sx={{ 
                  background: `linear-gradient(135deg, ${darkProTokens.info}, ${darkProTokens.infoHover})`,
                  fontWeight: 700,
                  px: 2,
                  py: 0.5,
                  fontSize: '0.7rem'
                }}
              >
                {refreshing ? 'Actualizando...' : 'Actualizar'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </motion.div>

      {/* MÉTRICAS PRINCIPALES - COMPACTAS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <MetricCard
              title="Ingresos Totales"
              value={formatPrice(stats?.totalIngresos || 0)}
              icon={<AttachMoneyIcon />}
              color={currentColors.primary}
              subtitle={selectedPeriod === 'today' ? 'Hoy' : selectedPeriod === 'week' ? 'Esta semana' : 'Período'}
            />
          </Grid>

          <Grid size={{ xs: 6, sm: 3 }}>
            <MetricCard
              title="Utilidad Neta"
              value={formatPrice(stats?.utilidadNeta || 0)}
              icon={<AccountBalanceIcon />}
              color={stats?.utilidadNeta >= 0 ? currentColors.secondary : darkProTokens.error}
              subtitle={`Ingresos - Gastos`}
            />
          </Grid>

          <Grid size={{ xs: 6, sm: 3 }}>
            <MetricCard
              title="Membresías"
              value={formatPrice(stats?.ingresosMembresías || 0)}
              icon={<PeopleIcon />}
              color={currentColors.tertiary}
              subtitle={`${stats?.membresiasActivas || 0} activas`}
            />
          </Grid>

          <Grid size={{ xs: 6, sm: 3 }}>
            <MetricCard
              title="Ventas POS"
              value={formatPrice(stats?.ventasPOSTotales || 0)}
              icon={<ShoppingCartIcon />}
              color={currentColors.quaternary}
              subtitle={`${stats?.productosVendidos || 0} transacciones`}
            />
          </Grid>
        </Grid>
      </motion.div>

      {/* GRÁFICOS COMPACTOS - MEJOR DISTRIBUCIÓN */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* GRÁFICO PRINCIPAL - TENDENCIAS */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `1px solid ${darkProTokens.grayDark}`,
            borderRadius: 3
          }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TimelineIcon sx={{ color: currentColors.primary, fontSize: 20 }} />
                  <Typography variant="h6" sx={{ 
                    color: currentColors.primary, 
                    fontWeight: 700,
                    fontSize: { xs: '0.9rem', sm: '1rem' }
                  }}>
                    📈 Tendencias (7 días)
                  </Typography>
                  <Chip
                    label={`${stats?.chartData?.filter(d => d.total > 0).length || 0} días con datos`}
                    size="small"
                    sx={{
                      bgcolor: `${currentColors.secondary}20`,
                      color: currentColors.secondary,
                      fontSize: '0.6rem',
                      height: 20
                    }}
                  />
                </Box>
                <IconButton 
                  size="small"
                  onClick={() => setFullscreenChart('tendencias')}
                  sx={{ color: darkProTokens.textSecondary }}
                >
                  <FullscreenIcon fontSize="small" />
                </IconButton>
              </Box>
              
              <Box sx={{ height: 280, width: '100%' }}>
                {stats?.chartData?.some(d => d.total > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={stats.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkProTokens.grayDark} />
                      <XAxis 
                        dataKey="name" 
                        stroke={darkProTokens.textSecondary}
                        fontSize={10}
                      />
                      <YAxis 
                        stroke={darkProTokens.textSecondary}
                        fontSize={10}
                        tickFormatter={(value) => value > 1000 ? `${(value/1000).toFixed(0)}k` : value.toFixed(0)}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: darkProTokens.surfaceLevel4,
                          border: `1px solid ${darkProTokens.grayDark}`,
                          borderRadius: '6px',
                          color: darkProTokens.textPrimary,
                          fontSize: '12px'
                        }}
                        formatter={(value, name) => [formatPrice(value), name]}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      
                      <Area
                        type="monotone"
                        dataKey="memberships"
                        fill={`${currentColors.secondary}30`}
                        stroke={currentColors.secondary}
                        strokeWidth={2}
                        name="Membresías"
                      />
                      
                      <Bar
                        dataKey="sales"
                        fill={currentColors.primary}
                        name="Ventas POS"
                        radius={[2, 2, 0, 0]}
                      />
                      
                      <Line
                        type="monotone"
                        dataKey="layaways"
                        stroke={currentColors.tertiary}
                        strokeWidth={2}
                        dot={{ fill: currentColors.tertiary, strokeWidth: 1, r: 3 }}
                        name="Apartados"
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
                    gap: 1
                  }}>
                    <TimelineIcon sx={{ fontSize: 40, color: darkProTokens.grayMuted, opacity: 0.5 }} />
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                      Sin datos en los últimos 7 días
                    </Typography>
                    <Typography variant="caption" sx={{ color: darkProTokens.textDisabled, textAlign: 'center' }}>
                      Los cortes diarios aparecerán aquí cuando estén disponibles
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* MÉTODOS DE PAGO */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `1px solid ${darkProTokens.grayDark}`,
            borderRadius: 3,
            height: '100%'
          }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CreditCardIcon sx={{ color: currentColors.tertiary, fontSize: 20 }} />
                  <Typography variant="h6" sx={{ 
                    color: currentColors.tertiary, 
                    fontWeight: 700,
                    fontSize: { xs: '0.9rem', sm: '1rem' }
                  }}>
                    💳 Métodos de Pago
                  </Typography>
                </Box>
                <IconButton 
                  size="small"
                  onClick={() => setFullscreenChart('pagos')}
                  sx={{ color: darkProTokens.textSecondary }}
                >
                  <FullscreenIcon fontSize="small" />
                </IconButton>
              </Box>
              
              {stats?.pieData?.length > 0 ? (
                <Box sx={{ height: 220, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        innerRadius={30}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, value }) => {
                          const total = stats.pieData.reduce((sum, item) => sum + item.value, 0);
                          const percent = total > 0 ? ((value / total) * 100).toFixed(0) : '0';
                          return `${name}\n${percent}%`;
                        }}
                        labelLine={false}
                        fontSize={9}
                      >
                        {stats.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: darkProTokens.surfaceLevel4,
                          border: `1px solid ${darkProTokens.grayDark}`,
                          borderRadius: '6px',
                          color: darkProTokens.textPrimary,
                          fontSize: '11px'
                        }}
                        formatter={(value) => formatPrice(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ 
                  height: 220, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 1
                }}>
                  <CreditCardIcon sx={{ fontSize: 30, color: darkProTokens.grayMuted, opacity: 0.5 }} />
                  <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                    Sin pagos registrados
                  </Typography>
                  <Typography variant="caption" sx={{ color: darkProTokens.textDisabled }}>
                    {selectedPeriod === 'today' ? 'Hoy' : 'En el período'}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* DESGLOSE FINANCIERO COMPACTO */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `1px solid ${darkProTokens.grayDark}`,
            borderRadius: 3
          }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AttachMoneyIcon sx={{ color: currentColors.primary, fontSize: 20 }} />
                <Typography variant="h6" sx={{ 
                  color: currentColors.primary, 
                  fontWeight: 700,
                  fontSize: '0.9rem'
                }}>
                  💰 Desglose de Ingresos
                </Typography>
              </Box>

              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                    Membresías
                  </Typography>
                  <Typography variant="body2" sx={{ color: currentColors.secondary, fontWeight: 700 }}>
                    {formatPrice(stats?.ingresosMembresías || 0)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                    Ventas POS
                  </Typography>
                  <Typography variant="body2" sx={{ color: currentColors.primary, fontWeight: 700 }}>
                    {formatPrice(stats?.ventasPOSTotales || 0)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                    Gastos
                  </Typography>
                  <Typography variant="body2" sx={{ color: darkProTokens.error, fontWeight: 700 }}>
                    -{formatPrice(stats?.totalGastos || 0)}
                  </Typography>
                </Box>

                <Divider sx={{ borderColor: darkProTokens.grayMedium }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>
                    Utilidad Neta
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: (stats?.utilidadNeta || 0) >= 0 ? currentColors.secondary : darkProTokens.error, 
                    fontWeight: 800,
                    textShadow: `0 0 10px ${(stats?.utilidadNeta || 0) >= 0 ? currentColors.secondary : darkProTokens.error}40`
                  }}>
                    {formatPrice(stats?.utilidadNeta || 0)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `1px solid ${darkProTokens.grayDark}`,
            borderRadius: 3
          }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CreditCardIcon sx={{ color: currentColors.tertiary, fontSize: 20 }} />
                <Typography variant="h6" sx={{ 
                  color: currentColors.tertiary, 
                  fontWeight: 700,
                  fontSize: '0.9rem'
                }}>
                  💳 Métodos de Pago Detalle
                </Typography>
              </Box>

              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                    💵 Efectivo
                  </Typography>
                  <Typography variant="body2" sx={{ color: currentColors.primary, fontWeight: 700 }}>
                    {formatPrice(stats?.cashFlow?.efectivo || 0)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                    🏦 Transferencia
                  </Typography>
                  <Typography variant="body2" sx={{ color: currentColors.secondary, fontWeight: 700 }}>
                    {formatPrice(stats?.cashFlow?.transferencia || 0)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                    💳 Débito
                  </Typography>
                  <Typography variant="body2" sx={{ color: currentColors.tertiary, fontWeight: 700 }}>
                    {formatPrice(stats?.cashFlow?.debito || 0)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                    💎 Crédito
                  </Typography>
                  <Typography variant="body2" sx={{ color: currentColors.quaternary, fontWeight: 700 }}>
                    {formatPrice(stats?.cashFlow?.credito || 0)}
                  </Typography>
                </Box>

                <Divider sx={{ borderColor: darkProTokens.grayMedium }} />

                <Box sx={{ textAlign: 'center', mt: 1 }}>
                  <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                    Total del {selectedPeriod === 'today' ? 'día' : selectedPeriod === 'week' ? 'período semanal' : 'período'}
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: currentColors.primary, 
                    fontWeight: 800,
                    textShadow: `0 0 10px ${currentColors.primary}40`
                  }}>
                    {formatPrice(stats?.totalIngresos || 0)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* DIALOG DE CONFIGURACIÓN */}
      <Dialog 
        open={configDialogOpen} 
        onClose={() => setConfigDialogOpen(false)}
        maxWidth="sm"
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
            ⚙️ Configuración
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h6" sx={{ color: currentColors.secondary, mb: 2, fontWeight: 600 }}>
                🎨 Esquema de Colores
              </Typography>
              <Grid container spacing={1}>
                {Object.entries(colorSchemes).map(([key, scheme]) => (
                  <Grid size={{ xs: 4 }} key={key}>
                    <Paper 
                      sx={{
                        p: 1,
                        textAlign: 'center',
                        cursor: 'pointer',
                        border: config.colorScheme === key ? 
                          `2px solid ${scheme.primary}` : 
                          `1px solid ${darkProTokens.grayDark}`,
                        background: config.colorScheme === key ? 
                          `${scheme.primary}10` : 
                          darkProTokens.surfaceLevel3,
                        '&:hover': {
                          border: `1px solid ${scheme.primary}60`
                        }
                      }}
                      onClick={() => setConfig(prev => ({ ...prev, colorScheme: key }))}
                    >
                      <Typography variant="caption" sx={{ 
                        color: darkProTokens.textPrimary, 
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        fontSize: '0.7rem'
                      }}>
                        {key}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', mt: 0.5 }}>
                        <Box sx={{ width: 12, height: 12, bgcolor: scheme.primary, borderRadius: '50%' }} />
                        <Box sx={{ width: 12, height: 12, bgcolor: scheme.secondary, borderRadius: '50%' }} />
                        <Box sx={{ width: 12, height: 12, bgcolor: scheme.tertiary, borderRadius: '50%' }} />
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Box>
              <Typography variant="h6" sx={{ color: currentColors.tertiary, mb: 2, fontWeight: 600 }}>
                ⚡ Opciones
              </Typography>
              <Stack spacing={1}>
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
                    <Typography sx={{ color: darkProTokens.textPrimary, fontWeight: 600, fontSize: '0.9rem' }}>
                      🎭 Animaciones
                    </Typography>
                  }
                />
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${darkProTokens.grayDark}` }}>
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
              fontWeight: 700
            }}
          >
            Aplicar
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG FULLSCREEN */}
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
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            📊 Vista Completa - {fullscreenChart}
          </Typography>
          <IconButton onClick={() => setFullscreenChart(null)} sx={{ color: darkProTokens.textSecondary }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ height: 500, width: '100%' }}>
            {/* Renderizado de gráficos fullscreen */}
            {fullscreenChart === 'tendencias' && stats?.chartData && (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkProTokens.grayDark} />
                  <XAxis dataKey="name" stroke={darkProTokens.textSecondary} />
                  <YAxis stroke={darkProTokens.textSecondary} tickFormatter={(value) => formatPrice(value)} />
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
                  <Area type="monotone" dataKey="memberships" fill={`${currentColors.secondary}30`} stroke={currentColors.secondary} strokeWidth={3} name="Membresías" />
                  <Bar dataKey="sales" fill={currentColors.primary} name="Ventas POS" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="layaways" stroke={currentColors.tertiary} strokeWidth={3} dot={{ fill: currentColors.tertiary, r: 6 }} name="Apartados" />
                </ComposedChart>
              </ResponsiveContainer>
            )}
            
            {fullscreenChart === 'pagos' && stats?.pieData?.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={180}
                    innerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => {
                      const total = stats.pieData.reduce((sum, item) => sum + item.value, 0);
                      const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                      return `${name} (${percent}%)`;
                    }}
                  >
                    {stats.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
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
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
