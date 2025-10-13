// hooks/useMembershipCRUD.ts - ENTERPRISE v6.0 CORREGIDO
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
import type { EditFormData, MembershipHistory, MembershipPlan, PaymentDetail } from '@/types/membership';

interface EditData {
  status?: string;
  planId?: string;
  paymentMethod?: string;
  paymentType?: string;
  start_date?: string;
  end_date?: string;
  amount_paid?: number;
  subtotal?: number;
  inscription_amount?: number;
  discount_amount?: number;
  commission_amount?: number;
  commission_rate?: number;
  isRenewal?: boolean;
  skipInscription?: boolean;
  isMixedPayment?: boolean;
  paymentDetails?: PaymentDetail[];
  paymentReceived?: number;
  paymentChange?: number;
  payment_reference?: string;
  couponCode?: string;
  notes?: string;
  extend_days?: number;
}

export const useMembershipCRUD = () => {
  const [memberships, setMemberships] = useState<MembershipHistory[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
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
  
  // ✅ AUDITORÍA AUTOMÁTICA ENTERPRISE v6.0
  const { addAuditFieldsFor } = useUserTracking();

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price || 0);
  }, []);

  const getMexicoDateString = useCallback(() => {
    return getTodayInMexico();
  }, []);

  // ✅ FUNCIÓN CORREGIDA CON ESQUEMA REAL + PAYMENT_DETAILS
  const loadMemberships = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Cargando membresías con esquema real + payment_details...');
      
      // ✅ QUERY CORRECTO: Incluye membership_payment_details
      const { data, error } = await supabase
        .from('user_memberships')
        .select(`
          *,
          Users!userid (id, firstName, lastName, email, profilePictureUrl),
          membership_plans!plan_id (id, name, description),
          membership_payment_details!membership_id (*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error en query principal:', error);
        throw error;
      }

      const formattedData: MembershipHistory[] = (data || []).map(item => {
        const rawPaymentDetails = Array.isArray(item.membership_payment_details)
          ? item.membership_payment_details
          : [];

        const paymentDetails: PaymentDetail[] = rawPaymentDetails.map((detail: any, index: number) => ({
          id: detail.id || `${item.id}-payment-${index}`,
          method: detail.payment_method || 'desconocido',
          amount: Number(detail.amount || 0),
          commission_rate: Number(detail.commission_rate || 0),
          commission_amount: Number(detail.commission_amount || 0),
          reference: detail.payment_reference || null,
          sequence: detail.sequence_order || index + 1,
          created_at: detail.created_at || undefined
  })).sort((a: PaymentDetail, b: PaymentDetail) => a.sequence - b.sequence);

        const totalPaidFromDetails = paymentDetails.reduce((sum, detail) => sum + (detail.amount || 0), 0);
        const totalCommissionFromDetails = paymentDetails.reduce((sum, detail) => sum + (detail.commission_amount || 0), 0);
        const paymentMethods = paymentDetails.map(detail => detail.method).filter(Boolean);
        const uniqueMethods = Array.from(new Set(paymentMethods));
        const legacyPaymentMethod = item.payment_method || item.primary_payment_method || '';
        const isMixedPayment = uniqueMethods.length > 1 || legacyPaymentMethod === 'mixto';
        const primaryPaymentMethod = isMixedPayment
          ? 'mixto'
          : (uniqueMethods[0] || legacyPaymentMethod || 'efectivo');
        const paymentReference = paymentDetails.length === 1
          ? paymentDetails[0].reference || null
          : paymentDetails.map(detail => detail.reference).filter(Boolean).join(', ') || (item.payment_reference || null);
        const paymentMethodBreakdown = paymentDetails
          .map(detail => `${detail.method}: ${formatPrice(Number(detail.amount || 0))}`)
          .join(' | ');

        const legacyPaidAmount = Number(item.paid_amount ?? item.amount_paid ?? 0);
        const totalPaid = totalPaidFromDetails > 0 ? totalPaidFromDetails : legacyPaidAmount;
        const totalCommission = totalCommissionFromDetails > 0 ? totalCommissionFromDetails : Number(item.commission_amount ?? 0);
        const totalAmount = Number(item.total_amount ?? totalPaid);
        const paidAmount = totalPaid;
        const pendingAmount = Number(item.pending_amount ?? Math.max(totalAmount - paidAmount, 0));
        const inscriptionAmount = Number(item.inscription_amount ?? 0);
        const discountAmount = Number(item.discount_amount ?? 0);
        const subtotalAmount = Number(item.subtotal ?? Math.max(totalAmount - totalCommission, 0));
        const commissionRate = totalPaid > 0
          ? Math.round((totalCommission / totalPaid) * 10000) / 100
          : 0;

        return {
          ...item,
          freeze_date: item.freeze_date || null,
          unfreeze_date: item.unfreeze_date || null,
          total_frozen_days: item.total_frozen_days || 0,
          payment_details: paymentDetails,
          total_amount: totalAmount,
          paid_amount: paidAmount,
          pending_amount: pendingAmount,
          inscription_amount: inscriptionAmount,
          discount_amount: discountAmount,
          subtotal: subtotalAmount,
          commission_amount: totalCommission,
          commission_rate: commissionRate,
          amount_paid: paidAmount,
          payment_method: primaryPaymentMethod,
          payment_reference: paymentReference,
          payment_received: totalPaid,
          payment_change: 0,
          is_mixed_payment: isMixedPayment,
          custom_commission_rate: null,
          primary_payment_method: primaryPaymentMethod,
          payment_method_breakdown: paymentMethodBreakdown,
          user_name: `${item.Users?.firstName || ''} ${item.Users?.lastName || ''}`.trim(),
          user_email: item.Users?.email || '',
          user_profile_image: item.Users?.profilePictureUrl || undefined,
          plan_name: item.membership_plans?.name || 'Plan Desconocido'
        } as MembershipHistory;
      });

      setMemberships(formattedData);
      console.log(`Membresías cargadas exitosamente: ${formattedData.length} registros`);
      
    } catch (err: any) {
      console.error('Error completo:', err);
      throw new Error(`Error al cargar membresías: ${err.message}`);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [supabase, formatPrice]);

  const loadPlans = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('membership_plans')
        .select(`
          id,
          name,
          description,
          inscription_price,
          visit_price,
          weekly_price,
          biweekly_price,
          monthly_price,
          bimonthly_price,
          quarterly_price,
          semester_price,
          annual_price,
          weekly_duration,
          biweekly_duration,
          monthly_duration,
          bimonthly_duration,
          quarterly_duration,
          semester_duration,
          annual_duration
        `)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      const normalizedPlans = (data || []).map(plan => ({
        ...plan,
        inscription_price: Number(plan.inscription_price ?? 0),
        visit_price: Number(plan.visit_price ?? 0),
        weekly_price: Number(plan.weekly_price ?? 0),
        biweekly_price: Number(plan.biweekly_price ?? 0),
        monthly_price: Number(plan.monthly_price ?? 0),
        bimonthly_price: Number(plan.bimonthly_price ?? 0),
        quarterly_price: Number(plan.quarterly_price ?? 0),
        semester_price: Number(plan.semester_price ?? 0),
        annual_price: Number(plan.annual_price ?? 0),
        weekly_duration: Number(plan.weekly_duration ?? 0),
        biweekly_duration: Number(plan.biweekly_duration ?? 0),
        monthly_duration: Number(plan.monthly_duration ?? 0),
        bimonthly_duration: Number(plan.bimonthly_duration ?? 0),
        quarterly_duration: Number(plan.quarterly_duration ?? 0),
        semester_duration: Number(plan.semester_duration ?? 0),
        annual_duration: Number(plan.annual_duration ?? 0)
      })) as MembershipPlan[];

      setPlans(normalizedPlans);
    } catch (err: any) {
      console.error('Error al cargar planes:', err);
      throw new Error(`Error al cargar planes: ${err.message}`);
    }
  }, [supabase]);

  const forceReloadMemberships = useCallback(async () => {
    setMemberships([]);
    await new Promise(resolve => setTimeout(resolve, 500));
    await loadMemberships();
  }, [loadMemberships]);

  // ✅ FUNCIÓN CORREGIDA CON AUDITORÍA v6.0
  const handleStatusChange = useCallback(async (membership: MembershipHistory, newStatus: string) => {
    try {
      // ✅ APLICAR AUDITORÍA v6.0 - user_memberships (full_snake)
      const updateData = await addAuditFieldsFor('user_memberships', {
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
  }, [supabase, forceReloadMemberships, addAuditFieldsFor]);

  // ✅ FUNCIÓN CORREGIDA CON AUDITORÍA v6.0
  const handleUpdateMembership = useCallback(async (editDataFromModal?: EditFormData) => {
    if (!selectedMembership) return;

  const incomingData: any = editDataFromModal || editData;

    setEditLoading(true);
    try {
      const normalizedData: any = {
        ...incomingData,
        paymentDetails: Array.isArray(incomingData?.paymentDetails)
          ? incomingData.paymentDetails
          : Array.isArray(incomingData?.payment_details)
            ? incomingData.payment_details
            : [],
      };

      // Validaciones base
      if (
        normalizedData.end_date &&
        normalizedData.start_date &&
        normalizedData.end_date <= normalizedData.start_date
      ) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }

      if (normalizedData.amount_paid && normalizedData.amount_paid < 0) {
        throw new Error('El monto no puede ser negativo');
      }

      // Manejar extensión manual de días
      if (
        normalizedData.extend_days &&
        normalizedData.extend_days > 0 &&
        selectedMembership?.end_date
      ) {
        const newEndDate = addDaysToDate(selectedMembership.end_date, normalizedData.extend_days);
        normalizedData.end_date = newEndDate;

        const today = getMexicoDateString();
        const extensionNote = `Fecha extendida ${normalizedData.extend_days} día${normalizedData.extend_days > 1 ? 's' : ''} manualmente el ${formatDateForDisplay(today)}.`;
        normalizedData.notes = normalizedData.notes
          ? `${normalizedData.notes}\n${extensionNote}`
          : extensionNote;
      }

      const updateDataForDB: Record<string, any> = {};

      const status = normalizedData.status ?? selectedMembership.status;
      if (status) updateDataForDB.status = status;

      if (normalizedData.start_date) updateDataForDB.start_date = normalizedData.start_date;
      if (normalizedData.end_date) updateDataForDB.end_date = normalizedData.end_date;

      const planId = normalizedData.planId ?? normalizedData.plan_id ?? selectedMembership.plan_id;
      if (planId) updateDataForDB.plan_id = planId;

      const paymentType = normalizedData.paymentType ?? normalizedData.payment_type ?? selectedMembership.payment_type;
      if (paymentType) updateDataForDB.payment_type = paymentType;

      if (typeof normalizedData.skipInscription === 'boolean') {
        updateDataForDB.skip_inscription = normalizedData.skipInscription;
      }

      if (typeof normalizedData.isRenewal === 'boolean') {
        updateDataForDB.is_renewal = normalizedData.isRenewal;
      }

      if (normalizedData.couponCode !== undefined || normalizedData.coupon_code !== undefined) {
        const coupon = normalizedData.couponCode ?? normalizedData.coupon_code ?? null;
        updateDataForDB.coupon_code = coupon ? String(coupon) : null;
      }

      if (normalizedData.notes !== undefined) {
        updateDataForDB.notes = normalizedData.notes || null;
      }

      if (typeof normalizedData.subtotal === 'number') {
        updateDataForDB.subtotal = normalizedData.subtotal;
      }

      if (typeof normalizedData.inscription_amount === 'number') {
        updateDataForDB.inscription_amount = normalizedData.inscription_amount;
      }

      if (typeof normalizedData.discount_amount === 'number') {
        updateDataForDB.discount_amount = normalizedData.discount_amount;
      }

      if (typeof normalizedData.amount_paid === 'number') {
        const amountPaid = Math.round(normalizedData.amount_paid * 100) / 100;
        updateDataForDB.amount_paid = amountPaid;
        updateDataForDB.paid_amount = amountPaid;
        updateDataForDB.payment_received = amountPaid;
      }

      if (typeof normalizedData.commission_rate === 'number') {
        updateDataForDB.commission_rate = normalizedData.commission_rate;
      }

      if (typeof normalizedData.commission_amount === 'number') {
        updateDataForDB.commission_amount = Math.round(normalizedData.commission_amount * 100) / 100;
      }

      const basePaymentMethod = normalizedData.paymentMethod ?? normalizedData.payment_method ?? selectedMembership.payment_method;
      const paymentDetailsArray: PaymentDetail[] = normalizedData.paymentDetails || [];
      const isMixedPayment = normalizedData.isMixedPayment ?? normalizedData.is_mixed_payment ?? (paymentDetailsArray.length > 1);

      updateDataForDB.is_mixed_payment = Boolean(isMixedPayment);

      if (basePaymentMethod) {
        updateDataForDB.payment_method = isMixedPayment ? 'mixto' : basePaymentMethod;
      }

      if (normalizedData.payment_reference !== undefined) {
        updateDataForDB.payment_reference = normalizedData.payment_reference || null;
      }

      const subtotalValue = typeof updateDataForDB.subtotal === 'number'
        ? updateDataForDB.subtotal
        : selectedMembership.subtotal;
      const commissionValue = typeof updateDataForDB.commission_amount === 'number'
        ? updateDataForDB.commission_amount
        : selectedMembership.commission_amount;
      const amountPaidValue = typeof updateDataForDB.amount_paid === 'number'
        ? updateDataForDB.amount_paid
        : selectedMembership.amount_paid;

      if (typeof subtotalValue === 'number' && typeof commissionValue === 'number') {
        const totalAmount = Math.round((subtotalValue + commissionValue) * 100) / 100;
        updateDataForDB.total_amount = totalAmount;
        updateDataForDB.pending_amount = Math.max(totalAmount - amountPaidValue, 0);
      }

      // Aplicar auditoría a la actualización principal
      const finalUpdateData = await addAuditFieldsFor('user_memberships', updateDataForDB, true);

      const { error: updateError } = await supabase
        .from('user_memberships')
        .update(finalUpdateData)
        .eq('id', selectedMembership.id);

      if (updateError) throw updateError;

      // Sincronizar detalles de pago
      await supabase
        .from('membership_payment_details')
        .delete()
        .eq('membership_id', selectedMembership.id);

      if (paymentDetailsArray.length > 0) {
        const paymentDetailsToInsert = await Promise.all(paymentDetailsArray.map(async (detail, index) => {
          const detailAmount = Math.round((detail.amount || 0) * 100) / 100;
          const commissionAmount = Math.round((detail.commission_amount || 0) * 100) / 100;

          const baseDetail = {
            membership_id: selectedMembership.id,
            payment_method: detail.method,
            amount: detailAmount,
            payment_reference: detail.reference || null,
            commission_rate: detail.commission_rate ?? 0,
            commission_amount: commissionAmount,
            sequence_order: index + 1
          };

          return await addAuditFieldsFor('membership_payment_details', baseDetail, false);
        }));

        const { error: detailError } = await supabase
          .from('membership_payment_details')
          .insert(paymentDetailsToInsert);

        if (detailError) throw detailError;
      }

      setEditDialogOpen(false);
      setEditData({});
      await forceReloadMemberships();

      return { success: true, message: 'Membresía actualizada exitosamente' };
    } catch (err: any) {
      throw new Error(`Error al actualizar membresía: ${err.message}`);
    } finally {
      setEditLoading(false);
    }
  }, [
    selectedMembership,
    editData,
    supabase,
    forceReloadMemberships,
    getMexicoDateString,
    addAuditFieldsFor,
    formatDateForDisplay,
    addDaysToDate
  ]);

  const initializeEditData = useCallback((membership: MembershipHistory) => {
    const paymentDetailsArray = Array.isArray(membership.payment_details)
      ? membership.payment_details
      : [];

    setEditData({
      status: membership.status,
      planId: membership.plan_id,
      paymentMethod: membership.payment_method,
      paymentType: membership.payment_type || '',
      start_date: membership.start_date,
      end_date: membership.end_date || undefined,
      amount_paid: membership.amount_paid,
      subtotal: membership.subtotal || 0,
      inscription_amount: membership.inscription_amount || 0,
      discount_amount: membership.discount_amount || 0,
      commission_amount: membership.commission_amount || 0,
      commission_rate: membership.commission_rate || 0,
      isRenewal: membership.is_renewal || false,
      skipInscription: membership.skip_inscription || false,
      isMixedPayment: membership.is_mixed_payment,
      paymentDetails: paymentDetailsArray,
      paymentReceived: membership.payment_received || membership.amount_paid || 0,
      paymentChange: membership.payment_change || 0,
      payment_reference: membership.payment_reference || '',
      couponCode: membership.coupon_code || '',
      notes: membership.notes || '',
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