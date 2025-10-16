import { createRouteHandlerClient } from '@/lib/supabase/route-handler';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(request);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const payment = searchParams.get('payment') || 'all';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    // Construir query
    let query = supabase
      .from('sales')
      .select(`
        *,
        customer:Users!sales_customer_id_fkey(firstName, lastName, email),
        cashier:Users!sales_cashier_id_fkey(firstName, lastName),
        sale_items(*),
        sale_payment_details(*)
      `, { count: 'exact' })
      .eq('sale_type', 'sale')
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (search.trim()) {
      query = query.or(`sale_number.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (payment !== 'all') {
      query = query.eq('payment_status', payment);
    }

    if (dateFrom) {
      query = query.gte('created_at', `${dateFrom}T00:00:00`);
    }

    if (dateTo) {
      query = query.lte('created_at', `${dateTo}T23:59:59`);
    }

    // Paginación
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error('Error fetching sales:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: data || [],
      count: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    });

  } catch (error) {
    console.error('Sales API error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
