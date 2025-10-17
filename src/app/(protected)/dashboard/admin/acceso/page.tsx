'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Avatar,
  Stack,
  IconButton,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  History as HistoryIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  AdminPanelSettings as AdminIcon,
  Groups as GroupsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CalendarToday as CalendarIcon,
  AccessTime as AccessTimeIcon,
  FilterList as FilterListIcon,
  EmojiEvents as TrophyIcon,
  Whatshot as FireIcon,
  People as PeopleIcon,
  Close as CloseIcon,
  Timeline as TimelineIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { ChartsReferenceLine } from '@mui/x-charts/ChartsReferenceLine';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es-mx';
import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { useNotifications } from '@/hooks/useNotifications';
import {
  formatTimestampForDisplay,
  formatTimestampDateOnly,
  formatDateForDisplay,
  formatMexicoTime,
  getTodayInMexico,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  daysBetween
} from '@/utils/dateUtils';
import { getHoliday, getHolidayColor } from '@/utils/holidays';

interface AccessLog {
  id: string;
  user_id: string;
  device_id: string | null;
  access_type: string;
  access_method: string;
  device_verify_mode: number | null;
  success: boolean;
  denial_reason: string | null;
  membership_status: string | null;
  device_timestamp: string | null;
  created_at: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    rol: string;
    profilePictureUrl: string | null;
    user_memberships?: Array<{
      id: string;
      status: string;
      start_date: string;
      end_date: string;
      remaining_visits: number;
      membership_plans: {
        id: string;
        name: string;
      };
    }>;
    employees?: Array<{
      id: string;
      position: string;
      department: string;
    }>;
  };
  device: {
    id: string;
    name: string;
    device_type: string;
  } | null;
}

interface Stats {
  total: number;
  successful: number;
  failed: number;
  byType: Record<string, number>;
}

interface Analytics {
  topUsers: Array<{
    userId: string;
    count: number;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      rol: string;
      profilePictureUrl: string | null;
    };
  }>;
  peakHours: Array<{
    hour: number;
    count: number;
  }>;
  averageAccessesPerHour: number;
  comparison: {
    today: number;
    yesterday: number;
    difference: number;
    percentageChange: number;
  };
  currentCapacity: number;
}

type TimeRange = 'today' | 'week' | 'month' | 'custom';
type UserTypeFilter = 'all' | 'cliente' | 'empleado' | 'admin';

