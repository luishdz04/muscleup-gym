import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getTodayInMexico, isExpiredDate } from '@/utils/dateUtils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('📊 [API] /api/users/analytics - Iniciando consulta...');

    const supabase = await createServerSupabaseClient();
    const today = getTodayInMexico();

    // Fetch all client users with necessary fields (camelCase column names)
    // Note: bloodType is in emergency_contacts table (separate table)
    const { data: usersData, error: usersError } = await supabase
      .from('Users')
      .select(`
        id,
        firstName,
        lastName,
        email,
        gender,
        createdAt
      `)
      .eq('rol', 'cliente')
      .order('createdAt', { ascending: false });

    if (usersError) {
      console.error('❌ [API] Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Error al obtener usuarios', details: usersError.message },
        { status: 500 }
      );
    }

    console.log(`📊 [API] Usuarios encontrados: ${usersData?.length || 0}`);

    // Fetch emergency contacts to get blood types
    const { data: emergencyContacts, error: emergencyError } = await supabase
      .from('emergency_contacts')
      .select('userId, bloodType');

    if (emergencyError) {
      console.error('❌ [API] Error fetching emergency contacts:', emergencyError);
    }

    console.log(`📊 [API] Contactos de emergencia encontrados: ${emergencyContacts?.length || 0}`);

    // Fetch all active memberships
    const { data: memberships, error: membershipsError } = await supabase
      .from('user_memberships')
      .select('userid, status, end_date')
      .eq('status', 'active');

    if (membershipsError) {
      console.error('❌ [API] Error fetching memberships:', membershipsError);
      return NextResponse.json(
        { error: 'Error al obtener membresías', details: membershipsError.message },
        { status: 500 }
      );
    }

    console.log(`📊 [API] Membresías activas encontradas: ${memberships?.length || 0}`);

    // Helper function to normalize gender values
    const normalizeGender = (gender: string | null): string => {
      if (!gender) return 'No especificado';
      const normalized = gender.toLowerCase().trim();
      if (normalized === 'masculino' || normalized === 'hombre' || normalized === 'm') {
        return 'Masculino';
      }
      if (normalized === 'femenino' || normalized === 'mujer' || normalized === 'f') {
        return 'Femenino';
      }
      return gender; // Return original if doesn't match known patterns
    };

    // Helper function to normalize blood type values
    const normalizeBloodType = (bloodType: string | null): string => {
      if (!bloodType) return 'N/A';
      // Remove spaces and normalize format (e.g., "O +" -> "O+", "o+" -> "O+")
      const normalized = bloodType.replace(/\s+/g, '').toUpperCase();
      // Validate it's a valid blood type format
      if (/^(A|B|AB|O)[+-]$/.test(normalized)) {
        return normalized;
      }
      return bloodType.trim(); // Return trimmed original if doesn't match pattern
    };

    // Enrich users with membership data and blood type
    const enrichedUsers = (usersData || []).map(user => {
      const membership = memberships?.find(m => m.userid === user.id);
      const emergency = emergencyContacts?.find(ec => ec.userId === user.id);

      let membershipStatus: 'active' | 'inactive' | 'expired' = 'inactive';
      if (membership) {
        if (membership.end_date && isExpiredDate(membership.end_date)) {
          membershipStatus = 'expired';
        } else {
          membershipStatus = 'active';
        }
      }

      return {
        userid: user.id,  // Map id to userid for frontend consistency
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        gender: normalizeGender(user.gender),
        blood_type: normalizeBloodType(emergency?.bloodType),
        created_at: user.createdAt,
        membership_status: membershipStatus,
        membership_end_date: membership?.end_date || undefined
      };
    });

    const result = {
      users: enrichedUsers,
      timestamp: new Date().toISOString(),
      summary: {
        total: enrichedUsers.length,
        active: enrichedUsers.filter(u => u.membership_status === 'active').length,
        inactive: enrichedUsers.filter(u => u.membership_status === 'inactive').length,
        expired: enrichedUsers.filter(u => u.membership_status === 'expired').length
      }
    };

    console.log('✅ [API] Datos procesados exitosamente:', result.summary);

    return NextResponse.json(result, { status: 200 });

  } catch (error: unknown) {
    console.error('❌ [API] Error en /api/users/analytics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { error: 'Error interno del servidor', details: errorMessage },
      { status: 500 }
    );
  }
}
