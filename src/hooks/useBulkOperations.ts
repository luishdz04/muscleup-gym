// hooks/useBulkOperations.ts - ENTERPRISE v4.2 CORREGIDO
'use client';

import { useState, useCallback, useMemo } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

// ✅ IMPORTS ENTERPRISE OBLIGATORIOS
import { 
  getCurrentTimestamp,
  getTodayInMexico, 
  addDaysToDate, 
  formatDateForDisplay, 
  daysBetween 
} from '@/utils/dateUtils';
import { useUserTracking } from '@/hooks/useUserTracking';

interface MembershipHistory {
  id: string;
  userid: string;
  plan_id: string;
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

interface BulkFreezeOperation {
  type: 'freeze' | 'unfreeze' | 'manual_freeze' | 'manual_unfreeze';
  membershipIds: string[];
  reason?: string;
  freezeDays?: number;
  isManual?: boolean;
  action: 'freeze' | 'unfreeze';
  mode: 'auto' | 'manual';
}

interface BulkPreview {
  membershipId: string;
  userName: string;
  planName: string;
  currentStatus: string;
  currentEndDate: string | null;
  newEndDate: string | null;
  daysToAdd: number;
  actionDescription: string;
}

export const useBulkOperations = (memberships: MembershipHistory[], onReload: () => Promise<void>) => {
  const [selectedMembershipIds, setSelectedMembershipIds] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkOperation, setBulkOperation] = useState<BulkFreezeOperation>({ 
    type: 'freeze', 
    membershipIds: [],
    isManual: false,
    freezeDays: 7,
    action: 'freeze',
    mode: 'auto'
  });
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkResults, setBulkResults] = useState<{ success: number; failed: number; errors: string[] }>({ 
    success: 0, 
    failed: 0, 
    errors: [] 
  });
  const [bulkPreview, setBulkPreview] = useState<BulkPreview[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  
  const supabase = createBrowserSupabaseClient();
  
  // ✅ AUDITORÍA AUTOMÁTICA ENTERPRISE
  const { addAuditFields } = useUserTracking();

  const getMexicoDateString = useCallback(() => {
    return getTodayInMexico();
  }, []);

  const formatDisplayDate = useCallback((dateString: string | null): string => {
    if (!dateString) return 'Sin fecha';
    return formatDateForDisplay(dateString);
  }, []);

  const getCurrentFrozenDays = useCallback((freezeDate: string | null): number => {
    if (!freezeDate) return 0;
    
    try {
      const today = getTodayInMexico();
      return Math.max(0, daysBetween(freezeDate, today));
    } catch (error) {
      return 0;
    }
  }, []);

  // Funciones de selección
  const handleSelectAllMemberships = useCallback((filteredMemberships: MembershipHistory[]) => {
    const eligibleMemberships = filteredMemberships
      .filter(m => m.status === 'active' || m.status === 'frozen')
      .map(m => m.id);
    setSelectedMembershipIds(eligibleMemberships);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedMembershipIds([]);
  }, []);

  const handleToggleMembershipSelection = useCallback((membershipId: string) => {
    setSelectedMembershipIds(prev => {
      if (prev.includes(membershipId)) {
        return prev.filter(id => id !== membershipId);
      } else {
        return [...prev, membershipId];
      }
    });
  }, []);

  // Validaciones
  const canFreezeMembership = useCallback((membership: MembershipHistory) => {
    if (membership.status !== 'active') {
      return { canFreeze: false, reason: 'Solo se pueden congelar membresías activas' };
    }
    return { canFreeze: true, reason: '' };
  }, []);

  const canUnfreezeMembership = useCallback((membership: MembershipHistory) => {
    if (membership.status !== 'frozen') {
      return { canUnfreeze: false, reason: 'Solo se pueden reactivar membresías congeladas' };
    }
    if (!membership.freeze_date) {
      return { canUnfreeze: false, reason: 'Membresía sin fecha de congelamiento válida' };
    }
    return { canUnfreeze: true, reason: '' };
  }, []);

  // Función para generar preview con actualización dinámica
  const generateBulkPreview = useCallback((eligibleMemberships?: MembershipHistory[], operationType?: string) => {
    const membershipsToUse = eligibleMemberships || memberships.filter(m => 
      selectedMembershipIds.includes(m.id)
    );
    const opType = operationType || (bulkOperation.mode === 'manual' ? `manual_${bulkOperation.action}` : bulkOperation.action);

    const preview: BulkPreview[] = membershipsToUse.map(membership => {
      let newEndDate = membership.end_date;
      let daysToAdd = 0;
      let actionDescription = '';

      if (opType === 'freeze') {
        actionDescription = 'Se congelará automáticamente (se agregarán días al reactivar)';
      } else if (opType === 'manual_freeze') {
        if (bulkOperation.freezeDays && membership.end_date) {
          daysToAdd = bulkOperation.freezeDays;
          newEndDate = addDaysToDate(membership.end_date, daysToAdd);
          actionDescription = `Se congelará manualmente y se agregarán ${daysToAdd} días inmediatamente`;
        } else {
          actionDescription = 'Se congelará manualmente (sin modificar fecha de vencimiento)';
        }
      } else if (opType === 'unfreeze') {
        if (membership.freeze_date && membership.end_date) {
          daysToAdd = getCurrentFrozenDays(membership.freeze_date);
          newEndDate = addDaysToDate(membership.end_date, daysToAdd);
          actionDescription = `Se reactivará automáticamente agregando ${daysToAdd} días congelados`;
        } else {
          actionDescription = 'Se reactivará automáticamente (sin modificar fecha de vencimiento)';
        }
      } else if (opType === 'manual_unfreeze') {
        actionDescription = 'Se reactivará manualmente (NO se agregarán días adicionales)';
      }

      return {
        membershipId: membership.id,
        userName: membership.user_name,
        planName: membership.plan_name,
        currentStatus: membership.status,
        currentEndDate: membership.end_date,
        newEndDate,
        daysToAdd,
        actionDescription
      };
    });

    setBulkPreview(preview);
    setShowPreview(true);
  }, [bulkOperation.freezeDays, bulkOperation.action, bulkOperation.mode, getCurrentFrozenDays, memberships, selectedMembershipIds]);

  // Función específica para update de preview (para el modal)
  const updatePreview = useCallback(() => {
    if (selectedMembershipIds.length > 0) {
      const eligibleMemberships = memberships.filter(m => selectedMembershipIds.includes(m.id));
      const operationType = bulkOperation.mode === 'manual' ? `manual_${bulkOperation.action}` : bulkOperation.action;
      generateBulkPreview(eligibleMemberships, operationType);
    }
  }, [generateBulkPreview, memberships, selectedMembershipIds, bulkOperation.action, bulkOperation.mode]);

  // Funciones principales de congelamiento masivo
  const handleBulkFreeze = useCallback((isManual: boolean = false, filteredMemberships: MembershipHistory[]) => {
    if (selectedMembershipIds.length === 0) {
      throw new Error('Seleccione al menos una membresía para congelar');
    }

    const eligibleMemberships = filteredMemberships.filter(m => 
      selectedMembershipIds.includes(m.id) && m.status === 'active'
    );

    if (eligibleMemberships.length === 0) {
      throw new Error('No hay membresías activas seleccionadas para congelar');
    }

    setBulkOperation({
      type: isManual ? 'manual_freeze' : 'freeze',
      membershipIds: eligibleMemberships.map(m => m.id),
      isManual,
      freezeDays: isManual ? 7 : undefined,
      action: 'freeze',
      mode: isManual ? 'manual' : 'auto'
    });
    
    generateBulkPreview(eligibleMemberships, isManual ? 'manual_freeze' : 'freeze');
    setBulkDialogOpen(true);
  }, [selectedMembershipIds, generateBulkPreview]);

  const handleBulkUnfreeze = useCallback((isManual: boolean = false, filteredMemberships: MembershipHistory[]) => {
    if (selectedMembershipIds.length === 0) {
      throw new Error('Seleccione al menos una membresía para reactivar');
    }

    const eligibleMemberships = filteredMemberships.filter(m => 
      selectedMembershipIds.includes(m.id) && m.status === 'frozen'
    );

    if (eligibleMemberships.length === 0) {
      throw new Error('No hay membresías congeladas seleccionadas para reactivar');
    }

    setBulkOperation({
      type: isManual ? 'manual_unfreeze' : 'unfreeze',
      membershipIds: eligibleMemberships.map(m => m.id),
      isManual,
      freezeDays: undefined,
      action: 'unfreeze',
      mode: isManual ? 'manual' : 'auto'
    });
    
    generateBulkPreview(eligibleMemberships, isManual ? 'manual_unfreeze' : 'unfreeze');
    setBulkDialogOpen(true);
  }, [selectedMembershipIds, generateBulkPreview]);

  // ✅ FUNCIÓN DE EJECUCIÓN MASIVA CON AUDITORÍA AUTOMÁTICA
  const executeBulkOperation = useCallback(async () => {
    setBulkLoading(true);
    setBulkProgress(0);
    setBulkResults({ success: 0, failed: 0, errors: [] });

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < bulkOperation.membershipIds.length; i++) {
      const membershipId = bulkOperation.membershipIds[i];
      const membership = memberships.find(m => m.id === membershipId);
      
      if (!membership) {
        failedCount++;
        errors.push(`Membresía ${membershipId} no encontrada`);
        continue;
      }

      try {
        const currentDate = getMexicoDateString();
        
        if (bulkOperation.action === 'freeze') {
          if (bulkOperation.mode === 'manual' && bulkOperation.freezeDays) {
            let newEndDate = membership.end_date;
            
            if (membership.end_date) {
              newEndDate = addDaysToDate(membership.end_date, bulkOperation.freezeDays);
            }

            // ✅ DATOS CON AUDITORÍA AUTOMÁTICA
            const updateData = await addAuditFields({
              status: 'frozen',
              freeze_date: currentDate,
              end_date: newEndDate,
              total_frozen_days: (membership.total_frozen_days || 0) + bulkOperation.freezeDays,
              notes: membership.notes ? 
                `${membership.notes}\nCongelado manualmente por ${bulkOperation.freezeDays} días el ${formatDisplayDate(currentDate)}. ${bulkOperation.reason || ''}` :
                `Congelado manualmente por ${bulkOperation.freezeDays} días el ${formatDisplayDate(currentDate)}. ${bulkOperation.reason || ''}`,
            }, true);

            const { error } = await supabase
              .from('user_memberships')
              .update(updateData)
              .eq('id', membershipId);

            if (error) throw error;
          } else {
            // ✅ DATOS CON AUDITORÍA AUTOMÁTICA
            const updateData = await addAuditFields({
              status: 'frozen',
              freeze_date: currentDate
            }, true);

            const { error } = await supabase
              .from('user_memberships')
              .update(updateData)
              .eq('id', membershipId);

            if (error) throw error;
          }
        } else {
          if (bulkOperation.mode === 'manual') {
            // ✅ DATOS CON AUDITORÍA AUTOMÁTICA
            const updateData = await addAuditFields({
              status: 'active',
              freeze_date: null,
              unfreeze_date: currentDate,
              notes: membership.notes ? 
                `${membership.notes}\nReactivado manualmente el ${formatDisplayDate(currentDate)}. ${bulkOperation.reason || ''}` :
                `Reactivado manualmente el ${formatDisplayDate(currentDate)}. ${bulkOperation.reason || ''}`,
            }, true);

            const { error } = await supabase
              .from('user_memberships')
              .update(updateData)
              .eq('id', membershipId);

            if (error) throw error;
          } else {
            const daysToAdd = getCurrentFrozenDays(membership.freeze_date);
            const newTotalFrozenDays = (membership.total_frozen_days || 0) + daysToAdd;
            
            let newEndDate = membership.end_date;
            if (membership.end_date) {
              newEndDate = addDaysToDate(membership.end_date, daysToAdd);
            }

            // ✅ DATOS CON AUDITORÍA AUTOMÁTICA
            const updateData = await addAuditFields({
              status: 'active',
              freeze_date: null,
              unfreeze_date: currentDate,
              end_date: newEndDate,
              total_frozen_days: newTotalFrozenDays,
            }, true);

            const { error } = await supabase
              .from('user_memberships')
              .update(updateData)
              .eq('id', membershipId);

            if (error) throw error;
          }
        }

        successCount++;
      } catch (err: any) {
        failedCount++;
        errors.push(`${membership.user_name}: ${err.message}`);
      }

      setBulkProgress(Math.round(((i + 1) / bulkOperation.membershipIds.length) * 100));
      setBulkResults({ success: successCount, failed: failedCount, errors });
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setBulkLoading(false);
    
    await onReload();
    
    setSelectedMembershipIds([]);
    setBulkMode(false);
    
    setTimeout(() => {
      setBulkDialogOpen(false);
      setShowPreview(false);
      setBulkResults({ success: 0, failed: 0, errors: [] });
      setBulkProgress(0);
    }, 3000);

    return { successCount, failedCount, errors };
  }, [bulkOperation, memberships, supabase, formatDisplayDate, onReload, getCurrentFrozenDays, getMexicoDateString, addAuditFields]);

  const getBulkOperationTitle = useCallback(() => {
    const actionText = bulkOperation.action === 'freeze' ? 'Congelamiento' : 'Reactivación';
    const modeText = bulkOperation.mode === 'manual' ? 'Manual' : 'Automático';
    const icon = bulkOperation.action === 'freeze' ? '🧊' : '🔄';
    return `${icon} ${actionText} Masivo ${modeText}`;
  }, [bulkOperation.action, bulkOperation.mode]);

  // Estados computados
  const selectedCount = selectedMembershipIds.length;
  const hasSelectedMemberships = selectedCount > 0;

  return {
    // Estados
    selectedMembershipIds,
    bulkMode,
    bulkDialogOpen,
    bulkOperation,
    bulkLoading,
    bulkProgress,
    bulkResults,
    bulkPreview,
    showPreview,
    selectedCount,
    hasSelectedMemberships,

    // Setters
    setSelectedMembershipIds,
    setBulkMode,
    setBulkDialogOpen,
    setBulkOperation,
    setShowPreview,

    // Funciones
    handleSelectAllMemberships,
    handleClearSelection,
    handleToggleMembershipSelection,
    canFreezeMembership,
    canUnfreezeMembership,
    handleBulkFreeze,
    handleBulkUnfreeze,
    executeBulkOperation,
    generateBulkPreview,
    updatePreview,
    getBulkOperationTitle,
    formatDisplayDate,
    getCurrentFrozenDays
  };
};