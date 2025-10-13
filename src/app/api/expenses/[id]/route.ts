import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET
export async function GET(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await context.params;
    const { data: expense, error } = await supabase
      .from('expenses')
      .select(`
        *,
        created_by:Users!expenses_created_by_fkey(id, firstName, lastName, email)
      `)
      .eq('id', id)
      .single();

    if (error || !expense) {
      return NextResponse.json({
        success: false,
        error: 'Egreso no encontrado'
      }, { status: 404 });
    }

    const expenseDetail = {
      ...expense,
      creator_name: expense.created_by
        ? `${expense.created_by.firstName || ''} ${expense.created_by.lastName || ''}`.trim() || expense.created_by.email || 'Usuario'
        : 'Usuario',
      amount: parseFloat(expense.amount || '0')
    };

    return NextResponse.json({
      success: true,
      expense: expenseDetail
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Error interno',
      details: error.message
    }, { status: 500 });
  }
}

// DELETE
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await context.params;

    const { data: existingExpense, error: checkError } = await supabase
      .from('expenses')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !existingExpense) {
      return NextResponse.json({ success: false, error: 'Egreso no encontrado' }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from('expenses')
      .delete()
  .eq('id', id);

    if (deleteError) {
      return NextResponse.json({
        success: false,
        error: 'Error al eliminar el egreso',
        details: deleteError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Egreso eliminado exitosamente'
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Error interno',
      details: error.message
    }, { status: 500 });
  }
}

// PATCH
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const supabase = createServerSupabaseClient();
    const { id } = await context.params;

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (body.description !== undefined) updateData.description = body.description;
    if (body.amount !== undefined) updateData.amount = body.amount;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.receipt_number !== undefined) updateData.receipt_number = body.receipt_number;
    if (body.expense_type !== undefined) updateData.expense_type = body.expense_type;

    const { data: updatedExpense, error: updateError } = await supabase
      .from('expenses')
      .update(updateData)
  .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({
        success: false,
        error: 'Error al actualizar el egreso',
        details: updateError.message
      }, { status: 500 });
    }

    // ⬇️ Sincroniza el corte automáticamente después de editar un egreso
    if (updatedExpense && updatedExpense.expense_date) {
      await fetch(`${request.nextUrl.origin}/api/expenses/sync-with-cut`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: updatedExpense.expense_date })
      });
    }

    return NextResponse.json({
      success: true,
      expense: updatedExpense
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Error interno',
      details: error.message
    }, { status: 500 });
  }
}
