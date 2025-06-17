import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// ✅ LÓGICA DE dateHelpers APLICADA DIRECTAMENTE (SIN IMPORTAR)
function getMexicoDateRangeLocal(dateString: string) {
  console.log('📅 Calculando rango para fecha México:', dateString);
  
  // Crear fecha base en México
  const mexicoDate = new Date(dateString + 'T00:00:00.000-06:00'); // UTC-6 México
  
  // Inicio del día en México (00:00:00)
  const startOfDayMexico = new Date(mexicoDate);
  startOfDayMexico.setHours(0, 0, 0, 0);
  
  // Final del día en México (23:59:59.999)
  const endOfDayMexico = new Date(mexicoDate);
  endOfDayMexico.setHours(23, 59, 59, 999);
  
  // Convertir a UTC para las consultas
  const startISO = startOfDayMexico.toISOString();
  const endISO = endOfDayMexico.toISOString();
  
  console.log('⏰ Rango calculado directamente:', {
    fecha_input: dateString,
    inicio_mexico: startOfDayMexico.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }),
    fin_mexico: endOfDayMexico.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }),
    inicio_utc: startISO,
    fin_utc: endISO
  });
  
  return { startISO, endISO };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    console.log('🚀 API daily-data iniciada');
    console.log('📅 Fecha recibida:', date);

    if (!date) {
      return NextResponse.json(
        { error: 'Fecha requerida', success: false },
        { status: 400 }
      );
    }

    // ✅ VALIDAR FORMATO DE FECHA
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      console.error('❌ Error: Formato de fecha inválido:', date);
      return NextResponse.json(
        { error: 'Formato de fecha inválido. Use YYYY-MM-DD', success: false },
        { status: 400 }
      );
    }

    console.log('🔍 Consultando datos para fecha México:', date);

    const supabase = createServerSupabaseClient();

    // ✅ USAR FUNCIÓN LOCAL (SIN IMPORTAR)
    const { startISO, endISO } = getMexicoDateRangeLocal(date);

    console.log('⏰ Rango México calculado (función local):', {
      fecha_mexico: date,
      inicio_utc: startISO,
      fin_utc: endISO,
      note: 'Calculado directamente sin importaciones'
    });

    // 🏪 1. VENTAS POS
    console.log('🛒 Consultando ventas POS...');
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
      console.error('❌ Error consultando ventas:', salesError);
      throw new Error(`Error consultando ventas: ${salesError.message}`);
    }

    console.log('✅ Ventas consultadas:', salesData?.length || 0);

    // 💰 2. ABONOS
    console.log('💰 Consultando abonos...');
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
      console.error('❌ Error consultando abonos:', abonosError);
      throw new Error(`Error consultando abonos: ${abonosError.message}`);
    }

    console.log('✅ Abonos consultados:', abonosData?.length || 0);

    // 🎫 3. MEMBRESÍAS
    console.log('🎫 Consultando membresías...');
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
      console.error('❌ Error consultando membresías:', membershipsError);
      throw new Error(`Error consultando membresías: ${membershipsError.message}`);
    }

    console.log('✅ Membresías consultadas:', membershipsData?.length || 0);

    console.log('📊 Datos obtenidos:', {
      ventas: salesData?.length || 0,
      abonos: abonosData?.length || 0,
      membresias: membershipsData?.length || 0
    });

    // 🧮 PROCESAR VENTAS POS
    console.log('🧮 Procesando ventas POS...');
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
              console.warn(`🔴 Método de pago desconocido en POS: ${payment.payment_method}`);
              pos.efectivo += totalWithCommission;
              break;
          }
        }
      });
    });

    console.log('✅ Ventas POS procesadas:', pos);

    // 🧮 PROCESAR ABONOS
    console.log('🧮 Procesando abonos...');
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
          console.warn(`🔴 Método de pago desconocido en abonos: ${abono.payment_method}`);
          abonos.efectivo += totalWithCommission;
          break;
      }
    });
    abonos.transactions = uniqueSaleIds.size;

    console.log('✅ Abonos procesados:', abonos);

    // 🧮 PROCESAR MEMBRESÍAS
    console.log('🧮 Procesando membresías...');
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
        console.log('✅ Usando detalles de pago para membresía');
        
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
              console.warn(`🔴 Método de pago desconocido en detalles membresía: ${payment.payment_method}`);
              memberships.efectivo += totalWithCommission;
              break;
          }
        });
      } else {
        console.log('⚠️ Usando payment_method directo para membresía');
        
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
            console.warn(`🔴 Método de pago no especificado en membresía, asumiendo efectivo: ${membership.payment_method}`);
            memberships.efectivo += totalMembership;
            break;
        }
      }
    });

    console.log('✅ Membresías procesadas:', memberships);

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

    console.log('✅ Totales calculados:', totals);

    // ✅ RESPUESTA FINAL
    const response = {
      success: true,
      date,
      timezone_info: {
        mexico_date: date,
        mexico_range: {
          start: startISO,
          end: endISO
        },
        timezone: 'America/Mexico_City (UTC-6)',
        note: "✅ Datos filtrados directamente para fecha México (sin importaciones)"
      },
      pos,
      abonos,
      memberships,
      totals
    };

    console.log('🎉 API completada exitosamente sin importaciones');
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('💥 Error crítico en daily-data API:', {
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
