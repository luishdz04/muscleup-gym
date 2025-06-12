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

    const { data: existingCut, error } = await supabase
      .from('cash_cuts')
      .select('*')
      .eq('cut_date', date)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error verificando corte existente:', error);
      throw error;
    }

    console.log('✅ Verificación de corte existente:', {
      date,
      exists: !!existingCut,
      cut_number: existingCut?.cut_number
    });

    return NextResponse.json({
      success: true,
      exists: !!existingCut,
      cut: existingCut
    });

  } catch (error) {
    console.error('💥 Error en API check-existing:', error);
    return NextResponse.json(
      { error: 'Error al verificar corte existente', success: false },
      { status: 500 }
    );
  }
}
