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
      updated_at_mexico
    } = body;
    
    console.log('✏️ Actualizando egreso con sincronización directa:', {
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
    
    // ✅ OBTENER USUARIO AUTENTICADO O USAR HARDCODED COMO FALLBACK
    let userId;
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log('⚠️ No se pudo obtener usuario autenticado, usando usuario hardcodeado');
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
    
    const now = new Date();
    const mexicoTimestamp = updated_at_mexico || toMexicoTimestamp(now);
    
    console.log('🇲🇽 Actualizando egreso con sincronización directa:', {
      utc_actual: now.toISOString(),
      mexico_timestamp: mexicoTimestamp,
      egreso_existente: existingExpense.id,
      expense_date: existingExpense.expense_date
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
        updated_at: mexicoTimestamp,
        updated_by: userId
      })
      .eq('id', expenseId)
      .select()
      .single();
    
    if (updateError) {
      console.error('💥 Error actualizando egreso:', updateError);
      throw updateError;
    }
    
    console.log('✅ Egreso actualizado exitosamente:', {
      egreso_id: updatedExpense.id,
      timestamp_actualizado: mexicoTimestamp,
      monto_anterior: existingExpense.amount,
      monto_nuevo: parseFloat(amount)
    });
    
    // 🔄 SINCRONIZACIÓN DIRECTA CON CORTE (SIN FETCH INTERNO)
    console.log('🔄 Iniciando sincronización DIRECTA tras actualización...');
    
    let syncInfo = null;
    
    try {
      // 1️⃣ CALCULAR TOTAL DE EGRESOS ACTIVOS DEL DÍA (CON EL ACTUALIZADO)
      const { data: dayExpenses, error: expensesError } = await supabase
        .from('expenses')
        .select('amount')
        .eq('expense_date', existingExpense.expense_date)
        .eq('status', 'active');
      
      if (expensesError) {
        console.error('❌ Error consultando egresos para sincronización:', expensesError);
        throw expensesError;
      }
      
      const totalExpenses = dayExpenses?.reduce((sum: number, exp: any) => {
        return sum + parseFloat(exp.amount.toString());
      }, 0) || 0;
      
      console.log('📊 Total recalculado tras actualización:', {
        total_expenses: totalExpenses,
        expense_count: dayExpenses?.length || 0
      });
      
      // 2️⃣ BUSCAR Y ACTUALIZAR CORTE
      const { data: existingCut, error: cutError } = await supabase
        .from('cash_cuts')
        .select('id, cut_number, expenses_amount, grand_total, final_balance')
        .eq('cut_date', existingExpense.expense_date)
        .single();
      
      if (cutError && cutError.code !== 'PGRST116') {
        throw cutError;
      }
      
      if (existingCut) {
        const newFinalBalance = parseFloat(existingCut.grand_total.toString()) - totalExpenses;
        
        const { data: updatedCut, error: cutUpdateError } = await supabase
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
        
        if (cutUpdateError) {
          throw cutUpdateError;
        }
        
        console.log('✅ Sincronización directa tras actualización completada:', {
          cut_number: existingCut.cut_number,
          old_expenses: existingCut.expenses_amount,
          new_expenses: totalExpenses,
          new_final_balance: newFinalBalance
        });
        
        syncInfo = {
          synchronized: true,
          cut_number: existingCut.cut_number,
          old_expenses_amount: existingExpense.amount,
          new_expenses_amount: parseFloat(amount),
          total_expenses_after_update: totalExpenses
        };
      } else {
        syncInfo = { synchronized: false, reason: 'No existe corte para esta fecha' };
      }
      
    } catch (syncError: any) {
      console.error('⚠️ Error en sincronización directa tras actualización:', syncError);
      syncInfo = { synchronized: false, error: syncError.message };
    }
    
    return NextResponse.json({
      success: true,
      message: `Egreso actualizado exitosamente: ${formatPrice(parseFloat(amount))}`,
      expense_id: updatedExpense.id,
      expense: updatedExpense,
      sync_info: syncInfo,
      mexico_time: mexicoTimestamp,
      utc_time: now.toISOString()
    });
    
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

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(amount);
}
