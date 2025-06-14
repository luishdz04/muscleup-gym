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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const expenseId = params.id;
    const body = await request.json();
    
    const {
      expense_type,
      description,
      amount,
      receipt_number,
      notes,
      updated_at_mexico // ✅ RECIBIR HORA MÉXICO DEL FRONTEND
    } = body;
    
    console.log('✏️ Actualizando egreso:', {
      expense_id: expenseId,
      expense_type,
      description,
      amount,
      receipt_number,
      usuario: 'luishdz04'
    });
    
    // ✅ VALIDACIONES
    if (!expense_type || !description || !amount) {
      return NextResponse.json(
        { error: 'Campos requeridos: tipo, descripción y monto', success: false },
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
              { error: 'No se pudo determinar el usuario para actualizar el egreso', success: false },
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
    
    // ✅ VERIFICAR QUE EL EGRESO EXISTE
    const { data: existingExpense, error: fetchError } = await supabase
      .from('expenses')
      .select('id, expense_date, amount')
      .eq('id', expenseId)
      .eq('status', 'active')
      .single();
    
    if (fetchError || !existingExpense) {
      console.error('❌ Egreso no encontrado:', expenseId, fetchError);
      return NextResponse.json(
        { error: 'Egreso no encontrado o inactivo', success: false },
        { status: 404 }
      );
    }
    
    // ✅ USAR LÓGICA DE dateHelpers - TIMESTAMP CON OFFSET MÉXICO
    const now = new Date();
    const mexicoTimestamp = updated_at_mexico || toMexicoTimestamp(now);
    
    console.log('🇲🇽 Aplicando lógica de dateHelpers para actualización:', {
      utc_actual: now.toISOString(),
      mexico_timestamp: mexicoTimestamp,
      egreso_existente: existingExpense.id,
      nota: 'Usando toMexicoTimestamp con offset -06:00'
    });
    
    // 💾 ACTUALIZAR EGRESO EN BD CON TIMESTAMP MÉXICO
    const { data: updatedExpense, error: updateError } = await supabase
      .from('expenses')
      .update({
        expense_type,
        description: description.trim(),
        amount: parseFloat(amount),
        receipt_number: receipt_number?.trim() || null,
        notes: notes?.trim() || null,
        updated_at: mexicoTimestamp, // ✅ TIMESTAMP CON OFFSET MÉXICO
        updated_by: userId
      })
      .eq('id', expenseId)
      .select()
      .single();
    
    if (updateError) {
      console.error('💥 Error actualizando egreso:', updateError);
      throw updateError;
    }
    
    console.log('✅ Egreso actualizado con dateHelpers:', {
      egreso_id: updatedExpense.id,
      timestamp_actualizado: mexicoTimestamp,
      hora_utc_actual: now.toISOString(),
      monto_anterior: existingExpense.amount,
      monto_nuevo: parseFloat(amount)
    });
    
    // 🔄 SINCRONIZACIÓN AUTOMÁTICA CON CORTE (si existe)
    console.log('🔄 Iniciando sincronización automática con corte...');
    
    try {
      const syncResponse = await fetch(`${request.nextUrl.origin}/api/expenses/sync-with-cut`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: existingExpense.expense_date })
      });
      
      const syncData = await syncResponse.json();
      
      if (syncData.success) {
        console.log('✅ Sincronización automática exitosa:', syncData.cut_number);
        return NextResponse.json({
          success: true,
          message: `Egreso actualizado y sincronizado: ${formatPrice(parseFloat(amount))}`,
          expense_id: updatedExpense.id,
          expense: updatedExpense,
          sync_info: syncData,
          mexico_time: mexicoTimestamp,
          utc_time: now.toISOString()
        });
      } else {
        console.log('ℹ️ No hay corte para sincronizar:', syncData.error);
        return NextResponse.json({
          success: true,
          message: `Egreso actualizado exitosamente: ${formatPrice(parseFloat(amount))}`,
          expense_id: updatedExpense.id,
          expense: updatedExpense,
          mexico_time: mexicoTimestamp,
          utc_time: now.toISOString(),
          note: 'Sin corte asociado para sincronizar'
        });
      }
    } catch (syncError) {
      console.log('⚠️ Error en sincronización (no crítico):', syncError);
      return NextResponse.json({
        success: true,
        message: `Egreso actualizado exitosamente: ${formatPrice(parseFloat(amount))}`,
        expense_id: updatedExpense.id,
        expense: updatedExpense,
        mexico_time: mexicoTimestamp,
        utc_time: now.toISOString(),
        note: 'Actualizado sin sincronización (error menor)'
      });
    }
    
  } catch (error: any) {
    console.error('💥 Error en API update expense:', error);
    return NextResponse.json(
      { 
        error: 'Error al actualizar el egreso', 
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
