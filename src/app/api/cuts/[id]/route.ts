import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET - Obtener detalle del corte
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // ✅ VALIDACIÓN DEFENSIVA COMPLETA
    const params = context?.params;
    if (!params || !params.id) {
      console.error('❌ Error: params no definido o sin ID', { context, params });
      return NextResponse.json({
        success: false,
        error: 'ID del corte no proporcionado'
      }, { status: 400 });
    }

    const cutId = params.id;
    console.log('🔍 API: Obteniendo detalle del corte:', cutId);
    console.log('📍 Timestamp:', new Date().toISOString());
    console.log('👤 Usuario actual: luishdz04');
    
    const supabase = createServerSupabaseClient();
    
    // ✅ QUERY MEJORADA CON MÚLTIPLES CAMPOS DE USUARIO
    const { data: cut, error } = await supabase
      .from('cash_cuts')
      .select(`
        *,
        users!cash_cuts_created_by_fkey(id, first_name, last_name, username, name, email, firstName, lastName)
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

    if (!cut) {
      return NextResponse.json({
        success: false,
        error: 'Corte no encontrado'
      }, { status: 404 });
    }

    // ✅ FORMATEO ROBUSTO DE USUARIO
    let creator_name = 'Usuario';
    if (cut.users) {
      if (cut.users.name) {
        creator_name = cut.users.name;
      } else if (cut.users.first_name || cut.users.last_name) {
        creator_name = `${cut.users.first_name || ''} ${cut.users.last_name || ''}`.trim();
      } else if (cut.users.firstName || cut.users.lastName) {
        creator_name = `${cut.users.firstName || ''} ${cut.users.lastName || ''}`.trim();
      } else if (cut.users.username) {
        creator_name = cut.users.username;
      } else if (cut.users.email) {
        creator_name = cut.users.email;
      }
    }

    // ✅ FORMATEAR DATOS COMPLETOS
    const cutDetail = {
      ...cut,
      creator_name,
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

    console.log('✅ Detalle del corte obtenido:', cutDetail.cut_number, 'por:', creator_name);
    
    return NextResponse.json({
      success: true,
      cut: cutDetail
    });
    
  } catch (error: any) {
    console.error('❌ Error en API detalle de corte:', error);
    console.error('📍 Stack:', error.stack);
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
  context: { params: { id: string } }
) {
  try {
    const params = context?.params;
    if (!params || !params.id) {
      return NextResponse.json({
        success: false,
        error: 'ID del corte no proporcionado'
      }, { status: 400 });
    }

    const cutId = params.id;
    console.log('🗑️ API: Eliminando corte:', cutId);
    console.log('👤 Usuario: luishdz04');
    
    const supabase = createServerSupabaseClient();
    
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
  context: { params: { id: string } }
) {
  try {
    const params = context?.params;
    if (!params || !params.id) {
      return NextResponse.json({
        success: false,
        error: 'ID del corte no proporcionado'
      }, { status: 400 });
    }

    const cutId = params.id;
    const body = await request.json();
    
    console.log('✏️ API: Actualizando corte:', cutId, body);
    console.log('👤 Usuario: luishdz04');
    
    const supabase = createServerSupabaseClient();
    
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.expenses_amount !== undefined) {
      updateData.expenses_amount = body.expenses_amount;
      
      const { data: currentCut } = await supabase
        .from('cash_cuts')
        .select('grand_total')
        .eq('id', cutId)
        .single();
        
      if (currentCut) {
        updateData.final_balance = parseFloat(currentCut.grand_total) - parseFloat(body.expenses_amount);
        updateData.net_amount = updateData.final_balance;
      }
    }
    if (body.status !== undefined) updateData.status = body.status;
    
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
