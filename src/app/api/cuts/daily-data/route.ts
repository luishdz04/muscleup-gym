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

    // 💰 INICIALIZAR DATOS DE POS
    const posData = {
      efectivo: 0,
      transferencia: 0,
      debito: 0,
      credito: 0,
      total: 0,          // 🎯 ESTE ES EL QUE CORREGIREMOS
      transactions: 0,
      commissions: 0
    };

    console.log('🏪 Procesando', salesData?.length || 0, 'ventas POS...');

    // 📝 PASO 1: PROCESAR CADA VENTA POS
    salesData?.forEach((sale: any) => {
      posData.transactions += 1;
      
      // ✅ LÍNEA 1: Sumar el monto base de la venta al total
      posData.total += Number(sale.total_amount);

      // ✅ LÍNEA 2: Procesar cada detalle de pago de la venta
      if (sale.sale_payment_details && sale.sale_payment_details.length > 0) {
        sale.sale_payment_details.forEach((payment: any) => {
          const amount = Number(payment.amount);
          const commission = Number(payment.commission_amount || 0);

          // ✅ LÍNEA 3: Acumular comisiones del POS
          posData.commissions += commission;

          // ✅ LÍNEA 4: Calcular monto + comisión para cada método
          const totalAmountWithCommission = amount + commission;

          // ✅ LÍNEA 5: Asignar a cada método de pago (CON comisión incluida)
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

    // 🔥 PASO 2: AGREGAR COMISIONES AL TOTAL DE POS (CLAVE!)
    posData.total += posData.commissions;

    console.log('✅ POS FINAL:', {
      total_con_comisiones: posData.total,     // Debería ser $1,610
      total_sin_comisiones: posData.total - posData.commissions, // $1,600
      efectivo: posData.efectivo,              // $1,200
      debito: posData.debito,                  // $410
      comisiones: posData.commissions          // $10
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

    // 💰 INICIALIZAR DATOS DE ABONOS
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

    // 📝 PASO 3: PROCESAR CADA ABONO
    abonosData?.forEach((abono: any) => {
      const amount = Number(abono.amount);
      const commission = Number(abono.commission_amount || 0);

      // ✅ LÍNEA 6: Sumar monto base al total de abonos
      abonosProcessed.total += amount;
      
      // ✅ LÍNEA 7: Acumular comisiones de abonos
      abonosProcessed.commissions += commission;

      uniqueAbonos.add(abono.sale_id);

      // ✅ LÍNEA 8: Calcular monto + comisión para cada método
      const totalAmountWithCommission = amount + commission;

      // ✅ LÍNEA 9: Asignar a cada método de pago (CON comisión incluida)
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

    // 🔥 PASO 4: AGREGAR COMISIONES AL TOTAL DE ABONOS
    abonosProcessed.total += abonosProcessed.commissions;

    console.log('✅ ABONOS FINAL:', {
      total_con_comisiones: abonosProcessed.total, // Debería ser $600
      efectivo: abonosProcessed.efectivo,          // $400
      transferencia: abonosProcessed.transferencia, // $200
      comisiones: abonosProcessed.commissions      // $0 (no hay comisiones en abonos)
    });

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

    // 💰 INICIALIZAR DATOS DE MEMBRESÍAS
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

    // 📝 PASO 5: PROCESAR CADA MEMBRESÍA
    membershipsData?.forEach((membership: any) => {
      membershipsProcessed.transactions += 1;
      const totalAmount = Number(membership.amount_paid) + Number(membership.inscription_amount || 0);
      
      // ✅ LÍNEA 10: Sumar monto base al total de membresías
      membershipsProcessed.total += totalAmount;

      if (membership.membership_payment_details && membership.membership_payment_details.length > 0) {
        membership.membership_payment_details.forEach((payment: any) => {
          const amount = Number(payment.amount);
          const commission = Number(payment.commission_amount || 0);

          // ✅ LÍNEA 11: Acumular comisiones de membresías
          membershipsProcessed.commissions += commission;

          // ✅ LÍNEA 12: Calcular monto + comisión para cada método
          const totalAmountWithCommission = amount + commission;

          // ✅ LÍNEA 13: Asignar a cada método de pago (CON comisión incluida)
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

    // 🔥 PASO 6: AGREGAR COMISIONES AL TOTAL DE MEMBRESÍAS
    membershipsProcessed.total += membershipsProcessed.commissions;

    console.log('✅ MEMBRESÍAS FINAL:', {
      total_con_comisiones: membershipsProcessed.total, // Debería ser $0
      comisiones: membershipsProcessed.commissions      // $0
    });

    // 🧮 PASO 7: CALCULAR TOTALES CONSOLIDADOS FINALES
    const totals = {
      efectivo: posData.efectivo + membershipsProcessed.efectivo + abonosProcessed.efectivo,
      transferencia: posData.transferencia + membershipsProcessed.transferencia + abonosProcessed.transferencia,
      debito: posData.debito + membershipsProcessed.debito + abonosProcessed.debito,
      credito: posData.credito + membershipsProcessed.credito + abonosProcessed.credito,
      total: posData.total + membershipsProcessed.total + abonosProcessed.total, // 🔥 YA INCLUYE COMISIONES
      transactions: posData.transactions + membershipsProcessed.transactions + abonosProcessed.transactions,
      commissions: posData.commissions + membershipsProcessed.commissions + abonosProcessed.commissions,
      net_amount: (posData.total + membershipsProcessed.total + abonosProcessed.total) - (posData.commissions + membershipsProcessed.commissions + abonosProcessed.commissions)
    };

    console.log('🎯 TOTALES CONSOLIDADOS FINALES:', {
      fecha: date,
      ingresos_totales: totals.total,           // Debería ser $2,210
      efectivo_total: totals.efectivo,          // Debería ser $1,600
      transferencia_total: totals.transferencia, // Debería ser $200
      debito_total: totals.debito,              // Debería ser $410
      comisiones_totales: totals.commissions,   // Debería ser $10
      monto_neto: totals.net_amount,            // Debería ser $2,200
      transacciones_totales: totals.transactions // Debería ser 3
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
