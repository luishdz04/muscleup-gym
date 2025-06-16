import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import * as XLSX from 'xlsx';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cutId = params.id;
    console.log('📄 API: Exportando corte individual:', cutId);

    const supabase = createServerSupabaseClient();

    // Obtener el corte con información del usuario
    const { data: cut, error } = await supabase
      .from('cash_cuts')
      .select(`
        *,
        "Users"!cash_cuts_created_by_fkey(id, firstName, lastName, name, email)
      `)
      .eq('id', cutId)
      .single();

    if (error || !cut) {
      console.error('❌ Error obteniendo corte para exportar:', error);
      return NextResponse.json({
        success: false,
        error: 'Corte no encontrado'
      }, { status: 404 });
    }

    // Crear datos para Excel con múltiples hojas
    const workbook = XLSX.utils.book_new();

    // Hoja 1: Información General
    const generalData = [{
      'Campo': 'Número de Corte',
      'Valor': cut.cut_number
    }, {
      'Campo': 'Fecha del Corte',
      'Valor': cut.cut_date
    }, {
      'Campo': 'Hora del Corte',
      'Valor': new Date(cut.cut_time).toLocaleString('es-MX')
    }, {
      'Campo': 'Tipo',
      'Valor': cut.is_manual ? 'Manual' : 'Automático'
    }, {
      'Campo': 'Estado',
      'Valor': cut.status
    }, {
      'Campo': 'Responsable',
      'Valor': cut.Users 
        ? cut.Users.name || `${cut.Users.firstName || ''} ${cut.Users.lastName || ''}`.trim() || cut.Users.email 
        : 'Usuario'
    }, {
      'Campo': 'Creado',
      'Valor': new Date(cut.created_at).toLocaleString('es-MX')
    }, {
      'Campo': 'Actualizado',
      'Valor': new Date(cut.updated_at).toLocaleString('es-MX')
    }];

    const wsGeneral = XLSX.utils.json_to_sheet(generalData);
    XLSX.utils.book_append_sheet(workbook, wsGeneral, 'Información General');

    // Hoja 2: Desglose de Ingresos
    const incomeData = [{
      'Concepto': 'Punto de Venta - Efectivo',
      'Monto': parseFloat(cut.pos_efectivo || '0')
    }, {
      'Concepto': 'Punto de Venta - Transferencia',
      'Monto': parseFloat(cut.pos_transferencia || '0')
    }, {
      'Concepto': 'Punto de Venta - Débito',
      'Monto': parseFloat(cut.pos_debito || '0')
    }, {
      'Concepto': 'Punto de Venta - Crédito',
      'Monto': parseFloat(cut.pos_credito || '0')
    }, {
      'Concepto': 'Punto de Venta - Mixto',
      'Monto': parseFloat(cut.pos_mixto || '0')
    }, {
      'Concepto': 'TOTAL PUNTO DE VENTA',
      'Monto': parseFloat(cut.pos_total || '0')
    }, {
      'Concepto': '',
      'Monto': ''
    }, {
      'Concepto': 'Abonos - Efectivo',
      'Monto': parseFloat(cut.abonos_efectivo || '0')
    }, {
      'Concepto': 'Abonos - Transferencia',
      'Monto': parseFloat(cut.abonos_transferencia || '0')
    }, {
      'Concepto': 'Abonos - Débito',
      'Monto': parseFloat(cut.abonos_debito || '0')
    }, {
      'Concepto': 'Abonos - Crédito',
      'Monto': parseFloat(cut.abonos_credito || '0')
    }, {
      'Concepto': 'Abonos - Mixto',
      'Monto': parseFloat(cut.abonos_mixto || '0')
    }, {
      'Concepto': 'TOTAL ABONOS',
      'Monto': parseFloat(cut.abonos_total || '0')
    }, {
      'Concepto': '',
      'Monto': ''
    }, {
      'Concepto': 'Membresías - Efectivo',
      'Monto': parseFloat(cut.membership_efectivo || '0')
    }, {
      'Concepto': 'Membresías - Transferencia',
      'Monto': parseFloat(cut.membership_transferencia || '0')
    }, {
      'Concepto': 'Membresías - Débito',
      'Monto': parseFloat(cut.membership_debito || '0')
    }, {
      'Concepto': 'Membresías - Crédito',
      'Monto': parseFloat(cut.membership_credito || '0')
    }, {
      'Concepto': 'Membresías - Mixto',
      'Monto': parseFloat(cut.membership_mixto || '0')
    }, {
      'Concepto': 'TOTAL MEMBRESÍAS',
      'Monto': parseFloat(cut.membership_total || '0')
    }];

    const wsIncome = XLSX.utils.json_to_sheet(incomeData);
    XLSX.utils.book_append_sheet(workbook, wsIncome, 'Desglose de Ingresos');

    // Hoja 3: Resumen Financiero
    const summaryData = [{
      'Concepto': 'Total Efectivo',
      'Monto': parseFloat(cut.total_efectivo || '0')
    }, {
      'Concepto': 'Total Transferencia',
      'Monto': parseFloat(cut.total_transferencia || '0')
    }, {
      'Concepto': 'Total Débito',
      'Monto': parseFloat(cut.total_debito || '0')
    }, {
      'Concepto': 'Total Crédito',
      'Monto': parseFloat(cut.total_credito || '0')
    }, {
      'Concepto': 'Total Mixto',
      'Monto': parseFloat(cut.total_mixto || '0')
    }, {
      'Concepto': '',
      'Monto': ''
    }, {
      'Concepto': 'TOTAL BRUTO',
      'Monto': parseFloat(cut.grand_total || '0')
    }, {
      'Concepto': 'Gastos del Día',
      'Monto': -parseFloat(cut.expenses_amount || '0')
    }, {
      'Concepto': 'BALANCE FINAL',
      'Monto': parseFloat(cut.final_balance || '0')
    }, {
      'Concepto': '',
      'Monto': ''
    }, {
      'Concepto': 'Total de Transacciones',
      'Monto': parseInt(cut.total_transactions || '0')
    }, {
      'Concepto': 'Comisiones Totales',
      'Monto': parseFloat(cut.total_commissions || '0')
    }];

    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, wsSummary, 'Resumen Financiero');

    // Hoja 4: Notas (si existen)
    if (cut.notes) {
      const notesData = [{
        'Notas / Observaciones': cut.notes
      }];
      const wsNotes = XLSX.utils.json_to_sheet(notesData);
      XLSX.utils.book_append_sheet(workbook, wsNotes, 'Notas');
    }

    // Generar buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    console.log('✅ Excel individual generado para corte:', cut.cut_number);

    // Retornar archivo
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=corte_${cut.cut_number}_${new Date().toISOString().split('T')[0]}.xlsx`
      }
    });

  } catch (error: any) {
    console.error('❌ Error en API exportar corte individual:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al exportar el corte'
    }, { status: 500 });
  }
}
