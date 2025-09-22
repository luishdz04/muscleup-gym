// actions/membershipActions.ts - SERVER ACTIONS OPTIMIZADAS
'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { toMexicoDate, addDaysToDate, getCurrentTimestamp } from '@/utils/dateHelpers';

// ✅ ESQUEMAS DE VALIDACIÓN
const BulkFreezeSchema = z.object({
  membershipIds: z.array(z.string().uuid()),
  isManual: z.boolean(),
  freezeDays: z.number().int().min(1).max(365).optional(),
  reason: z.string().optional(),
});

const BulkUnfreezeSchema = z.object({
  membershipIds: z.array(z.string().uuid()),
  isManual: z.boolean(),
  reason: z.string().optional(),
});

const UpdateMembershipSchema = z.object({
  membershipId: z.string().uuid(),
  status: z.enum(['active', 'frozen', 'expired', 'cancelled']).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  amount_paid: z.number().min(0).optional(),
  payment_method: z.enum(['efectivo', 'debito', 'credito', 'transferencia', 'mixto']).optional(),
  payment_reference: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  commission_rate: z.number().min(0).max(100).optional(),
  commission_amount: z.number().min(0).optional(),
  extend_days: z.number().int().min(0).max(365).optional(),
  // Campos para pago mixto
  cash_amount: z.number().min(0).optional(),
  card_amount: z.number().min(0).optional(),
  transfer_amount: z.number().min(0).optional(),
});

// ✅ TIPOS DE RESPUESTA
interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: Record<string, string[]>;
}

// 🧊 CONGELAMIENTO MASIVO
export async function bulkFreezeMemberships(
  formData: FormData
): Promise<ActionResponse<{ processed: number; failed: number; errors: string[] }>> {
  try {
    const supabase = createServerSupabaseClient();
    
    // Validar entrada
    const rawData = {
      membershipIds: JSON.parse(formData.get('membershipIds') as string),
      isManual: formData.get('isManual') === 'true',
      freezeDays: formData.get('freezeDays') ? parseInt(formData.get('freezeDays') as string) : undefined,
      reason: formData.get('reason') as string || undefined,
    };

    const validationResult = BulkFreezeSchema.safeParse(rawData);
    if (!validationResult.success) {
      return {
        success: false,
        validationErrors: validationResult.error.flatten().fieldErrors
      };
    }

    const { membershipIds, isManual, freezeDays, reason } = validationResult.data;
    
    // Verificar permisos de usuario
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'No autorizado' };
    }

    let processedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Procesar cada membresía
    for (const membershipId of membershipIds) {
      try {
        // Obtener datos actuales de la membresía
        const { data: membership, error: fetchError } = await supabase
          .from('user_memberships')
          .select('*, Users!userid(firstName, lastName)')
          .eq('id', membershipId)
          .single();

        if (fetchError || !membership) {
          failedCount++;
          errors.push(`Membresía ${membershipId}: No encontrada`);
          continue;
        }

        if (membership.status !== 'active') {
          failedCount++;
          errors.push(`${membership.Users?.firstName} ${membership.Users?.lastName}: Solo se pueden congelar membresías activas`);
          continue;
        }

        const currentDate = toMexicoDate(new Date());
        let updateData: any = {
          status: 'frozen',
          freeze_date: currentDate,
          updated_at: getCurrentTimestamp(),
          updated_by: user.id
        };

        // Para congelamiento manual, agregar días inmediatamente
        if (isManual && freezeDays && membership.end_date) {
          const newEndDate = addDaysToDate(membership.end_date, freezeDays);
          updateData.end_date = newEndDate;
          updateData.total_frozen_days = (membership.total_frozen_days || 0) + freezeDays;
          
          const noteText = `Congelado manualmente por ${freezeDays} días el ${currentDate}.${reason ? ` Motivo: ${reason}` : ''}`;
          updateData.notes = membership.notes ? `${membership.notes}\n${noteText}` : noteText;
        } else if (reason) {
          const noteText = `Congelado automáticamente el ${currentDate}. Motivo: ${reason}`;
          updateData.notes = membership.notes ? `${membership.notes}\n${noteText}` : noteText;
        }

        const { error: updateError } = await supabase
          .from('user_memberships')
          .update(updateData)
          .eq('id', membershipId);

        if (updateError) {
          failedCount++;
          errors.push(`${membership.Users?.firstName} ${membership.Users?.lastName}: ${updateError.message}`);
        } else {
          processedCount++;
        }

      } catch (error: any) {
        failedCount++;
        errors.push(`Membresía ${membershipId}: ${error.message}`);
      }
    }

    // Revalidar caché
    revalidatePath('/dashboard/admin/membresias/historial');

    return {
      success: true,
      data: {
        processed: processedCount,
        failed: failedCount,
        errors
      }
    };

  } catch (error: any) {
    console.error('Error en bulkFreezeMemberships:', error);
    return {
      success: false,
      error: 'Error interno del servidor'
    };
  }
}

