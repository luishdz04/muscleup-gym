// types/pos.ts - TIPOS CORREGIDOS SEGÚN ESQUEMA BD REAL MUSCLEUP v7.0

// ✅ INTERFAZ SALE SEGÚN SCHEMA BD REAL (42 CAMPOS)
export interface Sale {
  id: string;
  sale_number: string; // UNIQUE - generado automáticamente
  customer_id?: string; // FK a Users
  cashier_id: string; // FK a Users - REQUIRED
  sale_type: 'sale' | 'layaway'; // NO CAMBIA durante ciclo de vida
  
  // TOTALES
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  coupon_discount: number;
  coupon_code?: string; // FK a coupons
  total_amount: number;
  
  // APARTADOS ESPECÍFICOS
  required_deposit?: number;
  paid_amount: number;
  pending_amount?: number;
  deposit_percentage?: number;
  layaway_expires_at?: string; // timestamp
  
  // ESTADOS
  status: 'completed' | 'pending' | 'cancelled' | 'refunded' | 'expired';
  payment_status: 'paid' | 'partial' | 'pending';
  
  // PAGOS MIXTOS
  is_mixed_payment: boolean;
  payment_received: number;
  change_amount: number;
  
  // COMISIONES
  commission_rate: number;
  commission_amount: number;
  custom_commission_rate?: number;
  
  // METADATA
  notes?: string;
  receipt_printed: boolean;
  email_sent: boolean;
  
  // TIMESTAMPS - AUDITORÍA updated_only según useUserTracking v7.0
  created_at: string;
  updated_at: string;
  completed_at?: string;
  payment_date?: string;
  
  // CANCELACIONES
  cancellation_date?: string;
  cancellation_reason?: string;
  cancelled_by?: string; // FK a Users
  refund_amount: number;
  refund_method?: string;
  cancellation_fee: number;
  
  // PLANES DE PAGO
  payment_plan_days?: number;
  initial_payment: number;
  expiration_date?: string; // date
  last_payment_date?: string; // timestamp
  
  // AUDITORÍA
  updated_by?: string; // FK a Users - updated_only
  
  // CAMPOS HEREDADOS
  skip_inscription: boolean;
}

// ✅ SALE_ITEMS SEGÚN SCHEMA BD REAL
export interface SaleItem {
  id: string;
  sale_id: string; // FK a sales
  product_id: string; // FK a products
  product_name: string; // Snapshot del nombre
  product_sku?: string; // Snapshot del SKU
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_amount: number;
  tax_rate: number; // Porcentaje
  tax_amount: number;
  created_at: string;
}

// ✅ SALE_PAYMENT_DETAILS SEGÚN SCHEMA BD REAL
export interface SalePaymentDetail {
  id: string;
  sale_id: string; // FK a sales
  payment_method: string; // 'efectivo', 'transferencia', 'debito', 'credito', 'mixto'
  amount: number;
  payment_reference?: string;
  commission_rate: number;
  commission_amount: number;
  sequence_order: number; // Para pagos múltiples
  payment_date: string; // timestamp
  created_at: string;
  created_by?: string; // FK a Users
  is_partial_payment: boolean;
  payment_sequence: number;
  notes?: string;
}

// ✅ INVENTORY_MOVEMENTS SEGÚN SCHEMA BD REAL
export interface InventoryMovement {
  id: string;
  product_id: string; // FK a products
  movement_type: 'entrada' | 'salida' | 'ajuste' | 'transfer';
  quantity: number; // Positivo o negativo según tipo
  previous_stock: number;
  new_stock: number;
  unit_cost: number;
  total_cost: number;
  reason: string; // 'Venta POS' | 'Apartado - Reserva' | 'Cancelación venta' | etc.
  reference_id?: string; // FK a sales.id o purchase_orders.id
  notes?: string;
  created_at: string;
  created_by?: string; // FK a Users
}

// ✅ LAYAWAY_STATUS_HISTORY SEGÚN SCHEMA BD REAL
export interface LayawayStatusHistory {
  id: string;
  layaway_id: string; // FK a sales
  previous_status?: string;
  new_status: string;
  previous_paid_amount?: number;
  new_paid_amount: number;
  reason?: string;
  created_at: string;
  created_by: string; // FK a Users
}

// ✅ PRODUCT EXTENDIDO CON CAMPOS REALES
export interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  category: string;
  subcategory?: string;
  brand?: string;
  
  // PRECIOS
  cost_price: number;
  sale_price: number;
  profit_margin: number;
  
  // INVENTARIO
  current_stock: number;
  min_stock: number;
  max_stock: number;
  unit: string; // 'pieza', 'kg', 'litro', etc.
  
  // SUPPLIER
  supplier_id?: string;
  suppliers?: {
    id: string;
    company_name: string;
    contact_person?: string;
  };
  
  // MEDIA
  image_url?: string;
  images: string[]; // jsonb
  
  // CONFIGURACIÓN
  is_active: boolean;
  is_taxable: boolean;
  tax_rate: number; // Default 16
  variants: any[]; // jsonb
  location?: string;
  expiry_date?: string; // date
  
  // AUDITORÍA snake_case según useUserTracking v7.0
  created_at: string;
  created_by?: string;
  updated_at: string;
  updated_by?: string;
}

