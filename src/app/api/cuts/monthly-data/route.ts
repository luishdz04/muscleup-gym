import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// ✅ FUNCIÓN PARA TIMESTAMP MÉXICO
function toMexicoTimestamp(date: Date): string {
  const mexicoTime = new Date(date.toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
  const year = mexicoTime.getFullYear();
  const month = String(mexicoTime.getMonth() + 1).padStart(2, '0');
  const day = String(mexicoTime.getDate()).padStart(2, '0');
  const hours = String(mexicoTime.getHours()).padStart(2, '0');
  const minutes = String(mexicoTime.getMinutes()).padStart(2, '0');
  const seconds = String(mexicoTime.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}-06:00`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // formato: YYYY-MM

    console.log('🚀 API monthly-data iniciada (LEYENDO DE CASH_CUTS)');
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

    const supabase = createServerSupabaseClient();

    // ✅ ESTRATEGIA CORREGIDA: LEER DIRECTAMENTE DE CASH_CUTS
    console.log('🔍 Buscando cortes existentes en cash_cuts para el mes:', month);

    // Calcular primer y último día del mes para el filtro
    const [year, monthNum] = month.split('-').map(Number);
    const firstDay = `${year}-${monthNum.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, monthNum, 0).getDate();
    const lastDayString = `${year}-${monthNum.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

    console.log('📅 Rango de fechas para el mes:', {
      mes: month,
      primer_dia: firstDay,
      ultimo_dia: lastDayString
    });

    // 🏆 CONSULTAR CORTES EXISTENTES DEL MES
    const { data: monthCuts, error: cutsError } = await supabase
      .from('cash_cuts')
      .select(`
        id,
        cut_number,
        cut_date,
        is_manual,
        pos_total,
        membership_total,
        abonos_total,
        pos_efectivo,
        pos_transferencia,
        pos_debito,
        pos_credito,
        membership_efectivo,
        membership_transferencia,
        membership_debito,
        membership_credito,
        abonos_efectivo,
        abonos_transferencia,
        abonos_debito,
        abonos_credito,
        total_efectivo,
        total_transferencia,
        total_debito,
        total_credito,
        grand_total,
        total_transactions,
        total_commissions
      `)
      .gte('cut_date', firstDay)
      .lte('cut_date', lastDayString)
      .order('cut_date', { ascending: true });

    if (cutsError) {
      console.error('❌ Error consultando cortes del mes:', cutsError);
      throw cutsError;
    }

    console.log('📊 Cortes encontrados para el mes:', monthCuts?.length || 0);

    if (monthCuts && monthCuts.length > 0) {
      // ✅ HAY CORTES - CONSOLIDAR DATOS DIRECTAMENTE DE CASH_CUTS
      console.log('✅ Consolidando datos de', monthCuts.length, 'cortes existentes');

      const consolidatedData = monthCuts.reduce((acc, cut) => {
        // Sumar totales por categoría
        acc.pos_total += parseFloat(cut.pos_total || '0');
        acc.membership_total += parseFloat(cut.membership_total || '0');
        acc.abonos_total += parseFloat(cut.abonos_total || '0');
        acc.grand_total += parseFloat(cut.grand_total || '0');
        acc.total_transactions += parseInt(cut.total_transactions || '0');
        acc.total_commissions += parseFloat(cut.total_commissions || '0');

        // Sumar por método de pago
        acc.total_efectivo += parseFloat(cut.total_efectivo || '0');
        acc.total_transferencia += parseFloat(cut.total_transferencia || '0');
        acc.total_debito += parseFloat(cut.total_debito || '0');
        acc.total_credito += parseFloat(cut.total_credito || '0');

        return acc;
      }, {
        pos_total: 0,
        membership_total: 0,
        abonos_total: 0,
        grand_total: 0,
        total_transactions: 0,
        total_commissions: 0,
        total_efectivo: 0,
        total_transferencia: 0,
        total_debito: 0,
        total_credito: 0
      });

      // ✅ CONSTRUIR RESPUESTA EN FORMATO CONSISTENTE CON DAILY-DATA
      const response = {
        success: true,
        month,
        timezone_info: {
          mexico_month: month,
          mexico_range: {
            start: `${firstDay}T00:00:00-06:00`,
            end: `${lastDayString}T23:59:59-06:00`
          },
          timezone: 'America/Mexico_City (UTC-6)',
          note: `✅ Datos consolidados de ${monthCuts.length} cortes existentes en cash_cuts`
        },
        pos: {
          efectivo: parseFloat((consolidatedData.total_efectivo * (consolidatedData.pos_total / consolidatedData.grand_total || 0)).toFixed(2)),
          transferencia: parseFloat((consolidatedData.total_transferencia * (consolidatedData.pos_total / consolidatedData.grand_total || 0)).toFixed(2)),
          debito: parseFloat((consolidatedData.total_debito * (consolidatedData.pos_total / consolidatedData.grand_total || 0)).toFixed(2)),
          credito: parseFloat((consolidatedData.total_credito * (consolidatedData.pos_total / consolidatedData.grand_total || 0)).toFixed(2)),
          total: consolidatedData.pos_total,
          transactions: Math.round(consolidatedData.total_transactions * (consolidatedData.pos_total / consolidatedData.grand_total || 0)),
          commissions: parseFloat((consolidatedData.total_commissions * (consolidatedData.pos_total / consolidatedData.grand_total || 0)).toFixed(2))
        },
        abonos: {
          efectivo: parseFloat((consolidatedData.total_efectivo * (consolidatedData.abonos_total / consolidatedData.grand_total || 0)).toFixed(2)),
          transferencia: parseFloat((consolidatedData.total_transferencia * (consolidatedData.abonos_total / consolidatedData.grand_total || 0)).toFixed(2)),
          debito: parseFloat((consolidatedData.total_debito * (consolidatedData.abonos_total / consolidatedData.grand_total || 0)).toFixed(2)),
          credito: parseFloat((consolidatedData.total_credito * (consolidatedData.abonos_total / consolidatedData.grand_total || 0)).toFixed(2)),
          total: consolidatedData.abonos_total,
          transactions: Math.round(consolidatedData.total_transactions * (consolidatedData.abonos_total / consolidatedData.grand_total || 0)),
          commissions: parseFloat((consolidatedData.total_commissions * (consolidatedData.abonos_total / consolidatedData.grand_total || 0)).toFixed(2))
        },
        memberships: {
          efectivo: parseFloat((consolidatedData.total_efectivo * (consolidatedData.membership_total / consolidatedData.grand_total || 0)).toFixed(2)),
          transferencia: parseFloat((consolidatedData.total_transferencia * (consolidatedData.membership_total / consolidatedData.grand_total || 0)).toFixed(2)),
          debito: parseFloat((consolidatedData.total_debito * (consolidatedData.membership_total / consolidatedData.grand_total || 0)).toFixed(2)),
          credito: parseFloat((consolidatedData.total_credito * (consolidatedData.membership_total / consolidatedData.grand_total || 0)).toFixed(2)),
          total: consolidatedData.membership_total,
          transactions: Math.round(consolidatedData.total_transactions * (consolidatedData.membership_total / consolidatedData.grand_total || 0)),
          commissions: parseFloat((consolidatedData.total_commissions * (consolidatedData.membership_total / consolidatedData.grand_total || 0)).toFixed(2))
        },
        totals: {
          efectivo: consolidatedData.total_efectivo,
          transferencia: consolidatedData.total_transferencia,
          debito: consolidatedData.total_debito,
          credito: consolidatedData.total_credito,
          total: consolidatedData.grand_total,
          transactions: consolidatedData.total_transactions,
          commissions: consolidatedData.total_commissions,
          net_amount: consolidatedData.grand_total - consolidatedData.total_commissions
        },
        cuts_info: {
          total_cuts: monthCuts.length,
          manual_cuts: monthCuts.filter(c => c.is_manual).length,
          automatic_cuts: monthCuts.filter(c => !c.is_manual).length,
          date_range: {
            first_cut: monthCuts[0]?.cut_date,
            last_cut: monthCuts[monthCuts.length - 1]?.cut_date
          }
        }
      };

      console.log('✅ Datos mensuales consolidados exitosamente:', {
        total_cuts: monthCuts.length,
        grand_total: consolidatedData.grand_total,
        pos_total: consolidatedData.pos_total,
        membership_total: consolidatedData.membership_total,
        abonos_total: consolidatedData.abonos_total
      });

      return NextResponse.json(response);

    } else {
      // ❌ NO HAY CORTES - DEVOLVER DATOS VACÍOS
      console.log('ℹ️ No se encontraron cortes para el mes:', month);

      const emptyResponse = {
        success: true,
        month,
        timezone_info: {
          mexico_month: month,
          mexico_range: {
            start: `${firstDay}T00:00:00-06:00`,
            end: `${lastDayString}T23:59:59-06:00`
          },
          timezone: 'America/Mexico_City (UTC-6)',
          note: `ℹ️ No hay cortes registrados para este mes`
        },
        pos: {
          efectivo: 0,
          transferencia: 0,
          debito: 0,
          credito: 0,
          total: 0,
          transactions: 0,
          commissions: 0
        },
        abonos: {
          efectivo: 0,
          transferencia: 0,
          debito: 0,
          credito: 0,
          total: 0,
          transactions: 0,
          commissions: 0
        },
        memberships: {
          efectivo: 0,
          transferencia: 0,
          debito: 0,
          credito: 0,
          total: 0,
          transactions: 0,
          commissions: 0
        },
        totals: {
          efectivo: 0,
          transferencia: 0,
          debito: 0,
          credito: 0,
          total: 0,
          transactions: 0,
          commissions: 0,
          net_amount: 0
        },
        cuts_info: {
          total_cuts: 0,
          manual_cuts: 0,
          automatic_cuts: 0,
          date_range: {
            first_cut: null,
            last_cut: null
          }
        }
      };

      return NextResponse.json(emptyResponse);
    }

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
