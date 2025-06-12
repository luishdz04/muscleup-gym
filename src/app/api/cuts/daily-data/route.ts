import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 🇲🇽 Obtener fecha en zona horaria de México/Monterrey
    const requestedDate = searchParams.get('date');
    let targetDate: string;
    
    if (requestedDate) {
      targetDate = requestedDate;
    } else {
      // Fecha actual en Monterrey
      const now = new Date();
      const monterreyTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Monterrey"}));
      targetDate = monterreyTime.toISOString().split('T')[0];
    }
    
    const supabase = createServerSupabaseClient();

    // 📊 Consultar ventas POS del día (usando zona horaria de Monterrey)
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
      .gte('created_at', `${targetDate}T06:00:00.000Z`)  // 00:00 Monterrey = 06:00 UTC
      .lt('created_at', `${getNextDay(targetDate)}T06:00:00.000Z`)   // 24:00 Monterrey = 06:00 UTC del día siguiente
      .eq('status', 'completed');

    if (posError) throw posError;

    // 💪 Consultar membresías del día (usando zona horaria de Monterrey)
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
      .gte('created_at', `${targetDate}T06:00:00.000Z`)  // 00:00 Monterrey = 06:00 UTC
      .lt('created_at', `${getNextDay(targetDate)}T06:00:00.000Z`)   // 24:00 Monterrey = 06:00 UTC del día siguiente
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
      date: targetDate,
      pos: posStats,
      memberships: membershipStats,
      totals,
      success: true,
      timestamp: new Date().toISOString(),
      debug: {
        posTransactions: posData?.length || 0,
        membershipTransactions: membershipData?.length || 0,
        dateRange: `${targetDate}T06:00:00.000Z to ${getNextDay(targetDate)}T06:00:00.000Z`
      }
    });

  } catch (error) {
    console.error('Error fetching daily data:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos del día', success: false },
      { status: 500 }
    );
  }
}

// 📅 Función auxiliar para obtener el día siguiente
function getNextDay(dateString: string): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
}
