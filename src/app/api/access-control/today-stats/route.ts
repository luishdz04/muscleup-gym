import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getMexicoDateRange } from '@/utils/dateUtils';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient();
    
    // Obtener fecha de hoy en México
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const { startISO, endISO } = getMexicoDateRange(today);
    
    console.log(`🚀 [ACCESS-STATS] Obteniendo estadísticas de acceso para: ${today}`);
    console.log(`🕐 Rango ISO: { startISO: '${startISO}', endISO: '${endISO}' }`);

    // Obtener visitas del día desde access_logs
    const { data: accessLogs, error: accessError } = await supabase
      .from('access_logs')
      .select(`
        id,
        access_type,
        success,
        created_at,
        user_id,
        Users!inner (
          id,
          firstName,
          lastName
        )
      `)
      .eq('success', true) // Solo accesos exitosos
      .gte('created_at', startISO)
      .lte('created_at', endISO);

    if (accessError) {
      throw new Error(`Error consultando access_logs: ${accessError.message}`);
    }

    // Procesar datos
    const todayVisits = accessLogs?.length || 0;
    
    // Agrupar por tipo de acceso
    const accessTypes = accessLogs?.reduce((acc, log) => {
      const type = log.access_type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Obtener usuarios únicos que visitaron hoy
    const uniqueUsers = new Set(accessLogs?.map(log => log.user_id) || []).size;

    const result = {
      success: true,
      date: today,
      todayVisits,
      uniqueUsers,
      accessTypes,
      logs: accessLogs?.map(log => ({
        id: log.id,
        user: `${log.Users?.firstName} ${log.Users?.lastName}`,
        accessType: log.access_type,
        timestamp: log.created_at
      })) || []
    };

    console.log(`✅ [ACCESS-STATS] Estadísticas procesadas: { todayVisits: ${todayVisits}, uniqueUsers: ${uniqueUsers} }`);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[API /access-control/today-stats] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        todayVisits: 0,
        uniqueUsers: 0,
        accessTypes: {},
        logs: []
      },
      { status: 500 }
    );
  }
}
