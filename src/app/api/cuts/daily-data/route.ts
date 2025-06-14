import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
// ✅ IMPORTAR HELPERS DE FECHA MÉXICO CORREGIDOS
import { toMexicoTimestamp, getMexicoDateRange, formatMexicoDateTime } from '@/utils/dateHelpers';

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

    // ✅ CALCULAR RANGO PARA FECHA MÉXICO CORREGIDO
    const { startISO, endISO } = getMexicoDateRange(date);
    
    console.log('⏰ Rango México calculado:', {
      fecha_mexico: date,
      inicio_utc: startISO,
      fin_utc: endISO,
      note: 'Convertido correctamente a zona horaria México'
    });

    // 🏪 1. VENTAS POS (sales con sale_type = 'sale')
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
          is_partial_payment,
          payment_date
        )
      `)
      .eq('sale_type', 'sale')
      .eq('status', 'completed')
      .gte('created_at', startISO)
      .lte('created_at', endISO);

    if (salesError) {
      console.error('❌ Error consultando ventas POS:', salesError);
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
        payment_date,
        sales!inner (
          sale_type,
          status
        )
      `)
      .eq('is_partial_payment', true)
      .gte('payment_date', startISO)
      .lte('payment_date', endISO);

    if (abonosError) {
      console.error('❌ Error consultando abonos:', abonosError);
      throw abonosError;
    }

    // 🎫 3. MEMBRESÍAS VENDIDAS EN EL DÍA
    const { data: membershipsData, error: membershipsError } = await supabase
      .from('user_memberships')
      .select(`
        id,
        amount_paid,
        inscription_amount,
        payment_method,
        commission_amount,
        created_at,
        membership_payment_details (
          payment_method,
          amount,
          commission_amount
        )
      `)
      .gte('created_at', startISO)
      .lte('created_at', endISO);

    if (membershipsError) {
      console.error('❌ Error consultando membresías:', membershipsError);
      throw membershipsError;
    }

    console.log('📊 Datos crudos obtenidos (fecha México):', {
      ventas_pos: salesData?.length || 0,
      abonos: abonosData?.length || 0,
      membresias: membershipsData?.length || 0,
      rango_consultado: `${startISO} → ${endISO}`
    });

    // 🧮 PROCESAR VENTAS POS
    const pos = {
      efectivo: 0,
      transferencia: 0,
      debito: 0,
      credito: 0,
      mixto: 0, // ✅ Agregar pago mixto
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
          
          // ✅ EL TOTAL ES EL MONTO SIN COMISIÓN (LO QUE REALMENTE ENTRA)
          pos.total += amount;
          pos.commissions += commission;
          
          const method = payment.payment_method?.toLowerCase() || 'efectivo';
          switch (method) {
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
            case 'mixto':
              pos.mixto += amount;
              break;
            default:
              console.warn(`🔴 Método de pago desconocido en POS: ${method}, asignando a efectivo`);
              pos.efectivo += amount;
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
      mixto: 0,
      total: 0,
      transactions: 0,
      commissions: 0
    };

    const uniqueSaleIds = new Set();
    abonosData?.forEach(abono => {
      const amount = parseFloat(abono.amount || '0');
      const commission = parseFloat(abono.commission_amount || '0');
      
      // ✅ EL TOTAL ES EL MONTO SIN COMISIÓN
      abonos.total += amount;
      abonos.commissions += commission;
      uniqueSaleIds.add(abono.sale_id);
      
      const method = abono.payment_method?.toLowerCase() || 'efectivo';
      switch (method) {
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
        case 'mixto':
          abonos.mixto += amount;
          break;
        default:
          console.warn(`🔴 Método de pago desconocido en abonos: ${method}, asignando a efectivo`);
          abonos.efectivo += amount;
          break;
      }
    });
    abonos.transactions = uniqueSaleIds.size;

    // 🧮 PROCESAR MEMBRESÍAS - CORREGIDO Y SIMPLIFICADO
    const memberships = {
      efectivo: 0,
      transferencia: 0,
      debito: 0,
      credito: 0,
      mixto: 0,
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
      
      // 🔍 PRIORIZAR DETALLES DE PAGO, FALLBACK A payment_method DIRECTO
      if (membership.membership_payment_details && membership.membership_payment_details.length > 0) {
        // ✅ HAY DETALLES DE PAGO - USAR LOS MÉTODOS ESPECÍFICOS
        console.log(`✅ Usando detalles de pago para membresía ${membership.id}`);
        
        membership.membership_payment_details.forEach(payment => {
          const amount = parseFloat(payment.amount || '0');
          
          const method = payment.payment_method?.toLowerCase() || 'efectivo';
          switch (method) {
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
            case 'mixto':
              memberships.mixto += amount;
              break;
            default:
              console.warn(`🔴 Método desconocido en membresía: ${method}, asignando a efectivo`);
              memberships.efectivo += amount;
              break;
          }
        });
      } else {
        // ❌ NO HAY DETALLES - USAR PAYMENT_METHOD DIRECTO
        console.log(`⚠️ Usando payment_method directo para membresía ${membership.id}: ${membership.payment_method}`);
        
        const method = membership.payment_method?.toLowerCase() || 'efectivo';
        switch (method) {
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
          case 'mixto':
            memberships.mixto += totalMembership;
            break;
          default:
            console.warn(`🔴 Método desconocido en membresía: ${method}, asignando a efectivo`);
            memberships.efectivo += totalMembership;
            break;
        }
      }
    });

    // 🧮 CALCULAR TOTALES GENERALES
    const totals = {
      efectivo: pos.efectivo + abonos.efectivo + memberships.efectivo,
      transferencia: pos.transferencia + abonos.transferencia + memberships.transferencia,
      debito: pos.debito + abonos.debito + memberships.debito,
      credito: pos.credito + abonos.credito + memberships.credito,
      mixto: pos.mixto + abonos.mixto + memberships.mixto,
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
        mexico_range: {
          start: startISO,
          end: endISO
        },
        timezone: 'America/Mexico_City',
        note: "✅ Datos filtrados correctamente por fecha México (UTC-6/-5)"
      },
      pos,
      abonos,
      memberships,
      totals,
      summary: {
        total_ingresos: totals.total,
        total_comisiones: totals.commissions,
        ingreso_neto: totals.net_amount,
        total_transacciones: totals.transactions,
        metodos_pago: {
          efectivo: `${((totals.efectivo / totals.total) * 100).toFixed(1)}%`,
          transferencia: `${((totals.transferencia / totals.total) * 100).toFixed(1)}%`,
          tarjetas: `${(((totals.debito + totals.credito) / totals.total) * 100).toFixed(1)}%`,
          mixto: `${((totals.mixto / totals.total) * 100).toFixed(1)}%`
        }
      }
    };

    console.log('✅ Corte diario procesado exitosamente:', {
      fecha: date,
      total_ingresos: totals.total,
      transacciones: totals.transactions,
      comisiones: totals.commissions
    });

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('💥 Error en daily-data API:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor', 
        success: false,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
