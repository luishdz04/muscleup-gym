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
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  PersonAdd as PersonAddIcon,
  Receipt as ReceiptIcon,
  Analytics as AnalyticsIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  CreditCard as PaymentIcon,
  Speed as SpeedIcon,
  Insights as InsightsIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  CompareArrows as CompareIcon,
  AccountBalance as AccountBalanceIcon,
  PieChart as PieChartIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

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
  // Colores para gráficos
  chart1: '#FFCC00',
  chart2: '#388E3C',
  chart3: '#1976D2',
  chart4: '#FFB300',
  chart5: '#9C27B0',
  chart6: '#D32F2F',
  chart7: '#009688',
  chart8: '#E91E63'
};

// ✅ FUNCIONES LOCALES (COPIADAS DE CORTES)
function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(amount || 0);
}

function getMexicoDateLocal(): string {
  const now = new Date();
  const mexicoDate = new Date(now.toLocaleString("en-US", {timeZone: "America/Mexico_City"}));
  const year = mexicoDate.getFullYear();
  const month = String(mexicoDate.getMonth() + 1).padStart(2, '0');
  const day = String(mexicoDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatMexicoTimeLocal(date: Date): string {
  return date.toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

function formatDateLocal(dateString: string): string {
  try {
    const date = new Date(dateString + 'T12:00:00');
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Mexico_City'
    });
  } catch (error) {
    console.error('❌ Error formateando fecha:', dateString, error);
    const date = new Date(dateString + 'T12:00:00');
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const weekdays = [
      'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'
    ];
    const weekday = weekdays[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${weekday}, ${day} de ${month} de ${year}`;
  }
}

function formatDateTime(dateString: string): string {
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

// ✅ FUNCIÓN PARA GENERAR FECHAS ANTERIORES
function getDateDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const mexicoDate = new Date(date.toLocaleString("en-US", {timeZone: "America/Mexico_City"}));
  const year = mexicoDate.getFullYear();
  const month = String(mexicoDate.getMonth() + 1).padStart(2, '0');
  const day = String(mexicoDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ✅ INTERFACES CORREGIDAS CON DATOS COMPLETOS
interface DailyData {
  date: string;
  timezone_info?: {
    mexico_date: string;
    mexico_range?: {
      start: string;
      end: string;
    };
    utc_range?: {
      start: string;
      end: string;
    };
    timezone?: string;
    note: string;
  };
  pos: {
    efectivo: number;
    transferencia: number;
    debito: number;
    credito: number;
    total: number;
    transactions: number;
    commissions: number;
  };
  abonos: {
    efectivo: number;
    transferencia: number;
    debito: number;
    credito: number;
    total: number;
    transactions: number;
    commissions: number;
  };
  memberships: {
    efectivo: number;
    transferencia: number;
    debito: number;
    credito: number;
    total: number;
    transactions: number;
    commissions: number;
  };
  totals: {
    efectivo: number;
    transferencia: number;
    debito: number;
    credito: number;
    total: number;
    transactions: number;
    commissions: number;
    net_amount: number;
  };
}

interface DashboardStats {
  totalUsers: number;
  clientUsers: number;
  newUsersToday: number;
  newUsersMonth: number;
  usersByGender: { male: number; female: number; other: number };
  activeMemberships: number;
  expiringMemberships: number;
  expiredMemberships: number;
  frozenMemberships: number;
  membershipRevenue: number;
  todayMembershipRevenue: number;
  todaySales: number;
  todayTransactions: number;
  todayAvgTicket: number;
  monthSales: number;
  monthTransactions: number;
  activeLayaways: number;
  expiringLayaways: number;
  layawaysPendingAmount: number;
  layawaysCollectedAmount: number;
  todayLayawayPayments: number;
  todayExpenses: number;
  todayBalance: number;
  cashFlow: {
    efectivo: number;
    transferencia: number;
    debito: number;
    credito: number;
  };
  weeklyTrend: {
    sales: number[];
    dates: string[];
    memberships: number[];
    layaways: number[];
  };
  chartData: ChartData[];
  pieData: PieData[];
}

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
    chartData: [],
    pieData: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [currentMexicoTime, setCurrentMexicoTime] = useState<string>('');
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  
  const supabase = createBrowserSupabaseClient();

  // ✅ FECHA ACTUAL EN MÉXICO
  const [selectedDate] = useState(() => {
    const mexicoDate = getMexicoDateLocal();
    console.log('🇲🇽 Fecha actual México (función local):', mexicoDate);
    return mexicoDate;
  });

  // ✅ ACTUALIZAR HORA EN TIEMPO REAL
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

  // ✅ FUNCIÓN PARA CARGAR DATOS DIARIOS REALES (NO FICTICIOS)
  const loadRealDailyData = useCallback(async (targetDate: string): Promise<DailyData | null> => {
    try {
      console.log(`📊 Cargando datos REALES para fecha: ${targetDate}`);
      
      const response = await fetch(`/api/cuts/daily-data?date=${targetDate}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.totals && data.totals.total > 0) {
          console.log(`✅ Datos REALES encontrados para ${targetDate}:`, {
            total: formatPrice(data.totals.total),
            pos: formatPrice(data.pos.total),
            memberships: formatPrice(data.memberships.total),
            abonos: formatPrice(data.abonos.total)
          });
          return data;
        } else {
          console.log(`⚪ Sin datos para ${targetDate}`);
          return null;
        }
      } else {
        console.log(`❌ Error API para ${targetDate}:`, response.status);
        return null;
      }
    } catch (error) {
      console.error(`💥 Error cargando datos para ${targetDate}:`, error);
      return null;
    }
  }, []);

  // ✅ FUNCIÓN PARA CARGAR DATOS HISTÓRICOS REALES (7 DÍAS)
  const loadWeeklyRealData = useCallback(async (): Promise<ChartData[]> => {
    console.log('📈 ===== CARGANDO DATOS HISTÓRICOS REALES =====');
    const chartData: ChartData[] = [];
    
    // Cargar datos reales para los últimos 7 días
    for (let i = 6; i >= 0; i--) {
      const dateString = getDateDaysAgo(i);
      const dayName = dateString.split('-').slice(1).join('/'); // MM/DD
      
      console.log(`🔍 Consultando datos reales para: ${dateString} (${dayName})`);
      
      const dayData = await loadRealDailyData(dateString);
      
      if (dayData) {
        // Datos reales encontrados
        chartData.push({
          name: dayName,
          sales: dayData.pos.total,
          memberships: dayData.memberships.total,
          layaways: dayData.abonos.total,
          date: dateString
        });
        console.log(`✅ Datos agregados para ${dateString}:`, {
          ventas: formatPrice(dayData.pos.total),
          membresias: formatPrice(dayData.memberships.total),
          abonos: formatPrice(dayData.abonos.total)
        });
      } else {
        // Sin datos para este día, agregar ceros
        chartData.push({
          name: dayName,
          sales: 0,
          memberships: 0,
          layaways: 0,
          date: dateString
        });
        console.log(`⚪ Sin datos para ${dateString}, agregando ceros`);
      }
    }
    
    console.log('📊 Datos históricos completos:', chartData);
    return chartData;
  }, [loadRealDailyData]);

  // ✅ FUNCIÓN PARA CARGAR DATOS DIARIOS (IGUAL QUE CORTES)
  const loadDailyData = useCallback(async () => {
    try {
      console.log('💰 ===== CARGANDO DATOS DIARIOS USANDO API DE CORTES =====');
      console.log('🔍 Solicitando datos para fecha México:', selectedDate);
      
      const response = await fetch(`/api/cuts/daily-data?date=${selectedDate}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('📡 Respuesta de la API:', response.status, response.statusText);
      
      const data = await response.json();
      console.log('📊 Datos recibidos de la API:', data);
      
      if (response.ok && data.success) {
        console.log('✅ Datos válidos recibidos:', {
          fecha: data.date,
          timezone_info: data.timezone_info,
          total_ingresos: data.totals?.total || 0,
          transacciones: data.totals?.transactions || 0,
          efectivo: data.totals?.efectivo || 0,
          transferencia: data.totals?.transferencia || 0,
          debito: data.totals?.debito || 0,
          credito: data.totals?.credito || 0
        });
        setDailyData(data);
        return data;
      } else {
        const errorMsg = data.error || `Error HTTP ${response.status}: ${response.statusText}`;
        console.error('❌ Error en respuesta de API:', errorMsg);
        // No lanzar error, usar datos vacíos
        return null;
      }
    } catch (error: any) {
      console.error('💥 Error crítico en loadDailyData:', error);
      // No lanzar error, usar datos vacíos
      return null;
    }
  }, [selectedDate]);

  // ✅ FUNCIÓN PRINCIPAL CORREGIDA - SOLO DATOS REALES
  const loadDashboardStats = useCallback(async () => {
    try {
      setError(null);
      console.log('📊 ===== INICIANDO CARGA DE DASHBOARD ENTERPRISE (SOLO DATOS REALES) =====');

      // ✅ CARGAR DATOS DIARIOS (COMO CORTES)
      const dailyDataResult = await loadDailyData();

      // ✅ CARGAR DATOS HISTÓRICOS REALES (NO FICTICIOS)
      const realChartData = await loadWeeklyRealData();

      const mexicoToday = selectedDate;
      const today = new Date();
      const firstDayOfMonth = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-01`;
      const in7Days = new Date(today);
      in7Days.setDate(today.getDate() + 7);
      const in7DaysString = `${in7Days.getFullYear()}-${(in7Days.getMonth() + 1).toString().padStart(2, '0')}-${in7Days.getDate().toString().padStart(2, '0')}`;

      console.log(`📅 Fechas calculadas:
        📅 Hoy México: ${mexicoToday}
        📅 Primer día del mes: ${firstDayOfMonth}
        📅 En 7 días: ${in7DaysString}`);

      // 👥 CARGAR USUARIOS
      console.log('👥 ===== CARGANDO USUARIOS =====');
      const { data: allUsers, error: usersError } = await supabase
        .from('Users')
        .select('id, rol, gender, createdAt');

      if (usersError) {
        console.error('❌ Error cargando usuarios:', usersError);
        throw usersError;
      }

      const clientUsers = allUsers?.filter(u => u.rol === 'cliente') || [];
      const newUsersToday = allUsers?.filter(u => {
        if (!u.createdAt) return false;
        const createdDate = u.createdAt.split('T')[0];
        return createdDate === mexicoToday;
      }) || [];

      const newUsersMonth = allUsers?.filter(u => {
        if (!u.createdAt) return false;
        const createdDate = u.createdAt.split('T')[0];
        return createdDate >= firstDayOfMonth;
      }) || [];

      const genderStats = clientUsers.reduce((acc, user) => {
        const gender = user.gender?.toLowerCase() || 'other';
        if (gender === 'masculino' || gender === 'male' || gender === 'hombre') acc.male++;
        else if (gender === 'femenino' || gender === 'female' || gender === 'mujer') acc.female++;
        else acc.other++;
        return acc;
      }, { male: 0, female: 0, other: 0 });

      // 🏋️ CARGAR MEMBRESÍAS
      console.log('🏋️ ===== CARGANDO MEMBRESÍAS =====');
      const { data: memberships, error: membershipsError } = await supabase
        .from('user_memberships')
        .select('*');

      if (membershipsError) {
        console.error('❌ Error cargando membresías:', membershipsError);
        throw membershipsError;
      }

      const active = memberships?.filter(m => m.status === 'active') || [];
      const expiring = memberships?.filter(m => {
        if (!m.end_date || m.status !== 'active') return false;
        const endDate = m.end_date.split('T')[0];
        return endDate <= in7DaysString && endDate >= mexicoToday;
      }) || [];

      const expired = memberships?.filter(m => {
        if (!m.end_date) return false;
        const endDate = m.end_date.split('T')[0];
        return endDate < mexicoToday;
      }) || [];

      const frozen = memberships?.filter(m => m.status === 'frozen') || [];

      const todayMemberships = memberships?.filter(m => {
        if (!m.created_at) return false;
        const createdDate = m.created_at.split('T')[0];
        return createdDate === mexicoToday;
      }) || [];

      const todayMembershipRevenue = todayMemberships.reduce((sum, m) => sum + (m.amount_paid || 0), 0);
      const totalRevenue = memberships?.reduce((sum, m) => sum + (m.amount_paid || 0), 0) || 0;

      // 📦 CARGAR APARTADOS
      console.log('📦 ===== CARGANDO APARTADOS =====');
      const { data: layaways, error: layawaysError } = await supabase
        .from('sales')
        .select('*')
        .eq('sale_type', 'layaway');

      if (layawaysError) {
        console.error('❌ Error cargando apartados:', layawaysError);
        throw layawaysError;
      }

      const activeLayaways = layaways?.filter(l => 
        l.status === 'pending' && 
        l.layaway_expires_at && 
        new Date(l.layaway_expires_at) >= new Date()
      ) || [];

      const expiringLayaways = layaways?.filter(l => 
        l.status === 'pending' && 
        l.layaway_expires_at &&
        new Date(l.layaway_expires_at) >= new Date() &&
        new Date(l.layaway_expires_at) <= new Date(in7DaysString + 'T23:59:59')
      ) || [];

      const pendingAmount = layaways?.reduce((sum, l) => sum + (l.pending_amount || 0), 0) || 0;
      const collectedAmount = layaways?.reduce((sum, l) => sum + (l.paid_amount || 0), 0) || 0;

      // ✅ DATOS PARA GRÁFICO DE PIE (MÉTODOS DE PAGO) - SOLO SI HAY DATOS
      const pieData: PieData[] = [];
      if (dailyDataResult && dailyDataResult.totals.total > 0) {
        if (dailyDataResult.totals.efectivo > 0) {
          pieData.push({
            name: 'Efectivo',
            value: dailyDataResult.totals.efectivo,
            color: darkProTokens.chart1
          });
        }
        if (dailyDataResult.totals.transferencia > 0) {
          pieData.push({
            name: 'Transferencia',
            value: dailyDataResult.totals.transferencia,
            color: darkProTokens.chart2
          });
        }
        if (dailyDataResult.totals.debito > 0) {
          pieData.push({
            name: 'Débito',
            value: dailyDataResult.totals.debito,
            color: darkProTokens.chart3
          });
        }
        if (dailyDataResult.totals.credito > 0) {
          pieData.push({
            name: 'Crédito',
            value: dailyDataResult.totals.credito,
            color: darkProTokens.chart4
          });
        }
      }

      // ✅ CONSTRUIR ESTADÍSTICAS FINALES CON DATOS REALES
      const finalStats: DashboardStats = {
        totalUsers: allUsers?.length || 0,
        clientUsers: clientUsers.length,
        newUsersToday: newUsersToday.length,
        newUsersMonth: newUsersMonth.length,
        usersByGender: genderStats,
        activeMemberships: active.length,
        expiringMemberships: expiring.length,
        expiredMemberships: expired.length,
        frozenMemberships: frozen.length,
        membershipRevenue: totalRevenue,
        todayMembershipRevenue,
        todaySales: dailyDataResult?.pos?.total || 0,
        todayTransactions: dailyDataResult?.pos?.transactions || 0,
        todayAvgTicket: dailyDataResult?.pos?.transactions > 0 ? (dailyDataResult.pos.total / dailyDataResult.pos.transactions) : 0,
        monthSales: 0, // TODO: Implementar con datos reales del mes
        monthTransactions: 0, // TODO: Implementar con datos reales del mes
        activeLayaways: activeLayaways.length,
        expiringLayaways: expiringLayaways.length,
        layawaysPendingAmount: pendingAmount,
        layawaysCollectedAmount: collectedAmount,
        todayLayawayPayments: dailyDataResult?.abonos?.total || 0,
        todayExpenses: 0, // TODO: Implementar
        // ✅ USAR DATOS CORRECTOS DE LA API DE CORTES
        cashFlow: {
          efectivo: dailyDataResult?.totals?.efectivo || 0,
          transferencia: dailyDataResult?.totals?.transferencia || 0,
          debito: dailyDataResult?.totals?.debito || 0,
          credito: dailyDataResult?.totals?.credito || 0
        },
        todayBalance: dailyDataResult?.totals?.total || 0,
        weeklyTrend: { sales: [], dates: [], memberships: [], layaways: [] },
        chartData: realChartData, // ✅ SOLO DATOS REALES, NO FICTICIOS
        pieData
      };

      setStats(finalStats);
      setLastUpdate(formatDateTime(new Date().toISOString()));
      
      console.log('✅ ===== DASHBOARD ENTERPRISE CON DATOS REALES CARGADO =====');
      console.log('📊 Resumen de datos históricos:', {
        dias_con_datos: realChartData.filter(d => d.sales > 0 || d.memberships > 0 || d.layaways > 0).length,
        dias_sin_datos: realChartData.filter(d => d.sales === 0 && d.memberships === 0 && d.layaways === 0).length,
        total_dias: realChartData.length
      });
      console.log('💰 Flujo de efectivo:', {
        efectivo: formatPrice(finalStats.cashFlow.efectivo),
        transferencia: formatPrice(finalStats.cashFlow.transferencia),
        debito: formatPrice(finalStats.cashFlow.debito),
        credito: formatPrice(finalStats.cashFlow.credito),
        total: formatPrice(finalStats.todayBalance)
      });

    } catch (err: any) {
      console.error('💥 ===== ERROR CARGANDO DASHBOARD =====', err);
      setError(`Error cargando estadísticas: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate, loadDailyData, loadWeeklyRealData, supabase]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardStats();
  }, [loadDashboardStats]);

  useEffect(() => {
    console.log('🚀 ===== COMPONENTE DASHBOARD MONTADO =====');
    loadDashboardStats();
  }, [loadDashboardStats]);

  // ✅ COMPONENTE DE MÉTRICA ENTERPRISE
  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon, 
    color, 
    onClick
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
    onClick?: () => void;
  }) => (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
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
              {React.cloneElement(icon as React.ReactElement, { 
                sx: { fontSize: 32, color: darkProTokens.textPrimary }
              })}
            </Avatar>
          </Box>
          
          <Typography variant="h3" sx={{ 
            fontWeight: 800, 
            mb: 1,
            background: `linear-gradient(45deg, ${darkProTokens.textPrimary}, ${darkProTokens.primary})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {value}
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
            Cargando análisis con datos reales del gimnasio...
          </Typography>
          <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
            📅 Solo datos reales para: {formatDateLocal(selectedDate)}
          </Typography>
          
          <LinearProgress sx={{
            width: '300px',
            height: 6,
            borderRadius: 3,
            bgcolor: darkProTokens.grayDark,
            mt: 3,
            mx: 'auto',
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

      {/* HEADER ENTERPRISE */}
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
                  🚀 MuscleUp Gym - Solo Datos Reales
                </Typography>
                <Typography variant="body1" sx={{ color: darkProTokens.info, fontWeight: 600 }}>
                  📅 {formatDateLocal(selectedDate)} • ⏰ {currentMexicoTime}
                </Typography>
                {lastUpdate && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
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
                icon={<CheckCircleIcon />}
                label="Solo Datos Reales"
                size="medium"
                sx={{
                  bgcolor: `${darkProTokens.success}20`,
                  color: darkProTokens.success,
                  border: `1px solid ${darkProTokens.success}40`,
                  fontWeight: 700,
                  fontSize: '0.9rem'
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

          {/* RESUMEN EJECUTIVO ENTERPRISE */}
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
                {formatPrice(stats.todayBalance)}
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
                📈 Balance Neto
              </Typography>
              <Typography variant="caption" sx={{ 
                color: darkProTokens.warning,
                fontWeight: 500,
                fontStyle: 'italic'
              }}>
                ✅ API Cortes Real
              </Typography>
            </Box>
          </Box>
        </Paper>
      </motion.div>

      {/* MÉTRICAS PRINCIPALES ENTERPRISE */}
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
              onClick={() => router.push('/dashboard/admin/layaways/management')}
            />
          </Grid>
        </Grid>
      </motion.div>

      {/* GRÁFICOS ENTERPRISE CON RECHARTS - SOLO DATOS REALES */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* GRÁFICO DE TENDENCIAS - SOLO DATOS REALES */}
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
                    📈 Tendencias Reales (Últimos 7 días)
                  </Typography>
                  <Chip
                    label={`${stats.chartData.filter(d => d.sales > 0 || d.memberships > 0 || d.layaways > 0).length} días con datos`}
                    size="small"
                    sx={{
                      bgcolor: `${darkProTokens.success}20`,
                      color: darkProTokens.success,
                      fontWeight: 600
                    }}
                  />
                </Box>
                
                <Box sx={{ height: 350, width: '100%' }}>
                  {stats.chartData.some(d => d.sales > 0 || d.memberships > 0 || d.layaways > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={stats.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={darkProTokens.grayDark} />
                        <XAxis 
                          dataKey="name" 
                          stroke={darkProTokens.textSecondary}
                          fontSize={12}
                        />
                        <YAxis 
                          stroke={darkProTokens.textSecondary}
                          fontSize={12}
                          tickFormatter={(value) => formatPrice(value)}
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
                  ) : (
                    <Box sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexDirection: 'column',
                      gap: 2
                    }}>
                      <TimelineIcon sx={{ fontSize: 80, color: darkProTokens.grayMuted, opacity: 0.5 }} />
                      <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }}>
                        Sin datos históricos disponibles
                      </Typography>
                      <Typography variant="body2" sx={{ color: darkProTokens.textDisabled, textAlign: 'center' }}>
                        Los gráficos aparecerán cuando haya datos reales<br />
                        de días anteriores en la base de datos
                      </Typography>
                    </Box>
                  )}
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
                
                {stats.pieData.length > 0 ? (
                  <Box sx={{ height: 280, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.pieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          innerRadius={50}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {stats.pieData.map((entry, index) => (
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
                    height: 280, 
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
                    <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                      El gráfico aparecerá cuando se registren ventas
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* MÉTODOS DE PAGO DEL DÍA - CORREGIDO */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
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
              <PaymentIcon />
              💰 Flujo de Efectivo del Día (Solo Datos Reales)
            </Typography>
            
            <Grid container spacing={3}>
              <Grid size={{ xs: 6, md: 3 }}>
                <motion.div whileHover={{ scale: 1.05 }}>
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
                    {dailyData && (
                      <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 1 }}>
                        POS: {formatPrice(dailyData.pos.efectivo)} | Membresías: {formatPrice(dailyData.memberships.efectivo)}
                      </Typography>
                    )}
                  </Paper>
                </motion.div>
              </Grid>
              
              <Grid size={{ xs: 6, md: 3 }}>
                <motion.div whileHover={{ scale: 1.05 }}>
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
                    {dailyData && (
                      <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 1 }}>
                        POS: {formatPrice(dailyData.pos.transferencia)} | Membresías: {formatPrice(dailyData.memberships.transferencia)}
                      </Typography>
                                        )}
                  </Paper>
                </motion.div>
              </Grid>
              
              <Grid size={{ xs: 6, md: 3 }}>
                <motion.div whileHover={{ scale: 1.05 }}>
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
                    {dailyData && (
                      <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 1 }}>
                        POS: {formatPrice(dailyData.pos.debito)} | Membresías: {formatPrice(dailyData.memberships.debito)}
                      </Typography>
                    )}
                  </Paper>
                </motion.div>
              </Grid>
              
              <Grid size={{ xs: 6, md: 3 }}>
                <motion.div whileHover={{ scale: 1.05 }}>
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
                    {dailyData && (
                      <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 1 }}>
                        POS: {formatPrice(dailyData.pos.credito)} | Membresías: {formatPrice(dailyData.memberships.credito)}
                      </Typography>
                    )}
                  </Paper>
                </motion.div>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>

      {/* DESGLOSE DE INGRESOS DEL DÍA */}
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
              color: darkProTokens.success, 
              mb: 3, 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <BarChartIcon />
              📊 Desglose de Ingresos del Día (API Cortes)
            </Typography>
            
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper sx={{
                  p: 3,
                  textAlign: 'center',
                  background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                  border: `2px solid ${darkProTokens.info}40`,
                  borderRadius: 3
                }}>
                  <Avatar sx={{ 
                    bgcolor: darkProTokens.info, 
                    width: 56, 
                    height: 56,
                    mx: 'auto',
                    mb: 2
                  }}>
                    <SalesIcon />
                  </Avatar>
                  <Typography variant="h4" sx={{ color: darkProTokens.info, fontWeight: 800, mb: 1 }}>
                    {formatPrice(stats.todaySales)}
                  </Typography>
                  <Typography variant="h6" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                    Ventas POS
                  </Typography>
                  <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                    {stats.todayTransactions} transacciones
                  </Typography>
                  {dailyData && (
                    <Stack spacing={1} sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                          Efectivo:
                        </Typography>
                        <Typography variant="caption" sx={{ color: darkProTokens.primary, fontWeight: 600 }}>
                          {formatPrice(dailyData.pos.efectivo)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                          Transferencia:
                        </Typography>
                        <Typography variant="caption" sx={{ color: darkProTokens.info, fontWeight: 600 }}>
                          {formatPrice(dailyData.pos.transferencia)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                          Tarjetas:
                        </Typography>
                        <Typography variant="caption" sx={{ color: darkProTokens.warning, fontWeight: 600 }}>
                          {formatPrice(dailyData.pos.debito + dailyData.pos.credito)}
                        </Typography>
                      </Box>
                    </Stack>
                  )}
                </Paper>
              </Grid>
              
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper sx={{
                  p: 3,
                  textAlign: 'center',
                  background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                  border: `2px solid ${darkProTokens.success}40`,
                  borderRadius: 3
                }}>
                  <Avatar sx={{ 
                    bgcolor: darkProTokens.success, 
                    width: 56, 
                    height: 56,
                    mx: 'auto',
                    mb: 2
                  }}>
                    <FitnessCenterIcon />
                  </Avatar>
                  <Typography variant="h4" sx={{ color: darkProTokens.success, fontWeight: 800, mb: 1 }}>
                    {formatPrice(stats.todayMembershipRevenue)}
                  </Typography>
                  <Typography variant="h6" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                    Membresías
                  </Typography>
                  <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                    Solo ventas de hoy
                  </Typography>
                  {dailyData && (
                    <Stack spacing={1} sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                          Efectivo:
                        </Typography>
                        <Typography variant="caption" sx={{ color: darkProTokens.primary, fontWeight: 600 }}>
                          {formatPrice(dailyData.memberships.efectivo)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                          Transferencia:
                        </Typography>
                        <Typography variant="caption" sx={{ color: darkProTokens.info, fontWeight: 600 }}>
                          {formatPrice(dailyData.memberships.transferencia)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                          Tarjetas:
                        </Typography>
                        <Typography variant="caption" sx={{ color: darkProTokens.warning, fontWeight: 600 }}>
                          {formatPrice(dailyData.memberships.debito + dailyData.memberships.credito)}
                        </Typography>
                      </Box>
                    </Stack>
                  )}
                </Paper>
              </Grid>
              
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper sx={{
                  p: 3,
                  textAlign: 'center',
                  background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                  border: `2px solid ${darkProTokens.warning}40`,
                  borderRadius: 3
                }}>
                  <Avatar sx={{ 
                    bgcolor: darkProTokens.warning, 
                    width: 56, 
                    height: 56,
                    mx: 'auto',
                    mb: 2
                  }}>
                    <LayawayIcon />
                  </Avatar>
                  <Typography variant="h4" sx={{ color: darkProTokens.warning, fontWeight: 800, mb: 1 }}>
                    {formatPrice(stats.todayLayawayPayments)}
                  </Typography>
                  <Typography variant="h6" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                    Abonos
                  </Typography>
                  <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                    Apartados pagados hoy
                  </Typography>
                  {dailyData && (
                    <Stack spacing={1} sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                          Efectivo:
                        </Typography>
                        <Typography variant="caption" sx={{ color: darkProTokens.primary, fontWeight: 600 }}>
                          {formatPrice(dailyData.abonos.efectivo)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                          Transferencia:
                        </Typography>
                        <Typography variant="caption" sx={{ color: darkProTokens.info, fontWeight: 600 }}>
                          {formatPrice(dailyData.abonos.transferencia)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                          Tarjetas:
                        </Typography>
                        <Typography variant="caption" sx={{ color: darkProTokens.warning, fontWeight: 600 }}>
                          {formatPrice(dailyData.abonos.debito + dailyData.abonos.credito)}
                        </Typography>
                      </Box>
                    </Stack>
                  )}
                </Paper>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3, borderColor: darkProTokens.grayMedium }} />
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ 
                color: stats.todayBalance >= 0 ? darkProTokens.success : darkProTokens.error, 
                fontWeight: 800,
                mb: 1
              }}>
                {formatPrice(stats.todayBalance)}
              </Typography>
              <Typography variant="h5" sx={{ color: darkProTokens.textSecondary, fontWeight: 600 }}>
                💎 Total de Ingresos del Día
              </Typography>
              <Typography variant="body2" sx={{ 
                color: darkProTokens.warning,
                fontWeight: 500,
                mt: 1
              }}>
                ⚡ Datos reales: {formatDateLocal(selectedDate)}
              </Typography>
              {dailyData && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<CheckCircleIcon />}
                    label={`${dailyData.totals.transactions} transacciones`}
                    size="small"
                    sx={{ bgcolor: `${darkProTokens.success}20`, color: darkProTokens.success, fontWeight: 600 }}
                  />
                  <Chip
                    icon={<WarningIcon />}
                    label={`${formatPrice(dailyData.totals.commissions)} comisiones`}
                    size="small"
                    sx={{ bgcolor: `${darkProTokens.warning}20`, color: darkProTokens.warning, fontWeight: 600 }}
                  />
                  <Chip
                    icon={<MoneyIcon />}
                    label={`${formatPrice(dailyData.totals.net_amount)} neto`}
                    size="small"
                    sx={{ bgcolor: `${darkProTokens.info}20`, color: darkProTokens.info, fontWeight: 600 }}
                  />
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      {/* ACCESOS RÁPIDOS ENTERPRISE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
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
                <motion.div whileHover={{ scale: 1.02 }}>
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
                <motion.div whileHover={{ scale: 1.02 }}>
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
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    💼 Corte de Caja
                  </Button>
                </motion.div>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <motion.div whileHover={{ scale: 1.02 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    startIcon={<AnalyticsIcon />}
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
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    📊 Reportes
                  </Button>
                </motion.div>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <motion.div whileHover={{ scale: 1.02 }}>
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
                        transform: 'translateY(-1px)'
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

      {/* INFORMACIÓN ADICIONAL */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.4 }}
      >
        <Grid container spacing={3}>
          {/* INFORMACIÓN DE USUARIOS */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 4,
              height: '100%'
            }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ 
                  color: darkProTokens.roleStaff, 
                  mb: 3, 
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}>
                  <PeopleIcon />
                  👥 Información de Usuarios
                </Typography>
                
                <Stack spacing={3}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                      Total de Usuarios:
                    </Typography>
                    <Typography variant="h6" sx={{ color: darkProTokens.primary, fontWeight: 700 }}>
                      {stats.totalUsers}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                      Clientes Activos:
                    </Typography>
                    <Typography variant="h6" sx={{ color: darkProTokens.success, fontWeight: 700 }}>
                      {stats.clientUsers}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                      Nuevos Hoy:
                    </Typography>
                    <Typography variant="h6" sx={{ color: darkProTokens.info, fontWeight: 700 }}>
                      +{stats.newUsersToday}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                      Nuevos Este Mes:
                    </Typography>
                    <Typography variant="h6" sx={{ color: darkProTokens.warning, fontWeight: 700 }}>
                      +{stats.newUsersMonth}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ borderColor: darkProTokens.grayMedium }} />
                  
                  <Box>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
                      Distribución por Género:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip 
                        icon={<MaleIcon />}
                        label={`${stats.usersByGender.male} Hombres`}
                        size="small"
                        sx={{ 
                          bgcolor: `${darkProTokens.info}20`, 
                          color: darkProTokens.info,
                          fontWeight: 600
                        }}
                      />
                      <Chip 
                        icon={<FemaleIcon />}
                        label={`${stats.usersByGender.female} Mujeres`}
                        size="small"
                        sx={{ 
                          bgcolor: `${darkProTokens.roleModerator}20`, 
                          color: darkProTokens.roleModerator,
                          fontWeight: 600
                        }}
                      />
                      <Chip 
                        label={`${stats.usersByGender.other} Otros`}
                        size="small"
                        sx={{ 
                          bgcolor: `${darkProTokens.textSecondary}20`, 
                          color: darkProTokens.textSecondary,
                          fontWeight: 600
                        }}
                      />
                    </Box>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* INFORMACIÓN DE MEMBRESÍAS */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 4,
              height: '100%'
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
                  <FitnessCenterIcon />
                  🏋️ Estado de Membresías
                </Typography>
                
                <Stack spacing={3}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                      Activas:
                    </Typography>
                    <Typography variant="h6" sx={{ color: darkProTokens.success, fontWeight: 700 }}>
                      {stats.activeMemberships}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                      Por Vencer (7 días):
                    </Typography>
                    <Typography variant="h6" sx={{ color: darkProTokens.warning, fontWeight: 700 }}>
                      {stats.expiringMemberships}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                      Vencidas:
                    </Typography>
                    <Typography variant="h6" sx={{ color: darkProTokens.error, fontWeight: 700 }}>
                      {stats.expiredMemberships}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                      Congeladas:
                    </Typography>
                    <Typography variant="h6" sx={{ color: darkProTokens.info, fontWeight: 700 }}>
                      {stats.frozenMemberships}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ borderColor: darkProTokens.grayMedium }} />
                  
                  <Box>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                      Ingresos por Membresías:
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: darkProTokens.textPrimary }}>
                        Total Histórico:
                      </Typography>
                      <Typography variant="body1" sx={{ color: darkProTokens.primary, fontWeight: 700 }}>
                        {formatPrice(stats.membershipRevenue)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ color: darkProTokens.textPrimary }}>
                        Solo Hoy:
                      </Typography>
                      <Typography variant="body1" sx={{ color: darkProTokens.success, fontWeight: 700 }}>
                        {formatPrice(stats.todayMembershipRevenue)}
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>

      {/* FOOTER INFORMATIVO */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.6 }}
      >
        <Box sx={{ 
          mt: 4, 
          p: 3, 
          textAlign: 'center',
          background: `linear-gradient(135deg, ${darkProTokens.grayDark}20, ${darkProTokens.grayMedium}10)`,
          borderRadius: 3,
          border: `1px solid ${darkProTokens.grayDark}40`
        }}>
          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
            🚀 Dashboard Enterprise MuscleUp Gym • Solo Datos Reales
          </Typography>
          <Typography variant="caption" sx={{ color: darkProTokens.textDisabled }}>
            📊 Gráficos Recharts • 💰 API Cortes • ⏰ Tiempo Real México • 🔄 Auto-Refresh
          </Typography>
          {dailyData && (
            <Typography variant="caption" sx={{ color: darkProTokens.success, display: 'block', mt: 1 }}>
              ✅ Conectado a API de cortes • Datos sincronizados • {dailyData.timezone_info?.note}
            </Typography>
          )}
        </Box>
      </motion.div>

      {/* ESTILOS CSS ENTERPRISE */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.02); }
        }
        
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 10px ${darkProTokens.primary}40;
          }
          50% {
            box-shadow: 0 0 30px ${darkProTokens.primary}60, 0 0 40px ${darkProTokens.primary}40;
          }
        }
        
        ::-webkit-scrollbar {
          width: 12px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${darkProTokens.surfaceLevel1};
          border-radius: 6px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover});
          border-radius: 6px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive});
        }
      `}</style>
    </Box>
  );
}
