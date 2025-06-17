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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const expenseId = params.id;
    
    console.log('🗑️ Eliminando egreso:', {
      expense_id: expenseId,
      usuario: 'luishdz04'
    });
    
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
              { error: 'No se pudo determinar el usuario para eliminar el egreso', success: false },
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
    
    // ✅ VERIFICAR QUE EL EGRESO EXISTE Y OBTENER DATOS
    const { data: existingExpense, error: fetchError } = await supabase
      .from('expenses')
      .select('id, expense_date, amount, description, expense_type')
      .eq('id', expenseId)
      .eq('status', 'active')
      .single();
    
    if (fetchError || !existingExpense) {
      console.error('❌ Egreso no encontrado:', expenseId, fetchError);
      return NextResponse.json(
        { error: 'Egreso no encontrado o ya eliminado', success: false },
        { status: 404 }
      );
    }
    
    // ✅ USAR LÓGICA DE dateHelpers - TIMESTAMP CON OFFSET MÉXICO
    const now = new Date();
    const mexicoTimestamp = toMexicoTimestamp(now);
    
    console.log('🇲🇽 Aplicando lógica de dateHelpers para eliminación:', {
      utc_actual: now.toISOString(),
      mexico_timestamp: mexicoTimestamp,
      egreso_a_eliminar: existingExpense.id,
      monto: existingExpense.amount,
      nota: 'Usando toMexicoTimestamp con offset -06:00'
    });
    
    // 💾 MARCAR COMO ELIMINADO (SOFT DELETE) CON TIMESTAMP MÉXICO
    const { data: deletedExpense, error: deleteError } = await supabase
      .from('expenses')
      .update({
        status: 'deleted',
        updated_at: mexicoTimestamp, // ✅ TIMESTAMP CON OFFSET MÉXICO
        updated_by: userId,
        notes: (existingExpense.notes || '') + ` [ELIMINADO el ${mexicoTimestamp} por usuario ${userId}]`
      })
      .eq('id', expenseId)
      .select()
      .single();
    
    if (deleteError) {
      console.error('💥 Error eliminando egreso:', deleteError);
      throw deleteError;
    }
    
    console.log('✅ Egreso eliminado con dateHelpers:', {
      egreso_id: deletedExpense.id,
      timestamp_eliminado: mexicoTimestamp,
      hora_utc_actual: now.toISOString(),
      monto_eliminado: existingExpense.amount
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
        console.log('✅ Sincronización automática exitosa después de eliminación:', syncData.cut_number);
        return NextResponse.json({
          success: true,
          message: `Egreso eliminado y corte actualizado: ${formatPrice(existingExpense.amount)}`,
          expense_id: deletedExpense.id,
          deleted_expense: {
            id: existingExpense.id,
            description: existingExpense.description,
            amount: existingExpense.amount,
            expense_type: existingExpense.expense_type
          },
          sync_info: syncData,
          mexico_time: mexicoTimestamp,
          utc_time: now.toISOString()
        });
      } else {
        console.log('ℹ️ No hay corte para sincronizar:', syncData.error);
        return NextResponse.json({
          success: true,
          message: `Egreso eliminado exitosamente: ${formatPrice(existingExpense.amount)}`,
          expense_id: deletedExpense.id,
          deleted_expense: {
            id: existingExpense.id,
            description: existingExpense.description,
            amount: existingExpense.amount,
            expense_type: existingExpense.expense_type
          },
          mexico_time: mexicoTimestamp,
          utc_time: now.toISOString(),
          note: 'Sin corte asociado para sincronizar'
        });
      }
    } catch (syncError) {
      console.log('⚠️ Error en sincronización (no crítico):', syncError);
      return NextResponse.json({
        success: true,
        message: `Egreso eliminado exitosamente: ${formatPrice(existingExpense.amount)}`,
        expense_id: deletedExpense.id,
        deleted_expense: {
          id: existingExpense.id,
          description: existingExpense.description,
          amount: existingExpense.amount,
          expense_type: existingExpense.expense_type
        },
        mexico_time: mexicoTimestamp,
        utc_time: now.toISOString(),
        note: 'Eliminado sin sincronización (error menor)'
      });
    }
    
  } catch (error: any) {
    console.error('💥 Error en API delete expense:', error);
    return NextResponse.json(
      { 
        error: 'Error al eliminar el egreso', 
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
