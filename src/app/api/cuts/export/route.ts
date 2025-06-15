import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parámetros de filtros
    const search = searchParams.get('search') || '';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const status = searchParams.get('status');
    const isManual = searchParams.get('isManual');

    console.log('📄 API: Exportando cortes con filtros:', {
      search, dateFrom, dateTo, status, isManual
    });

    // Construir query
    let query = supabase
      .from('cuts')
      .select(`
        cut_number,
        cut_date,
        is_manual,
        status,
        pos_total,
        abonos_total,
        membership_total,
        grand_total,
        expenses_amount,
        final_balance,
        total_transactions,
        total_efectivo,
        total_transferencia,
        total_debito,
        total_credito,
        created_at,
        notes,
        users!cuts_created_by_fkey(first_name, last_name, username)
      `);

    // Aplicar filtros (mismos que historial)
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

    // Ordenar por fecha
    query = query.order('created_at', { ascending: false });

    const { data: cuts, error } = await query;

    if (error) {
      console.error('❌ Error exportando cortes:', error);
      return NextResponse.json({
        success: false,
        error: 'Error al exportar cortes'
      }, { status: 500 });
    }

    // Formatear datos para Excel
    const excelData = cuts?.map(cut => ({
      'Número de Corte': cut.cut_number,
      'Fecha': cut.cut_date,
      'Tipo': cut.is_manual ? 'Manual' : 'Automático',
      'Estado': cut.status,
      'POS Total': parseFloat(cut.pos_total),
      'Abonos Total': parseFloat(cut.abonos_total),
      'Membresías Total': parseFloat(cut.membership_total),
      'Total Bruto': parseFloat(cut.grand_total),
      'Gastos': parseFloat(cut.expenses_amount),
      'Balance Final': parseFloat(cut.final_balance),
      'Transacciones': parseInt(cut.total_transactions),
      'Efectivo': parseFloat(cut.total_efectivo),
      'Transferencia': parseFloat(cut.total_transferencia),
      'Tarjeta Débito': parseFloat(cut.total_debito),
      'Tarjeta Crédito': parseFloat(cut.total_credito),
      'Responsable': cut.users 
        ? `${cut.users.first_name || ''} ${cut.users.last_name || ''}`.trim() || cut.users.username
        : 'Usuario',
      'Fecha Creación': cut.created_at,
      'Observaciones': cut.notes || ''
    })) || [];

    // Crear Excel
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Historial de Cortes');

    // Configurar anchos de columna
    const colWidths = [
      { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 },
      { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 20 }, { wch: 20 }, { wch: 30 }
    ];
    worksheet['!cols'] = colWidths;

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    console.log('✅ Archivo Excel generado:', excelData.length, 'cortes exportados');

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="cortes_${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    });

  } catch (error) {
    console.error('❌ Error en API exportar cortes:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al exportar los cortes'
    }, { status: 500 });
  }
}
