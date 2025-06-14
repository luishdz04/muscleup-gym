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
    console.log('🚀 API expenses/daily GET iniciada');
    
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    console.log('📅 Fecha recibida:', date);
    
    if (!date) {
      console.log('❌ Fecha no proporcionada');
      return NextResponse.json(
        { error: 'Fecha es requerida', success: false },
        { status: 400 }
      );
    }
    
    console.log('🔍 Intentando crear cliente Supabase...');
    const supabase = createServerSupabaseClient();
    console.log('✅ Cliente Supabase creado');
    
    const now = new Date();
    const mexicoTimestamp = toMexicoTimestamp(now);
    
    console.log('🇲🇽 Consultando egresos con estructura correcta de tabla...');
    
    // ✅ CONSULTAR EGRESOS CON ESTRUCTURA REAL DE TABLA
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
        updated_at,
        updated_by
      `)
      .eq('expense_date', date)
      .eq('status', 'active')
      .order('expense_time', { ascending: false });
    
    console.log('📊 Resultado consulta expenses:', { 
      data_length: expenses?.length, 
      error: expensesError 
    });
    
    if (expensesError) {
      console.error('❌ Error consultando egresos:', expensesError);
      return NextResponse.json(
        { 
          error: 'Error consultando egresos', 
          details: expensesError.message,
          success: false 
        },
        { status: 500 }
      );
    }
    
    console.log('✅ Consulta exitosa, procesando datos...');
    
    const processedExpenses = expenses || [];
    const totalAmount = processedExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount.toString()), 0);
    
    // 📊 CALCULAR RESUMEN POR CATEGORÍAS (usando tipos reales)
    const categorySummary = processedExpenses.reduce((acc: any, expense: any) => {
      const category = expense.expense_type || 'otros';
      if (!acc[category]) {
        acc[category] = {
          count: 0,
          total: 0,
          items: []
        };
      }
      acc[category].count += 1;
      acc[category].total += parseFloat(expense.amount.toString());
      acc[category].items.push(expense);
      return acc;
    }, {});
    
    // ✅ FORMATEAR EXPENSE_TIME CORRECTAMENTE
    const formattedExpenses = processedExpenses.map(expense => ({
      ...expense,
      expense_time: new Date(expense.expense_time).toLocaleTimeString('es-MX', {
        timeZone: 'America/Mexico_City',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      amount: parseFloat(expense.amount.toString())
    }));
    
    console.log('📊 Datos procesados correctamente:', {
      total_expenses: processedExpenses.length,
      total_amount: totalAmount,
      categorias: Object.keys(categorySummary)
    });
    
    return NextResponse.json({
      success: true,
      date,
      mexico_time: mexicoTimestamp,
      utc_time: now.toISOString(),
      expenses: formattedExpenses,
      summary: {
        total_expenses: processedExpenses.length,
        total_amount: totalAmount,
        categories: categorySummary
      },
      timezone_info: {
        mexico_date: date,
        note: 'Datos consultados con zona horaria México (UTC-6)'
      }
    });
    
  } catch (error: any) {
    console.error('💥 Error crítico en API daily expenses:', error);
    console.error('💥 Error stack:', error.stack);
    console.error('💥 Error message:', error.message);
    
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
