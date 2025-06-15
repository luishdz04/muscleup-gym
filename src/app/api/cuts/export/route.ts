import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // ✅ IMPORTACIÓN DINÁMICA PARA VERCEL
    const { default: XLSX } = await import('xlsx');
    
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

    // ✅ USAR CLIENTE SERVIDOR CORRECTO
    const supabase = createServerSupabaseClient();

    // Construir query
    let query = supabase
      .from('cash_cuts')
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
        users!cash_cuts_created_by_fkey(first_name, last_name, username)
      `);

    // Aplicar filtros
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
        error: 'Error al exportar cortes',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { status: 500 });
    }

    // Formatear datos para Excel con valores seguros
    const excelData = cuts?.map(cut => ({
      'Número de Corte': cut.cut_number || '',
      'Fecha': cut.cut_date || '',
      'Tipo': cut.is_manual ? 'Manual' : 'Automático',
      'Estado': cut.status || '',
      'POS Total': parseFloat(cut.pos_total || '0'),
      'Abonos Total': parseFloat(cut.abonos_total || '0'),
      'Membresías Total': parseFloat(cut.membership_total || '0'),
      'Total Bruto': parseFloat(cut.grand_total || '0'),
      'Gastos': parseFloat(cut.expenses_amount || '0'),
      'Balance Final': parseFloat(cut.final_balance || '0'),
      'Transacciones': parseInt(cut.total_transactions || '0'),
      'Efectivo': parseFloat(cut.total_efectivo || '0'),
      'Transferencia': parseFloat(cut.total_transferencia || '0'),
      'Tarjeta Débito': parseFloat(cut.total_debito || '0'),
      'Tarjeta Crédito': parseFloat(cut.total_credito || '0'),
      'Responsable': cut.users 
        ? `${cut.users.first_name || ''} ${cut.users.last_name || ''}`.trim() || cut.users.username
        : 'Usuario',
      'Fecha Creación': cut.created_at || '',
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

  } catch (error: any) {
    console.error('❌ Error en API exportar cortes:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al exportar los cortes',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
