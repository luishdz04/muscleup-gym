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
      return NextResponse.json({
        success: false,
        error: 'Error al consultar egresos',
        details: expensesError
      }, { status: 500 });
    }

    const formattedExpenses = expenses?.map(expense => ({
      ...expense,
      creator_name: expense.created_by 
        ? expense.created_by.name || `${expense.created_by.firstName || ''} ${expense.created_by.lastName || ''}`.trim() || expense.created_by.email || 'Usuario'
        : 'Usuario',
      amount: parseFloat(expense.amount || '0')
    })) || [];

    let stats = {
      totalExpenses: 0,
      totalAmount: 0,
      avgAmount: 0,
      categoriesBreakdown: {} as Record<string, { count: number; amount: number }>
    };

    const { data: statsData } = await supabase
      .from('expenses')
      .select('amount, expense_type');

    if (statsData) {
      const totalAmount = statsData.reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);
      const categoriesBreakdown: Record<string, { count: number; amount: number }> = {};
      statsData.forEach(e => {
        const type = e.expense_type || 'otros';
        if (!categoriesBreakdown[type]) {
          categoriesBreakdown[type] = { count: 0, amount: 0 };
        }
        categoriesBreakdown[type].count++;
        categoriesBreakdown[type].amount += parseFloat(e.amount || '0');
      });
      stats = {
        totalExpenses: statsData.length,
        totalAmount,
        avgAmount: statsData.length > 0 ? totalAmount / statsData.length : 0,
        categoriesBreakdown
      };
    }

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
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
}