// 🔄 REACTIVACIÓN MASIVA
export async function bulkUnfreezeMemberships(
  formData: FormData
): Promise<ActionResponse<{ processed: number; failed: number; errors: string[] }>> {
  try {
    const supabase = createServerSupabaseClient();
    
    // Validar entrada
    const rawData = {
      membershipIds: JSON.parse(formData.get('membershipIds') as string),
      isManual: formData.get('isManual') === 'true',
      reason: formData.get('reason') as string || undefined,
    };

    const validationResult = BulkUnfreezeSchema.safeParse(rawData);
    if (!validationResult.success) {
      return {
        success: false,
        validationErrors: validationResult.error.flatten().fieldErrors
      };
    }

    const { membershipIds, isManual, reason } = validationResult.data;
    
    // Verificar permisos
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'No autorizado' };
    }

    let processedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Procesar cada membresía
    for (const membershipId of membershipIds) {
      try {
        // Obtener datos actuales
        const { data: membership, error: fetchError } = await supabase
          .from('user_memberships')
          .select('*, Users!userid(firstName, lastName)')
          .eq('id', membershipId)
          .single();

        if (fetchError || !membership) {
          failedCount++;
          errors.push(`Membresía ${membershipId}: No encontrada`);
          continue;
        }

        if (membership.status !== 'frozen') {
          failedCount++;
          errors.push(`${membership.Users?.firstName} ${membership.Users?.lastName}: Solo se pueden reactivar membresías congeladas`);
          continue;
        }

        const currentDate = toMexicoDate(new Date());
        let updateData: any = {
          status: 'active',
          freeze_date: null,
          unfreeze_date: currentDate,
          updated_at: getCurrentTimestamp(),
          updated_by: user.id
        };

        // Para reactivación automática, agregar días congelados
        if (!isManual && membership.freeze_date && membership.end_date) {
          const freezeDate = new Date(membership.freeze_date + 'T00:00:00');
          const todayDate = new Date(currentDate + 'T00:00:00');
          const daysToAdd = Math.max(0, Math.ceil((todayDate.getTime() - freezeDate.getTime()) / (1000 * 60 * 60 * 24)));
          
          if (daysToAdd > 0) {
            const newEndDate = addDaysToDate(membership.end_date, daysToAdd);
            updateData.end_date = newEndDate;
            updateData.total_frozen_days = (membership.total_frozen_days || 0) + daysToAdd;
          }
        }

        // Agregar nota
        const noteText = isManual ? 
          `Reactivado manualmente el ${currentDate}.${reason ? ` Motivo: ${reason}` : ''}` :
          `Reactivado automáticamente el ${currentDate}.${reason ? ` Motivo: ${reason}` : ''}`;
        updateData.notes = membership.notes ? `${membership.notes}\n${noteText}` : noteText;

        const { error: updateError } = await supabase
          .from('user_memberships')
          .update(updateData)
          .eq('id', membershipId);

        if (updateError) {
          failedCount++;
          errors.push(`${membership.Users?.firstName} ${membership.Users?.lastName}: ${updateError.message}`);
        } else {
          processedCount++;
        }

      } catch (error: any) {
        failedCount++;
        errors.push(`Membresía ${membershipId}: ${error.message}`);
      }
    }

    // Revalidar caché
    revalidatePath('/dashboard/admin/membresias/historial');

    return {
      success: true,
      data: {
        processed: processedCount,
        failed: failedCount,
        errors
      }
    };

  } catch (error: any) {
    console.error('Error en bulkUnfreezeMemberships:', error);
    return {
      success: false,
      error: 'Error interno del servidor'
    };
  }
}

