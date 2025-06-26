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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  PeopleOutlined as PeopleIcon,
  FitnessCenterOutlined as FitnessCenterIcon,
  AttachMoneyOutlined as MoneyIcon,
  TrendingUpOutlined as TrendingUpIcon,
  TrendingDownOutlined as TrendingDownIcon,
  ShoppingCartOutlined as SalesIcon,
  BookmarkBorderOutlined as LayawayIcon,
  RefreshOutlined as RefreshIcon,
  ScheduleOutlined as ScheduleIcon,
  AssessmentOutlined as AssessmentIcon,
  PersonAddOutlined as PersonAddIcon,
  ReceiptOutlined as ReceiptIcon,
  AnalyticsOutlined as AnalyticsIcon,
  CreditCardOutlined as PaymentIcon,
  InsightsOutlined as InsightsIcon,
  BarChartOutlined as BarChartIcon,
  TimelineOutlined as TimelineIcon,
  PieChartOutlined as PieChartIcon,
  AccountBalanceOutlined as AccountBalanceIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// 📊 RECHARTS
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

// 🎨 PROFESSIONAL DARK THEME - POWER BI STYLE
const professionalTokens = {
  // Backgrounds
  background: '#000000',
  surface: '#111111',
  surfaceElevated: '#1A1A1A',
  surfaceSecondary: '#262626',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textTertiary: '#999999',
  textDisabled: '#666666',
  
  // Brand Colors
  primary: '#FFCC00',
  primaryHover: '#E6B800',
  primaryDark: '#B8860B',
  
  // Status Colors
  success: '#00C853',
  error: '#FF5252',
  warning: '#FF9800',
  info: '#2196F3',
  
  // Chart Colors
  chart: {
    primary: '#FFCC00',
    secondary: '#00C853',
    tertiary: '#2196F3',
    quaternary: '#FF9800',
    quinary: '#9C27B0',
    senary: '#FF5252'
  },
  
  // Borders & Dividers
  border: '#333333',
  borderLight: '#404040',
  divider: '#2A2A2A'
};

// ✅ UTILITY FUNCTIONS
function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
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
    hour12: false
  });
}

