import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// ✅ LÓGICA DE dateHelpers APLICADA DIRECTAMENTE (IGUAL QUE DAILY-DATA)
function getMexicoMonthRangeLocal(monthString: string) {
  console.log('📅 Calculando rango mensual para México:', monthString);
  
  const [year, monthNum] = monthString.split('-').map(Number);
  
  // Primer día del mes en México (00:00:00)
  const startOfMonthMexico = new Date(year, monthNum - 1, 1, 0, 0, 0, 0);
  
  // Último día del mes en México (23:59:59.999)
  const endOfMonthMexico = new Date(year, monthNum, 0, 23, 59, 59, 999);
  
  // Ajustar para zona horaria México (UTC-6)
  const startISO = new Date(startOfMonthMexico.getTime() + (6 * 60 * 60 * 1000)).toISOString();
  const endISO = new Date(endOfMonthMexico.getTime() + (6 * 60 * 60 * 1000)).toISOString();
  
  console.log('⏰ Rango mensual calculado directamente:', {
    mes_input: monthString,
    inicio_mexico: startOfMonthMexico.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }),
    fin_mexico: endOfMonthMexico.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }),
    inicio_utc: startISO,
    fin_utc: endISO
  });
  
  return { startISO, endISO };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // formato: YYYY-MM

    console.log('🚀 API monthly-data iniciada (FORMATO CONSISTENTE)');
    console.log('📅 Mes recibido:', month);

    if (!month) {
      return NextResponse.json(
        { error: 'Mes requerido', success: false },
        { status: 400 }
      );
    }

    // ✅ VALIDAR FORMATO DE MES
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      console.error('❌ Error: Formato de mes inválido:', month);
      return NextResponse.json(
        { error: 'Formato de mes inválido. Use YYYY-MM', success: false },
        { status: 400 }
      );
    }

    console.log('🔍 Consultando datos mensuales para México:', month);

    const supabase = createServerSupabaseClient();

    // ✅ USAR FUNCIÓN LOCAL PARA RANGO MENSUAL (IGUAL QUE DAILY-DATA)
    const { startISO, endISO } = getMexicoMonthRangeLocal(month);

    console.log('⏰ Rango mensual México calculado (función local):', {
      mes_mexico: month,
      inicio_utc: startISO,
      fin_utc: endISO,
      note: 'Calculado directamente sin importaciones - CONSISTENTE con daily-data'
    });

    // 🏪 1. VENTAS POS DEL MES (IGUAL ESTRUCTURA QUE DAILY-DATA)
    console.log('🛒 Consultando ventas POS del mes...');
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
      .gte('created_at', startISO)
      .lte('created_at', endISO);

    if (salesError) {
      console.error('❌ Error consultando ventas mensuales:', salesError);
      throw new Error(`Error consultando ventas: ${salesError.message}`);
    }

    console.log('✅ Ventas mensuales consultadas:', salesData?.length || 0);

    // 💰 2. ABONOS DEL MES (IGUAL ESTRUCTURA QUE DAILY-DATA)
    console.log('💰 Consultando abonos del mes...');
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
      .gte('payment_date', startISO)
      .lte('payment_date', endISO);

    if (abonosError) {
      console.error('❌ Error consultando abonos mensuales:', abonosError);
      throw new Error(`Error consultando abonos: ${abonosError.message}`);
    }

    console.log('✅ Abonos mensuales consultados:', abonosData?.length || 0);

    // 🎫 3. MEMBRESÍAS DEL MES (IGUAL ESTRUCTURA QUE DAILY-DATA)
    console.log('🎫 Consultando membresías del mes...');
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
      .gte('created_at', startISO)
      .lte('created_at', endISO);

    if (membershipsError) {
      console.error('❌ Error consultando membresías mensuales:', membershipsError);
      throw new Error(`Error consultando membresías: ${membershipsError.message}`);
    }

    console.log('✅ Membresías mensuales consultadas:', membershipsData?.length || 0);

    console.log('📊 Datos mensuales obtenidos:', {
      ventas: salesData?.length || 0,
      abonos: abonosData?.length || 0,
      membresias: membershipsData?.length || 0
    });

    // 🧮 PROCESAR VENTAS POS (EXACTAMENTE IGUAL QUE DAILY-DATA)
    console.log('🧮 Procesando ventas POS mensuales...');
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
          const amount = parseFloat(payment.amount || '0');
          const commission = parseFloat(payment.commission_amount || '0');
          
          const totalWithCommission = amount + commission;
          
          pos.total += totalWithCommission;
          pos.commissions += commission;
          
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
            default:
              console.warn(`🔴 Método de pago desconocido en POS mensual: ${payment.payment_method}`);
              pos.efectivo += totalWithCommission;
              break;
          }
        }
      });
    });

    console.log('✅ Ventas POS mensuales procesadas:', pos);

    // 🧮 PROCESAR ABONOS (EXACTAMENTE IGUAL QUE DAILY-DATA)
    console.log('🧮 Procesando abonos mensuales...');
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
      
      const totalWithCommission = amount + commission;
      
      abonos.total += totalWithCommission;
      abonos.commissions += commission;
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
        default:
          console.warn(`🔴 Método de pago desconocido en abonos mensuales: ${abono.payment_method}`);
          abonos.efectivo += totalWithCommission;
          break;
      }
    });
    abonos.transactions = uniqueSaleIds.size;

    console.log('✅ Abonos mensuales procesados:', abonos);

    // 🧮 PROCESAR MEMBRESÍAS (EXACTAMENTE IGUAL QUE DAILY-DATA)
    console.log('🧮 Procesando membresías mensuales...');
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
      
      const totalMembership = parseFloat(membership.amount_paid || '0');
      const membershipCommission = parseFloat(membership.commission_amount || '0');
      
      memberships.total += totalMembership;
      memberships.commissions += membershipCommission;
      
      if (membership.membership_payment_details && membership.membership_payment_details.length > 0) {
        console.log('✅ Usando detalles de pago para membresía mensual');
        
        membership.membership_payment_details.forEach(payment => {
          const amount = parseFloat(payment.amount || '0');
          const commission = parseFloat(payment.commission_amount || '0');
          
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
            default:
              console.warn(`🔴 Método de pago desconocido en detalles membresía mensual: ${payment.payment_method}`);
              memberships.efectivo += totalWithCommission;
              break;
          }
        });
      } else {
        console.log('⚠️ Usando payment_method directo para membresía mensual');
        
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
            console.warn(`🔴 Método de pago no especificado en membresía mensual, asumiendo efectivo: ${membership.payment_method}`);
            memberships.efectivo += totalMembership;
            break;
        }
      }
    });

    console.log('✅ Membresías mensuales procesadas:', memberships);

    // 🧮 CALCULAR TOTALES (EXACTAMENTE IGUAL QUE DAILY-DATA)
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

    console.log('✅ Totales mensuales calculados:', totals);

    // ✅ RESPUESTA FINAL (EXACTAMENTE IGUAL QUE DAILY-DATA)
    const response = {
      success: true,
      month, // ✅ CAMBIADO: month en lugar de date
      timezone_info: {
        mexico_month: month,
        mexico_range: {
          start: startISO,
          end: endISO
        },
        timezone: 'America/Mexico_City (UTC-6)',
        note: "✅ Datos mensuales filtrados directamente para México (CONSISTENTE con daily-data)"
      },
      pos,
      abonos,
      memberships,
      totals
    };

    console.log('🎉 API monthly-data completada exitosamente - FORMATO CONSISTENTE');
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('💥 Error crítico en monthly-data API:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString()
    });
    
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
