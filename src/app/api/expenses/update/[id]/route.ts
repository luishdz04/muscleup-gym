import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getMexicoDateTimeInfo } from '@/utils/dateUtils';

export async function PUT(
	request: NextRequest,
	context: { params: { id: string } | Promise<{ id: string }> }
) {
	try {
		const { id: expenseId } = await context.params;
		const body = await request.json();

		const {
			expense_type,
			description,
			amount,
			receipt_number,
			notes,
			updated_at_mexico
		} = body;

		if (!expense_type || !description || !amount) {
			return NextResponse.json(
				{ error: 'Campos requeridos: tipo, descripción y monto', success: false },
				{ status: 400 }
			);
		}

		if (parseFloat(amount) <= 0) {
			return NextResponse.json(
				{ error: 'El monto debe ser mayor a 0', success: false },
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

		const {
			data: existingExpense,
			error: fetchError
		} = await supabase
			.from('expenses')
			.select('id, expense_date, amount')
			.eq('id', expenseId)
			.eq('status', 'active')
			.single();

		if (fetchError || !existingExpense) {
			console.error('Egreso no encontrado:', expenseId, fetchError);
			return NextResponse.json(
				{ error: 'Egreso no encontrado o inactivo', success: false },
				{ status: 404 }
			);
		}

		const now = new Date();
		let mexicoInfo = getMexicoDateTimeInfo(now);

		if (updated_at_mexico) {
			try {
				mexicoInfo = getMexicoDateTimeInfo(updated_at_mexico);
			} catch (parseError: any) {
				return NextResponse.json(
					{
						error: 'Fecha de actualización en México inválida',
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
			data: updatedExpense,
			error: updateError
		} = await supabase
			.from('expenses')
			.update({
				expense_type,
				description: description.trim(),
				amount: parseFloat(amount),
				receipt_number: receipt_number?.trim() || null,
				notes: notes?.trim() || null,
				updated_at: mexicoTimestamp,
				updated_by: userId
			})
			.eq('id', expenseId)
			.select()
			.single();

		if (updateError) {
			console.error('Error actualizando egreso:', updateError);
			throw updateError;
		}

		let syncInfo:
			| {
					synchronized: boolean;
					cut_number?: string;
					old_expenses_amount?: number;
					new_expenses_amount?: number;
					total_expenses_after_update?: number;
					reason?: string;
					error?: string;
				}
			| null = null;

		try {
			const {
				data: dayExpenses,
				error: expensesError
			} = await supabase
				.from('expenses')
				.select('amount')
				.eq('expense_date', existingExpense.expense_date)
				.eq('status', 'active');

			if (expensesError) {
				console.error('Error consultando egresos para sincronización:', expensesError);
				throw expensesError;
			}

			const totalExpenses =
				dayExpenses?.reduce((sum: number, exp: any) => {
					return sum + parseFloat(exp.amount.toString());
				}, 0) || 0;

			const {
				data: existingCut,
				error: cutError
			} = await supabase
				.from('cash_cuts')
				.select('id, cut_number, expenses_amount, grand_total, final_balance')
				.eq('cut_date', existingExpense.expense_date)
				.single();

			if (cutError && cutError.code !== 'PGRST116') {
				throw cutError;
			}

			if (existingCut) {
				const newFinalBalance =
					parseFloat(existingCut.grand_total.toString()) - totalExpenses;

				const { error: cutUpdateError } = await supabase
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

				if (cutUpdateError) {
					throw cutUpdateError;
				}

				syncInfo = {
					synchronized: true,
					cut_number: existingCut.cut_number,
					old_expenses_amount: existingExpense.amount,
					new_expenses_amount: parseFloat(amount),
					total_expenses_after_update: totalExpenses
				};
			} else {
				syncInfo = { synchronized: false, reason: 'No existe corte para esta fecha' };
			}
		} catch (syncError: any) {
			console.error('Error en sincronización directa tras actualización:', syncError);
			syncInfo = { synchronized: false, error: syncError.message };
		}

		return NextResponse.json({
			success: true,
			message: `Egreso actualizado exitosamente: ${formatPrice(parseFloat(amount))}`,
			expense_id: updatedExpense.id,
			expense: updatedExpense,
			sync_info: syncInfo,
			mexico_time: mexicoTimestamp,
			utc_time: now.toISOString()
		});
	} catch (error: any) {
		console.error('Error en API update expense:', error);
		return NextResponse.json(
			{
				error: 'Error al actualizar el egreso',
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


