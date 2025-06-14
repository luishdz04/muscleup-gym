import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
// ✅ USAR LOS MISMOS dateHelpers QUE FUNCIONAN EN OTROS LUGARES
import { getMexicoDateRange } from '@/utils/dateHelpers';

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

    console.log('🔍 Consultando datos para fecha México:', date);

    const supabase = createServerSupabaseClient();

    // ✅ USAR EL MISMO HELPER QUE FUNCIONA EN OTROS ARCHIVOS
    const { startISO, endISO } = getMexicoDateRange(date);
    
    console.log('⏰ Rango México calculado con dateHelpers:', {
      fecha_mexico: date,
      inicio_utc: startISO,
      fin_utc: endISO,
      note: 'Usando getMexicoDateRange helper'
    });

    // 🏪 1. VENTAS POS
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
      throw salesError;
    }

    // 💰 2. ABONOS
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
      throw abonosError;
    }

    // 🎫 3. MEMBRESÍAS
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
      throw membershipsError;
    }

    console.log('📊 Datos obtenidos:', {
      ventas: salesData?.length || 0,
      abonos: abonosData?.length || 0,
      membresias: membershipsData?.length || 0
    });

    // 🧮 PROCESAR DATOS (mismo código que ya funciona)
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
              pos.efectivo += totalWithCommission;
              break;
          }
        }
      });
    });

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
          abonos.efectivo += totalWithCommission;
          break;
      }
    });
    abonos.transactions = uniqueSaleIds.size;

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
              memberships.efectivo += totalWithCommission;
              break;
          }
        });
      } else {
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
            memberships.efectivo += totalMembership;
            break;
        }
      }
    });

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

    // ✅ RESPUESTA CON INFORMACIÓN CORRECTA DE TIMEZONE
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
        note: "✅ Datos filtrados con dateHelpers para fecha México"
      },
      pos,
      abonos,
      memberships,
      totals
    };

    console.log('✅ API completada exitosamente con dateHelpers');
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('💥 Error en daily-data API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', success: false },
      { status: 500 }
    );
  }
}
