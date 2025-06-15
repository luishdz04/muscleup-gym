import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cutId = params.id;

    console.log('🔍 API: Obteniendo detalle del corte:', cutId);

    // ✅ USAR CLIENTE SERVIDOR CORRECTO
    const supabase = createServerSupabaseClient();

    const { data: cut, error } = await supabase
      .from('cash_cuts')
      .select(`
        *,
        users!cash_cuts_created_by_fkey(first_name, last_name, username)
      `)
      .eq('id', cutId)
      .single();

    if (error) {
      console.error('❌ Error obteniendo corte:', error);
      return NextResponse.json({
        success: false,
        error: 'Corte no encontrado',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { status: 404 });
    }

    // Formatear datos con valores seguros
    const cutDetail = {
      ...cut,
      creator_name: cut.users 
        ? `${cut.users.first_name || ''} ${cut.users.last_name || ''}`.trim() || cut.users.username
        : 'Usuario',
      // Convertir valores numéricos de forma segura
      grand_total: parseFloat(cut.grand_total || '0'),
      expenses_amount: parseFloat(cut.expenses_amount || '0'),
      final_balance: parseFloat(cut.final_balance || '0'),
      pos_efectivo: parseFloat(cut.pos_efectivo || '0'),
      pos_transferencia: parseFloat(cut.pos_transferencia || '0'),
      pos_debito: parseFloat(cut.pos_debito || '0'),
      pos_credito: parseFloat(cut.pos_credito || '0'),
      pos_total: parseFloat(cut.pos_total || '0'),
      abonos_efectivo: parseFloat(cut.abonos_efectivo || '0'),
      abonos_transferencia: parseFloat(cut.abonos_transferencia || '0'),
      abonos_debito: parseFloat(cut.abonos_debito || '0'),
      abonos_credito: parseFloat(cut.abonos_credito || '0'),
      abonos_total: parseFloat(cut.abonos_total || '0'),
      membership_efectivo: parseFloat(cut.membership_efectivo || '0'),
      membership_transferencia: parseFloat(cut.membership_transferencia || '0'),
      membership_debito: parseFloat(cut.membership_debito || '0'),
      membership_credito: parseFloat(cut.membership_credito || '0'),
      membership_total: parseFloat(cut.membership_total || '0'),
      total_efectivo: parseFloat(cut.total_efectivo || '0'),
      total_transferencia: parseFloat(cut.total_transferencia || '0'),
      total_debito: parseFloat(cut.total_debito || '0'),
      total_credito: parseFloat(cut.total_credito || '0'),
      total_transactions: parseInt(cut.total_transactions || '0'),
      pos_transactions: parseInt(cut.pos_transactions || '0'),
      abonos_transactions: parseInt(cut.abonos_transactions || '0'),
      membership_transactions: parseInt(cut.membership_transactions || '0')
    };

    console.log('✅ Detalle del corte obtenido:', cutDetail.cut_number);

    return NextResponse.json({
      success: true,
      cut: cutDetail
    });

  } catch (error: any) {
    console.error('❌ Error en API detalle de corte:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al obtener el detalle del corte',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
