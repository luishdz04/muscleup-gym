import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import ExcelJS from 'exceljs';

export async function GET(
	request: NextRequest,
	context: { params: { id: string } | Promise<{ id: string }> }
) {
	try {
		const { id: expenseId } = await context.params;

		const supabase = createServerSupabaseClient();

		const { data: expense, error } = await supabase
			.from('expenses')
			.select(`
				*,
				created_by:Users!expenses_created_by_fkey(id, firstName, lastName, email)
			`)
			.eq('id', expenseId)
			.single();

		if (error || !expense) {
			console.error('Error obteniendo egreso para exportar:', error);
			return NextResponse.json(
				{
					success: false,
					error: 'Egreso no encontrado'
				},
				{ status: 404 }
			);
		}

		// Crear workbook con ExcelJS
		const workbook = new ExcelJS.Workbook();
		workbook.creator = 'MuscleUp GYM';
		workbook.created = new Date();

		// Hoja de Información General
		const wsGeneral = workbook.addWorksheet('Información General');
		wsGeneral.columns = [
			{ header: 'Campo', key: 'campo', width: 25 },
			{ header: 'Valor', key: 'valor', width: 40 }
		];

		wsGeneral.addRows([
			{ campo: 'ID del Egreso', valor: expense.id },
			{ campo: 'Fecha del Egreso', valor: expense.expense_date },
			{
				campo: 'Hora del Egreso',
				valor: new Date(expense.expense_time).toLocaleString('es-MX', {
					timeZone: 'America/Mexico_City'
				})
			},
			{ campo: 'Categoría', valor: expense.expense_type },
			{ campo: 'Descripción', valor: expense.description },
			{ campo: 'Monto', valor: parseFloat(String(expense.amount ?? '0')) },
			{ campo: 'Número de Recibo', valor: expense.receipt_number || 'Sin recibo' },
			{ campo: 'Estado', valor: expense.status },
			{ 
				campo: 'Responsable', 
				valor: expense.created_by 
					? `${expense.created_by.firstName || ''} ${expense.created_by.lastName || ''}`.trim() || expense.created_by.email || 'Usuario'
					: 'Usuario' 
			},
			{
				campo: 'Creado',
				valor: new Date(expense.created_at).toLocaleString('es-MX', {
					timeZone: 'America/Mexico_City'
				})
			},
			{
				campo: 'Actualizado',
				valor: new Date(expense.updated_at).toLocaleString('es-MX', {
					timeZone: 'America/Mexico_City'
				})
			}
		]);

		// Estilo para el header
		wsGeneral.getRow(1).font = { bold: true };
		wsGeneral.getRow(1).fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'FFE74C3C' }
		};

		// Hoja de Detalles
		const wsDetails = workbook.addWorksheet('Detalles');
		wsDetails.columns = [
			{ header: 'Concepto', key: 'concepto', width: 25 },
			{ header: 'Valor', key: 'valor', width: 15 },
			{ header: 'Descripción', key: 'descripcion', width: 40 }
		];

		wsDetails.addRow({
			concepto: 'Monto del Egreso',
			valor: parseFloat(String(expense.amount ?? '0')),
			descripcion: expense.description
		});

		wsDetails.getRow(1).font = { bold: true };
		wsDetails.getRow(1).fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'FF3498DB' }
		};

		// Hoja de Notas (si existen)
		if (expense.notes) {
			const wsNotes = workbook.addWorksheet('Notas');
			wsNotes.columns = [{ header: 'Notas / Observaciones', key: 'notas', width: 80 }];
			wsNotes.addRow({ notas: expense.notes });

			wsNotes.getRow(1).font = { bold: true };
			wsNotes.getRow(1).fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'FF95A5A6' }
			};
		}

		// Generar el buffer
		const excelBuffer = await workbook.xlsx.writeBuffer();

		return new NextResponse(excelBuffer, {
			headers: {
				'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				'Content-Disposition': `attachment; filename=egreso_${
					expenseId.slice(0, 8)
				}_${new Date().toISOString().split('T')[0]}.xlsx`
			}
		});
	} catch (error: any) {
		console.error('Error en API exportar egreso individual:', error);
		return NextResponse.json(
			{
				success: false,
				error: 'Error al exportar el egreso'
			},
			{ status: 500 }
		);
	}
}

