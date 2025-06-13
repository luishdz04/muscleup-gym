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

    // 💰 PROCESAR VENTAS POS
    const posData = {
      efectivo: 0,
      transferencia: 0,
      debito: 0,
      credito: 0,
      mixto: 0, // Siempre 0
      total: 0,
      transactions: 0,
      commissions: 0
    };

    console.log('🏪 Procesando', salesData?.length || 0, 'ventas POS...');

    salesData?.forEach((sale: any) => {
      posData.transactions += 1;
      posData.total += Number(sale.total_amount);

      // Procesar detalles de pago
      if (sale.sale_payment_details && sale.sale_payment_details.length > 0) {
        sale.sale_payment_details.forEach((payment: any) => {
          const amount = Number(payment.amount);
          const commission = Number(payment.commission_amount || 0);

          posData.commissions += commission;

          switch (payment.payment_method.toLowerCase()) {
            case 'efectivo':
              posData.efectivo += amount;
              break;
            case 'transferencia':
              posData.transferencia += amount;
              break;
            case 'debito':
              posData.debito += amount;
              break;
            case 'credito':
              posData.credito += amount;
              break;
            default:
              console.warn('⚠️ Método de pago no reconocido:', payment.payment_method);
              posData.efectivo += amount;
          }
        });
      }

      console.log('📊 Venta procesada:', {
        numero: sale.sale_number,
        total: sale.total_amount,
        mixto: sale.is_mixed_payment
      });
    });

    // 📋 ABONOS DEL DÍA (SOLO PAGOS HECHOS HOY, NO APARTADOS CREADOS HOY)
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
      mixto: 0, // Siempre 0
      total: 0,
      transactions: 0,
      commissions: 0
    };

    // Agrupar abonos por sale_id para contar transacciones correctamente
    const uniqueAbonos = new Set();

    console.log('📋 Procesando', abonosData?.length || 0, 'abonos...');

    abonosData?.forEach((abono: any) => {
      const amount = Number(abono.amount);
      const commission = Number(abono.commission_amount || 0);

      abonosProcessed.total += amount;
      abonosProcessed.commissions += commission;

      // Contar transacciones únicas
      uniqueAbonos.add(abono.sale_id);

      switch (abono.payment_method.toLowerCase()) {
        case 'efectivo':
          abonosProcessed.efectivo += amount;
          break;
        case 'transferencia':
          abonosProcessed.transferencia += amount;
          break;
        case 'debito':
          abonosProcessed.debito += amount;
          break;
        case 'credito':
          abonosProcessed.credito += amount;
          break;
        default:
          console.warn('⚠️ Método de pago no reconocido en abono:', abono.payment_method);
          abonosProcessed.efectivo += amount;
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
      mixto: 0, // Siempre 0
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

          switch (payment.payment_method.toLowerCase()) {
            case 'efectivo':
              membershipsProcessed.efectivo += amount;
              break;
            case 'transferencia':
              membershipsProcessed.transferencia += amount;
              break;
            case 'debito':
              membershipsProcessed.debito += amount;
              break;
            case 'credito':
              membershipsProcessed.credito += amount;
              break;
            default:
              console.warn('⚠️ Método de pago no reconocido en membresía:', payment.payment_method);
              membershipsProcessed.efectivo += amount;
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
      mixto: 0, // Siempre 0
      total: posData.total + membershipsProcessed.total + abonosProcessed.total,
      transactions: posData.transactions + membershipsProcessed.transactions + abonosProcessed.transactions,
      commissions: posData.commissions + membershipsProcessed.commissions + abonosProcessed.commissions,
      net_amount: (posData.total + membershipsProcessed.total + abonosProcessed.total) - (posData.commissions + membershipsProcessed.commissions + abonosProcessed.commissions)
    };

    console.log('✅ Resumen final del día:', {
      fecha: date,
      pos: {
        efectivo: posData.efectivo,
        transferencia: posData.transferencia,
        total: posData.total,
        transacciones: posData.transactions
      },
      abonos: {
        efectivo: abonosProcessed.efectivo,
        transferencia: abonosProcessed.transferencia,
        total: abonosProcessed.total,
        transacciones: abonosProcessed.transactions
      },
      memberships: {
        total: membershipsProcessed.total,
        transacciones: membershipsProcessed.transactions
      },
      consolidado: {
        efectivo_total: totals.efectivo,
        transferencia_total: totals.transferencia,
        gran_total: totals.total,
        comisiones: totals.commissions
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
