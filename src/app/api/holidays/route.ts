import { NextRequest, NextResponse } from 'next/server';
import { createAsyncServerSupabaseClient } from '@/lib/supabase/server-async';

export interface Holiday {
  id?: string;
  date: string;
  name: string;
  type: 'official' | 'traditional' | 'special';
  emoji: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// GET - Obtener todos los días festivos (público - solo activos para no autenticados)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createAsyncServerSupabaseClient();

    // Verificar si el usuario está autenticado
    const { data: { user } } = await supabase.auth.getUser();

    let query = supabase
      .from('holidays')
      .select('*')
      .order('date', { ascending: true });

    // Si no está autenticado, solo mostrar activos
    if (!user) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ [HOLIDAYS] Error fetching holidays:', error);
      return NextResponse.json(
        { error: 'Error al obtener días festivos' },
        { status: 500 }
      );
    }

    console.log(`✅ [HOLIDAYS] Fetched ${data?.length || 0} holidays`);
    return NextResponse.json(data || []);

  } catch (error) {
    console.error('❌ [HOLIDAYS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error inesperado al obtener días festivos' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo día festivo (solo admins y empleados)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createAsyncServerSupabaseClient();

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar rol (admin/empleado)
    const { data: userData } = await supabase
      .from('Users')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (!userData || (userData.rol !== 'admin' && userData.rol !== 'empleado')) {
      return NextResponse.json(
        { error: 'No autorizado. Solo admins y empleados pueden crear días festivos.' },
        { status: 403 }
      );
    }

    // Obtener datos del body
    const body: Partial<Holiday> = await request.json();
    const { date, name, type, emoji, is_active } = body;

    if (!date || !name || !type) {
      return NextResponse.json(
        { error: 'Campos requeridos: date, name, type' },
        { status: 400 }
      );
    }

    console.log('📝 [HOLIDAYS] Creating holiday:', { date, name, type });

    // Crear día festivo
    const { data, error } = await supabase
      .from('holidays')
      .insert({
        date,
        name,
        type,
        emoji: emoji || '🎉',
        is_active: is_active !== undefined ? is_active : true
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [HOLIDAYS] Error creating holiday:', error);
      return NextResponse.json(
        { error: 'Error al crear día festivo' },
        { status: 500 }
      );
    }

    console.log('✅ [HOLIDAYS] Holiday created successfully');
    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('❌ [HOLIDAYS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error inesperado al crear día festivo' },
      { status: 500 }
    );
  }
}
