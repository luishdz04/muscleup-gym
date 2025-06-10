'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Autocomplete,
  InputAdornment,
  Stack,
  Tooltip,
  Badge,
  Divider,
  Menu,
  MenuItem as MenuItemComponent,
  MenuList,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// ✅ IMPORTS DE UTILIDADES DE FECHA CORREGIDAS
import {
  getMexicoToday,
  formatDateForDisplay,
  formatTimestampForDisplay,
  createTimestampForDB,
  getDaysBetweenMexicoDates,
  debugDateInfo
} from '@/lib/utils/dateUtils';

// Iconos principales
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import BlockIcon from '@mui/icons-material/Block';
import RefreshIcon from '@mui/icons-material/Refresh';
import GetAppIcon from '@mui/icons-material/GetApp';
import DateRangeIcon from '@mui/icons-material/DateRange';
import PersonIcon from '@mui/icons-material/Person';
import PaymentIcon from '@mui/icons-material/Payment';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import GroupIcon from '@mui/icons-material/Group';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';
import TimerIcon from '@mui/icons-material/Timer';

// Iconos adicionales para los modals
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';

// Interfaces
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Plan {
  id: string;
  name: string;
  description: string;
}

interface MembershipHistory {
  id: string;
  userid: string;
  planid: string;
  payment_type: string;
  amount_paid: number;
  inscription_amount: number;
  start_date: string;
  end_date: string | null;
  status: string;
  payment_method: string;
  payment_reference: string | null;
  discount_amount: number;
  coupon_code: string | null;
  subtotal: number;
  commission_rate: number;
  commission_amount: number;
  payment_received: number;
  payment_change: number;
  is_mixed_payment: boolean;
  is_renewal: boolean;
  skip_inscription: boolean;
  custom_commission_rate: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Datos relacionados
  user_name: string;
  user_email: string;
  plan_name: string;
}

interface Filters {
  searchTerm: string;
  status: string;
  paymentMethod: string;
  dateFrom: string;
  dateTo: string;
  planId: string;
  isRenewal: string;
}

const statusOptions = [
  { value: '', label: 'Todos los estados', color: '#808080', icon: '📋' },
  { value: 'active', label: 'Activa', color: '#4caf50', icon: '✅' },
  { value: 'expired', label: 'Vencida', color: '#f44336', icon: '❌' },
  { value: 'frozen', label: 'Congelada', color: '#2196f3', icon: '🧊' },
  { value: 'cancelled', label: 'Cancelada', color: '#9e9e9e', icon: '🚫' }
];

const paymentMethodOptions = [
  { value: '', label: 'Todos los métodos', icon: '💳' },
  { value: 'efectivo', label: 'Efectivo', icon: '💵' },
  { value: 'debito', label: 'Débito', icon: '💳' },
  { value: 'credito', label: 'Crédito', icon: '💳' },
  { value: 'transferencia', label: 'Transferencia', icon: '🏦' },
  { value: 'mixto', label: 'Mixto', icon: '🔄' }
];

