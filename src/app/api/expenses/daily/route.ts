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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    if (!date) {
      return NextResponse.json(
        { error: 'Fecha es requerida', success: false },
        { status: 400 }
      );
    }
    
    console.log('🔍 Cargando egresos para fecha:', date);
    console.log('⏰ Timestamp actual México:', toMexicoTimestamp(new Date()));
    
    const supabase = createServerSupabaseClient();
    
    // 📊 CONSULTAR EGRESOS DEL DÍA
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select(`
        id,
        expense_date,
        expense_time,
        expense_type,
        description,
        amount,
        receipt_number,
        notes,
        status,
        created_at,
        created_by,
        Users!created_by (
          username,
          first_name,
          last_name
        )
      `)
      .eq('expense_date', date)
      .eq('status', 'active')
      .order('expense_time', { ascending: false });
    
    if (expensesError) {
      console.error('❌ Error consultando egresos:', expensesError);
      throw expensesError;
    }
    
    // 🎯 PROCESAR DATOS
    const processedExpenses = expenses?.map(expense => ({
      ...expense,
      user_name: expense.Users ? 
        `${expense.Users.first_name || ''} ${expense.Users.last_name || ''}`.trim() || 
        expense.Users.username : 
        'Usuario desconocido'
    })) || [];
    
    const totalAmount = processedExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    
    console.log('✅ Egresos encontrados:', {
      fecha: date,
      total_egresos: processedExpenses.length,
      total_amount: totalAmount,
      usuario_consulta: 'luishdz04'
    });
    
    return NextResponse.json({
      success: true,
      date,
      expenses: processedExpenses,
      summary: {
        total_expenses: processedExpenses.length,
        total_amount: totalAmount,
        by_type: processedExpenses.reduce((acc, expense) => {
          acc[expense.expense_type] = (acc[expense.expense_type] || 0) + parseFloat(expense.amount);
          return acc;
        }, {} as Record<string, number>)
      },
      timezone_info: {
        mexico_date: date,
        mexico_timestamp: toMexicoTimestamp(new Date()),
        timezone: 'America/Mexico_City',
        note: 'Egresos con fechas en zona horaria México'
      }
    });
    
  } catch (error) {
    console.error('💥 Error en API daily expenses:', error);
    return NextResponse.json(
      { 
        error: 'Error al cargar egresos', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        success: false 
      },
      { status: 500 }
    );
  }
}
