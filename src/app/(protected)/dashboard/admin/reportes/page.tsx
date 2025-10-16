'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Avatar,
  CircularProgress,
  IconButton,
  Paper,
  Chip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  FilterList as FilterListIcon,
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { colorTokens } from '@/theme';
import {
  formatDateForDisplay,
  getTodayInMexico,
  isExpiredDate,
  daysBetween
} from '@/utils/dateUtils';

// Interfaces
interface UserData {
  userid: string;
  first_name: string;
  last_name: string;
  email: string;
  gender?: string;
  blood_type?: string;
  created_at: string;
  membership_status?: 'active' | 'inactive' | 'expired';
  membership_end_date?: string;
}

interface FilterCriteria {
  gender: string;
  bloodType: string;
  membershipStatus: string;
  expirationDays: string; // e.g., '30', '60', '90', 'more_than_90'
  searchTerm: string;
}

interface AnalyticsStats {
  totalUsers: number;
  activeMembers: number;
  inactiveMembers: number;
  expiringSoon: number;
  genderDistribution: { name: string; value: number }[];
  bloodTypeDistribution: { name: string; value: number }[];
}

const INITIAL_FILTERS: FilterCriteria = {
  gender: 'all',
  bloodType: 'all',
  membershipStatus: 'all',
  expirationDays: 'all',
  searchTerm: ''
};

