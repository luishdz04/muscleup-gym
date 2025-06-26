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
  IconButton,
  Paper,
  Stack,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  Badge
} from '@mui/material';
import {
  People as PeopleIcon,
  FitnessCenter as FitnessCenterIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShoppingCart as SalesIcon,
  Bookmark as LayawayIcon,
  CalendarToday as CalendarIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  PersonAdd as PersonAddIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  Analytics as AnalyticsIcon,
  CreditCard as PaymentIcon,
  MonetizationOn as RevenueIcon,
  Group as GroupIcon,
  Star as StarIcon,
  Insights as InsightsIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
// ✅ IMPORTAR HELPERS DE FECHA CORREGIDOS
import { toMexicoTimestamp, toMexicoDate, formatMexicoDateTime } from '@/utils/dateHelpers';

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
  roleAdmin: '#E91E63',
  roleStaff: '#1976D2',
  roleTrainer: '#009688',
  roleUser: '#777777',
  roleModerator: '#9C27B0'
};

// ✅ INTERFACES
interface DashboardStats {
  // Usuarios
  totalUsers: number;
  clientUsers: number;
  newUsersToday: number;
  newUsersMonth: number;
  usersByGender: {
    male: number;
    female: number;
    other: number;
  };
  
  // Membresías
  activeMemberships: number;
  expiringMemberships: number;
  expiredMemberships: number;
  frozenMemberships: number;
  membershipRevenue: number;
  
  // Ventas del día
  todaySales: number;
  todayTransactions: number;
  todayAvgTicket: number;
  monthSales: number;
  monthTransactions: number;
  
  // Apartados
  activeLayaways: number;
  expiringLayaways: number;
  layawaysPendingAmount: number;
  layawaysCollectedAmount: number;
  
  // Financiero
  todayExpenses: number;
  todayBalance: number;
  cashFlow: {
    efectivo: number;
    transferencia: number;
    debito: number;
    credito: number;
  };
  
  // Tendencias (últimos 7 días)
  weeklyTrend: {
    sales: number[];
    dates: string[];
  };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    clientUsers: 0,
    newUsersToday: 0,
    newUsersMonth: 0,
    usersByGender: { male: 0, female: 0, other: 0 },
    activeMemberships: 0,
    expiringMemberships: 0,
    expiredMemberships: 0,
    frozenMemberships: 0,
    membershipRevenue: 0,
    todaySales: 0,
    todayTransactions: 0,
    todayAvgTicket: 0,
    monthSales: 0,
    monthTransactions: 0,
    activeLayaways: 0,
    expiringLayaways: 0,
    layawaysPendingAmount: 0,
    layawaysCollectedAmount: 0,
    todayExpenses: 0,
    todayBalance: 0,
    cashFlow: { efectivo: 0, transferencia: 0, debito: 0, credito: 0 },
    weeklyTrend: { sales: [], dates: [] }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  
  const supabase = createBrowserSupabaseClient();

  // ✅ FUNCIONES UTILITARIAS CORREGIDAS CON HELPERS DE FECHA MÉXICO
  const getMexicoDate = useCallback(() => {
    return new Date();
  }, []);

