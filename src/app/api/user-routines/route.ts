import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET - Obtener rutinas del usuario (asignadas + generales públicas)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const searchParams = request.nextUrl.searchParams;

    const userId = searchParams.get('userId');
    const routineId = searchParams.get('routine_id');
    const status = searchParams.get('status');

    // Si no se especifica userId, obtener el del usuario autenticado
    let targetUserId = userId;
    if (!targetUserId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json(
          { error: 'No autenticado' },
          { status: 401 }
        );
      }
      targetUserId = user.id;
    }

    // 1. Obtener rutinas ASIGNADAS específicamente al usuario
    let assignedQuery = supabase
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
          is_public,
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
      .eq('user_id', targetUserId)
      .order('assigned_date', { ascending: false });

    // Filtrar por routine_id si se proporciona
    if (routineId) {
      assignedQuery = assignedQuery.eq('routine_id', routineId);
    }

    // Filtrar por status si se proporciona
    if (status) {
      assignedQuery = assignedQuery.eq('status', status);
    }

    const { data: assignedRoutines, error: assignedError } = await assignedQuery;

    if (assignedError) {
      console.error('❌ [API] Error fetching assigned routines:', assignedError);
      return NextResponse.json(
        { error: 'Error al obtener rutinas asignadas', details: assignedError.message },
        { status: 500 }
      );
    }

    // 2. Obtener rutinas GENERALES (is_public = true) que NO estén ya asignadas
    const assignedRoutineIds = assignedRoutines?.map(ur => ur.routine_id) || [];
    
    let publicQuery = supabase
      .from('workout_routines')
      .select(`
        id,
        name,
        description,
        difficulty_level,
        estimated_duration,
        muscle_group_focus,
        is_public,
        created_at,
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
      .eq('is_public', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Si hay rutinas asignadas, excluirlas de las públicas para evitar duplicados
    if (assignedRoutineIds.length > 0) {
      publicQuery = publicQuery.not('id', 'in', `(${assignedRoutineIds.join(',')})`);
    }

    const { data: publicRoutines, error: publicError } = await publicQuery;

    if (publicError) {
      console.error('❌ [API] Error fetching public routines:', publicError);
      return NextResponse.json(
        { error: 'Error al obtener rutinas públicas', details: publicError.message },
        { status: 500 }
      );
    }

    // 3. Formatear rutinas públicas para que tengan la misma estructura que las asignadas
    const formattedPublicRoutines = publicRoutines?.map(routine => ({
      id: `public-${routine.id}`, // ID único para evitar colisiones
      routine_id: routine.id,
      user_id: targetUserId,
      assigned_date: routine.created_at, // Usar fecha de creación como referencia
      start_date: routine.created_at,
      end_date: null,
      status: 'active', // Las rutinas públicas siempre están activas
      notes: 'Rutina general disponible para todos',
      assigned_by: null,
      routine: routine,
      user: null,
      assigned_by_user: null,
      is_public_routine: true // Flag para identificar rutinas públicas
    })) || [];

    // 4. Combinar ambos conjuntos de rutinas
    const allRoutines = [
      ...(assignedRoutines || []).map(ur => ({ ...ur, is_public_routine: false })),
      ...formattedPublicRoutines
    ];

    // 5. Ordenar ejercicios dentro de cada rutina
    const sortedUserRoutines = allRoutines.map(ur => ({
      ...ur,
      routine: ur.routine ? {
        ...ur.routine,
        routine_exercises: ur.routine.routine_exercises?.sort((a: any, b: any) => a.order_index - b.order_index) || []
      } : null
    }));

    console.log(`✅ [API] Usuario ${targetUserId}: ${assignedRoutines?.length || 0} asignadas + ${formattedPublicRoutines.length} generales = ${sortedUserRoutines.length} total`);

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
