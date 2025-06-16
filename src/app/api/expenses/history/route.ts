import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const search = searchParams.get('search') || '';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const expenseType = searchParams.get('expenseType');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    console.log('💸 API: Consultando historial de egresos', {
      page, limit, search, dateFrom, dateTo, expenseType, status, sortBy, sortOrder
    });

    const supabase = createServerSupabaseClient();

    let query = supabase
      .from('expenses')
      .select(`
        *,
        created_by(id, firstName, lastName, name, email)
      `, { count: 'exact' });

    if (search) {
      query = query.or(`description.ilike.%${search}%,notes.ilike.%${search}%,receipt_number.ilike.%${search}%`);
    }

    if (dateFrom) query = query.gte('expense_date', dateFrom);
    if (dateTo) query = query.lte('expense_date', dateTo);
    if (expenseType && expenseType !== 'all') query = query.eq('expense_type', expenseType);
    if (status && status !== 'all') query = query.eq('status', status);

    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending });
    query = query.range(offset, offset + limit - 1);

    const { data: expenses, error: expensesError, count } = await query;

    if (expensesError) {
      console.error('❌ Error consultando egresos:', expensesError);
      return NextResponse.json({
        success: false,
        error: 'Error al consultar egresos',
        details: process.env.NODE_ENV === 'development' ? expensesError.message : undefined
      }, { status: 500 });
    }

    const formattedExpenses = expenses?.map(expense => ({
      ...expense,
      creator_name: expense.created_by
        ? expense.created_by.name || `${expense.created_by.firstName || ''} ${expense.created_by.lastName || ''}`.trim() || expense.created_by.email || 'Usuario'
        : 'Usuario',
      amount: typeof expense.amount === 'number' ? expense.amount : Number(expense.amount) || 0
    })) || [];

    let stats = {
      totalExpenses: 0,
      totalAmount: 0,
      avgAmount: 0,
      categoriesBreakdown: {} as Record<string, { count: number; amount: number }>
    };

    try {
      const { data: statsData, error: statsError } = await supabase
        .from('expenses')
        .select('amount, expense_type');

      if (!statsError && statsData) {
        const totalAmount = statsData.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
        const categoriesBreakdown: Record<string, { count: number; amount: number }> = {};

        statsData.forEach(expense => {
          const type = expense.expense_type || 'otros';
          if (!categoriesBreakdown[type]) {
            categoriesBreakdown[type] = { count: 0, amount: 0 };
          }
          categoriesBreakdown[type].count++;
          categoriesBreakdown[type].amount += Number(expense.amount) || 0;
        });

        stats = {
          totalExpenses: statsData.length,
          totalAmount,
          avgAmount: statsData.length > 0 ? totalAmount / statsData.length : 0,
          categoriesBreakdown
        };
      }
    } catch (statsError) {
      console.warn('⚠️ Error consultando estadísticas (no crítico):', statsError);
    }

    console.log('✅ Historial consultado:', formattedExpenses.length, 'egresos');

    return NextResponse.json({
      success: true,
      expenses: formattedExpenses,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      stats
    });

  } catch (error: any) {
    console.error('❌ Error en API historial egresos:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al consultar el historial de egresos',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
