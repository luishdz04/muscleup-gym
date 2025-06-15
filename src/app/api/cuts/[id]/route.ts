import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let connection;
  
  try {
    const cutId = params.id;

    console.log('🔍 API: Obteniendo detalle del corte:', cutId);

    connection = await getConnection();

    // Query para obtener detalle completo del corte
    const cutQuery = `
      SELECT 
        cuts.*,
        COALESCE(users.first_name || ' ' || users.last_name, users.username, 'Usuario') as creator_name
      FROM cuts 
      LEFT JOIN users ON cuts.created_by = users.id
      WHERE cuts.id = $1
    `;

    const result = await connection.query(cutQuery, [cutId]);

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Corte no encontrado'
      }, { status: 404 });
    }

    const cut = result.rows[0];

    // Convertir valores numéricos
    const cutDetail = {
      ...cut,
      grand_total: parseFloat(cut.grand_total),
      expenses_amount: parseFloat(cut.expenses_amount),
      final_balance: parseFloat(cut.final_balance),
      pos_efectivo: parseFloat(cut.pos_efectivo),
      pos_transferencia: parseFloat(cut.pos_transferencia),
      pos_debito: parseFloat(cut.pos_debito),
      pos_credito: parseFloat(cut.pos_credito),
      pos_total: parseFloat(cut.pos_total),
      abonos_efectivo: parseFloat(cut.abonos_efectivo),
      abonos_transferencia: parseFloat(cut.abonos_transferencia),
      abonos_debito: parseFloat(cut.abonos_debito),
      abonos_credito: parseFloat(cut.abonos_credito),
      abonos_total: parseFloat(cut.abonos_total),
      membership_efectivo: parseFloat(cut.membership_efectivo),
      membership_transferencia: parseFloat(cut.membership_transferencia),
      membership_debito: parseFloat(cut.membership_debito),
      membership_credito: parseFloat(cut.membership_credito),
      membership_total: parseFloat(cut.membership_total),
      total_efectivo: parseFloat(cut.total_efectivo),
      total_transferencia: parseFloat(cut.total_transferencia),
      total_debito: parseFloat(cut.total_debito),
      total_credito: parseFloat(cut.total_credito),
      total_transactions: parseInt(cut.total_transactions),
      pos_transactions: parseInt(cut.pos_transactions),
      abonos_transactions: parseInt(cut.abonos_transactions),
      membership_transactions: parseInt(cut.membership_transactions)
    };

    console.log('✅ Detalle del corte obtenido:', cutDetail.cut_number);

    return NextResponse.json({
      success: true,
      cut: cutDetail
    });

  } catch (error) {
    console.error('❌ Error en API detalle de corte:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al obtener el detalle del corte'
    }, { status: 500 });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
}
