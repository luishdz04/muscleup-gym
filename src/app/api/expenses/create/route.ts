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

// 🔄 FUNCIÓN DE SINCRONIZACIÓN AUTOMÁTICA
async function syncExpensesWithCut(supabase: any, expenseDate: string, userId: string) {
  try {
    console.log('🔄 Iniciando sincronización automática para fecha:', expenseDate);
    
    // 1. Calcular total de egresos activos del día
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
    console.log('📊 Total egresos calculado:', totalExpenses);
    
    // 2. Buscar corte existente del mismo día
    const { data: existingCut, error: cutError } = await supabase
      .from('cash_cuts')
      .select('id, cut_number, expenses_amount, grand_total')
      .eq('cut_date', expenseDate)
      .single();
    
    if (cutError && cutError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('❌ Error buscando corte:', cutError);
      return { success: false, error: 'Error verificando corte existente' };
    }
    
    if (existingCut) {
      // 3. Actualizar corte existente
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
      
      console.log('✅ Corte sincronizado exitosamente:', {
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      expense_date,
      expense_time,
      expense_type,
      description,
      amount,
      receipt_number,
      notes
    } = body;
    
    // ✅ VALIDACIONES
    if (!expense_date || !expense_type || !description || !amount) {
      return NextResponse.json(
        { error: 'Campos requeridos: expense_date, expense_type, description, amount', success: false },
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
    
    // 🔍 OBTENER USUARIO (MISMO CÓDIGO QUE CORTES)
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
    
    // ⏰ USAR TIMESTAMP MÉXICO
    const mexicoTimestamp = expense_time || toMexicoTimestamp(new Date());
    
    console.log('💸 Creando egreso con datos:', {
      expense_date,
      expense_type,
      description,
      amount: parseFloat(amount),
      mexico_timestamp: mexicoTimestamp,
      user_id: userId
    });
    
    // 💾 INSERTAR EGRESO
    const { data: newExpense, error: insertError } = await supabase
      .from('expenses')
      .insert([{
        expense_date,
        expense_time: mexicoTimestamp,
        expense_type,
        description: description.trim(),
        amount: parseFloat(amount),
        receipt_number: receipt_number?.trim() || null,
        notes: notes?.trim() || null,
        status: 'active',
        created_at: mexicoTimestamp,
        created_by: userId,
        updated_at: mexicoTimestamp,
        updated_by: userId
      }])
      .select()
      .single();
    
    if (insertError) {
      console.error('💥 Error insertando egreso:', insertError);
      throw insertError;
    }
    
    // 🔄 SINCRONIZACIÓN AUTOMÁTICA CON CORTE
    const syncResult = await syncExpensesWithCut(supabase, expense_date, userId);
    
    console.log('✅ Egreso creado exitosamente:', {
      egreso_id: newExpense.id,
      amount: parseFloat(amount),
      timestamp_mexico: mexicoTimestamp,
      sync_result: syncResult
    });
    
    return NextResponse.json({
      success: true,
      message: `Egreso creado exitosamente: ${description}`,
      expense_id: newExpense.id,
      expense: newExpense,
      sync_info: syncResult,
      mexico_time: mexicoTimestamp,
      utc_time: new Date().toISOString()
    });
    
  } catch (error) {
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
