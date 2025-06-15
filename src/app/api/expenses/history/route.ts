import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET(request: NextRequest) {
  let connection;
  
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
      page,
      limit,
      search,
      dateFrom,
      dateTo,
      expenseType,
      status,
      sortBy,
      sortOrder
    });

    connection = await getConnection();

    // Construir WHERE clause dinámicamente
    let whereConditions = ['1=1'];
    let queryParams: any[] = [];
    let paramIndex = 1;

    // Filtro de búsqueda
    if (search) {
      whereConditions.push(`(
        expenses.description ILIKE $${paramIndex} OR 
        expenses.receipt_number ILIKE $${paramIndex} OR 
        expenses.notes ILIKE $${paramIndex} OR 
        users.first_name ILIKE $${paramIndex} OR 
        users.last_name ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Filtro de fecha desde
    if (dateFrom) {
      whereConditions.push(`expenses.expense_date >= $${paramIndex}`);
      queryParams.push(dateFrom);
      paramIndex++;
    }

    // Filtro de fecha hasta
    if (dateTo) {
      whereConditions.push(`expenses.expense_date <= $${paramIndex}`);
      queryParams.push(dateTo);
      paramIndex++;
    }

    // Filtro de tipo de egreso
    if (expenseType && expenseType !== 'all') {
      whereConditions.push(`expenses.expense_type = $${paramIndex}`);
      queryParams.push(expenseType);
      paramIndex++;
    }

    // Filtro de estado
    if (status && status !== 'all') {
      whereConditions.push(`expenses.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Validar campo de ordenamiento
    const validSortFields = ['expense_date', 'created_at', 'amount', 'expense_type', 'description'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const orderDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Query principal para obtener egresos
    const expensesQuery = `
      SELECT 
        expenses.id,
        expenses.expense_date,
        expenses.expense_time,
        expenses.expense_type,
        expenses.description,
        expenses.amount,
        expenses.receipt_number,
        expenses.notes,
        expenses.status,
        expenses.created_by,
        expenses.created_at,
        expenses.updated_at,
        COALESCE(users.first_name || ' ' || users.last_name, users.username, 'Usuario') as creator_name
      FROM expenses 
      LEFT JOIN users ON expenses.created_by = users.id
      WHERE ${whereClause}
      ORDER BY expenses.${orderField} ${orderDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    // Query para contar total de registros
    const countQuery = `
      SELECT COUNT(*) as total
      FROM expenses 
      LEFT JOIN users ON expenses.created_by = users.id
      WHERE ${whereClause}
    `;

    // Ejecutar queries
    const [expensesResult, countResult] = await Promise.all([
      connection.query(expensesQuery, queryParams.slice(0, -2).concat([limit, offset])),
      connection.query(countQuery, queryParams.slice(0, -2))
    ]);

    const expenses = expensesResult.rows.map(expense => ({
      ...expense,
      amount: parseFloat(expense.amount)
    }));

    const totalExpenses = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalExpenses / limit);

    // Query para estadísticas generales
    const statsQuery = `
      SELECT 
        COUNT(*) as total_expenses,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(AVG(amount), 0) as avg_amount
      FROM expenses
      WHERE ${whereClause}
    `;

    const statsResult = await connection.query(statsQuery, queryParams.slice(0, -2));

    // Query para desglose por categorías
    const categoriesQuery = `
      SELECT 
        expense_type,
        COUNT(*) as count,
        SUM(amount) as amount
      FROM expenses
      WHERE ${whereClause}
      GROUP BY expense_type
      ORDER BY amount DESC
    `;

    const categoriesResult = await connection.query(categoriesQuery, queryParams.slice(0, -2));

    const categoriesBreakdown = categoriesResult.rows.reduce((acc, row) => {
      acc[row.expense_type] = {
        count: parseInt(row.count),
        amount: parseFloat(row.amount)
      };
      return acc;
    }, {});

    const stats = {
      totalExpenses: parseInt(statsResult.rows[0].total_expenses),
      totalAmount: parseFloat(statsResult.rows[0].total_amount),
      avgAmount: parseFloat(statsResult.rows[0].avg_amount),
      categoriesBreakdown
    };

    console.log('✅ Historial de egresos obtenido:', {
      expenses: expenses.length,
      total: totalExpenses,
      pages: totalPages,
      stats
    });

    return NextResponse.json({
      success: true,
      expenses,
      pagination: {
        page,
        limit,
        total: totalExpenses,
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
  } finally {
    if (connection) {
      await connection.release();
    }
  }
}
