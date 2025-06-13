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
  Badge
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { motion } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

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
  // POS Fields
  paymentReceived: number;
  paymentChange: number;
  isMixedPayment: boolean;
  paymentDetails: PaymentDetail[];
  // Renovación y comisiones
  isRenewal: boolean;
  skipInscription: boolean;
  customCommissionRate: number | null;
  editingCommission: boolean;
  // Campo para fecha de vencimiento
  latestEndDate: string | null;
}

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

// 🔥 MÉTODOS DE PAGO CORREGIDOS CON COMISIONES
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

export default function RegistrarMembresiaPage() {
  const router = useRouter();
  
  // Estados principales
  const [activeStep, setActiveStep] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [paymentCommissions, setPaymentCommissions] = useState<PaymentCommission[]>([]);
  const [userHistory, setUserHistory] = useState<UserMembershipHistory[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<FormData>({
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
  });
  
  // Estados de UI - CON DARK PRO
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  // Estados de cálculo
  const [subtotal, setSubtotal] = useState(0);
  const [inscriptionAmount, setInscriptionAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [commissionAmount, setCommissionAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);

  const supabase = createBrowserSupabaseClient();

  // ✅ FUNCIONES UTILITARIAS CON ZONA HORARIA MÉXICO
  const getMexicoDate = useCallback(() => {
    const now = new Date();
    // ✅ OBTENER FECHA MÉXICO CORRECTAMENTE
    return new Date(now.toLocaleString("en-US", {timeZone: "America/Monterrey"}));
  }, []);

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  }, []);

  // ✅ FORMATEAR FECHA PARA BD (YYYY-MM-DD)
  const formatDateForDB = useCallback((date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // ✅ OBTENER HOY EN MÉXICO COMO STRING
  const getMexicoToday = useCallback((): string => {
    const mexicoDate = getMexicoDate();
    return formatDateForDB(mexicoDate);
  }, [getMexicoDate, formatDateForDB]);

// ✅ GUARDAR FECHA/HORA MÉXICO EN BD:
const createTimestampForDB = useCallback((): string => {
  const now = new Date();
  // ✅ CONVERTIR A MÉXICO ANTES DE GUARDAR
  const mexicoTime = new Date(now.getTime() - (6 * 60 * 60 * 1000));
  return mexicoTime.toISOString();
}, []);

  // ✅ FUNCIÓN CRÍTICA: AGREGAR PERÍODOS REALES
  const addPeriodToMexicoDate = useCallback((dateString: string, periodType: string, fallbackDays: number): string => {
    console.log(`📅 addPeriodToMexicoDate: ${dateString} + ${periodType} (fallback: ${fallbackDays} días)`);
    
    // Parsear fecha base
    const [year, month, day] = dateString.split('-').map(Number);
    const baseDate = new Date(year, month - 1, day); // month - 1 porque Date usa 0-indexado
    
    console.log(`📅 Fecha base parseada: ${baseDate.toISOString()} (${dateString})`);
    
    let endDate: Date;
    
    // ✅ PERÍODOS REALES CORREGIDOS
    switch (periodType) {
      case 'weekly':
        endDate = new Date(baseDate);
        endDate.setDate(baseDate.getDate() + 7); // +7 días exactos
        console.log(`📅 Semanal: +7 días`);
        break;
        
      case 'biweekly':
        endDate = new Date(baseDate);
        endDate.setDate(baseDate.getDate() + 14); // +14 días exactos
        console.log(`📅 Quincenal: +14 días`);
        break;
        
      case 'monthly':
        endDate = new Date(baseDate);
        endDate.setMonth(baseDate.getMonth() + 1); // +1 mes real
        console.log(`📅 Mensual: +1 mes (${baseDate.getMonth()} → ${endDate.getMonth()})`);
        break;
        
      case 'bimonthly':
        endDate = new Date(baseDate);
        endDate.setMonth(baseDate.getMonth() + 2); // +2 meses reales
        console.log(`📅 Bimestral: +2 meses`);
        break;
        
      case 'quarterly':
        endDate = new Date(baseDate);
        endDate.setMonth(baseDate.getMonth() + 3); // +3 meses reales
        console.log(`📅 Trimestral: +3 meses`);
        break;
        
      case 'semester':
        endDate = new Date(baseDate);
        endDate.setMonth(baseDate.getMonth() + 6); // +6 meses reales
        console.log(`📅 Semestral: +6 meses`);
        break;
        
      case 'annual':
        endDate = new Date(baseDate);
        endDate.setFullYear(baseDate.getFullYear() + 1); // +1 año real
        console.log(`📅 Anual: +1 año (${baseDate.getFullYear()} → ${endDate.getFullYear()})`);
        break;
        
      default:
        // Fallback a días
        endDate = new Date(baseDate);
        endDate.setDate(baseDate.getDate() + fallbackDays);
        console.log(`📅 Fallback: +${fallbackDays} días`);
        break;
    }
    
    // Formatear resultado
    const result = formatDateForDB(endDate);
    console.log(`📅 Resultado final: ${result}`);
    console.log(`📅 Verificación: ${baseDate.toDateString()} → ${endDate.toDateString()}`);
    
    return result;
  }, [formatDateForDB]);

  // ✅ DEBUG FUNCIÓN
  const debugDateInfo = useCallback((label: string, dateString: string | null) => {
    if (!dateString) {
      console.log(`🔍 ${label}: null`);
      return;
    }
    
    const date = new Date(dateString + 'T00:00:00');
    const mexicoDate = new Date(date.toLocaleString("en-US", {timeZone: "America/Monterrey"}));
    
    console.log(`🔍 ${label}:`);
    console.log(`   📅 String: ${dateString}`);
    console.log(`   📅 Date objeto: ${date.toDateString()}`);
    console.log(`   📅 México: ${mexicoDate.toDateString()}`);
    console.log(`   📅 Formatted: ${date.toLocaleDateString('es-MX')}`);
  }, []);

  // 🔧 BÚSQUEDA DE USUARIOS
  const loadUsers = useCallback(async (searchTerm: string = '') => {
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
  }, [supabase]);

  // ✅ CARGAR HISTORIAL DE USUARIO CORREGIDO CON FECHAS MÉXICO
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

      // ✅ AUTO-DETECCIÓN INTELIGENTE CON FECHAS MÉXICO
      const mexicoToday = getMexicoToday();
      console.log(`📅 Hoy en México: ${mexicoToday}`);
      
      // Filtrar membresías activas con fecha México
      const activeMemberships = formattedHistory.filter(h => {
        if (h.status !== 'active' || !h.end_date) return false;
        
        // Comparar con fecha México
        const isActive = h.end_date >= mexicoToday;
        console.log(`📅 Membresía ${h.id}: ${h.end_date} >= ${mexicoToday} = ${isActive}`);
        return isActive;
      });
      
      const hasActiveMemberships = activeMemberships.length > 0;
      const hasPreviousMemberships = formattedHistory.length > 0;
      
      console.log(`🔄 Auto-detección México: Activas=${hasActiveMemberships}, Previas=${hasPreviousMemberships}`);
      
      // ✅ DETECTAR FECHA DE VENCIMIENTO MÁS RECIENTE
      let latestEndDate = null;
      if (activeMemberships.length > 0) {
        const sortedActive = activeMemberships
          .filter(m => m.end_date)
          .sort((a, b) => new Date(b.end_date!).getTime() - new Date(a.end_date!).getTime());
        
        if (sortedActive.length > 0) {
          latestEndDate = sortedActive[0].end_date;
          console.log(`📅 Fecha de vencimiento más reciente: ${latestEndDate}`);
          debugDateInfo('Vencimiento detectado', latestEndDate);
        }
      }
      
      setFormData(prev => ({
        ...prev,
        isRenewal: hasPreviousMemberships,
        skipInscription: hasActiveMemberships || hasPreviousMemberships,
        latestEndDate: latestEndDate
      }));

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
      
      setFormData(prev => ({
        ...prev,
        isRenewal: false,
        skipInscription: false,
        latestEndDate: null
      }));
      
      console.log('🛡️ Configuración segura aplicada: Cliente nuevo con inscripción');
    }
  }, [supabase, getMexicoToday, debugDateInfo]);

  // Cargar planes y comisiones
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

  // Validar cupón
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

      // ✅ VALIDAR FECHAS CON MÉXICO
      const mexicoToday = getMexicoToday();
      const startDate = data.start_date;
      const endDate = data.end_date;

      if (startDate && mexicoToday < startDate) {
        setError('El cupón no está vigente aún');
        setAppliedCoupon(null);
        return;
      }

      if (endDate && mexicoToday > endDate) {
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
  }, [supabase, subtotal, getMexicoToday, formatPrice]);

  // 🔥 CALCULAR COMISIÓN CORREGIDA - SOLO TARJETAS
  const calculateCommission = useCallback((method: string, amount: number): { rate: number; amount: number } => {
    // ✅ SOLO TARJETAS TIENEN COMISIÓN
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

  // Manejar pagos mixtos
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

    setFormData(prev => ({
      ...prev,
      paymentDetails: [...prev.paymentDetails, newDetail]
    }));
  }, [formData.paymentDetails.length]);

  const removeMixedPaymentDetail = useCallback((id: string) => {
    setFormData(prev => ({
      ...prev,
      paymentDetails: prev.paymentDetails.filter(detail => detail.id !== id)
    }));
  }, []);

  const updateMixedPaymentDetail = useCallback((id: string, field: keyof PaymentDetail, value: any) => {
    setFormData(prev => ({
      ...prev,
      paymentDetails: prev.paymentDetails.map(detail => {
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
      })
    }));
  }, [calculateCommission]);

  // ✅ CALCULAR PRECIOS CON INSCRIPCIÓN CONDICIONAL
  useEffect(() => {
    if (!selectedPlan || !formData.paymentType) {
      setSubtotal(0);
      setInscriptionAmount(0);
      setDiscountAmount(0);
      setCommissionAmount(0);
      setTotalAmount(0);
      setFinalAmount(0);
      return;
    }

    const paymentTypeData = paymentTypes.find(pt => pt.value === formData.paymentType);
    if (!paymentTypeData) return;

    const planPrice = selectedPlan[paymentTypeData.key as keyof Plan] as number;
    
    // NUEVA LÓGICA: Inscripción condicional
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

    // 🔥 CALCULAR COMISIÓN CORREGIDA - SOLO TARJETAS
    let newCommission = 0;
    if (formData.isMixedPayment) {
      newCommission = formData.paymentDetails.reduce((sum, detail) => sum + detail.commission_amount, 0);
      console.log(`💳 Comisión mixta total: $${newCommission.toFixed(2)}`);
    } else if (formData.paymentMethod) {
      const commission = calculateCommission(formData.paymentMethod, newTotal);
      newCommission = commission.amount;
    }

    const newFinalAmount = newTotal + newCommission;

    setSubtotal(newSubtotal);
    setInscriptionAmount(newInscription);
    setDiscountAmount(newDiscount);
    setTotalAmount(newTotal);
    setCommissionAmount(newCommission);
    setFinalAmount(newFinalAmount);

    // Calcular cambio para efectivo
    if (formData.paymentMethod === 'efectivo' && formData.paymentReceived > 0) {
      const change = formData.paymentReceived - newFinalAmount;
      setFormData(prev => ({ ...prev, paymentChange: Math.max(0, change) }));
    }

  }, [selectedPlan, formData.paymentType, appliedCoupon, formData.paymentMethod, formData.paymentReceived, formData.isMixedPayment, formData.paymentDetails, formData.skipInscription, formData.isRenewal, calculateCommission]);

  // ✅ CALCULAR FECHA DE VENCIMIENTO CRÍTICA CORREGIDA
  const calculateEndDate = useCallback((): Date | null => {
    if (!selectedPlan || !formData.paymentType) return null;

    const paymentTypeData = paymentTypes.find(pt => pt.value === formData.paymentType);
    if (!paymentTypeData || paymentTypeData.value === 'visit') return null;

    const duration = selectedPlan[paymentTypeData.duration as keyof Plan] as number;
    
    // ✅ LÓGICA CORREGIDA CON ZONA HORARIA MEXICANA Y PERÍODOS REALES
    let startDateString: string;
    
    if (formData.isRenewal && formData.latestEndDate) {
      // 🔄 RENOVACIÓN: Desde fecha de vencimiento actual
      startDateString = formData.latestEndDate;
      console.log(`🔄 Renovación: Extendiendo desde ${startDateString}`);
    } else {
      // 🆕 PRIMERA VEZ: Desde hoy (México)
      startDateString = getMexicoToday();
      console.log(`🆕 Primera venta: Iniciando desde ${startDateString}`);
    }
    
    // ✅ USAR PERÍODOS REALES CORREGIDOS
    const paymentTypeKey = formData.paymentType; // "monthly", "weekly", etc.
    const endDateString = addPeriodToMexicoDate(startDateString, paymentTypeKey, duration);
    
    console.log(`📅 Cálculo con períodos reales CORREGIDOS:`);
    console.log(`   📅 Inicio: ${startDateString}`);
    console.log(`   🔄 Tipo: ${paymentTypeKey}`);
    console.log(`   ➕ Duración fallback: ${duration} días`);
    console.log(`   📅 Fin: ${endDateString}`);
    
    // Convertir a objeto Date para compatibilidad con UI
    const [year, month, day] = endDateString.split('-').map(Number);
    const endDate = new Date(year, month - 1, day, 23, 59, 59);
    
    // ✅ DEBUG ADICIONAL
    debugDateInfo('Fecha final calculada CORREGIDA', endDateString);
    
    return endDate;
  }, [selectedPlan, formData.paymentType, formData.isRenewal, formData.latestEndDate, getMexicoToday, addPeriodToMexicoDate, debugDateInfo]);

  // Validar pago
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

  // ✅ SUBMIT PRINCIPAL CORREGIDO CON FECHAS MÉXICO
  const handleSubmit = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ OBTENER SESIÓN DEL USUARIO AUTENTICADO
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('No hay sesión activa');
        return;
      }

      console.log('👤 Usuario autenticado:', session.user.id, session.user.email);

      if (!selectedUser || !selectedPlan || !formData.paymentType) {
        setError('Por favor complete todos los campos requeridos');
        return;
      }

      if (!formData.isMixedPayment && !formData.paymentMethod) {
        setError('Seleccione un método de pago');
        return;
      }

      if (!validatePayment()) {
        return;
      }

      // ✅ FECHAS CORREGIDAS PARA RENOVACIÓN - CON PERÍODOS REALES
      let startDate: string;
      let endDate: string | null = null;

      if (formData.isRenewal && formData.latestEndDate) {
        // ✅ RENOVACIÓN: Desde fecha de vencimiento actual
        startDate = formData.latestEndDate;
        console.log(`🔄 Renovación: Iniciando desde ${startDate}`);
        
        // ✅ CALCULAR FECHA DE FIN CON PERÍODOS REALES
        const paymentTypeData = paymentTypes.find(pt => pt.value === formData.paymentType);
        if (paymentTypeData && paymentTypeData.value !== 'visit') {
          const duration = selectedPlan[paymentTypeData.duration as keyof Plan] as number;
          const paymentTypeKey = formData.paymentType; // "monthly", "weekly", etc.
          
          // ✅ USAR addPeriodToMexicoDate EN LUGAR DE addDaysToMexicoDate
          endDate = addPeriodToMexicoDate(startDate, paymentTypeKey, duration);
          
          console.log(`📅 Fechas de renovación con períodos reales (México):`);
          console.log(`   📅 Desde: ${startDate}`);
          console.log(`   🔄 Tipo: ${paymentTypeKey}`);
          console.log(`   ➕ Duración fallback: ${duration} días`);
          console.log(`   📅 Hasta: ${endDate}`);
          
          // ✅ DEBUG ADICIONAL
          debugDateInfo('Renovación calculada', endDate);
        }
      } else {
        // ✅ PRIMERA VEZ: Desde hoy (México)
        startDate = getMexicoToday();
        console.log(`🆕 Primera venta: Iniciando desde ${startDate} (México)`);
        
        // Calcular fecha de fin usando la función corregida
        const calculatedEndDate = calculateEndDate();
        if (calculatedEndDate) {
          endDate = formatDateForDB(calculatedEndDate);
        }
        
        console.log(`📅 Fechas de primera venta con períodos reales (México):`);
        console.log(`   📅 Desde: ${startDate}`);
        console.log(`   📅 Hasta: ${endDate}`);
        
        // ✅ DEBUG ADICIONAL
        debugDateInfo('Primera venta calculada', endDate);
      }

      const totalVisits = formData.paymentType === 'visit' ? 1 : null;
      const remainingVisits = totalVisits;

      console.log(`📅 Fechas finales calculadas: ${startDate} → ${endDate}`);

      // ✅ PASO ADICIONAL: SI ES RENOVACIÓN, DESACTIVAR MEMBRESÍAS ACTIVAS
      if (formData.isRenewal) {
        console.log('🔄 Procesando renovación: Desactivando membresías activas...');
        
        const { error: updateError } = await supabase
          .from('user_memberships')
          .update({ 
            status: 'expired',
            updated_at: createTimestampForDB() // ✅ UTC timestamp correcto
          })
          .eq('userid', selectedUser.id)
          .eq('status', 'active');

        if (updateError) {
          console.warn('⚠️ Error al desactivar membresías activas:', updateError);
        } else {
          console.log('✅ Membresías activas desactivadas correctamente');
        }
      }

      // ✅ DATOS DE LA MEMBRESÍA CON UUID CORRECTO
      const membershipData = {
        userid: selectedUser.id,
        planid: selectedPlan.id,
        payment_type: formData.paymentType,
        amount_paid: finalAmount,
        inscription_amount: inscriptionAmount,
        start_date: startDate,
        end_date: endDate,
        status: 'active',
        total_visits: totalVisits,
        remaining_visits: remainingVisits,
        payment_method: formData.isMixedPayment ? 'mixto' : formData.paymentMethod,
        payment_reference: formData.paymentReference || null,
        discount_amount: discountAmount,
        coupon_code: appliedCoupon?.code || null,
        subtotal: subtotal,
        commission_rate: formData.isMixedPayment ? 0 : calculateCommission(formData.paymentMethod, totalAmount).rate,
        commission_amount: commissionAmount,
        payment_received: formData.paymentMethod === 'efectivo' ? formData.paymentReceived : finalAmount,
        payment_change: formData.paymentMethod === 'efectivo' ? formData.paymentChange : 0,
        is_mixed_payment: formData.isMixedPayment,
        payment_details: formData.isMixedPayment ? formData.paymentDetails : null,
        is_renewal: formData.isRenewal,
        skip_inscription: formData.skipInscription,
        custom_commission_rate: formData.customCommissionRate,
        notes: formData.notes || null,
        created_at: createTimestampForDB(),
        updated_at: createTimestampForDB(),
        created_by: session.user.id // ✅ UUID correcto del usuario autenticado
      };

      console.log('💾 Guardando nueva membresía:', membershipData);

      const { data: membership, error: membershipError } = await supabase
        .from('user_memberships')
        .insert([membershipData])
        .select()
        .single();

      if (membershipError) throw membershipError;

      console.log('✅ Membresía creada exitosamente:', membership.id);

      // Si es pago mixto, guardar detalles
      if (formData.isMixedPayment) {
        const paymentDetailsData = formData.paymentDetails.map(detail => ({
          membership_id: membership.id,
          payment_method: detail.method,
          amount: detail.amount,
          commission_rate: detail.commission_rate,
          commission_amount: detail.commission_amount,
          payment_reference: detail.reference,
          sequence_order: detail.sequence
        }));

        const { error: detailsError } = await supabase
          .from('membership_payment_details')
          .insert(paymentDetailsData);

        if (detailsError) {
          console.warn('Error al guardar detalles de pago:', detailsError);
        }
      }

      // Actualizar uso del cupón
      if (appliedCoupon) {
        await supabase
          .from('coupons')
          .update({ current_uses: appliedCoupon.current_uses + 1 })
          .eq('id', appliedCoupon.id);
      }

      const successMsg = formData.isRenewal 
        ? `¡Renovación exitosa! Membresía extendida hasta ${endDate}`
        : '¡Membresía registrada exitosamente!';
      
      setSuccessMessage(successMsg);
      
      setTimeout(() => {
        router.push('/dashboard/admin/membresias');
      }, 3000);

    } catch (err: any) {
      setError(`Error procesando venta: ${err.message}`);
    } finally {
      setLoading(false);
      setConfirmDialogOpen(false);
    }
  }, [
    supabase, selectedUser, selectedPlan, formData, validatePayment, 
    getMexicoToday, addPeriodToMexicoDate, calculateEndDate, formatDateForDB, 
    createTimestampForDB, debugDateInfo, finalAmount, inscriptionAmount, 
    discountAmount, subtotal, commissionAmount, calculateCommission, 
    totalAmount, appliedCoupon, router
  ]);

  const steps = [
    { label: 'Cliente', description: 'Seleccionar cliente' },
    { label: 'Plan', description: 'Elegir membresía' },
    { label: 'Descuentos', description: 'Aplicar cupones' },
    { label: 'Pago', description: 'Método de pago' }
  ];

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

  // ✅ FUNCIONES PARA CERRAR NOTIFICACIONES
  const handleCloseError = useCallback(() => setError(null), []);
  const handleCloseSuccess = useCallback(() => setSuccessMessage(null), []);
  const handleCloseWarning = useCallback(() => setWarningMessage(null), []);
  const handleCloseInfo = useCallback(() => setInfoMessage(null), []);

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
              <PersonAddAltIcon sx={{ fontSize: 40, color: darkProTokens.primary }} />
              Nueva Venta de Membresía
            </Typography>
            <Typography variant="body1" sx={{ color: darkProTokens.textSecondary, mt: 1 }}>
              Sistema de punto de venta para membresías del gimnasio
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
          </Box>
        </Box>

        {/* 📊 PROGRESO MINIMALISTA */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 2,
          p: 2,
          bgcolor: `${darkProTokens.primary}10`,
          borderRadius: 2,
          border: `1px solid ${darkProTokens.primary}30`
        }}>
          <ReceiptIcon sx={{ color: darkProTokens.primary }} />
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
            <Stepper activeStep={activeStep} orientation="vertical">
              {steps.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel
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
                                loadUsers(newInputValue);
                              }}
                              onChange={(event, newValue) => {
                                setSelectedUser(newValue);
                                setFormData(prev => ({ ...prev, userId: newValue?.id || '' }));
                                if (newValue) {
                                  console.log('👤 Usuario seleccionado:', newValue.firstName, newValue.lastName);
                                  loadUserHistory(newValue.id);
                                } else {
                                  // ✅ LIMPIAR HISTORIAL CUANDO NO HAY USUARIO
                                  setUserHistory([]);
                                  setFormData(prev => ({
                                    ...prev,
                                    isRenewal: false,
                                    skipInscription: false,
                                    userId: ''
                                  }));
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
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
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
                                                    📅 {new Date(membership.start_date).toLocaleDateString('es-MX')} → {' '}
                                                    {membership.end_date ? new Date(membership.end_date).toLocaleDateString('es-MX') : 'Sin fecha'}
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
                                                setFormData(prev => ({
                                                  ...prev,
                                                  isRenewal,
                                                  skipInscription: isRenewal
                                                }));
                                                
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
                        ) : (
                          <Grid container spacing={3} sx={{ mb: 4 }}>
                            {plans.map((plan) => (
                              <Grid key={plan.id} size={{ xs: 12, md: 6 }}>
                                <motion.div
                                  whileHover={{ scale: 1.02, y: -5 }}
                                  whileTap={{ scale: 0.98 }}
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
                                        borderColor: darkProTokens.primary
                                      }
                                    }}
                                    onClick={() => {
                                      setSelectedPlan(plan);
                                      setFormData(prev => ({ ...prev, planId: plan.id }));
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
                                        lineHeight: 1.6
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
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
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
                                              setFormData(prev => ({
                                                ...prev,
                                                skipInscription: e.target.checked
                                              }));
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
                                    onChange={(e) => setFormData(prev => ({ ...prev, paymentType: e.target.value }))}
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
                                            }
                                          }}
                                        >
                                          <Box sx={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between',
                                            width: '100%',
                                            alignItems: 'center'
                                          }}>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                              {type.label}
                                            </Typography>
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
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                couponCode: e.target.value.toUpperCase() 
                              }))}
                              onBlur={(e) => validateCoupon(e.target.value)}
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

                            {appliedCoupon && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
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
                                    </CardContent>
                                  </Card>
                                </Box>
                              </motion.div>
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
                                  onChange={(e) => {
                                    setFormData(prev => ({
                                      ...prev,
                                      isMixedPayment: e.target.checked,
                                      paymentMethod: e.target.checked ? '' : prev.paymentMethod,
                                      paymentDetails: e.target.checked ? [] : prev.paymentDetails
                                    }));
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
                                <Typography variant="h6" sx={{ 
                                  color: darkProTokens.textPrimary, 
                                  fontWeight: 600 
                                }}>
                                  🔄 Pago Mixto
                                </Typography>
                              }
                            />
                            <Typography variant="body2" sx={{ 
                              color: darkProTokens.textSecondary,
                              mt: 1
                            }}>
                              Combinar múltiples métodos de pago
                            </Typography>
                          </CardContent>
                        </Card>

                        {/* Pago Simple */}
                        {!formData.isMixedPayment && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
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
                                      <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                      >
                                        <Card
                                          sx={{
                                            cursor: 'pointer',
                                            background: formData.paymentMethod === method.value 
                                              ? `linear-gradient(135deg, ${method.color}20, ${method.color}10)`
                                              : `${darkProTokens.surfaceLevel3}05`,
                                            border: formData.paymentMethod === method.value 
                                              ? `3px solid ${method.color}` 
                                              : `1px solid ${darkProTokens.grayDark}`,
                                            borderRadius: 3,
                                            transition: 'all 0.3s ease',
                                            minHeight: '140px',
                                            '&:hover': {
                                              borderColor: method.color,
                                              transform: 'translateY(-2px)'
                                            }
                                          }}
                                          onClick={() => setFormData(prev => ({ 
                                            ...prev, 
                                            paymentMethod: method.value 
                                          }))}
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
                                              color: darkProTokens.textPrimary,
                                              fontWeight: 600,
                                              fontSize: '0.9rem',
                                              mb: 1
                                            }}>
                                              {method.label}
                                            </Typography>
                                            <Typography variant="caption" sx={{ 
                                              color: darkProTokens.textSecondary,
                                              fontSize: '0.75rem',
                                              lineHeight: 1.3
                                            }}>
                                              {method.description}
                                            </Typography>
                                            {formData.paymentMethod === method.value && (
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
                                    </Grid>
                                  ))}
                                </Grid>

                                {/* 🔥 CONFIGURADOR DE COMISIÓN PERSONALIZADA - SOLO TARJETAS */}
                                {(formData.paymentMethod === 'debito' || formData.paymentMethod === 'credito') && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    <Card sx={{
                                      background: `${darkProTokens.warning}10`,
                                      border: `1px solid ${darkProTokens.warning}30`,
                                      borderRadius: 3,
                                      mt: 3
                                    }}>
                                      <CardContent sx={{ p: 3 }}>
                                        <Typography variant="h6" sx={{ 
                                          color: darkProTokens.warning, 
                                          mb: 3,
                                          fontWeight: 700,
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 2
                                        }}>
                                          <PercentIcon />
                                          ⚙️ Configuración de Comisión
                                        </Typography>

                                        <Grid container spacing={3}>
                                          <Grid size={{ xs: 12, md: 6 }}>
                                            <Box sx={{
                                              background: `${darkProTokens.grayDark}10`,
                                              border: `1px solid ${darkProTokens.grayDark}30`,
                                              borderRadius: 2,
                                              p: 2,
                                              textAlign: 'center'
                                            }}>
                                              <Typography variant="body2" sx={{ 
                                                color: darkProTokens.textSecondary,
                                                mb: 1
                                              }}>
                                                Comisión Predeterminada
                                              </Typography>
                                              <Typography variant="h6" sx={{ 
                                                color: darkProTokens.textPrimary,
                                                fontWeight: 700
                                              }}>
                                                {paymentCommissions.find(c => c.payment_method === formData.paymentMethod)?.commission_value || 0}%
                                              </Typography>
                                            </Box>
                                          </Grid>

                                          <Grid size={{ xs: 12, md: 6 }}>
                                            <FormControlLabel
                                              control={
                                                <Switch
                                                  checked={formData.editingCommission}
                                                  onChange={(e) => {
                                                    setFormData(prev => ({
                                                      ...prev,
                                                      editingCommission: e.target.checked,
                                                      customCommissionRate: e.target.checked ? 
                                                        (paymentCommissions.find(c => c.payment_method === formData.paymentMethod)?.commission_value || 0) : 
                                                        null
                                                    }));
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
                                                    ⚙️ Comisión Personalizada
                                                  </Typography>
                                                  <Typography variant="caption" sx={{ 
                                                    color: darkProTokens.textSecondary
                                                  }}>
                                                    {formData.editingCommission ? 'Editar porcentaje' : 'Usar predeterminada'}
                                                  </Typography>
                                                </Box>
                                              }
                                            />
                                          </Grid>

                                          {formData.editingCommission && (
                                            <Grid size={12}>
                                              <TextField
                                                fullWidth
                                                label="Porcentaje de Comisión"
                                                type="number"
                                                value={formData.customCommissionRate || ''}
                                                onChange={(e) => {
                                                  const rate = parseFloat(e.target.value) || 0;
                                                  setFormData(prev => ({
                                                    ...prev,
                                                    customCommissionRate: Math.max(0, Math.min(100, rate)) // Entre 0% y 100%
                                                  }));
                                                }}
                                                inputProps={{ 
                                                  min: 0, 
                                                  max: 100, 
                                                  step: 0.1 
                                                }}
                                                placeholder="Ej: 3.5"
                                                helperText="Porcentaje entre 0% y 100%"
                                                InputProps={{
                                                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
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
                                                FormHelperTextProps={{
                                                  sx: { color: darkProTokens.textSecondary }
                                                }}
                                              />
                                            </Grid>
                                          )}

                                          {formData.customCommissionRate !== null && (
                                            <Grid size={12}>
                                              <Box sx={{
                                                background: `${darkProTokens.primary}10`,
                                                border: `1px solid ${darkProTokens.primary}30`,
                                                borderRadius: 2,
                                                p: 2,
                                                textAlign: 'center'
                                              }}>
                                                <Typography variant="body2" sx={{ 
                                                  color: darkProTokens.textSecondary,
                                                  mb: 1
                                                }}>
                                                  Comisión Calculada
                                                </Typography>
                                                <Typography variant="h6" sx={{ 
                                                  color: darkProTokens.primary,
                                                  fontWeight: 700
                                                }}>
                                                  {formatPrice((totalAmount * (formData.customCommissionRate || 0)) / 100)} 
                                                  <span style={{ fontSize: '0.8rem', color: darkProTokens.textSecondary }}>
                                                    {' '}({formData.customCommissionRate}%)
                                                  </span>
                                                </Typography>
                                              </Box>
                                            </Grid>
                                          )}
                                        </Grid>

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
                                            <strong>💡 Información:</strong> Solo las tarjetas de débito y crédito tienen comisión.
                                            Efectivo y transferencias están exentas.
                                          </Typography>
                                        </Alert>
                                      </CardContent>
                                    </Card>
                                  </motion.div>
                                )}

                                {/* Configuración específica por método */}
                                {formData.paymentMethod === 'efectivo' && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
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
                                                setFormData(prev => ({
                                                  ...prev,
                                                  paymentReceived: received,
                                                  paymentChange: Math.max(0, received - finalAmount)
                                                }));
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

                                        <Alert 
                                          severity="success"
                                          sx={{
                                            mt: 3,
                                            backgroundColor: `${darkProTokens.success}10`,
                                            color: darkProTokens.textPrimary,
                                            border: `1px solid ${darkProTokens.success}30`,
                                            '& .MuiAlert-icon': { color: darkProTokens.success }
                                          }}
                                        >
                                          <Typography variant="body2">
                                            <strong>💵 Efectivo:</strong> Sin comisión adicional • Cálculo automático de cambio
                                          </Typography>
                                        </Alert>
                                      </CardContent>
                                    </Card>
                                  </motion.div>
                                )}

                                {/* Referencias para otros métodos */}
                                {(formData.paymentMethod === 'debito' || formData.paymentMethod === 'credito' || formData.paymentMethod === 'transferencia') && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
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
                                          onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            paymentReference: e.target.value 
                                          }))}
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

                                        {formData.paymentMethod === 'transferencia' && (
                                          <Alert 
                                            severity="info"
                                            sx={{
                                              mt: 2,
                                              backgroundColor: `${darkProTokens.info}10`,
                                              color: darkProTokens.textPrimary,
                                              border: `1px solid ${darkProTokens.info}30`,
                                              '& .MuiAlert-icon': { color: darkProTokens.info }
                                            }}
                                          >
                                            <Typography variant="body2">
                                              <strong>🏦 Transferencia:</strong> Sin comisión adicional • Transferencia bancaria directa
                                            </Typography>
                                          </Alert>
                                        )}
                                      </CardContent>
                                    </Card>
                                  </motion.div>
                                )}
                              </CardContent>
                            </Card>
                          </motion.div>
                        )}

                        {/* Pago Mixto */}
                        {formData.isMixedPayment && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
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
                                  <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
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
                              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
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
                          disabled={!canProceedToNextStep()}
                          size="large"
                          startIcon={<SaveIcon />}
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
                          Procesar Venta
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
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
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
            )}

            {selectedPlan && formData.paymentType && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
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
                          📅 {calculateEndDate()?.toLocaleDateString('es-MX', {
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1" sx={{ 
                        color: darkProTokens.textSecondary,
                        fontWeight: 500
                      }}>
                        Subtotal Plan:
                      </Typography>
                      <Typography variant="h6" sx={{ 
                        color: darkProTokens.textPrimary,
                        fontWeight: 600
                      }}>
                        {formatPrice(subtotal)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1" sx={{ 
                        color: inscriptionAmount > 0 ? darkProTokens.textSecondary : darkProTokens.success,
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        {inscriptionAmount > 0 ? 'Inscripción:' : '🚫 Inscripción EXENTA:'}
                      </Typography>
                      <Typography variant="h6" sx={{ 
                        color: inscriptionAmount > 0 ? darkProTokens.textPrimary : darkProTokens.success,
                        fontWeight: inscriptionAmount > 0 ? 600 : 700
                      }}>
                        {inscriptionAmount > 0 ? formatPrice(inscriptionAmount) : 'GRATIS'}
                      </Typography>
                    </Box>

                    {discountAmount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body1" sx={{ 
                          color: darkProTokens.success,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          🎟️ Descuento:
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          color: darkProTokens.success,
                          fontWeight: 700
                        }}>
                          -{formatPrice(discountAmount)}
                        </Typography>
                      </Box>
                    )}

                    <Divider sx={{ borderColor: darkProTokens.grayDark }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" sx={{ 
                        color: darkProTokens.textPrimary,
                        fontWeight: 700
                      }}>
                        Subtotal:
                      </Typography>
                      <Typography variant="h6" sx={{ 
                        color: darkProTokens.primary,
                        fontWeight: 700
                      }}>
                        {formatPrice(totalAmount)}
                      </Typography>
                    </Box>

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

                            {/* 🔥 MOSTRAR SI TIENE COMISIÓN O NO */}
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

                            {formData.customCommissionRate !== null && commissionAmount > 0 && (
                              <Box sx={{ mt: 2 }}>
                                <Chip 
                                  label={`Comisión: ${formData.customCommissionRate}%`}
                                  size="small"
                                  sx={{
                                    backgroundColor: darkProTokens.warning,
                                    color: darkProTokens.background,
                                    fontWeight: 600
                                  }}
                                />
                              </Box>
                            )}
                          </Box>
                        )}
                      </Box>
                    )}
                  </Stack>
                </Box>
              </motion.div>
            )}

            {(!selectedUser || !selectedPlan) && (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" sx={{ 
                  color: `${darkProTokens.textSecondary}40`,
                  mb: 2
                }}>
                  🧾 Resumen de Venta
                </Typography>
                <Typography variant="body1" sx={{ 
                  color: `${darkProTokens.textSecondary}30`
                }}>
                  Complete los pasos para ver el resumen
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

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
                          {calculateEndDate()?.toLocaleDateString('es-MX')}
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
                          {formData.isMixedPayment ? 'Mixto' : paymentMethods.find(pm => pm.value === formData.paymentMethod)?.label}
                        </Typography>
                        {/* 🔥 INDICADOR DE COMISIÓN EN CONFIRMACIÓN */}
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

                  {formData.customCommissionRate !== null && (
                    <Box sx={{ mt: 3 }}>
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
                          <strong>Comisión Personalizada:</strong> {formData.customCommissionRate}% 
                          (Predeterminada: {paymentCommissions.find(c => c.payment_method === formData.paymentMethod)?.commission_value || 0}%)
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

                  {/* 🔥 ALERT INFORMATIVO SOBRE COMISIONES */}
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
                </CardContent>
              </Card>
            </Grid>
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
              borderRadius: 3
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
