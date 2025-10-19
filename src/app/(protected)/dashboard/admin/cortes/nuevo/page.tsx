'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  TextField,
  Divider,
  Avatar,
  Stack,
  Paper,
  Chip,
  IconButton,
  Switch,
  FormControlLabel,
  InputAdornment,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Badge,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Receipt as ReceiptIcon,
  AttachMoney as AttachMoneyIcon,
  AccountBalance as AccountBalanceIcon,
  CreditCard as CreditCardIcon,
  Assessment as AssessmentIcon,
  Edit as EditIcon,
  AutoMode as AutoModeIcon,
  Build as BuildIcon,
  Savings as SavingsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as VisibilityIcon,
  ShoppingCart as ShoppingCartIcon,
  FitnessCenter as FitnessCenterIcon,
  Payment as PaymentIcon,
  Schedule as ScheduleIcon,
  DateRange as DateRangeIcon,
  Person as PersonIcon,
  LocalOffer as LocalOfferIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  MoneyOff as MoneyOffIcon,
  PictureAsPdf as PictureAsPdfIcon,
  ArrowBack as ArrowBackIcon
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
import { getTodayInMexico, formatDateLong, formatMexicoTime } from '@/utils/dateUtils';

const formatPrice = (amount: number): string => formatCurrency(Number.isFinite(amount) ? amount : 0);

function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return formatMexicoTime(date, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    return dateString;
  }
}

