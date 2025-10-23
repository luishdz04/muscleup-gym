// app/(protected)/dashboard/admin/dashboard/page.tsx
// ✅ DASHBOARD PROFESIONAL v2.0 - MUI CHARTS v8.14.0
// Diseño responsivo de nivel empresarial con gráficas profesionales

'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Chip,
  Alert,
  IconButton,
  Skeleton,
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingCart as SalesIcon,
  Refresh as RefreshIcon,
  Assessment as AssessmentIcon,
  Receipt as ReceiptIcon,
  CreditCard as PaymentIcon,
  CalendarToday as CalendarIcon,
  Insights as InsightsIcon,
  FitnessCenter as FitnessCenterIcon,
  CardMembership as CardMembershipIcon,
  Warning as WarningIcon,
  DirectionsRun as DirectionsRunIcon,
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
} from '@/utils/dateUtils';

// ✅ IMPORT NEW PROFESSIONAL CHARTS
import {
  DashboardMetricsCard,
  SalesLineChart,
  RevenueBarChart,
  PaymentMethodsPieChart,
  MembershipStatusChart,
  MonthComparisonChart,
} from '@/components/dashboard/charts';

// ✅ INTERFACES
interface DailyData {
  date: string;
  pos?: {
    total: number;
    transactions: number;
  };
  memberships?: {
    total: number;
    count: number;
  };
  layaways?: {
    total: number;
    count: number;
  };
  expenses?: {
    total: number;
  };
}

interface MonthlyData {
  month: string;
  monthName: string;
  sales: number;
  memberships: number;
  layaways: number;
  total: number;
}

interface ChartData {
  name: string;
  sales: number;
  memberships: number;
  layaways: number;
  date: string;
}

interface PaymentMethod {
  efectivo: number;
  transferencia: number;
  debito: number;
  credito: number;
}

interface MembershipStats {
  active: number;
  inactive: number;
  total: number;
}

interface GenderStats {
  male: number;
  female: number;
  other: number;
  total: number;
}

interface UserStats {
  memberships: MembershipStats;
  gender: GenderStats;
  timestamp: string;
}

interface GymActivityStats {
  todayVisits: number;
  activeMembershipsToday: number;
  expiringIn7Days: number;
  newMembershipsToday: number;
}

interface DashboardStats {
  todaySales: number;
  todayTransactions: number;
  todayMemberships: number;
  todayMembershipsAmount: number;
  monthSales: number;
  monthTransactions: number;
  monthMemberships: number;
  monthMembershipsAmount: number;
  monthExpenses: number;
  monthBalance: number;
  todayExpenses: number;
  todayBalance: number;
  cashFlow: PaymentMethod;
  chartData: ChartData[];
  monthlyData: MonthlyData[];
}

// ✅ UTILITY FUNCTIONS
function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(amount || 0);
}

function safePercentage(value: number, total: number): number {
  if (total === 0 || isNaN(total) || isNaN(value)) return 0;
  const percentage = (value / total) * 100;
  if (!isFinite(percentage)) return 0;
  return Number(percentage.toFixed(1));
}

