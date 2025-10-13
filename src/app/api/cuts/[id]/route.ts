import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET - Obtener detalle del corte
export async function GET(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const { id: cutId } = await context.params;
    console.log('🔍 API: Obteniendo detalle del corte:', cutId);
    
    const supabase = createServerSupabaseClient();
    
    // Obtener corte con información del usuario
    const { data: cut, error } = await supabase
      .from('cash_cuts')
      .select(`
        *,
        "Users"!cash_cuts_created_by_fkey(id, firstName, lastName, name, email)
      `)
      .eq('id', cutId)
      .single();

    if (error) {
      console.error('❌ Error obteniendo corte:', error);
      return NextResponse.json({
        success: false,
        error: 'Corte no encontrado',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { status: 404 });
    }

    // Formatear datos con valores seguros
    const cutDetail = {
      ...cut,
      creator_name: cut.Users 
        ? cut.Users.name || `${cut.Users.firstName || ''} ${cut.Users.lastName || ''}`.trim() || cut.Users.email || 'Usuario'
        : 'Usuario',
      // Convertir valores numéricos de forma segura
      grand_total: parseFloat(cut.grand_total || '0'),
      expenses_amount: parseFloat(cut.expenses_amount || '0'),
      final_balance: parseFloat(cut.final_balance || '0'),
      pos_efectivo: parseFloat(cut.pos_efectivo || '0'),
      pos_transferencia: parseFloat(cut.pos_transferencia || '0'),
      pos_debito: parseFloat(cut.pos_debito || '0'),
      pos_credito: parseFloat(cut.pos_credito || '0'),
      pos_mixto: parseFloat(cut.pos_mixto || '0'),
      pos_total: parseFloat(cut.pos_total || '0'),
      abonos_efectivo: parseFloat(cut.abonos_efectivo || '0'),
      abonos_transferencia: parseFloat(cut.abonos_transferencia || '0'),
      abonos_debito: parseFloat(cut.abonos_debito || '0'),
      abonos_credito: parseFloat(cut.abonos_credito || '0'),
      abonos_mixto: parseFloat(cut.abonos_mixto || '0'),
      abonos_total: parseFloat(cut.abonos_total || '0'),
      membership_efectivo: parseFloat(cut.membership_efectivo || '0'),
      membership_transferencia: parseFloat(cut.membership_transferencia || '0'),
      membership_debito: parseFloat(cut.membership_debito || '0'),
      membership_credito: parseFloat(cut.membership_credito || '0'),
      membership_mixto: parseFloat(cut.membership_mixto || '0'),
      membership_total: parseFloat(cut.membership_total || '0'),
      total_efectivo: parseFloat(cut.total_efectivo || '0'),
      total_transferencia: parseFloat(cut.total_transferencia || '0'),
      total_debito: parseFloat(cut.total_debito || '0'),
      total_credito: parseFloat(cut.total_credito || '0'),
      total_mixto: parseFloat(cut.total_mixto || '0'),
      total_transactions: parseInt(cut.total_transactions || '0'),
      pos_transactions: parseInt(cut.pos_transactions || '0'),
      abonos_transactions: parseInt(cut.abonos_transactions || '0'),
      membership_transactions: parseInt(cut.membership_transactions || '0'),
      pos_commissions: parseFloat(cut.pos_commissions || '0'),
      abonos_commissions: parseFloat(cut.abonos_commissions || '0'),
      membership_commissions: parseFloat(cut.membership_commissions || '0'),
      total_commissions: parseFloat(cut.total_commissions || '0'),
      net_amount: parseFloat(cut.net_amount || '0')
    };

    console.log('✅ Detalle del corte obtenido:', cutDetail.cut_number);
    
    return NextResponse.json({
      success: true,
      cut: cutDetail
    });
    
  } catch (error: any) {
    console.error('❌ Error en API detalle de corte:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al obtener el detalle del corte',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// DELETE - Eliminar corte
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const { id: cutId } = await context.params;
    console.log('🗑️ API: Eliminando corte:', cutId);
    
    const supabase = createServerSupabaseClient();
    
    // Verificar que el corte existe
    const { data: existingCut, error: checkError } = await supabase
      .from('cash_cuts')
      .select('id, cut_number')
      .eq('id', cutId)
      .single();
      
    if (checkError || !existingCut) {
      return NextResponse.json({
        success: false,
        error: 'Corte no encontrado'
      }, { status: 404 });
    }
    
    // Eliminar el corte
    const { error: deleteError } = await supabase
      .from('cash_cuts')
      .delete()
      .eq('id', cutId);
      
    if (deleteError) {
      console.error('❌ Error eliminando corte:', deleteError);
      return NextResponse.json({
        success: false,
        error: 'Error al eliminar el corte',
        details: process.env.NODE_ENV === 'development' ? deleteError.message : undefined
      }, { status: 500 });
    }
    
    console.log('✅ Corte eliminado:', existingCut.cut_number);
    
    return NextResponse.json({
      success: true,
      message: 'Corte eliminado exitosamente'
    });
    
  } catch (error: any) {
    console.error('❌ Error en API eliminar corte:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al eliminar el corte',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// PATCH - Actualizar corte
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const { id: cutId } = await context.params;
    const body = await request.json();
    
    console.log('✏️ API: Actualizando corte:', cutId, body);
    
    const supabase = createServerSupabaseClient();
    
    // Preparar datos para actualizar
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    // Campos básicos
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.expenses_amount !== undefined) updateData.expenses_amount = body.expenses_amount;
    
    // Campos de POS
    if (body.pos_efectivo !== undefined) updateData.pos_efectivo = body.pos_efectivo;
    if (body.pos_transferencia !== undefined) updateData.pos_transferencia = body.pos_transferencia;
    if (body.pos_debito !== undefined) updateData.pos_debito = body.pos_debito;
    if (body.pos_credito !== undefined) updateData.pos_credito = body.pos_credito;
    if (body.pos_mixto !== undefined) updateData.pos_mixto = body.pos_mixto;
    if (body.pos_total !== undefined) updateData.pos_total = body.pos_total;
    if (body.pos_transactions !== undefined) updateData.pos_transactions = body.pos_transactions;
    if (body.pos_commissions !== undefined) updateData.pos_commissions = body.pos_commissions;
    
    // Campos de Abonos
    if (body.abonos_efectivo !== undefined) updateData.abonos_efectivo = body.abonos_efectivo;
    if (body.abonos_transferencia !== undefined) updateData.abonos_transferencia = body.abonos_transferencia;
    if (body.abonos_debito !== undefined) updateData.abonos_debito = body.abonos_debito;
    if (body.abonos_credito !== undefined) updateData.abonos_credito = body.abonos_credito;
    if (body.abonos_mixto !== undefined) updateData.abonos_mixto = body.abonos_mixto;
    if (body.abonos_total !== undefined) updateData.abonos_total = body.abonos_total;
    if (body.abonos_transactions !== undefined) updateData.abonos_transactions = body.abonos_transactions;
    if (body.abonos_commissions !== undefined) updateData.abonos_commissions = body.abonos_commissions;
    
    // Campos de Membresías
    if (body.membership_efectivo !== undefined) updateData.membership_efectivo = body.membership_efectivo;
    if (body.membership_transferencia !== undefined) updateData.membership_transferencia = body.membership_transferencia;
    if (body.membership_debito !== undefined) updateData.membership_debito = body.membership_debito;
    if (body.membership_credito !== undefined) updateData.membership_credito = body.membership_credito;
    if (body.membership_mixto !== undefined) updateData.membership_mixto = body.membership_mixto;
    if (body.membership_total !== undefined) updateData.membership_total = body.membership_total;
    if (body.membership_transactions !== undefined) updateData.membership_transactions = body.membership_transactions;
    if (body.membership_commissions !== undefined) updateData.membership_commissions = body.membership_commissions;
    
    // Totales por método de pago
    if (body.total_efectivo !== undefined) updateData.total_efectivo = body.total_efectivo;
    if (body.total_transferencia !== undefined) updateData.total_transferencia = body.total_transferencia;
    if (body.total_debito !== undefined) updateData.total_debito = body.total_debito;
    if (body.total_credito !== undefined) updateData.total_credito = body.total_credito;
    if (body.total_mixto !== undefined) updateData.total_mixto = body.total_mixto;
    
    // Totales generales
    if (body.total_transactions !== undefined) updateData.total_transactions = body.total_transactions;
    if (body.total_commissions !== undefined) updateData.total_commissions = body.total_commissions;
    if (body.grand_total !== undefined) updateData.grand_total = body.grand_total;
    if (body.final_balance !== undefined) updateData.final_balance = body.final_balance;
    if (body.net_amount !== undefined) updateData.net_amount = body.net_amount;
    
    // 🔄 SINCRONIZACIÓN CON EGRESOS - Si no se envió expenses_amount manualmente, recalcular desde expenses
    if (body.expenses_amount === undefined && body.syncExpenses !== false) {
      try {
        // Obtener la fecha del corte actual
        const { data: currentCut } = await supabase
          .from('cash_cuts')
          .select('cut_date')
          .eq('id', cutId)
          .single();
        
        if (currentCut) {
          // Consultar todos los egresos activos de ese día
          const { data: dayExpenses, error: expensesError } = await supabase
            .from('expenses')
            .select('amount')
            .eq('expense_date', currentCut.cut_date)
            .eq('status', 'active');
          
          if (!expensesError && dayExpenses) {
            const totalExpenses = dayExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0);
            updateData.expenses_amount = totalExpenses;
            console.log(`🔄 Sincronizado expenses_amount: ${totalExpenses} para corte del ${currentCut.cut_date}`);
          }
        }
      } catch (syncError) {
        console.warn('⚠️ No se pudo sincronizar con egresos (no crítico):', syncError);
        // No falla la actualización si falla la sync
      }
    }
    
    // Actualizar el corte
    const { data: updatedCut, error: updateError } = await supabase
      .from('cash_cuts')
      .update(updateData)
      .eq('id', cutId)
      .select()
      .single();
      
    if (updateError) {
      console.error('❌ Error actualizando corte:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Error al actualizar el corte',
        details: process.env.NODE_ENV === 'development' ? updateError.message : undefined
      }, { status: 500 });
    }
    
    console.log('✅ Corte actualizado:', updatedCut.cut_number);
    
    return NextResponse.json({
      success: true,
      cut: updatedCut
    });
    
  } catch (error: any) {
    console.error('❌ Error en API actualizar corte:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al actualizar el corte',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
