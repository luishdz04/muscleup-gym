import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log('🗑️ [DELETE-MEMBERSHIP] Iniciando eliminación de membresía:', id);

    const supabase = createServerSupabaseClient();

    // Verificar que el usuario tenga permisos de admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ [DELETE-MEMBERSHIP] No autorizado');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar el rol del usuario
    const userRole = user.user_metadata?.role;
    if (userRole !== 'admin' && userRole !== 'empleado') {
      console.error('❌ [DELETE-MEMBERSHIP] Usuario sin permisos suficientes');
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar membresías' },
        { status: 403 }
      );
    }

    // 1. Primero obtener los detalles de la membresía
    const { data: membership, error: membershipError } = await supabase
      .from('user_memberships')
      .select(`
        *,
        membership_payment_details (
          id,
          payment_method,
          amount
        ),
        user:Users!user_memberships_userid_fkey (
          id,
          firstName,
          lastName,
          email
        ),
        plan:membership_plans (
          id,
          name
        )
      `)
      .eq('id', id)
      .single();

    if (membershipError || !membership) {
      console.error('❌ [DELETE-MEMBERSHIP] Membresía no encontrada:', membershipError);
      return NextResponse.json(
        { error: 'Membresía no encontrada' },
        { status: 404 }
      );
    }

    console.log('💳 [DELETE-MEMBERSHIP] Detalles de pago:', membership.membership_payment_details?.length || 0);

    // 2. Registrar en logs antes de eliminar
    const userName = membership.user
      ? `${membership.user.firstName} ${membership.user.lastName}`.trim()
      : 'Usuario desconocido';

    const planName = membership.plan?.name || 'Plan desconocido';

    const logData = {
      action: 'DELETE_MEMBERSHIP',
      table_name: 'user_memberships',
      record_id: id,
      user_id: user.id,
      details: {
        membership_id: id,
        user_id: membership.userid,
        user_name: userName,
        plan_name: planName,
        payment_type: membership.payment_type,
        total_amount: membership.total_amount,
        start_date: membership.start_date,
        end_date: membership.end_date,
        status: membership.status,
        payment_details_count: membership.membership_payment_details?.length || 0,
        deleted_at: new Date().toISOString(),
        reason: 'Manual deletion by admin/employee'
      }
    };

    await supabase
      .from('system_logs')
      .insert(logData);

    console.log('📝 [DELETE-MEMBERSHIP] Log de eliminación creado');

    // 3. Eliminar los eventos de cambio de membresía si existen
    const { error: eventsDeleteError } = await supabase
      .from('membership_change_events')
      .delete()
      .eq('membership_id', id);

    if (eventsDeleteError) {
      console.log('⚠️ [DELETE-MEMBERSHIP] Error eliminando eventos (puede no existir):', eventsDeleteError.message);
    }

    // 4. Eliminar los detalles de pago primero (por las foreign keys)
    if (membership.membership_payment_details && membership.membership_payment_details.length > 0) {
      const { error: paymentDeleteError } = await supabase
        .from('membership_payment_details')
        .delete()
        .eq('membership_id', id);

      if (paymentDeleteError) {
        console.error('❌ [DELETE-MEMBERSHIP] Error eliminando detalles de pago:', paymentDeleteError);
        return NextResponse.json(
          {
            error: 'Error al eliminar los detalles de pago de la membresía',
            details: paymentDeleteError.message
          },
          { status: 500 }
        );
      } else {
        console.log(`✅ [DELETE-MEMBERSHIP] ${membership.membership_payment_details.length} detalles de pago eliminados`);
      }
    }

    // 5. Finalmente eliminar la membresía principal
    const { error: deleteError } = await supabase
      .from('user_memberships')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('❌ [DELETE-MEMBERSHIP] Error eliminando membresía:', deleteError);
      return NextResponse.json(
        {
          error: 'Error al eliminar la membresía',
          details: deleteError.message
        },
        { status: 500 }
      );
    }

    console.log('✅ [DELETE-MEMBERSHIP] Membresía eliminada completamente');

    // 6. Si la membresía estaba activa, actualizar el estado del usuario
    if (membership.status === 'active' && membership.userid) {
      // Verificar si el usuario tiene otra membresía activa
      const { data: otherMemberships } = await supabase
        .from('user_memberships')
        .select('id')
        .eq('userid', membership.userid)
        .eq('status', 'active')
        .limit(1);

      // Si no tiene otras membresías activas, podríamos actualizar algo en el usuario
      // Por ahora solo lo registramos
      if (!otherMemberships || otherMemberships.length === 0) {
        console.log('ℹ️ [DELETE-MEMBERSHIP] Usuario sin membresías activas después de la eliminación');
      }
    }

    return NextResponse.json({
      success: true,
      message: `Membresía eliminada completamente`,
      details: {
        membership_id: id,
        user_name: userName,
        plan_name: planName,
        total_amount: membership.total_amount,
        payment_details_removed: membership.membership_payment_details?.length || 0
      }
    });

  } catch (error) {
    console.error('❌ [DELETE-MEMBERSHIP] Error general:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la membresía' },
      { status: 500 }
    );
  }
}