import { NextRequest, NextResponse } from 'next/server';
import { createAsyncServerSupabaseClient } from '@/lib/supabase/server-async';

export async function GET(request: NextRequest) {
  try {
    // ✅ Usar el cliente async compatible con Next.js 15
    const supabase = await createAsyncServerSupabaseClient();
    
    const { data: devices, error } = await supabase
      .from('biometric_devices')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('❌ Error fetching devices:', error);
      throw new Error(`Error fetching devices: ${error.message}`);
    }

    console.log(`✅ Found ${devices?.length || 0} devices`);

    return NextResponse.json({
      success: true,
      devices: devices || []
    });

  } catch (error: any) {
    console.error('❌ Error in devices API:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createAsyncServerSupabaseClient();
    
    const testDevice = {
      name: body.name || 'ZKTeco Test Device',
      type: body.type || 'zk9500',
      model: body.model || 'ZK9500',
      ip_address: body.ip_address || '192.168.1.100',
      port: body.port || 4370,
      status: 'connected',
      firmware_version: '1.0.0',
      serial_number: 'ZK001',
      user_count: body.user_count || 0,
      fingerprint_count: body.fingerprint_count || 0,
      is_active: true,
      ws_port: 4001,
      device_type: 'zkteco'
    };

    const { data: device, error } = await supabase
      .from('biometric_devices')
      .insert(testDevice)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating device: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      device: device
    });

  } catch (error: any) {
    console.error('❌ Error in POST devices:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}