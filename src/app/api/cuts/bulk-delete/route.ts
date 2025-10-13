import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// POST - Eliminar múltiples cortes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Se requiere un array de IDs válido'
      }, { status: 400 });
    }

    console.log('🗑️ API: Eliminando cortes masivamente:', ids.length, 'cortes');
    
    const supabase = createServerSupabaseClient();
    
    // Verificar que los cortes existen
    const { data: existingCuts, error: checkError } = await supabase
      .from('cash_cuts')
      .select('id, cut_number')
      .in('id', ids);
      
    if (checkError) {
      console.error('❌ Error verificando cortes:', checkError);
      return NextResponse.json({
        success: false,
        error: 'Error al verificar los cortes',
        details: process.env.NODE_ENV === 'development' ? checkError.message : undefined
      }, { status: 500 });
    }

    if (!existingCuts || existingCuts.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No se encontraron cortes para eliminar'
      }, { status: 404 });
    }

    // Eliminar los cortes
    const { error: deleteError } = await supabase
      .from('cash_cuts')
      .delete()
      .in('id', ids);
      
    if (deleteError) {
      console.error('❌ Error eliminando cortes:', deleteError);
      return NextResponse.json({
        success: false,
        error: 'Error al eliminar los cortes',
        details: process.env.NODE_ENV === 'development' ? deleteError.message : undefined
      }, { status: 500 });
    }
    
    console.log('✅ Cortes eliminados exitosamente:', existingCuts.length);
    
    return NextResponse.json({
      success: true,
      message: `${existingCuts.length} corte(s) eliminado(s) exitosamente`,
      deletedCount: existingCuts.length
    });
    
  } catch (error: any) {
    console.error('❌ Error en API eliminar cortes masivamente:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al eliminar los cortes',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
