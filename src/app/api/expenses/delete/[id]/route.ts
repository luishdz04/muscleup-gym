import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// ✅ FUNCIÓN PARA TIMESTAMP MÉXICO
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

// 🔄 FUNCIÓN DE SINCRONIZACIÓN AUTOMÁTICA (IGUAL QUE CREATE)
async function syncExpensesWithCut(supabase: any, expenseDate: string, userId: string) {
  try {
    console.log('🔄 Iniciando sincronización automática para fecha:', expenseDate);
    
    const { data: dayExpenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('expense_date', expenseDate)
      .eq('status', 'active');
    
    if (expensesError) {
      console.error('❌ Error calculando egresos del día:', expensesError);
      return { success: false, error: 'Error calculando egresos' };
    }
    
    const totalExpenses = dayExpenses?.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount), 0) || 0;
    console.log('📊 Total egresos calculado después de eliminación:', totalExpenses);
    
    const { data: existingCut, error: cutError } = await supabase
      .from('cash_cuts')
      .select('id, cut_number, expenses_amount, grand_total')
      .eq('cut_date', expenseDate)
      .single();
    
    if (cutError && cutError.code !== 'PGRST116') {
      console.error('❌ Error buscando corte:', cutError);
      return { success: false, error: 'Error verificando corte existente' };
    }
    
    if (existingCut) {
      const mexicoTimestamp = toMexicoTimestamp(new Date());
      const newFinalBalance = parseFloat(existingCut.grand_total) - totalExpenses;
      
      const { error: updateError } = await supabase
        .from('cash_cuts')
        .update({
          expenses_amount: totalExpenses,
          final_balance: newFinalBalance,
          updated_at: mexicoTimestamp,
          updated_by: userId
        })
        .eq('id', existingCut.id);
      
      if (updateError) {
        console.error('❌ Error actualizando corte:', updateError);
        return { success: false, error: 'Error actualizando corte' };
      }
      
      console.log('✅ Corte sincronizado exitosamente después de eliminación:', {
        cut_number: existingCut.cut_number,
        old_expenses: existingCut.expenses_amount,
        new_expenses: totalExpenses,
        new_final_balance: newFinalBalance
      });
      
      return {
        success: true,
        cut_updated: true,
        cut_number: existingCut.cut_number,
        old_expenses: existingCut.expenses_amount,
        new_expenses: totalExpenses,
        final_balance: newFinalBalance
      };
    } else {
      console.log('ℹ️ No hay corte para esta fecha, sincronización no necesaria');
      return {
        success: true,
        cut_updated: false,
        message: 'No hay corte para sincronizar'
      };
    }
    
  } catch (error) {
    console.error('💥 Error en sincronización automática:', error);
    return { success: false, error: 'Error en sincronización automática' };
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const expenseId = params.id;
    
    const supabase = createServerSupabaseClient();
    
    // 🔍 VERIFICAR QUE EL EGRESO EXISTE Y OBTENER DATOS
    const { data: existingExpense, error: fetchError } = await supabase
      .from('expenses')
      .select('id, expense_date, amount, description, status')
      .eq('id', expenseId)
      .single();
    
    if (fetchError || !existingExpense) {
      return NextResponse.json(
        { error: 'Egreso no encontrado', success: false },
        { status: 404 }
      );
    }
    
    if (existingExpense.status === 'deleted') {
      return NextResponse.json(
        { error: 'Egreso ya está eliminado', success: false },
        { status: 400 }
      );
    }
    
    // 🔍 OBTENER USUARIO
    let userId;
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log('⚠️ No se pudo obtener usuario autenticado, usando usuario hardcodeado');
        const { data: hardcodedUser, error: userError } = await supabase
          .from('Users')
          .select('id')
          .eq('email', 'ing.luisdeluna@outlook.com')
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
    
    const mexicoTimestamp = toMexicoTimestamp(new Date());
    
    console.log('🗑️ Eliminando egreso (soft delete):', {
      expense_id: expenseId,
      description: existingExpense.description,
      amount: existingExpense.amount,
      expense_date: existingExpense.expense_date,
      mexico_timestamp: mexicoTimestamp,
      user_id: userId
    });
    
    // 🗑️ ELIMINACIÓN SUAVE (CAMBIAR STATUS A 'deleted')
    const { data: deletedExpense, error: deleteError } = await supabase
      .from('expenses')
      .update({
        status: 'deleted',
        updated_at: mexicoTimestamp,
        updated_by: userId
      })
      .eq('id', expenseId)
      .select()
      .single();
    
    if (deleteError) {
      console.error('💥 Error eliminando egreso:', deleteError);
      throw deleteError;
    }
    
    // 🔄 SINCRONIZACIÓN AUTOMÁTICA CON CORTE
    const syncResult = await syncExpensesWithCut(supabase, existingExpense.expense_date, userId);
    
    console.log('✅ Egreso eliminado exitosamente:', {
      egreso_id: expenseId,
      description: existingExpense.description,
      amount: existingExpense.amount,
      sync_result: syncResult
    });
    
    return NextResponse.json({
      success: true,
      message: `Egreso eliminado exitosamente: ${existingExpense.description}`,
      expense_id: expenseId,
      deleted_expense: {
        id: existingExpense.id,
        description: existingExpense.description,
        amount: existingExpense.amount,
        expense_date: existingExpense.expense_date
      },
      sync_info: syncResult,
      mexico_time: mexicoTimestamp
    });
    
  } catch (error) {
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
