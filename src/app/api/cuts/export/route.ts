import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const search = searchParams.get('search') || '';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const status = searchParams.get('status');
    const isManual = searchParams.get('isManual');

    console.log('📄 API: Exportando cortes', { search, dateFrom, dateTo, status, isManual });
    console.log('👤 Usuario: luishdz04');

    const supabase = createServerSupabaseClient();

    let query = supabase
      .from('cash_cuts')
      .select(`
        *,
        users!cash_cuts_created_by_fkey(id, first_name, last_name, username, name, email, firstName, lastName)
      `)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`cut_number.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    if (dateFrom) {
      query = query.gte('cut_date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('cut_date', dateTo);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (isManual && isManual !== 'all') {
      query = query.eq('is_manual', isManual === 'true');
    }

    const { data: cuts, error } = await query;

    if (error) {
      console.error('❌ Error exportando cortes:', error);
      return NextResponse.json({
        success: false,
        error: 'Error al exportar cortes'
      }, { status: 500 });
    }

    const exportData = (cuts || []).map(cut => {
      let creator_name = 'Usuario';
      if (cut.users) {
        if (cut.users.name) {
          creator_name = cut.users.name;
        } else if (cut.users.first_name || cut.users.last_name) {
          creator_name = `${cut.users.first_name || ''} ${cut.users.last_name || ''}`.trim();
        } else if (cut.users.firstName || cut.users.lastName) {
          creator_name = `${cut.users.firstName || ''} ${cut.users.lastName || ''}`.trim();
        } else if (cut.users.username) {
          creator_name = cut.users.username;
        } else if (cut.users.email) {
          creator_name = cut.users.email;
        }
      }

      return {
        'Número de Corte': cut.cut_number,
        'Fecha': cut.cut_date,
        'Tipo': cut.is_manual ? 'Manual' : 'Automático',
        'Estado': cut.status,
        'Responsable': creator_name,
        'POS Efectivo': parseFloat(cut.pos_efectivo || '0'),
        'POS Transferencia': parseFloat(cut.pos_transferencia || '0'),
        'POS Débito': parseFloat(cut.pos_debito || '0'),
        'POS Crédito': parseFloat(cut.pos_credito || '0'),
        'POS Mixto': parseFloat(cut.pos_mixto || '0'),
        'POS Total': parseFloat(cut.pos_total || '0'),
        'Abonos Efectivo': parseFloat(cut.abonos_efectivo || '0'),
        'Abonos Transferencia': parseFloat(cut.abonos_transferencia || '0'),
        'Abonos Débito': parseFloat(cut.abonos_debito || '0'),
        'Abonos Crédito': parseFloat(cut.abonos_credito || '0'),
        'Abonos Mixto': parseFloat(cut.abonos_mixto || '0'),
        'Abonos Total': parseFloat(cut.abonos_total || '0'),
        'Membresías Efectivo': parseFloat(cut.membership_efectivo || '0'),
        'Membresías Transferencia': parseFloat(cut.membership_transferencia || '0'),
        'Membresías Débito': parseFloat(cut.membership_debito || '0'),
        'Membresías Crédito': parseFloat(cut.membership_credito || '0'),
        'Membresías Mixto': parseFloat(cut.membership_mixto || '0'),
        'Membresías Total': parseFloat(cut.membership_total || '0'),
        'Total Efectivo': parseFloat(cut.total_efectivo || '0'),
        'Total Transferencia': parseFloat(cut.total_transferencia || '0'),
        'Total Débito': parseFloat(cut.total_debito || '0'),
        'Total Crédito': parseFloat(cut.total_credito || '0'),
        'Total Mixto': parseFloat(cut.total_mixto || '0'),
        'Total Bruto': parseFloat(cut.grand_total || '0'),
        'Gastos': parseFloat(cut.expenses_amount || '0'),
        'Balance Final': parseFloat(cut.final_balance || '0'),
        'Total Transacciones': parseInt(cut.total_transactions || '0'),
        'Comisiones': parseFloat(cut.total_commissions || '0'),
        'Notas': cut.notes || '',
        'Creado': new Date(cut.created_at).toLocaleString('es-MX', {
          timeZone: 'America/Mexico_City'
        }),
        'Actualizado': new Date(cut.updated_at).toLocaleString('es-MX', {
          timeZone: 'America/Mexico_City'
        })
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cortes');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    console.log('✅ Excel generado con', exportData.length, 'cortes');

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=cortes_${new Date().toISOString().split('T')[0]}.xlsx`
      }
    });

  } catch (error: any) {
    console.error('❌ Error en API exportar cortes:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al exportar cortes'
    }, { status: 500 });
  }
}
