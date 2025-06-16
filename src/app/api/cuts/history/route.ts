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

    const supabase = createServerSupabaseClient();

    console.log('🔍 Verificando conexión a Supabase...');
    
    // ✅ QUERY CORREGIDA CON VALIDACIÓN DE CAMPOS
    let query = supabase
      .from('cash_cuts')
      .select(`
        *,
        users!cash_cuts_created_by_fkey(id, first_name, last_name, username, name, email, firstName, lastName)
      `, { count: 'exact' });

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

    // ✅ FORMATEO ROBUSTO DE DATOS
    const formattedCuts = (cuts || []).map(cut => {
      let creator_name = 'Usuario';
      
      if (cut.users) {
        if (cut.users.name) {
          creator_name = cut.users.name;
        } else if (cut.users.first_name || cut.users.last_name) {
          creator_name = `${cut.users.first_name || ''} ${cut.users.last_name || ''}`.trim();
        } else if (cut.users.firstName || cut.users.lastName) {
          creator_name = `${cut.users.firstName || ''} ${cut.users.lastName || ''}`.trim();
        } else if (cut.users.username) {
          creator_name = cut.users.username;
        } else if (cut.users.email) {
          creator_name = cut.users.email;
        }
      }

      return {
        ...cut,
        creator_name,
        grand_total: parseFloat(cut.grand_total || '0'),
        expenses_amount: parseFloat(cut.expenses_amount || '0'),
        final_balance: parseFloat(cut.final_balance || '0'),
        total_transactions: parseInt(cut.total_transactions || '0'),
        pos_total: parseFloat(cut.pos_total || '0'),
        abonos_total: parseFloat(cut.abonos_total || '0'),
        membership_total: parseFloat(cut.membership_total || '0')
      };
    });

    // Obtener estadísticas
    let stats = {
      totalCuts: 0,
      totalAmount: 0,
      avgAmount: 0,
      manualCuts: 0,
      automaticCuts: 0
    };

    try {
      const { data: statsData } = await supabase
        .from('cash_cuts')
        .select('grand_total, is_manual');

      if (statsData && statsData.length > 0) {
        const totalAmount = statsData.reduce((sum, cut) => sum + parseFloat(cut.grand_total || '0'), 0);
        stats = {
          totalCuts: statsData.length,
          totalAmount: totalAmount,
          avgAmount: totalAmount / statsData.length,
          manualCuts: statsData.filter(cut => cut.is_manual).length,
          automaticCuts: statsData.filter(cut => !cut.is_manual).length
        };
      }
    } catch (statsError) {
      console.warn('⚠️ Error consultando estadísticas:', statsError);
    }

    console.log('✅ Historial consultado:', formattedCuts.length, 'cortes');

    return NextResponse.json({
      success: true,
      cuts: formattedCuts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
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
