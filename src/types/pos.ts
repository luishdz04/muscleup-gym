// src/types/pos.ts

export interface Product {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  brand?: string;
  category: string;
  current_stock: number;
  min_stock: number;
  unit: string;
  cost_price: number;
  sale_price: number;
  image_url?: string;
  is_active?: boolean;
  is_taxable?: boolean;
  tax_rate?: number;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  suppliers?: {
    id: string;
    company_name: string;
    contact_person: string;
  };
}

export interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_amount: number;
  tax_amount: number;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  whatsapp?: string;
  membership_type?: string;
  points_balance?: number;
  total_purchases?: number;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discount_type: string;
  discount_value: number;
  min_amount?: number;
  max_uses?: number;
  current_uses?: number; // ✅ PROPIEDAD CLAVE PARA SOLUCIONAR ERRORES
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
}

export interface Totals {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  couponDiscount: number;
  total: number;
}

export interface PaymentMethod {
  method: string;
  amount: number;
  reference?: string;
}

export interface SalesStats {
  dailySales: number;
  dailyTransactions: number;
  avgTicket: number;
  topProducts: any[];
}