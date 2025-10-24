import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET - Obtener todas las rutinas (con filtros opcionales)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const searchParams = request.nextUrl.searchParams;

    const search = searchParams.get('search');
    const createdBy = searchParams.get('createdBy');
    const isPublic = searchParams.get('isPublic');
    const difficultyLevel = searchParams.get('difficultyLevel');
    const limitParam = searchParams.get('limit');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
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
      `, { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (createdBy) {
      query = query.eq('created_by', createdBy);
    }

    if (isPublic !== null && isPublic !== undefined) {
      query = query.eq('is_public', isPublic === 'true');
    }

    if (difficultyLevel) {
      query = query.eq('difficulty_level', difficultyLevel);
    }

    // Paginación (si se especifica limit)
    if (limitParam) {
      const limit = parseInt(limitParam);
      query = query.range(offset, offset + limit - 1);
    }

    const { data: routines, error, count } = await query;

    if (error) {
      console.error('❌ [API] Error fetching routines:', error);
      return NextResponse.json(
        { error: 'Error al obtener rutinas', details: error.message },
        { status: 500 }
      );
    }

    // Ordenar ejercicios dentro de cada rutina por order_index
    const sortedRoutines = routines?.map(routine => ({
      ...routine,
      routine_exercises: routine.routine_exercises?.sort((a: any, b: any) => a.order_index - b.order_index) || []
    }));

    console.log(`✅ [API] ${sortedRoutines?.length || 0} rutinas obtenidas`);

    return NextResponse.json({
      routines: sortedRoutines || [],
      pagination: limitParam ? {
        total: count || 0,
        offset,
        limit: parseInt(limitParam),
        totalPages: Math.ceil((count || 0) / parseInt(limitParam))
      } : null
    });

  } catch (error) {
    console.error('❌ [API] Error in GET /api/routines:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva rutina
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    // Validaciones
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: 'El nombre de la rutina es requerido' },
        { status: 400 }
      );
    }

    if (!body.exercises || !Array.isArray(body.exercises) || body.exercises.length === 0) {
      return NextResponse.json(
        { error: 'Debe incluir al menos un ejercicio en la rutina' },
        { status: 400 }
      );
    }

    // Obtener usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // 1. Crear la rutina
    const { data: routine, error: routineError } = await supabase
      .from('workout_routines')
      .insert({
        name: body.name,
        description: body.description || null,
        difficulty_level: body.difficulty_level || 'Intermedio',
        estimated_duration: body.estimated_duration || null,
        muscle_group_focus: body.muscle_group_focus || null,
        created_by: user.id,
        is_public: body.is_public || false,
        is_active: true
      })
      .select()
      .single();

    if (routineError || !routine) {
      console.error('❌ [API] Error creating routine:', routineError);
      return NextResponse.json(
        { error: 'Error al crear rutina', details: routineError?.message },
        { status: 500 }
      );
    }

    // 2. Crear los ejercicios de la rutina
    const exercisesToInsert = body.exercises.map((ex: any, index: number) => ({
      routine_id: routine.id,
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
      console.error('❌ [API] Error creating routine exercises:', exercisesError);
      // Rollback: eliminar la rutina creada
      await supabase.from('workout_routines').delete().eq('id', routine.id);

      return NextResponse.json(
        { error: 'Error al agregar ejercicios a la rutina', details: exercisesError.message },
        { status: 500 }
      );
    }

    console.log(`✅ [API] Rutina creada: ${routine.name} con ${exercisesToInsert.length} ejercicios`);

    // Retornar la rutina completa con sus ejercicios
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
      .eq('id', routine.id)
      .single();

    return NextResponse.json({
      routine: completeRoutine,
      message: 'Rutina creada exitosamente'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ [API] Error in POST /api/routines:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
