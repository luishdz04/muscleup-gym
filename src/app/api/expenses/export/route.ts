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
    const expenseType = searchParams.get('expenseType');
    const status = searchParams.get('status');

    console.log('📄 API: Exportando egresos con filtros:', {
      search, dateFrom, dateTo, expenseType, status
    });

    // Construir query
    let query = supabase
      .from('expenses')
      .select(`
        expense_date,
        expense_time,
        expense_type,
        description,
        amount,
        receipt_number,
        status,
        created_at,
        notes,
        users!expenses_created_by_fkey(first_name, last_name, username)
      `);

    // Aplicar filtros (mismos que historial)
    if (search) {
      query = query.or(`description.ilike.%${search}%,receipt_number.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    if (dateFrom) {
      query = query.gte('expense_date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('expense_date', dateTo);
    }

    if (expenseType && expenseType !== 'all') {
      query = query.eq('expense_type', expenseType);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Ordenar por fecha
    query = query.order('expense_date', { ascending: false });

    const { data: expenses, error } = await query;

    if (error) {
      console.error('❌ Error exportando egresos:', error);
      return NextResponse.json({
        success: false,
        error: 'Error al exportar egresos'
      }, { status: 500 });
    }

    // Mapeo de categorías
    const categoryMap: Record<string, string> = {
      'nomina': 'Nómina',
      'suplementos': 'Suplementos',
      'servicios': 'Servicios',
      'mantenimiento': 'Mantenimiento',
      'limpieza': 'Limpieza',
      'marketing': 'Marketing',
      'equipamiento': 'Equipamiento',
      'otros': 'Otros'
    };

    // Formatear datos para Excel
    const excelData = expenses?.map(expense => ({
      'Fecha': expense.expense_date,
      'Hora': expense.expense_time,
      'Categoría': categoryMap[expense.expense_type] || 'Otros',
      'Descripción': expense.description,
      'Monto': parseFloat(expense.amount),
      'Número de Recibo': expense.receipt_number || '',
      'Estado': expense.status,
      'Responsable': expense.users 
        ? `${expense.users.first_name || ''} ${expense.users.last_name || ''}`.trim() || expense.users.username
        : 'luishdz04',
      'Fecha Creación': expense.created_at,
      'Notas': expense.notes || ''
    })) || [];

    // Crear Excel
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Historial de Egresos');

    // Configurar anchos de columna
    const colWidths = [
      { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 30 }, { wch: 15 },
      { wch: 20 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 40 }
    ];
    worksheet['!cols'] = colWidths;

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    console.log('✅ Archivo Excel generado:', excelData.length, 'egresos exportados');

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="egresos_${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    });

  } catch (error) {
    console.error('❌ Error en API exportar egresos:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al exportar los egresos'
    }, { status: 500 });
  }
}
