// ========================================
// 🧹 API ENDPOINT: LIMPIEZA DE NOTIFICACIONES ANTIGUAS
// ========================================
// POST /api/notifications/cleanup
// Ejecutar semanalmente (puede ser manual o automático)

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // ✅ VERIFICAR AUTENTICACIÓN Y PERMISOS (SOLO ADMIN)
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();
    
    if (sessionError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar que sea admin
    const { data: userData } = await supabase
      .from('Users')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (!userData || userData.rol !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado. Solo admins pueden ejecutar limpieza.' },
        { status: 403 }
      );
    }

    // ✅ EJECUTAR LIMPIEZA (borra notificaciones de más de 7 días)
    const { data, error } = await supabase.rpc('cleanup_old_notifications', {
      days_to_keep: 7
    });

    if (error) {
      console.error('❌ Error al limpiar notificaciones:', error);
      return NextResponse.json(
        { error: 'Error al limpiar notificaciones', details: error.message },
        { status: 500 }
      );
    }

    const deletedCount = data?.[0]?.deleted_count || 0;

    return NextResponse.json({
      success: true,
      message: `Limpieza completada. ${deletedCount} notificaciones eliminadas.`,
      deleted_count: deletedCount
    });

  } catch (error: any) {
    console.error('❌ Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
