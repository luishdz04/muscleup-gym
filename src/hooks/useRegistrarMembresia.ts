// hooks/useRegistrarMembresia.ts - CORRECCIONES APLICADAS
import { useState, useEffect, useCallback, useMemo, useReducer } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { 
  getTodayInMexico, 
  formatDateForDisplay, 
  calculateMembershipEndDate,
  calculateRenewalStartDate 
} from '@/utils/dateUtils';
import toast from 'react-hot-toast';

// ✅ DEBOUNCE FUNCIÓN MANUAL (sin lodash)
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 📊 TIPOS E INTERFACES (sin cambios)
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

// 🔧 REDUCER A PRUEBA DE BALAS - RESET COMPLETO
const formReducer = (state: FormData, action: any): FormData => {
  switch (action.type) {
    case 'SET_USER':
      return { 
        ...state, 
        userId: action.payload.id,
        planId: '',
        paymentType: '',
        isRenewal: false,
        skipInscription: false,
        latestEndDate: null,
        // RESET COMPLETO del estado de pago
        paymentMethod: '',
        paymentDetails: [],
        isMixedPayment: false,
        paymentReceived: 0,
        paymentChange: 0,
        customCommissionRate: null,
        editingCommission: false,
      };
      
    case 'SET_PLAN':
      return { 
        ...state, 
        planId: action.payload,
        // RESET COMPLETO del estado de pago
        paymentMethod: '',
        paymentDetails: [],
        isMixedPayment: false,
        paymentReceived: 0,
        paymentChange: 0,
        customCommissionRate: null,
        editingCommission: false,
      };
      
    case 'SET_PAYMENT_TYPE':
      return {
        ...state,
        paymentType: action.payload
      };

    // ✅ LÓGICA CORREGIDA PARA PAGO SIMPLE - FUERZA EL MODO
    case 'SET_PAYMENT_METHOD':
      return {
        ...state,
        paymentMethod: action.payload,
        isMixedPayment: false, // FORZAMOS el modo a "simple"
        paymentDetails: [],    // LIMPIAMOS cualquier rastro del modo mixto
        paymentReceived: 0,
        paymentChange: 0,
        customCommissionRate: null,
        editingCommission: false,
      };
      
    // ✅ LÓGICA CORREGIDA PARA EL SWITCH - RESET COMPLETO
    case 'TOGGLE_MIXED_PAYMENT':
      const willBeMixed = !state.isMixedPayment;
      return {
        ...state,
        isMixedPayment: willBeMixed,
        // LIMPIAMOS COMPLETAMENTE el estado del otro modo para forzar nueva selección
        paymentMethod: '',
        paymentDetails: [],
        paymentReceived: 0,
        paymentChange: 0,
        customCommissionRate: null,
        editingCommission: false,
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

    // ✅ CORREGIDO: Acción para limpiar cupones
    case 'CLEAR_COUPON':
      return {
        ...state,
        couponCode: ''
      };

    // ✅ LÓGICA CORREGIDA PARA DETALLES DE PAGO MIXTO - FUERZA EL MODO
    case 'UPDATE_PAYMENT_DETAILS':
      return {
        ...state,
        paymentDetails: action.payload,
        isMixedPayment: true,  // NOS ASEGURAMOS de estar en modo mixto
        paymentMethod: '',     // Y LIMPIAMOS el modo simple
        paymentReceived: 0,
        paymentChange: 0,
      };
      
    case 'RESET_FORM':
      return initialFormData;
      
    default:
      return state;
  }
};

export const useRegistrarMembresia = () => {
  const supabase = createBrowserSupabaseClient();
  
  // 🔧 ESTADOS CON REDUCER
  const [formData, dispatch] = useReducer(formReducer, initialFormData);
  
  // 📊 ESTADOS DE DATOS (sin cambios)
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
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  // 💰 ESTADOS DE CÁLCULO
  const [subtotal, setSubtotal] = useState(0);
  const [inscriptionAmount, setInscriptionAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [commissionAmount, setCommissionAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);

  // ✅ FUNCIONES UTILITARIAS MEMOIZADAS
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return formatDateForDisplay(dateString);
  }, []);

  // 🔍 BÚSQUEDA DE USUARIOS CON DEBOUNCE (sin cambios)
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
          toast.error('No hay sesión activa');
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
        toast.error(`Error al buscar usuarios: ${err.message}`);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    }, 300),
    [supabase]
  );

  // ✅ CARGAR HISTORIAL DE USUARIO (sin cambios importantes)
  const loadUserHistory = useCallback(async (userId: string) => {
    try {
      const { data: memberships, error: membershipsError } = await supabase
        .from('user_memberships')
        .select('id, created_at, status, planid, start_date, end_date')
        .eq('userid', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (membershipsError) {
        setUserHistory([]);
        return;
      }

      let formattedHistory: UserMembershipHistory[] = [];
      
      if (memberships && memberships.length > 0) {
        const planIds = [...new Set(memberships.map(m => m.planid).filter(Boolean))];
        
        if (planIds.length > 0) {
          const { data: plans, error: plansError } = await supabase
            .from('membership_plans')
            .select('id, name')
            .in('id', planIds);

          if (plansError) {
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

      setUserHistory(formattedHistory);

      const today = getTodayInMexico();
      
      const activeMemberships = formattedHistory.filter(h => {
        if (h.status !== 'active' || !h.end_date) return false;
        return h.end_date >= today;
      });
      
      const hasActiveMemberships = activeMemberships.length > 0;
      const hasPreviousMemberships = formattedHistory.length > 0;
      
      let latestEndDate = null;
      if (hasActiveMemberships && activeMemberships && activeMemberships.length > 0) {
        latestEndDate = activeMemberships[0].end_date;
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
        toast.success('Cliente nuevo detectado: Primera membresía');
      } else {
        toast.success(`Cliente existente: ${formattedHistory.length} membresías previas`);
      }

    } catch (err: any) {
      setUserHistory([]);
      toast.error(`Error cargando historial: ${err.message}`);
      
      dispatch({
        type: 'SET_RENEWAL_DATA',
        payload: {
          isRenewal: false,
          skipInscription: false,
          latestEndDate: null
        }
      });
    }
  }, [supabase, dispatch]);

  // ✅ CARGAR PLANES Y COMISIONES INICIAL (sin cambios)
  const loadInitialData = useCallback(async () => {
    setLoadingPlans(true);
    try {
      const { data: plansData, error: plansError } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('is_active', true)
        .order('monthly_price', { ascending: true });

      if (plansError) throw plansError;
      setPlans(plansData || []);

      const { data: commissionsData, error: commissionsError } = await supabase
        .from('payment_commissions')
        .select('*')
        .eq('is_active', true);

      if (commissionsError) throw commissionsError;
      setPaymentCommissions(commissionsData || []);

      toast.success('Datos cargados correctamente');

    } catch (err: any) {
      toast.error(`Error cargando datos: ${err.message}`);
    } finally {
      setLoadingPlans(false);
    }
  }, [supabase]);

  // ✅ VALIDAR CUPÓN (sin cambios importantes)
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
        toast.error('Cupón no válido o no encontrado');
        setAppliedCoupon(null);
        return;
      }

      const today = getTodayInMexico();
      
      if (data.start_date && today < data.start_date) {
        toast.error('El cupón no está vigente aún');
        setAppliedCoupon(null);
        return;
      }

      if (data.end_date && today > data.end_date) {
        toast.error('El cupón ha expirado');
        setAppliedCoupon(null);
        return;
      }

      if (data.max_uses && data.current_uses >= data.max_uses) {
        toast.error('El cupón ha alcanzado su límite de usos');
        setAppliedCoupon(null);
        return;
      }

      if (data.min_amount && subtotal < data.min_amount) {
        toast.error(`El cupón requiere un monto mínimo de ${formatPrice(data.min_amount)}`);
        setAppliedCoupon(null);
        return;
      }

      setAppliedCoupon(data);
      toast.success('Cupón aplicado exitosamente');
    } catch (err: any) {
      toast.error(err.message);
      setAppliedCoupon(null);
    }
  }, [supabase, subtotal, formatPrice]);

  // ✅ CALCULAR COMISIÓN (sin cambios)
  const calculateCommission = useCallback((method: string, amount: number): { rate: number; amount: number } => {
    const methodsWithCommission = ['debito', 'credito'];
    
    if (!methodsWithCommission.includes(method)) {
      return { rate: 0, amount: 0 };
    }

    if (formData.customCommissionRate !== null) {
      const customAmount = (amount * formData.customCommissionRate) / 100;
      return { rate: formData.customCommissionRate, amount: customAmount };
    }

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
  }, [formData.customCommissionRate, paymentCommissions]);

  // ✅ MANEJAR PAGOS MIXTOS - VERSIÓN A PRUEBA DE BALAS
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
      type: 'UPDATE_PAYMENT_DETAILS', // ✅ USAR LA ACCIÓN CORRECTA
      payload: [...formData.paymentDetails, newDetail]
    });
  }, [formData.paymentDetails]);

  const removeMixedPaymentDetail = useCallback((id: string) => {
    dispatch({
      type: 'UPDATE_PAYMENT_DETAILS', // ✅ USAR LA ACCIÓN CORRECTA
      payload: formData.paymentDetails.filter(detail => detail.id !== id)
    });
  }, [formData.paymentDetails]);

  const updateMixedPaymentDetail = useCallback((id: string, field: keyof PaymentDetail, value: any) => {
    const updatedDetails = formData.paymentDetails.map(detail => {
      if (detail.id === id) {
        const updatedDetail = { ...detail, [field]: value };
        
        // ✅ CORREGIDO: Actualizar comisiones cuando cambia método o monto
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
      type: 'UPDATE_PAYMENT_DETAILS', // ✅ USAR LA ACCIÓN CORRECTA
      payload: updatedDetails
    });
  }, [formData.paymentDetails, calculateCommission]);

  // ✅ HOOK PERSONALIZADO PARA CÁLCULOS DE MEMBRESÍA (sin cambios importantes)
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

    let newCommission = 0;
    if (formData.isMixedPayment) {
      newCommission = formData.paymentDetails.reduce((sum, detail) => sum + detail.commission_amount, 0);
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

  // ✅ ACTUALIZAR ESTADOS DE CÁLCULO (sin cambios)
  useEffect(() => {
    setSubtotal(membershipCalculations.subtotal);
    setInscriptionAmount(membershipCalculations.inscription);
    setDiscountAmount(membershipCalculations.discount);
    setCommissionAmount(membershipCalculations.commission);
    setTotalAmount(membershipCalculations.total);
    setFinalAmount(membershipCalculations.final);

    if (formData.paymentMethod === 'efectivo' && formData.paymentReceived > 0) {
      const change = formData.paymentReceived - membershipCalculations.final;
      dispatch({
        type: 'UPDATE_PAYMENT',
        payload: { paymentChange: Math.max(0, change) }
      });
    }
  }, [membershipCalculations, formData.paymentMethod, formData.paymentReceived, dispatch]);

  // ✅ CALCULAR FECHA DE VENCIMIENTO (sin cambios)
  const calculateEndDate = useCallback((): Date | null => {
    if (!selectedPlan || !formData.paymentType) return null;

    const paymentTypeData = paymentTypes.find(pt => pt.value === formData.paymentType);
    if (!paymentTypeData || paymentTypeData.value === 'visit') return null;

    let startDateString: string;
    
    if (formData.isRenewal && formData.latestEndDate) {
      startDateString = calculateRenewalStartDate(formData.latestEndDate);
    } else {
      startDateString = getTodayInMexico();
    }
    
    const endDateString = calculateMembershipEndDate(startDateString, formData.paymentType, selectedPlan);
    
    const [year, month, day] = endDateString.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
  }, [selectedPlan, formData.paymentType, formData.isRenewal, formData.latestEndDate]);

  // ✅ VALIDAR FECHAS DE MEMBRESÍA (sin cambios)
  const validateMembershipDates = useCallback((startDate: string, endDate: string | null, paymentType: string): boolean => {
    try {
      const start = new Date(`${startDate}T00:00:00`);
      
      if (!endDate) {
        return false;
      }
      
      const end = new Date(`${endDate}T00:00:00`);
      
      if (paymentType === 'visit') {
        if (startDate !== endDate) {
          return false;
        }
        return true;
      }
      
      if (end <= start) {
        return false;
      }
      
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
        // Solo warning, no error
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  // ✅ VALIDAR PAGO CORREGIDO Y MEJORADO
  const validatePayment = useCallback((): boolean => {
    console.log('🔍 Validando pago:', {
      isMixed: formData.isMixedPayment,
      paymentMethod: formData.paymentMethod,
      paymentDetails: formData.paymentDetails,
      detailsLength: formData.paymentDetails.length,
      finalAmount: finalAmount
    });

    // Permitir ventas de $0 (cupones que cubren todo)
    if (finalAmount <= 0) {
      return true; 
    }

    if (formData.isMixedPayment) {
      if (formData.paymentDetails.length === 0) {
        toast.error('Debe agregar al menos un método de pago para pagos mixtos');
        return false;
      }
      
      // ✅ CORREGIDO: Validar que todos los detalles tengan montos válidos
      const invalidDetails = formData.paymentDetails.filter(detail => 
        !detail.method || detail.amount <= 0
      );
      
      if (invalidDetails.length > 0) {
        toast.error('Todos los métodos de pago deben tener método seleccionado y monto mayor a cero');
        return false;
      }
      
      const totalPaidWithCommissions = formData.paymentDetails.reduce((sum, detail) => 
        sum + detail.amount + detail.commission_amount, 0
      );
      
      // ✅ CORREGIDO: Validar que el total coincida (con tolerancia para decimales)
      if (Math.abs(totalPaidWithCommissions - finalAmount) > 0.01) {
        toast.error(`El total de pagos mixtos (${formatPrice(totalPaidWithCommissions)}) debe coincidir con el total (${formatPrice(finalAmount)})`);
        return false;
      }
    } else if (formData.paymentMethod === 'efectivo') {
      if (formData.paymentReceived < finalAmount) {
        toast.error(`El monto recibido debe ser mayor o igual a ${formatPrice(finalAmount)}`);
        return false;
      }
    } else if (!formData.paymentMethod) {
      toast.error('Debe seleccionar un método de pago');
      return false;
    }

    return true;
  }, [formData.isMixedPayment, formData.paymentDetails, finalAmount, formData.paymentMethod, formData.paymentReceived, formatPrice]);

  // ✅ PROCESAR VENTA (sin cambios importantes)
  const handleSubmit = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No hay sesión activa. Por favor, inicie sesión nuevamente.');
      }
      
      if (!selectedUser || !selectedPlan || !formData.paymentType) {
        throw new Error('Debe completar todos los campos obligatorios');
      }
      
      // ✅ CORREGIDO: Validación mejorada
      if (!validatePayment()) {
        return false;
      }
      
      console.log('🚀 handleSubmit - Datos validados:', {
        isMixedPayment: formData.isMixedPayment,
        paymentMethod: formData.paymentMethod,
        paymentDetails: formData.paymentDetails,
        finalAmount: finalAmount
      });
      
      const today = getTodayInMexico();
      let startDate: string;
      
      if (formData.isRenewal && formData.latestEndDate) {
        startDate = calculateRenewalStartDate(formData.latestEndDate);
      } else {
        startDate = getTodayInMexico();
      }
      
      const endDate = calculateMembershipEndDate(startDate, formData.paymentType, selectedPlan);
      
      if (!validateMembershipDates(startDate, endDate, formData.paymentType)) {
        throw new Error('Error en el cálculo de fechas de la membresía');
      }
      
      const membershipData = {
        userid: selectedUser.id,
        planid: selectedPlan.id,
        created_by: session.user.id,
        updated_by: session.user.id,
        
        start_date: startDate,
        end_date: endDate,
        
        payment_type: formData.paymentType,
        status: 'active',
        
        total_visits: formData.paymentType === 'visit' ? 1 : null,
        remaining_visits: formData.paymentType === 'visit' ? 1 : null,
        
        amount_paid: finalAmount,
        subtotal: subtotal,
        inscription_amount: inscriptionAmount,
        discount_amount: discountAmount,
        commission_amount: commissionAmount,
        
        payment_method: formData.isMixedPayment ? 'mixto' : formData.paymentMethod,
        payment_reference: formData.paymentReference || null,
        is_mixed_payment: formData.isMixedPayment,
        payment_details: formData.isMixedPayment ? formData.paymentDetails : null,
        
        payment_received: formData.paymentMethod === 'efectivo' ? formData.paymentReceived : finalAmount,
        payment_change: formData.paymentMethod === 'efectivo' ? formData.paymentChange : 0,
        
        coupon_code: appliedCoupon?.code || null,
        
        is_renewal: formData.isRenewal,
        skip_inscription: formData.skipInscription,
        
        custom_commission_rate: formData.customCommissionRate,
        
        notes: formData.notes || null
      };
      
      if (formData.isRenewal) {
        const { error: updateError } = await supabase
          .from('user_memberships')
          .update({ 
            status: 'expired',
            notes: `Expirada por renovación el ${today}`,
            updated_by: session.user.id
          })
          .eq('userid', selectedUser.id)
          .eq('status', 'active');
          
        if (updateError) {
          console.warn('Warning al actualizar membresías previas:', updateError);
        }
      }
      
      const { data: membership, error: membershipError } = await supabase
        .from('user_memberships')
        .insert([membershipData])
        .select()
        .single();
        
      if (membershipError) {
        throw membershipError;
      }
      
      // Actualizar cupón si se usó
      if (appliedCoupon) {
        await supabase
          .from('coupons')
          .update({ 
            current_uses: appliedCoupon.current_uses + 1,
            updated_by: session.user.id
          })
          .eq('id', appliedCoupon.id);
      }
      
      let successMsg;
      if (formData.paymentType === 'visit') {
        successMsg = `🎉 ¡Visita registrada! ${selectedUser.firstName} tiene acceso HOY (${formatDate(endDate)})`;
      } else {
        const endDateFormatted = new Date(endDate).toLocaleDateString('es-MX', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        successMsg = formData.isRenewal 
          ? `🎉 ¡Renovación exitosa! La membresía de ${selectedUser.firstName} ha sido extendida hasta el ${endDateFormatted}`
          : `🎉 ¡Membresía registrada! ${selectedUser.firstName} tiene acceso hasta el ${endDateFormatted}`;
      }
        
      toast.success(successMsg);
      
      return true;
      
    } catch (err: any) {
      toast.error(`Error al procesar la venta: ${err.message || 'Error desconocido'}`);
      return false;
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
    formatDate
  ]);

  // ✅ VALIDAR SI PUEDE PROCEDER AL SIGUIENTE PASO - CORREGIDO
  const canProceedToNextStep = useCallback(() => {
    console.log('🔍 Validando paso:', {
      step: activeStep,
      selectedUser: !!selectedUser,
      selectedPlan: !!selectedPlan,
      paymentType: formData.paymentType,
      isMixedPayment: formData.isMixedPayment,
      paymentMethod: formData.paymentMethod,
      paymentDetailsLength: formData.paymentDetails.length,
      paymentDetailsValid: formData.paymentDetails.every(detail => detail.amount > 0 && detail.method)
    });

    switch (activeStep) {
      case 0: return selectedUser !== null;
      case 1: return selectedPlan !== null && formData.paymentType !== '';
      case 2: return true; // Paso de cupones siempre puede continuar
      case 3: 
        if (formData.isMixedPayment) {
          return formData.paymentDetails.length > 0 && 
                 formData.paymentDetails.every(detail => detail.amount > 0 && detail.method);
        } else {
          return formData.paymentMethod !== '';
        }
      default: return false;
    }
  }, [activeStep, selectedUser, selectedPlan, formData]);

  // ✅ FUNCIÓN PARA RESETEAR FORMULARIO (sin cambios)
  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM' });
    setSelectedUser(null);
    setSelectedPlan(null);
    setAppliedCoupon(null);
    setUserHistory([]);
    setActiveStep(0);
    toast.success('Formulario reiniciado');
  }, [dispatch]);

  // ✅ CARGAR DATOS INICIAL (sin cambios)
  useEffect(() => {
    const loadData = async () => {
      setLoadingPlans(true);
      try {
        const { data: plansData, error: plansError } = await supabase
          .from('membership_plans')
          .select('*')
          .eq('is_active', true)
          .order('monthly_price', { ascending: true });

        if (plansError) throw plansError;
        setPlans(plansData || []);

        const { data: commissionsData, error: commissionsError } = await supabase
          .from('payment_commissions')
          .select('*')
          .eq('is_active', true);

        if (commissionsError) throw commissionsError;
        setPaymentCommissions(commissionsData || []);

        toast.success('Datos cargados correctamente');

      } catch (err: any) {
        toast.error(`Error cargando datos: ${err.message}`);
      } finally {
        setLoadingPlans(false);
      }
    };

    loadData();
  }, [supabase]);

  return {
    // Estados principales
    formData,
    dispatch,
    activeStep,
    setActiveStep,
    
    // Datos
    users,
    plans,
    paymentCommissions,
    userHistory,
    selectedUser,
    setSelectedUser,
    selectedPlan,
    setSelectedPlan,
    appliedCoupon,
    setAppliedCoupon,
    
    // Estados UI
    loading,
    loadingUsers,
    loadingPlans,
    confirmDialogOpen,
    setConfirmDialogOpen,
    
    // Cálculos
    subtotal,
    inscriptionAmount,
    discountAmount,
    commissionAmount,
    totalAmount,
    finalAmount,
    
    // Funciones
    formatPrice,
    formatDate,
    debouncedLoadUsers,
    loadUserHistory,
    validateCoupon,
    calculateCommission,
    addMixedPaymentDetail,
    removeMixedPaymentDetail,
    updateMixedPaymentDetail,
    calculateEndDate,
    handleSubmit,
    canProceedToNextStep,
    resetForm,
    
    // Constantes
    paymentTypes
  };
};