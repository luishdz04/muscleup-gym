import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Obtener el conteo total de usuarios con rol 'cliente'
    const { data: allUsers, error: usersError } = await supabase
      .from('Users')
      .select('id, gender')
      .or('rol.eq.cliente,rol.is.null'); // Clientes o usuarios sin rol asignado

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Error al obtener usuarios', details: usersError.message },
        { status: 500 }
      );
    }

    const totalUsers = allUsers?.length || 0;

    // Obtener usuarios con membresías activas
    const { data: activeMemberships, error: membershipsError } = await supabase
      .from('user_memberships')
      .select('userid, status, end_date')
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString().split('T')[0]);

    if (membershipsError) {
      console.error('❌ Error fetching memberships:', membershipsError);
      return NextResponse.json(
        { error: 'Error al obtener membresías', details: membershipsError.message },
        { status: 500 }
      );
    }

    const activeCount = activeMemberships?.length || 0;
    const inactiveCount = totalUsers - activeCount;

    // Contar usuarios por género
    const genderCounts = {
      male: 0,
      female: 0,
      other: 0
    };

    allUsers?.forEach((user) => {
      const gender = user.gender?.toLowerCase() || '';
      if (gender === 'masculino' || gender === 'male' || gender === 'm') {
        genderCounts.male++;
      } else if (gender === 'femenino' || gender === 'female' || gender === 'f') {
        genderCounts.female++;
      } else {
        genderCounts.other++;
      }
    });

    const stats = {
      memberships: {
        active: activeCount,
        inactive: inactiveCount,
        total: totalUsers
      },
      gender: {
        male: genderCounts.male,
        female: genderCounts.female,
        other: genderCounts.other,
        total: totalUsers
      },
      timestamp: new Date().toISOString()
    };

    console.log('✅ User stats fetched successfully:', stats);

    return NextResponse.json(stats, { status: 200 });

  } catch (error: unknown) {
    console.error('❌ Error in users/stats API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { error: 'Error interno del servidor', details: errorMessage },
      { status: 500 }
    );
  }
}
