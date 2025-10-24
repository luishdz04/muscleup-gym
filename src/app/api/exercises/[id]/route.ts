import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('exercises')
      .select(`
        *,
        muscle_group:muscle_groups(id, name, description)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('❌ [API-EXERCISES] Error fetching exercise:', error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ [API-EXERCISES] Error in exercise GET:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient();

    // Verificar si es admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userRole = user.user_metadata?.role;
    if (userRole !== 'admin' && userRole !== 'empleado') {
      return NextResponse.json({ error: 'Sin permisos para editar ejercicios' }, { status: 403 });
    }

    const body = await request.json();

    console.log('📝 [API-EXERCISES] Updating exercise:', id);

    // Actualizar ejercicio
    const { data: exercise, error: exerciseError } = await supabase
      .from('exercises')
      .update({
        name: body.name,
        type: body.type,
        primary_muscles: body.primary_muscles || [],
        secondary_muscles: body.secondary_muscles || [],
        material: body.material || '',
        level: body.level,
        muscle_group_id: body.muscle_group_id,
        initial_position: body.initial_position || '',
        execution_eccentric: body.execution_eccentric || '',
        execution_isometric: body.execution_isometric || '',
        execution_concentric: body.execution_concentric || '',
        common_errors: body.common_errors || [],
        contraindications: body.contraindications || [],
        video_url: body.video_url || null,
        image_url: body.image_url || null
      })
      .eq('id', id)
      .select()
      .single();

    if (exerciseError) {
      console.error('❌ [API-EXERCISES] Error updating exercise:', exerciseError);
      return NextResponse.json({ error: exerciseError.message }, { status: 500 });
    }

    console.log('✅ [API-EXERCISES] Exercise updated:', id);
    return NextResponse.json(exercise);

  } catch (error) {
    console.error('❌ [API-EXERCISES] Error in exercise PUT:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient();

    // Verificar si es admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userRole = user.user_metadata?.role;
    if (userRole !== 'admin' && userRole !== 'empleado') {
      return NextResponse.json({ error: 'Sin permisos para eliminar ejercicios' }, { status: 403 });
    }

    console.log('🗑️ [API-EXERCISES] Deleting exercise:', id);

    // Hard delete del ejercicio
    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ [API-EXERCISES] Error deleting exercise:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ [API-EXERCISES] Exercise deleted:', id);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ [API-EXERCISES] Error in exercise DELETE:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
