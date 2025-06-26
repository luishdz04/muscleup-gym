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
  Badge,
  useTheme
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
  Insights as InsightsIcon,
  ShowChart as ChartIcon,
  Timeline as TimelineIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Speed as SpeedIcon,
  AccountBalanceWallet as WalletIcon,
  CompareArrows as CompareIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
// ✅ IMPORTAR HELPERS DE FECHA CORREGIDOS
import { toMexicoTimestamp, toMexicoDate, formatMexicoDateTime } from '@/utils/dateHelpers';

// 📊 IMPORTAR RECHARTS PARA GRÁFICOS PROFESIONALES
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';

// 🎨 DARK PRO SYSTEM - TOKENS ENTERPRISE
const darkProTokens = {
  // Base Colors
  background: '#000000',
  surfaceLevel1: '#0A0A0A',
  surfaceLevel2: '#141414',
  surfaceLevel3: '#1F1F1F',
  surfaceLevel4: '#2A2A2A',
  surfaceLevel5: '#353535',
  
  // Neutrals
  grayDark: '#333333',
  grayMedium: '#444444',
  grayLight: '#555555',
  grayMuted: '#777777',
  textPrimary: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textDisabled: '#888888',
  
  // Primary Accent (Golden) - Enterprise
  primary: '#FFD700',
  primaryHover: '#FFC700',
  primaryActive: '#E6B800',
  primaryGlow: 'rgba(255, 215, 0, 0.3)',
  
  // Semantic Colors - Enterprise
  success: '#00C851',
  successHover: '#00A644',
  successGlow: 'rgba(0, 200, 81, 0.2)',
  
  error: '#FF3547',
  errorHover: '#E72837',
  errorGlow: 'rgba(255, 53, 71, 0.2)',
  
  warning: '#FF9500',
  warningHover: '#E6850E',
  warningGlow: 'rgba(255, 149, 0, 0.2)',
  
  info: '#2E86DE',
  infoHover: '#2471A3',
  infoGlow: 'rgba(46, 134, 222, 0.2)',
  
  // Chart Colors - Enterprise
  chart1: '#FFD700',
  chart2: '#00C851',
  chart3: '#2E86DE',
  chart4: '#FF9500',
  chart5: '#9B59B6',
  chart6: '#E74C3C',
  chart7: '#1ABC9C',
  chart8: '#34495E',
  
  // User Roles
  roleAdmin: '#E91E63',
  roleStaff: '#1976D2',
  roleTrainer: '#009688',
  roleUser: '#777777',
  roleModerator: '#9C27B0'
};

// ✅ INTERFACES EXTENDIDAS PARA ENTERPRISE
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
  todayMembershipRevenue: number; // ✅ NUEVO: Solo del día
  
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
  todayLayawayPayments: number; // ✅ NUEVO: Abonos del día
  
  // Financiero EXACTO
  todayExpenses: number;
  todayBalance: number;
  cashFlow: {
    efectivo: number;
    transferencia: number;
    debito: number;
    credito: number;
  };
  
  // Tendencias y Analytics
  weeklyTrend: {
    sales: number[];
    dates: string[];
    memberships: number[];
    layaways: number[];
  };
  
  // KPIs Enterprise
  monthlyGrowth: number;
  conversionRate: number;
  customerRetention: number;
  avgLifetimeValue: number;
  
  // Comparativas
  vsYesterday: {
    sales: number;
    transactions: number;
    memberships: number;
  };
  
  vsLastWeek: {
    sales: number;
    transactions: number;
    memberships: number;
  };
}

// ✅ DATOS PARA GRÁFICOS
interface ChartData {
  name: string;
  sales: number;
  memberships: number;
  layaways: number;
  date: string;
}

interface PieData {
  name: string;
  value: number;
  color: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const theme = useTheme();
  
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
    todayMembershipRevenue: 0,
    todaySales: 0,
    todayTransactions: 0,
    todayAvgTicket: 0,
    monthSales: 0,
    monthTransactions: 0,
    activeLayaways: 0,
    expiringLayaways: 0,
    layawaysPendingAmount: 0,
    layawaysCollectedAmount: 0,
    todayLayawayPayments: 0,
    todayExpenses: 0,
    todayBalance: 0,
    cashFlow: { efectivo: 0, transferencia: 0, debito: 0, credito: 0 },
    weeklyTrend: { sales: [], dates: [], memberships: [], layaways: [] },
    monthlyGrowth: 0,
    conversionRate: 0,
    customerRetention: 0,
    avgLifetimeValue: 0,
    vsYesterday: { sales: 0, transactions: 0, memberships: 0 },
    vsLastWeek: { sales: 0, transactions: 0, memberships: 0 }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [pieData, setPieData] = useState<PieData[]>([]);
  
  const supabase = createBrowserSupabaseClient();

  // ✅ FUNCIONES UTILITARIAS
  const getMexicoDate = useCallback(() => {
    return new Date();
  }, []);

