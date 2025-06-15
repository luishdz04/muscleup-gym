import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let connection;
  
  try {
    const expenseId = params.id;

    console.log('🔍 API: Obteniendo detalle del egreso:', expenseId);

    connection = await getConnection();

    // Query para obtener detalle completo del egreso
    const expenseQuery = `
      SELECT 
        expenses.*,
        COALESCE(users.first_name || ' ' || users.last_name, users.username, 'Usuario') as creator_name
      FROM expenses 
      LEFT JOIN users ON expenses.created_by = users.id
      WHERE expenses.id = $1
    `;

    const result = await connection.query(expenseQuery, [expenseId]);

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Egreso no encontrado'
      }, { status: 404 });
    }

    const expense = result.rows[0];

    // Convertir valores numéricos
    const expenseDetail = {
      ...expense,
      amount: parseFloat(expense.amount)
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
  } finally {
    if (connection) {
      await connection.release();
    }
  }
}
