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
  MoneyOff as MoneyOffIcon,
  CalendarToday as CalendarTodayIcon,
  AttachMoney as AttachMoneyIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  Category as CategoryIcon,
  Business as BusinessIcon,
  Build as BuildIcon,
  CleaningServices as CleaningIcon,
  Campaign as CampaignIcon,
  Computer as ComputerIcon,
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
interface Expense {
  id: string;
  expense_date: string;
  expense_time: string;
  expense_type: string;
  description: string;
  amount: number;
  receipt_number?: string;
  notes?: string;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator_name?: string;
}

interface ExpenseDetail extends Expense {
  // Campos adicionales para el detalle si los hay
}

interface FilterState {
  search: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  expenseType: string;
  status: string;
  sortBy: string;
  sortOrder: string;
}

interface StatsBreakdown {
  count: number;
  amount: number;
}

interface Stats {
  totalExpenses: number;
  totalAmount: number;
  avgAmount: number;
  categoriesBreakdown: Record<string, StatsBreakdown>;
}

// ✅ TIPOS DE GASTOS VALIDADOS
const EXPENSE_TYPES = {
  nomina: { label: 'Nómina', icon: PersonIcon, color: '#E91E63' },
  suplementos: { label: 'Suplementos', icon: AttachMoneyIcon, color: '#FF9800' },
  servicios: { label: 'Servicios', icon: BusinessIcon, color: '#2196F3' },
  mantenimiento: { label: 'Mantenimiento', icon: BuildIcon, color: '#9C27B0' },
  limpieza: { label: 'Limpieza', icon: CleaningIcon, color: '#4CAF50' },
  marketing: { label: 'Marketing', icon: CampaignIcon, color: '#FF5722' },
  equipamiento: { label: 'Equipamiento', icon: ComputerIcon, color: '#607D8B' },
  otros: { label: 'Otros', icon: CategoryIcon, color: '#795548' }
} as const;

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

