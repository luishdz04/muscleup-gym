// ========================================
// 🔔 API ENDPOINT: MARCAR TODAS COMO LEÍDAS
// ========================================
// POST /api/notifications/mark-all-read

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

    // ✅ USAR FUNCIÓN SQL
    const { data, error } = await supabase.rpc('mark_all_notifications_as_read', {
      p_user_id: user.id
    });

    if (error) {
      console.error('❌ Error al marcar todas como leídas:', error);
      return NextResponse.json(
        { error: 'Error al marcar todas como leídas', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      marked_count: data || 0,
      message: `${data || 0} notificaciones marcadas como leídas`
    });

  } catch (error: any) {
    console.error('❌ Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
