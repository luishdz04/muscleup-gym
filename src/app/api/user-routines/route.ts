import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET - Obtener rutinas asignadas a un usuario (o todas si no se especifica userId)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const searchParams = request.nextUrl.searchParams;

    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    // Construir query base
    let query = supabase
      .from('user_routines')
      .select(`
        *,
        routine:routine_id(
          id,
          name,
          description,
          difficulty_level,
          estimated_duration,
          muscle_group_focus,
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
        ),
        user:user_id(id, firstName, lastName, email),
        assigned_by_user:assigned_by(id, firstName, lastName)
      `)
      .order('assigned_date', { ascending: false });

    // Filtrar por userId si se proporciona
    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Filtrar por status si se proporciona
    if (status) {
      query = query.eq('status', status);
    }

    const { data: userRoutines, error } = await query;

    if (error) {
      console.error('❌ [API] Error fetching user routines:', error);
      return NextResponse.json(
        { error: 'Error al obtener rutinas del usuario', details: error.message },
        { status: 500 }
      );
    }

    // Ordenar ejercicios dentro de cada rutina
    const sortedUserRoutines = userRoutines?.map(ur => ({
      ...ur,
      routine: ur.routine ? {
        ...ur.routine,
        routine_exercises: ur.routine.routine_exercises?.sort((a: any, b: any) => a.order_index - b.order_index) || []
      } : null
    }));

    console.log(`✅ [API] ${sortedUserRoutines?.length || 0} rutinas asignadas al usuario ${userId}`);

    return NextResponse.json({
      userRoutines: sortedUserRoutines || []
    });

  } catch (error) {
    console.error('❌ [API] Error in GET /api/user-routines:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Asignar rutina a usuario
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    // Validaciones
    if (!body.user_id || !body.routine_id) {
      return NextResponse.json(
        { error: 'user_id y routine_id son requeridos' },
        { status: 400 }
      );
    }

    // Obtener usuario autenticado (quien asigna)
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Crear asignación
    const { data: userRoutine, error } = await supabase
      .from('user_routines')
      .insert({
        user_id: body.user_id,
        routine_id: body.routine_id,
        assigned_by: user.id,
        start_date: body.start_date || new Date().toISOString().split('T')[0],
        end_date: body.end_date || null,
        status: 'active',
        notes: body.notes || null
      })
      .select(`
        *,
        routine:routine_id(
          id,
          name,
          description,
          difficulty_level,
          estimated_duration
        ),
        user:user_id(id, firstName, lastName, email)
      `)
      .single();

    if (error) {
      console.error('❌ [API] Error assigning routine:', error);
      return NextResponse.json(
        { error: 'Error al asignar rutina', details: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ [API] Rutina ${body.routine_id} asignada al usuario ${body.user_id}`);

    return NextResponse.json({
      userRoutine,
      message: 'Rutina asignada exitosamente'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ [API] Error in POST /api/user-routines:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
