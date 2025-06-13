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

    // 🏪 VENTAS POS - LÓGICA CORREGIDA PARA PAGOS MIXTOS
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
      .eq('status', 'completed')
      .gte('created_at', `${date}T00:00:00`)
      .lt('created_at', `${date}T23:59:59`)
      .order('created_at', { ascending: false });

    if (salesError) {
      console.error('💥 Error obteniendo ventas:', salesError);
      throw salesError;
    }

    // 💰 PROCESAR VENTAS CON LÓGICA CORRECTA DE PAGOS MIXTOS
    const posData = {
      efectivo: 0,
      transferencia: 0,
      debito: 0,
      credito: 0,
      mixto: 0, // Mantenemos en 0 siempre
      total: 0,
      transactions: 0,
      commissions: 0
    };

    console.log('📊 Procesando', salesData?.length || 0, 'ventas...');

    salesData?.forEach((sale: any) => {
      posData.transactions += 1;
      posData.total += Number(sale.total_amount);

      // 🎯 LÓGICA CORREGIDA: Procesar payment_details en lugar de is_mixed_payment
      if (sale.sale_payment_details && sale.sale_payment_details.length > 0) {
        sale.sale_payment_details.forEach((payment: any) => {
          const amount = Number(payment.amount);
          const commission = Number(payment.commission_amount || 0);

          // Sumar comisiones
          posData.commissions += commission;

          // 🔥 SUMAR A MÉTODO ESPECÍFICO (NO A MIXTO)
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
              posData.efectivo += amount; // Fallback a efectivo
          }
        });
      }
    });

    // 🎫 MEMBRESÍAS - LÓGICA SIMILAR
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
      .lt('created_at', `${date}T23:59:59`)
      .order('created_at', { ascending: false });

    if (membershipsError) {
      console.error('💥 Error obteniendo membresías:', membershipsError);
      throw membershipsError;
    }

    // 💰 PROCESAR MEMBRESÍAS
    const membershipsDataProcessed = {
      efectivo: 0,
      transferencia: 0,
      debito: 0,
      credito: 0,
      mixto: 0, // Mantenemos en 0 siempre
      total: 0,
      transactions: 0,
      commissions: 0
    };

    console.log('🎫 Procesando', membershipsData?.length || 0, 'membresías...');

    membershipsData?.forEach((membership: any) => {
      membershipsDataProcessed.transactions += 1;
      const totalAmount = Number(membership.amount_paid) + Number(membership.inscription_amount || 0);
      membershipsDataProcessed.total += totalAmount;

      // Procesar detalles de pago de membresías
      if (membership.membership_payment_details && membership.membership_payment_details.length > 0) {
        membership.membership_payment_details.forEach((payment: any) => {
          const amount = Number(payment.amount);
          const commission = Number(payment.commission_amount || 0);

          membershipsDataProcessed.commissions += commission;

          switch (payment.payment_method.toLowerCase()) {
            case 'efectivo':
              membershipsDataProcessed.efectivo += amount;
              break;
            case 'transferencia':
              membershipsDataProcessed.transferencia += amount;
              break;
            case 'debito':
              membershipsDataProcessed.debito += amount;
              break;
            case 'credito':
              membershipsDataProcessed.credito += amount;
              break;
            default:
              console.warn('⚠️ Método de pago no reconocido en membresía:', payment.payment_method);
              membershipsDataProcessed.efectivo += amount;
          }
        });
      }
    });

    // 📋 ABONOS (Apartados) - Misma lógica
    const { data: layawaysData, error: layawaysError } = await supabase
      .from('sales')
      .select(`
        id,
        sale_number,
        total_amount,
        paid_amount,
        is_mixed_payment,
        status,
        created_at,
        sale_payment_details (
          payment_method,
          amount,
          commission_rate,
          commission_amount,
          sequence_order,
          is_partial_payment
        )
      `)
      .eq('sale_type', 'layaway')
      .in('status', ['pending', 'completed'])
      .gte('created_at', `${date}T00:00:00`)
      .lt('created_at', `${date}T23:59:59`)
      .order('created_at', { ascending: false });

    if (layawaysError) {
      console.error('💥 Error obteniendo abonos:', layawaysError);
      throw layawaysError;
    }

    // 💰 PROCESAR ABONOS
    const abonosData = {
      efectivo: 0,
      transferencia: 0,
      debito: 0,
      credito: 0,
      mixto: 0, // Mantenemos en 0 siempre
      total: 0,
      transactions: 0,
      commissions: 0
    };

    console.log('📋 Procesando', layawaysData?.length || 0, 'abonos...');

    layawaysData?.forEach((layaway: any) => {
      abonosData.transactions += 1;
      abonosData.total += Number(layaway.paid_amount || 0);

      // Procesar solo los pagos del día actual
      if (layaway.sale_payment_details && layaway.sale_payment_details.length > 0) {
        layaway.sale_payment_details.forEach((payment: any) => {
          const amount = Number(payment.amount);
          const commission = Number(payment.commission_amount || 0);

          abonosData.commissions += commission;

          switch (payment.payment_method.toLowerCase()) {
            case 'efectivo':
              abonosData.efectivo += amount;
              break;
            case 'transferencia':
              abonosData.transferencia += amount;
              break;
            case 'debito':
              abonosData.debito += amount;
              break;
            case 'credito':
              abonosData.credito += amount;
              break;
            default:
              console.warn('⚠️ Método de pago no reconocido en abono:', payment.payment_method);
              abonosData.efectivo += amount;
          }
        });
      }
    });

    // 🧮 CALCULAR TOTALES CONSOLIDADOS
    const totals = {
      efectivo: posData.efectivo + membershipsDataProcessed.efectivo + abonosData.efectivo,
      transferencia: posData.transferencia + membershipsDataProcessed.transferencia + abonosData.transferencia,
      debito: posData.debito + membershipsDataProcessed.debito + abonosData.debito,
      credito: posData.credito + membershipsDataProcessed.credito + abonosData.credito,
      mixto: 0, // Siempre 0 porque descomponemos todo
      total: posData.total + membershipsDataProcessed.total + abonosData.total,
      transactions: posData.transactions + membershipsDataProcessed.transactions + abonosData.transactions,
      commissions: posData.commissions + membershipsDataProcessed.commissions + abonosData.commissions,
      net_amount: (posData.total + membershipsDataProcessed.total + abonosData.total) - (posData.commissions + membershipsDataProcessed.commissions + abonosData.commissions)
    };

    console.log('✅ Datos procesados correctamente:', {
      fecha: date,
      pos_total: posData.total,
      pos_efectivo: posData.efectivo,
      pos_debito: posData.debito,
      memberships_total: membershipsDataProcessed.total,
      abonos_total: abonosData.total,
      total_consolidado: totals.total,
      total_comisiones: totals.commissions
    });

    return NextResponse.json({
      success: true,
      date,
      pos: posData,
      memberships: membershipsDataProcessed,
      abonos: abonosData,
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
