import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const searchParams = request.nextUrl.searchParams;

    // Parámetros de búsqueda
    const status = searchParams.get('status'); // active, inactive, expired
    const endDate = searchParams.get('end_date'); // YYYY-MM-DD
    const excludePaymentType = searchParams.get('exclude_payment_type'); // visit

    // Construir query (SIN modality porque no existe en membership_plans)
    let query = supabase
      .from('user_memberships')
      .select(`
        id,
        start_date,
        end_date,
        status,
        payment_type,
        Users!user_memberships_userid_fkey (
          id,
          firstName,
          lastName,
          email,
          whatsapp
        ),
        membership_plans (
          id,
          name,
          description
        )
      `)
      .order('end_date', { ascending: true });

    // Aplicar filtros
    if (status) {
      query = query.eq('status', status);
    }

    if (endDate) {
      query = query.eq('end_date', endDate);
    }

    if (excludePaymentType) {
      query = query.not('payment_type', 'eq', excludePaymentType);
    }

    // Ejecutar query
    const { data: memberships, error } = await query;

    if (error) {
      console.error('Error fetching memberships:', error);
      return NextResponse.json(
        { error: 'Error al obtener membresías', details: error.message },
        { status: 500 }
      );
    }

    // Transformar data para mejor legibilidad (sin modality que no existe)
    const transformedMemberships = memberships?.map((m: any) => ({
      id: m.id,
      start_date: m.start_date,
      end_date: m.end_date,
      status: m.status,
      payment_type: m.payment_type,
      user: {
        id: m.Users?.id,
        firstName: m.Users?.firstName || '',
        lastName: m.Users?.lastName || '',
        email: m.Users?.email || '',
        whatsapp: m.Users?.whatsapp || '',
      },
      plan: {
        id: m.membership_plans?.id,
        name: m.membership_plans?.name || 'Sin plan',
        description: m.membership_plans?.description || '',
      },
    }));

    return NextResponse.json({
      success: true,
      count: transformedMemberships?.length || 0,
      memberships: transformedMemberships || [],
    });
  } catch (error) {
    console.error('Error in user-memberships API:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
