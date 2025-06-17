import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import * as XLSX from 'xlsx';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const expenseId = params.id;
    console.log('📄 API: Exportando egreso individual:', expenseId);

    const supabase = createServerSupabaseClient();

    // Obtener el egreso con información del usuario
    const { data: expense, error } = await supabase
      .from('expenses')
      .select(`
        *,
        "Users"!expenses_created_by_fkey(id, firstName, lastName, name, email)
      `)
      .eq('id', expenseId)
      .single();

    if (error || !expense) {
      console.error('❌ Error obteniendo egreso para exportar:', error);
      return NextResponse.json({
        success: false,
        error: 'Egreso no encontrado'
      }, { status: 404 });
    }

    // Crear datos para Excel con múltiples hojas
    const workbook = XLSX.utils.book_new();

    // Hoja 1: Información General
    const generalData = [{
      'Campo': 'ID del Egreso',
      'Valor': expense.id
    }, {
      'Campo': 'Fecha del Egreso',
      'Valor': expense.expense_date
    }, {
      'Campo': 'Hora del Egreso',
      'Valor': new Date(expense.expense_time).toLocaleString('es-MX', {
        timeZone: 'America/Mexico_City'
      })
    }, {
      'Campo': 'Categoría',
      'Valor': expense.expense_type
    }, {
      'Campo': 'Descripción',
      'Valor': expense.description
    }, {
      'Campo': 'Monto',
      'Valor': parseFloat(expense.amount || '0')
    }, {
      'Campo': 'Número de Recibo',
      'Valor': expense.receipt_number || 'Sin recibo'
    }, {
      'Campo': 'Estado',
      'Valor': expense.status
    }, {
      'Campo': 'Responsable',
      'Valor': expense.Users 
        ? expense.Users.name || `${expense.Users.firstName || ''} ${expense.Users.lastName || ''}`.trim() || expense.Users.email 
        : 'Usuario'
    }, {
      'Campo': 'Creado',
      'Valor': new Date(expense.created_at).toLocaleString('es-MX', {
        timeZone: 'America/Mexico_City'
      })
    }, {
      'Campo': 'Actualizado',
      'Valor': new Date(expense.updated_at).toLocaleString('es-MX', {
        timeZone: 'America/Mexico_City'
      })
    }];

    const wsGeneral = XLSX.utils.json_to_sheet(generalData);
    XLSX.utils.book_append_sheet(workbook, wsGeneral, 'Información General');

    // Hoja 2: Detalles del Egreso
    const detailsData = [{
      'Concepto': 'Monto del Egreso',
      'Valor': parseFloat(expense.amount || '0'),
      'Descripción': expense.description
    }];

    const wsDetails = XLSX.utils.json_to_sheet(detailsData);
    XLSX.utils.book_append_sheet(workbook, wsDetails, 'Detalles');

    // Hoja 3: Notas (si existen)
    if (expense.notes) {
      const notesData = [{
        'Notas / Observaciones': expense.notes
      }];
      const wsNotes = XLSX.utils.json_to_sheet(notesData);
      XLSX.utils.book_append_sheet(workbook, wsNotes, 'Notas');
    }

    // Generar buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    console.log('✅ Excel individual generado para egreso:', expense.description);

    // Retornar archivo
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=egreso_${expenseId.slice(0, 8)}_${new Date().toISOString().split('T')[0]}.xlsx`
      }
    });

  } catch (error: any) {
    console.error('❌ Error en API exportar egreso individual:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al exportar el egreso'
    }, { status: 500 });
  }
}
