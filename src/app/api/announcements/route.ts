import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET - Obtener anuncios activos (público para clientes autenticados)
export async function GET(request: NextRequest) {
  console.log('📢 [ANNOUNCEMENTS] GET API called');

  try {
    const supabase = createServerSupabaseClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const now = new Date().toISOString();

    // Get active announcements with optional date filtering
    const { data: announcements, error } = await supabase
      .from('client_announcements')
      .select('*')
      .eq('is_active', true)
      .or(`start_date.is.null,start_date.lte.${now}`)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      // Si la tabla no existe, devolver array vacío en lugar de error
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.warn('⚠️ [ANNOUNCEMENTS] Table does not exist yet, returning empty array');
        return NextResponse.json([]);
      }

      console.error('❌ [ANNOUNCEMENTS] Error fetching:', error);
      return NextResponse.json(
        { error: 'Error al obtener anuncios' },
        { status: 500 }
      );
    }

    console.log(`✅ [ANNOUNCEMENTS] Fetched ${announcements?.length || 0} announcements`);
    return NextResponse.json(announcements || []);

  } catch (error) {
    console.error('❌ [ANNOUNCEMENTS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo anuncio (solo admin/empleado)
export async function POST(request: NextRequest) {
  console.log('📢 [ANNOUNCEMENTS] POST API called');

  try {
    const supabase = createServerSupabaseClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar rol (admin/empleado)
    const { data: userData } = await supabase
      .from('Users')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (!userData || (userData.rol !== 'admin' && userData.rol !== 'empleado')) {
      return NextResponse.json(
        { error: 'No autorizado. Solo admins y empleados pueden crear anuncios.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, message, type, priority, is_active, start_date, end_date } = body;

    // Validaciones
    if (!title || !message) {
      return NextResponse.json(
        { error: 'Título y mensaje son requeridos' },
        { status: 400 }
      );
    }

    console.log('📝 [ANNOUNCEMENTS] Creating announcement:', { title, type, priority });

    const { data, error } = await supabase
      .from('client_announcements')
      .insert([{
        title,
        message,
        type: type || 'info',
        priority: priority || 0,
        is_active: is_active !== undefined ? is_active : true,
        start_date: start_date || null,
        end_date: end_date || null,
        created_by: user.id
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ [ANNOUNCEMENTS] Error creating:', error);
      return NextResponse.json(
        { error: 'Error al crear anuncio' },
        { status: 500 }
      );
    }

    console.log('✅ [ANNOUNCEMENTS] Announcement created successfully');
    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('❌ [ANNOUNCEMENTS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
