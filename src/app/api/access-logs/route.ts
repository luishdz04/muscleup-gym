import { NextRequest, NextResponse } from 'next/server';
import { createAsyncServerSupabaseClient } from '@/lib/supabase/server-async';

export async function GET(request: NextRequest) {
  console.log('🔄 [ACCESS-LOGS] API called - v2');
  try {
    const supabase = await createAsyncServerSupabaseClient();
    const { searchParams } = new URL(request.url);

    // Filtros
    const userType = searchParams.get('userType') || 'all'; // 'all', 'cliente', 'admin', 'empleado'
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const success = searchParams.get('success');
    const accessType = searchParams.get('accessType');
    const page = parseInt(searchParams.get('page') || '0');
    const limit = parseInt(searchParams.get('limit') || '50');

    console.log('📊 [ACCESS-LOGS API] Fetching logs with filters:', {
      userType, userId, startDate, endDate, success, accessType, page, limit
    });

    // Query base con joins (incluyendo membresías activas y empleados)
    let query = supabase
      .from('access_logs')
      .select(`
        id,
        user_id,
        device_id,
        access_type,
        access_method,
        device_verify_mode,
        success,
        denial_reason,
        membership_status,
        device_timestamp,
        created_at,
        user:Users!access_logs_user_id_fkey (
          id,
          firstName,
          lastName,
          email,
          rol,
          profilePictureUrl
        ),
        device:biometric_devices (
          id,
          name,
          device_type
        )
      `)
      .order('created_at', { ascending: false });

    // Filtro por tipo de usuario
    if (userType !== 'all') {
      query = query.eq('user.rol', userType);
    }

    // Filtro por usuario específico
    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Filtro por rango de fechas
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Filtro por éxito/fallo
    if (success !== null && success !== undefined && success !== '') {
      query = query.eq('success', success === 'true');
    }

    // Filtro por tipo de acceso
    if (accessType) {
      query = query.eq('access_type', accessType);
    }

    // Paginación
    const from = page * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: logs, error, count } = await query;

    if (error) {
      console.error('❌ [ACCESS-LOGS API] Error fetching logs:', error);
      return NextResponse.json(
        { error: 'Error al obtener registros de acceso', details: error.message },
        { status: 500 }
      );
    }

    // Enriquecer logs con información de membresías activas y empleados
    if (logs && logs.length > 0) {
      const userIds = logs.map(log => log.user_id);

      // Obtener membresías para clientes (todas, ordenadas por más reciente)
      const { data: memberships, error: membershipError } = await supabase
        .from('user_memberships')
        .select(`
          userid,
          id,
          status,
          start_date,
          end_date,
          remaining_visits,
          membership_plans!user_memberships_plan_id_fkey (
            id,
            name
          )
        `)
        .in('userid', userIds)
        .order('created_at', { ascending: false });

      console.log('💳 [MEMBERSHIPS] Found:', memberships?.length || 0, 'Error:', membershipError?.message || 'none');

      // Obtener información de empleados
      const { data: employees } = await supabase
        .from('employees')
        .select('user_id, id, position, department')
        .in('user_id', userIds);

      // Agregar información a cada log
      logs.forEach((log: any) => {
        if (log.user) {
          const userMemberships = memberships?.filter((m: any) => m.userid === log.user_id) || [];
          const userEmployees = employees?.filter(e => e.user_id === log.user_id) || [];

          log.user.user_memberships = userMemberships;
          log.user.employees = userEmployees;

          console.log(`👤 [USER ${log.user_id}] ${log.user.firstName} - Rol: ${log.user.rol}, Memberships: ${userMemberships.length}, Employees: ${userEmployees.length}`);
        }
      });
    }

    // Obtener estadísticas
    const statsQuery = supabase
      .from('access_logs')
      .select('success, access_type, created_at', { count: 'exact' });

    if (startDate) statsQuery.gte('created_at', startDate);
    if (endDate) statsQuery.lte('created_at', endDate);
    if (userType !== 'all') statsQuery.eq('user.rol', userType);

    const { data: statsData, count: totalCount } = await statsQuery;

    // Calcular estadísticas
    const stats = {
      total: totalCount || 0,
      successful: statsData?.filter(log => log.success).length || 0,
      failed: statsData?.filter(log => !log.success).length || 0,
      byType: statsData?.reduce((acc: any, log) => {
        acc[log.access_type] = (acc[log.access_type] || 0) + 1;
        return acc;
      }, {}) || {}
    };

    console.log('✅ [ACCESS-LOGS API] Fetched logs:', logs?.length, 'Stats:', stats);

    return NextResponse.json({
      logs: logs || [],
      count: count || 0,
      stats,
      page,
      limit
    });

  } catch (error: any) {
    console.error('❌ [ACCESS-LOGS API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error inesperado', details: error.message },
      { status: 500 }
    );
  }
}
