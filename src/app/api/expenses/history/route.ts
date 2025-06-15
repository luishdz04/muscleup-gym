import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parámetros de paginación
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    
    // Parámetros de filtros
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

    // Construir query base
    let query = supabase
      .from('expenses')
      .select(`
        *,
        users!expenses_created_by_fkey(first_name, last_name, username)
      `, { count: 'exact' });

    // Aplicar filtros
    if (search) {
      query = query.or(`description.ilike.%${search}%,receipt_number.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    if (dateFrom) {
      query = query.gte('expense_date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('expense_date', dateTo);
    }

    if (expenseType && expenseType !== 'all') {
      query = query.eq('expense_type', expenseType);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Aplicar ordenamiento
    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending });

    // Aplicar paginación
    query = query.range(offset, offset + limit - 1);

    const { data: expenses, error: expensesError, count } = await query;

    if (expensesError) {
      console.error('❌ Error consultando egresos:', expensesError);
      return NextResponse.json({
        success: false,
        error: 'Error al consultar egresos'
      }, { status: 500 });
    }

    // Formatear datos
    const formattedExpenses = expenses?.map(expense => ({
      ...expense,
      amount: parseFloat(expense.amount),
      creator_name: expense.users 
        ? `${expense.users.first_name || ''} ${expense.users.last_name || ''}`.trim() || expense.users.username
        : 'luishdz04'
    })) || [];

    // Obtener estadísticas
    const { data: allExpenses, error: statsError } = await supabase
      .from('expenses')
      .select('amount, expense_type');

    const statsData = allExpenses || [];
    const stats = {
      totalExpenses: statsData.length,
      totalAmount: statsData.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0),
      avgAmount: statsData.length > 0 ? statsData.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0) / statsData.length : 0,
      categoriesBreakdown: statsData.reduce((acc, expense) => {
        const type = expense.expense_type;
        if (!acc[type]) {
          acc[type] = { count: 0, amount: 0 };
        }
        acc[type].count++;
        acc[type].amount += parseFloat(expense.amount) || 0;
        return acc;
      }, {} as Record<string, { count: number; amount: number }>)
    };

    const totalPages = count ? Math.ceil(count / limit) : 1;

    console.log('✅ Historial de egresos obtenido:', {
      expenses: formattedExpenses.length,
      total: count,
      pages: totalPages,
      stats
    });

    return NextResponse.json({
      success: true,
      expenses: formattedExpenses,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      },
      stats
    });

  } catch (error) {
    console.error('❌ Error en API historial de egresos:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al obtener el historial de egresos'
    }, { status: 500 });
  }
}
