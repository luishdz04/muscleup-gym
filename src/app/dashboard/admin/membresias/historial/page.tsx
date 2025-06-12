'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  ListItemText,
  Switch,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// ✅ IMPORTS DE UTILIDADES DE FECHA - VERIFICADOS
import {
  getMexicoToday,
  formatDateForDisplay,
  formatTimestampForDisplay,
  createTimestampForDB,
  getDaysBetweenMexicoDates,
  debugDateInfo
} from '@/lib/utils/dateUtils';

// ✅ IMPORTS DEL SISTEMA DE CONGELAMIENTO - VERIFICADOS
import {
  freezeMembership,
  unfreezeMembership,
  getCurrentFrozenDays,
  getProjectedEndDate,
  canFreezeMembership,
  canUnfreezeMembership,
  type FreezeResult
} from '@/src/lib/utils/freezeUtils';

// ✅ ICONOS COMPLETOS - VERIFICADOS
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
import AcUnitIcon from '@mui/icons-material/AcUnit';
import PercentIcon from '@mui/icons-material/Percent';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import BatchIcon from '@mui/icons-material/BatchPrediction';
import FreezeIcon from '@mui/icons-material/Pause';
import UnfreezeIcon from '@mui/icons-material/PlayArrow';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ClearAllIcon from '@mui/icons-material/ClearAll';

// 🎨 DARK PRO SYSTEM - TOKENS VERIFICADOS
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
  primaryDisabled: 'rgba(255,204,0,0.3)',
  success: '#388E3C',
  successHover: '#2E7D32',
  error: '#D32F2F',
  errorHover: '#B71C1C',
  warning: '#FFB300',
  warningHover: '#E6A700',
  info: '#1976D2',
  infoHover: '#1565C0',
  roleAdmin: '#FFCC00',
  roleStaff: '#1976D2',
  roleTrainer: '#009688',
  roleUser: '#777777',
  roleModerator: '#9C27B0',
  roleGuest: '#444444',
  hoverOverlay: 'rgba(255,204,0,0.05)',
  activeOverlay: 'rgba(255,204,0,0.1)',
  borderDefault: '#333333',
  borderHover: '#FFCC00',
  borderActive: '#E6B800'
};

// ✅ INTERFACES COMPLETAS - VERIFICADAS
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
  freeze_date: string | null;
  unfreeze_date: string | null;
  total_frozen_days: number;
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

interface BulkOperation {
  type: 'freeze' | 'unfreeze' | 'cancel';
  membershipIds: string[];
  reason?: string;
}

