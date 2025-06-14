import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    console.log('🚀 API daily-data iniciada');
    console.log('📅 Fecha recibida:', date);
    console.log('🔗 URL completa:', request.url);

    if (!date) {
      console.error('❌ Error: Fecha no proporcionada');
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

    // ✅ CREAR CLIENTE SUPABASE CON MANEJO DE ERRORES
    let supabase;
    try {
      supabase = createServerSupabaseClient();
      console.log('✅ Cliente Supabase creado exitosamente');
    } catch (supabaseError: any) {
      console.error('💥 Error creando cliente Supabase:', supabaseError);
      return NextResponse.json(
        { error: 'Error de conexión a la base de datos', success: false },
        { status: 500 }
      );
    }

    // ✅ CALCULAR RANGO DE FECHAS PARA MÉXICO (UTC-6)
    // México está en UTC-6, así que necesitamos ajustar
    const inputDate = new Date(date + 'T00:00:00.000Z');
    
    // Para México, agregamos 6 horas al UTC para obtener el rango correcto
    const mexicoStartUTC = new Date(inputDate.getTime() + (6 * 60 * 60 * 1000)); // +6 horas
    const mexicoEndUTC = new Date(inputDate.getTime() + (6 * 60 * 60 * 1000) + (23 * 60 * 60 * 1000) + (59 * 60 * 1000) + (59 * 1000)); // +23:59:59

    console.log('⏰ Rango UTC calculado para México:', {
      fecha_mexico: date,
      fecha_input: inputDate.toISOString(),
      inicio_utc: mexicoStartUTC.toISOString(),
      fin_utc: mexicoEndUTC.toISOString(),
      note: 'Ajustado para zona horaria México (UTC-6)'
    });

    // ✅ VARIABLES PARA ALMACENAR DATOS
    let salesData = null;
    let abonosData = null; 
    let membershipsData = null;

    // 🏪 1. VENTAS POS (sales con sale_type = 'sale')
    try {
      console.log('🛒 Consultando ventas POS...');
      const salesResult = await supabase
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

      if (salesResult.error) {
        console.error('❌ Error en consulta de ventas:', salesResult.error);
        throw new Error(`Error consultando ventas: ${salesResult.error.message}`);
      }

      salesData = salesResult.data;
      console.log('✅ Ventas consultadas:', salesData?.length || 0);
    } catch (salesError: any) {
      console.error('💥 Error crítico en ventas:', salesError);
      return NextResponse.json(
        { error: `Error consultando ventas: ${salesError.message}`, success: false },
        { status: 500 }
      );
    }

    // 💰 2. ABONOS (sale_payment_details con is_partial_payment = true)
    try {
      console.log('💰 Consultando abonos...');
      const abonosResult = await supabase
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

      if (abonosResult.error) {
        console.error('❌ Error en consulta de abonos:', abonosResult.error);
        throw new Error(`Error consultando abonos: ${abonosResult.error.message}`);
      }

      abonosData = abonosResult.data;
      console.log('✅ Abonos consultados:', abonosData?.length || 0);
    } catch (abonosError: any) {
      console.error('💥 Error crítico en abonos:', abonosError);
      return NextResponse.json(
        { error: `Error consultando abonos: ${abonosError.message}`, success: false },
        { status: 500 }
      );
    }

    // 🎫 3. MEMBRESÍAS
    try {
      console.log('🎫 Consultando membresías...');
      const membershipsResult = await supabase
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

      if (membershipsResult.error) {
        console.error('❌ Error en consulta de membresías:', membershipsResult.error);
        throw new Error(`Error consultando membresías: ${membershipsResult.error.message}`);
      }

      membershipsData = membershipsResult.data;
      console.log('✅ Membresías consultadas:', membershipsData?.length || 0);
    } catch (membershipsError: any) {
      console.error('💥 Error crítico en membresías:', membershipsError);
      return NextResponse.json(
        { error: `Error consultando membresías: ${membershipsError.message}`, success: false },
        { status: 500 }
      );
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

    try {
      console.log('🧮 Procesando ventas POS...');
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
                pos.efectivo += totalWithCommission; // Default a efectivo
                break;
            }
          }
        });
      });
      console.log('✅ Ventas POS procesadas:', pos);
    } catch (posError: any) {
      console.error('💥 Error procesando ventas POS:', posError);
      return NextResponse.json(
        { error: `Error procesando ventas POS: ${posError.message}`, success: false },
        { status: 500 }
      );
    }

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

    try {
      console.log('🧮 Procesando abonos...');
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
    } catch (abonosProcessError: any) {
      console.error('💥 Error procesando abonos:', abonosProcessError);
      return NextResponse.json(
        { error: `Error procesando abonos: ${abonosProcessError.message}`, success: false },
        { status: 500 }
      );
    }

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

    try {
      console.log('🧮 Procesando membresías...');
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
    } catch (membershipsProcessError: any) {
      console.error('💥 Error procesando membresías:', membershipsProcessError);
      return NextResponse.json(
        { error: `Error procesando membresías: ${membershipsProcessError.message}`, success: false },
        { status: 500 }
      );
    }

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

    console.log('🎉 API completada exitosamente');
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
