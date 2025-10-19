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

    // Get user memberships with payment details
    const { data: memberships, error: membershipsError } = await supabase
      .from('user_memberships')
      .select(`
        id,
        payment_type,
        total_amount,
        inscription_amount,
        paid_amount,
        pending_amount,
        start_date,
        end_date,
        status,
        created_at,
        plan:membership_plans(name)
      `)
      .eq('userid', user.id)
      .order('created_at', { ascending: false });

    if (membershipsError) {
      console.error('❌ Error fetching memberships:', membershipsError);
      return NextResponse.json(
        { error: 'Error al obtener membresías', details: membershipsError.message },
        { status: 500 }
      );
    }

    // Get payment details for each membership
    const membershipIds = memberships?.map(m => m.id) || [];

    const { data: paymentDetails, error: paymentsError } = await supabase
      .from('membership_payment_details')
      .select('*')
      .in('membership_id', membershipIds)
      .order('created_at', { ascending: false });

    if (paymentsError) {
      console.error('❌ Error fetching payment details:', paymentsError);
      return NextResponse.json(
        { error: 'Error al obtener detalles de pago', details: paymentsError.message },
        { status: 500 }
      );
    }

    // Combine data
    const paymentsWithMemberships = paymentDetails?.map(payment => {
      const membership = memberships?.find(m => m.id === payment.membership_id);
      return {
        ...payment,
        membership
      };
    }) || [];

    // Calculate statistics
    const currentYear = new Date().getFullYear();
    const totalPaidThisYear = paymentsWithMemberships
      .filter(p => new Date(p.created_at).getFullYear() === currentYear)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalPayments = paymentsWithMemberships.length;

    // Get next payment (next membership end date)
    const activeMemberships = memberships?.filter(m => m.status === 'active') || [];
    const nextPaymentDate = activeMemberships.length > 0
      ? activeMemberships.reduce((earliest, m) => {
          const endDate = new Date(m.end_date);
          return !earliest || endDate < earliest ? endDate : earliest;
        }, null as Date | null)
      : null;

    return NextResponse.json({
      payments: paymentsWithMemberships,
      stats: {
        totalPaidThisYear,
        totalPayments,
        nextPaymentDate: nextPaymentDate?.toISOString() || null
      }
    });

  } catch (error) {
    console.error('❌ Error in GET /api/users/payments:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
