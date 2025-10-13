import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import ExcelJS from 'exceljs';
import { formatMexicoTime, formatTimestampShort } from '@/utils/dateUtils';

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const search = searchParams.get('search') ?? '';
		const dateFrom = searchParams.get('dateFrom');
		const dateTo = searchParams.get('dateTo');
		const expenseType = searchParams.get('expenseType');
		const status = searchParams.get('status');

		const supabase = createServerSupabaseClient();

		let query = supabase
			.from('expenses')
			.select(`
				*,
				created_by:Users!expenses_created_by_fkey(id, firstName, lastName, email)
			`)
			.order('created_at', { ascending: false });

		if (search) {
			query = query.or(
				`description.ilike.%${search}%,notes.ilike.%${search}%,receipt_number.ilike.%${search}%`
			);
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
			console.error('Error exportando egresos:', error);
			return NextResponse.json(
				{
					success: false,
					error: 'Error al exportar egresos'
				},
				{ status: 500 }
			);
		}

		const safeExpenses = expenses ?? [];

		// Crear workbook con ExcelJS
		const workbook = new ExcelJS.Workbook();
		workbook.creator = 'MuscleUp GYM';
		workbook.created = new Date();

		// Hoja de Egresos
		const expensesSheet = workbook.addWorksheet('Egresos');
		expensesSheet.columns = [
			{ header: 'Fecha', key: 'fecha', width: 12 },
			{ header: 'Hora', key: 'hora', width: 15 },
			{ header: 'Categoría', key: 'categoria', width: 20 },
			{ header: 'Descripción', key: 'descripcion', width: 30 },
			{ header: 'Monto', key: 'monto', width: 12 },
			{ header: 'Número de Recibo', key: 'recibo', width: 15 },
			{ header: 'Estado', key: 'estado', width: 12 },
			{ header: 'Responsable', key: 'responsable', width: 25 },
			{ header: 'Notas', key: 'notas', width: 30 },
			{ header: 'Creado', key: 'creado', width: 18 },
			{ header: 'Actualizado', key: 'actualizado', width: 18 }
		];

		// Agregar datos
		safeExpenses.forEach(expense => {
			expensesSheet.addRow({
				fecha: expense.expense_date,
				hora: formatMexicoTime(expense.expense_time),
				categoria: expense.expense_type,
				descripcion: expense.description,
				monto: parseFloat(String(expense.amount ?? '0')),
				recibo: expense.receipt_number || '',
				estado: expense.status,
				responsable: expense.created_by
					? `${expense.created_by.firstName || ''} ${expense.created_by.lastName || ''}`.trim() || expense.created_by.email || 'Usuario'
					: 'Usuario',
				notas: expense.notes || '',
				creado: formatTimestampShort(expense.created_at),
				actualizado: formatTimestampShort(expense.updated_at)
			});
		});

		// Estilo para el header
		expensesSheet.getRow(1).font = { bold: true };
		expensesSheet.getRow(1).fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'FFE74C3C' }
		};

		// Hoja de Resumen por Categorías
		if (safeExpenses.length > 0) {
			const categoriesMap: Record<string, { count: number; amount: number }> = {};

			safeExpenses.forEach(expense => {
				const type = expense.expense_type || 'otros';
				if (!categoriesMap[type]) {
					categoriesMap[type] = { count: 0, amount: 0 };
				}
				categoriesMap[type].count += 1;
				categoriesMap[type].amount += parseFloat(String(expense.amount ?? '0'));
			});

			const summarySheet = workbook.addWorksheet('Resumen por Categorías');
			summarySheet.columns = [
				{ header: 'Categoría', key: 'categoria', width: 20 },
				{ header: 'Cantidad de Egresos', key: 'cantidad', width: 18 },
				{ header: 'Monto Total', key: 'total', width: 15 },
				{ header: 'Monto Promedio', key: 'promedio', width: 15 }
			];

			Object.entries(categoriesMap).forEach(([category, data]) => {
				summarySheet.addRow({
					categoria: category,
					cantidad: data.count,
					total: data.amount,
					promedio: data.count > 0 ? data.amount / data.count : 0
				});
			});

			// Estilo para el header del resumen
			summarySheet.getRow(1).font = { bold: true };
			summarySheet.getRow(1).fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'FF3498DB' }
			};
		}

		// Generar el buffer
		const excelBuffer = await workbook.xlsx.writeBuffer();

		return new NextResponse(excelBuffer, {
			headers: {
				'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				'Content-Disposition': `attachment; filename=egresos_${
					new Date().toISOString().split('T')[0]
				}.xlsx`
			}
		});
	} catch (error: any) {
		console.error('Error en API exportar egresos:', error);
		return NextResponse.json(
			{
				success: false,
				error: 'Error al exportar egresos'
			},
			{ status: 500 }
		);
	}
}


