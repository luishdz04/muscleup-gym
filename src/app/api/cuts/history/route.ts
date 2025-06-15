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
    const status = searchParams.get('status');
    const isManual = searchParams.get('isManual');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    console.log('📊 API: Consultando historial de cortes', {
      page,
      limit,
      search,
      dateFrom,
      dateTo,
      status,
      isManual,
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
        cuts.cut_number ILIKE $${paramIndex} OR 
        cuts.notes ILIKE $${paramIndex} OR 
        users.first_name ILIKE $${paramIndex} OR 
        users.last_name ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Filtro de fecha desde
    if (dateFrom) {
      whereConditions.push(`cuts.cut_date >= $${paramIndex}`);
      queryParams.push(dateFrom);
      paramIndex++;
    }

    // Filtro de fecha hasta
    if (dateTo) {
      whereConditions.push(`cuts.cut_date <= $${paramIndex}`);
      queryParams.push(dateTo);
      paramIndex++;
    }

    // Filtro de estado
    if (status && status !== 'all') {
      whereConditions.push(`cuts.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    // Filtro de tipo manual/automático
    if (isManual && isManual !== 'all') {
      whereConditions.push(`cuts.is_manual = $${paramIndex}`);
      queryParams.push(isManual === 'true');
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Validar campo de ordenamiento
    const validSortFields = ['cut_date', 'created_at', 'grand_total', 'final_balance', 'cut_number'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const orderDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Query principal para obtener cortes
    const cutsQuery = `
      SELECT 
        cuts.id,
        cuts.cut_number,
        cuts.cut_date,
        cuts.status,
        cuts.is_manual,
        cuts.grand_total,
        cuts.expenses_amount,
        cuts.final_balance,
        cuts.total_transactions,
        cuts.pos_total,
        cuts.abonos_total,
        cuts.membership_total,
        cuts.created_by,
        cuts.created_at,
        cuts.updated_at,
        cuts.notes,
        COALESCE(users.first_name || ' ' || users.last_name, users.username, 'Usuario') as creator_name
      FROM cuts 
      LEFT JOIN users ON cuts.created_by = users.id
      WHERE ${whereClause}
      ORDER BY cuts.${orderField} ${orderDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    // Query para contar total de registros
    const countQuery = `
      SELECT COUNT(*) as total
      FROM cuts 
      LEFT JOIN users ON cuts.created_by = users.id
      WHERE ${whereClause}
    `;

    // Ejecutar queries
    const [cutsResult, countResult] = await Promise.all([
      connection.query(cutsQuery, queryParams.slice(0, -2).concat([limit, offset])),
      connection.query(countQuery, queryParams.slice(0, -2))
    ]);

    const cuts = cutsResult.rows;
    const totalCuts = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalCuts / limit);

    // Query para estadísticas generales
    const statsQuery = `
      SELECT 
        COUNT(*) as total_cuts,
        COALESCE(SUM(grand_total), 0) as total_amount,
        COALESCE(AVG(grand_total), 0) as avg_amount,
        COUNT(CASE WHEN is_manual = true THEN 1 END) as manual_cuts,
        COUNT(CASE WHEN is_manual = false THEN 1 END) as automatic_cuts
      FROM cuts
      WHERE ${whereClause}
    `;

    const statsResult = await connection.query(statsQuery, queryParams.slice(0, -2));
    const stats = {
      totalCuts: parseInt(statsResult.rows[0].total_cuts),
      totalAmount: parseFloat(statsResult.rows[0].total_amount),
      avgAmount: parseFloat(statsResult.rows[0].avg_amount),
      manualCuts: parseInt(statsResult.rows[0].manual_cuts),
      automaticCuts: parseInt(statsResult.rows[0].automatic_cuts)
    };

    console.log('✅ Historial de cortes obtenido:', {
      cuts: cuts.length,
      total: totalCuts,
      pages: totalPages,
      stats
    });

    return NextResponse.json({
      success: true,
      cuts,
      pagination: {
        page,
        limit,
        total: totalCuts,
        totalPages
      },
      stats
    });

  } catch (error) {
    console.error('❌ Error en API historial de cortes:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al obtener el historial de cortes'
    }, { status: 500 });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
}
