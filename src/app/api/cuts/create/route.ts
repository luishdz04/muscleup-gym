import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      cut_date,
      cut_name,
      created_by,
      observations,
      total_pos_amount,
      total_memberships_amount,
      total_abonos_amount,
      total_income,
      total_commissions,
      net_amount,
      efectivo_total,
      transferencia_total,
      debito_total,
      credito_total,
      total_transactions,
      pos_transactions,
      membership_transactions,
      abono_transactions,
      timezone_info
    } = body;

    // ✅ VALIDACIONES
    if (!cut_date || !cut_name || !created_by) {
      return NextResponse.json(
        { error: 'Campos requeridos: cut_date, cut_name, created_by', success: false },
        { status: 400 }
      );
    }

    console.log('📊 Creando corte:', {
      cut_date,
      cut_name,
      created_by,
      total_income,
      total_transactions
    });

    const supabase = createServerSupabaseClient();
    
    // 💾 INSERTAR CORTE EN BD
    const { data: newCut, error: insertError } = await supabase
      .from('daily_cuts')
      .insert([{
        cut_date,
        cut_name,
        created_by,
        observations: observations || null,
        total_pos_amount: total_pos_amount || 0,
        total_memberships_amount: total_memberships_amount || 0,
        total_abonos_amount: total_abonos_amount || 0,
        total_income: total_income || 0,
        total_commissions: total_commissions || 0,
        net_amount: net_amount || 0,
        efectivo_total: efectivo_total || 0,
        transferencia_total: transferencia_total || 0,
        debito_total: debito_total || 0,
        credito_total: credito_total || 0,
        total_transactions: total_transactions || 0,
        pos_transactions: pos_transactions || 0,
        membership_transactions: membership_transactions || 0,
        abono_transactions: abono_transactions || 0,
        timezone_info: timezone_info || null,
        status: 'completed'
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
      message: 'Corte creado exitosamente',
      cut_id: newCut.id,
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
