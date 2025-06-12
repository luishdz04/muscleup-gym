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
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  Slider
} from '@mui/material';
import Grid from '@mui/material/Grid2';
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
  debugDateInfo,
  addDaysToMexicoDate
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
import ManualIcon from '@mui/icons-material/Settings';
import AutoIcon from '@mui/icons-material/AutoMode';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

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

// ✅ INTERFACES COHERENTES - VERIFICADAS
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
  custom_commission_rate: number | null;
  skip_inscription: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  freeze_date: string | null;
  unfreeze_date: string | null;
  total_frozen_days: number;
  payment_details: any;
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

// 🆕 INTERFACE PARA CONGELAMIENTO MASIVO AVANZADO
interface BulkFreezeOperation {
  type: 'freeze' | 'unfreeze' | 'manual_freeze' | 'manual_unfreeze';
  membershipIds: string[];
  reason?: string;
  freezeDays?: number; // Para congelamiento manual
  isManual?: boolean;
}

interface BulkPreview {
  membershipId: string;
  userName: string;
  planName: string;
  currentStatus: string;
  currentEndDate: string | null;
  newEndDate: string | null;
  daysToAdd: number;
}

// ✅ INTERFACE PARA DATOS DE EDICIÓN - COHERENTE CON DB
interface EditData {
  status?: string;
  start_date?: string;
  end_date?: string;
  amount_paid?: number;
  payment_method?: string;
  payment_reference?: string;
  notes?: string;
  commission_rate?: number;
  commission_amount?: number;
  is_mixed_payment?: boolean;
  // ✅ CAMPOS TEMPORALES PARA EL MODAL (NO SE GUARDAN EN DB)
  cash_amount?: number;
  card_amount?: number;
  transfer_amount?: number;
  extend_days?: number;
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
  
  // ✅ ESTADOS PARA CONGELAMIENTO INDIVIDUAL - VERIFICADOS
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [unfreezeLoading, setUnfreezeLoading] = useState(false);
  
