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

// ✅ IMPORTS DE UTILIDADES DE FECHA CORREGIDAS
import {
  getMexicoToday,
  addPeriodToMexicoDate,
  formatDateForDB,
  createTimestampForDB,
  debugDateInfo
} from '@/lib/utils/dateUtils';

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

const paymentMethods = [
  { 
    value: 'efectivo', 
    label: 'Efectivo', 
    icon: '💵',
    color: '#CCAA00',
    description: 'Pago en efectivo con cálculo de cambio'
  },
  { 
    value: 'debito', 
    label: 'Tarjeta de Débito', 
    icon: '💳',
    color: '#4D4D4D',
    description: 'Pago con tarjeta de débito'
  },
  { 
    value: 'credito', 
    label: 'Tarjeta de Crédito', 
    icon: '💳',
    color: '#666666',
    description: 'Pago con tarjeta de crédito'
  },
  { 
    value: 'transferencia', 
    label: 'Transferencia', 
    icon: '🏦',
    color: '#808080',
    description: 'Transferencia bancaria'
  },
  { 
    value: 'mixto', 
    label: 'Pago Mixto', 
    icon: '🔄',
    color: '#FFDD33',
    description: 'Combinación de métodos de pago'
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
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  // Estados de cálculo
  const [subtotal, setSubtotal] = useState(0);
  const [inscriptionAmount, setInscriptionAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [commissionAmount, setCommissionAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);

  const supabase = createBrowserSupabaseClient();

  // 🔧 BÚSQUEDA DE USUARIOS
  const loadUsers = async (searchTerm: string = '') => {
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
  };

  // 🔧 CARGAR HISTORIAL DE USUARIO - VERSIÓN CON FECHAS
const loadUserHistory = async (userId: string) => {
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
  
      // Auto-detección inteligente mejorada
      const activeMemberships = formattedHistory.filter(h => h.status === 'active');
      const hasActiveMemberships = activeMemberships.length > 0;
      const hasPreviousMemberships = formattedHistory.length > 0;
      
      console.log(`🔄 Auto-detección: Activas=${hasActiveMemberships}, Previas=${hasPreviousMemberships}`);
      
      // Detectar fecha de vencimiento más reciente
      let latestEndDate = null;
      if (activeMemberships.length > 0) {
        const sortedActive = activeMemberships
          .filter(m => m.end_date)
          .sort((a, b) => new Date(b.end_date!).getTime() - new Date(a.end_date!).getTime());
        
        if (sortedActive.length > 0) {
          latestEndDate = sortedActive[0].end_date;
          console.log(`📅 Fecha de vencimiento más reciente: ${latestEndDate}`);
        }
      }
      
      setFormData(prev => ({
        ...prev,
        isRenewal: hasPreviousMemberships,
        skipInscription: hasActiveMemberships || hasPreviousMemberships,
        latestEndDate: latestEndDate
      }));
  
      if (formattedHistory.length === 0) {
        console.log('✨ Usuario nuevo detectado: Primera membresía, inscripción incluida');
      } else {
        console.log(`🔄 Usuario existente: ${formattedHistory.length} membresías previas`);
        if (latestEndDate) {
          console.log(`📅 Renovación extenderá desde: ${latestEndDate}`);
        }
      }
  
    } catch (err: any) {
      console.error('💥 Error crítico en loadUserHistory:', err);
      setUserHistory([]);
      
      setFormData(prev => ({
        ...prev,
        isRenewal: false,
        skipInscription: false,
        latestEndDate: null
      }));
      
      console.log('🛡️ Configuración segura aplicada: Cliente nuevo con inscripción');
    }
  };

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

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingPlans(false);
      }
    };

    loadInitialData();
  }, []);

  // Validar cupón
  const validateCoupon = async (code: string) => {
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

      const now = new Date();
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);

      if (now < startDate || now > endDate) {
        setError('El cupón no está vigente');
        setAppliedCoupon(null);
        return;
      }

      if (data.max_uses && data.current_uses >= data.max_uses) {
        setError('El cupón ha alcanzado su límite de usos');
        setAppliedCoupon(null);
        return;
      }

      if (data.min_amount && subtotal < data.min_amount) {
        setError(`El cupón requiere un monto mínimo de $${data.min_amount}`);
        setAppliedCoupon(null);
        return;
      }

      setAppliedCoupon(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setAppliedCoupon(null);
    }
  };

  // Calcular comisión (MEJORADA CON OVERRIDE)
  const calculateCommission = (method: string, amount: number): { rate: number; amount: number } => {
    // Si hay comisión personalizada, usarla
    if (formData.customCommissionRate !== null) {
      const customAmount = (amount * formData.customCommissionRate) / 100;
      return { rate: formData.customCommissionRate, amount: customAmount };
    }

    // Usar comisión predeterminada
    const commission = paymentCommissions.find(c => c.payment_method === method);
    if (!commission || amount < commission.min_amount) {
      return { rate: 0, amount: 0 };
    }

    if (commission.commission_type === 'percentage') {
      const commissionAmount = (amount * commission.commission_value) / 100;
      return { rate: commission.commission_value, amount: commissionAmount };
    } else {
      return { rate: 0, amount: commission.commission_value };
    }
  };

  // Manejar pagos mixtos
  const addMixedPaymentDetail = () => {
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
  };

  const removeMixedPaymentDetail = (id: string) => {
    setFormData(prev => ({
      ...prev,
      paymentDetails: prev.paymentDetails.filter(detail => detail.id !== id)
    }));
  };

  const updateMixedPaymentDetail = (id: string, field: keyof PaymentDetail, value: any) => {
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
  };

  // Calcular precios (MEJORADO CON INSCRIPCIÓN CONDICIONAL)
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

    // Calcular comisión
    let newCommission = 0;
    if (formData.isMixedPayment) {
      newCommission = formData.paymentDetails.reduce((sum, detail) => sum + detail.commission_amount, 0);
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

  }, [selectedPlan, formData.paymentType, appliedCoupon, formData.paymentMethod, formData.paymentReceived, formData.isMixedPayment, formData.paymentDetails, paymentCommissions, formData.skipInscription, formData.isRenewal, formData.customCommissionRate]);

  // Formatear precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

 // ✅ CALCULAR FECHA DE VENCIMIENTO CORREGIDA - SOLO ESTA FUNCIÓN CAMBIÓ
const calculateEndDate = () => {
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
    
    // ✅ USAR PERÍODOS REALES CORREGIDOS - FUNCIÓN ACTUALIZADA
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
  };

  // Validar pago
  const validatePayment = (): boolean => {
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
  };

  // ✅ MANEJAR ENVÍO DEL FORMULARIO - ACTUALIZADO CON PERÍODOS REALES
