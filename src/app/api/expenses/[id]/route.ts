import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const expenseId = params.id;

    console.log('🔍 API: Obteniendo detalle del egreso:', expenseId);

    const { data: expense, error } = await supabase
      .from('expenses')
      .select(`
        *,
        users!expenses_created_by_fkey(first_name, last_name, username)
      `)
      .eq('id', expenseId)
      .single();

    if (error) {
      console.error('❌ Error obteniendo egreso:', error);
      return NextResponse.json({
        success: false,
        error: 'Egreso no encontrado'
      }, { status: 404 });
    }

    // Formatear datos
    const expenseDetail = {
      ...expense,
      amount: parseFloat(expense.amount),
      creator_name: expense.users 
        ? `${expense.users.first_name || ''} ${expense.users.last_name || ''}`.trim() || expense.users.username
        : 'luishdz04'
    };

    console.log('✅ Detalle del egreso obtenido:', expenseDetail.description);

    return NextResponse.json({
      success: true,
      expense: expenseDetail
    });

  } catch (error) {
    console.error('❌ Error en API detalle de egreso:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al obtener el detalle del egreso'
    }, { status: 500 });
  }
}
