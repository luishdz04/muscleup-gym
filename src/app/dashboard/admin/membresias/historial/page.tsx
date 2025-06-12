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

// 🆕 IMPORTS DEL SISTEMA DE CONGELAMIENTO INTELIGENTE
import {
  freezeMembership,
  unfreezeMembership,
  getCurrentFrozenDays,
  getProjectedEndDate,
  canFreezeMembership,
  canUnfreezeMembership,
  type FreezeResult
} from '@/lib/utils/freezeUtils';

// 🎨 DARK PRO SYSTEM - TOKENS ACTUALIZADOS
const darkProTokens = {
  // Base Colors
  background: '#000000',
  surfaceLevel1: '#121212',
  surfaceLevel2: '#1E1E1E',
  surfaceLevel3: '#252525',
  surfaceLevel4: '#2E2E2E',
  
  // Neutrals
  grayDark: '#333333',
  grayMedium: '#444444',
  grayLight: '#555555',
  grayMuted: '#777777',
  textPrimary: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textDisabled: '#888888',
  
  // Primary Accent (Golden)
  primary: '#FFCC00',
  primaryHover: '#E6B800',
  primaryActive: '#CCAA00',
  primaryDisabled: 'rgba(255,204,0,0.3)',
  
  // Semantic Colors
  success: '#388E3C',
  successHover: '#2E7D32',
  error: '#D32F2F',
  errorHover: '#B71C1C',
  warning: '#FFB300',
  warningHover: '#E6A700',
  info: '#1976D2',
  infoHover: '#1565C0',
  
  // User Roles
  roleAdmin: '#FFCC00',
  roleStaff: '#1976D2',
  roleTrainer: '#009688',
  roleUser: '#777777',
  roleModerator: '#9C27B0',
  roleGuest: '#444444',
  
  // Interactions
  hoverOverlay: 'rgba(255,204,0,0.05)',
  activeOverlay: 'rgba(255,204,0,0.1)',
  borderDefault: '#333333',
  borderHover: '#FFCC00',
  borderActive: '#E6B800'
};

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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import GroupIcon from '@mui/icons-material/Group';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import TimerIcon from '@mui/icons-material/Timer';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import PaymentIcon from '@mui/icons-material/Payment';
import AcUnitIcon from '@mui/icons-material/AcUnit'; // 🧊 Icono de congelado

// 🆕 INTERFAZ ACTUALIZADA CON CAMPOS DE CONGELAMIENTO
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
  
  // 🆕 CAMPOS DE CONGELAMIENTO INTELIGENTE
  freeze_date: string | null;
  unfreeze_date: string | null;
  total_frozen_days: number;
  
  // Datos relacionados
  user_name: string;
  user_email: string;
  plan_name: string;
}

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

interface Filters {
  searchTerm: string;
  status: string;
  paymentMethod: string;
  dateFrom: string;
  dateTo: string;
  planId: string;
  isRenewal: string;
}

