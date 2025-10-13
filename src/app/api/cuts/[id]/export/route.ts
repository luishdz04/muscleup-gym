import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import ExcelJS from 'exceljs';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const { id: cutId } = await context.params;
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

    // Crear workbook con ExcelJS
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'MuscleUp GYM';
    workbook.created = new Date();

    // Hoja 1: Información General
    const wsGeneral = workbook.addWorksheet('Información General');
    wsGeneral.columns = [
      { header: 'Campo', key: 'campo', width: 25 },
      { header: 'Valor', key: 'valor', width: 40 }
    ];

    wsGeneral.addRows([
      { campo: 'Número de Corte', valor: cut.cut_number },
      { campo: 'Fecha del Corte', valor: cut.cut_date },
      { campo: 'Hora del Corte', valor: new Date(cut.cut_time).toLocaleString('es-MX') },
      { campo: 'Tipo', valor: cut.is_manual ? 'Manual' : 'Automático' },
      { campo: 'Estado', valor: cut.status },
      {
        campo: 'Responsable',
        valor: cut.Users
          ? cut.Users.name ||
            `${cut.Users.firstName || ''} ${cut.Users.lastName || ''}`.trim() ||
            cut.Users.email
          : 'Usuario'
      },
      { campo: 'Creado', valor: new Date(cut.created_at).toLocaleString('es-MX') },
      { campo: 'Actualizado', valor: new Date(cut.updated_at).toLocaleString('es-MX') }
    ]);

    wsGeneral.getRow(1).font = { bold: true };
    wsGeneral.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2ECC71' }
    };

    // Hoja 2: Desglose de Ingresos
    const wsIncome = workbook.addWorksheet('Desglose de Ingresos');
    wsIncome.columns = [
      { header: 'Concepto', key: 'concepto', width: 35 },
      { header: 'Monto', key: 'monto', width: 15 }
    ];

    wsIncome.addRows([
      { concepto: 'Punto de Venta - Efectivo', monto: parseFloat(cut.pos_efectivo || '0') },
      { concepto: 'Punto de Venta - Transferencia', monto: parseFloat(cut.pos_transferencia || '0') },
      { concepto: 'Punto de Venta - Débito', monto: parseFloat(cut.pos_debito || '0') },
      { concepto: 'Punto de Venta - Crédito', monto: parseFloat(cut.pos_credito || '0') },
      { concepto: 'Punto de Venta - Mixto', monto: parseFloat(cut.pos_mixto || '0') },
      { concepto: 'TOTAL PUNTO DE VENTA', monto: parseFloat(cut.pos_total || '0') },
      { concepto: '', monto: '' },
      { concepto: 'Abonos - Efectivo', monto: parseFloat(cut.abonos_efectivo || '0') },
      { concepto: 'Abonos - Transferencia', monto: parseFloat(cut.abonos_transferencia || '0') },
      { concepto: 'Abonos - Débito', monto: parseFloat(cut.abonos_debito || '0') },
      { concepto: 'Abonos - Crédito', monto: parseFloat(cut.abonos_credito || '0') },
      { concepto: 'Abonos - Mixto', monto: parseFloat(cut.abonos_mixto || '0') },
      { concepto: 'TOTAL ABONOS', monto: parseFloat(cut.abonos_total || '0') },
      { concepto: '', monto: '' },
      { concepto: 'Membresías - Efectivo', monto: parseFloat(cut.membership_efectivo || '0') },
      { concepto: 'Membresías - Transferencia', monto: parseFloat(cut.membership_transferencia || '0') },
      { concepto: 'Membresías - Débito', monto: parseFloat(cut.membership_debito || '0') },
      { concepto: 'Membresías - Crédito', monto: parseFloat(cut.membership_credito || '0') },
      { concepto: 'Membresías - Mixto', monto: parseFloat(cut.membership_mixto || '0') },
      { concepto: 'TOTAL MEMBRESÍAS', monto: parseFloat(cut.membership_total || '0') }
    ]);

    wsIncome.getRow(1).font = { bold: true };
    wsIncome.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3498DB' }
    };

    // Hoja 3: Resumen Financiero
    const wsSummary = workbook.addWorksheet('Resumen Financiero');
    wsSummary.columns = [
      { header: 'Concepto', key: 'concepto', width: 30 },
      { header: 'Monto', key: 'monto', width: 15 }
    ];

    wsSummary.addRows([
      { concepto: 'Total Efectivo', monto: parseFloat(cut.total_efectivo || '0') },
      { concepto: 'Total Transferencia', monto: parseFloat(cut.total_transferencia || '0') },
      { concepto: 'Total Débito', monto: parseFloat(cut.total_debito || '0') },
      { concepto: 'Total Crédito', monto: parseFloat(cut.total_credito || '0') },
      { concepto: 'Total Mixto', monto: parseFloat(cut.total_mixto || '0') },
      { concepto: '', monto: '' },
      { concepto: 'TOTAL BRUTO', monto: parseFloat(cut.grand_total || '0') },
      { concepto: 'Gastos del Día', monto: -parseFloat(cut.expenses_amount || '0') },
      { concepto: 'BALANCE FINAL', monto: parseFloat(cut.final_balance || '0') },
      { concepto: '', monto: '' },
      { concepto: 'Total de Transacciones', monto: parseInt(cut.total_transactions || '0') },
      { concepto: 'Comisiones Totales', monto: parseFloat(cut.total_commissions || '0') }
    ]);

    wsSummary.getRow(1).font = { bold: true };
    wsSummary.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF9800' }
    };

    // Hoja 4: Notas (si existen)
    if (cut.notes) {
      const wsNotes = workbook.addWorksheet('Notas');
      wsNotes.columns = [{ header: 'Notas / Observaciones', key: 'notas', width: 80 }];
      wsNotes.addRow({ notas: cut.notes });

      wsNotes.getRow(1).font = { bold: true };
      wsNotes.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF95A5A6' }
      };
    }

    // Generar buffer
    const excelBuffer = await workbook.xlsx.writeBuffer();

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
