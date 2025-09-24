// hooks/useMembershipCRUD.ts - ENTERPRISE v4.2 ESQUEMA REAL CORREGIDO
'use client';

import { useState, useCallback } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

// ✅ IMPORTS ENTERPRISE OBLIGATORIOS
import { 
  getCurrentTimestamp,
  getTodayInMexico, 
  addDaysToDate,
  formatDateForDisplay 
} from '@/utils/dateUtils';
import { useUserTracking } from '@/hooks/useUserTracking';

interface MembershipHistory {
  id: string;
  userid: string;
  plan_id: string; // ✅ Corregido según esquema real
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
  user_profile_image?: string;
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
  const [initialLoad, setInitialLoad] = useState(true);
  const [selectedMembership, setSelectedMembership] = useState<MembershipHistory | null>(null);
  
  // Estados para edición
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState<EditData>({});
  const [editLoading, setEditLoading] = useState(false);
  
  // Estados para detalles
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const supabase = createBrowserSupabaseClient();
  
  // ✅ AUDITORÍA AUTOMÁTICA ENTERPRISE
  const { addAuditFields } = useUserTracking();

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price || 0);
  }, []);

  const getMexicoDateString = useCallback(() => {
    return getTodayInMexico();
  }, []);

  // ✅ FUNCIÓN CORREGIDA CON TU ESQUEMA REAL
  const loadMemberships = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Cargando membresías con esquema real...');
      
      // ✅ QUERY CORRECTO: Users (mayúscula) y plan_id (no planid)
      const { data, error } = await supabase
        .from('user_memberships')
        .select(`
          *,
          Users!userid (id, firstName, lastName, email, profilePictureUrl),
          membership_plans!plan_id (id, name, description)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error en query principal:', error);
        throw error;
      }

      const formattedData: MembershipHistory[] = (data || []).map(item => ({
        ...item,
        freeze_date: item.freeze_date || null,
        unfreeze_date: item.unfreeze_date || null,
        total_frozen_days: item.total_frozen_days || 0,
        payment_details: item.payment_details || {},
        // ✅ USANDO ESQUEMA REAL: Users.firstName, Users.lastName, etc.
        user_name: `${item.Users?.firstName || ''} ${item.Users?.lastName || ''}`.trim(),
        user_email: item.Users?.email || '',
        user_profile_image: item.Users?.profilePictureUrl || undefined,
        plan_name: item.membership_plans?.name || 'Plan Desconocido'
      }));

      setMemberships(formattedData);
      console.log(`Membresías cargadas exitosamente: ${formattedData.length} registros`);
      
    } catch (err: any) {
      console.error('Error completo:', err);
      throw new Error(`Error al cargar membresías: ${err.message}`);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [supabase]);

  // ✅ FUNCIÓN PARA CARGAR PLANES
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
      console.error('Error al cargar planes:', err);
      throw new Error(`Error al cargar planes: ${err.message}`);
    }
  }, [supabase]);

  // Función para recarga forzada
  const forceReloadMemberships = useCallback(async () => {
    setMemberships([]);
    await new Promise(resolve => setTimeout(resolve, 500));
    await loadMemberships();
  }, [loadMemberships]);

  // ✅ FUNCIÓN PARA CAMBIAR ESTADO CON AUDITORÍA AUTOMÁTICA
  const handleStatusChange = useCallback(async (membership: MembershipHistory, newStatus: string) => {
    try {
      // ✅ APLICAR AUDITORÍA AUTOMÁTICA
      const updateData = await addAuditFields({
        status: newStatus
      }, true);

      const { error } = await supabase
        .from('user_memberships')
        .update(updateData)
        .eq('id', membership.id);

      if (error) throw error;

      await forceReloadMemberships();
      return { success: true, message: `Estado cambiado a ${newStatus}` };
    } catch (err: any) {
      throw new Error(`Error al cambiar estado: ${err.message}`);
    }
  }, [supabase, forceReloadMemberships, addAuditFields]);

  // ✅ FUNCIÓN PARA ACTUALIZAR MEMBRESÍA CON AUDITORÍA AUTOMÁTICA
  const handleUpdateMembership = useCallback(async (editDataFromModal?: any) => {
    if (!selectedMembership) return;
    
    // Usar datos del modal si se proporcionan, sino usar editData del estado
    const dataToUpdate = editDataFromModal || editData;
    
    setEditLoading(true);
    try {
      // Validaciones
      if (dataToUpdate.end_date && dataToUpdate.start_date && dataToUpdate.end_date <= dataToUpdate.start_date) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }

      if (dataToUpdate.amount_paid && dataToUpdate.amount_paid < 0) {
        throw new Error('El monto no puede ser negativo');
      }

      // Manejar extensión manual de días
      if (dataToUpdate.extend_days && dataToUpdate.extend_days > 0 && selectedMembership?.end_date) {
        const newEndDate = addDaysToDate(selectedMembership.end_date, dataToUpdate.extend_days);
        dataToUpdate.end_date = newEndDate;
        
        const today = getMexicoDateString();
        const extensionNote = `Fecha extendida ${dataToUpdate.extend_days} día${dataToUpdate.extend_days > 1 ? 's' : ''} manualmente el ${formatDateForDisplay(today)}.`;
        dataToUpdate.notes = dataToUpdate.notes ? `${dataToUpdate.notes}\n${extensionNote}` : extensionNote;
      }

      const updateDataForDB: any = {};

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
        if (dataToUpdate[field] !== undefined && dataToUpdate[field] !== null) {
          updateDataForDB[field] = dataToUpdate[field];
        }
      });

      // Manejar pago mixto
      if (dataToUpdate.payment_method === 'mixto' || selectedMembership.payment_method === 'mixto') {
        updateDataForDB.is_mixed_payment = true;
        
        if (dataToUpdate.cash_amount || dataToUpdate.card_amount || dataToUpdate.transfer_amount) {
          const paymentDetails = {
            cash_amount: dataToUpdate.cash_amount || 0,
            card_amount: dataToUpdate.card_amount || 0,
            transfer_amount: dataToUpdate.transfer_amount || 0,
            total_amount: (dataToUpdate.cash_amount || 0) + (dataToUpdate.card_amount || 0) + (dataToUpdate.transfer_amount || 0)
          };
          updateDataForDB.payment_details = paymentDetails;
        }
      } else {
        updateDataForDB.is_mixed_payment = false;
        updateDataForDB.payment_details = {};
      }

      // ✅ APLICAR AUDITORÍA AUTOMÁTICA A TODOS LOS DATOS
      const finalUpdateData = await addAuditFields(updateDataForDB, true);

      const { error } = await supabase
        .from('user_memberships')
        .update(finalUpdateData)
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
  }, [selectedMembership, editData, supabase, forceReloadMemberships, getMexicoDateString, addAuditFields]);

  // Función para inicializar datos de edición
  const initializeEditData = useCallback((membership: MembershipHistory) => {
    const paymentDetails = membership.payment_details || {};
    
    setEditData({
      status: membership.status,
      start_date: membership.start_date,
      end_date: membership.end_date || undefined,
      amount_paid: membership.amount_paid,
      payment_method: membership.payment_method,
      payment_reference: membership.payment_reference || undefined,
      notes: membership.notes || undefined,
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
    initialLoad,
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