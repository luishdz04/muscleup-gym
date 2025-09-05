// src/app/api/biometric/get-next-device-id/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    
    // Obtener el ID más alto actual
    const { data, error } = await supabase
      .from('device_user_mappings')
      .select('device_user_id')
      .order('device_user_id', { ascending: false })
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = tabla vacía
      throw error;
    }
    
    // Si no hay registros, empezar en 1, si hay, usar el siguiente
    const nextId = data && data.length > 0 ? (data[0].device_user_id + 1) : 1;
    
    console.log('📊 Siguiente device_user_id disponible:', nextId);
    
    return NextResponse.json({ 
      success: true, 
      nextId: nextId 
    });
    
  } catch (error: any) {
    console.error('❌ Error obteniendo siguiente ID:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
