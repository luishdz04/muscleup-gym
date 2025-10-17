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
  Alert
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
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
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
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  // Filtros
  const [userTypeFilter, setUserTypeFilter] = useState<UserTypeFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [successFilter, setSuccessFilter] = useState<string>('all');

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
        start = startDate ? `${startDate}T00:00:00` : '';
        end = endDate ? `${endDate}T23:59:59` : '';
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

  // Filtrar logs por término de búsqueda
  const filteredLogs = useMemo(() => {
    if (!searchTerm) return logs;

    const term = searchTerm.toLowerCase();
    return logs.filter(log =>
      log.user.firstName.toLowerCase().includes(term) ||
      log.user.lastName.toLowerCase().includes(term) ||
      log.user.email.toLowerCase().includes(term)
    );
  }, [logs, searchTerm]);

  // Datos para gráficos
  const chartData = useMemo(() => {
    // Agrupar por hora del día
    const hourlyData = logs.reduce((acc: Record<number, number>, log) => {
      const hour = new Date(log.created_at).getHours();
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
              📊 Accesos por Hora del Día
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
                margin={{ top: 10, right: 10, bottom: 30, left: 40 }}
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
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Fecha Inicio"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Fecha Fin"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
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

          <Grid size={{ xs: 12, sm: 6, md: timeRange === 'custom' ? 12 : 3 }}>
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
    </Box>
  );
}
