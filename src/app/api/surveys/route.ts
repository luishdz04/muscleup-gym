import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET - Obtener encuestas (clientes: solo activas, admin: todas)
export async function GET(request: NextRequest) {
  console.log('📊 [SURVEYS] GET API called');

  try {
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Check if user is admin/empleado
    const { data: userData } = await supabase
      .from('Users')
      .select('rol')
      .eq('id', user.id)
      .single();

    const isAdmin = userData?.rol === 'admin' || userData?.rol === 'empleado';

    let query = supabase
      .from('surveys')
      .select('*')
      .order('created_at', { ascending: false });

    // Si no es admin, solo mostrar encuestas activas en período válido
    if (!isAdmin) {
      const now = new Date().toISOString();
      query = query
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now);
    }

    const { data: surveys, error } = await query;

    if (error) {
      console.error('❌ [SURVEYS] Error fetching:', error);
      return NextResponse.json({ error: 'Error al obtener encuestas' }, { status: 500 });
    }

    // Para admin, agregar conteo de respuestas
    if (isAdmin && surveys) {
      const surveysWithCounts = await Promise.all(
        surveys.map(async (survey) => {
          const { count } = await supabase
            .from('survey_responses')
            .select('*', { count: 'exact', head: true })
            .eq('survey_id', survey.id);

          return {
            ...survey,
            response_count: count || 0
          };
        })
      );

      console.log(`✅ [SURVEYS] Fetched ${surveysWithCounts.length} surveys with counts`);
      return NextResponse.json(surveysWithCounts);
    }

    console.log(`✅ [SURVEYS] Fetched ${surveys?.length || 0} surveys`);
    return NextResponse.json(surveys || []);

  } catch (error) {
    console.error('❌ [SURVEYS] Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Crear nueva encuesta (solo admin/empleado)
export async function POST(request: NextRequest) {
  console.log('📊 [SURVEYS] POST API called');

  try {
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar rol
    const { data: userData } = await supabase
      .from('Users')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (!userData || (userData.rol !== 'admin' && userData.rol !== 'empleado')) {
      return NextResponse.json(
        { error: 'No autorizado. Solo admins y empleados pueden crear encuestas.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, start_date, end_date, is_active, max_responses_per_user } = body;

    // Validaciones
    if (!title || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Título, fecha de inicio y fin son requeridos' },
        { status: 400 }
      );
    }

    console.log('📝 [SURVEYS] Creating survey:', { title, start_date, end_date });

    const { data, error } = await supabase
      .from('surveys')
      .insert([{
        title,
        description: description || null,
        start_date,
        end_date,
        is_active: is_active !== undefined ? is_active : true,
        max_responses_per_user: max_responses_per_user || 1,
        created_by: user.id
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ [SURVEYS] Error creating:', error);
      return NextResponse.json({ error: 'Error al crear encuesta' }, { status: 500 });
    }

    console.log('✅ [SURVEYS] Survey created successfully');
    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('❌ [SURVEYS] Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
