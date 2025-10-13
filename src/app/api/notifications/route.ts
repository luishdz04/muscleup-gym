// ========================================
// 🔔 API ENDPOINT: OBTENER NOTIFICACIONES
// ========================================
// GET /api/notifications
// GET /api/notifications?limit=20&offset=0&unread=true

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';
import { getTodayInMexico } from '@/utils/dateUtils';

export async function GET(request: NextRequest) {
  try {
    // ✅ USAR HELPER CENTRALIZADO (sin warnings)
    const supabase = createRouteHandlerClient(request);
    
    // ✅ VERIFICAR AUTENTICACIÓN
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();
    
    if (sessionError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // ✅ OBTENER PARÁMETROS DE QUERY
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unread') === 'true';

    // ✅ CONSTRUIR QUERY - SOLO NOTIFICACIONES DE HOY (ZONA HORARIA MÉXICO)
    const todayInMexico = getTodayInMexico(); // 'YYYY-MM-DD' en México
    
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('created_at', `${todayInMexico}T00:00:00-06:00`) // Inicio del día en México (UTC-6)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filtrar solo no leídas si se solicita
    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    // ✅ EJECUTAR QUERY
    const { data, error, count } = await query;

    if (error) {
      console.error('❌ Error al obtener notificaciones:', error);
      return NextResponse.json(
        { error: 'Error al obtener notificaciones', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      count,
      limit,
      offset
    });

  } catch (error: any) {
    console.error('❌ Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

// ========================================
// 🔔 API ENDPOINT: CREAR NOTIFICACIÓN MANUAL
// ========================================
// POST /api/notifications
// Body: { user_id, type, title, message, priority?, action_url?, metadata? }

export async function POST(request: NextRequest) {
  try {
    // ✅ USAR HELPER CENTRALIZADO (sin warnings)
    const supabase = createRouteHandlerClient(request);
    
    // ✅ VERIFICAR AUTENTICACIÓN Y ROL ADMIN
    const { data: { user: authUser }, error: sessionError } = await supabase.auth.getUser();
    
    if (sessionError || !authUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar que sea admin
    const { data: user, error: userError } = await supabase
      .from('Users')
      .select('rol')
      .eq('id', authUser.id)
      .single();

    if (userError || !user || !['admin', 'empleado'].includes(user.rol)) {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores y empleados pueden crear notificaciones.' },
        { status: 403 }
      );
    }

    // ✅ OBTENER BODY
    const body = await request.json();
    const { 
      user_id, 
      type, 
      title, 
      message, 
      priority = 'normal',
      action_url = null,
      metadata = {}
    } = body;

    // ✅ VALIDACIONES
    if (!user_id || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: user_id, type, title, message' },
        { status: 400 }
      );
    }

    // ✅ USAR FUNCIÓN HELPER DE SQL
    const { data, error } = await supabase.rpc('create_notification', {
      p_user_id: user_id,
      p_type: type,
      p_title: title,
      p_message: message,
      p_priority: priority,
      p_action_url: action_url,
      p_metadata: metadata
    });

    if (error) {
      console.error('❌ Error al crear notificación:', error);
      return NextResponse.json(
        { error: 'Error al crear notificación', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      notification_id: data,
      message: 'Notificación creada exitosamente'
    });

  } catch (error: any) {
    console.error('❌ Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
