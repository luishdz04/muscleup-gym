import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const purpose = searchParams.get('purpose'); // 'expenses' o 'cuts'

    if (!date) {
      return NextResponse.json(
        { error: 'Fecha requerida', success: false },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    
    // 🔍 CONSULTA AMPLIADA PARA AMBOS PROPÓSITOS
    const selectFields = purpose === 'expenses' 
      ? `
        id,
        cut_number,
        cut_date,
        expenses_amount,
        grand_total,
        final_balance,
        status,
        created_at,
        created_by,
        is_manual,
        cut_time,
        Users!created_by (
          username,
          first_name,
          last_name
        )
      `
      : 'id, cut_number, status, created_at, created_by, is_manual, cut_time';
    
    const { data: existingCuts, error } = await supabase
      .from('cash_cuts')
      .select(selectFields)
      .eq('cut_date', date)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error verificando cortes existentes:', error);
      throw error;
    }

    const existingCut = existingCuts && existingCuts.length > 0 ? existingCuts[0] : null;

    // 🇲🇽 CONVERTIR FECHAS A HORA MÉXICO PARA MOSTRAR
    if (existingCut && existingCut.cut_time) {
      const mexicoTime = new Date(new Date(existingCut.cut_time).getTime() - (6 * 60 * 60 * 1000));
      existingCut.cut_time_mexico = mexicoTime.toLocaleString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }

    // ✅ PROCESAR DATOS PARA EGRESOS
    if (purpose === 'expenses' && existingCut && existingCut.Users) {
      existingCut.user_name = existingCut.Users ? 
        `${existingCut.Users.first_name || ''} ${existingCut.Users.last_name || ''}`.trim() || 
        existingCut.Users.username : 
        'Usuario desconocido';
    }

    // 📋 RESPUESTA COMPATIBLE CON AMBOS USOS
    const response = {
      success: true,
      exists: !!existingCut,
      existing_cut: existingCut,
      can_create_new: true, // Siempre permitir crear nuevos cortes
      message: existingCut 
        ? `Ya existe corte: ${existingCut.cut_number} (${existingCut.is_manual ? 'Manual' : 'Automático'}) - ${existingCut.cut_time_mexico || 'Sin fecha'}`
        : 'No hay cortes para esta fecha'
    };

    // ✅ RESPUESTA ESPECÍFICA PARA EGRESOS
    if (purpose === 'expenses') {
      return NextResponse.json({
        ...response,
        date,
        cut_exists: !!existingCut,
        cut: existingCut // Alias para compatibilidad con página de egresos
      });
    }

    // ✅ RESPUESTA ORIGINAL PARA CORTES
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error en API check-exists:', error);
    return NextResponse.json(
      { error: 'Error al verificar cortes existentes', success: false },
      { status: 500 }
    );
  }
}
