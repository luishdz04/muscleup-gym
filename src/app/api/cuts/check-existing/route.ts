import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const purpose = searchParams.get('purpose') ?? 'general';

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          error: 'Fecha es requerida'
        },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    const { data: existingCut, error } = await supabase
      .from('cash_cuts')
      .select(
        `id,
         cut_number,
         status,
         cut_date,
         expenses_amount,
         grand_total,
         final_balance,
         created_at,
         updated_at`
      )
      .eq('cut_date', date)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error verificando corte existente:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Error verificando corte existente',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      purpose,
      exists: Boolean(existingCut),
      cut: existingCut ?? null
    });
  } catch (error: any) {
    console.error('Error en API check-existing:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error verificando corte existente',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
