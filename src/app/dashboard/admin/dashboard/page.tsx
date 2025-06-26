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
  Badge,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText
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
  PieChart as PieChartIcon,
  Cake as CakeIcon,
  Percent as PercentIcon,
  Group as GroupIcon
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
  ComposedChart,
  RadialBarChart,
  RadialBar
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

function getDateDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const mexicoDate = new Date(date.toLocaleString("en-US", {timeZone: "America/Mexico_City"}));
  const year = mexicoDate.getFullYear();
  const month = String(mexicoDate.getMonth() + 1).padStart(2, '0');
  const day = String(mexicoDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ✅ FUNCIÓN PARA VERIFICAR CUMPLEAÑOS HOY
function isBirthdayToday(birthDate: string): boolean {
  if (!birthDate) return false;
  
  try {
    const today = new Date();
    const mexicoToday = new Date(today.toLocaleString("en-US", {timeZone: "America/Mexico_City"}));
    
    // Manejar diferentes formatos de fecha
    let birth: Date;
    if (birthDate.includes('-')) {
      birth = new Date(birthDate);
    } else if (birthDate.includes('/')) {
      birth = new Date(birthDate);
    } else {
      return false;
    }
    
    return birth.getDate() === mexicoToday.getDate() && 
           birth.getMonth() === mexicoToday.getMonth();
  } catch (error) {
    return false;
  }
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

// ✅ NUEVAS INTERFACES PARA CUMPLEAÑOS Y RETENCIÓN
interface BirthdayUser {
  id: string;
  firstName: string;
  lastName?: string;
  birthDate: string;
  profilePictureUrl?: string;
}

interface RetentionData {
  totalClients: number;
  clientsWithMembership: number;
  retentionPercentage: number;
  chartData: {
    name: string;
    value: number;
    fill: string;
  }[];
}

interface DashboardStats {
  totalUsers: number; // ✅ AHORA SOLO CLIENTES
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
  // ✅ NUEVOS DATOS
  birthdayUsers: BirthdayUser[];
  retentionData: RetentionData;
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
    pieData: [],
    birthdayUsers: [],
    retentionData: {
      totalClients: 0,
      clientsWithMembership: 0,
      retentionPercentage: 0,
      chartData: []
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [currentMexicoTime, setCurrentMexicoTime] = useState<string>('');
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  
  const supabase = createBrowserSupabaseClient();

  const [selectedDate] = useState(() => {
    const mexicoDate = getMexicoDateLocal();
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

  // ✅ FUNCIÓN PARA CARGAR DATOS DIARIOS REALES
  const loadRealDailyData = useCallback(async (targetDate: string): Promise<DailyData | null> => {
    try {
      const response = await fetch(`/api/cuts/daily-data?date=${targetDate}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.totals && data.totals.total > 0) {
          return data;
        } else {
          return null;
        }
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  }, []);

  // ✅ FUNCIÓN PARA CARGAR DATOS HISTÓRICOS REALES (7 DÍAS)
  const loadWeeklyRealData = useCallback(async (): Promise<ChartData[]> => {
    const chartData: ChartData[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const dateString = getDateDaysAgo(i);
      const dayName = dateString.split('-').slice(1).join('/');
      const dayData = await loadRealDailyData(dateString);
      
      if (dayData) {
        chartData.push({
          name: dayName,
          sales: dayData.pos.total,
          memberships: dayData.memberships.total,
          layaways: dayData.abonos.total,
          date: dateString
        });
      } else {
        chartData.push({
          name: dayName,
          sales: 0,
          memberships: 0,
          layaways: 0,
          date: dateString
        });
      }
    }
    
    return chartData;
  }, [loadRealDailyData]);

  // ✅ FUNCIÓN PARA CARGAR DATOS DIARIOS (IGUAL QUE CORTES)
  const loadDailyData = useCallback(async () => {
    try {
      const response = await fetch(`/api/cuts/daily-data?date=${selectedDate}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setDailyData(data);
        return data;
      } else {
        return null;
      }
    } catch (error: any) {
      return null;
    }
  }, [selectedDate]);

  // ✅ FUNCIÓN PRINCIPAL CORREGIDA - CON NUEVAS MEJORAS
  const loadDashboardStats = useCallback(async () => {
    try {
      setError(null);

      // Cargar datos diarios y históricos
      const dailyDataResult = await loadDailyData();
      const realChartData = await loadWeeklyRealData();

      const mexicoToday = selectedDate;
      const today = new Date();
      const firstDayOfMonth = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-01`;
      const in7Days = new Date(today);
      in7Days.setDate(today.getDate() + 7);
      const in7DaysString = `${in7Days.getFullYear()}-${(in7Days.getMonth() + 1).toString().padStart(2, '0')}-${in7Days.getDate().toString().padStart(2, '0')}`;

      // 👥 CARGAR USUARIOS - ✅ SOLO CLIENTES SEGÚN ESQUEMA REAL
      const { data: allUsers, error: usersError } = await supabase
        .from('Users')
        .select('id, firstName, lastName, gender, createdAt, birthDate, profilePictureUrl, rol')
        .eq('rol', 'cliente'); // ✅ SOLO CLIENTES

      if (usersError) {
        throw usersError;
      }

      const clientUsers = allUsers || []; // ✅ YA SON SOLO CLIENTES
      const newUsersToday = clientUsers.filter(u => {
        if (!u.createdAt) return false;
        const createdDate = u.createdAt.split('T')[0];
        return createdDate === mexicoToday;
      });

      const newUsersMonth = clientUsers.filter(u => {
        if (!u.createdAt) return false;
        const createdDate = u.createdAt.split('T')[0];
        return createdDate >= firstDayOfMonth;
      });

      const genderStats = clientUsers.reduce((acc, user) => {
        const gender = user.gender?.toLowerCase() || 'other';
        if (gender === 'masculino' || gender === 'male' || gender === 'hombre') acc.male++;
        else if (gender === 'femenino' || gender === 'female' || gender === 'mujer') acc.female++;
        else acc.other++;
        return acc;
      }, { male: 0, female: 0, other: 0 });

      // 🎂 CUMPLEAÑEROS DEL DÍA
      const birthdayUsers: BirthdayUser[] = clientUsers.filter(user => 
        user.birthDate && isBirthdayToday(user.birthDate)
      ).map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        birthDate: user.birthDate,
        profilePictureUrl: user.profilePictureUrl
      }));

      // 🏋️ CARGAR MEMBRESÍAS
      const { data: memberships, error: membershipsError } = await supabase
        .from('user_memberships')
        .select('*, user_id');

      if (membershipsError) {
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

      // 📊 CALCULAR RETENCIÓN (CLIENTES CON MEMBRESÍA ACTIVA)
      const uniqueUsersWithMembership = new Set(active.map(m => m.user_id)).size;
      const retentionPercentage = clientUsers.length > 0 ? 
        Math.round((uniqueUsersWithMembership / clientUsers.length) * 100) : 0;

      const retentionData: RetentionData = {
        totalClients: clientUsers.length,
        clientsWithMembership: uniqueUsersWithMembership,
        retentionPercentage,
        chartData: [
          {
            name: 'Con Membresía',
            value: retentionPercentage,
            fill: darkProTokens.success
          },
          {
            name: 'Sin Membresía',
            value: 100 - retentionPercentage,
            fill: darkProTokens.grayMuted
          }
        ]
      };

      // 📦 CARGAR APARTADOS
      const { data: layaways, error: layawaysError } = await supabase
        .from('sales')
        .select('*')
        .eq('sale_type', 'layaway');

      if (layawaysError) {
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

      // ✅ DATOS PARA GRÁFICO DE PIE (MÉTODOS DE PAGO)
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

      // ✅ CONSTRUIR ESTADÍSTICAS FINALES CON NUEVAS MEJORAS
      const finalStats: DashboardStats = {
        totalUsers: clientUsers.length, // ✅ SOLO CLIENTES
        clientUsers: clientUsers.length, // ✅ MISMO VALOR
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
        monthSales: 0,
        monthTransactions: 0,
        activeLayaways: activeLayaways.length,
        expiringLayaways: expiringLayaways.length,
        layawaysPendingAmount: pendingAmount,
        layawaysCollectedAmount: collectedAmount,
        todayLayawayPayments: dailyDataResult?.abonos?.total || 0,
        todayExpenses: 0,
        cashFlow: {
          efectivo: dailyDataResult?.totals?.efectivo || 0,
          transferencia: dailyDataResult?.totals?.transferencia || 0,
          debito: dailyDataResult?.totals?.debito || 0,
          credito: dailyDataResult?.totals?.credito || 0
        },
        todayBalance: dailyDataResult?.totals?.total || 0,
        weeklyTrend: { sales: [], dates: [], memberships: [], layaways: [] },
        chartData: realChartData,
        pieData,
        // ✅ NUEVOS DATOS
        birthdayUsers,
        retentionData
      };

      setStats(finalStats);
      setLastUpdate(formatDateTime(new Date().toISOString()));

    } catch (err: any) {
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
    loadDashboardStats();
  }, [loadDashboardStats]);

  // ✅ COMPONENTE DE MÉTRICA ENTERPRISE RESPONSIVO
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
        minHeight: { xs: '180px', sm: '200px', md: '220px' },
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
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Avatar sx={{ 
              bgcolor: `${darkProTokens.textPrimary}15`, 
              width: { xs: 48, sm: 56, md: 64 }, 
              height: { xs: 48, sm: 56, md: 64 },
              border: `2px solid ${darkProTokens.textPrimary}20`
            }}>
              {React.cloneElement(icon as React.ReactElement, { 
                sx: { fontSize: { xs: 24, sm: 28, md: 32 }, color: darkProTokens.textPrimary }
              })}
            </Avatar>
          </Box>
          
          <Typography variant="h3" sx={{ 
            fontWeight: 800, 
            mb: 1,
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
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
            fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' },
            textShadow: `0 2px 4px ${color}40`
          }}>
            {title}
          </Typography>
          
          {subtitle && (
            <Typography variant="body2" sx={{ 
              opacity: 0.7, 
              mt: 1,
              fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.85rem' }
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
            Dashboard MUP
          </Typography>
          <Typography variant="h6" sx={{ color: darkProTokens.textSecondary, mb: 3 }}>
            Cargando análisis avanzado del gimnasio...
          </Typography>
          <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
            📅 Consultando datos para: {formatDateLocal(selectedDate)}
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

      {/* HEADER ENTERPRISE RESPONSIVO */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Paper sx={{
          p: { xs: 3, sm: 4 },
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, sm: 3 } }}>
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
                  width: { xs: 60, sm: 80, md: 90 }, 
                  height: { xs: 60, sm: 80, md: 90 },
                  border: `3px solid ${darkProTokens.primary}40`
                }}>
                  <AssessmentIcon sx={{ fontSize: { xs: 30, sm: 40, md: 45 } }} />
                </Avatar>
              </motion.div>
              
              <Box>
                <Typography variant="h3" sx={{ 
                  color: darkProTokens.primary, 
                  fontWeight: 800,
                  textShadow: `0 0 20px ${darkProTokens.primary}40`,
                  mb: 1,
                  fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' },
                  background: `linear-gradient(45deg, ${darkProTokens.primary}, ${darkProTokens.success})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Dashboard MUP
                </Typography>
                <Typography variant="h6" sx={{ 
                  color: darkProTokens.textSecondary, 
                  mb: 1,
                  fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' }
                }}>
                  🚀 MuscleUp Gym - Business Intelligence
                </Typography>
                <Typography variant="body1" sx={{ 
                  color: darkProTokens.info, 
                  fontWeight: 600,
                  fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' }
                }}>
                  📅 {formatDateLocal(selectedDate)} • ⏰ {currentMexicoTime}
                </Typography>
                {lastUpdate && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <ScheduleIcon sx={{ fontSize: 16, color: darkProTokens.success }} />
                    <Typography variant="caption" sx={{ 
                      color: darkProTokens.success,
                      fontWeight: 600,
                      fontSize: { xs: '0.7rem', sm: '0.75rem' }
                    }}>
                      Actualizado: {lastUpdate}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip
                icon={<SpeedIcon />}
                label="Real Time"
                size="medium"
                sx={{
                  bgcolor: `${darkProTokens.success}20`,
                  color: darkProTokens.success,
                  border: `1px solid ${darkProTokens.success}40`,
                  fontWeight: 700,
                  fontSize: { xs: '0.7rem', sm: '0.9rem' }
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
                  px: { xs: 3, sm: 4 },
                  py: { xs: 1, sm: 1.5 },
                  borderRadius: 3,
                  fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
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

          {/* RESUMEN EJECUTIVO ENTERPRISE RESPONSIVO */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            p: { xs: 3, sm: 4 },
            background: `linear-gradient(135deg, ${darkProTokens.success}15, ${darkProTokens.primary}10)`,
            borderRadius: 3,
            border: `1px solid ${darkProTokens.success}30`,
            backdropFilter: 'blur(10px)',
            position: 'relative',
            flexWrap: 'wrap',
            gap: { xs: 3, sm: 2 },
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
            <Box sx={{ textAlign: 'center', minWidth: { xs: '45%', sm: 'auto' } }}>
              <Typography variant="h3" sx={{ 
                color: darkProTokens.success, 
                fontWeight: 800,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' },
                textShadow: `0 0 10px ${darkProTokens.success}40`
              }}>
                {stats.clientUsers}
              </Typography>
              <Typography variant="body1" sx={{ 
                color: darkProTokens.textSecondary,
                fontWeight: 600,
                fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' }
              }}>
                👥 Total Clientes
              </Typography>
            </Box>
            
            <Divider orientation="vertical" flexItem sx={{ 
              borderColor: `${darkProTokens.primary}40`,
              borderWidth: '1px',
              display: { xs: 'none', sm: 'block' }
            }} />
            
            <Box sx={{ textAlign: 'center', minWidth: { xs: '45%', sm: 'auto' } }}>
              <Typography variant="h3" sx={{ 
                color: darkProTokens.primary, 
                fontWeight: 800,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' },
                textShadow: `0 0 10px ${darkProTokens.primary}40`
              }}>
                {stats.activeMemberships}
              </Typography>
              <Typography variant="body1" sx={{ 
                color: darkProTokens.textSecondary,
                fontWeight: 600,
                fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' }
              }}>
                🏋️ Membresías Activas
              </Typography>
            </Box>
            
            <Divider orientation="vertical" flexItem sx={{ 
              borderColor: `${darkProTokens.primary}40`,
              borderWidth: '1px',
              display: { xs: 'none', sm: 'block' }
            }} />
            
            <Box sx={{ textAlign: 'center', minWidth: { xs: '45%', sm: 'auto' } }}>
              <Typography variant="h3" sx={{ 
                color: darkProTokens.info, 
                fontWeight: 800,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' },
                textShadow: `0 0 10px ${darkProTokens.info}40`
              }}>
                {stats.retentionData.retentionPercentage}%
              </Typography>
              <Typography variant="body1" sx={{ 
                color: darkProTokens.textSecondary,
                fontWeight: 600,
                fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' }
              }}>
                📊 Retención
              </Typography>
            </Box>
            
            <Divider orientation="vertical" flexItem sx={{ 
              borderColor: `${darkProTokens.primary}40`,
              borderWidth: '1px',
              display: { xs: 'none', sm: 'block' }
            }} />
            
            <Box sx={{ textAlign: 'center', minWidth: { xs: '45%', sm: 'auto' } }}>
              <Typography variant="h3" sx={{ 
                color: stats.todayBalance >= 0 ? darkProTokens.success : darkProTokens.error, 
                fontWeight: 800,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' },
                textShadow: stats.todayBalance >= 0 ? 
                  `0 0 10px ${darkProTokens.success}40` : 
                  `0 0 10px ${darkProTokens.error}40`
              }}>
                {formatPrice(stats.todayBalance)}
              </Typography>
              <Typography variant="body1" sx={{ 
                color: darkProTokens.textSecondary,
                fontWeight: 600,
                fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' }
              }}>
                💰 Ingresos Hoy
              </Typography>
            </Box>
          </Box>
        </Paper>
      </motion.div>

      {/* MÉTRICAS PRINCIPALES + CUMPLEAÑOS RESPONSIVOS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
          <Grid xs={12} sm={6} lg={3}>
            <MetricCard
              title="Total Clientes"
              value={stats.totalUsers}
              subtitle={`+${stats.newUsersToday} hoy, +${stats.newUsersMonth} este mes`}
              icon={<PeopleIcon />}
              color={darkProTokens.roleStaff}
              onClick={() => router.push('/dashboard/admin/usuarios')}
            />
          </Grid>

          <Grid xs={12} sm={6} lg={3}>
            <MetricCard
              title="Membresías Activas"
              value={stats.activeMemberships}
              subtitle={`${stats.expiringMemberships} por vencer en 7 días`}
              icon={<FitnessCenterIcon />}
              color={darkProTokens.success}
              onClick={() => router.push('/dashboard/admin/membresias')}
            />
          </Grid>

          <Grid xs={12} sm={6} lg={3}>
            <MetricCard
              title="Ventas del Día"
              value={formatPrice(stats.todaySales)}
              subtitle={`${stats.todayTransactions} transacciones, ${formatPrice(stats.todayAvgTicket)} promedio`}
              icon={<SalesIcon />}
              color={darkProTokens.primary}
              onClick={() => router.push('/dashboard/admin/sales/history')}
            />
          </Grid>

          <Grid xs={12} sm={6} lg={3}>
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

      {/* 🎂 CUMPLEAÑEROS + 📊 RETENCIÓN */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
          {/* 🎂 CUMPLEAÑEROS DEL DÍA */}
          <Grid xs={12} md={6}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 4,
              height: '100%',
              minHeight: '400px'
            }}>
              <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <motion.div
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <CakeIcon sx={{ color: darkProTokens.warning, fontSize: 28 }} />
                  </motion.div>
                  <Typography variant="h6" sx={{ 
                    color: darkProTokens.warning, 
                    fontWeight: 700,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}>
                    🎂 Cumpleañeros de Hoy
                  </Typography>
                  <Badge 
                    badgeContent={stats.birthdayUsers.length} 
                    color="warning"
                    sx={{
                      '& .MuiBadge-badge': {
                        bgcolor: darkProTokens.primary,
                        color: darkProTokens.background,
                        fontWeight: 700
                      }
                    }}
                  >
                    <GroupIcon sx={{ color: darkProTokens.textSecondary }} />
                  </Badge>
                </Box>
                
                {stats.birthdayUsers.length > 0 ? (
                  <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                    <AnimatePresence>
                      {stats.birthdayUsers.map((user, index) => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <ListItem sx={{
                            mb: 1,
                            background: `linear-gradient(135deg, ${darkProTokens.warning}10, ${darkProTokens.primary}05)`,
                            borderRadius: 3,
                            border: `1px solid ${darkProTokens.warning}20`
                          }}>
                            <ListItemAvatar>
                              <Avatar 
                                src={user.profilePictureUrl} 
                                sx={{ 
                                  bgcolor: darkProTokens.warning,
                                  border: `2px solid ${darkProTokens.warning}40`
                                }}
                              >
                                🎉
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography variant="body1" sx={{ 
                                  color: darkProTokens.textPrimary,
                                  fontWeight: 600
                                }}>
                                  {user.firstName} {user.lastName || ''}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="body2" sx={{ 
                                  color: darkProTokens.textSecondary,
                                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                }}>
                                  🎂 ¡Feliz cumpleaños!
                                </Typography>
                              }
                            />
                            <motion.div
                              animate={{ 
                                scale: [1, 1.2, 1]
                              }}
                              transition={{ 
                                duration: 1,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            >
                              <CakeIcon sx={{ color: darkProTokens.warning }} />
                            </motion.div>
                          </ListItem>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </List>
                ) : (
                  <Box sx={{ 
                    height: 300, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 2
                  }}>
                    <CakeIcon sx={{ fontSize: { xs: 60, sm: 80 }, color: darkProTokens.grayMuted, opacity: 0.5 }} />
                    <Typography variant="h6" sx={{ color: darkProTokens.textSecondary, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                      No hay cumpleañeros hoy
                    </Typography>
                    <Typography variant="body2" sx={{ color: darkProTokens.textDisabled, textAlign: 'center', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      ¡Los cumpleañeros aparecerán aquí cuando sea su día especial!
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* 📊 GRÁFICO DE RETENCIÓN */}
          <Grid xs={12} md={6}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 4,
              height: '100%',
              minHeight: '400px'
            }}>
              <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <PercentIcon sx={{ color: darkProTokens.info, fontSize: 28 }} />
                  <Typography variant="h6" sx={{ 
                    color: darkProTokens.info, 
                    fontWeight: 700,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}>
                    📊 Retención de Clientes
                  </Typography>
                </Box>
                
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="h2" sx={{ 
                    color: darkProTokens.success, 
                    fontWeight: 800,
                    fontSize: { xs: '2.5rem', sm: '3rem', md: '4rem' },
                    textShadow: `0 0 20px ${darkProTokens.success}40`
                  }}>
                    {stats.retentionData.retentionPercentage}%
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    color: darkProTokens.textSecondary,
                    fontWeight: 600,
                    fontSize: { xs: '0.9rem', sm: '1rem' }
                  }}>
                    de clientes con membresía activa
                  </Typography>
                </Box>

                <Box sx={{ height: { xs: 180, sm: 200 }, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.retentionData.chartData}
                        cx="50%"
                        cy="50%"
                        startAngle={90}
                        endAngle={-270}
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.retentionData.chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{
                          backgroundColor: darkProTokens.surfaceLevel4,
                          border: `1px solid ${darkProTokens.grayDark}`,
                          borderRadius: '8px',
                          color: darkProTokens.textPrimary,
                          fontSize: '12px'
                        }}
                        formatter={(value: any) => [`${value}%`, '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ 
                      color: darkProTokens.success, 
                      fontWeight: 700,
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}>
                      {stats.retentionData.clientsWithMembership}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: darkProTokens.textSecondary,
                      fontSize: { xs: '0.7rem', sm: '0.75rem' }
                    }}>
                      Con Membresía
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ 
                      color: darkProTokens.grayMuted, 
                      fontWeight: 700,
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}>
                      {stats.retentionData.totalClients - stats.retentionData.clientsWithMembership}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: darkProTokens.textSecondary,
                      fontSize: { xs: '0.7rem', sm: '0.75rem' }
                    }}>
                      Sin Membresía
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>

      {/* GRÁFICOS ENTERPRISE CON RECHARTS RESPONSIVOS */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
        {/* GRÁFICO DE TENDENCIAS RESPONSIVO */}
        <Grid xs={12} lg={8}>
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
              <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <TimelineIcon sx={{ color: darkProTokens.primary, fontSize: 28 }} />
                  <Typography variant="h6" sx={{ 
                    color: darkProTokens.primary, 
                    fontWeight: 700,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}>
                    📈 Tendencias (Últimos 7 días)
                  </Typography>
                  <Chip
                    label={`${stats.chartData.filter(d => d.sales > 0 || d.memberships > 0 || d.layaways > 0).length} días con datos`}
                    size="small"
                    sx={{
                      bgcolor: `${darkProTokens.success}20`,
                      color: darkProTokens.success,
                      fontWeight: 600,
                      fontSize: { xs: '0.6rem', sm: '0.75rem' }
                    }}
                  />
                </Box>
                
                <Box sx={{ height: { xs: 250, sm: 300, md: 350 }, width: '100%' }}>
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
                      <TimelineIcon sx={{ fontSize: { xs: 60, sm: 80 }, color: darkProTokens.grayMuted, opacity: 0.5 }} />
                      <Typography variant="h6" sx={{ color: darkProTokens.textSecondary, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                        Sin datos históricos disponibles
                      </Typography>
                      <Typography variant="body2" sx={{ color: darkProTokens.textDisabled, textAlign: 'center', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
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

        {/* GRÁFICO DE PIE - MÉTODOS DE PAGO RESPONSIVO */}
        <Grid xs={12} lg={4}>
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
              <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <PieChartIcon sx={{ color: darkProTokens.info, fontSize: 28 }} />
                  <Typography variant="h6" sx={{ 
                    color: darkProTokens.info, 
                    fontWeight: 700,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}>
                    💳 Métodos de Pago Hoy
                  </Typography>
                </Box>
                
                {stats.pieData.length > 0 ? (
                  <Box sx={{ height: { xs: 220, sm: 250, md: 280 }, width: '100%' }}>
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
                    height: { xs: 220, sm: 250, md: 280 }, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 2
                  }}>
                    <PaymentIcon sx={{ fontSize: { xs: 40, sm: 60 }, color: darkProTokens.grayMuted, opacity: 0.5 }} />
                    <Typography variant="body1" sx={{ color: darkProTokens.textSecondary, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      No hay pagos registrados hoy
                    </Typography>
                    <Typography variant="body2" sx={{ color: darkProTokens.textDisabled, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      El gráfico aparecerá cuando se registren ventas
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* MÉTODOS DE PAGO DEL DÍA RESPONSIVOS */}
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
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h6" sx={{ 
              color: darkProTokens.primary, 
              mb: 3, 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}>
              <PaymentIcon />
              💰 Flujo de Efectivo del Día
            </Typography>
            
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              <Grid xs={6} md={3}>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Paper sx={{
                    p: { xs: 2, sm: 3 },
                    textAlign: 'center',
                    background: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})`,
                    color: darkProTokens.textPrimary,
                    borderRadius: 3,
                    border: `1px solid ${darkProTokens.success}40`,
                    boxShadow: `0 8px 32px ${darkProTokens.success}20`
                  }}>
                    <Typography variant="h4" sx={{ 
                      fontWeight: 800, 
                      mb: 1,
                      fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
                    }}>
                      {formatPrice(stats.cashFlow.efectivo)}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      opacity: 0.9, 
                      fontWeight: 600,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>
                      💵 Efectivo
                    </Typography>
                    {dailyData && (
                      <Typography variant="caption" sx={{ 
                        opacity: 0.7, 
                        display: 'block', 
                        mt: 1,
                        fontSize: { xs: '0.6rem', sm: '0.7rem' }
                      }}>
                        POS: {formatPrice(dailyData.pos.efectivo)} | Membresías: {formatPrice(dailyData.memberships.efectivo)}
                      </Typography>
                    )}
                  </Paper>
                </motion.div>
              </Grid>
              
              <Grid xs={6} md={3}>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Paper sx={{
                    p: { xs: 2, sm: 3 },
                    textAlign: 'center',
                    background: `linear-gradient(135deg, ${darkProTokens.info}, ${darkProTokens.infoHover})`,
                    color: darkProTokens.textPrimary,
                    borderRadius: 3,
                    border: `1px solid ${darkProTokens.info}40`,
                    boxShadow: `0 8px 32px ${darkProTokens.info}20`
                  }}>
                    <Typography variant="h4" sx={{ 
                      fontWeight: 800, 
                      mb: 1,
                      fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
                    }}>
                      {formatPrice(stats.cashFlow.transferencia)}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      opacity: 0.9, 
                      fontWeight: 600,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>
                      🏦 Transferencia
                    </Typography>
                    {dailyData && (
                      <Typography variant="caption" sx={{ 
                        opacity: 0.7, 
                        display: 'block', 
                        mt: 1,
                        fontSize: { xs: '0.6rem', sm: '0.7rem' }
                      }}>
                        POS: {formatPrice(dailyData.pos.transferencia)} | Membresías: {formatPrice(dailyData.memberships.transferencia)}
                      </Typography>
                    )}
                  </Paper>
                </motion.div>
              </Grid>
              
              <Grid xs={6} md={3}>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Paper sx={{
                    p: { xs: 2, sm: 3 },
                    textAlign: 'center',
                    background: `linear-gradient(135deg, ${darkProTokens.roleTrainer}, #00695c)`,
                    color: darkProTokens.textPrimary,
                    borderRadius: 3,
                    border: `1px solid ${darkProTokens.roleTrainer}40`,
                    boxShadow: `0 8px 32px ${darkProTokens.roleTrainer}20`
                  }}>
                    <Typography variant="h4" sx={{ 
                      fontWeight: 800, 
                      mb: 1,
                      fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
                    }}>
                      {formatPrice(stats.cashFlow.debito)}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      opacity: 0.9, 
                      fontWeight: 600,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>
                      💳 Débito
                    </Typography>
                    {dailyData && (
                      <Typography variant="caption" sx={{ 
                        opacity: 0.7, 
                        display: 'block', 
                        mt: 1,
                        fontSize: { xs: '0.6rem', sm: '0.7rem' }
                      }}>
                        POS: {formatPrice(dailyData.pos.debito)} | Membresías: {formatPrice(dailyData.memberships.debito)}
                      </Typography>
                    )}
                  </Paper>
                </motion.div>
              </Grid>
              
              <Grid xs={6} md={3}>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Paper sx={{
                    p: { xs: 2, sm: 3 },
                    textAlign: 'center',
                    background: `linear-gradient(135deg, ${darkProTokens.warning}, ${darkProTokens.warningHover})`,
                    color: darkProTokens.background,
                    borderRadius: 3,
                    border: `1px solid ${darkProTokens.warning}40`,
                    boxShadow: `0 8px 32px ${darkProTokens.warning}20`
                  }}>
                    <Typography variant="h4" sx={{ 
                      fontWeight: 800, 
                      mb: 1,
                      fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
                    }}>
                      {formatPrice(stats.cashFlow.credito)}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      opacity: 0.9, 
                      fontWeight: 600,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>
                      💳 Crédito
                    </Typography>
                    {dailyData && (
                      <Typography variant="caption" sx={{ 
                        opacity: 0.7, 
                        display: 'block', 
                        mt: 1,
                        fontSize: { xs: '0.6rem', sm: '0.7rem' }
                      }}>
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

      {/* DESGLOSE DE INGRESOS DEL DÍA RESPONSIVO */}
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
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h6" sx={{ 
              color: darkProTokens.success, 
              mb: 3, 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}>
              <BarChartIcon />
              📊 Desglose de Ingresos del Día
            </Typography>
            
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              <Grid xs={12} md={4}>
                <Paper sx={{
                  p: { xs: 2, sm: 3 },
                  textAlign: 'center',
                  background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                  border: `2px solid ${darkProTokens.info}40`,
                  borderRadius: 3
                }}>
                  <Avatar sx={{ 
                    bgcolor: darkProTokens.info, 
                    width: { xs: 48, sm: 56 }, 
                    height: { xs: 48, sm: 56 },
                    mx: 'auto',
                    mb: 2
                  }}>
                    <SalesIcon />
                  </Avatar>
                  <Typography variant="h4" sx={{ 
                    color: darkProTokens.info, 
                    fontWeight: 800, 
                    mb: 1,
                    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
                  }}>
                    {formatPrice(stats.todaySales)}
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: darkProTokens.textSecondary, 
                    mb: 1,
                    fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' }
                  }}>
                    Ventas POS
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: darkProTokens.textDisabled,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}>
                    {stats.todayTransactions} transacciones
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid xs={12} md={4}>
                <Paper sx={{
                  p: { xs: 2, sm: 3 },
                  textAlign: 'center',
                  background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                  border: `2px solid ${darkProTokens.success}40`,
                  borderRadius: 3
                }}>
                  <Avatar sx={{ 
                    bgcolor: darkProTokens.success, 
                    width: { xs: 48, sm: 56 }, 
                    height: { xs: 48, sm: 56 },
                    mx: 'auto',
                    mb: 2
                  }}>
                    <FitnessCenterIcon />
                  </Avatar>
                  <Typography variant="h4" sx={{ 
                    color: darkProTokens.success, 
                    fontWeight: 800, 
                    mb: 1,
                    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
                  }}>
                    {formatPrice(stats.todayMembershipRevenue)}
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: darkProTokens.textSecondary, 
                    mb: 1,
                    fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' }
                  }}>
                    Membresías
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: darkProTokens.textDisabled,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}>
                    Solo ventas de hoy
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid xs={12} md={4}>
                <Paper sx={{
                  p: { xs: 2, sm: 3 },
                  textAlign: 'center',
                  background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                  border: `2px solid ${darkProTokens.warning}40`,
                  borderRadius: 3
                }}>
                  <Avatar sx={{ 
                    bgcolor: darkProTokens.warning, 
                    width: { xs: 48, sm: 56 }, 
                    height: { xs: 48, sm: 56 },
                    mx: 'auto',
                    mb: 2
                  }}>
                    <LayawayIcon />
                  </Avatar>
                  <Typography variant="h4" sx={{ 
                    color: darkProTokens.warning, 
                    fontWeight: 800, 
                    mb: 1,
                    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
                  }}>
                    {formatPrice(stats.todayLayawayPayments)}
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: darkProTokens.textSecondary, 
                    mb: 1,
                    fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' }
                  }}>
                    Abonos
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: darkProTokens.textDisabled,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}>
                    Apartados pagados hoy
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3, borderColor: darkProTokens.grayMedium }} />
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ 
                color: stats.todayBalance >= 0 ? darkProTokens.success : darkProTokens.error, 
                fontWeight: 800,
                mb: 1,
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
              }}>
                {formatPrice(stats.todayBalance)}
              </Typography>
              <Typography variant="h5" sx={{ 
                color: darkProTokens.textSecondary, 
                fontWeight: 600,
                fontSize: { xs: '1.2rem', sm: '1.5rem' }
              }}>
                💎 Total de Ingresos del Día
              </Typography>
              <Typography variant="body2" sx={{ 
                color: darkProTokens.warning,
                fontWeight: 500,
                mt: 1,
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }}>
                ⚡ Datos en tiempo real para {formatDateLocal(selectedDate)}
              </Typography>
              {dailyData && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<CheckCircleIcon />}
                    label={`${dailyData.totals.transactions} transacciones`}
                    size="small"
                    sx={{ 
                      bgcolor: `${darkProTokens.success}20`, 
                      color: darkProTokens.success, 
                      fontWeight: 600,
                      fontSize: { xs: '0.7rem', sm: '0.75rem' }
                    }}
                  />
                  <Chip
                    icon={<WarningIcon />}
                    label={`${formatPrice(dailyData.totals.commissions)} comisiones`}
                    size="small"
                    sx={{ 
                      bgcolor: `${darkProTokens.warning}20`, 
                      color: darkProTokens.warning, 
                      fontWeight: 600,
                      fontSize: { xs: '0.7rem', sm: '0.75rem' }
                    }}
                  />
                  <Chip
                    icon={<MoneyIcon />}
                    label={`${formatPrice(dailyData.totals.net_amount)} neto`}
                    size="small"
                    sx={{ 
                      bgcolor: `${darkProTokens.info}20`, 
                      color: darkProTokens.info, 
                      fontWeight: 600,
                      fontSize: { xs: '0.7rem', sm: '0.75rem' }
                    }}
                  />
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      {/* ACCESOS RÁPIDOS ENTERPRISE RESPONSIVOS */}
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
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h6" sx={{ 
              color: darkProTokens.primary, 
              mb: 3, 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}>
              <InsightsIcon />
              ⚡ Centro de Comando
            </Typography>
            
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              <Grid xs={12} sm={6} md={3}>
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
                      py: { xs: 1.5, sm: 2 },
                      px: 3,
                      borderRadius: 3,
                      fontWeight: 700,
                      fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
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
              
              <Grid xs={12} sm={6} md={3}>
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
                      py: { xs: 1.5, sm: 2 },
                      px: 3,
                      borderRadius: 3,
                      fontWeight: 600,
                      fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
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
              
              <Grid xs={12} sm={6} md={3}>
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
                      py: { xs: 1.5, sm: 2 },
                      px: 3,
                      borderRadius: 3,
                      fontWeight: 600,
                      fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
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
              
              <Grid xs={12} sm={6} md={3}>
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
                      py: { xs: 1.5, sm: 2 },
                      px: 3,
                      borderRadius: 3,
                      fontWeight: 600,
                      fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
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

      {/* INFORMACIÓN ADICIONAL RESPONSIVA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.4 }}
      >
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {/* INFORMACIÓN DE USUARIOS RESPONSIVA */}
          <Grid xs={12} md={6}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 4,
              height: '100%'
            }}>
              <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                <Typography variant="h6" sx={{ 
                  color: darkProTokens.roleStaff, 
                  mb: 3, 
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }}>
                  <PeopleIcon />
                  👥 Información de Clientes
                </Typography>
                
                <Stack spacing={3}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ 
                      color: darkProTokens.textPrimary, 
                      fontWeight: 600,
                      fontSize: { xs: '0.9rem', sm: '1rem' }
                    }}>
                      Total de Clientes:
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      color: darkProTokens.primary, 
                      fontWeight: 700,
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}>
                      {stats.totalUsers}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ 
                      color: darkProTokens.textPrimary, 
                      fontWeight: 600,
                      fontSize: { xs: '0.9rem', sm: '1rem' }
                    }}>
                      Con Membresía Activa:
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      color: darkProTokens.success, 
                      fontWeight: 700,
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}>
                      {stats.retentionData.clientsWithMembership}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ 
                      color: darkProTokens.textPrimary, 
                      fontWeight: 600,
                      fontSize: { xs: '0.9rem', sm: '1rem' }
                    }}>
                      Nuevos Hoy:
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      color: darkProTokens.info, 
                      fontWeight: 700,
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}>
                      +{stats.newUsersToday}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ 
                      color: darkProTokens.textPrimary, 
                      fontWeight: 600,
                      fontSize: { xs: '0.9rem', sm: '1rem' }
                    }}>
                      Nuevos Este Mes:
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      color: darkProTokens.warning, 
                      fontWeight: 700,
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}>
                      +{stats.newUsersMonth}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ borderColor: darkProTokens.grayMedium }} />
                  
                  <Box>
                    <Typography variant="body2" sx={{ 
                      color: darkProTokens.textSecondary, 
                      mb: 2,
                      fontSize: { xs: '0.8rem', sm: '0.875rem' }
                    }}>
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
                          fontWeight: 600,
                          fontSize: { xs: '0.7rem', sm: '0.75rem' }
                        }}
                      />
                      <Chip 
                        icon={<FemaleIcon />}
                        label={`${stats.usersByGender.female} Mujeres`}
                        size="small"
                        sx={{ 
                          bgcolor: `${darkProTokens.roleModerator}20`, 
                          color: darkProTokens.roleModerator,
                          fontWeight: 600,
                          fontSize: { xs: '0.7rem', sm: '0.75rem' }
                        }}
                      />
                      <Chip 
                        label={`${stats.usersByGender.other} Otros`}
                        size="small"
                        sx={{ 
                          bgcolor: `${darkProTokens.textSecondary}20`, 
                          color: darkProTokens.textSecondary,
                          fontWeight: 600,
                          fontSize: { xs: '0.7rem', sm: '0.75rem' }
                        }}
                      />
                    </Box>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* INFORMACIÓN DE MEMBRESÍAS RESPONSIVA */}
          <Grid xs={12} md={6}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 4,
              height: '100%'
            }}>
              <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                <Typography variant="h6" sx={{ 
                  color: darkProTokens.success, 
                  mb: 3, 
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }}>
                  <FitnessCenterIcon />
                  🏋️ Estado de Membresías
                </Typography>
                
                <Stack spacing={3}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ 
                      color: darkProTokens.textPrimary, 
                      fontWeight: 600,
                      fontSize: { xs: '0.9rem', sm: '1rem' }
                    }}>
                      Activas:
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      color: darkProTokens.success, 
                      fontWeight: 700,
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}>
                      {stats.activeMemberships}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ 
                      color: darkProTokens.textPrimary, 
                      fontWeight: 600,
                      fontSize: { xs: '0.9rem', sm: '1rem' }
                    }}>
                      Por Vencer (7 días):
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      color: darkProTokens.warning, 
                      fontWeight: 700,
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}>
                      {stats.expiringMemberships}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ 
                      color: darkProTokens.textPrimary, 
                      fontWeight: 600,
                      fontSize: { xs: '0.9rem', sm: '1rem' }
                    }}>
                      Vencidas:
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      color: darkProTokens.error, 
                      fontWeight: 700,
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}>
                      {stats.expiredMemberships}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ 
                      color: darkProTokens.textPrimary, 
                      fontWeight: 600,
                      fontSize: { xs: '0.9rem', sm: '1rem' }
                    }}>
                      Congeladas:
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      color: darkProTokens.info, 
                      fontWeight: 700,
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}>
                      {stats.frozenMemberships}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ borderColor: darkProTokens.grayMedium }} />
                  
                  <Box>
                    <Typography variant="body2" sx={{ 
                      color: darkProTokens.textSecondary, 
                      mb: 1,
                      fontSize: { xs: '0.8rem', sm: '0.875rem' }
                    }}>
                      Ingresos por Membresías:
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ 
                        color: darkProTokens.textPrimary,
                        fontSize: { xs: '0.8rem', sm: '0.875rem' }
                      }}>
                        Total Histórico:
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        color: darkProTokens.primary, 
                        fontWeight: 700,
                        fontSize: { xs: '0.9rem', sm: '1rem' }
                      }}>
                        {formatPrice(stats.membershipRevenue)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ 
                        color: darkProTokens.textPrimary,
                        fontSize: { xs: '0.8rem', sm: '0.875rem' }
                      }}>
                        Solo Hoy:
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        color: darkProTokens.success, 
                        fontWeight: 700,
                        fontSize: { xs: '0.9rem', sm: '1rem' }
                      }}>
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
