import { NextRequest, NextResponse } from 'next/server';
import { createAsyncServerSupabaseClient } from '@/lib/supabase/server-async';

// GET - Obtener configuración del gimnasio (público - no requiere autenticación)
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
      console.error('❌ [GYM-SETTINGS] Error details:', JSON.stringify(error, null, 2));

      // Si no hay datos, devolver valores por defecto
      const defaultSettings = {
        id: 'default',
        gym_name: 'Muscle Up GYM',
        gym_address: 'Francisco I. Madero 708, Colonia Lindavista, San Buenaventura, Coahuila, México',
        gym_phone: '866 112 7905',
        gym_email: 'administracion@muscleupgym.fitness',
        gym_logo_url: null,
        gym_facebook_url: 'https://www.facebook.com/Lindavistagym',
        gym_maps_url: 'https://maps.app.goo.gl/preWqm3w7S2JZLg17',
        gym_hours: {
          monday: { open: '06:00', close: '23:00', enabled: true },
          tuesday: { open: '06:00', close: '23:00', enabled: true },
          wednesday: { open: '06:00', close: '23:00', enabled: true },
          thursday: { open: '06:00', close: '23:00', enabled: true },
          friday: { open: '06:00', close: '23:00', enabled: true },
          saturday: { open: '06:00', close: '23:00', enabled: true },
          sunday: { open: '06:00', close: '23:00', enabled: false }
        }
      };

      console.log('⚠️ [GYM-SETTINGS] Returning default settings due to error');
      return NextResponse.json(defaultSettings);
    }

    if (!data) {
      console.warn('⚠️ [GYM-SETTINGS] No settings found in database, using defaults');
      const defaultSettings = {
        id: 'default',
        gym_name: 'Muscle Up GYM',
        gym_address: 'Francisco I. Madero 708, Colonia Lindavista, San Buenaventura, Coahuila, México',
        gym_phone: '866 112 7905',
        gym_email: 'administracion@muscleupgym.fitness',
        gym_logo_url: null,
        gym_facebook_url: 'https://www.facebook.com/Lindavistagym',
        gym_maps_url: 'https://maps.app.goo.gl/preWqm3w7S2JZLg17',
        gym_hours: {
          monday: { open: '06:00', close: '23:00', enabled: true },
          tuesday: { open: '06:00', close: '23:00', enabled: true },
          wednesday: { open: '06:00', close: '23:00', enabled: true },
          thursday: { open: '06:00', close: '23:00', enabled: true },
          friday: { open: '06:00', close: '23:00', enabled: true },
          saturday: { open: '06:00', close: '23:00', enabled: true },
          sunday: { open: '06:00', close: '23:00', enabled: false }
        }
      };
      return NextResponse.json(defaultSettings);
    }

    console.log('✅ [GYM-SETTINGS] Settings fetched successfully');
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ [GYM-SETTINGS] Unexpected error:', error);

    // Devolver valores por defecto en caso de error
    const defaultSettings = {
      id: 'default',
      gym_name: 'Muscle Up GYM',
      gym_address: 'Francisco I. Madero 708, Colonia Lindavista, San Buenaventura, Coahuila, México',
      gym_phone: '866 112 7905',
      gym_email: 'administracion@muscleupgym.fitness',
      gym_logo_url: null,
      gym_facebook_url: 'https://www.facebook.com/Lindavistagym',
      gym_maps_url: 'https://maps.app.goo.gl/preWqm3w7S2JZLg17',
      gym_hours: {
        monday: { open: '06:00', close: '23:00', enabled: true },
        tuesday: { open: '06:00', close: '23:00', enabled: true },
        wednesday: { open: '06:00', close: '23:00', enabled: true },
        thursday: { open: '06:00', close: '23:00', enabled: true },
        friday: { open: '06:00', close: '23:00', enabled: true },
        saturday: { open: '06:00', close: '23:00', enabled: true },
        sunday: { open: '06:00', close: '23:00', enabled: false }
      }
    };

    console.log('⚠️ [GYM-SETTINGS] Returning default settings due to unexpected error');
    return NextResponse.json(defaultSettings);
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
