import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// 🇲🇽 FUNCIÓN PARA CREAR TIMESTAMP MÉXICO
function createMexicoTimestamp(): string {
  const now = new Date();
  const mexicoTime = new Date(now.getTime() - (6 * 60 * 60 * 1000));
  return mexicoTime.toISOString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      cut_date,
      notes,
      is_manual = false,
      created_at_mexico, // ✅ RECIBIR HORA MÉXICO DEL FRONTEND
      
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
    
    // ✅ OBTENER USUARIO AUTENTICADO O USAR HARDCODED COMO FALLBACK
    let userId;
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log('⚠️ No se pudo obtener usuario autenticado, usando usuario hardcodeado');
        // 🔧 USAR USUARIO ESPECÍFICO COMO FALLBACK (luishdz04)
        const { data: hardcodedUser, error: userError } = await supabase
          .from('Users')
          .select('id')
          .eq('email', 'luis@muscleup.com') // o el email que uses
          .single();
        
        if (userError || !hardcodedUser) {
          // Si no encuentra el usuario, buscar por cualquier admin
          const { data: anyAdmin, error: adminError } = await supabase
            .from('Users')
            .select('id')
            .eq('rol', 'admin')
            .limit(1)
            .single();
          
          if (adminError || !anyAdmin) {
            return NextResponse.json(
              { error: 'No se pudo determinar el usuario para crear el corte', success: false },
              { status: 401 }
            );
          }
          userId = anyAdmin.id;
        } else {
          userId = hardcodedUser.id;
        }
      } else {
        userId = user.id;
      }
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      return NextResponse.json(
        { error: 'Error de autenticación', success: false },
        { status: 401 }
      );
    }
    
    // 🇲🇽 USAR HORA MÉXICO PARA TODO
    const mexicoTimestamp = created_at_mexico || createMexicoTimestamp();
    
    // 🔢 GENERAR NÚMERO DE CORTE CON HORA MÉXICO
    const mexicoDate = new Date(mexicoTimestamp);
    const dateStr = mexicoDate.toISOString().split('T')[0].replace(/-/g, '');
    const timestamp = mexicoDate.getTime();
    const cutNumber = `CORTE-${dateStr}-${timestamp}`;
    
    console.log('📊 Creando corte con hora México:', {
      cut_date,
      cut_number: cutNumber,
      created_by: userId,
      mexico_timestamp: mexicoTimestamp,
      grand_total,
      is_manual
    });
    
    // 💾 INSERTAR CORTE EN BD CON HORA MÉXICO
    const { data: newCut, error: insertError } = await supabase
      .from('cash_cuts')
      .insert([{
        cut_number: cutNumber,
        cut_date,
        cut_time: mexicoTimestamp, // ✅ HORA MÉXICO
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
        pos_commissions: 0,
        
        // ABONOS ✅ CAMPOS ESPECÍFICOS
        abonos_efectivo: parseFloat(abonos_efectivo) || 0,
        abonos_transferencia: parseFloat(abonos_transferencia) || 0,
        abonos_debito: parseFloat(abonos_debito) || 0,
        abonos_credito: parseFloat(abonos_credito) || 0,
        abonos_mixto: 0,
        abonos_total: parseFloat(abonos_total) || 0,
        abonos_transactions: parseInt(abonos_transactions) || 0,
        abonos_commissions: 0,
        
        // MEMBERSHIPS
        membership_efectivo: parseFloat(membership_efectivo) || 0,
        membership_transferencia: parseFloat(membership_transferencia) || 0,
        membership_debito: parseFloat(membership_debito) || 0,
        membership_credito: parseFloat(membership_credito) || 0,
        membership_mixto: 0,
        membership_total: parseFloat(membership_total) || 0,
        membership_transactions: parseInt(membership_transactions) || 0,
        membership_commissions: 0,
        
        // TOTALES
        total_efectivo: parseFloat(total_efectivo) || 0,
        total_transferencia: parseFloat(total_transferencia) || 0,
        total_debito: parseFloat(total_debito) || 0,
        total_credito: parseFloat(total_credito) || 0,
        total_mixto: 0,
        grand_total: parseFloat(grand_total) || 0,
        total_transactions: parseInt(total_transactions) || 0,
        total_commissions: 0,
        net_amount: parseFloat(grand_total) || 0,
        expenses_amount: parseFloat(expenses_amount) || 0,
        final_balance: parseFloat(final_balance) || 0,
        
        // ESTADO CON HORA MÉXICO
        status: 'closed',
        closed_at: mexicoTimestamp, // ✅ HORA MÉXICO
        closed_by: userId,
        created_at: mexicoTimestamp, // ✅ HORA MÉXICO
        updated_at: mexicoTimestamp, // ✅ HORA MÉXICO
        updated_by: userId
      }])
      .select()
      .single();

    if (insertError) {
      console.error('💥 Error insertando corte:', insertError);
      
      // 🔍 DETALLE DEL ERROR PARA DEBUG
      if (insertError.code === '23503') {
        console.error('❌ Error de foreign key - Usuario no válido:', userId);
        return NextResponse.json(
          { error: 'Usuario no válido para crear corte', success: false },
          { status: 400 }
        );
      }
      
      throw insertError;
    }

    console.log('✅ Corte creado exitosamente con hora México:', newCut);

    return NextResponse.json({
      success: true,
      message: `Corte creado exitosamente: ${cutNumber}`,
      cut_id: newCut.id,
      cut_number: cutNumber,
      mexico_time: mexicoTimestamp,
      cut: newCut
    });

  } catch (error) {
    console.error('💥 Error en API create cut:', error);
    return NextResponse.json(
      { 
        error: 'Error al crear el corte', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        success: false 
      },
      { status: 500 }
    );
  }
}
