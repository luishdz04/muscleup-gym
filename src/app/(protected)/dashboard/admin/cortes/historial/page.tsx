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
  Divider,
  Checkbox,
  Tabs,
  Tab
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
import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { useUserTracking } from '@/hooks/useUserTracking';
import { useNotifications } from '@/hooks/useNotifications';
import { formatCurrency } from '@/utils/formHelpers';
import { formatDateLong, formatMexicoTime } from '@/utils/dateUtils';

const formatPrice = (amount: number): string => formatCurrency(Number.isFinite(amount) ? amount : 0);

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
  pos_mixto?: number;
  abonos_efectivo: number;
  abonos_transferencia: number;
  abonos_debito: number;
  abonos_credito: number;
  abonos_mixto?: number;
  membership_efectivo: number;
  membership_transferencia: number;
  membership_debito: number;
  membership_credito: number;
  membership_mixto?: number;
  total_efectivo: number;
  total_transferencia: number;
  total_debito: number;
  total_credito: number;
  total_mixto?: number;
  pos_transactions: number;
  abonos_transactions: number;
  membership_transactions: number;
  pos_commissions?: number;
  abonos_commissions?: number;
  membership_commissions?: number;
  total_commissions?: number;
  net_amount?: number;
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

function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return formatMexicoTime(date);
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

const parseAmount = (value: any): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const parseCount = (value: any): number => {
  const numeric = Number.parseInt(value, 10);
  return Number.isFinite(numeric) ? numeric : 0;
};

const recalculateCutMetrics = (cut: CutDetail): CutDetail => {
  const pos_efectivo = parseAmount(cut.pos_efectivo);
  const pos_transferencia = parseAmount(cut.pos_transferencia);
  const pos_debito = parseAmount(cut.pos_debito);
  const pos_credito = parseAmount(cut.pos_credito);
  const pos_mixto = parseAmount(cut.pos_mixto);

  const abonos_efectivo = parseAmount(cut.abonos_efectivo);
  const abonos_transferencia = parseAmount(cut.abonos_transferencia);
  const abonos_debito = parseAmount(cut.abonos_debito);
  const abonos_credito = parseAmount(cut.abonos_credito);
  const abonos_mixto = parseAmount(cut.abonos_mixto);

  const membership_efectivo = parseAmount(cut.membership_efectivo);
  const membership_transferencia = parseAmount(cut.membership_transferencia);
  const membership_debito = parseAmount(cut.membership_debito);
  const membership_credito = parseAmount(cut.membership_credito);
  const membership_mixto = parseAmount(cut.membership_mixto);

  const expenses_amount = parseAmount(cut.expenses_amount);

  const pos_total = pos_efectivo + pos_transferencia + pos_debito + pos_credito + pos_mixto;
  const abonos_total = abonos_efectivo + abonos_transferencia + abonos_debito + abonos_credito + abonos_mixto;
  const membership_total = membership_efectivo + membership_transferencia + membership_debito + membership_credito + membership_mixto;

  const total_efectivo = pos_efectivo + abonos_efectivo + membership_efectivo;
  const total_transferencia = pos_transferencia + abonos_transferencia + membership_transferencia;
  const total_debito = pos_debito + abonos_debito + membership_debito;
  const total_credito = pos_credito + abonos_credito + membership_credito;
  const total_mixto = pos_mixto + abonos_mixto + membership_mixto;

  const pos_transactions = parseCount(cut.pos_transactions);
  const abonos_transactions = parseCount(cut.abonos_transactions);
  const membership_transactions = parseCount(cut.membership_transactions);
  const total_transactions = pos_transactions + abonos_transactions + membership_transactions;

  const pos_commissions = parseAmount(cut.pos_commissions);
  const abonos_commissions = parseAmount(cut.abonos_commissions);
  const membership_commissions = parseAmount(cut.membership_commissions);
  const total_commissions = pos_commissions + abonos_commissions + membership_commissions;

  const grand_total = pos_total + abonos_total + membership_total;
  const final_balance = grand_total - expenses_amount;
  const net_amount = final_balance;

  return {
    ...cut,
    pos_efectivo,
    pos_transferencia,
    pos_debito,
    pos_credito,
    pos_mixto,
    abonos_efectivo,
    abonos_transferencia,
    abonos_debito,
    abonos_credito,
    abonos_mixto,
    membership_efectivo,
    membership_transferencia,
    membership_debito,
    membership_credito,
    membership_mixto,
    expenses_amount,
    pos_total,
    abonos_total,
    membership_total,
    total_efectivo,
    total_transferencia,
    total_debito,
    total_credito,
    total_mixto,
    pos_transactions,
    abonos_transactions,
    membership_transactions,
    total_transactions,
    pos_commissions,
    abonos_commissions,
    membership_commissions,
    total_commissions,
    grand_total,
    final_balance,
    net_amount
  };
};

const buildUpdatePayload = (cut: CutDetail) => {
  const recalculated = recalculateCutMetrics(cut);

  return {
    notes: recalculated.notes ?? null,
    status: recalculated.status,
    expenses_amount: recalculated.expenses_amount,
    pos_efectivo: recalculated.pos_efectivo,
    pos_transferencia: recalculated.pos_transferencia,
    pos_debito: recalculated.pos_debito,
    pos_credito: recalculated.pos_credito,
    pos_mixto: recalculated.pos_mixto ?? 0,
    pos_total: recalculated.pos_total,
    pos_transactions: recalculated.pos_transactions,
    pos_commissions: recalculated.pos_commissions ?? 0,
    abonos_efectivo: recalculated.abonos_efectivo,
    abonos_transferencia: recalculated.abonos_transferencia,
    abonos_debito: recalculated.abonos_debito,
    abonos_credito: recalculated.abonos_credito,
    abonos_mixto: recalculated.abonos_mixto ?? 0,
    abonos_total: recalculated.abonos_total,
    abonos_transactions: recalculated.abonos_transactions,
    abonos_commissions: recalculated.abonos_commissions ?? 0,
    membership_efectivo: recalculated.membership_efectivo,
    membership_transferencia: recalculated.membership_transferencia,
    membership_debito: recalculated.membership_debito,
    membership_credito: recalculated.membership_credito,
    membership_mixto: recalculated.membership_mixto ?? 0,
    membership_total: recalculated.membership_total,
    membership_transactions: recalculated.membership_transactions,
    membership_commissions: recalculated.membership_commissions ?? 0,
    total_efectivo: recalculated.total_efectivo,
    total_transferencia: recalculated.total_transferencia,
    total_debito: recalculated.total_debito,
    total_credito: recalculated.total_credito,
    total_mixto: recalculated.total_mixto ?? 0,
    total_transactions: recalculated.total_transactions,
    total_commissions: recalculated.total_commissions ?? 0,
    grand_total: recalculated.grand_total,
    final_balance: recalculated.final_balance,
    net_amount: recalculated.net_amount ?? recalculated.final_balance
  };
};

