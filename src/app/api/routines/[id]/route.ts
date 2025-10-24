import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET - Obtener una rutina específica
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient();

    const { data: routine, error } = await supabase
      .from('workout_routines')
      .select(`
        *,
        creator:created_by(id, firstName, lastName, email),
        routine_exercises(
          id,
          order_index,
          sets,
          reps,
          rest_seconds,
          notes,
          exercise:exercise_id(
            id,
            name,
            type,
            level,
            material,
            primary_muscles,
            secondary_muscles,
            initial_position,
            execution_eccentric,
            execution_isometric,
            execution_concentric,
            common_errors,
            contraindications,
            video_url,
            image_url,
            muscle_group:muscle_group_id(id, name)
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ [API] Error fetching routine:', error);
      return NextResponse.json(
        { error: 'Rutina no encontrada' },
        { status: 404 }
      );
    }

    // Ordenar ejercicios por order_index
    const sortedRoutine = {
      ...routine,
      routine_exercises: routine.routine_exercises?.sort((a: any, b: any) => a.order_index - b.order_index) || []
    };

    return NextResponse.json({ routine: sortedRoutine });

  } catch (error) {
    console.error('❌ [API] Error in GET /api/routines/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar rutina
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    // 1. Actualizar datos básicos de la rutina
    const { data: routine, error: updateError } = await supabase
      .from('workout_routines')
      .update({
        name: body.name,
        description: body.description || null,
        difficulty_level: body.difficulty_level,
        estimated_duration: body.estimated_duration || null,
        muscle_group_focus: body.muscle_group_focus || null,
        is_public: body.is_public || false
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ [API] Error updating routine:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar rutina', details: updateError.message },
        { status: 500 }
      );
    }

    // 2. Si se enviaron ejercicios, actualizar la lista completa
    if (body.exercises && Array.isArray(body.exercises)) {
      // Eliminar ejercicios existentes
      await supabase
        .from('routine_exercises')
        .delete()
        .eq('routine_id', id);

      // Insertar nuevos ejercicios
      const exercisesToInsert = body.exercises.map((ex: any, index: number) => ({
        routine_id: id,
        exercise_id: ex.exercise_id,
        order_index: index,
        sets: ex.sets || 3,
        reps: ex.reps || '10-12',
        rest_seconds: ex.rest_seconds || 60,
        notes: ex.notes || null
      }));

      const { error: exercisesError } = await supabase
        .from('routine_exercises')
        .insert(exercisesToInsert);

      if (exercisesError) {
        console.error('❌ [API] Error updating routine exercises:', exercisesError);
        return NextResponse.json(
          { error: 'Error al actualizar ejercicios', details: exercisesError.message },
          { status: 500 }
        );
      }
    }

    console.log(`✅ [API] Rutina actualizada: ${routine.name}`);

    // Retornar rutina completa actualizada
    const { data: completeRoutine } = await supabase
      .from('workout_routines')
      .select(`
        *,
        creator:created_by(id, firstName, lastName, email),
        routine_exercises(
          id,
          order_index,
          sets,
          reps,
          rest_seconds,
          notes,
          exercise:exercise_id(
            id,
            name,
            type,
            level,
            material,
            primary_muscles,
            secondary_muscles,
            initial_position,
            execution_eccentric,
            execution_isometric,
            execution_concentric,
            common_errors,
            contraindications,
            video_url,
            image_url,
            muscle_group:muscle_group_id(id, name)
          )
        )
      `)
      .eq('id', id)
      .single();

    return NextResponse.json({
      routine: completeRoutine,
      message: 'Rutina actualizada exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error in PUT /api/routines/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar rutina (soft delete)
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

    // Soft delete: marcar como inactiva
    const { error } = await supabase
      .from('workout_routines')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('❌ [API] Error deleting routine:', error);
      return NextResponse.json(
        { error: 'Error al eliminar rutina', details: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ [API] Rutina eliminada (soft delete): ${id}`);

    return NextResponse.json({
      message: 'Rutina eliminada exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error in DELETE /api/routines/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