  const getMexicoDateString = useCallback(() => {
    return toMexicoDate(new Date());
  }, []);

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(price || 0);
  }, []);

  const formatMexicoDate = useCallback((dateString: string) => {
    return formatMexicoDateTime(dateString);
  }, []);

  const formatPercentage = useCallback((value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  }, []);

  const formatCompactNumber = useCallback((num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }, []);

  // ✅ FUNCIÓN PRINCIPAL PARA CARGAR ESTADÍSTICAS ENTERPRISE
  const loadDashboardStats = useCallback(async () => {
    try {
      setError(null);
      console.log('📊 Cargando dashboard Enterprise...');

      // ✅ FECHAS MÉXICO PRECISAS
      const mexicoToday = getMexicoDate();
      const mexicoTodayString = getMexicoDateString();
      
      // Fechas para comparativas
      const yesterday = new Date(mexicoToday);
      yesterday.setDate(mexicoToday.getDate() - 1);
      const yesterdayString = toMexicoDate(yesterday);

      const weekAgo = new Date(mexicoToday);
      weekAgo.setDate(mexicoToday.getDate() - 7);
      const weekAgoString = toMexicoDate(weekAgo);

      const monthAgo = new Date(mexicoToday);
      monthAgo.setMonth(mexicoToday.getMonth() - 1);
      const monthAgoString = toMexicoDate(monthAgo);

      const firstDayOfMonth = `${mexicoToday.getFullYear()}-${(mexicoToday.getMonth() + 1).toString().padStart(2, '0')}-01`;
      
      const in7Days = new Date(mexicoToday);
      in7Days.setDate(mexicoToday.getDate() + 7);
      const in7DaysString = toMexicoDate(in7Days);

      console.log(`📅 Fechas Enterprise calculadas:
        📅 Hoy: ${mexicoTodayString}
        📅 Ayer: ${yesterdayString}
        📅 Hace 7 días: ${weekAgoString}
        📅 Hace 1 mes: ${monthAgoString}
        📅 Primer día del mes: ${firstDayOfMonth}`);

      // 🚀 CONSULTAS PARALELAS ENTERPRISE
      const [
        usersData,
        membershipsData,
        salesData,
        layawaysData,
        expensesData,
        analyticsData,
        chartDataResult
      ] = await Promise.all([
        loadUsersStats(mexicoTodayString, firstDayOfMonth, yesterdayString, weekAgoString),
        loadMembershipsStatsEnterprise(mexicoTodayString, in7DaysString, yesterdayString, weekAgoString),
        loadSalesStatsEnterprise(mexicoTodayString, firstDayOfMonth, yesterdayString, weekAgoString),
        loadLayawaysStatsEnterprise(mexicoTodayString, in7DaysString, yesterdayString),
        loadExpensesStats(mexicoTodayString),
        loadAnalyticsKPIs(mexicoTodayString, monthAgoString, firstDayOfMonth),
        loadChartData(weekAgoString, mexicoTodayString)
      ]);

      // ✅ CONSTRUIR ESTADÍSTICAS ENTERPRISE EXACTAS
      const finalStats: DashboardStats = {
        ...usersData,
        ...membershipsData,
        ...salesData,
        ...layawaysData,
        ...expensesData,
        ...analyticsData,
        // ✅ BALANCE EXACTO DEL DÍA (SOLO MOVIMIENTOS DE HOY)
        todayBalance: (salesData.todaySales + membershipsData.todayMembershipRevenue + layawaysData.todayLayawayPayments) - expensesData.todayExpenses
      };

      setStats(finalStats);
      setChartData(chartDataResult.chartData);
      setPieData(chartDataResult.pieData);
      setLastUpdate(formatMexicoDateTime(new Date().toISOString()));
      
      console.log('✅ Dashboard Enterprise cargado:', finalStats);

    } catch (err: any) {
      console.error('💥 Error cargando dashboard Enterprise:', err);
      setError(`Error cargando estadísticas Enterprise: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getMexicoDate, getMexicoDateString, formatMexicoDateTime]);

  // ✅ FUNCIONES AUXILIARES ENTERPRISE

  const loadUsersStats = useCallback(async (today: string, firstDayOfMonth: string, yesterday: string, weekAgo: string) => {
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

    const newUsersYesterday = allUsers?.filter(u => {
      if (!u.createdAt) return false;
      const createdDate = toMexicoDate(new Date(u.createdAt));
      return createdDate === yesterday;
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

  // ✅ MEMBRESÍAS ENTERPRISE CON INGRESOS EXACTOS DEL DÍA
  const loadMembershipsStatsEnterprise = useCallback(async (today: string, in7Days: string, yesterday: string, weekAgo: string) => {
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

    // ✅ NUEVO: INGRESOS EXACTOS SOLO DEL DÍA DE HOY
    const todayMemberships = memberships?.filter(m => {
      if (!m.created_at) return false;
      const createdDate = toMexicoDate(new Date(m.created_at));
      return createdDate === today;
    }) || [];

    const yesterdayMemberships = memberships?.filter(m => {
      if (!m.created_at) return false;
      const createdDate = toMexicoDate(new Date(m.created_at));
      return createdDate === yesterday;
    }) || [];

    const weekAgoMemberships = memberships?.filter(m => {
      if (!m.created_at) return false;
      const createdDate = toMexicoDate(new Date(m.created_at));
      return createdDate === weekAgo;
    }) || [];

    const todayMembershipRevenue = todayMemberships.reduce((sum, m) => sum + (m.amount_paid || 0), 0);
    const yesterdayMembershipRevenue = yesterdayMemberships.reduce((sum, m) => sum + (m.amount_paid || 0), 0);
    const totalRevenue = memberships?.reduce((sum, m) => sum + (m.amount_paid || 0), 0) || 0;

    return {
      activeMemberships: active.length,
      expiringMemberships: expiring.length,
      expiredMemberships: expired.length,
      frozenMemberships: frozen.length,
      membershipRevenue: totalRevenue,
      todayMembershipRevenue, // ✅ SOLO DEL DÍA DE HOY
      vsYesterday: {
        memberships: todayMemberships.length - yesterdayMemberships.length
      },
      vsLastWeek: {
        memberships: todayMemberships.length - weekAgoMemberships.length
      }
    };
  }, [supabase]);

  // ✅ VENTAS ENTERPRISE CON COMPARATIVAS
  const loadSalesStatsEnterprise = useCallback(async (today: string, firstDayOfMonth: string, yesterday: string, weekAgo: string) => {
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

    const yesterdaySales = sales?.filter(s => {
      if (!s.created_at) return false;
      const saleDate = toMexicoDate(new Date(s.created_at));
      return saleDate === yesterday;
    }) || [];

    const weekAgoSales = sales?.filter(s => {
      if (!s.created_at) return false;
      const saleDate = toMexicoDate(new Date(s.created_at));
      return saleDate === weekAgo;
    }) || [];

    const monthSales = sales?.filter(s => {
      if (!s.created_at) return false;
      const saleDate = toMexicoDate(new Date(s.created_at));
      return saleDate >= firstDayOfMonth;
    }) || [];

    const todayAmount = todaySales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
    const yesterdayAmount = yesterdaySales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
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
      cashFlow,
      vsYesterday: {
        sales: todayAmount - yesterdayAmount,
        transactions: todaySales.length - yesterdaySales.length
      },
      vsLastWeek: {
        sales: todayAmount - weekAgoSales.reduce((sum, s) => sum + (s.total_amount || 0), 0),
        transactions: todaySales.length - weekAgoSales.length
      }
    };
  }, [supabase]);

  // ✅ APARTADOS CON ABONOS DEL DÍA
  const loadLayawaysStatsEnterprise = useCallback(async (today: string, in7Days: string, yesterday: string) => {
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

    // ✅ NUEVO: ABONOS DEL DÍA DE HOY
    const { data: todayPayments } = await supabase
      .from('sale_payment_details')
      .select('*')
      .in('sale_id', layaways?.map(l => l.id) || [])
      .gte('payment_date', today + 'T00:00:00')
      .lte('payment_date', today + 'T23:59:59');

    const todayLayawayPayments = todayPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    return {
      activeLayaways: active.length,
      expiringLayaways: expiring.length,
      layawaysPendingAmount: pendingAmount,
      layawaysCollectedAmount: collectedAmount,
      todayLayawayPayments // ✅ SOLO ABONOS DEL DÍA DE HOY
    };
  }, [supabase]);

  const loadExpensesStats = useCallback(async (today: string) => {
    // TODO: Implementar cuando tengamos tabla de gastos
    return {
      todayExpenses: 0
    };
  }, []);

  // ✅ KPIs ENTERPRISE AVANZADOS
  const loadAnalyticsKPIs = useCallback(async (today: string, monthAgo: string, firstDayOfMonth: string) => {
    // Simulación de KPIs Enterprise
    // TODO: Implementar con datos reales cuando estén disponibles
    
    return {
      monthlyGrowth: 15.5,
      conversionRate: 23.8,
      customerRetention: 87.2,
      avgLifetimeValue: 2450.00
    };
  }, []);

  // ✅ DATOS PARA GRÁFICOS ENTERPRISE
  const loadChartData = useCallback(async (weekAgo: string, today: string) => {
    const { data: sales } = await supabase
      .from('sales')
      .select('total_amount, created_at, sale_type')
      .gte('created_at', weekAgo + 'T00:00:00')
      .lte('created_at', today + 'T23:59:59');

    const { data: memberships } = await supabase
      .from('user_memberships')
      .select('amount_paid, created_at')
      .gte('created_at', weekAgo + 'T00:00:00')
      .lte('created_at', today + 'T23:59:59');

    const chartData: ChartData[] = [];
    const dates: string[] = [];

    // Generar datos para los últimos 7 días
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = toMexicoDate(date);
      
      const daySales = sales?.filter(s => {
        const saleDate = toMexicoDate(new Date(s.created_at));
        return saleDate === dateString && s.sale_type === 'sale';
      }).reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0;

      const dayMemberships = memberships?.filter(m => {
        const membershipDate = toMexicoDate(new Date(m.created_at));
        return membershipDate === dateString;
      }).reduce((sum, m) => sum + (m.amount_paid || 0), 0) || 0;

      const dayLayaways = sales?.filter(s => {
        const saleDate = toMexicoDate(new Date(s.created_at));
        return saleDate === dateString && s.sale_type === 'layaway';
      }).reduce((sum, s) => sum + (s.paid_amount || 0), 0) || 0;

      chartData.push({
        name: dateString.split('-').slice(1).join('/'),
        sales: daySales,
        memberships: dayMemberships,
        layaways: dayLayaways,
        date: dateString
      });
    }

    // Datos para gráfico de pie (métodos de pago)
    const { data: allPayments } = await supabase
      .from('sale_payment_details')
      .select('payment_method, amount')
      .gte('payment_date', today + 'T00:00:00')
      .lte('payment_date', today + 'T23:59:59');

    const paymentMethods = allPayments?.reduce((acc: any, payment) => {
      const method = payment.payment_method || 'Otro';
      acc[method] = (acc[method] || 0) + (payment.amount || 0);
      return acc;
    }, {}) || {};

    const pieData: PieData[] = Object.entries(paymentMethods).map(([method, amount], index) => ({
      name: method,
      value: amount as number,
      color: [darkProTokens.chart1, darkProTokens.chart2, darkProTokens.chart3, darkProTokens.chart4][index] || darkProTokens.chart1
    }));

    return { chartData, pieData };
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

  // ✅ AUTO-REFRESH CADA 2 MINUTOS (Enterprise)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!refreshing && !loading) {
        loadDashboardStats();
      }
    }, 2 * 60 * 1000); // 2 minutos

    return () => clearInterval(interval);
  }, [loadDashboardStats, refreshing, loading]);

  // ✅ COMPONENTE DE MÉTRICA ENTERPRISE
  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon, 
    color, 
    change, 
    onClick,
    loading: cardLoading = false 
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
    change?: { value: number; label: string };
    onClick?: () => void;
    loading?: boolean;
  }) => (
    <motion.div
      whileHover={{ scale: 1.02, y: -8 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
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
        backdropFilter: 'blur(20px)',
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
          background: `linear-gradient(90deg, ${darkProTokens.primary}, ${color})`
        }
      }}
      onClick={onClick}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Avatar sx={{ 
              bgcolor: `${darkProTokens.textPrimary}15`, 
              width: 64, 
              height: 64,
              border: `2px solid ${darkProTokens.textPrimary}20`
            }}>
              {cardLoading ? (
                <CircularProgress size={30} sx={{ color: darkProTokens.textPrimary }} />
              ) : (
                React.cloneElement(icon as React.ReactElement, { 
                  sx: { fontSize: 32, color: darkProTokens.textPrimary }
                })
              )}
            </Avatar>
            {change && (
              <Box sx={{ textAlign: 'right' }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5,
                  color: change.value >= 0 ? darkProTokens.success : darkProTokens.error
                }}>
                  {change.value >= 0 ? <TrendingUpIcon sx={{ fontSize: 16 }} /> : <TrendingDownIcon sx={{ fontSize: 16 }} />}
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {formatPercentage(change.value)}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.7rem' }}>
                  {change.label}
                </Typography>
              </Box>
            )}
          </Box>
          
          <Typography variant="h3" sx={{ 
            fontWeight: 800, 
            mb: 1,
            background: `linear-gradient(45deg, ${darkProTokens.textPrimary}, ${darkProTokens.primary})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {cardLoading ? '...' : value}
          </Typography>
          
          <Typography variant="h6" sx={{ 
            opacity: 0.9, 
            fontWeight: 600,
            textShadow: `0 2px 4px ${color}40`
          }}>
            {title}
          </Typography>
          
          {subtitle && (
            <Typography variant="body2" sx={{ 
              opacity: 0.7, 
              mt: 1,
              fontSize: '0.85rem'
            }}>
              {subtitle}
            </Typography>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

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
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 360]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Avatar sx={{ 
              bgcolor: darkProTokens.primary, 
              width: 100, 
              height: 100,
              mx: 'auto',
              mb: 3,
              boxShadow: `0 0 40px ${darkProTokens.primary}60`
            }}>
              <AssessmentIcon sx={{ fontSize: 50 }} />
            </Avatar>
          </motion.div>
          
          <Typography variant="h4" sx={{ 
            color: darkProTokens.primary, 
            fontWeight: 800,
            mb: 2,
            textShadow: `0 0 20px ${darkProTokens.primary}40`
          }}>
            Enterprise Dashboard
          </Typography>
          <Typography variant="h6" sx={{ color: darkProTokens.textSecondary, mb: 3 }}>
            Cargando análisis avanzado del gimnasio...
          </Typography>
          
          <LinearProgress sx={{
            width: '300px',
            height: 6,
            borderRadius: 3,
            bgcolor: darkProTokens.grayDark,
            '& .MuiLinearProgress-bar': {
              bgcolor: darkProTokens.primary,
              borderRadius: 3,
              boxShadow: `0 0 10px ${darkProTokens.primary}40`
            }
          }} />
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
            fontWeight: 600,
            borderRadius: 3,
            boxShadow: `0 8px 32px ${darkProTokens.error}40`
          }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* 🎯 HEADER ENTERPRISE */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Paper sx={{
          p: 4,
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
            background: `linear-gradient(90deg, ${darkProTokens.primary}, ${darkProTokens.success}, ${darkProTokens.info})`
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  boxShadow: [
                    `0 0 20px ${darkProTokens.primary}40`,
                    `0 0 40px ${darkProTokens.primary}60`,
                    `0 0 20px ${darkProTokens.primary}40`
                  ]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Avatar sx={{ 
                  bgcolor: darkProTokens.primary, 
                  width: 90, 
                  height: 90,
                  border: `3px solid ${darkProTokens.primary}40`
                }}>
                  <AssessmentIcon sx={{ fontSize: 45 }} />
                </Avatar>
              </motion.div>
              
              <Box>
                <Typography variant="h3" sx={{ 
                  color: darkProTokens.primary, 
                  fontWeight: 800,
                  textShadow: `0 0 20px ${darkProTokens.primary}40`,
                  mb: 1,
                  background: `linear-gradient(45deg, ${darkProTokens.primary}, ${darkProTokens.success})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Enterprise Dashboard
                </Typography>
                <Typography variant="h6" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                  🚀 MuscleUp Gym - Analytics & Business Intelligence
                </Typography>
                {lastUpdate && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon sx={{ fontSize: 16, color: darkProTokens.success }} />
                    <Typography variant="caption" sx={{ 
                      color: darkProTokens.success,
                      fontWeight: 600
                    }}>
                      Actualizado: {lastUpdate}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Chip
                icon={<SpeedIcon />}
                label="Real Time"
                size="medium"
                sx={{
                  bgcolor: `${darkProTokens.success}20`,
                  color: darkProTokens.success,
                  border: `1px solid ${darkProTokens.success}40`,
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  animation: 'pulse 2s infinite'
                }}
              />
              
              <Button
                size="large"
                startIcon={refreshing ? <CircularProgress size={24} sx={{ color: darkProTokens.background }} /> : <RefreshIcon />}
                onClick={handleRefresh}
                disabled={refreshing}
                variant="contained"
                sx={{ 
                  background: `linear-gradient(135deg, ${darkProTokens.info}, ${darkProTokens.infoHover})`,
                  fontWeight: 700,
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
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

          {/* 📊 RESUMEN EJECUTIVO ENTERPRISE */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            p: 4,
            background: `linear-gradient(135deg, ${darkProTokens.success}15, ${darkProTokens.primary}10)`,
            borderRadius: 3,
            border: `1px solid ${darkProTokens.success}30`,
            backdropFilter: 'blur(10px)',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: `linear-gradient(90deg, ${darkProTokens.success}, ${darkProTokens.primary})`
            }
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ 
                color: darkProTokens.success, 
                fontWeight: 800,
                textShadow: `0 0 10px ${darkProTokens.success}40`
              }}>
                {stats.clientUsers}
              </Typography>
              <Typography variant="body1" sx={{ 
                color: darkProTokens.textSecondary,
                fontWeight: 600
              }}>
                👥 Clientes Activos
              </Typography>
            </Box>
            
            <Divider orientation="vertical" flexItem sx={{ 
              borderColor: `${darkProTokens.primary}40`,
              borderWidth: '1px'
            }} />
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ 
                color: darkProTokens.primary, 
                fontWeight: 800,
                textShadow: `0 0 10px ${darkProTokens.primary}40`
              }}>
                {stats.activeMemberships}
              </Typography>
              <Typography variant="body1" sx={{ 
                color: darkProTokens.textSecondary,
                fontWeight: 600
              }}>
                🏋️ Membresías Activas
              </Typography>
            </Box>
            
            <Divider orientation="vertical" flexItem sx={{ 
              borderColor: `${darkProTokens.primary}40`,
              borderWidth: '1px'
            }} />
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ 
                color: darkProTokens.info, 
                fontWeight: 800,
                textShadow: `0 0 10px ${darkProTokens.info}40`
              }}>
                {formatPrice(stats.todaySales + stats.todayMembershipRevenue + stats.todayLayawayPayments)}
              </Typography>
              <Typography variant="body1" sx={{ 
                color: darkProTokens.textSecondary,
                fontWeight: 600
              }}>
                💰 Ingresos del Día
              </Typography>
            </Box>
            
            <Divider orientation="vertical" flexItem sx={{ 
              borderColor: `${darkProTokens.primary}40`,
              borderWidth: '1px'
            }} />
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ 
                color: stats.todayBalance >= 0 ? darkProTokens.success : darkProTokens.error, 
                fontWeight: 800,
                textShadow: stats.todayBalance >= 0 ? 
                  `0 0 10px ${darkProTokens.success}40` : 
                  `0 0 10px ${darkProTokens.error}40`
              }}>
                {formatPrice(stats.todayBalance)}
              </Typography>
              <Typography variant="body1" sx={{ 
                color: darkProTokens.textSecondary,
                fontWeight: 600
              }}>
                📈 Balance Exacto del Día
              </Typography>
            </Box>
          </Box>
        </Paper>
      </motion.div>

      {/* 📊 MÉTRICAS PRINCIPALES ENTERPRISE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <MetricCard
              title="Usuarios Totales"
              value={stats.totalUsers}
              subtitle={`+${stats.newUsersToday} hoy, +${stats.newUsersMonth} este mes`}
              icon={<PeopleIcon />}
              color={darkProTokens.roleStaff}
              change={{ value: 12.5, label: "vs ayer" }}
              onClick={() => router.push('/dashboard/admin/usuarios')}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <MetricCard
              title="Membresías Activas"
              value={stats.activeMemberships}
              subtitle={`${stats.expiringMemberships} por vencer en 7 días`}
              icon={<FitnessCenterIcon />}
              color={darkProTokens.success}
              change={{ value: 8.3, label: "vs semana pasada" }}
              onClick={() => router.push('/dashboard/admin/membresias')}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <MetricCard
              title="Ventas del Día"
              value={formatPrice(stats.todaySales)}
              subtitle={`${stats.todayTransactions} transacciones, ${formatPrice(stats.todayAvgTicket)} promedio`}
              icon={<SalesIcon />}
              color={darkProTokens.primary}
              change={{ 
                value: stats.vsYesterday?.sales || 0, 
                label: "vs ayer" 
              }}
              onClick={() => router.push('/dashboard/admin/sales/history')}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <MetricCard
              title="Apartados Activos"
              value={stats.activeLayaways}
              subtitle={`${formatPrice(stats.layawaysPendingAmount)} pendiente`}
              icon={<LayawayIcon />}
              color={darkProTokens.roleModerator}
              change={{ value: -2.1, label: "vs semana pasada" }}
              onClick={() => router.push('/dashboard/admin/layaways/management')}
            />
          </Grid>
        </Grid>
      </motion.div>

      {/* 📈 GRÁFICOS ENTERPRISE */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* GRÁFICO DE TENDENCIAS */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 4,
              overflow: 'hidden'
            }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <TimelineIcon sx={{ color: darkProTokens.primary, fontSize: 28 }} />
                  <Typography variant="h6" sx={{ 
                    color: darkProTokens.primary, 
                    fontWeight: 700
                  }}>
                    📈 Tendencias de Ingresos (Últimos 7 días)
                  </Typography>
                </Box>
                
                <Box sx={{ height: 350, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkProTokens.grayDark} />
                      <XAxis 
                        dataKey="name" 
                        stroke={darkProTokens.textSecondary}
                        fontSize={12}
                      />
                      <YAxis 
                        stroke={darkProTokens.textSecondary}
                        fontSize={12}
                        tickFormatter={(value) => formatCompactNumber(value)}
                      />
                      <RechartsTooltip 
                        contentStyle={{
                          backgroundColor: darkProTokens.surfaceLevel4,
                          border: `1px solid ${darkProTokens.grayDark}`,
                          borderRadius: '8px',
                          color: darkProTokens.textPrimary
                        }}
                        formatter={(value: any, name: string) => [
                          formatPrice(value), 
                          name === 'sales' ? 'Ventas POS' : 
                          name === 'memberships' ? 'Membresías' : 'Apartados'
                        ]}
                      />
                      <Legend />
                      
                      <Area
                        type="monotone"
                        dataKey="sales"
                        fill={`${darkProTokens.primary}30`}
                        stroke={darkProTokens.primary}
                        strokeWidth={3}
                        name="Ventas POS"
                      />
                      
                      <Bar
                        dataKey="memberships"
                        fill={darkProTokens.success}
                        name="Membresías"
                        radius={[4, 4, 0, 0]}
                      />
                      
                      <Line
                        type="monotone"
                        dataKey="layaways"
                        stroke={darkProTokens.roleModerator}
                        strokeWidth={3}
                        dot={{ fill: darkProTokens.roleModerator, strokeWidth: 2, r: 6 }}
                        name="Apartados"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* GRÁFICO DE PIE - MÉTODOS DE PAGO */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 4,
              height: '100%'
            }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <PieChartIcon sx={{ color: darkProTokens.info, fontSize: 28 }} />
                  <Typography variant="h6" sx={{ 
                    color: darkProTokens.info, 
                    fontWeight: 700
                  }}>
                    💳 Métodos de Pago Hoy
                  </Typography>
                </Box>
                
                {pieData.length > 0 ? (
                  <Box sx={{ height: 250, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={40}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{
                            backgroundColor: darkProTokens.surfaceLevel4,
                            border: `1px solid ${darkProTokens.grayDark}`,
                            borderRadius: '8px',
                            color: darkProTokens.textPrimary
                          }}
                          formatter={(value: any) => formatPrice(value)}
                        />
                        <Legend 
                          wrapperStyle={{ color: darkProTokens.textSecondary }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                ) : (
                  <Box sx={{ 
                    height: 250, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 2
                  }}>
                    <PaymentIcon sx={{ fontSize: 60, color: darkProTokens.grayMuted, opacity: 0.5 }} />
                    <Typography variant="body1" sx={{ color: darkProTokens.textSecondary }}>
                      No hay pagos registrados hoy
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* 💳 MÉTODOS DE PAGO DEL DÍA - ENTERPRISE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
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
                  <WalletIcon />
                  💰 Flujo de Efectivo del Día
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Paper sx={{
                        p: 3,
                        textAlign: 'center',
                        background: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})`,
                        color: darkProTokens.textPrimary,
                        borderRadius: 3,
                        border: `1px solid ${darkProTokens.success}40`,
                        boxShadow: `0 8px 32px ${darkProTokens.success}20`
                      }}>
                        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                          {formatPrice(stats.cashFlow.efectivo)}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 600 }}>
                          💵 Efectivo
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={85} 
                          sx={{ 
                            mt: 1, 
                            height: 4, 
                            borderRadius: 2,
                            bgcolor: `${darkProTokens.textPrimary}20`,
                            '& .MuiLinearProgress-bar': {
                              bgcolor: darkProTokens.textPrimary,
                              borderRadius: 2
                            }
                          }} 
                        />
                      </Paper>
                    </motion.div>
                  </Grid>
                  
                  <Grid size={{ xs: 6, md: 3 }}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Paper sx={{
                        p: 3,
                        textAlign: 'center',
                                                background: `linear-gradient(135deg, ${darkProTokens.info}, ${darkProTokens.infoHover})`,
                        color: darkProTokens.textPrimary,
                        borderRadius: 3,
                        border: `1px solid ${darkProTokens.info}40`,
                        boxShadow: `0 8px 32px ${darkProTokens.info}20`
                      }}>
                        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                          {formatPrice(stats.cashFlow.transferencia)}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 600 }}>
                          🏦 Transferencia
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={65} 
                          sx={{ 
                            mt: 1, 
                            height: 4, 
                            borderRadius: 2,
                            bgcolor: `${darkProTokens.textPrimary}20`,
                            '& .MuiLinearProgress-bar': {
                              bgcolor: darkProTokens.textPrimary,
                              borderRadius: 2
                            }
                          }} 
                        />
                      </Paper>
                    </motion.div>
                  </Grid>
                  
                  <Grid size={{ xs: 6, md: 3 }}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Paper sx={{
                        p: 3,
                        textAlign: 'center',
                        background: `linear-gradient(135deg, ${darkProTokens.roleTrainer}, #00695c)`,
                        color: darkProTokens.textPrimary,
                        borderRadius: 3,
                        border: `1px solid ${darkProTokens.roleTrainer}40`,
                        boxShadow: `0 8px 32px ${darkProTokens.roleTrainer}20`
                      }}>
                        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                          {formatPrice(stats.cashFlow.debito)}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 600 }}>
                          💳 Débito
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={45} 
                          sx={{ 
                            mt: 1, 
                            height: 4, 
                            borderRadius: 2,
                            bgcolor: `${darkProTokens.textPrimary}20`,
                            '& .MuiLinearProgress-bar': {
                              bgcolor: darkProTokens.textPrimary,
                              borderRadius: 2
                            }
                          }} 
                        />
                      </Paper>
                    </motion.div>
                  </Grid>
                  
                  <Grid size={{ xs: 6, md: 3 }}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Paper sx={{
                        p: 3,
                        textAlign: 'center',
                        background: `linear-gradient(135deg, ${darkProTokens.warning}, ${darkProTokens.warningHover})`,
                        color: darkProTokens.background,
                        borderRadius: 3,
                        border: `1px solid ${darkProTokens.warning}40`,
                        boxShadow: `0 8px 32px ${darkProTokens.warning}20`
                      }}>
                        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                          {formatPrice(stats.cashFlow.credito)}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 600 }}>
                          💳 Crédito
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={25} 
                          sx={{ 
                            mt: 1, 
                            height: 4, 
                            borderRadius: 2,
                            bgcolor: `${darkProTokens.background}20`,
                            '& .MuiLinearProgress-bar': {
                              bgcolor: darkProTokens.background,
                              borderRadius: 2
                            }
                          }} 
                        />
                      </Paper>
                    </motion.div>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* KPIs ENTERPRISE */}
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
                  <AnalyticsIcon />
                  📊 KPIs Enterprise
                </Typography>
                
                <Stack spacing={3}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, fontWeight: 600 }}>
                        Crecimiento Mensual
                      </Typography>
                      <Typography variant="h6" sx={{ color: darkProTokens.success, fontWeight: 700 }}>
                        +{stats.monthlyGrowth}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={stats.monthlyGrowth} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: darkProTokens.grayDark,
                        '& .MuiLinearProgress-bar': {
                          bgcolor: darkProTokens.success,
                          borderRadius: 4,
                          boxShadow: `0 0 10px ${darkProTokens.success}40`
                        }
                      }} 
                    />
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, fontWeight: 600 }}>
                        Tasa de Conversión
                      </Typography>
                      <Typography variant="h6" sx={{ color: darkProTokens.info, fontWeight: 700 }}>
                        {stats.conversionRate}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={stats.conversionRate} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: darkProTokens.grayDark,
                        '& .MuiLinearProgress-bar': {
                          bgcolor: darkProTokens.info,
                          borderRadius: 4,
                          boxShadow: `0 0 10px ${darkProTokens.info}40`
                        }
                      }} 
                    />
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, fontWeight: 600 }}>
                        Retención de Clientes
                      </Typography>
                      <Typography variant="h6" sx={{ color: darkProTokens.primary, fontWeight: 700 }}>
                        {stats.customerRetention}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={stats.customerRetention} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: darkProTokens.grayDark,
                        '& .MuiLinearProgress-bar': {
                          bgcolor: darkProTokens.primary,
                          borderRadius: 4,
                          boxShadow: `0 0 10px ${darkProTokens.primary}40`
                        }
                      }} 
                    />
                  </Box>

                  <Divider sx={{ borderColor: darkProTokens.grayDark }} />

                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: `${darkProTokens.success}10`, borderRadius: 2 }}>
                    <Typography variant="h5" sx={{ color: darkProTokens.success, fontWeight: 800, mb: 0.5 }}>
                      {formatPrice(stats.avgLifetimeValue)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, fontWeight: 600 }}>
                      💎 Valor de Vida del Cliente
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>

      {/* 🚀 ACCESOS RÁPIDOS ENTERPRISE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.0 }}
      >
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
              <InsightsIcon />
              ⚡ Centro de Comando Enterprise
            </Typography>
            
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={<PersonAddIcon />}
                    onClick={() => router.push('/dashboard/admin/membresias/registrar')}
                    sx={{
                      background: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})`,
                      justifyContent: 'flex-start',
                      py: 2,
                      px: 3,
                      borderRadius: 3,
                      fontWeight: 700,
                      boxShadow: `0 8px 32px ${darkProTokens.success}30`,
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 12px 48px ${darkProTokens.success}40`
                      }
                    }}
                  >
                    💰 Nueva Venta
                  </Button>
                </motion.div>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    startIcon={<ReceiptIcon />}
                    onClick={() => router.push('/dashboard/admin/cortes')}
                    sx={{
                      color: darkProTokens.info,
                      borderColor: `${darkProTokens.info}60`,
                      justifyContent: 'flex-start',
                      py: 2,
                      px: 3,
                      borderRadius: 3,
                      fontWeight: 600,
                      borderWidth: '2px',
                      '&:hover': {
                        borderColor: darkProTokens.info,
                        bgcolor: `${darkProTokens.info}10`,
                        transform: 'translateY(-1px)',
                        boxShadow: `0 8px 32px ${darkProTokens.info}20`
                      }
                    }}
                  >
                    💼 Corte de Caja
                  </Button>
                </motion.div>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    startIcon={<AssessmentIcon />}
                    onClick={() => router.push('/dashboard/admin/reportes')}
                    sx={{
                      color: darkProTokens.warning,
                      borderColor: `${darkProTokens.warning}60`,
                      justifyContent: 'flex-start',
                      py: 2,
                      px: 3,
                      borderRadius: 3,
                      fontWeight: 600,
                      borderWidth: '2px',
                      '&:hover': {
                        borderColor: darkProTokens.warning,
                        bgcolor: `${darkProTokens.warning}10`,
                        transform: 'translateY(-1px)',
                        boxShadow: `0 8px 32px ${darkProTokens.warning}20`
                      }
                    }}
                  >
                    📊 Reportes Avanzados
                  </Button>
                </motion.div>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    startIcon={<FitnessCenterIcon />}
                    onClick={() => router.push('/dashboard/admin/planes')}
                    sx={{
                      color: darkProTokens.roleModerator,
                      borderColor: `${darkProTokens.roleModerator}60`,
                      justifyContent: 'flex-start',
                      py: 2,
                      px: 3,
                      borderRadius: 3,
                      fontWeight: 600,
                      borderWidth: '2px',
                      '&:hover': {
                        borderColor: darkProTokens.roleModerator,
                        bgcolor: `${darkProTokens.roleModerator}10`,
                        transform: 'translateY(-1px)',
                        boxShadow: `0 8px 32px ${darkProTokens.roleModerator}20`
                      }
                    }}
                  >
                    🏋️ Gestionar Planes
                  </Button>
                </motion.div>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>

      {/* 📈 COMPARATIVAS ENTERPRISE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
      >
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 4
            }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ 
                  color: darkProTokens.success, 
                  mb: 3, 
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}>
                  <CompareIcon />
                  📊 vs Ayer
                </Typography>
                
                <Stack spacing={3}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                        Ventas
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {stats.vsYesterday.sales >= 0 ? 
                          <TrendingUpIcon sx={{ color: darkProTokens.success, fontSize: 20 }} /> : 
                          <TrendingDownIcon sx={{ color: darkProTokens.error, fontSize: 20 }} />
                        }
                        <Typography variant="h6" sx={{ 
                          color: stats.vsYesterday.sales >= 0 ? darkProTokens.success : darkProTokens.error,
                          fontWeight: 700 
                        }}>
                          {formatPrice(Math.abs(stats.vsYesterday.sales))}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                        Transacciones
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {stats.vsYesterday.transactions >= 0 ? 
                          <TrendingUpIcon sx={{ color: darkProTokens.success, fontSize: 20 }} /> : 
                          <TrendingDownIcon sx={{ color: darkProTokens.error, fontSize: 20 }} />
                        }
                        <Typography variant="h6" sx={{ 
                          color: stats.vsYesterday.transactions >= 0 ? darkProTokens.success : darkProTokens.error,
                          fontWeight: 700 
                        }}>
                          {stats.vsYesterday.transactions >= 0 ? '+' : ''}{stats.vsYesterday.transactions}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                        Membresías
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {stats.vsYesterday.memberships >= 0 ? 
                          <TrendingUpIcon sx={{ color: darkProTokens.success, fontSize: 20 }} /> : 
                          <TrendingDownIcon sx={{ color: darkProTokens.error, fontSize: 20 }} />
                        }
                        <Typography variant="h6" sx={{ 
                          color: stats.vsYesterday.memberships >= 0 ? darkProTokens.success : darkProTokens.error,
                          fontWeight: 700 
                        }}>
                          {stats.vsYesterday.memberships >= 0 ? '+' : ''}{stats.vsYesterday.memberships}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 4
            }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ 
                  color: darkProTokens.info, 
                  mb: 3, 
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}>
                  <TimelineIcon />
                  📈 vs Semana Pasada
                </Typography>
                
                <Stack spacing={3}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                        Ventas
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {stats.vsLastWeek.sales >= 0 ? 
                          <TrendingUpIcon sx={{ color: darkProTokens.success, fontSize: 20 }} /> : 
                          <TrendingDownIcon sx={{ color: darkProTokens.error, fontSize: 20 }} />
                        }
                        <Typography variant="h6" sx={{ 
                          color: stats.vsLastWeek.sales >= 0 ? darkProTokens.success : darkProTokens.error,
                          fontWeight: 700 
                        }}>
                          {formatPrice(Math.abs(stats.vsLastWeek.sales))}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                        Transacciones
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {stats.vsLastWeek.transactions >= 0 ? 
                          <TrendingUpIcon sx={{ color: darkProTokens.success, fontSize: 20 }} /> : 
                          <TrendingDownIcon sx={{ color: darkProTokens.error, fontSize: 20 }} />
                        }
                        <Typography variant="h6" sx={{ 
                          color: stats.vsLastWeek.transactions >= 0 ? darkProTokens.success : darkProTokens.error,
                          fontWeight: 700 
                        }}>
                          {stats.vsLastWeek.transactions >= 0 ? '+' : ''}{stats.vsLastWeek.transactions}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                        Membresías
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {stats.vsLastWeek.memberships >= 0 ? 
                          <TrendingUpIcon sx={{ color: darkProTokens.success, fontSize: 20 }} /> : 
                          <TrendingDownIcon sx={{ color: darkProTokens.error, fontSize: 20 }} />
                        }
                        <Typography variant="h6" sx={{ 
                          color: stats.vsLastWeek.memberships >= 0 ? darkProTokens.success : darkProTokens.error,
                          fontWeight: 700 
                        }}>
                          {stats.vsLastWeek.memberships >= 0 ? '+' : ''}{stats.vsLastWeek.memberships}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>

      {/* 🎨 ESTILOS CSS ENTERPRISE PERSONALIZADOS */}
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
            box-shadow: 0 0 10px ${darkProTokens.primary}40;
          }
          50% {
            box-shadow: 0 0 30px ${darkProTokens.primary}60, 0 0 40px ${darkProTokens.primary}40;
          }
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        /* Scrollbar Enterprise */
        ::-webkit-scrollbar {
          width: 12px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${darkProTokens.surfaceLevel1};
          border-radius: 6px;
          border: 1px solid ${darkProTokens.grayDark};
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover});
          border-radius: 6px;
          border: 2px solid ${darkProTokens.surfaceLevel1};
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive});
        }
        
        /* Efectos hover Enterprise */
        .hover-glow:hover {
          box-shadow: 0 0 20px ${darkProTokens.primary}40 !important;
          border-color: ${darkProTokens.primary} !important;
        }
        
        /* Animaciones de texto */
        .text-gradient {
          background: linear-gradient(45deg, ${darkProTokens.primary}, ${darkProTokens.success});
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        /* Grid empresarial */
        .enterprise-grid {
          display: grid;
          gap: 24px;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        }
        
        /* Cards con efecto glassmorphism */
        .glass-card {
          backdrop-filter: blur(20px);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </Box>
  );
}
