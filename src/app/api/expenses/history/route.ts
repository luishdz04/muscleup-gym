import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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

    // ✅ USAR CLIENTE SERVIDOR CORRECTO
    const supabase = createServerSupabaseClient();

    // Verificar conexión
    console.log('🔍 Verificando conexión a Supabase...');
    
    // Construir query base con campos correctos de Users
    let query = supabase
      .from('expenses')
      .select(`
        *,
        "Users"!expenses_created_by_fkey(id, firstName, lastName, name, email)
      `, { count: 'exact' });

    // Aplicar filtros
    if (search) {
      query = query.or(`description.ilike.%${search}%,notes.ilike.%${search}%,receipt_number.ilike.%${search}%`);
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
      console.error('Detalles del error:', {
        message: expensesError.message,
        details: expensesError.details,
        hint: expensesError.hint,
        code: expensesError.code
      });
      return NextResponse.json({
        success: false,
        error: 'Error al consultar egresos',
        details: process.env.NODE_ENV === 'development' ? {
          message: expensesError.message,
          hint: expensesError.hint,
          details: expensesError.details
        } : undefined
      }, { status: 500 });
    }

    // Formatear datos con nombre del creador
    const formattedExpenses = expenses?.map(expense => ({
      ...expense,
      creator_name: expense.Users 
        ? expense.Users.name || `${expense.Users.firstName || ''} ${expense.Users.lastName || ''}`.trim() || expense.Users.email || 'Usuario'
        : 'Usuario',
      // Convertir valores numéricos para evitar errores
      amount: parseFloat(expense.amount || '0')
    })) || [];

    // Obtener estadísticas generales
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
        const totalAmount = statsData.reduce((sum, expense) => sum + parseFloat(expense.amount || '0'), 0);
        
        // Calcular desglose por categorías
        const categoriesBreakdown: Record<string, { count: number; amount: number }> = {};
        statsData.forEach(expense => {
          const type = expense.expense_type || 'otros';
          if (!categoriesBreakdown[type]) {
            categoriesBreakdown[type] = { count: 0, amount: 0 };
          }
          categoriesBreakdown[type].count++;
          categoriesBreakdown[type].amount += parseFloat(expense.amount || '0');
        });

        stats = {
          totalExpenses: statsData.length,
          totalAmount: totalAmount,
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
