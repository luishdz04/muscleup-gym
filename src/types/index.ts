// ✅ TIPOS EXACTOS SEGÚN EL ESQUEMA DE SUPABASE - ACTUALIZADOS CON EXTENSIONES POS

export interface User {
    id: string;
    firstName: string;
    lastName?: string;
    email?: string;
    password?: string;
    whatsapp?: string;
    birthDate?: string;
    gender?: string;
    maritalStatus?: string;
    isMinor?: boolean;
    createdAt?: string;
    profilePictureUrl?: string;
    signatureUrl?: string;
    contractPdfUrl?: string;
    emailSent?: boolean;
    emailSentAt?: string;
    whatsappSent?: boolean;
    whatsappSentAt?: string;
    rol?: string;
    fingerprint?: boolean;
  }
  
  export interface Product {
    id: string;
    name: string;
    description?: string;
    sku?: string;
    barcode?: string;
    category: string;
    subcategory?: string;
    brand?: string;
    cost_price: number;
    sale_price: number;
    profit_margin?: number;
    current_stock: number;
    min_stock: number;
    max_stock?: number;
    unit: string;
    supplier_id?: string;
    image_url?: string;
    images?: any[];
    is_active?: boolean;
    is_taxable?: boolean;
    tax_rate?: number;
    variants?: any[];
    location?: string;
    expiry_date?: string;
    created_at?: string;
    created_by?: string;
    updated_at?: string;
    updated_by?: string;
    // Relación con supplier
    suppliers?: Supplier;
  }
  
  export interface Supplier {
    id: string;
    company_name: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    website?: string;
    rfc?: string;
    address?: any;
    payment_terms?: string;
    credit_limit?: number;
    current_balance?: number;
    rating?: number;
    is_active?: boolean;
    categories?: any[];
    delivery_time?: number;
    notes?: string;
    documents?: any[];
    created_at?: string;
    created_by?: string;
    updated_at?: string;
    updated_by?: string;
  }
  
  export interface InventoryMovement {
    id: string;
    product_id: string;
    movement_type: 'entrada' | 'salida' | 'ajuste' | 'transferencia';
    quantity: number;
    previous_stock: number;
    new_stock: number;
    unit_cost?: number;
    total_cost?: number;
    reason?: string;
    reference_id?: string;
    notes?: string;
    created_at?: string;
    created_by?: string;
    // Relaciones
    products?: {
      id: string;
      name: string;
      sku?: string;
      unit: string;
      is_active?: boolean;
      category?: string;
      brand?: string;
    };
    Users?: {
      firstName: string;
      lastName?: string;
    };
  }
  
  // ✅ SALE EXTENDIDO CON CAMPOS DEL NUEVO SISTEMA
  export interface Sale {
    id: string;
    sale_number: string;
    customer_id?: string;
    cashier_id: string;
    sale_type: 'normal' | 'layaway';
    subtotal: number;
    tax_amount?: number;
    discount_amount?: number;
    coupon_discount?: number;
    coupon_code?: string;
    total_amount: number;
    required_deposit?: number;
    paid_amount?: number;
    pending_amount?: number;
    deposit_percentage?: number;
    layaway_expires_at?: string;
    status: 'completed' | 'pending' | 'cancelled' | 'refunded' | 'expired';
    payment_status: 'paid' | 'partial' | 'pending';
    is_mixed_payment?: boolean;
    payment_received?: number;
    change_amount?: number;
    commission_rate?: number;
    commission_amount?: number;
    notes?: string;
    receipt_printed?: boolean;
    created_at?: string;
    completed_at?: string;
    updated_at?: string;
    // ✅ NUEVOS CAMPOS EXTENDIDOS
    custom_commission_rate?: number;
    skip_inscription?: boolean;
    payment_date?: string;
  }
  
  export interface SaleItem {
    id: string;
    sale_id: string;
    product_id: string;
    product_name: string;
    product_sku?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    discount_amount?: number;
    tax_rate?: number;
    tax_amount?: number;
    created_at?: string;
  }
  
  export interface Coupon {
    id: string;
    code: string;
    description?: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_amount?: number;
    max_uses?: number;
    current_uses?: number;
    start_date?: string;
    end_date?: string;
    is_active?: boolean;
    created_at?: string;
    created_by?: string;
    updated_at?: string;
  }
  
  // ✅ NUEVAS INTERFACES PARA EL SISTEMA DE PAGOS AVANZADO
  export interface PaymentCommission {
    id: string;
    payment_method: string;
    commission_type: 'percentage' | 'fixed';
    commission_value: number;
    min_amount: number;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
    created_by?: string;
  }
  
  export interface PaymentDetail {
    id: string;
    method: string;
    amount: number;
    commission_rate: number;
    commission_amount: number;
    reference: string;
    sequence: number;
  }
  
  // ✅ SALE PAYMENT DETAILS EXTENDIDO
  export interface SalePaymentDetails {
    id: string;
    sale_id: string;
    payment_method: string;
    amount: number;
    payment_reference?: string;
    commission_rate: number;
    commission_amount: number;
    sequence_order: number;
    payment_date: string;
    created_at: string;
    created_by: string;
  }
  
  // ✅ LAYAWAY PAYMENTS PARA APARTADOS
  export interface LayawayPayment {
    id: string;
    sale_id: string;
    payment_amount: number;
    payment_method: string;
    payment_reference?: string;
    commission_rate: number;
    commission_amount: number;
    previous_paid_amount: number;
    new_paid_amount: number;
    remaining_amount: number;
    notes?: string;
    processed_by: string;
    created_at: string;
  }
  
  // ✅ CONFIGURACIÓN DE MÉTODOS DE PAGO
  export interface PaymentMethodConfig {
    value: string;
    label: string;
    icon: string;
    color: string;
    description: string;
    defaultCommission: number;
  }
  
  // ✅ FORMULARIO PARA EL NUEVO PAYMENTDIALOG
  export interface PaymentFormData {
    paymentMethod: string;
    paymentReference: string;
    isMixedPayment: boolean;
    paymentDetails: PaymentDetail[];
    paymentReceived: number;
    paymentChange: number;
    customCommissionRate: number | null;
    editingCommission: boolean;
    notes: string;
  }
  
  // ✅ FORMULARIO PARA LAYAWAY MEJORADO
  export interface LayawayFormData {
    depositPercentage: number;
    customDeposit: boolean;
    depositAmount: number;
    layawayPeriod: number;
    customPeriod: boolean;
    expirationDate: string;
    paymentMethod: string;
    paymentReference: string;
    cashAmount: number;
    cardAmount: number;
    transferAmount: number;
    qrAmount: number;
    notes: string;
    requireFullPayment: boolean;
  }
  
  // Interfaces existentes para el POS (mantener compatibilidad)
  export interface CartItem {
    product: Product;
    quantity: number;
    unit_price: number;
    total_price: number;
    discount_amount: number;
    tax_amount: number;
  }
  
  export interface CartTotals {
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    couponDiscount: number;
    total: number;
  }
  
  export interface Customer extends User {
    name: string; // firstName + lastName
    phone?: string;
    membership_type?: string;
    points_balance?: number;
    total_purchases?: number;
  }
  
  export interface InventoryStats {
    totalProducts: number;
    totalValue: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    recentMovements: number;
    totalMovements: number;
  }
  
  export interface SalesStats {
    dailySales: number;
    dailyTransactions: number;
    avgTicket: number;
    topProducts: any[];
  }
  
  // ✅ NUEVAS INTERFACES PARA MEMBRESÍAS (SI LAS NECESITAS EN EL FUTURO)
  export interface MembershipPlan {
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
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
  }
  
  export interface UserMembership {
    id: string;
    userid: string;
    planid: string;
    payment_type: string;
    amount_paid: number;
    inscription_amount: number;
    start_date: string;
    end_date?: string;
    status: 'active' | 'expired' | 'frozen' | 'cancelled';
    total_visits?: number;
    remaining_visits?: number;
    payment_method: string;
    payment_reference?: string;
    discount_amount: number;
    coupon_code?: string;
    subtotal: number;
    commission_rate: number;
    commission_amount: number;
    payment_received: number;
    payment_change: number;
    is_mixed_payment: boolean;
    payment_details?: PaymentDetail[];
    is_renewal: boolean;
    skip_inscription: boolean;
    custom_commission_rate?: number;
    notes?: string;
    created_at?: string;
    updated_at?: string;
    created_by?: string;
  }
  
  // ✅ TIPOS PARA VALIDACIONES Y ERRORES
  export interface ValidationErrors {
    [key: string]: string;
  }
  
  export interface ApiResponse<T> {
    data?: T;
    error?: string;
    success: boolean;
    message?: string;
  }
  
  // ✅ TIPOS PARA CONFIGURACIÓN DEL SISTEMA
  export interface SystemConfig {
    pos: {
      taxRate: number;
      defaultCommissions: PaymentMethodConfig[];
      allowMixedPayments: boolean;
      allowCustomCommissions: boolean;
      requirePaymentReference: string[]; // métodos que requieren referencia
    };
    layaway: {
      minDepositPercentage: number;
      maxDepositPercentage: number;
      defaultPeriodDays: number;
      maxPeriodDays: number;
      allowCustomDeposit: boolean;
      allowCustomPeriod: boolean;
    };
    memberships: {
      allowSkipInscription: boolean;
      allowCustomCommissions: boolean;
      autoDetectRenewals: boolean;
      defaultInscriptionBehavior: 'include' | 'skip';
    };
  }
  
  // ✅ TIPOS PARA REPORTES Y ANALYTICS
  export interface SalesReport {
    period: string;
    totalSales: number;
    totalTransactions: number;
    averageTicket: number;
    totalCommissions: number;
    paymentMethodBreakdown: {
      method: string;
      count: number;
      amount: number;
      commissions: number;
    }[];
    topProducts: {
      product_id: string;
      product_name: string;
      quantity_sold: number;
      revenue: number;
    }[];
  }
  
  export interface CommissionReport {
    period: string;
    totalCommissions: number;
    commissionsByMethod: {
      method: string;
      count: number;
      totalAmount: number;
      totalCommissions: number;
      averageRate: number;
    }[];
    customCommissionCount: number;
    customCommissionAmount: number;
  }
  
  // ✅ TIPOS PARA ESTADOS DE LOADING Y UI
  export interface LoadingStates {
    loading: boolean;
    loadingProducts: boolean;
    loadingCommissions: boolean;
    loadingCustomers: boolean;
    processing: boolean;
    saving: boolean;
  }
  
  export interface UIStates {
    activeStep: number;
    confirmDialogOpen: boolean;
    customerSelectorOpen: boolean;
    paymentDialogOpen: boolean;
    layawayDialogOpen: boolean;
    editingCommission: boolean;
    showAdvancedOptions: boolean;
  }
  
  // ✅ CONSTANTES ÚTILES
  export const PAYMENT_METHODS = [
    'efectivo',
    'debito', 
    'credito',
    'transferencia'
  ] as const;
  
  export const SALE_STATUSES = [
    'completed',
    'pending', 
    'cancelled',
    'refunded',
    'expired'
  ] as const;
  
  export const PAYMENT_STATUSES = [
    'paid',
    'partial',
    'pending'
  ] as const;
  
  export const MEMBERSHIP_STATUSES = [
    'active',
    'expired',
    'frozen',
    'cancelled'
  ] as const;
  
  export const COMMISSION_TYPES = [
    'percentage',
    'fixed'
  ] as const;
  
  export const DISCOUNT_TYPES = [
    'percentage',
    'fixed'
  ] as const;
  
  // ✅ TYPE GUARDS PARA VALIDACIONES
  export const isPaymentMethod = (value: string): value is typeof PAYMENT_METHODS[number] => {
    return PAYMENT_METHODS.includes(value as any);
  };
  
  export const isSaleStatus = (value: string): value is typeof SALE_STATUSES[number] => {
    return SALE_STATUSES.includes(value as any);
  };
  
  export const isPaymentStatus = (value: string): value is typeof PAYMENT_STATUSES[number] => {
    return PAYMENT_STATUSES.includes(value as any);
  };
  
  export const isMembershipStatus = (value: string): value is typeof MEMBERSHIP_STATUSES[number] => {
    return MEMBERSHIP_STATUSES.includes(value as any);
  };
  
  // ✅ UTILIDADES DE TIPOS
  export type PaymentMethodType = typeof PAYMENT_METHODS[number];
  export type SaleStatusType = typeof SALE_STATUSES[number];
  export type PaymentStatusType = typeof PAYMENT_STATUSES[number];
  export type MembershipStatusType = typeof MEMBERSHIP_STATUSES[number];
  export type CommissionType = typeof COMMISSION_TYPES[number];
  export type DiscountType = typeof DISCOUNT_TYPES[number];