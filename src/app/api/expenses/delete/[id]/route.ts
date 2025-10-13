import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getMexicoDateTimeInfo } from '@/utils/dateUtils';

export async function DELETE(
	request: NextRequest,
	context: { params: { id: string } | Promise<{ id: string }> }
) {
	try {
		const { id: expenseId } = await context.params;

		const supabase = createServerSupabaseClient();
		const hardDelete = request.nextUrl.searchParams.get('hard') === 'true';

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
			.select('id, expense_date, amount, description, expense_type, notes, status')
			.eq('id', expenseId)
			.maybeSingle();

		if (fetchError || !existingExpense) {
			console.error('Egreso no encontrado:', expenseId, fetchError);
			return NextResponse.json(
				{ error: 'Egreso no encontrado', success: false },
				{ status: 404 }
			);
		}

		if (!hardDelete && existingExpense.status !== 'active') {
			return NextResponse.json(
				{ error: 'Egreso no encontrado o ya eliminado', success: false },
				{ status: 404 }
			);
		}

		const wasActive = existingExpense.status === 'active';
		const now = new Date();
		const mexicoInfo = getMexicoDateTimeInfo(now);
		const mexicoTimestamp = mexicoInfo.isoString;
		let deletedExpense = existingExpense;
		let operation: 'soft' | 'hard' = 'soft';

		if (hardDelete) {
			const { error: deleteError } = await supabase
				.from('expenses')
				.delete()
				.eq('id', expenseId);

			if (deleteError) {
				console.error('Error eliminando egreso permanentemente:', deleteError);
				throw deleteError;
			}
			operation = 'hard';
		} else {
			const { data, error: deleteError } = await supabase
				.from('expenses')
				.update({
					status: 'deleted',
					updated_at: mexicoTimestamp,
					updated_by: userId,
					notes:
						(existingExpense.notes || '') +
						`[ELIMINADO el ${mexicoTimestamp} por usuario ${userId}]`
				})
				.eq('id', expenseId)
				.select()
				.single();

			if (deleteError) {
				console.error('Error eliminando egreso:', deleteError);
				throw deleteError;
			}

			deletedExpense = data;
		}

		let syncInfo:
			| {
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
					deleted_amount?: number;
					error?: string;
			}
			| null = null;

		if (wasActive) {
			try {
				const {
					data: dayExpenses,
					error: expensesError
				} = await supabase
					.from('expenses')
					.select('amount, description, expense_type')
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

				const expenseCount = dayExpenses?.length || 0;
				const deletedAmount = parseFloat(existingExpense.amount?.toString() || '0');

				const {
					data: existingCut,
					error: cutError
				} = await supabase
					.from('cash_cuts')
					.select('id, cut_number, expenses_amount, grand_total, final_balance')
					.eq('cut_date', existingExpense.expense_date)
					.single();

				if (cutError && cutError.code !== 'PGRST116') {
					console.error('Error buscando corte:', cutError);
					throw cutError;
				}

				if (existingCut) {
					const newFinalBalance =
						parseFloat(existingCut.grand_total.toString()) - totalExpenses;

					const { error: updateError } = await supabase
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
						console.error('Error actualizando corte en sincronización directa:', updateError);
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
							totalExpenses - parseFloat(existingCut.expenses_amount.toString()),
						deleted_amount: deletedAmount
					};
				} else {
					syncInfo = {
						synchronized: false,
						reason: 'No existe corte para esta fecha',
						total_expenses: totalExpenses,
						expense_count: expenseCount,
						deleted_amount: deletedAmount
					};
				}
			} catch (syncError: any) {
				console.error('Error en sincronización directa (no crítico):', syncError);
				syncInfo = {
					synchronized: false,
					error: syncError.message,
					reason: 'Error en sincronización pero egreso eliminado exitosamente',
					deleted_amount: parseFloat(existingExpense.amount?.toString() || '0')
				};
			}
		}

		if (operation === 'hard') {
			return NextResponse.json({
				success: true,
				message: `Egreso eliminado permanentemente: ${formatPrice(
					parseFloat(existingExpense.amount?.toString() || '0')
				)}`,
				expense_id: expenseId,
				deleted_expense: {
					id: existingExpense.id,
					description: existingExpense.description,
					amount: existingExpense.amount,
					expense_type: existingExpense.expense_type
				},
				hard_deleted: true,
				sync_info: syncInfo,
				mexico_time: mexicoTimestamp,
				utc_time: now.toISOString()
			});
		}

		return NextResponse.json({
			success: true,
			message: `Egreso eliminado y corte actualizado: ${formatPrice(
				parseFloat(existingExpense.amount?.toString() || '0')
			)}`,
			expense_id: deletedExpense.id,
			deleted_expense: {
				id: existingExpense.id,
				description: existingExpense.description,
				amount: existingExpense.amount,
				expense_type: existingExpense.expense_type
			},
			sync_info: syncInfo,
			mexico_time: mexicoTimestamp,
			utc_time: now.toISOString()
		});
	} catch (error: any) {
		console.error('Error en API delete expense:', error);
		return NextResponse.json(
			{
				error: 'Error al eliminar el egreso',
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


