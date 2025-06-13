import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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

    console.log('🔍 Consultando datos para fecha México:', date);

    const supabase = createServerSupabaseClient();

    // 📅 RANGO SIMPLE - TODO EL DÍA UTC (CORREGIDO)
    const startOfDayUTC = new Date(`${date}T00:00:00.000Z`);
    const endOfDayUTC = new Date(`${date}T23:59:59.999Z`);

    console.log('⏰ Rango UTC corregido:', {
      inicio: startOfDayUTC.toISOString(),
      fin: endOfDayUTC.toISOString()
    });

    // 🏪 1. VENTAS POS (sales con sale_type = 'sale')
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select(`
        id,
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
      .gte('created_at', startOfDayUTC.toISOString())
      .lte('created_at', endOfDayUTC.toISOString());

    if (salesError) {
      console.error('❌ Error consultando ventas:', salesError);
      throw salesError;
    }

    // 💰 2. ABONOS (sale_payment_details con is_partial_payment = true)
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
      .gte('payment_date', startOfDayUTC.toISOString())
      .lte('payment_date', endOfDayUTC.toISOString());

    if (abonosError) {
      console.error('❌ Error consultando abonos:', abonosError);
      throw abonosError;
    }

    // 🎫 3. MEMBRESÍAS
    const { data: membershipsData, error: membershipsError } = await supabase
      .from('user_memberships')
      .select(`
        amount_paid,
        inscription_amount,
        membership_payment_details (
          payment_method,
          amount,
          commission_amount
        )
      `)
      .gte('created_at', startOfDayUTC.toISOString())
      .lte('created_at', endOfDayUTC.toISOString());

    if (membershipsError) {
      console.error('❌ Error consultando membresías:', membershipsError);
      throw membershipsError;
    }

    console.log('📊 Datos crudos obtenidos:', {
      ventas: salesData?.length || 0,
      abonos: abonosData?.length || 0,
      membresias: membershipsData?.length || 0
    });

    // 🧮 PROCESAR VENTAS POS
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
        if (!payment.is_partial_payment) { // Solo pagos completos de ventas
          const amount = parseFloat(payment.amount || '0');
          const commission = parseFloat(payment.commission_amount || '0');
          
          // ✅ INCLUIR COMISIÓN EN EL MÉTODO DE PAGO
          const totalWithCommission = amount + commission;
          
          pos.total += totalWithCommission;
          pos.commissions += commission; // Solo información
          
          switch (payment.payment_method?.toLowerCase()) {
            case 'efectivo':
              pos.efectivo += totalWithCommission;
              break;
            case 'transferencia':
              pos.transferencia += totalWithCommission;
              break;
            case 'debito':
              pos.debito += totalWithCommission;
              break;
            case 'credito':
              pos.credito += totalWithCommission;
              break;
          }
        }
      });
    });

    // 🧮 PROCESAR ABONOS
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
      const amount = parseFloat(abono.amount || '0');
      const commission = parseFloat(abono.commission_amount || '0');
      
      // ✅ INCLUIR COMISIÓN EN EL MÉTODO DE PAGO
      const totalWithCommission = amount + commission;
      
      abonos.total += totalWithCommission;
      abonos.commissions += commission; // Solo información
      uniqueSaleIds.add(abono.sale_id);
      
      switch (abono.payment_method?.toLowerCase()) {
        case 'efectivo':
          abonos.efectivo += totalWithCommission;
          break;
        case 'transferencia':
          abonos.transferencia += totalWithCommission;
          break;
        case 'debito':
          abonos.debito += totalWithCommission;
          break;
        case 'credito':
          abonos.credito += totalWithCommission;
          break;
      }
    });
    abonos.transactions = uniqueSaleIds.size;

    // 🧮 PROCESAR MEMBRESÍAS
    const memberships = {
      efectivo: 0,
      transferencia: 0,
      debito: 0,
      credito: 0,
      total: 0,
      transactions: 0,
      commissions: 0
    };

    membershipsData?.forEach(membership => {
      memberships.transactions++;
      
      // ✅ USAR amount_paid DIRECTAMENTE (YA INCLUYE TODO)
      const totalMembership = parseFloat(membership.amount_paid || '0');
      memberships.total += totalMembership;
      
      membership.membership_payment_details?.forEach(payment => {
        const amount = parseFloat(payment.amount || '0');
        const commission = parseFloat(payment.commission_amount || '0');
        
        // ✅ INCLUIR COMISIÓN EN EL MÉTODO DE PAGO
        const totalWithCommission = amount + commission;
        
        memberships.commissions += commission; // Solo información
        
        switch (payment.payment_method?.toLowerCase()) {
          case 'efectivo':
            memberships.efectivo += totalWithCommission;
            break;
          case 'transferencia':
            memberships.transferencia += totalWithCommission;
            break;
          case 'debito':
            memberships.debito += totalWithCommission;
            break;
          case 'credito':
            memberships.credito += totalWithCommission;
            break;
        }
      });
    });

    // 🧮 CALCULAR TOTALES
    const totals = {
      efectivo: pos.efectivo + abonos.efectivo + memberships.efectivo,
      transferencia: pos.transferencia + abonos.transferencia + memberships.transferencia,
      debito: pos.debito + abonos.debito + memberships.debito,
      credito: pos.credito + abonos.credito + memberships.credito,
      total: pos.total + abonos.total + memberships.total,
      transactions: pos.transactions + abonos.transactions + memberships.transactions,
      commissions: pos.commissions + abonos.commissions + memberships.commissions,
      net_amount: pos.total + abonos.total + memberships.total - (pos.commissions + abonos.commissions + memberships.commissions)
    };

    const response = {
      success: true,
      date,
      timezone_info: {
        mexico_date: date,
        utc_range: {
          start: startOfDayUTC.toISOString(),
          end: endOfDayUTC.toISOString()
        },
        note: "Datos filtrados por fecha UTC completa"
      },
      pos,
      abonos,
      memberships,
      totals
    };

    console.log('✅ Respuesta final:', response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('💥 Error en daily-data API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', success: false },
      { status: 500 }
    );
  }
}
