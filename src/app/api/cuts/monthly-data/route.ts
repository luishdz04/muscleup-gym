import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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

  // Calcular primer y último día del mes en horario CDMX
  const [year, monthNum] = month.split('-').map(Number);
  const monthKey = `${year}-${monthNum.toString().padStart(2, '0')}`;
  const firstDay = `${monthKey}-01`;
  const lastDayDate = new Date(Date.UTC(year, monthNum, 0));
  const lastDay = lastDayDate.getUTCDate();
  const lastDayString = `${monthKey}-${lastDay.toString().padStart(2, '0')}`;

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
        expenses_amount,
        final_balance,
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
        const toNumber = (value: unknown) => {
          if (value === null || value === undefined) return 0;
          const num = typeof value === 'number' ? value : parseFloat(value as string);
          return Number.isFinite(num) ? num : 0;
        };

        acc.pos_total += toNumber(cut.pos_total);
        acc.membership_total += toNumber(cut.membership_total);
        acc.abonos_total += toNumber(cut.abonos_total);
        acc.grand_total += toNumber(cut.grand_total);
        acc.total_transactions += toNumber(cut.total_transactions);
        acc.total_commissions += toNumber(cut.total_commissions);
        acc.expenses_amount += toNumber(cut.expenses_amount);
        acc.final_balance += toNumber(cut.final_balance);

        acc.pos_efectivo += toNumber(cut.pos_efectivo);
        acc.pos_transferencia += toNumber(cut.pos_transferencia);
        acc.pos_debito += toNumber(cut.pos_debito);
        acc.pos_credito += toNumber(cut.pos_credito);

        acc.membership_efectivo += toNumber(cut.membership_efectivo);
        acc.membership_transferencia += toNumber(cut.membership_transferencia);
        acc.membership_debito += toNumber(cut.membership_debito);
        acc.membership_credito += toNumber(cut.membership_credito);

        acc.abonos_efectivo += toNumber(cut.abonos_efectivo);
        acc.abonos_transferencia += toNumber(cut.abonos_transferencia);
        acc.abonos_debito += toNumber(cut.abonos_debito);
        acc.abonos_credito += toNumber(cut.abonos_credito);

        acc.total_efectivo += toNumber(cut.total_efectivo);
        acc.total_transferencia += toNumber(cut.total_transferencia);
        acc.total_debito += toNumber(cut.total_debito);
        acc.total_credito += toNumber(cut.total_credito);

        return acc;
      }, {
        pos_total: 0,
        membership_total: 0,
        abonos_total: 0,
        grand_total: 0,
        total_transactions: 0,
        total_commissions: 0,
        expenses_amount: 0,
        final_balance: 0,
        pos_efectivo: 0,
        pos_transferencia: 0,
        pos_debito: 0,
        pos_credito: 0,
        membership_efectivo: 0,
        membership_transferencia: 0,
        membership_debito: 0,
        membership_credito: 0,
        abonos_efectivo: 0,
        abonos_transferencia: 0,
        abonos_debito: 0,
        abonos_credito: 0,
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
          efectivo: consolidatedData.pos_efectivo,
          transferencia: consolidatedData.pos_transferencia,
          debito: consolidatedData.pos_debito,
          credito: consolidatedData.pos_credito,
          total: consolidatedData.pos_total,
          transactions: consolidatedData.total_transactions,
          commissions: consolidatedData.total_commissions
        },
        abonos: {
          efectivo: consolidatedData.abonos_efectivo,
          transferencia: consolidatedData.abonos_transferencia,
          debito: consolidatedData.abonos_debito,
          credito: consolidatedData.abonos_credito,
          total: consolidatedData.abonos_total,
          transactions: consolidatedData.total_transactions,
          commissions: consolidatedData.total_commissions
        },
        memberships: {
          efectivo: consolidatedData.membership_efectivo,
          transferencia: consolidatedData.membership_transferencia,
          debito: consolidatedData.membership_debito,
          credito: consolidatedData.membership_credito,
          total: consolidatedData.membership_total,
          transactions: consolidatedData.total_transactions,
          commissions: consolidatedData.total_commissions
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
        expenses: {
          amount: consolidatedData.expenses_amount,
          average: monthCuts.length > 0 ? consolidatedData.expenses_amount / monthCuts.length : 0
        },
        final_balance: consolidatedData.final_balance,
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
        expenses: {
          amount: 0,
          average: 0
        },
        final_balance: 0,
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
