// src/app/api/biometric/get-next-device-id/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// 🎯 DEFINICIÓN DE RANGOS CORREGIDA
const USER_RANGES = {
  cliente: {
    min: 1,
    max: 5000,
    prefix: 'CLI'
  },
  empleado: {
    min: 7000,
    max: 7020,
    prefix: 'EMP'
  },
  admin: {  // ✅ CORREGIDO: 'admin' en lugar de 'administrador'
    min: 8000,
    max: 8010,
    prefix: 'ADM'
  }
} as const;

type UserType = keyof typeof USER_RANGES;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('userType') as UserType || 'cliente';
    
    // Validar tipo de usuario
    if (!USER_RANGES[userType]) {
      return NextResponse.json(
        { error: `Tipo de usuario inválido: ${userType}. Tipos válidos: cliente, empleado, admin` },  // ✅ CORREGIDO: 'admin'
        { status: 400 }
      );
    }
    
    const supabase = createServerSupabaseClient();
    const range = USER_RANGES[userType];
    
    console.log(`📊 Buscando siguiente ID para ${userType} en rango ${range.min}-${range.max}`);
    
    // Obtener el ID más alto EN EL RANGO específico
    const { data, error } = await supabase
      .from('device_user_mappings')
      .select('device_user_id')
      .gte('device_user_id', range.min)
      .lte('device_user_id', range.max)
      .order('device_user_id', { ascending: false })
      .limit(1);
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    // Calcular siguiente ID
    let nextId: number;
    
    if (data && data.length > 0) {
      // Hay registros en el rango, usar siguiente
      nextId = data[0].device_user_id + 1;
    } else {
      // No hay registros, empezar desde el mínimo del rango
      nextId = range.min;
    }
    
    // Verificar que no se agote el rango
    if (nextId > range.max) {
      console.error(`❌ Rango agotado para ${userType}: ${nextId} > ${range.max}`);
      return NextResponse.json(
        {
          error: `Rango de IDs agotado para ${userType}. Máximo: ${range.max}`,
          currentRange: `${range.min}-${range.max}`,
          suggestions: 'Contactar administrador para ampliar rango'
        },
        { status: 409 }
      );
    }
    
    // Generar respuesta completa
    const response = {
      success: true,
      nextId: nextId,
      userType: userType,
      displayId: `${range.prefix}${String(nextId).padStart(4, '0')}`, // EMP7003, CLI0001, ADM8000
      range: `${range.min}-${range.max}`,
      available: range.max - nextId, // IDs restantes en el rango
      deviceDisplay: `${nextId}` // Solo número para F22
    };
    
    console.log(`✅ Siguiente device_user_id para ${userType}:`, response);
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('❌ Error obteniendo siguiente ID:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}