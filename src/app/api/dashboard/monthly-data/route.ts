import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // formato: YYYY-MM

    console.log('🚀 [DASHBOARD-MONTHLY] Obteniendo datos independientes para:', month);

    if (!month) {
      return NextResponse.json(
        { error: 'Mes requerido', success: false },
        { status: 400 }
      );
    }

    // ✅ VALIDAR FORMATO DE MES
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      console.error('❌ Error: Formato de mes inválido:', month);
      return NextResponse.json(
        { error: 'Formato de mes inválido. Use YYYY-MM', success: false },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // Calcular primer y último día del mes en horario CDMX
    const [year, monthNum] = month.split('-').map(Number);
    const monthKey = `${year}-${monthNum.toString().padStart(2, '0')}`;
    const firstDay = `${monthKey}-01`;
    const lastDayDate = new Date(Date.UTC(year, monthNum, 0));
    const lastDay = lastDayDate.getUTCDate();
    const lastDayString = `${monthKey}-${lastDay.toString().padStart(2, '0')}`;

    console.log('📅 Rango de fechas para el mes:', {
      mes: month,
      primer_dia: firstDay,
      ultimo_dia: lastDayString
    });

    // Calcular fechas ISO para el rango del mes
    const startDate = new Date(`${firstDay}T00:00:00-06:00`); // CDMX timezone
    const endDate = new Date(`${lastDayString}T23:59:59-06:00`); // CDMX timezone
    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    console.log('🕐 Rango ISO:', { startISO, endISO });

    // 1. VENTAS POS (productos)
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select(`
        id,
        total_amount,
        created_at,
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

    if (salesError) {
      throw new Error(`Error consultando ventas: ${salesError.message}`);
    }

    // 2. ABONOS (apartados)
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

    // 3. MEMBRESÍAS - Mostrar TODOS los pagos del mes, sin filtrar por status
    const { data: membershipsData, error: membershipsError } = await supabase
      .from('membership_payment_details')
      .select(`
        id,
        payment_method,
        amount,
        commission_amount,
        created_at,
        membership_id,
        user_memberships!inner (
          id,
          status,
          created_at
        )
      `)
      .gte('created_at', startISO)
      .lte('created_at', endISO);

    if (membershipsError) {
      throw new Error(`Error consultando membresías: ${membershipsError.message}`);
    }

    // 4. EGRESOS
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('id, amount, created_at')
      .gte('created_at', startISO)
      .lte('created_at', endISO);

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

    if (salesData) {
      const uniqueSales = new Set();
      salesData.forEach(sale => {
        uniqueSales.add(sale.id);
        sale.sale_payment_details?.forEach(payment => {
          const amount = parseFloat(payment.amount.toString());
          const commission = parseFloat(payment.commission_amount?.toString() || '0');
          
          pos.commissions += commission;
          
          switch (payment.payment_method) {
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
          }
        });
      });
      pos.transactions = uniqueSales.size;
    }
    pos.total = pos.efectivo + pos.transferencia + pos.debito + pos.credito;

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

    if (abonosData) {
      const uniqueAbonos = new Set();
      abonosData.forEach(abono => {
        uniqueAbonos.add(abono.sale_id);
        const amount = parseFloat(abono.amount.toString());
        const commission = parseFloat(abono.commission_amount?.toString() || '0');
        
        abonos.commissions += commission;
        
        switch (abono.payment_method) {
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
        }
      });
      abonos.transactions = uniqueAbonos.size;
    }
    abonos.total = abonos.efectivo + abonos.transferencia + abonos.debito + abonos.credito;

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

    if (membershipsData) {
      const uniqueMemberships = new Set();
      membershipsData.forEach(payment => {
        uniqueMemberships.add(payment.membership_id);
        const amount = parseFloat(payment.amount.toString());
        const commission = parseFloat(payment.commission_amount?.toString() || '0');
        
        memberships.commissions += commission;
        
        switch (payment.payment_method) {
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
        }
      });
      memberships.transactions = uniqueMemberships.size;
    }
    memberships.total = memberships.efectivo + memberships.transferencia + memberships.debito + memberships.credito;

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

    console.log('✅ [DASHBOARD-MONTHLY] Datos procesados:', {
      pos: pos.total,
      abonos: abonos.total,
      memberships: memberships.total,
      expenses: expenses,
      total: grandTotal
    });

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
    console.error('[API /dashboard/monthly-data] Error:', error.message);

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