export default function AnalisisAvanzadoPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // State
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [filters, setFilters] = useState<FilterCriteria>(INITIAL_FILTERS);
  const [stats, setStats] = useState<AnalyticsStats>({
    totalUsers: 0,
    activeMembers: 0,
    inactiveMembers: 0,
    expiringSoon: 0,
    genderDistribution: [],
    bloodTypeDistribution: []
  });

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Load users data
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📊 [ANÁLISIS] Cargando datos de usuarios...');

      // Fetch users from API route (same pattern as dashboard)
      const response = await fetch('/api/users/analytics', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ [ANÁLISIS] Datos recibidos de API:', {
        totalUsers: data.users?.length || 0,
        timestamp: data.timestamp
      });

      setUsers(data.users || []);
      setFilteredUsers(data.users || []);
      calculateStats(data.users || []);

    } catch (error) {
      console.error('❌ [ANÁLISIS] Error cargando usuarios:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate statistics
  const calculateStats = (userData: UserData[]) => {
    const today = getTodayInMexico();

    const activeMembers = userData.filter(u => u.membership_status === 'active').length;
    const inactiveMembers = userData.filter(u => u.membership_status === 'inactive' || u.membership_status === 'expired').length;

    // Expiring in next 30 days
    const expiringSoon = userData.filter(u => {
      if (!u.membership_end_date || u.membership_status !== 'active') return false;
      const daysUntilExpiry = daysBetween(today, u.membership_end_date);
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
    }).length;

    // Gender distribution
    const genderCount: Record<string, number> = {};
    userData.forEach(u => {
      const gender = u.gender || 'No especificado';
      genderCount[gender] = (genderCount[gender] || 0) + 1;
    });
    const genderDistribution = Object.entries(genderCount).map(([name, value]) => ({
      name,
      value
    }));

    // Blood type distribution
    const bloodTypeCount: Record<string, number> = {};
    userData.forEach(u => {
      const bloodType = u.blood_type || 'No especificado';
      bloodTypeCount[bloodType] = (bloodTypeCount[bloodType] || 0) + 1;
    });
    const bloodTypeDistribution = Object.entries(bloodTypeCount).map(([name, value]) => ({
      name,
      value
    }));

    setStats({
      totalUsers: userData.length,
      activeMembers,
      inactiveMembers,
      expiringSoon,
      genderDistribution,
      bloodTypeDistribution
    });
  };

  // Apply filters
  const applyFilters = useCallback(() => {
    console.log('🔍 [FILTROS] ===== Aplicando filtros =====');
    console.log('🔍 [FILTROS] Filtros actuales:', filters);
    console.log('🔍 [FILTROS] Total usuarios antes de filtrar:', users.length);

    let filtered = [...users];

    // Gender filter
    if (filters.gender !== 'all') {
      console.log('🔍 [FILTROS] Filtrando por género:', filters.gender);
      filtered = filtered.filter(u => u.gender === filters.gender);
      console.log('🔍 [FILTROS] Usuarios después de filtro género:', filtered.length);
    }

    // Blood type filter
    if (filters.bloodType !== 'all') {
      filtered = filtered.filter(u => u.blood_type === filters.bloodType);
    }

    // Membership status filter
    if (filters.membershipStatus !== 'all') {
      filtered = filtered.filter(u => u.membership_status === filters.membershipStatus);
    }

    // Expiration days filter
    if (filters.expirationDays !== 'all') {
      const today = getTodayInMexico();
      filtered = filtered.filter(u => {
        if (!u.membership_end_date) return false;

        const daysUntilExpiry = daysBetween(today, u.membership_end_date);

        switch (filters.expirationDays) {
          case '30':
            return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
          case '60':
            return daysUntilExpiry <= 60 && daysUntilExpiry >= 0;
          case '90':
            return daysUntilExpiry <= 90 && daysUntilExpiry >= 0;
          case 'expired_30':
            return daysUntilExpiry < 0 && daysUntilExpiry >= -30;
          case 'expired_60':
            return daysUntilExpiry < 0 && daysUntilExpiry >= -60;
          case 'expired_90':
            return daysUntilExpiry < 0 && daysUntilExpiry >= -90;
          case 'more_than_90':
            return daysUntilExpiry < -90;
          default:
            return true;
        }
      });
    }

    // Search term filter
    if (filters.searchTerm.trim() !== '') {
      const searchLower = filters.searchTerm.toLowerCase();
      console.log('🔍 [FILTROS] Filtrando por búsqueda:', searchLower);
      filtered = filtered.filter(u =>
        u.first_name?.toLowerCase().includes(searchLower) ||
        u.last_name?.toLowerCase().includes(searchLower) ||
        u.email?.toLowerCase().includes(searchLower)
      );
      console.log('🔍 [FILTROS] Usuarios después de búsqueda:', filtered.length);
    }

    console.log('✅ [FILTROS] Total usuarios filtrados:', filtered.length);
    setFilteredUsers(filtered);
    setPage(0); // Reset to first page
  }, [users, filters]);

  // Effect to apply filters when they change
  useEffect(() => {
    if (users.length > 0) {
      applyFilters();
    }
  }, [filters, users, applyFilters]);

  // Load data on mount
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Clear filters
  const clearFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Nombre', 'Apellido', 'Email', 'Género', 'Tipo de Sangre', 'Estado Membresía', 'Fecha Vencimiento'];
    const rows = filteredUsers.map(u => [
      u.first_name || '',
      u.last_name || '',
      u.email || '',
      u.gender || '',
      u.blood_type || '',
      u.membership_status || '',
      u.membership_end_date ? formatDateForDisplay(u.membership_end_date) : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analisis_usuarios_${getTodayInMexico()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metric Card Component
  const MetricCard = ({
    title,
    value,
    subtitle,
    icon,
    color
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{
        background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
        border: `1px solid ${colorTokens.neutral400}`,
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: `0 8px 24px ${color}20`,
          borderColor: color,
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${color}, ${color}DD)`,
        }
      }}>
        <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Avatar sx={{
              bgcolor: `${color}20`,
              width: { xs: 40, sm: 50 },
              height: { xs: 40, sm: 50 },
              border: `2px solid ${color}40`
            }}>
              {React.cloneElement(icon as React.ReactElement, {
                sx: { fontSize: { xs: 20, sm: 25 }, color }
              })}
            </Avatar>
          </Box>

          <Typography variant="h4" sx={{
            fontWeight: 800,
            mb: 0.5,
            fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' },
            color: colorTokens.textPrimary
          }}>
            {value}
          </Typography>

          <Typography variant="body1" sx={{
            color: colorTokens.textSecondary,
            fontWeight: 600,
            fontSize: { xs: '0.75rem', sm: '0.875rem' }
          }}>
            {title}
          </Typography>

          {subtitle && (
            <Typography variant="caption" sx={{
              color: colorTokens.textMuted,
              mt: 0.5,
              display: 'block',
              fontSize: { xs: '0.65rem', sm: '0.7rem' }
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
        background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ color: colorTokens.brand, mb: 3 }} />
          <Typography variant="h5" sx={{ color: colorTokens.textPrimary, mb: 1 }}>
            Cargando Análisis Avanzado
          </Typography>
          <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
            Procesando datos de usuarios...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{
      p: { xs: 2, sm: 2.5, md: 3 },
      background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
      minHeight: '100vh',
      color: colorTokens.textPrimary
    }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Paper sx={{
          p: { xs: 2, sm: 2.5, md: 3 },
          mb: 3,
          background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
          border: `1px solid ${colorTokens.neutral400}`,
          borderRadius: 3,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, ${colorTokens.brand}, ${colorTokens.success})`
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
                bgcolor: colorTokens.brand,
                width: { xs: 45, sm: 55 },
                height: { xs: 45, sm: 55 },
                border: `3px solid ${colorTokens.brand}40`
              }}>
                <AnalyticsIcon sx={{ fontSize: { xs: 22, sm: 28 } }} />
              </Avatar>

              <Box>
                <Typography variant="h4" sx={{
                  color: colorTokens.textPrimary,
                  fontWeight: 800,
                  fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2rem' }
                }}>
                  Análisis Avanzado
                </Typography>
                <Typography variant="body2" sx={{
                  color: colorTokens.textSecondary,
                  fontWeight: 600,
                  fontSize: { xs: '0.7rem', sm: '0.8rem' }
                }}>
                  Filtrado avanzado de datos de usuarios
                </Typography>
              </Box>
            </Box>

            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={loadUsers}
              variant="contained"
              sx={{
                background: `linear-gradient(135deg, ${colorTokens.info}, ${colorTokens.info}DD)`,
                fontWeight: 700,
                px: { xs: 2, sm: 3 },
                py: { xs: 0.75, sm: 1 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                '&:hover': {
                  background: `linear-gradient(135deg, ${colorTokens.infoHover}, ${colorTokens.info})`
                }
              }}
            >
              Actualizar
            </Button>
          </Box>
        </Paper>
      </motion.div>

      {/* Metrics */}
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title="Total Usuarios"
            value={stats.totalUsers}
            icon={<PeopleIcon />}
            color={colorTokens.brand}
            subtitle="Usuarios registrados"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title="Membresías Activas"
            value={stats.activeMembers}
            icon={<TrendingUpIcon />}
            color={colorTokens.success}
            subtitle={`${((stats.activeMembers / stats.totalUsers) * 100).toFixed(1)}% del total`}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title="Inactivos/Vencidos"
            value={stats.inactiveMembers}
            icon={<AssessmentIcon />}
            color={colorTokens.danger}
            subtitle="Sin membresía activa"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title="Vencen Pronto"
            value={stats.expiringSoon}
            icon={<FilterListIcon />}
            color={colorTokens.warning}
            subtitle="Próximos 30 días"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{
            background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
            border: `1px solid ${colorTokens.neutral400}`,
            borderRadius: 3,
            width: '100%',
            maxWidth: '100%'
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
              <Typography variant="h6" sx={{
                color: colorTokens.textPrimary,
                fontWeight: 700,
                mb: 2,
                fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' }
              }}>
                Distribución por Género
              </Typography>
              <Box sx={{
                width: '100%',
                minWidth: 0,
                maxWidth: '100%',
                height: { xs: 280, sm: 300, md: 320 }
              }}>
                {stats.genderDistribution.length > 0 ? (
                  <PieChart
                    series={[{
                      data: stats.genderDistribution.map((item, index) => ({
                        id: index,
                        value: item.value,
                        label: item.name,
                        color: index === 0 ? colorTokens.brand : index === 1 ? colorTokens.info : colorTokens.success
                      })),
                      highlightScope: { faded: 'global', highlighted: 'item' },
                      innerRadius: isMobile ? 45 : 60,
                      outerRadius: isMobile ? 85 : 110,
                      paddingAngle: 3,
                      cornerRadius: 8
                    }]}
                    height={isMobile ? 280 : isTablet ? 300 : 320}
                    margin={{
                      top: isMobile ? 10 : 20,
                      bottom: isMobile ? 60 : 80,
                      left: isMobile ? 10 : 20,
                      right: isMobile ? 10 : 20
                    }}
                    slotProps={{
                      legend: {
                        direction: isMobile ? 'column' : 'row',
                        position: {
                          vertical: 'bottom',
                          horizontal: 'middle'
                        },
                        padding: isMobile ? 5 : 10
                      }
                    }}
                  />
                ) : (
                  <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography sx={{ color: colorTokens.textSecondary }}>Sin datos</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{
            background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
            border: `1px solid ${colorTokens.neutral400}`,
            borderRadius: 3,
            width: '100%',
            maxWidth: '100%'
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
              <Typography variant="h6" sx={{
                color: colorTokens.textPrimary,
                fontWeight: 700,
                mb: 2,
                fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' }
              }}>
                Distribución por Tipo de Sangre
              </Typography>
              <Box sx={{
                width: '100%',
                minWidth: 0,
                maxWidth: '100%',
                height: { xs: 280, sm: 300, md: 320 }
              }}>
                {stats.bloodTypeDistribution.length > 0 ? (
                  <BarChart
                    xAxis={[{
                      scaleType: 'band',
                      data: stats.bloodTypeDistribution.map(item => item.name),
                      tickLabelStyle: {
                        fontSize: isMobile ? 10 : 12,
                        fill: colorTokens.textSecondary,
                        fontWeight: 600
                      }
                    }]}
                    yAxis={[{
                      label: 'Usuarios',
                      labelStyle: {
                        fontSize: isMobile ? 11 : 13,
                        fill: colorTokens.textPrimary,
                        fontWeight: 600
                      },
                      tickLabelStyle: {
                        fontSize: isMobile ? 10 : 12,
                        fill: colorTokens.textSecondary,
                        fontWeight: 600
                      }
                    }]}
                    series={[{
                      data: stats.bloodTypeDistribution.map(item => item.value),
                      label: 'Usuarios',
                      color: colorTokens.danger
                    }]}
                    height={isMobile ? 280 : isTablet ? 300 : 320}
                    margin={{
                      left: isMobile ? 50 : 70,
                      right: isMobile ? 10 : 20,
                      top: isMobile ? 30 : 40,
                      bottom: isMobile ? 50 : 60
                    }}
                    grid={{ horizontal: true }}
                  />
                ) : (
                  <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography sx={{ color: colorTokens.textSecondary }}>Sin datos</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{
        background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
        border: `1px solid ${colorTokens.neutral400}`,
        borderRadius: 3,
        mb: 3
      }}>
        <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterListIcon sx={{ color: colorTokens.brand, fontSize: { xs: 20, sm: 24 } }} />
              <Typography variant="h6" sx={{
                color: colorTokens.textPrimary,
                fontWeight: 700,
                fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' }
              }}>
                Filtros Avanzados
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                startIcon={<ClearIcon />}
                onClick={clearFilters}
                sx={{
                  color: colorTokens.textSecondary,
                  fontSize: { xs: '0.7rem', sm: '0.8rem' }
                }}
              >
                Limpiar
              </Button>
              <Button
                size="small"
                startIcon={<FileDownloadIcon />}
                onClick={exportToCSV}
                variant="contained"
                sx={{
                  background: `linear-gradient(135deg, ${colorTokens.success}, ${colorTokens.success}DD)`,
                  fontSize: { xs: '0.7rem', sm: '0.8rem' },
                  '&:hover': {
                    background: `linear-gradient(135deg, ${colorTokens.successHover}, ${colorTokens.success})`
                  }
                }}
              >
                Exportar CSV
              </Button>
            </Box>
          </Box>

          <Grid container spacing={{ xs: 1.5, sm: 2 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                label="Buscar"
                placeholder="Nombre, apellido o email"
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: colorTokens.textMuted, mr: 1 }} />
                }}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Género</InputLabel>
                <Select
                  value={filters.gender}
                  label="Género"
                  onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="Masculino">Masculino</MenuItem>
                  <MenuItem value="Femenino">Femenino</MenuItem>
                  <MenuItem value="Otro">Otro</MenuItem>
                  <MenuItem value="No especificado">No especificado</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Estado Membresía</InputLabel>
                <Select
                  value={filters.membershipStatus}
                  label="Estado Membresía"
                  onChange={(e) => setFilters({ ...filters, membershipStatus: e.target.value })}
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="active">Activa</MenuItem>
                  <MenuItem value="inactive">Inactiva</MenuItem>
                  <MenuItem value="expired">Vencida</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Vencimiento</InputLabel>
                <Select
                  value={filters.expirationDays}
                  label="Vencimiento"
                  onChange={(e) => setFilters({ ...filters, expirationDays: e.target.value })}
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="30">Vence en 30 días</MenuItem>
                  <MenuItem value="60">Vence en 60 días</MenuItem>
                  <MenuItem value="90">Vence en 90 días</MenuItem>
                  <MenuItem value="expired_30">Vencido hace 30 días</MenuItem>
                  <MenuItem value="expired_60">Vencido hace 60 días</MenuItem>
                  <MenuItem value="expired_90">Vencido hace 90 días</MenuItem>
                  <MenuItem value="more_than_90">Vencido hace más de 90 días</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Tipo de Sangre</InputLabel>
                <Select
                  value={filters.bloodType}
                  label="Tipo de Sangre"
                  onChange={(e) => setFilters({ ...filters, bloodType: e.target.value })}
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="A+">A+</MenuItem>
                  <MenuItem value="A-">A-</MenuItem>
                  <MenuItem value="B+">B+</MenuItem>
                  <MenuItem value="B-">B-</MenuItem>
                  <MenuItem value="AB+">AB+</MenuItem>
                  <MenuItem value="AB-">AB-</MenuItem>
                  <MenuItem value="O+">O+</MenuItem>
                  <MenuItem value="O-">O-</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2, borderColor: colorTokens.neutral400 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: colorTokens.textSecondary, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              Mostrando {filteredUsers.length} de {users.length} usuarios
            </Typography>
            <Chip
              label={`${filteredUsers.length} resultados`}
              sx={{
                bgcolor: `${colorTokens.brand}20`,
                color: colorTokens.brand,
                fontWeight: 600,
                fontSize: { xs: '0.7rem', sm: '0.8rem' }
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card sx={{
        background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
        border: `1px solid ${colorTokens.neutral400}`,
        borderRadius: 3
      }}>
        <CardContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
          <TableContainer>
            <Table size={isMobile ? 'small' : 'medium'}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{
                    color: colorTokens.textPrimary,
                    fontWeight: 700,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}>
                    Nombre
                  </TableCell>
                  <TableCell sx={{
                    color: colorTokens.textPrimary,
                    fontWeight: 700,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    display: { xs: 'none', sm: 'table-cell' }
                  }}>
                    Email
                  </TableCell>
                  <TableCell sx={{
                    color: colorTokens.textPrimary,
                    fontWeight: 700,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    display: { xs: 'none', md: 'table-cell' }
                  }}>
                    Género
                  </TableCell>
                  <TableCell sx={{
                    color: colorTokens.textPrimary,
                    fontWeight: 700,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    display: { xs: 'none', lg: 'table-cell' }
                  }}>
                    Tipo Sangre
                  </TableCell>
                  <TableCell sx={{
                    color: colorTokens.textPrimary,
                    fontWeight: 700,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}>
                    Estado
                  </TableCell>
                  <TableCell sx={{
                    color: colorTokens.textPrimary,
                    fontWeight: 700,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    display: { xs: 'none', sm: 'table-cell' }
                  }}>
                    Vencimiento
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((user) => (
                    <TableRow key={user.userid} hover>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        <Typography sx={{
                          color: colorTokens.textPrimary,
                          fontWeight: 600,
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}>
                          {user.first_name} {user.last_name}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        display: { xs: 'none', sm: 'table-cell' }
                      }}>
                        <Typography sx={{
                          color: colorTokens.textSecondary,
                          fontSize: { xs: '0.7rem', sm: '0.8rem' }
                        }}>
                          {user.email}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        display: { xs: 'none', md: 'table-cell' }
                      }}>
                        <Typography sx={{
                          color: colorTokens.textSecondary,
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}>
                          {user.gender || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        display: { xs: 'none', lg: 'table-cell' }
                      }}>
                        <Typography sx={{
                          color: colorTokens.textSecondary,
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}>
                          {user.blood_type || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        <Chip
                          label={
                            user.membership_status === 'active' ? 'Activa' :
                            user.membership_status === 'expired' ? 'Vencida' : 'Inactiva'
                          }
                          size="small"
                          sx={{
                            bgcolor: user.membership_status === 'active' ? `${colorTokens.success}20` :
                                     user.membership_status === 'expired' ? `${colorTokens.danger}20` :
                                     `${colorTokens.neutral600}20`,
                            color: user.membership_status === 'active' ? colorTokens.success :
                                   user.membership_status === 'expired' ? colorTokens.danger :
                                   colorTokens.textSecondary,
                            fontWeight: 600,
                            fontSize: { xs: '0.65rem', sm: '0.75rem' },
                            height: { xs: 20, sm: 24 }
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        display: { xs: 'none', sm: 'table-cell' }
                      }}>
                        <Typography sx={{
                          color: colorTokens.textSecondary,
                          fontSize: { xs: '0.7rem', sm: '0.8rem' }
                        }}>
                          {user.membership_end_date ? formatDateForDisplay(user.membership_end_date) : '-'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredUsers.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
            labelRowsPerPage={isMobile ? "Filas:" : "Filas por página:"}
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
            sx={{
              color: colorTokens.textSecondary,
              '& .MuiTablePagination-select': {
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              },
              '& .MuiTablePagination-displayedRows': {
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }
            }}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