function createTimestampForDB(): string {
  const now = new Date();
  const mexicoTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
  
  const year = mexicoTime.getFullYear();
  const month = String(mexicoTime.getMonth() + 1).padStart(2, '0');
  const day = String(mexicoTime.getDate()).padStart(2, '0');
  const hours = String(mexicoTime.getHours()).padStart(2, '0');
  const minutes = String(mexicoTime.getMinutes()).padStart(2, '0');
  const seconds = String(mexicoTime.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}-06:00`;
}

// ✅ INTERFACES
interface DailyData {
  date: string;
  timezone_info?: {
    mexico_date: string;
    utc_range: {
      start: string;
      end: string;
    };
    note: string;
  };
  pos: {
    efectivo: number;
    transferencia: number;
    debito: number;
    credito: number;
    total: number;
    transactions: number;
    commissions: number;
  };
  abonos: {
    efectivo: number;
    transferencia: number;
    debito: number;
    credito: number;
    total: number;
    transactions: number;
    commissions: number;
  };
  memberships: {
    efectivo: number;
    transferencia: number;
    debito: number;
    credito: number;
    total: number;
    transactions: number;
    commissions: number;
  };
  totals: {
    efectivo: number;
    transferencia: number;
    debito: number;
    credito: number;
    total: number;
    transactions: number;
    commissions: number;
    net_amount: number;
  };
}

interface EditableData {
  pos_efectivo: number;
  pos_transferencia: number;
  pos_debito: number;
  pos_credito: number;
  pos_transactions: number;
  abonos_efectivo: number;
  abonos_transferencia: number;
  abonos_debito: number;
  abonos_credito: number;
  abonos_transactions: number;
  membership_efectivo: number;
  membership_transferencia: number;
  membership_debito: number;
  membership_credito: number;
  membership_transactions: number;
  expenses_amount: number;
}

interface TransactionDetail {
  id: string;
  type: 'pos' | 'abono' | 'membership';
  // POS Fields
  product_name?: string;
  quantity?: number;
  unit_price?: number;
  // Membership Fields
  membership_type?: string;
  membership_duration?: string;
  payment_sequence?: number;
  is_payment_detail?: boolean;
  // Common Fields
  customer_name?: string;
  customer_phone?: string;
  payment_method: string;
  amount: number;
  base_amount?: number;
  commission_amount?: number;
  created_at: string;
  reference?: string;
  notes?: string;
  // Status
  status: string;
  is_partial_payment?: boolean;
}

// ✅ INTERFACE PARA USUARIO
interface CurrentUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  rol?: string;
  username?: string;
}

// ✅ NUEVO: Interface para resumen de egresos
interface ExpensesSummary {
  total_amount: number;
  total_expenses: number;
  categories: any;
}

export default function NuevoCorteePage() {
  const router = useRouter();
  const isHydrated = useHydrated();
  useUserTracking();
  const { toast } = useNotifications();
  
  // ✅ ESTADOS
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const mexicoDateString = getTodayInMexico();
    const mexicoDate = new Date(mexicoDateString + 'T12:00:00');
    return mexicoDate;
  });
  
  const [currentTime, setCurrentTime] = useState<string>('');
  
  // ✅ NUEVO: Estado para usuario autenticado
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [editableData, setEditableData] = useState<EditableData>({
    pos_efectivo: 0,
    pos_transferencia: 0,
    pos_debito: 0,
    pos_credito: 0,
    pos_transactions: 0,
    abonos_efectivo: 0,
    abonos_transferencia: 0,
    abonos_debito: 0,
    abonos_credito: 0,
    abonos_transactions: 0,
    membership_efectivo: 0,
    membership_transferencia: 0,
    membership_debito: 0,
    membership_credito: 0,
    membership_transactions: 0,
    expenses_amount: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createdCutId, setCreatedCutId] = useState<string | null>(null);
  const [observations, setObservations] = useState('');
  const [cutExists, setCutExists] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [dataHasContent, setDataHasContent] = useState(false);
  
  const [showDetails, setShowDetails] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<TransactionDetail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);

  // ✅ NUEVOS ESTADOS PARA EGRESOS
  const [expensesSummary, setExpensesSummary] = useState<ExpensesSummary | null>(null);
  const [loadingExpenses, setLoadingExpenses] = useState(false);

  // ✅ FUNCIÓN: Cargar usuario autenticado
  const loadCurrentUser = async () => {
    try {
      setLoadingUser(true);
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      
      if (data.success && data.user) {
        setCurrentUser(data.user);
      } else {
        // Fallback con datos conocidos
        setCurrentUser({
          id: 'unknown',
          firstName: 'luishdz04',
          email: 'luis@muscleup.com',
          username: 'luishdz04'
        });
      }
    } catch (error) {
      console.error('Error cargando usuario:', error);
      // Fallback con datos conocidos
      setCurrentUser({
        id: 'unknown',
        firstName: 'luishdz04',
        email: 'luis@muscleup.com',
        username: 'luishdz04'
      });
    } finally {
      setLoadingUser(false);
    }
  };

  // ✅ FUNCIÓN: Obtener nombre del usuario
  const getCurrentUserDisplayName = () => {
    if (loadingUser) return 'Cargando...';
    if (!currentUser) return 'Usuario';
    
    if (currentUser.firstName && currentUser.lastName) {
      return `${currentUser.firstName} ${currentUser.lastName}`;
    } else if (currentUser.firstName) {
      return currentUser.firstName;
    } else if (currentUser.username) {
      return currentUser.username;
    } else if (currentUser.email) {
      return currentUser.email.split('@')[0];
    } else {
      return 'Usuario';
    }
  };

  // ✅ FUNCIÓN CORREGIDA: Cargar egresos para una fecha específica
  const loadExpensesForDate = async (dateString: string) => {
    try {
      setLoadingExpenses(true);
      
      const response = await fetch(`/api/expenses/daily?date=${dateString}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        const totalExpenses = parseFloat(data.summary?.total_amount?.toString() || '0');
        const expenseCount = data.summary?.total_expenses || 0;
        
        // ✅ ACTUALIZAR DE FORMA QUE FORCE RE-RENDER CORRECTAMENTE
        setEditableData(prev => {
          const newData = {
            ...prev,
            expenses_amount: totalExpenses
          };
          console.log('📊 Actualizando editableData con egresos:', {
            antes: prev.expenses_amount,
            ahora: totalExpenses,
            newData
          });
          return newData;
        });
        
        // ✅ Guardar resumen para mostrar información
        setExpensesSummary({
          total_amount: totalExpenses,
          total_expenses: expenseCount,
          categories: data.summary?.categories || {}
        });
        
      } else {

        setEditableData(prev => ({
          ...prev,
          expenses_amount: 0
        }));
        setExpensesSummary(null);
      }
    } catch (error) {
      console.error('Error cargando egresos:', error);
      setEditableData(prev => ({
        ...prev,
        expenses_amount: 0
      }));
      setExpensesSummary(null);
    } finally {
      setLoadingExpenses(false);
    }
  };

  // ✅ EFECTOS
  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const mexicoTime = formatMexicoTime(now);
      setCurrentTime(mexicoTime);
    };
    
    updateClock();
    const interval = setInterval(updateClock, 1000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadDailyData(selectedDate);
  }, [selectedDate]);

  // ✅ NUEVO: Cargar egresos automáticamente cuando cambie la fecha
  useEffect(() => {
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      loadExpensesForDate(dateString);
    }
  }, [selectedDate]);

  // ✅ NUEVO: Effect para debugging cuando cambien los egresos
  useEffect(() => {

  }, [editableData.expenses_amount]);

  // ✅ FUNCIÓN CORREGIDA: calculateTotals
  const calculateTotals = () => {
    const pos_total = editableData.pos_efectivo + editableData.pos_transferencia + 
                     editableData.pos_debito + editableData.pos_credito;
    
    const abonos_total = editableData.abonos_efectivo + editableData.abonos_transferencia + 
                        editableData.abonos_debito + editableData.abonos_credito;
    
    const membership_total = editableData.membership_efectivo + editableData.membership_transferencia + 
                            editableData.membership_debito + editableData.membership_credito;
    
    const total_efectivo = editableData.pos_efectivo + editableData.abonos_efectivo + editableData.membership_efectivo;
    const total_transferencia = editableData.pos_transferencia + editableData.abonos_transferencia + editableData.membership_transferencia;
    const total_debito = editableData.pos_debito + editableData.abonos_debito + editableData.membership_debito;
    const total_credito = editableData.pos_credito + editableData.abonos_credito + editableData.membership_credito;
    
    const grand_total = pos_total + abonos_total + membership_total;
    const total_transactions = editableData.pos_transactions + editableData.abonos_transactions + editableData.membership_transactions;
    
    // ✅ ASEGURAR QUE USE EL VALOR CORRECTO DE EXPENSES_AMOUNT
    const expenses_amount = parseFloat(editableData.expenses_amount?.toString() || '0');
    const final_balance = grand_total - expenses_amount;
    
    console.log('🧮 Totales calculados:', {
      grand_total,
      expenses_amount_raw: editableData.expenses_amount,
      expenses_amount_parsed: expenses_amount,
      final_balance,
      calculation: `${grand_total} - ${expenses_amount} = ${final_balance}`
    });
    
    return {
      pos_total,
      abonos_total,
      membership_total,
      total_efectivo,
      total_transferencia,
      total_debito,
      total_credito,
      grand_total,
      total_transactions,
      final_balance,
      expenses_amount // ✅ AGREGAR PARA REFERENCIA
    };
  };

  const loadTransactionDetails = async (date: Date) => {
    try {
      setLoadingDetails(true);
      const dateString = date.toISOString().split('T')[0];
      

      
      const response = await fetch(`/api/cuts/transaction-details?date=${dateString}`);
      const data = await response.json();
      


      
      if (data.success) {
        const details: TransactionDetail[] = [
          // 🛒 POS TRANSACTIONS
          ...(data.pos_transactions || []).map((transaction: any) => ({
            id: transaction.id,
            type: 'pos' as const,
            product_name: transaction.product_name,
            quantity: transaction.quantity,
            unit_price: transaction.unit_price,
            customer_name: transaction.customer_name,
            customer_phone: transaction.customer_phone,
            payment_method: transaction.payment_method,
            amount: transaction.amount,
            base_amount: transaction.base_amount,
            commission_amount: transaction.commission_amount,
            created_at: transaction.created_at,
            reference: transaction.reference,
            notes: transaction.notes,
            status: transaction.status
          })),
          
          // 💰 ABONOS TRANSACTIONS
          ...(data.abonos_transactions || []).map((transaction: any) => ({
            id: transaction.id,
            type: 'abono' as const,
            product_name: transaction.product_name,
            customer_name: transaction.customer_name,
            customer_phone: transaction.customer_phone,
            payment_method: transaction.payment_method,
            amount: transaction.amount,
            base_amount: transaction.base_amount,
            commission_amount: transaction.commission_amount,
            created_at: transaction.created_at,
            reference: transaction.reference,
            notes: transaction.notes,
            status: transaction.status,
            is_partial_payment: true
          })),
          
          // 🎫 MEMBERSHIP TRANSACTIONS
          ...(data.membership_transactions || []).map((transaction: any) => ({
            id: transaction.id,
            type: 'membership' as const,
            membership_type: transaction.membership_type,
            membership_duration: transaction.membership_duration,
            customer_name: transaction.customer_name,
            customer_phone: transaction.customer_phone,
            payment_method: transaction.payment_method,
            amount: transaction.amount,
            commission_amount: transaction.commission_amount,
            created_at: transaction.created_at,
            reference: transaction.reference,
            notes: transaction.notes,
            status: transaction.status,
            payment_sequence: transaction.payment_sequence,
            is_payment_detail: transaction.is_payment_detail
          }))
        ];
        




        
        // Ordenar por fecha de creación (más reciente primero)
        details.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        setTransactionDetails(details);

      } else {
        console.error('Error cargando detalles:', data.error);
        setTransactionDetails([]);
      }
    } catch (error) {
      console.error('Error:', error);
      setTransactionDetails([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  const loadDailyData = async (date: Date) => {
    try {
      setLoading(true);
      setError(null);
      
      const dateString = date.toISOString().split('T')[0];

      
      const response = await fetch(`/api/cuts/daily-data?date=${dateString}`);
      const data = await response.json();
      
      if (data.success) {
        setDailyData(data);
        
        const hasData = data.totals.total > 0 || data.totals.transactions > 0;
        setDataHasContent(hasData);
        
        if (hasData) {
          setEditableData(prev => ({
            ...prev,
            pos_efectivo: data.pos.efectivo || 0,
            pos_transferencia: data.pos.transferencia || 0,
            pos_debito: data.pos.debito || 0,
            pos_credito: data.pos.credito || 0,
            pos_transactions: data.pos.transactions || 0,
            abonos_efectivo: data.abonos.efectivo || 0,
            abonos_transferencia: data.abonos.transferencia || 0,
            abonos_debito: data.abonos.debito || 0,
            abonos_credito: data.abonos.credito || 0,
            abonos_transactions: data.abonos.transactions || 0,
            membership_efectivo: data.memberships.efectivo || 0,
            membership_transferencia: data.memberships.transferencia || 0,
            membership_debito: data.memberships.debito || 0,
            membership_credito: data.memberships.credito || 0,
            membership_transactions: data.memberships.transactions || 0,
            // ✅ NO RESETEAR expenses_amount aquí, se carga en loadExpensesForDate
          }));
          setIsManualMode(false);
          
          await loadTransactionDetails(date);
        } else {
          setIsManualMode(true);
          setEditableData(prev => ({
            ...prev,
            pos_efectivo: 0,
            pos_transferencia: 0,
            pos_debito: 0,
            pos_credito: 0,
            pos_transactions: 0,
            abonos_efectivo: 0,
            abonos_transferencia: 0,
            abonos_debito: 0,
            abonos_credito: 0,
            abonos_transactions: 0,
            membership_efectivo: 0,
            membership_transferencia: 0,
            membership_debito: 0,
            membership_credito: 0,
            membership_transactions: 0,
            // ✅ NO RESETEAR expenses_amount aquí, se carga en loadExpensesForDate
          }));
          setTransactionDetails([]);
        }
        
        await checkExistingCut(dateString);
      } else {
        setError('Error al cargar datos del día');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar datos del día');
    } finally {
      setLoading(false);
    }
  };

  const checkExistingCut = async (dateString: string) => {
    try {
      const response = await fetch(`/api/cuts/check-existing?date=${dateString}`);
      const data = await response.json();
      setCutExists(data.exists);
    } catch (error) {
      console.error('Error verificando corte existente:', error);
    }
  };

  const handleCreateCut = async () => {
    try {
      setCreating(true);
      setError(null);
      
      const dateString = selectedDate.toISOString().split('T')[0];
      const totals = calculateTotals();
      
      const cutData = {
        cut_date: dateString,
        created_at_mexico: createTimestampForDB(),
        notes: observations.trim(),
        is_manual: isManualMode,
        
        pos_efectivo: editableData.pos_efectivo,
        pos_transferencia: editableData.pos_transferencia,
        pos_debito: editableData.pos_debito,
        pos_credito: editableData.pos_credito,
        pos_total: totals.pos_total,
        pos_transactions: editableData.pos_transactions,
        pos_commissions: 0,
        
        abonos_efectivo: editableData.abonos_efectivo,
        abonos_transferencia: editableData.abonos_transferencia,
        abonos_debito: editableData.abonos_debito,
        abonos_credito: editableData.abonos_credito,
        abonos_total: totals.abonos_total,
        abonos_transactions: editableData.abonos_transactions,
        abonos_commissions: 0,
        
        membership_efectivo: editableData.membership_efectivo,
        membership_transferencia: editableData.membership_transferencia,
        membership_debito: editableData.membership_debito,
        membership_credito: editableData.membership_credito,
        membership_total: totals.membership_total,
        membership_transactions: editableData.membership_transactions,
        membership_commissions: 0,
        
        total_efectivo: totals.total_efectivo,
        total_transferencia: totals.total_transferencia,
        total_debito: totals.total_debito,
        total_credito: totals.total_credito,
        grand_total: totals.grand_total,
        total_transactions: totals.total_transactions,
        total_commissions: 0,
        net_amount: totals.grand_total,
        expenses_amount: editableData.expenses_amount,
        final_balance: totals.final_balance
      };
      

      
      const response = await fetch('/api/cuts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cutData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccess(`✅ Corte creado exitosamente: ${result.cut_number}`);
        setCreatedCutId(result.cut_id);
        // No redirigir automáticamente para dar tiempo al usuario de descargar el PDF
        // setTimeout(() => {
        //   router.push(`/dashboard/admin/cortes`);
        // }, 2000);
      } else {
        setError(result.error || 'Error al crear el corte');
      }
    } catch (error) {
      console.error('Error creando corte:', error);
      setError('Error al crear el corte');
    } finally {
      setCreating(false);
    }
  };

  const downloadCutPDF = async () => {
    if (!createdCutId) return;

    try {
      console.log('📄 [NUEVO-CORTE] Descargando PDF para corte:', createdCutId);

      const response = await fetch(`/api/cuts/${createdCutId}/generate-pdf`);

      if (!response.ok) {
        throw new Error('Error al generar PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `corte-${createdCutId.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log('✅ [NUEVO-CORTE] PDF descargado exitosamente');
    } catch (error) {
      console.error('❌ [NUEVO-CORTE] Error descargando PDF:', error);
      setError('Error al descargar el PDF del corte');
    }
  };

  const handleEditableChange = (field: keyof EditableData, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setEditableData(prev => ({
      ...prev,
      [field]: numericValue
    }));
  };

  const handleDateChange = (newDate: any) => {
    if (newDate && newDate instanceof Date) {
      setSelectedDate(newDate);
      setSuccess(null);
      setError(null);
    } else if (newDate && typeof newDate === 'object' && '$d' in newDate) {
      setSelectedDate(newDate.$d as Date);
      setSuccess(null);
      setError(null);
    }
  };

  // ✅ CALCULAR TOTALES CON LOGGING MEJORADO
  const totals = calculateTotals();

  const getTransactionsByType = (type: 'pos' | 'abono' | 'membership') => {
    return transactionDetails.filter(t => t.type === type);
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'efectivo':
        return colorTokens.brand;
      case 'transferencia':
        return colorTokens.info;
      case 'debito':
        return colorTokens.success;
      case 'credito':
        return colorTokens.danger;
      default:
        return colorTokens.textSecondary;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'efectivo':
        return '💵';
      case 'transferencia':
        return '🏦';
      case 'debito':
        return '💳';
      case 'credito':
        return '💳';
      default:
        return '💰';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box sx={{ 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.surfaceLevel1})`,
        color: colorTokens.textPrimary,
        p: 4,
        // ✅ CSS GLOBAL PARA DATEPICKER
        '& .MuiPickersLayout-root': {
          backgroundColor: colorTokens.surfaceLevel2,
        },
        '& .MuiDayCalendar-weekContainer': {
          '& .MuiPickersDay-root': {
            color: colorTokens.textPrimary,
            '&:hover': {
              backgroundColor: `${colorTokens.brand}30`,
            },
            '&.Mui-selected': {
              backgroundColor: colorTokens.brand,
              color: colorTokens.neutral0,
            },
          },
        },
        '& .MuiPickersCalendarHeader-root': {
          '& .MuiPickersCalendarHeader-label': {
            color: colorTokens.textPrimary,
          },
          '& .MuiIconButton-root': {
            color: colorTokens.textPrimary,
          },
        },
        '& .MuiPickersDay-today': {
          borderColor: colorTokens.brand,
        },
        '& .MuiTypography-caption': {
          color: colorTokens.textSecondary,
        },
        '& .MuiPickersLayout-contentWrapper': {
          backgroundColor: colorTokens.surfaceLevel2,
        }
      }}>
        {/* HEADER CON DETECTOR DE RANGO */}
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
              <ReceiptIcon sx={{ fontSize: 32 }} />
            </Avatar>
            
            <Box>
              <Typography variant="h3" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                Crear Nuevo Corte
              </Typography>
              
              <Typography variant="h6" sx={{ color: colorTokens.textSecondary }}>
                📅 {formatDateLong(selectedDate.toISOString().split('T')[0])} • ⏰ {currentTime}
              </Typography>
              
              {/* 🔍 DETECTOR DE RANGO INTELIGENTE */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                mt: 1,
                p: 1.5,
                backgroundColor: `${colorTokens.info}15`,
                borderRadius: 2,
                border: `1px solid ${colorTokens.info}30`
              }}>
                <DateRangeIcon sx={{ color: colorTokens.info, fontSize: 18 }} />
                <Typography variant="body2" sx={{ color: colorTokens.info, fontWeight: 600 }}>
                  📊 Rango de datos: {formatDateLong(selectedDate.toISOString().split('T')[0])}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          {/* TOGGLE MODO */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isManualMode}
                  onChange={(e) => setIsManualMode(e.target.checked)}
                  disabled={!dataHasContent}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: colorTokens.warning,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: colorTokens.warning,
                    },
                  }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {isManualMode ? <BuildIcon /> : <AutoModeIcon />}
                  <Typography variant="body2">
                    {isManualMode ? 'Modo Manual' : 'Modo Automático'}
                  </Typography>
                </Box>
              }
              sx={{ color: colorTokens.textSecondary }}
            />
          </Box>
        </Box>

        {/* MENSAJES DE ESTADO */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            </motion.div>
          )}
          
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Alert
                severity="success"
                sx={{
                  mb: 3,
                  background: `linear-gradient(135deg, ${colorTokens.success}20, ${colorTokens.success}10)`,
                  border: `1px solid ${colorTokens.success}`,
                }}
                action={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<PictureAsPdfIcon />}
                      onClick={downloadCutPDF}
                      sx={{
                        bgcolor: colorTokens.danger,
                        color: colorTokens.white,
                        '&:hover': {
                          bgcolor: `${colorTokens.danger}dd`
                        }
                      }}
                    >
                      Descargar PDF
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ArrowBackIcon />}
                      onClick={() => router.push('/dashboard/admin/cortes')}
                      sx={{
                        borderColor: colorTokens.success,
                        color: colorTokens.success,
                        '&:hover': {
                          borderColor: colorTokens.success,
                          bgcolor: `${colorTokens.success}20`
                        }
                      }}
                    >
                      Volver
                    </Button>
                  </Box>
                }
              >
                <Box>
                  <Typography variant="body1" fontWeight="bold">{success}</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    Descarga el PDF del corte o vuelve al panel principal
                  </Typography>
                </Box>
              </Alert>
            </motion.div>
          )}
          
          {cutExists && !success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Alert severity="warning" sx={{ mb: 3 }}>
                ⚠️ Ya existe un corte para la fecha seleccionada. Puedes crear uno nuevo si es necesario.
              </Alert>
            </motion.div>
          )}
          
          {!dataHasContent && !isManualMode && !loading && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Alert severity="info" sx={{ mb: 3 }}>
                ℹ️ No hay datos automáticos para esta fecha. Se ha activado el modo manual para ingresar datos manualmente.
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <Grid container spacing={4}>
          {/* CONFIGURACIÓN DEL CORTE */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card sx={{
                background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
                border: `2px solid ${colorTokens.brand}40`,
                borderRadius: 4,
                height: 'fit-content'
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: colorTokens.brand, mb: 3 }}>
                    ⚙️ Configuración del Corte
                  </Typography>
                  
                  {/* SELECTOR DE FECHA CON CSS CORREGIDO */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ color: colorTokens.textSecondary, mb: 2 }}>
                      📅 Fecha del Corte
                    </Typography>
                    <DatePicker
                      value={selectedDate}
                      onChange={handleDateChange}
                      maxDate={new Date()}
                      format="dd/MM/yyyy"
                      label="Seleccionar fecha"
                      sx={{
                        width: '100%',
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: colorTokens.neutral300,
                          color: colorTokens.textPrimary,
                          '& fieldset': {
                            borderColor: colorTokens.neutral500,
                          },
                          '&:hover fieldset': {
                            borderColor: colorTokens.brand,
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: colorTokens.brand,
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: colorTokens.textSecondary,
                          '&.Mui-focused': {
                            color: colorTokens.brand,
                          },
                        },
                        '& .MuiSvgIcon-root': {
                          color: colorTokens.brand,
                        },
                        '& .MuiInputBase-input': {
                          color: colorTokens.textPrimary,
                        },
                      }}
                    />
                    <Typography variant="caption" sx={{ color: colorTokens.textDisabled, mt: 1, display: 'block' }}>
                      💡 Puedes seleccionar cualquier fecha pasada sin límite
                    </Typography>
                  </Box>

                  <Divider sx={{ backgroundColor: colorTokens.neutral500, my: 3 }} />

                  {/* INFORMACIÓN DEL CORTE */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ color: colorTokens.textSecondary, mb: 2 }}>
                      📋 Información del Corte
                    </Typography>
                    
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2" sx={{ color: colorTokens.textDisabled }}>
                          Nombre del corte:
                        </Typography>
                        <Typography variant="h6" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                          Corte {formatDateLong(selectedDate.toISOString().split('T')[0])}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="body2" sx={{ color: colorTokens.textDisabled }}>
                          Responsable:
                        </Typography>
                        {/* ✅ RESPONSABLE DINÁMICO */}
                        <Chip
                          label={getCurrentUserDisplayName()}
                          sx={{
                            backgroundColor: `${colorTokens.info}20`,
                            color: colorTokens.info,
                            fontWeight: 600,
                            mt: 0.5
                          }}
                        />
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" sx={{ color: colorTokens.textDisabled }}>
                          Tipo de corte:
                        </Typography>
                        <Chip
                          icon={isManualMode ? <BuildIcon /> : <AutoModeIcon />}
                          label={isManualMode ? 'Manual' : 'Automático'}
                          sx={{
                            backgroundColor: isManualMode ? `${colorTokens.warning}20` : `${colorTokens.success}20`,
                            color: isManualMode ? colorTokens.warning : colorTokens.success,
                            fontWeight: 600,
                            mt: 0.5
                          }}
                        />
                      </Box>
                    </Stack>
                  </Box>

                  <Divider sx={{ backgroundColor: colorTokens.neutral500, my: 3 }} />

                  {/* ✅ SECCIÓN DE GASTOS COMPLETAMENTE AUTOMÁTICA */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ color: colorTokens.textSecondary, mb: 2 }}>
                      💸 Gastos del Día
                    </Typography>
                    
                    {/* ℹ️ INFORMACIÓN DE GASTOS AUTOMÁTICOS (SIN CAMPO EDITABLE) */}
                    <Box sx={{ 
                      p: 3, 
                      backgroundColor: `${colorTokens.info}15`,
                      borderRadius: 3,
                      border: `2px dashed ${colorTokens.info}60`
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ 
                          bgcolor: colorTokens.info, 
                          width: 40, 
                          height: 40 
                        }}>
                          <MoneyOffIcon />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h5" sx={{ 
                            color: editableData.expenses_amount > 0 ? colorTokens.danger : colorTokens.success, 
                            fontWeight: 'bold' 
                          }}>
                            {formatPrice(editableData.expenses_amount || 0)}
                          </Typography>
                          <Typography variant="body2" sx={{ color: colorTokens.info, fontWeight: 600 }}>
                            💸 Calculado automáticamente
                          </Typography>
                        </Box>
                        {loadingExpenses && <CircularProgress size={20} sx={{ color: colorTokens.info }} />}
                      </Box>
                      
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 2 }}>
                        📊 Suma de todos los egresos registrados para: {selectedDate.toISOString().split('T')[0]}
                      </Typography>
                      
                      {expensesSummary && (
                        <Box sx={{ mb: 2 }}>
                          {expensesSummary.total_expenses > 0 ? (
                            <Chip
                              label={`✅ ${expensesSummary.total_expenses} egreso${expensesSummary.total_expenses === 1 ? '' : 's'} encontrado${expensesSummary.total_expenses === 1 ? '' : 's'}`}
                              sx={{
                                backgroundColor: `${colorTokens.success}20`,
                                color: colorTokens.success,
                                fontWeight: 600
                              }}
                            />
                          ) : (
                            <Chip
                              label="ℹ️ No hay egresos para esta fecha"
                              sx={{
                                backgroundColor: `${colorTokens.textDisabled}20`,
                                color: colorTokens.textDisabled,
                                fontWeight: 600
                              }}
                            />
                          )}
                        </Box>
                      )}
                      
                      <Button
                        size="small"
                        startIcon={loadingExpenses ? <CircularProgress size={16} /> : <RefreshIcon />}
                        onClick={() => loadExpensesForDate(selectedDate.toISOString().split('T')[0])}
                        disabled={loadingExpenses}
                        sx={{ 
                          color: colorTokens.info, 
                          backgroundColor: `${colorTokens.info}20`,
                          textTransform: 'none',
                          fontSize: '0.75rem',
                          '&:hover': {
                            backgroundColor: `${colorTokens.info}30`
                          }
                        }}
                      >
                        {loadingExpenses ? 'Actualizando...' : 'Actualizar gastos'}
                      </Button>
                    </Box>
                  </Box>

                  <Divider sx={{ backgroundColor: colorTokens.neutral500, my: 3 }} />

                  {/* OBSERVACIONES */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ color: colorTokens.textSecondary, mb: 2 }}>
                      📝 Observaciones (Opcional)
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      placeholder="Agregar comentarios o notas sobre este corte..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: colorTokens.neutral300,
                          color: colorTokens.textPrimary,
                          '& fieldset': {
                            borderColor: colorTokens.neutral500,
                          },
                          '&:hover fieldset': {
                            borderColor: colorTokens.brand,
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: colorTokens.brand,
                          },
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: colorTokens.textDisabled,
                        },
                      }}
                    />
                  </Box>

                  {/* ✅ TOTALES CALCULADOS CON DEBUGGING MEJORADO */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ color: colorTokens.textSecondary, mb: 2 }}>
                      🧮 Resumen Calculado
                    </Typography>
                    
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: colorTokens.textDisabled }}>
                          Total Bruto:
                        </Typography>
                        <Typography variant="body2" sx={{ color: colorTokens.brand, fontWeight: 600 }}>
                          {formatPrice(totals.grand_total)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: colorTokens.textDisabled }}>
                          Gastos:
                        </Typography>
                        <Typography variant="body2" sx={{ color: colorTokens.danger, fontWeight: 600 }}>
                          -{formatPrice(editableData.expenses_amount)}
                        </Typography>
                      </Box>
                      <Divider sx={{ backgroundColor: colorTokens.neutral500 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6" sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>
                          Balance Final:
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          color: totals.final_balance >= 0 ? colorTokens.success : colorTokens.danger, 
                          fontWeight: 700 
                        }}>
                          {formatPrice(totals.final_balance)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>

                  {/* BOTONES DE ACCIÓN */}
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => router.push('/dashboard/admin/cortes')}
                      sx={{
                        borderColor: colorTokens.textSecondary,
                        color: colorTokens.textSecondary,
                        py: 1.5,
                        '&:hover': {
                          borderColor: colorTokens.textPrimary,
                          backgroundColor: `${colorTokens.textSecondary}20`
                        }
                      }}
                    >
                      Cancelar
                    </Button>
                    
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleCreateCut}
                      disabled={creating || loading}
                      startIcon={creating ? <CircularProgress size={20} /> : <SaveIcon />}
                      sx={{
                        background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
                        color: colorTokens.textPrimary,
                        py: 1.5,
                        fontWeight: 700,
                        '&:disabled': {
                          background: colorTokens.neutral500,
                          color: colorTokens.textDisabled
                        }
                      }}
                    >
                      {creating ? 'Creando...' : 'Crear Corte'}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* RESTO DEL CONTENIDO (DATOS EDITABLES Y HISTORIAL) */}
          <Grid size={{ xs: 12, sm: 12, md: 8 }}>
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <CircularProgress size={60} sx={{ color: colorTokens.brand }} />
              </Box>
            )}

            {!loading && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Stack spacing={3}>
                  {/* SECCIÓN POS */}
                  <Card sx={{
                    background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
                    border: `2px solid ${colorTokens.info}40`,
                    borderRadius: 4
                  }}>
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Avatar sx={{ bgcolor: colorTokens.info }}>
                          <ReceiptIcon />
                        </Avatar>
                        <Typography variant="h5" fontWeight="bold" sx={{ color: colorTokens.info }}>
                          💼 Punto de Venta
                        </Typography>
                        <Chip
                          label={formatPrice(totals.pos_total)}
                          sx={{
                            backgroundColor: `${colorTokens.info}20`,
                            color: colorTokens.info,
                            fontWeight: 700,
                            fontSize: '1rem'
                          }}
                        />
                        {getTransactionsByType('pos').length > 0 && (
                          <Badge 
                            badgeContent={getTransactionsByType('pos').length} 
                            color="primary"
                            sx={{
                              '& .MuiBadge-badge': {
                                backgroundColor: colorTokens.success,
                                color: colorTokens.textPrimary
                              }
                            }}
                          >
                            <LocalOfferIcon sx={{ color: colorTokens.success }} />
                          </Badge>
                        )}
                      </Box>
                      
                      <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <TextField
                            fullWidth
                            label="Efectivo"
                            type="number"
                            value={editableData.pos_efectivo}
                            onChange={(e) => handleEditableChange('pos_efectivo', e.target.value)}
                            inputProps={{ step: "0.01", min: "0" }}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: colorTokens.neutral300,
                                color: colorTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: colorTokens.brand,
                              },
                            }}
                          />
                        </Grid>
                        
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <TextField
                            fullWidth
                            label="Transferencia"
                            type="number"
                            value={editableData.pos_transferencia}
                            onChange={(e) => handleEditableChange('pos_transferencia', e.target.value)}
                            inputProps={{ step: "0.01", min: "0" }}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: colorTokens.neutral300,
                                color: colorTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: colorTokens.info,
                              },
                            }}
                          />
                        </Grid>
                        
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <TextField
                            fullWidth
                            label="Tarjeta Débito"
                            type="number"
                            value={editableData.pos_debito}
                            onChange={(e) => handleEditableChange('pos_debito', e.target.value)}
                            inputProps={{ step: "0.01", min: "0" }}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: colorTokens.neutral300,
                                color: colorTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: colorTokens.success,
                              },
                            }}
                          />
                        </Grid>
                        
                                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <TextField
                            fullWidth
                            label="Tarjeta Crédito"
                            type="number"
                            value={editableData.pos_credito}
                            onChange={(e) => handleEditableChange('pos_credito', e.target.value)}
                            inputProps={{ step: "0.01", min: "0" }}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: colorTokens.neutral300,
                                color: colorTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: colorTokens.danger,
                              },
                            }}
                          />
                        </Grid>
                        
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            label="Transacciones"
                            type="number"
                            value={editableData.pos_transactions}
                            onChange={(e) => handleEditableChange('pos_transactions', e.target.value)}
                            inputProps={{ min: "0" }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: colorTokens.neutral300,
                                color: colorTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: colorTokens.textSecondary,
                              },
                            }}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* SECCIÓN ABONOS */}
                  <Card sx={{
                    background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
                    border: `2px solid ${colorTokens.warning}40`,
                    borderRadius: 4
                  }}>
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Avatar sx={{ bgcolor: colorTokens.warning }}>
                          <SavingsIcon />
                        </Avatar>
                        <Typography variant="h5" fontWeight="bold" sx={{ color: colorTokens.warning }}>
                          💰 Abonos / Apartados
                        </Typography>
                        <Chip
                          label={formatPrice(totals.abonos_total)}
                          sx={{
                            backgroundColor: `${colorTokens.warning}20`,
                            color: colorTokens.warning,
                            fontWeight: 700,
                            fontSize: '1rem'
                          }}
                        />
                        {getTransactionsByType('abono').length > 0 && (
                          <Badge 
                            badgeContent={getTransactionsByType('abono').length} 
                            color="primary"
                            sx={{
                              '& .MuiBadge-badge': {
                                backgroundColor: colorTokens.success,
                                color: colorTokens.textPrimary
                              }
                            }}
                          >
                            <LocalOfferIcon sx={{ color: colorTokens.success }} />
                          </Badge>
                        )}
                      </Box>
                      
                      <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <TextField
                            fullWidth
                            label="Efectivo"
                            type="number"
                            value={editableData.abonos_efectivo}
                            onChange={(e) => handleEditableChange('abonos_efectivo', e.target.value)}
                            inputProps={{ step: "0.01", min: "0" }}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: colorTokens.neutral300,
                                color: colorTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: colorTokens.brand,
                              },
                            }}
                          />
                        </Grid>
                        
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <TextField
                            fullWidth
                            label="Transferencia"
                            type="number"
                            value={editableData.abonos_transferencia}
                            onChange={(e) => handleEditableChange('abonos_transferencia', e.target.value)}
                            inputProps={{ step: "0.01", min: "0" }}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: colorTokens.neutral300,
                                color: colorTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: colorTokens.info,
                              },
                            }}
                          />
                        </Grid>
                        
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <TextField
                            fullWidth
                            label="Tarjeta Débito"
                            type="number"
                            value={editableData.abonos_debito}
                            onChange={(e) => handleEditableChange('abonos_debito', e.target.value)}
                            inputProps={{ step: "0.01", min: "0" }}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: colorTokens.neutral300,
                                color: colorTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: colorTokens.success,
                              },
                            }}
                          />
                        </Grid>
                        
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <TextField
                            fullWidth
                            label="Tarjeta Crédito"
                            type="number"
                            value={editableData.abonos_credito}
                            onChange={(e) => handleEditableChange('abonos_credito', e.target.value)}
                            inputProps={{ step: "0.01", min: "0" }}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: colorTokens.neutral300,
                                color: colorTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: colorTokens.danger,
                              },
                            }}
                          />
                        </Grid>
                        
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            label="Transacciones"
                            type="number"
                            value={editableData.abonos_transactions}
                            onChange={(e) => handleEditableChange('abonos_transactions', e.target.value)}
                            inputProps={{ min: "0" }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: colorTokens.neutral300,
                                color: colorTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: colorTokens.textSecondary,
                              },
                            }}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* SECCIÓN MEMBRESÍAS */}
                  <Card sx={{
                    background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
                    border: `2px solid ${colorTokens.success}40`,
                    borderRadius: 4
                  }}>
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Avatar sx={{ bgcolor: colorTokens.success }}>
                          <AssessmentIcon />
                        </Avatar>
                        <Typography variant="h5" fontWeight="bold" sx={{ color: colorTokens.success }}>
                          🎫 Membresías
                        </Typography>
                        <Chip
                          label={formatPrice(totals.membership_total)}
                          sx={{
                            backgroundColor: `${colorTokens.success}20`,
                            color: colorTokens.success,
                            fontWeight: 700,
                            fontSize: '1rem'
                          }}
                        />
                        {getTransactionsByType('membership').length > 0 && (
                          <Badge 
                            badgeContent={getTransactionsByType('membership').length} 
                            color="primary"
                            sx={{
                              '& .MuiBadge-badge': {
                                backgroundColor: colorTokens.success,
                                color: colorTokens.textPrimary
                              }
                            }}
                          >
                            <LocalOfferIcon sx={{ color: colorTokens.success }} />
                          </Badge>
                        )}
                      </Box>
                      
                      <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <TextField
                            fullWidth
                            label="Efectivo"
                            type="number"
                            value={editableData.membership_efectivo}
                            onChange={(e) => handleEditableChange('membership_efectivo', e.target.value)}
                            inputProps={{ step: "0.01", min: "0" }}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: colorTokens.neutral300,
                                color: colorTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: colorTokens.brand,
                              },
                            }}
                          />
                        </Grid>
                        
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <TextField
                            fullWidth
                            label="Transferencia"
                            type="number"
                            value={editableData.membership_transferencia}
                            onChange={(e) => handleEditableChange('membership_transferencia', e.target.value)}
                            inputProps={{ step: "0.01", min: "0" }}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: colorTokens.neutral300,
                                color: colorTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: colorTokens.info,
                              },
                            }}
                          />
                        </Grid>
                        
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <TextField
                            fullWidth
                            label="Tarjeta Débito"
                            type="number"
                            value={editableData.membership_debito}
                            onChange={(e) => handleEditableChange('membership_debito', e.target.value)}
                            inputProps={{ step: "0.01", min: "0" }}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: colorTokens.neutral300,
                                color: colorTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: colorTokens.success,
                              },
                            }}
                          />
                        </Grid>
                        
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <TextField
                            fullWidth
                            label="Tarjeta Crédito"
                            type="number"
                            value={editableData.membership_credito}
                            onChange={(e) => handleEditableChange('membership_credito', e.target.value)}
                            inputProps={{ step: "0.01", min: "0" }}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: colorTokens.neutral300,
                                color: colorTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: colorTokens.danger,
                              },
                            }}
                          />
                        </Grid>
                        
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            label="Transacciones"
                            type="number"
                            value={editableData.membership_transactions}
                            onChange={(e) => handleEditableChange('membership_transactions', e.target.value)}
                            inputProps={{ min: "0" }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: colorTokens.neutral300,
                                color: colorTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: colorTokens.textSecondary,
                              },
                            }}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* RESUMEN FINAL */}
                  <Card sx={{
                    background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
                    border: `2px solid ${colorTokens.brand}40`,
                    borderRadius: 4
                  }}>
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h5" fontWeight="bold" sx={{ color: colorTokens.brand, mb: 3 }}>
                        💳 Resumen por Métodos de Pago
                      </Typography>
                      
                      <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            background: `linear-gradient(135deg, ${colorTokens.surfaceLevel3}, ${colorTokens.neutral300})`,
                            border: `2px solid ${colorTokens.brand}40`,
                            borderRadius: 3
                          }}>
                            <Avatar sx={{ 
                              bgcolor: colorTokens.brand, 
                              width: 48, 
                              height: 48,
                              mx: 'auto',
                              mb: 2 
                            }}>
                              <AttachMoneyIcon />
                            </Avatar>
                            <Typography variant="h5" fontWeight="bold" sx={{ color: colorTokens.brand }}>
                              {formatPrice(totals.total_efectivo)}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: colorTokens.textSecondary }}>
                              Efectivo
                            </Typography>
                          </Paper>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            background: `linear-gradient(135deg, ${colorTokens.surfaceLevel3}, ${colorTokens.neutral300})`,
                            border: `2px solid ${colorTokens.info}40`,
                            borderRadius: 3
                          }}>
                            <Avatar sx={{ 
                              bgcolor: colorTokens.info, 
                              width: 48, 
                              height: 48,
                              mx: 'auto',
                              mb: 2 
                            }}>
                              <AccountBalanceIcon />
                            </Avatar>
                            <Typography variant="h5" fontWeight="bold" sx={{ color: colorTokens.info }}>
                              {formatPrice(totals.total_transferencia)}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: colorTokens.textSecondary }}>
                              Transferencia
                            </Typography>
                          </Paper>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            background: `linear-gradient(135deg, ${colorTokens.surfaceLevel3}, ${colorTokens.neutral300})`,
                            border: `2px solid ${colorTokens.success}40`,
                            borderRadius: 3
                          }}>
                            <Avatar sx={{ 
                              bgcolor: colorTokens.success, 
                              width: 48, 
                              height: 48,
                              mx: 'auto',
                              mb: 2 
                            }}>
                              <CreditCardIcon />
                            </Avatar>
                            <Typography variant="h5" fontWeight="bold" sx={{ color: colorTokens.success }}>
                              {formatPrice(totals.total_debito)}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: colorTokens.textSecondary }}>
                              Tarjeta Débito
                            </Typography>
                          </Paper>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            background: `linear-gradient(135deg, ${colorTokens.surfaceLevel3}, ${colorTokens.neutral300})`,
                            border: `2px solid ${colorTokens.danger}40`,
                            borderRadius: 3
                          }}>
                            <Avatar sx={{ 
                              bgcolor: colorTokens.danger, 
                              width: 48, 
                              height: 48,
                              mx: 'auto',
                              mb: 2 
                            }}>
                              <CreditCardIcon />
                            </Avatar>
                            <Typography variant="h5" fontWeight="bold" sx={{ color: colorTokens.danger }}>
                              {formatPrice(totals.total_credito)}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: colorTokens.textSecondary }}>
                              Tarjeta Crédito
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* SECCIÓN DE HISTORIAL REAL DE TRANSACCIONES */}
                  {dataHasContent && transactionDetails.length > 0 && (
                    <Card sx={{
                      background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
                      border: `2px solid ${colorTokens.brand}40`,
                      borderRadius: 4
                    }}>
                      <CardContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: colorTokens.brand }}>
                              <VisibilityIcon />
                            </Avatar>
                            <Typography variant="h5" fontWeight="bold" sx={{ color: colorTokens.brand }}>
                              📋 Historial Detallado del Día
                            </Typography>
                            <Chip
                              label={`${transactionDetails.length} transacciones`}
                              sx={{
                                backgroundColor: `${colorTokens.brand}20`,
                                color: colorTokens.brand,
                                fontWeight: 700
                              }}
                            />
                            <Chip
                              label={formatPrice(transactionDetails.reduce((sum, t) => sum + t.amount, 0))}
                              sx={{
                                backgroundColor: `${colorTokens.success}20`,
                                color: colorTokens.success,
                                fontWeight: 700
                              }}
                            />
                          </Box>
                          
                          <Button
                            variant="outlined"
                            startIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            onClick={() => setShowDetails(!showDetails)}
                            sx={{
                              borderColor: colorTokens.brand,
                              color: colorTokens.brand,
                              '&:hover': {
                                borderColor: colorTokens.brand,
                                backgroundColor: `${colorTokens.brand}20`
                              }
                            }}
                          >
                            {showDetails ? 'Ocultar Historial' : 'Ver Historial'}
                          </Button>
                        </Box>
                        
                        <Collapse in={showDetails}>
                          <Box>
                            {/* TABS PARA ORGANIZAR POR TIPO */}
                            <Tabs 
                              value={selectedTab} 
                              onChange={(e, newValue) => setSelectedTab(newValue)}
                              sx={{
                                mb: 3,
                                '& .MuiTab-root': {
                                  color: colorTokens.textSecondary,
                                  fontWeight: 600,
                                  '&.Mui-selected': {
                                    color: colorTokens.brand
                                  }
                                },
                                '& .MuiTabs-indicator': {
                                  backgroundColor: colorTokens.brand
                                }
                              }}
                            >
                              <Tab 
                                label={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ShoppingCartIcon />
                                    <span>POS ({getTransactionsByType('pos').length})</span>
                                  </Box>
                                } 
                              />
                              <Tab 
                                label={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PaymentIcon />
                                    <span>Abonos ({getTransactionsByType('abono').length})</span>
                                  </Box>
                                } 
                              />
                              <Tab 
                                label={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <FitnessCenterIcon />
                                    <span>Membresías ({getTransactionsByType('membership').length})</span>
                                  </Box>
                                } 
                              />
                            </Tabs>

                            {/* TABLA DE TRANSACCIONES REALES POR TAB */}
                            {loadingDetails ? (
                              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress sx={{ color: colorTokens.brand }} />
                              </Box>
                            ) : (
                              <TableContainer component={Paper} sx={{ 
                                backgroundColor: colorTokens.neutral300,
                                borderRadius: 2,
                                maxHeight: 600,
                                overflow: 'auto'
                              }}>
                                <Table stickyHeader>
                                  <TableHead>
                                    <TableRow>
                                      <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 'bold', backgroundColor: colorTokens.neutral400 }}>
                                        #ID
                                      </TableCell>
                                      <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 'bold', backgroundColor: colorTokens.neutral400 }}>
                                        {selectedTab === 0 ? 'Producto' : selectedTab === 1 ? 'Concepto' : 'Membresía'}
                                      </TableCell>
                                      <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 'bold', backgroundColor: colorTokens.neutral400 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <PersonIcon sx={{ fontSize: 16 }} />
                                          Cliente
                                        </Box>
                                      </TableCell>
                                      {selectedTab === 0 && (
                                        <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 'bold', backgroundColor: colorTokens.neutral400 }}>
                                          Cant.
                                        </TableCell>
                                      )}
                                      {selectedTab === 2 && (
                                        <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 'bold', backgroundColor: colorTokens.neutral400 }}>
                                          Duración
                                        </TableCell>
                                      )}
                                      <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 'bold', backgroundColor: colorTokens.neutral400 }}>
                                        Método de Pago
                                      </TableCell>
                                      <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 'bold', backgroundColor: colorTokens.neutral400 }} align="right">
                                        Monto
                                      </TableCell>
                                      <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 'bold', backgroundColor: colorTokens.neutral400 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <ScheduleIcon sx={{ fontSize: 16 }} />
                                          Fecha y Hora
                                        </Box>
                                      </TableCell>
                                      <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 'bold', backgroundColor: colorTokens.neutral400 }}>
                                        Estado
                                      </TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {getTransactionsByType(
                                      selectedTab === 0 ? 'pos' : 
                                      selectedTab === 1 ? 'abono' : 'membership'
                                    ).map((transaction, index) => (
                                      <TableRow 
                                        key={transaction.id}
                                        sx={{ 
                                          '&:nth-of-type(odd)': { 
                                            backgroundColor: colorTokens.surfaceLevel3 
                                          },
                                          '&:hover': {
                                            backgroundColor: `${colorTokens.brand}10`
                                          }
                                        }}
                                      >
                                        <TableCell sx={{ color: colorTokens.textSecondary, fontFamily: 'monospace' }}>
                                          #{transaction.id.slice(-8)}
                                        </TableCell>
                                        
                                        <TableCell sx={{ color: colorTokens.textPrimary }}>
                                          <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                              {selectedTab === 0 
                                                ? transaction.product_name 
                                                : selectedTab === 1 
                                                  ? transaction.product_name || 'Abono a apartado'
                                                  : transaction.membership_type
                                              }
                                              {/* ✅ MOSTRAR SECUENCIA SI ES PAGO DETALLADO */}
                                              {transaction.type === 'membership' && transaction.is_payment_detail && transaction.payment_sequence && (
                                                <Chip
                                                  label={`Pago ${transaction.payment_sequence}`}
                                                  size="small"
                                                  sx={{
                                                    ml: 1,
                                                    backgroundColor: `${colorTokens.info}20`,
                                                    color: colorTokens.info,
                                                    fontSize: '0.7rem'
                                                  }}
                                                />
                                              )}
                                            </Typography>
                                            {transaction.notes && (
                                              <Typography variant="caption" sx={{ color: colorTokens.textDisabled }}>
                                                {transaction.notes}
                                              </Typography>
                                            )}
                                          </Box>
                                        </TableCell>
                                        
                                        <TableCell sx={{ color: colorTokens.textSecondary }}>
                                          <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                              {transaction.customer_name || 'Cliente General'}
                                            </Typography>
                                            {transaction.customer_phone && (
                                              <Typography variant="caption" sx={{ color: colorTokens.textDisabled }}>
                                                📞 {transaction.customer_phone}
                                              </Typography>
                                            )}
                                          </Box>
                                        </TableCell>
                                        
                                        {selectedTab === 0 && (
                                          <TableCell sx={{ color: colorTokens.textSecondary, textAlign: 'center' }}>
                                            <Chip
                                              label={`${transaction.quantity || 1}x`}
                                              size="small"
                                              sx={{
                                                backgroundColor: `${colorTokens.info}20`,
                                                color: colorTokens.info,
                                                fontWeight: 600
                                              }}
                                            />
                                          </TableCell>
                                        )}
                                        
                                        {selectedTab === 2 && (
                                          <TableCell sx={{ color: colorTokens.textSecondary }}>
                                            <Chip
                                              label={transaction.membership_duration || 'N/A'}
                                              size="small"
                                              sx={{
                                                backgroundColor: `${colorTokens.success}20`,
                                                color: colorTokens.success,
                                                fontWeight: 600
                                              }}
                                            />
                                          </TableCell>
                                        )}
                                        
                                        <TableCell>
                                          <Chip
                                            label={`${getPaymentMethodIcon(transaction.payment_method)} ${transaction.payment_method}`}
                                            size="small"
                                            sx={{
                                              backgroundColor: `${getPaymentMethodColor(transaction.payment_method)}20`,
                                              color: getPaymentMethodColor(transaction.payment_method),
                                              fontWeight: 600
                                            }}
                                          />
                                        </TableCell>
                                        
                                        {/* ✅ CELDA DE MONTO CORREGIDA */}
                                        <TableCell align="right" sx={{ color: colorTokens.success, fontWeight: 'bold' }}>
                                          <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                              {formatPrice(transaction.amount)}
                                            </Typography>
                                            
                                            {/* ✅ COMISIÓN COMO INFORMACIÓN ADICIONAL */}
                                            {transaction.commission_amount && transaction.commission_amount > 0 && (
                                              <Typography variant="caption" sx={{ 
                                                color: colorTokens.warning,
                                                display: 'block'
                                              }}>
                                                {formatPrice(transaction.commission_amount)} comisión
                                              </Typography>
                                            )}
                                          </Box>
                                        </TableCell>
                                        
                                        <TableCell sx={{ color: colorTokens.textSecondary }}>
                                          <Typography variant="body2">
                                            {formatDateTime(transaction.created_at)}
                                          </Typography>
                                        </TableCell>
                                        
                                        <TableCell>
                                          <Chip
                                            label={
                                              transaction.status === 'completed' ? 'Completado' :
                                              transaction.status === 'active' ? 'Activo' :
                                              transaction.status === 'pending' ? 'Pendiente' :
                                              transaction.status
                                            }
                                            size="small"
                                            sx={{
                                              backgroundColor: 
                                                transaction.status === 'completed' || transaction.status === 'active' 
                                                  ? `${colorTokens.success}20` 
                                                  : transaction.status === 'pending' 
                                                    ? `${colorTokens.warning}20`
                                                    : `${colorTokens.danger}20`,
                                              color: 
                                                transaction.status === 'completed' || transaction.status === 'active' 
                                                  ? colorTokens.success 
                                                  : transaction.status === 'pending' 
                                                    ? colorTokens.warning
                                                    : colorTokens.danger,
                                              fontWeight: 600
                                            }}
                                          />
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                    
                                    {getTransactionsByType(
                                      selectedTab === 0 ? 'pos' : 
                                      selectedTab === 1 ? 'abono' : 'membership'
                                    ).length === 0 && (
                                      <TableRow>
                                        <TableCell 
                                          colSpan={selectedTab === 0 ? 8 : selectedTab === 2 ? 8 : 7} 
                                          sx={{ 
                                            textAlign: 'center', 
                                            color: colorTokens.textDisabled,
                                            py: 4
                                          }}
                                        >
                                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                            <Typography variant="h6">
                                              No hay transacciones de este tipo
                                            </Typography>
                                            <Typography variant="body2">
                                              Para el día {formatDateLong(selectedDate.toISOString().split('T')[0])}
                                            </Typography>
                                          </Box>
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            )}

                            {/* RESUMEN POR TAB */}
                            {(() => {
                              const tabTransactions = getTransactionsByType(
                                selectedTab === 0 ? 'pos' : 
                                selectedTab === 1 ? 'abono' : 'membership'
                              );
                              const tabTotal = tabTransactions.reduce((sum, t) => sum + t.amount, 0);
                              const tabCommissions = tabTransactions.reduce((sum, t) => sum + (t.commission_amount || 0), 0);
                              
                              return tabTransactions.length > 0 && (
                                <Box sx={{ 
                                  mt: 3, 
                                  p: 3, 
                                  backgroundColor: colorTokens.surfaceLevel3, 
                                  borderRadius: 2,
                                  border: `1px solid ${colorTokens.neutral500}`
                                }}>
                                  <Typography variant="h6" sx={{ color: colorTokens.textPrimary, mb: 2 }}>
                                    📊 Resumen de {
                                      selectedTab === 0 ? 'Punto de Venta' : 
                                      selectedTab === 1 ? 'Abonos' : 'Membresías'
                                    }
                                  </Typography>
                                  
                                  <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 3 }}>
                                      <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h5" sx={{ 
                                          color: colorTokens.brand, 
                                          fontWeight: 'bold' 
                                        }}>
                                          {tabTransactions.length}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                                          Transacciones
                                        </Typography>
                                      </Box>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 3 }}>
                                      <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h5" sx={{ 
                                          color: colorTokens.success, 
                                          fontWeight: 'bold' 
                                        }}>
                                          {formatPrice(tabTotal)}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                                          Total Generado
                                        </Typography>
                                      </Box>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 3 }}>
                                      <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h5" sx={{ 
                                          color: colorTokens.info, 
                                          fontWeight: 'bold' 
                                        }}>
                                          {tabTransactions.length > 0 ? formatPrice(tabTotal / tabTransactions.length) : '$0.00'}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                                          Promedio por Transacción
                                        </Typography>
                                      </Box>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 3 }}>
                                      <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h5" sx={{ 
                                          color: colorTokens.warning, 
                                          fontWeight: 'bold' 
                                        }}>
                                          {formatPrice(tabCommissions)}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                                          Total Comisiones
                                        </Typography>
                                      </Box>
                                    </Grid>
                                  </Grid>
                                </Box>
                              );
                            })()}
                          </Box>
                        </Collapse>
                      </CardContent>
                    </Card>
                  )}
                </Stack>
              </motion.div>
            )}
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
}
                




