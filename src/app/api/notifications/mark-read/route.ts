// ========================================
// 🔔 API ENDPOINT: MARCAR COMO LEÍDA
// ========================================
// POST /api/notifications/mark-read
// Body: { notification_id: 'uuid' }

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          // ✅ MÉTODO MODERNO: getAll (reemplaza get)
          getAll() {
            return request.cookies.getAll();
          },
          // ✅ MÉTODO MODERNO: setAll
          setAll(cookiesToSet) {
            // No es necesario en POST, pero requerido por el tipo
          },
        },
      }
    );
    
    // ✅ VERIFICAR AUTENTICACIÓN
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();
    
    if (sessionError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // ✅ OBTENER BODY
    const body = await request.json();
    const { notification_id } = body;

    if (!notification_id) {
      return NextResponse.json(
        { error: 'notification_id es requerido' },
        { status: 400 }
      );
    }

    // ✅ VERIFICAR QUE LA NOTIFICACIÓN PERTENEZCA AL USUARIO
    const { data: notification, error: checkError } = await supabase
      .from('notifications')
      .select('user_id')
      .eq('id', notification_id)
      .single();

    if (checkError || !notification) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      );
    }

    if (notification.user_id !== user.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    // ✅ USAR FUNCIÓN SQL
    const { error } = await supabase.rpc('mark_notification_as_read', {
      p_notification_id: notification_id
    });

    if (error) {
      console.error('❌ Error al marcar como leída:', error);
      return NextResponse.json(
        { error: 'Error al marcar como leída', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notificación marcada como leída'
    });

  } catch (error: any) {
    console.error('❌ Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