// ✅ CUSTOMER EXTENDIDO SEGÚN USERS TABLE
export interface Customer {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  whatsapp?: string;
  profilePictureUrl?: string;
  membership_type?: string;
  points_balance: number;
  total_purchases: number;
  
  // AUDITORÍA camelCase según useUserTracking v7.0
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

// ✅ COUPON SEGÚN SCHEMA BD REAL
export interface Coupon {
  id: string;
  code: string; // UNIQUE
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_amount: number;
  max_uses?: number;
  current_uses: number;
  start_date?: string; // date
  end_date?: string; // date
  is_active: boolean;
  
  // AUDITORÍA created_only según useUserTracking v7.0
  created_at: string;
  created_by?: string;
  updated_at: string;
}

// ✅ CARTITEM CON DATOS EXTENDIDOS
export interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_amount: number;
  tax_amount: number;
  
  // METADATA PARA UI
  notes?: string;
  applied_discounts?: string[];
}

// ✅ TOTALS CALCULATION
export interface Totals {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  couponDiscount: number;
  total: number;
  
  // EXTRA PARA APARTADOS
  requiredDeposit?: number;
  pendingAmount?: number;
}

// ✅ PAYMENT DATA PARA DIALOGS
export interface PaymentData {
  method: 'efectivo' | 'transferencia' | 'debito' | 'credito' | 'mixto';
  amount: number;
  reference?: string;
  commission_rate?: number;
  is_partial?: boolean;
  sequence?: number;
}

// ✅ LAYAWAY DATA
export interface LayawayData {
  deposit_percentage: number;
  required_deposit: number;
  pending_amount: number;
  expires_at: string; // timestamp
  notes?: string;
  payment_plan_days?: number;
}

// ✅ SALE CREATION DATA
export interface CreateSaleData {
  sale_type: 'sale' | 'layaway';
  customer_id?: string;
  cart_items: CartItem[];
  payment_data: PaymentData[];
  coupon?: Coupon;
  totals: Totals;
  layaway_data?: LayawayData;
  notes?: string;
}

// ✅ SALES STATS
export interface SalesStats {
  dailySales: number;
  dailyTransactions: number;
  avgTicket: number;
  topProducts: {
    product_name: string;
    quantity_sold: number;
    revenue: number;
  }[];
}

// ✅ RESPONSE TYPES
export interface CreateSaleResponse {
  sale: Sale;
  sale_items: SaleItem[];
  payment_details: SalePaymentDetail[];
  inventory_movements: InventoryMovement[];
  layaway_history?: LayawayStatusHistory[];
}

// ✅ PAYMENT COMMISSION SEGÚN SCHEMA BD
export interface PaymentCommission {
  id: string;
  payment_method: string;
  commission_type: 'percentage' | 'fixed';
  commission_value: number;
  min_amount: number;
  is_active: boolean;
  
  // AUDITORÍA timestamps_only según useUserTracking v7.0
  created_at: string;
  updated_at: string;
}

// ✅ CONSTANTES BUSINESS LOGIC
export const SALE_TYPES = ['sale', 'layaway'] as const;
export const SALE_STATUSES = ['completed', 'pending', 'cancelled', 'refunded', 'expired'] as const;
export const PAYMENT_STATUSES = ['paid', 'partial', 'pending'] as const;
export const PAYMENT_METHODS = ['efectivo', 'transferencia', 'debito', 'credito', 'mixto'] as const;
export const MOVEMENT_TYPES = ['entrada', 'salida', 'ajuste', 'transfer'] as const;

// ✅ BUSINESS RULES
export const BUSINESS_RULES = {
  // Apartados
  MIN_DEPOSIT_PERCENTAGE: 30,
  DEFAULT_DEPOSIT_PERCENTAGE: 50,
  MAX_LAYAWAY_DAYS: 30,
  DEFAULT_LAYAWAY_DAYS: 15,
  
  // Comisiones
  DEFAULT_COMMISSION_RATE: 3,
  
  // IVA
  DEFAULT_TAX_RATE: 16,
  
  // Números de venta
  SALE_NUMBER_PREFIX: 'MUP',
  
  // Stock
  MIN_STOCK_WARNING: 5
} as const;

export type SaleType = typeof SALE_TYPES[number];
export type SaleStatus = typeof SALE_STATUSES[number];
export type PaymentStatus = typeof PAYMENT_STATUSES[number];
export type PaymentMethod = typeof PAYMENT_METHODS[number];
export type MovementType = typeof MOVEMENT_TYPES[number];