// ✅ MAIN DASHBOARD COMPONENT
export default function DashboardPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    todayTransactions: 0,
    todayMemberships: 0,
    todayMembershipsAmount: 0,
    monthSales: 0,
    monthTransactions: 0,
    monthMemberships: 0,
    monthMembershipsAmount: 0,
    monthExpenses: 0,
    monthBalance: 0,
    todayExpenses: 0,
    todayBalance: 0,
    cashFlow: { efectivo: 0, transferencia: 0, debito: 0, credito: 0 },
    chartData: [],
    monthlyData: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [currentMexicoTime, setCurrentMexicoTime] = useState<string>('');

  // Nuevos estados para gráficos de usuarios
  const [userStats, setUserStats] = useState<UserStats>({
    memberships: { active: 0, inactive: 0, total: 0 },
    gender: { male: 0, female: 0, other: 0, total: 0 },
    timestamp: ''
  });
  const [userStatsLoading, setUserStatsLoading] = useState(true);

  // Estado para estadísticas de actividad del gimnasio
  const [gymActivityStats, setGymActivityStats] = useState<GymActivityStats>({
    todayVisits: 0,
    activeMembershipsToday: 0,
    expiringIn7Days: 0,
    newMembershipsToday: 0,
  });

  const selectedDate = getTodayInMexico();

  // Update current time
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

  // Load daily data
  const loadRealDailyData = useCallback(async (targetDate: string): Promise<DailyData | null> => {
    try {
      const response = await fetch(`/api/cuts/daily-data?date=${targetDate}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data?.success ? data : null;
    } catch (error) {
      return null;
    }
  }, []);

  // Load weekly data for chart
  const loadWeeklyRealData = useCallback(async (): Promise<ChartData[]> => {
    const chartData: ChartData[] = [];

    for (let i = 6; i >= 0; i--) {
      const dateString = getMexicoDateDaysAgo(i);
      const dayName = dateString.split('-').slice(1).join('/');
      const dayData = await loadRealDailyData(dateString);

      chartData.push({
        name: dayName,
        sales: dayData?.pos?.total || 0,
        memberships: dayData?.memberships?.total || 0,
        layaways: dayData?.layaways?.total || 0,
        date: dateString
      });
    }

    return chartData;
  }, [loadRealDailyData]);

  // Load monthly data
  const loadMonthlyData = useCallback(async (): Promise<MonthlyData[]> => {
    const monthlyData: MonthlyData[] = [];

    for (let i = 5; i >= 0; i--) {
      const monthKey = getMexicoMonthKeyMonthsAgo(i);
      const monthName = formatMexicoMonthName(monthKey);

      try {
        const response = await fetch(`/api/cuts/monthly-data?month=${monthKey}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          if (data?.success) {
            monthlyData.push({
              month: monthKey,
              monthName: monthName,
              sales: data.pos?.total || 0,
              memberships: data.memberships?.total || 0,
              layaways: data.layaways?.total || 0,
              total: (data.pos?.total || 0) + (data.memberships?.total || 0) + (data.layaways?.total || 0)
            });
          }
        }
      } catch (error) {
        console.error(`Error loading month ${monthKey}:`, error);
      }
    }

    return monthlyData;
  }, []);

  // Load all dashboard data
  // Load user stats (memberships and gender)
  const loadUserStats = useCallback(async () => {
    try {
      setUserStatsLoading(true);
      const response = await fetch('/api/users/stats', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Error fetching user stats');
      }

      const data = await response.json();
      setUserStats(data);
    } catch (error) {
      console.error('Error loading user stats:', error);
      // Keep default values on error
    } finally {
      setUserStatsLoading(false);
    }
  }, []);

  // Load gym activity stats
  const loadGymActivityStats = useCallback(async () => {
    try {
      // Fetch today's gym visits from access logs
      const accessResponse = await fetch('/api/access-control/today-stats', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      // Fetch membership stats
      const membershipResponse = await fetch('/api/user-memberships/stats', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      let todayVisits = 0;
      let activeMembershipsToday = 0;
      let expiringIn7Days = 0;
      let newMembershipsToday = 0;

      if (accessResponse.ok) {
        const accessData = await accessResponse.json();
        todayVisits = accessData.todayVisits || 0;
      }

      if (membershipResponse.ok) {
        const membershipData = await membershipResponse.json();
        activeMembershipsToday = membershipData.activeToday || 0;
        expiringIn7Days = membershipData.expiringIn7Days || 0;
        newMembershipsToday = membershipData.newToday || 0;
      }

      setGymActivityStats({
        todayVisits,
        activeMembershipsToday,
        expiringIn7Days,
        newMembershipsToday,
      });
    } catch (error) {
      console.error('Error loading gym activity stats:', error);
      // Keep default values on error
    }
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setError(null);
      const todayData = await loadRealDailyData(selectedDate);
      const weeklyData = await loadWeeklyRealData();
      const monthlyData = await loadMonthlyData();

      // Calculate totals
      const todaySales = todayData?.pos?.total || 0;
      const todayTransactions = todayData?.pos?.transactions || 0;
      const todayMemberships = todayData?.memberships?.count || 0;
      const todayMembershipsAmount = todayData?.memberships?.total || 0;
      const todayExpenses = todayData?.expenses?.total || 0;
      const todayBalance = todaySales + todayMembershipsAmount - todayExpenses;

      // Get current month data
      const currentMonthData = monthlyData.find(m => m.month === selectedDate.substring(0, 7));
      const monthSales = currentMonthData?.sales || 0;
      const monthMemberships = currentMonthData?.memberships || 0;
      const monthLayaways = currentMonthData?.layaways || 0;
      const monthTotalIncome = monthSales + monthMemberships + monthLayaways;
      const monthExpenses = 0; // TODO: Implement month expenses if needed
      const monthBalance = monthTotalIncome - monthExpenses;
      const monthTransactions = 0; // Will be calculated if needed

      setStats({
        todaySales,
        todayTransactions,
        todayMemberships,
        todayMembershipsAmount,
        monthSales,
        monthTransactions,
        monthMemberships: 0, // TODO: Get count from API if needed
        monthMembershipsAmount: monthMemberships,
        monthExpenses,
        monthBalance,
        todayExpenses,
        todayBalance,
        cashFlow: { efectivo: 0, transferencia: 0, debito: 0, credito: 0 },
        chartData: weeklyData,
        monthlyData,
      });

      setLastUpdate(formatMexicoTime(new Date(), {
        hour: '2-digit',
        minute: '2-digit'
      }));
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError('Error cargando dashboard. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate, loadRealDailyData, loadWeeklyRealData, loadMonthlyData]);

  // Initial load
  useEffect(() => {
    if (hydrated) {
      loadDashboardData();
      loadUserStats(); // Load user statistics
      loadGymActivityStats(); // Load gym activity statistics
    }
  }, [hydrated, loadDashboardData, loadUserStats, loadGymActivityStats]);

  // Manual refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadDashboardData(),
      loadUserStats(),
      loadGymActivityStats()
    ]);
    setRefreshing(false);
  }, [loadDashboardData, loadUserStats, loadGymActivityStats]);

  // Loading state
  if (!hydrated || loading) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
        gap: 2,
        p: 3
      }}>
        <CircularProgress size={60} sx={{ color: colorTokens.brand }} />
        <Typography variant="h6" sx={{ color: colorTokens.textSecondary }}>
          Cargando Dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      p: { xs: 2, sm: 2.5, md: 3 },
      background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
      minHeight: '100vh',
      maxWidth: '100%',
      overflowX: 'hidden'
    }}>
      {/* HEADER */}
      <Box sx={{
        mb: { xs: 2, sm: 3, md: 4 },
        pb: { xs: 2, sm: 2.5, md: 3 },
        borderBottom: `2px solid ${colorTokens.neutral400}`
      }}>
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2
        }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h4"
              sx={{
                color: colorTokens.textPrimary,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 1, sm: 1.5, md: 2 },
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
                mb: 1
              }}
            >
              <AssessmentIcon sx={{ fontSize: { xs: 32, sm: 38, md: 44 }, color: colorTokens.brand }} />
              Dashboard MUP
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: colorTokens.neutral900,
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              {formatDateLong(selectedDate)} • {currentMexicoTime}
            </Typography>
          </Box>

          <Box sx={{
            display: 'flex',
            gap: { xs: 1, sm: 1.5 },
            alignItems: 'center',
            flexWrap: 'wrap',
            width: { xs: '100%', md: 'auto' }
          }}>
            {lastUpdate && (
              <Chip
                label={`Actualizado: ${lastUpdate}`}
                size="small"
                sx={{
                  bgcolor: `${colorTokens.success}15`,
                  color: colorTokens.success,
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  fontWeight: 600
                }}
              />
            )}
            <Button
              variant="contained"
              startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{
                bgcolor: colorTokens.brand,
                color: 'black',
                fontWeight: 600,
                px: { xs: 2, sm: 3 },
                py: { xs: 0.75, sm: 1 },
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                '&:hover': {
                  bgcolor: `${colorTokens.brand}DD`
                },
                '&:disabled': {
                  bgcolor: colorTokens.neutral400
                }
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Actualizar</Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Refrescar</Box>
            </Button>
          </Box>
        </Box>
      </Box>

      {/* ERROR ALERT */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* METRICS CARDS */}
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        {/* Daily Metrics */}
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <DashboardMetricsCard
            title="Ventas del Día"
            value={formatPrice(stats.todaySales)}
            subtitle={`${stats.todayTransactions} transacciones`}
            icon={<MoneyIcon />}
            color={colorTokens.brand}
            loading={loading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <DashboardMetricsCard
            title="Membresías del Día"
            value={stats.todayMemberships}
            subtitle={formatPrice(stats.todayMembershipsAmount)}
            icon={<PeopleIcon />}
            color={colorTokens.success}
            loading={loading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <DashboardMetricsCard
            title="Balance del Día"
            value={formatPrice(stats.todayBalance)}
            subtitle={`Gastos: ${formatPrice(stats.todayExpenses)}`}
            icon={<ReceiptIcon />}
            color={stats.todayBalance >= 0 ? colorTokens.success : colorTokens.danger}
            loading={loading}
          />
        </Grid>

        {/* Monthly Metrics */}
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <DashboardMetricsCard
            title="Ventas del Mes"
            value={formatPrice(stats.monthSales)}
            subtitle={`POS y productos`}
            icon={<SalesIcon />}
            color={colorTokens.info}
            loading={loading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <DashboardMetricsCard
            title="Membresías del Mes"
            value={formatPrice(stats.monthMembershipsAmount)}
            subtitle={`Ingresos por membresías`}
            icon={<PeopleIcon />}
            color="#8B5CF6"
            loading={loading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <DashboardMetricsCard
            title="Balance del Mes"
            value={formatPrice(stats.monthBalance)}
            subtitle={`Total: ${formatPrice(stats.monthSales + stats.monthMembershipsAmount)}`}
            icon={<TrendingUpIcon />}
            color={stats.monthBalance >= 0 ? colorTokens.success : colorTokens.danger}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* GYM ACTIVITY METRICS - NEW RELEVANT CARDS */}
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <DashboardMetricsCard
            title="Visitas de Hoy"
            value={gymActivityStats.todayVisits}
            subtitle="Entradas al gimnasio"
            icon={<DirectionsRunIcon />}
            color={colorTokens.info}
            loading={loading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <DashboardMetricsCard
            title="Membresías Activas"
            value={gymActivityStats.activeMembershipsToday}
            subtitle="Vigentes hoy"
            icon={<CardMembershipIcon />}
            color={colorTokens.success}
            loading={loading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <DashboardMetricsCard
            title="Por Vencer"
            value={gymActivityStats.expiringIn7Days}
            subtitle="Próximos 7 días"
            icon={<WarningIcon />}
            color={colorTokens.warning}
            loading={loading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <DashboardMetricsCard
            title="Nuevas Membresías Hoy"
            value={gymActivityStats.newMembershipsToday}
            subtitle="Registradas hoy"
            icon={<FitnessCenterIcon />}
            color={colorTokens.brand}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* MONTH COMPARISON SECTION */}
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
        <Grid size={{ xs: 12 }}>
          <MonthComparisonChart
            data={{
              currentMonth: {
                name: stats.monthlyData[stats.monthlyData.length - 1]?.monthName || 'Mes Actual',
                total: stats.monthlyData[stats.monthlyData.length - 1]?.total || 0,
                sales: stats.monthlyData[stats.monthlyData.length - 1]?.sales || 0,
                memberships: stats.monthlyData[stats.monthlyData.length - 1]?.memberships || 0
              },
              previousMonth: {
                name: stats.monthlyData[stats.monthlyData.length - 2]?.monthName || 'Mes Anterior',
                total: stats.monthlyData[stats.monthlyData.length - 2]?.total || 0,
                sales: stats.monthlyData[stats.monthlyData.length - 2]?.sales || 0,
                memberships: stats.monthlyData[stats.monthlyData.length - 2]?.memberships || 0
              }
            }}
            loading={loading}
            height={350}
          />
        </Grid>
      </Grid>

      {/* CHARTS SECTION */}
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
        {/* Sales Trend Chart */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <SalesLineChart
            data={stats.chartData}
            loading={loading}
            title="Tendencia de Ventas - Últimos 7 Días"
            height={420}
          />
        </Grid>

        {/* Payment Methods Chart */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <PaymentMethodsPieChart
            data={stats.cashFlow}
            loading={loading}
            title="Métodos de Pago"
            height={420}
          />
        </Grid>

        {/* Monthly Revenue Chart */}
        <Grid size={{ xs: 12 }}>
          <RevenueBarChart
            data={stats.monthlyData}
            loading={loading}
            title="Ingresos Mensuales - Últimos 6 Meses"
            height={450}
          />
        </Grid>

        {/* NEW: Membership Status Chart - Keep this one as it's more relevant */}
        <Grid size={{ xs: 12 }}>
          <MembershipStatusChart
            data={userStats.memberships}
            loading={userStatsLoading}
            title="Estado de Membresías"
            height={420}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