function formatDateLocal(dateString: string): string {
  try {
    const date = new Date(dateString + 'T12:00:00');
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Mexico_City'
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

// ✅ INTERFACES
interface DailyData {
  date: string;
  pos: {
    efectivo: number;
    transferencia: number;
    debito: number;
    credito: number;
    total: number;
    transactions: number;
  };
  abonos: {
    efectivo: number;
    transferencia: number;
    debito: number;
    credito: number;
    total: number;
    transactions: number;
  };
  memberships: {
    efectivo: number;
    transferencia: number;
    debito: number;
    credito: number;
    total: number;
    transactions: number;
  };
  totals: {
    efectivo: number;
    transferencia: number;
    debito: number;
    credito: number;
    total: number;
    transactions: number;
  };
}

interface DashboardStats {
  totalUsers: number;
  clientUsers: number;
  newUsersToday: number;
  activeMemberships: number;
  expiringMemberships: number;
  todaySales: number;
  todayTransactions: number;
  todayAvgTicket: number;
  activeLayaways: number;
  layawaysPendingAmount: number;
  todayBalance: number;
  cashFlow: {
    efectivo: number;
    transferencia: number;
    debito: number;
    credito: number;
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
    activeMemberships: 0,
    expiringMemberships: 0,
    todaySales: 0,
    todayTransactions: 0,
    todayAvgTicket: 0,
    activeLayaways: 0,
    layawaysPendingAmount: 0,
    todayBalance: 0,
    cashFlow: { efectivo: 0, transferencia: 0, debito: 0, credito: 0 },
    chartData: [],
    pieData: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentMexicoTime, setCurrentMexicoTime] = useState<string>('');
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  
  const supabase = createBrowserSupabaseClient();

  const [selectedDate] = useState(() => getMexicoDateLocal());

  // ⏰ RELOJ EN TIEMPO REAL
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

  // 🔄 CARGAR DATOS REALES
  const loadRealDailyData = useCallback(async (targetDate: string): Promise<DailyData | null> => {
    try {
      const response = await fetch(`/api/cuts/daily-data?date=${targetDate}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.totals && data.totals.total > 0) {
          return data;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }, []);

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

  const loadDashboardStats = useCallback(async () => {
    try {
      setError(null);

      // Cargar datos del día actual
      const dailyDataResult = await loadRealDailyData(selectedDate);
      const realChartData = await loadWeeklyRealData();

      const today = new Date();
      const in7Days = new Date(today);
      in7Days.setDate(today.getDate() + 7);
      const in7DaysString = `${in7Days.getFullYear()}-${(in7Days.getMonth() + 1).toString().padStart(2, '0')}-${in7Days.getDate().toString().padStart(2, '0')}`;

      // Cargar usuarios
      const { data: allUsers } = await supabase
        .from('Users')
        .select('id, rol, createdAt');

      const clientUsers = allUsers?.filter(u => u.rol === 'cliente') || [];
      const newUsersToday = allUsers?.filter(u => {
        if (!u.createdAt) return false;
        const createdDate = u.createdAt.split('T')[0];
        return createdDate === selectedDate;
      }) || [];

      // Cargar membresías
      const { data: memberships } = await supabase
        .from('user_memberships')
        .select('*');

      const active = memberships?.filter(m => m.status === 'active') || [];
      const expiring = memberships?.filter(m => {
        if (!m.end_date || m.status !== 'active') return false;
        const endDate = m.end_date.split('T')[0];
        return endDate <= in7DaysString && endDate >= selectedDate;
      }) || [];

      // Cargar apartados
      const { data: layaways } = await supabase
        .from('sales')
        .select('*')
        .eq('sale_type', 'layaway');

      const activeLayaways = layaways?.filter(l => 
        l.status === 'pending' && 
        l.layaway_expires_at && 
        new Date(l.layaway_expires_at) >= new Date()
      ) || [];

      const pendingAmount = layaways?.reduce((sum, l) => sum + (l.pending_amount || 0), 0) || 0;

      // Datos para gráfico de pie
      const pieData: PieData[] = [];
      if (dailyDataResult && dailyDataResult.totals.total > 0) {
        if (dailyDataResult.totals.efectivo > 0) {
          pieData.push({
            name: 'Efectivo',
            value: dailyDataResult.totals.efectivo,
            color: professionalTokens.chart.primary
          });
        }
        if (dailyDataResult.totals.transferencia > 0) {
          pieData.push({
            name: 'Transferencia',
            value: dailyDataResult.totals.transferencia,
            color: professionalTokens.chart.secondary
          });
        }
        if (dailyDataResult.totals.debito > 0) {
          pieData.push({
            name: 'Débito',
            value: dailyDataResult.totals.debito,
            color: professionalTokens.chart.tertiary
          });
        }
        if (dailyDataResult.totals.credito > 0) {
          pieData.push({
            name: 'Crédito',
            value: dailyDataResult.totals.credito,
            color: professionalTokens.chart.quaternary
          });
        }
      }

      const finalStats: DashboardStats = {
        totalUsers: allUsers?.length || 0,
        clientUsers: clientUsers.length,
        newUsersToday: newUsersToday.length,
        activeMemberships: active.length,
        expiringMemberships: expiring.length,
        todaySales: dailyDataResult?.pos?.total || 0,
        todayTransactions: dailyDataResult?.pos?.transactions || 0,
        todayAvgTicket: dailyDataResult?.pos?.transactions > 0 ? (dailyDataResult.pos.total / dailyDataResult.pos.transactions) : 0,
        activeLayaways: activeLayaways.length,
        layawaysPendingAmount: pendingAmount,
        cashFlow: {
          efectivo: dailyDataResult?.totals?.efectivo || 0,
          transferencia: dailyDataResult?.totals?.transferencia || 0,
          debito: dailyDataResult?.totals?.debito || 0,
          credito: dailyDataResult?.totals?.credito || 0
        },
        todayBalance: dailyDataResult?.totals?.total || 0,
        chartData: realChartData,
        pieData
      };

      setStats(finalStats);
      setDailyData(dailyDataResult);

    } catch (err: any) {
      setError(`Error cargando estadísticas: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate, loadRealDailyData, loadWeeklyRealData, supabase]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardStats();
  }, [loadDashboardStats]);

  useEffect(() => {
    loadDashboardStats();
  }, [loadDashboardStats]);

  // 🎯 METRIC CARD COMPONENT
  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon, 
    trend,
    onClick
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    onClick?: () => void;
  }) => (
    <Card sx={{
      background: professionalTokens.surface,
      border: `1px solid ${professionalTokens.border}`,
      borderRadius: '12px',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.2s ease',
      '&:hover': onClick ? {
        borderColor: professionalTokens.primary,
        transform: 'translateY(-2px)'
      } : {}
    }}
    onClick={onClick}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="caption" sx={{ 
            color: professionalTokens.textTertiary,
            textTransform: 'uppercase',
            fontWeight: 600,
            letterSpacing: '0.5px',
            fontSize: '11px'
          }}>
            {title}
          </Typography>
          <Box sx={{ 
            p: 1, 
            borderRadius: '8px', 
            bgcolor: `${professionalTokens.primary}15`,
            color: professionalTokens.primary 
          }}>
            {React.cloneElement(icon as React.ReactElement, { sx: { fontSize: 20 } })}
          </Box>
        </Box>
        
        <Typography variant="h3" sx={{ 
          fontWeight: 700, 
          mb: 1,
          color: professionalTokens.textPrimary,
          fontFamily: "'Inter', -apple-system, sans-serif"
        }}>
          {value}
        </Typography>
        
        {subtitle && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {trend === 'up' && <TrendingUpIcon sx={{ color: professionalTokens.success, fontSize: 16 }} />}
            {trend === 'down' && <TrendingDownIcon sx={{ color: professionalTokens.error, fontSize: 16 }} />}
            <Typography variant="body2" sx={{ 
              color: trend === 'up' ? professionalTokens.success : 
                     trend === 'down' ? professionalTokens.error : 
                     professionalTokens.textSecondary,
              fontSize: '12px'
            }}>
              {subtitle}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: professionalTokens.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress 
            size={60} 
            sx={{ color: professionalTokens.primary, mb: 3 }} 
          />
          <Typography variant="h6" sx={{ color: professionalTokens.textSecondary }}>
            Cargando Dashboard MUP
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: professionalTokens.background,
      color: professionalTokens.textPrimary
    }}>
      {/* ERROR SNACKBAR */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setError(null)} 
          severity="error" 
          variant="filled"
          sx={{ borderRadius: '8px' }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* HEADER */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 4,
        borderBottom: `1px solid ${professionalTokens.border}`,
        background: professionalTokens.surface
      }}>
        <Box>
          <Typography variant="h4" sx={{ 
            fontWeight: 700,
            color: professionalTokens.textPrimary,
            mb: 0.5,
            fontFamily: "'Inter', -apple-system, sans-serif"
          }}>
            Dashboard MUP
          </Typography>
          <Typography variant="body2" sx={{ 
            color: professionalTokens.textSecondary,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <ScheduleIcon sx={{ fontSize: 16 }} />
            {formatDateLocal(selectedDate)} • {currentMexicoTime} hrs
          </Typography>
        </Box>
        
        <Button
          startIcon={refreshing ? <CircularProgress size={20} sx={{ color: professionalTokens.background }} /> : <RefreshIcon />}
          onClick={handleRefresh}
          disabled={refreshing}
          variant="contained"
          sx={{ 
            bgcolor: professionalTokens.primary,
            color: professionalTokens.background,
            fontWeight: 600,
            borderRadius: '8px',
            textTransform: 'none',
            '&:hover': {
              bgcolor: professionalTokens.primaryHover
            }
          }}
        >
          {refreshing ? 'Actualizando' : 'Actualizar'}
        </Button>
      </Box>

      <Box sx={{ p: 4 }}>
        {/* RESUMEN EJECUTIVO */}
        <Card sx={{
          background: professionalTokens.surfaceElevated,
          border: `1px solid ${professionalTokens.border}`,
          borderRadius: '12px',
          mb: 4
        }}>
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={4}>
              <Grid xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h2" sx={{ 
                    color: professionalTokens.primary, 
                    fontWeight: 800,
                    mb: 1
                  }}>
                    {stats.clientUsers}
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    color: professionalTokens.textSecondary,
                    fontWeight: 500
                  }}>
                    Clientes Activos
                  </Typography>
                </Box>
              </Grid>
              
              <Grid xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h2" sx={{ 
                    color: professionalTokens.success, 
                    fontWeight: 800,
                    mb: 1
                  }}>
                    {stats.activeMemberships}
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    color: professionalTokens.textSecondary,
                    fontWeight: 500
                  }}>
                    Membresías Activas
                  </Typography>
                </Box>
              </Grid>
              
              <Grid xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h2" sx={{ 
                    color: professionalTokens.info, 
                    fontWeight: 800,
                    mb: 1
                  }}>
                    {formatPrice(stats.todayBalance)}
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    color: professionalTokens.textSecondary,
                    fontWeight: 500
                  }}>
                    Ingresos del Día
                  </Typography>
                </Box>
              </Grid>
              
              <Grid xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h2" sx={{ 
                    color: professionalTokens.warning, 
                    fontWeight: 800,
                    mb: 1
                  }}>
                    {stats.todayTransactions}
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    color: professionalTokens.textSecondary,
                    fontWeight: 500
                  }}>
                    Transacciones
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* MÉTRICAS PRINCIPALES */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid xs={12} sm={6} lg={3}>
            <MetricCard
              title="Total Usuarios"
              value={stats.totalUsers}
              subtitle={`+${stats.newUsersToday} nuevos hoy`}
              icon={<PeopleIcon />}
              trend={stats.newUsersToday > 0 ? 'up' : 'neutral'}
              onClick={() => router.push('/dashboard/admin/usuarios')}
            />
          </Grid>

          <Grid xs={12} sm={6} lg={3}>
            <MetricCard
              title="Membresías"
              value={stats.activeMemberships}
              subtitle={`${stats.expiringMemberships} por vencer`}
              icon={<FitnessCenterIcon />}
              trend={stats.expiringMemberships > 0 ? 'down' : 'neutral'}
              onClick={() => router.push('/dashboard/admin/membresias')}
            />
          </Grid>

          <Grid xs={12} sm={6} lg={3}>
            <MetricCard
              title="Ventas Hoy"
              value={formatPrice(stats.todaySales)}
              subtitle={`${stats.todayTransactions} transacciones`}
              icon={<SalesIcon />}
              trend={stats.todaySales > 0 ? 'up' : 'neutral'}
              onClick={() => router.push('/dashboard/admin/sales/history')}
            />
          </Grid>

          <Grid xs={12} sm={6} lg={3}>
            <MetricCard
              title="Apartados"
              value={stats.activeLayaways}
              subtitle={`${formatPrice(stats.layawaysPendingAmount)} pendiente`}
              icon={<LayawayIcon />}
              trend={stats.activeLayaways > 0 ? 'up' : 'neutral'}
              onClick={() => router.push('/dashboard/admin/layaways/management')}
            />
          </Grid>
        </Grid>

        {/* GRÁFICOS */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* TENDENCIAS */}
          <Grid xs={12} lg={8}>
            <Card sx={{
              background: professionalTokens.surface,
              border: `1px solid ${professionalTokens.border}`,
              borderRadius: '12px',
              height: '400px'
            }}>
              <CardContent sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <TimelineIcon sx={{ color: professionalTokens.primary }} />
                  <Typography variant="h6" sx={{ 
                    color: professionalTokens.textPrimary,
                    fontWeight: 600
                  }}>
                    Tendencias (7 días)
                  </Typography>
                </Box>
                
                <Box sx={{ height: 300 }}>
                  {stats.chartData.some(d => d.sales > 0 || d.memberships > 0 || d.layaways > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={stats.chartData}>
                        <CartesianGrid 
                          strokeDasharray="1 1" 
                          stroke={professionalTokens.border}
                          horizontal={true}
                          vertical={false}
                        />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: professionalTokens.textTertiary }}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: professionalTokens.textTertiary }}
                          tickFormatter={(value) => formatPrice(value)}
                        />
                        <RechartsTooltip 
                          contentStyle={{
                            backgroundColor: professionalTokens.surfaceElevated,
                            border: `1px solid ${professionalTokens.border}`,
                            borderRadius: '8px',
                            color: professionalTokens.textPrimary,
                            fontSize: '12px'
                          }}
                          formatter={(value: any, name: string) => [
                            formatPrice(value), 
                            name === 'sales' ? 'Ventas' : 
                            name === 'memberships' ? 'Membresías' : 'Apartados'
                          ]}
                        />
                        
                        <Area
                          type="monotone"
                          dataKey="sales"
                          fill={`${professionalTokens.chart.primary}20`}
                          stroke={professionalTokens.chart.primary}
                          strokeWidth={2}
                          name="sales"
                        />
                        
                        <Bar
                          dataKey="memberships"
                          fill={professionalTokens.chart.secondary}
                          name="memberships"
                          radius={[2, 2, 0, 0]}
                        />
                        
                        <Line
                          type="monotone"
                          dataKey="layaways"
                          stroke={professionalTokens.chart.tertiary}
                          strokeWidth={2}
                          dot={{ fill: professionalTokens.chart.tertiary, strokeWidth: 0, r: 4 }}
                          name="layaways"
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
                      <TimelineIcon sx={{ fontSize: 48, color: professionalTokens.textDisabled }} />
                      <Typography variant="body1" sx={{ color: professionalTokens.textSecondary }}>
                        Sin datos disponibles
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* MÉTODOS DE PAGO */}
          <Grid xs={12} lg={4}>
            <Card sx={{
              background: professionalTokens.surface,
              border: `1px solid ${professionalTokens.border}`,
              borderRadius: '12px',
              height: '400px'
            }}>
              <CardContent sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <PieChartIcon sx={{ color: professionalTokens.info }} />
                  <Typography variant="h6" sx={{ 
                    color: professionalTokens.textPrimary,
                    fontWeight: 600
                  }}>
                    Métodos de Pago
                  </Typography>
                </Box>
                
                {stats.pieData.length > 0 ? (
                  <Box sx={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.pieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={40}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {stats.pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{
                            backgroundColor: professionalTokens.surfaceElevated,
                            border: `1px solid ${professionalTokens.border}`,
                            borderRadius: '8px',
                            color: professionalTokens.textPrimary,
                            fontSize: '12px'
                          }}
                          formatter={(value: any) => formatPrice(value)}
                        />
                        <Legend 
                          wrapperStyle={{ 
                            color: professionalTokens.textSecondary,
                            fontSize: '12px'
                          }}
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
                    <PaymentIcon sx={{ fontSize: 48, color: professionalTokens.textDisabled }} />
                    <Typography variant="body1" sx={{ color: professionalTokens.textSecondary }}>
                      Sin pagos registrados
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* FLUJO DE EFECTIVO */}
        <Card sx={{
          background: professionalTokens.surface,
          border: `1px solid ${professionalTokens.border}`,
          borderRadius: '12px',
          mb: 4
        }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ 
              color: professionalTokens.textPrimary,
              fontWeight: 600,
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <PaymentIcon />
              Flujo de Efectivo del Día
            </Typography>
            
            <Grid container spacing={3}>
              <Grid xs={6} md={3}>
                <Paper sx={{
                  p: 3,
                  textAlign: 'center',
                  background: professionalTokens.surfaceElevated,
                  border: `1px solid ${professionalTokens.border}`,
                  borderRadius: '8px'
                }}>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 700, 
                    mb: 1,
                    color: professionalTokens.primary
                  }}>
                    {formatPrice(stats.cashFlow.efectivo)}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: professionalTokens.textSecondary,
                    fontWeight: 500
                  }}>
                    Efectivo
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid xs={6} md={3}>
                <Paper sx={{
                  p: 3,
                  textAlign: 'center',
                  background: professionalTokens.surfaceElevated,
                  border: `1px solid ${professionalTokens.border}`,
                  borderRadius: '8px'
                }}>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 700, 
                    mb: 1,
                    color: professionalTokens.info
                  }}>
                    {formatPrice(stats.cashFlow.transferencia)}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: professionalTokens.textSecondary,
                    fontWeight: 500
                  }}>
                    Transferencia
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid xs={6} md={3}>
                <Paper sx={{
                  p: 3,
                  textAlign: 'center',
                  background: professionalTokens.surfaceElevated,
                  border: `1px solid ${professionalTokens.border}`,
                  borderRadius: '8px'
                }}>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 700, 
                    mb: 1,
                    color: professionalTokens.success
                  }}>
                    {formatPrice(stats.cashFlow.debito)}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: professionalTokens.textSecondary,
                    fontWeight: 500
                  }}>
                    Débito
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid xs={6} md={3}>
                <Paper sx={{
                  p: 3,
                  textAlign: 'center',
                  background: professionalTokens.surfaceElevated,
                  border: `1px solid ${professionalTokens.border}`,
                  borderRadius: '8px'
                }}>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 700, 
                    mb: 1,
                    color: professionalTokens.warning
                  }}>
                    {formatPrice(stats.cashFlow.credito)}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: professionalTokens.textSecondary,
                    fontWeight: 500
                  }}>
                    Crédito
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* ACCIONES RÁPIDAS */}
        <Card sx={{
          background: professionalTokens.surface,
          border: `1px solid ${professionalTokens.border}`,
          borderRadius: '12px'
        }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ 
              color: professionalTokens.textPrimary,
              fontWeight: 600,
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <InsightsIcon />
              Acciones Rápidas
            </Typography>
            
            <Grid container spacing={3}>
              <Grid xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<PersonAddIcon />}
                  onClick={() => router.push('/dashboard/admin/membresias/registrar')}
                  sx={{
                    bgcolor: professionalTokens.primary,
                    color: professionalTokens.background,
                    py: 2,
                    borderRadius: '8px',
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': {
                      bgcolor: professionalTokens.primaryHover
                    }
                  }}
                >
                  Nueva Venta
                </Button>
              </Grid>
              
              <Grid xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<ReceiptIcon />}
                  onClick={() => router.push('/dashboard/admin/cortes')}
                  sx={{
                    borderColor: professionalTokens.border,
                    color: professionalTokens.textPrimary,
                    py: 2,
                    borderRadius: '8px',
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: professionalTokens.primary,
                      bgcolor: `${professionalTokens.primary}10`
                    }
                  }}
                >
                  Corte de Caja
                </Button>
              </Grid>
              
              <Grid xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<AnalyticsIcon />}
                  onClick={() => router.push('/dashboard/admin/reportes')}
                  sx={{
                    borderColor: professionalTokens.border,
                    color: professionalTokens.textPrimary,
                    py: 2,
                    borderRadius: '8px',
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: professionalTokens.primary,
                      bgcolor: `${professionalTokens.primary}10`
                    }
                  }}
                >
                  Reportes
                </Button>
              </Grid>
              
              <Grid xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<FitnessCenterIcon />}
                  onClick={() => router.push('/dashboard/admin/planes')}
                  sx={{
                    borderColor: professionalTokens.border,
                    color: professionalTokens.textPrimary,
                    py: 2,
                    borderRadius: '8px',
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: professionalTokens.primary,
                      bgcolor: `${professionalTokens.primary}10`
                    }
                  }}
                >
                  Gestionar Planes
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
