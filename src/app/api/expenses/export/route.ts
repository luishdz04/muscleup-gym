import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parámetros de filtros
    const search = searchParams.get('search') || '';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const expenseType = searchParams.get('expenseType');
    const status = searchParams.get('status');

    console.log('📄 API: Exportando egresos', { search, dateFrom, dateTo, expenseType, status });

    const supabase = createServerSupabaseClient();

    // Construir query
    let query = supabase
      .from('expenses')
      .select(`
        *,
        "Users"!expenses_created_by_fkey(id, firstName, lastName, name, email)
      `)
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (search) {
      query = query.or(`description.ilike.%${search}%,notes.ilike.%${search}%,receipt_number.ilike.%${search}%`);
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

    const { data: expenses, error } = await query;

    if (error) {
      console.error('❌ Error exportando egresos:', error);
      return NextResponse.json({
        success: false,
        error: 'Error al exportar egresos'
      }, { status: 500 });
    }

    // Formatear datos para Excel
    const exportData = expenses?.map(expense => ({
      'Fecha': expense.expense_date,
      'Hora': new Date(expense.expense_time).toLocaleString('es-MX', {
        timeZone: 'America/Mexico_City',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      'Categoría': expense.expense_type,
      'Descripción': expense.description,
      'Monto': parseFloat(expense.amount || '0'),
      'Número de Recibo': expense.receipt_number || '',
      'Estado': expense.status,
      'Responsable': expense.Users 
        ? expense.Users.name || `${expense.Users.firstName || ''} ${expense.Users.lastName || ''}`.trim() || expense.Users.email 
        : 'Usuario',
      'Notas': expense.notes || '',
      'Creado': new Date(expense.created_at).toLocaleString('es-MX', {
        timeZone: 'America/Mexico_City'
      }),
      'Actualizado': new Date(expense.updated_at).toLocaleString('es-MX', {
        timeZone: 'America/Mexico_City'
      })
    })) || [];

    // Crear libro de Excel con múltiples hojas
    const workbook = XLSX.utils.book_new();

    // Hoja 1: Datos principales
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(workbook, ws, 'Egresos');

    // Hoja 2: Resumen por categorías
    if (expenses && expenses.length > 0) {
      const categoriesMap: Record<string, { count: number; amount: number }> = {};
      expenses.forEach(expense => {
        const type = expense.expense_type || 'otros';
        if (!categoriesMap[type]) {
          categoriesMap[type] = { count: 0, amount: 0 };
        }
        categoriesMap[type].count++;
        categoriesMap[type].amount += parseFloat(expense.amount || '0');
      });

      const categorySummary = Object.entries(categoriesMap).map(([category, data]) => ({
        'Categoría': category,
        'Cantidad de Egresos': data.count,
        'Monto Total': data.amount,
        'Monto Promedio': data.amount / data.count
      }));

      const wsSummary = XLSX.utils.json_to_sheet(categorySummary);
      XLSX.utils.book_append_sheet(workbook, wsSummary, 'Resumen por Categorías');
    }

    // Generar buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    console.log('✅ Excel generado con', exportData.length, 'egresos');

    // Retornar archivo
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=egresos_${new Date().toISOString().split('T')[0]}.xlsx`
      }
    });

  } catch (error: any) {
    console.error('❌ Error en API exportar egresos:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al exportar egresos'
    }, { status: 500 });
  }
}