export default function HistorialMembresiaPage() {
  const router = useRouter();
  
  // Estados principales
  const [memberships, setMemberships] = useState<MembershipHistory[]>([]);
  const [filteredMemberships, setFilteredMemberships] = useState<MembershipHistory[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Estados de paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estados de filtros
  const [filters, setFilters] = useState<Filters>({
    searchTerm: '',
    status: '',
    paymentMethod: '',
    dateFrom: '',
    dateTo: '',
    planId: '',
    isRenewal: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados de UI
  const [selectedMembership, setSelectedMembership] = useState<MembershipHistory | null>(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Estados adicionales para edición
  const [editData, setEditData] = useState<Partial<MembershipHistory>>({});
  const [editLoading, setEditLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    client: true,
    membership: true,
    payment: true,
    dates: true,
    notes: false
  });
  
  // Estados de estadísticas
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    frozen: 0,
    totalRevenue: 0,
    totalCommissions: 0
  });

  const supabase = createBrowserSupabaseClient();

  // Cargar datos iniciales
  useEffect(() => {
    loadMemberships();
    loadPlans();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    applyFilters();
  }, [memberships, filters]);

  // 📊 CARGAR MEMBRESÍAS CON DATOS RELACIONADOS
  const loadMemberships = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_memberships')
        .select(`
          *,
          Users!userid (firstName, lastName, email),
          membership_plans!planid (name, description)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Formatear datos
      const formattedData: MembershipHistory[] = (data || []).map(item => ({
        ...item,
        user_name: `${item.Users?.firstName || ''} ${item.Users?.lastName || ''}`.trim(),
        user_email: item.Users?.email || '',
        plan_name: item.membership_plans?.name || 'Plan Desconocido'
      }));

      setMemberships(formattedData);
      calculateStats(formattedData);
      
    } catch (err: any) {
      setError(`Error al cargar membresías: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 📊 CARGAR PLANES
  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('membership_plans')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setPlans(data || []);
      
    } catch (err: any) {
      console.error('Error al cargar planes:', err);
    }
  };

  // 📈 CALCULAR ESTADÍSTICAS
  const calculateStats = (data: MembershipHistory[]) => {
    const stats = {
      total: data.length,
      active: data.filter(m => m.status === 'active').length,
      expired: data.filter(m => m.status === 'expired').length,
      frozen: data.filter(m => m.status === 'frozen').length,
      totalRevenue: data.reduce((sum, m) => sum + (m.amount_paid || 0), 0),
      totalCommissions: data.reduce((sum, m) => sum + (m.commission_amount || 0), 0)
    };
    
    setStats(stats);
  };

  // ✅ APLICAR FILTROS - CORREGIDA CON MANEJO CORRECTO DE FECHAS
  const applyFilters = () => {
    let filtered = [...memberships];

    // Búsqueda por texto
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(m => 
        m.user_name.toLowerCase().includes(searchLower) ||
        m.user_email.toLowerCase().includes(searchLower) ||
        m.plan_name.toLowerCase().includes(searchLower) ||
        m.payment_reference?.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por estado
    if (filters.status) {
      filtered = filtered.filter(m => m.status === filters.status);
    }

    // Filtro por método de pago
    if (filters.paymentMethod) {
      filtered = filtered.filter(m => m.payment_method === filters.paymentMethod);
    }

    // Filtro por plan
    if (filters.planId) {
      filtered = filtered.filter(m => m.planid === filters.planId);
    }

    // Filtro por renovación
    if (filters.isRenewal) {
      const isRenewal = filters.isRenewal === 'true';
      filtered = filtered.filter(m => m.is_renewal === isRenewal);
    }

    // ✅ FILTRO POR FECHAS CORREGIDO CON OBJETOS DATE Y ZONA HORARIA MEXICANA
    if (filters.dateFrom) {
      const fromTime = new Date(`${filters.dateFrom}T00:00:00-06:00`).getTime();
      filtered = filtered.filter(m => {
        const membershipTime = new Date(`${m.start_date}T00:00:00-06:00`).getTime();
        return membershipTime >= fromTime;
      });
      console.log(`📅 Filtro desde: ${filters.dateFrom} (${filtered.length} resultados)`);
    }
    
    if (filters.dateTo) {
      const toTime = new Date(`${filters.dateTo}T23:59:59-06:00`).getTime();
      filtered = filtered.filter(m => {
        const membershipTime = new Date(`${m.start_date}T00:00:00-06:00`).getTime();
        return membershipTime <= toTime;
      });
      console.log(`📅 Filtro hasta: ${filters.dateTo} (${filtered.length} resultados)`);
    }

    setFilteredMemberships(filtered);
    calculateStats(filtered);
    setPage(0); // Reset pagination
    
    // ✅ DEBUG ADICIONAL
    if (filters.dateFrom || filters.dateTo) {
      debugDateInfo('Filtros de fecha aplicados', { 
        from: filters.dateFrom, 
        to: filters.dateTo, 
        results: filtered.length 
      });
    }
  };

  // ✅ FUNCIÓN PARA ACTUALIZAR MEMBRESÍA - CORREGIDA CON TIMESTAMPS
  const handleUpdateMembership = async () => {
    if (!selectedMembership || !editData) return;
    
    setEditLoading(true);
    try {
      // Validar datos requeridos
      if (editData.end_date && editData.start_date && editData.end_date <= editData.start_date) {
        setError('La fecha de fin debe ser posterior a la fecha de inicio');
        return;
      }

      if (editData.amount_paid && editData.amount_paid < 0) {
        setError('El monto no puede ser negativo');
        return;
      }

      // ✅ PREPARAR DATOS CON TIMESTAMP UTC CORRECTO
      const updateData = {
        ...editData,
        updated_at: createTimestampForDB() // ✅ UTC timestamp correcto
      };

      // Remover campos que no deben actualizarse directamente
      delete updateData.user_name;
      delete updateData.user_email;
      delete updateData.plan_name;
      delete updateData.created_at;

      console.log('📝 Actualizando membresía con timestamp UTC:', updateData.updated_at);

      const { error } = await supabase
        .from('user_memberships')
        .update(updateData)
        .eq('id', selectedMembership.id);

      if (error) throw error;

      console.log('✅ Membresía actualizada exitosamente:', selectedMembership.id);

      setSuccessMessage('Membresía actualizada exitosamente');
      setEditDialogOpen(false);
      setEditData({});
      loadMemberships(); // Recargar datos
      
    } catch (err: any) {
      setError(`Error al actualizar membresía: ${err.message}`);
    } finally {
      setEditLoading(false);
    }
  };

  // 🎯 FUNCIÓN PARA INICIALIZAR DATOS DE EDICIÓN
  const initializeEditData = (membership: MembershipHistory) => {
    setEditData({
      status: membership.status,
      start_date: membership.start_date,
      end_date: membership.end_date,
      amount_paid: membership.amount_paid,
      payment_method: membership.payment_method,
      payment_reference: membership.payment_reference,
      notes: membership.notes,
      commission_rate: membership.commission_rate,
      commission_amount: membership.commission_amount
    });
  };

  // 🔄 FUNCIÓN PARA ALTERNAR SECCIONES
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

// ✅ FUNCIÓN PARA CALCULAR DÍAS RESTANTES - CORREGIDA
const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return null;
    
    // ✅ USAR FUNCIÓN CORREGIDA EN DATEUTILS
    const todayMexico = getMexicoToday();
    const daysRemaining = getDaysBetweenMexicoDates(todayMexico, endDate);
    
    console.log(`📅 Días restantes calculados con utilidades CORREGIDAS: ${daysRemaining} (Hoy México: ${todayMexico}, Fin: ${endDate})`);
    
    // ✅ DEBUG ADICIONAL
    debugDateInfo('Cálculo días restantes CORREGIDO', { today: todayMexico, end: endDate, remaining: daysRemaining });
    
    return daysRemaining;
  };
  // 🎨 FUNCIÓN PARA FORMATEAR DURACIÓN
  const formatDuration = (startDate: string, endDate: string | null) => {
    if (!endDate) return 'Sin fecha de fin';
    
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59`);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) return `${diffDays} días`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses`;
    return `${Math.floor(diffDays / 365)} años`;
  };

  // 🎨 FORMATEAR PRECIO
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  // ✅ FORMATEAR FECHA - CORREGIDA CON UTILIDADES DE FECHA
  const formatDate = (dateString: string) => {
    try {
      return formatDateForDisplay(dateString);
    } catch (error) {
      console.warn('⚠️ Error al formatear fecha:', dateString, error);
      // Fallback a formato básico
      return new Date(dateString).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // 🎨 OBTENER COLOR DEL ESTADO
  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption?.color || '#808080';
  };

  // 🎨 OBTENER ICONO DEL ESTADO
  const getStatusIcon = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption?.icon || '📋';
  };

  // ✅ CAMBIAR ESTADO DE MEMBRESÍA - CORREGIDO CON TIMESTAMP
  const handleStatusChange = async (membership: MembershipHistory, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('user_memberships')
        .update({ 
          status: newStatus,
          updated_at: createTimestampForDB() // ✅ UTC timestamp correcto
        })
        .eq('id', membership.id);

      if (error) throw error;

      console.log(`✅ Estado cambiado a ${newStatus} con timestamp UTC`);
      setSuccessMessage(`Estado cambiado a ${newStatus}`);
      loadMemberships(); // Recargar datos
      
    } catch (err: any) {
      setError(`Error al cambiar estado: ${err.message}`);
    }
  };

  // 🗂️ LIMPIAR FILTROS
  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      status: '',
      paymentMethod: '',
      dateFrom: '',
      dateTo: '',
      planId: '',
      isRenewal: ''
    });
  };

  return (
    <Box sx={{ 
      p: 3, 
      background: 'linear-gradient(135deg, #000000, #1A1A1A)',
      minHeight: '100vh',
      color: '#FFFFFF'
    }}>
      {/* Header Enterprise */}
      <Paper sx={{
        p: 4,
        mb: 4,
        background: 'linear-gradient(135deg, rgba(51, 51, 51, 0.98), rgba(77, 77, 77, 0.95))',
        border: '2px solid rgba(255, 204, 0, 0.3)',
        borderRadius: 4,
        boxShadow: '0 8px 32px rgba(255, 204, 0, 0.1)'
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3
        }}>
          <Box>
            <Typography variant="h3" sx={{ 
              color: '#FFCC00', 
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 1
            }}>
              <HistoryIcon sx={{ fontSize: 50 }} />
              Historial de Membresías
            </Typography>
            <Typography variant="h6" sx={{ 
              color: '#CCCCCC',
              fontWeight: 300
            }}>
              Gestión Completa | Control Total de Pagos y Estados
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={2}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/dashboard/admin/membresias')}
              sx={{ 
                color: '#FFCC00',
                borderColor: 'rgba(255, 204, 0, 0.6)',
                px: 3,
                py: 1.5,
                borderRadius: 3,
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#FFE066',
                  backgroundColor: 'rgba(255, 204, 0, 0.1)',
                  transform: 'translateY(-2px)'
                }
              }}
              variant="outlined"
              size="large"
            >
              Dashboard
            </Button>
            
            <Button
              startIcon={<RefreshIcon />}
              onClick={loadMemberships}
              disabled={loading}
              sx={{
                background: 'linear-gradient(135deg, #FFCC00, #FFB300)',
                color: '#000000',
                fontWeight: 700,
                px: 3,
                py: 1.5,
                borderRadius: 3,
                '&:hover': {
                  background: 'linear-gradient(135deg, #FFE066, #FFCC00)',
                  transform: 'translateY(-2px)'
                }
              }}
              variant="contained"
              size="large"
            >
              Actualizar
            </Button>
          </Stack>
        </Box>

        {/* Estadísticas Dashboard */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
            <Card sx={{
              background: 'rgba(255, 204, 0, 0.1)',
              border: '1px solid rgba(255, 204, 0, 0.3)',
              borderRadius: 3
            }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <GroupIcon sx={{ color: '#FFCC00', fontSize: 30, mb: 1 }} />
                <Typography variant="h4" sx={{ color: '#FFCC00', fontWeight: 800 }}>
                  {stats.total}
                </Typography>
                <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                  Total Membresías
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
            <Card sx={{
              background: 'rgba(76, 175, 80, 0.1)',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              borderRadius: 3
            }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 30, mb: 1 }} />
                <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 800 }}>
                  {stats.active}
                </Typography>
                <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                  Activas
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
            <Card sx={{
              background: 'rgba(244, 67, 54, 0.1)',
              border: '1px solid rgba(244, 67, 54, 0.3)',
              borderRadius: 3
            }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <CancelIcon sx={{ color: '#f44336', fontSize: 30, mb: 1 }} />
                <Typography variant="h4" sx={{ color: '#f44336', fontWeight: 800 }}>
                  {stats.expired}
                </Typography>
                <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                  Vencidas
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
            <Card sx={{
              background: 'rgba(33, 150, 243, 0.1)',
              border: '1px solid rgba(33, 150, 243, 0.3)',
              borderRadius: 3
            }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <TimerIcon sx={{ color: '#2196f3', fontSize: 30, mb: 1 }} />
                <Typography variant="h4" sx={{ color: '#2196f3', fontWeight: 800 }}>
                  {stats.frozen}
                </Typography>
                <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                  Congeladas
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
            <Card sx={{
              background: 'rgba(255, 152, 0, 0.1)',
              border: '1px solid rgba(255, 152, 0, 0.3)',
              borderRadius: 3
            }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <AttachMoneyIcon sx={{ color: '#ff9800', fontSize: 30, mb: 1 }} />
                <Typography variant="h6" sx={{ color: '#ff9800', fontWeight: 800 }}>
                  {formatPrice(stats.totalRevenue)}
                </Typography>
                <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                  Ingresos
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
            <Card sx={{
              background: 'rgba(156, 39, 176, 0.1)',
              border: '1px solid rgba(156, 39, 176, 0.3)',
              borderRadius: 3
            }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <TrendingUpIcon sx={{ color: '#9c27b0', fontSize: 30, mb: 1 }} />
                <Typography variant="h6" sx={{ color: '#9c27b0', fontWeight: 800 }}>
                  {formatPrice(stats.totalCommissions)}
                </Typography>
                <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                  Comisiones
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Panel de Filtros */}
      <Card sx={{
        background: 'linear-gradient(135deg, rgba(51, 51, 51, 0.98), rgba(77, 77, 77, 0.95))',
        border: '1px solid rgba(255, 204, 0, 0.2)',
        borderRadius: 4,
        mb: 3
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: showFilters ? 3 : 0
          }}>
            <Typography variant="h6" sx={{ 
              color: '#FFCC00', 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <FilterListIcon />
              Filtros de Búsqueda
              {(filters.searchTerm || filters.status || filters.paymentMethod || filters.planId) && (
                <Badge 
                  badgeContent="●" 
                  color="primary"
                  sx={{ '& .MuiBadge-badge': { backgroundColor: '#FFCC00' } }}
                />
              )}
            </Typography>
            
            <Button
              onClick={() => setShowFilters(!showFilters)}
              sx={{ 
                color: '#FFCC00',
                fontWeight: 600
              }}
            >
              {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
            </Button>
          </Box>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Buscar"
                      value={filters.searchTerm}
                      onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                      placeholder="Cliente, email, plan, referencia..."
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: '#FFCC00' }} />
                          </InputAdornment>
                        ),
                        sx: {
                          color: '#FFFFFF',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 204, 0, 0.3)'
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#FFCC00'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#FFCC00'
                          }
                        }
                      }}
                      InputLabelProps={{
                        sx: { 
                          color: '#CCCCCC',
                          '&.Mui-focused': { color: '#FFCC00' }
                        }
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ 
                        color: '#CCCCCC',
                        '&.Mui-focused': { color: '#FFCC00' }
                      }}>
                        Estado
                      </InputLabel>
                      <Select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        sx={{
                          color: '#FFFFFF',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 204, 0, 0.3)'
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#FFCC00'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#FFCC00'
                          }
                        }}
                      >
                        {statusOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <span>{option.icon}</span>
                              <span>{option.label}</span>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, md: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ 
                        color: '#CCCCCC',
                        '&.Mui-focused': { color: '#FFCC00' }
                      }}>
                        Método de Pago
                      </InputLabel>
                      <Select
                        value={filters.paymentMethod}
                        onChange={(e) => setFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        sx={{
                          color: '#FFFFFF',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 204, 0, 0.3)'
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#FFCC00'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#FFCC00'
                          }
                        }}
                      >
                        {paymentMethodOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <span>{option.icon}</span>
                              <span>{option.label}</span>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, md: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ 
                        color: '#CCCCCC',
                        '&.Mui-focused': { color: '#FFCC00' }
                      }}>
                        Plan
                      </InputLabel>
                      <Select
                        value={filters.planId}
                        onChange={(e) => setFilters(prev => ({ ...prev, planId: e.target.value }))}
                        sx={{
                          color: '#FFFFFF',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 204, 0, 0.3)'
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#FFCC00'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#FFCC00'
                          }
                        }}
                      >
                        <MenuItem value="">
                          Todos los planes
                        </MenuItem>
                        {plans.map((plan) => (
                          <MenuItem key={plan.id} value={plan.id}>
                            {plan.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, md: 2 }}>
                    <Button
                      fullWidth
                      onClick={clearFilters}
                      sx={{
                        color: '#CCCCCC',
                        borderColor: 'rgba(204, 204, 204, 0.3)',
                        height: '56px',
                        '&:hover': {
                          borderColor: '#CCCCCC',
                          backgroundColor: 'rgba(204, 204, 204, 0.05)'
                        }
                      }}
                      variant="outlined"
                    >
                      Limpiar Filtros
                    </Button>
                  </Grid>
                </Grid>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Tabla de Membresías */}
      <Card sx={{
        background: 'linear-gradient(135deg, rgba(51, 51, 51, 0.98), rgba(77, 77, 77, 0.95))',
        border: '1px solid rgba(255, 204, 0, 0.2)',
        borderRadius: 4
      }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress sx={{ color: '#FFCC00' }} size={60} />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'rgba(255, 204, 0, 0.1)' }}>
                      <TableCell sx={{ color: '#FFCC00', fontWeight: 700, borderBottom: '1px solid rgba(255, 204, 0, 0.3)' }}>
                        Cliente
                      </TableCell>
                      <TableCell sx={{ color: '#FFCC00', fontWeight: 700, borderBottom: '1px solid rgba(255, 204, 0, 0.3)' }}>
                        Plan
                      </TableCell>
                      <TableCell sx={{ color: '#FFCC00', fontWeight: 700, borderBottom: '1px solid rgba(255, 204, 0, 0.3)' }}>
                        Estado
                      </TableCell>
                      <TableCell sx={{ color: '#FFCC00', fontWeight: 700, borderBottom: '1px solid rgba(255, 204, 0, 0.3)' }}>
                        Fechas
                      </TableCell>
                      <TableCell sx={{ color: '#FFCC00', fontWeight: 700, borderBottom: '1px solid rgba(255, 204, 0, 0.3)' }}>
                        Pago
                      </TableCell>
                      <TableCell sx={{ color: '#FFCC00', fontWeight: 700, borderBottom: '1px solid rgba(255, 204, 0, 0.3)' }}>
                        Total
                      </TableCell>
                      <TableCell sx={{ color: '#FFCC00', fontWeight: 700, borderBottom: '1px solid rgba(255, 204, 0, 0.3)', textAlign: 'center' }}>
                        Acciones
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredMemberships
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((membership) => (
                        <TableRow 
                          key={membership.id}
                          sx={{ 
                            '&:hover': { 
                              backgroundColor: 'rgba(255, 204, 0, 0.05)' 
                            },
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                          }}
                        >
                          <TableCell sx={{ color: '#FFFFFF', borderBottom: 'none' }}>
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {membership.user_name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#CCCCCC' }}>
                                {membership.user_email}
                              </Typography>
                              {membership.is_renewal && (
                                <Chip 
                                  label="🔄 Renovación" 
                                  size="small"
                                  sx={{
                                    backgroundColor: '#FFDD33',
                                    color: '#000000',
                                    fontWeight: 600,
                                    mt: 0.5,
                                    display: 'block',
                                    width: 'fit-content'
                                  }}
                                />
                              )}
                            </Box>
                          </TableCell>
                          
                          <TableCell sx={{ color: '#FFFFFF', borderBottom: 'none' }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {membership.plan_name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#CCCCCC' }}>
                              {membership.payment_type}
                            </Typography>
                          </TableCell>
                          
                          <TableCell sx={{ borderBottom: 'none' }}>
                            <Chip 
                              label={`${getStatusIcon(membership.status)} ${membership.status.toUpperCase()}`}
                              sx={{
                                backgroundColor: getStatusColor(membership.status),
                                color: '#FFFFFF',
                                fontWeight: 600
                              }}
                            />
                          </TableCell>
                          
                          <TableCell sx={{ color: '#FFFFFF', borderBottom: 'none' }}>
                            <Box>
                              <Typography variant="body2">
                                📅 {formatDate(membership.start_date)}
                              </Typography>
                              {membership.end_date && (
                                <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                  → {formatDate(membership.end_date)}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          
                          <TableCell sx={{ color: '#FFFFFF', borderBottom: 'none' }}>
                            <Box>
                              <Typography variant="body2">
                                {paymentMethodOptions.find(p => p.value === membership.payment_method)?.icon} {membership.payment_method}
                              </Typography>
                              {membership.payment_reference && (
                                <Typography variant="caption" sx={{ color: '#CCCCCC' }}>
                                  Ref: {membership.payment_reference}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          
                          <TableCell sx={{ color: '#FFFFFF', borderBottom: 'none' }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#FFCC00' }}>
                              {formatPrice(membership.amount_paid)}
                            </Typography>
                            {membership.commission_amount > 0 && (
                              <Typography variant="caption" sx={{ color: '#ff9800' }}>
                                Comisión: {formatPrice(membership.commission_amount)}
                              </Typography>
                            )}
                          </TableCell>
                          
                          <TableCell sx={{ borderBottom: 'none', textAlign: 'center' }}>
                            <Stack direction="row" spacing={1} justifyContent="center">
                              <Tooltip title="Ver Detalles">
                                <IconButton
                                  onClick={() => {
                                    setSelectedMembership(membership);
                                    setDetailsDialogOpen(true);
                                  }}
                                  sx={{ color: '#FFCC00' }}
                                >
                                  <VisibilityIcon />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Editar">
                                <IconButton
                                  onClick={() => {
                                    setSelectedMembership(membership);
                                    initializeEditData(membership);
                                    setEditDialogOpen(true);
                                  }}
                                  sx={{ color: '#2196f3' }}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Más Acciones">
                                <IconButton
                                  onClick={(e) => {
                                    setSelectedMembership(membership);
                                    setActionMenuAnchor(e.currentTarget);
                                  }}
                                  sx={{ color: '#CCCCCC' }}
                                >
                                  <MoreVertIcon />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={filteredMemberships.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(event, newPage) => setPage(newPage)}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(parseInt(event.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
                sx={{
                  color: '#FFFFFF',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  '& .MuiTablePagination-actions button': {
                    color: '#FFCC00'
                  },
                  '& .MuiTablePagination-select': {
                    color: '#FFFFFF'
                  }
                }}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) => 
                  `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                }
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Menu de Acciones */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={() => setActionMenuAnchor(null)}
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, rgba(51, 51, 51, 0.98), rgba(77, 77, 77, 0.95))',
            border: '1px solid rgba(255, 204, 0, 0.3)',
            borderRadius: 2
          }
        }}
      >
        <MenuList>
          {selectedMembership?.status === 'active' && (
            <>
              <MenuItemComponent 
                onClick={() => {
                  handleStatusChange(selectedMembership, 'frozen');
                  setActionMenuAnchor(null);
                }}
                sx={{ color: '#2196f3' }}
              >
                <ListItemIcon>
                  <PauseIcon sx={{ color: '#2196f3' }} />
                </ListItemIcon>
                <ListItemText>Congelar Membresía</ListItemText>
              </MenuItemComponent>
              
              <MenuItemComponent 
                onClick={() => {
                  handleStatusChange(selectedMembership, 'cancelled');
                  setActionMenuAnchor(null);
                }}
                sx={{ color: '#f44336' }}
              >
                <ListItemIcon>
                  <BlockIcon sx={{ color: '#f44336' }} />
                </ListItemIcon>
                <ListItemText>Cancelar Membresía</ListItemText>
              </MenuItemComponent>
            </>
          )}
          
          {selectedMembership?.status === 'frozen' && (
            <MenuItemComponent 
              onClick={() => {
                handleStatusChange(selectedMembership, 'active');
                setActionMenuAnchor(null);
              }}
              sx={{ color: '#4caf50' }}
            >
              <ListItemIcon>
                <PlayArrowIcon sx={{ color: '#4caf50' }} />
              </ListItemIcon>
              <ListItemText>Reactivar Membresía</ListItemText>
            </MenuItemComponent>
          )}
        </MenuList>
      </Menu>

      {/* 👁️ MODAL DE DETALLES */}
      <Dialog 
        open={detailsDialogOpen} 
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, rgba(51, 51, 51, 0.98), rgba(77, 77, 77, 0.95))',
            border: '2px solid rgba(255, 204, 0, 0.5)',
            borderRadius: 4,
            color: '#FFFFFF',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          color: '#FFCC00', 
          fontWeight: 800,
          fontSize: '1.8rem',
          textAlign: 'center',
          pb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ReceiptIcon sx={{ fontSize: 40 }} />
            Detalles de Membresía
          </Box>
          <IconButton 
            onClick={() => setDetailsDialogOpen(false)}
            sx={{ color: '#CCCCCC' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ maxHeight: '70vh', overflow: 'auto' }}>
          {selectedMembership && (
            <Grid container spacing={4}>
              {/* 👤 Información del Cliente */}
              <Grid size={12}>
                <Card sx={{
                  background: 'rgba(255, 204, 0, 0.1)',
                  border: '1px solid rgba(255, 204, 0, 0.3)',
                  borderRadius: 3
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleSection('client')}
                    >
                      <Typography variant="h6" sx={{ 
                        color: '#FFCC00',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                      }}>
                        <AccountCircleIcon />
                        Información del Cliente
                      </Typography>
                      {expandedSections.client ? <ExpandLessIcon sx={{ color: '#FFCC00' }} /> : <ExpandMoreIcon sx={{ color: '#FFCC00' }} />}
                    </Box>
                    
                    <AnimatePresence>
                      {expandedSections.client && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Grid container spacing={3}>
                            <Grid size={6}>
                              <Box>
                                <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
                                  Nombre Completo:
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                                  {selectedMembership.user_name}
                                </Typography>
                              </Box>
                            </Grid>
                            
                            <Grid size={6}>
                              <Box>
                                <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
                                  Email:
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500, color: '#FFFFFF' }}>
                                  {selectedMembership.user_email}
                                </Typography>
                              </Box>
                            </Grid>
                            
                            <Grid size={6}>
                              <Box>
                                <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
                                  Tipo de Venta:
                                </Typography>
                                <Chip 
                                  label={selectedMembership.is_renewal ? '🔄 RENOVACIÓN' : '🆕 PRIMERA VEZ'}
                                  sx={{
                                    backgroundColor: selectedMembership.is_renewal ? '#FFDD33' : '#4caf50',
                                    color: '#000000',
                                    fontWeight: 700
                                  }}
                                />
                              </Box>
                            </Grid>
                            
                            <Grid size={6}>
                              <Box>
                                <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
                                  Inscripción:
                                </Typography>
                                <Chip 
                                  label={selectedMembership.skip_inscription ? '🚫 EXENTA' : `💰 ${formatPrice(selectedMembership.inscription_amount)}`}
                                  sx={{
                                    backgroundColor: selectedMembership.skip_inscription ? '#4caf50' : '#ff9800',
                                    color: '#FFFFFF',
                                    fontWeight: 600
                                  }}
                                />
                              </Box>
                            </Grid>
                          </Grid>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </Grid>

              {/* 🏋️‍♂️ Información de la Membresía */}
              <Grid size={12}>
                <Card sx={{
                  background: 'rgba(33, 150, 243, 0.1)',
                  border: '1px solid rgba(33, 150, 243, 0.3)',
                  borderRadius: 3
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleSection('membership')}
                    >
                      <Typography variant="h6" sx={{ 
                        color: '#2196f3',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                      }}>
                        🏋️‍♂️ Plan y Duración
                      </Typography>
                      {expandedSections.membership ? <ExpandLessIcon sx={{ color: '#2196f3' }} /> : <ExpandMoreIcon sx={{ color: '#2196f3' }} />}
                    </Box>
                    
                    <AnimatePresence>
                      {expandedSections.membership && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Grid container spacing={3}>
                            <Grid size={4}>
                              <Box>
                                <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
                                  Plan:
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                                  {selectedMembership.plan_name}
                                </Typography>
                              </Box>
                            </Grid>
                            
                            <Grid size={4}>
                              <Box>
                                <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
                                  Tipo de Pago:
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500, color: '#FFFFFF' }}>
                                  {selectedMembership.payment_type}
                                </Typography>
                              </Box>
                            </Grid>
                            
                            <Grid size={4}>
                              <Box>
                                <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
                                  Estado Actual:
                                </Typography>
                                <Chip 
                                  label={`${getStatusIcon(selectedMembership.status)} ${selectedMembership.status.toUpperCase()}`}
                                  sx={{
                                    backgroundColor: getStatusColor(selectedMembership.status),
                                    color: '#FFFFFF',
                                    fontWeight: 600
                                  }}
                                />
                              </Box>
                            </Grid>
                          </Grid>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </Grid>

              {/* 📅 Información de Fechas */}
              <Grid size={12}>
                <Card sx={{
                  background: 'rgba(156, 39, 176, 0.1)',
                  border: '1px solid rgba(156, 39, 176, 0.3)',
                  borderRadius: 3
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleSection('dates')}
                    >
                      <Typography variant="h6" sx={{ 
                        color: '#9c27b0',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                      }}>
                        <CalendarTodayIcon />
                        Fechas y Vigencia
                      </Typography>
                      {expandedSections.dates ? <ExpandLessIcon sx={{ color: '#9c27b0' }} /> : <ExpandMoreIcon sx={{ color: '#9c27b0' }} />}
                    </Box>
                    
                    <AnimatePresence>
                      {expandedSections.dates && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Grid container spacing={3}>
                            <Grid size={3}>
                              <Box>
                                <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
                                  Fecha de Inicio:
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                                  📅 {formatDate(selectedMembership.start_date)}
                                </Typography>
                              </Box>
                            </Grid>
                            
                            <Grid size={3}>
                              <Box>
                                <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
                                  Fecha de Fin:
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                                  {selectedMembership.end_date ? 
                                    `📅 ${formatDate(selectedMembership.end_date)}` : 
                                    '♾️ Sin límite'
                                  }
                                </Typography>
                              </Box>
                            </Grid>
                            
                            <Grid size={3}>
                              <Box>
                                <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
                                  Duración:
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                                  ⏱️ {formatDuration(selectedMembership.start_date, selectedMembership.end_date)}
                                </Typography>
                              </Box>
                            </Grid>
                            
                            <Grid size={3}>
                              <Box>
                                <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
                                  Días Restantes:
                                </Typography>
                                {(() => {
                                  const daysRemaining = getDaysRemaining(selectedMembership.end_date);
                                  return (
                                    <Typography variant="body1" sx={{ 
                                      fontWeight: 600, 
                                      color: daysRemaining === null ? '#FFFFFF' : 
                                            daysRemaining < 0 ? '#f44336' :
                                            daysRemaining < 7 ? '#ff9800' : '#4caf50'
                                    }}>
                                      {daysRemaining === null ? '♾️ Ilimitado' :
                                       daysRemaining < 0 ? '❌ Vencida' :
                                       daysRemaining === 0 ? '⚠️ Vence hoy' :
                                       `${daysRemaining} días`
                                      }
                                    </Typography>
                                  );
                                })()}
                              </Box>
                            </Grid>
                          </Grid>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </Grid>

              {/* 💰 Información de Pago */}
              <Grid size={12}>
                <Card sx={{
                  background: 'rgba(255, 152, 0, 0.1)',
                  border: '1px solid rgba(255, 152, 0, 0.3)',
                  borderRadius: 3
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleSection('payment')}
                    >
                      <Typography variant="h6" sx={{ 
                        color: '#ff9800',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                      }}>
                        <PaymentIcon />
                        Información de Pago
                      </Typography>
                      {expandedSections.payment ? <ExpandLessIcon sx={{ color: '#ff9800' }} /> : <ExpandMoreIcon sx={{ color: '#ff9800' }} />}
                    </Box>
                    
                    <AnimatePresence>
                      {expandedSections.payment && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Grid container spacing={3}>
                            <Grid size={3}>
                              <Box>
                                <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
                                  Método de Pago:
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                                  {paymentMethodOptions.find(p => p.value === selectedMembership.payment_method)?.icon} {selectedMembership.payment_method}
                                </Typography>
                              </Box>
                            </Grid>
                            
                            <Grid size={3}>
                              <Box>
                                <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
                                  Total Pagado:
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#FFCC00' }}>
                                  {formatPrice(selectedMembership.amount_paid)}
                                </Typography>
                              </Box>
                            </Grid>
                            
                            <Grid size={3}>
                              <Box>
                                <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
                                  Subtotal:
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                                  {formatPrice(selectedMembership.subtotal)}
                                </Typography>
                              </Box>
                            </Grid>
                            
                            <Grid size={3}>
                              <Box>
                                <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
                                  Comisión:
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#ff9800' }}>
                                  {formatPrice(selectedMembership.commission_amount)}
                                  {selectedMembership.custom_commission_rate && (
                                    <Typography variant="caption" sx={{ display: 'block', color: '#ff9800' }}>
                                      ({selectedMembership.custom_commission_rate}% personalizada)
                                    </Typography>
                                  )}
                                </Typography>
                              </Box>
                            </Grid>
                            
                            {selectedMembership.discount_amount > 0 && (
                              <Grid size={3}>
                                <Box>
                                  <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
                                    Descuento:
                                  </Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#4caf50' }}>
                                    -{formatPrice(selectedMembership.discount_amount)}
                                    {selectedMembership.coupon_code && (
                                      <Typography variant="caption" sx={{ display: 'block', color: '#4caf50' }}>
                                        Cupón: {selectedMembership.coupon_code}
                                      </Typography>
                                    )}
                                  </Typography>
                                </Box>
                              </Grid>
                            )}
                            
                            {selectedMembership.payment_reference && (
                              <Grid size={selectedMembership.discount_amount > 0 ? 3 : 6}>
                                <Box>
                                  <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
                                    Referencia:
                                  </Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 500, color: '#FFFFFF', fontFamily: 'monospace' }}>
                                    {selectedMembership.payment_reference}
                                  </Typography>
                                </Box>
                              </Grid>
                            )}
                            
                            {selectedMembership.payment_method === 'efectivo' && selectedMembership.payment_received > 0 && (
                              <Grid size={6}>
                                <Box>
                                  <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
                                    Pago en Efectivo:
                                  </Typography>
                                  <Stack spacing={1}>
                                    <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                                      💵 Recibido: {formatPrice(selectedMembership.payment_received)}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                                      💰 Cambio: {formatPrice(selectedMembership.payment_change)}
                                    </Typography>
                                  </Stack>
                                </Box>
                              </Grid>
                            )}
                          </Grid>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </Grid>

              {/* 📝 Notas */}
              {selectedMembership.notes && (
                <Grid size={12}>
                  <Card sx={{
                    background: 'rgba(158, 158, 158, 0.1)',
                    border: '1px solid rgba(158, 158, 158, 0.3)',
                    borderRadius: 3
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ 
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                        cursor: 'pointer'
                      }}
                      onClick={() => toggleSection('notes')}
                      >
                        <Typography variant="h6" sx={{ 
                          color: '#9e9e9e',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2
                        }}>
                          📝 Notas y Observaciones
                        </Typography>
                        {expandedSections.notes ? <ExpandLessIcon sx={{ color: '#9e9e9e' }} /> : <ExpandMoreIcon sx={{ color: '#9e9e9e' }} />}
                      </Box>
                      
                      <AnimatePresence>
                        {expandedSections.notes && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Typography variant="body1" sx={{ 
                              color: '#FFFFFF',
                              backgroundColor: 'rgba(77, 77, 77, 0.3)',
                              p: 2,
                              borderRadius: 2,
                              fontStyle: 'italic',
                              lineHeight: 1.6
                            }}>
                              {selectedMembership.notes}
                            </Typography>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* 📊 Metadatos */}
              <Grid size={12}>
                <Card sx={{
                  background: 'rgba(96, 125, 139, 0.1)',
                  border: '1px solid rgba(96, 125, 139, 0.3)',
                  borderRadius: 3
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      <Grid size={6}>
                        <Typography variant="caption" sx={{ color: '#CCCCCC' }}>
                          Creado: {formatDate(selectedMembership.created_at)}
                        </Typography>
                      </Grid>
                      <Grid size={6}>
                        <Typography variant="caption" sx={{ color: '#CCCCCC' }}>
                          Actualizado: {formatDate(selectedMembership.updated_at)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      {/* ✏️ MODAL DE EDICIÓN */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => !editLoading && setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, rgba(51, 51, 51, 0.98), rgba(77, 77, 77, 0.95))',
            border: '2px solid rgba(255, 204, 0, 0.5)',
            borderRadius: 4,
            color: '#FFFFFF',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
          }
        }}
      >
        <DialogTitle sx={{ 
          color: '#FFCC00', 
          fontWeight: 800,
          fontSize: '1.6rem',
          textAlign: 'center',
          pb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EditIcon sx={{ fontSize: 35 }} />
            Editar Membresía
          </Box>
          <IconButton 
            onClick={() => setEditDialogOpen(false)}
            disabled={editLoading}
            sx={{ color: '#CCCCCC' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          {selectedMembership && (
            <Box sx={{ mt: 2 }}>
              {/* Información del Cliente (Solo lectura) */}
              <Card sx={{
                background: 'rgba(255, 204, 0, 0.1)',
                border: '1px solid rgba(255, 204, 0, 0.3)',
                borderRadius: 3,
                mb: 3
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ 
                    color: '#FFCC00',
                    fontWeight: 700,
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}>
                    <AccountCircleIcon />
                    Cliente: {selectedMembership.user_name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                    📧 {selectedMembership.user_email} | 🏋️‍♂️ {selectedMembership.plan_name}
                  </Typography>
                </CardContent>
              </Card>

              <Grid container spacing={3}>
                {/* Estado */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ 
                      color: '#CCCCCC',
                      '&.Mui-focused': { color: '#FFCC00' }
                    }}>
                      Estado de la Membresía
                    </InputLabel>
                    <Select
                      value={editData.status || selectedMembership.status}
                      onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                      sx={{
                        color: '#FFFFFF',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 204, 0, 0.3)'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#FFCC00'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#FFCC00'
                        }
                      }}
                    >
                      {statusOptions.filter(s => s.value !== '').map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{option.icon}</span>
                            <span>{option.label}</span>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Método de Pago */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ 
                      color: '#CCCCCC',
                      '&.Mui-focused': { color: '#FFCC00' }
                    }}>
                      Método de Pago
                    </InputLabel>
                    <Select
                      value={editData.payment_method || selectedMembership.payment_method}
                      onChange={(e) => setEditData(prev => ({ ...prev, payment_method: e.target.value }))}
                      sx={{
                        color: '#FFFFFF',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 204, 0, 0.3)'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#FFCC00'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#FFCC00'
                        }
                      }}
                    >
                      {paymentMethodOptions.filter(p => p.value !== '').map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{option.icon}</span>
                            <span>{option.label}</span>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Fecha de Inicio */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Fecha de Inicio"
                    type="date"
                    value={editData.start_date || selectedMembership.start_date}
                    onChange={(e) => setEditData(prev => ({ ...prev, start_date: e.target.value }))}
                    InputLabelProps={{ 
                      shrink: true,
                      sx: { 
                        color: '#CCCCCC',
                        '&.Mui-focused': { color: '#FFCC00' }
                      }
                    }}
                    InputProps={{
                      sx: {
                        color: '#FFFFFF',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 204, 0, 0.3)'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#FFCC00'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#FFCC00'
                        }
                      }
                    }}
                  />
                </Grid>

                {/* Fecha de Fin */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Fecha de Fin"
                    type="date"
                    value={editData.end_date || selectedMembership.end_date || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, end_date: e.target.value }))}
                    InputLabelProps={{ 
                      shrink: true,
                      sx: { 
                        color: '#CCCCCC',
                        '&.Mui-focused': { color: '#FFCC00' }
                      }
                    }}
                    InputProps={{
                      sx: {
                        color: '#FFFFFF',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 204, 0, 0.3)'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#FFCC00'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#FFCC00'
                        }
                      }
                    }}
                  />
                </Grid>

                {/* Monto Pagado */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Monto Pagado"
                    type="number"
                    value={editData.amount_paid || selectedMembership.amount_paid}
                    onChange={(e) => setEditData(prev => ({ ...prev, amount_paid: parseFloat(e.target.value) || 0 }))}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      sx: {
                        color: '#FFFFFF',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 204, 0, 0.3)'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#FFCC00'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#FFCC00'
                        }
                      }
                    }}
                    InputLabelProps={{
                      sx: { 
                        color: '#CCCCCC',
                        '&.Mui-focused': { color: '#FFCC00' }
                      }
                    }}
                  />
                </Grid>

                {/* Referencia de Pago */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Referencia de Pago"
                    value={editData.payment_reference || selectedMembership.payment_reference || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, payment_reference: e.target.value }))}
                    placeholder="Número de autorización, SPEI, etc."
                    InputProps={{
                      sx: {
                        color: '#FFFFFF',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 204, 0, 0.3)'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#FFCC00'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#FFCC00'
                        }
                      }
                    }}
                    InputLabelProps={{
                      sx: { 
                        color: '#CCCCCC',
                        '&.Mui-focused': { color: '#FFCC00' }
                      }
                    }}
                  />
                </Grid>

                {/* Notas */}
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Notas y Observaciones"
                    multiline
                    rows={3}
                    value={editData.notes || selectedMembership.notes || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Observaciones, motivos de cambio, etc..."
                    InputProps={{
                      sx: {
                        color: '#FFFFFF',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 204, 0, 0.3)'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#FFCC00'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#FFCC00'
                        }
                      }
                    }}
                    InputLabelProps={{
                      sx: { 
                        color: '#CCCCCC',
                        '&.Mui-focused': { color: '#FFCC00' }
                      }
                    }}
                  />
                </Grid>
              </Grid>

              {/* Alerta de Confirmación */}
              <Alert 
                severity="warning"
                sx={{
                  mt: 3,
                  backgroundColor: 'rgba(255, 152, 0, 0.1)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 152, 0, 0.3)',
                  '& .MuiAlert-icon': { color: '#ff9800' }
                }}
              >
                <Typography variant="body2">
                  <strong>⚠️ Importante:</strong> Los cambios realizados se aplicarán inmediatamente. 
                  Asegúrese de que la información sea correcta antes de guardar.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={() => setEditDialogOpen(false)}
            disabled={editLoading}
            sx={{ 
              color: '#CCCCCC',
              borderColor: 'rgba(204, 204, 204, 0.4)',
              px: 3,
              py: 1
            }}
            variant="outlined"
          >
            Cancelar
          </Button>
          
          <Button 
            onClick={handleUpdateMembership}
            disabled={editLoading}
            variant="contained"
            startIcon={editLoading ? <CircularProgress size={20} sx={{ color: '#000000' }} /> : <SaveIcon />}
            sx={{
              background: 'linear-gradient(135deg, #FFCC00, #FFB300)',
              color: '#000000',
              fontWeight: 700,
              px: 4,
              py: 1,
              '&:hover': {
                background: 'linear-gradient(135deg, #FFE066, #FFCC00)',
                transform: 'translateY(-1px)'
              }
            }}
          >
            {editLoading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="error" 
          onClose={() => setError(null)}
          sx={{
            backgroundColor: 'rgba(211, 47, 47, 0.95)',
            color: '#FFFFFF',
            '& .MuiAlert-icon': { color: '#FFFFFF' }
          }}
        >
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="success" 
          onClose={() => setSuccessMessage(null)}
          sx={{
            backgroundColor: 'rgba(46, 125, 50, 0.95)',
            color: '#FFFFFF',
            '& .MuiAlert-icon': { color: '#FFFFFF' }
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}