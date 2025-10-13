import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { formatMexicoTime, getMexicoDateTimeInfo } from '@/utils/dateUtils';

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const date = searchParams.get('date');
		if (!date) {
			return NextResponse.json(
				{ error: 'Fecha es requerida', success: false },
				{ status: 400 }
			);
		}
		const supabase = createServerSupabaseClient();

		const now = new Date();
		const mexicoInfo = getMexicoDateTimeInfo(now);
		const mexicoTimestamp = mexicoInfo.isoString;

		const { data: expenses, error: expensesError } = await supabase
			.from('expenses')
			.select(`
id,
expense_date,
expense_time,
expense_type,
description,
amount,
receipt_number,
notes,
status,
created_at,
created_by,
updated_at,
updated_by
`)
			.eq('expense_date', date)
			.eq('status', 'active')
			.order('expense_time', { ascending: false });

		if (expensesError) {
			console.error('Error consultando egresos:', expensesError);
			return NextResponse.json(
				{
					error: 'Error consultando egresos',
					details: expensesError.message,
					success: false
				},
				{ status: 500 }
			);
		}

		const processedExpenses = expenses || [];
		const totalAmount = processedExpenses.reduce(
			(sum, expense) => sum + parseFloat(expense.amount.toString()),
			0
		);

		const categorySummary = processedExpenses.reduce((acc: any, expense: any) => {
			const category = expense.expense_type || 'otros';
			if (!acc[category]) {
				acc[category] = {
					count: 0,
					total: 0,
					items: []
				};
			}
			acc[category].count += 1;
			acc[category].total += parseFloat(expense.amount.toString());
			acc[category].items.push(expense);
			return acc;
		}, {});

		const formattedExpenses = processedExpenses.map(expense => ({
			...expense,
			expense_time: formatMexicoTime(expense.expense_time),
			amount: parseFloat(expense.amount.toString())
		}));

		return NextResponse.json({
			success: true,
			date,
			mexico_time: mexicoTimestamp,
			utc_time: now.toISOString(),
			expenses: formattedExpenses,
			summary: {
				total_expenses: processedExpenses.length,
				total_amount: totalAmount,
				categories: categorySummary
			},
			timezone_info: {
				mexico_date: date,
				note: 'Datos consultados con zona horaria México (UTC-6)'
			}
		});
	} catch (error: any) {
		console.error('Error en API daily expenses:', error);

		return NextResponse.json(
			{
				error: 'Error al cargar egresos',
				details: process.env.NODE_ENV === 'development' ? error.message : undefined,
				success: false
			},
			{ status: 500 }
		);
	}
}


