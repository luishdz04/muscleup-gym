import { NextRequest, NextResponse } from 'next/server';
import { createAsyncServerSupabaseClient } from '@/lib/supabase/server-async';

// GET - Obtener configuración del gimnasio
export async function GET(request: NextRequest) {
  try {
    const supabase = await createAsyncServerSupabaseClient();

    // Obtener el primer registro de gym_settings
    const { data, error } = await supabase
      .from('gym_settings')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('❌ [GYM-SETTINGS] Error fetching settings:', error);
      return NextResponse.json(
        { error: 'Error al obtener configuración del gimnasio' },
        { status: 500 }
      );
    }

    console.log('✅ [GYM-SETTINGS] Settings fetched successfully');
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ [GYM-SETTINGS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error inesperado al obtener configuración' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar configuración del gimnasio
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createAsyncServerSupabaseClient();

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
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
        { error: 'No autorizado. Solo admins y empleados pueden actualizar la configuración.' },
        { status: 403 }
      );
    }

    // Obtener datos del body
    const body = await request.json();
    const {
      gym_name,
      gym_address,
      gym_phone,
      gym_email,
      gym_logo_url,
      gym_facebook_url,
      gym_maps_url,
      gym_hours
    } = body;

    console.log('📝 [GYM-SETTINGS] Updating settings:', {
      gym_name,
      gym_phone,
      updated_by: user.id
    });

    // Obtener el ID del registro actual
    const { data: currentSettings } = await supabase
      .from('gym_settings')
      .select('id')
      .limit(1)
      .single();

    if (!currentSettings) {
      return NextResponse.json(
        { error: 'No se encontró configuración del gimnasio' },
        { status: 404 }
      );
    }

    // Actualizar configuración
    const { data, error } = await supabase
      .from('gym_settings')
      .update({
        gym_name,
        gym_address,
        gym_phone,
        gym_email,
        gym_logo_url,
        gym_facebook_url,
        gym_maps_url,
        gym_hours,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentSettings.id)
      .select()
      .single();

    if (error) {
      console.error('❌ [GYM-SETTINGS] Error updating settings:', error);
      return NextResponse.json(
        { error: 'Error al actualizar configuración' },
        { status: 500 }
      );
    }

    console.log('✅ [GYM-SETTINGS] Settings updated successfully');
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ [GYM-SETTINGS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error inesperado al actualizar configuración' },
      { status: 500 }
    );
  }
}
