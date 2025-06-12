import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();
    
    console.log('📊 Creando corte con datos:', {
      date: formData.cut_date,
      total_pos: formData.pos_efectivo + formData.pos_transferencia + formData.pos_debito + formData.pos_credito + formData.pos_mixto,
      total_memberships: formData.membership_efectivo + formData.membership_transferencia + formData.membership_debito + formData.membership_credito + formData.membership_mixto,
      total_abonos: formData.abonos_efectivo + formData.abonos_transferencia + formData.abonos_debito + formData.abonos_credito + formData.abonos_mixto,
      expenses: formData.expenses_amount
    });
    
    const supabase = createServerSupabaseClient();

    // Generar número de corte único con timestamp
    const now = new Date();
    const monterreyTime = new Date(now.getTime() - (6 * 60 * 60 * 1000)); // UTC-6
    const cutDate = new Date(formData.cut_date);
    const dateStr = cutDate.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = monterreyTime.toTimeString().slice(0, 8).replace(/:/g, '');
    const cut_number = `CUT${dateStr}${timeStr}`;

    // Calcular totales consolidados
    const total_efectivo = formData.pos_efectivo + formData.membership_efectivo + formData.abonos_efectivo;
    const total_transferencia = formData.pos_transferencia + formData.membership_transferencia + formData.abonos_transferencia;
    const total_debito = formData.pos_debito + formData.membership_debito + formData.abonos_debito;
    const total_credito = formData.pos_credito + formData.membership_credito + formData.abonos_credito;
    const total_mixto = formData.pos_mixto + formData.membership_mixto + formData.abonos_mixto;
    const grand_total = total_efectivo + total_transferencia + total_debito + total_credito + total_mixto;
    const total_transactions = formData.pos_transactions + formData.membership_transactions + formData.abonos_transactions;
    const total_commissions = formData.pos_commissions + formData.membership_commissions + formData.abonos_commissions;
    const net_amount = grand_total - total_commissions;
    const final_balance = net_amount - formData.expenses_amount;

    // Validar que no haya campos negativos críticos
    if (grand_total < 0 || total_transactions < 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Los valores de total y transacciones no pueden ser negativos'
        },
        { status: 400 }
      );
    }

    // Insertar corte en la base de datos
    const { data: cutData, error: cutError } = await supabase
      .from('cash_cuts')
      .insert({
        cut_number,
        cut_date: formData.cut_date,
        cut_time: monterreyTime.toISOString(),
        
        // POS data
        pos_efectivo: formData.pos_efectivo,
        pos_transferencia: formData.pos_transferencia,
        pos_debito: formData.pos_debito,
        pos_credito: formData.pos_credito,
        pos_mixto: formData.pos_mixto,
        pos_total: formData.pos_efectivo + formData.pos_transferencia + formData.pos_debito + formData.pos_credito + formData.pos_mixto,
        pos_transactions: formData.pos_transactions,
        pos_commissions: formData.pos_commissions,
        
        // Membership data
        membership_efectivo: formData.membership_efectivo,
        membership_transferencia: formData.membership_transferencia,
        membership_debito: formData.membership_debito,
        membership_credito: formData.membership_credito,
        membership_mixto: formData.membership_mixto,
        membership_total: formData.membership_efectivo + formData.membership_transferencia + formData.membership_debito + formData.membership_credito + formData.membership_mixto,
        membership_transactions: formData.membership_transactions,
        membership_commissions: formData.membership_commissions,
        
        // Abonos data
        abonos_efectivo: formData.abonos_efectivo,
        abonos_transferencia: formData.abonos_transferencia,
        abonos_debito: formData.abonos_debito,
        abonos_credito: formData.abonos_credito,
        abonos_mixto: formData.abonos_mixto,
        abonos_total: formData.abonos_efectivo + formData.abonos_transferencia + formData.abonos_debito + formData.abonos_credito + formData.abonos_mixto,
        abonos_transactions: formData.abonos_transactions,
        abonos_commissions: formData.abonos_commissions,
        
        // Totals
        total_efectivo,
        total_transferencia,
        total_debito,
        total_credito,
        total_mixto,
        grand_total,
        total_transactions,
        total_commissions,
        net_amount,
        expenses_amount: formData.expenses_amount,
        final_balance,
        
        // Status and metadata
        status: 'closed',
        is_manual: true, // Marcamos como manual porque fue creado desde el formulario
        notes: formData.notes || '',
        created_by: formData.user_id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        updated_by: formData.user_id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        closed_at: monterreyTime.toISOString(),
        closed_by: formData.user_id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
      })
      .select()
      .single();

    if (cutError) {
      console.error('💥 Error creando corte:', cutError);
      throw cutError;
    }

    console.log('✅ Corte creado exitosamente:', {
      cut_number,
      date: formData.cut_date,
      grand_total,
      final_balance,
      transactions: total_transactions
    });

    return NextResponse.json({
      success: true,
      message: 'Corte creado exitosamente',
      cut: cutData,
      cut_number,
      final_balance,
      summary: {
        grand_total,
        total_commissions,
        expenses: formData.expenses_amount,
        final_balance,
        transactions: total_transactions
      }
    });

  } catch (error) {
    console.error('💥 Error en API de creación de corte:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al crear el corte de caja',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
