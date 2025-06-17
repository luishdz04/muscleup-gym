import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServerSupabaseClient();
  
  // Obtener configuración actual
  const { data: config, error: configError } = await supabase
    .from('access_control_config')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  // Obtener dispositivos
  const { data: devices, error: devicesError } = await supabase
    .from('biometric_devices')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (configError && configError.code !== 'PGRST116') { // No error si no hay configuración
    console.error('Error al obtener configuración:', configError);
    return NextResponse.json({ error: configError.message }, { status: 500 });
  }
  
  if (devicesError) {
    console.error('Error al obtener dispositivos:', devicesError);
    return NextResponse.json({ error: devicesError.message }, { status: 500 });
  }
  
  return NextResponse.json({ 
    config: config || {}, 
    devices: devices || [] 
  });
}

export async function PUT(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { config } = await req.json();
  
  const accessConfig = {
    enable_biometric: config.enableBiometric,
    require_active_membership: config.requireActiveMembership,
    allow_guest_access: config.allowGuestAccess,
    access_schedule_enabled: config.accessSchedule.enabled,
    access_start_time: config.accessSchedule.startTime,
    access_end_time: config.accessSchedule.endTime,
    access_days_of_week: config.accessSchedule.daysOfWeek,
    sync_interval_minutes: config.syncInterval,
    max_retries: config.maxRetries,
    timeout_seconds: config.timeout,
    updated_at: new Date().toISOString()
  };
  
  // Intentar actualizar si existe
  const { data: existingConfig } = await supabase
    .from('access_control_config')
    .select('id')
    .limit(1)
    .single();
  
  let result;
  
  if (existingConfig) {
    // Actualizar configuración existente
    result = await supabase
      .from('access_control_config')
      .update(accessConfig)
      .eq('id', existingConfig.id)
      .select()
      .single();
  } else {
    // Crear nueva configuración
    result = await supabase
      .from('access_control_config')
      .insert(accessConfig)
      .select()
      .single();
  }
  
  if (result.error) {
    console.error('Error al guardar configuración:', result.error);
    return NextResponse.json({ 
      success: false, 
      error: result.error.message 
    }, { status: 500 });
  }
  
  return NextResponse.json({ 
    success: true, 
    config: result.data 
  });
}