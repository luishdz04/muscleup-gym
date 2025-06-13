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
    
    // 🔍 VERIFICAR SI EXISTE CORTE PARA ESA FECHA
    const { data: existingCuts, error } = await supabase
      .from('daily_cuts')
      .select('id, cut_name, created_at')
      .eq('cut_date', date)
      .limit(1);

    if (error) {
      console.error('Error verificando cortes existentes:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      exists: existingCuts && existingCuts.length > 0,
      existing_cut: existingCuts?.[0] || null
    });

  } catch (error) {
    console.error('Error en API check-exists:', error);
    return NextResponse.json(
      { error: 'Error al verificar cortes existentes', success: false },
      { status: 500 }
    );
  }
}
