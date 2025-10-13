// hooks/useRegistrarMembresia.ts - ENTERPRISE v6.0 REFACTORIZADO NUEVO ESQUEMA BD
import { useState, useEffect, useCallback, useMemo, useReducer } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

// ✅ IMPORTS ENTERPRISE OBLIGATORIOS v6.0
import { useUserTracking } from '@/hooks/useUserTracking';
import { 
  formatTimestampForDisplay, 
  formatDateForDisplay,
  getTodayInMexico,
  calculateRenewalStartDate,
  formatDateLong,
  calculateMembershipEndDate
} from '@/utils/dateUtils';
import { notify } from '@/utils/notifications';

// ✅ IMPORTS PARA LÓGICA DE PAGOS AVANZADA (como PaymentDialog.tsx)
import { useEntityCRUD } from '@/hooks/useEntityCRUD';

// ✅ IMPORTACIONES DE TIPOS
import type {
  UserMembership,
  MembershipPlan,
  Coupon,
  PaymentCommission,
  UserMembershipHistory,
  PaymentDetail,
  PaymentType,
  MembershipFormData,
  MembershipStatus,
  PaymentMethod
} from '@/types/membership';

// ✅ DEBOUNCE FUNCIÓN MANUAL
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

// 📊 TIPOS E INTERFACES - ACTUALIZADOS AL NUEVO ESQUEMA
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

// ✅ FORMULARIO ACTUALIZADO - CAMPOS REFACTORIZADOS
type FormData = MembershipFormData;

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

// 🎯 ESTADO INICIAL REFACTORIZADO
const initialFormData: FormData = {
  userId: '',
  planId: '',
  paymentType: '',
  couponCode: '',
  notes: '',
  isMixedPayment: false,
  paymentDetails: [],
  isRenewal: false,
  skipInscription: false,
  latestEndDate: null
};

// 🔧 REDUCER REFACTORIZADO
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
        paymentDetails: [],
        isMixedPayment: false,
      };
      
    case 'SET_PLAN':
      return { 
        ...state, 
        planId: action.payload,
        paymentDetails: [],
        isMixedPayment: false,
      };
      
    case 'SET_PAYMENT_TYPE':
      return {
        ...state,
        paymentType: action.payload
      };
      
    case 'TOGGLE_MIXED_PAYMENT':
      const willBeMixed = !state.isMixedPayment;
      return {
        ...state,
        isMixedPayment: willBeMixed,
        paymentDetails: [],
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

    case 'CLEAR_COUPON':
      return {
        ...state,
        couponCode: ''
      };

    case 'UPDATE_PAYMENT_DETAILS':
      return {
        ...state,
        paymentDetails: action.payload,
        isMixedPayment: state.isMixedPayment,
      };

    case 'SET_SINGLE_PAYMENT_DETAIL':
      return {
        ...state,
        paymentDetails: action.payload,
        isMixedPayment: false,
      };
      
    case 'RESET_FORM':
      return initialFormData;
      
    default:
      return state;
  }
};

