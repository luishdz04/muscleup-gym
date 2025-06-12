// Actualizar la interfaz MembershipHistory
interface MembershipHistory {
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
  skip_inscription: boolean;
  custom_commission_rate: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  
  // 🆕 NUEVOS CAMPOS PARA CONGELAMIENTO INTELIGENTE
  freeze_date: string | null;
  unfreeze_date: string | null;
  total_frozen_days: number;
  
  // Datos relacionados
  user_name: string;
  user_email: string;
  plan_name: string;
}
