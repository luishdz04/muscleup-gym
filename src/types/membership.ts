// types/membership.ts - v6.0 INTERFACES ACTUALIZADAS ESQUEMA BD

// ✅ MEMBRESÍA DE USUARIO - ESQUEMA v6.0 ACTUALIZADO
export interface UserMembership {
  // Identificadores
  id: string;
  userid: string;
  plan_id: string; // ✅ Unificado (planid ELIMINADO)
  
  // Estado y fechas
  status: 'active' | 'expired' | 'frozen' | 'cancelled';
  start_date: string; // DATE 'YYYY-MM-DD'
  end_date: string | null; // DATE 'YYYY-MM-DD'
  
  // Congelamiento (esquema v6.0)
  freeze_start_date?: string | null; // DATE
  unfreeze_date?: string | null; // DATE (freeze_end_date ELIMINADO)
  freeze_reason?: string | null;
  total_frozen_days?: number;
  
  // Tipo de pago
  payment_type: 'visit' | 'weekly' | 'biweekly' | 'monthly' | 'bimonthly' | 'quarterly' | 'semester' | 'annual';
  
  // Montos (esquema v6.0 actualizado)
  paid_amount: number; // ✅ NUEVO (reemplaza amount_paid)
  total_amount: number; // ✅ NUEVO (monto total sin comisiones)
  pending_amount: number; // ✅ NUEVO (saldo pendiente)
  inscription_amount?: number;
  
  // Renovación y cupones
  is_renewal: boolean;
  skip_inscription: boolean;
  coupon_code?: string | null;
  
  // Notas
  notes?: string | null;
  
  // Auditoría (timestamp with time zone UTC)
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  
  // Relaciones (opcional, para joins)
  Users?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePictureUrl?: string;
  };
  membership_plans?: MembershipPlan;
}

// ✅ PLAN DE MEMBRESÍA
export interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  
  // Precios por tipo de pago
  inscription_price: number;
  visit_price: number;
  weekly_price: number;
  biweekly_price: number;
  monthly_price: number;
  bimonthly_price: number;
  quarterly_price: number;
  semester_price: number;
  annual_price: number;
  
  // Duraciones (en días)
  weekly_duration: number;
  biweekly_duration: number;
  monthly_duration: number;
  bimonthly_duration: number;
  quarterly_duration: number;
  semester_duration: number;
  annual_duration: number;
  
  // Estado
  is_active: boolean;
  
  // Auditoría (full_camel según configuración)
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

// ✅ HISTORIAL COMPLETO DE MEMBRESÍA PARA UI
export interface MembershipHistory {
  id: string;
  userid: string;
  plan_id: string;
  plan_name: string;
  payment_type: PaymentType | string;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  inscription_amount: number;
  discount_amount: number;
  subtotal: number;
  commission_rate: number;
  commission_amount: number;
  amount_paid: number; // Alias para compatibilidad con componentes legacy
  payment_method: string;
  payment_reference: string | null;
  payment_received: number;
  payment_change: number;
  is_mixed_payment: boolean;
  is_renewal: boolean;
  custom_commission_rate: number | null;
  skip_inscription: boolean;
  status: MembershipStatus | string;
  start_date: string;
  end_date: string | null;
  freeze_date: string | null;
  unfreeze_date: string | null;
  total_frozen_days: number;
  created_at: string;
  updated_at: string;
  notes: string | null;
  coupon_code: string | null;
  payment_details: PaymentDetail[];
  primary_payment_method?: string;
  payment_method_breakdown?: string;
  user_name: string;
  user_email: string;
  user_profile_image?: string;
}

// ✅ PLAN LIGERO PARA UI (selectores)
export interface Plan {
  id: string;
  name: string;
  description: string;
}

// ✅ DETALLES DE PAGO DE MEMBRESÍA - NUEVA TABLA v6.0
export interface MembershipPaymentDetail {
  id: string;
  membership_id: string;
  
  // Método de pago
  payment_method: 'efectivo' | 'debito' | 'credito' | 'transferencia' | string;
  amount: number;
  
  // Comisiones
  commission_rate: number;
  commission_amount: number;
  
  // Referencia y orden
  payment_reference?: string | null;
  sequence_order?: number;
  
  // Auditoría (created_only según configuración)
  created_at?: string;
  created_by?: string;
}

