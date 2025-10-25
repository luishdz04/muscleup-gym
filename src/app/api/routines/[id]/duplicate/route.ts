import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: routineId } = await params;
    const supabase = createServerSupabaseClient();

    // Obtener rutina original con ejercicios
    const { data: originalRoutine, error: fetchError } = await supabase
      .from('workout_routines')
      .select(`
        *,
        routine_exercises(
          exercise_id,
          order_index,
          sets,
          reps,
          rest_seconds,
          notes
        )
      `)
      .eq('id', routineId)
      .single();

    if (fetchError || !originalRoutine) {
      return NextResponse.json(
        { error: 'Rutina no encontrada' },
        { status: 404 }
      );
    }

    // Generar nombre único
    let baseName = originalRoutine.name;
    let copyName = `${baseName} (copia)`;
    let counter = 1;

    // Verificar si el nombre ya existe
    while (true) {
      const { data: existing } = await supabase
        .from('workout_routines')
        .select('id')
        .eq('name', copyName)
        .single();

      if (!existing) break;

      counter++;
      copyName = `${baseName} (copia ${counter})`;
    }

    // Crear rutina duplicada (sin ejercicios)
    const { data: newRoutine, error: createError } = await supabase
      .from('workout_routines')
      .insert({
        name: copyName,
        description: originalRoutine.description,
        difficulty_level: originalRoutine.difficulty_level,
        estimated_duration: originalRoutine.estimated_duration,
        muscle_group_focus: originalRoutine.muscle_group_focus,
        is_public: originalRoutine.is_public
      })
      .select()
      .single();

    if (createError || !newRoutine) {
      return NextResponse.json(
        { error: 'Error al crear copia de rutina' },
        { status: 500 }
      );
    }

    // Duplicar ejercicios de la rutina
    if (originalRoutine.routine_exercises && originalRoutine.routine_exercises.length > 0) {
      const exercisesToInsert = originalRoutine.routine_exercises.map((re: any) => ({
        routine_id: newRoutine.id,
        exercise_id: re.exercise_id,
        order_index: re.order_index,
        sets: re.sets,
        reps: re.reps,
        rest_seconds: re.rest_seconds,
        notes: re.notes
      }));

      const { error: exercisesError } = await supabase
        .from('routine_exercises')
        .insert(exercisesToInsert);

      if (exercisesError) {
        console.error('Error al duplicar ejercicios:', exercisesError);
        // No retornamos error, la rutina fue creada exitosamente
      }
    }

    // Obtener rutina completa para retornar
    const { data: completeRoutine } = await supabase
      .from('workout_routines')
      .select(`
        *,
        routine_exercises(
          id,
          exercise_id,
          order_index,
          sets,
          reps,
          rest_seconds,
          notes,
          exercise:exercises(*)
        )
      `)
      .eq('id', newRoutine.id)
      .single();

    return NextResponse.json({
      routine: completeRoutine || newRoutine,
      message: `Rutina duplicada exitosamente como "${copyName}"`
    });
  } catch (error) {
    console.error('❌ Error duplicating routine:', error);
    return NextResponse.json(
      { error: 'Error al duplicar rutina' },
      { status: 500 }
    );
  }
}
