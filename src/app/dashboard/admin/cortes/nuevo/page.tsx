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
  Badge
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
  LocalOffer as LocalOfferIcon
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

// ✅ FUNCIONES LOCALES PARA FECHAS MÉXICO (IDÉNTICAS A LA PÁGINA PRINCIPAL)

// 📅 Función para obtener fecha actual de México
function getMexicoDateLocal(): string {
  const now = new Date();
  const mexicoDate = new Date(now.toLocaleString("en-US", {timeZone: "America/Mexico_City"}));
  const year = mexicoDate.getFullYear();
  const month = String(mexicoDate.getMonth() + 1).padStart(2, '0');
  const day = String(mexicoDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ⏰ Función para formatear hora actual de México
function formatMexicoTimeLocal(date: Date): string {
  return date.toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

// 📅 Función para formatear fechas largas
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
    console.error('❌ Error formateando fecha:', dateString, error);
    const date = new Date(dateString + 'T12:00:00');
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const weekdays = [
      'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'
    ];
    const weekday = weekdays[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${weekday}, ${day} de ${month} de ${year}`;
  }
}

// 🔍 DETECTOR DE RANGO - NUEVA FUNCIÓN
function getMexicoDateRangeDisplay(dateString: string): string {
  try {
    const date = new Date(dateString + 'T12:00:00');
    const dayName = date.toLocaleDateString('es-MX', { 
      weekday: 'long',
      timeZone: 'America/Mexico_City' 
    });
    const day = date.getDate();
    const month = date.toLocaleDateString('es-MX', { 
      month: 'long',
      timeZone: 'America/Mexico_City' 
    });
    const year = date.getFullYear();
    
    return `${day} de ${month} de ${year}, 00:00 - ${day} de ${month} de ${year}, 23:59`;
  } catch (error) {
    return `${dateString} 00:00 - ${dateString} 23:59`;
  }
}

// ⏰ Función para timestamp de BD en México
function createTimestampForDB(): string {
  const mexicoDate = new Date().toLocaleString("en-US", {timeZone: "America/Mexico_City"});
  return new Date(mexicoDate).toISOString();
}

// 💰 Función para formatear precios
function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(amount);
}

// ⏰ Función para formatear fechas y horas
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

// 📊 INTERFACE PARA DATOS EDITABLES
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

// 🧾 INTERFACES PARA DETALLES DE TRANSACCIONES REALES
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
  // Common Fields
  customer_name?: string;
  customer_phone?: string;
  payment_method: string;
  amount: number; // ✅ MONTO TOTAL (CON COMISIÓN PARA POS/ABONOS)
  base_amount?: number; // ✅ MONTO BASE SIN COMISIÓN (SOLO POS/ABONOS)
  commission_amount?: number;
  created_at: string;
  reference?: string;
  notes?: string;
  // Status
  status: string;
  is_partial_payment?: boolean;
}

export default function NuevoCorteePage() {
  const router = useRouter();
  
  // ✅ FECHA ACTUAL EN MÉXICO COMO DEFAULT
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const mexicoDateString = getMexicoDateLocal();
    const mexicoDate = new Date(mexicoDateString + 'T12:00:00');
    
    console.log('🇲🇽 Fecha actual México (crear corte):', mexicoDateString);
    console.log('🌍 Fecha actual UTC:', new Date().toISOString().split('T')[0]);
    
    return mexicoDate;
  });
  
  // 🕐 TIEMPO ACTUAL EN TIEMPO REAL
  const [currentTime, setCurrentTime] = useState<string>('');
  
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
  const [observations, setObservations] = useState('');
  const [cutExists, setCutExists] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [dataHasContent, setDataHasContent] = useState(false);
  
  // 🔍 ESTADOS PARA DETALLES DE TRANSACCIONES REALES
  const [showDetails, setShowDetails] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<TransactionDetail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);

  // ⏰ ACTUALIZAR RELOJ CADA SEGUNDO
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const mexicoTime = formatMexicoTimeLocal(now);
      setCurrentTime(mexicoTime);
    };
    
    updateClock();
    const interval = setInterval(updateClock, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // 🧮 CALCULAR TOTALES DINÁMICAMENTE
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
    
    const final_balance = grand_total - editableData.expenses_amount;
    
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
      final_balance
    };
  };

 // 🔍 CARGAR DETALLES DE TRANSACCIONES REALES - ACTUALIZADA
const loadTransactionDetails = async (date: Date) => {
  try {
    setLoadingDetails(true);
    const dateString = date.toISOString().split('T')[0];
    
    console.log('🔍 Cargando detalles reales de transacciones para fecha:', dateString);
    
    const response = await fetch(`/api/cuts/transaction-details?date=${dateString}`);
    const data = await response.json();
    
    if (data.success) {
      // ✅ USAR DATOS REALES DE LA API
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
          status: transaction.status
        }))
      ];
      
      // Ordenar por fecha de creación (más reciente primero)
      details.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setTransactionDetails(details);
      console.log('✅ Detalles reales cargados:', details.length, 'transacciones');
      console.log('📊 Datos por tipo:', {
        pos: data.pos_transactions?.length || 0,
        abonos: data.abonos_transactions?.length || 0,
        membresias: data.membership_transactions?.length || 0
      });
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

  // 🔍 CARGAR DATOS DEL DÍA SELECCIONADO
  const loadDailyData = async (date: Date) => {
    try {
      setLoading(true);
      setError(null);
      
      const dateString = date.toISOString().split('T')[0];
      console.log('🔍 Cargando datos para fecha México:', dateString);
      
      const response = await fetch(`/api/cuts/daily-data?date=${dateString}`);
      const data = await response.json();
      
      if (data.success) {
        setDailyData(data);
        
        const hasData = data.totals.total > 0 || data.totals.transactions > 0;
        setDataHasContent(hasData);
        
        if (hasData) {
          setEditableData({
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
            expenses_amount: 0
          });
          setIsManualMode(false);
          
          // 🔍 CARGAR DETALLES REALES DE TRANSACCIONES
          await loadTransactionDetails(date);
        } else {
          setIsManualMode(true);
          setEditableData({
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

  // 🔍 VERIFICAR SI YA EXISTE CORTE
  const checkExistingCut = async (dateString: string) => {
    try {
      const response = await fetch(`/api/cuts/check-existing?date=${dateString}`);
      const data = await response.json();
      setCutExists(data.exists);
    } catch (error) {
      console.error('Error verificando corte existente:', error);
    }
  };

  // 💾 CREAR CORTE
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
        
        // POS
        pos_efectivo: editableData.pos_efectivo,
        pos_transferencia: editableData.pos_transferencia,
        pos_debito: editableData.pos_debito,
        pos_credito: editableData.pos_credito,
        pos_total: totals.pos_total,
        pos_transactions: editableData.pos_transactions,
        pos_commissions: 0,
        
        // ABONOS
        abonos_efectivo: editableData.abonos_efectivo,
        abonos_transferencia: editableData.abonos_transferencia,
        abonos_debito: editableData.abonos_debito,
        abonos_credito: editableData.abonos_credito,
        abonos_total: totals.abonos_total,
        abonos_transactions: editableData.abonos_transactions,
        abonos_commissions: 0,
        
        // MEMBERSHIPS
        membership_efectivo: editableData.membership_efectivo,
        membership_transferencia: editableData.membership_transferencia,
        membership_debito: editableData.membership_debito,
        membership_credito: editableData.membership_credito,
        membership_total: totals.membership_total,
        membership_transactions: editableData.membership_transactions,
        membership_commissions: 0,
        
        // TOTALES
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
      
      console.log('📊 Creando corte con datos:', cutData);
      
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
        setTimeout(() => {
          router.push(`/dashboard/admin/cortes`);
        }, 2000);
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

  // 🔧 MANEJAR CAMBIOS EN CAMPOS EDITABLES
  const handleEditableChange = (field: keyof EditableData, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setEditableData(prev => ({
      ...prev,
      [field]: numericValue
    }));
  };

  // ⚡ EFECTOS
  useEffect(() => {
    loadDailyData(selectedDate);
  }, [selectedDate]);

  // 🔄 MANEJAR CAMBIO DE FECHA
  const handleDateChange = (newDate: Date | null) => {
    if (newDate) {
      setSelectedDate(newDate);
      setSuccess(null);
      setError(null);
    }
  };

  // 🧮 OBTENER TOTALES CALCULADOS
  const totals = calculateTotals();

  // 🎯 FILTRAR TRANSACCIONES POR TIPO
  const getTransactionsByType = (type: 'pos' | 'abono' | 'membership') => {
    return transactionDetails.filter(t => t.type === type);
  };

  // 🎨 OBTENER COLOR POR MÉTODO DE PAGO
  const getPaymentMethodColor = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'efectivo':
        return darkProTokens.primary;
      case 'transferencia':
        return darkProTokens.info;
      case 'debito':
        return darkProTokens.success;
      case 'credito':
        return darkProTokens.error;
      default:
        return darkProTokens.textSecondary;
    }
  };

  // 🎨 OBTENER ICONO POR MÉTODO DE PAGO
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
        background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
        color: darkProTokens.textPrimary,
        p: 4
      }}>
        {/* 🏷️ HEADER CON DETECTOR DE RANGO */}
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
              <ReceiptIcon sx={{ fontSize: 32 }} />
            </Avatar>
            
            <Box>
              <Typography variant="h3" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>
                Crear Nuevo Corte
              </Typography>
              
              <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }}>
                📅 {formatDateLocal(selectedDate.toISOString().split('T')[0])} • ⏰ {currentTime}
              </Typography>
              
              {/* 🔍 DETECTOR DE RANGO INTELIGENTE */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                mt: 1,
                p: 1.5,
                backgroundColor: `${darkProTokens.info}15`,
                borderRadius: 2,
                border: `1px solid ${darkProTokens.info}30`
              }}>
                <DateRangeIcon sx={{ color: darkProTokens.info, fontSize: 18 }} />
                <Typography variant="body2" sx={{ color: darkProTokens.info, fontWeight: 600 }}>
                  📊 Rango de datos: {getMexicoDateRangeDisplay(selectedDate.toISOString().split('T')[0])}
                </Typography>
              </Box>
              
              <Typography variant="caption" sx={{ color: darkProTokens.textDisabled, mt: 0.5, display: 'block' }}>
                🇲🇽 Zona horaria: México • {isManualMode ? '🔧 Modo Manual' : '🤖 Modo Automático'}
              </Typography>
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
                      color: darkProTokens.warning,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: darkProTokens.warning,
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
              sx={{ color: darkProTokens.textSecondary }}
            />
          </Box>
        </Box>

        {/* 🚨 MENSAJES DE ESTADO */}
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
              <Alert severity="success" sx={{ mb: 3 }}>
                {success}
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
          {/* 📅 CONFIGURACIÓN DEL CORTE */}
          <Grid size={12} md={4}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card sx={{
                background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                border: `2px solid ${darkProTokens.roleAdmin}40`,
                borderRadius: 4,
                height: 'fit-content'
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.roleAdmin, mb: 3 }}>
                    ⚙️ Configuración del Corte
                  </Typography>
                  
                  {/* SELECTOR DE FECHA */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
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
                          backgroundColor: darkProTokens.surfaceLevel4,
                          color: darkProTokens.textPrimary,
                          '& fieldset': {
                            borderColor: darkProTokens.grayMedium,
                          },
                          '&:hover fieldset': {
                            borderColor: darkProTokens.primary,
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: darkProTokens.primary,
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: darkProTokens.textSecondary,
                        },
                        '& .MuiSvgIcon-root': {
                          color: darkProTokens.primary,
                        },
                      }}
                    />
                    <Typography variant="caption" sx={{ color: darkProTokens.textDisabled, mt: 1, display: 'block' }}>
                      💡 Puedes seleccionar cualquier fecha pasada sin límite
                    </Typography>
                  </Box>

                  <Divider sx={{ backgroundColor: darkProTokens.grayMedium, my: 3 }} />

                  {/* INFORMACIÓN DEL CORTE */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
                      📋 Información del Corte
                    </Typography>
                    
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                          Nombre del corte:
                        </Typography>
                        <Typography variant="h6" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                          Corte {formatDateLocal(selectedDate.toISOString().split('T')[0])}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                          Responsable:
                        </Typography>
                        <Chip
                          label="luishdz04"
                          sx={{
                            backgroundColor: `${darkProTokens.info}20`,
                            color: darkProTokens.info,
                            fontWeight: 600,
                            mt: 0.5
                          }}
                        />
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                          Tipo de corte:
                        </Typography>
                        <Chip
                          icon={isManualMode ? <BuildIcon /> : <AutoModeIcon />}
                          label={isManualMode ? 'Manual' : 'Automático'}
                          sx={{
                            backgroundColor: isManualMode ? `${darkProTokens.warning}20` : `${darkProTokens.success}20`,
                            color: isManualMode ? darkProTokens.warning : darkProTokens.success,
                            fontWeight: 600,
                            mt: 0.5
                          }}
                        />
                      </Box>
                    </Stack>
                  </Box>

                  <Divider sx={{ backgroundColor: darkProTokens.grayMedium, my: 3 }} />

                  {/* GASTOS */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
                      💸 Gastos del Día
                    </Typography>
                    <TextField
                      fullWidth
                      type="number"
                      value={editableData.expenses_amount}
                      onChange={(e) => handleEditableChange('expenses_amount', e.target.value)}
                      placeholder="0.00"
                      inputProps={{ step: "0.01", min: "0" }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: darkProTokens.surfaceLevel4,
                          color: darkProTokens.textPrimary,
                          '& fieldset': {
                            borderColor: darkProTokens.grayMedium,
                          },
                          '&:hover fieldset': {
                            borderColor: darkProTokens.error,
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: darkProTokens.error,
                          },
                        },
                      }}
                    />
                  </Box>

                  <Divider sx={{ backgroundColor: darkProTokens.grayMedium, my: 3 }} />

                  {/* OBSERVACIONES */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
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
                          backgroundColor: darkProTokens.surfaceLevel4,
                          color: darkProTokens.textPrimary,
                          '& fieldset': {
                            borderColor: darkProTokens.grayMedium,
                          },
                          '&:hover fieldset': {
                            borderColor: darkProTokens.primary,
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: darkProTokens.primary,
                          },
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: darkProTokens.textDisabled,
                        },
                      }}
                    />
                  </Box>

                  {/* TOTALES CALCULADOS */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
                      🧮 Resumen Calculado
                    </Typography>
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                          Total Bruto:
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkProTokens.primary, fontWeight: 600 }}>
                          {formatPrice(totals.grand_total)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                          Gastos:
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkProTokens.error, fontWeight: 600 }}>
                          -{formatPrice(editableData.expenses_amount)}
                        </Typography>
                      </Box>
                      <Divider sx={{ backgroundColor: darkProTokens.grayMedium }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6" sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>
                          Balance Final:
                        </Typography>
                        <Typography variant="h6" sx={{ color: darkProTokens.success, fontWeight: 700 }}>
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
                        borderColor: darkProTokens.textSecondary,
                        color: darkProTokens.textSecondary,
                        py: 1.5,
                        '&:hover': {
                          borderColor: darkProTokens.textPrimary,
                          backgroundColor: `${darkProTokens.textSecondary}20`
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
                        background: `linear-gradient(135deg, ${darkProTokens.roleAdmin}, ${darkProTokens.primaryHover})`,
                        color: darkProTokens.textPrimary,
                        py: 1.5,
                        fontWeight: 700,
                        '&:disabled': {
                          background: darkProTokens.grayMedium,
                          color: darkProTokens.textDisabled
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

          {/* 📊 DATOS EDITABLES Y DETALLES */}
          <Grid size={12} md={8}>
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <CircularProgress size={60} sx={{ color: darkProTokens.roleAdmin }} />
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
                    background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                    border: `2px solid ${darkProTokens.info}40`,
                    borderRadius: 4
                  }}>
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Avatar sx={{ bgcolor: darkProTokens.info }}>
                          <ReceiptIcon />
                        </Avatar>
                        <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.info }}>
                          💼 Punto de Venta
                        </Typography>
                        <Chip
                          label={formatPrice(totals.pos_total)}
                          sx={{
                            backgroundColor: `${darkProTokens.info}20`,
                            color: darkProTokens.info,
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
                                backgroundColor: darkProTokens.success,
                                color: darkProTokens.textPrimary
                              }
                            }}
                          >
                            <LocalOfferIcon sx={{ color: darkProTokens.success }} />
                          </Badge>
                        )}
                      </Box>
                      
                      <Grid container spacing={3}>
                        <Grid size={12} sm={6} md={3}>
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
                                backgroundColor: darkProTokens.surfaceLevel4,
                                color: darkProTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: darkProTokens.primary,
                              },
                            }}
                          />
                        </Grid>
                        
                        <Grid size={12} sm={6} md={3}>
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
                                backgroundColor: darkProTokens.surfaceLevel4,
                                color: darkProTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: darkProTokens.info,
                              },
                            }}
                          />
                        </Grid>
                        
                        <Grid size={12} sm={6} md={3}>
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
                                backgroundColor: darkProTokens.surfaceLevel4,
                                color: darkProTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: darkProTokens.success,
                              },
                            }}
                          />
                        </Grid>
                        
                        <Grid size={12} sm={6} md={3}>
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
                                backgroundColor: darkProTokens.surfaceLevel4,
                                color: darkProTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: darkProTokens.error,
                              },
                            }}
                          />
                        </Grid>
                        
                        <Grid size={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Transacciones"
                            type="number"
                            value={editableData.pos_transactions}
                            onChange={(e) => handleEditableChange('pos_transactions', e.target.value)}
                            inputProps={{ min: "0" }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: darkProTokens.surfaceLevel4,
                                color: darkProTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: darkProTokens.textSecondary,
                              },
                            }}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* 💰 SECCIÓN ABONOS */}
                  <Card sx={{
                    background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                    border: `2px solid ${darkProTokens.warning}40`,
                    borderRadius: 4
                  }}>
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Avatar sx={{ bgcolor: darkProTokens.warning }}>
                          <SavingsIcon />
                        </Avatar>
                        <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.warning }}>
                          💰 Abonos / Apartados
                        </Typography>
                        <Chip
                          label={formatPrice(totals.abonos_total)}
                          sx={{
                            backgroundColor: `${darkProTokens.warning}20`,
                            color: darkProTokens.warning,
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
                                backgroundColor: darkProTokens.success,
                                color: darkProTokens.textPrimary
                              }
                            }}
                          >
                            <LocalOfferIcon sx={{ color: darkProTokens.success }} />
                          </Badge>
                        )}
                      </Box>
                      
                      <Grid container spacing={3}>
                        <Grid size={12} sm={6} md={3}>
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
                                backgroundColor: darkProTokens.surfaceLevel4,
                                color: darkProTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: darkProTokens.primary,
                              },
                            }}
                          />
                        </Grid>
                        
                        <Grid size={12} sm={6} md={3}>
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
                                backgroundColor: darkProTokens.surfaceLevel4,
                                color: darkProTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: darkProTokens.info,
                              },
                            }}
                          />
                        </Grid>
                        
                        <Grid size={12} sm={6} md={3}>
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
                                backgroundColor: darkProTokens.surfaceLevel4,
                                color: darkProTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: darkProTokens.success,
                              },
                            }}
                          />
                        </Grid>
                        
                        <Grid size={12} sm={6} md={3}>
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
                                backgroundColor: darkProTokens.surfaceLevel4,
                                color: darkProTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: darkProTokens.error,
                              },
                            }}
                          />
                        </Grid>
                        
                        <Grid size={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Transacciones"
                            type="number"
                            value={editableData.abonos_transactions}
                            onChange={(e) => handleEditableChange('abonos_transactions', e.target.value)}
                            inputProps={{ min: "0" }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: darkProTokens.surfaceLevel4,
                                color: darkProTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: darkProTokens.textSecondary,
                              },
                            }}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* SECCIÓN MEMBRESÍAS */}
                  <Card sx={{
                    background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                    border: `2px solid ${darkProTokens.success}40`,
                    borderRadius: 4
                  }}>
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Avatar sx={{ bgcolor: darkProTokens.success }}>
                          <AssessmentIcon />
                        </Avatar>
                        <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.success }}>
                          🎫 Membresías
                        </Typography>
                        <Chip
                          label={formatPrice(totals.membership_total)}
                          sx={{
                            backgroundColor: `${darkProTokens.success}20`,
                            color: darkProTokens.success,
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
                                backgroundColor: darkProTokens.success,
                                color: darkProTokens.textPrimary
                              }
                            }}
                          >
                            <LocalOfferIcon sx={{ color: darkProTokens.success }} />
                          </Badge>
                        )}
                      </Box>
                      
                      <Grid container spacing={3}>
                        <Grid size={12} sm={6} md={3}>
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
                                backgroundColor: darkProTokens.surfaceLevel4,
                                color: darkProTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: darkProTokens.primary,
                              },
                            }}
                          />
                        </Grid>
                        
                                                <Grid size={12} sm={6} md={3}>
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
                                backgroundColor: darkProTokens.surfaceLevel4,
                                color: darkProTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: darkProTokens.info,
                              },
                            }}
                          />
                        </Grid>
                        
                        <Grid size={12} sm={6} md={3}>
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
                                backgroundColor: darkProTokens.surfaceLevel4,
                                color: darkProTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: darkProTokens.success,
                              },
                            }}
                          />
                        </Grid>
                        
                        <Grid size={12} sm={6} md={3}>
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
                                backgroundColor: darkProTokens.surfaceLevel4,
                                color: darkProTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: darkProTokens.error,
                              },
                            }}
                          />
                        </Grid>
                        
                        <Grid size={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Transacciones"
                            type="number"
                            value={editableData.membership_transactions}
                            onChange={(e) => handleEditableChange('membership_transactions', e.target.value)}
                            inputProps={{ min: "0" }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: darkProTokens.surfaceLevel4,
                                color: darkProTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: darkProTokens.textSecondary,
                              },
                            }}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* RESUMEN FINAL */}
                  <Card sx={{
                    background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                    border: `2px solid ${darkProTokens.primary}40`,
                    borderRadius: 4
                  }}>
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.primary, mb: 3 }}>
                        💳 Resumen por Métodos de Pago
                      </Typography>
                      
                      <Grid container spacing={3}>
                        <Grid size={12} sm={6} md={3}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                            border: `2px solid ${darkProTokens.primary}40`,
                            borderRadius: 3
                          }}>
                            <Avatar sx={{ 
                              bgcolor: darkProTokens.primary, 
                              width: 48, 
                              height: 48,
                              mx: 'auto',
                              mb: 2 
                            }}>
                              <AttachMoneyIcon />
                            </Avatar>
                            <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.primary }}>
                              {formatPrice(totals.total_efectivo)}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary }}>
                              Efectivo
                            </Typography>
                          </Paper>
                        </Grid>

                        <Grid size={12} sm={6} md={3}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                            border: `2px solid ${darkProTokens.info}40`,
                            borderRadius: 3
                          }}>
                            <Avatar sx={{ 
                              bgcolor: darkProTokens.info, 
                              width: 48, 
                              height: 48,
                              mx: 'auto',
                              mb: 2 
                            }}>
                              <AccountBalanceIcon />
                            </Avatar>
                            <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.info }}>
                              {formatPrice(totals.total_transferencia)}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary }}>
                              Transferencia
                            </Typography>
                          </Paper>
                        </Grid>

                        <Grid size={12} sm={6} md={3}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                            border: `2px solid ${darkProTokens.success}40`,
                            borderRadius: 3
                          }}>
                            <Avatar sx={{ 
                              bgcolor: darkProTokens.success, 
                              width: 48, 
                              height: 48,
                              mx: 'auto',
                              mb: 2 
                            }}>
                              <CreditCardIcon />
                            </Avatar>
                            <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.success }}>
                              {formatPrice(totals.total_debito)}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary }}>
                              Tarjeta Débito
                            </Typography>
                          </Paper>
                        </Grid>

                        <Grid size={12} sm={6} md={3}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                            border: `2px solid ${darkProTokens.error}40`,
                            borderRadius: 3
                          }}>
                            <Avatar sx={{ 
                              bgcolor: darkProTokens.error, 
                              width: 48, 
                              height: 48,
                              mx: 'auto',
                              mb: 2 
                            }}>
                              <CreditCardIcon />
                            </Avatar>
                            <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.error }}>
                              {formatPrice(totals.total_credito)}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary }}>
                              Tarjeta Crédito
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* 🔍 SECCIÓN DE HISTORIAL REAL DE TRANSACCIONES */}
                  {dataHasContent && transactionDetails.length > 0 && (
                    <Card sx={{
                      background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                      border: `2px solid ${darkProTokens.roleAdmin}40`,
                      borderRadius: 4
                    }}>
                      <CardContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: darkProTokens.roleAdmin }}>
                              <VisibilityIcon />
                            </Avatar>
                            <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.roleAdmin }}>
                              📋 Historial Detallado del Día
                            </Typography>
                            <Chip
                              label={`${transactionDetails.length} transacciones`}
                              sx={{
                                backgroundColor: `${darkProTokens.roleAdmin}20`,
                                color: darkProTokens.roleAdmin,
                                fontWeight: 700
                              }}
                            />
                            <Chip
                              label={formatPrice(transactionDetails.reduce((sum, t) => sum + t.amount, 0))}
                              sx={{
                                backgroundColor: `${darkProTokens.success}20`,
                                color: darkProTokens.success,
                                fontWeight: 700
                              }}
                            />
                          </Box>
                          
                          <Button
                            variant="outlined"
                            startIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            onClick={() => setShowDetails(!showDetails)}
                            sx={{
                              borderColor: darkProTokens.roleAdmin,
                              color: darkProTokens.roleAdmin,
                              '&:hover': {
                                borderColor: darkProTokens.roleAdmin,
                                backgroundColor: `${darkProTokens.roleAdmin}20`
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
                                  color: darkProTokens.textSecondary,
                                  fontWeight: 600,
                                  '&.Mui-selected': {
                                    color: darkProTokens.primary
                                  }
                                },
                                '& .MuiTabs-indicator': {
                                  backgroundColor: darkProTokens.primary
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
                                <CircularProgress sx={{ color: darkProTokens.roleAdmin }} />
                              </Box>
                            ) : (
                              <TableContainer component={Paper} sx={{ 
                                backgroundColor: darkProTokens.surfaceLevel4,
                                borderRadius: 2,
                                maxHeight: 600,
                                overflow: 'auto'
                              }}>
                                <Table stickyHeader>
                                  <TableHead>
                                    <TableRow sx={{ backgroundColor: darkProTokens.grayDark }}>
                                      <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold', backgroundColor: darkProTokens.grayDark }}>
                                        #ID
                                      </TableCell>
                                      <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold', backgroundColor: darkProTokens.grayDark }}>
                                        {selectedTab === 0 ? 'Producto' : selectedTab === 1 ? 'Concepto' : 'Membresía'}
                                      </TableCell>
                                      <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold', backgroundColor: darkProTokens.grayDark }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <PersonIcon sx={{ fontSize: 16 }} />
                                          Cliente
                                        </Box>
                                      </TableCell>
                                      {selectedTab === 0 && (
                                        <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold', backgroundColor: darkProTokens.grayDark }}>
                                          Cant.
                                        </TableCell>
                                      )}
                                      {selectedTab === 2 && (
                                        <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold', backgroundColor: darkProTokens.grayDark }}>
                                          Duración
                                        </TableCell>
                                      )}
                                      <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold', backgroundColor: darkProTokens.grayDark }}>
                                        Método de Pago
                                      </TableCell>
                                      <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold', backgroundColor: darkProTokens.grayDark }} align="right">
                                        Monto
                                      </TableCell>
                                      <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold', backgroundColor: darkProTokens.grayDark }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <ScheduleIcon sx={{ fontSize: 16 }} />
                                          Fecha y Hora
                                        </Box>
                                      </TableCell>
                                      <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold', backgroundColor: darkProTokens.grayDark }}>
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
                                            backgroundColor: darkProTokens.surfaceLevel3 
                                          },
                                          '&:hover': {
                                            backgroundColor: `${darkProTokens.primary}10`
                                          }
                                        }}
                                      >
                                        <TableCell sx={{ color: darkProTokens.textSecondary, fontFamily: 'monospace' }}>
                                          #{transaction.id.slice(-8)}
                                        </TableCell>
                                        
                                        <TableCell sx={{ color: darkProTokens.textPrimary }}>
                                          <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                              {selectedTab === 0 
                                                ? transaction.product_name 
                                                : selectedTab === 1 
                                                  ? transaction.product_name || 'Abono a apartado'
                                                  : transaction.membership_type
                                              }
                                            </Typography>
                                            {transaction.notes && (
                                              <Typography variant="caption" sx={{ color: darkProTokens.textDisabled }}>
                                                {transaction.notes}
                                              </Typography>
                                            )}
                                          </Box>
                                        </TableCell>
                                        
                                        <TableCell sx={{ color: darkProTokens.textSecondary }}>
                                          <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                              {transaction.customer_name || 'Cliente General'}
                                            </Typography>
                                            {transaction.customer_phone && (
                                              <Typography variant="caption" sx={{ color: darkProTokens.textDisabled }}>
                                                📞 {transaction.customer_phone}
                                              </Typography>
                                            )}
                                          </Box>
                                        </TableCell>
                                        
                                        {selectedTab === 0 && (
                                          <TableCell sx={{ color: darkProTokens.textSecondary, textAlign: 'center' }}>
                                            <Chip
                                              label={`${transaction.quantity || 1}x`}
                                              size="small"
                                              sx={{
                                                backgroundColor: `${darkProTokens.info}20`,
                                                color: darkProTokens.info,
                                                fontWeight: 600
                                              }}
                                            />
                                          </TableCell>
                                        )}
                                        
                                        {selectedTab === 2 && (
                                          <TableCell sx={{ color: darkProTokens.textSecondary }}>
                                            <Chip
                                              label={transaction.membership_duration || 'N/A'}
                                              size="small"
                                              sx={{
                                                backgroundColor: `${darkProTokens.success}20`,
                                                color: darkProTokens.success,
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
                                        
                                     <TableCell align="right" sx={{ color: darkProTokens.success, fontWeight: 'bold' }}>
  <Box>
    {/* ✅ MONTO PRINCIPAL (CON COMISIÓN INCLUIDA PARA POS/ABONOS) */}
    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
      {formatPrice(transaction.amount)}
    </Typography>
    
    {/* ✅ COMISIÓN COMO INFORMACIÓN ADICIONAL */}
    {transaction.commission_amount && transaction.commission_amount > 0 && (
      <Typography variant="caption" sx={{ 
        color: darkProTokens.warning,
        display: 'block'
      }}>
        {transaction.type === 'pos' || transaction.type === 'abono' 
          ? `+${formatPrice(transaction.commission_amount)} comisión`
          : `${formatPrice(transaction.commission_amount)} comisión`
        }
      </Typography>
    )}
  </Box>
</TableCell>
                                        
                                        <TableCell sx={{ color: darkProTokens.textSecondary }}>
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
                                                  ? `${darkProTokens.success}20` 
                                                  : transaction.status === 'pending' 
                                                    ? `${darkProTokens.warning}20`
                                                    : `${darkProTokens.error}20`,
                                              color: 
                                                transaction.status === 'completed' || transaction.status === 'active' 
                                                  ? darkProTokens.success 
                                                  : transaction.status === 'pending' 
                                                    ? darkProTokens.warning
                                                    : darkProTokens.error,
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
                                            color: darkProTokens.textDisabled,
                                            py: 4
                                          }}
                                        >
                                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                            <Typography variant="h6">
                                              No hay transacciones de este tipo
                                            </Typography>
                                            <Typography variant="body2">
                                              Para el día {formatDateLocal(selectedDate.toISOString().split('T')[0])}
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
                                  backgroundColor: darkProTokens.surfaceLevel3, 
                                  borderRadius: 2,
                                  border: `1px solid ${darkProTokens.grayMedium}`
                                }}>
                                  <Typography variant="h6" sx={{ color: darkProTokens.textPrimary, mb: 2 }}>
                                    📊 Resumen de {
                                      selectedTab === 0 ? 'Punto de Venta' : 
                                      selectedTab === 1 ? 'Abonos' : 'Membresías'
                                    }
                                  </Typography>
                                  
                                  <Grid container spacing={2}>
                                    <Grid size={12} sm={3}>
                                      <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h5" sx={{ 
                                          color: darkProTokens.primary, 
                                          fontWeight: 'bold' 
                                        }}>
                                          {tabTransactions.length}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                          Transacciones
                                        </Typography>
                                      </Box>
                                    </Grid>
                                    <Grid size={12} sm={3}>
                                      <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h5" sx={{ 
                                          color: darkProTokens.success, 
                                          fontWeight: 'bold' 
                                        }}>
                                          {formatPrice(tabTotal)}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                          Total Generado
                                        </Typography>
                                      </Box>
                                    </Grid>
                                    <Grid size={12} sm={3}>
                                      <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h5" sx={{ 
                                          color: darkProTokens.info, 
                                          fontWeight: 'bold' 
                                        }}>
                                          {tabTransactions.length > 0 ? formatPrice(tabTotal / tabTransactions.length) : '$0.00'}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                          Promedio por Transacción
                                        </Typography>
                                      </Box>
                                    </Grid>
                                    <Grid size={12} sm={3}>
                                      <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h5" sx={{ 
                                          color: darkProTokens.warning, 
                                          fontWeight: 'bold' 
                                        }}>
                                          {formatPrice(tabCommissions)}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
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
