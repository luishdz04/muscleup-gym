import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();
    
    const supabase = createServerSupabaseClient();

    // Generar número de corte único
    const cutDate = new Date(formData.cut_date);
    const dateStr = cutDate.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = new Date().toTimeString().slice(0, 5).replace(':', '');
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

    // Insertar corte en la base de datos
    const { data: cutData, error: cutError } = await supabase
      .from('cash_cuts')
      .insert({
        cut_number,
        cut_date: formData.cut_date,
        cut_time: new Date().toISOString(),
        
        // POS data
        pos_efectivo: formData.pos_efectivo,
        pos_transferencia: formData.pos_transferencia,
        pos_debito: formData.pos_debito,
        pos_credito: formData.pos_credito,
        pos_mixto: formData.pos_mixto,
        pos_total: formData.pos_total,
        pos_transactions: formData.pos_transactions,
        pos_commissions: formData.pos_commissions,
        
        // Membership data
        membership_efectivo: formData.membership_efectivo,
        membership_transferencia: formData.membership_transferencia,
        membership_debito: formData.membership_debito,
        membership_credito: formData.membership_credito,
        membership_mixto: formData.membership_mixto,
        membership_total: formData.membership_total,
        membership_transactions: formData.membership_transactions,
        membership_commissions: formData.membership_commissions,
        
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
        is_manual: false,
        notes: formData.notes,
        created_by: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', // ID del usuario actual
        updated_by: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        closed_at: new Date().toISOString(),
        closed_by: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
      })
      .select()
      .single();

    if (cutError) {
      console.error('Error creando corte:', cutError);
      throw cutError;
    }

    return NextResponse.json({
      success: true,
      message: 'Corte creado exitosamente',
      cut: cutData,
      cut_number
    });

  } catch (error) {
    console.error('Error en API de creación de corte:', error);
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
