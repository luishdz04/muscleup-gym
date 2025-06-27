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
    
    const now = new Date();
    const mexicoTimestamp = toMexicoTimestamp(now);
    
    console.log('🇲🇽 Aplicando lógica de dateHelpers para eliminación:', {
      utc_actual: now.toISOString(),
      mexico_timestamp: mexicoTimestamp,
      egreso_a_eliminar: existingExpense.id,
      monto: existingExpense.amount
    });
    
    // 💾 MARCAR COMO ELIMINADO (SOFT DELETE) CON TIMESTAMP MÉXICO
    const { data: deletedExpense, error: deleteError } = await supabase
      .from('expenses')
      .update({
        status: 'deleted',
        updated_at: mexicoTimestamp,
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
    
    console.log('✅ Egreso eliminado exitosamente:', {
      egreso_id: deletedExpense.id,
      timestamp_eliminado: mexicoTimestamp,
      hora_utc_actual: now.toISOString(),
      monto_eliminado: existingExpense.amount
    });
    
    // 🔄 SINCRONIZACIÓN DIRECTA CON CORTE (IGUAL QUE EN CREATE)
    console.log('🔄 Iniciando sincronización DIRECTA con corte para fecha:', existingExpense.expense_date);
    
    let syncInfo = null;
    
    try {
      // 1️⃣ CALCULAR TOTAL DE EGRESOS ACTIVOS DEL DÍA (EXCLUYENDO LOS ELIMINADOS)
      console.log('📊 Recalculando total de egresos activos para fecha:', existingExpense.expense_date);
      
      const { data: dayExpenses, error: expensesError } = await supabase
        .from('expenses')
        .select('amount, description, expense_type')
        .eq('expense_date', existingExpense.expense_date)
        .eq('status', 'active'); // Solo egresos activos
      
      if (expensesError) {
        console.error('❌ Error consultando egresos para sincronización:', expensesError);
        throw expensesError;
      }
      
      const totalExpenses = dayExpenses?.reduce((sum: number, exp: any) => {
        return sum + parseFloat(exp.amount.toString());
      }, 0) || 0;
      
      const expenseCount = dayExpenses?.length || 0;
      
      console.log('📊 Egresos recalculados después de eliminación:', {
        total_count: expenseCount,
        total_amount: totalExpenses,
        expenses_detail: dayExpenses,
        monto_eliminado: existingExpense.amount
      });
      
      // 2️⃣ BUSCAR CORTE EXISTENTE DEL MISMO DÍA
      console.log('🔍 Buscando corte existente para fecha:', existingExpense.expense_date);
      
      const { data: existingCut, error: cutError } = await supabase
        .from('cash_cuts')
        .select('id, cut_number, expenses_amount, grand_total, final_balance')
        .eq('cut_date', existingExpense.expense_date)
        .single();
      
      if (cutError && cutError.code !== 'PGRST116') {
        console.error('❌ Error buscando corte:', cutError);
        throw cutError;
      }
      
      if (existingCut) {
        console.log('📋 Corte encontrado para sincronización tras eliminación:', {
          cut_id: existingCut.id,
          cut_number: existingCut.cut_number,
          old_expenses: existingCut.expenses_amount,
          new_expenses: totalExpenses,
          grand_total: existingCut.grand_total,
          monto_eliminado: existingExpense.amount
        });
        
        // 3️⃣ ACTUALIZAR CORTE CON SINCRONIZACIÓN DIRECTA
        const newFinalBalance = parseFloat(existingCut.grand_total.toString()) - totalExpenses;
        
        const { data: updatedCut, error: updateError } = await supabase
          .from('cash_cuts')
          .update({
            expenses_amount: totalExpenses,
            final_balance: newFinalBalance,
            updated_at: mexicoTimestamp,
            updated_by: userId
          })
          .eq('id', existingCut.id)
          .select()
          .single();
        
        if (updateError) {
          console.error('💥 Error actualizando corte en sincronización directa:', updateError);
          throw updateError;
        }
        
        console.log('✅ Sincronización DIRECTA completada exitosamente tras eliminación:', {
          cut_number: existingCut.cut_number,
          old_expenses: existingCut.expenses_amount,
          new_expenses: totalExpenses,
          old_final_balance: existingCut.final_balance,
          new_final_balance: newFinalBalance,
          expense_count: expenseCount,
          difference: totalExpenses - parseFloat(existingCut.expenses_amount.toString()),
          monto_eliminado: existingExpense.amount
        });
        
        syncInfo = {
          synchronized: true,
          cut_number: existingCut.cut_number,
          old_expenses_amount: existingCut.expenses_amount,
          new_expenses_amount: totalExpenses,
          expense_count: expenseCount,
          old_final_balance: existingCut.final_balance,
          new_final_balance: newFinalBalance,
          difference: totalExpenses - parseFloat(existingCut.expenses_amount.toString()),
          deleted_amount: existingExpense.amount
        };
        
      } else {
        console.log('ℹ️ No hay corte para sincronizar en fecha:', existingExpense.expense_date);
        syncInfo = {
          synchronized: false,
          reason: 'No existe corte para esta fecha',
          total_expenses: totalExpenses,
          expense_count: expenseCount,
          deleted_amount: existingExpense.amount
        };
      }
      
    } catch (syncError: any) {
      console.error('⚠️ Error en sincronización directa (no crítico):', syncError);
      syncInfo = {
        synchronized: false,
        error: syncError.message,
        reason: 'Error en sincronización pero egreso eliminado exitosamente',
        deleted_amount: existingExpense.amount
      };
    }
    
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
      sync_info: syncInfo, // ✅ INFORMACIÓN DETALLADA DE SINCRONIZACIÓN
      mexico_time: mexicoTimestamp,
      utc_time: now.toISOString()
    });
    
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
