import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parámetros de paginación
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    
    // Parámetros de filtros
    const search = searchParams.get('search') || '';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const status = searchParams.get('status');
    const isManual = searchParams.get('isManual');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    console.log('📊 API: Consultando historial de cortes', {
      page, limit, search, dateFrom, dateTo, status, isManual, sortBy, sortOrder
    });

    // ✅ USAR CLIENTE SERVIDOR CORRECTO
    const supabase = createServerSupabaseClient();

    // Construir query base
    let query = supabase
      .from('cuts')
      .select(`
        *,
        users!cuts_created_by_fkey(first_name, last_name, username)
      `);

    // Aplicar filtros
    if (search) {
      query = query.or(`cut_number.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    if (dateFrom) {
      query = query.gte('cut_date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('cut_date', dateTo);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (isManual && isManual !== 'all') {
      query = query.eq('is_manual', isManual === 'true');
    }

    // Aplicar ordenamiento
    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending });

    // Aplicar paginación
    query = query.range(offset, offset + limit - 1);

    const { data: cuts, error: cutsError, count } = await query;

    if (cutsError) {
      console.error('❌ Error consultando cortes:', cutsError);
      return NextResponse.json({
        success: false,
        error: 'Error al consultar cortes',
        details: process.env.NODE_ENV === 'development' ? cutsError.message : undefined
      }, { status: 500 });
    }

    // Formatear datos con nombre del creador
    const formattedCuts = cuts?.map(cut => ({
      ...cut,
      creator_name: cut.users 
        ? `${cut.users.first_name || ''} ${cut.users.last_name || ''}`.trim() || cut.users.username
        : 'Usuario',
      // Convertir valores numéricos para evitar errores
      grand_total: parseFloat(cut.grand_total || '0'),
      expenses_amount: parseFloat(cut.expenses_amount || '0'),
      final_balance: parseFloat(cut.final_balance || '0'),
      total_transactions: parseInt(cut.total_transactions || '0')
    })) || [];

    // Obtener estadísticas generales (query separada para evitar errores)
    let stats = {
      totalCuts: formattedCuts.length,
      totalAmount: 0,
      manualCuts: 0,
      automaticCuts: 0
    };

    try {
      const { data: statsData, error: statsError } = await supabase
        .from('cuts')
        .select('grand_total, is_manual');

      if (!statsError && statsData) {
        stats = {
          totalCuts: statsData.length,
          totalAmount: statsData.reduce((sum, cut) => sum + parseFloat(cut.grand_total || '0'), 0),
          manualCuts: statsData.filter(cut => cut.is_manual).length,
          automaticCuts: statsData.filter(cut => !cut.is_manual).length
        };
      }
    } catch (statsError) {
      console.warn('⚠️ Error consultando estadísticas (no crítico):', statsError);
    }

    console.log('✅ Historial consultado:', formattedCuts.length, 'cortes');

    return NextResponse.json({
      success: true,
      cuts: formattedCuts,
      pagination: {
        page,
        limit,
        total: count || formattedCuts.length,
        totalPages: Math.ceil((count || formattedCuts.length) / limit)
      },
      stats
    });

  } catch (error: any) {
    console.error('❌ Error en API historial cortes:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al consultar el historial de cortes',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
