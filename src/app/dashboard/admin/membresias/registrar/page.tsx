'use client';

import React, { useState, useEffect, useCallback, useMemo, useReducer } from 'react';
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
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  InputAdornment,
  Chip,
  Stack,
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton,
  Badge,
  Skeleton,
  LinearProgress
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { debounce } from 'lodash';

// ✅ IMPORTAR HELPERS DE FECHA MÉXICO
import { toMexicoTimestamp, toMexicoDate, formatMexicoDateTime } from '@/utils/dateHelpers';

// 🎨 DARK PRO SYSTEM - CONFIGURATION
import { darkProTokens, MEMBERSHIP_CONFIG } from '@/config/membershipConfig';

// Iconos
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import SearchIcon from '@mui/icons-material/Search';
import PaymentIcon from '@mui/icons-material/Payment';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CalculateIcon from '@mui/icons-material/Calculate';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ReceiptIcon from '@mui/icons-material/Receipt';
import InfoIcon from '@mui/icons-material/Info';
import RefreshIcon from '@mui/icons-material/Refresh';
import HistoryIcon from '@mui/icons-material/History';
import PercentIcon from '@mui/icons-material/Percent';
import EditIcon from '@mui/icons-material/Edit';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

// 📊 TIPOS E INTERFACES
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePictureUrl?: string;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  inscription_price: number;
  visit_price: number;
  weekly_price: number;
  biweekly_price: number;
  monthly_price: number;
  bimonthly_price: number;
  quarterly_price: number;
  semester_price: number;
  annual_price: number;
  weekly_duration: number;
  biweekly_duration: number;
  monthly_duration: number;
  bimonthly_duration: number;
  quarterly_duration: number;
  semester_duration: number;
  annual_duration: number;
  is_active: boolean;
}

interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_amount: number;
  max_uses: number;
  current_uses: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface PaymentCommission {
  id: string;
  payment_method: string;
  commission_type: 'percentage' | 'fixed';
  commission_value: number;
  min_amount: number;
  is_active: boolean;
}

interface PaymentDetail {
  id: string;
  method: string;
  amount: number;
  commission_rate: number;
  commission_amount: number;
  reference: string;
  sequence: number;
}

interface UserMembershipHistory {
  id: string;
  created_at: string;
  status: string;
  plan_name: string;
  end_date: string | null;
  start_date: string;
}

interface FormData {
  userId: string;
  planId: string;
  paymentType: string;
  paymentMethod: string;
  paymentReference: string;
  couponCode: string;
  notes: string;
  paymentReceived: number;
  paymentChange: number;
  isMixedPayment: boolean;
  paymentDetails: PaymentDetail[];
  isRenewal: boolean;
  skipInscription: boolean;
  customCommissionRate: number | null;
  editingCommission: boolean;
  latestEndDate: string | null;
}

// 📋 DATOS ESTÁTICOS
const paymentTypes = [
  { value: 'visit', label: 'Por Visita', key: 'visit_price', duration: 1 },
  { value: 'weekly', label: 'Semanal', key: 'weekly_price', duration: 'weekly_duration' },
  { value: 'biweekly', label: 'Quincenal', key: 'biweekly_price', duration: 'biweekly_duration' },
  { value: 'monthly', label: 'Mensual', key: 'monthly_price', duration: 'monthly_duration' },
  { value: 'bimonthly', label: 'Bimestral', key: 'bimonthly_price', duration: 'bimonthly_duration' },
  { value: 'quarterly', label: 'Trimestral', key: 'quarterly_price', duration: 'quarterly_duration' },
  { value: 'semester', label: 'Semestral', key: 'semester_price', duration: 'semester_duration' },
  { value: 'annual', label: 'Anual', key: 'annual_price', duration: 'annual_duration' }
];

const paymentMethods = [
  { 
    value: 'efectivo', 
    label: 'Efectivo', 
    icon: '💵',
    color: darkProTokens.primary,
    description: '🚫 Sin comisión • Con cálculo de cambio',
    hasCommission: false
  },
  { 
    value: 'debito', 
    label: 'Tarjeta de Débito', 
    icon: '💳',
    color: darkProTokens.grayMedium,
    description: '💰 Con comisión configurable',
    hasCommission: true
  },
  { 
    value: 'credito', 
    label: 'Tarjeta de Crédito', 
    icon: '💳',
    color: darkProTokens.grayLight,
    description: '💰 Con comisión configurable',
    hasCommission: true
  },
  { 
    value: 'transferencia', 
    label: 'Transferencia', 
    icon: '🏦',
    color: darkProTokens.info,
    description: '🚫 Sin comisión • Transferencia bancaria',
    hasCommission: false
  },
  { 
    value: 'mixto', 
    label: 'Pago Mixto', 
    icon: '🔄',
    color: darkProTokens.warning,
    description: '💰 Comisión según métodos seleccionados',
    hasCommission: true
  }
];

// 🎯 ESTADO INICIAL
const initialFormData: FormData = {
  userId: '',
  planId: '',
  paymentType: '',
  paymentMethod: '',
  paymentReference: '',
  couponCode: '',
  notes: '',
  paymentReceived: 0,
  paymentChange: 0,
  isMixedPayment: false,
  paymentDetails: [],
  isRenewal: false,
  skipInscription: false,
  customCommissionRate: null,
  editingCommission: false,
  latestEndDate: null
};

// 🔧 REDUCER PARA MANEJO DE ESTADO COMPLEJO
const formReducer = (state: FormData, action: any) => {
  switch (action.type) {
    case 'SET_USER':
      return { 
        ...state, 
        userId: action.payload.id,
        // Reset campos dependientes
        planId: '',
        paymentType: '',
        isRenewal: false,
        skipInscription: false,
        latestEndDate: null
      };
      
    case 'SET_PLAN':
      return { 
        ...state, 
        planId: action.payload,
        // Reset payment details cuando cambia el plan
        paymentMethod: '',
        paymentDetails: [],
        paymentReceived: 0,
        paymentChange: 0
      };
      
    case 'SET_PAYMENT_TYPE':
      return {
        ...state,
        paymentType: action.payload
      };
      
    case 'TOGGLE_MIXED_PAYMENT':
      return {
        ...state,
        isMixedPayment: !state.isMixedPayment,
        paymentMethod: !state.isMixedPayment ? '' : state.paymentMethod,
        paymentDetails: !state.isMixedPayment ? [] : state.paymentDetails,
        paymentReceived: 0,
        paymentChange: 0
      };
      
    case 'SET_RENEWAL_DATA':
      return {
        ...state,
        isRenewal: action.payload.isRenewal,
        skipInscription: action.payload.skipInscription,
        latestEndDate: action.payload.latestEndDate
      };
      
    case 'UPDATE_PAYMENT':
      return {
        ...state,
        ...action.payload
      };
      
    case 'RESET_FORM':
      return initialFormData;
      
    default:
      return state;
  }
};

