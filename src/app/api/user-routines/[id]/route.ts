import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// DELETE - Desasignar rutina de un usuario
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Eliminar asignación
    const { error } = await supabase
      .from('user_routines')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ [API] Error deleting user routine:', error);
      return NextResponse.json(
        { error: 'Error al desasignar rutina', details: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ [API] Rutina desasignada (ID: ${id})`);

    return NextResponse.json({
      message: 'Rutina desasignada exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error in DELETE /api/user-routines/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar estado de rutina asignada
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Actualizar rutina asignada
    const updateData: any = {};
    if (body.status) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.start_date) updateData.start_date = body.start_date;
    if (body.end_date) updateData.end_date = body.end_date;

    const { data: userRoutine, error } = await supabase
      .from('user_routines')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ [API] Error updating user routine:', error);
      return NextResponse.json(
        { error: 'Error al actualizar rutina asignada', details: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ [API] Rutina asignada actualizada (ID: ${id})`);

    return NextResponse.json({
      userRoutine,
      message: 'Rutina actualizada exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error in PATCH /api/user-routines/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