// ✅ CUPÓN
export interface Coupon {
  id: string;
  code: string;
  description: string;
  
  // Descuento
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  
  // Restricciones
  min_amount: number;
  max_uses: number;
  current_uses: number;
  
  // Vigencia
  start_date: string;
  end_date: string;
  
  // Estado
  is_active: boolean;
  
  // Auditoría (created_only según configuración)
  created_at?: string;
  created_by?: string;
}

// ✅ COMISIÓN DE PAGO
export interface PaymentCommission {
  id: string;
  payment_method: string;
  
  // Tipo de comisión
  commission_type: 'percentage' | 'fixed';
  commission_value: number;
  
  // Restricciones
  min_amount: number;
  
  // Estado
  is_active: boolean;
  
  // Auditoría (created_only según configuración)
  created_at?: string;
  created_by?: string;
}

// ✅ ESTADÍSTICAS DE MEMBRESÍAS
export interface MembershipStats {
  total: number;
  active: number;
  expired: number;
  frozen: number;
  revenue_this_month: number;
  new_this_month: number;
  expiring_soon: number;
}

// ✅ HISTORIAL DE MEMBRESÍA (para UI)
export interface UserMembershipHistory {
  id: string;
  created_at: string;
  status: string;
  plan_name: string;
  end_date: string | null;
  start_date: string;
}

// ✅ DETALLE DE PAGO (para formulario UI)
export interface PaymentDetail {
  id: string;
  method: 'efectivo' | 'debito' | 'credito' | 'transferencia' | string;
  amount: number;
  commission_rate: number;
  commission_amount: number;
  reference?: string | null;
  sequence: number;
  created_at?: string;
}

// ✅ TIPOS DE PAGO DISPONIBLES
export type PaymentType = 'visit' | 'weekly' | 'biweekly' | 'monthly' | 'bimonthly' | 'quarterly' | 'semester' | 'annual';

export interface PaymentTypeOption {
  value: PaymentType;
  label: string;
  key: keyof MembershipPlan;
  duration: number | keyof MembershipPlan;
}

// ✅ FORMULARIO DE REGISTRO DE MEMBRESÍA
export interface MembershipFormData {
  userId: string;
  planId: string;
  paymentType: PaymentType | '';
  couponCode: string;
  notes: string;
  isMixedPayment: boolean;
  paymentDetails: PaymentDetail[];
  isRenewal: boolean;
  skipInscription: boolean;
  latestEndDate: string | null;
}

// ✅ ESTADO DE MEMBRESÍA
export type MembershipStatus = 'active' | 'expired' | 'frozen' | 'cancelled';

// ✅ MÉTODO DE PAGO
export type PaymentMethod = 'efectivo' | 'debito' | 'credito' | 'transferencia';

// ✅ TIPO DE DESCUENTO
export type DiscountType = 'percentage' | 'fixed';

// ✅ TIPO DE COMISIÓN
export type CommissionType = 'percentage' | 'fixed';

// ✅ OPCIONES DE ESTADO PARA TABLAS Y FILTROS
export interface StatusOption {
  value: string;
  label: string;
  color: string;
  icon: string;
  description?: string;
}

// ✅ OPCIONES DE MÉTODO DE PAGO PARA UI
export interface PaymentMethodOption {
  value: string;
  label: string;
  icon: string;
  color?: string;
  description?: string;
  hasCommission?: boolean;
}

// ✅ FILTROS PARA HISTORIAL DE MEMBRESÍAS
export interface Filters {
  searchTerm: string;
  status: string;
  paymentMethod: string;
  dateFrom: string;
  dateTo: string;
  planId: string;
  isRenewal: string;
}

// ✅ DATOS DEL FORMULARIO DE EDICIÓN DE MEMBRESÍA
export interface EditFormData {
  status: string;
  planId: string;
  paymentMethod: string;
  paymentType: string;
  start_date: string;
  end_date: string;
  amount_paid: number;
  subtotal: number;
  inscription_amount: number;
  discount_amount: number;
  commission_amount: number;
  commission_rate: number;
  isRenewal: boolean;
  skipInscription: boolean;
  isMixedPayment: boolean;
  paymentDetails: PaymentDetail[];
  paymentReceived: number;
  paymentChange: number;
  payment_reference: string;
  couponCode: string;
  notes: string;
  extend_days: number;
}