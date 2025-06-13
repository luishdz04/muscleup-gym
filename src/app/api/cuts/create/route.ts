import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      cut_date,
      notes,
      is_manual = false,
      
      // POS
      pos_efectivo,
      pos_transferencia,
      pos_debito,
      pos_credito,
      pos_total,
      pos_transactions,
      
      // ABONOS ✅ NUEVOS CAMPOS
      abonos_efectivo,
      abonos_transferencia,
      abonos_debito,
      abonos_credito,
      abonos_total,
      abonos_transactions,
      
      // MEMBERSHIPS
      membership_efectivo,
      membership_transferencia,
      membership_debito,
      membership_credito,
      membership_total,
      membership_transactions,
      
      // TOTALES
      total_efectivo,
      total_transferencia,
      total_debito,
      total_credito,
      grand_total,
      total_transactions,
      expenses_amount = 0,
      final_balance
    } = body;

    // ✅ VALIDACIONES
    if (!cut_date) {
      return NextResponse.json(
        { error: 'Campo requerido: cut_date', success: false },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    
// ✅ CÓDIGO CORREGIDO (detecta sesión actual)
const { data: { user }, error: authError } = await supabase.auth.getUser();

if (authError || !user) {
  return NextResponse.json(
    { error: 'Usuario no autenticado', success: false },
    { status: 401 }
  );
}

const userId = user.id;
    
    // 🔢 GENERAR NÚMERO DE CORTE ÚNICO (más profesional)
    const dateStr = cut_date.replace(/-/g, '');
    const timestamp = Date.now();
    const cutNumber = `CORTE-${dateStr}-${timestamp}`;
    
    console.log('📊 Creando corte:', {
      cut_date,
      cut_number: cutNumber,
      created_by: userId,
      grand_total,
      is_manual
    });
    
    // 💾 INSERTAR CORTE EN BD - ESTRUCTURA COMPLETA Y PROFESIONAL
    const { data: newCut, error: insertError } = await supabase
      .from('cash_cuts')
      .insert([{
        cut_number: cutNumber,
        cut_date,
        cut_time: new Date().toISOString(),
        created_by: userId,
        notes: notes?.trim() || null,
        is_manual,
        
        // POS
        pos_efectivo: parseFloat(pos_efectivo) || 0,
        pos_transferencia: parseFloat(pos_transferencia) || 0,
        pos_debito: parseFloat(pos_debito) || 0,
        pos_credito: parseFloat(pos_credito) || 0,
        pos_mixto: 0,
        pos_total: parseFloat(pos_total) || 0,
        pos_transactions: parseInt(pos_transactions) || 0,
        pos_commissions: 0, // Siempre 0 según requerimiento
        
        // ABONOS ✅ CAMPOS ESPECÍFICOS
        abonos_efectivo: parseFloat(abonos_efectivo) || 0,
        abonos_transferencia: parseFloat(abonos_transferencia) || 0,
        abonos_debito: parseFloat(abonos_debito) || 0,
        abonos_credito: parseFloat(abonos_credito) || 0,
        abonos_mixto: 0,
        abonos_total: parseFloat(abonos_total) || 0,
        abonos_transactions: parseInt(abonos_transactions) || 0,
        abonos_commissions: 0, // Siempre 0 según requerimiento
        
        // MEMBERSHIPS
        membership_efectivo: parseFloat(membership_efectivo) || 0,
        membership_transferencia: parseFloat(membership_transferencia) || 0,
        membership_debito: parseFloat(membership_debito) || 0,
        membership_credito: parseFloat(membership_credito) || 0,
        membership_mixto: 0,
        membership_total: parseFloat(membership_total) || 0,
        membership_transactions: parseInt(membership_transactions) || 0,
        membership_commissions: 0, // Siempre 0 según requerimiento
        
        // TOTALES
        total_efectivo: parseFloat(total_efectivo) || 0,
        total_transferencia: parseFloat(total_transferencia) || 0,
        total_debito: parseFloat(total_debito) || 0,
        total_credito: parseFloat(total_credito) || 0,
        total_mixto: 0,
        grand_total: parseFloat(grand_total) || 0,
        total_transactions: parseInt(total_transactions) || 0,
        total_commissions: 0, // Siempre 0 según requerimiento
        net_amount: parseFloat(grand_total) || 0,
        expenses_amount: parseFloat(expenses_amount) || 0,
        final_balance: parseFloat(final_balance) || 0,
        
        // ESTADO
        status: 'closed',
        closed_at: new Date().toISOString(),
        closed_by: userId,
        updated_at: new Date().toISOString(),
        updated_by: userId
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
