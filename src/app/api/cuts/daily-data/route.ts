import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
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

    const supabase = createServerSupabaseClient();
    const { startISO, endISO } = getMexicoDateRange(date);

    // 1. VENTAS POS
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



    // 2. ABONOS (APARTADOS)
    // ✅ CORRECCIÓN: Filtrar por sale_type='layaway' en lugar de is_partial_payment
    // Esto incluye TODOS los pagos de apartados, sin importar el flag is_partial_payment
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

    // 3. MEMBRESÍAS - BUSCAR EN membership_payment_details
    // IMPORTANTE: Los pagos se registran en membership_payment_details con su propio created_at
    // NO en user_memberships, porque ahí el created_at es cuando se creó la membresía, 
    // no cuando se hicieron los pagos individuales.
    const { data: membershipsData, error: membershipsError } = await supabase
      .from('membership_payment_details')
      .select(`
        id,
        membership_id,
        payment_method,
        amount,
        commission_amount,
        created_at
      `)
      .gte('created_at', startISO)
      .lte('created_at', endISO);

    if (membershipsError) {
      throw new Error(`Error consultando pagos de membresías: ${membershipsError.message}`);
    }



    // PROCESAR VENTAS POS
    const pos = {
      efectivo: 0,
      transferencia: 0,
      debito: 0,
      credito: 0,
      total: 0,
      transactions: 0,
      commissions: 0
    };

    salesData?.forEach(sale => {
      pos.transactions++;
      
      sale.sale_payment_details?.forEach(payment => {
        if (!payment.is_partial_payment) {
          // IMPORTANTE: El 'amount' ya incluye la comisión
          // commission_amount es solo informativo
          const amount = parseFloat(payment.amount || '0');
          const commission = parseFloat(payment.commission_amount || '0');
          
          pos.total += amount; // NO sumar comisión, ya está incluida
          pos.commissions += commission; // Solo para información
          
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
              break;
          }
        }
      });
    });

    // PROCESAR ABONOS
    const abonos = {
      efectivo: 0,
      transferencia: 0,
      debito: 0,
      credito: 0,
      total: 0,
      transactions: 0,
      commissions: 0
    };

    const uniqueSaleIds = new Set();
    abonosData?.forEach(abono => {
      // IMPORTANTE: El 'amount' ya incluye la comisión
      // commission_amount es solo informativo
      const amount = parseFloat(abono.amount || '0');
      const commission = parseFloat(abono.commission_amount || '0');
      
      abonos.total += amount; // NO sumar comisión, ya está incluida
      abonos.commissions += commission; // Solo para información
      uniqueSaleIds.add(abono.sale_id);
      
      switch (abono.payment_method?.toLowerCase()) {
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
          break;
      }
    });
    abonos.transactions = uniqueSaleIds.size;

    // PROCESAR PAGOS DE MEMBRESÍAS
    const memberships = {
      efectivo: 0,
      transferencia: 0,
      debito: 0,
      credito: 0,
      total: 0,
      transactions: 0,
      commissions: 0
    };

    // Contar membresías únicas (por membership_id)
    const uniqueMembershipIds = new Set();
    
    membershipsData?.forEach(payment => {
      // Contar membresías únicas
      uniqueMembershipIds.add(payment.membership_id);
      
      // IMPORTANTE: El 'amount' ya incluye la comisión
      // commission_amount es solo informativo para saber cuánto fue de comisión
      const amount = parseFloat(payment.amount || '0');
      const commission = parseFloat(payment.commission_amount || '0');
      
      memberships.total += amount; // NO sumar comisión, ya está incluida
      memberships.commissions += commission; // Solo para información
      
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
          break;
      }
    });
    
    memberships.transactions = uniqueMembershipIds.size;

    // CONSULTAR EGRESOS
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('expense_date', date)
      .eq('status', 'active');

    if (expensesError) {
      throw new Error(`Error consultando egresos: ${expensesError.message}`);
    }

    const expenses_amount = expensesData?.reduce((sum, expense) => sum + parseFloat(expense.amount.toString()), 0) || 0;
    const expenses_count = expensesData?.length || 0;

    // CALCULAR TOTALES
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
    console.error('[API /cuts/daily-data] Error:', error.message);
    
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