  // 🆕 ESTADOS PARA CONGELAMIENTO MASIVO AVANZADO
  const [selectedMembershipIds, setSelectedMembershipIds] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkOperation, setBulkOperation] = useState<BulkFreezeOperation>({ 
    type: 'freeze', 
    membershipIds: [],
    isManual: false,
    freezeDays: 7
  });
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkResults, setBulkResults] = useState<{ success: number; failed: number; errors: string[] }>({ 
    success: 0, 
    failed: 0, 
    errors: [] 
  });
  const [bulkPreview, setBulkPreview] = useState<BulkPreview[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  
  // Estados de edición
  const [editData, setEditData] = useState<EditData>({});
  const [editLoading, setEditLoading] = useState(false);
  
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
        payment_details: item.payment_details || {},
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

  // 🆕 FUNCIONES DE CONGELAMIENTO MASIVO AVANZADO
  const handleSelectAllMemberships = useCallback(() => {
    const eligibleMemberships = filteredMemberships
      .filter(m => m.status === 'active' || m.status === 'frozen')
      .map(m => m.id);
    setSelectedMembershipIds(eligibleMemberships);
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

  const handleBulkFreeze = useCallback((isManual: boolean = false) => {
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
      type: isManual ? 'manual_freeze' : 'freeze',
      membershipIds: eligibleMemberships.map(m => m.id),
      isManual,
      freezeDays: isManual ? 7 : undefined
    });
    
    generateBulkPreview(eligibleMemberships, isManual ? 'manual_freeze' : 'freeze');
    setBulkDialogOpen(true);
  }, [selectedMembershipIds, filteredMemberships]);

  const handleBulkUnfreeze = useCallback((isManual: boolean = false) => {
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
      type: isManual ? 'manual_unfreeze' : 'unfreeze',
      membershipIds: eligibleMemberships.map(m => m.id),
      isManual
    });
    
    generateBulkPreview(eligibleMemberships, isManual ? 'manual_unfreeze' : 'unfreeze');
    setBulkDialogOpen(true);
  }, [selectedMembershipIds, filteredMemberships]);

  // 🆕 GENERAR PREVIEW DE CONGELAMIENTO MASIVO
  const generateBulkPreview = useCallback((eligibleMemberships: MembershipHistory[], operationType: string) => {
    const preview: BulkPreview[] = eligibleMemberships.map(membership => {
      let newEndDate = membership.end_date;
      let daysToAdd = 0;

      if (operationType === 'manual_freeze' && bulkOperation.freezeDays && membership.end_date) {
        // Congelamiento manual: agregar días específicos
        daysToAdd = bulkOperation.freezeDays;
        newEndDate = addDaysToMexicoDate(membership.end_date, daysToAdd);
      } else if (operationType === 'manual_unfreeze' && membership.end_date) {
        // Descongelamiento manual: agregar días congelados actuales
        const currentFrozenDays = getCurrentFrozenDays(membership.freeze_date);
        daysToAdd = currentFrozenDays;
        newEndDate = addDaysToMexicoDate(membership.end_date, daysToAdd);
      }

      return {
        membershipId: membership.id,
        userName: membership.user_name,
        planName: membership.plan_name,
        currentStatus: membership.status,
        currentEndDate: membership.end_date,
        newEndDate,
        daysToAdd
      };
    });

    setBulkPreview(preview);
    setShowPreview(true);
  }, [bulkOperation.freezeDays]);

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
        let result: any;
        
        if (bulkOperation.type === 'freeze' || bulkOperation.type === 'manual_freeze') {
          // Congelamiento automático o manual
          if (bulkOperation.isManual && bulkOperation.freezeDays) {
            // Congelamiento manual con días específicos
            const freezeDate = getMexicoToday();
            let newEndDate = membership.end_date;
            
            if (membership.end_date) {
              newEndDate = addDaysToMexicoDate(membership.end_date, bulkOperation.freezeDays);
            }

            const { error } = await supabase
              .from('user_memberships')
              .update({
                status: 'frozen',
                freeze_date: freezeDate,
                end_date: newEndDate,
                total_frozen_days: (membership.total_frozen_days || 0) + bulkOperation.freezeDays,
                notes: membership.notes ? 
                  `${membership.notes}\nCongelado manualmente por ${bulkOperation.freezeDays} días el ${formatDate(freezeDate)}. ${bulkOperation.reason || ''}` :
                  `Congelado manualmente por ${bulkOperation.freezeDays} días el ${formatDate(freezeDate)}. ${bulkOperation.reason || ''}`,
                updated_at: createTimestampForDB()
              })
              .eq('id', membershipId);

            if (error) throw error;
            result = { success: true };
          } else {
            // Congelamiento automático
            result = await freezeMembership(supabase, membershipId);
          }
        } else {
          // Descongelamiento automático o manual
          if (bulkOperation.isManual) {
            // Descongelamiento manual: agregar días congelados actuales
            const currentFrozenDays = getCurrentFrozenDays(membership.freeze_date);
            let newEndDate = membership.end_date;
            
            if (membership.end_date && currentFrozenDays > 0) {
              newEndDate = addDaysToMexicoDate(membership.end_date, currentFrozenDays);
            }

            const { error } = await supabase
              .from('user_memberships')
              .update({
                status: 'active',
                freeze_date: null,
                unfreeze_date: getMexicoToday(),
                end_date: newEndDate,
                total_frozen_days: (membership.total_frozen_days || 0) + currentFrozenDays,
                notes: membership.notes ? 
                  `${membership.notes}\nDescongelado manualmente el ${formatDate(getMexicoToday())}, agregando ${currentFrozenDays} días. ${bulkOperation.reason || ''}` :
                  `Descongelado manualmente el ${formatDate(getMexicoToday())}, agregando ${currentFrozenDays} días. ${bulkOperation.reason || ''}`,
                updated_at: createTimestampForDB()
              })
              .eq('id', membershipId);

            if (error) throw error;
            result = { success: true };
          } else {
            // Descongelamiento automático
            result = await unfreezeMembership(
              supabase,
              membershipId,
              membership.freeze_date!,
              membership.end_date,
              membership.total_frozen_days
            );
          }
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
      await new Promise(resolve => setTimeout(resolve, 200));
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
      const operationName = bulkOperation.type.includes('freeze') ? 'congelamiento' : 'reactivación';
      const manualText = bulkOperation.isManual ? 'manual' : 'automático';
      setSuccessMessage(`✅ ${operationName.charAt(0).toUpperCase() + operationName.slice(1)} ${manualText} completado: ${successCount} exitosas, ${failedCount} fallidas`);
    }
    if (failedCount > 0) {
      setWarningMessage(`⚠️ ${failedCount} operaciones fallaron. Revise los detalles.`);
    }
  }, [bulkOperation, memberships, supabase, loadMemberships, formatDate]);

  // ✅ FUNCIÓN DE ACTUALIZACIÓN CORREGIDA - COHERENTE CON DB
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
      if (editData.extend_days && editData.extend_days > 0 && selectedMembership?.end_date) {
        const currentEnd = new Date(selectedMembership.end_date + 'T00:00:00');
        currentEnd.setDate(currentEnd.getDate() + editData.extend_days);
        editData.end_date = currentEnd.toISOString().split('T')[0];
        
        const extensionNote = `Fecha extendida ${editData.extend_days} día${editData.extend_days > 1 ? 's' : ''} manualmente el ${formatDate(getMexicoToday())}.`;
        editData.notes = editData.notes ? `${editData.notes}\n${extensionNote}` : extensionNote;
        
        console.log(`🔧 Extensión aplicada: ${selectedMembership.end_date} → ${editData.end_date} (+${editData.extend_days} días)`);
      }

      // ✅ PREPARAR DATOS PARA ACTUALIZACIÓN - SOLO CAMPOS QUE EXISTEN EN LA TABLA
      const updateData: any = {
        updated_at: createTimestampForDB()
      };

      // ✅ SOLO INCLUIR CAMPOS QUE EXISTEN EN user_memberships
      const allowedFields = [
        'status',
        'start_date', 
        'end_date',
        'amount_paid',
        'payment_method',
        'payment_reference',
        'notes',
        'commission_rate',
        'commission_amount',
        'is_mixed_payment'
      ];

      allowedFields.forEach(field => {
        if (editData[field as keyof EditData] !== undefined && editData[field as keyof EditData] !== null) {
          updateData[field] = editData[field as keyof EditData];
        }
      });

      // ✅ MANEJAR PAGOS MIXTOS CORRECTAMENTE - GUARDAR EN JSONB
      if (editData.payment_method === 'mixto' || selectedMembership.payment_method === 'mixto') {
        updateData.is_mixed_payment = true;
        
        // Si hay detalles de pago mixto, guardarlos en payment_details JSONB
        if (editData.cash_amount || editData.card_amount || editData.transfer_amount) {
          const paymentDetails = {
            cash_amount: editData.cash_amount || 0,
            card_amount: editData.card_amount || 0,
            transfer_amount: editData.transfer_amount || 0,
            total_amount: (editData.cash_amount || 0) + (editData.card_amount || 0) + (editData.transfer_amount || 0),
            updated_at: createTimestampForDB()
          };
          
          updateData.payment_details = paymentDetails;
          console.log('💳 Guardando detalles de pago mixto:', paymentDetails);
        }
      } else {
        updateData.is_mixed_payment = false;
        updateData.payment_details = {};
      }

      console.log('💾 Datos a actualizar:', updateData);

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
      console.error('💥 Error al actualizar:', err);
    } finally {
      setEditLoading(false);
    }
  }, [selectedMembership, editData, supabase, loadMemberships, formatDate]);

  // ✅ INICIALIZAR DATOS DE EDICIÓN CORREGIDA
  const initializeEditData = useCallback((membership: MembershipHistory) => {
    // Obtener detalles de pago mixto desde payment_details JSONB
    const paymentDetails = membership.payment_details || {};
    
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
      // ✅ CARGAR DATOS DE PAGO MIXTO DESDE JSONB
      cash_amount: paymentDetails.cash_amount || 0,
      card_amount: paymentDetails.card_amount || 0,
      transfer_amount: paymentDetails.transfer_amount || 0,
      extend_days: 0
    });
  }, []);

  // ✅ FUNCIONES UTILITARIAS - VERIFICADAS
  const getDaysRemaining = useCallback((endDate: string | null) => {
    if (!endDate) return null;
    
    const todayMexico = getMexicoToday();
    const daysRemaining = getDaysBetweenMexicoDates(todayMexico, endDate);
    
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

  // Regenerar preview cuando cambian los días de congelamiento
  useEffect(() => {
    if (showPreview && bulkOperation.type === 'manual_freeze') {
      const eligibleMemberships = filteredMemberships.filter(m => 
        bulkOperation.membershipIds.includes(m.id)
      );
      generateBulkPreview(eligibleMemberships, 'manual_freeze');
    }
  }, [bulkOperation.freezeDays, bulkOperation.membershipIds, filteredMemberships, generateBulkPreview, showPreview, bulkOperation.type]);

  // ✅ HANDLERS DE CIERRE - VERIFICADOS
  const handleCloseError = useCallback(() => setError(null), []);
  const handleCloseSuccess = useCallback(() => setSuccessMessage(null), []);
  const handleCloseWarning = useCallback(() => setWarningMessage(null), []);
  const handleCloseInfo = useCallback(() => setInfoMessage(null), []);

  // ✅ MODAL DE EDICIÓN OPTIMIZADO - COHERENTE CON DB
  const OptimizedEditModal = useMemo(() => {
    if (!editDialogOpen || !selectedMembership) return null;

    // ✅ OBTENER DETALLES DE PAGO MIXTO DESDE JSONB
    const paymentDetailsFromDB = selectedMembership.payment_details || {};
    
    // ✅ SOLO MOSTRAR CAMPOS DE PAGO MIXTO SI SON RELEVANTES
    const showMixedPaymentFields = editData.payment_method === 'mixto' || selectedMembership.payment_method === 'mixto';

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
                    onChange={(e) => {
                      const newMethod = e.target.value;
                      setEditData(prev => ({ 
                        ...prev, 
                        payment_method: newMethod,
                        // ✅ LIMPIAR CAMPOS DE PAGO MIXTO AL CAMBIAR MÉTODO
                        cash_amount: newMethod === 'mixto' ? (prev.cash_amount || paymentDetailsFromDB.cash_amount || 0) : 0,
                        card_amount: newMethod === 'mixto' ? (prev.card_amount || paymentDetailsFromDB.card_amount || 0) : 0,
                        transfer_amount: newMethod === 'mixto' ? (prev.transfer_amount || paymentDetailsFromDB.transfer_amount || 0) : 0
                      }));
                    }}
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

              {/* ✅ CAMPOS PARA PAGO MIXTO - SOLO SI ES RELEVANTE */}
              {showMixedPaymentFields && (
                <>
                  <Grid size={12}>
                    <Alert severity="info" sx={{
                      backgroundColor: `${darkProTokens.info}10`,
                      color: darkProTokens.textPrimary,
                      border: `1px solid ${darkProTokens.info}30`,
                      '& .MuiAlert-icon': { color: darkProTokens.info }
                    }}>
                      💳 Pago Mixto - Los cambios se guardarán en el historial de la membresía
                    </Alert>
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      label="Efectivo"
                      type="number"
                      value={editData.cash_amount ?? paymentDetailsFromDB.cash_amount ?? 0}
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
                      InputLabelProps={{
                        sx: { 
                          color: darkProTokens.textSecondary,
                          '&.Mui-focused': { color: darkProTokens.success }
                        }
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      label="Tarjeta"
                      type="number"
                      value={editData.card_amount ?? paymentDetailsFromDB.card_amount ?? 0}
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
                      InputLabelProps={{
                        sx: { 
                          color: darkProTokens.textSecondary,
                          '&.Mui-focused': { color: darkProTokens.info }
                        }
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      label="Transferencia"
                      type="number"
                      value={editData.transfer_amount ?? paymentDetailsFromDB.transfer_amount ?? 0}
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
                      InputLabelProps={{
                        sx: { 
                          color: darkProTokens.textSecondary,
                          '&.Mui-focused': { color: darkProTokens.warning }
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
                        {formatPrice(
                          (editData.cash_amount ?? paymentDetailsFromDB.cash_amount ?? 0) + 
                          (editData.card_amount ?? paymentDetailsFromDB.card_amount ?? 0) + 
                          (editData.transfer_amount ?? paymentDetailsFromDB.transfer_amount ?? 0)
                        )}
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
                  InputLabelProps={{
                    sx: { 
                      color: darkProTokens.textSecondary,
                      '&.Mui-focused': { color: darkProTokens.primary }
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
                  InputLabelProps={{
                    sx: { 
                      color: darkProTokens.textSecondary,
                      '&.Mui-focused': { color: darkProTokens.warning }
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

              {/* Referencia de Pago */}
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

              {/* ✅ EXTENSIÓN MANUAL CORREGIDA */}
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
              Gestión Integral | Congelamiento Inteligente | Control Masivo Avanzado
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

      {/* 🆕 BARRA DE CONGELAMIENTO MASIVO AVANZADO */}
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
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <BatchIcon sx={{ color: darkProTokens.info, fontSize: 30 }} />
                  <Box>
                    <Typography variant="h6" sx={{ 
                      color: darkProTokens.info, 
                      fontWeight: 700 
                    }}>
                      🧊 Modo Congelamiento Masivo Avanzado
                    </Typography>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                      {selectedMembershipIds.length} membresías seleccionadas • Gestión inteligente por lotes
                    </Typography>
                  </Box>
                </Box>

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
              </Box>

              <Grid container spacing={2}>
                {/* Selección */}
                <Grid size={{ xs: 12, md: 3 }}>
                  <Stack spacing={1}>
                    <Button
                      startIcon={<SelectAllIcon />}
                      onClick={handleSelectAllMemberships}
                      fullWidth
                      sx={{ 
                        color: darkProTokens.info,
                        borderColor: `${darkProTokens.info}60`,
                        fontWeight: 600,
                        '&:hover': {
                          borderColor: darkProTokens.info,
                          backgroundColor: `${darkProTokens.info}10`
                        }
                      }}
                      variant="outlined"
                      size="small"
                    >
                      Seleccionar Todas
                    </Button>

                    <Button
                      startIcon={<ClearAllIcon />}
                      onClick={handleClearSelection}
                      fullWidth
                      sx={{ 
                        color: darkProTokens.textSecondary,
                        borderColor: `${darkProTokens.textSecondary}40`,
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
                  </Stack>
                </Grid>

                {/* Congelamiento */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Stack spacing={1}>
                    <Button
                      startIcon={<AutoIcon />}
                      onClick={() => handleBulkFreeze(false)}
                      disabled={selectedMembershipIds.length === 0}
                      fullWidth
                      sx={{ 
                        color: darkProTokens.textPrimary,
                        backgroundColor: darkProTokens.info,
                        fontWeight: 700,
                        '&:hover': {
                          backgroundColor: darkProTokens.infoHover,
                          transform: 'translateY(-1px)'
                        },
                        '&:disabled': {
                          backgroundColor: `${darkProTokens.info}30`,
                          color: `${darkProTokens.textPrimary}50`
                        }
                      }}
                      variant="contained"
                      size="small"
                    >
                      🧊 Congelar Automático
                    </Button>

                    <Button
                      startIcon={<ManualIcon />}
                      onClick={() => handleBulkFreeze(true)}
                      disabled={selectedMembershipIds.length === 0}
                      fullWidth
                      sx={{ 
                        color: darkProTokens.info,
                        borderColor: `${darkProTokens.info}60`,
                        fontWeight: 600,
                        '&:hover': {
                          borderColor: darkProTokens.info,
                          backgroundColor: `${darkProTokens.info}10`
                        }
                      }}
                      variant="outlined"
                      size="small"
                    >
                      🧊 Congelar Manual
                    </Button>
                  </Stack>
                </Grid>

                {/* Descongelamiento */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Stack spacing={1}>
                    <Button
                      startIcon={<AutoIcon />}
                      onClick={() => handleBulkUnfreeze(false)}
                      disabled={selectedMembershipIds.length === 0}
                      fullWidth
                      sx={{ 
                        color: darkProTokens.textPrimary,
                        backgroundColor: darkProTokens.success,
                        fontWeight: 700,
                        '&:hover': {
                          backgroundColor: darkProTokens.successHover,
                          transform: 'translateY(-1px)'
                        },
                        '&:disabled': {
                          backgroundColor: `${darkProTokens.success}30`,
                          color: `${darkProTokens.textPrimary}50`
                        }
                      }}
                      variant="contained"
                      size="small"
                    >
                      🔄 Reactivar Automático
                    </Button>

                    <Button
                      startIcon={<ManualIcon />}
                      onClick={() => handleBulkUnfreeze(true)}
                      disabled={selectedMembershipIds.length === 0}
                      fullWidth
                      sx={{ 
                        color: darkProTokens.success,
                        borderColor: `${darkProTokens.success}60`,
                        fontWeight: 600,
                        '&:hover': {
                          borderColor: darkProTokens.success,
                          backgroundColor: `${darkProTokens.success}10`
                        }
                      }}
                      variant="outlined"
                      size="small"
                    >
                      🔄 Reactivar Manual
                    </Button>
                  </Stack>
                </Grid>

                {/* Estado */}
                <Grid size={{ xs: 12, md: 1 }}>
                  <Box sx={{
                    background: `${darkProTokens.primary}10`,
                    border: `1px solid ${darkProTokens.primary}30`,
                    borderRadius: 2,
                    p: 1,
                    textAlign: 'center',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <Typography variant="h4" sx={{ 
                      color: darkProTokens.primary,
                      fontWeight: 800
                    }}>
                      {selectedMembershipIds.length}
                    </Typography>
                    <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                      Seleccionadas
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {selectedMembershipIds.length > 0 && (
                <Alert 
                  severity="info"
                  sx={{
                    mt: 2,
                    backgroundColor: `${darkProTokens.info}05`,
                    color: darkProTokens.textPrimary,
                    border: `1px solid ${darkProTokens.info}20`,
                    '& .MuiAlert-icon': { color: darkProTokens.info }
                  }}
                >
                  <Typography variant="body2">
                    <strong>💡 Modos Disponibles:</strong><br/>
                    <strong>🤖 Automático:</strong> El sistema calcula automáticamente los días y fechas<br/>
                    <strong>⚙️ Manual:</strong> Usted especifica cuántos días congelar/agregar y el sistema actualiza las fechas
                  </Typography>
                </Alert>
              )}
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
                🧊 Congelamiento Masivo
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

      {/* 🆕 DIALOG DE CONGELAMIENTO MASIVO AVANZADO */}
      <Dialog
        open={bulkDialogOpen}
        onClose={() => !bulkLoading && setBulkDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `2px solid ${darkProTokens.info}50`,
            borderRadius: 4,
            color: darkProTokens.textPrimary,
            boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5)`,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          color: darkProTokens.info, 
          fontWeight: 800,
          fontSize: '1.8rem',
          textAlign: 'center',
          pb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {bulkOperation.isManual ? <ManualIcon sx={{ fontSize: 40 }} /> : <AutoIcon sx={{ fontSize: 40 }} />}
            🧊 {bulkOperation.type.includes('freeze') ? 'Congelamiento' : 'Reactivación'} Masivo {bulkOperation.isManual ? 'Manual' : 'Automático'}
          </Box>
          <IconButton 
            onClick={() => setBulkDialogOpen(false)}
            disabled={bulkLoading}
            sx={{ color: darkProTokens.textSecondary }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ maxHeight: '70vh', overflow: 'auto' }}>
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
                  <strong>⚠️ Operación Masiva {bulkOperation.isManual ? 'Manual' : 'Automática'}:</strong> Esta acción se aplicará a {bulkOperation.membershipIds.length} membresía{bulkOperation.membershipIds.length > 1 ? 's' : ''}.
                  {bulkOperation.isManual && (
                    <>
                      <br/><strong>⚙️ Modo Manual:</strong> Usted define los días específicos y el sistema actualiza las fechas automáticamente.
                    </>
                  )}
                </Typography>
              </Alert>

              {/* 🆕 CONFIGURACIÓN PARA CONGELAMIENTO MANUAL */}
              {bulkOperation.isManual && bulkOperation.type === 'manual_freeze' && (
                <Card sx={{
                  background: `${darkProTokens.info}10`,
                  border: `1px solid ${darkProTokens.info}30`,
                  borderRadius: 3,
                  mb: 3
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ 
                      color: darkProTokens.info,
                      fontWeight: 700,
                      mb: 3,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <AccessTimeIcon />
                      ⚙️ Configuración de Congelamiento Manual
                    </Typography>

                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body1" sx={{ 
                        color: darkProTokens.textPrimary,
                        fontWeight: 600,
                        mb: 2
                      }}>
                        Días a congelar: {bulkOperation.freezeDays} días
                      </Typography>
                      
                      <Slider
                        value={bulkOperation.freezeDays || 7}
                        onChange={(e, newValue) => {
                          setBulkOperation(prev => ({
                            ...prev,
                            freezeDays: Array.isArray(newValue) ? newValue[0] : newValue
                          }));
                        }}
                        min={1}
                        max={90}
                        step={1}
                        marks={[
                          { value: 1, label: '1 día' },
                          { value: 7, label: '1 semana' },
                          { value: 15, label: '15 días' },
                          { value: 30, label: '1 mes' },
                          { value: 60, label: '2 meses' },
                          { value: 90, label: '3 meses' }
                        ]}
                        valueLabelDisplay="auto"
                        sx={{
                          color: darkProTokens.info,
                          '& .MuiSlider-thumb': {
                            backgroundColor: darkProTokens.info,
                            border: `2px solid ${darkProTokens.textPrimary}`,
                            '&:hover': {
                              boxShadow: `0 0 0 8px ${darkProTokens.info}30`
                            }
                          },
                          '& .MuiSlider-track': {
                            backgroundColor: darkProTokens.info
                          },
                          '& .MuiSlider-rail': {
                            backgroundColor: darkProTokens.grayDark
                          },
                          '& .MuiSlider-mark': {
                            backgroundColor: darkProTokens.textSecondary
                          },
                          '& .MuiSlider-markLabel': {
                            color: darkProTokens.textSecondary,
                            fontSize: '0.75rem'
                          }
                        }}
                      />
                    </Box>

                    <Alert 
                      severity="info"
                      sx={{
                        backgroundColor: `${darkProTokens.info}05`,
                        color: darkProTokens.textPrimary,
                        border: `1px solid ${darkProTokens.info}20`,
                        '& .MuiAlert-icon': { color: darkProTokens.info }
                      }}
                    >
                      <Typography variant="body2">
                        <strong>💡 ¿Cómo funciona?</strong><br/>
                        • Las membresías se marcarán como "congeladas"<br/>
                        • Se agregarán <strong>{bulkOperation.freezeDays} días</strong> a la fecha de vencimiento<br/>
                        • Los días se registrarán en el historial de congelamiento<br/>
                        • El proceso es reversible con la reactivación manual
                      </Typography>
                    </Alert>
                  </CardContent>
                </Card>
              )}

              {/* 🆕 VISTA PREVIA DE CAMBIOS */}
              {showPreview && bulkPreview.length > 0 && (
                <Card sx={{
                  background: `${darkProTokens.success}10`,
                  border: `1px solid ${darkProTokens.success}30`,
                  borderRadius: 3,
                  mb: 3
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ 
                      color: darkProTokens.success,
                      fontWeight: 700,
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <VisibilityIcon />
                      👁️ Vista Previa de Cambios
                    </Typography>

                    <Typography variant="body2" sx={{ 
                      color: darkProTokens.textSecondary,
                      mb: 2
                    }}>
                      Se procesarán {bulkPreview.length} membresías. Aquí se muestran algunos ejemplos:
                    </Typography>

                    <Box sx={{
                      maxHeight: 300,
                      overflow: 'auto',
                      border: `1px solid ${darkProTokens.success}30`,
                      borderRadius: 2
                    }}>
                      <List dense>
                        {bulkPreview.slice(0, 5).map((preview, index) => (
                          <ListItem key={preview.membershipId} sx={{
                            borderBottom: index < Math.min(4, bulkPreview.length - 1) ? 
                              `1px solid ${darkProTokens.grayDark}20` : 'none'
                          }}>
                            <ListItemAvatar>
                              <Avatar sx={{ 
                                background: darkProTokens.primary,
                                color: darkProTokens.background,
                                width: 40,
                                height: 40
                              }}>
                                {preview.userName.split(' ').map(n => n[0]).join('')}
                              </Avatar>
                            </ListItemAvatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body1" sx={{ 
                                color: darkProTokens.textPrimary,
                                fontWeight: 600
                              }}>
                                {preview.userName}
                              </Typography>
                              <Typography variant="caption" sx={{ 
                                color: darkProTokens.textSecondary
                              }}>
                                {preview.planName} • {preview.currentStatus.toUpperCase()}
                              </Typography>
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="body2" sx={{ 
                                  color: darkProTokens.textSecondary
                                }}>
                                  📅 Actual: {preview.currentEndDate ? formatDate(preview.currentEndDate) : 'Sin fecha'}
                                </Typography>
                                {preview.newEndDate && preview.newEndDate !== preview.currentEndDate && (
                                  <Typography variant="body2" sx={{ 
                                    color: darkProTokens.success,
                                    fontWeight: 600
                                  }}>
                                    📅 Nueva: {formatDate(preview.newEndDate)} 
                                    {preview.daysToAdd > 0 && (
                                      <span style={{ color: darkProTokens.info }}>
                                        {' '}(+{preview.daysToAdd} días)
                                      </span>
                                    )}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </ListItem>
                        ))}
                      </List>

                      {bulkPreview.length > 5 && (
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="caption" sx={{ 
                            color: darkProTokens.textSecondary,
                            fontStyle: 'italic'
                          }}>
                            ... y {bulkPreview.length - 5} membresías más
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Lista de Membresías Seleccionadas */}
              <Typography variant="h6" sx={{ 
                color: darkProTokens.textPrimary,
                mb: 2
              }}>
                Membresías seleccionadas ({bulkOperation.membershipIds.length}):
              </Typography>

              <Box sx={{
                maxHeight: 200,
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
                      <Box>
                        <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                          {membership.user_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                          {membership.plan_name} • Vence: {membership.end_date ? formatDate(membership.end_date) : 'Sin fecha'}
                        </Typography>
                      </Box>
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

              {/* Motivo/Razón */}
              <TextField
                fullWidth
                label="Motivo (opcional)"
                multiline
                rows={3}
                value={bulkOperation.reason || ''}
                onChange={(e) => setBulkOperation(prev => ({ ...prev, reason: e.target.value }))}
                placeholder={`Motivo del ${bulkOperation.type.includes('freeze') ? 'congelamiento' : 'reactivación'} masivo...`}
                sx={{ mt: 3 }}
                InputProps={{
                  sx: {
                    color: darkProTokens.textPrimary,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: `${darkProTokens.info}30`
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: darkProTokens.info
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: darkProTokens.info
                    }
                  }
                }}
                InputLabelProps={{
                  sx: { 
                    color: darkProTokens.textSecondary,
                    '&.Mui-focused': { color: darkProTokens.info }
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
                {bulkOperation.type.includes('freeze') ? 'Congelando' : 'Reactivando'} membresías{bulkOperation.isManual ? ' manualmente' : ''}...
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
                {bulkProgress}% completado • Procesando {bulkOperation.membershipIds.length} membresías
              </Typography>

              {bulkResults.success > 0 || bulkResults.failed > 0 ? (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, mb: 1 }}>
                    Resultados en tiempo real:
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={6}>
                      <Box sx={{
                        background: `${darkProTokens.success}10`,
                        border: `1px solid ${darkProTokens.success}30`,
                        borderRadius: 2,
                        p: 2,
                        textAlign: 'center'
                      }}>
                        <Typography variant="h4" sx={{ color: darkProTokens.success, fontWeight: 800 }}>
                          {bulkResults.success}
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          ✅ Exitosas
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={6}>
                      <Box sx={{
                        background: `${darkProTokens.error}10`,
                        border: `1px solid ${darkProTokens.error}30`,
                        borderRadius: 2,
                        p: 2,
                        textAlign: 'center'
                      }}>
                        <Typography variant="h4" sx={{ color: darkProTokens.error, fontWeight: 800 }}>
                          {bulkResults.failed}
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          ❌ Fallidas
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  {bulkResults.errors.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ color: darkProTokens.error, mb: 1 }}>
                        Errores detectados:
                      </Typography>
                      <Box sx={{
                        maxHeight: 150,
                        overflow: 'auto',
                        border: `1px solid ${darkProTokens.error}30`,
                        borderRadius: 1,
                        p: 1,
                        background: `${darkProTokens.error}05`
                      }}>
                        {bulkResults.errors.map((error, index) => (
                          <Typography key={index} variant="caption" sx={{ 
                            color: darkProTokens.error,
                            display: 'block',
                            fontSize: '0.75rem'
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
              startIcon={
                bulkOperation.type.includes('freeze') ? 
                  (bulkOperation.isManual ? <ManualIcon /> : <FreezeIcon />) : 
                  (bulkOperation.isManual ? <ManualIcon /> : <UnfreezeIcon />)
              }
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
              {bulkOperation.type.includes('freeze') ? 
                `🧊 Congelar ${bulkOperation.membershipIds.length} Membresía${bulkOperation.membershipIds.length > 1 ? 's' : ''}` :
                `🔄 Reactivar ${bulkOperation.membershipIds.length} Membresía${bulkOperation.membershipIds.length > 1 ? 's' : ''}`
              }
              {bulkOperation.isManual && bulkOperation.freezeDays && (
                <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                  {' '}({bulkOperation.freezeDays} días)
                </span>
              )}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ✅ MODAL DE DETALLES - PLACEHOLDER MEJORADO */}
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
            <VisibilityIcon sx={{ fontSize: 40 }} />
            Detalles Completos de Membresía
          </Box>
          <IconButton 
            onClick={() => setDetailsDialogOpen(false)}
            sx={{ color: darkProTokens.textSecondary }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          {selectedMembership && (
            <Box>
              <Typography variant="h6" sx={{ color: darkProTokens.primary, mb: 2 }}>
                📋 {selectedMembership.user_name} - {selectedMembership.plan_name}
              </Typography>
              <Typography variant="body1" sx={{ color: darkProTokens.textSecondary }}>
                🚧 Vista detallada en desarrollo...
              </Typography>
              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mt: 1 }}>
                ID: {selectedMembership.id}<br/>
                Estado: {selectedMembership.status}<br/>
                Monto: {formatPrice(selectedMembership.amount_paid)}<br/>
                Días congelados: {selectedMembership.total_frozen_days}
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={() => setDetailsDialogOpen(false)}
            sx={{ 
              color: darkProTokens.primary,
              borderColor: darkProTokens.primary,
              px: 3,
              py: 1
            }}
            variant="outlined"
          >
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
