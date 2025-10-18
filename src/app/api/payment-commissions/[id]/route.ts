import { NextRequest, NextResponse } from 'next/server';
import { createAsyncServerSupabaseClient } from '@/lib/supabase/server-async';

// PUT - Actualizar comisión
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createAsyncServerSupabaseClient();

    // Verificar autenticación y rol
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('Users')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (!userData || (userData.rol !== 'admin' && userData.rol !== 'empleado')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { payment_method, commission_type, commission_value, min_amount, is_active } = body;

    const { data, error } = await supabase
      .from('payment_commissions')
      .update({
        payment_method,
        commission_type,
        commission_value: parseFloat(commission_value),
        min_amount: min_amount ? parseFloat(min_amount) : 0,
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('❌ [PAYMENT-COMMISSIONS] Error updating:', error);
      return NextResponse.json(
        { error: 'Error al actualizar comisión' },
        { status: 500 }
      );
    }

    console.log('✅ [PAYMENT-COMMISSIONS] Updated:', params.id);
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ [PAYMENT-COMMISSIONS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error inesperado' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar comisión
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createAsyncServerSupabaseClient();

    // Verificar autenticación y rol
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('Users')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (!userData || (userData.rol !== 'admin' && userData.rol !== 'empleado')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { error } = await supabase
      .from('payment_commissions')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('❌ [PAYMENT-COMMISSIONS] Error deleting:', error);
      return NextResponse.json(
        { error: 'Error al eliminar comisión' },
        { status: 500 }
      );
    }

    console.log('✅ [PAYMENT-COMMISSIONS] Deleted:', params.id);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ [PAYMENT-COMMISSIONS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error inesperado' },
      { status: 500 }
    );
  }
}