// ✅ OPCIONES VERIFICADAS
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
  
  // ✅ ESTADOS PRINCIPALES - VERIFICADOS
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
  
  // ✅ ESTADOS PARA CONGELAMIENTO - VERIFICADOS
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [unfreezeLoading, setUnfreezeLoading] = useState(false);
  
  // 🆕 ESTADOS PARA CONGELAMIENTO MASIVO
  const [selectedMembershipIds, setSelectedMembershipIds] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkOperation, setBulkOperation] = useState<BulkOperation>({ type: 'freeze', membershipIds: [] });
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkResults, setBulkResults] = useState<{ success: number; failed: number; errors: string[] }>({ success: 0, failed: 0, errors: [] });
  
  // Estados de edición
  const [editData, setEditData] = useState<Partial<MembershipHistory>>({});
  const [editLoading, setEditLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    client: true,
    membership: true,
    payment: true,
    dates: true,
    freeze: false,
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

  // ✅ FUNCIONES MEMOIZADAS - VERIFICADAS
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    try {
      return formatDateForDisplay(dateString);
    } catch (error) {
      console.warn('⚠️ Error al formatear fecha:', dateString, error);
      return new Date(dateString).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption?.color || darkProTokens.textSecondary;
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption?.icon || '📋';
  }, []);

  // ✅ CARGAR DATOS INICIALES - FUNCIÓN VERIFICADA
  const loadMemberships = useCallback(async () => {
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

      const formattedData: MembershipHistory[] = (data || []).map(item => ({
        ...item,
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
  }, [supabase]);

  const loadPlans = useCallback(async () => {
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
  }, [supabase]);

  const calculateStats = useCallback((data: MembershipHistory[]) => {
    const stats = {
      total: data.length,
      active: data.filter(m => m.status === 'active').length,
      expired: data.filter(m => m.status === 'expired').length,
      frozen: data.filter(m => m.status === 'frozen').length,
      totalRevenue: data.reduce((sum, m) => sum + (m.amount_paid || 0), 0),
      totalCommissions: data.reduce((sum, m) => sum + (m.commission_amount || 0), 0)
    };
    
    setStats(stats);
  }, []);

  // ✅ APLICAR FILTROS - FUNCIÓN VERIFICADA
  const applyFilters = useCallback(() => {
    let filtered = [...memberships];

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(m => 
        m.user_name.toLowerCase().includes(searchLower) ||
        m.user_email.toLowerCase().includes(searchLower) ||
        m.plan_name.toLowerCase().includes(searchLower) ||
        m.payment_reference?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status) {
      filtered = filtered.filter(m => m.status === filters.status);
    }

    if (filters.paymentMethod) {
      filtered = filtered.filter(m => m.payment_method === filters.paymentMethod);
    }

    if (filters.planId) {
      filtered = filtered.filter(m => m.planid === filters.planId);
    }

    if (filters.isRenewal) {
      const isRenewal = filters.isRenewal === 'true';
      filtered = filtered.filter(m => m.is_renewal === isRenewal);
    }

    if (filters.dateFrom) {
      const fromTime = new Date(`${filters.dateFrom}T00:00:00-06:00`).getTime();
      filtered = filtered.filter(m => {
        const membershipTime = new Date(`${m.start_date}T00:00:00-06:00`).getTime();
        return membershipTime >= fromTime;
      });
    }
    
    if (filters.dateTo) {
      const toTime = new Date(`${filters.dateTo}T23:59:59-06:00`).getTime();
      filtered = filtered.filter(m => {
        const membershipTime = new Date(`${m.start_date}T00:00:00-06:00`).getTime();
        return membershipTime <= toTime;
      });
    }

    setFilteredMemberships(filtered);
    calculateStats(filtered);
    setPage(0);
  }, [memberships, filters, calculateStats]);

  // ✅ FUNCIONES DE CONGELAMIENTO INDIVIDUAL - VERIFICADAS
  const handleFreezeMembership = useCallback(async (membership: MembershipHistory) => {
    try {
      setFreezeLoading(true);
      setWarningMessage('🧊 Congelando membresía...');
      
      const validation = canFreezeMembership(membership);
      if (!validation.canFreeze) {
        setError(validation.reason || 'No se puede congelar esta membresía');
        return;
      }
      
      const result: FreezeResult = await freezeMembership(supabase, membership.id);
      
      if (result.success) {
        setSuccessMessage(result.message);
        loadMemberships();
        setActionMenuAnchor(null);
      } else {
        setError(result.error || 'Error al congelar membresía');
      }
      
    } catch (err: any) {
      setError(`Error al congelar membresía: ${err.message}`);
    } finally {
      setFreezeLoading(false);
    }
  }, [supabase, loadMemberships]);

  const handleUnfreezeMembership = useCallback(async (membership: MembershipHistory) => {
    try {
      setUnfreezeLoading(true);
      setWarningMessage('🔄 Reactivando membresía...');
      
      const validation = canUnfreezeMembership(membership);
      if (!validation.canUnfreeze) {
        setError(validation.reason || 'No se puede reactivar esta membresía');
        return;
      }
      
      const result: FreezeResult = await unfreezeMembership(
        supabase,
        membership.id,
        membership.freeze_date!,
        membership.end_date,
        membership.total_frozen_days
      );
      
      if (result.success) {
        setSuccessMessage(result.message);
        loadMemberships();
        setActionMenuAnchor(null);
      } else {
        setError(result.error || 'Error al reactivar membresía');
      }
      
    } catch (err: any) {
      setError(`Error al reactivar membresía: ${err.message}`);
    } finally {
      setUnfreezeLoading(false);
    }
  }, [supabase, loadMemberships]);

  // 🆕 FUNCIONES DE CONGELAMIENTO MASIVO
  const handleSelectAllMemberships = useCallback(() => {
    const activeMemberships = filteredMemberships
      .filter(m => m.status === 'active')
      .map(m => m.id);
    setSelectedMembershipIds(activeMemberships);
  }, [filteredMemberships]);

  const handleClearSelection = useCallback(() => {
    setSelectedMembershipIds([]);
  }, []);

  const handleToggleMembershipSelection = useCallback((membershipId: string) => {
    setSelectedMembershipIds(prev => {
      if (prev.includes(membershipId)) {
        return prev.filter(id => id !== membershipId);
      } else {
        return [...prev, membershipId];
      }
    });
  }, []);

  const handleBulkFreeze = useCallback(() => {
    if (selectedMembershipIds.length === 0) {
      setError('Seleccione al menos una membresía para congelar');
      return;
    }

    const eligibleMemberships = filteredMemberships.filter(m => 
      selectedMembershipIds.includes(m.id) && m.status === 'active'
    );

    if (eligibleMemberships.length === 0) {
      setError('No hay membresías activas seleccionadas para congelar');
      return;
    }

    setBulkOperation({
      type: 'freeze',
      membershipIds: eligibleMemberships.map(m => m.id)
    });
    setBulkDialogOpen(true);
  }, [selectedMembershipIds, filteredMemberships]);

  const handleBulkUnfreeze = useCallback(() => {
    if (selectedMembershipIds.length === 0) {
      setError('Seleccione al menos una membresía para reactivar');
      return;
    }

    const eligibleMemberships = filteredMemberships.filter(m => 
      selectedMembershipIds.includes(m.id) && m.status === 'frozen'
    );

    if (eligibleMemberships.length === 0) {
      setError('No hay membresías congeladas seleccionadas para reactivar');
      return;
    }

    setBulkOperation({
      type: 'unfreeze',
      membershipIds: eligibleMemberships.map(m => m.id)
    });
    setBulkDialogOpen(true);
  }, [selectedMembershipIds, filteredMemberships]);

  const executeBulkOperation = useCallback(async () => {
    setBulkLoading(true);
    setBulkProgress(0);
    setBulkResults({ success: 0, failed: 0, errors: [] });

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < bulkOperation.membershipIds.length; i++) {
      const membershipId = bulkOperation.membershipIds[i];
      const membership = memberships.find(m => m.id === membershipId);
      
      if (!membership) {
        failedCount++;
        errors.push(`Membresía ${membershipId} no encontrada`);
        continue;
      }

      try {
        let result: FreezeResult;
        
        if (bulkOperation.type === 'freeze') {
          result = await freezeMembership(supabase, membershipId);
        } else {
          result = await unfreezeMembership(
            supabase,
            membershipId,
            membership.freeze_date!,
            membership.end_date,
            membership.total_frozen_days
          );
        }

        if (result.success) {
          successCount++;
        } else {
          failedCount++;
          errors.push(`${membership.user_name}: ${result.error || 'Error desconocido'}`);
        }
      } catch (err: any) {
        failedCount++;
        errors.push(`${membership.user_name}: ${err.message}`);
      }

      // Actualizar progreso
      setBulkProgress(Math.round(((i + 1) / bulkOperation.membershipIds.length) * 100));
      
      // Pequeña pausa para evitar sobrecarga
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setBulkResults({ success: successCount, failed: failedCount, errors });
    setBulkLoading(false);
    
    // Recargar datos
    await loadMemberships();
    
    // Limpiar selección
    setSelectedMembershipIds([]);
    setBulkMode(false);

    // Mensaje de resultado
    if (successCount > 0) {
      setSuccessMessage(`✅ Operación masiva completada: ${successCount} exitosas, ${failedCount} fallidas`);
    }
    if (failedCount > 0) {
      setWarningMessage(`⚠️ ${failedCount} operaciones fallaron. Revise los detalles.`);
    }
  }, [bulkOperation, memberships, supabase, loadMemberships]);

  // ✅ FUNCIÓN DE ACTUALIZACIÓN - VERIFICADA
  const handleUpdateMembership = useCallback(async () => {
    if (!selectedMembership || !editData) return;
    
    setEditLoading(true);
    try {
      if (editData.end_date && editData.start_date && editData.end_date <= editData.start_date) {
        setError('La fecha de fin debe ser posterior a la fecha de inicio');
        return;
      }

      if (editData.amount_paid && editData.amount_paid < 0) {
        setError('El monto no puede ser negativo');
        return;
      }

      // ✅ LÓGICA DE EXTENSIÓN CORREGIDA
      if (editData.extend_days > 0 && selectedMembership?.end_date) {
        const currentEnd = new Date(selectedMembership.end_date + 'T00:00:00');
        currentEnd.setDate(currentEnd.getDate() + editData.extend_days);
        editData.end_date = currentEnd.toISOString().split('T')[0];
        
        const extensionNote = `Fecha extendida ${editData.extend_days} día${editData.extend_days > 1 ? 's' : ''} manualmente el ${formatDate(getMexicoToday())}.`;
        editData.notes = editData.notes ? `${editData.notes}\n${extensionNote}` : extensionNote;
        
        console.log(`🔧 Extensión aplicada: ${selectedMembership.end_date} → ${editData.end_date} (+${editData.extend_days} días)`);
      }

      const updateData = {
        ...editData,
        updated_at: createTimestampForDB()
      };

      delete updateData.user_name;
      delete updateData.user_email;
      delete updateData.plan_name;
      delete updateData.created_at;
      delete updateData.extend_days; // No guardar este campo temporal

      const { error } = await supabase
        .from('user_memberships')
        .update(updateData)
        .eq('id', selectedMembership.id);

      if (error) throw error;

      setSuccessMessage('✅ Membresía actualizada exitosamente');
      setEditDialogOpen(false);
      setEditData({});
      loadMemberships();
      
    } catch (err: any) {
      setError(`Error al actualizar membresía: ${err.message}`);
    } finally {
      setEditLoading(false);
    }
  }, [selectedMembership, editData, supabase, loadMemberships, formatDate]);

  // ✅ INICIALIZAR DATOS DE EDICIÓN - FUNCIÓN VERIFICADA
  const initializeEditData = useCallback((membership: MembershipHistory) => {
    setEditData({
      status: membership.status,
      start_date: membership.start_date,
      end_date: membership.end_date,
      amount_paid: membership.amount_paid,
      payment_method: membership.payment_method,
      payment_reference: membership.payment_reference,
      notes: membership.notes,
      commission_rate: membership.commission_rate,
      commission_amount: membership.commission_amount,
      is_mixed_payment: membership.is_mixed_payment,
      cash_amount: 0,
      card_amount: 0,
      transfer_amount: 0,
      extend_days: 0
    });
  }, []);

  // ✅ FUNCIONES UTILITARIAS - VERIFICADAS
  const getDaysRemaining = useCallback((endDate: string | null) => {
    if (!endDate) return null;
    
    const todayMexico = getMexicoToday();
    const daysRemaining = getDaysBetweenMexicoDates(todayMexico, endDate);
    
    debugDateInfo('Cálculo días restantes', { today: todayMexico, end: endDate, remaining: daysRemaining });
    
    return daysRemaining;
  }, []);

  const handleStatusChange = useCallback(async (membership: MembershipHistory, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('user_memberships')
        .update({ 
          status: newStatus,
          updated_at: createTimestampForDB()
        })
        .eq('id', membership.id);

      if (error) throw error;

      setSuccessMessage(`✅ Estado cambiado a ${newStatus}`);
      loadMemberships();
      
    } catch (err: any) {
      setError(`Error al cambiar estado: ${err.message}`);
    }
  }, [supabase, loadMemberships]);

  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      status: '',
      paymentMethod: '',
      dateFrom: '',
      dateTo: '',
      planId: '',
      isRenewal: ''
    });
  }, []);

  // ✅ EFFECTS - VERIFICADOS
  useEffect(() => {
    loadMemberships();
    loadPlans();
  }, [loadMemberships, loadPlans]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // ✅ HANDLERS DE CIERRE - VERIFICADOS
  const handleCloseError = useCallback(() => setError(null), []);
  const handleCloseSuccess = useCallback(() => setSuccessMessage(null), []);
  const handleCloseWarning = useCallback(() => setWarningMessage(null), []);
  const handleCloseInfo = useCallback(() => setInfoMessage(null), []);

  // ✅ MODAL DE EDICIÓN OPTIMIZADO - VERIFICADO
  const OptimizedEditModal = useMemo(() => {
    if (!editDialogOpen || !selectedMembership) return null;

    return (
      <Dialog 
        open={editDialogOpen} 
        onClose={() => !editLoading && setEditDialogOpen(false)}
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
            <EditIcon sx={{ fontSize: 40 }} />
            Editar Registro de Venta
          </Box>
          <IconButton 
            onClick={() => setEditDialogOpen(false)}
            disabled={editLoading}
            sx={{ color: darkProTokens.textSecondary }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ maxHeight: '70vh', overflow: 'auto' }}>
          <Box sx={{ mt: 2 }}>
            {/* Header del Cliente */}
            <Card sx={{
              background: `${darkProTokens.primary}10`,
              border: `1px solid ${darkProTokens.primary}30`,
              borderRadius: 3,
              mb: 3
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ 
                    width: 60, 
                    height: 60, 
                    borderRadius: '50%', 
                    background: darkProTokens.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: darkProTokens.background,
                    fontWeight: 800,
                    fontSize: '1.5rem'
                  }}>
                    {selectedMembership.user_name.split(' ').map((n: string) => n[0]).join('')}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ 
                      color: darkProTokens.primary, 
                      fontWeight: 700
                    }}>
                      {selectedMembership.user_name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                      📧 {selectedMembership.user_email} | 🏋️‍♂️ {selectedMembership.plan_name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                      📅 Registrado: {formatDate(selectedMembership.created_at)}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Chip 
                      label={selectedMembership.is_renewal ? '🔄 RENOVACIÓN' : '🆕 PRIMERA VEZ'}
                      sx={{
                        backgroundColor: selectedMembership.is_renewal ? darkProTokens.warning : darkProTokens.success,
                        color: selectedMembership.is_renewal ? darkProTokens.background : darkProTokens.textPrimary,
                        fontWeight: 700,
                        mb: 1
                      }}
                    />
                    {selectedMembership.skip_inscription && (
                      <Chip 
                        label="🚫 SIN INSCRIPCIÓN" 
                        size="small"
                        sx={{
                          backgroundColor: darkProTokens.success,
                          color: darkProTokens.textPrimary,
                          fontWeight: 600,
                          display: 'block'
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Grid container spacing={3}>
              {/* Estado y Método de Pago */}
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

              {/* Campos para Pago Mixto */}
              {(editData.payment_method === 'mixto' || selectedMembership.payment_method === 'mixto') && (
                <>
                  <Grid size={12}>
                    <Alert severity="info" sx={{
                      backgroundColor: `${darkProTokens.info}10`,
                      color: darkProTokens.textPrimary,
                      border: `1px solid ${darkProTokens.info}30`,
                      '& .MuiAlert-icon': { color: darkProTokens.info }
                    }}>
                      💳 Pago Mixto - Configure los montos por método
                    </Alert>
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      label="Efectivo"
                      type="number"
                      value={editData.cash_amount || 0}
                      onChange={(e) => setEditData(prev => ({ ...prev, cash_amount: parseFloat(e.target.value) || 0 }))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">💵</InputAdornment>,
                        sx: {
                          color: darkProTokens.textPrimary,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: `${darkProTokens.success}30`
                          }
                        }
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      label="Tarjeta"
                      type="number"
                      value={editData.card_amount || 0}
                      onChange={(e) => setEditData(prev => ({ ...prev, card_amount: parseFloat(e.target.value) || 0 }))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">💳</InputAdornment>,
                        sx: {
                          color: darkProTokens.textPrimary,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: `${darkProTokens.info}30`
                          }
                        }
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      label="Transferencia"
                      type="number"
                      value={editData.transfer_amount || 0}
                      onChange={(e) => setEditData(prev => ({ ...prev, transfer_amount: parseFloat(e.target.value) || 0 }))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">🏦</InputAdornment>,
                        sx: {
                          color: darkProTokens.textPrimary,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: `${darkProTokens.warning}30`
                          }
                        }
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <Box sx={{
                      background: `${darkProTokens.primary}10`,
                      border: `1px solid ${darkProTokens.primary}30`,
                      borderRadius: 2,
                      p: 2,
                      textAlign: 'center',
                      height: '56px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}>
                      <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                        Total Mixto
                      </Typography>
                      <Typography variant="h6" sx={{ color: darkProTokens.primary, fontWeight: 700 }}>
                        {formatPrice((editData.cash_amount || 0) + (editData.card_amount || 0) + (editData.transfer_amount || 0))}
                      </Typography>
                    </Box>
                  </Grid>
                </>
              )}

              {/* Fechas */}
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
                      }
                    }
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Fecha de Vencimiento"
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
                      }
                    }
                  }}
                />
              </Grid>

              {/* Montos y Comisiones */}
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Monto Total Pagado"
                  type="number"
                  value={editData.amount_paid || selectedMembership.amount_paid}
                  onChange={(e) => {
                    const amount = parseFloat(e.target.value) || 0;
                    const commissionRate = editData.commission_rate || selectedMembership.commission_rate || 0;
                    const commissionAmount = amount * (commissionRate / 100);
                    setEditData(prev => ({ 
                      ...prev, 
                      amount_paid: amount,
                      commission_amount: commissionAmount
                    }));
                  }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">💰</InputAdornment>,
                    sx: {
                      color: darkProTokens.textPrimary,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: `${darkProTokens.primary}30`
                      }
                    }
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Comisión (%)"
                  type="number"
                  value={editData.commission_rate || selectedMembership.commission_rate || 0}
                  onChange={(e) => {
                    const rate = parseFloat(e.target.value) || 0;
                    const amount = editData.amount_paid || selectedMembership.amount_paid;
                    const commissionAmount = amount * (rate / 100);
                    setEditData(prev => ({ 
                      ...prev, 
                      commission_rate: rate,
                      commission_amount: commissionAmount
                    }));
                  }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><PercentIcon sx={{ color: darkProTokens.warning }} /></InputAdornment>,
                    sx: {
                      color: darkProTokens.textPrimary,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: `${darkProTokens.warning}30`
                      }
                    }
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{
                  background: `${darkProTokens.success}10`,
                  border: `1px solid ${darkProTokens.success}30`,
                  borderRadius: 2,
                  p: 2,
                  textAlign: 'center',
                  height: '56px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                    Comisión Total
                  </Typography>
                  <Typography variant="h6" sx={{ color: darkProTokens.success, fontWeight: 700 }}>
                    {formatPrice(editData.commission_amount || selectedMembership.commission_amount || 0)}
                  </Typography>
                </Box>
              </Grid>

              {/* Referencia */}
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Referencia de Pago"
                  value={editData.payment_reference || selectedMembership.payment_reference || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, payment_reference: e.target.value }))}
                  placeholder="Número de autorización, SPEI, folio, etc."
                  InputProps={{
                    startAdornment: <InputAdornment position="start">📄</InputAdornment>,
                    sx: {
                      color: darkProTokens.textPrimary,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: `${darkProTokens.primary}30`
                      }
                    }
                  }}
                />
              </Grid>

              {/* Extensión Manual */}
              <Grid size={12}>
                <Card sx={{
                  background: `${darkProTokens.info}10`,
                  border: `1px solid ${darkProTokens.info}30`,
                  borderRadius: 3,
                  mt: 2
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ 
                      color: darkProTokens.info,
                      fontWeight: 700,
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <AcUnitIcon />
                      📅 Extensión Manual de Vigencia
                    </Typography>

                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <Box sx={{
                          background: `${darkProTokens.grayDark}10`,
                          border: `1px solid ${darkProTokens.grayDark}30`,
                          borderRadius: 2,
                          p: 2,
                          textAlign: 'center'
                        }}>
                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                            Días Congelados Históricos
                          </Typography>
                          <Typography variant="h6" sx={{ 
                            color: darkProTokens.info,
                            fontWeight: 700
                          }}>
                            🧊 {selectedMembership.total_frozen_days || 0} días
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid size={{ xs: 12, md: 3 }}>
                        <Box sx={{
                          background: `${darkProTokens.grayDark}10`,
                          border: `1px solid ${darkProTokens.grayDark}30`,
                          borderRadius: 2,
                          p: 2,
                          textAlign: 'center'
                        }}>
                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                            Vencimiento Actual
                          </Typography>
                          <Typography variant="body1" sx={{ 
                            color: darkProTokens.textPrimary,
                            fontWeight: 600
                          }}>
                            📅 {selectedMembership.end_date ? formatDate(selectedMembership.end_date) : 'Sin fecha'}
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid size={{ xs: 12, md: 3 }}>
                        <TextField
                          fullWidth
                          label="Días a Extender"
                          type="number"
                          value={editData.extend_days || 0}
                          onChange={(e) => setEditData(prev => ({ ...prev, extend_days: parseInt(e.target.value) || 0 }))}
                          placeholder="Ej: 1"
                          helperText="Solo extiende la fecha de vencimiento"
                          InputProps={{
                            startAdornment: <InputAdornment position="start">📅</InputAdornment>,
                            sx: {
                              color: darkProTokens.textPrimary,
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: `${darkProTokens.info}30`
                              }
                            }
                          }}
                          FormHelperTextProps={{
                            sx: { color: darkProTokens.textSecondary }
                          }}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 3 }}>
                        <Box sx={{
                          background: `${darkProTokens.primary}10`,
                          border: `1px solid ${darkProTokens.primary}30`,
                          borderRadius: 2,
                          p: 2,
                          textAlign: 'center'
                        }}>
                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                            Nueva Fecha de Vencimiento
                          </Typography>
                          <Typography variant="body1" sx={{ 
                            color: darkProTokens.primary,
                            fontWeight: 700
                          }}>
                            📅 {(() => {
                              if (!selectedMembership.end_date || !editData.extend_days) {
                                return selectedMembership.end_date ? formatDate(selectedMembership.end_date) : 'Sin fecha';
                              }
                              const currentEnd = new Date(selectedMembership.end_date + 'T00:00:00');
                              currentEnd.setDate(currentEnd.getDate() + editData.extend_days);
                              return formatDate(currentEnd.toISOString().split('T')[0]);
                            })()}
                          </Typography>
                        </Box>
                      </Grid>

                      {editData.extend_days > 0 && (
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
                              <strong>📅 Extensión de Vigencia:</strong> Se extenderá la fecha de vencimiento por {editData.extend_days} día{editData.extend_days > 1 ? 's' : ''}.<br/>
                              <strong>🧊 Diferencia con congelamiento:</strong> Esto NO se registra como días congelados, solo extiende la vigencia manualmente.
                            </Typography>
                          </Alert>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Notas */}
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Notas del Registro"
                  multiline
                  rows={3}
                  value={editData.notes || selectedMembership.notes || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Observaciones sobre esta venta, correcciones realizadas, etc..."
                  InputProps={{
                    sx: {
                      color: darkProTokens.textPrimary,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: `${darkProTokens.primary}30`
                      }
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
                <strong>⚠️ Edición de Registro:</strong> Solo modifique datos para corregir errores en el registro original.
                {editData.extend_days > 0 && (
                  <>
                    <br/><strong>📅 Extensión Manual:</strong> Se extenderá la vigencia por {editData.extend_days} día{editData.extend_days > 1 ? 's' : ''} (no cuenta como congelamiento).
                  </>
                )}
              </Typography>
            </Alert>
          </Box>
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
            {editLoading ? 'Guardando...' : 'Guardar Correcciones'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }, [editDialogOpen, selectedMembership, editData, editLoading, formatDate, formatPrice, handleUpdateMembership]);

  return (
    <Box sx={{ 
      p: 3, 
      background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
      minHeight: '100vh',
      color: darkProTokens.textPrimary
    }}>
      {/* ✅ SNACKBARS - VERIFICADOS */}
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

      {/* ✅ HEADER ENTERPRISE - VERIFICADO */}
      <Paper sx={{
        p: 4,
        mb: 4,
        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}98, ${darkProTokens.surfaceLevel3}95)`,
        border: `2px solid ${darkProTokens.primary}30`,
        borderRadius: 4,
        boxShadow: `0 8px 32px ${darkProTokens.primary}10`
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3
        }}>
          <Box>
            <Typography variant="h3" sx={{ 
              color: darkProTokens.primary, 
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 1
            }}>
              <HistoryIcon sx={{ fontSize: 50 }} />
              Sistema de Historial de Membresías
            </Typography>
            <Typography variant="h6" sx={{ 
              color: darkProTokens.textSecondary,
              fontWeight: 300
            }}>
              Gestión Integral | Congelamiento Inteligente | Control Masivo
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={2}>
            <Button
              startIcon={<RefreshIcon />}
              onClick={loadMemberships}
              disabled={loading}
              sx={{ 
                color: darkProTokens.info,
                borderColor: `${darkProTokens.info}60`,
                px: 3,
                py: 1.5,
                borderRadius: 3,
                fontWeight: 600,
                '&:hover': {
                  borderColor: darkProTokens.info,
                  backgroundColor: `${darkProTokens.info}10`,
                  transform: 'translateY(-2px)'
                }
              }}
              variant="outlined"
              size="large"
            >
              {loading ? 'Cargando...' : 'Actualizar'}
            </Button>
            
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/dashboard/admin/membresias')}
              sx={{ 
                color: darkProTokens.primary,
                borderColor: `${darkProTokens.primary}60`,
                px: 3,
                py: 1.5,
                borderRadius: 3,
                fontWeight: 600,
                '&:hover': {
                  borderColor: darkProTokens.primary,
                  backgroundColor: `${darkProTokens.primary}10`,
                  transform: 'translateY(-2px)'
                }
              }}
              variant="outlined"
              size="large"
            >
              Dashboard
            </Button>
          </Stack>
        </Box>

        {/* ✅ ESTADÍSTICAS ENTERPRISE - VERIFICADAS */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.info}20, ${darkProTokens.info}10)`,
              border: `1px solid ${darkProTokens.info}30`,
              borderRadius: 3,
              textAlign: 'center',
              p: 2
            }}>
              <Typography variant="h4" sx={{ 
                color: darkProTokens.info, 
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}>
                <GroupIcon />
                {stats.total}
              </Typography>
              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                Total Membresías
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.success}20, ${darkProTokens.success}10)`,
              border: `1px solid ${darkProTokens.success}30`,
              borderRadius: 3,
              textAlign: 'center',
              p: 2
            }}>
              <Typography variant="h4" sx={{ 
                color: darkProTokens.success, 
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}>
                <CheckCircleIcon />
                {stats.active}
              </Typography>
              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                Activas
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.info}20, ${darkProTokens.info}10)`,
              border: `1px solid ${darkProTokens.info}30`,
              borderRadius: 3,
              textAlign: 'center',
              p: 2
            }}>
              <Typography variant="h4" sx={{ 
                color: darkProTokens.info, 
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}>
                <AcUnitIcon />
                {stats.frozen}
              </Typography>
              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                Congeladas
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.error}20, ${darkProTokens.error}10)`,
              border: `1px solid ${darkProTokens.error}30`,
              borderRadius: 3,
              textAlign: 'center',
              p: 2
            }}>
              <Typography variant="h4" sx={{ 
                color: darkProTokens.error, 
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}>
                <CancelIcon />
                {stats.expired}
              </Typography>
              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                Vencidas
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.primary}20, ${darkProTokens.primary}10)`,
              border: `1px solid ${darkProTokens.primary}30`,
              borderRadius: 3,
              textAlign: 'center',
              p: 2
            }}>
              <Typography variant="h5" sx={{ 
                color: darkProTokens.primary, 
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}>
                <AttachMoneyIcon />
                {formatPrice(stats.totalRevenue).replace('MX$', '$')}
              </Typography>
              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                Ingresos Totales
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.warning}20, ${darkProTokens.warning}10)`,
              border: `1px solid ${darkProTokens.warning}30`,
              borderRadius: 3,
              textAlign: 'center',
              p: 2
            }}>
              <Typography variant="h6" sx={{ 
                color: darkProTokens.warning, 
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}>
                <TrendingUpIcon />
                {formatPrice(stats.totalCommissions).replace('MX$', '$')}
              </Typography>
              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                Comisiones
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* 🆕 BARRA DE CONGELAMIENTO MASIVO */}
      <AnimatePresence>
        {bulkMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Paper sx={{
              p: 3,
              mb: 3,
              background: `linear-gradient(135deg, ${darkProTokens.info}20, ${darkProTokens.info}10)`,
              border: `2px solid ${darkProTokens.info}40`,
              borderRadius: 4,
              boxShadow: `0 8px 32px ${darkProTokens.info}20`
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <BatchIcon sx={{ color: darkProTokens.info, fontSize: 30 }} />
                  <Box>
                    <Typography variant="h6" sx={{ 
                      color: darkProTokens.info, 
                      fontWeight: 700 
                    }}>
                      🧊 Modo Congelamiento Masivo Activado
                    </Typography>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                      {selectedMembershipIds.length} membresías seleccionadas
                    </Typography>
                  </Box>
                </Box>

                <Stack direction="row" spacing={2}>
                  <Button
                    startIcon={<SelectAllIcon />}
                    onClick={handleSelectAllMemberships}
                    sx={{ 
                      color: darkProTokens.info,
                      borderColor: `${darkProTokens.info}60`,
                      px: 3,
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: darkProTokens.info,
                        backgroundColor: `${darkProTokens.info}10`
                      }
                    }}
                    variant="outlined"
                    size="small"
                  >
                    Seleccionar Activas
                  </Button>

                  <Button
                    startIcon={<ClearAllIcon />}
                    onClick={handleClearSelection}
                    sx={{ 
                      color: darkProTokens.textSecondary,
                      borderColor: `${darkProTokens.textSecondary}40`,
                      px: 3,
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: darkProTokens.textSecondary,
                        backgroundColor: `${darkProTokens.textSecondary}10`
                      }
                    }}
                    variant="outlined"
                    size="small"
                  >
                    Limpiar
                  </Button>

                  <Button
                    startIcon={<FreezeIcon />}
                    onClick={handleBulkFreeze}
                    disabled={selectedMembershipIds.length === 0}
                    sx={{ 
                      color: darkProTokens.textPrimary,
                      backgroundColor: darkProTokens.info,
                      px: 3,
                      fontWeight: 700,
                      '&:hover': {
                        backgroundColor: darkProTokens.infoHover,
                        transform: 'translateY(-2px)'
                      },
                      '&:disabled': {
                        backgroundColor: `${darkProTokens.info}30`,
                        color: `${darkProTokens.textPrimary}50`
                      }
                    }}
                    variant="contained"
                    size="small"
                  >
                    Congelar Seleccionadas
                  </Button>

                  <Button
                    startIcon={<UnfreezeIcon />}
                    onClick={handleBulkUnfreeze}
                    disabled={selectedMembershipIds.length === 0}
                    sx={{ 
                      color: darkProTokens.textPrimary,
                      backgroundColor: darkProTokens.success,
                      px: 3,
                      fontWeight: 700,
                      '&:hover': {
                        backgroundColor: darkProTokens.successHover,
                        transform: 'translateY(-2px)'
                      },
                      '&:disabled': {
                        backgroundColor: `${darkProTokens.success}30`,
                        color: `${darkProTokens.textPrimary}50`
                      }
                    }}
                    variant="contained"
                    size="small"
                  >
                    Reactivar Seleccionadas
                  </Button>

                  <Button
                    startIcon={<CloseIcon />}
                    onClick={() => {
                      setBulkMode(false);
                      setSelectedMembershipIds([]);
                    }}
                    sx={{ 
                      color: darkProTokens.error,
                      borderColor: `${darkProTokens.error}60`,
                      px: 3,
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: darkProTokens.error,
                        backgroundColor: `${darkProTokens.error}10`
                      }
                    }}
                    variant="outlined"
                    size="small"
                  >
                    Salir
                  </Button>
                </Stack>
              </Box>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ CONTROLES Y FILTROS - VERIFICADOS */}
      <Paper sx={{
        p: 3,
        mb: 3,
        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}95, ${darkProTokens.surfaceLevel3}90)`,
        border: `1px solid ${darkProTokens.primary}20`,
        borderRadius: 4
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ 
            color: darkProTokens.primary, 
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <SearchIcon />
            Búsqueda y Filtros Avanzados
          </Typography>

          <Stack direction="row" spacing={2}>
            {!bulkMode && (
              <Button
                startIcon={<BatchIcon />}
                onClick={() => setBulkMode(true)}
                sx={{ 
                  color: darkProTokens.info,
                  backgroundColor: `${darkProTokens.info}15`,
                  borderColor: `${darkProTokens.info}40`,
                  px: 3,
                  py: 1,
                  fontWeight: 700,
                  '&:hover': {
                    backgroundColor: `${darkProTokens.info}20`,
                    borderColor: darkProTokens.info,
                    transform: 'translateY(-2px)'
                  }
                }}
                variant="outlined"
              >
                Congelamiento Masivo
              </Button>
            )}

            <Button
              startIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ 
                color: darkProTokens.primary,
                borderColor: `${darkProTokens.primary}60`,
                px: 3,
                py: 1,
                fontWeight: 600,
                '&:hover': {
                  borderColor: darkProTokens.primary,
                  backgroundColor: `${darkProTokens.primary}10`
                }
              }}
              variant="outlined"
            >
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </Button>
          </Stack>
        </Box>

        {/* Búsqueda rápida */}
        <TextField
          fullWidth
          placeholder="Buscar por nombre, email, plan o referencia de pago..."
          value={filters.searchTerm}
          onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: darkProTokens.primary }} />
              </InputAdornment>
            ),
            sx: {
              color: darkProTokens.textPrimary,
              backgroundColor: `${darkProTokens.grayDark}20`,
              fontSize: '1.1rem',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: `${darkProTokens.primary}30`,
                borderWidth: 2
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: darkProTokens.primary
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: darkProTokens.primary
              }
            }
          }}
          sx={{ mb: 3 }}
        />

        {/* Filtros avanzados */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 3 }}>
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

                <Grid size={{ xs: 12, md: 3 }}>
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

                <Grid size={{ xs: 12, md: 3 }}>
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
                      <MenuItem value="">Todos los planes</MenuItem>
                      {plans.map((plan) => (
                        <MenuItem key={plan.id} value={plan.id}>
                          {plan.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ 
                      color: darkProTokens.textSecondary,
                      '&.Mui-focused': { color: darkProTokens.primary }
                    }}>
                      Tipo de Venta
                    </InputLabel>
                    <Select
                      value={filters.isRenewal}
                      onChange={(e) => setFilters(prev => ({ ...prev, isRenewal: e.target.value }))}
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
                      <MenuItem value="">Todos los tipos</MenuItem>
                      <MenuItem value="false">🆕 Primera vez</MenuItem>
                      <MenuItem value="true">🔄 Renovación</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Fecha desde"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
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

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Fecha hasta"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
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
              </Grid>

              <Box sx={{ mt: 3, textAlign: 'right' }}>
                <Button
                  onClick={clearFilters}
                  sx={{ 
                    color: darkProTokens.textSecondary,
                    mr: 2,
                    '&:hover': {
                      backgroundColor: `${darkProTokens.textSecondary}10`
                    }
                  }}
                >
                  Limpiar Filtros
                </Button>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Paper>

      {/* ✅ TABLA PRINCIPAL - VERIFICADA */}
      <Card sx={{
        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
        border: `1px solid ${darkProTokens.primary}20`,
        borderRadius: 4,
        overflow: 'hidden'
      }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress 
                size={60} 
                sx={{ color: darkProTokens.primary }}
                thickness={4}
              />
            </Box>
          ) : filteredMemberships.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h5" sx={{ 
                color: darkProTokens.textSecondary,
                mb: 2
              }}>
                📋 No se encontraron membresías
              </Typography>
              <Typography variant="body1" sx={{ 
                color: darkProTokens.textSecondary
              }}>
                Intente ajustar los filtros de búsqueda
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: `${darkProTokens.grayDark}30` }}>
                      {bulkMode && (
                        <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700, width: 50 }}>
                          <Checkbox
                            checked={selectedMembershipIds.length === filteredMemberships.filter(m => m.status === 'active' || m.status === 'frozen').length && selectedMembershipIds.length > 0}
                            indeterminate={selectedMembershipIds.length > 0 && selectedMembershipIds.length < filteredMemberships.filter(m => m.status === 'active' || m.status === 'frozen').length}
                            onChange={() => {
                              const eligibleIds = filteredMemberships
                                .filter(m => m.status === 'active' || m.status === 'frozen')
                                .map(m => m.id);
                              
                              if (selectedMembershipIds.length === eligibleIds.length) {
                                setSelectedMembershipIds([]);
                              } else {
                                setSelectedMembershipIds(eligibleIds);
                              }
                            }}
                            sx={{
                              color: darkProTokens.primary,
                              '&.Mui-checked': { color: darkProTokens.primary },
                              '&.MuiCheckbox-indeterminate': { color: darkProTokens.warning }
                            }}
                          />
                        </TableCell>
                      )}
                      <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Cliente</TableCell>
                      <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Plan</TableCell>
                      <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Estado</TableCell>
                      <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Vigencia</TableCell>
                      <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Pago</TableCell>
                      <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Congelamiento</TableCell>
                      <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredMemberships
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((membership, index) => (
                        <TableRow 
                          key={membership.id}
                          sx={{ 
                            '&:hover': { 
                              backgroundColor: `${darkProTokens.primary}05` 
                            },
                            backgroundColor: selectedMembershipIds.includes(membership.id) ? 
                              `${darkProTokens.info}10` : 'transparent'
                          }}
                        >
                          {bulkMode && (
                            <TableCell>
                              <Checkbox
                                checked={selectedMembershipIds.includes(membership.id)}
                                onChange={() => handleToggleMembershipSelection(membership.id)}
                                disabled={membership.status !== 'active' && membership.status !== 'frozen'}
                                sx={{
                                  color: darkProTokens.primary,
                                  '&.Mui-checked': { color: darkProTokens.primary },
                                  '&.Mui-disabled': { color: darkProTokens.textDisabled }
                                }}
                              />
                            </TableCell>
                          )}
                          
                          <TableCell>
                            <Box>
                              <Typography variant="body1" sx={{ 
                                color: darkProTokens.textPrimary,
                                fontWeight: 600
                              }}>
                                {membership.user_name}
                              </Typography>
                              <Typography variant="caption" sx={{ 
                                color: darkProTokens.textSecondary
                              }}>
                                {membership.user_email}
                              </Typography>
                            </Box>
                          </TableCell>

                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ 
                                color: darkProTokens.textPrimary,
                                fontWeight: 500
                              }}>
                                {membership.plan_name}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                <Chip 
                                  label={membership.payment_type.toUpperCase()}
                                  size="small"
                                  sx={{
                                    backgroundColor: `${darkProTokens.info}20`,
                                    color: darkProTokens.info,
                                    fontSize: '0.7rem',
                                    fontWeight: 600
                                  }}
                                />
                                {membership.is_renewal && (
                                  <Chip 
                                    label="🔄 RENO"
                                    size="small"
                                    sx={{
                                      backgroundColor: `${darkProTokens.warning}20`,
                                      color: darkProTokens.warning,
                                      fontSize: '0.7rem',
                                      fontWeight: 600
                                    }}
                                  />
                                )}
                              </Box>
                            </Box>
                          </TableCell>

                          <TableCell>
                            <Chip 
                              label={`${getStatusIcon(membership.status)} ${membership.status.toUpperCase()}`}
                              sx={{
                                backgroundColor: getStatusColor(membership.status),
                                color: darkProTokens.textPrimary,
                                fontWeight: 600,
                                minWidth: 100
                              }}
                            />
                          </TableCell>

                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ 
                                color: darkProTokens.textPrimary,
                                fontWeight: 500
                              }}>
                                📅 {formatDate(membership.start_date)}
                              </Typography>
                              {membership.end_date ? (
                                <Typography variant="caption" sx={{ 
                                  color: (() => {
                                    const daysRemaining = getDaysRemaining(membership.end_date);
                                    if (daysRemaining === null) return darkProTokens.textSecondary;
                                    if (daysRemaining < 0) return darkProTokens.error;
                                    if (daysRemaining < 7) return darkProTokens.warning;
                                    return darkProTokens.success;
                                  })()
                                }}>
                                  🏁 {(() => {
                                    const daysRemaining = getDaysRemaining(membership.end_date!);
                                    if (daysRemaining === null) return 'Sin límite';
                                    if (daysRemaining < 0) return `Vencida hace ${Math.abs(daysRemaining)} días`;
                                    if (daysRemaining === 0) return 'Vence hoy';
                                    return `${daysRemaining} días restantes`;
                                  })()}
                                </Typography>
                              ) : (
                                <Typography variant="caption" sx={{ 
                                  color: darkProTokens.success
                                }}>
                                  ♾️ Sin vencimiento
                                </Typography>
                              )}
                            </Box>
                          </TableCell>

                          <TableCell>
                            <Box>
                              <Typography variant="body1" sx={{ 
                                color: darkProTokens.primary,
                                fontWeight: 700
                              }}>
                                {formatPrice(membership.amount_paid)}
                              </Typography>
                              <Typography variant="caption" sx={{ 
                                color: darkProTokens.textSecondary
                              }}>
                                {paymentMethodOptions.find(p => p.value === membership.payment_method)?.icon} {membership.payment_method}
                              </Typography>
                            </Box>
                          </TableCell>

                          <TableCell>
                            <Box>
                              {membership.status === 'frozen' ? (
                                <Box>
                                  <Chip 
                                    label={`🧊 ${getCurrentFrozenDays(membership.freeze_date)} días`}
                                    size="small"
                                    sx={{
                                      backgroundColor: `${darkProTokens.info}20`,
                                      color: darkProTokens.info,
                                      fontWeight: 600,
                                      mb: 0.5
                                    }}
                                  />
                                  <Typography variant="caption" sx={{ 
                                    color: darkProTokens.textSecondary,
                                    display: 'block'
                                  }}>
                                    Total: {membership.total_frozen_days} días
                                  </Typography>
                                </Box>
                              ) : membership.total_frozen_days > 0 ? (
                                <Chip 
                                  label={`🧊 ${membership.total_frozen_days} días`}
                                  size="small"
                                  sx={{
                                    backgroundColor: `${darkProTokens.success}20`,
                                    color: darkProTokens.success,
                                    fontWeight: 600
                                  }}
                                />
                              ) : (
                                <Typography variant="caption" sx={{ 
                                  color: darkProTokens.textSecondary
                                }}>
                                  Sin historial
                                </Typography>
                              )}
                            </Box>
                          </TableCell>

                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <Tooltip title="Ver detalles">
                                <IconButton
                                  onClick={() => {
                                    setSelectedMembership(membership);
                                    setDetailsDialogOpen(true);
                                  }}
                                  sx={{ 
                                    color: darkProTokens.info,
                                    '&:hover': { 
                                      backgroundColor: `${darkProTokens.info}15` 
                                    }
                                  }}
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
                                  sx={{ 
                                    color: darkProTokens.warning,
                                    '&:hover': { 
                                      backgroundColor: `${darkProTokens.warning}15` 
                                    }
                                  }}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Más acciones">
                                <IconButton
                                  onClick={(event) => {
                                    setSelectedMembership(membership);
                                    setActionMenuAnchor(event.currentTarget);
                                  }}
                                  sx={{ 
                                    color: darkProTokens.textSecondary,
                                    '&:hover': { 
                                      backgroundColor: `${darkProTokens.textSecondary}15` 
                                    }
                                  }}
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
                rowsPerPageOptions={[5, 10, 25, 50, 100]}
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

      {/* ✅ MENU DE ACCIONES - VERIFICADO */}
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
          
          {selectedMembership?.status === 'frozen' && (
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
          )}
        </MenuList>
      </Menu>

      {/* 🆕 DIALOG DE CONGELAMIENTO MASIVO */}
      <Dialog
        open={bulkDialogOpen}
        onClose={() => !bulkLoading && setBulkDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `2px solid ${darkProTokens.info}50`,
            borderRadius: 4,
            color: darkProTokens.textPrimary,
            boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5)`
          }
        }}
      >
        <DialogTitle sx={{ 
          color: darkProTokens.info, 
          fontWeight: 800,
          fontSize: '1.6rem',
          textAlign: 'center',
          pb: 2
        }}>
          🧊 {bulkOperation.type === 'freeze' ? 'Congelamiento' : 'Reactivación'} Masivo
        </DialogTitle>
        
        <DialogContent>
          {!bulkLoading ? (
            <Box>
              <Alert 
                severity="warning"
                sx={{
                  backgroundColor: `${darkProTokens.warning}10`,
                  color: darkProTokens.textPrimary,
                  border: `1px solid ${darkProTokens.warning}30`,
                  '& .MuiAlert-icon': { color: darkProTokens.warning },
                  mb: 3
                }}
              >
                <Typography variant="body1">
                  <strong>⚠️ Operación Masiva:</strong> Esta acción se aplicará a {bulkOperation.membershipIds.length} membresía{bulkOperation.membershipIds.length > 1 ? 's' : ''}.
                </Typography>
              </Alert>

              <Typography variant="h6" sx={{ 
                color: darkProTokens.textPrimary,
                mb: 2
              }}>
                Membresías seleccionadas:
              </Typography>

              <Box sx={{
                maxHeight: 300,
                overflow: 'auto',
                border: `1px solid ${darkProTokens.grayDark}`,
                borderRadius: 2,
                p: 2
              }}>
                {bulkOperation.membershipIds.map(id => {
                  const membership = memberships.find(m => m.id === id);
                  return membership ? (
                    <Box key={id} sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 1,
                      borderBottom: `1px solid ${darkProTokens.grayDark}40`
                    }}>
                      <Typography variant="body2" sx={{ color: darkProTokens.textPrimary }}>
                        {membership.user_name} - {membership.plan_name}
                      </Typography>
                      <Chip 
                        label={membership.status.toUpperCase()}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(membership.status),
                          color: darkProTokens.textPrimary,
                          fontWeight: 600
                        }}
                      />
                    </Box>
                  ) : null;
                })}
              </Box>

              <TextField
                fullWidth
                label="Motivo (opcional)"
                multiline
                rows={3}
                value={bulkOperation.reason || ''}
                onChange={(e) => setBulkOperation(prev => ({ ...prev, reason: e.target.value }))}
                placeholder={`Motivo del ${bulkOperation.type === 'freeze' ? 'congelamiento' : 'reactivación'} masivo...`}
                sx={{ mt: 3 }}
                InputProps={{
                  sx: {
                    color: darkProTokens.textPrimary,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: `${darkProTokens.info}30`
                    }
                  }
                }}
              />
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" sx={{ 
                color: darkProTokens.info,
                mb: 3,
                textAlign: 'center'
              }}>
                {bulkOperation.type === 'freeze' ? 'Congelando' : 'Reactivando'} membresías...
              </Typography>

              <LinearProgress 
                variant="determinate" 
                value={bulkProgress}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: `${darkProTokens.info}20`,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: darkProTokens.info
                  }
                }}
              />

              <Typography variant="body2" sx={{ 
                color: darkProTokens.textSecondary,
                textAlign: 'center',
                mt: 2
              }}>
                {bulkProgress}% completado
              </Typography>

              {bulkResults.success > 0 || bulkResults.failed > 0 ? (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, mb: 1 }}>
                    Resultados:
                  </Typography>
                  <Typography variant="body2" sx={{ color: darkProTokens.success }}>
                    ✅ Exitosas: {bulkResults.success}
                  </Typography>
                  <Typography variant="body2" sx={{ color: darkProTokens.error }}>
                    ❌ Fallidas: {bulkResults.failed}
                  </Typography>
                  
                  {bulkResults.errors.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ color: darkProTokens.error, mb: 1 }}>
                        Errores:
                      </Typography>
                      <Box sx={{
                        maxHeight: 150,
                        overflow: 'auto',
                        border: `1px solid ${darkProTokens.error}30`,
                        borderRadius: 1,
                        p: 1
                      }}>
                        {bulkResults.errors.map((error, index) => (
                          <Typography key={index} variant="caption" sx={{ 
                            color: darkProTokens.error,
                            display: 'block'
                          }}>
                            • {error}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              ) : null}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={() => setBulkDialogOpen(false)}
            disabled={bulkLoading}
            sx={{ 
              color: darkProTokens.textSecondary,
              borderColor: darkProTokens.grayDark,
              px: 3,
              py: 1
            }}
            variant="outlined"
          >
            {bulkLoading ? 'Procesando...' : 'Cancelar'}
          </Button>
          
          {!bulkLoading && (
            <Button 
              onClick={executeBulkOperation}
              variant="contained"
              startIcon={bulkOperation.type === 'freeze' ? <FreezeIcon /> : <UnfreezeIcon />}
              sx={{
                background: `linear-gradient(135deg, ${darkProTokens.info}, ${darkProTokens.infoHover})`,
                color: darkProTokens.textPrimary,
                fontWeight: 700,
                px: 4,
                py: 1,
                '&:hover': {
                  background: `linear-gradient(135deg, ${darkProTokens.infoHover}, ${darkProTokens.info})`,
                  transform: 'translateY(-1px)'
                }
              }}
            >
              {bulkOperation.type === 'freeze' ? 'Congelar' : 'Reactivar'} {bulkOperation.membershipIds.length} Membresía{bulkOperation.membershipIds.length > 1 ? 's' : ''}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ✅ MODAL DE DETALLES - PLACEHOLDER */}
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
          pb: 2
        }}>
          👁️ Detalles de Membresía
        </DialogTitle>
        
        <DialogContent>
          {selectedMembership && (
            <Typography variant="body1" sx={{ color: darkProTokens.textPrimary }}>
              Detalles completos de {selectedMembership.user_name} - {selectedMembership.plan_name}
              {/* Aquí iría el modal de detalles completo */}
            </Typography>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ MODAL DE EDICIÓN OPTIMIZADO */}
      {OptimizedEditModal}

      {/* ✅ ESTILOS CSS DARK PRO */}
      <style jsx>{`
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