// 🚀 COMPONENTE PRINCIPAL
export default function RegistrarMembresiaPage() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  
  // 🔧 ESTADOS CON REDUCER
  const [formData, dispatch] = useReducer(formReducer, initialFormData);
  
  // 📊 ESTADOS DE DATOS
  const [activeStep, setActiveStep] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [paymentCommissions, setPaymentCommissions] = useState<PaymentCommission[]>([]);
  const [userHistory, setUserHistory] = useState<UserMembershipHistory[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  
  // 🔧 ESTADOS DE UI
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  // 💰 ESTADOS DE CÁLCULO
  const [subtotal, setSubtotal] = useState(0);
  const [inscriptionAmount, setInscriptionAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [commissionAmount, setCommissionAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);

  // 🎯 STEPS CONFIGURATION
  const steps = [
    { label: 'Cliente', description: 'Seleccionar cliente', icon: <PersonAddAltIcon /> },
    { label: 'Plan', description: 'Elegir membresía', icon: <FitnessCenterIcon /> },
    { label: 'Descuentos', description: 'Aplicar cupones', icon: <LocalOfferIcon /> },
    { label: 'Pago', description: 'Método de pago', icon: <PaymentIcon /> }
  ];

  // ✅ FUNCIONES UTILITARIAS
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return 'Sin fecha';
    try {
      return formatMexicoDateTime(dateString, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('❌ Error formateando fecha:', dateString, error);
      return 'Fecha inválida';
    }
  }, []);

  // ✅ FUNCIÓN MEJORADA PARA CÁLCULO DE FECHAS
  const addPeriodToDate = useCallback((startDateString: string, periodType: string, plan?: Plan): string => {
    try {
      console.log(`📅 Calculando período: ${startDateString} + ${periodType}`);
      
      // Validar entrada
      if (!startDateString || !periodType) {
        throw new Error('Fecha de inicio y tipo de período son requeridos');
      }
      
      // Crear fecha asegurando zona horaria local
      const date = new Date(`${startDateString}T00:00:00`);
      
      // Validar que la fecha sea válida
      if (isNaN(date.getTime())) {
        throw new Error(`Fecha inválida: ${startDateString}`);
      }
      
      // Guardar día original para manejo de fin de mes
      const originalDay = date.getDate();
      
      switch (periodType) {
        case 'visit':
          // Las visitas no modifican la fecha
          console.log('🎟️ Tipo visita: sin cambio de fecha');
          break;
          
        case 'weekly':
          const weeklyDays = plan?.weekly_duration || 7;
          date.setDate(date.getDate() + weeklyDays);
          console.log(`📆 Semanal: +${weeklyDays} días`);
          break;
          
        case 'biweekly':
          const biweeklyDays = plan?.biweekly_duration || 14;
          date.setDate(date.getDate() + biweeklyDays);
          console.log(`📆 Quincenal: +${biweeklyDays} días`);
          break;
          
        case 'monthly':
          // ✅ CÁLCULO INTELIGENTE DE MES
          const targetMonth = date.getMonth() + 1;
          
          // Manejar cambio de año
          if (targetMonth > 11) {
            date.setFullYear(date.getFullYear() + 1);
            date.setMonth(0);
          } else {
            date.setMonth(targetMonth);
          }
          
          // Manejar días que no existen (ej: 31 de marzo -> 30 de abril)
          if (date.getDate() !== originalDay) {
            // Ir al último día del mes anterior
            date.setDate(0);
          }
          
          console.log(`📆 Mensual: nuevo mes calculado`);
          break;
          
        case 'bimonthly':
          // Similar a mensual pero +2 meses
          const targetBimonth = date.getMonth() + 2;
          date.setFullYear(
            date.getFullYear() + Math.floor(targetBimonth / 12),
            targetBimonth % 12,
            originalDay
          );
          
          // Ajustar si el día no existe
          if (date.getDate() !== originalDay) {
            date.setDate(0);
          }
          console.log(`📆 Bimestral: +2 meses`);
          break;
          
        case 'quarterly':
          // +3 meses con manejo inteligente
          const targetQuarter = date.getMonth() + 3;
          date.setFullYear(
            date.getFullYear() + Math.floor(targetQuarter / 12),
            targetQuarter % 12,
            originalDay
          );
          
          if (date.getDate() !== originalDay) {
            date.setDate(0);
          }
          console.log(`📆 Trimestral: +3 meses`);
          break;
          
        case 'semester':
          // +6 meses
          const targetSemester = date.getMonth() + 6;
          date.setFullYear(
            date.getFullYear() + Math.floor(targetSemester / 12),
            targetSemester % 12,
            originalDay
          );
          
          if (date.getDate() !== originalDay) {
            date.setDate(0);
          }
          console.log(`📆 Semestral: +6 meses`);
          break;
          
        case 'annual':
          // ✅ AÑO COMPLETO CON MANEJO DE BISIESTOS
          date.setFullYear(date.getFullYear() + 1);
          
          // Caso especial: 29 de febrero en año no bisiesto
          if (originalDay === 29 && date.getMonth() === 1 && date.getDate() !== 29) {
            date.setDate(28);
          }
          console.log(`📆 Anual: +1 año`);
          break;
          
        default:
          console.warn(`⚠️ Tipo de período desconocido: ${periodType}`);
          // Por defecto, comportarse como mensual
          date.setMonth(date.getMonth() + 1);
          break;
      }
      
      // Convertir a formato YYYY-MM-DD
      const result = toMexicoDate(date);
      
      console.log(`✅ Resultado: ${startDateString} → ${result}`);
      return result;
      
    } catch (error) {
      console.error('❌ Error calculando fecha:', error);
      // En caso de error, devolver la fecha original
      return startDateString;
    }
  }, []);

  // 🔍 BÚSQUEDA DE USUARIOS CON DEBOUNCE
  const debouncedLoadUsers = useMemo(
    () => debounce(async (searchTerm: string) => {
      if (searchTerm.length < 2) {
        setUsers([]);
        return;
      }
      
      setLoadingUsers(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setError('No hay sesión activa');
          return;
        }

        const { data, error } = await supabase
          .from('Users')
          .select('id, firstName, lastName, email, profilePictureUrl')
          .or(`firstName.ilike.%${searchTerm}%,lastName.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
          .limit(20);

        if (error) {
          const { data: broadData, error: broadError } = await supabase
            .from('Users')
            .select('id, firstName, lastName, email, profilePictureUrl')
            .limit(50);

          if (broadError) throw broadError;

          const filteredUsers = (broadData || []).filter(user => 
            user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase())
          );

          setUsers(filteredUsers);
          return;
        }
        
        setUsers(data || []);
        
      } catch (err: any) {
        setError(`Error al buscar usuarios: ${err.message}`);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    }, 300),
    [supabase]
  );

  // ✅ CARGAR HISTORIAL DE USUARIO
  const loadUserHistory = useCallback(async (userId: string) => {
    try {
      console.log('🔍 Iniciando carga de historial para usuario:', userId);
      
      const { data: memberships, error: membershipsError } = await supabase
        .from('user_memberships')
        .select('id, created_at, status, planid, start_date, end_date')
        .eq('userid', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (membershipsError) {
        console.error('❌ Error en consulta de membresías:', membershipsError);
        setUserHistory([]);
        return;
      }

      console.log(`📊 Membresías encontradas: ${memberships?.length || 0}`);

      let formattedHistory: UserMembershipHistory[] = [];
      
      if (memberships && memberships.length > 0) {
        const planIds = [...new Set(memberships.map(m => m.planid).filter(Boolean))];
        console.log('🔍 Cargando información de planes:', planIds);
        
        if (planIds.length > 0) {
          const { data: plans, error: plansError } = await supabase
            .from('membership_plans')
            .select('id, name')
            .in('id', planIds);

          if (plansError) {
            console.warn('⚠️ Error al cargar planes, usando ID como nombre:', plansError);
            formattedHistory = memberships.map(membership => ({
              id: membership.id,
              created_at: membership.created_at,
              status: membership.status || 'unknown',
              plan_name: `Plan ${membership.planid?.substring(0, 8) || 'Desconocido'}`,
              end_date: membership.end_date,
              start_date: membership.start_date
            }));
          } else {
            const planMap = new Map((plans || []).map(p => [p.id, p.name]));
            
            formattedHistory = memberships.map(membership => ({
              id: membership.id,
              created_at: membership.created_at,
              status: membership.status || 'unknown',
              plan_name: planMap.get(membership.planid) || `Plan ${membership.planid?.substring(0, 8) || 'Desconocido'}`,
              end_date: membership.end_date,
              start_date: membership.start_date
            }));
          }
        }
      }

      console.log(`✅ Historial procesado exitosamente: ${formattedHistory.length} registros`);
      setUserHistory(formattedHistory);

      // ✅ AUTO-DETECCIÓN SIMPLE CON FECHAS MÉXICO
      const today = toMexicoDate(new Date());
      
      const activeMemberships = formattedHistory.filter(h => {
        if (h.status !== 'active' || !h.end_date) return false;
        return h.end_date >= today;
      });
      
      const hasActiveMemberships = activeMemberships.length > 0;
      const hasPreviousMemberships = formattedHistory.length > 0;
      
      console.log(`🔄 Auto-detección: Activas=${hasActiveMemberships}, Previas=${hasPreviousMemberships}`);
      
      // ✅ DETECTAR FECHA DE VENCIMIENTO MÁS RECIENTE
      let latestEndDate = null;
      if (hasActiveMemberships && activeMemberships && activeMemberships.length > 0) {
        latestEndDate = activeMemberships[0].end_date;
        console.log(`📅 Fecha de vencimiento más reciente: ${latestEndDate}`);
      }
      
      dispatch({
        type: 'SET_RENEWAL_DATA',
        payload: {
          isRenewal: hasPreviousMemberships,
          skipInscription: hasActiveMemberships || hasPreviousMemberships,
          latestEndDate: latestEndDate
        }
      });

      if (formattedHistory.length === 0) {
        setInfoMessage('✨ Cliente nuevo detectado: Primera membresía');
        console.log('✨ Usuario nuevo detectado: Primera membresía, inscripción incluida');
      } else {
        setInfoMessage(`🔄 Cliente existente: ${formattedHistory.length} membresías previas`);
        console.log(`🔄 Usuario existente: ${formattedHistory.length} membresías previas`);
        if (latestEndDate) {
          console.log(`📅 Renovación extenderá desde: ${latestEndDate}`);
        }
      }

    } catch (err: any) {
      console.error('💥 Error crítico en loadUserHistory:', err);
      setUserHistory([]);
      setError(`Error cargando historial: ${err.message}`);
      
      dispatch({
        type: 'SET_RENEWAL_DATA',
        payload: {
          isRenewal: false,
          skipInscription: false,
          latestEndDate: null
        }
      });
      
      console.log('🛡️ Configuración segura aplicada: Cliente nuevo con inscripción');
    }
  }, [supabase, dispatch]);


  // ✅ CARGAR PLANES Y COMISIONES INICIAL
  useEffect(() => {
    const loadInitialData = async () => {
      setLoadingPlans(true);
      try {
        // Cargar planes
        const { data: plansData, error: plansError } = await supabase
          .from('membership_plans')
          .select('*')
          .eq('is_active', true)
          .order('monthly_price', { ascending: true });

        if (plansError) throw plansError;
        setPlans(plansData || []);

        // Cargar comisiones
        const { data: commissionsData, error: commissionsError } = await supabase
          .from('payment_commissions')
          .select('*')
          .eq('is_active', true);

        if (commissionsError) throw commissionsError;
        setPaymentCommissions(commissionsData || []);

        setSuccessMessage('📊 Datos cargados correctamente');

      } catch (err: any) {
        setError(`Error cargando datos: ${err.message}`);
      } finally {
        setLoadingPlans(false);
      }
    };

    loadInitialData();
  }, [supabase]);

  // ✅ VALIDAR CUPÓN
  const validateCoupon = useCallback(async (code: string) => {
    if (!code.trim()) {
      setAppliedCoupon(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        setError('Cupón no válido o no encontrado');
        setAppliedCoupon(null);
        return;
      }

      // ✅ VALIDAR FECHAS CON FECHA MÉXICO
      const today = toMexicoDate(new Date());
      
      if (data.start_date && today < data.start_date) {
        setError('El cupón no está vigente aún');
        setAppliedCoupon(null);
        return;
      }

      if (data.end_date && today > data.end_date) {
        setError('El cupón ha expirado');
        setAppliedCoupon(null);
        return;
      }

      if (data.max_uses && data.current_uses >= data.max_uses) {
        setError('El cupón ha alcanzado su límite de usos');
        setAppliedCoupon(null);
        return;
      }

      if (data.min_amount && subtotal < data.min_amount) {
        setError(`El cupón requiere un monto mínimo de ${formatPrice(data.min_amount)}`);
        setAppliedCoupon(null);
        return;
      }

      setAppliedCoupon(data);
      setSuccessMessage('🎟️ Cupón aplicado exitosamente');
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setAppliedCoupon(null);
    }
  }, [supabase, subtotal, formatPrice]);

  // ✅ CALCULAR COMISIÓN MEJORADA
  const calculateCommission = useCallback((method: string, amount: number): { rate: number; amount: number } => {
    // Solo tarjetas tienen comisión
    const methodsWithCommission = ['debito', 'credito'];
    
    if (!methodsWithCommission.includes(method)) {
      console.log(`💳 Método ${method}: SIN comisión (solo tarjetas tienen comisión)`);
      return { rate: 0, amount: 0 };
    }

    // Si hay comisión personalizada, usarla
    if (formData.customCommissionRate !== null) {
      const customAmount = (amount * formData.customCommissionRate) / 100;
      console.log(`💳 Comisión personalizada ${method}: ${formData.customCommissionRate}% = $${customAmount.toFixed(2)}`);
      return { rate: formData.customCommissionRate, amount: customAmount };
    }

    // Usar comisión predeterminada SOLO para tarjetas
    const commission = paymentCommissions.find(c => c.payment_method === method);
    if (!commission || amount < commission.min_amount) {
      console.log(`💳 ${method}: Sin comisión (no configurada o monto menor al mínimo)`);
      return { rate: 0, amount: 0 };
    }

    if (commission.commission_type === 'percentage') {
      const commissionAmount = (amount * commission.commission_value) / 100;
      console.log(`💳 Comisión predeterminada ${method}: ${commission.commission_value}% = $${commissionAmount.toFixed(2)}`);
      return { rate: commission.commission_value, amount: commissionAmount };
    } else {
      console.log(`💳 Comisión fija ${method}: $${commission.commission_value}`);
      return { rate: 0, amount: commission.commission_value };
    }
  }, [formData.customCommissionRate, paymentCommissions]);

  // ✅ MANEJAR PAGOS MIXTOS
  const addMixedPaymentDetail = useCallback(() => {
    const newDetail: PaymentDetail = {
      id: Date.now().toString(),
      method: 'efectivo',
      amount: 0,
      commission_rate: 0,
      commission_amount: 0,
      reference: '',
      sequence: formData.paymentDetails.length + 1
    };

    dispatch({
      type: 'UPDATE_PAYMENT',
      payload: {
        paymentDetails: [...formData.paymentDetails, newDetail]
      }
    });
  }, [formData.paymentDetails]);

  const removeMixedPaymentDetail = useCallback((id: string) => {
    dispatch({
      type: 'UPDATE_PAYMENT',
      payload: {
        paymentDetails: formData.paymentDetails.filter(detail => detail.id !== id)
      }
    });
  }, [formData.paymentDetails]);

  const updateMixedPaymentDetail = useCallback((id: string, field: keyof PaymentDetail, value: any) => {
    const updatedDetails = formData.paymentDetails.map(detail => {
      if (detail.id === id) {
        const updatedDetail = { ...detail, [field]: value };
        
        if (field === 'method' || field === 'amount') {
          const commission = calculateCommission(updatedDetail.method, updatedDetail.amount);
          updatedDetail.commission_rate = commission.rate;
          updatedDetail.commission_amount = commission.amount;
        }
        
        return updatedDetail;
      }
      return detail;
    });

    dispatch({
      type: 'UPDATE_PAYMENT',
      payload: { paymentDetails: updatedDetails }
    });
  }, [formData.paymentDetails, calculateCommission]);

  // ✅ HOOK PERSONALIZADO PARA CÁLCULOS DE MEMBRESÍA
  const membershipCalculations = useMemo(() => {
    if (!selectedPlan || !formData.paymentType) {
      return {
        subtotal: 0,
        inscription: 0,
        discount: 0,
        commission: 0,
        total: 0,
        final: 0
      };
    }

    const paymentTypeData = paymentTypes.find(pt => pt.value === formData.paymentType);
    if (!paymentTypeData) {
      return {
        subtotal: 0,
        inscription: 0,
        discount: 0,
        commission: 0,
        total: 0,
        final: 0
      };
    }

    const planPrice = selectedPlan[paymentTypeData.key as keyof Plan] as number;
    
    // Inscripción condicional
    const inscription = (formData.skipInscription || formData.isRenewal) ? 0 : (selectedPlan.inscription_price || 0);
    
    let discount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discount_type === 'percentage') {
        discount = (planPrice * appliedCoupon.discount_value) / 100;
      } else {
        discount = appliedCoupon.discount_value;
      }
    }

    const newSubtotal = planPrice;
    const newInscription = inscription;
    const newDiscount = Math.min(discount, newSubtotal);
    const newTotal = newSubtotal + newInscription - newDiscount;

    // Calcular comisión
    let newCommission = 0;
    if (formData.isMixedPayment) {
      newCommission = formData.paymentDetails.reduce((sum, detail) => sum + detail.commission_amount, 0);
      console.log(`💳 Comisión mixta total: $${newCommission.toFixed(2)}`);
    } else if (formData.paymentMethod) {
      const commission = calculateCommission(formData.paymentMethod, newTotal);
      newCommission = commission.amount;
    }

    const newFinalAmount = newTotal + newCommission;

    return {
      subtotal: newSubtotal,
      inscription: newInscription,
      discount: newDiscount,
      commission: newCommission,
      total: newTotal,
      final: newFinalAmount
    };
  }, [
    selectedPlan, 
    formData.paymentType, 
    formData.skipInscription, 
    formData.isRenewal, 
    appliedCoupon, 
    formData.isMixedPayment, 
    formData.paymentDetails, 
    formData.paymentMethod,
    calculateCommission
  ]);

  // ✅ ACTUALIZAR ESTADOS DE CÁLCULO CUANDO CAMBIEN
  useEffect(() => {
    setSubtotal(membershipCalculations.subtotal);
    setInscriptionAmount(membershipCalculations.inscription);
    setDiscountAmount(membershipCalculations.discount);
    setCommissionAmount(membershipCalculations.commission);
    setTotalAmount(membershipCalculations.total);
    setFinalAmount(membershipCalculations.final);

    // Calcular cambio para efectivo
    if (formData.paymentMethod === 'efectivo' && formData.paymentReceived > 0) {
      const change = formData.paymentReceived - membershipCalculations.final;
      dispatch({
        type: 'UPDATE_PAYMENT',
        payload: { paymentChange: Math.max(0, change) }
      });
    }
  }, [membershipCalculations, formData.paymentMethod, formData.paymentReceived]);

  // ✅ CALCULAR FECHA DE VENCIMIENTO
  const calculateEndDate = useCallback((): Date | null => {
    if (!selectedPlan || !formData.paymentType) return null;

    const paymentTypeData = paymentTypes.find(pt => pt.value === formData.paymentType);
    if (!paymentTypeData || paymentTypeData.value === 'visit') return null;

    let startDateString: string;
    
    if (formData.isRenewal && formData.latestEndDate) {
      // Renovación: Desde fecha de vencimiento actual
      startDateString = formData.latestEndDate;
      console.log(`🔄 Renovación: Extendiendo desde ${startDateString}`);
    } else {
      // Primera vez: Desde hoy
      startDateString = toMexicoDate(new Date());
      console.log(`🆕 Primera venta: Iniciando desde ${startDateString}`);
    }
    
    // Calcular fecha de vencimiento
    const endDateString = addPeriodToDate(startDateString, formData.paymentType, selectedPlan);
    
    console.log(`📅 Cálculo de fecha de vencimiento:`);
    console.log(`   📅 Inicio: ${startDateString}`);
    console.log(`   🔄 Tipo: ${formData.paymentType}`);
    console.log(`   📅 Fin: ${endDateString}`);
    
    // Convertir a objeto Date para compatibilidad con UI
    const [year, month, day] = endDateString.split('-').map(Number);
    const endDate = new Date(year, month - 1, day, 23, 59, 59);
    
    return endDate;
  }, [selectedPlan, formData.paymentType, formData.isRenewal, formData.latestEndDate, addPeriodToDate]);

  // ✅ VALIDAR FECHAS DE MEMBRESÍA
  const validateMembershipDates = useCallback((startDate: string, endDate: string | null, paymentType: string): boolean => {
    try {
      const start = new Date(`${startDate}T00:00:00`);
      
      // Visitas no tienen fecha de fin
      if (paymentType === 'visit') {
        return endDate === null;
      }
      
      // Otros tipos deben tener fecha de fin
      if (!endDate) {
        console.error('❌ Fecha de fin requerida para tipo:', paymentType);
        return false;
      }
      
      const end = new Date(`${endDate}T00:00:00`);
      
      // La fecha de fin debe ser posterior a la de inicio
      if (end <= start) {
        console.error('❌ Fecha de fin debe ser posterior a fecha de inicio');
        return false;
      }
      
      // Validar duración mínima según tipo
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      const minDurations: Record<string, number> = {
        weekly: 6,
        biweekly: 13,
        monthly: 28,
        bimonthly: 55,
        quarterly: 85,
        semester: 170,
        annual: 350
      };
      
      const minDays = minDurations[paymentType];
      if (minDays && daysDiff < minDays) {
        console.warn(`⚠️ Duración menor a la esperada: ${daysDiff} días (mínimo: ${minDays})`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error validando fechas:', error);
      return false;
    }
  }, []);

  // ✅ VALIDAR PAGO
  const validatePayment = useCallback((): boolean => {
    if (formData.isMixedPayment) {
      const totalPaid = formData.paymentDetails.reduce((sum, detail) => sum + detail.amount, 0);
      const totalWithCommissions = formData.paymentDetails.reduce((sum, detail) => sum + detail.amount + detail.commission_amount, 0);
      
      if (Math.abs(totalWithCommissions - finalAmount) > 0.01) {
        setError(`El total de pagos mixtos (${formatPrice(totalWithCommissions)}) debe coincidir con el total (${formatPrice(finalAmount)})`);
        return false;
      }
    } else if (formData.paymentMethod === 'efectivo') {
      if (formData.paymentReceived < finalAmount) {
        setError(`El monto recibido debe ser mayor o igual a ${formatPrice(finalAmount)}`);
        return false;
      }
    }

    return true;
  }, [formData.isMixedPayment, formData.paymentDetails, finalAmount, formData.paymentMethod, formData.paymentReceived, formatPrice]);

  // ✅ FUNCIÓN PRINCIPAL DE SUBMIT MEJORADA
  const handleSubmit = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Log inicial para debugging
      console.group('🚀 Iniciando proceso de venta de membresía');
      console.log('Usuario:', selectedUser?.email);
      console.log('Plan:', selectedPlan?.name);
      console.log('Tipo:', formData.paymentType);
      console.log('Es renovación:', formData.isRenewal);
      
      // Validaciones iniciales
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No hay sesión activa. Por favor, inicie sesión nuevamente.');
      }
      
      if (!selectedUser || !selectedPlan || !formData.paymentType) {
        throw new Error('Debe completar todos los campos obligatorios');
      }
      
      if (!formData.isMixedPayment && !formData.paymentMethod) {
        throw new Error('Debe seleccionar un método de pago');
      }
      
      if (!validatePayment()) {
        return;
      }
      
      // ✅ CÁLCULO INTELIGENTE DE FECHAS
      console.group('📅 Calculando fechas de membresía');
      
      const today = toMexicoDate(new Date());
      let startDate: string;
      let endDate: string | null = null;
      
      // Determinar fecha de inicio
      if (formData.isRenewal && formData.latestEndDate) {
        // Renovación: comenzar al día siguiente del vencimiento actual
        const lastEnd = new Date(`${formData.latestEndDate}T00:00:00`);
        lastEnd.setDate(lastEnd.getDate() + 1);
        startDate = toMexicoDate(lastEnd);
        console.log(`🔄 Renovación detectada. Inicio: ${startDate} (día después de ${formData.latestEndDate})`);
      } else {
        // Nueva membresía: comenzar hoy
        startDate = today;
        console.log(`🆕 Nueva membresía. Inicio: ${startDate}`);
      }
      
      // Calcular fecha de fin
      if (formData.paymentType === 'visit') {
        // Las visitas no tienen fecha de fin
        endDate = null;
        console.log('🎟️ Tipo visita: sin fecha de vencimiento');
      } else {
        endDate = addPeriodToDate(startDate, formData.paymentType, selectedPlan);
        console.log(`📆 Fecha de vencimiento calculada: ${endDate}`);
      }
      
      console.groupEnd();
      
      // Validar fechas
      if (!validateMembershipDates(startDate, endDate, formData.paymentType)) {
        throw new Error('Error en el cálculo de fechas de la membresía');
      }
      
      // Preparar datos de la membresía
      const membershipData = {
        // IDs y referencias
        userid: selectedUser.id,
        planid: selectedPlan.id,
        created_by: session.user.id,
        
        // Fechas
        start_date: startDate,
        end_date: endDate,
        
        // Tipo y estado
        payment_type: formData.paymentType,
        status: 'active',
        
        // Visitas (solo para tipo 'visit')
        total_visits: formData.paymentType === 'visit' ? 1 : null,
        remaining_visits: formData.paymentType === 'visit' ? 1 : null,
        
        // Montos
        amount_paid: finalAmount,
        subtotal: subtotal,
        inscription_amount: inscriptionAmount,
        discount_amount: discountAmount,
        commission_amount: commissionAmount,
        
        // Método de pago
        payment_method: formData.isMixedPayment ? 'mixto' : formData.paymentMethod,
        payment_reference: formData.paymentReference || null,
        is_mixed_payment: formData.isMixedPayment,
        payment_details: formData.isMixedPayment ? formData.paymentDetails : null,
        
        // Para efectivo
        payment_received: formData.paymentMethod === 'efectivo' ? formData.paymentReceived : finalAmount,
        payment_change: formData.paymentMethod === 'efectivo' ? formData.paymentChange : 0,
        
        // Cupón
        coupon_code: appliedCoupon?.code || null,
        
        // Flags
        is_renewal: formData.isRenewal,
        skip_inscription: formData.skipInscription,
        
        // Comisión personalizada
        custom_commission_rate: formData.customCommissionRate,
        
        // Notas
        notes: formData.notes || null
      };
      
      console.log('💾 Datos a guardar:', membershipData);
      
      // Si es renovación, desactivar membresías activas
      if (formData.isRenewal) {
        console.log('🔄 Desactivando membresías activas previas...');
        
        const { error: updateError } = await supabase
          .from('user_memberships')
          .update({ 
            status: 'expired',
            notes: `Expirada por renovación el ${today}`
          })
          .eq('userid', selectedUser.id)
          .eq('status', 'active');
          
        if (updateError) {
          console.warn('⚠️ Error al desactivar membresías:', updateError);
        } else {
          console.log('✅ Membresías previas desactivadas');
        }
      }
      
      // Guardar nueva membresía
      const { data: membership, error: membershipError } = await supabase
        .from('user_memberships')
        .insert([membershipData])
        .select()
        .single();
        
      if (membershipError) {
        throw membershipError;
      }
      
      console.log('✅ Membresía creada:', membership.id);
      
      // Guardar detalles de pago mixto si aplica
      if (formData.isMixedPayment && formData.paymentDetails.length > 0) {
        console.log('💳 Guardando detalles de pago mixto...');
        
        const paymentDetailsData = formData.paymentDetails.map((detail, index) => ({
          membership_id: membership.id,
          payment_method: detail.method,
          amount: detail.amount,
          commission_rate: detail.commission_rate,
          commission_amount: detail.commission_amount,
          payment_reference: detail.reference || null,
          sequence_order: index + 1
        }));
        
        const { error: detailsError } = await supabase
          .from('membership_payment_details')
          .insert(paymentDetailsData);
          
        if (detailsError) {
          console.error('❌ Error al guardar detalles de pago:', detailsError);
        } else {
          console.log('✅ Detalles de pago guardados');
        }
      }
      
      // Actualizar uso del cupón
      if (appliedCoupon) {
        console.log('🎟️ Actualizando uso del cupón...');
        
        const { error: couponError } = await supabase
          .from('coupons')
          .update({ 
            current_uses: appliedCoupon.current_uses + 1,
            last_used_at: toMexicoTimestamp(new Date()),
            last_used_by: session.user.id
          })
          .eq('id', appliedCoupon.id);
          
        if (couponError) {
          console.warn('⚠️ Error al actualizar cupón:', couponError);
        } else {
          console.log('✅ Cupón actualizado');
        }
      }
      
      // Mensaje de éxito personalizado
      const endDateFormatted = endDate ? 
        formatMexicoDateTime(endDate, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : 
        'Sin vencimiento (pago por visita)';
        
      const successMsg = formData.isRenewal 
        ? `🎉 ¡Renovación exitosa! La membresía de ${selectedUser.firstName} ha sido extendida hasta el ${endDateFormatted}`
        : `🎉 ¡Membresía registrada! ${selectedUser.firstName} tiene acceso hasta el ${endDateFormatted}`;
        
      setSuccessMessage(successMsg);
      console.log(successMsg);
      console.groupEnd();
      
      // Redirigir después de 3 segundos
      setTimeout(() => {
        router.push('/dashboard/admin/membresias');
      }, 3000);
      
    } catch (err: any) {
      console.error('❌ Error en handleSubmit:', err);
      setError(`Error al procesar la venta: ${err.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
      setConfirmDialogOpen(false);
    }
  }, [
    supabase,
    selectedUser,
    selectedPlan,
    formData,
    validatePayment,
    validateMembershipDates,
    finalAmount,
    subtotal,
    inscriptionAmount,
    discountAmount,
    commissionAmount,
    appliedCoupon,
    router,
    addPeriodToDate
  ]);

  // ✅ VALIDAR SI PUEDE PROCEDER AL SIGUIENTE PASO
  const canProceedToNextStep = useCallback(() => {
    switch (activeStep) {
      case 0: return selectedUser !== null;
      case 1: return selectedPlan !== null && formData.paymentType !== '';
      case 2: return true;
      case 3: return formData.isMixedPayment ? 
        formData.paymentDetails.length > 0 : 
        formData.paymentMethod !== '';
      default: return false;
    }
  }, [activeStep, selectedUser, selectedPlan, formData.paymentType, formData.isMixedPayment, formData.paymentDetails.length, formData.paymentMethod]);

  // ✅ NAVEGACIÓN CON TECLADO
  useEffect(() => {
    const handleKeyboardNavigation = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && canProceedToNextStep() && activeStep < steps.length - 1) {
        setActiveStep(prev => prev + 1);
      }
      if (e.key === 'ArrowLeft' && activeStep > 0) {
        setActiveStep(prev => prev - 1);
      }
    };

    window.addEventListener('keydown', handleKeyboardNavigation);
    return () => window.removeEventListener('keydown', handleKeyboardNavigation);
  }, [canProceedToNextStep, activeStep, steps.length]);

  // ✅ FUNCIONES PARA CERRAR NOTIFICACIONES
  const handleCloseError = useCallback(() => setError(null), []);
  const handleCloseSuccess = useCallback(() => setSuccessMessage(null), []);
  const handleCloseWarning = useCallback(() => setWarningMessage(null), []);
  const handleCloseInfo = useCallback(() => setInfoMessage(null), []);

  // 🎯 COMPONENTES REUTILIZABLES
  const SkeletonLoader = () => (
    <Box sx={{ width: '100%' }}>
      <Skeleton 
        variant="rectangular" 
        height={200} 
        sx={{ 
          mb: 2, 
          bgcolor: `${darkProTokens.grayDark}30`,
          borderRadius: 3
        }} 
      />
      <Skeleton 
        variant="text" 
        sx={{ 
          fontSize: '1rem',
          bgcolor: `${darkProTokens.grayDark}20`
        }} 
      />
      <Skeleton 
        variant="text" 
        sx={{ 
          fontSize: '1rem',
          bgcolor: `${darkProTokens.grayDark}20`,
          width: '60%'
        }} 
      />
    </Box>
  );

  const ProgressIndicator = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress 
        variant="determinate" 
        value={(currentStep / totalSteps) * 100}
        size={60}
        thickness={4}
        sx={{ 
          color: darkProTokens.primary,
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
          }
        }}
      />
      <Box sx={{
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Typography 
          variant="caption" 
          component="div" 
          sx={{
            color: darkProTokens.primary,
            fontWeight: 700,
            fontSize: '0.9rem'
          }}
        >
          {`${Math.round((currentStep / totalSteps) * 100)}%`}
        </Typography>
      </Box>
    </Box>
  );

  const PriceLine = ({ 
    label, 
    value, 
    color = 'textPrimary', 
    variant = 'body1', 
    bold = false 
  }: { 
    label: string; 
    value: number | string; 
    color?: string; 
    variant?: any; 
    bold?: boolean;
  }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography variant={variant} sx={{ 
        color: color === 'textPrimary' ? darkProTokens.textSecondary : 
               color === 'success' ? darkProTokens.success :
               color === 'warning' ? darkProTokens.warning :
               darkProTokens.textSecondary,
        fontWeight: bold ? 700 : 500
      }}>
        {label}
      </Typography>
      <Typography variant={variant} sx={{ 
        color: color === 'textPrimary' ? darkProTokens.textPrimary : 
               color === 'success' ? darkProTokens.success :
               color === 'warning' ? darkProTokens.warning :
               darkProTokens.textPrimary,
        fontWeight: bold ? 700 : 600
      }}>
        {typeof value === 'number' ? formatPrice(value) : value}
      </Typography>
    </Box>
  );

  const PaymentMethodCard = ({ 
    method, 
    selected, 
    onSelect,
    disabled = false
  }: {
    method: typeof paymentMethods[0];
    selected: boolean;
    onSelect: () => void;
    disabled?: boolean;
  }) => (
    <motion.div
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      <Card
        onClick={!disabled ? onSelect : undefined}
        sx={{
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: selected ? 
            `linear-gradient(135deg, ${method.color}20, ${method.color}10)` :
            `${darkProTokens.surfaceLevel3}05`,
          border: selected ? 
            `3px solid ${method.color}` : 
            `1px solid ${darkProTokens.grayDark}`,
          borderRadius: 3,
          transition: 'all 0.3s ease',
          minHeight: '140px',
          opacity: disabled ? 0.5 : 1,
          '&:hover': !disabled ? {
            borderColor: method.color,
            transform: 'translateY(-2px)',
            boxShadow: `0 4px 20px ${method.color}30`
          } : {}
        }}
      >
        <CardContent sx={{ 
          textAlign: 'center',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          p: 3
        }}>
          <Typography variant="h3" sx={{ mb: 1 }}>
            {method.icon}
          </Typography>
          <Typography variant="h6" sx={{ 
            color: disabled ? darkProTokens.textDisabled : darkProTokens.textPrimary,
            fontWeight: 600,
            fontSize: '0.9rem',
            mb: 1
          }}>
            {method.label}
          </Typography>
          <Typography variant="caption" sx={{ 
            color: disabled ? darkProTokens.textDisabled : darkProTokens.textSecondary,
            fontSize: '0.75rem',
            lineHeight: 1.3
          }}>
            {disabled && method.value === 'mixto' ? 
              'Use el toggle de arriba para activar' : 
              method.description
            }
          </Typography>
          {selected && !disabled && (
            <CheckCircleIcon sx={{ 
              color: method.color,
              position: 'absolute',
              top: 8,
              right: 8
            }} />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  // 🚀 RENDER PRINCIPAL
  return (
    <Box sx={{ 
      p: 3, 
      background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
      minHeight: '100vh',
      color: darkProTokens.textPrimary
    }}>
      {/* ✅ SISTEMA DE NOTIFICACIONES MEJORADO */}
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
          icon={<ErrorIcon />}
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
          icon={<WarningIcon />}
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

      {/* 🎯 HEADER PROFESIONAL */}
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
              <PersonAddAltIcon sx={{ fontSize: 40, color: darkProTokens.primary }} />
              Nueva Venta de Membresía
            </Typography>
            <Typography variant="body1" sx={{ color: darkProTokens.textSecondary, mt: 1 }}>
              Sistema de punto de venta para membresías del gimnasio
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <ProgressIndicator currentStep={activeStep + 1} totalSteps={steps.length} />
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
          </Box>
        </Box>

        {/* 📊 BARRA DE PROGRESO MEJORADA */}
        <Box>
          <LinearProgress 
            variant="determinate" 
            value={(activeStep + 1) / steps.length * 100}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: `${darkProTokens.primary}20`,
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: `linear-gradient(90deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`
              }
            }}
          />
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 2,
            mt: 2,
            p: 2,
            bgcolor: `${darkProTokens.primary}10`,
            borderRadius: 2,
            border: `1px solid ${darkProTokens.primary}30`
          }}>
            {steps[activeStep]?.icon}
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                Paso {activeStep + 1} de {steps.length}: {steps[activeStep]?.label}
              </Typography>
              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                {steps[activeStep]?.description}
              </Typography>
            </Box>
            <Chip 
              label={`${Math.round(((activeStep + 1) / steps.length) * 100)}%`}
              sx={{ 
                backgroundColor: darkProTokens.primary,
                color: darkProTokens.background,
                fontWeight: 700
              }}
            />
          </Box>
        </Box>
      </Paper>

      {/* 📊 CONTENIDO PRINCIPAL */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{
            p: 4,
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `1px solid ${darkProTokens.grayDark}`,
            borderRadius: 3,
            backdropFilter: 'blur(10px)'
          }}>
            <Stepper 
              activeStep={activeStep} 
              orientation="vertical"
              aria-label="Proceso de registro de membresía"
            >
              {steps.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel
                    aria-label={`Paso ${index + 1}: ${step.label}`}
                    aria-current={activeStep === index ? 'step' : undefined}
                    sx={{
                      '& .MuiStepLabel-label': {
                        color: darkProTokens.textPrimary,
                        fontWeight: activeStep === index ? 700 : 500,
                        fontSize: activeStep === index ? '1.1rem' : '1rem'
                      },
                      '& .MuiStepIcon-root': {
                        color: activeStep === index ? darkProTokens.primary : darkProTokens.grayMuted,
                        fontSize: '2rem',
                        '&.Mui-completed': {
                          color: darkProTokens.primary
                        }
                      }
                    }}
                  >
                    {step.label}
                  </StepLabel>
                  <StepContent>
                    <Typography sx={{ 
                      color: darkProTokens.textSecondary, 
                      mb: 3,
                      fontSize: '1rem',
                      fontWeight: 300
                    }}>
                      {step.description}
                    </Typography>

                    {/* PASO 1: Seleccionar Usuario */}
                    {index === 0 && (
                      <Box sx={{ mb: 4 }}>
                        <Card sx={{
                          background: `${darkProTokens.primary}10`,
                          border: `1px solid ${darkProTokens.primary}30`,
                          borderRadius: 3,
                          mb: 3
                        }}>
                          <CardContent>
                            <Typography variant="h6" sx={{ 
                              color: darkProTokens.primary, 
                              mb: 3,
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2
                            }}>
                              <SearchIcon />
                              Búsqueda de Cliente
                            </Typography>
                            <Autocomplete
                              options={users}
                              getOptionLabel={(user) => `${user.firstName} ${user.lastName} - ${user.email}`}
                              loading={loadingUsers}
                              onInputChange={(event, newInputValue) => {
                                debouncedLoadUsers(newInputValue);
                              }}
                              onChange={(event, newValue) => {
                                setSelectedUser(newValue);
                                dispatch({
                                  type: 'SET_USER',
                                  payload: newValue || { id: '' }
                                });
                                if (newValue) {
                                  console.log('👤 Usuario seleccionado:', newValue.firstName, newValue.lastName);
                                  loadUserHistory(newValue.id);
                                } else {
                                  setUserHistory([]);
                                }
                              }}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label="Buscar Cliente"
                                  placeholder="Nombre, apellido o email..."
                                  fullWidth
                                  InputProps={{
                                    ...params.InputProps,
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        <SearchIcon sx={{ color: darkProTokens.primary }} />
                                      </InputAdornment>
                                    ),
                                    endAdornment: (
                                      <>
                                        {loadingUsers ? (
                                          <CircularProgress 
                                            color="inherit" 
                                            size={24} 
                                            sx={{ color: darkProTokens.primary }} 
                                          />
                                        ) : null}
                                        {params.InputProps.endAdornment}
                                      </>
                                    ),
                                    sx: {
                                      color: darkProTokens.textPrimary,
                                      fontSize: '1.1rem',
                                      '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: `${darkProTokens.primary}40`,
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
                                  InputLabelProps={{
                                    sx: { 
                                      color: darkProTokens.textSecondary,
                                      fontSize: '1.1rem',
                                      '&.Mui-focused': { color: darkProTokens.primary }
                                    }
                                  }}
                                />
                              )}
                              renderOption={(props, user) => {
                                const { key, ...otherProps } = props;
                                return (
                                  <li key={key} {...otherProps} style={{ 
                                    color: darkProTokens.background,
                                    backgroundColor: darkProTokens.textPrimary,
                                    padding: '12px 16px',
                                    borderBottom: `1px solid ${darkProTokens.grayLight}`,
                                    cursor: 'pointer'
                                  }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                      <Box sx={{ 
                                        width: 40, 
                                        height: 40, 
                                        borderRadius: '50%', 
                                        background: darkProTokens.primary,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: darkProTokens.background,
                                        fontWeight: 700,
                                        fontSize: '1rem'
                                      }}>
                                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                                      </Box>
                                      <Box sx={{ flex: 1 }}>
                                        <Typography variant="body1" sx={{ fontWeight: 600, color: darkProTokens.background }}>
                                          {user.firstName} {user.lastName}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: darkProTokens.grayMedium }}>
                                          {user.email}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  </li>
                                );
                              }}
                              sx={{ mb: 3 }}
                              noOptionsText={
                                loadingUsers ? "Buscando..." : 
                                users.length === 0 ? "Escriba al menos 2 caracteres" : 
                                "No se encontraron clientes"
                              }
                            />
                          </CardContent>
                        </Card>

                        {selectedUser && (
                          <AnimatePresence>
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Card sx={{
                                background: `linear-gradient(135deg, ${darkProTokens.primary}15, ${darkProTokens.primary}05)`,
                                border: `2px solid ${darkProTokens.primary}50`,
                                borderRadius: 3,
                                boxShadow: `0 4px 20px ${darkProTokens.primary}20`
                              }}>
                                <CardContent sx={{ p: 3 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
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
                                      {selectedUser.firstName.charAt(0)}{selectedUser.lastName.charAt(0)}
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                      <Typography variant="h6" sx={{ 
                                        color: darkProTokens.primary, 
                                        fontWeight: 700,
                                        mb: 0.5
                                      }}>
                                        ✅ Cliente Seleccionado
                                      </Typography>
                                      <Typography variant="h5" sx={{ 
                                        color: darkProTokens.textPrimary, 
                                        fontWeight: 600,
                                        mb: 0.5
                                      }}>
                                        {selectedUser.firstName} {selectedUser.lastName}
                                      </Typography>
                                      <Typography variant="body1" sx={{ 
                                        color: darkProTokens.textSecondary,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1
                                      }}>
                                        📧 {selectedUser.email}
                                      </Typography>
                                    </Box>
                                    <CheckCircleIcon sx={{ 
                                      color: darkProTokens.primary, 
                                      fontSize: 40
                                    }} />
                                  </Box>

                                  {/* HISTORIAL Y RENOVACIÓN */}
                                  {selectedUser && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      transition={{ duration: 0.4 }}
                                    >
                                      <Divider sx={{ borderColor: `${darkProTokens.primary}30`, my: 3 }} />
                                      
                                      <Box sx={{
                                        background: userHistory.length > 0 ? 
                                          `${darkProTokens.warning}10` : 
                                          `${darkProTokens.success}10`,
                                        border: userHistory.length > 0 ? 
                                          `1px solid ${darkProTokens.warning}30` : 
                                          `1px solid ${darkProTokens.success}30`,
                                        borderRadius: 3,
                                        p: 3
                                      }}>
                                        {userHistory.length > 0 ? (
                                          <>
                                            <Typography variant="h6" sx={{ 
                                              color: darkProTokens.warning,
                                              fontWeight: 700,
                                              mb: 2,
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: 2
                                            }}>
                                              <HistoryIcon />
                                              Historial de Membresías
                                              <Badge badgeContent={userHistory.length} color="primary">
                                                <span></span>
                                              </Badge>
                                            </Typography>

                                            <Box sx={{ mb: 3 }}>
                                              {userHistory.slice(0, 3).map((membership, idx) => (
                                                <Box key={membership.id} sx={{ 
                                                  display: 'flex', 
                                                  justifyContent: 'space-between',
                                                  alignItems: 'center',
                                                  py: 1.5,
                                                  px: 2,
                                                  borderBottom: idx < Math.min(2, userHistory.length - 1) ? `1px solid ${darkProTokens.grayDark}` : 'none',
                                                  background: idx === 0 && membership.status === 'active' ? `${darkProTokens.primary}05` : 'transparent',
                                                  borderRadius: idx === 0 && membership.status === 'active' ? 2 : 0
                                                }}>
                                                  <Box>
                                                    <Typography variant="body1" sx={{ 
                                                      color: darkProTokens.textPrimary,
                                                      fontWeight: idx === 0 && membership.status === 'active' ? 600 : 400
                                                    }}>
                                                      {membership.plan_name}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                                                      📅 {formatDate(membership.start_date)} → {' '}
                                                      {membership.end_date ? formatDate(membership.end_date) : 'Sin fecha'}
                                                    </Typography>
                                                  </Box>
                                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {idx === 0 && membership.status === 'active' && (
                                                      <Typography variant="caption" sx={{ 
                                                        color: darkProTokens.primary,
                                                        fontWeight: 600,
                                                        mr: 1
                                                      }}>
                                                        ACTUAL
                                                      </Typography>
                                                    )}
                                                    <Chip 
                                                      label={membership.status.toUpperCase()}
                                                      size="small"
                                                      sx={{
                                                        backgroundColor: 
                                                          membership.status === 'active' ? darkProTokens.success : 
                                                          membership.status === 'expired' ? darkProTokens.grayMedium : 
                                                          membership.status === 'frozen' ? darkProTokens.info : darkProTokens.grayMuted,
                                                        color: darkProTokens.textPrimary,
                                                        fontSize: '0.7rem',
                                                        fontWeight: 600
                                                      }}
                                                    />
                                                  </Box>
                                                </Box>
                                              ))}
                                            </Box>

                                            {userHistory.length > 3 && (
                                              <Typography variant="caption" sx={{ 
                                                color: darkProTokens.textSecondary,
                                                fontStyle: 'italic',
                                                textAlign: 'center',
                                                display: 'block'
                                              }}>
                                                ... y {userHistory.length - 3} membresías más
                                              </Typography>
                                            )}
                                          </>
                                        ) : (
                                          <>
                                            <Typography variant="h6" sx={{ 
                                              color: darkProTokens.success,
                                              fontWeight: 700,
                                              mb: 2,
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: 2
                                            }}>
                                              ✨ Cliente Nuevo
                                            </Typography>
                                            
                                            <Typography variant="body1" sx={{ 
                                              color: darkProTokens.textPrimary,
                                              mb: 2,
                                              fontWeight: 500
                                            }}>
                                              Este cliente no tiene historial de membresías previas.
                                            </Typography>
                                            
                                            <Alert 
                                              severity="info"
                                              sx={{
                                                backgroundColor: `${darkProTokens.info}10`,
                                                color: darkProTokens.textPrimary,
                                                border: `1px solid ${darkProTokens.info}30`,
                                                '& .MuiAlert-icon': { color: darkProTokens.info }
                                              }}
                                            >
                                              💡 <strong>Primera Venta:</strong> Se incluirá automáticamente el costo de inscripción.
                                            </Alert>
                                          </>
                                        )}

                                        {/* Toggle de Renovación */}
                                        <Box sx={{
                                          background: `${darkProTokens.primary}10`,
                                          border: `1px solid ${darkProTokens.primary}30`,
                                          borderRadius: 3,
                                          p: 3,
                                          mt: 3
                                        }}>
                                          <FormControlLabel
                                            control={
                                              <Switch
                                                checked={formData.isRenewal}
                                                onChange={(e) => {
                                                  const isRenewal = e.target.checked;
                                                  dispatch({
                                                    type: 'SET_RENEWAL_DATA',
                                                    payload: {
                                                      isRenewal,
                                                      skipInscription: isRenewal,
                                                      latestEndDate: formData.latestEndDate
                                                    }
                                                  });
                                                  
                                                  console.log(`🔄 Renovación ${isRenewal ? 'activada' : 'desactivada'}`);
                                                }}
                                                sx={{
                                                  '& .MuiSwitch-switchBase.Mui-checked': {
                                                    color: darkProTokens.primary,
                                                  },
                                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                    backgroundColor: darkProTokens.primary,
                                                  },
                                                }}
                                              />
                                            }
                                            label={
                                              <Box>
                                                <Typography variant="body1" sx={{ 
                                                  color: darkProTokens.textPrimary, 
                                                  fontWeight: 600 
                                                }}>
                                                  🔄 Marcar como Renovación
                                                </Typography>
                                                <Typography variant="caption" sx={{ 
                                                  color: darkProTokens.textSecondary,
                                                  display: 'block',
                                                  mt: 0.5
                                                }}>
                                                  {formData.isRenewal ? (
                                                    <span style={{ color: darkProTokens.success }}>
                                                      ✅ <strong>Renovación:</strong> Sin costo de inscripción
                                                    </span>
                                                  ) : (
                                                    <span style={{ color: darkProTokens.warning }}>
                                                      💰 <strong>Primera venta:</strong> Con costo de inscripción
                                                    </span>
                                                  )}
                                                </Typography>
                                              </Box>
                                            }
                                          />
                                        </Box>
                                      </Box>
                                    </motion.div>
                                  )}
                                </CardContent>
                              </Card>
                            </motion.div>
                          </AnimatePresence>
                        )}
                      </Box>
                    )}

                    {/* PASO 2: Seleccionar Plan */}
                    {index === 1 && (
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" sx={{ 
                          color: darkProTokens.primary, 
                          mb: 3,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2
                        }}>
                          <FitnessCenterIcon />
                          Catálogo de Membresías
                        </Typography>
                        
                        {loadingPlans ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress sx={{ color: darkProTokens.primary }} size={50} />
                          </Box>
                        ) : plans.length === 0 ? (
                          <Alert severity="warning" sx={{
                            backgroundColor: `${darkProTokens.warning}10`,
                            color: darkProTokens.textPrimary,
                            border: `1px solid ${darkProTokens.warning}30`,
                            '& .MuiAlert-icon': { color: darkProTokens.warning }
                          }}>
                            No hay planes de membresía activos disponibles.
                          </Alert>
                        ) : (
                          <Grid container spacing={3} sx={{ mb: 4 }}>
                            {plans.map((plan) => (
                              <Grid key={plan.id} size={{ xs: 12, md: 6 }}>
                                <motion.div
                                  whileHover={{ scale: 1.02, y: -5 }}
                                  whileTap={{ scale: 0.98 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <Card
                                    sx={{
                                      cursor: 'pointer',
                                      background: selectedPlan?.id === plan.id 
                                        ? `linear-gradient(135deg, ${darkProTokens.primary}25, ${darkProTokens.primary}10)`
                                        : `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel2})`,
                                      border: selectedPlan?.id === plan.id 
                                        ? `3px solid ${darkProTokens.primary}` 
                                        : `1px solid ${darkProTokens.grayDark}`,
                                      borderRadius: 3,
                                      transition: 'all 0.3s ease',
                                      height: '100%',
                                      boxShadow: selectedPlan?.id === plan.id 
                                        ? `0 8px 30px ${darkProTokens.primary}30`
                                        : `0 4px 15px rgba(0, 0, 0, 0.2)`,
                                      '&:hover': {
                                        borderColor: darkProTokens.primary,
                                        boxShadow: `0 6px 25px ${darkProTokens.primary}20`
                                      }
                                    }}
                                    onClick={() => {
                                      setSelectedPlan(plan);
                                      dispatch({
                                        type: 'SET_PLAN',
                                        payload: plan.id
                                      });
                                    }}
                                  >
                                    <CardContent sx={{ p: 3, height: '100%' }}>
                                      <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        mb: 2
                                      }}>
                                        <Typography variant="h6" sx={{ 
                                          color: darkProTokens.primary, 
                                          fontWeight: 700
                                        }}>
                                          {plan.name}
                                        </Typography>
                                        {selectedPlan?.id === plan.id && (
                                          <CheckCircleIcon sx={{ color: darkProTokens.primary }} />
                                        )}
                                      </Box>
                                      
                                      <Typography variant="body1" sx={{ 
                                        color: darkProTokens.textSecondary, 
                                        mb: 3,
                                        lineHeight: 1.6,
                                        minHeight: '3em'
                                      }}>
                                        {plan.description}
                                      </Typography>
                                      
                                      <Box sx={{ 
                                        background: `${darkProTokens.primary}10`,
                                        borderRadius: 2,
                                        p: 2,
                                        border: `1px solid ${darkProTokens.primary}30`
                                      }}>
                                        <Typography variant="h6" sx={{ 
                                          color: darkProTokens.textPrimary, 
                                          fontWeight: 700,
                                          textAlign: 'center'
                                        }}>
                                          Desde {formatPrice(plan.weekly_price)}
                                        </Typography>
                                        <Typography variant="body2" sx={{ 
                                          color: darkProTokens.textSecondary,
                                          textAlign: 'center'
                                        }}>
                                          por semana
                                        </Typography>
                                      </Box>
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              </Grid>
                            ))}
                          </Grid>
                        )}

                        {selectedPlan && (
                          <AnimatePresence>
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Card sx={{
                                background: `linear-gradient(135deg, ${darkProTokens.primary}15, ${darkProTokens.primary}05)`,
                                border: `2px solid ${darkProTokens.primary}50`,
                                borderRadius: 3
                              }}>
                                <CardContent sx={{ p: 4 }}>
                                  <Typography variant="h6" sx={{ 
                                    color: darkProTokens.primary, 
                                    mb: 3,
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2
                                  }}>
                                    ⚙️ Configuración del Plan
                                  </Typography>

                                  {/* Control de Inscripción */}
                                  <Box sx={{
                                    background: `${darkProTokens.warning}10`,
                                    border: `1px solid ${darkProTokens.warning}30`,
                                    borderRadius: 3,
                                    p: 3,
                                    mb: 3
                                  }}>
                                    <Typography variant="h6" sx={{ 
                                      color: darkProTokens.warning,
                                      fontWeight: 700,
                                      mb: 2,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 2
                                    }}>
                                      💰 Configuración de Inscripción
                                    </Typography>

                                    <Grid container spacing={3}>
                                      <Grid size={8}>
                                        <FormControlLabel
                                          control={
                                            <Switch
                                              checked={formData.skipInscription}
                                              onChange={(e) => {
                                                dispatch({
                                                  type: 'UPDATE_PAYMENT',
                                                  payload: {
                                                    skipInscription: e.target.checked
                                                  }
                                                });
                                              }}
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
                                            <Box>
                                              <Typography variant="body1" sx={{ 
                                                color: darkProTokens.textPrimary, 
                                                fontWeight: 600 
                                              }}>
                                                🚫 Exentar Inscripción
                                              </Typography>
                                              <Typography variant="caption" sx={{ 
                                                color: darkProTokens.textSecondary
                                              }}>
                                                {formData.skipInscription ? 
                                                  'Sin costo de inscripción' : 
                                                  `Inscripción: ${formatPrice(selectedPlan.inscription_price || 0)}`
                                                }
                                              </Typography>
                                            </Box>
                                          }
                                        />
                                      </Grid>
                                      <Grid size={4}>
                                        <Box sx={{
                                          background: formData.skipInscription ? 
                                            `${darkProTokens.success}10` : 
                                            `${darkProTokens.warning}10`,
                                          border: formData.skipInscription ? 
                                            `1px solid ${darkProTokens.success}30` : 
                                            `1px solid ${darkProTokens.warning}30`,
                                          borderRadius: 2,
                                          p: 2,
                                          textAlign: 'center'
                                        }}>
                                          <Typography variant="body2" sx={{ 
                                            color: darkProTokens.textSecondary,
                                            mb: 1
                                          }}>
                                            Inscripción
                                          </Typography>
                                          <Typography variant="h6" sx={{ 
                                            color: formData.skipInscription ? darkProTokens.success : darkProTokens.warning,
                                            fontWeight: 700
                                          }}>
                                            {formData.skipInscription ? 
                                              'EXENTA' : 
                                              formatPrice(selectedPlan.inscription_price || 0)
                                            }
                                          </Typography>
                                        </Box>
                                      </Grid>
                                    </Grid>
                                  </Box>
                                  
                                  <FormControl fullWidth>
                                    <InputLabel sx={{ 
                                      color: darkProTokens.textSecondary,
                                      fontSize: '1.1rem',
                                      '&.Mui-focused': { color: darkProTokens.primary }
                                    }}>
                                      Duración y precio
                                    </InputLabel>
                                    <Select
                                      value={formData.paymentType}
                                      onChange={(e) => dispatch({
                                        type: 'SET_PAYMENT_TYPE',
                                        payload: e.target.value
                                      })}
                                      IconComponent={ExpandMoreIcon}
                                      sx={{
                                        color: darkProTokens.textPrimary,
                                        fontSize: '1.1rem',
                                        '& .MuiOutlinedInput-notchedOutline': {
                                          borderColor: `${darkProTokens.primary}40`,
                                          borderWidth: 2
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                          borderColor: darkProTokens.primary
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                          borderColor: darkProTokens.primary
                                        },
                                        '& .MuiSvgIcon-root': {
                                          color: darkProTokens.primary
                                        }
                                      }}
                                    >
                                      {paymentTypes.map((type) => {
                                        const price = selectedPlan[type.key as keyof Plan] as number;
                                        if (price <= 0) return null;
                                        
                                        return (
                                          <MenuItem 
                                            key={type.value} 
                                            value={type.value}
                                            sx={{
                                              fontSize: '1rem',
                                              py: 1.5,
                                              '&:hover': {
                                                backgroundColor: `${darkProTokens.primary}10`
                                              },
                                              '&.Mui-selected': {
                                                backgroundColor: `${darkProTokens.primary}20`,
                                                '&:hover': {
                                                  backgroundColor: `${darkProTokens.primary}30`
                                                }
                                              }
                                            }}
                                          >
                                            <Box sx={{ 
                                              display: 'flex', 
                                              justifyContent: 'space-between',
                                              width: '100%',
                                              alignItems: 'center'
                                            }}>
                                              <Box>
                                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                  {type.label}
                                                </Typography>
                                                {type.value !== 'visit' && calculateEndDate() && (
                                                  <Typography variant="caption" sx={{ 
                                                    color: darkProTokens.textSecondary,
                                                    display: 'block'
                                                  }}>
                                                    Hasta: {calculateEndDate()?.toLocaleDateString('es-MX')}
                                                  </Typography>
                                                )}
                                              </Box>
                                              <Typography variant="h6" sx={{ 
                                                color: darkProTokens.primary, 
                                                fontWeight: 700 
                                              }}>
                                                {formatPrice(price)}
                                              </Typography>
                                            </Box>
                                          </MenuItem>
                                        );
                                      })}
                                    </Select>
                                  </FormControl>
                                </CardContent>
                              </Card>
                            </motion.div>
                          </AnimatePresence>
                        )}
                      </Box>
                    )}

                    {/* PASO 3: Cupones */}
                    {index === 2 && (
                      <Box sx={{ mb: 4 }}>
                        <Card sx={{
                          background: `${darkProTokens.primary}05`,
                          border: `1px solid ${darkProTokens.primary}20`,
                          borderRadius: 3
                        }}>
                          <CardContent sx={{ p: 4 }}>
                            <Typography variant="h6" sx={{ 
                              color: darkProTokens.primary, 
                              mb: 3,
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2
                            }}>
                              <LocalOfferIcon />
                              Sistema de Descuentos
                            </Typography>
                            
                            <TextField
                              fullWidth
                              label="Código de Cupón"
                              value={formData.couponCode}
                              onChange={(e) => dispatch({
                                type: 'UPDATE_PAYMENT',
                                payload: { couponCode: e.target.value.toUpperCase() }
                              })}
                              onBlur={(e) => validateCoupon(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  validateCoupon(formData.couponCode);
                                }
                              }}
                              placeholder="Ej: DESC20, PROMO50..."
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <LocalOfferIcon sx={{ color: darkProTokens.primary }} />
                                  </InputAdornment>
                                ),
                                endAdornment: appliedCoupon && (
                                  <InputAdornment position="end">
                                    <CheckCircleIcon sx={{ color: darkProTokens.primary }} />
                                  </InputAdornment>
                                ),
                                sx: {
                                  color: darkProTokens.textPrimary,
                                  fontSize: '1.1rem',
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: `${darkProTokens.primary}40`,
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
                              InputLabelProps={{
                                sx: { 
                                  color: darkProTokens.textSecondary,
                                  fontSize: '1.1rem',
                                  '&.Mui-focused': { color: darkProTokens.primary }
                                }
                              }}
                            />

                            <Typography variant="body2" sx={{ 
                              color: darkProTokens.textSecondary,
                              mt: 1,
                              fontStyle: 'italic'
                            }}>
                              💡 Si tiene un cupón de descuento, ingréselo aquí
                            </Typography>

                            {appliedCoupon && (
                              <AnimatePresence>
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <Box sx={{ mt: 3 }}>
                                    <Card sx={{
                                      background: `linear-gradient(135deg, ${darkProTokens.success}20, ${darkProTokens.success}10)`,
                                      border: `2px solid ${darkProTokens.success}50`,
                                      borderRadius: 3
                                    }}>
                                      <CardContent sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                          <CheckCircleIcon sx={{ color: darkProTokens.success, fontSize: 30 }} />
                                          <Typography variant="h6" sx={{ 
                                            color: darkProTokens.success, 
                                            fontWeight: 700
                                          }}>
                                            ¡Cupón Aplicado!
                                          </Typography>
                                          <Box sx={{ flex: 1 }} />
                                          <IconButton
                                            size="small"
                                            onClick={() => {
                                              setAppliedCoupon(null);
                                              dispatch({
                                                type: 'UPDATE_PAYMENT',
                                                payload: { couponCode: '' }
                                              });
                                            }}
                                            sx={{ color: darkProTokens.error }}
                                          >
                                            <RemoveIcon />
                                          </IconButton>
                                        </Box>
                                        
                                        <Typography variant="body1" sx={{ 
                                          color: darkProTokens.textPrimary, 
                                          mb: 1,
                                          fontWeight: 600
                                        }}>
                                          {appliedCoupon.description}
                                        </Typography>
                                        
                                        <Typography variant="h6" sx={{ 
                                          color: darkProTokens.success,
                                          fontWeight: 700
                                        }}>
                                          Descuento: {appliedCoupon.discount_type === 'percentage' 
                                            ? `${appliedCoupon.discount_value}%` 
                                            : formatPrice(appliedCoupon.discount_value)}
                                        </Typography>
                                        
                                        {appliedCoupon.min_amount > 0 && (
                                          <Typography variant="caption" sx={{ 
                                            color: darkProTokens.textSecondary,
                                            display: 'block',
                                            mt: 1
                                          }}>
                                            Monto mínimo: {formatPrice(appliedCoupon.min_amount)}
                                          </Typography>
                                        )}
                                      </CardContent>
                                    </Card>
                                  </Box>
                                </motion.div>
                              </AnimatePresence>
                            )}
                          </CardContent>
                        </Card>
                      </Box>
                    )}

                    {/* PASO 4: Sistema de Pago */}
                    {index === 3 && (
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" sx={{ 
                          color: darkProTokens.primary, 
                          mb: 4,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2
                        }}>
                          <PaymentIcon />
                          Sistema de Pago
                        </Typography>

                        {/* Toggle Pago Mixto */}
                        <Card sx={{
                          background: `${darkProTokens.primary}05`,
                          border: `1px solid ${darkProTokens.primary}30`,
                          borderRadius: 3,
                          mb: 4
                        }}>
                          <CardContent sx={{ p: 3 }}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={formData.isMixedPayment}
                                  onChange={() => dispatch({ type: 'TOGGLE_MIXED_PAYMENT' })}
                                  sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                      color: darkProTokens.primary,
                                    },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                      backgroundColor: darkProTokens.primary,
                                    },
                                  }}
                                />
                              }
                              label={
                                <Box>
                                  <Typography variant="h6" sx={{ 
                                    color: darkProTokens.textPrimary, 
                                    fontWeight: 600 
                                  }}>
                                    🔄 Pago Mixto
                                  </Typography>
                                  <Typography variant="body2" sx={{ 
                                    color: darkProTokens.textSecondary
                                  }}>
                                    Combinar múltiples métodos de pago
                                  </Typography>
                                </Box>
                              }
                            />
                          </CardContent>
                        </Card>

                        {/* Pago Simple */}
                        {!formData.isMixedPayment && (
                          <AnimatePresence mode="wait">
                            <motion.div
                              key="simple-payment"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Card sx={{
                                background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel2})`,
                                border: `2px solid ${darkProTokens.primary}30`,
                                borderRadius: 3
                              }}>
                                <CardContent sx={{ p: 4 }}>
                                  <Typography variant="h6" sx={{ 
                                    color: darkProTokens.primary, 
                                    mb: 3,
                                    fontWeight: 700
                                  }}>
                                    Método de Pago
                                  </Typography>
                                  
                                  <Grid container spacing={3}>
                                    {paymentMethods.filter(m => m.value !== 'mixto').map((method) => (
                                      <Grid key={method.value} size={{ xs: 12, sm: 6 }}>
                                        <PaymentMethodCard
                                          method={method}
                                          selected={formData.paymentMethod === method.value}
                                          onSelect={() => dispatch({
                                            type: 'UPDATE_PAYMENT',
                                            payload: { paymentMethod: method.value }
                                          })}
                                        />
                                      </Grid>
                                    ))}
                                  </Grid>

                                  {/* Configuración específica para efectivo */}
                                  {formData.paymentMethod === 'efectivo' && (
                                    <AnimatePresence>
                                      <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3 }}
                                      >
                                        <Card sx={{
                                          background: `linear-gradient(135deg, ${darkProTokens.primary}15, ${darkProTokens.primary}05)`,
                                          border: `2px solid ${darkProTokens.primary}50`,
                                          borderRadius: 3,
                                          mt: 3
                                        }}>
                                          <CardContent sx={{ p: 4 }}>
                                            <Typography variant="h6" sx={{ 
                                              color: darkProTokens.primary, 
                                              mb: 3,
                                              fontWeight: 700,
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: 2
                                            }}>
                                              💵 Calculadora de Efectivo
                                            </Typography>

                                            <Grid container spacing={3}>
                                              <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                  fullWidth
                                                  label="Total a Cobrar"
                                                  value={formatPrice(finalAmount)}
                                                  disabled
                                                  InputProps={{
                                                    sx: {
                                                      color: darkProTokens.textPrimary,
                                                      backgroundColor: `${darkProTokens.primary}10`,
                                                      fontSize: '1.3rem',
                                                      fontWeight: 700,
                                                      '& .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: `${darkProTokens.primary}50`,
                                                        borderWidth: 2
                                                      }
                                                    }
                                                  }}
                                                  InputLabelProps={{
                                                    sx: { 
                                                      color: darkProTokens.textSecondary,
                                                      fontWeight: 600
                                                    }
                                                  }}
                                                />
                                              </Grid>

                                              <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                  fullWidth
                                                  label="Dinero Recibido"
                                                  type="number"
                                                  value={formData.paymentReceived || ''}
                                                  onChange={(e) => {
                                                    const received = parseFloat(e.target.value) || 0;
                                                    dispatch({
                                                      type: 'UPDATE_PAYMENT',
                                                      payload: {
                                                        paymentReceived: received,
                                                        paymentChange: Math.max(0, received - finalAmount)
                                                      }
                                                    });
                                                  }}
                                                  placeholder="0.00"
                                                  InputProps={{
                                                    startAdornment: (
                                                      <InputAdornment position="start">
                                                        <AttachMoneyIcon sx={{ color: darkProTokens.primary }} />
                                                      </InputAdornment>
                                                    ),
                                                    sx: {
                                                      color: darkProTokens.textPrimary,
                                                      fontSize: '1.3rem',
                                                      fontWeight: 700,
                                                      '& .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: `${darkProTokens.primary}50`,
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
                                                  InputLabelProps={{
                                                    sx: { 
                                                      color: darkProTokens.textSecondary,
                                                      fontWeight: 600,
                                                      '&.Mui-focused': { color: darkProTokens.primary }
                                                    }
                                                  }}
                                                />
                                              </Grid>

                                              <Grid size={12}>
                                                <Box sx={{
                                                  background: formData.paymentChange > 0 
                                                    ? `linear-gradient(135deg, ${darkProTokens.primary}20, ${darkProTokens.primary}10)`
                                                    : `${darkProTokens.grayMedium}05`,
                                                  border: formData.paymentChange > 0 
                                                    ? `2px solid ${darkProTokens.primary}` 
                                                    : `1px solid ${darkProTokens.grayDark}`,
                                                  borderRadius: 3,
                                                  p: 3,
                                                  textAlign: 'center'
                                                }}>
                                                  <Typography variant="h4" sx={{ 
                                                    color: formData.paymentChange > 0 ? darkProTokens.primary : darkProTokens.textSecondary,
                                                    fontWeight: 800,
                                                    mb: 1
                                                  }}>
                                                    {formData.paymentChange > 0 
                                                      ? `💰 Cambio: ${formatPrice(formData.paymentChange)}`
                                                      : '💰 Cambio: $0.00'
                                                    }
                                                  </Typography>
                                                  <Typography variant="body1" sx={{ 
                                                    color: darkProTokens.textSecondary
                                                  }}>
                                                    {formData.paymentReceived < finalAmount 
                                                      ? `Faltan: ${formatPrice(finalAmount - formData.paymentReceived)}`
                                                      : formData.paymentChange > 0 
                                                        ? 'Entregar cambio al cliente'
                                                        : 'Pago exacto'
                                                    }
                                                  </Typography>
                                                </Box>
                                              </Grid>
                                            </Grid>
                                          </CardContent>
                                        </Card>
                                      </motion.div>
                                    </AnimatePresence>
                                  )}

                                  {/* Referencias para otros métodos */}
                                  {(formData.paymentMethod === 'debito' || formData.paymentMethod === 'credito' || formData.paymentMethod === 'transferencia') && (
                                    <AnimatePresence>
                                      <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3 }}
                                      >
                                        <Card sx={{
                                          background: `${darkProTokens.surfaceLevel3}15`,
                                          border: `1px solid ${darkProTokens.grayDark}`,
                                          borderRadius: 3,
                                          mt: 3
                                        }}>
                                          <CardContent sx={{ p: 3 }}>
                                            <TextField
                                              fullWidth
                                              label={
                                                formData.paymentMethod === 'transferencia' 
                                                  ? 'Número de Referencia / SPEI'
                                                  : 'Número de Autorización'
                                              }
                                              value={formData.paymentReference}
                                              onChange={(e) => dispatch({
                                                type: 'UPDATE_PAYMENT',
                                                payload: { paymentReference: e.target.value }
                                              })}
                                              placeholder="Ej: 123456, AUTH789..."
                                              InputProps={{
                                                startAdornment: (
                                                  <InputAdornment position="start">
                                                    {formData.paymentMethod === 'transferencia' ? 
                                                      <AccountBalanceIcon sx={{ color: darkProTokens.info }} /> :
                                                      <CreditCardIcon sx={{ color: darkProTokens.grayMedium }} />
                                                    }
                                                  </InputAdornment>
                                                ),
                                                sx: {
                                                  color: darkProTokens.textPrimary,
                                                  '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: `${darkProTokens.grayDark}50`,
                                                    borderWidth: 2
                                                  },
                                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: darkProTokens.grayLight
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
                                          </CardContent>
                                        </Card>
                                      </motion.div>
                                    </AnimatePresence>
                                  )}
                                </CardContent>
                              </Card>
                            </motion.div>
                          </AnimatePresence>
                        )}
                        
                        {/* Pago Mixto */}
                        {formData.isMixedPayment && (
                          <AnimatePresence mode="wait">
                            <motion.div
                              key="mixed-payment"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Card sx={{
                                background: `linear-gradient(135deg, ${darkProTokens.warning}15, ${darkProTokens.warning}05)`,
                                border: `2px solid ${darkProTokens.warning}50`,
                                borderRadius: 3
                              }}>
                                <CardContent sx={{ p: 4 }}>
                                  <Box sx={{ 
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    mb: 3
                                  }}>
                                    <Typography variant="h6" sx={{ 
                                      color: darkProTokens.warning, 
                                      fontWeight: 700,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 2
                                    }}>
                                      🔄 Pagos Mixtos
                                    </Typography>
                                    
                                    <Button
                                      variant="contained"
                                      startIcon={<AddIcon />}
                                      onClick={addMixedPaymentDetail}
                                      sx={{
                                        background: `linear-gradient(135deg, ${darkProTokens.warning}, ${darkProTokens.warningHover})`,
                                        color: darkProTokens.background,
                                        fontWeight: 700,
                                        '&:hover': {
                                          background: `linear-gradient(135deg, ${darkProTokens.warningHover}, ${darkProTokens.warning})`,
                                          transform: 'translateY(-2px)'
                                        }
                                      }}
                                    >
                                      Agregar Método
                                    </Button>
                                  </Box>

                                  {formData.paymentDetails.length === 0 && (
                                    <Box sx={{
                                      textAlign: 'center',
                                      py: 4,
                                      border: `2px dashed ${darkProTokens.warning}30`,
                                      borderRadius: 3
                                    }}>
                                      <Typography variant="body1" sx={{ 
                                        color: darkProTokens.textSecondary,
                                        mb: 2
                                      }}>
                                        No hay métodos agregados
                                      </Typography>
                                      <Typography variant="body2" sx={{ 
                                        color: darkProTokens.textSecondary
                                      }}>
                                        Agregue métodos de pago para comenzar
                                      </Typography>
                                    </Box>
                                  )}

                                  <Stack spacing={3}>
                                    {formData.paymentDetails.map((detail, index) => (
                                      <motion.div
                                        key={detail.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.1 }}
                                      >
                                        <Card sx={{
                                          background: `${darkProTokens.surfaceLevel3}05`,
                                          border: `1px solid ${darkProTokens.grayDark}`,
                                          borderRadius: 3
                                        }}>
                                          <CardContent sx={{ p: 3 }}>
                                            <Box sx={{ 
                                              display: 'flex',
                                              justifyContent: 'space-between',
                                              alignItems: 'center',
                                              mb: 2
                                            }}>
                                              <Typography variant="h6" sx={{ 
                                                color: darkProTokens.warning,
                                                fontWeight: 600
                                              }}>
                                                Pago #{detail.sequence}
                                              </Typography>
                                              
                                              <IconButton
                                                onClick={() => removeMixedPaymentDetail(detail.id)}
                                                sx={{ color: darkProTokens.error }}
                                              >
                                                <RemoveIcon />
                                              </IconButton>
                                            </Box>

                                            <Grid container spacing={2}>
                                              <Grid size={{ xs: 12, md: 4 }}>
                                                <FormControl fullWidth>
                                                  <InputLabel sx={{ 
                                                    color: darkProTokens.textSecondary,
                                                    '&.Mui-focused': { color: darkProTokens.warning }
                                                  }}>
                                                    Método
                                                  </InputLabel>
                                                  <Select
                                                    value={detail.method}
                                                    onChange={(e) => updateMixedPaymentDetail(detail.id, 'method', e.target.value)}
                                                    sx={{
                                                      color: darkProTokens.textPrimary,
                                                      '& .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: `${darkProTokens.warning}30`
                                                      },
                                                      '&:hover .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: darkProTokens.warning
                                                      },
                                                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: darkProTokens.warning
                                                      }
                                                    }}
                                                  >
                                                    {paymentMethods.filter(m => m.value !== 'mixto').map((method) => (
                                                      <MenuItem key={method.value} value={method.value}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                          <span>{method.icon}</span>
                                                          <span>{method.label}</span>
                                                          {!method.hasCommission && (
                                                            <Chip label="Sin comisión" size="small" sx={{ 
                                                              backgroundColor: darkProTokens.success, 
                                                              color: darkProTokens.background,
                                                              fontSize: '0.65rem',
                                                              ml: 1
                                                            }} />
                                                          )}
                                                        </Box>
                                                      </MenuItem>
                                                    ))}
                                                  </Select>
                                                </FormControl>
                                              </Grid>

                                              <Grid size={{ xs: 12, md: 4 }}>
                                                <TextField
                                                  fullWidth
                                                  label="Monto"
                                                  type="number"
                                                  value={detail.amount || ''}
                                                  onChange={(e) => updateMixedPaymentDetail(detail.id, 'amount', parseFloat(e.target.value) || 0)}
                                                  InputProps={{
                                                    startAdornment: (
                                                      <InputAdornment position="start">
                                                        $
                                                      </InputAdornment>
                                                    ),
                                                    sx: {
                                                      color: darkProTokens.textPrimary,
                                                      '& .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: `${darkProTokens.warning}30`
                                                      },
                                                      '&:hover .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: darkProTokens.warning
                                                      },
                                                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: darkProTokens.warning
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
                                                <TextField
                                                  fullWidth
                                                  label="Referencia"
                                                  value={detail.reference}
                                                  onChange={(e) => updateMixedPaymentDetail(detail.id, 'reference', e.target.value)}
                                                  placeholder="Opcional"
                                                  InputProps={{
                                                    sx: {
                                                      color: darkProTokens.textPrimary,
                                                      '& .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: darkProTokens.grayDark
                                                      }
                                                    }
                                                  }}
                                                  InputLabelProps={{
                                                    sx: { color: darkProTokens.textSecondary }
                                                  }}
                                                />
                                              </Grid>

                                              {detail.commission_amount > 0 && (
                                                <Grid size={12}>
                                                  <Alert severity="warning" sx={{
                                                    backgroundColor: `${darkProTokens.warning}10`,
                                                    color: darkProTokens.textPrimary,
                                                    border: `1px solid ${darkProTokens.warning}30`,
                                                    '& .MuiAlert-icon': { color: darkProTokens.warning }
                                                  }}>
                                                    <Typography variant="body2">
                                                      <strong>💳 Comisión:</strong> {detail.commission_rate}% = {formatPrice(detail.commission_amount)}
                                                    </Typography>
                                                  </Alert>
                                                </Grid>
                                              )}
                                            </Grid>
                                          </CardContent>
                                        </Card>
                                      </motion.div>
                                    ))}
                                  </Stack>

                                  {/* Resumen de Pagos Mixtos */}
                                  {formData.paymentDetails.length > 0 && (
                                    <AnimatePresence>
                                      <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3 }}
                                      >
                                        <Box sx={{ mt: 4 }}>
                                          <Card sx={{
                                            background: `linear-gradient(135deg, ${darkProTokens.primary}20, ${darkProTokens.primary}10)`,
                                            border: `2px solid ${darkProTokens.primary}`,
                                            borderRadius: 3
                                          }}>
                                            <CardContent sx={{ p: 3 }}>
                                              <Typography variant="h6" sx={{ 
                                                color: darkProTokens.primary,
                                                fontWeight: 700,
                                                mb: 2
                                              }}>
                                                📊 Resumen de Pagos
                                              </Typography>

                                              <Grid container spacing={2}>
                                                <Grid size={{ xs: 6, md: 3 }}>
                                                  <Box sx={{ textAlign: 'center' }}>
                                                    <Typography variant="body2" sx={{ 
                                                      color: darkProTokens.textSecondary
                                                    }}>
                                                      Total Parcial
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ 
                                                      color: darkProTokens.textPrimary,
                                                      fontWeight: 700
                                                    }}>
                                                      {formatPrice(formData.paymentDetails.reduce((sum, detail) => sum + detail.amount, 0))}
                                                    </Typography>
                                                  </Box>
                                                </Grid>

                                                <Grid size={{ xs: 6, md: 3 }}>
                                                  <Box sx={{ textAlign: 'center' }}>
                                                    <Typography variant="body2" sx={{ 
                                                      color: darkProTokens.textSecondary
                                                    }}>
                                                      Comisiones
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ 
                                                      color: darkProTokens.warning,
                                                      fontWeight: 700
                                                    }}>
                                                      {formatPrice(formData.paymentDetails.reduce((sum, detail) => sum + detail.commission_amount, 0))}
                                                    </Typography>
                                                  </Box>
                                                </Grid>

                                                <Grid size={{ xs: 6, md: 3 }}>
                                                  <Box sx={{ textAlign: 'center' }}>
                                                    <Typography variant="body2" sx={{ 
                                                      color: darkProTokens.textSecondary
                                                    }}>
                                                      Total Pagado
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ 
                                                      color: darkProTokens.primary,
                                                      fontWeight: 700
                                                    }}>
                                                      {formatPrice(formData.paymentDetails.reduce((sum, detail) => sum + detail.amount + detail.commission_amount, 0))}
                                                    </Typography>
                                                  </Box>
                                                </Grid>

                                                <Grid size={{ xs: 6, md: 3 }}>
                                                  <Box sx={{ textAlign: 'center' }}>
                                                    <Typography variant="body2" sx={{ 
                                                      color: darkProTokens.textSecondary
                                                    }}>
                                                      Balance
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ 
                                                      color: Math.abs(formData.paymentDetails.reduce((sum, detail) => sum + detail.amount + detail.commission_amount, 0) - finalAmount) < 0.01 
                                                        ? darkProTokens.success : darkProTokens.error,
                                                      fontWeight: 700
                                                    }}>
                                                      {Math.abs(formData.paymentDetails.reduce((sum, detail) => sum + detail.amount + detail.commission_amount, 0) - finalAmount) < 0.01 
                                                        ? '✅ Exacto' 
                                                        : `${formatPrice(finalAmount - formData.paymentDetails.reduce((sum, detail) => sum + detail.amount + detail.commission_amount, 0))}`
                                                      }
                                                    </Typography>
                                                  </Box>
                                                </Grid>
                                              </Grid>
                                            </CardContent>
                                          </Card>
                                        </Box>
                                      </motion.div>
                                    </AnimatePresence>
                                  )}

                                  <Alert 
                                    severity="info"
                                    sx={{
                                      mt: 3,
                                      backgroundColor: `${darkProTokens.info}10`,
                                      color: darkProTokens.textPrimary,
                                      border: `1px solid ${darkProTokens.info}30`,
                                      '& .MuiAlert-icon': { color: darkProTokens.info }
                                    }}
                                  >
                                    <Typography variant="body2">
                                      <strong>💡 Comisiones en Pago Mixto:</strong> Solo se aplicarán comisiones a los métodos de tarjeta (débito/crédito).
                                      Efectivo y transferencias están exentos.
                                    </Typography>
                                  </Alert>
                                </CardContent>
                              </Card>
                            </motion.div>
                          </AnimatePresence>
                        )}

                        {/* Notas Adicionales */}
                        <Card sx={{
                          background: `${darkProTokens.surfaceLevel2}02`,
                          border: `1px solid ${darkProTokens.grayDark}10`,
                          borderRadius: 3,
                          mt: 3
                        }}>
                          <CardContent sx={{ p: 3 }}>
                            <TextField
                              fullWidth
                              label="Notas Adicionales"
                              value={formData.notes}
                              onChange={(e) => dispatch({
                                type: 'UPDATE_PAYMENT',
                                payload: { notes: e.target.value }
                              })}
                              multiline
                              rows={3}
                              placeholder="Observaciones especiales..."
                              InputProps={{
                                sx: {
                                  color: darkProTokens.textPrimary,
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: `${darkProTokens.grayDark}30`
                                  },
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: `${darkProTokens.grayDark}50`
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
                          </CardContent>
                        </Card>
                      </Box>
                    )}

                    {/* Botones de navegación */}
                    <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                      <Button
                        disabled={activeStep === 0}
                        onClick={() => setActiveStep(prev => prev - 1)}
                        size="large"
                        sx={{ 
                          color: darkProTokens.textSecondary,
                          borderColor: darkProTokens.grayDark,
                          px: 4,
                          py: 1.5,
                          borderRadius: 3,
                          '&:hover': {
                            borderColor: darkProTokens.textSecondary,
                            backgroundColor: darkProTokens.hoverOverlay
                          }
                        }}
                        variant="outlined"
                      >
                        ← Anterior
                      </Button>
                      
                      {activeStep === steps.length - 1 ? (
                        <Button
                          variant="contained"
                          onClick={() => setConfirmDialogOpen(true)}
                          disabled={!canProceedToNextStep() || loading}
                          size="large"
                          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                          sx={{
                            background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
                            color: darkProTokens.background,
                            fontWeight: 700,
                            px: 4,
                            py: 1.5,
                            borderRadius: 3,
                            fontSize: '1.1rem',
                            '&:hover': {
                              background: `linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive})`,
                              transform: 'translateY(-2px)',
                              boxShadow: `0 6px 20px ${darkProTokens.primary}40`
                            },
                            '&:disabled': {
                              background: darkProTokens.grayMedium,
                              color: darkProTokens.textDisabled
                            }
                          }}
                        >
                          {loading ? 'Procesando...' : 'Procesar Venta'}
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          onClick={() => setActiveStep(prev => prev + 1)}
                          disabled={!canProceedToNextStep()}
                          size="large"
                          sx={{
                            background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
                            color: darkProTokens.background,
                            fontWeight: 700,
                            px: 4,
                            py: 1.5,
                            borderRadius: 3,
                            fontSize: '1.1rem',
                            '&:hover': {
                              background: `linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive})`,
                              transform: 'translateY(-2px)',
                              boxShadow: `0 6px 20px ${darkProTokens.primary}40`
                            },
                            '&:disabled': {
                              background: darkProTokens.grayMedium,
                              color: darkProTokens.textDisabled
                            }
                          }}
                        >
                          Continuar →
                        </Button>
                      )}
                    </Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Paper>
        </Grid>

        {/* Panel de Resumen - Sidebar */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper sx={{
            p: 3,
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `2px solid ${darkProTokens.primary}30`,
            borderRadius: 3,
            position: 'sticky',
            top: 20,
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3)`
          }}>
            <Typography variant="h6" sx={{ 
              color: darkProTokens.primary, 
              mb: 3, 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <ReceiptIcon />
              Resumen de Venta
            </Typography>

            {selectedUser && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{
                      background: `${darkProTokens.primary}10`,
                      border: `1px solid ${darkProTokens.primary}30`,
                      borderRadius: 3,
                      p: 3
                    }}>
                      <Typography variant="subtitle1" sx={{ 
                        color: darkProTokens.textSecondary,
                        mb: 1
                      }}>
                        Cliente:
                      </Typography>
                      <Typography variant="h6" sx={{ 
                        color: darkProTokens.textPrimary, 
                        fontWeight: 700,
                        mb: 0.5
                      }}>
                        {selectedUser.firstName} {selectedUser.lastName}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: darkProTokens.textSecondary
                      }}>
                        {selectedUser.email}
                      </Typography>
                      
                      {formData.isRenewal && (
                        <Box sx={{ mt: 2 }}>
                          <Chip 
                            label="🔄 RENOVACIÓN" 
                            size="small"
                            sx={{
                              backgroundColor: darkProTokens.warning,
                              color: darkProTokens.background,
                              fontWeight: 700
                            }}
                          />
                        </Box>
                      )}
                    </Box>
                  </Box>
                </motion.div>
              </AnimatePresence>
            )}

            {selectedPlan && formData.paymentType && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" sx={{ 
                      color: darkProTokens.textSecondary,
                      mb: 2
                    }}>
                      Membresía:
                    </Typography>
                    
                    <Box sx={{
                      background: `${darkProTokens.surfaceLevel3}05`,
                      border: `1px solid ${darkProTokens.grayDark}`,
                      borderRadius: 3,
                      p: 3,
                      mb: 3
                    }}>
                      <Typography variant="h6" sx={{ 
                        color: darkProTokens.textPrimary, 
                        fontWeight: 700,
                        mb: 1
                      }}>
                        {selectedPlan.name}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: darkProTokens.textSecondary,
                        mb: 2
                      }}>
                        {paymentTypes.find(pt => pt.value === formData.paymentType)?.label}
                      </Typography>

                      {calculateEndDate() && (
                        <Box sx={{
                          background: `${darkProTokens.primary}10`,
                          borderRadius: 2,
                          p: 2,
                          border: `1px solid ${darkProTokens.primary}20`
                        }}>
                          <Typography variant="body2" sx={{ 
                            color: darkProTokens.textSecondary,
                            mb: 1
                          }}>
                            Vigencia hasta:
                          </Typography>
                          <Typography variant="body1" sx={{ 
                            color: darkProTokens.primary,
                            fontWeight: 600
                          }}>
                            <CalendarMonthIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                            {calculateEndDate()?.toLocaleDateString('es-MX', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <Divider sx={{ borderColor: `${darkProTokens.primary}30`, my: 3 }} />

                    {/* Desglose de Precios */}
                    <Stack spacing={2}>
                      <PriceLine label="Subtotal Plan:" value={subtotal} />
                      
                      {inscriptionAmount > 0 ? (
                        <PriceLine label="Inscripción:" value={inscriptionAmount} />
                      ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body1" sx={{ 
                            color: darkProTokens.success,
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}>
                            🚫 Inscripción EXENTA:
                          </Typography>
                          <Typography variant="h6" sx={{ 
                            color: darkProTokens.success,
                            fontWeight: 700
                          }}>
                            GRATIS
                          </Typography>
                        </Box>
                      )}

                      {discountAmount > 0 && (
                        <PriceLine label="🎟️ Descuento:" value={-discountAmount} color="success" />
                      )}

                      <Divider sx={{ borderColor: darkProTokens.grayDark }} />

                      <PriceLine label="Subtotal:" value={totalAmount} variant="h6" bold />

                      {commissionAmount > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body1" sx={{ 
                            color: darkProTokens.warning,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}>
                            <InfoIcon fontSize="small" />
                            Comisión{formData.customCommissionRate !== null ? ' (Personal)' : ''}:
                          </Typography>
                          <Typography variant="h6" sx={{ 
                            color: darkProTokens.warning,
                            fontWeight: 700
                          }}>
                            +{formatPrice(commissionAmount)}
                          </Typography>
                        </Box>
                      )}

                      <Divider sx={{ borderColor: `${darkProTokens.primary}50` }} />

                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        background: `${darkProTokens.primary}10`,
                        border: `1px solid ${darkProTokens.primary}30`,
                        borderRadius: 3,
                        p: 3
                      }}>
                        <Typography variant="h5" sx={{ 
                          color: darkProTokens.textPrimary, 
                          fontWeight: 800
                        }}>
                          TOTAL FINAL:
                        </Typography>
                        <Typography variant="h4" sx={{ 
                          color: darkProTokens.primary, 
                          fontWeight: 900
                        }}>
                          {formatPrice(finalAmount)}
                        </Typography>
                      </Box>

                      {/* Información del método de pago */}
                      {(formData.paymentMethod || formData.isMixedPayment) && (
                        <Box sx={{ mt: 3 }}>
                          <Typography variant="subtitle1" sx={{ 
                            color: darkProTokens.textSecondary,
                            mb: 2
                          }}>
                            Método de Pago:
                          </Typography>
                          
                          {formData.isMixedPayment ? (
                            <Box sx={{
                              background: `${darkProTokens.warning}10`,
                              border: `1px solid ${darkProTokens.warning}30`,
                              borderRadius: 3,
                              p: 2
                            }}>
                              <Typography variant="body1" sx={{ 
                                color: darkProTokens.warning,
                                fontWeight: 600,
                                mb: 1
                              }}>
                                🔄 Pago Mixto
                              </Typography>
                              <Typography variant="body2" sx={{ 
                                color: darkProTokens.textSecondary
                              }}>
                                {formData.paymentDetails.length} método{formData.paymentDetails.length !== 1 ? 's' : ''} configurado{formData.paymentDetails.length !== 1 ? 's' : ''}
                              </Typography>
                            </Box>
                          ) : (
                            <Box sx={{
                              background: `${darkProTokens.surfaceLevel3}05`,
                              border: `1px solid ${darkProTokens.grayDark}`,
                              borderRadius: 3,
                              p: 2
                            }}>
                              <Typography variant="body1" sx={{ 
                                color: darkProTokens.textPrimary,
                                fontWeight: 600,
                                mb: 1
                              }}>
                                {paymentMethods.find(pm => pm.value === formData.paymentMethod)?.icon} {paymentMethods.find(pm => pm.value === formData.paymentMethod)?.label}
                              </Typography>

                              <Typography variant="caption" sx={{ 
                                color: (formData.paymentMethod === 'debito' || formData.paymentMethod === 'credito') ? 
                                  darkProTokens.warning : darkProTokens.success,
                                fontWeight: 600,
                                display: 'block',
                                mb: 1
                              }}>
                                {(formData.paymentMethod === 'debito' || formData.paymentMethod === 'credito') ? 
                                  '💰 Con comisión' : '🚫 Sin comisión'}
                              </Typography>
                              
                              {formData.paymentMethod === 'efectivo' && formData.paymentReceived > 0 && (
                                <Box sx={{ mt: 2 }}>
                                  <Typography variant="body2" sx={{ 
                                    color: darkProTokens.textSecondary
                                  }}>
                                    Recibido: {formatPrice(formData.paymentReceived)}
                                  </Typography>
                                  <Typography variant="body2" sx={{ 
                                    color: formData.paymentChange > 0 ? darkProTokens.primary : darkProTokens.textSecondary,
                                    fontWeight: formData.paymentChange > 0 ? 600 : 400
                                  }}>
                                    Cambio: {formatPrice(formData.paymentChange)}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          )}
                        </Box>
                      )}
                    </Stack>
                  </Box>
                </motion.div>
              </AnimatePresence>
            )}

            {(!selectedUser || !selectedPlan) && (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <SkeletonLoader />
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

  // ... continuación del código anterior

      {/* Dialog de Confirmación */}
      <Dialog 
        open={confirmDialogOpen} 
        onClose={() => !loading && setConfirmDialogOpen(false)}
        maxWidth="lg"
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
          fontSize: '1.8rem',
          textAlign: 'center',
          pb: 3
        }}>
          🏆 Confirmar Venta de Membresía
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="h6" sx={{ 
            mb: 4,
            textAlign: 'center',
            color: darkProTokens.textSecondary
          }}>
            Revise los datos antes de procesar la venta
          </Typography>

          <Grid container spacing={4}>
            <Grid size={6}>
              <Card sx={{ 
                background: `${darkProTokens.primary}10`, 
                border: `1px solid ${darkProTokens.primary}30`,
                borderRadius: 3
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ 
                    color: darkProTokens.primary, 
                    mb: 3,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    👤 Cliente
                  </Typography>
                  
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        Nombre:
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {selectedUser?.firstName} {selectedUser?.lastName}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        Email:
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedUser?.email}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        Tipo de Venta:
                      </Typography>
                      <Chip 
                        label={formData.isRenewal ? '🔄 RENOVACIÓN' : '🆕 PRIMERA VEZ'}
                        sx={{
                          backgroundColor: formData.isRenewal ? darkProTokens.warning : darkProTokens.success,
                          color: darkProTokens.background,
                          fontWeight: 700,
                          mt: 1
                        }}
                      />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={6}>
              <Card sx={{ 
                background: `${darkProTokens.primary}10`, 
                border: `1px solid ${darkProTokens.primary}30`,
                borderRadius: 3
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ 
                    color: darkProTokens.primary, 
                    mb: 3,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <FitnessCenterIcon />
                    Membresía
                  </Typography>
                  
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        Plan:
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {selectedPlan?.name}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        Duración:
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {paymentTypes.find(pt => pt.value === formData.paymentType)?.label}
                      </Typography>
                    </Box>

                    {calculateEndDate() && (
                      <Box>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          Vigencia hasta:
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500, color: darkProTokens.primary }}>
                          {calculateEndDate()?.toLocaleDateString('es-MX', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </Typography>
                      </Box>
                    )}

                    <Box>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        Inscripción:
                      </Typography>
                      <Chip 
                        label={formData.skipInscription ? '🚫 EXENTA' : `💰 ${formatPrice(inscriptionAmount)}`}
                        size="small"
                        sx={{
                          backgroundColor: formData.skipInscription ? darkProTokens.success : darkProTokens.warning,
                          color: darkProTokens.background,
                          fontWeight: 600,
                          mt: 1
                        }}
                      />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={12}>
              <Card sx={{ 
                background: `${darkProTokens.surfaceLevel3}05`, 
                border: `1px solid ${darkProTokens.grayDark}`,
                borderRadius: 3
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" sx={{ 
                    color: darkProTokens.primary, 
                    mb: 3,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    💰 Resumen Financiero
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid size={2}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          Subtotal
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {formatPrice(totalAmount)}
                        </Typography>
                      </Box>
                    </Grid>

                    {commissionAmount > 0 && (
                      <Grid size={2}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" sx={{ color: `${darkProTokens.warning}80` }}>
                            Comisión{formData.customCommissionRate !== null ? '*' : ''}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: darkProTokens.warning }}>
                            +{formatPrice(commissionAmount)}
                          </Typography>
                          {formData.customCommissionRate !== null && (
                            <Typography variant="caption" sx={{ color: darkProTokens.warning }}>
                              {formData.customCommissionRate}%
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    )}

                    <Grid size={commissionAmount > 0 ? 3 : 4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          Método de Pago
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {formData.isMixedPayment ? '🔄 Mixto' : paymentMethods.find(pm => pm.value === formData.paymentMethod)?.label}
                        </Typography>
                        {!formData.isMixedPayment && (
                          <Typography variant="caption" sx={{ 
                            color: (formData.paymentMethod === 'debito' || formData.paymentMethod === 'credito') ? 
                              darkProTokens.warning : darkProTokens.success,
                            fontWeight: 600,
                            display: 'block'
                          }}>
                            {(formData.paymentMethod === 'debito' || formData.paymentMethod === 'credito') ? 
                              '💰 Con comisión' : '🚫 Sin comisión'}
                          </Typography>
                        )}
                      </Box>
                    </Grid>

                    <Grid size={commissionAmount > 0 ? 2 : 3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          Inscripción
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 600,
                          color: formData.skipInscription ? darkProTokens.success : darkProTokens.textPrimary
                        }}>
                          {formData.skipInscription ? 'EXENTA' : formatPrice(inscriptionAmount)}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid size={commissionAmount > 0 ? 3 : 3}>
                      <Box sx={{ 
                        textAlign: 'center',
                        background: `${darkProTokens.primary}10`,
                        borderRadius: 2,
                        p: 2,
                        border: `1px solid ${darkProTokens.primary}30`
                      }}>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          TOTAL FINAL
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: darkProTokens.primary }}>
                          {formatPrice(finalAmount)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {appliedCoupon && (
                    <Box sx={{ mt: 3 }}>
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
                          <strong>🎟️ Cupón Aplicado:</strong> {appliedCoupon.code} - 
                          {appliedCoupon.discount_type === 'percentage' 
                            ? ` ${appliedCoupon.discount_value}% de descuento`
                            : ` ${formatPrice(appliedCoupon.discount_value)} de descuento`
                          }
                        </Typography>
                      </Alert>
                    </Box>
                  )}

                  {formData.skipInscription && (
                    <Box sx={{ mt: 2 }}>
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
                          <strong>Inscripción Exenta:</strong> Se omite el cobro de inscripción 
                          ({formatPrice(selectedPlan?.inscription_price || 0)})
                        </Typography>
                      </Alert>
                    </Box>
                  )}

                  <Box sx={{ mt: 2 }}>
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
                        <strong>💡 Política de Comisiones:</strong> Solo tarjetas de débito y crédito tienen comisión. 
                        Efectivo y transferencias están exentas.
                      </Typography>
                    </Alert>
                  </Box>

                  {formData.notes && (
                    <Box sx={{ mt: 3, p: 2, bgcolor: `${darkProTokens.grayDark}20`, borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        <strong>📝 Notas:</strong> {formData.notes}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Detalles de pago mixto si aplica */}
            {formData.isMixedPayment && formData.paymentDetails.length > 0 && (
              <Grid size={12}>
                <Card sx={{ 
                  background: `${darkProTokens.warning}10`, 
                  border: `1px solid ${darkProTokens.warning}30`,
                  borderRadius: 3
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ 
                      color: darkProTokens.warning, 
                      mb: 2,
                      fontWeight: 700
                    }}>
                      🔄 Detalle de Pago Mixto
                    </Typography>
                    
                    <Grid container spacing={2}>
                      {formData.paymentDetails.map((detail, index) => (
                        <Grid key={detail.id} size={12}>
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            p: 2,
                            bgcolor: `${darkProTokens.surfaceLevel2}50`,
                            borderRadius: 2,
                            mb: 1
                          }}>
                            <Typography variant="body1">
                              #{index + 1} - {paymentMethods.find(m => m.value === detail.method)?.label}
                            </Typography>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {formatPrice(detail.amount)}
                              </Typography>
                              {detail.commission_amount > 0 && (
                                <Typography variant="caption" sx={{ color: darkProTokens.warning }}>
                                  +{formatPrice(detail.commission_amount)} comisión
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 4, justifyContent: 'center', gap: 3 }}>
          <Button 
            onClick={() => setConfirmDialogOpen(false)}
            disabled={loading}
            size="large"
            sx={{ 
              color: darkProTokens.textSecondary,
              borderColor: darkProTokens.grayDark,
              px: 4,
              py: 1.5,
              borderRadius: 3,
              '&:hover': {
                borderColor: darkProTokens.textSecondary,
                backgroundColor: darkProTokens.hoverOverlay
              }
            }}
            variant="outlined"
          >
            ❌ Cancelar
          </Button>
          
          <Button 
            onClick={handleSubmit}
            disabled={loading}
            variant="contained"
            size="large"
            startIcon={loading ? <CircularProgress size={24} sx={{ color: darkProTokens.background }} /> : <SaveIcon />}
            sx={{
              background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
              color: darkProTokens.background,
              fontWeight: 800,
              px: 6,
              py: 1.5,
              borderRadius: 3,
              fontSize: '1.1rem',
              '&:hover': {
                background: `linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive})`,
                transform: 'translateY(-2px)',
                boxShadow: `0 8px 30px ${darkProTokens.primary}40`
              },
              '&:disabled': {
                background: darkProTokens.grayMedium,
                color: darkProTokens.textDisabled
              }
            }}
          >
            {loading ? 'Procesando...' : '✅ Confirmar Venta'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 🎨 ESTILOS CSS DARK PRO PERSONALIZADOS */}
      <style jsx>{`
        /* Scrollbar personalizado para Dark Pro System */
        ::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${darkProTokens.surfaceLevel1};
          border-radius: 6px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover});
          border-radius: 6px;
          border: 2px solid ${darkProTokens.surfaceLevel1};
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive});
        }

        /* Animaciones suaves */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Efecto glow para elementos importantes */
        .primary-glow {
          box-shadow: 0 0 20px ${darkProTokens.primary}40;
        }
      `}</style>
    </Box>
  );
}                        
