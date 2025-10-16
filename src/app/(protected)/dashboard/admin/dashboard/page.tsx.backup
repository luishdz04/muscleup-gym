
'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Avatar,
  LinearProgress,
  Chip,
  Paper,
  Stack,
  Divider,
  Alert,
  Snackbar,
  Tooltip,
  Badge,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Slider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButtonGroup,
  ToggleButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ButtonGroup,
  CircularProgress
} from '@mui/material';
import Grid from '@mui/material/Grid';
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
  Group as GroupIcon,
  Settings as SettingsIcon,
  Palette as PaletteIcon,
  ShowChart as ShowChartIcon,
  ExpandMore as ExpandMoreIcon,
  CalendarToday as CalendarIcon,
  DateRange as DateRangeIcon,
  ViewModule as ViewModuleIcon,
  Fullscreen as FullscreenIcon,
  Close as CloseIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useHydrated } from '@/hooks/useHydrated';
import { colorTokens } from '@/theme';
import {
  getTodayInMexico,
  formatMexicoTime,
  formatDateLong,
  getMexicoDateDaysAgo,
  getMexicoMonthKeyMonthsAgo,
  formatMexicoMonthName,
  formatMexicoDateTime
} from '@/utils/dateUtils';

// 📊 IMPORTAR GRÁFICOS ENTERPRISE CON TREMOR.SO
// Tremor es la librería especializada para dashboards con Next.js, React y Tailwind
import {
  WeeklySalesChart,
  MonthlyRevenueChart,
  ProductDistributionChart,
  RevenueTrendChart,
  ComparativeMetricsGrid,
  StackedAreaChart
} from '@/components/charts/TremorCharts';

// 🎨 CONFIGURACIÓN DE COLORES PERSONALIZABLE
const colorSchemes = {
  default: {
    primary: colorTokens.brand,
    secondary: colorTokens.success,
    tertiary: colorTokens.info,
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

// ✅ FUNCIONES LOCALES CORREGIDAS - JUNIO 2025
function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(amount || 0);
}

// 🔧 FUNCIÓN HELPER SEGURA PARA PORCENTAJES - NUEVA
function safePercentage(value: number, total: number): string {
  if (total === 0 || isNaN(total) || isNaN(value)) return '0.0';
  const percentage = (value / total) * 100;
  if (!isFinite(percentage)) return '0.0';
  return percentage.toFixed(1);
}

// 🔧 FUNCIÓN HELPER PARA CRECIMIENTO LIMITADO - NUEVA
function safeMathGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  const growth = ((current - previous) / previous) * 100;
  // Limitar a +/-1000% para evitar números irreales
  return Math.min(Math.max(growth, -1000), 1000);
}

// ✅ NO HAY FUNCIONES LOCALES - USAR DIRECTAMENTE dateUtils.ts

// ✅ FUNCIÓN PARA VERIFICAR CUMPLEAÑOS HOY - USANDO DATEUTILS
function isBirthdayToday(birthDate: string): boolean {
  if (!birthDate) return false;
  
  try {
    // Obtener fecha actual en México
    const todayInMexico = getTodayInMexico(); // Formato: YYYY-MM-DD
    const [, todayMonthStr, todayDayStr] = todayInMexico.split('-');
    const todayDay = parseInt(todayDayStr);
    const todayMonth = parseInt(todayMonthStr);

    // Normalizar la fecha de nacimiento a día y mes
    let birthDay: number;
    let birthMonth: number;

    if (birthDate.includes('/')) {
      // Formato DD/MM/YYYY o MM/DD/YYYY
      const parts = birthDate.split('/');
      if (parseInt(parts[1]) > 12) { // Heurística para MM/DD
        birthDay = parseInt(parts[1]);
        birthMonth = parseInt(parts[0]);
      } else { // Asumir DD/MM
        birthDay = parseInt(parts[0]);
        birthMonth = parseInt(parts[1]);
      }
    } else if (birthDate.includes('-')) {
      // Formato YYYY-MM-DD
      const parts = birthDate.split('-');
      birthMonth = parseInt(parts[1]);
      birthDay = parseInt(parts[2]);
    } else {
      return false;
    }

    if (isNaN(birthDay) || isNaN(birthMonth)) {
      return false;
    }
    
    return birthDay === todayDay && birthMonth === todayMonth;
    
  } catch (error) {
    return false;
  }
}

// ✅ INTERFACES CORREGIDAS
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
  expenses?: {
    amount: number;
    count: number;
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
    expenses_amount?: number;
    final_balance?: number;
  };
  success?: boolean;
}

interface MonthlyData {
  month: string;
  monthName: string;
  sales: number;
  memberships: number;
  layaways: number;
  total: number;
  transactions: number;
  expenses: number;
  finalBalance: number;
  growth: number;
}

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

interface DashboardConfig {
  monthsToShow: number;
  colorScheme: keyof typeof colorSchemes;
  showAnimations: boolean;
  compactMode: boolean;
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
  monthExpenses: number;
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
  birthdayUsers: BirthdayUser[];
  retentionData: RetentionData;
  monthlyData: MonthlyData[];
  monthlyComparison: {
    current: MonthlyData;
    previous: MonthlyData;
    growth: number;
  };
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
  const hydrated = useHydrated();
  