export default function HistorialAsistenciasPage() {
  const hydrated = useHydrated();
  const { toast } = useNotifications();

  // Estados
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    successful: 0,
    failed: 0,
    byType: {}
  });
  const [analytics, setAnalytics] = useState<Analytics>({
    topUsers: [],
    peakHours: [],
    averageAccessesPerHour: 0,
    comparison: { today: 0, yesterday: 0, difference: 0, percentageChange: 0 },
    currentCapacity: 0
  });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userHistoryOpen, setUserHistoryOpen] = useState(false);

  // Filtros
  const [userTypeFilter, setUserTypeFilter] = useState<UserTypeFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [successFilter, setSuccessFilter] = useState<string>('all');
  const [hourRangeStart, setHourRangeStart] = useState<number | ''>('');
  const [hourRangeEnd, setHourRangeEnd] = useState<number | ''>('');

  // Cargar datos
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      console.log('📊 Fetching access logs...');

      // Calcular fechas según el rango seleccionado
      let start = '';
      let end = '';
      const today = getTodayInMexico();

      if (timeRange === 'today') {
        start = `${today}T00:00:00`;
        end = `${today}T23:59:59`;
      } else if (timeRange === 'week') {
        start = `${getStartOfWeek(new Date())}T00:00:00`;
        end = `${getEndOfWeek(new Date())}T23:59:59`;
      } else if (timeRange === 'month') {
        start = `${getStartOfMonth(new Date())}T00:00:00`;
        end = `${getEndOfMonth(new Date())}T23:59:59`;
      } else if (timeRange === 'custom') {
        start = startDate ? `${startDate.format('YYYY-MM-DD')}T00:00:00` : '';
        end = endDate ? `${endDate.format('YYYY-MM-DD')}T23:59:59` : '';
      }

      const params = new URLSearchParams({
        userType: userTypeFilter,
        page: page.toString(),
        limit: rowsPerPage.toString(),
        ...(start && { startDate: start }),
        ...(end && { endDate: end }),
        ...(successFilter !== 'all' && { success: successFilter })
      });

      const response = await fetch(`/api/access-logs?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar registros');
      }

      console.log('✅ Logs loaded:', data.logs.length);
      setLogs(data.logs);
      setStats(data.stats);
      setAnalytics(data.analytics || {
        topUsers: [],
        peakHours: [],
        averageAccessesPerHour: 0,
        comparison: { today: 0, yesterday: 0, difference: 0, percentageChange: 0 },
        currentCapacity: 0
      });
      setTotalCount(data.count);

    } catch (error: any) {
      console.error('❌ Error loading logs:', error);
      toast.error('Error al cargar registros de acceso');
    } finally {
      setLoading(false);
    }
  }, [userTypeFilter, page, rowsPerPage, timeRange, startDate, endDate, successFilter, toast]);

  // Cargar datos al montar y cuando cambian los filtros
  useEffect(() => {
    if (hydrated) {
      fetchLogs();
    }
  }, [hydrated, fetchLogs]);

  // Filtrar logs por término de búsqueda y rango de hora
  const filteredLogs = useMemo(() => {
    let filtered = logs;

    // Filtrar por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.user.firstName.toLowerCase().includes(term) ||
        log.user.lastName.toLowerCase().includes(term) ||
        log.user.email.toLowerCase().includes(term)
      );
    }

    // Filtrar por rango de hora (usando timezone de México)
    if (hourRangeStart !== '' && hourRangeEnd !== '') {
      filtered = filtered.filter(log => {
        const mexicoTime = new Date(log.created_at).toLocaleString('en-US', {
          timeZone: 'America/Mexico_City',
          hour: 'numeric',
          hour12: false
        });
        const hour = parseInt(mexicoTime.split(',')[0]);
        return hour >= hourRangeStart && hour <= hourRangeEnd;
      });
    }

    return filtered;
  }, [logs, searchTerm, hourRangeStart, hourRangeEnd]);

  // Datos para gráficos
  const chartData = useMemo(() => {
    // Agrupar por hora del día (usando timezone de México)
    const hourlyData = logs.reduce((acc: Record<number, number>, log) => {
      const mexicoTime = new Date(log.created_at).toLocaleString('en-US', {
        timeZone: 'America/Mexico_City',
        hour: 'numeric',
        hour12: false
      });
      const hour = parseInt(mexicoTime.split(',')[0]);
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const hourlyAccesses = hours.map(h => hourlyData[h] || 0);

    // Agrupar por día de la semana (últimos 7 días)
    const dailyData: Record<string, number> = {};
    logs.forEach(log => {
      const date = formatDateForDisplay(log.created_at);
      dailyData[date] = (dailyData[date] || 0) + 1;
    });

    return {
      hourly: {
        labels: hours,
        data: hourlyAccesses
      },
      daily: dailyData,
      byUserType: {
        cliente: logs.filter(l => l.user.rol === 'cliente').length,
        empleado: logs.filter(l => l.user.rol === 'empleado').length,
        admin: logs.filter(l => l.user.rol === 'admin').length
      }
    };
  }, [logs]);

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getRoleIcon = (rol: string) => {
    switch (rol) {
      case 'admin': return <AdminIcon />;
      case 'empleado': return <BadgeIcon />;
      default: return <PersonIcon />;
    }
  };

  const getRoleColor = (rol: string) => {
    switch (rol) {
      case 'admin': return colorTokens.danger;
      case 'empleado': return colorTokens.info;
      default: return colorTokens.brand;
    }
  };

  if (!hydrated) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <CircularProgress sx={{ color: colorTokens.brand }} />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es-mx">
      <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
      {/* Header */}
      <Paper sx={{
        p: { xs: 2, sm: 2.5, md: 3 },
        mb: { xs: 2, sm: 2.5, md: 3 },
        background: `linear-gradient(135deg, ${colorTokens.brand}15, ${colorTokens.info}10)`,
        borderRadius: 3,
        border: `1px solid ${colorTokens.border}`
      }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <HistoryIcon sx={{
              fontSize: { xs: 35, sm: 42, md: 48 },
              color: colorTokens.brand
            }} />
            <Box>
              <Typography variant="h4" sx={{
                fontWeight: 700,
                color: colorTokens.textPrimary,
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
              }}>
                Historial de Asistencias
              </Typography>
              <Typography variant="body2" sx={{
                color: colorTokens.textSecondary,
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}>
                Registro completo de accesos al gimnasio
              </Typography>
            </Box>
          </Box>

          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            disabled={loading}
            onClick={fetchLogs}
            sx={{
              borderColor: colorTokens.brand,
              color: colorTokens.brand,
              fontSize: { xs: '0.875rem', sm: '1rem' },
              '&:hover': {
                borderColor: colorTokens.brandHover,
                backgroundColor: `${colorTokens.brand}10`
              }
            }}
          >
            Actualizar
          </Button>
        </Box>
      </Paper>

      {/* Estadísticas */}
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mb: { xs: 2, sm: 2.5, md: 3 } }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{
            background: `linear-gradient(135deg, ${colorTokens.brand}15, ${colorTokens.brand}05)`,
            border: `1px solid ${colorTokens.brand}30`,
            borderRadius: 3
          }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                    Total Accesos
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: colorTokens.brand }}>
                    {stats.total}
                  </Typography>
                </Box>
                <GroupsIcon sx={{ fontSize: 48, color: colorTokens.brand, opacity: 0.3 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{
            background: `linear-gradient(135deg, ${colorTokens.success}15, ${colorTokens.success}05)`,
            border: `1px solid ${colorTokens.success}30`,
            borderRadius: 3
          }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                    Exitosos
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: colorTokens.success }}>
                    {stats.successful}
                  </Typography>
                  <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                    {stats.total > 0 ? ((stats.successful / stats.total) * 100).toFixed(1) : 0}%
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 48, color: colorTokens.success, opacity: 0.3 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{
            background: `linear-gradient(135deg, ${colorTokens.danger}15, ${colorTokens.danger}05)`,
            border: `1px solid ${colorTokens.danger}30`,
            borderRadius: 3
          }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                    Denegados
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: colorTokens.danger }}>
                    {stats.failed}
                  </Typography>
                  <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                    {stats.total > 0 ? ((stats.failed / stats.total) * 100).toFixed(1) : 0}%
                  </Typography>
                </Box>
                <CancelIcon sx={{ fontSize: 48, color: colorTokens.danger, opacity: 0.3 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{
            background: `linear-gradient(135deg, ${colorTokens.info}15, ${colorTokens.info}05)`,
            border: `1px solid ${colorTokens.info}30`,
            borderRadius: 3
          }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                    Tasa de Éxito
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: colorTokens.info }}>
                    {stats.total > 0 ? ((stats.successful / stats.total) * 100).toFixed(0) : 0}%
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 48, color: colorTokens.info, opacity: 0.3 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Nuevos Indicadores: Comparación y Capacidad */}
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mb: { xs: 2, sm: 2.5, md: 3 } }}>
        {/* Comparación Hoy vs Ayer */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{
            background: `linear-gradient(135deg, ${analytics.comparison.difference >= 0 ? colorTokens.success : colorTokens.danger}15, ${analytics.comparison.difference >= 0 ? colorTokens.success : colorTokens.danger}05)`,
            border: `1px solid ${analytics.comparison.difference >= 0 ? colorTokens.success : colorTokens.danger}30`,
            borderRadius: 3
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: colorTokens.textPrimary, fontWeight: 600 }}>
                📊 Comparación: Hoy vs Ayer
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 0.5 }}>
                      Hoy
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: colorTokens.brand }}>
                      {analytics.comparison.today}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 0.5 }}>
                      Ayer
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: colorTokens.textSecondary }}>
                      {analytics.comparison.yesterday}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {analytics.comparison.difference >= 0 ? (
                      <TrendingUpIcon sx={{ color: colorTokens.success }} />
                    ) : (
                      <TrendingDownIcon sx={{ color: colorTokens.danger }} />
                    )}
                    <Typography variant="h5" sx={{
                      fontWeight: 700,
                      color: analytics.comparison.difference >= 0 ? colorTokens.success : colorTokens.danger
                    }}>
                      {analytics.comparison.difference >= 0 ? '+' : ''}{analytics.comparison.difference}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                      ({analytics.comparison.percentageChange >= 0 ? '+' : ''}{analytics.comparison.percentageChange.toFixed(1)}%)
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Capacidad Actual */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{
            background: `linear-gradient(135deg, ${colorTokens.info}15, ${colorTokens.info}05)`,
            border: `1px solid ${colorTokens.info}30`,
            borderRadius: 3
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: colorTokens.textPrimary, fontWeight: 600 }}>
                👥 Capacidad Actual
              </Typography>
              <Stack direction="row" alignItems="center" spacing={2}>
                <PeopleIcon sx={{ fontSize: 60, color: colorTokens.info, opacity: 0.3 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h2" sx={{ fontWeight: 700, color: colorTokens.info }}>
                    {analytics.currentCapacity}
                  </Typography>
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                    Personas en gimnasio (últimos 30 min)
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((analytics.currentCapacity / 50) * 100, 100)}
                    sx={{
                      mt: 1,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: `${colorTokens.info}20`,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: colorTokens.info
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ color: colorTokens.textSecondary, mt: 0.5 }}>
                    Capacidad máxima recomendada: 50 personas
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráfico de Tendencia de Crecimiento */}
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mb: { xs: 2, sm: 2.5, md: 3 } }}>
        <Grid size={{ xs: 12 }}>
          <Paper sx={{
            p: { xs: 2, sm: 2.5, md: 3 },
            borderRadius: 3,
            border: `1px solid ${colorTokens.border}`
          }}>
            <Typography variant="h6" sx={{ mb: 2, color: colorTokens.textPrimary, fontWeight: 600 }}>
              📈 Tendencia de Asistencia (Últimos 7 Días)
            </Typography>
            {(() => {
              // Calcular los últimos 7 días (en zona horaria de México)
              const nowMexico = new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' });
              const todayMexico = new Date(nowMexico);

              const last7Days = Array.from({ length: 7 }, (_, i) => {
                const date = new Date(todayMexico);
                date.setDate(date.getDate() - (6 - i));
                // Usar toLocaleDateString con 'en-CA' para obtener formato YYYY-MM-DD en zona horaria de México
                const dateStr = date.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
                return {
                  date: dateStr,
                  label: date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'America/Mexico_City' }),
                  holiday: getHoliday(dateStr)
                };
              });

              // Contar accesos por día (convertir created_at a fecha de México)
              const dailyCounts = last7Days.map(day => {
                return logs.filter(log => {
                  // Convertir el timestamp a fecha en zona horaria de México
                  const logDateMexico = new Date(log.created_at).toLocaleDateString('en-CA', {
                    timeZone: 'America/Mexico_City'
                  });
                  return logDateMexico === day.date;
                }).length;
              });

              const hasData = dailyCounts.some(count => count > 0);
              const holidays = last7Days.filter(day => day.holiday);

              return (
                <Box>
                  {holidays.length > 0 && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Días festivos en este período:
                        </Typography>
                        {holidays.map(day => (
                          <Chip
                            key={day.date}
                            label={`${day.holiday!.emoji} ${day.holiday!.name}`}
                            size="small"
                            sx={{
                              backgroundColor: `${getHolidayColor(day.holiday!.type)}20`,
                              color: getHolidayColor(day.holiday!.type),
                              fontWeight: 600
                            }}
                          />
                        ))}
                      </Stack>
                    </Alert>
                  )}
                  {hasData ? (
                    <Box>
                      <LineChart
                        xAxis={[{
                          data: last7Days.map((_, i) => i),
                          scaleType: 'point',
                          valueFormatter: (value) => last7Days[value]?.label || ''
                        }]}
                        series={[{
                          data: dailyCounts,
                          label: 'Accesos',
                          color: colorTokens.brand,
                          area: true,
                          showMark: true
                        }]}
                        height={300}
                        margin={{ top: 30, right: 80, bottom: 60, left: 60 }}
                      >
                        <ChartsReferenceLine
                          y={Math.max(...dailyCounts)}
                          label={`Máx: ${Math.max(...dailyCounts)}`}
                          labelAlign="start"
                          lineStyle={{
                            stroke: '#d32f2f',
                            strokeDasharray: '5 5'
                          }}
                        />
                        {/* Líneas verticales para días festivos */}
                        {last7Days.map((day, index) => day.holiday && (
                          <ChartsReferenceLine
                            key={day.date}
                            x={index}
                            label={day.holiday.emoji}
                            labelAlign="start"
                            lineStyle={{
                              stroke: getHolidayColor(day.holiday.type),
                              strokeWidth: 2,
                              strokeDasharray: '3 3'
                            }}
                          />
                        ))}
                      </LineChart>
                      {/* Leyenda de días festivos debajo del gráfico */}
                      {holidays.length > 0 && (
                        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                          {last7Days.map((day, index) => day.holiday && (
                            <Tooltip key={day.date} title={day.holiday.name}>
                              <Box sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: getHolidayColor(day.holiday.type),
                                position: 'relative',
                                cursor: 'help'
                              }} />
                            </Tooltip>
                          ))}
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        No hay datos para mostrar
                      </Typography>
                    </Box>
                  )}
                </Box>
              );
            })()}
          </Paper>
        </Grid>
      </Grid>

      {/* Gráficos */}
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mb: { xs: 2, sm: 2.5, md: 3 } }}>
        {/* Gráfico de accesos por hora */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{
            p: { xs: 2, sm: 2.5, md: 3 },
            borderRadius: 3,
            border: `1px solid ${colorTokens.border}`,
            height: '100%'
          }}>
            <Typography variant="h6" sx={{ mb: 2, color: colorTokens.textPrimary, fontWeight: 600 }}>
              📊 Accesos por Hora del Día{(() => {
                if (startDate && endDate) {
                  // Mostrar rango personalizado
                  const start = startDate.locale('es-mx').format('D MMM');
                  const end = endDate.locale('es-mx').format('D MMM');
                  return ` (${start} - ${end})`;
                } else if (timeRange === 'today') {
                  const today = new Date().toLocaleDateString('es-MX', {
                    timeZone: 'America/Mexico_City',
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  });
                  return ` (${today})`;
                } else if (timeRange === 'week') {
                  return ' (Última Semana)';
                } else if (timeRange === 'month') {
                  return ' (Último Mes)';
                }
                return ' (Todos los Registros)';
              })()}
            </Typography>
            {chartData.hourly.data.some(v => v > 0) ? (
              <LineChart
                xAxis={[{
                  data: chartData.hourly.labels,
                  label: 'Hora',
                  scaleType: 'band'
                }]}
                series={[{
                  data: chartData.hourly.data,
                  label: 'Accesos',
                  color: colorTokens.brand,
                  area: true
                }]}
                height={300}
                margin={{ top: 30, right: 80, bottom: 30, left: 40 }}
              >
                <ChartsReferenceLine
                  y={Math.max(...chartData.hourly.data)}
                  label={`Pico: ${Math.max(...chartData.hourly.data)}`}
                  labelAlign="start"
                  lineStyle={{
                    stroke: '#d32f2f',
                    strokeDasharray: '5 5'
                  }}
                />
              </LineChart>
            ) : (
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No hay datos para mostrar
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Gráfico de distribución por tipo de usuario */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper sx={{
            p: { xs: 2, sm: 2.5, md: 3 },
            borderRadius: 3,
            border: `1px solid ${colorTokens.border}`,
            height: '100%'
          }}>
            <Typography variant="h6" sx={{ mb: 2, color: colorTokens.textPrimary, fontWeight: 600 }}>
              👥 Por Tipo de Usuario
            </Typography>
            {(chartData.byUserType.cliente + chartData.byUserType.empleado + chartData.byUserType.admin) > 0 ? (
              <PieChart
                series={[{
                  data: [
                    { id: 0, value: chartData.byUserType.cliente, label: 'Clientes', color: colorTokens.brand },
                    { id: 1, value: chartData.byUserType.empleado, label: 'Empleados', color: colorTokens.info },
                    { id: 2, value: chartData.byUserType.admin, label: 'Admins', color: colorTokens.danger }
                  ].filter(d => d.value > 0),
                  highlightScope: { fade: 'global', highlight: 'item' },
                  innerRadius: 50,
                  paddingAngle: 2,
                  cornerRadius: 5
                }]}
                height={300}
                slotProps={{
                  legend: {
                    position: { vertical: 'middle', horizontal: 'end' }
                  }
                }}
              />
            ) : (
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No hay datos para mostrar
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Top Usuarios y Horarios Pico */}
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mb: { xs: 2, sm: 2.5, md: 3 } }}>
        {/* Top Usuarios Más Activos */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{
            p: { xs: 2, sm: 2.5, md: 3 },
            borderRadius: 3,
            border: `1px solid ${colorTokens.border}`,
            height: '100%'
          }}>
            <Typography variant="h6" sx={{ mb: 2, color: colorTokens.textPrimary, fontWeight: 600 }}>
              🏆 Top 10 Usuarios Más Activos
            </Typography>
            {analytics.topUsers.length > 0 ? (
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {analytics.topUsers.map((topUser, index) => (
                  <React.Fragment key={topUser.userId}>
                    <ListItem
                      sx={{
                        '&:hover': { backgroundColor: colorTokens.neutral100 },
                        borderRadius: 2,
                        mb: 0.5,
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        setSelectedUser(topUser.userId);
                        setUserHistoryOpen(true);
                      }}
                    >
                      <Box sx={{
                        mr: 2,
                        minWidth: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : colorTokens.neutral200,
                        fontWeight: 700,
                        fontSize: '0.875rem'
                      }}>
                        {index + 1}
                      </Box>
                      <ListItemAvatar>
                        <Avatar
                          src={topUser.user.profilePictureUrl || undefined}
                          sx={{
                            bgcolor: getRoleColor(topUser.user.rol)
                          }}
                        >
                          {topUser.user.firstName.charAt(0)}{topUser.user.lastName.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={600}>
                            {topUser.user.firstName} {topUser.user.lastName}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {topUser.user.email}
                          </Typography>
                        }
                      />
                      <Chip
                        label={`${topUser.count} accesos`}
                        size="small"
                        sx={{
                          backgroundColor: `${colorTokens.brand}15`,
                          color: colorTokens.brand,
                          fontWeight: 600
                        }}
                      />
                    </ListItem>
                    {index < analytics.topUsers.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No hay datos para mostrar
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Horarios Pico */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{
            p: { xs: 2, sm: 2.5, md: 3 },
            borderRadius: 3,
            border: `1px solid ${colorTokens.border}`,
            height: '100%'
          }}>
            <Typography variant="h6" sx={{ mb: 2, color: colorTokens.textPrimary, fontWeight: 600 }}>
              🔥 Horarios Pico
            </Typography>
            {analytics.peakHours.length > 0 ? (
              <Box>
                {analytics.peakHours.map((peak, index) => (
                  <Card
                    key={peak.hour}
                    sx={{
                      mb: 2,
                      background: `linear-gradient(135deg, ${colorTokens.danger}${15 - index * 3}, ${colorTokens.danger}05)`,
                      border: `1px solid ${colorTokens.danger}${30 - index * 5}`,
                      borderRadius: 2
                    }}
                  >
                    <CardContent>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <FireIcon sx={{
                            fontSize: 40,
                            color: index === 0 ? colorTokens.danger : index === 1 ? colorTokens.warning : colorTokens.info
                          }} />
                          <Box>
                            <Typography variant="h5" sx={{ fontWeight: 700 }}>
                              {peak.hour}:00 - {peak.hour + 1}:00
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Hora pico #{index + 1}
                            </Typography>
                          </Box>
                        </Stack>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: colorTokens.brand }}>
                            {peak.count}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            accesos
                          </Typography>
                        </Box>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={(peak.count / analytics.peakHours[0].count) * 100}
                        sx={{
                          mt: 2,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: colorTokens.neutral200,
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: index === 0 ? colorTokens.danger : index === 1 ? colorTokens.warning : colorTokens.info
                          }
                        }}
                      />
                    </CardContent>
                  </Card>
                ))}
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    📈 Promedio de accesos por hora: <strong>{analytics.averageAccessesPerHour.toFixed(1)}</strong>
                  </Typography>
                </Alert>
              </Box>
            ) : (
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No hay datos para mostrar
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Paper sx={{
        p: { xs: 2, sm: 2.5, md: 3 },
        mb: { xs: 2, sm: 2.5, md: 3 },
        borderRadius: 3,
        border: `1px solid ${colorTokens.border}`
      }}>
        <Typography variant="h6" sx={{ mb: 2, color: colorTokens.textPrimary, fontWeight: 600 }}>
          <FilterListIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Filtros
        </Typography>

        <Grid container spacing={{ xs: 2, sm: 2.5 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo de Usuario</InputLabel>
              <Select
                value={userTypeFilter}
                label="Tipo de Usuario"
                onChange={(e) => {
                  setUserTypeFilter(e.target.value as UserTypeFilter);
                  setPage(0);
                }}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="cliente">Clientes</MenuItem>
                <MenuItem value="empleado">Empleados</MenuItem>
                <MenuItem value="admin">Administradores</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Período</InputLabel>
              <Select
                value={timeRange}
                label="Período"
                onChange={(e) => {
                  setTimeRange(e.target.value as TimeRange);
                  setPage(0);
                }}
              >
                <MenuItem value="today">Hoy</MenuItem>
                <MenuItem value="week">Esta Semana</MenuItem>
                <MenuItem value="month">Este Mes</MenuItem>
                <MenuItem value="custom">Personalizado</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {timeRange === 'custom' && (
            <>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <DatePicker
                  label="Fecha Inicio"
                  value={startDate}
                  onChange={(newValue) => {
                    // Ensure we always store a Dayjs object or null
                    if (newValue === null) {
                      setStartDate(null);
                    } else if (dayjs.isDayjs(newValue)) {
                      setStartDate(newValue);
                    } else {
                      setStartDate(dayjs(newValue));
                    }
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: colorTokens.brand,
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: colorTokens.brand,
                          },
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: colorTokens.brand,
                        },
                      }
                    },
                    actionBar: {
                      actions: ['clear', 'accept'],
                    },
                    shortcuts: {
                      items: [
                        {
                          label: 'Hoy',
                          getValue: () => dayjs(),
                        },
                        {
                          label: 'Ayer',
                          getValue: () => dayjs().subtract(1, 'day'),
                        },
                        {
                          label: 'Inicio de Semana',
                          getValue: () => dayjs().startOf('week'),
                        },
                        {
                          label: 'Inicio de Mes',
                          getValue: () => dayjs().startOf('month'),
                        },
                        {
                          label: 'Hace 7 días',
                          getValue: () => dayjs().subtract(7, 'day'),
                        },
                        {
                          label: 'Hace 30 días',
                          getValue: () => dayjs().subtract(30, 'day'),
                        },
                        {
                          label: 'Reset',
                          getValue: () => null,
                        },
                      ],
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <DatePicker
                  label="Fecha Fin"
                  value={endDate}
                  onChange={(newValue) => {
                    // Ensure we always store a Dayjs object or null
                    if (newValue === null) {
                      setEndDate(null);
                    } else if (dayjs.isDayjs(newValue)) {
                      setEndDate(newValue);
                    } else {
                      setEndDate(dayjs(newValue));
                    }
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: colorTokens.brand,
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: colorTokens.brand,
                          },
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: colorTokens.brand,
                        },
                      }
                    },
                    actionBar: {
                      actions: ['clear', 'accept'],
                    },
                    shortcuts: {
                      items: [
                        {
                          label: 'Hoy',
                          getValue: () => dayjs(),
                        },
                        {
                          label: 'Mañana',
                          getValue: () => dayjs().add(1, 'day'),
                        },
                        {
                          label: 'Fin de Semana',
                          getValue: () => dayjs().endOf('week'),
                        },
                        {
                          label: 'Fin de Mes',
                          getValue: () => dayjs().endOf('month'),
                        },
                        {
                          label: 'En 7 días',
                          getValue: () => dayjs().add(7, 'day'),
                        },
                        {
                          label: 'En 30 días',
                          getValue: () => dayjs().add(30, 'day'),
                        },
                        {
                          label: 'Reset',
                          getValue: () => null,
                        },
                      ],
                    },
                  }}
                />
              </Grid>
            </>
          )}

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={successFilter}
                label="Estado"
                onChange={(e) => {
                  setSuccessFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="true">Exitosos</MenuItem>
                <MenuItem value="false">Denegados</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: colorTokens.textSecondary }} />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          {/* Filtro de rango de hora */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{
              p: 2,
              background: `linear-gradient(135deg, ${colorTokens.info}10, ${colorTokens.info}05)`,
              border: `1px solid ${colorTokens.info}30`
            }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: colorTokens.textPrimary }}>
                <AccessTimeIcon sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle' }} />
                Filtrar por Rango de Hora
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <InputLabel>Desde</InputLabel>
                  <Select
                    value={hourRangeStart}
                    label="Desde"
                    onChange={(e) => setHourRangeStart(e.target.value as number)}
                  >
                    <MenuItem value="">--</MenuItem>
                    {Array.from({ length: 24 }, (_, i) => (
                      <MenuItem key={i} value={i}>{i}:00</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="body2" color="text.secondary">hasta</Typography>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <InputLabel>Hasta</InputLabel>
                  <Select
                    value={hourRangeEnd}
                    label="Hasta"
                    onChange={(e) => setHourRangeEnd(e.target.value as number)}
                  >
                    <MenuItem value="">--</MenuItem>
                    {Array.from({ length: 24 }, (_, i) => (
                      <MenuItem key={i} value={i}>{i}:59</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {(hourRangeStart !== '' || hourRangeEnd !== '') && (
                  <Button
                    size="small"
                    onClick={() => {
                      setHourRangeStart('');
                      setHourRangeEnd('');
                    }}
                    sx={{ color: colorTokens.danger }}
                  >
                    Limpiar
                  </Button>
                )}
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla */}
      <Paper sx={{
        borderRadius: 3,
        border: `1px solid ${colorTokens.border}`,
        overflow: 'hidden'
      }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead sx={{ background: colorTokens.neutral100 }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: colorTokens.textPrimary }}>Usuario</TableCell>
                <TableCell sx={{ fontWeight: 700, color: colorTokens.textPrimary }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 700, color: colorTokens.textPrimary }}>Membresía/Puesto</TableCell>
                <TableCell sx={{ fontWeight: 700, color: colorTokens.textPrimary }}>Fecha y Hora</TableCell>
                <TableCell sx={{ fontWeight: 700, color: colorTokens.textPrimary }}>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <CircularProgress sx={{ color: colorTokens.brand }} />
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                      No se encontraron registros
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow
                    key={log.id}
                    sx={{ '&:hover': { backgroundColor: colorTokens.neutral100 } }}
                  >
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar
                          src={log.user.profilePictureUrl || undefined}
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: getRoleColor(log.user.rol)
                          }}
                        >
                          {log.user.firstName.charAt(0)}{log.user.lastName.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {log.user.firstName} {log.user.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {log.user.email}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Chip
                        icon={getRoleIcon(log.user.rol)}
                        label={log.user.rol === 'cliente' ? 'Cliente' : log.user.rol === 'empleado' ? 'Empleado' : 'Admin'}
                        size="small"
                        sx={{
                          backgroundColor: `${getRoleColor(log.user.rol)}15`,
                          color: getRoleColor(log.user.rol),
                          fontWeight: 600
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      {log.user.rol === 'cliente' ? (
                        log.user.user_memberships && log.user.user_memberships.length > 0 ? (
                          <Stack spacing={0.5}>
                            <Typography variant="body2" fontWeight={600} sx={{
                              color: log.user.user_memberships[0].status === 'active' ? colorTokens.success :
                                     log.user.user_memberships[0].status === 'expired' ? colorTokens.danger :
                                     colorTokens.textSecondary
                            }}>
                              {log.user.user_memberships[0].membership_plans?.name || 'Plan desconocido'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {log.user.user_memberships[0].status === 'active' ?
                                `${log.user.user_memberships[0].remaining_visits} visitas • Activa` :
                                log.user.user_memberships[0].status === 'expired' ? 'Expirada' :
                                log.user.user_memberships[0].status === 'cancelled' ? 'Cancelada' :
                                log.user.user_memberships[0].status}
                            </Typography>
                          </Stack>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            Sin membresía
                          </Typography>
                        )
                      ) : log.user.employees && log.user.employees.length > 0 ? (
                        <Stack spacing={0.5}>
                          <Typography variant="body2" fontWeight={600}>
                            {log.user.employees[0].position}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {log.user.employees[0].department}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Personal
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <Stack>
                        <Typography variant="body2" fontWeight={600}>
                          {formatTimestampDateOnly(log.created_at)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatMexicoTime(log.created_at)}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      {/* Empleados y admins SIEMPRE tienen acceso - ignorar el campo success */}
                      {/* Solo clientes usan validación de membresía */}
                      {log.user.rol === 'admin' || log.user.rol === 'empleado' ? (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Acceso Permitido"
                          size="small"
                          sx={{
                            backgroundColor: `${colorTokens.brand}15`,
                            color: colorTokens.brand,
                            fontWeight: 600
                          }}
                        />
                      ) : log.success ? (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Exitoso"
                          size="small"
                          sx={{
                            backgroundColor: `${colorTokens.success}15`,
                            color: colorTokens.success,
                            fontWeight: 600
                          }}
                        />
                      ) : (
                        <Tooltip title={log.denial_reason || 'Acceso denegado'}>
                          <Chip
                            icon={<CancelIcon />}
                            label="Denegado"
                            size="small"
                            sx={{
                              backgroundColor: `${colorTokens.danger}15`,
                              color: colorTokens.danger,
                              fontWeight: 600
                            }}
                          />
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          sx={{
            borderTop: `1px solid ${colorTokens.border}`,
            '.MuiTablePagination-select': { color: colorTokens.textPrimary },
            '.MuiTablePagination-displayedRows': { color: colorTokens.textSecondary }
          }}
        />
      </Paper>

      {/* Modal de Historial del Usuario */}
      <Dialog
        open={userHistoryOpen}
        onClose={() => setUserHistoryOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={2}>
              <TimelineIcon sx={{ color: colorTokens.brand }} />
              <Typography variant="h6">Historial Completo</Typography>
            </Stack>
            <IconButton onClick={() => setUserHistoryOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {selectedUser && (
            <Box>
              {(() => {
                const userLogs = logs.filter(log => log.user_id === selectedUser);
                const user = userLogs[0]?.user;

                if (!user) return null;

                return (
                  <>
                    {/* Info del Usuario */}
                    <Paper sx={{
                      p: 2,
                      mb: 3,
                      background: `linear-gradient(135deg, ${colorTokens.brand}15, ${colorTokens.brand}05)`,
                      border: `1px solid ${colorTokens.brand}30`
                    }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar
                          src={user.profilePictureUrl || undefined}
                          sx={{
                            width: 60,
                            height: 60,
                            bgcolor: getRoleColor(user.rol)
                          }}
                        >
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight={600}>
                            {user.firstName} {user.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {user.email}
                          </Typography>
                          <Chip
                            icon={getRoleIcon(user.rol)}
                            label={user.rol === 'cliente' ? 'Cliente' : user.rol === 'empleado' ? 'Empleado' : 'Admin'}
                            size="small"
                            sx={{
                              mt: 1,
                              backgroundColor: `${getRoleColor(user.rol)}15`,
                              color: getRoleColor(user.rol),
                              fontWeight: 600
                            }}
                          />
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: colorTokens.brand }}>
                            {userLogs.length}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Total accesos
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>

                    {/* Timeline de Accesos */}
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                      📅 Línea de Tiempo
                    </Typography>
                    <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                      {userLogs.map((log, index) => (
                        <React.Fragment key={log.id}>
                          <ListItem
                            sx={{
                              flexDirection: 'column',
                              alignItems: 'flex-start',
                              py: 2,
                              borderLeft: `3px solid ${log.success ? colorTokens.success : colorTokens.danger}`,
                              pl: 2,
                              ml: 2,
                              position: 'relative',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                left: -8,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: log.success ? colorTokens.success : colorTokens.danger,
                                border: `2px solid white`
                              }
                            }}
                          >
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%', mb: 1 }}>
                              <Typography variant="body2" fontWeight={600}>
                                {formatTimestampDateOnly(log.created_at)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                •
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {formatMexicoTime(log.created_at)}
                              </Typography>
                              <Box sx={{ flex: 1 }} />
                              {log.user.rol === 'admin' || log.user.rol === 'empleado' ? (
                                <Chip
                                  icon={<CheckCircleIcon />}
                                  label="Acceso Permitido"
                                  size="small"
                                  sx={{
                                    backgroundColor: `${colorTokens.brand}15`,
                                    color: colorTokens.brand,
                                    fontWeight: 600
                                  }}
                                />
                              ) : log.success ? (
                                <Chip
                                  icon={<CheckCircleIcon />}
                                  label="Exitoso"
                                  size="small"
                                  sx={{
                                    backgroundColor: `${colorTokens.success}15`,
                                    color: colorTokens.success,
                                    fontWeight: 600
                                  }}
                                />
                              ) : (
                                <Chip
                                  icon={<CancelIcon />}
                                  label="Denegado"
                                  size="small"
                                  sx={{
                                    backgroundColor: `${colorTokens.danger}15`,
                                    color: colorTokens.danger,
                                    fontWeight: 600
                                  }}
                                />
                              )}
                            </Stack>
                            {log.denial_reason && (
                              <Alert severity="error" sx={{ mt: 1, width: '100%' }}>
                                <Typography variant="caption">
                                  <strong>Motivo:</strong> {log.denial_reason}
                                </Typography>
                              </Alert>
                            )}
                          </ListItem>
                          {index < userLogs.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </>
                );
              })()}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserHistoryOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </LocalizationProvider>
  );
}
