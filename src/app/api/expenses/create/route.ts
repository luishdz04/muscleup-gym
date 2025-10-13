import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getMexicoDateTimeInfo } from '@/utils/dateUtils';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		const {
			expense_date,
			expense_type,
			description,
			amount,
			receipt_number,
			notes,
			created_at_mexico
		} = body;

		if (!expense_date || !expense_type || !description || !amount) {
			return NextResponse.json(
				{ error: 'Campos requeridos: fecha, tipo, descripción y monto', success: false },
				{ status: 400 }
			);
		}

		if (parseFloat(amount) <= 0) {
			return NextResponse.json(
				{ error: 'El monto debe ser mayor a 0', success: false },
				{ status: 400 }
			);
		}

		const validTypes = [
			'nomina',
			'suplementos',
			'servicios',
			'mantenimiento',
			'limpieza',
			'marketing',
			'equipamiento',
			'otros'
		];

		if (!validTypes.includes(expense_type)) {
			return NextResponse.json(
				{
					error: `Tipo de egreso no válido. Tipos permitidos: ${validTypes.join(', ')}`,
					success: false
				},
				{ status: 400 }
			);
		}

		const supabase = createServerSupabaseClient();

		const {
			data: { user },
			error: authError
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json(
				{ error: 'Usuario no autenticado', success: false },
				{ status: 401 }
			);
		}

		const userId = user.id;
		const now = new Date();
		let mexicoInfo = getMexicoDateTimeInfo(now);

		if (created_at_mexico) {
			try {
				mexicoInfo = getMexicoDateTimeInfo(created_at_mexico);
			} catch (parseError: any) {
				return NextResponse.json(
					{
						error: 'Fecha creada en México inválida',
						success: false,
						details:
							process.env.NODE_ENV === 'development' ? parseError.message : undefined
					},
					{ status: 400 }
				);
			}
		}

		const mexicoTimestamp = mexicoInfo.isoString;

		const {
			data: newExpense,
			error: insertError
		} = await supabase
			.from('expenses')
			.insert([
				{
					expense_date,
					expense_time: mexicoTimestamp,
					expense_type,
					description: description.trim(),
					amount: parseFloat(amount),
					receipt_number: receipt_number?.trim() || null,
					notes: notes?.trim() || null,
					status: 'active',
					created_by: userId,
					created_at: mexicoTimestamp,
					updated_at: mexicoTimestamp
				}
			])
			.select()
			.single();

		if (insertError) {
			console.error('Error insertando egreso:', insertError);

			if (insertError.code === '23503') {
				return NextResponse.json(
					{ error: 'Usuario no válido para crear egreso', success: false },
					{ status: 400 }
				);
			}

			if (insertError.code === '23514') {
				return NextResponse.json(
					{ error: `Datos no válidos: ${insertError.message}`, success: false },
					{ status: 400 }
				);
			}

			return NextResponse.json(
				{ error: `Error insertando egreso: ${insertError.message}`, success: false },
				{ status: 500 }
			);
		}

		let syncInfo: {
			synchronized: boolean;
			cut_number?: string;
			old_expenses_amount?: number;
			new_expenses_amount?: number;
			expense_count?: number;
			old_final_balance?: number;
			new_final_balance?: number;
			difference?: number;
			reason?: string;
			total_expenses?: number;
			error?: string;
		} | null = null;

		try {
			const {
				data: dayExpenses,
				error: expensesError
			} = await supabase
				.from('expenses')
				.select('amount, description, expense_type')
				.eq('expense_date', expense_date)
				.eq('status', 'active');

			if (expensesError) {
				console.error('Error consultando egresos para sincronización:', expensesError);
				throw expensesError;
			}

			const totalExpenses =
				dayExpenses?.reduce((sum: number, exp: any) => {
					return sum + parseFloat(exp.amount.toString());
				}, 0) || 0;

			const expenseCount = dayExpenses?.length || 0;

			const {
				data: existingCut,
				error: cutError
			} = await supabase
				.from('cash_cuts')
				.select('id, cut_number, expenses_amount, grand_total, final_balance')
				.eq('cut_date', expense_date)
				.single();

			if (cutError && cutError.code !== 'PGRST116') {
				console.error('Error buscando corte:', cutError);
				throw cutError;
			}

			if (existingCut) {
				const newFinalBalance =
					parseFloat(existingCut.grand_total.toString()) - totalExpenses;

				const {
					error: updateError
				} = await supabase
					.from('cash_cuts')
					.update({
						expenses_amount: totalExpenses,
						final_balance: newFinalBalance,
						updated_at: mexicoTimestamp,
						updated_by: userId
					})
					.eq('id', existingCut.id)
					.select()
					.single();

				if (updateError) {
					console.error('Error actualizando corte durante sincronización directa:', updateError);
					throw updateError;
				}

				syncInfo = {
					synchronized: true,
					cut_number: existingCut.cut_number,
					old_expenses_amount: existingCut.expenses_amount,
					new_expenses_amount: totalExpenses,
					expense_count: expenseCount,
					old_final_balance: existingCut.final_balance,
					new_final_balance: newFinalBalance,
					difference:
						totalExpenses - parseFloat(existingCut.expenses_amount.toString())
				};
			} else {
				syncInfo = {
					synchronized: false,
					reason: 'No existe corte para esta fecha',
					total_expenses: totalExpenses,
					expense_count: expenseCount
				};
			}
		} catch (syncError: any) {
			console.error('Error en sincronización directa (no crítico):', syncError);
			syncInfo = {
				synchronized: false,
				error: syncError.message,
				reason: 'Error en sincronización pero egreso creado exitosamente'
			};
		}

		return NextResponse.json({
			success: true,
			message: `Egreso creado exitosamente: ${formatPrice(parseFloat(amount))}`,
			expense_id: newExpense.id,
			expense: newExpense,
			sync_info: syncInfo,
			mexico_time: mexicoTimestamp,
			utc_time: now.toISOString()
		});
	} catch (error: any) {
		console.error('Error en API create expense:', error);
		return NextResponse.json(
			{
				error: 'Error al crear el egreso',
				details: process.env.NODE_ENV === 'development' ? error.message : undefined,
				success: false
			},
			{ status: 500 }
		);
	}
}

function formatPrice(amount: number): string {
	return new Intl.NumberFormat('es-MX', {
		style: 'currency',
		currency: 'MXN',
		minimumFractionDigits: 2
	}).format(amount);
}