  const getMexicoDateString = useCallback(() => {
    return toMexicoDate(new Date());
  }, []);

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price || 0);
  }, []);

  const formatMexicoDate = useCallback((dateString: string) => {
    return formatMexicoDateTime(dateString);
  }, []);

  // ✅ FUNCIÓN PRINCIPAL PARA CARGAR TODAS LAS ESTADÍSTICAS
  const loadDashboardStats = useCallback(async () => {
    try {
      setError(null);
      console.log('📊 Cargando estadísticas del dashboard...');

      // ✅ OBTENER FECHAS MÉXICO CORREGIDAS
      const mexicoToday = getMexicoDate();
      const mexicoTodayString = getMexicoDateString();
      
      // Primer día del mes actual en México
      const firstDayOfMonth = `${mexicoToday.getFullYear()}-${(mexicoToday.getMonth() + 1).toString().padStart(2, '0')}-01`;
      
      // Fecha en 7 días en México
      const in7Days = new Date(mexicoToday);
      in7Days.setDate(mexicoToday.getDate() + 7);
      const in7DaysString = toMexicoDate(in7Days);

      // Fecha de hace 7 días para tendencias
      const weekAgo = new Date(mexicoToday);
      weekAgo.setDate(mexicoToday.getDate() - 7);
      const weekAgoString = toMexicoDate(weekAgo);

      console.log(`📅 Fechas calculadas:
        📅 Hoy: ${mexicoTodayString}
        📅 Primer día del mes: ${firstDayOfMonth}
        📅 En 7 días: ${in7DaysString}
        📅 Hace 7 días: ${weekAgoString}`);

      // 🔍 CONSULTAS PARALELAS PARA MEJOR PERFORMANCE
      const [
        usersData,
        membershipsData,
        salesData,
        layawaysData,
        expensesData,
        weeklyData
      ] = await Promise.all([
        // 👥 USUARIOS
        loadUsersStats(mexicoTodayString, firstDayOfMonth),
        // 🏋️ MEMBRESÍAS  
        loadMembershipsStats(mexicoTodayString, in7DaysString),
        // 💰 VENTAS
        loadSalesStats(mexicoTodayString, firstDayOfMonth),
        // 📦 APARTADOS
        loadLayawaysStats(mexicoTodayString, in7DaysString),
        // 💸 GASTOS
        loadExpensesStats(mexicoTodayString),
        // 📈 TENDENCIAS
        loadWeeklyTrends(weekAgoString, mexicoTodayString)
      ]);

      // ✅ CONSTRUIR ESTADÍSTICAS FINALES
      const finalStats: DashboardStats = {
        ...usersData,
        ...membershipsData,
        ...salesData,
        ...layawaysData,
        ...expensesData,
        ...weeklyData,
        todayBalance: (salesData.todaySales + membershipsData.membershipRevenue) - expensesData.todayExpenses
      };

      setStats(finalStats);
      setLastUpdate(formatMexicoDateTime(new Date().toISOString()));
      
      console.log('✅ Dashboard cargado exitosamente:', finalStats);

    } catch (err: any) {
      console.error('💥 Error cargando dashboard:', err);
      setError(`Error cargando estadísticas: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getMexicoDate, getMexicoDateString, formatMexicoDateTime]);

  // ✅ FUNCIONES AUXILIARES PARA CARGAR DATOS ESPECÍFICOS - CORREGIDAS
  const loadUsersStats = useCallback(async (today: string, firstDayOfMonth: string) => {
    // ✅ CORREGIDO: Usar 'rol' en lugar de 'role' y 'createdAt' en lugar de 'created_at'
    const { data: allUsers, error } = await supabase
      .from('Users')
      .select('id, rol, gender, createdAt');

    if (error) throw error;

    const clientUsers = allUsers?.filter(u => u.rol === 'cliente') || [];
    const newUsersToday = allUsers?.filter(u => {
      if (!u.createdAt) return false;
      const createdDate = toMexicoDate(new Date(u.createdAt));
      return createdDate === today;
    }) || [];

    const newUsersMonth = allUsers?.filter(u => {
      if (!u.createdAt) return false;
      const createdDate = toMexicoDate(new Date(u.createdAt));
      return createdDate >= firstDayOfMonth;
    }) || [];

    const genderStats = clientUsers.reduce((acc, user) => {
      const gender = user.gender?.toLowerCase() || 'other';
      if (gender === 'masculino' || gender === 'male' || gender === 'hombre') acc.male++;
      else if (gender === 'femenino' || gender === 'female' || gender === 'mujer') acc.female++;
      else acc.other++;
      return acc;
    }, { male: 0, female: 0, other: 0 });

    return {
      totalUsers: allUsers?.length || 0,
      clientUsers: clientUsers.length,
      newUsersToday: newUsersToday.length,
      newUsersMonth: newUsersMonth.length,
      usersByGender: genderStats
    };
  }, [supabase]);

  const loadMembershipsStats = useCallback(async (today: string, in7Days: string) => {
    const { data: memberships, error } = await supabase
      .from('user_memberships')
      .select('*');

    if (error) throw error;

    const active = memberships?.filter(m => m.status === 'active') || [];
    const expiring = memberships?.filter(m => {
      if (!m.end_date || m.status !== 'active') return false;
      const endDate = toMexicoDate(new Date(m.end_date));
      return endDate <= in7Days && endDate >= today;
    }) || [];

    const expired = memberships?.filter(m => {
      if (!m.end_date) return false;
      const endDate = toMexicoDate(new Date(m.end_date));
      return endDate < today;
    }) || [];

    const frozen = memberships?.filter(m => m.status === 'frozen') || [];

    const revenue = memberships?.reduce((sum, m) => sum + (m.amount_paid || 0), 0) || 0;

    return {
      activeMemberships: active.length,
      expiringMemberships: expiring.length,
      expiredMemberships: expired.length,
      frozenMemberships: frozen.length,
      membershipRevenue: revenue
    };
  }, [supabase]);

  const loadSalesStats = useCallback(async (today: string, firstDayOfMonth: string) => {
    const { data: sales, error } = await supabase
      .from('sales')
      .select('*')
      .eq('sale_type', 'sale')
      .eq('status', 'completed');

    if (error) throw error;

    const todaySales = sales?.filter(s => {
      if (!s.created_at) return false;
      const saleDate = toMexicoDate(new Date(s.created_at));
      return saleDate === today;
    }) || [];

    const monthSales = sales?.filter(s => {
      if (!s.created_at) return false;
      const saleDate = toMexicoDate(new Date(s.created_at));
      return saleDate >= firstDayOfMonth;
    }) || [];

    const todayAmount = todaySales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
    const monthAmount = monthSales.reduce((sum, s) => sum + (s.total_amount || 0), 0);

    // Obtener métodos de pago del día
    const { data: payments } = await supabase
      .from('sale_payment_details')
      .select('*')
      .in('sale_id', todaySales.map(s => s.id));

    const cashFlow = payments?.reduce((acc, payment) => {
      const method = payment.payment_method?.toLowerCase() || 'other';
      const amount = payment.amount || 0;
      
      if (method === 'efectivo') acc.efectivo += amount;
      else if (method === 'transferencia') acc.transferencia += amount;
      else if (method === 'debito') acc.debito += amount;
      else if (method === 'credito') acc.credito += amount;
      
      return acc;
    }, { efectivo: 0, transferencia: 0, debito: 0, credito: 0 }) || 
    { efectivo: 0, transferencia: 0, debito: 0, credito: 0 };

    return {
      todaySales: todayAmount,
      todayTransactions: todaySales.length,
      todayAvgTicket: todaySales.length > 0 ? todayAmount / todaySales.length : 0,
      monthSales: monthAmount,
      monthTransactions: monthSales.length,
      cashFlow
    };
  }, [supabase]);

  const loadLayawaysStats = useCallback(async (today: string, in7Days: string) => {
    const { data: layaways, error } = await supabase
      .from('sales')
      .select('*')
      .eq('sale_type', 'layaway');

    if (error) throw error;

    const active = layaways?.filter(l => 
      l.status === 'pending' && 
      l.layaway_expires_at && 
      new Date(l.layaway_expires_at) >= new Date()
    ) || [];

    const expiring = layaways?.filter(l => 
      l.status === 'pending' && 
      l.layaway_expires_at &&
      new Date(l.layaway_expires_at) >= new Date() &&
      new Date(l.layaway_expires_at) <= new Date(in7Days + 'T23:59:59')
    ) || [];

    const pendingAmount = layaways?.reduce((sum, l) => sum + (l.pending_amount || 0), 0) || 0;
    const collectedAmount = layaways?.reduce((sum, l) => sum + (l.paid_amount || 0), 0) || 0;

    return {
      activeLayaways: active.length,
      expiringLayaways: expiring.length,
      layawaysPendingAmount: pendingAmount,
      layawaysCollectedAmount: collectedAmount
    };
  }, [supabase]);

  const loadExpensesStats = useCallback(async (today: string) => {
    // Simulamos gastos por ahora, reemplazar con tabla real de expenses
    return {
      todayExpenses: 0 // Implementar cuando tengamos tabla de gastos
    };
  }, []);

  const loadWeeklyTrends = useCallback(async (weekAgo: string, today: string) => {
    const { data: sales, error } = await supabase
      .from('sales')
      .select('total_amount, created_at')
      .eq('sale_type', 'sale')
      .eq('status', 'completed')
      .gte('created_at', weekAgo + 'T00:00:00')
      .lte('created_at', today + 'T23:59:59');

    if (error) throw error;

    const dailySales: number[] = [];
    const dates: string[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = toMexicoDate(date);
      
      const daySum = sales?.filter(s => {
        const saleDate = toMexicoDate(new Date(s.created_at));
        return saleDate === dateString;
      }).reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0;

      dailySales.push(daySum);
      dates.push(dateString);
    }

    return {
      weeklyTrend: {
        sales: dailySales,
        dates
      }
    };
  }, [supabase]);

  // ✅ FUNCIÓN DE REFRESH
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardStats();
  }, [loadDashboardStats]);

  // ✅ CARGAR DATOS AL INICIALIZAR
  useEffect(() => {
    loadDashboardStats();
  }, [loadDashboardStats]);

  // ✅ AUTO-REFRESH CADA 5 MINUTOS
  useEffect(() => {
    const interval = setInterval(() => {
      if (!refreshing && !loading) {
        loadDashboardStats();
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [loadDashboardStats, refreshing, loading]);

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
          <CircularProgress 
            size={80} 
            sx={{ 
              color: darkProTokens.primary,
              mb: 3,
              filter: `drop-shadow(0 0 20px ${darkProTokens.primary}60)`
            }} 
          />
          <Typography variant="h5" sx={{ color: darkProTokens.textPrimary, mb: 1 }}>
            Cargando Dashboard
          </Typography>
          <Typography sx={{ color: darkProTokens.textSecondary }}>
            Obteniendo estadísticas del gimnasio...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 3,
      background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
      minHeight: '100vh',
      color: darkProTokens.textPrimary
    }}>
      {/* 🚨 SNACKBAR DE ERROR */}
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
            fontWeight: 600
          }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* 🎯 HEADER PRINCIPAL */}
      <Paper sx={{
        p: 4,
        mb: 4,
        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
        border: `1px solid ${darkProTokens.grayDark}`,
        borderRadius: 4,
        backdropFilter: 'blur(10px)'
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar sx={{ 
              bgcolor: darkProTokens.primary, 
              width: 80, 
              height: 80,
              boxShadow: `0 0 30px ${darkProTokens.primary}40`
            }}>
              <AssessmentIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Box>
              <Typography variant="h3" sx={{ 
                color: darkProTokens.primary, 
                fontWeight: 800,
                textShadow: `0 0 20px ${darkProTokens.primary}40`,
                mb: 1
              }}>
                Dashboard MuscleUp Gym
              </Typography>
              <Typography variant="h6" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                📊 Panel de control administrativo en tiempo real
              </Typography>
              {lastUpdate && (
                <Typography variant="caption" sx={{ 
                  color: darkProTokens.textDisabled,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <ScheduleIcon sx={{ fontSize: 14 }} />
                  Última actualización: {lastUpdate}
                </Typography>
              )}
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip
              icon={<CheckCircleIcon />}
              label="Sistema Activo"
              size="small"
              sx={{
                bgcolor: `${darkProTokens.success}20`,
                color: darkProTokens.success,
                border: `1px solid ${darkProTokens.success}40`,
                fontWeight: 600
              }}
            />
            
            <Button
              size="large"
              startIcon={refreshing ? <CircularProgress size={20} sx={{ color: darkProTokens.background }} /> : <RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing}
              variant="contained"
              sx={{ 
                background: `linear-gradient(135deg, ${darkProTokens.info}, ${darkProTokens.infoHover})`,
                fontWeight: 700,
                px: 3,
                borderRadius: 3,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 25px ${darkProTokens.info}50`
                },
                transition: 'all 0.3s ease'
              }}
            >
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </Box>
        </Box>

        {/* 📊 RESUMEN EJECUTIVO */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 3,
          bgcolor: `${darkProTokens.success}10`,
          borderRadius: 3,
          border: `1px solid ${darkProTokens.success}30`
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: darkProTokens.success, fontWeight: 700 }}>
              {stats.clientUsers}
            </Typography>
            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
              👥 Clientes Registrados
            </Typography>
          </Box>
          
          <Divider orientation="vertical" flexItem sx={{ borderColor: darkProTokens.grayDark }} />
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: darkProTokens.primary, fontWeight: 700 }}>
              {stats.activeMemberships}
            </Typography>
            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
              🏋️ Membresías Activas
            </Typography>
          </Box>
          
          <Divider orientation="vertical" flexItem sx={{ borderColor: darkProTokens.grayDark }} />
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: darkProTokens.info, fontWeight: 700 }}>
              {formatPrice(stats.todaySales)}
            </Typography>
            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
              💰 Ventas del Día
            </Typography>
          </Box>
          
          <Divider orientation="vertical" flexItem sx={{ borderColor: darkProTokens.grayDark }} />
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ 
              color: stats.todayBalance >= 0 ? darkProTokens.success : darkProTokens.error, 
              fontWeight: 700 
            }}>
              {formatPrice(stats.todayBalance)}
            </Typography>
            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
              📈 Balance del Día
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* 📊 ESTADÍSTICAS PRINCIPALES */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* 👥 USUARIOS */}
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.roleStaff}, ${darkProTokens.infoHover})`,
              color: darkProTokens.textPrimary,
              borderRadius: 4,
              overflow: 'hidden',
              position: 'relative',
              cursor: 'pointer',
              '&:hover': { 
                boxShadow: `0 12px 40px ${darkProTokens.roleStaff}40`
              }
            }}
            onClick={() => router.push('/dashboard/admin/usuarios')}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Avatar sx={{ bgcolor: `${darkProTokens.textPrimary}20`, width: 56, height: 56 }}>
                    <PeopleIcon sx={{ fontSize: 30, color: darkProTokens.textPrimary }} />
                  </Avatar>
                  <Badge badgeContent={stats.newUsersToday} color="error" max={99}>
                    <Chip 
                      label="HOY" 
                      size="small" 
                      sx={{ 
                        bgcolor: `${darkProTokens.textPrimary}20`,
                        color: darkProTokens.textPrimary,
                        fontWeight: 600
                      }} 
                    />
                  </Badge>
                </Box>
                
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                  {stats.totalUsers}
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                  Usuarios Totales
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title={`Hombres: ${stats.usersByGender.male}`}>
                      <Chip 
                        icon={<MaleIcon />}
                        label={stats.usersByGender.male}
                        size="small"
                        sx={{ bgcolor: `${darkProTokens.info}30`, color: darkProTokens.textPrimary }}
                      />
                    </Tooltip>
                    <Tooltip title={`Mujeres: ${stats.usersByGender.female}`}>
                      <Chip 
                        icon={<FemaleIcon />}
                        label={stats.usersByGender.female}
                        size="small"
                        sx={{ bgcolor: `${darkProTokens.roleModerator}30`, color: darkProTokens.textPrimary }}
                      />
                    </Tooltip>
                  </Box>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    +{stats.newUsersMonth} este mes
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* 🏋️ MEMBRESÍAS */}
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})`,
              color: darkProTokens.textPrimary,
              borderRadius: 4,
              overflow: 'hidden',
              position: 'relative',
              cursor: 'pointer',
              '&:hover': { 
                boxShadow: `0 12px 40px ${darkProTokens.success}40`
              }
            }}
            onClick={() => router.push('/dashboard/admin/membresias')}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Avatar sx={{ bgcolor: `${darkProTokens.textPrimary}20`, width: 56, height: 56 }}>
                    <FitnessCenterIcon sx={{ fontSize: 30, color: darkProTokens.textPrimary }} />
                  </Avatar>
                  {stats.expiringMemberships > 0 && (
                    <Badge badgeContent={stats.expiringMemberships} color="error" max={99}>
                      <WarningIcon sx={{ color: darkProTokens.warning }} />
                    </Badge>
                  )}
                </Box>
                
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                  {stats.activeMemberships}
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                  Membresías Activas
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip 
                      label={`${stats.expiringMemberships} por vencer`}
                      size="small"
                      sx={{ 
                        bgcolor: stats.expiringMemberships > 0 ? `${darkProTokens.warning}30` : `${darkProTokens.textPrimary}20`,
                        color: darkProTokens.textPrimary 
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatPrice(stats.membershipRevenue)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* 💰 VENTAS */}
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
              color: darkProTokens.background,
              borderRadius: 4,
              overflow: 'hidden',
              position: 'relative',
              cursor: 'pointer',
              '&:hover': { 
                boxShadow: `0 12px 40px ${darkProTokens.primary}40`
              }
            }}
            onClick={() => router.push('/dashboard/admin/sales/history')}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Avatar sx={{ bgcolor: `${darkProTokens.background}20`, width: 56, height: 56 }}>
                    <SalesIcon sx={{ fontSize: 30, color: darkProTokens.background }} />
                  </Avatar>
                  <Badge badgeContent={stats.todayTransactions} color="error" max={99}>
                    <Chip 
                      label="Transacciones" 
                      size="small" 
                      sx={{ 
                        bgcolor: `${darkProTokens.background}20`,
                        color: darkProTokens.background,
                        fontWeight: 600
                      }} 
                    />
                  </Badge>
                </Box>
                
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                  {formatPrice(stats.todaySales)}
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                  Ventas del Día
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Ticket promedio: {formatPrice(stats.todayAvgTicket)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingUpIcon sx={{ fontSize: 16 }} />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      +{stats.monthTransactions} mes
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* 📦 APARTADOS */}
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.roleModerator}, #7b1fa2)`,
              color: darkProTokens.textPrimary,
              borderRadius: 4,
              overflow: 'hidden',
              position: 'relative',
              cursor: 'pointer',
              '&:hover': { 
                boxShadow: `0 12px 40px ${darkProTokens.roleModerator}40`
              }
            }}
            onClick={() => router.push('/dashboard/admin/layaways/management')}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Avatar sx={{ bgcolor: `${darkProTokens.textPrimary}20`, width: 56, height: 56 }}>
                    <LayawayIcon sx={{ fontSize: 30, color: darkProTokens.textPrimary }} />
                  </Avatar>
                  {stats.expiringLayaways > 0 && (
                    <Badge badgeContent={stats.expiringLayaways} color="error" max={99}>
                      <ScheduleIcon sx={{ color: darkProTokens.warning }} />
                    </Badge>
                  )}
                </Box>
                
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                  {stats.activeLayaways}
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                  Apartados Activos
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Pendiente: {formatPrice(stats.layawaysPendingAmount)}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Cobrado: {formatPrice(stats.layawaysCollectedAmount)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* 💳 MÉTODOS DE PAGO DEL DÍA */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `1px solid ${darkProTokens.grayDark}`,
            borderRadius: 4
          }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ 
                color: darkProTokens.primary, 
                mb: 3, 
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}>
                <PaymentIcon />
                💳 Métodos de Pago del Día
              </Typography>
              
              <Grid container spacing={3}>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Paper sx={{
                    p: 3,
                    textAlign: 'center',
                    background: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})`,
                    color: darkProTokens.textPrimary,
                    borderRadius: 3
                  }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {formatPrice(stats.cashFlow.efectivo)}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      💵 Efectivo
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid size={{ xs: 6, md: 3 }}>
                  <Paper sx={{
                    p: 3,
                    textAlign: 'center',
                    background: `linear-gradient(135deg, ${darkProTokens.info}, ${darkProTokens.infoHover})`,
                    color: darkProTokens.textPrimary,
                    borderRadius: 3
                  }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {formatPrice(stats.cashFlow.transferencia)}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      🏦 Transferencia
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid size={{ xs: 6, md: 3 }}>
                  <Paper sx={{
                    p: 3,
                    textAlign: 'center',
                    background: `linear-gradient(135deg, ${darkProTokens.roleTrainer}, #00695c)`,
                    color: darkProTokens.textPrimary,
                    borderRadius: 3
                  }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {formatPrice(stats.cashFlow.debito)}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      💳 Débito
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid size={{ xs: 6, md: 3 }}>
                  <Paper sx={{
                    p: 3,
                    textAlign: 'center',
                    background: `linear-gradient(135deg, ${darkProTokens.warning}, ${darkProTokens.warningHover})`,
                    color: darkProTokens.background,
                    borderRadius: 3
                  }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {formatPrice(stats.cashFlow.credito)}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      💳 Crédito
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `1px solid ${darkProTokens.grayDark}`,
            borderRadius: 4,
            height: '100%'
          }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ 
                color: darkProTokens.primary, 
                mb: 3, 
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}>
                <InsightsIcon />
                📈 Accesos Rápidos
              </Typography>
              
              <Stack spacing={2}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  onClick={() => router.push('/dashboard/admin/membresias/registrar')}
                  sx={{
                    background: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})`,
                    justifyContent: 'flex-start',
                    py: 1.5
                  }}
                >
                  💰 Nueva Venta
                </Button>
                
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ReceiptIcon />}
                  onClick={() => router.push('/dashboard/admin/cortes')}
                  sx={{
                    color: darkProTokens.textPrimary,
                    borderColor: darkProTokens.grayDark,
                    justifyContent: 'flex-start',
                    py: 1.5,
                    '&:hover': {
                      borderColor: darkProTokens.primary,
                      bgcolor: `${darkProTokens.primary}10`
                    }
                  }}
                >
                  💼 Corte de Caja
                </Button>
                
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AnalyticsIcon />}
                  onClick={() => router.push('/dashboard/admin/reportes')}
                  sx={{
                    color: darkProTokens.textPrimary,
                    borderColor: darkProTokens.grayDark,
                    justifyContent: 'flex-start',
                    py: 1.5,
                    '&:hover': {
                      borderColor: darkProTokens.info,
                      bgcolor: `${darkProTokens.info}10`
                    }
                  }}
                >
                  📊 Reportes
                </Button>
                
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FitnessCenterIcon />}
                  onClick={() => router.push('/dashboard/admin/planes')}
                  sx={{
                    color: darkProTokens.textPrimary,
                    borderColor: darkProTokens.grayDark,
                    justifyContent: 'flex-start',
                    py: 1.5,
                    '&:hover': {
                      borderColor: darkProTokens.roleModerator,
                      bgcolor: `${darkProTokens.roleModerator}10`
                    }
                  }}
                >
                  🏋️ Gestionar Planes
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 📈 TENDENCIA DE VENTAS SEMANAL */}
      {stats.weeklyTrend.sales.length > 0 && (
        <Card sx={{
          mb: 4,
          background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
          border: `1px solid ${darkProTokens.grayDark}`,
          borderRadius: 4
        }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ 
              color: darkProTokens.primary, 
              mb: 3, 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <TrendingUpIcon />
              📈 Tendencia de Ventas (Últimos 7 días)
            </Typography>
            
            <Grid container spacing={2}>
              {stats.weeklyTrend.sales.map((amount, index) => {
                const maxAmount = Math.max(...stats.weeklyTrend.sales);
                const percentage = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
                const isToday = index === stats.weeklyTrend.sales.length - 1;
                
                return (
                  <Grid size={{ xs: 12/7 }} key={index}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ 
                        color: isToday ? darkProTokens.primary : darkProTokens.textPrimary,
                        fontWeight: isToday ? 700 : 500,
                        mb: 1
                      }}>
                        {formatPrice(amount)}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={percentage}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: darkProTokens.grayDark,
                          mb: 1,
                          '& .MuiLinearProgress-bar': {
                            bgcolor: isToday ? darkProTokens.primary : darkProTokens.success,
                            borderRadius: 4
                          }
                        }}
                      />
                      <Typography variant="caption" sx={{ 
                        color: isToday ? darkProTokens.primary : darkProTokens.textSecondary,
                        fontWeight: isToday ? 600 : 400
                      }}>
                        {stats.weeklyTrend.dates[index]?.split('-').slice(1).join('/')}
                        {isToday && ' (Hoy)'}
                      </Typography>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* 🎨 ESTILOS CSS DARK PRO PERSONALIZADOS */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { 
            opacity: 1; 
            transform: scale(1);
          }
          50% { 
            opacity: 0.8; 
            transform: scale(1.02);
          }
        }
        
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 5px ${darkProTokens.primary}40;
          }
          50% {
            box-shadow: 0 0 20px ${darkProTokens.primary}60, 0 0 30px ${darkProTokens.primary}40;
          }
        }
        
        /* Scrollbar personalizado para Dark Pro System */
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
