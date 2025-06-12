import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || '2025-06-12'; // Fecha actual por defecto
    
    const supabase = createServerSupabaseClient();

    // 📊 Consultar ventas POS del día
    const { data: posData, error: posError } = await supabase
      .from('sales')
      .select(`
        id,
        total_amount,
        is_mixed_payment,
        created_at,
        sale_payment_details (
          payment_method,
          amount,
          commission_amount
        )
      `)
      .gte('created_at', `${date}T00:00:00`)
      .lt('created_at', `${date}T23:59:59`)
      .eq('status', 'completed');

    if (posError) throw posError;

    // 💪 Consultar membresías del día
    const { data: membershipData, error: membershipError } = await supabase
      .from('user_memberships')
      .select(`
        id,
        amount_paid,
        is_mixed_payment,
        created_at,
        membership_payment_details (
          payment_method,
          amount,
          commission_amount
        )
      `)
      .gte('created_at', `${date}T00:00:00`)
      .lt('created_at', `${date}T23:59:59`)
      .eq('status', 'active');

    if (membershipError) throw membershipError;

    // 🧮 Procesar datos POS
    const posStats = {
      efectivo: 0,
      transferencia: 0,
      debito: 0,
      credito: 0,
      mixto: 0,
      total: 0,
      transactions: 0,
      commissions: 0
    };

    posData?.forEach(sale => {
      posStats.transactions++;
      
      if (sale.is_mixed_payment) {
        let mixtoAmount = 0;
        sale.sale_payment_details?.forEach(payment => {
          mixtoAmount += payment.amount || 0;
          posStats.commissions += payment.commission_amount || 0;
        });
        posStats.mixto += mixtoAmount;
      } else {
        const payment = sale.sale_payment_details?.[0];
        if (payment) {
          const method = payment.payment_method as keyof typeof posStats;
          if (['efectivo', 'transferencia', 'debito', 'credito'].includes(method)) {
            posStats[method] += payment.amount || 0;
          }
          posStats.commissions += payment.commission_amount || 0;
        }
      }
      
      posStats.total += sale.total_amount || 0;
    });

    // 🧮 Procesar datos de membresías
    const membershipStats = {
      efectivo: 0,
      transferencia: 0,
      debito: 0,
      credito: 0,
      mixto: 0,
      total: 0,
      transactions: 0,
      commissions: 0
    };

    membershipData?.forEach(membership => {
      membershipStats.transactions++;
      
      if (membership.is_mixed_payment) {
        let mixtoAmount = 0;
        membership.membership_payment_details?.forEach(payment => {
          mixtoAmount += payment.amount || 0;
          membershipStats.commissions += payment.commission_amount || 0;
        });
        membershipStats.mixto += mixtoAmount;
      } else {
        const payment = membership.membership_payment_details?.[0];
        if (payment) {
          const method = payment.payment_method as keyof typeof membershipStats;
          if (['efectivo', 'transferencia', 'debito', 'credito'].includes(method)) {
            membershipStats[method] += payment.amount || 0;
          }
          membershipStats.commissions += payment.commission_amount || 0;
        }
      }
      
      membershipStats.total += membership.amount_paid || 0;
    });

    // 📈 Calcular totales consolidados
    const totals = {
      efectivo: posStats.efectivo + membershipStats.efectivo,
      transferencia: posStats.transferencia + membershipStats.transferencia,
      debito: posStats.debito + membershipStats.debito,
      credito: posStats.credito + membershipStats.credito,
      mixto: posStats.mixto + membershipStats.mixto,
      total: posStats.total + membershipStats.total,
      transactions: posStats.transactions + membershipStats.transactions,
      commissions: posStats.commissions + membershipStats.commissions,
      net_amount: (posStats.total + membershipStats.total) - (posStats.commissions + membershipStats.commissions)
    };

    return NextResponse.json({
      date,
      pos: posStats,
      memberships: membershipStats,
      totals,
      success: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching daily data:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos del día', success: false },
      { status: 500 }
    );
  }
}
