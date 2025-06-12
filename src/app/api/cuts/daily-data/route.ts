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

    console.log('🔍 Consultando datos para fecha:', targetDate);
    console.log('🔍 Rango UTC:', `${targetDate}T06:00:00.000Z a ${getNextDay(targetDate)}T06:00:00.000Z`);

    // 📊 1. OBTENER TODAS LAS VENTAS DEL DÍA (sin filtros complejos)
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select(`
        id,
        sale_number,
        sale_type,
        total_amount,
        status,
        is_mixed_payment,
        commission_amount,
        created_at
      `)
      .gte('created_at', `${targetDate}T06:00:00.000Z`)
      .lt('created_at', `${getNextDay(targetDate)}T06:00:00.000Z`);

    if (salesError) {
      console.error('❌ Error consultando ventas:', salesError);
      throw new Error(`Error en ventas: ${salesError.message}`);
    }

    console.log('✅ Ventas encontradas:', salesData?.length);
    console.log('📊 Ventas data:', salesData?.map(s => ({ 
      number: s.sale_number, 
      type: s.sale_type, 
      status: s.status,
      total: s.total_amount 
    })));

    // 💰 2. OBTENER TODOS LOS PAGOS DEL DÍA
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('sale_payment_details')
      .select(`
        id,
        sale_id,
        payment_method,
        amount,
        commission_amount,
        is_partial_payment,
        payment_date,
        created_at
      `)
      .gte('payment_date', `${targetDate}T06:00:00.000Z`)
      .lt('payment_date', `${getNextDay(targetDate)}T06:00:00.000Z`);

    if (paymentsError) {
      console.error('❌ Error consultando pagos:', paymentsError);
      throw new Error(`Error en pagos: ${paymentsError.message}`);
    }

    console.log('✅ Pagos encontrados:', paymentsData?.length);
    console.log('💳 Pagos data:', paymentsData?.map(p => ({ 
      sale_id: p.sale_id, 
      method: p.payment_method, 
      amount: p.amount,
      is_partial: p.is_partial_payment
    })));

    // 💪 3. OBTENER MEMBRESÍAS DEL DÍA
    const { data: membershipsData, error: membershipsError } = await supabase
      .from('user_memberships')
      .select(`
        id,
        amount_paid,
        inscription_amount,
        is_mixed_payment,
        commission_amount,
        status,
        created_at
      `)
      .gte('created_at', `${targetDate}T06:00:00.000Z`)
      .lt('created_at', `${getNextDay(targetDate)}T06:00:00.000Z`)
      .eq('status', 'active');

    if (membershipsError) {
      console.error('❌ Error consultando membresías:', membershipsError);
      throw new Error(`Error en membresías: ${membershipsError.message}`);
    }

    console.log('✅ Membresías encontradas:', membershipsData?.length);

    // 💪 4. OBTENER DETALLES DE PAGOS DE MEMBRESÍAS
    const membershipIds = membershipsData?.map(m => m.id) || [];
    let membershipPaymentsData: any[] = [];
    
    if (membershipIds.length > 0) {
      const { data: membershipPayments, error: membershipPaymentsError } = await supabase
        .from('membership_payment_details')
        .select(`
          id,
          membership_id,
          payment_method,
          amount,
          commission_amount
        `)
        .in('membership_id', membershipIds);

      if (membershipPaymentsError) {
        console.error('❌ Error consultando pagos de membresías:', membershipPaymentsError);
      } else {
        membershipPaymentsData = membershipPayments || [];
      }
    }

    // 🧮 PROCESAR DATOS CON LÓGICA CLARA

    // === VENTAS POS (Ventas directas completadas) ===
    const directSales = salesData?.filter(sale => 
      sale.sale_type === 'sale' && sale.status === 'completed'
    ) || [];

    const posStats = {
      efectivo: 0,
      transferencia: 0,
      debito: 0,
      credito: 0,
      mixto: 0,
      total: 0,
      transactions: directSales.length,
      commissions: 0
    };

    directSales.forEach(sale => {
      const saleTotal = Number(sale.total_amount) || 0;
      posStats.total += saleTotal;
      posStats.commissions += Number(sale.commission_amount) || 0;

      // Encontrar pagos de esta venta
      const salePayments = paymentsData?.filter(p => p.sale_id === sale.id) || [];
      
      if (sale.is_mixed_payment && salePayments.length > 1) {
        posStats.mixto += saleTotal;
      } else {
        const mainPayment = salePayments[0];
        if (mainPayment) {
          const method = mainPayment.payment_method;
          if (['efectivo', 'transferencia', 'debito', 'credito'].includes(method)) {
            posStats[method as keyof typeof posStats] += saleTotal;
          }
        }
      }
    });

    // === ABONOS (Pagos parciales + Enganches de apartados) ===
    const directSaleIds = directSales.map(sale => sale.id);
    const abonoPayments = paymentsData?.filter(payment => 
      !directSaleIds.includes(payment.sale_id)
    ) || [];

    const abonosStats = {
      efectivo: 0,
      transferencia: 0,
      debito: 0,
      credito: 0,
      mixto: 0,
      total: 0,
      transactions: abonoPayments.length,
      commissions: 0
    };

    abonoPayments.forEach(payment => {
      const amount = Number(payment.amount) || 0;
      abonosStats.total += amount;
      abonosStats.commissions += Number(payment.commission_amount) || 0;

      const method = payment.payment_method;
      if (['efectivo', 'transferencia', 'debito', 'credito'].includes(method)) {
        abonosStats[method as keyof typeof abonosStats] += amount;
      }
    });

    // === MEMBRESÍAS ===
    const membershipsStats = {
      efectivo: 0,
      transferencia: 0,
      debito: 0,
      credito: 0,
      mixto: 0,
      total: 0,
      transactions: membershipsData?.length || 0,
      commissions: 0
    };

    membershipsData?.forEach(membership => {
      const amount = Number(membership.amount_paid) || 0;
      membershipsStats.total += amount;
      membershipsStats.commissions += Number(membership.commission_amount) || 0;

      const membershipPayments = membershipPaymentsData.filter(p => p.membership_id === membership.id);
      
      if (membership.is_mixed_payment && membershipPayments.length > 1) {
        membershipsStats.mixto += amount;
      } else {
        const mainPayment = membershipPayments[0];
        if (mainPayment) {
          const method = mainPayment.payment_method;
          if (['efectivo', 'transferencia', 'debito', 'credito'].includes(method)) {
            membershipsStats[method as keyof typeof membershipsStats] += Number(mainPayment.amount) || 0;
          }
        }
      }
    });

    // === TOTALES CONSOLIDADOS ===
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

    console.log('📊 Resultado final:');
    console.log('- POS:', posStats);
    console.log('- Abonos:', abonosStats);
    console.log('- Membresías:', membershipsStats);
    console.log('- Totales:', totals);

    return NextResponse.json({
      date: targetDate,
      pos: posStats,
      abonos: abonosStats,
      memberships: membershipsStats,
      totals,
      success: true,
      timestamp: new Date().toISOString(),
      debug: {
        totalSales: salesData?.length || 0,
        directSales: directSales.length,
        totalPayments: paymentsData?.length || 0,
        abonoPayments: abonoPayments.length,
        memberships: membershipsData?.length || 0,
        dateRange: `${targetDate}T06:00:00.000Z to ${getNextDay(targetDate)}T06:00:00.000Z`
      }
    });

  } catch (error) {
    console.error('💥 Error completo:', error);
    return NextResponse.json(
      { 
        error: `Error al obtener datos del día: ${error instanceof Error ? error.message : 'Error desconocido'}`, 
        success: false,
        details: error instanceof Error ? error.stack : 'No stack trace'
      },
      { status: 500 }
    );
  }
}

function getNextDay(dateString: string): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
}