// 📝 ACTUALIZAR MEMBRESÍA INDIVIDUAL
export async function updateMembership(
  formData: FormData
): Promise<ActionResponse> {
  try {
    const supabase = createServerSupabaseClient();
    
    // Obtener datos del FormData
    const membershipId = formData.get('membershipId') as string;
    const rawData = {
      membershipId,
      status: formData.get('status') as string || undefined,
      start_date: formData.get('start_date') as string || undefined,
      end_date: formData.get('end_date') as string || undefined,
      amount_paid: formData.get('amount_paid') ? parseFloat(formData.get('amount_paid') as string) : undefined,
      payment_method: formData.get('payment_method') as string || undefined,
      payment_reference: formData.get('payment_reference') as string || undefined,
      notes: formData.get('notes') as string || undefined,
      commission_rate: formData.get('commission_rate') ? parseFloat(formData.get('commission_rate') as string) : undefined,
      commission_amount: formData.get('commission_amount') ? parseFloat(formData.get('commission_amount') as string) : undefined,
      extend_days: formData.get('extend_days') ? parseInt(formData.get('extend_days') as string) : undefined,
      cash_amount: formData.get('cash_amount') ? parseFloat(formData.get('cash_amount') as string) : undefined,
      card_amount: formData.get('card_amount') ? parseFloat(formData.get('card_amount') as string) : undefined,
      transfer_amount: formData.get('transfer_amount') ? parseFloat(formData.get('transfer_amount') as string) : undefined,
    };

    // Validar datos
    const validationResult = UpdateMembershipSchema.safeParse(rawData);
    if (!validationResult.success) {
      return {
        success: false,
        validationErrors: validationResult.error.flatten().fieldErrors
      };
    }

    const { membershipId: validMembershipId, extend_days, ...updateFields } = validationResult.data;

    // Verificar permisos
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'No autorizado' };
    }

    // Obtener membresía actual
    const { data: currentMembership, error: fetchError } = await supabase
      .from('user_memberships')
      .select('*')
      .eq('id', validMembershipId)
      .single();

    if (fetchError || !currentMembership) {
      return { success: false, error: 'Membresía no encontrada' };
    }

    // Preparar datos de actualización
    const updateData: any = {
      ...updateFields,
      updated_at: getCurrentTimestamp(),
      updated_by: user.id
    };

    // Manejar extensión manual de días
    if (extend_days && extend_days > 0 && currentMembership.end_date) {
      const newEndDate = addDaysToDate(currentMembership.end_date, extend_days);
      updateData.end_date = newEndDate;
      
      const currentDate = toMexicoDate(new Date());
      const extensionNote = `Fecha extendida ${extend_days} día${extend_days > 1 ? 's' : ''} manualmente el ${currentDate}.`;
      updateData.notes = updateData.notes ? `${updateData.notes}\n${extensionNote}` : extensionNote;
    }

    // Manejar pago mixto
    if (updateData.payment_method === 'mixto') {
      updateData.is_mixed_payment = true;
      
      const paymentDetails = {
        cash_amount: updateData.cash_amount || 0,
        card_amount: updateData.card_amount || 0,
        transfer_amount: updateData.transfer_amount || 0,
        total_amount: (updateData.cash_amount || 0) + (updateData.card_amount || 0) + (updateData.transfer_amount || 0)
      };
      updateData.payment_details = paymentDetails;
    } else if (updateData.payment_method && updateData.payment_method !== 'mixto') {
      updateData.is_mixed_payment = false;
      updateData.payment_details = {};
    }

    // Limpiar campos no necesarios para la actualización
    delete updateData.cash_amount;
    delete updateData.card_amount;
    delete updateData.transfer_amount;

    // Actualizar en la base de datos
    const { error: updateError } = await supabase
      .from('user_memberships')
      .update(updateData)
      .eq('id', validMembershipId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Revalidar caché
    revalidatePath('/dashboard/admin/membresias/historial');

    return { success: true };

  } catch (error: any) {
    console.error('Error en updateMembership:', error);
    return {
      success: false,
      error: 'Error interno del servidor'
    };
  }
}

// 📊 OBTENER ESTADÍSTICAS DE MEMBRESÍAS
export async function getMembershipStats(): Promise<ActionResponse<{
  total: number;
  active: number;
  expired: number;
  frozen: number;
  cancelled: number;
  totalRevenue: number;
  totalCommissions: number;
}>> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: memberships, error } = await supabase
      .from('user_memberships')
      .select('status, amount_paid, commission_amount, end_date');

    if (error) {
      return { success: false, error: error.message };
    }

    const today = toMexicoDate(new Date());
    
    const stats = memberships.reduce((acc, membership) => {
      acc.total++;
      
      // Determinar estado real basado en fechas
      let actualStatus = membership.status;
      if (membership.status === 'active' && membership.end_date) {
        const endDate = new Date(membership.end_date + 'T00:00:00');
        const todayDate = new Date(today + 'T00:00:00');
        if (endDate < todayDate) {
          actualStatus = 'expired';
        }
      }

      switch (actualStatus) {
        case 'active':
          acc.active++;
          break;
        case 'expired':
          acc.expired++;
          break;
        case 'frozen':
          acc.frozen++;
          break;
        case 'cancelled':
          acc.cancelled++;
          break;
      }

      acc.totalRevenue += membership.amount_paid || 0;
      acc.totalCommissions += membership.commission_amount || 0;

      return acc;
    }, {
      total: 0,
      active: 0,
      expired: 0,
      frozen: 0,
      cancelled: 0,
      totalRevenue: 0,
      totalCommissions: 0
    });

    return { success: true, data: stats };

  } catch (error: any) {
    console.error('Error en getMembershipStats:', error);
    return {
      success: false,
      error: 'Error interno del servidor'
    };
  }
}
