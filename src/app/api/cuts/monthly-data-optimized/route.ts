import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // Formato: 2025-10

    if (!month) {
      return NextResponse.json(
        { error: 'Mes requerido (formato: YYYY-MM)', success: false },
        { status: 400 }
      );
    }

    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      return NextResponse.json(
        { error: 'Formato de mes inválido. Use YYYY-MM', success: false },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    
    // Calcular rangos de fechas para el mes completo
    const [year, monthNum] = month.split('-').map(Number);
    const startOfMonth = new Date(Date.UTC(year, monthNum - 1, 1, 6, 0, 0)); // 06:00 UTC
    const endOfMonth = new Date(Date.UTC(year, monthNum, 1, 5, 59, 59, 999)); // Siguiente mes - 1 segundo
    
    const startISO = startOfMonth.toISOString();
    const endISO = endOfMonth.toISOString();

    // 🚀 CONSULTA OPTIMIZADA 1: VENTAS POS DEL MES COMPLETO
    const { data: salesData, error: salesError } = await supabase
      .from('sale_payment_details')
      .select(`
        payment_method,
        amount,
        commission_amount,
        sales!inner (
          sale_type,
          status,
          created_at
        )
      `)
      .eq('sales.sale_type', 'sale')
      .eq('sales.status', 'completed')
      .gte('sales.created_at', startISO)
      .lte('sales.created_at', endISO)
      .or('is_partial_payment.is.null,is_partial_payment.eq.false');

    if (salesError) {
      throw new Error(`Error consultando ventas: ${salesError.message}`);
    }

    // 🚀 CONSULTA OPTIMIZADA 2: ABONOS (APARTADOS) DEL MES COMPLETO
    // ✅ EXCLUIR APARTADOS CANCELADOS - Solo contar pagos de apartados activos/completados
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
      .eq('sales.sale_type', 'layaway')
      .neq('sales.status', 'cancelled')
      .gte('payment_date', startISO)
      .lte('payment_date', endISO);

    if (abonosError) {
      throw new Error(`Error consultando abonos: ${abonosError.message}`);
    }

    // 🚀 CONSULTA OPTIMIZADA 3: MEMBRESÍAS DEL MES COMPLETO
    const { data: membershipsData, error: membershipsError } = await supabase
      .from('membership_payment_details')
      .select('payment_method, amount, commission_amount, membership_id')
      .gte('created_at', startISO)
      .lte('created_at', endISO);

    if (membershipsError) {
      throw new Error(`Error consultando membresías: ${membershipsError.message}`);
    }

    // 🚀 CONSULTA OPTIMIZADA 4: EGRESOS DEL MES COMPLETO
    // ✅ CORRECCIÓN: Calcular el último día del mes correctamente
    const lastDayOfMonth = new Date(year, monthNum, 0).getDate(); // 28, 29, 30 o 31
    const lastDayStr = String(lastDayOfMonth).padStart(2, '0');
    
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('amount, expense_date')
      .eq('status', 'active')
      .gte('expense_date', `${month}-01`)
      .lte('expense_date', `${month}-${lastDayStr}`);

    if (expensesError) {
      throw new Error(`Error consultando egresos: ${expensesError.message}`);
    }

    // 📊 PROCESAR VENTAS POS
    const pos = {
      efectivo: 0,
      transferencia: 0,
      debito: 0,
      credito: 0,
      total: 0,
      transactions: 0,
      commissions: 0
    };

    const uniqueSales = new Set();
    salesData?.forEach(payment => {
      uniqueSales.add((payment as any).sales.id);
      const amount = parseFloat(payment.amount || '0');
      const commission = parseFloat(payment.commission_amount || '0');

      pos.total += amount;
      pos.commissions += commission;

      switch (payment.payment_method?.toLowerCase()) {
        case 'efectivo':
          pos.efectivo += amount;
          break;
        case 'transferencia':
          pos.transferencia += amount;
          break;
        case 'debito':
          pos.debito += amount;
          break;
        case 'credito':
          pos.credito += amount;
          break;
        default:
          pos.efectivo += amount;
      }
    });
    pos.transactions = uniqueSales.size;

    // 📊 PROCESAR ABONOS
    const abonos = {
      efectivo: 0,
      transferencia: 0,
      debito: 0,
      credito: 0,
      total: 0,
      transactions: 0,
      commissions: 0
    };

    const uniqueLayaways = new Set();
    abonosData?.forEach(payment => {
      uniqueLayaways.add(payment.sale_id);
      const amount = parseFloat(payment.amount || '0');
      const commission = parseFloat(payment.commission_amount || '0');

      abonos.total += amount;
      abonos.commissions += commission;

      switch (payment.payment_method?.toLowerCase()) {
        case 'efectivo':
          abonos.efectivo += amount;
          break;
        case 'transferencia':
          abonos.transferencia += amount;
          break;
        case 'debito':
          abonos.debito += amount;
          break;
        case 'credito':
          abonos.credito += amount;
          break;
        default:
          abonos.efectivo += amount;
      }
    });
    abonos.transactions = uniqueLayaways.size;

    // 📊 PROCESAR MEMBRESÍAS
    const memberships = {
      efectivo: 0,
      transferencia: 0,
      debito: 0,
      credito: 0,
      total: 0,
      transactions: 0,
      commissions: 0
    };

    const uniqueMemberships = new Set();
    membershipsData?.forEach(payment => {
      uniqueMemberships.add(payment.membership_id);
      const amount = parseFloat(payment.amount || '0');
      const commission = parseFloat(payment.commission_amount || '0');

      memberships.total += amount;
      memberships.commissions += commission;

      switch (payment.payment_method?.toLowerCase()) {
        case 'efectivo':
          memberships.efectivo += amount;
          break;
        case 'transferencia':
          memberships.transferencia += amount;
          break;
        case 'debito':
          memberships.debito += amount;
          break;
        case 'credito':
          memberships.credito += amount;
          break;
        default:
          memberships.efectivo += amount;
      }
    });
    memberships.transactions = uniqueMemberships.size;

    // 📊 PROCESAR EGRESOS
    const expenses = expensesData?.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0) || 0;
    const expensesCount = expensesData?.length || 0;

    // 📊 CALCULAR TOTALES
    const grandTotal = pos.total + abonos.total + memberships.total;
    const finalBalance = grandTotal - expenses;

    const totals = {
      efectivo: pos.efectivo + abonos.efectivo + memberships.efectivo,
      transferencia: pos.transferencia + abonos.transferencia + memberships.transferencia,
      debito: pos.debito + abonos.debito + memberships.debito,
      credito: pos.credito + abonos.credito + memberships.credito,
      total: grandTotal,
      transactions: pos.transactions + abonos.transactions + memberships.transactions,
      commissions: pos.commissions + abonos.commissions + memberships.commissions
    };

    return NextResponse.json({
      success: true,
      month,
      pos,
      abonos,
      memberships,
      expenses: {
        amount: expenses,
        count: expensesCount
      },
      totals,
      finalBalance
    });

  } catch (error: any) {
    console.error('[API /cuts/monthly-data-optimized] Error:', error.message);

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        success: false
      },
      { status: 500 }
    );
  }
}
