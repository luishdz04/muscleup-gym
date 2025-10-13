import { NextRequest, NextResponse } from 'next/server';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

/**
 * API Route: GET /api/biometric/get-next-device-id
 * 
 * Retorna el siguiente ID secuencial disponible para asignar a un usuario
 * en el dispositivo biométrico F22.
 * 
 * Query params:
 * - userType: 'empleado' | 'cliente' | 'administrador'
 * 
 * Lógica de rangos:
 * - Clientes: 1-6999
 * - Empleados: 7000-7999
 * - Administradores: 8000-8999
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userType = searchParams.get('userType') || 'cliente';
    
    console.log(`🔢 [API] Obteniendo siguiente device_user_id para tipo: ${userType}`);
    
    const supabase = createBrowserSupabaseClient();
    
    // 🎯 Definir rangos por tipo de usuario
    const ranges: Record<string, { min: number; max: number }> = {
      cliente: { min: 1, max: 6999 },
      empleado: { min: 7000, max: 7999 },
      administrador: { min: 8000, max: 8999 }
    };
    
    const range = ranges[userType] || ranges.cliente;
    
    // 📊 Obtener el máximo device_user_id usado en el rango
    const { data, error } = await supabase
      .from('device_user_mappings')
      .select('device_user_id')
      .gte('device_user_id', range.min)
      .lte('device_user_id', range.max)
      .order('device_user_id', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('❌ [API] Error consultando device_user_mappings:', error);
      
      // Si hay error, retornar el inicio del rango como fallback
      return NextResponse.json({ 
        success: true, 
        nextId: range.min,
        currentMax: null,
        fallback: true,
        range: range
      });
    }
    
    // 🔢 Calcular siguiente ID
    let nextId: number;
    
    if (!data || data.length === 0) {
      // No hay registros en este rango, empezar desde el mínimo
      nextId = range.min;
      console.log(`📌 [API] No hay registros en rango ${userType}, iniciando en: ${nextId}`);
    } else {
      const maxId = data[0].device_user_id;
      nextId = maxId + 1;
      
      // Validar que no excedamos el rango máximo
      if (nextId > range.max) {
        console.error(`⚠️ [API] Rango ${userType} agotado (${range.min}-${range.max})`);
        return NextResponse.json({ 
          success: false, 
          error: `Rango de IDs agotado para tipo ${userType}`,
          range: range,
          currentMax: maxId
        }, { status: 400 });
      }
      
      console.log(`✅ [API] Máximo actual: ${maxId}, siguiente ID: ${nextId}`);
    }
    
    return NextResponse.json({ 
      success: true, 
      nextId,
      currentMax: data && data.length > 0 ? data[0].device_user_id : null,
      userType,
      range: range
    });
    
  } catch (error: any) {
    console.error('❌ [API] Error inesperado obteniendo siguiente ID:', error);
    
    // Fallback seguro según tipo
    const fallbackRanges: Record<string, number> = {
      empleado: 7000,
      cliente: 1,
      administrador: 8000
    };
    
    const searchParams = request.nextUrl.searchParams;
    const userType = searchParams.get('userType') || 'cliente';
    
    return NextResponse.json({ 
      success: true, 
      nextId: fallbackRanges[userType] || 1,
      error: error.message,
      fallback: true
    }, { status: 200 }); // Retornar 200 con fallback para no bloquear el flujo
  }
}
