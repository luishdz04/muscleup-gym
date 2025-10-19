import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Get user's sales with items
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select(`
        id,
        sale_number,
        sale_type,
        subtotal,
        tax_amount,
        discount_amount,
        coupon_discount,
        total_amount,
        paid_amount,
        pending_amount,
        status,
        payment_status,
        created_at,
        completed_at,
        notes,
        sale_items(
          id,
          product_name,
          product_sku,
          quantity,
          unit_price,
          total_price,
          discount_amount
        ),
        sale_payment_details(
          payment_method,
          amount
        ),
        layaway_status_history(
          id,
          previous_status,
          new_status,
          previous_paid_amount,
          new_paid_amount,
          reason,
          created_at
        )
      `)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    if (salesError) {
      console.error('❌ Error fetching sales:', salesError);
      return NextResponse.json(
        { error: 'Error al obtener compras', details: salesError.message },
        { status: 500 }
      );
    }

    // Calculate statistics
    const currentYear = new Date().getFullYear();
    const totalSpentThisYear = sales
      ?.filter(s => new Date(s.created_at).getFullYear() === currentYear)
      .reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;

    const totalPurchases = sales?.length || 0;

    const totalProducts = sales?.reduce((sum, s) => {
      return sum + (s.sale_items?.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0) || 0);
    }, 0) || 0;

    // Get pending amount (layaways)
    const pendingAmount = sales
      ?.filter(s => s.payment_status === 'partial' || s.payment_status === 'pending')
      .reduce((sum, s) => sum + Number(s.pending_amount), 0) || 0;

    return NextResponse.json({
      purchases: sales || [],
      stats: {
        totalSpentThisYear,
        totalPurchases,
        totalProducts,
        pendingAmount
      }
    });

  } catch (error) {
    console.error('❌ Error in GET /api/users/purchases:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