  const [config, setConfig] = useState<DashboardConfig>({
    monthsToShow: 6,
    colorScheme: 'default',
    showAnimations: true,
    compactMode: false
  });

  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [fullscreenChart, setFullscreenChart] = useState<string | null>(null);
  
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
  monthExpenses: 0,
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
    },
    monthlyData: [],
    monthlyComparison: {
      current: { month: '', monthName: '', sales: 0, memberships: 0, layaways: 0, total: 0, transactions: 0, expenses: 0, finalBalance: 0, growth: 0 },
      previous: { month: '', monthName: '', sales: 0, memberships: 0, layaways: 0, total: 0, transactions: 0, expenses: 0, finalBalance: 0, growth: 0 },
      growth: 0
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [currentMexicoTime, setCurrentMexicoTime] = useState<string>('');
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  
  const supabase = createBrowserSupabaseClient();

  // ✅ USAR SIEMPRE LA FECHA ACTUAL DE MÉXICO - NO ESTADO FIJO
  const selectedDate = getTodayInMexico();

  const currentColors = colorSchemes[config.colorScheme];

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const mexicoTime = formatMexicoTime(now, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      setCurrentMexicoTime(mexicoTime);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // ✅ FUNCIÓN CORREGIDA - loadRealDailyData
  const loadRealDailyData = useCallback(async (targetDate: string): Promise<DailyData | null> => {
    try {
      const response = await fetch(`/api/cuts/daily-data?date=${targetDate}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data?.success) {
        return data;
      }
      return null;
    } catch (error) {
      return null;
    }
  }, []);

  // ✅ FUNCIÓN CRÍTICA CORREGIDA - loadWeeklyRealData
  const loadWeeklyRealData = useCallback(async (): Promise<ChartData[]> => {
    const chartData: ChartData[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const dateString = getMexicoDateDaysAgo(i);
      
      // ✅ USAR EL FORMATO SIMPLE QUE FUNCIONABA
      const dayName = dateString.split('-').slice(1).join('/'); // "10/09"
      
      const dayData = await loadRealDailyData(dateString);
      
      // ✅ IMPORTANTE: Siempre agregar datos, incluso si son 0
      chartData.push({
        name: dayName,
        sales: dayData?.pos?.total || 0,
        memberships: dayData?.memberships?.total || 0,
        layaways: dayData?.abonos?.total || 0,
        date: dateString
      });
    }
    
    return chartData;
  }, [loadRealDailyData]);

  // ✅ FUNCIÓN CRÍTICA CORREGIDA - USAR dateUtils DIRECTAMENTE
  const getMonthKeyFromSelection = useCallback((monthsAgo: number) => {
    return getMexicoMonthKeyMonthsAgo(monthsAgo);
  }, []);

  // ✅ FUNCIÓN OPTIMIZADA - loadMonthlyRealData CON API MENSUAL
  // 🚀 USA UN SOLO API CALL POR MES (6 calls en lugar de 180+)
  const loadMonthlyRealData = useCallback(async (): Promise<MonthlyData[]> => {
    const monthlyData: MonthlyData[] = [];

    // � CONSULTAR CADA MES CON UNA SOLA LLAMADA AL API OPTIMIZADO
    const monthPromises = [];
    for (let i = config.monthsToShow - 1; i >= 0; i--) {
      const monthString = getMonthKeyFromSelection(i);
      monthPromises.push(
        fetch(`/api/cuts/monthly-data-optimized?month=${monthString}`)
          .then(res => res.json())
          .then(data => ({
            month: monthString,
            monthName: formatMexicoMonthName(monthString),
            sales: data.pos?.total || 0,
            memberships: data.memberships?.total || 0,
            layaways: data.abonos?.total || 0,
            total: data.totals?.total || 0,
            transactions: data.totals?.transactions || 0,
            expenses: data.expenses?.amount || 0,
            finalBalance: data.finalBalance || 0,
            growth: 0
          }))
          .catch(() => ({
            month: monthString,
            monthName: formatMexicoMonthName(monthString),
            sales: 0,
            memberships: 0,
            layaways: 0,
            total: 0,
            transactions: 0,
            expenses: 0,
            finalBalance: 0,
            growth: 0
          }))
      );
    }

    // Ejecutar todas las consultas en paralelo (6 meses = 6 segundos en lugar de 180+)
    const results = await Promise.all(monthPromises);
    monthlyData.push(...results);

    // Ordenar por mes
    monthlyData.sort((a, b) => a.month.localeCompare(b.month));

    // Calcular crecimiento mes a mes
    for (let i = 1; i < monthlyData.length; i++) {
      monthlyData[i].growth = safeMathGrowth(monthlyData[i].total, monthlyData[i - 1].total);
    }

    return monthlyData;
  }, [config.monthsToShow, getMonthKeyFromSelection]);

  // ✅ FUNCIÓN PARA CARGAR DATOS DIARIOS
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

  // ✅ FUNCIÓN PRINCIPAL CORREGIDA
  const loadDashboardStats = useCallback(async () => {
    try {
      setError(null);

      // Cargar datos
      const dailyDataResult = await loadDailyData();
      const realChartData = await loadWeeklyRealData();
      const monthlyDataResult = await loadMonthlyRealData();

      const mexicoToday = selectedDate;
      const today = new Date(selectedDate + 'T00:00:00'); // ✅ CORRECCIÓN: Usar selectedDate
      const firstDayOfMonth = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-01`;
      const in7Days = new Date(today);
      in7Days.setDate(today.getDate() + 7);
      const in7DaysString = `${in7Days.getFullYear()}-${(in7Days.getMonth() + 1).toString().padStart(2, '0')}-${in7Days.getDate().toString().padStart(2, '0')}`;

      // 👥 CARGAR USUARIOS
      const { data: allUsers, error: usersError } = await supabase
        .from('Users')
        .select('id, firstName, lastName, gender, createdAt, birthDate, profilePictureUrl, rol')
        .eq('rol', 'cliente');

      if (usersError) {
        throw usersError;
      }

      const clientUsers = allUsers || [];

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

      // 🎂 CUMPLEAÑEROS
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
        .select('*, userid');

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

      // 📊 RETENCIÓN
      const uniqueUsersWithMembership = new Set(active.map(m => m.userid)).size;
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
            fill: currentColors.secondary
          },
          {
            name: 'Sin Membresía',
            value: 100 - retentionPercentage,
            fill: colorTokens.neutral700
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

      // ✅ PIE DATA
      const pieData: PieData[] = [];
      if (dailyDataResult && dailyDataResult.totals && dailyDataResult.totals.total > 0) {
        if (dailyDataResult.totals.efectivo > 0) {
          pieData.push({
            name: 'Efectivo',
            value: dailyDataResult.totals.efectivo,
            color: currentColors.primary
          });
        }
        if (dailyDataResult.totals.transferencia > 0) {
          pieData.push({
            name: 'Transferencia',
            value: dailyDataResult.totals.transferencia,
            color: currentColors.secondary
          });
        }
        if (dailyDataResult.totals.debito > 0) {
          pieData.push({
            name: 'Débito',
            value: dailyDataResult.totals.debito,
            color: currentColors.tertiary
          });
        }
        if (dailyDataResult.totals.credito > 0) {
          pieData.push({
            name: 'Crédito',
            value: dailyDataResult.totals.credito,
            color: currentColors.quaternary
          });
        }
      }

      // ✅ COMPARATIVA MENSUAL - JUNIO 2025
  const currentMonthString = getMonthKeyFromSelection(0);
  const previousMonthString = getMonthKeyFromSelection(1);

      const currentMonthData = monthlyDataResult.find(m => m.month === currentMonthString);
      const previousMonthData = monthlyDataResult.find(m => m.month === previousMonthString);

      const currentMonth = currentMonthData || {
        month: currentMonthString,
        monthName: formatMexicoMonthName(currentMonthString),
        sales: dailyDataResult?.pos?.total || 0,
        memberships: dailyDataResult?.memberships?.total || 0,
        layaways: dailyDataResult?.abonos?.total || 0,
        total: dailyDataResult?.totals?.total || 0,
        transactions: dailyDataResult?.totals?.transactions || 0,
        expenses: dailyDataResult?.expenses?.amount ?? dailyDataResult?.totals?.expenses_amount ?? 0,
        finalBalance: dailyDataResult?.totals?.final_balance ?? ((dailyDataResult?.totals?.total || 0) - (dailyDataResult?.expenses?.amount || 0)),
        growth: 0
      };

      const previousMonth = previousMonthData || {
        month: previousMonthString,
        monthName: formatMexicoMonthName(previousMonthString),
        sales: 0,
        memberships: 0,
        layaways: 0,
        total: 0,
        transactions: 0,
        expenses: 0,
        finalBalance: 0,
        growth: 0
      };

      // 🔧 USAR FUNCIÓN SEGURA PARA CRECIMIENTO
      const monthlyGrowth = safeMathGrowth(currentMonth.total, previousMonth.total);

      // ✅ CONSTRUIR ESTADÍSTICAS FINALES
      const finalStats: DashboardStats = {
        totalUsers: clientUsers.length,
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
        todayAvgTicket: (dailyDataResult?.pos?.transactions || 0) > 0 ? (dailyDataResult.pos.total / dailyDataResult.pos.transactions) : 0,
        monthSales: currentMonth.sales,
        monthTransactions: currentMonth.transactions,
        activeLayaways: activeLayaways.length,
        expiringLayaways: expiringLayaways.length,
        layawaysPendingAmount: pendingAmount,
        layawaysCollectedAmount: collectedAmount,
        todayLayawayPayments: dailyDataResult?.abonos?.total || 0,
        todayExpenses: dailyDataResult?.expenses?.amount ?? dailyDataResult?.totals?.expenses_amount ?? 0,
        cashFlow: {
          efectivo: dailyDataResult?.totals?.efectivo || 0,
          transferencia: dailyDataResult?.totals?.transferencia || 0,
          debito: dailyDataResult?.totals?.debito || 0,
          credito: dailyDataResult?.totals?.credito || 0
        },
        todayBalance: dailyDataResult?.totals?.final_balance ?? ((dailyDataResult?.totals?.total || 0) - (dailyDataResult?.expenses?.amount ?? dailyDataResult?.totals?.expenses_amount ?? 0)),
        weeklyTrend: { sales: [], dates: [], memberships: [], layaways: [] },
        chartData: realChartData,
        pieData,
        birthdayUsers,
        retentionData,
        monthlyData: monthlyDataResult,
        monthlyComparison: {
          current: currentMonth,
          previous: previousMonth,
          growth: monthlyGrowth
        },
        monthExpenses: currentMonth.expenses
      };

      setStats(finalStats);
      setLastUpdate(formatMexicoDateTime(new Date().toISOString()));

    } catch (err: any) {
      setError(`Error cargando estadísticas: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate, loadDailyData, loadWeeklyRealData, loadMonthlyRealData, supabase, config.monthsToShow, currentColors]);

  const handleRefresh = useCallback(async () => {
    if (!hydrated) return;
    setRefreshing(true);
    await loadDashboardStats();
  }, [hydrated, loadDashboardStats]);

  useEffect(() => {
    if (!hydrated) return;
    loadDashboardStats();
  }, [hydrated, loadDashboardStats]);

  // ✅ COMPONENTE DE MÉTRICA
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
      whileHover={{ scale: config.showAnimations ? 1.02 : 1, y: config.showAnimations ? -5 : 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{
        background: `linear-gradient(135deg, ${color}, ${color}DD)`,
        color: colorTokens.textPrimary,
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
              bgcolor: `${colorTokens.textPrimary}15`, 
              width: config.compactMode ? { xs: 40, sm: 48 } : { xs: 48, sm: 56, md: 64 }, 
              height: config.compactMode ? { xs: 40, sm: 48 } : { xs: 48, sm: 56, md: 64 },
              border: `2px solid ${colorTokens.textPrimary}20`
            }}>
              {React.isValidElement(icon)
                ? React.cloneElement(icon as React.ReactElement<{ sx?: any }>, {
                    sx: {
                      fontSize: config.compactMode ? { xs: 20, sm: 24 } : { xs: 24, sm: 28, md: 32 },
                      color: colorTokens.textPrimary
                    }
                  })
                : icon}
            </Avatar>
          </Box>
          
          <Typography variant="h3" sx={{ 
            fontWeight: 800, 
            mb: 1,
            fontSize: config.compactMode ? { xs: '1.2rem', sm: '1.5rem' } : { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
            background: `linear-gradient(45deg, ${colorTokens.textPrimary}, ${currentColors.primary})`,
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

  if (loading) {
    return (
      <Box sx={{ 
        p: 3,
        background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.surfaceLevel1})`,
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
            Dashboard MUP
          </Typography>
          <Typography variant="h6" sx={{ color: colorTokens.textSecondary, mb: 3 }}>
            Cargando análisis avanzado del gimnasio...
          </Typography>
          <Typography variant="body2" sx={{ color: colorTokens.textDisabled }}>
            📅 Consultando datos para: {formatDateLong(selectedDate)}
          </Typography>
          
          <LinearProgress sx={{
            width: '300px',
            height: 6,
            borderRadius: 3,
            bgcolor: colorTokens.neutral300,
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

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3 },
      background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.surfaceLevel1})`,
      minHeight: '100vh',
      color: colorTokens.textPrimary
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
            background: `linear-gradient(135deg, ${colorTokens.danger}, ${colorTokens.dangerHover})`,
            color: colorTokens.textPrimary,
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
          background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
          border: `1px solid ${colorTokens.neutral300}`,
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
                  <AssessmentIcon sx={{ fontSize: config.compactMode ? { xs: 25, sm: 30 } : { xs: 30, sm: 40, md: 45 } }} />
                </Avatar>
              </motion.div>
              
              <Box>
                <Typography variant="h3" sx={{ 
                  color: currentColors.primary, 
                  fontWeight: 800,
                  fontSize: config.compactMode ? { xs: '1.5rem', sm: '2rem' } : { xs: '1.8rem', sm: '2.5rem', md: '3rem' }
                }}>
                  Dashboard
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: colorTokens.textSecondary, 
                  fontSize: config.compactMode ? { xs: '0.75rem', sm: '0.85rem' } : { xs: '0.85rem', sm: '0.95rem' }
                }}>
                  {formatDateLong(selectedDate)} • {currentMexicoTime}
                </Typography>
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
                startIcon={refreshing ? <CircularProgress size={24} sx={{ color: colorTokens.neutral0 }} /> : <RefreshIcon />}
                onClick={handleRefresh}
                disabled={refreshing}
                variant="contained"
                sx={{ 
                  background: `linear-gradient(135deg, ${colorTokens.info}, ${colorTokens.infoHover})`,
                  fontWeight: 700,
                  px: { xs: 3, sm: 4 },
                  py: { xs: 1, sm: 1.5 },
                  borderRadius: 3,
                  fontSize: config.compactMode ? { xs: '0.7rem', sm: '0.8rem' } : { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                  boxShadow: `0 8px 32px ${colorTokens.info}30`,
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: `0 12px 48px ${colorTokens.info}50`
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {refreshing ? 'Actualizando...' : 'Actualizar Datos'}
              </Button>
            </Box>
          </Box>

          {/* RESUMEN EJECUTIVO */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            p: config.compactMode ? { xs: 2, sm: 3 } : { xs: 3, sm: 4 },
            background: `linear-gradient(135deg, ${currentColors.secondary}15, ${currentColors.primary}10)`,
            borderRadius: 3,
            border: `1px solid ${currentColors.secondary}30`,
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
              background: `linear-gradient(90deg, ${currentColors.secondary}, ${currentColors.primary})`
            }
          }}>
            <Box sx={{ textAlign: 'center', minWidth: { xs: '45%', sm: 'auto' } }}>
              <Typography variant="h3" sx={{ 
                color: currentColors.secondary, 
                fontWeight: 800,
                fontSize: config.compactMode ? { xs: '1.2rem', sm: '1.5rem' } : { xs: '1.5rem', sm: '2rem', md: '3rem' },
                textShadow: `0 0 10px ${currentColors.secondary}40`
              }}>
                {stats.clientUsers}
              </Typography>
              <Typography variant="body1" sx={{ 
                color: colorTokens.textSecondary,
                fontWeight: 600,
                fontSize: config.compactMode ? { xs: '0.7rem', sm: '0.8rem' } : { xs: '0.8rem', sm: '0.9rem', md: '1rem' }
              }}>
                👥 Total Clientes
              </Typography>
            </Box>
            
            <Divider orientation="vertical" flexItem sx={{ 
              borderColor: `${currentColors.primary}40`,
              borderWidth: '1px',
              display: { xs: 'none', sm: 'block' }
            }} />
            
            <Box sx={{ textAlign: 'center', minWidth: { xs: '45%', sm: 'auto' } }}>
              <Typography variant="h3" sx={{ 
                color: currentColors.primary, 
                fontWeight: 800,
                fontSize: config.compactMode ? { xs: '1.2rem', sm: '1.5rem' } : { xs: '1.5rem', sm: '2rem', md: '3rem' },
                textShadow: `0 0 10px ${currentColors.primary}40`
              }}>
                {stats.activeMemberships}
              </Typography>
              <Typography variant="body1" sx={{ 
                color: colorTokens.textSecondary,
                fontWeight: 600,
                fontSize: config.compactMode ? { xs: '0.7rem', sm: '0.8rem' } : { xs: '0.8rem', sm: '0.9rem', md: '1rem' }
              }}>
                🏋️ Membresías Activas
              </Typography>
            </Box>
            
            <Divider orientation="vertical" flexItem sx={{ 
              borderColor: `${currentColors.primary}40`,
              borderWidth: '1px',
              display: { xs: 'none', sm: 'block' }
            }} />
            
            <Box sx={{ textAlign: 'center', minWidth: { xs: '45%', sm: 'auto' } }}>
              <Typography variant="h3" sx={{ 
                color: currentColors.tertiary, 
                fontWeight: 800,
                fontSize: config.compactMode ? { xs: '1.2rem', sm: '1.5rem' } : { xs: '1.5rem', sm: '2rem', md: '3rem' },
                textShadow: `0 0 10px ${currentColors.tertiary}40`
              }}>
                {stats.retentionData.retentionPercentage}%
              </Typography>
              <Typography variant="body1" sx={{ 
                color: colorTokens.textSecondary,
                fontWeight: 600,
                fontSize: config.compactMode ? { xs: '0.7rem', sm: '0.8rem' } : { xs: '0.8rem', sm: '0.9rem', md: '1rem' }
              }}>
                📊 Retención
              </Typography>
            </Box>
            
            <Divider orientation="vertical" flexItem sx={{ 
              borderColor: `${currentColors.primary}40`,
              borderWidth: '1px',
              display: { xs: 'none', sm: 'block' }
            }} />
            
            <Box sx={{ textAlign: 'center', minWidth: { xs: '45%', sm: 'auto' } }}>
              <Typography variant="h3" sx={{ 
                color: stats.todayBalance >= 0 ? currentColors.secondary : colorTokens.danger, 
                fontWeight: 800,
                fontSize: config.compactMode ? { xs: '1.2rem', sm: '1.5rem' } : { xs: '1.5rem', sm: '2rem', md: '3rem' },
                textShadow: stats.todayBalance >= 0 ? 
                  `0 0 10px ${currentColors.secondary}40` : 
                  `0 0 10px ${colorTokens.danger}40`
              }}>
                {formatPrice(stats.todayBalance)}
              </Typography>
              <Typography variant="body1" sx={{ 
                color: colorTokens.textSecondary,
                fontWeight: 600,
                fontSize: config.compactMode ? { xs: '0.7rem', sm: '0.8rem' } : { xs: '0.8rem', sm: '0.9rem', md: '1rem' }
              }}>
                💰 Ingresos Hoy
              </Typography>
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
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <MetricCard
              title="Total Clientes"
              value={stats.totalUsers}
              subtitle={`+${stats.newUsersToday} hoy, +${stats.newUsersMonth} este mes`}
              icon={<PeopleIcon />}
              color={colorTokens.info}
              onClick={() => router.push('/dashboard/admin/usuarios')}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <MetricCard
              title="Membresías Activas"
              value={stats.activeMemberships}
              subtitle={`${stats.expiringMemberships} por vencer en 7 días`}
              icon={<FitnessCenterIcon />}
              color={currentColors.secondary}
              onClick={() => router.push('/dashboard/admin/membresias')}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <MetricCard
              title="Ventas del Día"
              value={formatPrice(stats.todaySales)}
              subtitle={`${stats.todayTransactions} transacciones, ${formatPrice(stats.todayAvgTicket)} promedio`}
              icon={<SalesIcon />}
              color={currentColors.primary}
              onClick={() => router.push('/dashboard/admin/sales/history')}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <MetricCard
              title="Apartados Activos"
                            value={stats.activeLayaways}
              subtitle={`${formatPrice(stats.layawaysPendingAmount)} pendiente`}
              icon={<LayawayIcon />}
              color={currentColors.quaternary}
              onClick={() => router.push('/dashboard/admin/layaways/management')}
            />
          </Grid>
        </Grid>
      </motion.div>

      {/* CUMPLEAÑEROS + RETENCIÓN + COMPARATIVA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
          {/* CUMPLEAÑEROS */}
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
              border: `1px solid ${colorTokens.neutral300}`,
              borderRadius: 4,
              height: '100%',
              minHeight: config.compactMode ? '300px' : '400px'
            }}>
              <CardContent sx={{ p: config.compactMode ? { xs: 2, sm: 3 } : { xs: 3, sm: 4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <motion.div
                    animate={config.showAnimations ? { 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    } : {}}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <CakeIcon sx={{ color: colorTokens.warning, fontSize: 28 }} />
                  </motion.div>
                  <Typography variant="h6" sx={{ 
                    color: colorTokens.warning, 
                    fontWeight: 700,
                    fontSize: config.compactMode ? { xs: '0.9rem', sm: '1rem' } : { xs: '1rem', sm: '1.25rem' }
                  }}>
                    🎂 Cumpleañeros de Hoy
                  </Typography>
                  <Badge 
                    badgeContent={stats.birthdayUsers.length} 
                    color="warning"
                    sx={{
                      '& .MuiBadge-badge': {
                        bgcolor: currentColors.primary,
                        color: colorTokens.neutral0,
                        fontWeight: 700
                      }
                    }}
                  >
                    <GroupIcon sx={{ color: colorTokens.textSecondary }} />
                  </Badge>
                </Box>
                
                {stats.birthdayUsers.length > 0 ? (
                  <List sx={{ maxHeight: config.compactMode ? 200 : 250, overflow: 'auto' }}>
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
                            background: `linear-gradient(135deg, ${colorTokens.warning}10, ${currentColors.primary}05)`,
                            borderRadius: 3,
                            border: `1px solid ${colorTokens.warning}20`
                          }}>
                            <ListItemAvatar>
                              <Avatar 
                                src={user.profilePictureUrl} 
                                sx={{ 
                                  bgcolor: colorTokens.warning,
                                  border: `2px solid ${colorTokens.warning}40`
                                }}
                              >
                                🎉
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography variant="body1" sx={{ 
                                  color: colorTokens.textPrimary,
                                  fontWeight: 600,
                                  fontSize: config.compactMode ? { xs: '0.8rem', sm: '0.9rem' } : { xs: '0.9rem', sm: '1rem' }
                                }}>
                                  {user.firstName} {user.lastName || ''}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="body2" sx={{ 
                                  color: colorTokens.textSecondary,
                                  fontSize: config.compactMode ? { xs: '0.7rem', sm: '0.75rem' } : { xs: '0.75rem', sm: '0.875rem' }
                                }}>
                                  🎂 ¡Feliz cumpleaños!
                                </Typography>
                              }
                            />
                            <motion.div
                              animate={config.showAnimations ? { 
                                scale: [1, 1.2, 1]
                              } : {}}
                              transition={{ 
                                duration: 1,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            >
                              <CakeIcon sx={{ color: colorTokens.warning }} />
                            </motion.div>
                          </ListItem>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </List>
                ) : (
                  <Box sx={{ 
                    height: config.compactMode ? 200 : 250, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 2
                  }}>
                    <CakeIcon sx={{ fontSize: config.compactMode ? { xs: 50, sm: 60 } : { xs: 60, sm: 80 }, color: colorTokens.neutral700, opacity: 0.5 }} />
                    <Typography variant="h6" sx={{ 
                      color: colorTokens.textSecondary, 
                      fontSize: config.compactMode ? { xs: '0.9rem', sm: '1rem' } : { xs: '1rem', sm: '1.25rem' }
                    }}>
                      No hay cumpleañeros hoy
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: colorTokens.textDisabled, 
                      textAlign: 'center', 
                      fontSize: config.compactMode ? { xs: '0.7rem', sm: '0.8rem' } : { xs: '0.8rem', sm: '0.875rem' }
                    }}>
                      ¡Los cumpleañeros aparecerán aquí cuando sea su día especial!
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* RETENCIÓN */}
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
              border: `1px solid ${colorTokens.neutral300}`,
              borderRadius: 4,
              height: '100%',
              minHeight: config.compactMode ? '300px' : '400px'
            }}>
              <CardContent sx={{ p: config.compactMode ? { xs: 2, sm: 3 } : { xs: 3, sm: 4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <PercentIcon sx={{ color: currentColors.tertiary, fontSize: 28 }} />
                  <Typography variant="h6" sx={{ 
                    color: currentColors.tertiary, 
                    fontWeight: 700,
                    fontSize: config.compactMode ? { xs: '0.9rem', sm: '1rem' } : { xs: '1rem', sm: '1.25rem' }
                  }}>
                    📊 Retención de Clientes
                  </Typography>
                </Box>
                
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="h2" sx={{ 
                    color: currentColors.secondary, 
                    fontWeight: 800,
                    fontSize: config.compactMode ? { xs: '2rem', sm: '2.5rem' } : { xs: '2.5rem', sm: '3rem', md: '4rem' },
                    textShadow: `0 0 20px ${currentColors.secondary}40`
                  }}>
                    {stats.retentionData.retentionPercentage}%
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    color: colorTokens.textSecondary,
                    fontWeight: 600,
                    fontSize: config.compactMode ? { xs: '0.8rem', sm: '0.9rem' } : { xs: '0.9rem', sm: '1rem' }
                  }}>
                    de clientes con membresía activa
                  </Typography>
                </Box>

                <Box sx={{ '& > div': { border: 'none', boxShadow: 'none', padding: 0 } }}>
                  <ProductDistributionChart 
                    data={stats.retentionData.chartData.map((item: any) => ({
                      name: item.name,
                      sales: item.value
                    }))}
                    title=""
                    showTitle={false}
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ 
                      color: currentColors.secondary, 
                      fontWeight: 700,
                      fontSize: config.compactMode ? { xs: '0.9rem', sm: '1rem' } : { xs: '1rem', sm: '1.25rem' }
                    }}>
                      {stats.retentionData.clientsWithMembership}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: colorTokens.textSecondary,
                      fontSize: config.compactMode ? { xs: '0.65rem', sm: '0.7rem' } : { xs: '0.7rem', sm: '0.75rem' }
                    }}>
                      Con Membresía
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ 
                      color: colorTokens.neutral700, 
                      fontWeight: 700,
                      fontSize: config.compactMode ? { xs: '0.9rem', sm: '1rem' } : { xs: '1rem', sm: '1.25rem' }
                    }}>
                      {stats.retentionData.totalClients - stats.retentionData.clientsWithMembership}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: colorTokens.textSecondary,
                      fontSize: config.compactMode ? { xs: '0.65rem', sm: '0.7rem' } : { xs: '0.7rem', sm: '0.75rem' }
                    }}>
                      Sin Membresía
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* COMPARATIVA MENSUAL - ✅ JUNIO 2025 */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
              border: `1px solid ${colorTokens.neutral300}`,
              borderRadius: 4,
              height: '100%',
              minHeight: config.compactMode ? '300px' : '400px'
            }}>
              <CardContent sx={{ p: config.compactMode ? { xs: 2, sm: 3 } : { xs: 3, sm: 4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <CompareIcon sx={{ color: currentColors.primary, fontSize: 28 }} />
                  <Typography variant="h6" sx={{ 
                    color: currentColors.primary, 
                    fontWeight: 700,
                    fontSize: config.compactMode ? { xs: '0.9rem', sm: '1rem' } : { xs: '1rem', sm: '1.25rem' }
                  }}>
                    📈 Comparativa Mensual
                  </Typography>
                </Box>
                
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="h3" sx={{ 
                    color: stats.monthlyComparison.growth >= 0 ? currentColors.secondary : colorTokens.danger,
                    fontWeight: 800,
                    fontSize: config.compactMode ? { xs: '1.5rem', sm: '2rem' } : { xs: '2rem', sm: '2.5rem', md: '3rem' },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1
                  }}>
                    {stats.monthlyComparison.growth >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                    {Math.abs(stats.monthlyComparison.growth).toFixed(1)}%
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    color: colorTokens.textSecondary,
                    fontWeight: 600,
                    fontSize: config.compactMode ? { xs: '0.8rem', sm: '0.9rem' } : { xs: '0.9rem', sm: '1rem' }
                  }}>
                    vs mes anterior
                  </Typography>
                </Box>

                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" sx={{ 
                      color: colorTokens.textSecondary, 
                      mb: 1,
                      fontSize: config.compactMode ? { xs: '0.7rem', sm: '0.8rem' } : { xs: '0.8rem', sm: '0.875rem' }
                    }}>
                      Mes Actual: {stats.monthlyComparison.current.monthName}
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      color: currentColors.primary, 
                      fontWeight: 700,
                      fontSize: config.compactMode ? { xs: '0.9rem', sm: '1rem' } : { xs: '1rem', sm: '1.25rem' }
                    }}>
                      {formatPrice(stats.monthlyComparison.current.total)}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" sx={{ 
                      color: colorTokens.textSecondary, 
                      mb: 1,
                      fontSize: config.compactMode ? { xs: '0.7rem', sm: '0.8rem' } : { xs: '0.8rem', sm: '0.875rem' }
                    }}>
                      Mes Anterior: {stats.monthlyComparison.previous.monthName}
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      color: colorTokens.textDisabled, 
                      fontWeight: 600,
                      fontSize: config.compactMode ? { xs: '0.9rem', sm: '1rem' } : { xs: '1rem', sm: '1.25rem' }
                    }}>
                      {formatPrice(stats.monthlyComparison.previous.total)}
                    </Typography>
                  </Box>

                  <Divider sx={{ borderColor: colorTokens.neutral400 }} />

                  <Box>
                    <Typography variant="body2" sx={{ 
                      color: colorTokens.textSecondary, 
                      mb: 1,
                      fontSize: config.compactMode ? { xs: '0.7rem', sm: '0.8rem' } : { xs: '0.8rem', sm: '0.875rem' }
                    }}>
                      Desglose Mes Actual:
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" sx={{ 
                        color: colorTokens.textPrimary,
                        fontSize: config.compactMode ? { xs: '0.65rem', sm: '0.7rem' } : { xs: '0.7rem', sm: '0.75rem' }
                      }}>
                        Ventas POS:
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: currentColors.primary, 
                        fontWeight: 600,
                        fontSize: config.compactMode ? { xs: '0.65rem', sm: '0.7rem' } : { xs: '0.7rem', sm: '0.75rem' }
                      }}>
                        {formatPrice(stats.monthlyComparison.current.sales)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" sx={{ 
                        color: colorTokens.textPrimary,
                        fontSize: config.compactMode ? { xs: '0.65rem', sm: '0.7rem' } : { xs: '0.7rem', sm: '0.75rem' }
                      }}>
                        Membresías:
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: currentColors.secondary, 
                        fontWeight: 600,
                        fontSize: config.compactMode ? { xs: '0.65rem', sm: '0.7rem' } : { xs: '0.7rem', sm: '0.75rem' }
                      }}>
                        {formatPrice(stats.monthlyComparison.current.memberships)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" sx={{ 
                        color: colorTokens.textPrimary,
                        fontSize: config.compactMode ? { xs: '0.65rem', sm: '0.7rem' } : { xs: '0.7rem', sm: '0.75rem' }
                      }}>
                        Apartados:
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: currentColors.tertiary, 
                        fontWeight: 600,
                        fontSize: config.compactMode ? { xs: '0.65rem', sm: '0.7rem' } : { xs: '0.7rem', sm: '0.75rem' }
                      }}>
                        {formatPrice(stats.monthlyComparison.current.layaways)}
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>

      {/* 🎯 GRÁFICOS PRINCIPALES - RENDERIZADO DIRECTO */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
        {/* GRÁFICO SEMANAL - ✅ RENDERIZADO DIRECTO */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
              border: `1px solid ${colorTokens.neutral300}`,
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
                      📈 Tendencias (Últimos 7 días)
                    </Typography>
                    <Chip
                      label={`${stats.chartData.filter(d => d.sales > 0 || d.memberships > 0 || d.layaways > 0).length} días con datos`}
                      size="small"
                      sx={{
                        bgcolor: `${currentColors.secondary}20`,
                        color: currentColors.secondary,
                        fontWeight: 600,
                        fontSize: { xs: '0.6rem', sm: '0.75rem' }
                      }}
                    />
                  </Box>
                  <IconButton 
                    onClick={() => setFullscreenChart('weekly')}
                    sx={{ color: colorTokens.textSecondary }}
                  >
                    <FullscreenIcon />
                  </IconButton>
                </Box>
                
                {/* 🚀 GRÁFICO ENTERPRISE CON TREMOR */}
                {stats.chartData.some(d => d.sales > 0 || d.memberships > 0 || d.layaways > 0) ? (
                  <Box sx={{ '& > div': { border: 'none', boxShadow: 'none', padding: 0 } }}>
                    <WeeklySalesChart 
                      data={stats.chartData}
                      title="Ventas Semanales"
                      showTitle={false}
                    />
                  </Box>
                ) : (
                  <Box sx={{ 
                    height: config.compactMode ? 250 : 350,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 2
                  }}>
                    <TimelineIcon sx={{ fontSize: { xs: 60, sm: 80 }, color: colorTokens.neutral700, opacity: 0.5 }} />
                    <Typography variant="h6" sx={{ color: colorTokens.textSecondary, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                      Sin datos históricos disponibles
                    </Typography>
                    <Typography variant="body2" sx={{ color: colorTokens.textDisabled, textAlign: 'center', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      Los gráficos aparecerán cuando haya datos reales<br />
                      de días anteriores en la base de datos
                    </Typography>
                  </Box>
                )}
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
              background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
              border: `1px solid ${colorTokens.neutral300}`,
              borderRadius: 4,
              height: '100%'
            }}>
              <CardContent sx={{ p: config.compactMode ? { xs: 2, sm: 3 } : { xs: 2, sm: 4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <PieChartIcon sx={{ color: currentColors.tertiary, fontSize: 28 }} />
                    <Typography variant="h6" sx={{ 
                      color: currentColors.tertiary, 
                      fontWeight: 700,
                      fontSize: config.compactMode ? { xs: '0.9rem', sm: '1rem' } : { xs: '1rem', sm: '1.25rem' }
                    }}>
                      💳 Métodos de Pago Hoy
                    </Typography>
                  </Box>
                  <IconButton 
                    onClick={() => setFullscreenChart('payments')}
                    sx={{ color: colorTokens.textSecondary }}
                  >
                    <FullscreenIcon />
                  </IconButton>
                </Box>
                
                {stats.pieData.length > 0 ? (
                  <Box sx={{ '& > div': { border: 'none', boxShadow: 'none', padding: 0 } }}>
                    <ProductDistributionChart 
                      data={stats.pieData.map(item => ({
                        name: item.name,
                        sales: item.value
                      }))}
                      title="Distribución de Ventas"
                      showTitle={false}
                    />
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
                    <PaymentIcon sx={{ fontSize: config.compactMode ? { xs: 35, sm: 45 } : { xs: 40, sm: 60 }, color: colorTokens.neutral700, opacity: 0.5 }} />
                    <Typography variant="body1" sx={{ 
                      color: colorTokens.textSecondary, 
                      fontSize: config.compactMode ? { xs: '0.8rem', sm: '0.9rem' } : { xs: '0.9rem', sm: '1rem' }
                    }}>
                      No hay pagos registrados hoy
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* ANÁLISIS MENSUALES - ✅ RENDERIZADO DIRECTO */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <Card sx={{
          mb: 4,
          background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
          border: `1px solid ${colorTokens.neutral300}`,
          borderRadius: 4
        }}>
          <CardContent sx={{ p: config.compactMode ? { xs: 2, sm: 3 } : { xs: 3, sm: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <DateRangeIcon sx={{ color: currentColors.primary, fontSize: 28 }} />
                <Typography variant="h6" sx={{ 
                  color: currentColors.primary, 
                  fontWeight: 700,
                  fontSize: config.compactMode ? { xs: '0.9rem', sm: '1rem' } : { xs: '1rem', sm: '1.25rem' }
                }}>
                  📊 Análisis Mensuales (Últimos {config.monthsToShow} meses)
                </Typography>
              </Box>
              <IconButton 
                onClick={() => setFullscreenChart('monthly')}
                sx={{ color: colorTokens.textSecondary }}
              >
                <FullscreenIcon />
              </IconButton>
            </Box>

            {/* 🚀 GRÁFICO MENSUAL ENTERPRISE CON TREMOR */}
            {stats.monthlyData.some(m => m.total > 0) ? (
              <Box sx={{ '& > div': { border: 'none', boxShadow: 'none', padding: 0 } }}>
                <MonthlyRevenueChart 
                  data={stats.monthlyData}
                  title="Ingresos Mensuales"
                  showTitle={false}
                />
              </Box>
            ) : (
              <Box sx={{ 
                height: config.compactMode ? 300 : 400,
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 2
              }}>
                <CalendarIcon sx={{ fontSize: config.compactMode ? { xs: 60, sm: 70 } : { xs: 70, sm: 90 }, color: colorTokens.neutral700, opacity: 0.5 }} />
                <Typography variant="h6" sx={{ 
                  color: colorTokens.textSecondary, 
                  fontSize: config.compactMode ? { xs: '0.9rem', sm: '1rem' } : { xs: '1rem', sm: '1.25rem' }
                }}>
                  Sin datos mensuales disponibles
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: colorTokens.textDisabled, 
                  textAlign: 'center', 
                  fontSize: config.compactMode ? { xs: '0.7rem', sm: '0.8rem' } : { xs: '0.8rem', sm: '0.875rem' }
                }}>
                  Los datos del mes actual aparecerán aquí
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </motion.div>

{/* MÉTODOS DE PAGO DEL DÍA - 🔧 CORREGIDO CON safePercentage */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, delay: 1 }}
>
  <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
    <Grid size={{ xs: 12, md: 6 }}>
      <Card sx={{
        background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
        border: `1px solid ${colorTokens.neutral300}`,
        borderRadius: 4
      }}>
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <PaymentIcon sx={{ color: currentColors.primary, fontSize: 28 }} />
            <Typography variant="h6" sx={{ 
              color: currentColors.primary, 
              fontWeight: 700,
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}>
              💳 Métodos de Pago del Día
            </Typography>
          </Box>

          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: `${currentColors.primary}20`, width: 40, height: 40 }}>
                  <MoneyIcon sx={{ color: currentColors.primary, fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="body1" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                    Efectivo
                  </Typography>
                  <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                    {/* 🔧 USAR safePercentage */}
                    {safePercentage(stats.cashFlow.efectivo, stats.todayBalance)}% del total
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h6" sx={{ color: currentColors.primary, fontWeight: 700 }}>
                {formatPrice(stats.cashFlow.efectivo)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: `${currentColors.secondary}20`, width: 40, height: 40 }}>
                  <AccountBalanceIcon sx={{ color: currentColors.secondary, fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="body1" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                    Transferencia
                  </Typography>
                  <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                    {/* 🔧 USAR safePercentage */}
                    {safePercentage(stats.cashFlow.transferencia, stats.todayBalance)}% del total
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h6" sx={{ color: currentColors.secondary, fontWeight: 700 }}>
                {formatPrice(stats.cashFlow.transferencia)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: `${currentColors.tertiary}20`, width: 40, height: 40 }}>
                  <PaymentIcon sx={{ color: currentColors.tertiary, fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="body1" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                    Tarjeta Débito
                  </Typography>
                  <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                    {/* 🔧 USAR safePercentage */}
                    {safePercentage(stats.cashFlow.debito, stats.todayBalance)}% del total
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h6" sx={{ color: currentColors.tertiary, fontWeight: 700 }}>
                {formatPrice(stats.cashFlow.debito)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: `${currentColors.quaternary}20`, width: 40, height: 40 }}>
                  <PaymentIcon sx={{ color: currentColors.quaternary, fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="body1" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                    Tarjeta Crédito
                  </Typography>
                  <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                    {/* 🔧 USAR safePercentage */}
                    {safePercentage(stats.cashFlow.credito, stats.todayBalance)}% del total
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h6" sx={{ color: currentColors.quaternary, fontWeight: 700 }}>
                {formatPrice(stats.cashFlow.credito)}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Grid>

    {/* DESGLOSE DE INGRESOS - 🔧 CORREGIDO CON safePercentage */}
    <Grid size={{ xs: 12, md: 6 }}>
      <Card sx={{
        background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
        border: `1px solid ${colorTokens.neutral300}`,
        borderRadius: 4
      }}>
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <ReceiptIcon sx={{ color: currentColors.secondary, fontSize: 28 }} />
            <Typography variant="h6" sx={{ 
              color: currentColors.secondary, 
              fontWeight: 700,
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}>
              📊 Desglose de Ingresos del Día
            </Typography>
          </Box>

          <Stack spacing={2}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                  Ventas POS
                </Typography>
                <Typography variant="body1" sx={{ color: currentColors.primary, fontWeight: 700 }}>
                  {formatPrice(stats.todaySales)}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={stats.todayBalance > 0 ? (stats.todaySales / stats.todayBalance) * 100 : 0}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: colorTokens.neutral300,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: currentColors.primary,
                    borderRadius: 4
                  }
                }}
              />
            </Box>

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                  Membresías
                </Typography>
                <Typography variant="body1" sx={{ color: currentColors.secondary, fontWeight: 700 }}>
                  {formatPrice(stats.todayMembershipRevenue)}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={stats.todayBalance > 0 ? (stats.todayMembershipRevenue / stats.todayBalance) * 100 : 0}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: colorTokens.neutral300,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: currentColors.secondary,
                    borderRadius: 4
                  }
                }}
              />
            </Box>

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                  Pagos de Apartados
                </Typography>
                <Typography variant="body1" sx={{ color: currentColors.tertiary, fontWeight: 700 }}>
                  {formatPrice(stats.todayLayawayPayments)}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={stats.todayBalance > 0 ? (stats.todayLayawayPayments / stats.todayBalance) * 100 : 0}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: colorTokens.neutral300,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: currentColors.tertiary,
                    borderRadius: 4
                  }
                }}
              />
            </Box>

            <Divider sx={{ borderColor: colorTokens.neutral400, my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>
                Total del Día
              </Typography>
              <Typography variant="h5" sx={{ 
                color: currentColors.primary, 
                fontWeight: 800,
                textShadow: `0 0 10px ${currentColors.primary}40`
              }}>
                {formatPrice(stats.todayBalance)}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  </Grid>
</motion.div>

{/* ESTADÍSTICAS DE USUARIOS - 🔧 CORREGIDO CON safePercentage */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, delay: 1.2 }}
>
  <Card sx={{
    mb: 4,
    background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
    border: `1px solid ${colorTokens.neutral300}`,
    borderRadius: 4
  }}>
    <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <PeopleIcon sx={{ color: currentColors.primary, fontSize: 28 }} />
        <Typography variant="h6" sx={{ 
          color: currentColors.primary, 
          fontWeight: 700,
          fontSize: { xs: '1rem', sm: '1.25rem' }
        }}>
          👥 Estadísticas de Usuarios
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Avatar sx={{ 
              bgcolor: `${colorTokens.info}20`, 
              width: 80, 
              height: 80,
              mx: 'auto',
              mb: 2,
              border: `3px solid ${colorTokens.info}40`
            }}>
              <PeopleIcon sx={{ fontSize: 40, color: colorTokens.info }} />
            </Avatar>
            <Typography variant="h4" sx={{ color: colorTokens.info, fontWeight: 800, mb: 1 }}>
              {stats.totalUsers}
            </Typography>
            <Typography variant="body1" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
              Total Usuarios
            </Typography>
            <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
              +{stats.newUsersMonth} este mes
            </Typography>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Avatar sx={{ 
              bgcolor: `${colorTokens.info}20`, 
              width: 80, 
              height: 80,
              mx: 'auto',
              mb: 2,
              border: `3px solid ${colorTokens.info}40`
            }}>
              <MaleIcon sx={{ fontSize: 40, color: colorTokens.info }} />
            </Avatar>
            <Typography variant="h4" sx={{ color: colorTokens.info, fontWeight: 800, mb: 1 }}>
              {stats.usersByGender.male}
            </Typography>
            <Typography variant="body1" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
              Hombres
            </Typography>
            <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
              {/* 🔧 USAR safePercentage */}
              {safePercentage(stats.usersByGender.male, stats.totalUsers)}% del total
            </Typography>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Avatar sx={{ 
              bgcolor: `${colorTokens.brand}20`, 
              width: 80, 
              height: 80,
              mx: 'auto',
              mb: 2,
              border: `3px solid ${colorTokens.brand}40`
            }}>
              <FemaleIcon sx={{ fontSize: 40, color: colorTokens.brand }} />
            </Avatar>
            <Typography variant="h4" sx={{ color: colorTokens.brand, fontWeight: 800, mb: 1 }}>
              {stats.usersByGender.female}
            </Typography>
            <Typography variant="body1" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
              Mujeres
            </Typography>
            <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
              {/* 🔧 USAR safePercentage */}
              {safePercentage(stats.usersByGender.female, stats.totalUsers)}% del total
            </Typography>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Avatar sx={{ 
              bgcolor: `${colorTokens.warning}20`, 
              width: 80, 
              height: 80,
              mx: 'auto',
              mb: 2,
              border: `3px solid ${colorTokens.warning}40`
            }}>
              <PersonAddIcon sx={{ fontSize: 40, color: colorTokens.warning }} />
            </Avatar>
            <Typography variant="h4" sx={{ color: colorTokens.warning, fontWeight: 800, mb: 1 }}>
              {stats.newUsersToday}
            </Typography>
            <Typography variant="body1" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
              Nuevos Hoy
            </Typography>
            <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
              Registros del día
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
</motion.div>

{/* ACCESOS RÁPIDOS */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, delay: 1.4 }}
>
  <Card sx={{
    background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
    border: `1px solid ${colorTokens.neutral300}`,
    borderRadius: 4
  }}>
    <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <SpeedIcon sx={{ color: currentColors.primary, fontSize: 28 }} />
        <Typography variant="h6" sx={{ 
          color: currentColors.primary, 
          fontWeight: 700,
          fontSize: { xs: '1rem', sm: '1.25rem' }
        }}>
          ⚡ Accesos Rápidos
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => router.push('/dashboard/admin/pos')}
            sx={{
              py: 2,
              borderColor: currentColors.primary,
              color: currentColors.primary,
              '&:hover': {
                borderColor: currentColors.primary,
                bgcolor: `${currentColors.primary}10`
              }
            }}
          >
            <Stack alignItems="center" spacing={1}>
              <SalesIcon />
              <Typography variant="caption">POS</Typography>
            </Stack>
          </Button>
        </Grid>

        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => router.push('/dashboard/admin/membresias/nueva')}
            sx={{
              py: 2,
              borderColor: currentColors.secondary,
              color: currentColors.secondary,
              '&:hover': {
                borderColor: currentColors.secondary,
                bgcolor: `${currentColors.secondary}10`
              }
            }}
          >
            <Stack alignItems="center" spacing={1}>
              <FitnessCenterIcon />
              <Typography variant="caption">Nueva Membresía</Typography>
            </Stack>
          </Button>
        </Grid>

        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => router.push('/dashboard/admin/usuarios/nuevo')}
            sx={{
              py: 2,
              borderColor: currentColors.tertiary,
              color: currentColors.tertiary,
              '&:hover': {
                borderColor: currentColors.tertiary,
                bgcolor: `${currentColors.tertiary}10`
              }
            }}
          >
            <Stack alignItems="center" spacing={1}>
              <PersonAddIcon />
              <Typography variant="caption">Nuevo Usuario</Typography>
            </Stack>
          </Button>
        </Grid>

        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => router.push('/dashboard/admin/cortes')}
            sx={{
              py: 2,
              borderColor: currentColors.quaternary,
              color: currentColors.quaternary,
              '&:hover': {
                borderColor: currentColors.quaternary,
                bgcolor: `${currentColors.quaternary}10`
              }
            }}
          >
            <Stack alignItems="center" spacing={1}>
              <ReceiptIcon />
              <Typography variant="caption">Cortes</Typography>
            </Stack>
          </Button>
        </Grid>

        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => router.push('/dashboard/admin/reportes')}
            sx={{
              py: 2,
              borderColor: colorTokens.info,
              color: colorTokens.info,
              '&:hover': {
                borderColor: colorTokens.info,
                bgcolor: `${colorTokens.info}10`
              }
            }}
          >
            <Stack alignItems="center" spacing={1}>
              <AssessmentIcon />
              <Typography variant="caption">Reportes</Typography>
            </Stack>
          </Button>
        </Grid>

        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => router.push('/dashboard/admin/configuracion')}
            sx={{
              py: 2,
              borderColor: colorTokens.warning,
              color: colorTokens.warning,
              '&:hover': {
                borderColor: colorTokens.warning,
                bgcolor: `${colorTokens.warning}10`
              }
            }}
          >
            <Stack alignItems="center" spacing={1}>
              <SettingsIcon />
              <Typography variant="caption">Configuración</Typography>
            </Stack>
          </Button>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
</motion.div>
      
      {/* 🎛️ DIALOG DE CONFIGURACIÓN SIMPLIFICADO */}
      <Dialog 
        open={configDialogOpen} 
        onClose={() => setConfigDialogOpen(false)}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
            border: `1px solid ${colorTokens.neutral300}`,
            color: colorTokens.textPrimary
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: `1px solid ${colorTokens.neutral300}`,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <SettingsIcon sx={{ color: currentColors.primary }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            ⚙️ Configuración del Dashboard
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={4}>
            {/* CONFIGURACIÓN DE MESES */}
            <Box>
              <Typography variant="h6" sx={{ color: currentColors.primary, mb: 2, fontWeight: 600 }}>
                📅 Análisis Temporal
              </Typography>
              <Typography variant="body1" sx={{ color: colorTokens.textPrimary, mb: 2, fontWeight: 600 }}>
                Meses a mostrar en comparativas: {config.monthsToShow}
              </Typography>
              <Slider
                value={config.monthsToShow}
                onChange={(_, value) => setConfig(prev => ({ ...prev, monthsToShow: value as number }))}
                min={3}
                max={12}
                step={1}
                marks={[
                  { value: 3, label: '3m' },
                  { value: 6, label: '6m' },
                  { value: 9, label: '9m' },
                  { value: 12, label: '12m' }
                ]}
                sx={{
                  color: currentColors.primary,
                  '& .MuiSlider-thumb': {
                    bgcolor: currentColors.primary,
                    border: `2px solid ${currentColors.primary}40`,
                    '&:hover': {
                      boxShadow: `0 0 0 8px ${currentColors.primary}20`
                    }
                  },
                  '& .MuiSlider-track': {
                    bgcolor: currentColors.primary
                  },
                  '& .MuiSlider-rail': {
                    bgcolor: colorTokens.neutral400
                  }
                }}
              />
            </Box>

            {/* ESQUEMAS DE COLORES */}
            <Box>
              <Typography variant="h6" sx={{ color: currentColors.secondary, mb: 2, fontWeight: 600 }}>
                🎨 Esquemas de Colores
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(colorSchemes).map(([key, scheme]) => (
                  <Grid size={{ xs: 6, sm: 4 }} key={key}>
                    <Paper 
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        cursor: 'pointer',
                        border: config.colorScheme === key ? 
                          `3px solid ${scheme.primary}` : 
                          `1px solid ${colorTokens.neutral300}`,
                        background: config.colorScheme === key ? 
                          `${scheme.primary}10` : 
                          colorTokens.surfaceLevel3,
                        '&:hover': {
                          border: `2px solid ${scheme.primary}60`
                        },
                        transition: 'all 0.3s ease'
                      }}
                      onClick={() => setConfig(prev => ({ ...prev, colorScheme: key as keyof typeof colorSchemes }))}
                    >
                      <Typography variant="body2" sx={{ 
                        color: colorTokens.textPrimary, 
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
                    <Typography sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
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
                    <Typography sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                      📱 Modo Compacto
                    </Typography>
                  }
                />
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, borderTop: `1px solid ${colorTokens.neutral300}` }}>
          <Button 
            onClick={() => setConfigDialogOpen(false)}
            sx={{ color: colorTokens.textSecondary }}
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

      {/* 🖼️ DIALOG DE PANTALLA COMPLETA PARA GRÁFICOS */}
      <Dialog 
        open={!!fullscreenChart} 
        onClose={() => setFullscreenChart(null)}
        maxWidth="xl"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.surfaceLevel1})`,
            border: `1px solid ${colorTokens.neutral300}`,
            color: colorTokens.textPrimary,
            minHeight: '80vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: `1px solid ${colorTokens.neutral300}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ShowChartIcon sx={{ color: currentColors.primary }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              📊 {fullscreenChart === 'weekly' ? 'Tendencias Semanales' : 
                  fullscreenChart === 'monthly' ? 'Análisis Mensuales' : 
                  'Métodos de Pago'} - Vista Completa
            </Typography>
          </Box>
          <IconButton onClick={() => setFullscreenChart(null)} sx={{ color: colorTokens.textSecondary }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 4 }}>
          {/* 🚀 GRÁFICOS ENTERPRISE CON TREMOR EN FULLSCREEN */}
          {fullscreenChart === 'weekly' && stats.chartData.length > 0 && (
            <Box sx={{ '& > div': { border: 'none', boxShadow: 'none', padding: 0 } }}>
              <WeeklySalesChart 
                data={stats.chartData}
                title="Análisis de Ventas Semanales"
                showTitle={true}
              />
            </Box>
          )}
          
          {fullscreenChart === 'monthly' && stats.monthlyData.length > 0 && (
            <Box sx={{ '& > div': { border: 'none', boxShadow: 'none', padding: 0 } }}>
              <MonthlyRevenueChart 
                data={stats.monthlyData}
                title="Análisis de Ingresos Mensuales"
                showTitle={true}
              />
            </Box>
          )}
          
          {fullscreenChart === 'payments' && stats.pieData.length > 0 && (
            <Box sx={{ '& > div': { border: 'none', boxShadow: 'none', padding: 0 } }}>
              <ProductDistributionChart 
                data={stats.pieData.map(item => ({
                  name: item.name,
                  sales: item.value
                }))}
                title="💳 Distribución de Métodos de Pago - Hoy"
                showTitle={true}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}



