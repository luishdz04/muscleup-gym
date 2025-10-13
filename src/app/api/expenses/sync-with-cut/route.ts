import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getMexicoDateTimeInfo } from '@/utils/dateUtils';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { date } = body;

		if (!date) {
			return NextResponse.json(
				{ error: 'Fecha es requerida', success: false },
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
			data: dayExpenses,
			error: expensesError
		} = await supabase
			.from('expenses')
			.select('amount, description, expense_type')
			.eq('expense_date', date)
			.eq('status', 'active');

		if (expensesError) {
			console.error('Error consultando egresos:', expensesError);
			throw expensesError;
		}

		const totalExpenses =
			dayExpenses?.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount), 0) || 0;
		const expenseCount = dayExpenses?.length || 0;

		const {
			data: existingCut,
			error: cutError
		} = await supabase
			.from('cash_cuts')
			.select('id, cut_number, expenses_amount, grand_total, final_balance')
			.eq('cut_date', date)
			.single();

		if (cutError && cutError.code !== 'PGRST116') {
			console.error('Error buscando corte:', cutError);
			throw cutError;
		}

		if (!existingCut) {
			return NextResponse.json({
				success: false,
				error: 'No hay corte registrado para esta fecha',
				date,
				total_expenses: totalExpenses,
				expense_count: expenseCount
			});
		}

		const mexicoTimestamp = getMexicoDateTimeInfo().isoString;
		const newFinalBalance = parseFloat(existingCut.grand_total) - totalExpenses;

		const {
			data: updatedCut,
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
			console.error('Error actualizando corte:', updateError);
			throw updateError;
		}

		return NextResponse.json({
			success: true,
			message: 'Sincronización manual completada exitosamente',
			date,
			cut_number: existingCut.cut_number,
			sync_details: {
				old_expenses_amount: existingCut.expenses_amount,
				new_expenses_amount: totalExpenses,
				expense_count: expenseCount,
				old_final_balance: existingCut.final_balance,
				new_final_balance: newFinalBalance,
				difference: totalExpenses - parseFloat(existingCut.expenses_amount)
			},
			total_expenses: totalExpenses,
			updated_cut: updatedCut,
			mexico_time: mexicoTimestamp
		});
	} catch (error: any) {
		console.error('Error en API sync-with-cut:', error);
		return NextResponse.json(
			{
				error: 'Error en sincronización manual',
				details: process.env.NODE_ENV === 'development' ? error.message : undefined,
				success: false
			},
			{ status: 500 }
		);
	}
}



