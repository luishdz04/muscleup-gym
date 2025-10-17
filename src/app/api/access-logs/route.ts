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
      .select('user_id, success, access_type, created_at', { count: 'exact' });

    if (startDate) statsQuery.gte('created_at', startDate);
    if (endDate) statsQuery.lte('created_at', endDate);
    if (userType !== 'all') statsQuery.eq('user.rol', userType);

    const { data: statsData, count: totalCount } = await statsQuery;

    // Calcular estadísticas básicas (empleados/admins NO cuentan como denegados)
    // Necesitamos obtener los usuarios de los logs para filtrar por rol
    const userIdsForStats = Array.from(new Set(statsData?.map(log => log.user_id) || []));
    let usersForStats: any[] = [];
    if (userIdsForStats.length > 0) {
      const { data: userData } = await supabase
        .from('Users')
        .select('id, rol')
        .in('id', userIdsForStats);
      usersForStats = userData || [];
    }

    const stats = {
      total: totalCount || 0,
      // Exitosos: todos los empleados/admins + clientes con success=true
      successful: statsData?.filter(log => {
        const user = usersForStats.find(u => u.id === log.user_id);
        if (!user) return log.success;
        // Empleados y admins siempre cuentan como exitosos
        if (user.rol === 'empleado' || user.rol === 'admin') return true;
        // Clientes solo si success=true
        return log.success;
      }).length || 0,
      // Denegados: SOLO clientes con success=false
      failed: statsData?.filter(log => {
        const user = usersForStats.find(u => u.id === log.user_id);
        if (!user) return !log.success;
        // Empleados y admins NUNCA cuentan como denegados
        if (user.rol === 'empleado' || user.rol === 'admin') return false;
        // Solo clientes con success=false
        return !log.success;
      }).length || 0,
      byType: statsData?.reduce((acc: any, log) => {
        acc[log.access_type] = (acc[log.access_type] || 0) + 1;
        return acc;
      }, {}) || {}
    };

    // Análisis avanzado: Top usuarios más activos (SOLO CLIENTES, 1 ACCESO POR DÍA)
    const topUsersMap = new Map<string, { userId: string, days: Set<string>, user: any }>();
    logs?.forEach((log: any) => {
      // Solo contar clientes, excluir empleados y admins
      if (log.user && log.user.rol === 'cliente') {
        const userId = log.user_id;
        // Obtener solo la fecha (sin hora) en timezone de México
        const logDate = new Date(log.created_at).toLocaleDateString('en-CA', {
          timeZone: 'America/Mexico_City'
        });

        if (topUsersMap.has(userId)) {
          // Agregar el día al Set (automáticamente evita duplicados)
          topUsersMap.get(userId)!.days.add(logDate);
        } else {
          topUsersMap.set(userId, {
            userId,
            days: new Set([logDate]),
            user: log.user
          });
        }
      }
    });
    // Convertir Set de días a count y ordenar
    const topUsers = Array.from(topUsersMap.values())
      .map(({ userId, days, user }) => ({
        userId,
        count: days.size, // Contar días únicos
        user
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Análisis de horarios pico (usando timezone de México)
    const hourlyStats = new Map<number, number>();
    logs?.forEach((log: any) => {
      // Convertir a hora de México
      const mexicoTime = new Date(log.created_at).toLocaleString('en-US', {
        timeZone: 'America/Mexico_City',
        hour: 'numeric',
        hour12: false
      });
      const hour = parseInt(mexicoTime.split(',')[0]);
      hourlyStats.set(hour, (hourlyStats.get(hour) || 0) + 1);
    });

    const peakHours = Array.from(hourlyStats.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour, count]) => ({ hour, count }));

    const averageAccessesPerHour = logs && logs.length > 0
      ? logs.length / hourlyStats.size
      : 0;

    // Comparación hoy vs ayer (usando timezone de México)
    const nowMexico = new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' });
    const nowDate = new Date(nowMexico);

    // Hoy en México
    const todayYear = nowDate.getFullYear();
    const todayMonth = String(nowDate.getMonth() + 1).padStart(2, '0');
    const todayDay = String(nowDate.getDate()).padStart(2, '0');
    const todayStart = `${todayYear}-${todayMonth}-${todayDay}T00:00:00`;
    const todayEnd = `${todayYear}-${todayMonth}-${todayDay}T23:59:59`;

    // Ayer en México
    const yesterday = new Date(nowDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayYear = yesterday.getFullYear();
    const yesterdayMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
    const yesterdayDay = String(yesterday.getDate()).padStart(2, '0');
    const yesterdayStart = `${yesterdayYear}-${yesterdayMonth}-${yesterdayDay}T00:00:00`;
    const yesterdayEnd = `${yesterdayYear}-${yesterdayMonth}-${yesterdayDay}T23:59:59`;

    console.log('📅 [TODAY VS YESTERDAY] Hoy:', todayStart, 'a', todayEnd);
    console.log('📅 [TODAY VS YESTERDAY] Ayer:', yesterdayStart, 'a', yesterdayEnd);

    const { count: todayCount } = await supabase
      .from('access_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart)
      .lte('created_at', todayEnd);

    const { count: yesterdayCount } = await supabase
      .from('access_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterdayStart)
      .lte('created_at', yesterdayEnd);

    const comparison = {
      today: todayCount || 0,
      yesterday: yesterdayCount || 0,
      difference: (todayCount || 0) - (yesterdayCount || 0),
      percentageChange: yesterdayCount ? (((todayCount || 0) - yesterdayCount) / yesterdayCount * 100) : 0
    };

    // Capacidad actual (últimos 30 minutos en México)
    const thirtyMinutesAgo = new Date(nowDate.getTime() - 30 * 60 * 1000);
    const thirtyMinAgoYear = thirtyMinutesAgo.getFullYear();
    const thirtyMinAgoMonth = String(thirtyMinutesAgo.getMonth() + 1).padStart(2, '0');
    const thirtyMinAgoDay = String(thirtyMinutesAgo.getDate()).padStart(2, '0');
    const thirtyMinAgoHour = String(thirtyMinutesAgo.getHours()).padStart(2, '0');
    const thirtyMinAgoMin = String(thirtyMinutesAgo.getMinutes()).padStart(2, '0');
    const thirtyMinAgoSec = String(thirtyMinutesAgo.getSeconds()).padStart(2, '0');
    const thirtyMinutesAgoISO = `${thirtyMinAgoYear}-${thirtyMinAgoMonth}-${thirtyMinAgoDay}T${thirtyMinAgoHour}:${thirtyMinAgoMin}:${thirtyMinAgoSec}`;

    const { count: currentCapacity } = await supabase
      .from('access_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyMinutesAgoISO)
      .eq('success', true);

    console.log('✅ [ACCESS-LOGS API] Fetched logs:', logs?.length, 'Stats:', stats);

    return NextResponse.json({
      logs: logs || [],
      count: count || 0,
      stats,
      analytics: {
        topUsers,
        peakHours,
        averageAccessesPerHour,
        comparison,
        currentCapacity: currentCapacity || 0
      },
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
