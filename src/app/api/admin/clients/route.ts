import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

// GET /api/admin/clients - Obtener solo usuarios con rol "cliente"
export async function GET(request: NextRequest) {
  try {
    console.log('📊 [API-CLIENTS] Obteniendo clientes...');

    const supabaseAdmin = createAdminSupabaseClient();
    const { data: users, error } = await supabaseAdmin
      .from('Users')
      .select(`
        id,
        firstName,
        lastName,
        email,
        whatsapp,
        rol
      `)
      .eq('rol', 'cliente')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('❌ [API-CLIENTS] Error en query:', error);
      return NextResponse.json(
        { message: 'Error al obtener clientes: ' + error.message },
        { status: 500 }
      );
    }

    console.log(`✅ [API-CLIENTS] ${users?.length || 0} clientes obtenidos exitosamente`);

    return NextResponse.json({ users: users || [] });

  } catch (error: any) {
    console.error('❌ [API-CLIENTS] Error en API:', error);
    return NextResponse.json(
      { message: 'Error interno: ' + (error.message || 'Error desconocido') },
      { status: 500 }
    );
  }
}
