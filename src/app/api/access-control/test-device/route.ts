import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import ZKLib from 'zklib-js';

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { ip, port, deviceId } = await req.json();

  // Actualizar el estado a 'testing'
  await supabase
    .from('biometric_devices')
    .update({ status: 'testing', updated_at: new Date().toISOString() })
    .eq('id', deviceId);

  const zk = new ZKLib(ip, port || 4370, 10000, 4000);
  
  try {
    await zk.createSocket();

    // Obtener información y número de usuarios
    const infoResponse = await zk.getInfo();
    const usersResponse = await zk.getTotalUsers();
    
    if (!infoResponse.data || !usersResponse.data) {
      throw new Error('No se pudo obtener información del dispositivo');
    }
    
    const info = infoResponse.data;
    const users = usersResponse.data;

    await zk.disconnect();

    // Actualizar en Supabase
    const { error } = await supabase
      .from('biometric_devices')
      .update({
        status: 'connected',
        firmware_version: info.firmwareVersion,
        serial_number: info.serialNumber,
        user_count: users,
        updated_at: new Date().toISOString()
      })
      .eq('id', deviceId);

    if (error) {
      console.error('Error actualizando dispositivo:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      firmware: info.firmwareVersion, 
      userCount: users 
    });
  } catch (err: any) {
    console.error('Error conectando con dispositivo:', err);
    
    // Actualizar estado a desconectado
    await supabase
      .from('biometric_devices')
      .update({ 
        status: 'disconnected',
        updated_at: new Date().toISOString()
      })
      .eq('id', deviceId);
    
    return NextResponse.json({ 
      success: false, 
      error: err.message || 'Error conectando con el dispositivo'
    }, { status: 500 });
  }
}