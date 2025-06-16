import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET - Obtener detalle del egreso
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const expenseId = params.id;
    console.log('🔍 API: Obteniendo detalle del egreso:', expenseId);
    
    const supabase = createServerSupabaseClient();
    
    // Obtener egreso con información del usuario
    const { data: expense, error } = await supabase
      .from('expenses')
      .select(`
        *,
        "Users"!expenses_created_by_fkey(id, firstName, lastName, name, email)
      `)
      .eq('id', expenseId)
      .single();

    if (error) {
      console.error('❌ Error obteniendo egreso:', error);
      return NextResponse.json({
        success: false,
        error: 'Egreso no encontrado',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { status: 404 });
    }

    // Formatear datos con valores seguros
    const expenseDetail = {
      ...expense,
      creator_name: expense.Users 
        ? expense.Users.name || `${expense.Users.firstName || ''} ${expense.Users.lastName || ''}`.trim() || expense.Users.email || 'Usuario'
        : 'Usuario',
      // Convertir valores numéricos de forma segura
      amount: parseFloat(expense.amount || '0')
    };

    console.log('✅ Detalle del egreso obtenido:', expenseDetail.description);
    
    return NextResponse.json({
      success: true,
      expense: expenseDetail
    });
    
  } catch (error: any) {
    console.error('❌ Error en API detalle de egreso:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al obtener el detalle del egreso',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// DELETE - Eliminar egreso
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const expenseId = params.id;
    console.log('🗑️ API: Eliminando egreso:', expenseId);
    
    const supabase = createServerSupabaseClient();
    
    // Verificar que el egreso existe
    const { data: existingExpense, error: checkError } = await supabase
      .from('expenses')
      .select('id, description')
      .eq('id', expenseId)
      .single();
      
    if (checkError || !existingExpense) {
      return NextResponse.json({
        success: false,
        error: 'Egreso no encontrado'
      }, { status: 404 });
    }
    
    // Eliminar el egreso
    const { error: deleteError } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);
      
    if (deleteError) {
      console.error('❌ Error eliminando egreso:', deleteError);
      return NextResponse.json({
        success: false,
        error: 'Error al eliminar el egreso',
        details: process.env.NODE_ENV === 'development' ? deleteError.message : undefined
      }, { status: 500 });
    }
    
    console.log('✅ Egreso eliminado:', existingExpense.description);
    
    return NextResponse.json({
      success: true,
      message: 'Egreso eliminado exitosamente'
    });
    
  } catch (error: any) {
    console.error('❌ Error en API eliminar egreso:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al eliminar el egreso',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// PATCH - Actualizar egreso
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const expenseId = params.id;
    const body = await request.json();
    
    console.log('✏️ API: Actualizando egreso:', expenseId, body);
    
    const supabase = createServerSupabaseClient();
    
    // Preparar datos para actualizar
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    // Solo actualizar campos que vengan en el body
    if (body.description !== undefined) updateData.description = body.description;
    if (body.amount !== undefined) updateData.amount = body.amount;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.receipt_number !== undefined) updateData.receipt_number = body.receipt_number;
    if (body.expense_type !== undefined) updateData.expense_type = body.expense_type;
    
    // Actualizar el egreso
    const { data: updatedExpense, error: updateError } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', expenseId)
      .select()
      .single();
      
    if (updateError) {
      console.error('❌ Error actualizando egreso:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Error al actualizar el egreso',
        details: process.env.NODE_ENV === 'development' ? updateError.message : undefined
      }, { status: 500 });
    }
    
    console.log('✅ Egreso actualizado:', updatedExpense.description);
    
    return NextResponse.json({
      success: true,
      expense: updatedExpense
    });
    
  } catch (error: any) {
    console.error('❌ Error en API actualizar egreso:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al actualizar el egreso',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