const handleSubmit = async () => {
  try {
    setLoading(true);
    setError(null);

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

    // ✅ DATOS DE LA MEMBRESÍA CON TIMESTAMPS CORRECTOS
    const membershipData = {
      userid: selectedUser.id,
      planid: selectedPlan.id,
      payment_type: formData.paymentType,
      amount_paid: finalAmount,
      inscription_amount: inscriptionAmount,
      start_date: startDate,                    // ✅ Ya está en formato correcto
      end_date: endDate,                        // ✅ Ya está en formato correcto
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
      created_at: createTimestampForDB(),       // ✅ UTC timestamp correcto
      updated_at: createTimestampForDB(),       // ✅ UTC timestamp correcto
      created_by: null // TODO: Agregar ID del usuario logueado
    };

    console.log('💾 Guardando nueva membresía con períodos reales:', membershipData);

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
    setError(err.message);
  } finally {
    setLoading(false);
    setConfirmDialogOpen(false);
  }
};

  const steps = [
    { label: 'Usuario', description: 'Seleccionar cliente' },
    { label: 'Plan', description: 'Elegir membresía y configurar inscripción' },
    { label: 'Descuentos', description: 'Aplicar cupones (opcional)' },
    { label: 'Pago', description: 'Configurar método y comisiones' }
  ];

  const canProceedToNextStep = () => {
    switch (activeStep) {
      case 0: return selectedUser !== null;
      case 1: return selectedPlan !== null && formData.paymentType !== '';
      case 2: return true;
      case 3: return formData.isMixedPayment ? 
        formData.paymentDetails.length > 0 : 
        formData.paymentMethod !== '';
      default: return false;
    }
  };

  return (
    <Box sx={{ 
      p: 3, 
      background: 'linear-gradient(135deg, #000000, #1A1A1A)',
      minHeight: '100vh',
      color: '#FFFFFF'
    }}>
      {/* Header Enterprise ACTUALIZADO */}
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
              <PersonAddAltIcon sx={{ fontSize: 50 }} />
              Sistema POS - Registro de Membresía
            </Typography>
            <Typography variant="h6" sx={{ 
              color: '#CCCCCC',
              fontWeight: 300
            }}>
              Punto de Venta Empresarial | Gestión Integral de Pagos y Comisiones
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
          </Stack>
        </Box>

        {/* Progress Bar Enterprise ACTUALIZADO */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 2,
          p: 2,
          background: 'rgba(255, 204, 0, 0.05)',
          borderRadius: 3,
          border: '1px solid rgba(255, 204, 0, 0.2)'
        }}>
          <ReceiptIcon sx={{ color: '#FFCC00' }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="body1" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
              Progreso del Registro
            </Typography>
            <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
              Paso {activeStep + 1} de {steps.length}: {steps[activeStep]?.label}
            </Typography>
          </Box>
          <Chip 
            label={`${Math.round(((activeStep + 1) / steps.length) * 100)}%`}
            sx={{ 
              backgroundColor: '#FFCC00',
              color: '#000000',
              fontWeight: 700
            }}
          />
        </Box>
      </Paper>

      {/* Messages ACTUALIZADOS */}
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

      {/* Contenido Principal Enterprise ACTUALIZADO */}
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{
            p: 5,
            background: 'linear-gradient(135deg, rgba(51, 51, 51, 0.98), rgba(77, 77, 77, 0.95))',
            border: '1px solid rgba(255, 204, 0, 0.2)',
            borderRadius: 4,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
            <Stepper activeStep={activeStep} orientation="vertical">
              {steps.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel
                    sx={{
                      '& .MuiStepLabel-label': {
                        color: '#FFFFFF',
                        fontWeight: activeStep === index ? 700 : 500,
                        fontSize: activeStep === index ? '1.1rem' : '1rem'
                      },
                      '& .MuiStepIcon-root': {
                        color: activeStep === index ? '#FFCC00' : 'rgba(204, 204, 204, 0.4)',
                        fontSize: '2rem',
                        '&.Mui-completed': {
                          color: '#FFCC00'
                        }
                      }
                    }}
                  >
                    {step.label}
                  </StepLabel>
                  <StepContent>
                    <Typography sx={{ 
                      color: '#CCCCCC', 
                      mb: 4,
                      fontSize: '1rem',
                      fontWeight: 300
                    }}>
                      {step.description}
                    </Typography>

                    {/* PASO 1: Seleccionar Usuario - ACTUALIZADO */}
                    {index === 0 && (
                      <Box sx={{ mb: 4 }}>
                        <Card sx={{
                          background: 'rgba(255, 204, 0, 0.05)',
                          border: '1px solid rgba(255, 204, 0, 0.2)',
                          borderRadius: 3,
                          mb: 3
                        }}>
                          <CardContent>
                            <Typography variant="h6" sx={{ 
                              color: '#FFCC00', 
                              mb: 3,
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2
                            }}>
                              <SearchIcon />
                              Búsqueda Inteligente de Clientes
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
                                  placeholder="Nombre, apellido o email del cliente..."
                                  fullWidth
                                  InputProps={{
                                    ...params.InputProps,
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        <SearchIcon sx={{ color: '#FFCC00' }} />
                                      </InputAdornment>
                                    ),
                                    endAdornment: (
                                      <>
                                        {loadingUsers ? (
                                          <CircularProgress 
                                            color="inherit" 
                                            size={24} 
                                            sx={{ color: '#FFCC00' }} 
                                          />
                                        ) : null}
                                        {params.InputProps.endAdornment}
                                      </>
                                    ),
                                    sx: {
                                      color: '#FFFFFF',
                                      fontSize: '1.1rem',
                                      '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255, 204, 0, 0.4)',
                                        borderWidth: 2
                                      },
                                      '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#FFCC00'
                                      },
                                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#FFE066'
                                      }
                                    }
                                  }}
                                  InputLabelProps={{
                                    sx: { 
                                      color: '#CCCCCC',
                                      fontSize: '1.1rem',
                                      '&.Mui-focused': { color: '#FFCC00' }
                                    }
                                  }}
                                />
                              )}
                              renderOption={(props, user) => {
                                const { key, ...otherProps } = props;
                                return (
                                  <li key={key} {...otherProps} style={{ 
                                    color: '#000000',
                                    backgroundColor: '#FFFFFF',
                                    padding: '16px 20px',
                                    borderBottom: '1px solid rgba(0,0,0,0.1)',
                                    cursor: 'pointer'
                                  }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                      <Box sx={{ 
                                        width: 50, 
                                        height: 50, 
                                        borderRadius: '50%', 
                                        background: '#FFCC00',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#000000',
                                        fontWeight: 700,
                                        fontSize: '1.2rem'
                                      }}>
                                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                                      </Box>
                                      <Box sx={{ flex: 1 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#000000' }}>
                                          {user.firstName} {user.lastName}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#808080' }}>
                                          {user.email}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  </li>
                                );
                              }}
                              sx={{ mb: 3 }}
                              noOptionsText={
                                loadingUsers ? "Buscando clientes..." : 
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
                              background: 'linear-gradient(135deg, rgba(255, 204, 0, 0.15), rgba(255, 204, 0, 0.05))',
                              border: '2px solid rgba(255, 204, 0, 0.5)',
                              borderRadius: 4,
                              boxShadow: '0 4px 20px rgba(255, 204, 0, 0.1)'
                            }}>
                              <CardContent sx={{ p: 4 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                                  <Box sx={{ 
                                    width: 80, 
                                    height: 80, 
                                    borderRadius: '50%', 
                                    background: '#FFCC00',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#000000',
                                    fontWeight: 800,
                                    fontSize: '2rem'
                                  }}>
                                    {selectedUser.firstName.charAt(0)}{selectedUser.lastName.charAt(0)}
                                  </Box>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="h5" sx={{ 
                                      color: '#FFCC00', 
                                      fontWeight: 800,
                                      mb: 1
                                    }}>
                                      ✅ Cliente Seleccionado
                                    </Typography>
                                    <Typography variant="h6" sx={{ 
                                      color: '#FFFFFF', 
                                      fontWeight: 700,
                                      mb: 0.5
                                    }}>
                                      {selectedUser.firstName} {selectedUser.lastName}
                                    </Typography>
                                    <Typography variant="body1" sx={{ 
                                      color: '#CCCCCC',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1
                                    }}>
                                      📧 {selectedUser.email}
                                    </Typography>
                                  </Box>
                                  <CheckCircleIcon sx={{ 
                                    color: '#FFCC00', 
                                    fontSize: 40
                                  }} />
                                </Box>

                                {/* NUEVA FUNCIONALIDAD: Historial y Renovación MEJORADA */}
                                {selectedUser && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    transition={{ duration: 0.4 }}
                                  >
                                    <Divider sx={{ borderColor: 'rgba(255, 204, 0, 0.3)', my: 3 }} />
                                    
                                    <Box sx={{
                                      background: userHistory.length > 0 ? 
                                        'rgba(255, 221, 51, 0.1)' : 
                                        'rgba(76, 175, 80, 0.1)',
                                      border: userHistory.length > 0 ? 
                                        '1px solid rgba(255, 221, 51, 0.3)' : 
                                        '1px solid rgba(76, 175, 80, 0.3)',
                                      borderRadius: 3,
                                      p: 3
                                    }}>
                                      {userHistory.length > 0 ? (
                                        <>
                                          <Typography variant="h6" sx={{ 
                                            color: '#FFDD33',
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
                                          {userHistory.slice(0, 5).map((membership, idx) => (
  <Box key={membership.id} sx={{ 
    display: 'flex', 
    justifyContent: 'space-between',
    alignItems: 'center',
    py: 1.5,
    px: 2,
    borderBottom: idx < Math.min(4, userHistory.length - 1) ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
    background: idx === 0 && membership.status === 'active' ? 'rgba(255, 204, 0, 0.05)' : 'transparent',
    borderRadius: idx === 0 && membership.status === 'active' ? 2 : 0
  }}>
    <Box>
      <Typography variant="body1" sx={{ 
        color: '#FFFFFF',
        fontWeight: idx === 0 && membership.status === 'active' ? 600 : 400
      }}>
        {membership.plan_name}
      </Typography>
      <Typography variant="caption" sx={{ color: '#CCCCCC' }}>
        📅 {new Date(membership.start_date).toLocaleDateString('es-MX')} → {' '}
        {membership.end_date ? new Date(membership.end_date).toLocaleDateString('es-MX') : 'Sin fecha'}
      </Typography>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {idx === 0 && membership.status === 'active' && (
        <Typography variant="caption" sx={{ 
          color: '#FFCC00',
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
            membership.status === 'active' ? '#CCAA00' : 
            membership.status === 'expired' ? '#666666' : 
            membership.status === 'frozen' ? '#2196f3' : '#808080',
          color: '#FFFFFF',
          fontSize: '0.7rem',
          fontWeight: 600
        }}
      />
    </Box>
  </Box>
))}
                                          </Box>

                                          {userHistory.length > 5 && (
                                            <Typography variant="caption" sx={{ 
                                              color: '#808080',
                                              fontStyle: 'italic',
                                              textAlign: 'center',
                                              display: 'block'
                                            }}>
                                              ... y {userHistory.length - 5} membresías más
                                            </Typography>
                                          )}
                                        </>
                                      ) : (
                                        <>
                                          <Typography variant="h6" sx={{ 
                                            color: '#4caf50',
                                            fontWeight: 700,
                                            mb: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2
                                          }}>
                                            ✨ Cliente Nuevo
                                          </Typography>
                                          
                                          <Typography variant="body1" sx={{ 
                                            color: '#FFFFFF',
                                            mb: 2,
                                            fontWeight: 500
                                          }}>
                                            Este cliente no tiene historial de membresías previas.
                                          </Typography>
                                          
                                          <Typography variant="body2" sx={{ 
                                            color: '#CCCCCC',
                                            mb: 3
                                          }}>
                                            Se configurará automáticamente como primera venta con inscripción incluida.
                                          </Typography>
                                          
                                          <Alert 
                                            severity="info"
                                            sx={{
                                              backgroundColor: 'rgba(33, 150, 243, 0.1)',
                                              color: '#FFFFFF',
                                              border: '1px solid rgba(33, 150, 243, 0.3)',
                                              '& .MuiAlert-icon': { color: '#2196f3' }
                                            }}
                                          >
                                            💡 <strong>Primera Venta:</strong> Se incluirá automáticamente el costo de inscripción. 
                                            Puede desactivarse manualmente si es necesario.
                                          </Alert>
                                        </>
                                      )}

                                      {/* Toggle de Renovación MEJORADO */}
                                      <Box sx={{
                                        background: 'rgba(255, 204, 0, 0.1)',
                                        border: '1px solid rgba(255, 204, 0, 0.3)',
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
                                                
                                                console.log(`🔄 Renovación ${isRenewal ? 'activada' : 'desactivada'}, inscripción ${isRenewal ? 'exenta' : 'incluida'}`);
                                              }}
                                              sx={{
                                                '& .MuiSwitch-switchBase.Mui-checked': {
                                                  color: '#FFCC00',
                                                },
                                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                  backgroundColor: '#FFCC00',
                                                },
                                              }}
                                            />
                                          }
                                          label={
                                            <Box>
                                              <Typography variant="body1" sx={{ 
                                                color: '#FFFFFF', 
                                                fontWeight: 600 
                                              }}>
                                                🔄 Marcar como Renovación de Membresía
                                              </Typography>
                                              <Typography variant="caption" sx={{ 
                                                color: '#CCCCCC',
                                                display: 'block',
                                                mt: 0.5
                                              }}>
                                                {formData.isRenewal ? (
                                                  <span style={{ color: '#4caf50' }}>
                                                    ✅ <strong>Renovación activada:</strong> No se cobrará inscripción
                                                  </span>
                                                ) : (
                                                  <span style={{ color: '#ff9800' }}>
                                                    💰 <strong>Primera venta:</strong> Se incluirá costo de inscripción 
                                                    {userHistory.length > 0 && ' (inusual para cliente existente)'}
                                                  </span>
                                                )}
                                              </Typography>
                                            </Box>
                                          }
                                        />

                                        {/* NUEVA FUNCIONALIDAD: Override manual de inscripción */}
                                        {formData.isRenewal && (
                                          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255, 204, 0, 0.2)' }}>
                                            <FormControlLabel
                                              control={
                                                <Switch
                                                  checked={!formData.skipInscription}
                                                  onChange={(e) => {
                                                    setFormData(prev => ({
                                                      ...prev,
                                                      skipInscription: !e.target.checked
                                                    }));
                                                  }}
                                                  sx={{
                                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                                      color: '#ff9800',
                                                    },
                                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                      backgroundColor: '#ff9800',
                                                    },
                                                  }}
                                                />
                                              }
                                              label={
                                                <Box>
                                                  <Typography variant="body2" sx={{ 
                                                    color: '#FFFFFF', 
                                                    fontWeight: 500 
                                                  }}>
                                                    ⚠️ Forzar cobro de inscripción (caso especial)
                                                  </Typography>
                                                  <Typography variant="caption" sx={{ 
                                                    color: '#CCCCCC'
                                                  }}>
                                                    Activar solo si se requiere cobrar inscripción en una renovación
                                                  </Typography>
                                                </Box>
                                              }
                                            />
                                          </Box>
                                        )}
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

                    {/* PASO 2: Seleccionar Plan - ACTUALIZADO CON INSCRIPCIÓN CONDICIONAL */}
                    {index === 1 && (
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="h5" sx={{ 
                          color: '#FFCC00', 
                          mb: 3,
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2
                        }}>
                          🏋️‍♂️ Catálogo de Membresías
                        </Typography>
                        
                        {loadingPlans ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress sx={{ color: '#FFCC00' }} size={50} />
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
                                        ? 'linear-gradient(135deg, rgba(255, 204, 0, 0.25), rgba(255, 204, 0, 0.1))'
                                        : 'linear-gradient(135deg, rgba(77, 77, 77, 0.08), rgba(102, 102, 102, 0.03))',
                                      border: selectedPlan?.id === plan.id 
                                        ? '3px solid #FFCC00' 
                                        : '1px solid rgba(204, 204, 204, 0.2)',
                                      borderRadius: 4,
                                      transition: 'all 0.3s ease',
                                      height: '100%',
                                      boxShadow: selectedPlan?.id === plan.id 
                                        ? '0 8px 30px rgba(255, 204, 0, 0.3)'
                                        : '0 4px 15px rgba(0, 0, 0, 0.2)',
                                      '&:hover': {
                                        borderColor: '#FFE066'
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
                                          color: '#FFCC00', 
                                          fontWeight: 800
                                        }}>
                                          {plan.name}
                                        </Typography>
                                        {selectedPlan?.id === plan.id && (
                                          <CheckCircleIcon sx={{ color: '#FFCC00' }} />
                                        )}
                                      </Box>
                                      
                                      <Typography variant="body1" sx={{ 
                                        color: '#CCCCCC', 
                                        mb: 3,
                                        lineHeight: 1.6
                                    }}>
                                    {plan.description}
                                  </Typography>
                                  
                                  <Box sx={{ 
                                    background: 'rgba(255, 204, 0, 0.1)',
                                    borderRadius: 2,
                                    p: 2,
                                    border: '1px solid rgba(255, 204, 0, 0.3)'
                                  }}>
                                    <Typography variant="h6" sx={{ 
                                      color: '#FFFFFF', 
                                      fontWeight: 700,
                                      textAlign: 'center'
                                    }}>
                                      Desde {formatPrice(plan.weekly_price)}
                                    </Typography>
                                    <Typography variant="body2" sx={{ 
                                      color: '#CCCCCC',
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
                          background: 'linear-gradient(135deg, rgba(255, 204, 0, 0.15), rgba(255, 204, 0, 0.05))',
                          border: '2px solid rgba(255, 204, 0, 0.5)',
                          borderRadius: 4
                        }}>
                          <CardContent sx={{ p: 4 }}>
                            <Typography variant="h5" sx={{ 
                              color: '#FFCC00', 
                              mb: 3,
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2
                            }}>
                              ⏱️ Configuración de Plan
                            </Typography>

                            {/* NUEVA SECCIÓN: Control de Inscripción */}
                            <Box sx={{
                              background: 'rgba(255, 221, 51, 0.1)',
                              border: '1px solid rgba(255, 221, 51, 0.3)',
                              borderRadius: 3,
                              p: 3,
                              mb: 3
                            }}>
                              <Typography variant="h6" sx={{ 
                                color: '#FFDD33',
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
                                            color: '#FFDD33',
                                          },
                                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                            backgroundColor: '#FFDD33',
                                          },
                                        }}
                                      />
                                    }
                                    label={
                                      <Box>
                                        <Typography variant="body1" sx={{ 
                                          color: '#FFFFFF', 
                                          fontWeight: 600 
                                        }}>
                                          🚫 Exentar Pago de Inscripción
                                        </Typography>
                                        <Typography variant="caption" sx={{ 
                                          color: '#CCCCCC'
                                        }}>
                                          {formData.skipInscription ? 
                                            'No se cobrará inscripción en esta venta' : 
                                            `Se cobrará inscripción: ${formatPrice(selectedPlan.inscription_price || 0)}`
                                          }
                                        </Typography>
                                      </Box>
                                    }
                                  />
                                </Grid>
                                <Grid size={4}>
                                  <Box sx={{
                                    background: formData.skipInscription ? 
                                      'rgba(76, 175, 80, 0.1)' : 
                                      'rgba(255, 152, 0, 0.1)',
                                    border: formData.skipInscription ? 
                                      '1px solid rgba(76, 175, 80, 0.3)' : 
                                      '1px solid rgba(255, 152, 0, 0.3)',
                                    borderRadius: 2,
                                    p: 2,
                                    textAlign: 'center'
                                  }}>
                                    <Typography variant="body2" sx={{ 
                                      color: '#CCCCCC',
                                      mb: 1
                                    }}>
                                      Inscripción
                                    </Typography>
                                    <Typography variant="h6" sx={{ 
                                      color: formData.skipInscription ? '#4caf50' : '#ff9800',
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
                                color: '#CCCCCC',
                                fontSize: '1.1rem',
                                '&.Mui-focused': { color: '#FFCC00' }
                              }}>
                                Seleccione duración y precio
                              </InputLabel>
                              <Select
                                value={formData.paymentType}
                                onChange={(e) => setFormData(prev => ({ ...prev, paymentType: e.target.value }))}
                                sx={{
                                  color: '#FFFFFF',
                                  fontSize: '1.1rem',
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 204, 0, 0.4)',
                                    borderWidth: 2
                                  },
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#FFCC00'
                                  },
                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#FFE066'
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
                                          backgroundColor: 'rgba(255, 204, 0, 0.1)'
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
                                          color: '#FFCC00', 
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

                {/* PASO 3: Cupones - ACTUALIZADO */}
                {index === 2 && (
                  <Box sx={{ mb: 4 }}>
                    <Card sx={{
                      background: 'rgba(255, 204, 0, 0.05)',
                      border: '1px solid rgba(255, 204, 0, 0.2)',
                      borderRadius: 3
                    }}>
                      <CardContent sx={{ p: 4 }}>
                        <Typography variant="h5" sx={{ 
                          color: '#FFCC00', 
                          mb: 3,
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2
                        }}>
                          🎟️ Sistema de Descuentos
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
                          placeholder="Ej: DESC20, PROMO50, ESTUDIANTE..."
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LocalOfferIcon sx={{ color: '#FFCC00' }} />
                              </InputAdornment>
                            ),
                            endAdornment: appliedCoupon && (
                              <InputAdornment position="end">
                                <CheckCircleIcon sx={{ color: '#FFCC00' }} />
                              </InputAdornment>
                            ),
                            sx: {
                              color: '#FFFFFF',
                              fontSize: '1.1rem',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255, 204, 0, 0.4)',
                                borderWidth: 2
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#FFCC00'
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#FFE066'
                              }
                            }
                          }}
                          InputLabelProps={{
                            sx: { 
                              color: '#CCCCCC',
                              fontSize: '1.1rem',
                              '&.Mui-focused': { color: '#FFCC00' }
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
                                background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.2), rgba(76, 175, 80, 0.1))',
                                border: '2px solid rgba(76, 175, 80, 0.5)',
                                borderRadius: 3
                              }}>
                                <CardContent sx={{ p: 3 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 30 }} />
                                    <Typography variant="h6" sx={{ 
                                      color: '#4caf50', 
                                      fontWeight: 700
                                    }}>
                                      ¡Cupón Aplicado Exitosamente!
                                    </Typography>
                                  </Box>
                                  
                                  <Typography variant="body1" sx={{ 
                                    color: '#FFFFFF', 
                                    mb: 1,
                                    fontWeight: 600
                                  }}>
                                    {appliedCoupon.description}
                                  </Typography>
                                  
                                  <Typography variant="h6" sx={{ 
                                    color: '#4caf50',
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

                {/* PASO 4: Sistema POS Avanzado - ACTUALIZADO CON COMISIONES CONFIGURABLES */}
                {index === 3 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" sx={{ 
                      color: '#FFCC00', 
                      mb: 4,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      💳 Sistema POS Empresarial
                    </Typography>

                    {/* Toggle Pago Mixto */}
                    <Card sx={{
                      background: 'rgba(255, 204, 0, 0.05)',
                      border: '1px solid rgba(255, 204, 0, 0.3)',
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
                                  color: '#FFCC00',
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                  backgroundColor: '#FFCC00',
                                },
                              }}
                            />
                          }
                          label={
                            <Typography variant="h6" sx={{ 
                              color: '#FFFFFF', 
                              fontWeight: 600 
                            }}>
                              🔄 Activar Pago Mixto (Múltiples Métodos)
                            </Typography>
                          }
                        />
                        <Typography variant="body2" sx={{ 
                          color: '#CCCCCC',
                          mt: 1
                        }}>
                          Permite combinar efectivo, tarjetas y transferencias en un solo pago
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
                          background: 'linear-gradient(135deg, rgba(51, 51, 51, 0.95), rgba(77, 77, 77, 0.9))',
                          border: '2px solid rgba(255, 204, 0, 0.3)',
                          borderRadius: 4
                        }}>
                          <CardContent sx={{ p: 4 }}>
                            <Typography variant="h5" sx={{ 
                              color: '#FFCC00', 
                              mb: 3,
                              fontWeight: 700
                            }}>
                              Método de Pago Único
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
                                          : 'rgba(77, 77, 77, 0.05)',
                                        border: formData.paymentMethod === method.value 
                                          ? `3px solid ${method.color}` 
                                          : '1px solid rgba(204, 204, 204, 0.2)',
                                        borderRadius: 3,
                                        transition: 'all 0.3s ease',
                                        height: '120px',
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
                                        position: 'relative'
                                      }}>
                                        <Typography variant="h3" sx={{ mb: 1 }}>
                                          {method.icon}
                                        </Typography>
                                        <Typography variant="h6" sx={{ 
                                          color: '#FFFFFF',
                                          fontWeight: 600,
                                          fontSize: '0.9rem'
                                        }}>
                                          {method.label}
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

                            {/* NUEVA FUNCIONALIDAD: Configuración de Comisiones */}
                            {formData.paymentMethod && (
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <Box sx={{ mt: 4 }}>
                                  {/* Panel de Comisiones */}
                                  <Card sx={{
                                    background: 'rgba(255, 152, 0, 0.1)',
                                    border: '1px solid rgba(255, 152, 0, 0.3)',
                                    borderRadius: 3,
                                    mb: 3
                                  }}>
                                    <CardContent sx={{ p: 3 }}>
                                      <Box sx={{ 
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        mb: 2
                                      }}>
                                        <Typography variant="h6" sx={{ 
                                          color: '#ff9800',
                                          fontWeight: 700,
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 1
                                        }}>
                                          <PercentIcon />
                                          Configuración de Comisión
                                        </Typography>
                                        
                                        <IconButton
                                          onClick={() => setFormData(prev => ({
                                            ...prev,
                                            editingCommission: !prev.editingCommission
                                          }))}
                                          sx={{ 
                                            color: '#ff9800',
                                            '&:hover': {
                                              backgroundColor: 'rgba(255, 152, 0, 0.1)'
                                            }
                                          }}
                                        >
                                          <EditIcon />
                                        </IconButton>
                                      </Box>

                                      <Grid container spacing={3}>
                                        <Grid size={6}>
                                          <Box sx={{
                                            background: 'rgba(102, 102, 102, 0.1)',
                                            border: '1px solid rgba(102, 102, 102, 0.3)',
                                            borderRadius: 2,
                                            p: 2,
                                            textAlign: 'center'
                                          }}>
                                            <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
                                              Comisión Predeterminada
                                            </Typography>
                                            <Typography variant="h6" sx={{ 
                                              color: '#FFFFFF',
                                              fontWeight: 600
                                            }}>
                                              {paymentCommissions.find(c => c.payment_method === formData.paymentMethod)?.commission_value || 0}%
                                            </Typography>
                                          </Box>
                                        </Grid>

                                        <Grid size={6}>
                                          {formData.editingCommission ? (
                                            <TextField
                                              fullWidth
                                              label="Comisión Personalizada (%)"
                                              type="number"
                                              value={formData.customCommissionRate || ''}
                                              onChange={(e) => {
                                                const value = parseFloat(e.target.value);
                                                setFormData(prev => ({
                                                  ...prev,
                                                  customCommissionRate: isNaN(value) ? null : value
                                                }));
                                              }}
                                              placeholder="Ej: 2.5"
                                              InputProps={{
                                                startAdornment: (
                                                  <InputAdornment position="start">
                                                    <PercentIcon sx={{ color: '#ff9800' }} />
                                                  </InputAdornment>
                                                ),
                                                sx: {
                                                  color: '#FFFFFF',
                                                  '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'rgba(255, 152, 0, 0.5)',
                                                    borderWidth: 2
                                                  },
                                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#ff9800'
                                                  },
                                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#ff9800'
                                                  }
                                                }
                                              }}
                                              InputLabelProps={{
                                                sx: { 
                                                  color: '#CCCCCC',
                                                  '&.Mui-focused': { color: '#ff9800' }
                                                }
                                              }}
                                            />
                                          ) : (
                                            <Box sx={{
                                              background: formData.customCommissionRate !== null ?
                                                'rgba(255, 204, 0, 0.1)' :
                                                'rgba(102, 102, 102, 0.1)',
                                              border: formData.customCommissionRate !== null ?
                                                '1px solid rgba(255, 204, 0, 0.3)' :
                                                '1px solid rgba(102, 102, 102, 0.3)',
                                              borderRadius: 2,
                                              p: 2,
                                              textAlign: 'center'
                                            }}>
                                              <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
                                                Comisión Aplicada
                                              </Typography>
                                              <Typography variant="h6" sx={{ 
                                                color: formData.customCommissionRate !== null ? '#FFCC00' : '#FFFFFF',
                                                fontWeight: 700
                                              }}>
                                                {formData.customCommissionRate !== null ? 
                                                  `${formData.customCommissionRate}%` :
                                                  `${paymentCommissions.find(c => c.payment_method === formData.paymentMethod)?.commission_value || 0}%`
                                                }
                                              </Typography>
                                            </Box>
                                          )}
                                        </Grid>
                                      </Grid>

                                      {formData.customCommissionRate !== null && (
                                        <Box sx={{ mt: 2 }}>
                                          <Alert 
                                            severity="info"
                                            sx={{
                                              backgroundColor: 'rgba(33, 150, 243, 0.1)',
                                              color: '#FFFFFF',
                                              border: '1px solid rgba(33, 150, 243, 0.3)',
                                              '& .MuiAlert-icon': { color: '#2196f3' }
                                            }}
                                          >
                                            Comisión personalizada aplicada. El cálculo se actualizará automáticamente.
                                          </Alert>
                                        </Box>
                                      )}
                                    </CardContent>
                                  </Card>

                                  {/* Campos específicos por método de pago */}
                                  {/* EFECTIVO - POS AVANZADO */}
                                  {formData.paymentMethod === 'efectivo' && (
                                    <Card sx={{
                                      background: 'linear-gradient(135deg, rgba(204, 170, 0, 0.15), rgba(204, 170, 0, 0.05))',
                                      border: '2px solid rgba(204, 170, 0, 0.5)',
                                      borderRadius: 4
                                    }}>
                                      <CardContent sx={{ p: 4 }}>
                                        <Typography variant="h5" sx={{ 
                                          color: '#CCAA00', 
                                          mb: 3,
                                          fontWeight: 800,
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 2
                                        }}>
                                          💵 Pago en Efectivo - Calculadora POS
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
                                                  color: '#FFFFFF',
                                                  backgroundColor: 'rgba(204, 170, 0, 0.1)',
                                                  fontSize: '1.3rem',
                                                  fontWeight: 700,
                                                  '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'rgba(204, 170, 0, 0.5)',
                                                    borderWidth: 2
                                                  }
                                                }
                                              }}
                                              InputLabelProps={{
                                                sx: { 
                                                  color: '#CCCCCC',
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
                                                    <AttachMoneyIcon sx={{ color: '#FFCC00' }} />
                                                  </InputAdornment>
                                                ),
                                                sx: {
                                                  color: '#FFFFFF',
                                                  fontSize: '1.3rem',
                                                  fontWeight: 700,
                                                  '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'rgba(255, 204, 0, 0.5)',
                                                    borderWidth: 2
                                                  },
                                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#FFCC00'
                                                  },
                                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#FFE066'
                                                  }
                                                }
                                              }}
                                              InputLabelProps={{
                                                sx: { 
                                                  color: '#CCCCCC',
                                                  fontWeight: 600,
                                                  '&.Mui-focused': { color: '#FFCC00' }
                                                }
                                              }}
                                            />
                                          </Grid>

                                          <Grid size={12}>
                                            <Box sx={{
                                              background: formData.paymentChange > 0 
                                                ? 'linear-gradient(135deg, rgba(255, 204, 0, 0.2), rgba(255, 204, 0, 0.1))'
                                                : 'rgba(77, 77, 77, 0.05)',
                                              border: formData.paymentChange > 0 
                                                ? '2px solid #FFCC00' 
                                                : '1px solid rgba(204, 204, 204, 0.2)',
                                              borderRadius: 3,
                                              p: 3,
                                              textAlign: 'center'
                                            }}>
                                              <Typography variant="h4" sx={{ 
                                                color: formData.paymentChange > 0 ? '#FFCC00' : '#808080',
                                                fontWeight: 800,
                                                mb: 1
                                              }}>
                                                {formData.paymentChange > 0 
                                                  ? `💰 Cambio: ${formatPrice(formData.paymentChange)}`
                                                  : '💰 Cambio: $0.00'
                                                }
                                              </Typography>
                                              <Typography variant="body1" sx={{ 
                                                color: '#CCCCCC'
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
                                  )}

                                  {/* TARJETAS - CON COMISIONES ACTUALIZADAS */}
                                  {(formData.paymentMethod === 'debito' || formData.paymentMethod === 'credito') && (
                                    <Card sx={{
                                      background: 'linear-gradient(135deg, rgba(77, 77, 77, 0.15), rgba(102, 102, 102, 0.05))',
                                      border: '2px solid rgba(77, 77, 77, 0.5)',
                                      borderRadius: 4
                                    }}>
                                      <CardContent sx={{ p: 4 }}>
                                        <Typography variant="h5" sx={{ 
                                          color: '#4D4D4D', 
                                          mb: 3,
                                          fontWeight: 800,
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 2
                                        }}>
                                          <CreditCardIcon />
                                          Pago con {formData.paymentMethod === 'debito' ? 'Débito' : 'Crédito'}
                                        </Typography>

                                        <Grid container spacing={3}>
                                          <Grid size={{ xs: 12, md: 6 }}>
                                            <Box sx={{
                                              background: 'rgba(77, 77, 77, 0.1)',
                                              border: '1px solid rgba(77, 77, 77, 0.3)',
                                              borderRadius: 3,
                                              p: 3
                                            }}>
                                              <Typography variant="h6" sx={{ 
                                                color: '#FFFFFF', 
                                                mb: 2,
                                                fontWeight: 600
                                              }}>
                                                Desglose de Costos
                                              </Typography>
                                              
                                              <Stack spacing={1}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                  <Typography variant="body1" sx={{ color: '#CCCCCC' }}>
                                                    Subtotal:
                                                  </Typography>
                                                  <Typography variant="body1" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                                                    {formatPrice(totalAmount)}
                                                  </Typography>
                                                </Box>
                                                
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                  <Typography variant="body1" sx={{ color: 'rgba(255, 152, 0, 0.8)' }}>
                                                    Comisión ({calculateCommission(formData.paymentMethod, totalAmount).rate}%):
                                                  </Typography>
                                                  <Typography variant="body1" sx={{ color: '#ff9800', fontWeight: 600 }}>
                                                    +{formatPrice(commissionAmount)}
                                                  </Typography>
                                                </Box>
                                                
                                                <Divider sx={{ borderColor: 'rgba(204, 204, 204, 0.2)' }} />
                                                
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                  <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 700 }}>
                                                    Total Final:
                                                  </Typography>
                                                  <Typography variant="h6" sx={{ color: '#4D4D4D', fontWeight: 800 }}>
                                                    {formatPrice(finalAmount)}
                                                  </Typography>
                                                </Box>
                                              </Stack>
                                            </Box>
                                          </Grid>

                                          <Grid size={{ xs: 12, md: 6 }}>
                                            <TextField
                                              fullWidth
                                              label="Número de Autorización"
                                              value={formData.paymentReference}
                                              onChange={(e) => setFormData(prev => ({ 
                                                ...prev, 
                                                paymentReference: e.target.value 
                                              }))}
                                              placeholder="Ej: 123456, AUTH789..."
                                              InputProps={{
                                                startAdornment: (
                                                  <InputAdornment position="start">
                                                    <CreditCardIcon sx={{ color: '#4D4D4D' }} />
                                                  </InputAdornment>
                                                ),
                                                sx: {
                                                  color: '#FFFFFF',
                                                  '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'rgba(77, 77, 77, 0.5)',
                                                    borderWidth: 2
                                                  },
                                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#4D4D4D'
                                                  },
                                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#4D4D4D'
                                                  }
                                                }
                                              }}
                                              InputLabelProps={{
                                                sx: { 
                                                  color: '#CCCCCC',
                                                  '&.Mui-focused': { color: '#4D4D4D' }
                                                }
                                              }}
                                            />
                                          </Grid>
                                        </Grid>
                                      </CardContent>
                                    </Card>
                                  )}

                                  {/* TRANSFERENCIA - ACTUALIZADA */}
                                  {formData.paymentMethod === 'transferencia' && (
                                    <Card sx={{
                                      background: 'linear-gradient(135deg, rgba(128, 128, 128, 0.15), rgba(128, 128, 128, 0.05))',
                                      border: '2px solid rgba(128, 128, 128, 0.5)',
                                      borderRadius: 4
                                    }}>
                                      <CardContent sx={{ p: 4 }}>
                                        <Typography variant="h5" sx={{ 
                                          color: '#808080', 
                                          mb: 3,
                                          fontWeight: 800,
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 2
                                        }}>
                                          <AccountBalanceIcon />
                                          Transferencia Bancaria
                                        </Typography>

                                        <Grid container spacing={3}>
                                          <Grid size={{ xs: 12, md: 8 }}>
                                            <TextField
                                              fullWidth
                                              label="Número de Referencia / SPEI"
                                              value={formData.paymentReference}
                                              onChange={(e) => setFormData(prev => ({ 
                                                ...prev, 
                                                paymentReference: e.target.value 
                                              }))}
                                              placeholder="Ej: 1234567890123456"
                                              InputProps={{
                                                startAdornment: (
                                                  <InputAdornment position="start">
                                                    <AccountBalanceIcon sx={{ color: '#808080' }} />
                                                  </InputAdornment>
                                                ),
                                                sx: {
                                                  color: '#FFFFFF',
                                                  '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'rgba(128, 128, 128, 0.5)',
                                                    borderWidth: 2
                                                  },
                                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#808080'
                                                  },
                                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#808080'
                                                  }
                                                }
                                              }}
                                              InputLabelProps={{
                                                sx: { 
                                                  color: '#CCCCCC',
                                                  '&.Mui-focused': { color: '#808080' }
                                                }
                                              }}
                                            />
                                          </Grid>

                                          <Grid size={{ xs: 12, md: 4 }}>
                                            <Box sx={{
                                              background: 'rgba(128, 128, 128, 0.1)',
                                              border: '1px solid rgba(128, 128, 128, 0.3)',
                                              borderRadius: 3,
                                              p: 2,
                                              textAlign: 'center'
                                            }}>
                                              <Typography variant="body2" sx={{ 
                                                color: '#CCCCCC',
                                                mb: 1
                                              }}>
                                                Total a Transferir
                                              </Typography>
                                              <Typography variant="h5" sx={{ 
                                                color: '#808080',
                                                fontWeight: 700
                                              }}>
                                                {formatPrice(finalAmount)}
                                              </Typography>
                                            </Box>
                                          </Grid>
                                        </Grid>
                                      </CardContent>
                                      </Card>
                                  )}
                                </Box>
                              </motion.div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}

                    {/* Sistema de Pagos Mixtos - ACTUALIZADO */}
                    {formData.isMixedPayment && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card sx={{
                          background: 'linear-gradient(135deg, rgba(255, 221, 51, 0.15), rgba(255, 221, 51, 0.05))',
                          border: '2px solid rgba(255, 221, 51, 0.5)',
                          borderRadius: 4
                        }}>
                          <CardContent sx={{ p: 4 }}>
                            <Box sx={{ 
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              mb: 3
                            }}>
                              <Typography variant="h5" sx={{ 
                                color: '#FFDD33', 
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2
                              }}>
                                🔄 Sistema de Pagos Mixtos
                              </Typography>
                              
                              <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={addMixedPaymentDetail}
                                sx={{
                                  background: 'linear-gradient(135deg, #FFDD33, #FFCC00)',
                                  color: '#000000',
                                  fontWeight: 700,
                                  '&:hover': {
                                    background: 'linear-gradient(135deg, #FFCC00, #FFB300)',
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
                                border: '2px dashed rgba(255, 221, 51, 0.3)',
                                borderRadius: 3
                              }}>
                                <Typography variant="body1" sx={{ 
                                  color: '#CCCCCC',
                                  mb: 2
                                }}>
                                  No hay métodos de pago agregados
                                </Typography>
                                <Typography variant="body2" sx={{ 
                                  color: '#808080'
                                }}>
                                  Haga clic en "Agregar Método" para comenzar
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
                                    background: 'rgba(77, 77, 77, 0.05)',
                                    border: '1px solid rgba(204, 204, 204, 0.2)',
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
                                          color: '#FFDD33',
                                          fontWeight: 600
                                        }}>
                                          Pago #{detail.sequence}
                                        </Typography>
                                        
                                        <IconButton
                                          onClick={() => removeMixedPaymentDetail(detail.id)}
                                          sx={{ color: '#f44336' }}
                                        >
                                          <RemoveIcon />
                                        </IconButton>
                                      </Box>

                                      <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, md: 4 }}>
                                          <FormControl fullWidth>
                                            <InputLabel sx={{ 
                                              color: '#CCCCCC',
                                              '&.Mui-focused': { color: '#FFDD33' }
                                            }}>
                                              Método
                                            </InputLabel>
                                            <Select
                                              value={detail.method}
                                              onChange={(e) => updateMixedPaymentDetail(detail.id, 'method', e.target.value)}
                                              sx={{
                                                color: '#FFFFFF',
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                  borderColor: 'rgba(255, 221, 51, 0.3)'
                                                },
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                  borderColor: '#FFDD33'
                                                },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                  borderColor: '#FFDD33'
                                                }
                                              }}
                                            >
                                              {paymentMethods.filter(m => m.value !== 'mixto').map((method) => (
                                                <MenuItem key={method.value} value={method.value}>
                                                  {method.icon} {method.label}
                                                </MenuItem>
                                              ))}
                                            </Select>
                                          </FormControl>
                                        </Grid>

                                        <Grid size={{ xs: 12, md: 3 }}>
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
                                                color: '#FFFFFF',
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                  borderColor: 'rgba(255, 221, 51, 0.3)'
                                                },
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                  borderColor: '#FFDD33'
                                                },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                  borderColor: '#FFDD33'
                                                }
                                              }
                                            }}
                                            InputLabelProps={{
                                              sx: { 
                                                color: '#CCCCCC',
                                                '&.Mui-focused': { color: '#FFDD33' }
                                              }
                                            }}
                                          />
                                        </Grid>

                                        <Grid size={{ xs: 12, md: 3 }}>
                                          <TextField
                                            fullWidth
                                            label="Comisión"
                                            value={formatPrice(detail.commission_amount)}
                                            disabled
                                            InputProps={{
                                              sx: {
                                                color: '#ff9800',
                                                fontWeight: 600,
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                  borderColor: 'rgba(255, 152, 0, 0.3)'
                                                }
                                              }
                                            }}
                                            InputLabelProps={{
                                              sx: { color: '#CCCCCC' }
                                            }}
                                          />
                                        </Grid>

                                        <Grid size={{ xs: 12, md: 2 }}>
                                          <TextField
                                            fullWidth
                                            label="Total"
                                            value={formatPrice(detail.amount + detail.commission_amount)}
                                            disabled
                                            InputProps={{
                                              sx: {
                                                color: '#FFDD33',
                                                fontWeight: 700,
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                  borderColor: 'rgba(255, 221, 51, 0.5)',
                                                  borderWidth: 2
                                                }
                                              }
                                            }}
                                            InputLabelProps={{
                                              sx: { color: '#CCCCCC' }
                                            }}
                                          />
                                        </Grid>

                                        <Grid size={12}>
                                          <TextField
                                            fullWidth
                                            label="Referencia (opcional)"
                                            value={detail.reference}
                                            onChange={(e) => updateMixedPaymentDetail(detail.id, 'reference', e.target.value)}
                                            placeholder="Número de autorización, SPEI, etc."
                                            InputProps={{
                                              sx: {
                                                color: '#FFFFFF',
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                  borderColor: 'rgba(204, 204, 204, 0.2)'
                                                }
                                              }
                                            }}
                                            InputLabelProps={{
                                              sx: { color: '#CCCCCC' }
                                            }}
                                          />
                                        </Grid>
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
                                    background: 'linear-gradient(135deg, rgba(255, 204, 0, 0.2), rgba(255, 204, 0, 0.1))',
                                    border: '2px solid #FFCC00',
                                    borderRadius: 3
                                  }}>
                                    <CardContent sx={{ p: 3 }}>
                                      <Typography variant="h6" sx={{ 
                                        color: '#FFCC00',
                                        fontWeight: 700,
                                        mb: 2
                                      }}>
                                        📊 Resumen de Pagos Mixtos
                                      </Typography>

                                      <Grid container spacing={2}>
                                        <Grid size={{ xs: 6, md: 3 }}>
                                          <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="body2" sx={{ 
                                              color: '#CCCCCC'
                                            }}>
                                              Total Parcial
                                            </Typography>
                                            <Typography variant="h6" sx={{ 
                                              color: '#FFFFFF',
                                              fontWeight: 700
                                            }}>
                                              {formatPrice(formData.paymentDetails.reduce((sum, detail) => sum + detail.amount, 0))}
                                            </Typography>
                                          </Box>
                                        </Grid>

                                        <Grid size={{ xs: 6, md: 3 }}>
                                          <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="body2" sx={{ 
                                              color: '#CCCCCC'
                                            }}>
                                              Comisiones
                                            </Typography>
                                            <Typography variant="h6" sx={{ 
                                              color: '#ff9800',
                                              fontWeight: 700
                                            }}>
                                              {formatPrice(formData.paymentDetails.reduce((sum, detail) => sum + detail.commission_amount, 0))}
                                            </Typography>
                                          </Box>
                                        </Grid>

                                        <Grid size={{ xs: 6, md: 3 }}>
                                          <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="body2" sx={{ 
                                              color: '#CCCCCC'
                                            }}>
                                              Total Pagado
                                            </Typography>
                                            <Typography variant="h6" sx={{ 
                                              color: '#FFCC00',
                                              fontWeight: 700
                                            }}>
                                              {formatPrice(formData.paymentDetails.reduce((sum, detail) => sum + detail.amount + detail.commission_amount, 0))}
                                            </Typography>
                                          </Box>
                                        </Grid>

                                        <Grid size={{ xs: 6, md: 3 }}>
                                          <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="body2" sx={{ 
                                              color: '#CCCCCC'
                                            }}>
                                              Balance
                                            </Typography>
                                            <Typography variant="h6" sx={{ 
                                              color: Math.abs(formData.paymentDetails.reduce((sum, detail) => sum + detail.amount + detail.commission_amount, 0) - finalAmount) < 0.01 
                                                ? '#4caf50' : '#f44336',
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
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}

                    {/* Notas Adicionales - ACTUALIZADA */}
                    <Card sx={{
                      background: 'rgba(77, 77, 77, 0.02)',
                      border: '1px solid rgba(204, 204, 204, 0.1)',
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
                          placeholder="Observaciones especiales, condiciones del pago, etc..."
                          InputProps={{
                            sx: {
                              color: '#FFFFFF',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(204, 204, 204, 0.3)'
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(204, 204, 204, 0.5)'
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
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {/* Botones de navegación Enterprise - ACTUALIZADOS */}
                <Box sx={{ display: 'flex', gap: 3, mt: 4 }}>
                  <Button
                    disabled={activeStep === 0}
                    onClick={() => setActiveStep(prev => prev - 1)}
                    size="large"
                    sx={{ 
                      color: '#CCCCCC',
                      borderColor: 'rgba(204, 204, 204, 0.4)',
                      px: 4,
                      py: 1.5,
                      borderRadius: 3,
                      '&:hover': {
                        borderColor: 'rgba(204, 204, 204, 0.6)',
                        backgroundColor: 'rgba(204, 204, 204, 0.05)'
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
                        background: 'linear-gradient(135deg, #FFCC00, #FFB300)',
                        color: '#000000',
                        fontWeight: 800,
                        px: 4,
                        py: 1.5,
                        borderRadius: 3,
                        fontSize: '1.1rem',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #FFE066, #FFCC00)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(255, 204, 0, 0.4)'
                        },
                        '&:disabled': {
                          background: 'rgba(77, 77, 77, 0.12)',
                          color: 'rgba(204, 204, 204, 0.3)'
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
                        background: 'linear-gradient(135deg, #FFCC00, #FFB300)',
                        color: '#000000',
                        fontWeight: 800,
                        px: 4,
                        py: 1.5,
                        borderRadius: 3,
                        fontSize: '1.1rem',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #FFE066, #FFCC00)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(255, 204, 0, 0.4)'
                        },
                        '&:disabled': {
                          background: 'rgba(77, 77, 77, 0.12)',
                          color: 'rgba(204, 204, 204, 0.3)'
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

    {/* Panel de Resumen Enterprise - Sidebar ACTUALIZADO */}
    <Grid size={{ xs: 12, lg: 4 }}>
      <Paper sx={{
        p: 4,
        background: 'linear-gradient(135deg, rgba(51, 51, 51, 0.98), rgba(77, 77, 77, 0.95))',
        border: '2px solid rgba(255, 204, 0, 0.3)',
        borderRadius: 4,
        position: 'sticky',
        top: 20,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <Typography variant="h5" sx={{ 
          color: '#FFCC00', 
          mb: 4, 
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <ReceiptIcon />
          Ticket de Venta
        </Typography>

        {selectedUser && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ mb: 3 }}>
              <Box sx={{
                background: 'rgba(255, 204, 0, 0.1)',
                border: '1px solid rgba(255, 204, 0, 0.3)',
                borderRadius: 3,
                p: 3
              }}>
                <Typography variant="subtitle1" sx={{ 
                  color: '#CCCCCC',
                  mb: 1
                }}>
                  Cliente:
                </Typography>
                <Typography variant="h6" sx={{ 
                  color: '#FFFFFF', 
                  fontWeight: 700,
                  mb: 0.5
                }}>
                  {selectedUser.firstName} {selectedUser.lastName}
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: '#CCCCCC'
                }}>
                  {selectedUser.email}
                </Typography>
                
                {/* NUEVA FUNCIONALIDAD: Indicador de Renovación */}
                {formData.isRenewal && (
                  <Box sx={{ mt: 2 }}>
                    <Chip 
                      label="🔄 RENOVACIÓN" 
                      size="small"
                      sx={{
                        backgroundColor: '#FFDD33',
                        color: '#000000',
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
                color: '#CCCCCC',
                mb: 2
              }}>
                Membresía Seleccionada:
              </Typography>
              
              <Box sx={{
                background: 'rgba(77, 77, 77, 0.05)',
                border: '1px solid rgba(204, 204, 204, 0.2)',
                borderRadius: 3,
                p: 3,
                mb: 3
              }}>
                <Typography variant="h6" sx={{ 
                  color: '#FFFFFF', 
                  fontWeight: 700,
                  mb: 1
                }}>
                  {selectedPlan.name}
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: '#CCCCCC',
                  mb: 2
                }}>
                  {paymentTypes.find(pt => pt.value === formData.paymentType)?.label}
                </Typography>

                {calculateEndDate() && (
                  <Box sx={{
                    background: 'rgba(255, 204, 0, 0.1)',
                    borderRadius: 2,
                    p: 2,
                    border: '1px solid rgba(255, 204, 0, 0.2)'
                  }}>
                    <Typography variant="body2" sx={{ 
                      color: '#CCCCCC',
                      mb: 1
                    }}>
                      Vigencia hasta:
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      color: '#FFCC00',
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

              <Divider sx={{ borderColor: 'rgba(255, 204, 0, 0.3)', my: 3 }} />

              {/* Desglose de Precios Enterprise ACTUALIZADO */}
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ 
                    color: '#CCCCCC',
                    fontWeight: 500
                  }}>
                    Subtotal Plan:
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: '#FFFFFF',
                    fontWeight: 600
                  }}>
                    {formatPrice(subtotal)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ 
                    color: inscriptionAmount > 0 ? '#CCCCCC' : '#4caf50',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    {inscriptionAmount > 0 ? 'Inscripción:' : '🚫 Inscripción EXENTA:'}
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: inscriptionAmount > 0 ? '#FFFFFF' : '#4caf50',
                    fontWeight: inscriptionAmount > 0 ? 600 : 700
                  }}>
                    {inscriptionAmount > 0 ? formatPrice(inscriptionAmount) : 'GRATIS'}
                  </Typography>
                </Box>

                {discountAmount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ 
                      color: '#4caf50',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      🎟️ Descuento:
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      color: '#4caf50',
                      fontWeight: 700
                    }}>
                      -{formatPrice(discountAmount)}
                    </Typography>
                  </Box>
                )}

                <Divider sx={{ borderColor: 'rgba(204, 204, 204, 0.2)' }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ 
                    color: '#FFFFFF',
                    fontWeight: 700
                  }}>
                    Subtotal:
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: '#FFCC00',
                    fontWeight: 700
                  }}>
                    {formatPrice(totalAmount)}
                  </Typography>
                </Box>

                {commissionAmount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ 
                      color: '#ff9800',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <InfoIcon fontSize="small" />
                      Comisión{formData.customCommissionRate !== null ? ' (Personalizada)' : ''}:
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      color: '#ff9800',
                      fontWeight: 700
                    }}>
                      +{formatPrice(commissionAmount)}
                    </Typography>
                  </Box>
                )}

                <Divider sx={{ borderColor: 'rgba(255, 204, 0, 0.5)' }} />

                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  background: 'rgba(255, 204, 0, 0.1)',
                  border: '1px solid rgba(255, 204, 0, 0.3)',
                  borderRadius: 3,
                  p: 3
                }}>
                  <Typography variant="h5" sx={{ 
                    color: '#FFFFFF', 
                    fontWeight: 800
                  }}>
                    TOTAL FINAL:
                  </Typography>
                  <Typography variant="h4" sx={{ 
                    color: '#FFCC00', 
                    fontWeight: 900
                  }}>
                    {formatPrice(finalAmount)}
                  </Typography>
                </Box>

                {/* Información del método de pago ACTUALIZADA */}
                {(formData.paymentMethod || formData.isMixedPayment) && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" sx={{ 
                      color: '#CCCCCC',
                      mb: 2
                    }}>
                      Método de Pago:
                    </Typography>
                    
                    {formData.isMixedPayment ? (
                      <Box sx={{
                        background: 'rgba(255, 221, 51, 0.1)',
                        border: '1px solid rgba(255, 221, 51, 0.3)',
                        borderRadius: 3,
                        p: 2
                      }}>
                        <Typography variant="body1" sx={{ 
                          color: '#FFDD33',
                          fontWeight: 600,
                          mb: 1
                        }}>
                          🔄 Pago Mixto
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: '#CCCCCC'
                        }}>
                          {formData.paymentDetails.length} método{formData.paymentDetails.length !== 1 ? 's' : ''} configurado{formData.paymentDetails.length !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{
                        background: 'rgba(77, 77, 77, 0.05)',
                        border: '1px solid rgba(204, 204, 204, 0.2)',
                        borderRadius: 3,
                        p: 2
                      }}>
                        <Typography variant="body1" sx={{ 
                          color: '#FFFFFF',
                          fontWeight: 600
                        }}>
                          {paymentMethods.find(pm => pm.value === formData.paymentMethod)?.icon} {paymentMethods.find(pm => pm.value === formData.paymentMethod)?.label}
                        </Typography>
                        
                        {formData.paymentMethod === 'efectivo' && formData.paymentReceived > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" sx={{ 
                              color: '#CCCCCC'
                            }}>
                              Recibido: {formatPrice(formData.paymentReceived)}
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              color: formData.paymentChange > 0 ? '#FFCC00' : '#CCCCCC',
                              fontWeight: formData.paymentChange > 0 ? 600 : 400
                            }}>
                              Cambio: {formatPrice(formData.paymentChange)}
                            </Typography>
                          </Box>
                        )}

                        {/* NUEVA FUNCIONALIDAD: Mostrar comisión personalizada */}
                        {formData.customCommissionRate !== null && commissionAmount > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Chip 
                              label={`Comisión Personalizada: ${formData.customCommissionRate}%`}
                              size="small"
                              sx={{
                                backgroundColor: '#ff9800',
                                color: '#FFFFFF',
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
              color: 'rgba(204, 204, 204, 0.4)',
              mb: 2
            }}>
              🧾 Ticket de Venta
            </Typography>
            <Typography variant="body1" sx={{ 
              color: 'rgba(204, 204, 204, 0.3)'
            }}>
              Complete los pasos para generar el resumen
            </Typography>
          </Box>
        )}
      </Paper>
    </Grid>
  </Grid>

  {/* Dialog de Confirmación Enterprise ACTUALIZADO */}
  <Dialog 
    open={confirmDialogOpen} 
    onClose={() => !loading && setConfirmDialogOpen(false)}
    maxWidth="lg"
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
      fontSize: '1.8rem',
      textAlign: 'center',
      pb: 3
    }}>
      🏆 Confirmar Procesamiento de Venta
    </DialogTitle>
    
    <DialogContent>
      <Typography variant="h6" sx={{ 
        mb: 4,
        textAlign: 'center',
        color: '#CCCCCC'
      }}>
        Revise cuidadosamente todos los datos antes de procesar la venta
      </Typography>

      <Grid container spacing={4}>
        <Grid size={6}>
          <Card sx={{ 
            background: 'rgba(255, 204, 0, 0.1)', 
            border: '1px solid rgba(255, 204, 0, 0.3)',
            borderRadius: 3
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ 
                color: '#FFCC00', 
                mb: 3,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                👤 Datos del Cliente
              </Typography>
              
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                    Nombre Completo:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {selectedUser?.firstName} {selectedUser?.lastName}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                    Email:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedUser?.email}
                  </Typography>
                </Box>

                {/* NUEVA FUNCIONALIDAD: Mostrar tipo de venta */}
                <Box>
                  <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                    Tipo de Venta:
                  </Typography>
                  <Chip 
                    label={formData.isRenewal ? '🔄 RENOVACIÓN' : '🆕 PRIMERA VEZ'}
                    sx={{
                      backgroundColor: formData.isRenewal ? '#FFDD33' : '#4caf50',
                      color: '#000000',
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
            background: 'rgba(255, 204, 0, 0.1)', 
            border: '1px solid rgba(255, 204, 0, 0.3)',
            borderRadius: 3
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ 
                color: '#FFCC00', 
                mb: 3,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                🏋️‍♂️ Membresía
              </Typography>
              
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                    Plan:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {selectedPlan?.name}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                    Duración:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {paymentTypes.find(pt => pt.value === formData.paymentType)?.label}
                  </Typography>
                </Box>

                {calculateEndDate() && (
                  <Box>
                    <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                      Vigencia hasta:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, color: '#FFCC00' }}>
                      {calculateEndDate()?.toLocaleDateString('es-MX')}
                    </Typography>
                  </Box>
                )}

                {/* NUEVA FUNCIONALIDAD: Estado de inscripción */}
                <Box>
                  <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                    Inscripción:
                  </Typography>
                  <Chip 
                    label={formData.skipInscription ? '🚫 EXENTA' : `💰 ${formatPrice(inscriptionAmount)}`}
                    size="small"
                    sx={{
                      backgroundColor: formData.skipInscription ? '#4caf50' : '#ff9800',
                      color: '#FFFFFF',
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
            background: 'rgba(77, 77, 77, 0.05)', 
            border: '1px solid rgba(204, 204, 204, 0.2)',
            borderRadius: 3
          }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ 
                color: '#FFCC00', 
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
                    <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
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
                      <Typography variant="body2" sx={{ color: 'rgba(255, 152, 0, 0.8)' }}>
                        Comisión{formData.customCommissionRate !== null ? '*' : ''}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#ff9800' }}>
                        +{formatPrice(commissionAmount)}
                      </Typography>
                      {formData.customCommissionRate !== null && (
                        <Typography variant="caption" sx={{ color: '#ff9800' }}>
                          {formData.customCommissionRate}%
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                )}

                <Grid size={commissionAmount > 0 ? 3 : 4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                      Método de Pago
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {formData.isMixedPayment ? 'Mixto' : paymentMethods.find(pm => pm.value === formData.paymentMethod)?.label}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={commissionAmount > 0 ? 2 : 3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                      Inscripción
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600,
                      color: formData.skipInscription ? '#4caf50' : '#FFFFFF'
                    }}>
                      {formData.skipInscription ? 'EXENTA' : formatPrice(inscriptionAmount)}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={commissionAmount > 0 ? 3 : 3}>
                  <Box sx={{ 
                    textAlign: 'center',
                    background: 'rgba(255, 204, 0, 0.1)',
                    borderRadius: 2,
                    p: 2,
                    border: '1px solid rgba(255, 204, 0, 0.3)'
                  }}>
                    <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                      TOTAL FINAL
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#FFCC00' }}>
                      {formatPrice(finalAmount)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* NUEVA FUNCIONALIDAD: Alertas importantes */}
              {formData.customCommissionRate !== null && (
                <Box sx={{ mt: 3 }}>
                  <Alert 
                    severity="info"
                    sx={{
                      backgroundColor: 'rgba(33, 150, 243, 0.1)',
                      color: '#FFFFFF',
                      border: '1px solid rgba(33, 150, 243, 0.3)',
                      '& .MuiAlert-icon': { color: '#2196f3' }
                    }}
                  >
                    <Typography variant="body2">
                      <strong>Comisión Personalizada Aplicada:</strong> {formData.customCommissionRate}% 
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
                      backgroundColor: 'rgba(46, 125, 50, 0.1)',
                      color: '#FFFFFF',
                      border: '1px solid rgba(46, 125, 50, 0.3)',
                      '& .MuiAlert-icon': { color: '#4caf50' }
                    }}
                  >
                    <Typography variant="body2">
                      <strong>Inscripción Exenta:</strong> Se ha omitido el cobro de inscripción 
                      ({formatPrice(selectedPlan?.inscription_price || 0)})
                    </Typography>
                  </Alert>
                </Box>
              )}
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
          color: '#CCCCCC',
          borderColor: 'rgba(204, 204, 204, 0.4)',
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
        startIcon={loading ? <CircularProgress size={24} sx={{ color: '#000000' }} /> : <SaveIcon />}
        sx={{
          background: 'linear-gradient(135deg, #FFCC00, #FFB300)',
          color: '#000000',
          fontWeight: 800,
          px: 6,
          py: 1.5,
          borderRadius: 3,
          fontSize: '1.1rem',
          '&:hover': {
            background: 'linear-gradient(135deg, #FFE066, #FFCC00)',
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 30px rgba(255, 204, 0, 0.4)'
          }
        }}
      >
        {loading ? 'Procesando Venta...' : '✅ Confirmar y Procesar'}
      </Button>
    </DialogActions>
  </Dialog>
</Box>
);

// Función para agregar método de pago mixto
const addPaymentDetail = () => {
  addMixedPaymentDetail();
};

// Función para quitar método de pago mixto
const removePaymentDetail = (id: string) => {
  removeMixedPaymentDetail(id);
};

// Función para actualizar método de pago mixto
const updatePaymentDetail = (id: string, field: keyof PaymentDetail, value: any) => {
  updateMixedPaymentDetail(id, field, value);
};

}