// 🆕 OPCIONES DE ESTADO ACTUALIZADAS
const statusOptions = [
  { value: '', label: 'Todos los estados', color: darkProTokens.textSecondary, icon: '📋' },
  { value: 'active', label: 'Activa', color: darkProTokens.success, icon: '✅' },
  { value: 'expired', label: 'Vencida', color: darkProTokens.error, icon: '❌' },
  { value: 'frozen', label: 'Congelada', color: darkProTokens.info, icon: '🧊' },
  { value: 'cancelled', label: 'Cancelada', color: darkProTokens.grayMuted, icon: '🚫' }
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
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  
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
  
  // 🆕 ESTADOS PARA CONGELAMIENTO
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [unfreezeLoading, setUnfreezeLoading] = useState(false);
  
  // Estados adicionales para edición
  const [editData, setEditData] = useState<Partial<MembershipHistory>>({});
  const [editLoading, setEditLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    client: true,
    membership: true,
    payment: true,
    dates: true,
    freeze: false, // 🆕 Nueva sección
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

  // 📊 CARGAR MEMBRESÍAS CON DATOS RELACIONADOS - ACTUALIZADA CON CAMPOS DE CONGELAMIENTO
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
        // Asegurar valores por defecto para campos de congelamiento
        freeze_date: item.freeze_date || null,
        unfreeze_date: item.unfreeze_date || null,
        total_frozen_days: item.total_frozen_days || 0,
        user_name: `${item.Users?.firstName || ''} ${item.Users?.lastName || ''}`.trim(),
        user_email: item.Users?.email || '',
        plan_name: item.membership_plans?.name || 'Plan Desconocido'
      }));

      setMemberships(formattedData);
      calculateStats(formattedData);
      setInfoMessage(`📊 ${formattedData.length} membresías cargadas`);
      
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

  // 🆕 FUNCIÓN PARA CONGELAR MEMBRESÍA
  const handleFreezeMembership = async (membership: MembershipHistory) => {
    try {
      setFreezeLoading(true);
      setWarningMessage('🧊 Congelando membresía...');
      
      // Validar si puede congelarse
      const validation = canFreezeMembership(membership);
      if (!validation.canFreeze) {
        setError(validation.reason || 'No se puede congelar esta membresía');
        return;
      }
      
      // Ejecutar congelamiento
      const result: FreezeResult = await freezeMembership(supabase, membership.id);
      
      if (result.success) {
        setSuccessMessage(result.message);
        loadMemberships(); // Recargar datos
        setActionMenuAnchor(null); // Cerrar menú
      } else {
        setError(result.error || 'Error al congelar membresía');
      }
      
    } catch (err: any) {
      setError(`Error al congelar membresía: ${err.message}`);
    } finally {
      setFreezeLoading(false);
    }
  };

  // 🆕 FUNCIÓN PARA REACTIVAR MEMBRESÍA
  const handleUnfreezeMembership = async (membership: MembershipHistory) => {
    try {
      setUnfreezeLoading(true);
      setWarningMessage('🔄 Reactivando membresía...');
      
      // Validar si puede reactivarse
      const validation = canUnfreezeMembership(membership);
      if (!validation.canUnfreeze) {
        setError(validation.reason || 'No se puede reactivar esta membresía');
        return;
      }
      
      // Ejecutar reactivación
      const result: FreezeResult = await unfreezeMembership(
        supabase,
        membership.id,
        membership.freeze_date!,
        membership.end_date,
        membership.total_frozen_days
      );
      
      if (result.success) {
        setSuccessMessage(result.message);
        loadMemberships(); // Recargar datos
        setActionMenuAnchor(null); // Cerrar menú
      } else {
        setError(result.error || 'Error al reactivar membresía');
      }
      
    } catch (err: any) {
      setError(`Error al reactivar membresía: ${err.message}`);
    } finally {
      setUnfreezeLoading(false);
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

      setSuccessMessage('✅ Membresía actualizada exitosamente');
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
    return statusOption?.color || darkProTokens.textSecondary;
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
      setSuccessMessage(`✅ Estado cambiado a ${newStatus}`);
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

  // ✅ FUNCIONES PARA CERRAR NOTIFICACIONES
  const handleCloseError = () => setError(null);
  const handleCloseSuccess = () => setSuccessMessage(null);
  const handleCloseWarning = () => setWarningMessage(null);
  const handleCloseInfo = () => setInfoMessage(null);

  return (
    <Box sx={{ 
      p: 3, 
      background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
      minHeight: '100vh',
      color: darkProTokens.textPrimary
    }}>
      {/* ✅ SNACKBARS CON DARK PRO SYSTEM */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={8000} 
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseError} 
          severity="error" 
          variant="filled"
          sx={{
            background: `linear-gradient(135deg, ${darkProTokens.error}, ${darkProTokens.errorHover})`,
            color: darkProTokens.textPrimary,
            border: `1px solid ${darkProTokens.error}60`,
            borderRadius: 3,
            boxShadow: `0 8px 32px ${darkProTokens.error}40`,
            backdropFilter: 'blur(20px)',
            fontWeight: 600,
            '& .MuiAlert-icon': { color: darkProTokens.textPrimary },
            '& .MuiAlert-action': { color: darkProTokens.textPrimary }
          }}
        >
          {error}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!successMessage} 
        autoHideDuration={5000} 
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSuccess} 
          severity="success" 
          variant="filled"
          sx={{
            background: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})`,
            color: darkProTokens.textPrimary,
            border: `1px solid ${darkProTokens.success}60`,
            borderRadius: 3,
            boxShadow: `0 8px 32px ${darkProTokens.success}40`,
            backdropFilter: 'blur(20px)',
            fontWeight: 600,
            '& .MuiAlert-icon': { color: darkProTokens.textPrimary },
            '& .MuiAlert-action': { color: darkProTokens.textPrimary }
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!warningMessage} 
        autoHideDuration={6000} 
        onClose={handleCloseWarning}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseWarning} 
          severity="warning" 
          variant="filled"
          sx={{
            background: `linear-gradient(135deg, ${darkProTokens.warning}, ${darkProTokens.warningHover})`,
            color: darkProTokens.background,
            border: `1px solid ${darkProTokens.warning}60`,
            borderRadius: 3,
            boxShadow: `0 8px 32px ${darkProTokens.warning}40`,
            backdropFilter: 'blur(20px)',
            fontWeight: 600,
            '& .MuiAlert-icon': { color: darkProTokens.background },
            '& .MuiAlert-action': { color: darkProTokens.background }
          }}
        >
          {warningMessage}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!infoMessage} 
        autoHideDuration={4000} 
        onClose={handleCloseInfo}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseInfo} 
          severity="info" 
          variant="filled"
          sx={{
            background: `linear-gradient(135deg, ${darkProTokens.info}, ${darkProTokens.infoHover})`,
            color: darkProTokens.textPrimary,
            border: `1px solid ${darkProTokens.info}60`,
            borderRadius: 3,
            boxShadow: `0 8px 32px ${darkProTokens.info}40`,
            backdropFilter: 'blur(20px)',
            fontWeight: 600,
            '& .MuiAlert-icon': { color: darkProTokens.textPrimary },
            '& .MuiAlert-action': { color: darkProTokens.textPrimary }
          }}
        >
          {infoMessage}
        </Alert>
      </Snackbar>

      {/* 🎯 HEADER MINIMALISTA CON DARK PRO SYSTEM */}
      <Paper sx={{
        p: 3,
        mb: 3,
        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
        border: `1px solid ${darkProTokens.grayDark}`,
        borderRadius: 3,
        backdropFilter: 'blur(10px)'
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box>
            <Typography variant="h4" sx={{ 
              color: darkProTokens.primary, 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              textShadow: `0 0 20px ${darkProTokens.primary}40`
            }}>
              <HistoryIcon sx={{ fontSize: 40, color: darkProTokens.primary }} />
              Historial de Membresías
            </Typography>
            <Typography variant="body1" sx={{ color: darkProTokens.textSecondary, mt: 1 }}>
              Gestión completa del historial de membresías y pagos con sistema de congelamiento inteligente
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => {
                setInfoMessage('🔄 Regresando al dashboard...');
                router.push('/dashboard/admin/membresias');
              }}
              variant="outlined"
              sx={{ 
                color: darkProTokens.primary,
                borderColor: `${darkProTokens.primary}60`,
                '&:hover': {
                  borderColor: darkProTokens.primary,
                  bgcolor: `${darkProTokens.primary}10`,
                  transform: 'translateY(-1px)',
                  boxShadow: `0 4px 15px ${darkProTokens.primary}30`
                },
                borderWidth: '2px',
                fontWeight: 600,
                transition: 'all 0.3s ease'
              }}
            >
              Dashboard
            </Button>
            
            <Button
              startIcon={<RefreshIcon />}
              onClick={() => {
                setInfoMessage('🔄 Actualizando historial...');
                loadMemberships();
              }}
              variant="contained"
              disabled={loading}
              sx={{
                background: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})`,
                fontWeight: 600,
                px: 3,
                borderRadius: 2,
                boxShadow: `0 4px 20px ${darkProTokens.success}40`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${darkProTokens.successHover}, ${darkProTokens.success})`,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 25px ${darkProTokens.success}50`
                },
                transition: 'all 0.3s ease'
              }}
            >
              Actualizar
            </Button>
          </Box>
        </Box>

        {/* 📊 ESTADÍSTICAS DARK PRO */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.primary}20, ${darkProTokens.primary}10)`,
              border: `1px solid ${darkProTokens.primary}30`,
              borderRadius: 3,
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-2px)' }
            }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <GroupIcon sx={{ color: darkProTokens.primary, fontSize: 30, mb: 1 }} />
                <Typography variant="h4" sx={{ color: darkProTokens.primary, fontWeight: 800 }}>
                  {stats.total}
                </Typography>
                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                  Total
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.success}20, ${darkProTokens.success}10)`,
              border: `1px solid ${darkProTokens.success}30`,
              borderRadius: 3,
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-2px)' }
            }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <CheckCircleIcon sx={{ color: darkProTokens.success, fontSize: 30, mb: 1 }} />
                <Typography variant="h4" sx={{ color: darkProTokens.success, fontWeight: 800 }}>
                  {stats.active}
                </Typography>
                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                  Activas
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.error}20, ${darkProTokens.error}10)`,
              border: `1px solid ${darkProTokens.error}30`,
              borderRadius: 3,
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-2px)' }
            }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <CancelIcon sx={{ color: darkProTokens.error, fontSize: 30, mb: 1 }} />
                <Typography variant="h4" sx={{ color: darkProTokens.error, fontWeight: 800 }}>
                  {stats.expired}
                </Typography>
                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                  Vencidas
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.info}20, ${darkProTokens.info}10)`,
              border: `1px solid ${darkProTokens.info}30`,
              borderRadius: 3,
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-2px)' }
            }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <AcUnitIcon sx={{ color: darkProTokens.info, fontSize: 30, mb: 1 }} />
                <Typography variant="h4" sx={{ color: darkProTokens.info, fontWeight: 800 }}>
                  {stats.frozen}
                </Typography>
                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                  Congeladas
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.warning}20, ${darkProTokens.warning}10)`,
              border: `1px solid ${darkProTokens.warning}30`,
              borderRadius: 3,
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-2px)' }
            }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <AttachMoneyIcon sx={{ color: darkProTokens.warning, fontSize: 30, mb: 1 }} />
                <Typography variant="h6" sx={{ color: darkProTokens.warning, fontWeight: 800 }}>
                  {formatPrice(stats.totalRevenue)}
                </Typography>
                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                  Ingresos
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.roleModerator}20, ${darkProTokens.roleModerator}10)`,
              border: `1px solid ${darkProTokens.roleModerator}30`,
              borderRadius: 3,
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-2px)' }
            }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <TrendingUpIcon sx={{ color: darkProTokens.roleModerator, fontSize: 30, mb: 1 }} />
                <Typography variant="h6" sx={{ color: darkProTokens.roleModerator, fontWeight: 800 }}>
                  {formatPrice(stats.totalCommissions)}
                </Typography>
                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                  Comisiones
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Panel de Filtros [IGUAL QUE ANTES] */}
      <Card sx={{
        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
        border: `1px solid ${darkProTokens.grayDark}`,
        borderRadius: 3,
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
              color: darkProTokens.primary, 
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
                  sx={{ '& .MuiBadge-badge': { backgroundColor: darkProTokens.primary } }}
                />
              )}
            </Typography>
            
            <Button
              onClick={() => setShowFilters(!showFilters)}
              sx={{ 
                color: darkProTokens.primary,
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
                            <SearchIcon sx={{ color: darkProTokens.primary }} />
                          </InputAdornment>
                        ),
                        sx: {
                          color: darkProTokens.textPrimary,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: `${darkProTokens.primary}30`
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: darkProTokens.primary
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: darkProTokens.primary
                          }
                        }
                      }}
                      InputLabelProps={{
                        sx: { 
                          color: darkProTokens.textSecondary,
                          '&.Mui-focused': { color: darkProTokens.primary }
                        }
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ 
                        color: darkProTokens.textSecondary,
                        '&.Mui-focused': { color: darkProTokens.primary }
                      }}>
                        Estado
                      </InputLabel>
                      <Select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        sx={{
                          color: darkProTokens.textPrimary,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: `${darkProTokens.primary}30`
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: darkProTokens.primary
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: darkProTokens.primary
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
                        color: darkProTokens.textSecondary,
                        '&.Mui-focused': { color: darkProTokens.primary }
                      }}>
                        Método de Pago
                      </InputLabel>
                      <Select
                        value={filters.paymentMethod}
                        onChange={(e) => setFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        sx={{
                          color: darkProTokens.textPrimary,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: `${darkProTokens.primary}30`
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: darkProTokens.primary
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: darkProTokens.primary
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
                        color: darkProTokens.textSecondary,
                        '&.Mui-focused': { color: darkProTokens.primary }
                      }}>
                        Plan
                      </InputLabel>
                      <Select
                        value={filters.planId}
                        onChange={(e) => setFilters(prev => ({ ...prev, planId: e.target.value }))}
                        sx={{
                          color: darkProTokens.textPrimary,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: `${darkProTokens.primary}30`
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: darkProTokens.primary
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: darkProTokens.primary
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
                        color: darkProTokens.textSecondary,
                        borderColor: darkProTokens.grayDark,
                        height: '56px',
                        '&:hover': {
                          borderColor: darkProTokens.textSecondary,
                          backgroundColor: darkProTokens.hoverOverlay
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

      {/* Tabla de Membresías - ACTUALIZADA CON INDICADORES DE CONGELAMIENTO */}
      <Card sx={{
        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
        border: `1px solid ${darkProTokens.grayDark}`,
        borderRadius: 3
      }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress sx={{ color: darkProTokens.primary }} size={60} />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: `${darkProTokens.primary}10` }}>
                      <TableCell sx={{ 
                        color: darkProTokens.primary, 
                        fontWeight: 700, 
                        borderBottom: `1px solid ${darkProTokens.primary}30`,
                        fontSize: '1rem'
                      }}>
                        Cliente
                      </TableCell>
                      <TableCell sx={{ 
                        color: darkProTokens.primary, 
                        fontWeight: 700, 
                        borderBottom: `1px solid ${darkProTokens.primary}30`,
                        fontSize: '1rem'
                      }}>
                        Plan
                      </TableCell>
                      <TableCell sx={{ 
                        color: darkProTokens.primary, 
                        fontWeight: 700, 
                        borderBottom: `1px solid ${darkProTokens.primary}30`,
                        fontSize: '1rem'
                      }}>
                        Estado
                      </TableCell>
                      <TableCell sx={{ 
                        color: darkProTokens.primary, 
                        fontWeight: 700, 
                        borderBottom: `1px solid ${darkProTokens.primary}30`,
                        fontSize: '1rem'
                      }}>
                        Fechas
                      </TableCell>
                      <TableCell sx={{ 
                        color: darkProTokens.primary, 
                        fontWeight: 700, 
                        borderBottom: `1px solid ${darkProTokens.primary}30`,
                        fontSize: '1rem'
                      }}>
                        Pago
                      </TableCell>
                      <TableCell sx={{ 
                        color: darkProTokens.primary, 
                        fontWeight: 700, 
                        borderBottom: `1px solid ${darkProTokens.primary}30`,
                        fontSize: '1rem'
                      }}>
                        Total
                      </TableCell>
                      <TableCell sx={{ 
                        color: darkProTokens.primary, 
                        fontWeight: 700, 
                        borderBottom: `1px solid ${darkProTokens.primary}30`,
                        fontSize: '1rem',
                        textAlign: 'center'
                      }}>
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
                              backgroundColor: darkProTokens.hoverOverlay
                            },
                            borderBottom: `1px solid ${darkProTokens.grayDark}`
                          }}
                        >
                          <TableCell sx={{ color: darkProTokens.textPrimary, borderBottom: 'none' }}>
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {membership.user_name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                                {membership.user_email}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                                {membership.is_renewal && (
                                  <Chip 
                                    label="🔄 Renovación" 
                                    size="small"
                                    sx={{
                                      backgroundColor: darkProTokens.warning,
                                      color: darkProTokens.background,
                                      fontWeight: 600,
                                      fontSize: '0.7rem'
                                    }}
                                  />
                                )}
                                {/* 🆕 INDICADOR DE CONGELAMIENTO */}
                                {membership.total_frozen_days > 0 && (
                                  <Chip 
                                    label={`🧊 ${membership.total_frozen_days}d`} 
                                    size="small"
                                    sx={{
                                      backgroundColor: darkProTokens.info,
                                      color: darkProTokens.textPrimary,
                                      fontWeight: 600,
                                      fontSize: '0.7rem'
                                    }}
                                  />
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          
                          <TableCell sx={{ color: darkProTokens.textPrimary, borderBottom: 'none' }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {membership.plan_name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                              {membership.payment_type}
                            </Typography>
                          </TableCell>
                          
                          <TableCell sx={{ borderBottom: 'none' }}>
                            <Chip 
                              label={`${getStatusIcon(membership.status)} ${membership.status.toUpperCase()}`}
                              sx={{
                                backgroundColor: getStatusColor(membership.status),
                                color: darkProTokens.textPrimary,
                                fontWeight: 600
                              }}
                            />
                            {/* 🆕 INFORMACIÓN ADICIONAL PARA CONGELADAS */}
                            {membership.status === 'frozen' && membership.freeze_date && (
                              <Typography variant="caption" sx={{ 
                                color: darkProTokens.info,
                                display: 'block',
                                mt: 0.5
                              }}>
                                Desde: {formatDate(membership.freeze_date)}
                              </Typography>
                            )}
                          </TableCell>
                          
                          <TableCell sx={{ color: darkProTokens.textPrimary, borderBottom: 'none' }}>
                            <Box>
                              <Typography variant="body2">
                                📅 {formatDate(membership.start_date)}
                              </Typography>
                              {membership.end_date && (
                                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                  → {formatDate(membership.end_date)}
                                </Typography>
                              )}
                              {/* 🆕 MOSTRAR FECHA PROYECTADA PARA CONGELADAS */}
                              {membership.status === 'frozen' && membership.freeze_date && (
                                <Typography variant="caption" sx={{ 
                                  color: darkProTokens.warning,
                                  display: 'block'
                                }}>
                                  Proyectada: {formatDate(getProjectedEndDate(membership.end_date, membership.freeze_date) || membership.end_date || '')}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          
                          <TableCell sx={{ color: darkProTokens.textPrimary, borderBottom: 'none' }}>
                            <Box>
                              <Typography variant="body2">
                                {paymentMethodOptions.find(p => p.value === membership.payment_method)?.icon} {membership.payment_method}
                              </Typography>
                              {membership.payment_reference && (
                                <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                                  Ref: {membership.payment_reference}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          
                          <TableCell sx={{ color: darkProTokens.textPrimary, borderBottom: 'none' }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: darkProTokens.primary }}>
                              {formatPrice(membership.amount_paid)}
                            </Typography>
                            {membership.commission_amount > 0 && (
                              <Typography variant="caption" sx={{ color: darkProTokens.warning }}>
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
                                  sx={{ color: darkProTokens.primary }}
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
                                  sx={{ color: darkProTokens.info }}
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
                                  sx={{ color: darkProTokens.textSecondary }}
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
                  color: darkProTokens.textPrimary,
                  borderTop: `1px solid ${darkProTokens.grayDark}`,
                  '& .MuiTablePagination-actions button': {
                    color: darkProTokens.primary
                  },
                  '& .MuiTablePagination-select': {
                    color: darkProTokens.textPrimary
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

      {/* 🆕 MENU DE ACCIONES ACTUALIZADO CON SISTEMA DE CONGELAMIENTO */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={() => setActionMenuAnchor(null)}
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `1px solid ${darkProTokens.primary}30`,
            borderRadius: 2
          }
        }}
      >
        <MenuList>
          {/* OPCIONES PARA MEMBRESÍAS ACTIVAS */}
          {selectedMembership?.status === 'active' && (
            <>
              <MenuItemComponent 
                onClick={() => {
                  if (selectedMembership) {
                    handleFreezeMembership(selectedMembership);
                  }
                }}
                disabled={freezeLoading}
                sx={{ color: darkProTokens.info }}
              >
                <ListItemIcon>
                  {freezeLoading ? (
                    <CircularProgress size={20} sx={{ color: darkProTokens.info }} />
                  ) : (
                    <PauseIcon sx={{ color: darkProTokens.info }} />
                  )}
                </ListItemIcon>
                <ListItemText>
                  {freezeLoading ? 'Congelando...' : '🧊 Congelar Membresía'}
                </ListItemText>
              </MenuItemComponent>
              
              <MenuItemComponent 
                onClick={() => {
                  if (selectedMembership) {
                    handleStatusChange(selectedMembership, 'cancelled');
                    setActionMenuAnchor(null);
                  }
                }}
                sx={{ color: darkProTokens.error }}
              >
                <ListItemIcon>
                  <BlockIcon sx={{ color: darkProTokens.error }} />
                </ListItemIcon>
                <ListItemText>🚫 Cancelar Membresía</ListItemText>
              </MenuItemComponent>
            </>
          )}
          
          {/* OPCIONES PARA MEMBRESÍAS CONGELADAS */}
          {selectedMembership?.status === 'frozen' && (
            <>
              <MenuItemComponent 
                onClick={() => {
                  if (selectedMembership) {
                    handleUnfreezeMembership(selectedMembership);
                  }
                }}
                disabled={unfreezeLoading}
                sx={{ color: darkProTokens.success }}
              >
                <ListItemIcon>
                  {unfreezeLoading ? (
                    <CircularProgress size={20} sx={{ color: darkProTokens.success }} />
                  ) : (
                    <PlayArrowIcon sx={{ color: darkProTokens.success }} />
                  )}
                </ListItemIcon>
                <ListItemText>
                  {unfreezeLoading ? 'Reactivando...' : '🔄 Reactivar Membresía'}
                </ListItemText>
              </MenuItemComponent>
              
              {/* 🆕 INFORMACIÓN DE CONGELAMIENTO */}
              <Box sx={{ p: 2, borderTop: `1px solid ${darkProTokens.grayDark}` }}>
                <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                  📊 Días congelados: {getCurrentFrozenDays(selectedMembership?.freeze_date)}
                </Typography>
                {selectedMembership?.end_date && (
                  <Typography variant="caption" sx={{ 
                    color: darkProTokens.warning,
                    display: 'block'
                  }}>
                    📅 Nueva fecha al reactivar: {formatDate(getProjectedEndDate(selectedMembership.end_date, selectedMembership.freeze_date) || selectedMembership.end_date)}
                  </Typography>
                )}
              </Box>
            </>
          )}
        </MenuList>
      </Menu>

      {/* 👁️ MODAL DE DETALLES - ACTUALIZADO CON SECCIÓN DE CONGELAMIENTO */}
      <Dialog 
        open={detailsDialogOpen} 
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `2px solid ${darkProTokens.primary}50`,
            borderRadius: 4,
            color: darkProTokens.textPrimary,
            boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5)`,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          color: darkProTokens.primary, 
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
            sx={{ color: darkProTokens.textSecondary }}
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
                  background: `${darkProTokens.primary}10`,
                  border: `1px solid ${darkProTokens.primary}30`,
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
                        color: darkProTokens.primary,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                      }}>
                        <AccountCircleIcon />
                        Información del Cliente
                      </Typography>
                      {expandedSections.client ? <ExpandLessIcon sx={{ color: darkProTokens.primary }} /> : <ExpandMoreIcon sx={{ color: darkProTokens.primary }} />}
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
                                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                                  Nombre Completo:
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: darkProTokens.textPrimary }}>
                                  {selectedMembership.user_name}
                                </Typography>
                              </Box>
                            </Grid>
                            
                            <Grid size={6}>
                              <Box>
                                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                                  Email:
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500, color: darkProTokens.textPrimary }}>
                                  {selectedMembership.user_email}
                                </Typography>
                              </Box>
                            </Grid>
                            
                            <Grid size={6}>
                              <Box>
                                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                                  Tipo de Venta:
                                </Typography>
                                <Chip 
                                  label={selectedMembership.is_renewal ? '🔄 RENOVACIÓN' : '🆕 PRIMERA VEZ'}
                                  sx={{
                                    backgroundColor: selectedMembership.is_renewal ? darkProTokens.warning : darkProTokens.success,
                                    color: selectedMembership.is_renewal ? darkProTokens.background : darkProTokens.textPrimary,
                                    fontWeight: 700
                                  }}
                                />
                              </Box>
                            </Grid>
                            
                            <Grid size={6}>
                              <Box>
                                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                                  Inscripción:
                                </Typography>
                                <Chip 
                                  label={selectedMembership.skip_inscription ? '🚫 EXENTA' : `💰 ${formatPrice(selectedMembership.inscription_amount)}`}
                                  sx={{
                                    backgroundColor: selectedMembership.skip_inscription ? darkProTokens.success : darkProTokens.warning,
                                    color: darkProTokens.textPrimary,
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
                  background: `${darkProTokens.info}10`,
                  border: `1px solid ${darkProTokens.info}30`,
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
                        color: darkProTokens.info,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                      }}>
                        <FitnessCenterIcon />
                        Plan y Duración
                      </Typography>
                      {expandedSections.membership ? <ExpandLessIcon sx={{ color: darkProTokens.info }} /> : <ExpandMoreIcon sx={{ color: darkProTokens.info }} />}
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
                                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                                  Plan:
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: darkProTokens.textPrimary }}>
                                  {selectedMembership.plan_name}
                                </Typography>
                              </Box>
                            </Grid>
                            
                            <Grid size={4}>
                              <Box>
                                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                                  Tipo de Pago:
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500, color: darkProTokens.textPrimary }}>
                                  {selectedMembership.payment_type}
                                </Typography>
                              </Box>
                            </Grid>
                            
                            <Grid size={4}>
                              <Box>
                                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                                  Estado Actual:
                                </Typography>
                                <Chip 
                                  label={`${getStatusIcon(selectedMembership.status)} ${selectedMembership.status.toUpperCase()}`}
                                  sx={{
                                    backgroundColor: getStatusColor(selectedMembership.status),
                                    color: darkProTokens.textPrimary,
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

              {/* 🆕 SECCIÓN DE CONGELAMIENTO INTELIGENTE */}
              {(selectedMembership.status === 'frozen' || selectedMembership.total_frozen_days > 0) && (
                <Grid size={12}>
                  <Card sx={{
                    background: `${darkProTokens.info}15`,
                    border: `2px solid ${darkProTokens.info}40`,
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
                      onClick={() => toggleSection('freeze')}
                      >
                        <Typography variant="h6" sx={{ 
                          color: darkProTokens.info,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2
                        }}>
                          <AcUnitIcon />
                          🧊 Sistema de Congelamiento Inteligente
                        </Typography>
                        {expandedSections.freeze ? <ExpandLessIcon sx={{ color: darkProTokens.info }} /> : <ExpandMoreIcon sx={{ color: darkProTokens.info }} />}
                      </Box>
                      
                      <AnimatePresence>
                        {expandedSections.freeze && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Grid container spacing={3}>
                              {/* Estado actual de congelamiento */}
                              <Grid size={6}>
                                <Box>
                                  <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                                    Estado de Congelamiento:
                                  </Typography>
                                  <Alert 
                                    severity={selectedMembership.status === 'frozen' ? 'info' : 'success'}
                                    sx={{
                                      backgroundColor: selectedMembership.status === 'frozen' ? 
                                        `${darkProTokens.info}10` : `${darkProTokens.success}10`,
                                      color: darkProTokens.textPrimary,
                                      border: selectedMembership.status === 'frozen' ? 
                                        `1px solid ${darkProTokens.info}30` : `1px solid ${darkProTokens.success}30`,
                                      '& .MuiAlert-icon': { 
                                        color: selectedMembership.status === 'frozen' ? darkProTokens.info : darkProTokens.success 
                                      }
                                    }}
                                  >
                                    {selectedMembership.status === 'frozen' ? 
                                      '🧊 ACTUALMENTE CONGELADA' : 
                                      '✅ ACTIVA (Historial de congelamiento)'
                                    }
                                  </Alert>
                                </Box>
                              </Grid>

                              <Grid size={6}>
                                <Box>
                                  <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                                    Total Días Congelados (Historial):
                                  </Typography>
                                  <Typography variant="h5" sx={{ 
                                    color: darkProTokens.info,
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                  }}>
                                    🧊 {selectedMembership.total_frozen_days} días
                                  </Typography>
                                </Box>
                              </Grid>

                              {/* Información específica si está congelada */}
                              {selectedMembership.status === 'frozen' && selectedMembership.freeze_date && (
                                <>
                                  <Grid size={4}>
                                    <Box>
                                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                                        Congelada Desde:
                                      </Typography>
                                      <Typography variant="body1" sx={{ 
                                        fontWeight: 600, 
                                        color: darkProTokens.textPrimary,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1
                                      }}>
                                        📅 {formatDate(selectedMembership.freeze_date)}
                                      </Typography>
                                    </Box>
                                  </Grid>
                                  
                                  <Grid size={4}>
                                    <Box>
                                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                                        Días Congelados (Período Actual):
                                      </Typography>
                                      <Typography variant="h6" sx={{ 
                                        color: darkProTokens.warning,
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1
                                      }}>
                                        ⏱️ {getCurrentFrozenDays(selectedMembership.freeze_date)} días
                                      </Typography>
                                    </Box>
                                  </Grid>
                                  
                                  <Grid size={4}>
                                    <Box>
                                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                                        Nueva Fecha de Vencimiento al Reactivar:
                                      </Typography>
                                      <Typography variant="body1" sx={{ 
                                        fontWeight: 600, 
                                        color: darkProTokens.primary
                                      }}>
                                        {selectedMembership.end_date ? 
                                          `📅 ${formatDate(getProjectedEndDate(selectedMembership.end_date, selectedMembership.freeze_date) || selectedMembership.end_date)}` : 
                                          '♾️ Sin límite'
                                        }
                                      </Typography>
                                    </Box>
                                  </Grid>

                                  {/* Explicación del sistema */}
                                  <Grid size={12}>
                                    <Alert 
                                      severity="info"
                                      sx={{
                                        backgroundColor: `${darkProTokens.info}10`,
                                        color: darkProTokens.textPrimary,
                                        border: `1px solid ${darkProTokens.info}30`,
                                        '& .MuiAlert-icon': { color: darkProTokens.info }
                                      }}
                                    >
                                      <Typography variant="body2">
                                        <strong>🧊 Sistema de Congelamiento Inteligente:</strong><br/>
                                        • Los días congelados se suman automáticamente a la fecha de vencimiento<br/>
                                        • El cliente NO pierde días de membresía pagada<br/>
                                        • Se mantiene un historial completo de todos los congelamientos<br/>
                                        • Al reactivar, la membresía se extiende por los días congelados
                                      </Typography>
                                    </Alert>
                                  </Grid>
                                </>
                              )}

                              {/* Información si no está congelada pero tiene historial */}
                              {selectedMembership.status !== 'frozen' && selectedMembership.total_frozen_days > 0 && (
                                <Grid size={12}>
                                  <Alert 
                                    severity="success"
                                    sx={{
                                      backgroundColor: `${darkProTokens.success}10`,
                                      color: darkProTokens.textPrimary,
                                      border: `1px solid ${darkProTokens.success}30`,
                                      '& .MuiAlert-icon': { color: darkProTokens.success }
                                    }}
                                  >
                                    <Typography variant="body2">
                                      <strong>✅ Historial de Congelamiento:</strong><br/>
                                      Esta membresía ha estado congelada por un total de <strong>{selectedMembership.total_frozen_days} días</strong> durante su vigencia.<br/>
                                      Todos esos días fueron agregados automáticamente a la fecha de vencimiento.
                                    </Typography>
                                  </Alert>
                                </Grid>
                              )}
                            </Grid>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* 📅 Información de Fechas */}
              <Grid size={12}>
                <Card sx={{
                  background: `${darkProTokens.roleModerator}10`,
                  border: `1px solid ${darkProTokens.roleModerator}30`,
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
                        color: darkProTokens.roleModerator,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                      }}>
                        <CalendarTodayIcon />
                        Fechas y Vigencia
                      </Typography>
                      {expandedSections.dates ? <ExpandLessIcon sx={{ color: darkProTokens.roleModerator }} /> : <ExpandMoreIcon sx={{ color: darkProTokens.roleModerator }} />}
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
                                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                                  Fecha de Inicio:
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: darkProTokens.textPrimary }}>
                                  📅 {formatDate(selectedMembership.start_date)}
                                </Typography>
                              </Box>
                            </Grid>
                            
                            <Grid size={3}>
                              <Box>
                                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                                  Fecha de Fin:
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: darkProTokens.textPrimary }}>
                                  {selectedMembership.end_date ? 
                                    `📅 ${formatDate(selectedMembership.end_date)}` : 
                                    '♾️ Sin límite'
                                  }
                                </Typography>
                              </Box>
                            </Grid>
                            
                            <Grid size={3}>
                              <Box>
                                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                                  Duración:
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: darkProTokens.textPrimary }}>
                                  ⏱️ {formatDuration(selectedMembership.start_date, selectedMembership.end_date)}
                                </Typography>
                              </Box>
                            </Grid>
                            
                            <Grid size={3}>
                              <Box>
                                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                                  Días Restantes:
                                </Typography>
                                {(() => {
                                  const daysRemaining = getDaysRemaining(selectedMembership.end_date);
                                  return (
                                    <Typography variant="body1" sx={{ 
                                      fontWeight: 600, 
                                      color: daysRemaining === null ? darkProTokens.textPrimary : 
                                            daysRemaining < 0 ? darkProTokens.error :
                                            daysRemaining < 7 ? darkProTokens.warning : darkProTokens.success
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
                  background: `${darkProTokens.warning}10`,
                  border: `1px solid ${darkProTokens.warning}30`,
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
                        color: darkProTokens.warning,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                      }}>
                        <PaymentIcon />
                        Información de Pago
                      </Typography>
                      {expandedSections.payment ? <ExpandLessIcon sx={{ color: darkProTokens.warning }} /> : <ExpandMoreIcon sx={{ color: darkProTokens.warning }} />}
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
                                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                                  Método de Pago:
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: darkProTokens.textPrimary }}>
                                  {paymentMethodOptions.find(p => p.value === selectedMembership.payment_method)?.icon} {selectedMembership.payment_method}
                                </Typography>
                              </Box>
                            </Grid>
                            
                            <Grid size={3}>
                              <Box>
                                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                                  Total Pagado:
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: darkProTokens.primary }}>
                                  {formatPrice(selectedMembership.amount_paid)}
                                </Typography>
                              </Box>
                            </Grid>
                            
                            <Grid size={3}>
                              <Box>
                                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                                  Subtotal:
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: darkProTokens.textPrimary }}>
                                  {formatPrice(selectedMembership.subtotal)}
                                </Typography>
                              </Box>
                            </Grid>
                            
                            <Grid size={3}>
                              <Box>
                                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                                  Comisión:
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: darkProTokens.warning }}>
                                  {formatPrice(selectedMembership.commission_amount)}
                                  {selectedMembership.custom_commission_rate && (
                                    <Typography variant="caption" sx={{ display: 'block', color: darkProTokens.warning }}>
                                      ({selectedMembership.custom_commission_rate}% personalizada)
                                    </Typography>
                                  )}
                                </Typography>
                              </Box>
                            </Grid>
                            
                            {selectedMembership.discount_amount > 0 && (
                              <Grid size={3}>
                                <Box>
                                  <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                                    Descuento:
                                  </Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 600, color: darkProTokens.success }}>
                                    -{formatPrice(selectedMembership.discount_amount)}
                                    {selectedMembership.coupon_code && (
                                      <Typography variant="caption" sx={{ display: 'block', color: darkProTokens.success }}>
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
                                  <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                                    Referencia:
                                  </Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 500, color: darkProTokens.textPrimary, fontFamily: 'monospace' }}>
                                    {selectedMembership.payment_reference}
                                  </Typography>
                                </Box>
                              </Grid>
                            )}
                            
                            {selectedMembership.payment_method === 'efectivo' && selectedMembership.payment_received > 0 && (
                              <Grid size={6}>
                                <Box>
                                  <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                                    Pago en Efectivo:
                                  </Typography>
                                  <Stack spacing={1}>
                                    <Typography variant="body2" sx={{ color: darkProTokens.textPrimary }}>
                                      💵 Recibido: {formatPrice(selectedMembership.payment_received)}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: darkProTokens.textPrimary }}>
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
                    background: `${darkProTokens.grayMuted}10`,
                    border: `1px solid ${darkProTokens.grayMuted}30`,
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
                          color: darkProTokens.grayMuted,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2
                        }}>
                          📝 Notas y Observaciones
                        </Typography>
                        {expandedSections.notes ? <ExpandLessIcon sx={{ color: darkProTokens.grayMuted }} /> : <ExpandMoreIcon sx={{ color: darkProTokens.grayMuted }} />}
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
                              color: darkProTokens.textPrimary,
                              backgroundColor: `${darkProTokens.grayMedium}30`,
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
                  background: `${darkProTokens.grayDark}10`,
                  border: `1px solid ${darkProTokens.grayDark}30`,
                  borderRadius: 3
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      <Grid size={6}>
                        <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                          Creado: {formatDate(selectedMembership.created_at)}
                        </Typography>
                      </Grid>
                      <Grid size={6}>
                        <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
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

      {/* ✏️ MODAL DE EDICIÓN - IGUAL QUE ANTES PERO CON COLORES DARK PRO */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => !editLoading && setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `2px solid ${darkProTokens.primary}50`,
            borderRadius: 4,
            color: darkProTokens.textPrimary,
            boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5)`
          }
        }}
      >
        <DialogTitle sx={{ 
          color: darkProTokens.primary, 
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
            sx={{ color: darkProTokens.textSecondary }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          {selectedMembership && (
            <Box sx={{ mt: 2 }}>
              {/* Información del Cliente (Solo lectura) */}
              <Card sx={{
                background: `${darkProTokens.primary}10`,
                border: `1px solid ${darkProTokens.primary}30`,
                borderRadius: 3,
                mb: 3
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ 
                    color: darkProTokens.primary,
                    fontWeight: 700,
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}>
                    <AccountCircleIcon />
                    Cliente: {selectedMembership.user_name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                    📧 {selectedMembership.user_email} | 🏋️‍♂️ {selectedMembership.plan_name}
                  </Typography>
                </CardContent>
              </Card>

              <Grid container spacing={3}>
                {/* Estado */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ 
                      color: darkProTokens.textSecondary,
                      '&.Mui-focused': { color: darkProTokens.primary }
                    }}>
                      Estado de la Membresía
                    </InputLabel>
                    <Select
                      value={editData.status || selectedMembership.status}
                      onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                      sx={{
                        color: darkProTokens.textPrimary,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: `${darkProTokens.primary}30`
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: darkProTokens.primary
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: darkProTokens.primary
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
                      color: darkProTokens.textSecondary,
                      '&.Mui-focused': { color: darkProTokens.primary }
                    }}>
                      Método de Pago
                    </InputLabel>
                    <Select
                      value={editData.payment_method || selectedMembership.payment_method}
                      onChange={(e) => setEditData(prev => ({ ...prev, payment_method: e.target.value }))}
                      sx={{
                        color: darkProTokens.textPrimary,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: `${darkProTokens.primary}30`
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: darkProTokens.primary
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: darkProTokens.primary
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
                        color: darkProTokens.textSecondary,
                        '&.Mui-focused': { color: darkProTokens.primary }
                      }
                    }}
                    InputProps={{
                      sx: {
                        color: darkProTokens.textPrimary,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: `${darkProTokens.primary}30`
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: darkProTokens.primary
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: darkProTokens.primary
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
                        color: darkProTokens.textSecondary,
                        '&.Mui-focused': { color: darkProTokens.primary }
                      }
                    }}
                    InputProps={{
                      sx: {
                        color: darkProTokens.textPrimary,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: `${darkProTokens.primary}30`
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: darkProTokens.primary
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: darkProTokens.primary
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
                        color: darkProTokens.textPrimary,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: `${darkProTokens.primary}30`
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: darkProTokens.primary
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: darkProTokens.primary
                        }
                      }
                    }}
                    InputLabelProps={{
                      sx: { 
                        color: darkProTokens.textSecondary,
                        '&.Mui-focused': { color: darkProTokens.primary }
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
                        color: darkProTokens.textPrimary,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: `${darkProTokens.primary}30`
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: darkProTokens.primary
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: darkProTokens.primary
                        }
                      }
                    }}
                    InputLabelProps={{
                      sx: { 
                        color: darkProTokens.textSecondary,
                        '&.Mui-focused': { color: darkProTokens.primary }
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
                        color: darkProTokens.textPrimary,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: `${darkProTokens.primary}30`
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: darkProTokens.primary
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: darkProTokens.primary
                        }
                      }
                    }}
                    InputLabelProps={{
                      sx: { 
                        color: darkProTokens.textSecondary,
                        '&.Mui-focused': { color: darkProTokens.primary }
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
                  backgroundColor: `${darkProTokens.warning}10`,
                  color: darkProTokens.textPrimary,
                  border: `1px solid ${darkProTokens.warning}30`,
                  '& .MuiAlert-icon': { color: darkProTokens.warning }
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
              color: darkProTokens.textSecondary,
              borderColor: darkProTokens.grayDark,
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
            startIcon={editLoading ? <CircularProgress size={20} sx={{ color: darkProTokens.background }} /> : <SaveIcon />}
            sx={{
              background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
              color: darkProTokens.background,
              fontWeight: 700,
              px: 4,
              py: 1,
              '&:hover': {
                background: `linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive})`,
                transform: 'translateY(-1px)'
              }
            }}
          >
            {editLoading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 🎨 ESTILOS CSS DARK PRO PERSONALIZADOS */}
      <style jsx>{`
        /* Scrollbar personalizado para Dark Pro System */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${darkProTokens.surfaceLevel1};
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover});
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive});
        }
      `}</style>
    </Box>
  );
}
