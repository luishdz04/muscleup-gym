import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 🇲🇽 Fecha en Monterrey (UTC-6)
    const requestedDate = searchParams.get('date');
    let targetDate: string;
    
    if (requestedDate) {
      targetDate = requestedDate;
    } else {
      const now = new Date();
      const monterreyTime = new Date(now.getTime() - (6 * 60 * 60 * 1000));
      targetDate = monterreyTime.toISOString().split('T')[0];
    }
    
    const supabase = createServerSupabaseClient();

    // 📊 1. VENTAS DIRECTAS DEL DÍA (sale_type = 'sale' AND status = 'completed')
    const { data: directSalesData, error: directSalesError } = await supabase
      .from('sales')
      .select(`
        id,
        sale_number,
        sale_type,
        total_amount,
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
      .eq('sale_type', 'sale')
      .eq('status', 'completed');

    if (directSalesError) throw directSalesError;

    // 🏪 2. APARTADOS COMPLETADOS HOY (sale_type = 'layaway' AND status = 'completed' AND completed_at es hoy)
    const { data: completedLayawaysData, error: completedLayawaysError } = await supabase
      .from('sales')
      .select(`
        id,
        sale_number,
        sale_type,
        total_amount,
        is_mixed_payment,
        commission_amount,
        status,
        completed_at,
        sale_payment_details (
          payment_method,
          amount,
          commission_amount,
          is_partial_payment
        )
      `)
      .gte('completed_at', `${targetDate}T06:00:00.000Z`)
      .lt('completed_at', `${getNextDay(targetDate)}T06:00:00.000Z`)
      .eq('sale_type', 'layaway')
      .eq('status', 'completed');

    if (completedLayawaysError) throw completedLayawaysError;

    // 💰 3. TODOS LOS PAGOS DEL DÍA (incluyendo enganches y abonos)
    const { data: allPaymentsData, error: allPaymentsError } = await supabase
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
          sale_type,
          status,
          created_at as sale_created_at
        )
      `)
      .gte('payment_date', `${targetDate}T06:00:00.000Z`)
      .lt('payment_date', `${getNextDay(targetDate)}T06:00:00.000Z`);

    if (allPaymentsError) throw allPaymentsError;

    // 💪 4. MEMBRESÍAS DEL DÍA
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

    if (membershipsError) throw membershipsError;

    // 🧮 PROCESAR VENTAS DIRECTAS
    const directSalesStats = processStandardSales(directSalesData);

    // 🧮 PROCESAR APARTADOS COMPLETADOS
    const completedLayawaysStats = processStandardSales(completedLayawaysData);

    // 🧮 CONSOLIDAR VENTAS POS (directas + apartados completados)
    const posStats = {
      efectivo: directSalesStats.efectivo + completedLayawaysStats.efectivo,
      transferencia: directSalesStats.transferencia + completedLayawaysStats.transferencia,
      debito: directSalesStats.debito + completedLayawaysStats.debito,
      credito: directSalesStats.credito + completedLayawaysStats.credito,
      mixto: directSalesStats.mixto + completedLayawaysStats.mixto,
      total: directSalesStats.total + completedLayawaysStats.total,
      transactions: directSalesStats.transactions + completedLayawaysStats.transactions,
      commissions: directSalesStats.commissions + completedLayawaysStats.commissions
    };

    // 🧮 PROCESAR ABONOS (TODOS los pagos que NO sean de ventas directas completadas hoy)
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

    // IDs de ventas directas procesadas para evitar doble conteo
    const directSaleIds = directSalesData?.map(sale => sale.id) || [];
    const completedLayawayIds = completedLayawaysData?.map(sale => sale.id) || [];
    const processedSaleIds = [...directSaleIds, ...completedLayawayIds];

    allPaymentsData?.forEach(payment => {
      // Solo contar pagos que NO sean de ventas ya procesadas en POS
      if (!processedSaleIds.includes(payment.sale_id)) {
        abonosStats.transactions++;
        const amount = Number(payment.amount) || 0;
        abonosStats.total += amount;
        abonosStats.commissions += Number(payment.commission_amount) || 0;

        const method = payment.payment_method;
        if (method && ['efectivo', 'transferencia', 'debito', 'credito'].includes(method)) {
          abonosStats[method as keyof typeof abonosStats] += amount;
        }
      }
    });

    // 🧮 PROCESAR MEMBRESÍAS
    const membershipsStats = processMemberships(membershipsData);

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
        completedLayawaysCount: completedLayawaysData?.length || 0,
        totalPaymentsCount: allPaymentsData?.length || 0,
        abonosCount: abonosStats.transactions,
        membershipsCount: membershipsData?.length || 0,
        processedSaleIds: processedSaleIds,
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

// 🔧 Función para procesar ventas estándar (directas y apartados completados)
function processStandardSales(salesData: any[]) {
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
      const payment = sale.sale_payment_details?.[0];
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

// 🔧 Función para procesar membresías
function processMemberships(membershipsData: any[]) {
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

  membershipsData?.forEach(membership => {
    stats.transactions++;
    const amount = Number(membership.amount_paid) || 0;
    stats.total += amount;
    stats.commissions += Number(membership.commission_amount) || 0;

    if (membership.is_mixed_payment && membership.membership_payment_details?.length > 1) {
      stats.mixto += amount;
    } else {
      const payment = membership.membership_payment_details?.[0];
      if (payment) {
        const method = payment.payment_method;
        if (method && ['efectivo', 'transferencia', 'debito', 'credito'].includes(method)) {
          stats[method as keyof typeof stats] += Number(payment.amount) || 0;
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
