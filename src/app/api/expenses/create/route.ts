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
      created_at_mexico // ✅ RECIBIR HORA MÉXICO DEL FRONTEND
    } = body;
    
    console.log('📊 Creando egreso con datos:', {
      expense_date,
      expense_type,
      description,
      amount,
      receipt_number,
      usuario: 'luishdz04'
    });
    
    // ✅ VALIDACIONES
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
    
    const supabase = createServerSupabaseClient();
    
    // ✅ OBTENER USUARIO AUTENTICADO O USAR HARDCODED COMO FALLBACK (IGUAL QUE CORTES)
    let userId;
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log('⚠️ No se pudo obtener usuario autenticado, usando usuario hardcodeado');
        const { data: hardcodedUser, error: userError } = await supabase
          .from('Users')
          .select('id')
          .eq('username', 'luishdz04')
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
    
    // ✅ USAR LÓGICA DE dateHelpers - TIMESTAMP CON OFFSET MÉXICO
    const now = new Date();
    const mexicoTimestamp = created_at_mexico || toMexicoTimestamp(now);
    
    // 🔢 GENERAR TIEMPO DEL EGRESO (solo hora)
    const mexicoDate = new Date(mexicoTimestamp);
    const timeStr = mexicoDate.toLocaleTimeString('es-MX', {
      timeZone: 'America/Mexico_City',
      hour12: false
    });
    
    console.log('🇲🇽 Aplicando lógica de dateHelpers para egreso:', {
      utc_actual: now.toISOString(),
      mexico_timestamp: mexicoTimestamp,
      expense_time: timeStr,
      nota: 'Usando toMexicoTimestamp con offset -06:00'
    });
    
    // 💾 INSERTAR EGRESO EN BD CON TIMESTAMP MÉXICO
    const { data: newExpense, error: insertError } = await supabase
      .from('expenses')
      .insert([{
        expense_date,
        expense_time: timeStr,
        expense_type,
        description: description.trim(),
        amount: parseFloat(amount),
        receipt_number: receipt_number?.trim() || null,
        notes: notes?.trim() || null,
        status: 'active',
        created_by: userId,
        created_at: mexicoTimestamp, // ✅ TIMESTAMP CON OFFSET MÉXICO
        updated_at: mexicoTimestamp  // ✅ TIMESTAMP CON OFFSET MÉXICO
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
      
      throw insertError;
    }
    
    console.log('✅ Egreso creado con dateHelpers:', {
      egreso_id: newExpense.id,
      timestamp_guardado: mexicoTimestamp,
      hora_utc_actual: now.toISOString()
    });
    
    // 🔄 SINCRONIZACIÓN AUTOMÁTICA CON CORTE (si existe)
    console.log('🔄 Iniciando sincronización automática con corte...');
    
    try {
      const syncResponse = await fetch(`${request.nextUrl.origin}/api/expenses/sync-with-cut`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: expense_date })
      });
      
      const syncData = await syncResponse.json();
      
      if (syncData.success) {
        console.log('✅ Sincronización automática exitosa:', syncData.cut_number);
      } else {
        console.log('ℹ️ No hay corte para sincronizar o error menor:', syncData.error);
      }
    } catch (syncError) {
      console.log('⚠️ Error en sincronización (no crítico):', syncError);
    }
    
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

// ✅ FUNCIÓN PARA FORMATEAR PRECIO (IGUAL QUE CORTES)
function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(amount);
}
