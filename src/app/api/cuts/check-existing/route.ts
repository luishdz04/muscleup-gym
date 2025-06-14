import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const purpose = searchParams.get('purpose'); // ✅ NUEVO: para egresos
    
    console.log('🔍 Verificando corte existente:', { date, purpose });
    
    if (!date) {
      return NextResponse.json(
        { error: 'Fecha es requerida', success: false },
        { status: 400 }
      );
    }
    
    const supabase = createServerSupabaseClient();
    
    // ✅ BUSCAR CORTE EXISTENTE
    const { data: existingCut, error: cutError } = await supabase
      .from('cash_cuts')
      .select(`
        id,
        cut_number,
        cut_date,
        expenses_amount,
        grand_total,
        final_balance,
        status,
        created_at
      `)
      .eq('cut_date', date)
      .single();
    
    if (cutError && cutError.code !== 'PGRST116') {
      console.error('❌ Error consultando corte:', cutError);
      return NextResponse.json(
        { 
          error: 'Error consultando corte existente', 
          details: cutError.message,
          success: false 
        },
        { status: 500 }
      );
    }
    
    const exists = !!existingCut;
    
    console.log('📊 Resultado check-existing:', {
      exists,
      cut_id: existingCut?.id,
      purpose,
      date
    });
    
    // ✅ RESPUESTA ESPECÍFICA PARA EGRESOS
    if (purpose === 'expenses') {
      return NextResponse.json({
        success: true,
        exists,
        date,
        purpose: 'expenses',
        cut: exists ? {
          id: existingCut.id,
          cut_number: existingCut.cut_number,
          expenses_amount: existingCut.expenses_amount || 0,
          grand_total: existingCut.grand_total || 0,
          final_balance: existingCut.final_balance || 0,
          status: existingCut.status
        } : null
      });
    }
    
    // ✅ RESPUESTA GENERAL (para cortes)
    return NextResponse.json({
      success: true,
      exists,
      date,
      cut: exists ? existingCut : null
    });
    
  } catch (error: any) {
    console.error('💥 Error en API check-existing:', error);
    return NextResponse.json(
      { 
        error: 'Error verificando corte existente', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        success: false 
      },
      { status: 500 }
    );
  }
}
