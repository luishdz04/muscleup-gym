import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  console.log('📊 [GYM-CAPACITY] API called');

  try {
    const supabase = createServerSupabaseClient();

    // 1. Get max capacity from gym_settings
    const { data: settings, error: settingsError } = await supabase
      .from('gym_settings')
      .select('max_capacity')
      .limit(1)
      .single();

    // Si hay error o el campo no existe, usar valor por defecto
    let maxCapacity = 100;

    if (settingsError) {
      console.warn('⚠️ [GYM-CAPACITY] Could not fetch settings, using default:', settingsError.message);
    } else if (settings?.max_capacity) {
      maxCapacity = settings.max_capacity;
    } else {
      console.warn('⚠️ [GYM-CAPACITY] max_capacity field not found in settings, using default');
    }

    console.log(`📏 [GYM-CAPACITY] Max capacity: ${maxCapacity}`);

    // 2. Count current people inside the gym
    // Logic: Count entries without corresponding exits
    // Get all access logs for today, grouped by user
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayLogs, error: logsError } = await supabase
      .from('access_logs')
      .select('id, user_id, access_type, created_at')
      .eq('success', true)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: true });

    if (logsError) {
      console.error('❌ [GYM-CAPACITY] Error fetching access logs:', logsError);
      return NextResponse.json(
        { error: 'Error al obtener registros de acceso' },
        { status: 500 }
      );
    }

    // Calculate current occupancy by tracking entries/exits per user
    const userStatus = new Map<string, 'inside' | 'outside'>();

    todayLogs?.forEach(log => {
      if (log.access_type === 'entry') {
        userStatus.set(log.user_id, 'inside');
      } else if (log.access_type === 'exit') {
        userStatus.set(log.user_id, 'outside');
      }
    });

    // Count users currently inside
    const currentCount = Array.from(userStatus.values()).filter(status => status === 'inside').length;
    console.log(`👥 [GYM-CAPACITY] Current occupancy: ${currentCount}/${maxCapacity}`);

    // 3. Calculate percentage and status
    const percentage = Math.round((currentCount / maxCapacity) * 100);

    let status: 'optimal' | 'moderate' | 'full';
    let statusColor: string;
    let statusMessage: string;

    if (percentage <= 60) {
      status = 'optimal';
      statusColor = '#22C55E'; // green
      statusMessage = 'Capacidad óptima - Ven cuando quieras';
    } else if (percentage <= 85) {
      status = 'moderate';
      statusColor = '#FFCC00'; // yellow
      statusMessage = 'Moderadamente lleno - Buen momento para entrenar';
    } else {
      status = 'full';
      statusColor = '#EF4444'; // red
      statusMessage = 'Capacidad alta - Considera venir más tarde';
    }

    console.log(`✅ [GYM-CAPACITY] Status: ${status} (${percentage}%)`);

    return NextResponse.json({
      currentCount,
      maxCapacity,
      percentage,
      status,
      statusColor,
      statusMessage,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [GYM-CAPACITY] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
