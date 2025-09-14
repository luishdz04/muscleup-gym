'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Chip,
  Avatar,
  Stack,
  Paper,
  IconButton,
  InputAdornment,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Pagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Receipt as ReceiptIcon,
  CalendarToday as CalendarTodayIcon,
  AttachMoney as AttachMoneyIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Build as BuildIcon,
  AutoMode as AutoModeIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

// 🎨 DARK PRO SYSTEM - TOKENS
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
  roleAdmin: '#E91E63'
};

// ✅ INTERFACES
interface Cut {
  id: string;
  cut_number: string;
  cut_date: string;
  status: string;
  is_manual: boolean;
  grand_total: number;
  expenses_amount: number;
  final_balance: number;
  total_transactions: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  creator_name?: string;
  pos_total: number;
  abonos_total: number;
  membership_total: number;
}

interface CutDetail extends Cut {
  pos_efectivo: number;
  pos_transferencia: number;
  pos_debito: number;
  pos_credito: number;
  abonos_efectivo: number;
  abonos_transferencia: number;
  abonos_debito: number;
  abonos_credito: number;
  membership_efectivo: number;
  membership_transferencia: number;
  membership_debito: number;
  membership_credito: number;
  total_efectivo: number;
  total_transferencia: number;
  total_debito: number;
  total_credito: number;
}

