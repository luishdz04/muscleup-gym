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
    const { date } = body;
    
    if (!date) {
      return NextResponse.json(
        { error: 'Fecha es requerida', success: false },
        { status: 400 }
      );
    }
    
    console.log('🔄 Iniciando sincronización manual de egresos para fecha:', date);
    console.log('⏰ Timestamp actual México:', toMexicoTimestamp(new Date()));
    console.log('👤 Usuario actual:', 'luishdz04');
    
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
              { error: 'No se pudo determinar el usuario para la sincronización', success: false },
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
    
    // 1️⃣ CALCULAR TOTAL DE EGRESOS ACTIVOS DEL DÍA
    const { data: dayExpenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount, description, expense_type')
      .eq('expense_date', date)
      .eq('status', 'active');
    
    if (expensesError) {
      console.error('❌ Error consultando egresos:', expensesError);
      throw expensesError;
    }
    
    const totalExpenses = dayExpenses?.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount), 0) || 0;
    const expenseCount = dayExpenses?.length || 0;
    
    console.log('📊 Egresos calculados:', {
      total_count: expenseCount,
      total_amount: totalExpenses,
      expenses: dayExpenses
    });
    
    // 2️⃣ BUSCAR CORTE EXISTENTE DEL MISMO DÍA
    const { data: existingCut, error: cutError } = await supabase
      .from('cash_cuts')
      .select('id, cut_number, expenses_amount, grand_total, final_balance')
      .eq('cut_date', date)
      .single();
    
    if (cutError && cutError.code !== 'PGRST116') {
      console.error('❌ Error buscando corte:', cutError);
      throw cutError;
    }
    
    if (!existingCut) {
      return NextResponse.json({
        success: false,
        error: 'No hay corte registrado para esta fecha',
        date,
        total_expenses: totalExpenses,
        expense_count: expenseCount
      });
    }
    
    // 3️⃣ ACTUALIZAR CORTE CON SINCRONIZACIÓN
    const mexicoTimestamp = toMexicoTimestamp(new Date());
    const newFinalBalance = parseFloat(existingCut.grand_total) - totalExpenses;
    
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
      console.error('💥 Error actualizando corte:', updateError);
      throw updateError;
    }
    
    console.log('✅ Sincronización manual completada:', {
      cut_number: existingCut.cut_number,
      old_expenses: existingCut.expenses_amount,
      new_expenses: totalExpenses,
      old_final_balance: existingCut.final_balance,
      new_final_balance: newFinalBalance,
      expense_count: expenseCount
    });
    
    return NextResponse.json({
      success: true,
      message: 'Sincronización manual completada exitosamente',
      date,
      cut_number: existingCut.cut_number,
      sync_details: {
        old_expenses_amount: existingCut.expenses_amount,
        new_expenses_amount: totalExpenses,
        expense_count: expenseCount,
        old_final_balance: existingCut.final_balance,
        new_final_balance: newFinalBalance,
        difference: totalExpenses - parseFloat(existingCut.expenses_amount)
      },
      total_expenses: totalExpenses,
      updated_cut: updatedCut,
      mexico_time: mexicoTimestamp
    });
    
  } catch (error: any) {
    console.error('💥 Error en API sync-with-cut:', error);
    return NextResponse.json(
      { 
        error: 'Error en sincronización manual', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        success: false 
      },
      { status: 500 }
    );
  }
}
