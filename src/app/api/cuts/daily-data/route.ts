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

    console.log('🔍 Obteniendo datos para fecha:', date);

    const supabase = createServerSupabaseClient();

    // 🏪 VENTAS POS COMPLETAS DEL DÍA
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
      .gte('created_at', `${date}T00:00:00`)
      .lt('created_at', `${date}T23:59:59.999`)
      .order('created_at', { ascending: false });

    if (salesError) {
      console.error('💥 Error obteniendo ventas:', salesError);
      throw salesError;
    }

    // 💰 PROCESAR VENTAS POS - LÓGICA SIMPLE Y CORRECTA
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
      
      // ✅ SUMAR AL TOTAL EL MONTO DE LA VENTA
      posData.total += Number(sale.total_amount);

      // Procesar detalles de pago
      if (sale.sale_payment_details && sale.sale_payment_details.length > 0) {
        sale.sale_payment_details.forEach((payment: any) => {
          const amount = Number(payment.amount);
          const commission = Number(payment.commission_amount || 0);

          // ✅ SUMAR COMISIONES
          posData.commissions += commission;

          // ✅ SUMAR MONTO + COMISIÓN AL MÉTODO CORRESPONDIENTE
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

    // 📋 ABONOS DEL DÍA (SOLO PAGOS HECHOS HOY)
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
      .gte('payment_date', `${date}T00:00:00`)
      .lt('payment_date', `${date}T23:59:59.999`)
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

    console.log('📋 Procesando', abonosData?.length || 0, 'abonos...');

    abonosData?.forEach((abono: any) => {
      const amount = Number(abono.amount);
      const commission = Number(abono.commission_amount || 0);

      // ✅ SUMAR AL TOTAL EL MONTO DEL ABONO
      abonosProcessed.total += amount;
      abonosProcessed.commissions += commission;

      uniqueAbonos.add(abono.sale_id);

      // ✅ SUMAR MONTO + COMISIÓN AL MÉTODO CORRESPONDIENTE
      const totalAmountWithCommission = amount + commission;

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

    abonosProcessed.transactions = uniqueAbonos.size;

    // 🎫 MEMBRESÍAS DEL DÍA
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
      .gte('created_at', `${date}T00:00:00`)
      .lt('created_at', `${date}T23:59:59.999`)
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

    console.log('🎫 Procesando', membershipsData?.length || 0, 'membresías...');

    membershipsData?.forEach((membership: any) => {
      membershipsProcessed.transactions += 1;
      const totalAmount = Number(membership.amount_paid) + Number(membership.inscription_amount || 0);
      membershipsProcessed.total += totalAmount;

      if (membership.membership_payment_details && membership.membership_payment_details.length > 0) {
        membership.membership_payment_details.forEach((payment: any) => {
          const amount = Number(payment.amount);
          const commission = Number(payment.commission_amount || 0);

          membershipsProcessed.commissions += commission;

          const totalAmountWithCommission = amount + commission;

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
      }
    });

    // 🧮 CALCULAR TOTALES CONSOLIDADOS
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

    console.log('✅ Resumen CORREGIDO:', {
      fecha: date,
      pos: {
        total: posData.total, // Debería ser $1,600
        efectivo: posData.efectivo, // Debería ser $1,200 ($800 + $400)
        debito: posData.debito, // Debería ser $410 ($400 + $10 comisión)
        comisiones: posData.commissions, // Debería ser $10
        transacciones: posData.transactions // Debería ser 2
      },
      abonos: {
        total: abonosProcessed.total, // Debería ser $600
        efectivo: abonosProcessed.efectivo, // Debería ser $400
        transferencia: abonosProcessed.transferencia, // Debería ser $200
        transacciones: abonosProcessed.transactions // Debería ser 2
      },
      consolidado: {
        total_final: totals.total, // Debería ser $2,200
        efectivo_total: totals.efectivo, // Debería ser $1,600
        transferencia_total: totals.transferencia, // Debería ser $200
        debito_total: totals.debito, // Debería ser $410
        comisiones_totales: totals.commissions // Debería ser $10
      }
    });

    return NextResponse.json({
      success: true,
      date,
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
