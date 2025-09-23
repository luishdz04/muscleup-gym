// types/membership.ts - TIPOS COMPLETOS Y ACTUALIZADOS
export interface MembershipHistory {
  id: string;
  userid: string;
  planid: string;
  payment_type: string;
  amount_paid: number;
  inscription_amount: number;
  start_date: string;
  end_date: string | null;
  status: string;
  payment_method: string;
  payment_reference: string | null;
  discount_amount: number;
  coupon_code: string | null;
  subtotal: number;
  commission_rate: number;
  commission_amount: number;
  payment_received: number;
  payment_change: number;
  is_mixed_payment: boolean;
  is_renewal: boolean;
  custom_commission_rate: number | null;
  skip_inscription: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  freeze_date: string | null;
  unfreeze_date: string | null;
  total_frozen_days: number;
  payment_details: any;
  user_name: string;
  user_email: string;
  plan_name: string;
}

export interface BulkFreezeOperation {
  type: 'freeze' | 'unfreeze' | 'manual_freeze' | 'manual_unfreeze';
  membershipIds: string[];
  reason?: string;
  freezeDays?: number;
  isManual?: boolean;
  action: 'freeze' | 'unfreeze';
  mode: 'auto' | 'manual';
}

export interface BulkPreview {
  membershipId: string;
  userName: string;
  planName: string;
  currentStatus: string;
  currentEndDate: string | null;
  newEndDate: string | null;
  daysToAdd: number;
  actionDescription: string;
}

export interface StatusOption {
  value: string;
  label: string;
  color: string;
  icon: string;
}

export interface PaymentMethodOption {
  value: string;
  label: string;
  icon: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
}

export interface Filters {
  searchTerm: string;
  status: string;
  paymentMethod: string;
  dateFrom: string;
  dateTo: string;
  planId: string;
  isRenewal: string;
}

export interface EditFormData {
  status: string;
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
  isMixedPayment: boolean;
  paymentDetails: PaymentDetail[];
  paymentReceived: number;
  paymentChange: number;
  payment_reference: string;
  couponCode: string;
  notes: string;
  extend_days: number;
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

export interface PaymentMethod {
  value: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  hasCommission: boolean;
}