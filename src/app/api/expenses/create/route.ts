import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// ✅ FUNCIÓN PARA TIMESTAMP MÉXICO (IGUAL QUE CORTES)
function toMexicoTimestamp(date: Date): string {
  const mexicoTime = new Date(date.toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
  const year = mexicoTime.getFullYear();
  const month = String(mexicoTime.getMonth() + 1).padStart(2, '0');
  const day = String(mexicoTime.getDate()).padStart(2, '0');
  const hours = String(mexicoTime.getHours()).padStart(2, '0');
  const minutes = String(mexicoTime.getMinutes()).padStart(2, '0');
  const seconds = String(mexicoTime.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}-06:00`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      expense_date,
      expense_type,
      description,
      amount,
      receipt_number,
      notes,
      created_at_mexico
    } = body;
    
    console.log('📊 Creando egreso con datos:', {
      expense_date,
      expense_type,
      description,
      amount,
      receipt_number,
      usuario: 'luishdz04'
    });
    
    // ✅ VALIDACIONES CON TIPOS REALES DE TABLA
    if (!expense_date || !expense_type || !description || !amount) {
      return NextResponse.json(
        { error: 'Campos requeridos: fecha, tipo, descripción y monto', success: false },
        { status: 400 }
      );
    }
    
    if (parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser mayor a 0', success: false },
        { status: 400 }
      );
    }
    
    // ✅ VALIDAR TIPO DE EGRESO SEGÚN CONSTRAINT
    const validTypes = [
      'nomina', 'suplementos', 'servicios', 'mantenimiento', 
      'limpieza', 'marketing', 'equipamiento', 'otros'
    ];
    
    if (!validTypes.includes(expense_type)) {
      return NextResponse.json(
        { error: `Tipo de egreso no válido. Tipos permitidos: ${validTypes.join(', ')}`, success: false },
        { status: 400 }
      );
    }
    
    const supabase = createServerSupabaseClient();
    
    // ✅ OBTENER USUARIO (usando luishdz04 como fallback)
    let userId;
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log('⚠️ No se pudo obtener usuario autenticado, buscando luishdz04...');
        const { data: hardcodedUser, error: userError } = await supabase
          .from('Users')
          .select('id')
          .ilike('email', '%luis%')
          .limit(1)
          .single();
        
        if (userError || !hardcodedUser) {
          const { data: anyAdmin, error: adminError } = await supabase
            .from('Users')
            .select('id')
            .eq('rol', 'admin')
            .limit(1)
            .single();
          
          if (adminError || !anyAdmin) {
            return NextResponse.json(
              { error: 'No se pudo determinar el usuario para crear el egreso', success: false },
              { status: 401 }
            );
          }
          userId = anyAdmin.id;
        } else {
          userId = hardcodedUser.id;
        }
      } else {
        userId = user.id;
      }
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      return NextResponse.json(
        { error: 'Error de autenticación', success: false },
        { status: 401 }
      );
    }
    
    const now = new Date();
    const mexicoTimestamp = created_at_mexico || toMexicoTimestamp(now);
    
    // ✅ CREAR TIMESTAMP PARA expense_time (timestamp sin timezone)
    const mexicoTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
    
    console.log('🇲🇽 Insertando egreso con estructura correcta de tabla...');
    
    // ✅ INSERTAR EGRESO CON ESTRUCTURA REAL DE TABLA
    const { data: newExpense, error: insertError } = await supabase
      .from('expenses')
      .insert([{
        expense_date,
        expense_time: mexicoTime.toISOString(), // timestamp without time zone
        expense_type,
        description: description.trim(),
        amount: parseFloat(amount),
        receipt_number: receipt_number?.trim() || null,
        notes: notes?.trim() || null,
        status: 'active',
        created_by: userId,
        created_at: mexicoTime.toISOString(),
        updated_at: mexicoTime.toISOString()
      }])
      .select()
      .single();
    
    if (insertError) {
      console.error('💥 Error insertando egreso:', insertError);
      
      if (insertError.code === '23503') {
        console.error('❌ Error de foreign key - Usuario no válido:', userId);
        return NextResponse.json(
          { error: 'Usuario no válido para crear egreso', success: false },
          { status: 400 }
        );
      }
      
      if (insertError.code === '23514') {
        console.error('❌ Error de constraint - Datos no válidos:', insertError.message);
        return NextResponse.json(
          { error: 'Datos no válidos: ' + insertError.message, success: false },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Error insertando egreso: ' + insertError.message, success: false },
        { status: 500 }
      );
    }
    
    console.log('✅ Egreso creado exitosamente:', {
      egreso_id: newExpense.id,
      timestamp_guardado: mexicoTimestamp,
      hora_utc_actual: now.toISOString()
    });
    
    return NextResponse.json({
      success: true,
      message: `Egreso creado exitosamente: ${formatPrice(parseFloat(amount))}`,
      expense_id: newExpense.id,
      expense: newExpense,
      mexico_time: mexicoTimestamp,
      utc_time: now.toISOString()
    });
    
  } catch (error: any) {
    console.error('💥 Error en API create expense:', error);
    return NextResponse.json(
      { 
        error: 'Error al crear el egreso', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        success: false 
      },
      { status: 500 }
    );
  }
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(amount);
}
