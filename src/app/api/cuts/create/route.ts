import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      cut_date,
      created_by,
      notes,
      is_manual = false,
      
      // POS
      pos_efectivo,
      pos_transferencia,
      pos_debito,
      pos_credito,
      pos_mixto = 0,
      pos_total,
      pos_transactions,
      pos_commissions,
      
      // MEMBERSHIPS
      membership_efectivo,
      membership_transferencia,
      membership_debito,
      membership_credito,
      membership_mixto = 0,
      membership_total,
      membership_transactions,
      membership_commissions,
      
      // TOTALES
      total_efectivo,
      total_transferencia,
      total_debito,
      total_credito,
      total_mixto = 0,
      grand_total,
      total_transactions,
      total_commissions,
      net_amount,
      expenses_amount = 0,
      final_balance
    } = body;

    // ✅ VALIDACIONES
    if (!cut_date || !created_by) {
      return NextResponse.json(
        { error: 'Campos requeridos: cut_date, created_by', success: false },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    
    // 🔢 GENERAR NÚMERO DE CORTE ÚNICO
    const dateStr = cut_date.replace(/-/g, '');
    const timeStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const cutNumber = `CORTE-${dateStr}-${timeStr}`;
    
    console.log('📊 Creando corte:', {
      cut_date,
      cut_number: cutNumber,
      created_by,
      grand_total,
      is_manual
    });
    
    // 💾 INSERTAR CORTE EN BD - ESTRUCTURA CASH_CUTS COMPLETA
    const { data: newCut, error: insertError } = await supabase
      .from('cash_cuts')
      .insert([{
        cut_number: cutNumber,
        cut_date,
        cut_time: new Date().toISOString(),
        created_by,
        notes: notes || null,
        is_manual,
        
        // POS
        pos_efectivo: parseFloat(pos_efectivo) || 0,
        pos_transferencia: parseFloat(pos_transferencia) || 0,
        pos_debito: parseFloat(pos_debito) || 0,
        pos_credito: parseFloat(pos_credito) || 0,
        pos_mixto: parseFloat(pos_mixto) || 0,
        pos_total: parseFloat(pos_total) || 0,
        pos_transactions: parseInt(pos_transactions) || 0,
        pos_commissions: parseFloat(pos_commissions) || 0,
        
        // MEMBERSHIPS
        membership_efectivo: parseFloat(membership_efectivo) || 0,
        membership_transferencia: parseFloat(membership_transferencia) || 0,
        membership_debito: parseFloat(membership_debito) || 0,
        membership_credito: parseFloat(membership_credito) || 0,
        membership_mixto: parseFloat(membership_mixto) || 0,
        membership_total: parseFloat(membership_total) || 0,
        membership_transactions: parseInt(membership_transactions) || 0,
        membership_commissions: parseFloat(membership_commissions) || 0,
        
        // TOTALES
        total_efectivo: parseFloat(total_efectivo) || 0,
        total_transferencia: parseFloat(total_transferencia) || 0,
        total_debito: parseFloat(total_debito) || 0,
        total_credito: parseFloat(total_credito) || 0,
        total_mixto: parseFloat(total_mixto) || 0,
        grand_total: parseFloat(grand_total) || 0,
        total_transactions: parseInt(total_transactions) || 0,
        total_commissions: parseFloat(total_commissions) || 0,
        net_amount: parseFloat(net_amount) || 0,
        expenses_amount: parseFloat(expenses_amount) || 0,
        final_balance: parseFloat(final_balance) || (parseFloat(net_amount) - parseFloat(expenses_amount)),
        
        status: 'closed',
        closed_at: new Date().toISOString(),
        closed_by: created_by
      }])
      .select()
      .single();

    if (insertError) {
      console.error('💥 Error insertando corte:', insertError);
      throw insertError;
    }

    console.log('✅ Corte creado exitosamente:', newCut);

    return NextResponse.json({
      success: true,
      message: `Corte creado exitosamente: ${cutNumber}`,
      cut_id: newCut.id,
      cut_number: cutNumber,
      cut: newCut
    });

  } catch (error) {
    console.error('💥 Error en API create cut:', error);
    return NextResponse.json(
      { error: 'Error al crear el corte', success: false },
      { status: 500 }
    );
  }
}
