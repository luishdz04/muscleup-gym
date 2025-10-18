import { NextRequest, NextResponse } from 'next/server';
import { createAsyncServerSupabaseClient } from '@/lib/supabase/server-async';

// GET - Obtener todas las comisiones de pago
export async function GET(request: NextRequest) {
  try {
    const supabase = await createAsyncServerSupabaseClient();

    const { data, error } = await supabase
      .from('payment_commissions')
      .select('*')
      .order('payment_method', { ascending: true });

    if (error) {
      console.error('❌ [PAYMENT-COMMISSIONS] Error fetching:', error);
      return NextResponse.json(
        { error: 'Error al obtener comisiones' },
        { status: 500 }
      );
    }

    console.log('✅ [PAYMENT-COMMISSIONS] Fetched:', data?.length || 0);
    return NextResponse.json(data || []);

  } catch (error) {
    console.error('❌ [PAYMENT-COMMISSIONS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error inesperado' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva comisión
export async function POST(request: NextRequest) {
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
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { payment_method, commission_type, commission_value, min_amount, is_active } = body;

    // Validaciones
    if (!payment_method || !commission_type || commission_value === undefined) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('payment_commissions')
      .insert({
        payment_method,
        commission_type,
        commission_value: parseFloat(commission_value),
        min_amount: min_amount ? parseFloat(min_amount) : 0,
        is_active: is_active !== undefined ? is_active : true
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [PAYMENT-COMMISSIONS] Error creating:', error);
      return NextResponse.json(
        { error: 'Error al crear comisión' },
        { status: 500 }
      );
    }

    console.log('✅ [PAYMENT-COMMISSIONS] Created:', data.id);
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ [PAYMENT-COMMISSIONS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error inesperado' },
      { status: 500 }
    );
  }
}
