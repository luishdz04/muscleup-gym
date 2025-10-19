import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  console.log('📊 [ACCESS-LOGS-CLIENTE] API called');
  try {
    const supabase = createServerSupabaseClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ [ACCESS-LOGS-CLIENTE] Auth error:', authError);
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    console.log('✅ [ACCESS-LOGS-CLIENTE] User authenticated:', user.id);

    // Get user's access logs with device info
    const { data: accessLogs, error: logsError } = await supabase
      .from('access_logs')
      .select(`
        id,
        access_type,
        access_method,
        success,
        denial_reason,
        membership_status,
        device_timestamp,
        created_at,
        device:biometric_devices(
          id,
          name,
          location_description
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (logsError) {
      console.error('❌ [ACCESS-LOGS-CLIENTE] Error fetching access logs:', logsError);
      return NextResponse.json(
        { error: 'Error al obtener historial de asistencias', details: logsError.message },
        { status: 500 }
      );
    }

    console.log('✅ [ACCESS-LOGS-CLIENTE] Found', accessLogs?.length || 0, 'access logs');

    // Calculate statistics
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const successfulAccessesThisMonth = accessLogs
      ?.filter(log => {
        const logDate = new Date(log.created_at);
        return log.success &&
               logDate.getFullYear() === currentYear &&
               logDate.getMonth() === currentMonth;
      }).length || 0;

    const successfulAccessesLastMonth = accessLogs
      ?.filter(log => {
        const logDate = new Date(log.created_at);
        return log.success &&
               logDate.getFullYear() === lastMonthYear &&
               logDate.getMonth() === lastMonth;
      }).length || 0;

    const totalAccesses = accessLogs?.length || 0;

    const successfulAccesses = accessLogs?.filter(log => log.success).length || 0;

    const deniedAccesses = accessLogs?.filter(log => !log.success).length || 0;

    // Get last access date
    const lastAccessLog = accessLogs?.find(log => log.success);
    const lastAccessDate = lastAccessLog?.created_at || null;

    return NextResponse.json({
      accessLogs: accessLogs || [],
      stats: {
        successfulAccessesThisMonth,
        successfulAccessesLastMonth,
        totalAccesses,
        successfulAccesses,
        deniedAccesses,
        lastAccessDate
      }
    });

  } catch (error) {
    console.error('❌ Error in GET /api/users/access-logs:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