interface FilterState {
  search: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  status: string;
  isManual: string;
  sortBy: string;
  sortOrder: string;
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(amount);
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
    return dateString;
  }
}
export default function CutsHistoryPage() {
  const router = useRouter();

  // ✅ ESTADOS
  const [cuts, setCuts] = useState<Cut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCut, setSelectedCut] = useState<CutDetail | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cutToDelete, setCutToDelete] = useState<string | null>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCut, setEditingCut] = useState<CutDetail | null>(null);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCuts, setTotalCuts] = useState(0);
  const itemsPerPage = 10;

  // Filtros
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    dateFrom: null,
    dateTo: null,
    status: 'all',
    isManual: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  // Estadísticas
  const [stats, setStats] = useState({
    totalCuts: 0,
    totalAmount: 0,
    avgAmount: 0,
    manualCuts: 0,
    automaticCuts: 0
  });

  // ✅ FUNCIONES
  const loadCuts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', itemsPerPage.toString());
      params.append('sortBy', filters.sortBy);
      params.append('sortOrder', filters.sortOrder);

      if (filters.search) params.append('search', filters.search);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString().split('T')[0]);
      if (filters.dateTo) params.append('dateTo', filters.dateTo.toISOString().split('T')[0]);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.isManual !== 'all') params.append('isManual', filters.isManual);

      console.log('📊 Cargando historial de cortes:', params.toString());

      const response = await fetch(`/api/cuts/history?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setCuts(data.cuts || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCuts(data.pagination?.total || 0);
        setStats(data.stats || stats);
        console.log('✅ Historial cargado:', data.cuts?.length, 'cortes');
      } else {
        setError(data.error || 'Error al cargar el historial');
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
      setError('Error al cargar el historial de cortes');
    } finally {
      setLoading(false);
    }
  };

  const loadCutDetail = async (cutId: string) => {
    try {
      setLoadingDetail(true);
      console.log('🔍 Cargando detalle del corte:', cutId);

      const response = await fetch(`/api/cuts/${cutId}`);
      const data = await response.json();

      if (data.success) {
        setSelectedCut(data.cut);
        setDetailDialogOpen(true);
        console.log('✅ Detalle cargado:', data.cut);
      } else {
        setError(data.error || 'Error al cargar el detalle del corte');
      }
    } catch (error) {
      console.error('Error cargando detalle:', error);
      setError('Error al cargar el detalle del corte');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleFilterChange = (field: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPage(1); // Reset página al cambiar filtros
  };

  const handleSearch = () => {
    setPage(1);
    loadCuts();
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      dateFrom: null,
      dateTo: null,
      status: 'all',
      isManual: 'all',
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
    setPage(1);
  };

  const exportCuts = async () => {
    try {
      console.log('📄 Exportando cortes...');
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString().split('T')[0]);
      if (filters.dateTo) params.append('dateTo', filters.dateTo.toISOString().split('T')[0]);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.isManual !== 'all') params.append('isManual', filters.isManual);

      const response = await fetch(`/api/cuts/export?${params.toString()}`);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cortes_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exportando:', error);
      setError('Error al exportar los datos');
    }
  };

  const exportCut = async (cutId: string) => {
    try {
      console.log('📄 Exportando corte individual:', cutId);
      const response = await fetch(`/api/cuts/${cutId}/export`);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `corte_${cutId.slice(0, 8)}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exportando corte:', error);
      setError('Error al exportar el corte');
    }
  };

  const handleDeleteCut = async () => {
    if (!cutToDelete) return;
    
    try {
      setLoadingDelete(true);
      console.log('🗑️ Eliminando corte:', cutToDelete);
      
      const response = await fetch(`/api/cuts/${cutToDelete}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCuts(cuts.filter(cut => cut.id !== cutToDelete));
        setDeleteDialogOpen(false);
        setCutToDelete(null);
        loadCuts(); // Recargar para actualizar estadísticas
      } else {
        setError(data.error || 'Error al eliminar el corte');
      }
    } catch (error) {
      console.error('Error eliminando corte:', error);
      setError('Error al eliminar el corte');
    } finally {
      setLoadingDelete(false);
    }
  };

  const handleUpdateCut = async () => {
    if (!editingCut) return;
    
    try {
      setLoadingUpdate(true);
      console.log('✏️ Actualizando corte:', editingCut.id);
      
      const response = await fetch(`/api/cuts/${editingCut.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notes: editingCut.notes,
          expenses_amount: editingCut.expenses_amount,
          status: editingCut.status
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setEditDialogOpen(false);
        setEditingCut(null);
        loadCuts(); // Recargar datos
      } else {
        setError(data.error || 'Error al actualizar el corte');
      }
    } catch (error) {
      console.error('Error actualizando corte:', error);
      setError('Error al actualizar el corte');
    } finally {
      setLoadingUpdate(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCuts();
    setRefreshing(false);
  };

  // ✅ EFFECTS
  useEffect(() => {
    loadCuts();
  }, [page, filters.sortBy, filters.sortOrder]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return darkProTokens.warning;
      case 'closed':
        return darkProTokens.success;
      case 'edited':
        return darkProTokens.info;
      default:
        return darkProTokens.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return <ScheduleIcon />;
      case 'closed':
        return <CheckCircleIcon />;
      case 'edited':
        return <EditIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'Abierto';
      case 'closed':
        return 'Cerrado';
      case 'edited':
        return 'Editado';
      default:
        return status;
    }
  };
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box sx={{ 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
        color: darkProTokens.textPrimary,
        p: 4
      }}>
        {/* HEADER */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={() => router.push('/dashboard/admin/cortes')}
              sx={{ 
                color: darkProTokens.textSecondary,
                '&:hover': { color: darkProTokens.primary }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            
            <Avatar sx={{ 
              bgcolor: darkProTokens.roleAdmin, 
              width: 60, 
              height: 60 
            }}>
              <AssessmentIcon sx={{ fontSize: 32 }} />
            </Avatar>
            
            <Box>
              <Typography variant="h3" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>
                Historial de Cortes
              </Typography>
              <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }}>
                📊 Gestión y análisis de todos los cortes de caja
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={refreshing ? <CircularProgress size={20} sx={{ color: darkProTokens.background }} /> : <RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{
                backgroundColor: darkProTokens.info,
                color: darkProTokens.background,
                '&:hover': {
                  backgroundColor: darkProTokens.infoHover
                }
              }}
            >
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportCuts}
              sx={{
                borderColor: darkProTokens.primary,
                color: darkProTokens.primary,
                '&:hover': {
                  borderColor: darkProTokens.primaryHover,
                  backgroundColor: `${darkProTokens.primary}20`
                }
              }}
            >
              Exportar Todo
            </Button>
          </Box>
        </Box>

        {/* ESTADÍSTICAS */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid xs={12} md={2.4}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
              border: `2px solid ${darkProTokens.primary}40`,
              borderRadius: 3
            }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Avatar sx={{ 
                  bgcolor: darkProTokens.primary, 
                  width: 48, 
                  height: 48,
                  mx: 'auto',
                  mb: 2 
                }}>
                  <ReceiptIcon />
                </Avatar>
                <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.primary }}>
                  {stats.totalCuts}
                </Typography>
                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                  Total Cortes
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid xs={12} md={2.4}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
              border: `2px solid ${darkProTokens.success}40`,
              borderRadius: 3
            }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Avatar sx={{ 
                  bgcolor: darkProTokens.success, 
                  width: 48, 
                  height: 48,
                  mx: 'auto',
                  mb: 2 
                }}>
                  <AttachMoneyIcon />
                </Avatar>
                <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.success }}>
                  {formatPrice(stats.totalAmount)}
                </Typography>
                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                  Total Acumulado
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid xs={12} md={2.4}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
              border: `2px solid ${darkProTokens.info}40`,
              borderRadius: 3
            }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Avatar sx={{ 
                  bgcolor: darkProTokens.info, 
                  width: 48, 
                  height: 48,
                  mx: 'auto',
                  mb: 2 
                }}>
                  <TrendingUpIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="bold" sx={{ color: darkProTokens.info }}>
                  {formatPrice(stats.avgAmount)}
                </Typography>
                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                  Promedio por Corte
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid xs={12} md={2.4}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
              border: `2px solid ${darkProTokens.success}40`,
              borderRadius: 3
            }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Avatar sx={{ 
                  bgcolor: darkProTokens.success, 
                  width: 48, 
                  height: 48,
                  mx: 'auto',
                  mb: 2 
                }}>
                  <AutoModeIcon />
                </Avatar>
                <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.success }}>
                  {stats.automaticCuts}
                </Typography>
                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                  Automáticos
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid xs={12} md={2.4}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
              border: `2px solid ${darkProTokens.warning}40`,
              borderRadius: 3
            }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Avatar sx={{ 
                  bgcolor: darkProTokens.warning, 
                  width: 48, 
                  height: 48,
                  mx: 'auto',
                  mb: 2 
                }}>
                  <BuildIcon />
                </Avatar>
                <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.warning }}>
                  {stats.manualCuts}
                </Typography>
                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                  Manuales
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* FILTROS */}
        <Card sx={{
          background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
          border: `2px solid ${darkProTokens.info}40`,
          borderRadius: 4,
          mb: 4
        }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <FilterListIcon sx={{ color: darkProTokens.info }} />
              <Typography variant="h6" fontWeight="bold" sx={{ color: darkProTokens.info }}>
                Filtros de Búsqueda
              </Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Buscar"
                  placeholder="Número de corte, responsable..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: darkProTokens.textSecondary }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: darkProTokens.surfaceLevel4,
                      color: darkProTokens.textPrimary,
                    },
                  }}
                />
              </Grid>

              <Grid xs={12} md={2}>
                <DatePicker
                  label="Fecha Desde"
                  value={filters.dateFrom}
                  onChange={(date) => handleFilterChange('dateFrom', date)}
                  sx={{
                    width: '100%',
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: darkProTokens.surfaceLevel4,
                      color: darkProTokens.textPrimary,
                    },
                  }}
                />
              </Grid>

              <Grid xs={12} md={2}>
                <DatePicker
                  label="Fecha Hasta"
                  value={filters.dateTo}
                  onChange={(date) => handleFilterChange('dateTo', date)}
                  sx={{
                    width: '100%',
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: darkProTokens.surfaceLevel4,
                      color: darkProTokens.textPrimary,
                    },
                  }}
                />
              </Grid>

              <Grid xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: darkProTokens.textSecondary }}>Estado</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    sx={{
                      backgroundColor: darkProTokens.surfaceLevel4,
                      color: darkProTokens.textPrimary,
                    }}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="open">Abierto</MenuItem>
                    <MenuItem value="closed">Cerrado</MenuItem>
                    <MenuItem value="edited">Editado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: darkProTokens.textSecondary }}>Tipo</InputLabel>
                  <Select
                    value={filters.isManual}
                    onChange={(e) => handleFilterChange('isManual', e.target.value)}
                    sx={{
                      backgroundColor: darkProTokens.surfaceLevel4,
                      color: darkProTokens.textPrimary,
                    }}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="true">Manual</MenuItem>
                    <MenuItem value="false">Automático</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid xs={12} md={1}>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    onClick={handleSearch}
                    sx={{
                      backgroundColor: darkProTokens.primary,
                      color: darkProTokens.background,
                      '&:hover': {
                        backgroundColor: darkProTokens.primaryHover
                      }
                    }}
                  >
                    Buscar
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={clearFilters}
                    sx={{
                      borderColor: darkProTokens.textSecondary,
                      color: darkProTokens.textSecondary,
                    }}
                  >
                    Limpiar
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* TABLA DE CORTES */}
        <Card sx={{
          background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
          border: `2px solid ${darkProTokens.roleAdmin}40`,
          borderRadius: 4
        }}>
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <CircularProgress size={60} sx={{ color: darkProTokens.roleAdmin }} />
              </Box>
            ) : error ? (
              <Box sx={{ p: 4 }}>
                <Alert severity="error">{error}</Alert>
              </Box>
            ) : cuts.length === 0 ? (
              <Box sx={{ p: 8, textAlign: 'center' }}>
                <ReceiptIcon sx={{ fontSize: 80, color: darkProTokens.textDisabled, mb: 2 }} />
                <Typography variant="h5" sx={{ color: darkProTokens.textDisabled, mb: 1 }}>
                  No hay cortes registrados
                </Typography>
                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                  Los cortes aparecerán aquí una vez que sean creados
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ backgroundColor: darkProTokens.grayDark, color: darkProTokens.textPrimary, fontWeight: 'bold' }}>
                          #Corte
                        </TableCell>
                        <TableCell sx={{ backgroundColor: darkProTokens.grayDark, color: darkProTokens.textPrimary, fontWeight: 'bold' }}>
                          Fecha
                        </TableCell>
                        <TableCell sx={{ backgroundColor: darkProTokens.grayDark, color: darkProTokens.textPrimary, fontWeight: 'bold' }}>
                          Total Bruto
                        </TableCell>
                        <TableCell sx={{ backgroundColor: darkProTokens.grayDark, color: darkProTokens.textPrimary, fontWeight: 'bold' }}>
                          Gastos
                        </TableCell>
                        <TableCell sx={{ backgroundColor: darkProTokens.grayDark, color: darkProTokens.textPrimary, fontWeight: 'bold' }}>
                          Balance Final
                        </TableCell>
                        <TableCell sx={{ backgroundColor: darkProTokens.grayDark, color: darkProTokens.textPrimary, fontWeight: 'bold' }}>
                          Tipo
                        </TableCell>
                        <TableCell sx={{ backgroundColor: darkProTokens.grayDark, color: darkProTokens.textPrimary, fontWeight: 'bold' }}>
                          Estado
                        </TableCell>
                        <TableCell sx={{ backgroundColor: darkProTokens.grayDark, color: darkProTokens.textPrimary, fontWeight: 'bold' }}>
                          Responsable
                        </TableCell>
                        <TableCell sx={{ backgroundColor: darkProTokens.grayDark, color: darkProTokens.textPrimary, fontWeight: 'bold' }}>
                          Acciones
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cuts.map((cut, index) => (
                        <TableRow 
                          key={cut.id}
                          sx={{ 
                            '&:nth-of-type(odd)': { 
                              backgroundColor: darkProTokens.surfaceLevel3 
                            },
                            '&:hover': {
                              backgroundColor: `${darkProTokens.primary}10`
                            }
                          }}
                        >
                          <TableCell sx={{ color: darkProTokens.textPrimary, fontFamily: 'monospace', fontWeight: 'bold' }}>
                            {cut.cut_number}
                          </TableCell>
                          
                          <TableCell sx={{ color: darkProTokens.textSecondary }}>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {formatDateLocal(cut.cut_date)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: darkProTokens.textDisabled }}>
                                {formatDateTime(cut.created_at)}
                              </Typography>
                            </Box>
                          </TableCell>
                          
                          <TableCell sx={{ color: darkProTokens.success, fontWeight: 'bold' }}>
                            {formatPrice(cut.grand_total)}
                          </TableCell>
                          
                          <TableCell sx={{ color: darkProTokens.error, fontWeight: 'bold' }}>
                            -{formatPrice(cut.expenses_amount)}
                          </TableCell>
                          
                          <TableCell sx={{ 
                            color: cut.final_balance >= 0 ? darkProTokens.success : darkProTokens.error, 
                            fontWeight: 'bold' 
                          }}>
                            {formatPrice(cut.final_balance)}
                          </TableCell>
                          
                          <TableCell>
                            <Chip
                              icon={cut.is_manual ? <BuildIcon /> : <AutoModeIcon />}
                              label={cut.is_manual ? 'Manual' : 'Automático'}
                              size="small"
                              sx={{
                                backgroundColor: cut.is_manual ? `${darkProTokens.warning}20` : `${darkProTokens.success}20`,
                                color: cut.is_manual ? darkProTokens.warning : darkProTokens.success,
                                fontWeight: 600
                              }}
                            />
                          </TableCell>
                          
                          <TableCell>
                            <Chip
                              icon={getStatusIcon(cut.status)}
                              label={getStatusLabel(cut.status)}
                              size="small"
                              sx={{
                                backgroundColor: `${getStatusColor(cut.status)}20`,
                                color: getStatusColor(cut.status),
                                fontWeight: 600
                              }}
                            />
                          </TableCell>
                          
                          <TableCell sx={{ color: darkProTokens.textSecondary }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PersonIcon sx={{ fontSize: 16 }} />
                              <Typography variant="body2">
                                {cut.creator_name || 'Usuario'}
                              </Typography>
                            </Box>
                          </TableCell>
                          
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <Tooltip title="Ver detalle">
                                <IconButton
                                  size="small"
                                  onClick={() => loadCutDetail(cut.id)}
                                  disabled={loadingDetail}
                                  sx={{ 
                                    color: darkProTokens.info,
                                    '&:hover': { 
                                      backgroundColor: `${darkProTokens.info}20` 
                                    }
                                  }}
                                >
                                  {loadingDetail ? (
                                    <CircularProgress size={16} />
                                  ) : (
                                    <VisibilityIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Exportar">
                                <IconButton
                                  size="small"
                                  onClick={() => exportCut(cut.id)}
                                  sx={{ 
                                    color: darkProTokens.primary,
                                    '&:hover': { 
                                      backgroundColor: `${darkProTokens.primary}20` 
                                    }
                                  }}
                                >
                                  <DownloadIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Editar">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setEditingCut(cut as CutDetail);
                                    setEditDialogOpen(true);
                                  }}
                                  sx={{ 
                                    color: darkProTokens.warning,
                                    '&:hover': { 
                                      backgroundColor: `${darkProTokens.warning}20` 
                                    }
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Eliminar">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setCutToDelete(cut.id);
                                    setDeleteDialogOpen(true);
                                  }}
                                  sx={{ 
                                    color: darkProTokens.error,
                                    '&:hover': { 
                                      backgroundColor: `${darkProTokens.error}20` 
                                    }
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* PAGINACIÓN */}
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(e, newPage) => setPage(newPage)}
                    color="primary"
                    size="large"
                    sx={{
                      '& .MuiPaginationItem-root': {
                        color: darkProTokens.textPrimary,
                        '&.Mui-selected': {
                          backgroundColor: darkProTokens.primary,
                          color: darkProTokens.background,
                        },
                      },
                    }}
                  />
                </Box>
              </>
            )}
          </CardContent>
        </Card>

        {/* DIALOG DE DETALLE */}
        <Dialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: darkProTokens.surfaceLevel2,
              color: darkProTokens.textPrimary,
              borderRadius: 4
            }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: `1px solid ${darkProTokens.grayMedium}`
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: darkProTokens.roleAdmin }}>
                <ReceiptIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Detalle del Corte: {selectedCut?.cut_number}
                </Typography>
                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                  {selectedCut && formatDateLocal(selectedCut.cut_date)}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setDetailDialogOpen(false)}>
              <CloseIcon sx={{ color: darkProTokens.textSecondary }} />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ p: 4 }}>
            {selectedCut && (
              <Grid container spacing={4}>
                {/* INFORMACIÓN GENERAL */}
                <Grid xs={12} md={4}>
                  <Card sx={{
                    backgroundColor: darkProTokens.surfaceLevel3,
                    border: `1px solid ${darkProTokens.grayMedium}`,
                    borderRadius: 3
                  }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: darkProTokens.primary, mb: 2 }}>
                        📋 Información General
                      </Typography>
                      
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                            Número de Corte:
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, fontFamily: 'monospace', color: darkProTokens.textPrimary }}>
                            {selectedCut.cut_number}
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                            Fecha del Corte:
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: darkProTokens.textPrimary }}>
                            {formatDateLocal(selectedCut.cut_date)}
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                            Tipo:
                          </Typography>
                          <Chip
                            icon={selectedCut.is_manual ? <BuildIcon /> : <AutoModeIcon />}
                            label={selectedCut.is_manual ? 'Manual' : 'Automático'}
                            size="small"
                            sx={{
                              backgroundColor: selectedCut.is_manual ? `${darkProTokens.warning}20` : `${darkProTokens.success}20`,
                              color: selectedCut.is_manual ? darkProTokens.warning : darkProTokens.success,
                              fontWeight: 600,
                              mt: 0.5
                            }}
                          />
                        </Box>
                        
                        <Box>
                          <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                            Total de Transacciones:
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: darkProTokens.textPrimary }}>
                            {selectedCut.total_transactions}
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                            Responsable:
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: darkProTokens.textPrimary }}>
                            {selectedCut.creator_name || 'Usuario'}
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                            Creado:
                          </Typography>
                          <Typography variant="body2" sx={{ color: darkProTokens.textPrimary }}>
                            {formatDateTime(selectedCut.created_at)}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* RESUMEN FINANCIERO */}
                <Grid xs={12} md={8}>
                  <Card sx={{
                    backgroundColor: darkProTokens.surfaceLevel3,
                    border: `1px solid ${darkProTokens.grayMedium}`,
                    borderRadius: 3
                  }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: darkProTokens.success, mb: 3 }}>
                        💰 Resumen Financiero
                      </Typography>
                      
                      <Grid container spacing={3}>
                        <Grid xs={12} md={4}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            backgroundColor: darkProTokens.surfaceLevel4,
                            borderRadius: 2
                          }}>
                            <Typography variant="h4" sx={{ color: darkProTokens.info, fontWeight: 'bold' }}>
                              {formatPrice(selectedCut.pos_total)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                              Punto de Venta
                            </Typography>
                          </Paper>
                        </Grid>
                        
                        <Grid xs={12} md={4}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            backgroundColor: darkProTokens.surfaceLevel4,
                            borderRadius: 2
                          }}>
                            <Typography variant="h4" sx={{ color: darkProTokens.warning, fontWeight: 'bold' }}>
                              {formatPrice(selectedCut.abonos_total)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                              Abonos / Apartados
                            </Typography>
                          </Paper>
                        </Grid>
                        
                        <Grid xs={12} md={4}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            backgroundColor: darkProTokens.surfaceLevel4,
                            borderRadius: 2
                          }}>
                            <Typography variant="h4" sx={{ color: darkProTokens.success, fontWeight: 'bold' }}>
                              {formatPrice(selectedCut.membership_total)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                              Membresías
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>
                      
                      <Divider sx={{ my: 3, backgroundColor: darkProTokens.grayMedium }} />
                      
                      <Grid container spacing={3}>
                        <Grid xs={12} md={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h5" sx={{ color: darkProTokens.primary, fontWeight: 'bold' }}>
                              {formatPrice(selectedCut.total_efectivo)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                              Efectivo
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid xs={12} md={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h5" sx={{ color: darkProTokens.info, fontWeight: 'bold' }}>
                              {formatPrice(selectedCut.total_transferencia)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                              Transferencia
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid xs={12} md={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h5" sx={{ color: darkProTokens.success, fontWeight: 'bold' }}>
                              {formatPrice(selectedCut.total_debito)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                              Tarjeta Débito
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid xs={12} md={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h5" sx={{ color: darkProTokens.error, fontWeight: 'bold' }}>
                              {formatPrice(selectedCut.total_credito)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                              Tarjeta Crédito
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                      
                      <Divider sx={{ my: 3, backgroundColor: darkProTokens.grayMedium }} />
                      
                      <Grid container spacing={3}>
                        <Grid xs={12} md={4}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" sx={{ color: darkProTokens.primary, fontWeight: 'bold' }}>
                              {formatPrice(selectedCut.grand_total)}
                            </Typography>
                            <Typography variant="body1" sx={{ color: darkProTokens.textSecondary, fontWeight: 600 }}>
                              Total Bruto
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid xs={12} md={4}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" sx={{ color: darkProTokens.error, fontWeight: 'bold' }}>
                              -{formatPrice(selectedCut.expenses_amount)}
                            </Typography>
                            <Typography variant="body1" sx={{ color: darkProTokens.textSecondary, fontWeight: 600 }}>
                              Gastos del Día
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid xs={12} md={4}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" sx={{ 
                              color: selectedCut.final_balance >= 0 ? darkProTokens.success : darkProTokens.error, 
                              fontWeight: 'bold' 
                            }}>
                              {formatPrice(selectedCut.final_balance)}
                            </Typography>
                            <Typography variant="body1" sx={{ color: darkProTokens.textSecondary, fontWeight: 600 }}>
                              Balance Final
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* NOTAS */}
                {selectedCut.notes && (
                  <Grid xs={12}>
                    <Card sx={{
                      backgroundColor: darkProTokens.surfaceLevel3,
                      border: `1px solid ${darkProTokens.grayMedium}`,
                      borderRadius: 3
                    }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ color: darkProTokens.warning, mb: 2 }}>
                          📝 Observaciones
                        </Typography>
                        <Typography variant="body1" sx={{ 
                          backgroundColor: darkProTokens.surfaceLevel4,
                          p: 2,
                          borderRadius: 2,
                          borderLeft: `4px solid ${darkProTokens.warning}`,
                          color: darkProTokens.textPrimary
                        }}>
                          {selectedCut.notes}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 3, borderTop: `1px solid ${darkProTokens.grayMedium}` }}>
            <Button
              onClick={() => setDetailDialogOpen(false)}
              sx={{ 
                color: darkProTokens.textSecondary,
                '&:hover': {
                  backgroundColor: `${darkProTokens.textSecondary}20`
                }
              }}
            >
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>

        {/* DIALOG DE CONFIRMACIÓN DE ELIMINACIÓN */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          PaperProps={{
            sx: {
              backgroundColor: darkProTokens.surfaceLevel2,
              color: darkProTokens.textPrimary,
              borderRadius: 4
            }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 2,
            borderBottom: `1px solid ${darkProTokens.grayMedium}`
          }}>
            <Avatar sx={{ bgcolor: darkProTokens.error }}>
              <WarningIcon />
            </Avatar>
            <Typography variant="h6" fontWeight="bold">
              Confirmar Eliminación
            </Typography>
          </DialogTitle>
          
          <DialogContent sx={{ p: 4 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              ¿Estás seguro de que deseas eliminar este corte?
            </Typography>
            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
              Esta acción no se puede deshacer. Se eliminarán todos los datos asociados a este corte.
            </Typography>
          </DialogContent>
          
          <DialogActions sx={{ p: 3, borderTop: `1px solid ${darkProTokens.grayMedium}` }}>
            <Button
              onClick={() => setDeleteDialogOpen(false)}
              sx={{ 
                color: darkProTokens.textSecondary,
                '&:hover': {
                  backgroundColor: `${darkProTokens.textSecondary}20`
                }
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteCut}
              variant="contained"
              startIcon={loadingDelete ? <CircularProgress size={20} /> : <DeleteIcon />}
              disabled={loadingDelete}
              sx={{
                backgroundColor: darkProTokens.error,
                color: darkProTokens.textPrimary,
                '&:hover': {
                  backgroundColor: darkProTokens.errorHover
                }
              }}
            >
              {loadingDelete ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* DIALOG DE EDICIÓN */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: darkProTokens.surfaceLevel2,
              color: darkProTokens.textPrimary,
              borderRadius: 4
            }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${darkProTokens.grayMedium}`
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: darkProTokens.warning }}>
                <EditIcon />
              </Avatar>
              <Typography variant="h6" fontWeight="bold">
                Editar Corte
              </Typography>
            </Box>
            <IconButton onClick={() => setEditDialogOpen(false)}>
              <CloseIcon sx={{ color: darkProTokens.textSecondary }} />
            </IconButton>
          </DialogTitle>
          
          <DialogContent sx={{ p: 4 }}>
            {editingCut && (
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Gastos del Día"
                  type="number"
                  value={editingCut.expenses_amount}
                  onChange={(e) => setEditingCut({
                    ...editingCut,
                    expenses_amount: parseFloat(e.target.value) || 0
                  })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: darkProTokens.surfaceLevel4,
                      color: darkProTokens.textPrimary,
                    },
                  }}
                />
                
                <FormControl fullWidth>
                  <InputLabel sx={{ color: darkProTokens.textSecondary }}>Estado</InputLabel>
                  <Select
                    value={editingCut.status}
                    onChange={(e) => setEditingCut({
                      ...editingCut,
                      status: e.target.value
                    })}
                    sx={{
                      backgroundColor: darkProTokens.surfaceLevel4,
                      color: darkProTokens.textPrimary,
                    }}
                  >
                    <MenuItem value="open">Abierto</MenuItem>
                    <MenuItem value="closed">Cerrado</MenuItem>
                    <MenuItem value="edited">Editado</MenuItem>
                  </Select>
                </FormControl>
                
                <TextField
                  fullWidth
                  label="Notas / Observaciones"
                  multiline
                  rows={4}
                  value={editingCut.notes || ''}
                  onChange={(e) => setEditingCut({
                    ...editingCut,
                    notes: e.target.value
                  })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: darkProTokens.surfaceLevel4,
                      color: darkProTokens.textPrimary,
                    },
                  }}
                />
              </Stack>
            )}
          </DialogContent>
          
          <DialogActions sx={{ p: 3, borderTop: `1px solid ${darkProTokens.grayMedium}` }}>
            <Button
              onClick={() => setEditDialogOpen(false)}
              sx={{ 
                color: darkProTokens.textSecondary,
                '&:hover': {
                  backgroundColor: `${darkProTokens.textSecondary}20`
                }
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateCut}
              variant="contained"
              startIcon={loadingUpdate ? <CircularProgress size={20} /> : <EditIcon />}
              disabled={loadingUpdate}
              sx={{
                backgroundColor: darkProTokens.warning,
                color: darkProTokens.background,
                '&:hover': {
                  backgroundColor: darkProTokens.warningHover
                }
              }}
            >
              {loadingUpdate ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}
