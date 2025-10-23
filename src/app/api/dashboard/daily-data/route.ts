import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getMexicoDateRange } from '@/utils/dateUtils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Fecha requerida', success: false },
        { status: 400 }
      );
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Formato de fecha inválido. Use YYYY-MM-DD', success: false },
        { status: 400 }
      );
    }

    console.log('🚀 [DASHBOARD-DAILY] Obteniendo datos independientes para:', date);

    const supabase = createAdminSupabaseClient();
    const { startISO, endISO } = getMexicoDateRange(date);

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

    // 3. MEMBRESÍAS - Filtrar por fecha de pago, no por fecha de creación de membresía
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
          status
        )
      `)
      .eq('user_memberships.status', 'active')
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
    const expenses_amount = expensesData?.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0) || 0;
    const expenses_count = expensesData?.length || 0;

    // 📊 CALCULAR TOTALES
    const grand_total = pos.total + abonos.total + memberships.total;
    const final_balance = grand_total - expenses_amount;

    const totals = {
      efectivo: pos.efectivo + abonos.efectivo + memberships.efectivo,
      transferencia: pos.transferencia + abonos.transferencia + memberships.transferencia,
      debito: pos.debito + abonos.debito + memberships.debito,
      credito: pos.credito + abonos.credito + memberships.credito,
      total: grand_total,
      transactions: pos.transactions + abonos.transactions + memberships.transactions,
      commissions: pos.commissions + abonos.commissions + memberships.commissions,
      net_amount: grand_total - (pos.commissions + abonos.commissions + memberships.commissions)
    };

    console.log('✅ [DASHBOARD-DAILY] Datos procesados:', {
      pos: pos.total,
      abonos: abonos.total,
      memberships: memberships.total,
      expenses: expenses_amount,
      total: grand_total
    });

    // RESPUESTA FINAL
    const response = {
      success: true,
      date,
      pos,
      abonos,
      memberships,
      expenses: {
        amount: expenses_amount,
        count: expenses_count
      },
      totals: {
        ...totals,
        expenses_amount,
        final_balance
      }
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('[API /dashboard/daily-data] Error:', error.message);
    
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
