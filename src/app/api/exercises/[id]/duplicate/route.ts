import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar rol
    const userRole = user.user_metadata?.role;
    if (userRole !== 'admin' && userRole !== 'empleado') {
      return NextResponse.json({ error: 'Sin permisos para duplicar ejercicios' }, { status: 403 });
    }

    const exerciseId = params.id;
    console.log('📋 [API-EXERCISES-DUPLICATE] Duplicating exercise:', exerciseId);

    // Obtener ejercicio original
    const { data: originalExercise, error: fetchError } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', exerciseId)
      .single();

    if (fetchError || !originalExercise) {
      console.error('❌ [API-EXERCISES-DUPLICATE] Exercise not found:', fetchError);
      return NextResponse.json({ error: 'Ejercicio no encontrado' }, { status: 404 });
    }

    // Crear nombre para la copia
    const copyName = `${originalExercise.name} (copia)`;

    // Verificar si ya existe un ejercicio con ese nombre
    let finalName = copyName;
    let counter = 1;

    while (true) {
      const { data: existing } = await supabase
        .from('exercises')
        .select('id')
        .eq('name', finalName)
        .single();

      if (!existing) break;

      counter++;
      finalName = `${originalExercise.name} (copia ${counter})`;
    }

    // Duplicar ejercicio (sin el ID)
    const { data: newExercise, error: insertError } = await supabase
      .from('exercises')
      .insert({
        name: finalName,
        type: originalExercise.type,
        primary_muscles: originalExercise.primary_muscles,
        secondary_muscles: originalExercise.secondary_muscles,
        material: originalExercise.material,
        level: originalExercise.level,
        muscle_group_id: originalExercise.muscle_group_id,
        initial_position: originalExercise.initial_position,
        execution_eccentric: originalExercise.execution_eccentric,
        execution_isometric: originalExercise.execution_isometric,
        execution_concentric: originalExercise.execution_concentric,
        common_errors: originalExercise.common_errors,
        contraindications: originalExercise.contraindications,
        video_url: originalExercise.video_url,
        image_url: originalExercise.image_url,
        is_active: true
      })
      .select(`
        *,
        muscle_group:muscle_groups(id, name, description)
      `)
      .single();

    if (insertError) {
      console.error('❌ [API-EXERCISES-DUPLICATE] Error duplicating:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    console.log('✅ [API-EXERCISES-DUPLICATE] Exercise duplicated:', newExercise.id);

    return NextResponse.json({
      message: 'Ejercicio duplicado exitosamente',
      exercise: newExercise
    });

  } catch (error) {
    console.error('❌ [API-EXERCISES-DUPLICATE] Error:', error);
    return NextResponse.json(
      { error: 'Error al duplicar ejercicio' },
      { status: 500 }
    );
  }
}