export const useRegistrarMembresia = () => {
  const supabase = createBrowserSupabaseClient();
  
  // ✅ HOOK ENTERPRISE OBLIGATORIO v6.0 CON addAuditFieldsFor
  const { addAuditFieldsFor, getCurrentUser } = useUserTracking();
  
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
  
  // ✅ CARGAR COMISIONES DINÁMICAMENTE DESDE BD (como PaymentDialog.tsx)
  const {
    data: paymentCommissionsData,
    loading: commissionsLoading,
    error: commissionsError
  } = useEntityCRUD<PaymentCommission>({
    tableName: 'payment_commissions',
    selectQuery: '*'
  });

  // ✅ CONSTANTES PARA LÓGICA DE PAGOS AVANZADA
  const EPSILON = 0.001; // Para comparaciones de punto flotante

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

  // ✅ FUNCIONES DE CÁLCULO DE COMISIONES (como PaymentDialog.tsx)
  const getCommissionRate = useCallback((paymentMethod: string): number => {
    if (commissionsLoading || !paymentCommissionsData || commissionsError) return 0;
    const commission = paymentCommissionsData.find(
      (c: PaymentCommission) => c.payment_method === paymentMethod && c.is_active === true
    );
    if (!commission) return 0;
    return commission.commission_type === 'percentage' ? commission.commission_value : 0;
  }, [paymentCommissionsData, commissionsLoading, commissionsError]);

  const calculateCommission = useCallback((method: string, amount: number) => {
    const rate = getCommissionRate(method);
    const commissionAmount = (amount * rate) / 100;
    return {
      rate,
      amount: Math.round(commissionAmount * 100) / 100
    };
  }, [getCommissionRate]);

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
          notify.error('No hay sesión activa');
          return;
        }

        const { data, error } = await supabase
          .from('Users')
          .select('id, firstName, lastName, email, profilePictureUrl, rol')
          .eq('rol', 'cliente')
          .or(`firstName.ilike.%${searchTerm}%,lastName.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
          .limit(20);

        if (error) {
          const { data: broadData, error: broadError } = await supabase
            .from('Users')
            .select('id, firstName, lastName, email, profilePictureUrl, rol')
            .eq('rol', 'cliente')
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
        notify.error(`Error al buscar usuarios: ${err.message}`);
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
      const { data: memberships, error: membershipsError } = await supabase
        .from('user_memberships')
        .select('id, created_at, status, plan_id, start_date, end_date')
        .eq('userid', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (membershipsError) {
        setUserHistory([]);
        return;
      }

      let formattedHistory: UserMembershipHistory[] = [];
      
      if (memberships && memberships.length > 0) {
        const planIds = [...new Set(memberships.map(m => m.plan_id).filter(Boolean))];
        
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
              plan_name: `Plan ${membership.plan_id?.substring(0, 8) || 'Desconocido'}`,
              end_date: membership.end_date,
              start_date: membership.start_date
            }));
          } else {
            const planMap = new Map((plans || []).map(p => [p.id, p.name]));
            
            formattedHistory = memberships.map(membership => ({
              id: membership.id,
              created_at: membership.created_at,
              status: membership.status || 'unknown',
              plan_name: planMap.get(membership.plan_id) || `Plan ${membership.plan_id?.substring(0, 8) || 'Desconocido'}`,
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
        notify.success('Cliente nuevo detectado: Primera membresía');
      } else {
        notify.success(`Cliente existente: ${formattedHistory.length} membresías previas`);
      }

    } catch (err: any) {
      setUserHistory([]);
      notify.error(`Error cargando historial: ${err.message}`);
      
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

  // ✅ VALIDAR CUPÓN
  const validateCoupon = useCallback(async (code: string) => {
    if (!code.trim()) {
      setAppliedCoupon(null);
      dispatch({ type: 'CLEAR_COUPON' });
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
        notify.error('Cupón no válido o no encontrado');
        setAppliedCoupon(null);
        dispatch({ type: 'CLEAR_COUPON' });
        return;
      }

      const today = getTodayInMexico();
      
      if (data.start_date && today < data.start_date) {
        notify.error('El cupón no está vigente aún');
        setAppliedCoupon(null);
        dispatch({ type: 'CLEAR_COUPON' });
        return;
      }

      if (data.end_date && today > data.end_date) {
        notify.error('El cupón ha expirado');
        setAppliedCoupon(null);
        dispatch({ type: 'CLEAR_COUPON' });
        return;
      }

      if (data.max_uses && data.current_uses >= data.max_uses) {
        notify.error('El cupón ha alcanzado su límite de usos');
        setAppliedCoupon(null);
        dispatch({ type: 'CLEAR_COUPON' });
        return;
      }

      const currentSubtotal = getCurrentSubtotalForCoupon();

      if (data.min_amount && currentSubtotal < data.min_amount) {
        notify.error(`El cupón requiere un monto mínimo de ${formatPrice(data.min_amount)}. Subtotal actual: ${formatPrice(currentSubtotal)}`);
        setAppliedCoupon(null);
        dispatch({ type: 'CLEAR_COUPON' });
        return;
      }

      setAppliedCoupon(data);
      dispatch({ 
        type: 'UPDATE_PAYMENT',
        payload: { couponCode: code.toUpperCase() }
      });
      
      notify.success(`Cupón "${data.code}" aplicado: ${data.discount_type === 'percentage' ? `${data.discount_value}%` : formatPrice(data.discount_value)} de descuento`);
      
    } catch (err: any) {
      notify.error(err.message);
      setAppliedCoupon(null);
      dispatch({ type: 'CLEAR_COUPON' });
    }
  }, [supabase, formatPrice, dispatch]);

  const getCurrentSubtotalForCoupon = useCallback(() => {
    if (!selectedPlan || !formData.paymentType) {
      return 0;
    }

    const paymentTypeData = paymentTypes.find(pt => pt.value === formData.paymentType);
    if (!paymentTypeData) return 0;

    const planPrice = selectedPlan[paymentTypeData.key as keyof Plan] as number;
    const inscription = (formData.skipInscription || formData.isRenewal) ? 0 : (selectedPlan.inscription_price || 0);
    
    return planPrice + inscription;
  }, [selectedPlan, formData.paymentType, formData.skipInscription, formData.isRenewal]);

  const recalculateMixedPaymentDetails = useCallback((details: PaymentDetail[]): PaymentDetail[] => {
    if (!details || details.length === 0) {
      return [];
    }

    const sortedDetails = [...details]
      .map((detail, index) => ({
        ...detail,
        sequence: index + 1
      }));

    let remainingNet = totalAmount;

    const recalculated = sortedDetails.map((detail, index) => {
      if (!detail.method) {
        return detail;
      }

      const updatedDetail = { ...detail };

      if (index === 0) {
        const commission = calculateCommission(updatedDetail.method, updatedDetail.amount || 0);
        updatedDetail.commission_rate = commission.rate;
        updatedDetail.commission_amount = commission.amount;
      } else {
        const commissionRate = getCommissionRate(updatedDetail.method);
        let grossAmount = remainingNet;

        if (commissionRate > 0 && remainingNet > EPSILON) {
          grossAmount = remainingNet / (1 - commissionRate / 100);
        }

        grossAmount = remainingNet <= EPSILON ? 0 : Math.round(grossAmount * 100) / 100;
        updatedDetail.amount = grossAmount;

        const commission = calculateCommission(updatedDetail.method, updatedDetail.amount || 0);
        updatedDetail.commission_rate = commission.rate;
        updatedDetail.commission_amount = commission.amount;
      }

      const netContribution = Math.max(0, (updatedDetail.amount || 0) - (updatedDetail.commission_amount || 0));
      remainingNet = Math.max(0, remainingNet - netContribution);

      if (remainingNet <= EPSILON) {
        remainingNet = 0;
      }

      return updatedDetail;
    });

    return recalculated;
  }, [calculateCommission, getCommissionRate, totalAmount, EPSILON]);

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

    const updatedDetails = [...formData.paymentDetails, newDetail];
    const recalculated = recalculateMixedPaymentDetails(updatedDetails);

    dispatch({
      type: 'UPDATE_PAYMENT_DETAILS',
      payload: recalculated
    });
  }, [formData.paymentDetails, recalculateMixedPaymentDetails]);

  const removeMixedPaymentDetail = useCallback((id: string) => {
    const filteredDetails = formData.paymentDetails.filter(detail => detail.id !== id);
    const recalculated = recalculateMixedPaymentDetails(filteredDetails);

    dispatch({
      type: 'UPDATE_PAYMENT_DETAILS',
      payload: recalculated
    });
  }, [formData.paymentDetails, recalculateMixedPaymentDetails]);

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

    const recalculated = recalculateMixedPaymentDetails(updatedDetails);

    dispatch({
      type: 'UPDATE_PAYMENT_DETAILS',
      payload: recalculated
    });
  }, [formData.paymentDetails, calculateCommission, recalculateMixedPaymentDetails]);

  // ✅ CÁLCULOS DE MEMBRESÍA
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
    const newDiscount = Math.min(discount, newSubtotal + newInscription);
    const newTotal = newSubtotal + newInscription - newDiscount;

    const commissionFromDetails = formData.paymentDetails.reduce((sum, detail) => {
      return sum + (detail.commission_amount || 0);
    }, 0);

    const newCommission = Math.round(commissionFromDetails * 100) / 100;
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
    formData.paymentDetails
  ]);

  // ✅ ACTUALIZAR ESTADOS DE CÁLCULO
  useEffect(() => {
    setSubtotal(membershipCalculations.subtotal);
    setInscriptionAmount(membershipCalculations.inscription);
    setDiscountAmount(membershipCalculations.discount);
    setCommissionAmount(membershipCalculations.commission);
    setTotalAmount(membershipCalculations.total);
    setFinalAmount(membershipCalculations.final);
  }, [membershipCalculations]);

  // ✅ CALCULAR FECHA DE VENCIMIENTO
  const calculateEndDate = useCallback((): string => {
    if (!selectedPlan || !formData.paymentType) return '';

    const paymentTypeData = paymentTypes.find(pt => pt.value === formData.paymentType);
    if (!paymentTypeData || paymentTypeData.value === 'visit') return '';

    let startDateString: string;
    
    if (formData.isRenewal && formData.latestEndDate) {
      startDateString = calculateRenewalStartDate(formData.latestEndDate);
    } else {
      startDateString = getTodayInMexico();
    }
    
    return calculateMembershipEndDate(startDateString, formData.paymentType, selectedPlan);
  }, [selectedPlan, formData.paymentType, formData.isRenewal, formData.latestEndDate]);

  // ✅ VALIDAR PAGO
  const validatePayment = useCallback((): boolean => {
    if (finalAmount <= 0) {
      return true; 
    }

    if (formData.isMixedPayment) {
      if (formData.paymentDetails.length === 0) {
        notify.error('Debe agregar al menos un método de pago para pagos mixtos');
        return false;
      }
      
      const invalidDetails = formData.paymentDetails.filter(detail => 
        !detail.method || detail.amount <= 0
      );
      
      if (invalidDetails.length > 0) {
        notify.error('Todos los métodos de pago deben tener método seleccionado y monto mayor a cero');
        return false;
      }
    }

    const totalPaid = formData.paymentDetails.reduce((sum, detail) => 
      sum + (detail.amount || 0),
    0);

    if (formData.paymentDetails.length > 0 && Math.abs(totalPaid - finalAmount) > 0.01) {
      notify.error(`El total de pagos (${formatPrice(totalPaid)}) debe coincidir con el total (${formatPrice(finalAmount)})`);
      return false;
    }

    return true;
  }, [formData.isMixedPayment, formData.paymentDetails, finalAmount, formatPrice]);

  // ✅ PROCESAR VENTA - REFACTORIZADO NUEVO ESQUEMA BD
  const handleSubmit = useCallback(async () => {
    setLoading(true);
    
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) throw new Error('Usuario no autenticado');

      if (!selectedUser || !selectedPlan || !formData.paymentType) {
        throw new Error('Debe completar todos los campos obligatorios');
      }
      
      if (!validatePayment()) {
        return false;
      }

      const startDate = (formData.isRenewal && formData.latestEndDate)
        ? calculateRenewalStartDate(formData.latestEndDate)
        : getTodayInMexico();
        
      const endDate = calculateMembershipEndDate(startDate, formData.paymentType, selectedPlan);

      // ✅ PASO 1: INSERTAR REGISTRO PRINCIPAL - ESQUEMA NUEVO
      const baseMembershipData = {
    userid: selectedUser.id,
    plan_id: selectedPlan.id,
    start_date: startDate,
    end_date: endDate,
    payment_type: formData.paymentType,
    status: 'active',
    is_renewal: formData.isRenewal,
    notes: formData.notes || null,
    total_amount: finalAmount,          // ✅ Incluye comisiones
    paid_amount: finalAmount,           // ✅ Monto efectivamente cobrado
    pending_amount: 0,                  // ✅ NUEVO CAMPO
    inscription_amount: inscriptionAmount,
    coupon_code: appliedCoupon?.code || null,
    skip_inscription: formData.skipInscription,
      };

      // ✅ APLICAR AUDITORÍA v6.0
      const membershipDataWithAudit = await addAuditFieldsFor('user_memberships', baseMembershipData, false);
      
      const { data: newMembership, error: membershipError } = await supabase
        .from('user_memberships')
        .insert(membershipDataWithAudit)
        .select('id')
        .single();

      if (membershipError) throw membershipError;
      if (!newMembership || !newMembership.id) throw new Error('No se pudo crear el registro de membresía.');

      // ✅ PASO 2: INSERTAR DETALLES DE PAGO - LÓGICA AVANZADA (como PaymentDialog.tsx)
      const paymentDetailsToInsert = await Promise.all(
        formData.paymentDetails.map(async (detail, index) => {
          const commissionRate = getCommissionRate(detail.method);
          const commissionAmount = (detail.amount || 0) * commissionRate / 100;
          
          const baseData = {
            membership_id: newMembership.id,
            payment_method: detail.method,
            amount: Math.round((detail.amount || 0) * 100) / 100,
            payment_reference: detail.reference || null,
            commission_rate: commissionRate,
            commission_amount: Math.round(commissionAmount * 100) / 100,
            sequence_order: index + 1
          };

          // Aplicar auditoría created_by para membership_payment_details
          return await addAuditFieldsFor('membership_payment_details', baseData, false);
        })
      );

      const { error: paymentDetailsError } = await supabase
        .from('membership_payment_details')
        .insert(paymentDetailsToInsert);

      if (paymentDetailsError) {
        await supabase.from('user_memberships').delete().eq('id', newMembership.id);
        throw paymentDetailsError;
      }

      // ✅ ACTUALIZAR CUPÓN
      if (appliedCoupon) {
        const couponUpdateData = await addAuditFieldsFor('coupons', { 
          current_uses: appliedCoupon.current_uses + 1
        }, true);
        
        const { error: couponError } = await supabase
          .from('coupons')
          .update(couponUpdateData)
          .eq('id', appliedCoupon.id);
          
        if (couponError) {
          console.error('Error actualizando cupón:', couponError);
        }
      }

      // ✅ PROCESAR RENOVACIÓN
      if (formData.isRenewal) {
        const today = getTodayInMexico();
        const renewalUpdateData = await addAuditFieldsFor('user_memberships', { 
          status: 'expired',
          notes: `Expirada por renovación el ${today}`
        }, true);
        
        const { error: updateError } = await supabase
          .from('user_memberships')
          .update(renewalUpdateData)
          .eq('userid', selectedUser.id)
          .eq('status', 'active')
          .neq('id', newMembership.id); // ✅ Excluir la nueva
          
        if (updateError) {
          console.warn('Warning al actualizar membresías previas:', updateError);
        }
      }

      // ✅ MENSAJE DE ÉXITO
      let successMsg;
      if (formData.paymentType === 'visit') {
        successMsg = `🎉 ¡Visita registrada! ${selectedUser.firstName} tiene acceso HOY`;
      } else {
        const endDateFormatted = formatDateLong(endDate);
        successMsg = formData.isRenewal 
          ? `🎉 ¡Renovación exitosa! La membresía de ${selectedUser.firstName} ha sido extendida hasta el ${endDateFormatted}`
          : `🎉 ¡Membresía registrada! ${selectedUser.firstName} tiene acceso hasta el ${endDateFormatted}`;
      }

      if (appliedCoupon && discountAmount > 0) {
        successMsg += `\n💰 Descuento aplicado: ${formatPrice(discountAmount)}`;
      }
        
      notify.success(successMsg);

      // ✅ ENVIAR WHATSAPP AL CLIENTE CON DETALLES DE LA MEMBRESÍA
      try {
        console.log('📱 Enviando WhatsApp al cliente...');
        const whatsappResponse = await fetch('/api/send-membership-whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            membershipId: newMembership.id,
            isRenewal: formData.isRenewal
          })
        });

        const whatsappData = await whatsappResponse.json();
        
        if (whatsappData.success) {
          console.log('✅ WhatsApp enviado exitosamente:', whatsappData.messageSid);
          notify.success(`📱 WhatsApp de confirmación enviado a ${selectedUser.firstName}`);
        } else {
          console.warn('⚠️ No se pudo enviar WhatsApp:', whatsappData.message);
          // No mostramos error al usuario para no interrumpir el flujo
        }
      } catch (whatsappError) {
        console.error('❌ Error al enviar WhatsApp (no crítico):', whatsappError);
        // No afecta el registro de la membresía
      }

      setLoading(false);
      return true;

    } catch (err: any) {
      notify.error(`Error al procesar la venta: ${err.message || 'Error desconocido'}`);
      setLoading(false);
      return false;
    } finally {
      setConfirmDialogOpen(false);
    }
  }, [
    supabase,
    addAuditFieldsFor,
    getCurrentUser,
    selectedUser,
    selectedPlan,
    formData,
    validatePayment,
    finalAmount,
    totalAmount,
    inscriptionAmount,
    discountAmount,
    appliedCoupon,
    formatPrice,
    getCommissionRate
  ]);

  // ✅ VALIDAR SI PUEDE PROCEDER AL SIGUIENTE PASO
  const canProceedToNextStep = useCallback(() => {
    switch (activeStep) {
      case 0: return selectedUser !== null;
      case 1: return selectedPlan !== null && formData.paymentType !== '';
      case 2: return true;
      case 3: 
        if (formData.isMixedPayment) {
          return formData.paymentDetails.length > 0 && 
                 formData.paymentDetails.every(detail => detail.amount > 0 && detail.method);
        } else {
          return formData.paymentDetails.length > 0;
        }
      default: return false;
    }
  }, [activeStep, selectedUser, selectedPlan, formData]);

  // ✅ FUNCIÓN PARA RESETEAR FORMULARIO
  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM' });
    setSelectedUser(null);
    setSelectedPlan(null);
    setAppliedCoupon(null);
    setUserHistory([]);
    setActiveStep(0);
    notify.success('Formulario reiniciado');
  }, [dispatch]);

  // ✅ CARGAR DATOS INICIAL
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

        notify.success('Datos cargados correctamente');

      } catch (err: any) {
        notify.error(`Error cargando datos: ${err.message}`);
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
    
    // ✅ NUEVOS ESTADOS PARA LÓGICA DE PAGOS AVANZADA
    commissionsLoading,
    commissionsError,
    
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
    getCommissionRate,
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