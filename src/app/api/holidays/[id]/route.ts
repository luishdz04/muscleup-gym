import { NextRequest, NextResponse } from 'next/server';
import { createAsyncServerSupabaseClient } from '@/lib/supabase/server-async';
import type { Holiday } from '../route';

// PUT - Actualizar día festivo (solo admins y empleados)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: 'No autorizado. Solo admins y empleados pueden actualizar días festivos.' },
        { status: 403 }
      );
    }

    // Obtener datos del body
    const body: Partial<Holiday> = await request.json();
    const { date, name, type, emoji, is_active } = body;

    const updateData: any = {};
    if (date !== undefined) updateData.date = date;
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (emoji !== undefined) updateData.emoji = emoji;
    if (is_active !== undefined) updateData.is_active = is_active;

    console.log('📝 [HOLIDAYS] Updating holiday:', params.id);

    // Actualizar día festivo
    const { data, error } = await supabase
      .from('holidays')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('❌ [HOLIDAYS] Error updating holiday:', error);
      return NextResponse.json(
        { error: 'Error al actualizar día festivo' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Día festivo no encontrado' },
        { status: 404 }
      );
    }

    console.log('✅ [HOLIDAYS] Holiday updated successfully');
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ [HOLIDAYS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error inesperado al actualizar día festivo' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar día festivo (solo admins)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verificar rol (solo admin)
    const { data: userData } = await supabase
      .from('Users')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (!userData || userData.rol !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado. Solo admins pueden eliminar días festivos.' },
        { status: 403 }
      );
    }

    console.log('🗑️ [HOLIDAYS] Deleting holiday:', params.id);

    // Eliminar día festivo
    const { error } = await supabase
      .from('holidays')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('❌ [HOLIDAYS] Error deleting holiday:', error);
      return NextResponse.json(
        { error: 'Error al eliminar día festivo' },
        { status: 500 }
      );
    }

    console.log('✅ [HOLIDAYS] Holiday deleted successfully');
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ [HOLIDAYS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error inesperado al eliminar día festivo' },
      { status: 500 }
    );
  }
}
