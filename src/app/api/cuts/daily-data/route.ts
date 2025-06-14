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

    console.log('🔍 Consultando datos para fecha:', date);

    const supabase = createServerSupabaseClient();

    // ✅ ÚNICA CORRECCIÓN: CALCULAR RANGO PARA ZONA HORARIA MÉXICO
    // México está en UTC-6 (invierno) o UTC-5 (verano)
    const mexicoDate = new Date(date + 'T00:00:00');
    
    // Convertir el inicio del día en México a UTC
    const mexicoStartUTC = new Date(mexicoDate.getTime() + (6 * 60 * 60 * 1000)); // +6 horas para UTC
    const mexicoEndUTC = new Date(mexicoDate.getTime() + (6 * 60 * 60 * 1000) + (23 * 60 * 60 * 1000) + (59 * 60 * 1000) + (59 * 1000)); // +23:59:59

    console.log('⏰ Rango UTC calculado para México:', {
      fecha_mexico: date,
      inicio_utc: mexicoStartUTC.toISOString(),
      fin_utc: mexicoEndUTC.toISOString(),
      note: 'Ajustado para zona horaria México (UTC-6)'
    });

    // 🏪 1. VENTAS POS (sales con sale_type = 'sale') - SIN CAMBIOS
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
      .gte('created_at', mexicoStartUTC.toISOString())
      .lte('created_at', mexicoEndUTC.toISOString());

    if (salesError) {
      console.error('❌ Error consultando ventas:', salesError);
      throw salesError;
    }

    // 💰 2. ABONOS (sale_payment_details con is_partial_payment = true) - SIN CAMBIOS
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
      .gte('payment_date', mexicoStartUTC.toISOString())
      .lte('payment_date', mexicoEndUTC.toISOString());

    if (abonosError) {
      console.error('❌ Error consultando abonos:', abonosError);
      throw abonosError;
    }

    // 🎫 3. MEMBRESÍAS - SIN CAMBIOS EN LA LÓGICA
    const { data: membershipsData, error: membershipsError } = await supabase
      .from('user_memberships')
      .select(`
        amount_paid,
        inscription_amount,
        payment_method,
        commission_amount,
        membership_payment_details (
          payment_method,
          amount,
          commission_amount
        )
      `)
      .gte('created_at', mexicoStartUTC.toISOString())
      .lte('created_at', mexicoEndUTC.toISOString());

    if (membershipsError) {
      console.error('❌ Error consultando membresías:', membershipsError);
      throw membershipsError;
    }

    console.log('📊 Datos crudos obtenidos:', {
      ventas: salesData?.length || 0,
      abonos: abonosData?.length || 0,
      membresias: membershipsData?.length || 0
    });

    // 🧮 PROCESAR VENTAS POS - LÓGICA ORIGINAL MANTENIDA
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

    // 🧮 PROCESAR ABONOS - LÓGICA ORIGINAL MANTENIDA
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

    // 🧮 PROCESAR MEMBRESÍAS - LÓGICA ORIGINAL MANTENIDA
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
      const membershipCommission = parseFloat(membership.commission_amount || '0');
      
      memberships.total += totalMembership;
      memberships.commissions += membershipCommission;
      
      // 🔍 VERIFICAR SI HAY DETALLES DE PAGO
      if (membership.membership_payment_details && membership.membership_payment_details.length > 0) {
        // ✅ HAY DETALLES - USAR LOS MÉTODOS DE PAGO ESPECÍFICOS
        console.log('✅ Usando detalles de pago para membresía:', membership.id);
        
        membership.membership_payment_details.forEach(payment => {
          const amount = parseFloat(payment.amount || '0');
          const commission = parseFloat(payment.commission_amount || '0');
          
          // ✅ INCLUIR COMISIÓN EN EL MÉTODO DE PAGO
          const totalWithCommission = amount + commission;
          
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
      } else {
        // ❌ NO HAY DETALLES DE PAGO - USAR EL PAYMENT_METHOD DIRECTO
        console.log('⚠️ Usando payment_method directo para membresía:', membership.id, 'método:', membership.payment_method);
        
        // 🎯 USAR EL CAMPO payment_method DIRECTO DE LA TABLA user_memberships
        switch (membership.payment_method?.toLowerCase()) {
          case 'efectivo':
            memberships.efectivo += totalMembership;
            break;
          case 'transferencia':
            memberships.transferencia += totalMembership;
            break;
          case 'debito':
            memberships.debito += totalMembership;
            break;
          case 'credito':
            memberships.credito += totalMembership;
            break;
          default:
            // Si no hay método especificado, asumir efectivo
            console.warn('🔴 Método de pago no especificado, asumiendo efectivo');
            memberships.efectivo += totalMembership;
            break;
        }
      }
    });

    // 🧮 CALCULAR TOTALES - LÓGICA ORIGINAL MANTENIDA
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

    // ✅ RESPUESTA FINAL CON INFORMACIÓN DE ZONA HORARIA CORREGIDA
    const response = {
      success: true,
      date,
      timezone_info: {
        mexico_date: date,
        utc_range: {
          start: mexicoStartUTC.toISOString(),
          end: mexicoEndUTC.toISOString()
        },
        timezone: 'America/Mexico_City (UTC-6)',
        note: "✅ Datos filtrados correctamente para fecha México"
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
