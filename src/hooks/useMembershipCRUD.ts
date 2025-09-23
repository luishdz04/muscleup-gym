// hooks/useMembershipCRUD.ts
import { useState, useCallback } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { getTodayInMexico, addDaysToDate } from '@/utils/dateUtils';


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

interface Plan {
  id: string;
  name: string;
  description: string;
}

interface EditData {
  status?: string;
  start_date?: string;
  end_date?: string;
  amount_paid?: number;
  payment_method?: string;
  payment_reference?: string;
  notes?: string;
  commission_rate?: number;
  commission_amount?: number;
  is_mixed_payment?: boolean;
  cash_amount?: number;
  card_amount?: number;
  transfer_amount?: number;
  extend_days?: number;
}

export const useMembershipCRUD = () => {
  const [memberships, setMemberships] = useState<MembershipHistory[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMembership, setSelectedMembership] = useState<MembershipHistory | null>(null);
  
  // Estados para edición
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState<EditData>({});
  const [editLoading, setEditLoading] = useState(false);
  
  // Estados para detalles
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const supabase = createBrowserSupabaseClient();

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price || 0);
  }, []);

  const getMexicoDateString = useCallback(() => {
  return getTodayInMexico();
}, []);

  // Función para cargar membresías
  const loadMemberships = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_memberships')
        .select(`
          *,
          Users!userid (firstName, lastName, email),
          membership_plans!planid (name, description)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData: MembershipHistory[] = (data || []).map(item => ({
        ...item,
        freeze_date: item.freeze_date || null,
        unfreeze_date: item.unfreeze_date || null,
        total_frozen_days: item.total_frozen_days || 0,
        payment_details: item.payment_details || {},
        user_name: `${item.Users?.firstName || ''} ${item.Users?.lastName || ''}`.trim(),
        user_email: item.Users?.email || '',
        plan_name: item.membership_plans?.name || 'Plan Desconocido'
      }));

      setMemberships(formattedData);
    } catch (err: any) {
      throw new Error(`Error al cargar membresías: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Función para cargar planes
  const loadPlans = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('membership_plans')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setPlans(data || []);
    } catch (err: any) {
      throw new Error(`Error al cargar planes: ${err.message}`);
    }
  }, [supabase]);

  // Función para recarga forzada
  const forceReloadMemberships = useCallback(async () => {
    setMemberships([]);
    await new Promise(resolve => setTimeout(resolve, 500));
    await loadMemberships();
  }, [loadMemberships]);

  // Función para cambiar estado
  const handleStatusChange = useCallback(async (membership: MembershipHistory, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('user_memberships')
        .update({ status: newStatus })
        .eq('id', membership.id);

      if (error) throw error;

      await forceReloadMemberships();
      return { success: true, message: `Estado cambiado a ${newStatus}` };
    } catch (err: any) {
      throw new Error(`Error al cambiar estado: ${err.message}`);
    }
  }, [supabase, forceReloadMemberships]);

  // Función para actualizar membresía
  const handleUpdateMembership = useCallback(async () => {
    if (!selectedMembership || !editData) return;
    
    setEditLoading(true);
    try {
      // Validaciones
      if (editData.end_date && editData.start_date && editData.end_date <= editData.start_date) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }

      if (editData.amount_paid && editData.amount_paid < 0) {
        throw new Error('El monto no puede ser negativo');
      }

      // Manejar extensión manual de días
      if (editData.extend_days && editData.extend_days > 0 && selectedMembership?.end_date) {
        const newEndDate = addDaysToDate(selectedMembership.end_date, editData.extend_days);
        editData.end_date = newEndDate;
        
        const today = getMexicoDateString();
        const extensionNote = `Fecha extendida ${editData.extend_days} día${editData.extend_days > 1 ? 's' : ''} manualmente el ${today}.`;
        editData.notes = editData.notes ? `${editData.notes}\n${extensionNote}` : extensionNote;
      }

      const updateData: any = {};

      // Campos permitidos para actualizar
      const allowedFields = [
        'status',
        'start_date', 
        'end_date',
        'amount_paid',
        'payment_method',
        'payment_reference',
        'notes',
        'commission_rate',
        'commission_amount',
        'is_mixed_payment'
      ];

      allowedFields.forEach(field => {
        if (editData[field as keyof EditData] !== undefined && editData[field as keyof EditData] !== null) {
          updateData[field] = editData[field as keyof EditData];
        }
      });

      // Manejar pago mixto
      if (editData.payment_method === 'mixto' || selectedMembership.payment_method === 'mixto') {
        updateData.is_mixed_payment = true;
        
        if (editData.cash_amount || editData.card_amount || editData.transfer_amount) {
          const paymentDetails = {
            cash_amount: editData.cash_amount || 0,
            card_amount: editData.card_amount || 0,
            transfer_amount: editData.transfer_amount || 0,
            total_amount: (editData.cash_amount || 0) + (editData.card_amount || 0) + (editData.transfer_amount || 0)
          };
          updateData.payment_details = paymentDetails;
        }
      } else {
        updateData.is_mixed_payment = false;
        updateData.payment_details = {};
      }

      const { error } = await supabase
        .from('user_memberships')
        .update(updateData)
        .eq('id', selectedMembership.id);

      if (error) throw error;

      setEditDialogOpen(false);
      setEditData({});
      await forceReloadMemberships();
      
      return { success: true, message: 'Membresía actualizada exitosamente' };
    } catch (err: any) {
      throw new Error(`Error al actualizar membresía: ${err.message}`);
    } finally {
      setEditLoading(false);
    }
  }, [selectedMembership, editData, supabase, forceReloadMemberships, getMexicoDateString]);

  // Función para inicializar datos de edición
  const initializeEditData = useCallback((membership: MembershipHistory) => {
    const paymentDetails = membership.payment_details || {};
    
    setEditData({
      status: membership.status,
      start_date: membership.start_date,
      end_date: membership.end_date,
      amount_paid: membership.amount_paid,
      payment_method: membership.payment_method,
      payment_reference: membership.payment_reference,
      notes: membership.notes,
      commission_rate: membership.commission_rate,
      commission_amount: membership.commission_amount,
      is_mixed_payment: membership.is_mixed_payment,
      cash_amount: paymentDetails.cash_amount || 0,
      card_amount: paymentDetails.card_amount || 0,
      transfer_amount: paymentDetails.transfer_amount || 0,
      extend_days: 0
    });
  }, []);

  return {
    // Estados
    memberships,
    plans,
    loading,
    selectedMembership,
    editDialogOpen,
    editData,
    editLoading,
    detailsDialogOpen,
    
    // Setters
    setSelectedMembership,
    setEditDialogOpen,
    setEditData,
    setDetailsDialogOpen,
    
    // Funciones
    loadMemberships,
    loadPlans,
    forceReloadMemberships,
    handleStatusChange,
    handleUpdateMembership,
    initializeEditData,
    formatPrice,
    getMexicoDateString
  };
};
