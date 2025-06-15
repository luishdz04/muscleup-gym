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
    const cutId = params.id;

    console.log('🔍 API: Obteniendo detalle del corte:', cutId);

    const { data: cut, error } = await supabase
      .from('cuts')
      .select(`
        *,
        users!cuts_created_by_fkey(first_name, last_name, username)
      `)
      .eq('id', cutId)
      .single();

    if (error) {
      console.error('❌ Error obteniendo corte:', error);
      return NextResponse.json({
        success: false,
        error: 'Corte no encontrado'
      }, { status: 404 });
    }

    // Formatear datos
    const cutDetail = {
      ...cut,
      creator_name: cut.users 
        ? `${cut.users.first_name || ''} ${cut.users.last_name || ''}`.trim() || cut.users.username
        : 'Usuario',
      // Convertir valores numéricos
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
  }
}
