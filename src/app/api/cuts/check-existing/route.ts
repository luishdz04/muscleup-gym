import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Fecha requerida', success: false },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    
    // 🔍 VERIFICAR SI EXISTE CORTE PARA ESA FECHA - TABLA CORREGIDA
    const { data: existingCuts, error } = await supabase
      .from('cash_cuts')
      .select('id, cut_number, status, created_at, created_by, is_manual')
      .eq('cut_date', date)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error verificando cortes existentes:', error);
      throw error;
    }

    const existingCut = existingCuts && existingCuts.length > 0 ? existingCuts[0] : null;

    return NextResponse.json({
      success: true,
      exists: !!existingCut,
      existing_cut: existingCut,
      can_create_new: true, // Siempre permitir crear nuevos cortes
      message: existingCut 
        ? `Ya existe corte: ${existingCut.cut_number} (${existingCut.is_manual ? 'Manual' : 'Automático'})`
        : 'No hay cortes para esta fecha'
    });

  } catch (error) {
    console.error('Error en API check-exists:', error);
    return NextResponse.json(
      { error: 'Error al verificar cortes existentes', success: false },
      { status: 500 }
    );
  }
}