export default function CutsHistoryPage() {
  const router = useRouter();
  const isHydrated = useHydrated();
  useUserTracking();
  const { toast } = useNotifications();

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
  const [loadingEditData, setLoadingEditData] = useState(false);
  const [editingLoadingId, setEditingLoadingId] = useState<string | null>(null);
  const [selectedCuts, setSelectedCuts] = useState<string[]>([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [loadingBulkDelete, setLoadingBulkDelete] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editTabValue, setEditTabValue] = useState(0);
  const [realExpensesAmount, setRealExpensesAmount] = useState<number | null>(null);
  const [loadingRealExpenses, setLoadingRealExpenses] = useState(false);

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
  const loadCuts = async (overrideFilters?: FilterState, overridePage?: number) => {
    try {
      setLoading(true);
      setError(null);

      const activeFilters = overrideFilters ?? filters;
      const activePage = overridePage ?? page;

      const params = new URLSearchParams();
      params.append('page', activePage.toString());
      params.append('limit', itemsPerPage.toString());
      params.append('sortBy', activeFilters.sortBy);
      params.append('sortOrder', activeFilters.sortOrder);

      if (activeFilters.search) params.append('search', activeFilters.search);
      if (activeFilters.dateFrom) params.append('dateFrom', activeFilters.dateFrom.toISOString().split('T')[0]);
      if (activeFilters.dateTo) params.append('dateTo', activeFilters.dateTo.toISOString().split('T')[0]);
      if (activeFilters.status !== 'all') params.append('status', activeFilters.status);
      if (activeFilters.isManual !== 'all') params.append('isManual', activeFilters.isManual);



      const response = await fetch(`/api/cuts/history?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setCuts(data.cuts || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCuts(data.pagination?.total || 0);
        setStats(prev => data.stats || prev);

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


      const response = await fetch(`/api/cuts/${cutId}`);
      const data = await response.json();

      if (data.success) {
        setSelectedCut(recalculateCutMetrics(data.cut));
        setDetailDialogOpen(true);

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

  const openCutForEditing = async (cutId: string) => {
    try {
      setLoadingEditData(true);
      setEditingLoadingId(cutId);

      const response = await fetch(`/api/cuts/${cutId}`);
      const data = await response.json();

      if (data.success) {
        const cut = recalculateCutMetrics(data.cut);
        setEditingCut(cut);
        setEditDialogOpen(true);
        
        // Cargar los gastos reales del día para verificar sincronización
        loadRealExpenses(cut.cut_date);
      } else {
        setError(data.error || 'Error al cargar el corte para edición');
      }
    } catch (error) {
      console.error('Error cargando corte para edición:', error);
      setError('Error al cargar el corte para edición');
    } finally {
      setLoadingEditData(false);
      setEditingLoadingId(null);
    }
  };

  const loadRealExpenses = async (cutDate: string) => {
    try {
      setLoadingRealExpenses(true);
      const response = await fetch(`/api/expenses/daily?date=${cutDate}`);
      const data = await response.json();
      
      if (data.success) {
        setRealExpensesAmount(data.totalAmount || 0);
      } else {
        setRealExpensesAmount(null);
      }
    } catch (error) {
      console.error('Error cargando gastos reales:', error);
      setRealExpensesAmount(null);
    } finally {
      setLoadingRealExpenses(false);
    }
  };

  const syncExpensesWithReal = () => {
    if (editingCut && realExpensesAmount !== null) {
      setEditingCut({
        ...editingCut,
        expenses_amount: realExpensesAmount
      });
      toast.success('Gastos sincronizados con los registros reales');
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
    loadCuts(filters, 1);
  };

  const clearFilters = () => {
    const defaultFilters: FilterState = {
      search: '',
      dateFrom: null,
      dateTo: null,
      status: 'all',
      isManual: 'all',
      sortBy: 'created_at',
      sortOrder: 'desc'
    };
    setFilters(defaultFilters);
    setPage(1);
    loadCuts(defaultFilters, 1);
  };

  const exportCuts = async () => {
    try {

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

      
      const response = await fetch(`/api/cuts/${cutToDelete}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCuts(cuts.filter(cut => cut.id !== cutToDelete));
        setDeleteDialogOpen(false);
        setCutToDelete(null);
        setSelectedCuts(prev => prev.filter(id => id !== cutToDelete));
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

      const payload = buildUpdatePayload(editingCut);

      
      const response = await fetch(`/api/cuts/${editingCut.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setEditDialogOpen(false);
        setEditingCut(null);
        toast.success('Corte actualizado correctamente');
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

  const toggleCutSelection = (cutId: string) => {
    setSelectedCuts(prev => prev.includes(cutId)
      ? prev.filter(id => id !== cutId)
      : [...prev, cutId]);
  };

  const handleSelectAllCuts = (checked: boolean) => {
    if (checked) {
      setSelectedCuts(cuts.map(cut => cut.id));
    } else {
      setSelectedCuts([]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCuts.length === 0) return;

    try {
      setLoadingBulkDelete(true);

      const response = await fetch('/api/cuts/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: selectedCuts })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Se eliminaron ${selectedCuts.length} cortes`);
        setBulkDeleteDialogOpen(false);
        setSelectedCuts([]);
        loadCuts();
      } else {
        setError(data.error || 'Error al eliminar cortes seleccionados');
      }
    } catch (error) {
      console.error('Error eliminando cortes seleccionados:', error);
      setError('Error al eliminar cortes seleccionados');
    } finally {
      setLoadingBulkDelete(false);
    }
  };

  const applyQuickFilter = (field: keyof FilterState, value: any) => {
    const nextFilters = {
      ...filters,
      [field]: value
    } as FilterState;

    setFilters(nextFilters);
    setPage(1);
    loadCuts(nextFilters, 1);
  };

  // ✅ EFFECTS
  useEffect(() => {
    loadCuts();
  }, [page, filters.sortBy, filters.sortOrder]);

  useEffect(() => {
    setSelectedCuts(prev => prev.filter(id => cuts.some(cut => cut.id === id)));
  }, [cuts]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return colorTokens.warning;
      case 'closed':
        return colorTokens.success;
      case 'edited':
        return colorTokens.info;
      default:
        return colorTokens.textSecondary;
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

  const allSelected = cuts.length > 0 && selectedCuts.length === cuts.length;
  const someSelected = selectedCuts.length > 0 && !allSelected;
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box sx={{ 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.surfaceLevel1})`,
        color: colorTokens.textPrimary,
        p: 4
      }}>
        {/* HEADER */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={() => router.push('/dashboard/admin/cortes')}
              sx={{ 
                color: colorTokens.textSecondary,
                '&:hover': { color: colorTokens.brand }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            
            <Avatar sx={{ 
              bgcolor: colorTokens.brand, 
              width: 60, 
              height: 60 
            }}>
              <AssessmentIcon sx={{ fontSize: 32 }} />
            </Avatar>
            
            <Box>
              <Typography variant="h3" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                Historial de Cortes
              </Typography>
              <Typography variant="h6" sx={{ color: colorTokens.textSecondary }}>
                📊 Gestión y análisis de todos los cortes de caja
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={refreshing ? <CircularProgress size={20} sx={{ color: colorTokens.neutral0 }} /> : <RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{
                backgroundColor: colorTokens.info,
                color: colorTokens.neutral0,
                '&:hover': {
                  backgroundColor: colorTokens.infoHover
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
                borderColor: colorTokens.brand,
                color: colorTokens.brand,
                '&:hover': {
                  borderColor: colorTokens.brandHover,
                  backgroundColor: `${colorTokens.brand}20`
                }
              }}
            >
              Exportar Todo
            </Button>
            <Button
              variant="contained"
              startIcon={<DeleteIcon />}
              disabled={selectedCuts.length === 0}
              onClick={() => setBulkDeleteDialogOpen(true)}
              sx={{
                backgroundColor: colorTokens.danger,
                color: colorTokens.neutral0,
                '&:hover': {
                  backgroundColor: colorTokens.dangerHover
                },
                opacity: selectedCuts.length === 0 ? 0.7 : 1
              }}
            >
              Eliminar Seleccionados ({selectedCuts.length})
            </Button>
          </Box>
        </Box>

        {/* ESTADÍSTICAS */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
              border: `2px solid ${colorTokens.brand}40`,
              borderRadius: 3
            }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Avatar sx={{ 
                  bgcolor: colorTokens.brand, 
                  width: 48, 
                  height: 48,
                  mx: 'auto',
                  mb: 2 
                }}>
                  <ReceiptIcon />
                </Avatar>
                <Typography variant="h4" fontWeight="bold" sx={{ color: colorTokens.brand }}>
                  {stats.totalCuts}
                </Typography>
                <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                  Total Cortes
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
              border: `2px solid ${colorTokens.success}40`,
              borderRadius: 3
            }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Avatar sx={{ 
                  bgcolor: colorTokens.success, 
                  width: 48, 
                  height: 48,
                  mx: 'auto',
                  mb: 2 
                }}>
                  <AttachMoneyIcon />
                </Avatar>
                <Typography variant="h5" fontWeight="bold" sx={{ color: colorTokens.success }}>
                  {formatPrice(stats.totalAmount)}
                </Typography>
                <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                  Total Acumulado
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
              border: `2px solid ${colorTokens.info}40`,
              borderRadius: 3
            }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Avatar sx={{ 
                  bgcolor: colorTokens.info, 
                  width: 48, 
                  height: 48,
                  mx: 'auto',
                  mb: 2 
                }}>
                  <TrendingUpIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.info }}>
                  {formatPrice(stats.avgAmount)}
                </Typography>
                <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                  Promedio por Corte
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
              border: `2px solid ${colorTokens.success}40`,
              borderRadius: 3
            }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Avatar sx={{ 
                  bgcolor: colorTokens.success, 
                  width: 48, 
                  height: 48,
                  mx: 'auto',
                  mb: 2 
                }}>
                  <AutoModeIcon />
                </Avatar>
                <Typography variant="h4" fontWeight="bold" sx={{ color: colorTokens.success }}>
                  {stats.automaticCuts}
                </Typography>
                <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                  Automáticos
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
              border: `2px solid ${colorTokens.warning}40`,
              borderRadius: 3
            }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Avatar sx={{ 
                  bgcolor: colorTokens.warning, 
                  width: 48, 
                  height: 48,
                  mx: 'auto',
                  mb: 2 
                }}>
                  <BuildIcon />
                </Avatar>
                <Typography variant="h4" fontWeight="bold" sx={{ color: colorTokens.warning }}>
                  {stats.manualCuts}
                </Typography>
                <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                  Manuales
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* FILTROS */}
        <Card sx={{
          background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
          border: `2px solid ${colorTokens.info}40`,
          borderRadius: 4,
          mb: 4
        }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <FilterListIcon sx={{ color: colorTokens.info }} />
              <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.info }}>
                Filtros de Búsqueda
              </Typography>
            </Box>

            <Grid container spacing={2} rowSpacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
                <TextField
                  fullWidth
                  label="Buscar"
                  placeholder="Número de corte, responsable..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: colorTokens.textSecondary }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: colorTokens.neutral300,
                      color: colorTokens.textPrimary,
                      borderRadius: 2,
                    },
                    '& .MuiInputLabel-root': {
                      color: colorTokens.textSecondary
                    }
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
                <DatePicker
                  label="Fecha Desde"
                  value={filters.dateFrom}
                  onChange={(date) => handleFilterChange('dateFrom', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: colorTokens.neutral300,
                          color: colorTokens.textPrimary,
                          borderRadius: 2,
                        },
                        '& .MuiInputLabel-root': {
                          color: colorTokens.textSecondary
                        }
                      }
                    }
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
                <DatePicker
                  label="Fecha Hasta"
                  value={filters.dateTo}
                  onChange={(date) => handleFilterChange('dateTo', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: colorTokens.neutral300,
                          color: colorTokens.textPrimary,
                          borderRadius: 2,
                        },
                        '& .MuiInputLabel-root': {
                          color: colorTokens.textSecondary
                        }
                      }
                    }
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
                <FormControl fullWidth sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: colorTokens.neutral300,
                    color: colorTokens.textPrimary,
                    borderRadius: 2,
                  }
                }}>
                  <InputLabel sx={{ color: colorTokens.textSecondary }}>Ordenar por</InputLabel>
                  <Select
                    value={filters.sortBy}
                    label="Ordenar por"
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  >
                    <MenuItem value="created_at">Fecha creación</MenuItem>
                    <MenuItem value="cut_date">Fecha del corte</MenuItem>
                    <MenuItem value="grand_total">Total bruto</MenuItem>
                    <MenuItem value="final_balance">Balance final</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
                <FormControl fullWidth sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: colorTokens.neutral300,
                    color: colorTokens.textPrimary,
                    borderRadius: 2,
                  }
                }}>
                  <InputLabel sx={{ color: colorTokens.textSecondary }}>Orden</InputLabel>
                  <Select
                    value={filters.sortOrder}
                    label="Orden"
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  >
                    <MenuItem value="desc">Descendente</MenuItem>
                    <MenuItem value="asc">Ascendente</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
                <FormControl fullWidth sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: colorTokens.neutral300,
                    color: colorTokens.textPrimary,
                    borderRadius: 2,
                  }
                }}>
                  <InputLabel sx={{ color: colorTokens.textSecondary }}>Estado</InputLabel>
                  <Select
                    value={filters.status}
                    label="Estado"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="open">Abierto</MenuItem>
                    <MenuItem value="closed">Cerrado</MenuItem>
                    <MenuItem value="edited">Editado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
                <FormControl fullWidth sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: colorTokens.neutral300,
                    color: colorTokens.textPrimary,
                    borderRadius: 2,
                  }
                }}>
                  <InputLabel sx={{ color: colorTokens.textSecondary }}>Tipo</InputLabel>
                  <Select
                    value={filters.isManual}
                    label="Tipo"
                    onChange={(e) => handleFilterChange('isManual', e.target.value)}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="true">Manual</MenuItem>
                    <MenuItem value="false">Automático</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, lg: 4 }} sx={{ display: 'flex', justifyContent: { xs: 'stretch', lg: 'flex-end' } }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  sx={{ width: '100%' }}
                >
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleSearch}
                    sx={{
                      backgroundColor: colorTokens.brand,
                      color: colorTokens.neutral0,
                      '&:hover': {
                        backgroundColor: colorTokens.brandHover
                      }
                    }}
                  >
                    Buscar
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={clearFilters}
                    sx={{
                      borderColor: colorTokens.textSecondary,
                      color: colorTokens.textSecondary,
                      '&:hover': {
                        borderColor: colorTokens.textSecondary,
                        backgroundColor: `${colorTokens.textSecondary}20`
                      }
                    }}
                  >
                    Limpiar
                  </Button>
                </Stack>
              </Grid>
            </Grid>

            <Divider sx={{ mt: 3, mb: 2, borderColor: colorTokens.neutral500 }} />

            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              useFlexGap
            >
              {[
                {
                  field: 'status' as const,
                  value: 'open',
                  label: 'Ver abiertos',
                  icon: <ScheduleIcon />,
                  color: colorTokens.warning
                },
                {
                  field: 'status' as const,
                  value: 'closed',
                  label: 'Ver cerrados',
                  icon: <CheckCircleIcon />,
                  color: colorTokens.success
                },
                {
                  field: 'status' as const,
                  value: 'edited',
                  label: 'Solo editados',
                  icon: <EditIcon />,
                  color: colorTokens.info
                },
                {
                  field: 'isManual' as const,
                  value: 'true',
                  label: 'Cortes manuales',
                  icon: <BuildIcon />,
                  color: colorTokens.warning
                },
                {
                  field: 'isManual' as const,
                  value: 'false',
                  label: 'Cortes automáticos',
                  icon: <AutoModeIcon />,
                  color: colorTokens.success
                }
              ].map((chip) => {
                const isActive = (chip.field === 'status' ? filters.status : filters.isManual) === chip.value;
                return (
                  <Chip
                    key={`${chip.field}-${chip.value}`}
                    icon={chip.icon}
                    label={chip.label}
                    clickable
                    onClick={() => applyQuickFilter(chip.field, chip.value)}
                    variant={isActive ? 'filled' : 'outlined'}
                    sx={{
                      borderColor: chip.color,
                      color: chip.color,
                      backgroundColor: isActive ? `${chip.color}25` : 'transparent',
                      '& .MuiChip-icon': {
                        color: chip.color
                      },
                      '&:hover': {
                        backgroundColor: `${chip.color}25`
                      }
                    }}
                  />
                );
              })}
            </Stack>
          </CardContent>
        </Card>

        {/* TABLA DE CORTES */}
        <Card sx={{
          background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
          border: `2px solid ${colorTokens.brand}40`,
          borderRadius: 4
        }}>
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <CircularProgress size={60} sx={{ color: colorTokens.brand }} />
              </Box>
            ) : error ? (
              <Box sx={{ p: 4 }}>
                <Alert severity="error">{error}</Alert>
              </Box>
            ) : cuts.length === 0 ? (
              <Box sx={{ p: 8, textAlign: 'center' }}>
                <ReceiptIcon sx={{ fontSize: 80, color: colorTokens.textDisabled, mb: 2 }} />
                <Typography variant="h5" sx={{ color: colorTokens.textDisabled, mb: 1 }}>
                  No hay cortes registrados
                </Typography>
                <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                  Los cortes aparecerán aquí una vez que sean creados
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          padding="checkbox"
                          sx={{ backgroundColor: colorTokens.neutral400 }}
                        >
                          <Checkbox
                            color="primary"
                            indeterminate={someSelected}
                            checked={allSelected}
                            onChange={(event) => handleSelectAllCuts(event.target.checked)}
                            sx={{
                              color: colorTokens.textSecondary,
                              '&.Mui-checked': {
                                color: colorTokens.brand
                              }
                            }}
                            inputProps={{ 'aria-label': 'Seleccionar todos los cortes' }}
                          />
                        </TableCell>
                        <TableCell sx={{ backgroundColor: colorTokens.neutral400, color: colorTokens.textPrimary, fontWeight: 'bold' }}>
                          #Corte
                        </TableCell>
                        <TableCell sx={{ backgroundColor: colorTokens.neutral400, color: colorTokens.textPrimary, fontWeight: 'bold' }}>
                          Fecha
                        </TableCell>
                        <TableCell sx={{ backgroundColor: colorTokens.neutral400, color: colorTokens.textPrimary, fontWeight: 'bold' }}>
                          Total Bruto
                        </TableCell>
                        <TableCell sx={{ backgroundColor: colorTokens.neutral400, color: colorTokens.textPrimary, fontWeight: 'bold' }}>
                          Gastos
                        </TableCell>
                        <TableCell sx={{ backgroundColor: colorTokens.neutral400, color: colorTokens.textPrimary, fontWeight: 'bold' }}>
                          Balance Final
                        </TableCell>
                        <TableCell sx={{ backgroundColor: colorTokens.neutral400, color: colorTokens.textPrimary, fontWeight: 'bold' }}>
                          Tipo
                        </TableCell>
                        <TableCell sx={{ backgroundColor: colorTokens.neutral400, color: colorTokens.textPrimary, fontWeight: 'bold' }}>
                          Estado
                        </TableCell>
                        <TableCell sx={{ backgroundColor: colorTokens.neutral400, color: colorTokens.textPrimary, fontWeight: 'bold' }}>
                          Responsable
                        </TableCell>
                        <TableCell sx={{ backgroundColor: colorTokens.neutral400, color: colorTokens.textPrimary, fontWeight: 'bold' }}>
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
                              backgroundColor: colorTokens.surfaceLevel3 
                            },
                            '&:hover': {
                              backgroundColor: `${colorTokens.brand}10`
                            }
                          }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              color="primary"
                              checked={selectedCuts.includes(cut.id)}
                              onChange={() => toggleCutSelection(cut.id)}
                              sx={{
                                color: colorTokens.textSecondary,
                                '&.Mui-checked': {
                                  color: colorTokens.brand
                                }
                              }}
                              inputProps={{ 'aria-label': `Seleccionar corte ${cut.cut_number}` }}
                            />
                          </TableCell>

                          <TableCell sx={{ color: colorTokens.textPrimary, fontFamily: 'monospace', fontWeight: 'bold' }}>
                            {cut.cut_number}
                          </TableCell>
                          
                          <TableCell sx={{ color: colorTokens.textSecondary }}>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {formatDateLocal(cut.cut_date)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: colorTokens.textDisabled }}>
                                {formatDateTime(cut.created_at)}
                              </Typography>
                            </Box>
                          </TableCell>
                          
                          <TableCell sx={{ color: colorTokens.success, fontWeight: 'bold' }}>
                            {formatPrice(cut.grand_total)}
                          </TableCell>
                          
                          <TableCell sx={{ color: colorTokens.danger, fontWeight: 'bold' }}>
                            -{formatPrice(cut.expenses_amount)}
                          </TableCell>
                          
                          <TableCell sx={{ 
                            color: cut.final_balance >= 0 ? colorTokens.success : colorTokens.danger, 
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
                                backgroundColor: cut.is_manual ? `${colorTokens.warning}20` : `${colorTokens.success}20`,
                                color: cut.is_manual ? colorTokens.warning : colorTokens.success,
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
                          
                          <TableCell sx={{ color: colorTokens.textSecondary }}>
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
                                    color: colorTokens.info,
                                    '&:hover': { 
                                      backgroundColor: `${colorTokens.info}20` 
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
                                    color: colorTokens.brand,
                                    '&:hover': { 
                                      backgroundColor: `${colorTokens.brand}20` 
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
                                    color: colorTokens.warning,
                                    '&:hover': { 
                                      backgroundColor: `${colorTokens.warning}20` 
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
                                    color: colorTokens.danger,
                                    '&:hover': { 
                                      backgroundColor: `${colorTokens.danger}20` 
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
                        color: colorTokens.textPrimary,
                        '&.Mui-selected': {
                          backgroundColor: colorTokens.brand,
                          color: colorTokens.neutral0,
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
              backgroundColor: colorTokens.surfaceLevel2,
              color: colorTokens.textPrimary,
              borderRadius: 4
            }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: `1px solid ${colorTokens.neutral500}`
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: colorTokens.brand }}>
                <ReceiptIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Detalle del Corte: {selectedCut?.cut_number}
                </Typography>
                <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                  {selectedCut && formatDateLocal(selectedCut.cut_date)}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setDetailDialogOpen(false)}>
              <CloseIcon sx={{ color: colorTokens.textSecondary }} />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ p: 4 }}>
            {selectedCut && (
              <Grid container spacing={4}>
                {/* INFORMACIÓN GENERAL */}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card sx={{
                    backgroundColor: colorTokens.surfaceLevel3,
                    border: `1px solid ${colorTokens.neutral500}`,
                    borderRadius: 3
                  }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: colorTokens.brand, mb: 2 }}>
                        📋 Información General
                      </Typography>
                      
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                            Número de Corte:
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, fontFamily: 'monospace', color: colorTokens.textPrimary }}>
                            {selectedCut.cut_number}
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                            Fecha del Corte:
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: colorTokens.textPrimary }}>
                            {formatDateLocal(selectedCut.cut_date)}
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                            Tipo:
                          </Typography>
                          <Chip
                            icon={selectedCut.is_manual ? <BuildIcon /> : <AutoModeIcon />}
                            label={selectedCut.is_manual ? 'Manual' : 'Automático'}
                            size="small"
                            sx={{
                              backgroundColor: selectedCut.is_manual ? `${colorTokens.warning}20` : `${colorTokens.success}20`,
                              color: selectedCut.is_manual ? colorTokens.warning : colorTokens.success,
                              fontWeight: 600,
                              mt: 0.5
                            }}
                          />
                        </Box>
                        
                        <Box>
                          <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                            Total de Transacciones:
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: colorTokens.textPrimary }}>
                            {selectedCut.total_transactions}
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                            Responsable:
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: colorTokens.textPrimary }}>
                            {selectedCut.creator_name || 'Usuario'}
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                            Creado:
                          </Typography>
                          <Typography variant="body2" sx={{ color: colorTokens.textPrimary }}>
                            {formatDateTime(selectedCut.created_at)}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* RESUMEN FINANCIERO */}
                <Grid size={{ xs: 12, sm: 12, md: 8 }}>
                  <Card sx={{
                    backgroundColor: colorTokens.surfaceLevel3,
                    border: `1px solid ${colorTokens.neutral500}`,
                    borderRadius: 3
                  }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: colorTokens.success, mb: 3 }}>
                        💰 Resumen Financiero
                      </Typography>
                      
                      <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            backgroundColor: colorTokens.neutral300,
                            borderRadius: 2
                          }}>
                            <Typography variant="h4" sx={{ color: colorTokens.info, fontWeight: 'bold' }}>
                              {formatPrice(selectedCut.pos_total)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                              Punto de Venta
                            </Typography>
                          </Paper>
                        </Grid>
                        
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            backgroundColor: colorTokens.neutral300,
                            borderRadius: 2
                          }}>
                            <Typography variant="h4" sx={{ color: colorTokens.warning, fontWeight: 'bold' }}>
                              {formatPrice(selectedCut.abonos_total)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                              Abonos / Apartados
                            </Typography>
                          </Paper>
                        </Grid>
                        
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            backgroundColor: colorTokens.neutral300,
                            borderRadius: 2
                          }}>
                            <Typography variant="h4" sx={{ color: colorTokens.success, fontWeight: 'bold' }}>
                              {formatPrice(selectedCut.membership_total)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                              Membresías
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>
                      
                      <Divider sx={{ my: 3, backgroundColor: colorTokens.neutral500 }} />
                      
                      <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h5" sx={{ color: colorTokens.brand, fontWeight: 'bold' }}>
                              {formatPrice(selectedCut.total_efectivo)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                              Efectivo
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid size={{ xs: 12, md: 3 }}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h5" sx={{ color: colorTokens.info, fontWeight: 'bold' }}>
                              {formatPrice(selectedCut.total_transferencia)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                              Transferencia
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid size={{ xs: 12, md: 3 }}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h5" sx={{ color: colorTokens.success, fontWeight: 'bold' }}>
                              {formatPrice(selectedCut.total_debito)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                              Tarjeta Débito
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid size={{ xs: 12, md: 3 }}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h5" sx={{ color: colorTokens.danger, fontWeight: 'bold' }}>
                              {formatPrice(selectedCut.total_credito)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                              Tarjeta Crédito
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                      
                      <Divider sx={{ my: 3, backgroundColor: colorTokens.neutral500 }} />
                      
                      <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" sx={{ color: colorTokens.brand, fontWeight: 'bold' }}>
                              {formatPrice(selectedCut.grand_total)}
                            </Typography>
                            <Typography variant="body1" sx={{ color: colorTokens.textSecondary, fontWeight: 600 }}>
                              Total Bruto
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" sx={{ color: colorTokens.danger, fontWeight: 'bold' }}>
                              -{formatPrice(selectedCut.expenses_amount)}
                            </Typography>
                            <Typography variant="body1" sx={{ color: colorTokens.textSecondary, fontWeight: 600 }}>
                              Gastos del Día
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" sx={{ 
                              color: selectedCut.final_balance >= 0 ? colorTokens.success : colorTokens.danger, 
                              fontWeight: 'bold' 
                            }}>
                              {formatPrice(selectedCut.final_balance)}
                            </Typography>
                            <Typography variant="body1" sx={{ color: colorTokens.textSecondary, fontWeight: 600 }}>
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
                  <Grid size={{ xs: 12 }}>
                    <Card sx={{
                      backgroundColor: colorTokens.surfaceLevel3,
                      border: `1px solid ${colorTokens.neutral500}`,
                      borderRadius: 3
                    }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ color: colorTokens.warning, mb: 2 }}>
                          📝 Observaciones
                        </Typography>
                        <Typography variant="body1" sx={{ 
                          backgroundColor: colorTokens.neutral300,
                          p: 2,
                          borderRadius: 2,
                          borderLeft: `4px solid ${colorTokens.warning}`,
                          color: colorTokens.textPrimary
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

          <DialogActions sx={{ p: 3, borderTop: `1px solid ${colorTokens.neutral500}` }}>
            <Button
              onClick={() => setDetailDialogOpen(false)}
              sx={{ 
                color: colorTokens.textSecondary,
                '&:hover': {
                  backgroundColor: `${colorTokens.textSecondary}20`
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
              backgroundColor: colorTokens.surfaceLevel2,
              color: colorTokens.textPrimary,
              borderRadius: 4
            }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 2,
            borderBottom: `1px solid ${colorTokens.neutral500}`
          }}>
            <Avatar sx={{ bgcolor: colorTokens.danger }}>
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
            <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
              Esta acción no se puede deshacer. Se eliminarán todos los datos asociados a este corte.
            </Typography>
          </DialogContent>
          
          <DialogActions sx={{ p: 3, borderTop: `1px solid ${colorTokens.neutral500}` }}>
            <Button
              onClick={() => setDeleteDialogOpen(false)}
              sx={{ 
                color: colorTokens.textSecondary,
                '&:hover': {
                  backgroundColor: `${colorTokens.textSecondary}20`
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
                backgroundColor: colorTokens.danger,
                color: colorTokens.textPrimary,
                '&:hover': {
                  backgroundColor: colorTokens.dangerHover
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
          onClose={() => {
            setEditDialogOpen(false);
            setEditTabValue(0);
          }}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: colorTokens.surfaceLevel2,
              color: colorTokens.textPrimary,
              borderRadius: 4,
              maxHeight: '90vh'
            }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${colorTokens.neutral500}`,
            pb: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: colorTokens.warning }}>
                <EditIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Editar Corte: {editingCut?.cut_number}
                </Typography>
                <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                  {editingCut && formatDateLocal(editingCut.cut_date)}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => {
              setEditDialogOpen(false);
              setEditTabValue(0);
            }}>
              <CloseIcon sx={{ color: colorTokens.textSecondary }} />
            </IconButton>
          </DialogTitle>
          
          <Box sx={{ borderBottom: 1, borderColor: colorTokens.neutral500 }}>
            <Tabs 
              value={editTabValue} 
              onChange={(_, newValue) => setEditTabValue(newValue)}
              sx={{
                '& .MuiTab-root': {
                  color: colorTokens.textSecondary,
                  '&.Mui-selected': {
                    color: colorTokens.brand
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: colorTokens.brand
                }
              }}
            >
              <Tab label="💰 Punto de Venta" />
              <Tab label="💳 Abonos/Apartados" />
              <Tab label="🏋️ Membresías" />
              <Tab label="📝 Info General" />
            </Tabs>
          </Box>
          
          <DialogContent sx={{ p: 4, overflow: 'auto' }}>
            {editingCut && (
              <>
                {/* TAB 0: PUNTO DE VENTA */}
                {editTabValue === 0 && (
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="h6" sx={{ color: colorTokens.info, mb: 2 }}>
                        💰 Montos por Método de Pago - POS
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <TextField
                        fullWidth
                        label="Efectivo"
                        type="number"
                        value={editingCut.pos_efectivo}
                        onChange={(e) => setEditingCut({
                          ...editingCut,
                          pos_efectivo: parseFloat(e.target.value) || 0
                        })}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: colorTokens.neutral300,
                            color: colorTokens.textPrimary,
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <TextField
                        fullWidth
                        label="Transferencia"
                        type="number"
                        value={editingCut.pos_transferencia}
                        onChange={(e) => setEditingCut({
                          ...editingCut,
                          pos_transferencia: parseFloat(e.target.value) || 0
                        })}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: colorTokens.neutral300,
                            color: colorTokens.textPrimary,
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <TextField
                        fullWidth
                        label="Débito"
                        type="number"
                        value={editingCut.pos_debito}
                        onChange={(e) => setEditingCut({
                          ...editingCut,
                          pos_debito: parseFloat(e.target.value) || 0
                        })}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: colorTokens.neutral300,
                            color: colorTokens.textPrimary,
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <TextField
                        fullWidth
                        label="Crédito"
                        type="number"
                        value={editingCut.pos_credito}
                        onChange={(e) => setEditingCut({
                          ...editingCut,
                          pos_credito: parseFloat(e.target.value) || 0
                        })}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: colorTokens.neutral300,
                            color: colorTokens.textPrimary,
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="# Transacciones POS"
                        type="number"
                        value={editingCut.pos_transactions}
                        onChange={(e) => setEditingCut({
                          ...editingCut,
                          pos_transactions: parseInt(e.target.value) || 0
                        })}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: colorTokens.neutral300,
                            color: colorTokens.textPrimary,
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Paper sx={{ p: 2, bgcolor: colorTokens.neutral400, textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                          Total POS
                        </Typography>
                        <Typography variant="h5" sx={{ color: colorTokens.success, fontWeight: 'bold' }}>
                          {formatPrice(recalculateCutMetrics(editingCut).pos_total)}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                )}

                {/* TAB 1: ABONOS */}
                {editTabValue === 1 && (
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="h6" sx={{ color: colorTokens.warning, mb: 2 }}>
                        💳 Montos por Método de Pago - Abonos/Apartados
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <TextField
                        fullWidth
                        label="Efectivo"
                        type="number"
                        value={editingCut.abonos_efectivo}
                        onChange={(e) => setEditingCut({
                          ...editingCut,
                          abonos_efectivo: parseFloat(e.target.value) || 0
                        })}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: colorTokens.neutral300,
                            color: colorTokens.textPrimary,
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <TextField
                        fullWidth
                        label="Transferencia"
                        type="number"
                        value={editingCut.abonos_transferencia}
                        onChange={(e) => setEditingCut({
                          ...editingCut,
                          abonos_transferencia: parseFloat(e.target.value) || 0
                        })}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: colorTokens.neutral300,
                            color: colorTokens.textPrimary,
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <TextField
                        fullWidth
                        label="Débito"
                        type="number"
                        value={editingCut.abonos_debito}
                        onChange={(e) => setEditingCut({
                          ...editingCut,
                          abonos_debito: parseFloat(e.target.value) || 0
                        })}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: colorTokens.neutral300,
                            color: colorTokens.textPrimary,
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <TextField
                        fullWidth
                        label="Crédito"
                        type="number"
                        value={editingCut.abonos_credito}
                        onChange={(e) => setEditingCut({
                          ...editingCut,
                          abonos_credito: parseFloat(e.target.value) || 0
                        })}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: colorTokens.neutral300,
                            color: colorTokens.textPrimary,
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="# Transacciones Abonos"
                        type="number"
                        value={editingCut.abonos_transactions}
                        onChange={(e) => setEditingCut({
                          ...editingCut,
                          abonos_transactions: parseInt(e.target.value) || 0
                        })}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: colorTokens.neutral300,
                            color: colorTokens.textPrimary,
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Paper sx={{ p: 2, bgcolor: colorTokens.neutral400, textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                          Total Abonos
                        </Typography>
                        <Typography variant="h5" sx={{ color: colorTokens.warning, fontWeight: 'bold' }}>
                          {formatPrice(recalculateCutMetrics(editingCut).abonos_total)}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                )}

                {/* TAB 2: MEMBRESÍAS */}
                {editTabValue === 2 && (
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="h6" sx={{ color: colorTokens.success, mb: 2 }}>
                        🏋️ Montos por Método de Pago - Membresías
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <TextField
                        fullWidth
                        label="Efectivo"
                        type="number"
                        value={editingCut.membership_efectivo}
                        onChange={(e) => setEditingCut({
                          ...editingCut,
                          membership_efectivo: parseFloat(e.target.value) || 0
                        })}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: colorTokens.neutral300,
                            color: colorTokens.textPrimary,
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <TextField
                        fullWidth
                        label="Transferencia"
                        type="number"
                        value={editingCut.membership_transferencia}
                        onChange={(e) => setEditingCut({
                          ...editingCut,
                          membership_transferencia: parseFloat(e.target.value) || 0
                        })}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: colorTokens.neutral300,
                            color: colorTokens.textPrimary,
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <TextField
                        fullWidth
                        label="Débito"
                        type="number"
                        value={editingCut.membership_debito}
                        onChange={(e) => setEditingCut({
                          ...editingCut,
                          membership_debito: parseFloat(e.target.value) || 0
                        })}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: colorTokens.neutral300,
                            color: colorTokens.textPrimary,
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <TextField
                        fullWidth
                        label="Crédito"
                        type="number"
                        value={editingCut.membership_credito}
                        onChange={(e) => setEditingCut({
                          ...editingCut,
                          membership_credito: parseFloat(e.target.value) || 0
                        })}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: colorTokens.neutral300,
                            color: colorTokens.textPrimary,
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="# Transacciones Membresías"
                        type="number"
                        value={editingCut.membership_transactions}
                        onChange={(e) => setEditingCut({
                          ...editingCut,
                          membership_transactions: parseInt(e.target.value) || 0
                        })}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: colorTokens.neutral300,
                            color: colorTokens.textPrimary,
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Paper sx={{ p: 2, bgcolor: colorTokens.neutral400, textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                          Total Membresías
                        </Typography>
                        <Typography variant="h5" sx={{ color: colorTokens.success, fontWeight: 'bold' }}>
                          {formatPrice(recalculateCutMetrics(editingCut).membership_total)}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                )}

                {/* TAB 3: INFO GENERAL */}
                {editTabValue === 3 && (
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="h6" sx={{ color: colorTokens.brand, mb: 2 }}>
                        📝 Información General del Corte
                      </Typography>
                    </Grid>

                    {/* ALERTA DE SINCRONIZACIÓN */}
                    {realExpensesAmount !== null && Math.abs(editingCut.expenses_amount - realExpensesAmount) > 0.01 && (
                      <Grid size={{ xs: 12 }}>
                        <Alert 
                          severity="warning" 
                          sx={{ 
                            bgcolor: `${colorTokens.warning}15`,
                            borderLeft: `4px solid ${colorTokens.warning}`
                          }}
                          action={
                            <Button 
                              color="inherit" 
                              size="small"
                              onClick={syncExpensesWithReal}
                              sx={{ color: colorTokens.warning, fontWeight: 'bold' }}
                            >
                              Sincronizar
                            </Button>
                          }
                        >
                          <Typography variant="body2" fontWeight="bold" gutterBottom>
                            ⚠️ Desincronización Detectada
                          </Typography>
                          <Typography variant="body2">
                            El monto de gastos en el corte ({formatPrice(editingCut.expenses_amount)}) 
                            no coincide con los gastos reales registrados ese día ({formatPrice(realExpensesAmount)}).
                          </Typography>
                          <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                            Diferencia: {formatPrice(Math.abs(editingCut.expenses_amount - realExpensesAmount))}
                          </Typography>
                        </Alert>
                      </Grid>
                    )}

                    <Grid size={{ xs: 12, sm: 6 }}>
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
                        helperText={
                          realExpensesAmount !== null 
                            ? `Gastos reales registrados: ${formatPrice(realExpensesAmount)}`
                            : loadingRealExpenses 
                              ? 'Cargando gastos reales...'
                              : ''
                        }
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: colorTokens.neutral300,
                            color: colorTokens.textPrimary,
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel sx={{ color: colorTokens.textSecondary }}>Estado</InputLabel>
                        <Select
                          value={editingCut.status}
                          label="Estado"
                          onChange={(e) => setEditingCut({
                            ...editingCut,
                            status: e.target.value
                          })}
                          sx={{
                            backgroundColor: colorTokens.neutral300,
                            color: colorTokens.textPrimary,
                          }}
                        >
                          <MenuItem value="open">Abierto</MenuItem>
                          <MenuItem value="closed">Cerrado</MenuItem>
                          <MenuItem value="edited">Editado</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
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
                            backgroundColor: colorTokens.neutral300,
                            color: colorTokens.textPrimary,
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Divider sx={{ my: 2, borderColor: colorTokens.neutral500 }} />
                      <Typography variant="h6" sx={{ color: colorTokens.brand, mb: 2 }}>
                        💰 Resumen de Totales (Calculado Automáticamente)
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Paper sx={{ p: 2, bgcolor: colorTokens.neutral400, textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                          Total Bruto
                        </Typography>
                        <Typography variant="h6" sx={{ color: colorTokens.success, fontWeight: 'bold' }}>
                          {formatPrice(recalculateCutMetrics(editingCut).grand_total)}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Paper sx={{ p: 2, bgcolor: colorTokens.neutral400, textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                          Gastos
                        </Typography>
                        <Typography variant="h6" sx={{ color: colorTokens.danger, fontWeight: 'bold' }}>
                          {formatPrice(editingCut.expenses_amount)}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Paper sx={{ p: 2, bgcolor: colorTokens.neutral400, textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                          Balance Final
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          color: recalculateCutMetrics(editingCut).final_balance >= 0 ? colorTokens.success : colorTokens.danger, 
                          fontWeight: 'bold' 
                        }}>
                          {formatPrice(recalculateCutMetrics(editingCut).final_balance)}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Paper sx={{ p: 2, bgcolor: colorTokens.neutral400, textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                          Total Trans.
                        </Typography>
                        <Typography variant="h6" sx={{ color: colorTokens.info, fontWeight: 'bold' }}>
                          {recalculateCutMetrics(editingCut).total_transactions}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                )}
              </>
            )}
          </DialogContent>
          
          <DialogActions sx={{ p: 3, borderTop: `1px solid ${colorTokens.neutral500}` }}>
            <Button
              onClick={() => {
                setEditDialogOpen(false);
                setEditTabValue(0);
              }}
              sx={{ 
                color: colorTokens.textSecondary,
                '&:hover': {
                  backgroundColor: `${colorTokens.textSecondary}20`
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
                backgroundColor: colorTokens.brand,
                color: colorTokens.neutral0,
                '&:hover': {
                  backgroundColor: colorTokens.brandHover
                }
              }}
            >
              {loadingUpdate ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* DIALOG DE ELIMINACIÓN MASIVA */}
        <Dialog
          open={bulkDeleteDialogOpen}
          onClose={() => setBulkDeleteDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: colorTokens.surfaceLevel2,
              color: colorTokens.textPrimary,
              borderRadius: 4
            }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${colorTokens.neutral500}`
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: colorTokens.danger }}>
                <WarningIcon />
              </Avatar>
              <Typography variant="h6" fontWeight="bold">
                Eliminar Cortes Seleccionados
              </Typography>
            </Box>
            <IconButton onClick={() => setBulkDeleteDialogOpen(false)}>
              <CloseIcon sx={{ color: colorTokens.textSecondary }} />
            </IconButton>
          </DialogTitle>
          
          <DialogContent sx={{ p: 4 }}>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body1" fontWeight="bold" gutterBottom>
                ⚠️ Acción Irreversible
              </Typography>
              <Typography variant="body2">
                Estás a punto de eliminar <strong>{selectedCuts.length}</strong> corte(s) de forma permanente.
                Esta acción no se puede deshacer.
              </Typography>
            </Alert>
            
            <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
              Los siguientes cortes serán eliminados:
            </Typography>
            
            <Box sx={{ 
              mt: 2, 
              p: 2, 
              bgcolor: colorTokens.neutral400, 
              borderRadius: 2,
              maxHeight: 200,
              overflowY: 'auto'
            }}>
              {cuts
                .filter(cut => selectedCuts.includes(cut.id))
                .map(cut => (
                  <Box 
                    key={cut.id} 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 1,
                      borderBottom: `1px solid ${colorTokens.neutral500}`,
                      '&:last-child': {
                        borderBottom: 'none'
                      }
                    }}
                  >
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                      {cut.cut_number}
                    </Typography>
                    <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                      {formatDateLocal(cut.cut_date)}
                    </Typography>
                  </Box>
                ))
              }
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ p: 3, borderTop: `1px solid ${colorTokens.neutral500}` }}>
            <Button
              onClick={() => setBulkDeleteDialogOpen(false)}
              sx={{ 
                color: colorTokens.textSecondary,
                '&:hover': {
                  backgroundColor: `${colorTokens.textSecondary}20`
                }
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleBulkDelete}
              variant="contained"
              startIcon={loadingBulkDelete ? <CircularProgress size={20} /> : <DeleteIcon />}
              disabled={loadingBulkDelete}
              sx={{
                backgroundColor: colorTokens.danger,
                color: colorTokens.neutral0,
                '&:hover': {
                  backgroundColor: colorTokens.dangerHover
                }
              }}
            >
              {loadingBulkDelete ? 'Eliminando...' : `Eliminar ${selectedCuts.length} Corte(s)`}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}



