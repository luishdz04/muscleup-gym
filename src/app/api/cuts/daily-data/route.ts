import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// 🔧 FUNCIÓN HELPER PARA ZONA HORARIA MÉXICO
function getMexicoDateRangeUTC(mexicoDateString: string) {
  // Fecha México 00:00:00 (CST/CDT = UTC-6)
  const startOfDayMexico = new Date(`${mexicoDateString}T00:00:00-06:00`);
  // Fecha México 23:59:59.999
  const endOfDayMexico = new Date(`${mexicoDateString}T23:59:59.999-06:00`);
  
  console.log(`🇲🇽 Fecha solicitada México: ${mexicoDateString}`);
  console.log(`🌍 Rango UTC equivalente: ${startOfDayMexico.toISOString()} → ${endOfDayMexico.toISOString()}`);
  
  return {
    start: startOfDayMexico.toISOString(),
    end: endOfDayMexico.toISOString()
  };
}

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

    console.log('🔍 Obteniendo datos para fecha México:', date);

    const supabase = createServerSupabaseClient();
    
    // 🔧 CALCULAR RANGO UTC PARA FECHA MÉXICO
    const dateRange = getMexicoDateRangeUTC(date);

    // 🏪 VENTAS POS COMPLETAS DEL DÍA (CON ZONA HORARIA CORREGIDA)
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select(`
        id,
        sale_number,
        total_amount,
        is_mixed_payment,
        status,
        created_at,
        sale_payment_details (
          payment_method,
          amount,
          commission_rate,
          commission_amount,
          sequence_order
        )
      `)
      .eq('sale_type', 'sale')
      .eq('status', 'completed')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end)
      .order('created_at', { ascending: false });

    if (salesError) {
      console.error('💥 Error obteniendo ventas:', salesError);
      throw salesError;
    }

    // 💰 PROCESAR VENTAS POS
    const posData = {
      efectivo: 0,
      transferencia: 0,
      debito: 0,
      credito: 0,
      total: 0,
      transactions: 0,
      commissions: 0
    };

    console.log('🏪 Procesando', salesData?.length || 0, 'ventas POS...');

    salesData?.forEach((sale: any) => {
      posData.transactions += 1;
      posData.total += Number(sale.total_amount);

      if (sale.sale_payment_details && sale.sale_payment_details.length > 0) {
        sale.sale_payment_details.forEach((payment: any) => {
          const amount = Number(payment.amount);
          const commission = Number(payment.commission_amount || 0);

          posData.commissions += commission;
          const totalAmountWithCommission = amount + commission;

          switch (payment.payment_method.toLowerCase()) {
            case 'efectivo':
              posData.efectivo += totalAmountWithCommission;
              break;
            case 'transferencia':
              posData.transferencia += totalAmountWithCommission;
              break;
            case 'debito':
              posData.debito += totalAmountWithCommission;
              break;
            case 'credito':
              posData.credito += totalAmountWithCommission;
              break;
            default:
              console.warn('⚠️ Método de pago no reconocido:', payment.payment_method);
              posData.efectivo += totalAmountWithCommission;
          }
        });
      }

      console.log('🏪 Venta POS procesada:', {
        numero: sale.sale_number,
        total: sale.total_amount,
        mixto: sale.is_mixed_payment
      });
    });

    // 🔥 AGREGAR COMISIONES AL TOTAL DE POS
    posData.total += posData.commissions;

    console.log('✅ POS FINAL:', {
      total_con_comisiones: posData.total,
      efectivo: posData.efectivo,
      debito: posData.debito,
      comisiones: posData.commissions
    });

    // 📋 ABONOS DEL DÍA (CON ZONA HORARIA CORREGIDA)
    const { data: abonosData, error: abonosError } = await supabase
      .from('sale_payment_details')
      .select(`
        id,
        payment_method,
        amount,
        commission_rate,
        commission_amount,
        is_partial_payment,
        payment_date,
        sale_id,
        sales (
          sale_number,
          sale_type,
          total_amount,
          status
        )
      `)
      .gte('payment_date', dateRange.start)
      .lte('payment_date', dateRange.end)
      .eq('is_partial_payment', true)
      .order('payment_date', { ascending: false });

    if (abonosError) {
      console.error('💥 Error obteniendo abonos:', abonosError);
      throw abonosError;
    }

    // 💰 PROCESAR ABONOS
    const abonosProcessed = {
      efectivo: 0,
      transferencia: 0,
      debito: 0,
      credito: 0,
      total: 0,
      transactions: 0,
      commissions: 0
    };

    const uniqueAbonos = new Set();
    let totalAbonosBase = 0;

    console.log('📋 Procesando', abonosData?.length || 0, 'abonos...');

    abonosData?.forEach((abono: any) => {
      const amount = Number(abono.amount);
      const commission = Number(abono.commission_amount || 0);
      
      const totalAmountWithCommission = amount + commission;

      totalAbonosBase += amount;
      abonosProcessed.commissions += commission;
      uniqueAbonos.add(abono.sale_id);

      switch (abono.payment_method.toLowerCase()) {
        case 'efectivo':
          abonosProcessed.efectivo += totalAmountWithCommission;
          break;
        case 'transferencia':
          abonosProcessed.transferencia += totalAmountWithCommission;
          break;
        case 'debito':
          abonosProcessed.debito += totalAmountWithCommission;
          break;
        case 'credito':
          abonosProcessed.credito += totalAmountWithCommission;
          break;
        default:
          console.warn('⚠️ Método de pago no reconocido en abono:', abono.payment_method);
          abonosProcessed.efectivo += totalAmountWithCommission;
      }

      console.log('💰 Abono procesado:', {
        sale_number: abono.sales?.sale_number,
        method: abono.payment_method,
        amount: amount
      });
    });

    abonosProcessed.total = totalAbonosBase + abonosProcessed.commissions;
    abonosProcessed.transactions = uniqueAbonos.size;

    console.log('✅ ABONOS FINAL:', {
      total_con_comisiones: abonosProcessed.total,
      efectivo: abonosProcessed.efectivo,
      transferencia: abonosProcessed.transferencia,
      comisiones: abonosProcessed.commissions
    });

    // 🎫 MEMBRESÍAS DEL DÍA (CON ZONA HORARIA CORREGIDA)
    const { data: membershipsData, error: membershipsError } = await supabase
      .from('user_memberships')
      .select(`
        id,
        payment_type,
        amount_paid,
        inscription_amount,
        is_mixed_payment,
        created_at,
        membership_payment_details (
          payment_method,
          amount,
          commission_rate,
          commission_amount,
          sequence_order
        )
      `)
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end)
      .order('created_at', { ascending: false });

    if (membershipsError) {
      console.error('💥 Error obteniendo membresías:', membershipsError);
      throw membershipsError;
    }

    // 💰 PROCESAR MEMBRESÍAS
    const membershipsProcessed = {
      efectivo: 0,
      transferencia: 0,
      debito: 0,
      credito: 0,
      total: 0,
      transactions: 0,
      commissions: 0
    };

    let totalMembershipsBase = 0;

    console.log('🎫 Procesando', membershipsData?.length || 0, 'membresías...');

    membershipsData?.forEach((membership: any) => {
      membershipsProcessed.transactions += 1;
      const totalAmount = Number(membership.amount_paid) + Number(membership.inscription_amount || 0);
      totalMembershipsBase += totalAmount;

      console.log('🎫 Membresía encontrada:', {
        id: membership.id,
        amount_paid: membership.amount_paid,
        inscription_amount: membership.inscription_amount,
        total: totalAmount,
        is_mixed: membership.is_mixed_payment,
        created_at: membership.created_at
      });

      if (membership.membership_payment_details && membership.membership_payment_details.length > 0) {
        membership.membership_payment_details.forEach((payment: any) => {
          const amount = Number(payment.amount);
          const commission = Number(payment.commission_amount || 0);
          
          const totalAmountWithCommission = amount + commission;
          membershipsProcessed.commissions += commission;

          console.log('💳 Detalle de pago membresía:', {
            method: payment.payment_method,
            amount: amount,
            commission: commission,
            total_with_commission: totalAmountWithCommission
          });

          switch (payment.payment_method.toLowerCase()) {
            case 'efectivo':
              membershipsProcessed.efectivo += totalAmountWithCommission;
              break;
            case 'transferencia':
              membershipsProcessed.transferencia += totalAmountWithCommission;
              break;
            case 'debito':
              membershipsProcessed.debito += totalAmountWithCommission;
              break;
            case 'credito':
              membershipsProcessed.credito += totalAmountWithCommission;
              break;
            default:
              console.warn('⚠️ Método de pago no reconocido en membresía:', payment.payment_method);
              membershipsProcessed.efectivo += totalAmountWithCommission;
          }
        });
      } else {
        console.warn('⚠️ Membresía sin detalles de pago:', membership.id);
        // Si no hay detalles de pago, asumimos efectivo
        membershipsProcessed.efectivo += totalAmount;
      }
    });

    membershipsProcessed.total = totalMembershipsBase + membershipsProcessed.commissions;

    console.log('✅ MEMBRESÍAS FINAL:', {
      total_con_comisiones: membershipsProcessed.total,
      total_base: totalMembershipsBase,
      efectivo: membershipsProcessed.efectivo,
      transferencia: membershipsProcessed.transferencia,
      debito: membershipsProcessed.debito,
      credito: membershipsProcessed.credito,
      comisiones: membershipsProcessed.commissions,
      transacciones: membershipsProcessed.transactions
    });

    // 🧮 CALCULAR TOTALES CONSOLIDADOS FINALES
    const totals = {
      efectivo: posData.efectivo + membershipsProcessed.efectivo + abonosProcessed.efectivo,
      transferencia: posData.transferencia + membershipsProcessed.transferencia + abonosProcessed.transferencia,
      debito: posData.debito + membershipsProcessed.debito + abonosProcessed.debito,
      credito: posData.credito + membershipsProcessed.credito + abonosProcessed.credito,
      total: posData.total + membershipsProcessed.total + abonosProcessed.total,
      transactions: posData.transactions + membershipsProcessed.transactions + abonosProcessed.transactions,
      commissions: posData.commissions + membershipsProcessed.commissions + abonosProcessed.commissions,
      net_amount: (posData.total + membershipsProcessed.total + abonosProcessed.total) - (posData.commissions + membershipsProcessed.commissions + abonosProcessed.commissions)
    };

    console.log('🎯 TOTALES CONSOLIDADOS CON ZONA HORARIA CORREGIDA:', {
      fecha_mexico: date,
      rango_utc: `${dateRange.start} → ${dateRange.end}`,
      pos_encontradas: posData.transactions,
      abonos_encontrados: abonosProcessed.transactions,
      membresias_encontradas: membershipsProcessed.transactions,
      ingresos_totales: totals.total,
      comisiones_totales: totals.commissions,
      monto_neto: totals.net_amount
    });

    return NextResponse.json({
      success: true,
      date,
      timezone_info: {
        mexico_date: date,
        utc_range: dateRange,
        note: 'Fechas convertidas correctamente a zona horaria México (UTC-6)'
      },
      pos: posData,
      memberships: membershipsProcessed,
      abonos: abonosProcessed,
      totals
    });

  } catch (error) {
    console.error('💥 Error en API daily-data:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos del día', success: false },
      { status: 500 }
    );
  }
}
