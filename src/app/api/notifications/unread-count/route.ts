// ========================================
// 🔔 API ENDPOINT: CONTADOR NO LEÍDAS
// ========================================
// GET /api/notifications/unread-count

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // ✅ VERIFICAR AUTENTICACIÓN
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();
    
    if (sessionError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // ✅ USAR FUNCIÓN SQL OPTIMIZADA
    const { data, error } = await supabase.rpc('get_unread_count', {
      p_user_id: user.id
    });

    if (error) {
      console.error('❌ Error al obtener contador:', error);
      return NextResponse.json(
        { error: 'Error al obtener contador', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      unread_count: data || 0
    });

  } catch (error: any) {
    console.error('❌ Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
