import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 🇲🇽 Obtener fecha actual en Monterrey (UTC-6)
    const requestedDate = searchParams.get('date');
    let targetDate: string;
    
    if (requestedDate) {
      targetDate = requestedDate;
    } else {
      const now = new Date();
      const monterreyTime = new Date(now.getTime() - (6 * 60 * 60 * 1000)); // UTC-6
      targetDate = monterreyTime.toISOString().split('T')[0];
    }
    
    const supabase = createServerSupabaseClient();

    // 📊 1. CONSULTAR VENTAS DIRECTAS (sale_type = 'sale')
    const { data: directSalesData, error: directSalesError } = await supabase
      .from('sales')
      .select(`
        id,
        sale_number,
        sale_type,
        total_amount,
        is_mixed_payment,
        payment_received,
        change_amount,
        commission_amount,
        status,
        created_at,
        sale_payment_details (
          payment_method,
          amount,
          commission_amount,
          is_partial_payment
        )
      `)
      .gte('created_at', `${targetDate}T06:00:00.000Z`)
      .lt('created_at', `${getNextDay(targetDate)}T06:00:00.000Z`)
      .eq('sale_type', 'sale')
      .eq('status', 'completed');

    if (directSalesError) {
      console.error('Error consultando ventas directas:', directSalesError);
      throw directSalesError;
    }

    // 🏪 2. CONSULTAR APARTADOS (sale_type = 'layaway')
    const { data: layawayData, error: layawayError } = await supabase
      .from('sales')
      .select(`
        id,
        sale_number,
        sale_type,
        total_amount,
        paid_amount,
        pending_amount,
        is_mixed_payment,
        commission_amount,
        status,
        created_at,
        sale_payment_details (
          payment_method,
          amount,
          commission_amount,
          is_partial_payment
        )
      `)
      .gte('created_at', `${targetDate}T06:00:00.000Z`)
      .lt('created_at', `${getNextDay(targetDate)}T06:00:00.000Z`)
      .eq('sale_type', 'layaway')
      .in('status', ['pending', 'completed']);

    if (layawayError) {
      console.error('Error consultando apartados:', layawayError);
      throw layawayError;
    }

    // 💰 3. CONSULTAR ABONOS (pagos parciales de apartados)
    const { data: partialPaymentsData, error: partialPaymentsError } = await supabase
      .from('sale_payment_details')
      .select(`
        id,
        sale_id,
        payment_method,
        amount,
        commission_amount,
        is_partial_payment,
        payment_date,
        created_at,
        sales!inner (
          sale_number,
          sale_type
        )
      `)
      .gte('payment_date', `${targetDate}T06:00:00.000Z`)
      .lt('payment_date', `${getNextDay(targetDate)}T06:00:00.000Z`)
      .eq('is_partial_payment', true);

    if (partialPaymentsError) {
      console.error('Error consultando abonos:', partialPaymentsError);
      throw partialPaymentsError;
    }

    // 💪 4. CONSULTAR MEMBRESÍAS
    const { data: membershipsData, error: membershipsError } = await supabase
      .from('user_memberships')
      .select(`
        id,
        amount_paid,
        inscription_amount,
        is_mixed_payment,
        commission_amount,
        status,
        created_at,
        membership_payment_details (
          payment_method,
          amount,
          commission_amount
        )
      `)
      .gte('created_at', `${targetDate}T06:00:00.000Z`)
      .lt('created_at', `${getNextDay(targetDate)}T06:00:00.000Z`)
      .eq('status', 'active');

    if (membershipsError) {
      console.error('Error consultando membresías:', membershipsError);
      throw membershipsError;
    }

    // 🧮 PROCESAR VENTAS DIRECTAS
    const directSalesStats = processPaymentData(directSalesData, 'sale');

    // 🧮 PROCESAR APARTADOS (SOLO LOS CREADOS HOY)
    const layawayStats = processPaymentData(layawayData, 'layaway');

    // 🧮 PROCESAR ABONOS (PAGOS REALIZADOS HOY)
    const abonosStats = {
      efectivo: 0,
      transferencia: 0,
      debito: 0,
      credito: 0,
      mixto: 0,
      total: 0,
      transactions: 0,
      commissions: 0
    };

    partialPaymentsData?.forEach(payment => {
      abonosStats.transactions++;
      const amount = Number(payment.amount) || 0;
      abonosStats.total += amount;
      abonosStats.commissions += Number(payment.commission_amount) || 0;

      const method = payment.payment_method;
      if (method && ['efectivo', 'transferencia', 'debito', 'credito'].includes(method)) {
        abonosStats[method as keyof typeof abonosStats] += amount;
      }
    });

    // 🧮 PROCESAR MEMBRESÍAS
    const membershipsStats = {
      efectivo: 0,
      transferencia: 0,
      debito: 0,
      credito: 0,
      mixto: 0,
      total: 0,
      transactions: 0,
      commissions: 0
    };

    membershipsData?.forEach(membership => {
      membershipsStats.transactions++;
      const amount = Number(membership.amount_paid) || 0;
      membershipsStats.total += amount;
      membershipsStats.commissions += Number(membership.commission_amount) || 0;

      if (membership.is_mixed_payment && membership.membership_payment_details?.length > 0) {
        membershipsStats.mixto += amount;
      } else {
        const payment = membership.membership_payment_details?.[0];
        if (payment) {
          const method = payment.payment_method;
          if (method && ['efectivo', 'transferencia', 'debito', 'credito'].includes(method)) {
            membershipsStats[method as keyof typeof membershipsStats] += Number(payment.amount) || 0;
          }
        }
      }
    });

    // 📈 CONSOLIDAR VENTAS POS (directas + apartados creados hoy)
    const posStats = {
      efectivo: directSalesStats.efectivo + layawayStats.efectivo,
      transferencia: directSalesStats.transferencia + layawayStats.transferencia,
      debito: directSalesStats.debito + layawayStats.debito,
      credito: directSalesStats.credito + layawayStats.credito,
      mixto: directSalesStats.mixto + layawayStats.mixto,
      total: directSalesStats.total + layawayStats.total,
      transactions: directSalesStats.transactions + layawayStats.transactions,
      commissions: directSalesStats.commissions + layawayStats.commissions
    };

    // 📈 TOTALES CONSOLIDADOS
    const totals = {
      efectivo: posStats.efectivo + abonosStats.efectivo + membershipsStats.efectivo,
      transferencia: posStats.transferencia + abonosStats.transferencia + membershipsStats.transferencia,
      debito: posStats.debito + abonosStats.debito + membershipsStats.debito,
      credito: posStats.credito + abonosStats.credito + membershipsStats.credito,
      mixto: posStats.mixto + abonosStats.mixto + membershipsStats.mixto,
      total: posStats.total + abonosStats.total + membershipsStats.total,
      transactions: posStats.transactions + abonosStats.transactions + membershipsStats.transactions,
      commissions: posStats.commissions + abonosStats.commissions + membershipsStats.commissions,
      net_amount: (posStats.total + abonosStats.total + membershipsStats.total) - 
                  (posStats.commissions + abonosStats.commissions + membershipsStats.commissions)
    };

    return NextResponse.json({
      date: targetDate,
      pos: posStats,
      abonos: abonosStats,
      memberships: membershipsStats,
      totals,
      success: true,
      timestamp: new Date().toISOString(),
      debug: {
        directSalesCount: directSalesData?.length || 0,
        layawayCount: layawayData?.length || 0,
        abonosCount: partialPaymentsData?.length || 0,
        membershipsCount: membershipsData?.length || 0,
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

// 🔧 Función auxiliar para procesar datos de pagos
function processPaymentData(salesData: any[], saleType: string) {
  const stats = {
    efectivo: 0,
    transferencia: 0,
    debito: 0,
    credito: 0,
    mixto: 0,
    total: 0,
    transactions: 0,
    commissions: 0
  };

  salesData?.forEach(sale => {
    stats.transactions++;
    const amount = Number(sale.total_amount) || 0;
    stats.total += amount;
    stats.commissions += Number(sale.commission_amount) || 0;

    if (sale.is_mixed_payment && sale.sale_payment_details?.length > 1) {
      stats.mixto += amount;
    } else {
      // Obtener el primer pago no parcial
      const payment = sale.sale_payment_details?.find((p: any) => !p.is_partial_payment);
      if (payment) {
        const method = payment.payment_method;
        if (method && ['efectivo', 'transferencia', 'debito', 'credito'].includes(method)) {
          stats[method as keyof typeof stats] += amount;
        }
      }
    }
  });

  return stats;
}

function getNextDay(dateString: string): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
}
