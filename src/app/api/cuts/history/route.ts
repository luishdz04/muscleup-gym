import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
        error: 'Error al consultar cortes'
      }, { status: 500 });
    }

    // Formatear datos con nombre del creador
    const formattedCuts = cuts?.map(cut => ({
      ...cut,
      creator_name: cut.users 
        ? `${cut.users.first_name || ''} ${cut.users.last_name || ''}`.trim() || cut.users.username
        : 'Usuario'
    })) || [];

    // Obtener estadísticas generales
    const { data: statsData, error: statsError } = await supabase
      .from('cuts')
      .select('grand_total, is_manual')
      .then(async (result) => {
        if (result.error) return result;
        
        const data = result.data || [];
        const stats = {
          totalCuts: data.length,
          totalAmount: data.reduce((sum, cut) => sum + (parseFloat(cut.grand_total) || 0), 0),
          avgAmount: data.length > 0 ? data.reduce((sum, cut) => sum + (parseFloat(cut.grand_total) || 0), 0) / data.length : 0,
          manualCuts: data.filter(cut => cut.is_manual).length,
          automaticCuts: data.filter(cut => !cut.is_manual).length
        };
        
        return { data: stats, error: null };
      });

    const stats = statsData || {
      totalCuts: 0,
      totalAmount: 0,
      avgAmount: 0,
      manualCuts: 0,
      automaticCuts: 0
    };

    const totalPages = count ? Math.ceil(count / limit) : 1;

    console.log('✅ Historial de cortes obtenido:', {
      cuts: formattedCuts.length,
      total: count,
      pages: totalPages,
      stats
    });

    return NextResponse.json({
      success: true,
      cuts: formattedCuts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      },
      stats
    });

  } catch (error) {
    console.error('❌ Error en API historial de cortes:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al obtener el historial de cortes'
    }, { status: 500 });
  }
}
