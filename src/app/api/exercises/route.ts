import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') || '';
    const muscleGroup = searchParams.get('muscleGroup') || '';
    const level = searchParams.get('level') || '';
    const type = searchParams.get('type') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 1000;
    const offset = (page - 1) * limit;

    console.log('📚 [API-EXERCISES] Fetching exercises...');

    // Construir query base
    let query = supabase
      .from('exercises')
      .select(`
        *,
        muscle_group:muscle_groups(id, name, description)
      `, { count: 'exact' })
      .eq('is_active', true)
      .order('name', { ascending: true });

    // Aplicar filtros
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (muscleGroup) {
      query = query.eq('muscle_group_id', muscleGroup);
    }

    if (level) {
      query = query.eq('level', level);
    }

    if (type) {
      query = query.eq('type', type);
    }

    // Paginación solo si se especificó un límite explícito
    if (limitParam) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ [API-EXERCISES] Error fetching exercises:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`✅ [API-EXERCISES] ${data?.length || 0} exercises fetched`);

    return NextResponse.json({
      exercises: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('❌ [API-EXERCISES] Error in exercises GET:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Verificar si es admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar rol (el rol está en user_metadata)
    const userRole = user.user_metadata?.role;
    if (userRole !== 'admin' && userRole !== 'empleado') {
      return NextResponse.json({ error: 'Sin permisos para crear ejercicios' }, { status: 403 });
    }

    const body = await request.json();

    // Validación básica
    if (!body.name || !body.type || !body.muscle_group_id || !body.level) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: name, type, muscle_group_id, level' },
        { status: 400 }
      );
    }

    console.log('📝 [API-EXERCISES] Creating exercise:', body.name);

    // Insertar ejercicio
    const { data: exercise, error: exerciseError } = await supabase
      .from('exercises')
      .insert({
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
        image_url: body.image_url || null,
        is_active: true
      })
      .select()
      .single();

    if (exerciseError) {
      console.error('❌ [API-EXERCISES] Error creating exercise:', exerciseError);
      return NextResponse.json({ error: exerciseError.message }, { status: 500 });
    }

    console.log('✅ [API-EXERCISES] Exercise created:', exercise.id);
    return NextResponse.json(exercise);

  } catch (error) {
    console.error('❌ [API-EXERCISES] Error in exercises POST:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
