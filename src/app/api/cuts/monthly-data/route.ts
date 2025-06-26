import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // formato: YYYY-MM

    if (!month) {
      return NextResponse.json(
        { error: 'Mes requerido', success: false },
        { status: 400 }
      );
    }

    const [year, monthNum] = month.split('-').map(Number);
    
    // Calcular primer y último día del mes
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);
    
    // Convertir a ISO para las consultas
    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    console.log('📅 Consultando datos del mes:', {
      month,
      startISO,
      endISO
    });

    const supabase = createServerSupabaseClient();

    // 1. VENTAS POS DEL MES
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select(`
        total_amount,
        sale_payment_details (
          payment_method,
          amount,
          commission_amount,
          is_partial_payment
        )
      `)
      .eq('sale_type', 'sale')
      .eq('status', 'completed')
      .gte('created_at', startISO)
      .lte('created_at', endISO);

    if (salesError) throw salesError;

    // 2. ABONOS DEL MES
    const { data: abonosData, error: abonosError } = await supabase
      .from('sale_payment_details')
      .select(`
        payment_method,
        amount,
        commission_amount,
        sale_id,
        sales!inner (
          sale_type,
          status
        )
      `)
      .eq('is_partial_payment', true)
      .gte('payment_date', startISO)
      .lte('payment_date', endISO);

    if (abonosError) throw abonosError;

    // 3. MEMBRESÍAS DEL MES
    const { data: membershipsData, error: membershipsError } = await supabase
      .from('user_memberships')
      .select(`
        amount_paid,
        payment_method,
        commission_amount
      `)
      .gte('created_at', startISO)
      .lte('created_at', endISO);

    if (membershipsError) throw membershipsError;

    // Calcular totales
    let totalSales = 0;
    let salesTransactions = 0;

    salesData?.forEach(sale => {
      salesTransactions++;
      sale.sale_payment_details?.forEach(payment => {
        if (!payment.is_partial_payment) {
          totalSales += parseFloat(payment.amount || '0') + parseFloat(payment.commission_amount || '0');
        }
      });
    });

    let totalAbonos = 0;
    const uniqueAbonosSales = new Set();
    
    abonosData?.forEach(abono => {
      totalAbonos += parseFloat(abono.amount || '0') + parseFloat(abono.commission_amount || '0');
      uniqueAbonosSales.add(abono.sale_id);
    });

    let totalMemberships = 0;
    let membershipTransactions = membershipsData?.length || 0;
    
    membershipsData?.forEach(membership => {
      totalMemberships += parseFloat(membership.amount_paid || '0');
    });

    const totalTransactions = salesTransactions + uniqueAbonosSales.size + membershipTransactions;
    const total = totalSales + totalAbonos + totalMemberships;

    return NextResponse.json({
      success: true,
      month,
      data: {
        sales: totalSales,
        memberships: totalMemberships,
        layaways: totalAbonos,
        total,
        transactions: totalTransactions
      }
    });

  } catch (error: any) {
    console.error('💥 Error en monthly-data API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', success: false },
      { status: 500 }
    );
  }
}