export default function ExpensesHistoryPage() {
  const router = useRouter();

  // ✅ ESTADOS
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseDetail | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseDetail | null>(null);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const itemsPerPage = 10;

  // Filtros
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    dateFrom: null,
    dateTo: null,
    expenseType: 'all',
    status: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  // Estadísticas
  const [stats, setStats] = useState<Stats>({
    totalExpenses: 0,
    totalAmount: 0,
    avgAmount: 0,
    categoriesBreakdown: {}
  });

  // ✅ FUNCIONES
  const loadExpenses = async () => {
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
      if (filters.expenseType !== 'all') params.append('expenseType', filters.expenseType);
      if (filters.status !== 'all') params.append('status', filters.status);

      console.log('💸 Cargando historial de egresos:', params.toString());
      console.log('📅 Timestamp:', new Date().toISOString());
      console.log('🕐 Hora México:', new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }));
      console.log('👤 Usuario actual: luishdz04');

      const response = await fetch(`/api/expenses/history?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        // ✅ VALIDACIÓN ROBUSTA DE DATOS
        const validExpenses = (data.expenses || [])
          .filter((expense: any) => expense && expense.id)
          .map((expense: any) => ({
            ...expense,
            amount: typeof expense.amount === 'number' ? expense.amount : parseFloat(expense.amount || '0'),
            creator_name: expense.creator_name || 'luishdz04'
          }));

        const validStats: Stats = {
          totalExpenses: data.stats?.totalExpenses || 0,
          totalAmount: data.stats?.totalAmount || 0,
          avgAmount: data.stats?.avgAmount || 0,
          categoriesBreakdown: data.stats?.categoriesBreakdown || {}
        };

        setExpenses(validExpenses);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalExpenses(data.pagination?.total || 0);
        setStats(validStats);
        
        console.log('✅ Historial cargado:', validExpenses.length, 'egresos válidos');
      } else {
        setError(data.error || 'Error al cargar el historial');
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
      setError('Error al cargar el historial de egresos');
    } finally {
      setLoading(false);
    }
  };

  const loadExpenseDetail = async (expenseId: string) => {
    try {
      setLoadingDetail(true);
      console.log('🔍 Cargando detalle del egreso:', expenseId);

      const response = await fetch(`/api/expenses/${expenseId}`);
      const data = await response.json();

      if (data.success) {
        setSelectedExpense(data.expense);
        setDetailDialogOpen(true);
        console.log('✅ Detalle cargado:', data.expense);
      } else {
        setError(data.error || 'Error al cargar el detalle del egreso');
      }
    } catch (error) {
      console.error('Error cargando detalle:', error);
      setError('Error al cargar el detalle del egreso');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleFilterChange = (field: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPage(1);
  };

  const handleSearch = () => {
    setPage(1);
    loadExpenses();
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      dateFrom: null,
      dateTo: null,
      expenseType: 'all',
      status: 'all',
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
    setPage(1);
  };

  const exportExpenses = async () => {
    try {
      console.log('📄 Exportando egresos...');
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString().split('T')[0]);
      if (filters.dateTo) params.append('dateTo', filters.dateTo.toISOString().split('T')[0]);
      if (filters.expenseType !== 'all') params.append('expenseType', filters.expenseType);
      if (filters.status !== 'all') params.append('status', filters.status);

      const response = await fetch(`/api/expenses/export?${params.toString()}`);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `egresos_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exportando:', error);
      setError('Error al exportar los datos');
    }
  };

  const exportExpense = async (expenseId: string) => {
    try {
      console.log('📄 Exportando egreso individual:', expenseId);
      const response = await fetch(`/api/expenses/${expenseId}/export`);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `egreso_${expenseId.slice(0, 8)}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exportando egreso:', error);
      setError('Error al exportar el egreso');
    }
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;
    
    try {
      setLoadingDelete(true);
      console.log('🗑️ Eliminando egreso:', expenseToDelete);
      
      const response = await fetch(`/api/expenses/${expenseToDelete}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setExpenses(expenses.filter(expense => expense.id !== expenseToDelete));
        setDeleteDialogOpen(false);
        setExpenseToDelete(null);
        loadExpenses();
      } else {
        setError(data.error || 'Error al eliminar el egreso');
      }
    } catch (error) {
      console.error('Error eliminando egreso:', error);
      setError('Error al eliminar el egreso');
    } finally {
      setLoadingDelete(false);
    }
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense) return;
    
    try {
      setLoadingUpdate(true);
      console.log('✏️ Actualizando egreso:', editingExpense.id);
      
      const response = await fetch(`/api/expenses/${editingExpense.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notes: editingExpense.notes,
          amount: editingExpense.amount,
          status: editingExpense.status,
          description: editingExpense.description
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setEditDialogOpen(false);
        setEditingExpense(null);
        loadExpenses();
      } else {
        setError(data.error || 'Error al actualizar el egreso');
      }
    } catch (error) {
      console.error('Error actualizando egreso:', error);
      setError('Error al actualizar el egreso');
    } finally {
      setLoadingUpdate(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadExpenses();
    setRefreshing(false);
  };

  // ✅ EFFECTS
  useEffect(() => {
    loadExpenses();
  }, [page, filters.sortBy, filters.sortOrder]);

  // ✅ FUNCIONES DE STATUS SEGURAS
  const getStatusColor = (status: string) => {
    if (!status) return darkProTokens.textSecondary;
    
    switch (status.toLowerCase()) {
      case 'active':
      case 'completed':
        return darkProTokens.success;
      case 'pending':
        return darkProTokens.warning;
      case 'cancelled':
        return darkProTokens.error;
      default:
        return darkProTokens.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    if (!status) return InfoIcon;
    
    switch (status.toLowerCase()) {
      case 'active':
      case 'completed':
        return CheckCircleIcon;
      case 'pending':
        return ScheduleIcon;
      case 'cancelled':
        return CancelIcon;
      default:
        return InfoIcon;
    }
  };

  const getStatusLabel = (status: string) => {
    if (!status) return 'Sin estado';
    
    switch (status.toLowerCase()) {
      case 'active':
        return 'Activo';
      case 'completed':
        return 'Completado';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  // ✅ FUNCIÓN MEJORADA getCategoryInfo
  const getCategoryInfo = (type: string) => {
    if (!type || typeof type !== 'string') {
      return {
        label: 'Otros',
        icon: CategoryIcon,
        color: '#795548'
      };
    }
    
    const normalizedType = type.toLowerCase().trim() as keyof typeof EXPENSE_TYPES;
    const categoryData = EXPENSE_TYPES[normalizedType];
    
    if (!categoryData) {
      return {
        label: 'Otros',
        icon: CategoryIcon,
        color: '#795548'
      };
    }
    
    return {
      label: categoryData.label,
      icon: categoryData.icon,
      color: categoryData.color
    };
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
              onClick={() => router.push('/dashboard/admin/egresos')}
              sx={{ 
                color: darkProTokens.textSecondary,
                '&:hover': { color: darkProTokens.primary }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            
            <Avatar sx={{ 
              bgcolor: darkProTokens.error, 
              width: 60, 
              height: 60 
            }}>
              <MoneyOffIcon sx={{ fontSize: 32 }} />
            </Avatar>
            
            <Box>
              <Typography variant="h3" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>
                Historial de Egresos
              </Typography>
              <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }}>
                💸 Gestión y análisis de todos los gastos registrados
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
              onClick={exportExpenses}
              sx={{
                borderColor: darkProTokens.error,
                color: darkProTokens.error,
                '&:hover': {
                  borderColor: darkProTokens.errorHover,
                  backgroundColor: `${darkProTokens.error}20`
                }
              }}
            >
              Exportar Todo
            </Button>
          </Box>
        </Box>

        {/* ESTADÍSTICAS - MUI MODERNO CON size */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
              border: `2px solid ${darkProTokens.error}40`,
              borderRadius: 3
            }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Avatar sx={{ 
                  bgcolor: darkProTokens.error, 
                  width: 48, 
                  height: 48,
                  mx: 'auto',
                  mb: 2 
                }}>
                  <MoneyOffIcon />
                </Avatar>
                <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.error }}>
                  {stats.totalExpenses}
                </Typography>
                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                  Total Egresos
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
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
                  <TrendingDownIcon />
                </Avatar>
                <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.warning }}>
                  {formatPrice(stats.totalAmount)}
                </Typography>
                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                  Total Gastado
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
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
                  <AssessmentIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="bold" sx={{ color: darkProTokens.info }}>
                  {formatPrice(stats.avgAmount)}
                </Typography>
                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                  Promedio por Egreso
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
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
                  <CategoryIcon />
                </Avatar>
                <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.primary }}>
                  {Object.keys(stats.categoriesBreakdown).length}
                </Typography>
                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                  Categorías Activas
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* DESGLOSE POR CATEGORÍAS - MUI MODERNO CON size */}
        {Object.keys(stats.categoriesBreakdown).length > 0 && (
          <Card sx={{
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `2px solid ${darkProTokens.primary}40`,
            borderRadius: 4,
            mb: 4
          }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ color: darkProTokens.primary, mb: 3 }}>
                📊 Desglose por Categorías
              </Typography>
              
              <Grid container spacing={2}>
                {Object.entries(stats.categoriesBreakdown)
                  .filter(([category, data]) => category && data && data.count > 0)
                  .map(([category, data]) => {
                    const categoryInfo = getCategoryInfo(category);
                    const IconComponent = categoryInfo.icon;
                    
                    return (
                      <Grid size={{ xs: 12, md: 4, lg: 3 }} key={category}>
                        <Paper sx={{
                          p: 2,
                          backgroundColor: darkProTokens.surfaceLevel4,
                          borderRadius: 2,
                          border: `1px solid ${categoryInfo.color}40`
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Avatar sx={{ 
                              bgcolor: categoryInfo.color, 
                              width: 32, 
                              height: 32 
                            }}>
                              <IconComponent fontSize="small" />
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {categoryInfo.label}
                            </Typography>
                          </Box>
                          <Typography variant="h6" sx={{ color: categoryInfo.color, fontWeight: 'bold' }}>
                            {formatPrice(data.amount || 0)}
                          </Typography>
                          <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                            {data.count || 0} egreso{(data.count || 0) === 1 ? '' : 's'}
                          </Typography>
                        </Paper>
                      </Grid>
                    );
                  })
                }
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* FILTROS - MUI MODERNO CON size */}
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
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  label="Buscar"
                  placeholder="Descripción, recibo, notas..."
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

              <Grid size={{ xs: 12, md: 2 }}>
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

              <Grid size={{ xs: 12, md: 2 }}>
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

              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: darkProTokens.textSecondary }}>Categoría</InputLabel>
                  <Select
                    value={filters.expenseType}
                    onChange={(e) => handleFilterChange('expenseType', e.target.value)}
                    sx={{
                      backgroundColor: darkProTokens.surfaceLevel4,
                      color: darkProTokens.textPrimary,
                    }}
                  >
                    <MenuItem value="all">Todas</MenuItem>
                    {Object.entries(EXPENSE_TYPES).map(([key, value]) => {
                      const IconComponent = value.icon;
                      return (
                        <MenuItem key={key} value={key}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconComponent 
                              fontSize="small" 
                              sx={{ color: value.color }}
                            />
                            {value.label}
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 2 }}>
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
                    <MenuItem value="active">Activo</MenuItem>
                    <MenuItem value="completed">Completado</MenuItem>
                    <MenuItem value="pending">Pendiente</MenuItem>
                    <MenuItem value="cancelled">Cancelado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 1 }}>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    onClick={handleSearch}
                    sx={{
                      backgroundColor: darkProTokens.error,
                      color: darkProTokens.textPrimary,
                      '&:hover': {
                        backgroundColor: darkProTokens.errorHover
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

        {/* TABLA DE EGRESOS */}
        <Card sx={{
          background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
          border: `2px solid ${darkProTokens.error}40`,
          borderRadius: 4
        }}>
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <CircularProgress size={60} sx={{ color: darkProTokens.error }} />
              </Box>
            ) : error ? (
              <Box sx={{ p: 4 }}>
                <Alert severity="error">{error}</Alert>
              </Box>
            ) : expenses.length === 0 ? (
              <Box sx={{ p: 8, textAlign: 'center' }}>
                <MoneyOffIcon sx={{ fontSize: 80, color: darkProTokens.textDisabled, mb: 2 }} />
                <Typography variant="h5" sx={{ color: darkProTokens.textDisabled, mb: 1 }}>
                  No hay egresos registrados
                </Typography>
                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                  Los egresos aparecerán aquí una vez que sean creados
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ backgroundColor: darkProTokens.grayDark, color: darkProTokens.textPrimary, fontWeight: 'bold' }}>
                          Fecha
                        </TableCell>
                        <TableCell sx={{ backgroundColor: darkProTokens.grayDark, color: darkProTokens.textPrimary, fontWeight: 'bold' }}>
                          Categoría
                        </TableCell>
                        <TableCell sx={{ backgroundColor: darkProTokens.grayDark, color: darkProTokens.textPrimary, fontWeight: 'bold' }}>
                          Descripción
                        </TableCell>
                        <TableCell sx={{ backgroundColor: darkProTokens.grayDark, color: darkProTokens.textPrimary, fontWeight: 'bold' }}>
                          Monto
                        </TableCell>
                        <TableCell sx={{ backgroundColor: darkProTokens.grayDark, color: darkProTokens.textPrimary, fontWeight: 'bold' }}>
                          Recibo
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
                      {expenses
                        .filter(expense => expense && expense.id)
                        .map((expense) => {
                          const categoryInfo = getCategoryInfo(expense.expense_type);
                          const StatusIcon = getStatusIcon(expense.status);
                          const IconComponent = categoryInfo.icon;
                          
                          return (
                            <TableRow 
                              key={expense.id}
                              sx={{ 
                                '&:nth-of-type(odd)': { 
                                  backgroundColor: darkProTokens.surfaceLevel3 
                                },
                                '&:hover': {
                                  backgroundColor: `${darkProTokens.error}10`
                                }
                              }}
                            >
                              <TableCell sx={{ color: darkProTokens.textSecondary }}>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {formatDateLocal(expense.expense_date)}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: darkProTokens.textDisabled }}>
                                    {formatDateTime(expense.expense_time)}
                                  </Typography>
                                </Box>
                              </TableCell>
                              
                              <TableCell>
                                <Chip
                                  icon={<IconComponent fontSize="small" />}
                                  label={categoryInfo.label}
                                  size="small"
                                  sx={{
                                    backgroundColor: `${categoryInfo.color}20`,
                                    color: categoryInfo.color,
                                    fontWeight: 600
                                  }}
                                />
                              </TableCell>
                              
                              <TableCell sx={{ color: darkProTokens.textPrimary }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {expense.description}
                                </Typography>
                                {expense.notes && (
                                  <Typography variant="caption" sx={{ color: darkProTokens.textDisabled }}>
                                    📝 {expense.notes.substring(0, 50)}{expense.notes.length > 50 ? '...' : ''}
                                  </Typography>
                                )}
                              </TableCell>
                              
                              <TableCell sx={{ color: darkProTokens.error, fontWeight: 'bold' }}>
                                {formatPrice(expense.amount)}
                              </TableCell>
                              
                              <TableCell sx={{ color: darkProTokens.textSecondary }}>
                                {expense.receipt_number ? (
                                  <Chip
                                    label={expense.receipt_number}
                                    size="small"
                                    sx={{
                                      backgroundColor: `${darkProTokens.info}20`,
                                      color: darkProTokens.info,
                                      fontWeight: 600,
                                      fontFamily: 'monospace'
                                    }}
                                  />
                                ) : (
                                  <Typography variant="caption" sx={{ color: darkProTokens.textDisabled }}>
                                    Sin recibo
                                  </Typography>
                                )}
                              </TableCell>
                              
                              <TableCell>
                                <Chip
                                  icon={<StatusIcon fontSize="small" />}
                                  label={getStatusLabel(expense.status)}
                                  size="small"
                                  sx={{
                                    backgroundColor: `${getStatusColor(expense.status)}20`,
                                    color: getStatusColor(expense.status),
                                    fontWeight: 600
                                  }}
                                />
                              </TableCell>
                              
                              <TableCell sx={{ color: darkProTokens.textSecondary }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <PersonIcon sx={{ fontSize: 16 }} />
                                  <Typography variant="body2">
                                    {expense.creator_name || 'luishdz04'}
                                  </Typography>
                                </Box>
                              </TableCell>
                              
                              <TableCell>
                                <Stack direction="row" spacing={1}>
                                  <Tooltip title="Ver detalle">
                                    <IconButton
                                      size="small"
                                      onClick={() => loadExpenseDetail(expense.id)}
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
                                      onClick={() => exportExpense(expense.id)}
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
                                        setEditingExpense(expense as ExpenseDetail);
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
                                        setExpenseToDelete(expense.id);
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
                          );
                        })
                      }
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
                          backgroundColor: darkProTokens.error,
                          color: darkProTokens.textPrimary,
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
              <Avatar sx={{ bgcolor: darkProTokens.error }}>
                <MoneyOffIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Detalle del Egreso
                </Typography>
                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                  {selectedExpense && formatDateLocal(selectedExpense.expense_date)}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setDetailDialogOpen(false)}>
              <CloseIcon sx={{ color: darkProTokens.textSecondary }} />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ p: 4 }}>
            {selectedExpense && (
              <Grid container spacing={4}>
                {/* INFORMACIÓN PRINCIPAL */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card sx={{
                    backgroundColor: darkProTokens.surfaceLevel3,
                    border: `1px solid ${darkProTokens.grayMedium}`,
                    borderRadius: 3
                  }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: darkProTokens.error, mb: 3 }}>
                        💸 Información del Egreso
                      </Typography>
                      
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                            Fecha del Egreso:
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: darkProTokens.textPrimary }}>
                            {formatDateLocal(selectedExpense.expense_date)}
                          </Typography>
                          <Typography variant="caption" sx={{ color: darkProTokens.textDisabled }}>
                            {formatDateTime(selectedExpense.expense_time)}
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                            Categoría:
                          </Typography>
                          <Box sx={{ mt: 0.5 }}>
                            {(() => {
                              const categoryInfo = getCategoryInfo(selectedExpense.expense_type);
                              const IconComponent = categoryInfo.icon;
                              return (
                                <Chip
                                  icon={<IconComponent fontSize="small" />}
                                  label={categoryInfo.label}
                                  sx={{
                                    backgroundColor: `${categoryInfo.color}20`,
                                    color: categoryInfo.color,
                                    fontWeight: 600
                                  }}
                                />
                              );
                            })()}
                          </Box>
                        </Box>
                        
                        <Box>
                          <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                            Descripción:
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: darkProTokens.textPrimary }}>
                            {selectedExpense.description}
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                            Monto:
                          </Typography>
                          <Typography variant="h4" sx={{ color: darkProTokens.error, fontWeight: 'bold' }}>
                            {formatPrice(selectedExpense.amount)}
                          </Typography>
                        </Box>
                        
                        {selectedExpense.receipt_number && (
                          <Box>
                            <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                              Número de Recibo:
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600, fontFamily: 'monospace', color: darkProTokens.textPrimary }}>
                              {selectedExpense.receipt_number}
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* INFORMACIÓN ADICIONAL */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card sx={{
                    backgroundColor: darkProTokens.surfaceLevel3,
                    border: `1px solid ${darkProTokens.grayMedium}`,
                    borderRadius: 3
                  }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: darkProTokens.info, mb: 3 }}>
                        📋 Información Adicional
                      </Typography>
                      
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                            Estado:
                          </Typography>
                          <Box sx={{ mt: 0.5 }}>
                            {(() => {
                              const StatusIcon = getStatusIcon(selectedExpense.status);
                              return (
                                <Chip
                                  icon={<StatusIcon fontSize="small" />}
                                  label={getStatusLabel(selectedExpense.status)}
                                  sx={{
                                    backgroundColor: `${getStatusColor(selectedExpense.status)}20`,
                                    color: getStatusColor(selectedExpense.status),
                                    fontWeight: 600
                                  }}
                                />
                              );
                            })()}
                          </Box>
                        </Box>
                        
                        <Box>
                          <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                            Responsable:
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: darkProTokens.textPrimary }}>
                            {selectedExpense.creator_name || 'luishdz04'}
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                            Creado:
                          </Typography>
                          <Typography variant="body2" sx={{ color: darkProTokens.textPrimary }}>
                            {formatDateTime(selectedExpense.created_at)}
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                            Actualizado:
                          </Typography>
                          <Typography variant="body2" sx={{ color: darkProTokens.textPrimary }}>
                            {formatDateTime(selectedExpense.updated_at)}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* NOTAS */}
                {selectedExpense.notes && (
                  <Grid size={{ xs: 12 }}>
                    <Card sx={{
                      backgroundColor: darkProTokens.surfaceLevel3,
                      border: `1px solid ${darkProTokens.grayMedium}`,
                      borderRadius: 3
                    }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ color: darkProTokens.warning, mb: 2 }}>
                          📝 Notas Adicionales
                        </Typography>
                        <Typography variant="body1" sx={{ 
                          backgroundColor: darkProTokens.surfaceLevel4,
                          p: 2,
                          borderRadius: 2,
                          borderLeft: `4px solid ${darkProTokens.warning}`,
                          color: darkProTokens.textPrimary
                        }}>
                          {selectedExpense.notes}
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
              ¿Estás seguro de que deseas eliminar este egreso?
            </Typography>
            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
              Esta acción no se puede deshacer. Se eliminarán todos los datos asociados a este egreso.
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
              onClick={handleDeleteExpense}
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
                Editar Egreso
              </Typography>
            </Box>
            <IconButton onClick={() => setEditDialogOpen(false)}>
              <CloseIcon sx={{ color: darkProTokens.textSecondary }} />
            </IconButton>
          </DialogTitle>
          
          <DialogContent sx={{ p: 4 }}>
            {editingExpense && (
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Descripción"
                  value={editingExpense.description}
                  onChange={(e) => setEditingExpense({
                    ...editingExpense,
                    description: e.target.value
                  })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: darkProTokens.surfaceLevel4,
                      color: darkProTokens.textPrimary,
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label="Monto"
                  type="number"
                  value={editingExpense.amount}
                  onChange={(e) => setEditingExpense({
                    ...editingExpense,
                    amount: parseFloat(e.target.value) || 0
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
                    value={editingExpense.status}
                    onChange={(e) => setEditingExpense({
                      ...editingExpense,
                      status: e.target.value
                    })}
                    sx={{
                      backgroundColor: darkProTokens.surfaceLevel4,
                      color: darkProTokens.textPrimary,
                    }}
                  >
                    <MenuItem value="active">Activo</MenuItem>
                    <MenuItem value="completed">Completado</MenuItem>
                    <MenuItem value="pending">Pendiente</MenuItem>
                    <MenuItem value="cancelled">Cancelado</MenuItem>
                  </Select>
                </FormControl>
                
                <TextField
                  fullWidth
                  label="Notas / Observaciones"
                  multiline
                  rows={4}
                  value={editingExpense.notes || ''}
                  onChange={(e) => setEditingExpense({
                    ...editingExpense,
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
              onClick={handleUpdateExpense}
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